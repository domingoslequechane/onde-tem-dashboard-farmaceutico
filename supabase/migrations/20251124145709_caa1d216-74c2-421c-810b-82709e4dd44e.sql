-- Adicionar campos separados para horário de abertura e fechamento
ALTER TABLE farmacias 
ADD COLUMN horario_abertura TIME,
ADD COLUMN horario_fechamento TIME;

-- Migrar dados existentes se houver (formato esperado: "08:00 - 18:00")
UPDATE farmacias 
SET 
  horario_abertura = CASE 
    WHEN horario_funcionamento IS NOT NULL AND horario_funcionamento LIKE '%-%' 
    THEN split_part(trim(horario_funcionamento), '-', 1)::TIME
    ELSE NULL
  END,
  horario_fechamento = CASE 
    WHEN horario_funcionamento IS NOT NULL AND horario_funcionamento LIKE '%-%'
    THEN split_part(trim(horario_funcionamento), '-', 2)::TIME
    ELSE NULL
  END
WHERE horario_funcionamento IS NOT NULL;

-- Manter o campo antigo por compatibilidade (pode ser removido depois)
COMMENT ON COLUMN farmacias.horario_funcionamento IS 'Campo obsoleto - usar horario_abertura e horario_fechamento';