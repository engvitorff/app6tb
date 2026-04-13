-- Tabela para armazenar as credenciais OAuth do Mercado Pago por usuário
CREATE TABLE IF NOT EXISTS user_integrations (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    mp_access_token TEXT NOT NULL,
    mp_refresh_token TEXT,
    mp_public_key TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ativar RLS
ALTER TABLE user_integrations ENABLE ROW LEVEL SECURITY;

-- Políticas de Segurança
-- Somente o próprio usuário pode ver e gerenciar sua integração
CREATE POLICY "Users can view their own integration" 
ON user_integrations FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own integration" 
ON user_integrations FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own integration" 
ON user_integrations FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own integration" 
ON user_integrations FOR DELETE 
USING (auth.uid() = user_id);

-- Comentários para documentação
COMMENT ON TABLE user_integrations IS 'Armazena tokens de acesso OAuth do Mercado Pago para integração de pagamentos e consulta de saldo.';
