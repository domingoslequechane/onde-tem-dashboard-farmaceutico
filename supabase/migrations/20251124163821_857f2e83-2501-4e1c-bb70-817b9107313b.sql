-- Adicionar nova role 'super_admin' ao enum
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'super_admin';