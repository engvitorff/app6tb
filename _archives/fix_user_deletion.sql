-- ============================================================
-- FIX: Permitir exclusão de usuários no Supabase
-- Cole TUDO no SQL Editor do Supabase e clique em RUN
-- ============================================================

-- PASSO 1: Listar TODAS as foreign keys que apontam para auth.users
-- (isso mostra o que está bloqueando a exclusão)
SELECT 
  tc.table_name,
  tc.constraint_name,
  rc.delete_rule
FROM information_schema.table_constraints tc
JOIN information_schema.referential_constraints rc 
  ON tc.constraint_name = rc.constraint_name
JOIN information_schema.constraint_column_usage ccu 
  ON ccu.constraint_name = tc.constraint_name
WHERE ccu.table_schema = 'auth' 
  AND ccu.table_name = 'users'
  AND tc.constraint_type = 'FOREIGN KEY';
