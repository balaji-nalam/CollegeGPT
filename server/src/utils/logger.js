const logger = {
  info: (msg, meta = {}) => {
    console.log(`[INFO] [${new Date().toISOString()}] ${msg}`, Object.keys(meta).length ? JSON.stringify(meta) : '');
  },
  warn: (msg, meta = {}) => {
    console.warn(`[WARN] [${new Date().toISOString()}] ${msg}`, Object.keys(meta).length ? JSON.stringify(meta) : '');
  },
  error: (msg, err = {}) => {
    console.error(`[ERROR] [${new Date().toISOString()}] ${msg}`, err.stack || err.message || err);
  },
  agent: (agentName, executionId, msg) => {
    console.log(`[AGENT:${agentName.toUpperCase()}] [Exec:${executionId || 'N/A'}] ${msg}`);
  }
};

module.exports = logger;
