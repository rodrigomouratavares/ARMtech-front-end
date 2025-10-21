-- Migration: Create payment_methods table
-- Description: Adds payment methods functionality to store different payment types
-- Author: Flow CRM Team
-- Date: 2025-10-10

-- Create payment_methods table
CREATE TABLE IF NOT EXISTS payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL,
  description VARCHAR(255) NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX idx_payment_methods_is_active ON payment_methods(is_active);
CREATE INDEX idx_payment_methods_code ON payment_methods(code);
CREATE INDEX idx_payment_methods_description ON payment_methods(description);
CREATE INDEX idx_payment_methods_created_by ON payment_methods(created_by);

-- Add comments for documentation
COMMENT ON TABLE payment_methods IS 'Stores different payment method types (cash, credit card, PIX, etc.)';
COMMENT ON COLUMN payment_methods.id IS 'Unique identifier for the payment method';
COMMENT ON COLUMN payment_methods.code IS 'Auto-generated unique code (e.g., PM0001, PM0002)';
COMMENT ON COLUMN payment_methods.description IS 'Human-readable name of the payment method';
COMMENT ON COLUMN payment_methods.is_active IS 'Whether the payment method is currently active';
COMMENT ON COLUMN payment_methods.created_by IS 'User who created this payment method';
COMMENT ON COLUMN payment_methods.created_at IS 'Timestamp when the record was created';
COMMENT ON COLUMN payment_methods.updated_at IS 'Timestamp when the record was last updated';

-- Insert default payment methods
INSERT INTO payment_methods (code, description, is_active) VALUES
  ('PM0001', 'Dinheiro', true),
  ('PM0002', 'Cartão de Crédito', true),
  ('PM0003', 'Cartão de Débito', true),
  ('PM0004', 'PIX', true),
  ('PM0005', 'Boleto Bancário', true)
ON CONFLICT (code) DO NOTHING;

-- Create trigger to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_payment_methods_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_payment_methods_updated_at
  BEFORE UPDATE ON payment_methods
  FOR EACH ROW
  EXECUTE FUNCTION update_payment_methods_updated_at();
