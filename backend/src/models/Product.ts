import { pool } from '../config/database';
import { Product } from '../types';

export class ProductModel {
  static async create(productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<Product> {
    const { name, description, sku, category, price, quantity, minStockLevel, supplierId } = productData;

    const query = `
      INSERT INTO products (name, description, sku, category, price, quantity, min_stock_level, supplier_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const [result] = await pool.execute(query, [
      name, description, sku, category, price, quantity, minStockLevel, supplierId
    ]);
    const productId = (result as any).insertId;

    return this.findById(productId);
  }

  static async findById(id: number): Promise<Product | null> {
    const query = `
      SELECT
        p.id, p.name, p.description, p.sku, p.category, p.price,
        p.quantity, p.min_stock_level as minStockLevel, p.supplier_id as supplierId,
        p.created_at as createdAt, p.updated_at as updatedAt,
        s.name as supplierName
      FROM products p
      LEFT JOIN suppliers s ON p.supplier_id = s.id
      WHERE p.id = ?
    `;

    const [rows] = await pool.execute(query, [id]);
    const product = (rows as any[])[0];

    if (product) {
      product.supplier = {
        id: product.supplierId,
        name: product.supplierName
      };
      delete product.supplierName;
    }

    return product || null;
  }

  static async findBySku(sku: string): Promise<Product | null> {
    const query = 'SELECT * FROM products WHERE sku = ?';
    const [rows] = await pool.execute(query, [sku]);
    return (rows as any[])[0] || null;
  }

  static async findAll(
    page = 1,
    limit = 10,
    category?: string,
    supplierId?: number,
    lowStock?: boolean
  ): Promise<{ products: Product[]; total: number }> {
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE 1=1';
    const params: any[] = [];

    if (category) {
      whereClause += ' AND p.category = ?';
      params.push(category);
    }

    if (supplierId) {
      whereClause += ' AND p.supplier_id = ?';
      params.push(supplierId);
    }

    if (lowStock) {
      whereClause += ' AND p.quantity <= p.min_stock_level';
    }

    // Count query
    const countQuery = `
      SELECT COUNT(*) as total
      FROM products p
      ${whereClause}
    `;
    const [countResult] = await pool.execute(countQuery, params);
    const total = (countResult as any[])[0].total;

    // Data query
    const query = `
      SELECT
        p.id, p.name, p.description, p.sku, p.category, p.price,
        p.quantity, p.min_stock_level as minStockLevel, p.supplier_id as supplierId,
        p.created_at as createdAt, p.updated_at as updatedAt,
        s.name as supplierName
      FROM products p
      LEFT JOIN suppliers s ON p.supplier_id = s.id
      ${whereClause}
      ORDER BY p.created_at DESC
      LIMIT ? OFFSET ?
    `;

    const [rows] = await pool.execute(query, [...params, limit, offset]);
    const products = (rows as any[]).map(product => {
      product.supplier = {
        id: product.supplierId,
        name: product.supplierName
      };
      delete product.supplierName;
      return product;
    });

    return { products, total };
  }

  static async update(id: number, productData: Partial<Product>): Promise<Product | null> {
    const { name, description, sku, category, price, quantity, minStockLevel, supplierId } = productData;

    const updateFields = [];
    const values = [];

    if (name !== undefined) {
      updateFields.push('name = ?');
      values.push(name);
    }
    if (description !== undefined) {
      updateFields.push('description = ?');
      values.push(description);
    }
    if (sku !== undefined) {
      updateFields.push('sku = ?');
      values.push(sku);
    }
    if (category !== undefined) {
      updateFields.push('category = ?');
      values.push(category);
    }
    if (price !== undefined) {
      updateFields.push('price = ?');
      values.push(price);
    }
    if (quantity !== undefined) {
      updateFields.push('quantity = ?');
      values.push(quantity);
    }
    if (minStockLevel !== undefined) {
      updateFields.push('min_stock_level = ?');
      values.push(minStockLevel);
    }
    if (supplierId !== undefined) {
      updateFields.push('supplier_id = ?');
      values.push(supplierId);
    }

    if (updateFields.length > 0) {
      updateFields.push('updated_at = CURRENT_TIMESTAMP');
      values.push(id);

      const query = `UPDATE products SET ${updateFields.join(', ')} WHERE id = ?`;
      await pool.execute(query, values);
    }

    return this.findById(id);
  }

  static async delete(id: number): Promise<boolean> {
    const query = 'DELETE FROM products WHERE id = ?';
    const [result] = await pool.execute(query, [id]);
    return (result as any).affectedRows > 0;
  }

  static async updateQuantity(id: number, quantityChange: number): Promise<Product | null> {
    const query = `
      UPDATE products
      SET quantity = quantity + ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;

    await pool.execute(query, [quantityChange, id]);
    return this.findById(id);
  }

  static async getLowStockProducts(): Promise<Product[]> {
    const query = `
      SELECT
        p.id, p.name, p.description, p.sku, p.category, p.price,
        p.quantity, p.min_stock_level as minStockLevel, p.supplier_id as supplierId,
        p.created_at as createdAt, p.updated_at as updatedAt,
        s.name as supplierName
      FROM products p
      LEFT JOIN suppliers s ON p.supplier_id = s.id
      WHERE p.quantity <= p.min_stock_level
      ORDER BY p.quantity ASC
    `;

    const [rows] = await pool.execute(query);
    return (rows as any[]).map(product => {
      product.supplier = {
        id: product.supplierId,
        name: product.supplierName
      };
      delete product.supplierName;
      return product;
    });
  }

  static async getCategories(): Promise<string[]> {
    const query = 'SELECT DISTINCT category FROM products ORDER BY category';
    const [rows] = await pool.execute(query);
    return (rows as any[]).map(row => row.category);
  }
}