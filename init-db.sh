#!/bin/bash
set -e

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        symbol TEXT NOT NULL,
        quantity NUMERIC NOT NULL,
        order_type TEXT NOT NULL,
        price NUMERIC,
        status TEXT NOT NULL DEFAULT 'PENDING',
        is_trigger_order BOOLEAN DEFAULT FALSE,
        trigger_type TEXT,
        trigger_price NUMERIC,
        trigger_percentage NUMERIC,
        base_price NUMERIC,
        target_price NUMERIC,
        trigger_status TEXT,
        last_checked TIMESTAMP,
        triggered_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
    );
EOSQL