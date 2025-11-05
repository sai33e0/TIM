-- TIMS Database Schema
-- Inventory Management System for Hackathon

-- Create database
CREATE DATABASE IF NOT EXISTS tims_hackathon;
USE tims_hackathon;

-- Users table
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    role ENUM('admin', 'manager', 'user') DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_role (role)
);

-- Suppliers table
CREATE TABLE suppliers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20) NOT NULL,
    address TEXT NOT NULL,
    contact_person VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_name (name),
    INDEX idx_email (email)
);

-- Products table
CREATE TABLE products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    sku VARCHAR(50) UNIQUE NOT NULL,
    category VARCHAR(100) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    quantity INT NOT NULL DEFAULT 0,
    min_stock_level INT NOT NULL DEFAULT 0,
    supplier_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE RESTRICT,
    INDEX idx_sku (sku),
    INDEX idx_category (category),
    INDEX idx_supplier (supplier_id),
    INDEX idx_quantity (quantity)
);

-- Transactions table
CREATE TABLE transactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    type ENUM('sale', 'purchase', 'adjustment') NOT NULL,
    product_id INT NOT NULL,
    quantity INT NOT NULL,
    unit_price DECIMAL(10, 2) NOT NULL,
    total_amount DECIMAL(10, 2) NOT NULL,
    user_id INT NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT,
    INDEX idx_type (type),
    INDEX idx_product (product_id),
    INDEX idx_user (user_id),
    INDEX idx_created_at (created_at)
);

-- Stock alerts view (for low stock notifications)
CREATE VIEW low_stock_products AS
SELECT
    p.id,
    p.name,
    p.sku,
    p.quantity,
    p.min_stock_level,
    s.name as supplier_name,
    p.updated_at
FROM products p
JOIN suppliers s ON p.supplier_id = s.id
WHERE p.quantity <= p.min_stock_level
ORDER BY p.quantity ASC;

-- Dashboard stats view
CREATE VIEW dashboard_stats AS
SELECT
    (SELECT COUNT(*) FROM products) as total_products,
    (SELECT COUNT(*) FROM products WHERE quantity <= min_stock_level) as low_stock_products,
    (SELECT COUNT(*) FROM suppliers) as total_suppliers,
    (SELECT COUNT(*) FROM transactions) as total_transactions,
    (SELECT COALESCE(SUM(total_amount), 0) FROM transactions WHERE type = 'sale') as total_sales,
    (SELECT COALESCE(SUM(total_amount), 0) FROM transactions WHERE type = 'purchase') as total_purchases;

-- Sample data for testing
-- Insert admin user
INSERT INTO users (email, password, first_name, last_name, role) VALUES
('admin@tims.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6ukx.LFvO.', 'Admin', 'User', 'admin');

-- Insert sample suppliers
INSERT INTO suppliers (name, email, phone, address, contact_person) VALUES
('TechSupply Inc', 'contact@techsupply.com', '+1-555-0101', '123 Tech Street, Silicon Valley, CA 94000', 'John Smith'),
('OfficeMart', 'orders@officemart.com', '+1-555-0102', '456 Business Ave, New York, NY 10001', 'Sarah Johnson'),
('GadgetWorld', 'sales@gadgetworld.com', '+1-555-0103', '789 Electronics Blvd, Austin, TX 73301', 'Mike Davis');

-- Insert sample products
INSERT INTO products (name, description, sku, category, price, quantity, min_stock_level, supplier_id) VALUES
('Laptop Pro 15"', 'High-performance laptop for professionals', 'LP15-001', 'Electronics', 1299.99, 25, 10, 1),
('Wireless Mouse', 'Ergonomic wireless mouse', 'WM-002', 'Electronics', 29.99, 150, 50, 2),
('Office Chair', 'Comfortable ergonomic office chair', 'OC-003', 'Furniture', 199.99, 12, 5, 2),
('Monitor 27"', '4K Ultra HD monitor', 'M27-004', 'Electronics', 399.99, 8, 5, 1),
('Desk Lamp', 'LED desk lamp with adjustable brightness', 'DL-005', 'Furniture', 39.99, 75, 20, 3),
('Keyboard Mechanical', 'RGB mechanical keyboard', 'KM-006', 'Electronics', 89.99, 45, 15, 3),
('Notebook Set', 'Premium notebook set with pens', 'NS-007', 'Stationery', 19.99, 200, 100, 2),
('USB-C Hub', '7-in-1 USB-C hub', 'UH-008', 'Electronics', 49.99, 3, 10, 1);

