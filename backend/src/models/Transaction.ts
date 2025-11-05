import { pool } from '../config/database';
import { Transaction } from '../types';

export class TransactionModel {
  static async create(transactionData: Omit<Transaction, 'id' | 'createdAt'>): Promise<Transaction> {
    const { type, productId, quantity, unitPrice, totalAmount, userId, notes } = transactionData;

    const query = `
      INSERT INTO transactions (type, product_id, quantity, unit_price, total_amount, user_id, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    const [result] = await pool.execute(query, [
      type, productId, quantity, unitPrice, totalAmount, userId, notes
    ]);
    const transactionId = (result as any).insertId;

    // Update product quantity based on transaction type
    const quantityChange = type === 'sale' ? -Math.abs(quantity) : Math.abs(quantity);
    await pool.execute(
      'UPDATE products SET quantity = quantity + ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [quantityChange, productId]
    );

    return this.findById(transactionId);
  }

  static async findById(id: number): Promise<Transaction | null> {
    const query = `
      SELECT
        t.id, t.type, t.product_id as productId, t.quantity, t.unit_price as unitPrice,
        t.total_amount as totalAmount, t.user_id as userId, t.notes, t.created_at as createdAt,
        p.name as productName, p.sku as productSku,
        u.first_name as userFirstName, u.last_name as userLastName
      FROM transactions t
      LEFT JOIN products p ON t.product_id = p.id
      LEFT JOIN users u ON t.user_id = u.id
      WHERE t.id = ?
    `;

    const [rows] = await pool.execute(query, [id]);
    const transaction = (rows as any[])[0];

    if (transaction) {
      transaction.product = {
        id: transaction.productId,
        name: transaction.productName,
        sku: transaction.productSku
      };
      transaction.user = {
        id: transaction.userId,
        name: `${transaction.userFirstName} ${transaction.userLastName}`
      };
      delete transaction.productName;
      delete transaction.productSku;
      delete transaction.userFirstName;
      delete transaction.userLastName;
    }

    return transaction || null;
  }

  static async findAll(
    page = 1,
    limit = 10,
    type?: string,
    productId?: number,
    userId?: number,
    startDate?: Date,
    endDate?: Date
  ): Promise<{ transactions: Transaction[]; total: number }> {
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE 1=1';
    const params: any[] = [];

    if (type) {
      whereClause += ' AND t.type = ?';
      params.push(type);
    }

    if (productId) {
      whereClause += ' AND t.product_id = ?';
      params.push(productId);
    }

    if (userId) {
      whereClause += ' AND t.user_id = ?';
      params.push(userId);
    }

    if (startDate) {
      whereClause += ' AND t.created_at >= ?';
      params.push(startDate);
    }

    if (endDate) {
      whereClause += ' AND t.created_at <= ?';
      params.push(endDate);
    }

    // Count query
    const countQuery = `
      SELECT COUNT(*) as total
      FROM transactions t
      ${whereClause}
    `;
    const [countResult] = await pool.execute(countQuery, params);
    const total = (countResult as any[])[0].total;

    // Data query
    const query = `
      SELECT
        t.id, t.type, t.product_id as productId, t.quantity, t.unit_price as unitPrice,
        t.total_amount as totalAmount, t.user_id as userId, t.notes, t.created_at as createdAt,
        p.name as productName, p.sku as productSku,
        u.first_name as userFirstName, u.last_name as userLastName
      FROM transactions t
      LEFT JOIN products p ON t.product_id = p.id
      LEFT JOIN users u ON t.user_id = u.id
      ${whereClause}
      ORDER BY t.created_at DESC
      LIMIT ? OFFSET ?
    `;

    const [rows] = await pool.execute(query, [...params, limit, offset]);
    const transactions = (rows as any[]).map(transaction => {
      transaction.product = {
        id: transaction.productId,
        name: transaction.productName,
        sku: transaction.productSku
      };
      transaction.user = {
        id: transaction.userId,
        name: `${transaction.userFirstName} ${transaction.userLastName}`
      };
      delete transaction.productName;
      delete transaction.productSku;
      delete transaction.userFirstName;
      delete transaction.userLastName;
      return transaction;
    });

    return { transactions, total };
  }

  static async getTransactionStats(startDate?: Date, endDate?: Date): Promise<{
    totalSales: number;
    totalPurchases: number;
    totalRevenue: number;
    totalCost: number;
    transactionCount: number;
    topProducts: Array<{ productName: string; totalQuantity: number; totalRevenue: number }>;
  }> {
    let whereClause = 'WHERE 1=1';
    const params: any[] = [];

    if (startDate) {
      whereClause += ' AND created_at >= ?';
      params.push(startDate);
    }

    if (endDate) {
      whereClause += ' AND created_at <= ?';
      params.push(endDate);
    }

    // Overall stats
    const statsQuery = `
      SELECT
        SUM(CASE WHEN type = 'sale' THEN total_amount ELSE 0 END) as totalSales,
        SUM(CASE WHEN type = 'purchase' THEN total_amount ELSE 0 END) as totalPurchases,
        SUM(CASE WHEN type = 'sale' THEN total_amount ELSE 0 END) as totalRevenue,
        SUM(CASE WHEN type = 'purchase' THEN total_amount ELSE 0 END) as totalCost,
        COUNT(*) as transactionCount
      FROM transactions
      ${whereClause}
    `;

    // Top products
    const topProductsQuery = `
      SELECT
        p.name as productName,
        SUM(CASE WHEN t.type = 'sale' THEN t.quantity ELSE 0 END) as totalQuantity,
        SUM(CASE WHEN t.type = 'sale' THEN t.total_amount ELSE 0 END) as totalRevenue
      FROM transactions t
      LEFT JOIN products p ON t.product_id = p.id
      ${whereClause} AND t.type = 'sale'
      GROUP BY p.id, p.name
      ORDER BY totalRevenue DESC
      LIMIT 5
    `;

    const [statsResult] = await pool.execute(statsQuery, params);
    const [topProductsResult] = await pool.execute(topProductsQuery, params);

    const stats = statsResult as any[];
    const topProducts = topProductsResult as any[];

    return {
      totalSales: stats[0].totalSales || 0,
      totalPurchases: stats[0].totalPurchases || 0,
      totalRevenue: stats[0].totalRevenue || 0,
      totalCost: stats[0].totalCost || 0,
      transactionCount: stats[0].transactionCount || 0,
      topProducts: topProducts.map(p => ({
        productName: p.productName,
        totalQuantity: p.totalQuantity || 0,
        totalRevenue: p.totalRevenue || 0
      }))
    };
  }

  static async getDailyStats(days = 30): Promise<Array<{
    date: string;
    sales: number;
    purchases: number;
    transactions: number;
  }>> {
    const query = `
      SELECT
        DATE(created_at) as date,
        SUM(CASE WHEN type = 'sale' THEN total_amount ELSE 0 END) as sales,
        SUM(CASE WHEN type = 'purchase' THEN total_amount ELSE 0 END) as purchases,
        COUNT(*) as transactions
      FROM transactions
      WHERE created_at >= DATE_SUB(CURRENT_DATE, INTERVAL ? DAY)
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `;

    const [rows] = await pool.execute(query, [days]);
    return rows as any[];
  }
}