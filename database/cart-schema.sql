-- Cart Products Database Schema
-- Independent storage for cart items and product categories

-- Users table (if not exists)
CREATE TABLE IF NOT EXISTS users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  role ENUM('user', 'admin') DEFAULT 'user',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Cart table for storing user carts
CREATE TABLE IF NOT EXISTS carts (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  is_locked BOOLEAN DEFAULT FALSE,
  locked_at TIMESTAMP NULL,
  unlocked_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_locked (is_locked)
);

-- Cart items table for storing individual cart products
CREATE TABLE IF NOT EXISTS cart_items (
  id INT PRIMARY KEY AUTO_INCREMENT,
  cart_id INT NOT NULL,
  product_id VARCHAR(255) NOT NULL,
  product_name VARCHAR(255) NOT NULL,
  product_price DECIMAL(10, 2) NOT NULL,
  product_image VARCHAR(500),
  product_condition VARCHAR(50) DEFAULT 'good',
  quantity INT NOT NULL DEFAULT 1,
  product_category VARCHAR(100) NOT NULL,
  added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (cart_id) REFERENCES carts(id) ON DELETE CASCADE,
  INDEX idx_cart_id (cart_id),
  INDEX idx_product_id (product_id),
  INDEX idx_category (product_category),
  UNIQUE KEY unique_cart_product (cart_id, product_id)
);

-- Collection products table
CREATE TABLE IF NOT EXISTS collection_products (
  id INT PRIMARY KEY AUTO_INCREMENT,
  product_id VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  image VARCHAR(500),
  condition VARCHAR(50) DEFAULT 'good',
  description TEXT,
  status ENUM('available', 'sold', 'reserved') DEFAULT 'available',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_product_id (product_id),
  INDEX idx_status (status)
);

-- Outfits products table
CREATE TABLE IF NOT EXISTS outfits_products (
  id INT PRIMARY KEY AUTO_INCREMENT,
  product_id VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  image VARCHAR(500),
  condition VARCHAR(50) DEFAULT 'good',
  description TEXT,
  status ENUM('available', 'sold', 'reserved') DEFAULT 'available',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_product_id (product_id),
  INDEX idx_status (status)
);

-- Fashion & Sneakers products table
CREATE TABLE IF NOT EXISTS fashion_sneakers_products (
  id INT PRIMARY KEY AUTO_INCREMENT,
  product_id VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  image VARCHAR(500),
  condition VARCHAR(50) DEFAULT 'good',
  description TEXT,
  status ENUM('available', 'sold', 'reserved') DEFAULT 'available',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_product_id (product_id),
  INDEX idx_status (status)
);

-- Pre-owned products table
CREATE TABLE IF NOT EXISTS preowned_products (
  id INT PRIMARY KEY AUTO_INCREMENT,
  product_id VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  image VARCHAR(500),
  condition VARCHAR(50) DEFAULT 'good',
  description TEXT,
  status ENUM('available', 'sold', 'reserved') DEFAULT 'available',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_product_id (product_id),
  INDEX idx_status (status)
);

-- Community Marketplace products table
CREATE TABLE IF NOT EXISTS marketplace_products (
  id INT PRIMARY KEY AUTO_INCREMENT,
  product_id VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  image VARCHAR(500),
  condition VARCHAR(50) DEFAULT 'good',
  description TEXT,
  status ENUM('available', 'sold', 'reserved') DEFAULT 'available',
  seller_id INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_product_id (product_id),
  INDEX idx_status (status),
  INDEX idx_seller_id (seller_id),
  FOREIGN KEY (seller_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Enhanced deposit tracking section
CREATE TABLE IF NOT EXISTS deposits (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  order_id VARCHAR(50) UNIQUE NOT NULL,
  deposit_amount DECIMAL(10, 2) NOT NULL,
  total_amount DECIMAL(10, 2) NOT NULL,
  balance_amount DECIMAL(10, 2) NOT NULL,
  payment_method VARCHAR(50) NOT NULL,
  payment_reference VARCHAR(100),
  payment_status ENUM('pending', 'completed', 'failed', 'refunded') DEFAULT 'pending',
  deposit_status ENUM('pending', 'paid', 'completed', 'refunded') DEFAULT 'pending',
  cart_items JSON, -- Store cart items at time of deposit
  customer_details JSON, -- Store customer details at time of deposit
  payment_data JSON, -- Store full payment response data
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  completed_at TIMESTAMP NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_order_id (order_id),
  INDEX idx_payment_status (payment_status),
  INDEX idx_deposit_status (deposit_status),
  INDEX idx_created_at (created_at)
);

-- Deposit status history for tracking changes
CREATE TABLE IF NOT EXISTS deposit_status_history (
  id INT PRIMARY KEY AUTO_INCREMENT,
  deposit_id INT NOT NULL,
  old_status VARCHAR(50),
  new_status VARCHAR(50) NOT NULL,
  changed_by VARCHAR(100), -- User or system that changed status
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (deposit_id) REFERENCES deposits(id) ON DELETE CASCADE,
  INDEX idx_deposit_id (deposit_id),
  INDEX idx_created_at (created_at)
);

-- Updated orders table to link with deposits
CREATE TABLE IF NOT EXISTS orders (
  id INT PRIMARY KEY AUTO_INCREMENT,
  order_id VARCHAR(50) UNIQUE NOT NULL,
  user_id INT NOT NULL,
  deposit_id INT UNIQUE, -- Link to deposit record
  total_amount DECIMAL(10, 2) NOT NULL,
  deposit_amount DECIMAL(10, 2) NOT NULL,
  balance_amount DECIMAL(10, 2) NOT NULL,
  status ENUM('pending', 'deposit_paid', 'completed', 'cancelled', 'refunded') DEFAULT 'pending',
  payment_method VARCHAR(50),
  payment_reference VARCHAR(100),
  delivery_details JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (deposit_id) REFERENCES deposits(id) ON DELETE SET NULL,
  INDEX idx_order_id (order_id),
  INDEX idx_user_id (user_id),
  INDEX idx_deposit_id (deposit_id),
  INDEX idx_status (status)
);

-- Order items table for products in completed orders
CREATE TABLE IF NOT EXISTS order_items (
  id INT PRIMARY KEY AUTO_INCREMENT,
  order_id INT NOT NULL,
  product_id VARCHAR(255) NOT NULL,
  product_name VARCHAR(255) NOT NULL,
  product_price DECIMAL(10, 2) NOT NULL,
  quantity INT NOT NULL,
  product_category VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  INDEX idx_order_id (order_id),
  INDEX idx_product_id (product_id)
);

-- Payment records table
CREATE TABLE IF NOT EXISTS payment_records (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  order_id VARCHAR(50),
  payment_method VARCHAR(50) NOT NULL,
  payment_type ENUM('deposit', 'full', 'balance') NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  reference VARCHAR(100),
  status ENUM('pending', 'completed', 'failed') DEFAULT 'pending',
  payment_data JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_order_id (order_id),
  INDEX idx_status (status)
);
