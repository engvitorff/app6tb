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
    const { amount, description, external_reference, email } = await req.json();
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    // Valida o usuário
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('Token de autorização do Supabase não fornecido');
    const token = authHeader.replace('Bearer ', '');

    const supabase = createClient(supabaseUrl!, supabaseServiceKey!);
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) throw new Error('Usuário inválido ou não logado.');

    // Buscar a integração no banco de dados para pegar o access_token
    const { data: integration, error: integrationError } = await supabase
      .from('user_integrations')
      .select('mp_access_token')
      .eq('user_id', user.id)
      .single();

    if (integrationError || !integration?.mp_access_token) {
      throw new Error('Integração com Mercado Pago não encontrada. Por favor, vincule sua conta primeiro.');
    }

    // Gerar Pagamento PIX no Mercado Pago
    // Documentação: https://www.mercadopago.com.br/developers/pt/reference/payments/_payments/post
    const mpResponse = await fetch('https://api.mercadopago.com/v1/payments', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${integration.mp_access_token}`,
        'Content-Type': 'application/json',
        'X-Idempotency-Key': crypto.randomUUID()
      },
      body: JSON.stringify({
        transaction_amount: amount,
        description: description,
        payment_method_id: 'pix',
        external_reference: external_reference,
        payer: {
          email: email || 'pagode-finance-customer@example.com',
          // O Mercado Pago pode requerer first_name, last_name e identification para PIX real em produção
        }
      })
    });

    const mpData = await mpResponse.json();

    if (!mpResponse.ok) {
      console.error('Erro MP:', mpData);
      return new Response(JSON.stringify({ error: mpData.message || 'Falha ao gerar PIX', details: mpData }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
        status: mpResponse.status 
      });
    }

    // Retorna os dados do PIX (QR Code e Copia e Cola)
    return new Response(JSON.stringify({
      success: true,
      id: mpData.id,
      status: mpData.status,
      qr_code: mpData.point_of_interaction.transaction_data.qr_code,
      qr_code_base64: mpData.point_of_interaction.transaction_data.qr_code_base64,
      copy_paste: mpData.point_of_interaction.transaction_data.qr_code
    }), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
      status: 200 
    });

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
      status: 400 
    });
  }
})
