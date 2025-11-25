-- Drop the old constraint first
ALTER TABLE public.farmacias 
DROP CONSTRAINT IF EXISTS farmacias_account_status_check;

-- Update ALL existing records to valid new values
UPDATE public.farmacias 
SET account_status = 'pendente' 
WHERE account_status NOT IN ('pendente', 'active', 'blocked');

-- Add new constraint with correct values
ALTER TABLE public.farmacias 
ADD CONSTRAINT farmacias_account_status_check 
CHECK (account_status IN ('pendente', 'active', 'blocked'));

-- Update default value to 'pendente'
ALTER TABLE public.farmacias 
ALTER COLUMN account_status SET DEFAULT 'pendente';