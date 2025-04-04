-- Setup Extensions
CREATE EXTENSION "uuid-ossp";
CREATE EXTENSION "pgcrypto";

-- CREATE DATABASE bomberlab_carts;
-- CREATE DATABASE bomberlab_payments;
-- CREATE DATABASE bomberlab_products;
-- CREATE DATABASE bomberlab_orders;
-- CREATE DATABASE bomberlab_users;

\c bomberlab_users;
CREATE TABLE bomberlab_users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

\c bomberlab_carts;
CREATE TABLE bomberlab_carts (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  items JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster JSON operations
CREATE INDEX idx_bomberlab_carts_items ON carts USING GIN (items);

\c bomberlab_products;
CREATE TABLE bomberlab_products (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
  stock INT NOT NULL CHECK (stock >= 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

\c bomberlab_orders;
CREATE TABLE bomberlab_orders (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  items JSON NOT NULL,
  total_price DECIMAL(10, 2) NOT NULL CHECK (total_price >= 0),
  status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
-- Create index for faster lookups
CREATE INDEX idx_bomberlab_orders_user_id ON bomberlab_orders (user_id);
CREATE INDEX idx_bomberlab_orders_status ON bomberlab_orders (status);
