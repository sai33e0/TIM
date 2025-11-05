import { pool } from '../config/database';
import { User } from '../types';
import bcrypt from 'bcryptjs';

export class UserModel {
  static async create(userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> {
    const { email, password, firstName, lastName, role } = userData;

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const query = `
      INSERT INTO users (email, password, first_name, last_name, role)
      VALUES (?, ?, ?, ?, ?)
    `;

    const [result] = await pool.execute(query, [email, hashedPassword, firstName, lastName, role]);
    const userId = (result as any).insertId;

    return this.findById(userId);
  }

  static async findById(id: number): Promise<User | null> {
    const query = `
      SELECT id, email, first_name as firstName, last_name as lastName, role, created_at as createdAt, updated_at as updatedAt
      FROM users
      WHERE id = ?
    `;

    const [rows] = await pool.execute(query, [id]);
    return (rows as any[])[0] || null;
  }

  static async findByEmail(email: string): Promise<User | null> {
    const query = `
      SELECT id, email, password, first_name as firstName, last_name as lastName, role, created_at as createdAt, updated_at as updatedAt
      FROM users
      WHERE email = ?
    `;

    const [rows] = await pool.execute(query, [email]);
    return (rows as any[])[0] || null;
  }

  static async findAll(page = 1, limit = 10): Promise<{ users: User[]; total: number }> {
    const offset = (page - 1) * limit;

    const countQuery = 'SELECT COUNT(*) as total FROM users';
    const [countResult] = await pool.execute(countQuery);
    const total = (countResult as any[])[0].total;

    const query = `
      SELECT id, email, first_name as firstName, last_name as lastName, role, created_at as createdAt, updated_at as updatedAt
      FROM users
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `;

    const [rows] = await pool.execute(query, [limit, offset]);
    const users = rows as User[];

    return { users, total };
  }

  static async update(id: number, userData: Partial<User>): Promise<User | null> {
    const { firstName, lastName, role, email } = userData;

    const updateFields = [];
    const values = [];

    if (firstName !== undefined) {
      updateFields.push('first_name = ?');
      values.push(firstName);
    }
    if (lastName !== undefined) {
      updateFields.push('last_name = ?');
      values.push(lastName);
    }
    if (role !== undefined) {
      updateFields.push('role = ?');
      values.push(role);
    }
    if (email !== undefined) {
      updateFields.push('email = ?');
      values.push(email);
    }

    if (updateFields.length > 0) {
      updateFields.push('updated_at = CURRENT_TIMESTAMP');
      values.push(id);

      const query = `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`;
      await pool.execute(query, values);
    }

    return this.findById(id);
  }

  static async delete(id: number): Promise<boolean> {
    const query = 'DELETE FROM users WHERE id = ?';
    const [result] = await pool.execute(query, [id]);
    return (result as any).affectedRows > 0;
  }

  static async verifyPassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword);
  }

  static async updatePassword(id: number, newPassword: string): Promise<boolean> {
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    const query = 'UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?';
    const [result] = await pool.execute(query, [hashedPassword, id]);

    return (result as any).affectedRows > 0;
  }
}