-- Insert sample transactions
INSERT INTO transactions (type, product_id, quantity, unit_price, total_amount, user_id, notes) VALUES
('purchase', 1, 30, 1200.00, 36000.00, 1, 'Initial stock purchase'),
('purchase', 2, 200, 25.00, 5000.00, 1, 'Initial stock purchase'),
('sale', 1, 5, 1299.99, 6499.95, 1, 'Online order #1001'),
('sale', 2, 25, 29.99, 749.75, 1, 'Retail store sale'),
('sale', 3, 3, 199.99, 599.97, 1, 'Office furniture order'),
('adjustment', 2, -5, 29.99, 149.95, 1, 'Damaged items written off'),
('sale', 4, 2, 399.99, 799.98, 1, 'Bulk order discount'),
('sale', 5, 15, 39.99, 599.85, 1, 'School supply order'),
('purchase', 6, 50, 75.00, 3750.00, 1, 'New supplier'),
('sale', 6, 8, 89.99, 719.92, 1, 'Gaming setup bundle');

-- Update product quantities based on transactions
UPDATE products SET quantity = quantity - 5 WHERE id = 1;  -- 5 laptops sold
UPDATE products SET quantity = quantity - 25 WHERE id = 2; -- 25 mice sold
UPDATE products SET quantity = quantity - 3 WHERE id = 3;  -- 3 chairs sold
UPDATE products SET quantity = quantity - 2 WHERE id = 4;  -- 2 monitors sold
UPDATE products SET quantity = quantity - 15 WHERE id = 5; -- 15 lamps sold
UPDATE products SET quantity = quantity - 8 WHERE id = 6;  -- 8 keyboards sold

-- Create indexes for better performance
CREATE INDEX idx_products_supplier_category ON products(supplier_id, category);
CREATE INDEX idx_transactions_date_type ON transactions(created_at, type);
CREATE INDEX idx_users_role_created ON users(role, created_at);

-- Add some useful stored procedures
DELIMITER //

-- Procedure to get product stock status
CREATE PROCEDURE GetProductStockStatus(IN productId INT)
BEGIN
    SELECT
        p.name,
        p.sku,
        p.quantity,
        p.min_stock_level,
        CASE
            WHEN p.quantity = 0 THEN 'Out of Stock'
            WHEN p.quantity <= p.min_stock_level THEN 'Low Stock'
            ELSE 'In Stock'
        END as stock_status,
        s.name as supplier_name
    FROM products p
    JOIN suppliers s ON p.supplier_id = s.id
    WHERE p.id = productId;
END //

-- Procedure to get monthly sales summary
CREATE PROCEDURE GetMonthlySalesSummary(IN yearMonth VARCHAR(7))
BEGIN
    SELECT
        DATE(created_at) as date,
        COUNT(*) as transaction_count,
        SUM(CASE WHEN type = 'sale' THEN total_amount ELSE 0 END) as daily_sales,
        SUM(CASE WHEN type = 'purchase' THEN total_amount ELSE 0 END) as daily_purchases
    FROM transactions
    WHERE DATE_FORMAT(created_at, '%Y-%m') = yearMonth
    GROUP BY DATE(created_at)
    ORDER BY date;
END //

DELIMITER ;

-- Create triggers for automatic stock updates
DELIMITER //

-- Trigger to prevent negative stock
CREATE TRIGGER before_transaction_insert
BEFORE INSERT ON transactions
FOR EACH ROW
BEGIN
    DECLARE current_quantity INT;

    IF NEW.type = 'sale' THEN
        SELECT quantity INTO current_quantity FROM products WHERE id = NEW.product_id;
        IF current_quantity < ABS(NEW.quantity) THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Insufficient stock for sale';
        END IF;
    END IF;
END //

DELIMITER ;

-- Grant permissions (adjust based on your setup)
-- GRANT ALL PRIVILEGES ON tims_hackathon.* TO 'tims_user'@'localhost' IDENTIFIED BY 'secure_password';
-- FLUSH PRIVILEGES;