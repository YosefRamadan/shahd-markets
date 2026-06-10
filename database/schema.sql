SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS=0;

CREATE TABLE IF NOT EXISTS users (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(120) NOT NULL,
  email VARCHAR(190) NOT NULL UNIQUE,
  phone VARCHAR(20) UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  default_address TEXT,
  city VARCHAR(80) NOT NULL DEFAULT 'الفيوم',
  remember_token_hash VARCHAR(255) NULL,
  role ENUM('customer','manager','admin') NOT NULL DEFAULT 'customer',
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_users_phone (phone),
  INDEX idx_users_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS admins (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL UNIQUE,
  permissions JSON NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS categories (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name_ar VARCHAR(160) NOT NULL,
  slug VARCHAR(190) NOT NULL UNIQUE,
  image_url VARCHAR(255),
  sort_order INT NOT NULL DEFAULT 0,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_categories_active_sort (is_active, sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS products (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  category_id INT UNSIGNED NOT NULL,
  name_ar VARCHAR(190) NOT NULL,
  slug VARCHAR(190) NOT NULL UNIQUE,
  description_ar TEXT,
  image_url VARCHAR(255),
  base_price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  stock INT NOT NULL DEFAULT 0,
  is_weight_based TINYINT(1) NOT NULL DEFAULT 0,
  weight_options_grams VARCHAR(120) NOT NULL DEFAULT '',
  price_per_kg DECIMAL(10,2) NULL,
  unit_label_ar VARCHAR(60),
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT,
  INDEX idx_products_category (category_id),
  INDEX idx_products_active_sort (is_active, sort_order),
  INDEX idx_products_stock (stock)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS product_images (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  product_id INT UNSIGNED NOT NULL,
  image_url VARCHAR(255) NOT NULL,
  alt_ar VARCHAR(190),
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  INDEX idx_product_images_product (product_id, sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS product_variants (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  product_id INT UNSIGNED NOT NULL,
  name_ar VARCHAR(160) NOT NULL,
  sku VARCHAR(80),
  price DECIMAL(10,2) NOT NULL,
  stock INT NOT NULL DEFAULT 0,
  sort_order INT NOT NULL DEFAULT 0,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  INDEX idx_variants_product (product_id, sort_order),
  INDEX idx_variants_stock (stock)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS cart_items (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NULL,
  session_id VARCHAR(64) NULL,
  product_id INT UNSIGNED NOT NULL,
  variant_id INT UNSIGNED NULL,
  weight_grams INT NULL,
  quantity INT NOT NULL DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  FOREIGN KEY (variant_id) REFERENCES product_variants(id) ON DELETE SET NULL,
  INDEX idx_cart_user (user_id),
  INDEX idx_cart_session (session_id),
  INDEX idx_cart_product (product_id, variant_id, weight_grams)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS orders (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  order_number VARCHAR(32) NOT NULL UNIQUE,
  user_id INT UNSIGNED NULL,
  session_id VARCHAR(64) NULL,
  status ENUM('placed','preparing','out_for_delivery','delivered','cancelled') NOT NULL DEFAULT 'placed',
  customer_name VARCHAR(120) NOT NULL,
  customer_phone VARCHAR(20) NOT NULL,
  customer_address TEXT NOT NULL,
  customer_city VARCHAR(80) NOT NULL DEFAULT 'الفيوم',
  notes TEXT,
  admin_notes TEXT,
  payment_method ENUM('cash','card') NOT NULL DEFAULT 'cash',
  subtotal DECIMAL(10,2) NOT NULL,
  delivery_fee DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  total DECIMAL(10,2) NOT NULL,
  stock_deducted TINYINT(1) NOT NULL DEFAULT 0,
  cancelled_at DATETIME NULL,
  delivered_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_orders_user (user_id),
  INDEX idx_orders_session (session_id),
  INDEX idx_orders_status (status),
  INDEX idx_orders_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS order_items (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  order_id INT UNSIGNED NOT NULL,
  product_id INT UNSIGNED NOT NULL,
  variant_id INT UNSIGNED NULL,
  weight_grams INT NULL,
  quantity INT NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  line_total DECIMAL(10,2) NOT NULL,
  product_name VARCHAR(190) NOT NULL,
  variant_name VARCHAR(160),
  is_weight_based TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  INDEX idx_order_items_order (order_id),
  INDEX idx_order_items_product (product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS settings (
  `key` VARCHAR(100) PRIMARY KEY,
  `value` TEXT NOT NULL,
  is_public TINYINT(1) NOT NULL DEFAULT 1,
  description VARCHAR(255),
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS inventory (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  product_id INT UNSIGNED NOT NULL,
  variant_id INT UNSIGNED NULL,
  change_qty INT NOT NULL,
  reason VARCHAR(190) NOT NULL,
  created_by INT UNSIGNED NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  FOREIGN KEY (variant_id) REFERENCES product_variants(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_inventory_product (product_id, variant_id),
  INDEX idx_inventory_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS password_resets (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  token_hash VARCHAR(255) NOT NULL,
  expires_at DATETIME NOT NULL,
  used_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_password_resets_token (token_hash),
  INDEX idx_password_resets_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO settings (`key`, `value`, is_public, description) VALUES
('store_name_ar','أسواق شهد الفيوم',1,'اسم المتجر'),
('store_city_ar','الفيوم',1,'مدينة المتجر'),
('contact_phone','01008336388',1,'رقم الهاتف'),
('contact_phones','01008336388',1,'أرقام التواصل مفصولة بفواصل'),
('whatsapp_number','01008336388',1,'رقم واتساب'),
('working_hours_ar','متاح 24 ساعة يومياً - طوال أيام الأسبوع',1,'مواعيد العمل'),
('delivery_fee_egp','20',1,'رسوم التوصيل'),
('min_order_egp','100',1,'الحد الأدنى للطلب')
ON DUPLICATE KEY UPDATE `value`=VALUES(`value`);

INSERT INTO categories (name_ar, slug, sort_order, is_active) VALUES
('خضروات وفاكهة','vegetables-fruits',1,1),
('بقالة وتموين','grocery',2,1),
('مشروبات','drinks',3,1),
('منظفات','cleaning',4,1)
ON DUPLICATE KEY UPDATE name_ar=VALUES(name_ar);

INSERT INTO products (category_id, name_ar, slug, description_ar, base_price, stock, is_weight_based, weight_options_grams, price_per_kg, unit_label_ar, sort_order, is_active)
SELECT id, 'طماطم بلدي', 'tomatoes', 'طماطم طازجة مختارة بعناية.', 0, 50, 1, '250,500,750,1000', 18.00, 'كجم', 1, 1 FROM categories WHERE slug='vegetables-fruits'
ON DUPLICATE KEY UPDATE name_ar=VALUES(name_ar);
INSERT INTO products (category_id, name_ar, slug, description_ar, base_price, stock, is_weight_based, sort_order, is_active)
SELECT id, 'سكر أبيض 1 كجم', 'white-sugar-1kg', 'سكر أبيض معبأ.', 35.00, 80, 0, 2, 1 FROM categories WHERE slug='grocery'
ON DUPLICATE KEY UPDATE name_ar=VALUES(name_ar);
INSERT INTO products (category_id, name_ar, slug, description_ar, base_price, stock, is_weight_based, sort_order, is_active)
SELECT id, 'مياه معدنية', 'mineral-water', 'عبوات مياه معدنية بأحجام مختلفة.', 0.00, 0, 0, 3, 1 FROM categories WHERE slug='drinks'
ON DUPLICATE KEY UPDATE name_ar=VALUES(name_ar);

INSERT INTO product_variants (product_id, name_ar, sku, price, stock, sort_order, is_active)
SELECT id, 'صغير 600 مل', 'WATER-600', 6.00, 100, 1, 1 FROM products WHERE slug='mineral-water'
ON DUPLICATE KEY UPDATE price=VALUES(price);
INSERT INTO product_variants (product_id, name_ar, sku, price, stock, sort_order, is_active)
SELECT id, 'كبير 1.5 لتر', 'WATER-1500', 10.00, 80, 2, 1 FROM products WHERE slug='mineral-water'
ON DUPLICATE KEY UPDATE price=VALUES(price);

SET FOREIGN_KEY_CHECKS=1;
