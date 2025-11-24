-- Corrigir user_id na tabela user_roles para corresponder ao auth.users
UPDATE user_roles 
SET user_id = '9d7a5066-4729-4514-b32b-509950459f47'
WHERE user_id = 'c2ec1706-d17d-443c-bf16-1ef51b531970';