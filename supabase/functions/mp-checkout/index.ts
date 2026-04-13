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
    const { amount, description, external_reference } = await req.json();
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    // Valida o usuário
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('Token de autorização do Supabase não fornecido');
    const token = authHeader.replace('Bearer ', '');

    const supabase = createClient(supabaseUrl!, supabaseServiceKey!);
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) throw new Error('Usuário inválido ou não logado.');

    // Buscar a integração no banco de dados
    const { data: integration, error: integrationError } = await supabase
      .from('user_integrations')
      .select('mp_access_token')
      .eq('user_id', user.id)
      .single();

    if (integrationError || !integration?.mp_access_token) {
      throw new Error('Integração com Mercado Pago não encontrada.');
    }

    // Criar Preferência de Pagamento no Mercado Pago (Checkout Pro)
    // Documentação: https://www.mercadopago.com.br/developers/pt/reference/preferences/_checkout_preferences/post
    const mpResponse = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${integration.mp_access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        items: [
          {
            title: description,
            quantity: 1,
            unit_price: amount,
            currency_id: 'BRL'
          }
        ],
        external_reference: external_reference,
        back_urls: {
          success: 'https://pagode-finance.vercel.app/sucesso', // Ajustar conforme URL real futuramente
          pending: 'https://pagode-finance.vercel.app/pendente',
          failure: 'https://pagode-finance.vercel.app/erro'
        },
        auto_return: 'all',
        payment_methods: {
          excluded_payment_types: [
            { id: 'ticket' } // Exemplo: excluir boleto se quiser apenas PIX/Cartão
          ],
          installments: 12 // Permitir parcelamento
        }
      })
    });

    const mpData = await mpResponse.json();

    if (!mpResponse.ok) {
      console.error('Erro MP Checkout:', mpData);
      return new Response(JSON.stringify({ error: mpData.message || 'Falha ao gerar Link', details: mpData }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
        status: mpResponse.status 
      });
    }

    // Retorna o link de pagamento (init_point)
    return new Response(JSON.stringify({
      success: true,
      id: mpData.id,
      checkout_url: mpData.init_point, // Link para enviar ao cliente
      sandbox_url: mpData.sandbox_init_point
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
