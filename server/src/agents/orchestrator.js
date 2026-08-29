const Execution = require('../models/Execution');
const AgentMemory = require('../models/AgentMemory');
const plannerAgent = require('./plannerAgent');
const executionAgent = require('./executionAgent');
const validationAgent = require('./validationAgent');
const recoveryAgent = require('./recoveryAgent');
const monitoringAgent = require('./monitoringAgent');
const { emitExecutionEvent } = require('../config/socket');
const logger = require('../utils/logger');

// Check LangGraph availability
let langGraphStatus = 'not-installed';
try {
  require('@langchain/langgraph');
  langGraphStatus = 'available';
} catch (e) {
  langGraphStatus = 'not-installed';
}

class MultiAgentOrchestrator {
  constructor() {
    this.activeExecutions = new Map(); // executionId -> { status, isPaused, isCancelled }
  }

  getLangGraphStatus() {
    return langGraphStatus;
  }

  async runWorkflow(executionId, userId) {
    const execution = await Execution.findById(executionId);
    if (!execution) {
      throw new Error(`Execution record ${executionId} not found.`);
    }

    const workflowSnapshot = execution.workflowSnapshot;
    const workflowId = execution.workflowId;

    // Track active state in memory for live pause/cancel signals
    const controlState = { isPaused: false, isCancelled: false, currentStepIndex: 0 };
    this.activeExecutions.set(executionId.toString(), controlState);

    execution.status = 'RUNNING';
    execution.startTime = new Date();
    await execution.save();

    await monitoringAgent.logEvent({
      executionId,
      workflowId,
      agent: 'monitoring',
      level: 'info',
      message: `Multi-agent orchestration initiated. LangGraph substrate: ${langGraphStatus}`,
      metadata: { langGraph: langGraphStatus, version: workflowSnapshot.version },
    });

    // 1. Planner Agent: Compute DAG plan
    const planResult = plannerAgent.plan(workflowSnapshot);
    if (!planResult.success) {
      execution.status = 'FAILED';
      execution.endTime = new Date();
      execution.duration = Date.now() - execution.startTime.getTime();
      execution.error = { message: planResult.error };
      await execution.save();

      await monitoringAgent.logEvent({
        executionId,
        workflowId,
        agent: 'planner',
        level: 'error',
        message: `Planning failed: ${planResult.error}`,
        metadata: { confidenceScore: planResult.confidenceScore },
      });

      await monitoringAgent.createAlertNotification({
        ownerId: userId,
        workflowId,
        executionId,
        type: 'failure',
        title: 'Workflow Execution Failed',
        message: `Plan generation failed: ${planResult.error}`,
      });

      emitExecutionEvent(executionId, 'execution:failed', { executionId, error: planResult.error });
      this.activeExecutions.delete(executionId.toString());
      return execution;
    }

    await monitoringAgent.logEvent({
      executionId,
      workflowId,
      agent: 'planner',
      level: 'success',
      message: `Graph resolved into ${planResult.stepsCount} execution steps. Confidence: ${(planResult.confidenceScore * 100).toFixed(0)}%`,
      metadata: { plan: planResult.plan, confidenceScore: planResult.confidenceScore },
    });

    const executionMemory = {}; // stores nodeId -> { output }
    const steps = planResult.plan;
    let hasFailed = false;

    // 2. Loop through planned steps
    for (let i = 0; i < steps.length; i++) {
      // Check cancellation signal
      if (controlState.isCancelled) {
        execution.status = 'CANCELLED';
        execution.endTime = new Date();
        execution.duration = Date.now() - execution.startTime.getTime();
        await execution.save();

        await monitoringAgent.logEvent({
          executionId,
          workflowId,
          agent: 'monitoring',
          level: 'warning',
          message: 'Execution was cancelled by operator.',
        });

        emitExecutionEvent(executionId, 'execution:cancelled', { executionId });
        this.activeExecutions.delete(executionId.toString());
        return execution;
      }

      // Check pause signal
      if (controlState.isPaused) {
        execution.status = 'PAUSED';
        execution.currentNode = steps[i].nodeId;
        await execution.save();

        await monitoringAgent.logEvent({
          executionId,
          workflowId,
          agent: 'monitoring',
          level: 'warning',
          message: `Execution paused by operator at node ${steps[i].nodeId}.`,
        });

        emitExecutionEvent(executionId, 'execution:paused', { executionId, step: steps[i] });
        return execution;
      }

      const step = steps[i];
      controlState.currentStepIndex = i;
      execution.currentNode = step.nodeId;
      await execution.save();

      let stepSuccess = false;
      let retryCount = 0;

      while (!stepSuccess && retryCount <= 3) {
        // Execute Node via ExecutionAgent
        const execResult = await executionAgent.executeStep(
          step,
          { executionId, memory: executionMemory },
          userId
        );

        if (execResult.success) {
          // Validation Agent: Validate output
          const valResult = validationAgent.validate(execResult, step);

          if (valResult.isValid) {
            stepSuccess = true;
            executionMemory[step.nodeId] = { output: execResult.output };

            // Persist Agent Memory document
            await AgentMemory.create({
              workflowId,
              executionId,
              agentId: step.nodeId,
              key: 'output',
              value: execResult.output,
              confidenceScore: planResult.confidenceScore,
            });

            await monitoringAgent.logEvent({
              executionId,
              workflowId,
              nodeId: step.nodeId,
              agent: 'execution',
              level: 'success',
              message: `Node '${step.label}' executed successfully in ${execResult.durationMs}ms`,
              metadata: { output: execResult.output, durationMs: execResult.durationMs },
            });

            await monitoringAgent.logEvent({
              executionId,
              workflowId,
              nodeId: step.nodeId,
              agent: 'validation',
              level: 'success',
              message: `Output schema validation passed for node '${step.label}'`,
              metadata: { fields: Object.keys(execResult.output || {}) },
            });
          } else {
            // Validation failed -> invoke RecoveryAgent
            const recoveryDecision = recoveryAgent.evaluate({
              error: null,
              validationResult: valResult,
              currentRetryCount: retryCount,
              nodeId: step.nodeId,
            });

            await monitoringAgent.logEvent({
              executionId,
              workflowId,
              nodeId: step.nodeId,
              agent: 'validation',
              level: 'error',
              message: `Validation failed: ${valResult.reason}`,
              metadata: { missingFields: valResult.missingFields },
            });

            if (recoveryDecision.action === 'retry_with_backoff') {
              retryCount = recoveryDecision.retryCount;
              execution.status = 'RETRYING';
              execution.retryCount += 1;
              await execution.save();

              await monitoringAgent.logEvent({
                executionId,
                workflowId,
                nodeId: step.nodeId,
                agent: 'recovery',
                level: 'warning',
                message: recoveryDecision.reason,
                metadata: { backoffMs: recoveryDecision.backoffMs },
              });

              await new Promise((resolve) => setTimeout(resolve, recoveryDecision.backoffMs));
            } else {
              // Escalate
              hasFailed = true;
              execution.error = { message: recoveryDecision.reason, classification: recoveryDecision.classification };
              
              await monitoringAgent.logEvent({
                executionId,
                workflowId,
                nodeId: step.nodeId,
                agent: 'recovery',
                level: 'error',
                message: `Escalated failure: ${recoveryDecision.reason}`,
                metadata: { classification: recoveryDecision.classification },
              });

              await monitoringAgent.createAlertNotification({
                ownerId: userId,
                workflowId,
                executionId,
                type: 'escalation',
                title: 'Agent Recovery Escalation',
                message: `Node '${step.label}' halted: ${recoveryDecision.reason}`,
              });

              break;
            }
          }
        } else {
          // Execution threw error -> invoke RecoveryAgent
          const recoveryDecision = recoveryAgent.evaluate({
            error: execResult.error,
            validationResult: null,
            currentRetryCount: retryCount,
            nodeId: step.nodeId,
          });

          await monitoringAgent.logEvent({
            executionId,
            workflowId,
            nodeId: step.nodeId,
            agent: 'execution',
            level: 'error',
            message: `Execution failed for node '${step.label}': ${execResult.error?.message}`,
            metadata: { error: execResult.error },
          });

          if (recoveryDecision.action === 'retry_with_backoff') {
            retryCount = recoveryDecision.retryCount;
            execution.status = 'RETRYING';
            execution.retryCount += 1;
            await execution.save();

            await monitoringAgent.logEvent({
              executionId,
              workflowId,
              nodeId: step.nodeId,
              agent: 'recovery',
              level: 'warning',
              message: recoveryDecision.reason,
              metadata: { backoffMs: recoveryDecision.backoffMs },
            });

            await new Promise((resolve) => setTimeout(resolve, recoveryDecision.backoffMs));
          } else {
            hasFailed = true;
            execution.error = { message: recoveryDecision.reason, classification: recoveryDecision.classification };

            await monitoringAgent.logEvent({
              executionId,
              workflowId,
              nodeId: step.nodeId,
              agent: 'recovery',
              level: 'error',
              message: `Escalated failure: ${recoveryDecision.reason}`,
              metadata: { classification: recoveryDecision.classification },
            });

            await monitoringAgent.createAlertNotification({
              ownerId: userId,
              workflowId,
              executionId,
              type: 'failure',
              title: 'Workflow Execution Failed',
              message: `Step '${step.label}' escalated: ${recoveryDecision.reason}`,
            });

            break;
          }
        }
      }

      if (hasFailed) break;
    }

    // 3. Complete or Fail
    execution.endTime = new Date();
    execution.duration = Date.now() - execution.startTime.getTime();
    execution.outputs = executionMemory;

    if (hasFailed) {
      execution.status = 'FAILED';
      await execution.save();

      await monitoringAgent.logEvent({
        executionId,
        workflowId,
        agent: 'monitoring',
        level: 'error',
        message: `Execution failed after ${(execution.duration / 1000).toFixed(2)}s duration.`,
      });

      emitExecutionEvent(executionId, 'execution:failed', { executionId, error: execution.error });
    } else {
      execution.status = 'COMPLETED';
      await execution.save();

      await monitoringAgent.logEvent({
        executionId,
        workflowId,
        agent: 'monitoring',
        level: 'success',
        message: `All ${steps.length} nodes completed successfully in ${(execution.duration / 1000).toFixed(2)}s duration.`,
        metadata: { outputs: executionMemory },
      });

      await monitoringAgent.createAlertNotification({
        ownerId: userId,
        workflowId,
        executionId,
        type: 'success',
        title: 'Execution Completed Successfully',
        message: `Workflow completed all ${steps.length} steps in ${(execution.duration / 1000).toFixed(2)}s.`,
      });

      emitExecutionEvent(executionId, 'execution:completed', {
        executionId,
        duration: execution.duration,
        outputs: executionMemory,
      });
    }

    this.activeExecutions.delete(executionId.toString());
    return execution;
  }

  pauseExecution(executionId) {
    const active = this.activeExecutions.get(executionId.toString());
    if (active) {
      active.isPaused = true;
      return true;
    }
    return false;
  }

  resumeExecution(executionId, userId) {
    const active = this.activeExecutions.get(executionId.toString());
    if (active) {
      active.isPaused = false;
      return true;
    }
    // If not in memory, re-invoke runner
    this.runWorkflow(executionId, userId);
    return true;
  }

  cancelExecution(executionId) {
    const active = this.activeExecutions.get(executionId.toString());
    if (active) {
      active.isCancelled = true;
      return true;
    }
    return false;
  }
}

module.exports = new MultiAgentOrchestrator();
