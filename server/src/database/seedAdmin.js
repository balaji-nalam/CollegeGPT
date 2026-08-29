const bcrypt = require('bcryptjs');
const { query, initPostgres } = require('../config/db');
const config = require('../config/env');
const logger = require('../utils/logger');

async function seedAdmin() {
  await initPostgres();

  const adminEmail = config.ADMIN_EMAIL;
  const adminPassword = config.ADMIN_PASSWORD;
  const adminName = config.ADMIN_NAME;

  logger.info(`Checking administrative profile for ${adminEmail}...`);

  try {
    const existing = await query('SELECT id, email, role FROM profiles WHERE email = $1', [adminEmail]);

    if (existing.rows.length > 0) {
      logger.info(`Admin account already provisioned: ${adminEmail} (Role: ${existing.rows[0].role})`);
      return existing.rows[0];
    }

    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(adminPassword, salt);

    const result = await query(
      `INSERT INTO profiles (name, email, password_hash, role, department)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, name, email, role`,
      [adminName, adminEmail, passwordHash, 'admin', 'Administration']
    );

    logger.info(`Successfully provisioned initial Administrator: ${adminEmail} (Role: admin)`);
    return result.rows[0];
  } catch (err) {
    logger.error('Failed to provision administrator:', err);
    throw err;
  }
}

if (require.main === module) {
  seedAdmin().then(() => process.exit(0)).catch(() => process.exit(1));
}

module.exports = seedAdmin;
