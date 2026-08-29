const bcrypt = require('bcryptjs');
const { query } = require('../config/db');

class Profile {
  static async findByEmail(email) {
    const res = await query('SELECT * FROM profiles WHERE email = $1', [email.toLowerCase().trim()]);
    return res.rows[0] || null;
  }

  static async findById(id) {
    const res = await query('SELECT id, name, email, role, department, created_at, last_login FROM profiles WHERE id = $1', [id]);
    return res.rows[0] || null;
  }

  static async createStudent({ name, email, password, department = 'General' }) {
    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(password, salt);

    // Public registration strictly forces role = 'student'
    const res = await query(
      `INSERT INTO profiles (name, email, password_hash, role, department)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, name, email, role, department, created_at`,
      [name.trim(), email.toLowerCase().trim(), passwordHash, 'student', department]
    );

    return res.rows[0];
  }

  static async updateLastLogin(id) {
    await query('UPDATE profiles SET last_login = NOW() WHERE id = $1', [id]);
  }

  static async comparePassword(candidatePassword, passwordHash) {
    return bcrypt.compare(candidatePassword, passwordHash);
  }
}

module.exports = Profile;
