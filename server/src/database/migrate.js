const { initPostgres, runMigrations } = require('../config/db');
const logger = require('../utils/logger');

async function migrate() {
  logger.info('Starting CollegeGPT Database Migration...');
  const connected = await initPostgres();
  if (connected) {
    await runMigrations();
    logger.info('Migration complete!');
  } else {
    logger.info('No external PostgreSQL instance connected; in-memory schema active.');
  }
  process.exit(0);
}

if (require.main === module) {
  migrate();
}

module.exports = migrate;
