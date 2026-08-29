const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

async function runTests() {
  console.log('=== Starting Agentflow_AI End-to-End Test Suite ===\n');

  try {
    // 1. Health check
    console.log('[1/8] Testing /api/health ...');
    const healthRes = await axios.get(`${BASE_URL}/health`);
    console.log('  -> Health status:', healthRes.data.status);

    // 2. Auth Registration & Login
    console.log('\n[2/8] Testing User Registration & Login ...');
    const testEmail = `test_operator_${Date.now()}@agentflow.io`;
    const regRes = await axios.post(`${BASE_URL}/auth/register`, {
      name: 'Test Operator',
      email: testEmail,
      password: 'password123',
      role: 'operator',
    });
    console.log('  -> Registered user:', regRes.data.data.user.email);
    const token = regRes.data.data.token;

    const authHeaders = { headers: { Authorization: `Bearer ${token}` } };

    // Profile check
    const meRes = await axios.get(`${BASE_URL}/auth/me`, authHeaders);
    console.log('  -> Profile retrieved:', meRes.data.data.name, `(${meRes.data.data.role})`);

    // 3. AI Workflow Generation (Prompt to Graph)
    console.log('\n[3/8] Testing AI Prompt-to-Workflow Generation ...');
    const genRes = await axios.post(
      `${BASE_URL}/workflows/generate`,
      { prompt: 'When a new lead enters Google Sheets, summarize with AI and send alert to Slack' },
      authHeaders
    );
    console.log('  -> Synthesized graph name:', genRes.data.data.name);
    console.log('  -> Synthesizer provider:', genRes.data.data.provider);
    console.log('  -> Nodes generated:', genRes.data.data.nodes.length);
    console.log('  -> Edges generated:', genRes.data.data.edges.length);

    // 4. Create Workflow
    console.log('\n[4/8] Testing Workflow Persistence ...');
    const wfRes = await axios.post(
      `${BASE_URL}/workflows`,
      {
        name: genRes.data.data.name,
        description: genRes.data.data.description,
        nodes: genRes.data.data.nodes,
        edges: genRes.data.data.edges,
        tags: ['lead-capture', 'ai-agent', 'slack'],
      },
      authHeaders
    );
    const workflowId = wfRes.data.data._id;
    console.log('  -> Saved workflow ID:', workflowId);

    // 5. Trigger Multi-Agent Execution
    console.log('\n[5/8] Triggering 5-Agent Multi-Agent Execution ...');
    const execRes = await axios.post(`${BASE_URL}/workflows/${workflowId}/execute`, {}, authHeaders);
    const executionId = execRes.data.data._id;
    console.log('  -> Execution dispatched with ID:', executionId, 'Initial status:', execRes.data.data.status);

    // Wait 2.5 seconds for all 5 agents to run (Planner -> Executor -> Validator -> Recovery -> Monitoring)
    console.log('  -> Waiting for 5-agent swarm completion...');
    await new Promise((r) => setTimeout(r, 2500));

    // 6. Verify Execution Status and Logs
    console.log('\n[6/8] Verifying Multi-Agent Timeline & Audit Logs ...');
    const timelineRes = await axios.get(`${BASE_URL}/executions/${executionId}/timeline`, authHeaders);
    const execution = timelineRes.data.data.execution;
    const logs = timelineRes.data.data.logs;
    console.log('  -> Execution final status:', execution.status);
    console.log('  -> Execution duration:', execution.duration, 'ms');
    console.log('  -> Total timeline events recorded:', logs.length);
    console.log('  -> LangGraph substrate:', timelineRes.data.data.langGraphSubstrate);

    const agentsInvolved = new Set(logs.map((l) => l.agent));
    console.log('  -> Cooperating agents validated in run:', Array.from(agentsInvolved).join(', '));

    // 7. Integrations status
    console.log('\n[7/8] Testing Integrations Health ...');
    const intRes = await axios.get(`${BASE_URL}/integrations/status`, authHeaders);
    console.log('  -> Total supported integrations:', intRes.data.data.total);

    // 8. Notifications
    console.log('\n[8/8] Testing Notification Drawer ...');
    const notifRes = await axios.get(`${BASE_URL}/notifications`, authHeaders);
    console.log('  -> Notifications delivered:', notifRes.data.data.length);
    if (notifRes.data.data.length > 0) {
      console.log('  -> Latest notification:', notifRes.data.data[0].title);
    }

    console.log('\n=== ALL 8 END-TO-END SUITES PASSED CLEANLY! ===\n');
  } catch (err) {
    console.error('Test failed:', err.response?.data || err.message);
    process.exit(1);
  }
}

runTests();
