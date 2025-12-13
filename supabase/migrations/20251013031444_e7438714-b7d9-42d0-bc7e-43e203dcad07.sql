-- Inserir 1 farmácia real
INSERT INTO public.farmacias (
  nome, 
  endereco_completo, 
  bairro, 
  cidade, 
  estado, 
  cep, 
  latitude, 
  longitude, 
  telefone, 
  whatsapp,
  horario_funcionamento,
  ponto_referencia,
  ativa
) VALUES (
  'Farmácia Central Maputo',
  'Avenida Julius Nyerere, 1234',
  'Polana Cimento',
  'Maputo',
  'Maputo',
  '1100',
  -25.9655,
  32.5832,
  '+258 84 123 4567',
  '+258 84 123 4567',
  'Segunda a Sábado: 8h-20h, Domingo: 9h-17h',
  'Próximo ao Shoprite da Polana',
  true
);

-- Inserir 3 medicamentos
INSERT INTO public.medicamentos (nome, nome_generico, principio_ativo, fabricante, categoria)
VALUES 
  ('Paracetamol 500mg', 'Paracetamol', 'Paracetamol', 'Medquímica', 'Analgésico'),
  ('Amoxicilina 500mg', 'Amoxicilina', 'Amoxicilina', 'Antibioticos Moçambique', 'Antibiótico'),
  ('Omeprazol 20mg', 'Omeprazol', 'Omeprazol', 'Farmoz', 'Gastroprotetor');

-- Inserir estoque dos 3 medicamentos na farmácia
INSERT INTO public.estoque (farmacia_id, medicamento_id, quantidade, preco, disponivel)
SELECT 
  f.id,
  m.id,
  CASE 
    WHEN m.nome = 'Paracetamol 500mg' THEN 150
    WHEN m.nome = 'Amoxicilina 500mg' THEN 80
    WHEN m.nome = 'Omeprazol 20mg' THEN 60
  END,
  CASE 
    WHEN m.nome = 'Paracetamol 500mg' THEN 15.50
    WHEN m.nome = 'Amoxicilina 500mg' THEN 35.75
    WHEN m.nome = 'Omeprazol 20mg' THEN 22.90
  END,
  true
FROM public.farmacias f
CROSS JOIN public.medicamentos m
WHERE f.nome = 'Farmácia Central Maputo';