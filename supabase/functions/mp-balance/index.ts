import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    // Valida o usuário
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('Token de autorização do Supabase não fornecido');
    const token = authHeader.replace('Bearer ', '');

    const supabase = createClient(supabaseUrl!, supabaseServiceKey!);
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) throw new Error('Usuário inválido ou não logado.');

    // Buscar a integração no banco de dados local
    const { data: integration, error: integrationError } = await supabase
      .from('user_integrations')
      .select('mp_access_token')
      .eq('user_id', user.id)
      .single();

    if (integrationError || !integration?.mp_access_token) {
      throw new Error('Integração com Mercado Pago não encontrada para este usuário.');
    }

    // Usar o MP_ACCESS_TOKEN do usuário para checar API de conta do Mercado Pago
    // Endpoint para saldo não existe globalmente com precisão pra "account_balance" a menos que 
    // seja consultado endpoints do Wallet ou Movements.
    // O Mercado Pago possui a API de `users/me` para retornar dados gerais, mas não saldo propriamente 
    // aberto sem permissões complexas. Vamos tentar consultar um endpoint comum ou mockar se estiver fora do ar.
    
    // Fake balance (fallback ou mockup) - no futuro usar a API real de saldo assim:
    // fetch('https://api.mercadopago.com/v1/bank_transfer/statements', { headers... })
    // Como a documentação de consultar Saldo do usuário é restrita (requer privilégios especiais - Advanced Payments),
    // muitas vezes apps criam uma "Caixinha" via movimentos ou apenas espelham transações recentes do /v1/payments/search

    // Simulação temporária até obtermos um escopo maior da API de Wallet:
    // (Caso houvesse endpoint open pra saldo: const balanceRes = await fetch('...'))
    let accountBalance = 0;

    // TODO: Adicionar lógica real de fetch('/v1/account/balace') (atualmente mercado pago restringe fortemente isso a menos que a app seja "Wallet/Partner")
    // Simularemos o ping da API retornando o token ativo.
    const pingResponse = await fetch('https://api.mercadopago.com/users/me', {
       headers: { 'Authorization': `Bearer ${integration.mp_access_token}` }
    });

    if (!pingResponse.ok) {
       // Se o token estiver inválido, podemos limpar do BD no futuro.
       throw new Error('Token do Mercado Pago revogado ou inválido.');
    }

    // Retorna OK provando que a ponte está viva!
    return new Response(JSON.stringify({ 
      success: true, 
      balance: accountBalance,
      message: 'Conectado. A API do Mercado Pago requer escopo avançado de "Wallet" para exibir extrato Real. O ping funciona!'
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 })

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 })
  }
})
