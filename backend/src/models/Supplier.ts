import { pool } from '../config/database';
import { Supplier } from '../types';

export class SupplierModel {
  static async create(supplierData: Omit<Supplier, 'id' | 'createdAt' | 'updatedAt'>): Promise<Supplier> {
    const { name, email, phone, address, contactPerson } = supplierData;

    const query = `
      INSERT INTO suppliers (name, email, phone, address, contact_person)
      VALUES (?, ?, ?, ?, ?)
    `;

    const [result] = await pool.execute(query, [name, email, phone, address, contactPerson]);
    const supplierId = (result as any).insertId;

    return this.findById(supplierId);
  }

  static async findById(id: number): Promise<Supplier | null> {
    const query = `
      SELECT
        id, name, email, phone, address, contact_person as contactPerson,
        created_at as createdAt, updated_at as updatedAt
      FROM suppliers
      WHERE id = ?
    `;

    const [rows] = await pool.execute(query, [id]);
    const supplier = (rows as any[])[0];

    if (supplier) {
      // Add product count
      const productCountQuery = 'SELECT COUNT(*) as productCount FROM products WHERE supplier_id = ?';
      const [productCountResult] = await pool.execute(productCountQuery, [id]);
      supplier.productCount = (productCountResult as any[])[0].productCount;
    }

    return supplier || null;
  }

  static async findByName(name: string): Promise<Supplier | null> {
    const query = `
      SELECT
        id, name, email, phone, address, contact_person as contactPerson,
        created_at as createdAt, updated_at as updatedAt
      FROM suppliers
      WHERE name = ?
    `;

    const [rows] = await pool.execute(query, [name]);
    return (rows as any[])[0] || null;
  }

  static async findAll(
    page = 1,
    limit = 10,
    search?: string
  ): Promise<{ suppliers: Supplier[]; total: number }> {
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE 1=1';
    const params: any[] = [];

    if (search) {
      whereClause += ' AND (name LIKE ? OR email LIKE ? OR contact_person LIKE ?)';
      const searchParam = `%${search}%`;
      params.push(searchParam, searchParam, searchParam);
    }

    // Count query
    const countQuery = `
      SELECT COUNT(*) as total
      FROM suppliers
      ${whereClause}
    `;
    const [countResult] = await pool.execute(countQuery, params);
    const total = (countResult as any[])[0].total;

    // Data query
    const query = `
      SELECT
        s.id, s.name, s.email, s.phone, s.address, s.contact_person as contactPerson,
        s.created_at as createdAt, s.updated_at as updatedAt,
        COUNT(p.id) as productCount
      FROM suppliers s
      LEFT JOIN products p ON s.id = p.supplier_id
      ${whereClause}
      GROUP BY s.id
      ORDER BY s.name ASC
      LIMIT ? OFFSET ?
    `;

    const [rows] = await pool.execute(query, [...params, limit, offset]);
    const suppliers = rows as Supplier[];

    return { suppliers, total };
  }

  static async update(id: number, supplierData: Partial<Supplier>): Promise<Supplier | null> {
    const { name, email, phone, address, contactPerson } = supplierData;

    const updateFields = [];
    const values = [];

    if (name !== undefined) {
      updateFields.push('name = ?');
      values.push(name);
    }
    if (email !== undefined) {
      updateFields.push('email = ?');
      values.push(email);
    }
    if (phone !== undefined) {
      updateFields.push('phone = ?');
      values.push(phone);
    }
    if (address !== undefined) {
      updateFields.push('address = ?');
      values.push(address);
    }
    if (contactPerson !== undefined) {
      updateFields.push('contact_person = ?');
      values.push(contactPerson);
    }

    if (updateFields.length > 0) {
      updateFields.push('updated_at = CURRENT_TIMESTAMP');
      values.push(id);

      const query = `UPDATE suppliers SET ${updateFields.join(', ')} WHERE id = ?`;
      await pool.execute(query, values);
    }

    return this.findById(id);
  }

  static async delete(id: number): Promise<boolean> {
    // Check if supplier has associated products
    const productCheckQuery = 'SELECT COUNT(*) as productCount FROM products WHERE supplier_id = ?';
    const [productCheckResult] = await pool.execute(productCheckQuery, [id]);
    const productCount = (productCheckResult as any[])[0].productCount;

    if (productCount > 0) {
      throw new Error('Cannot delete supplier with associated products');
    }

    const query = 'DELETE FROM suppliers WHERE id = ?';
    const [result] = await pool.execute(query, [id]);
    return (result as any).affectedRows > 0;
  }

  static async getSupplierStats(): Promise<Array<{ supplier: Supplier; totalProducts: number; totalValue: number }>> {
    const query = `
      SELECT
        s.id, s.name, s.email, s.phone, s.address, s.contact_person as contactPerson,
        s.created_at as createdAt, s.updated_at as updatedAt,
        COUNT(p.id) as totalProducts,
        COALESCE(SUM(p.quantity * p.price), 0) as totalValue
      FROM suppliers s
      LEFT JOIN products p ON s.id = p.supplier_id
      GROUP BY s.id
      ORDER BY totalValue DESC
    `;

    const [rows] = await pool.execute(query);
    return rows as any[];
  }
}