import { io } from 'socket.io-client';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000';

let socket = null;

export const getSocket = () => {
  if (!socket && typeof window !== 'undefined') {
    socket = io(SOCKET_URL, {
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      transports: ['websocket', 'polling'],
    });

    socket.on('connect', () => {
      console.log('Connected to Agentflow Socket.IO server:', socket.id);
    });

    socket.on('disconnect', (reason) => {
      console.log('Disconnected from Socket.IO server:', reason);
    });
  }
  return socket;
};

export const subscribeToExecution = (executionId, callbacks = {}) => {
  const s = getSocket();
  if (!s || !executionId) return () => {};

  s.emit('join:execution', executionId);

  if (callbacks.onAgentEvent) {
    s.on('agent:event', callbacks.onAgentEvent);
  }
  if (callbacks.onPlannerStep) {
    s.on('planner:step', callbacks.onPlannerStep);
  }
  if (callbacks.onExecutionStep) {
    s.on('execution:step', callbacks.onExecutionStep);
  }
  if (callbacks.onValidationStep) {
    s.on('validation:step', callbacks.onValidationStep);
  }
  if (callbacks.onRecoveryStep) {
    s.on('recovery:step', callbacks.onRecoveryStep);
  }
  if (callbacks.onMonitoringStep) {
    s.on('monitoring:step', callbacks.onMonitoringStep);
  }
  if (callbacks.onExecutionCompleted) {
    s.on('execution:completed', callbacks.onExecutionCompleted);
  }
  if (callbacks.onExecutionFailed) {
    s.on('execution:failed', callbacks.onExecutionFailed);
  }

  return () => {
    s.emit('leave:execution', executionId);
    if (callbacks.onAgentEvent) s.off('agent:event', callbacks.onAgentEvent);
    if (callbacks.onPlannerStep) s.off('planner:step', callbacks.onPlannerStep);
    if (callbacks.onExecutionStep) s.off('execution:step', callbacks.onExecutionStep);
    if (callbacks.onValidationStep) s.off('validation:step', callbacks.onValidationStep);
    if (callbacks.onRecoveryStep) s.off('recovery:step', callbacks.onRecoveryStep);
    if (callbacks.onMonitoringStep) s.off('monitoring:step', callbacks.onMonitoringStep);
    if (callbacks.onExecutionCompleted) s.off('execution:completed', callbacks.onExecutionCompleted);
    if (callbacks.onExecutionFailed) s.off('execution:failed', callbacks.onExecutionFailed);
  };
};

export const subscribeToUserNotifications = (userId, onNotification) => {
  const s = getSocket();
  if (!s || !userId) return () => {};

  s.emit('join:user', userId);
  s.on('notification:new', onNotification);

  return () => {
    s.off('notification:new', onNotification);
  };
};
