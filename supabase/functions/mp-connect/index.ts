import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
  console.log('--- NOVA REQUISICAO MP-CONNECT ---');
  console.log('Metodo:', req.method);
  console.log('Headers:', JSON.stringify(Object.fromEntries(req.headers.entries())));

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const rawBody = await req.text();
    console.log('Body bruto:', rawBody);
    const { code, redirectUri } = JSON.parse(rawBody);
    
    const mpClientId = Deno.env.get('MP_CLIENT_ID');
    const mpClientSecret = Deno.env.get('MP_CLIENT_SECRET');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    const supabase = createClient(supabaseUrl!, supabaseServiceKey!);

    // LOG DE INICIO
    await supabase.from('activity_logs').insert({
        user_name: 'MP_DEBUG_START',
        action: 'criou',
        target_type: 'debug',
        target_id: 'sys',
        description: `Code: ${code}, Uri: ${redirectUri}`
    });

    if (!mpClientId || !mpClientSecret) {
      throw new Error('As credenciais do Mercado Pago não estão configuradas nas variáveis (Secrets) dessa Edge Function.');
    }

    // Troca o código pelo Access Token no Mercado Pago
    const tokenResponse = await fetch('https://api.mercadopago.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      },
      body: new URLSearchParams({
        client_id: mpClientId,
        client_secret: mpClientSecret,
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: redirectUri
      }).toString()
    });

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok) {
        // LOG DO ERRO DO MERCADO PAGO ONDE NINGUEM VE
        await supabase.from('activity_logs').insert({
            user_name: 'MP_DEBUG_ERROR_MP',
            action: 'excluiu',
            target_type: 'debug',
            target_id: 'sys',
            description: JSON.stringify(tokenData)
        });
        return new Response(JSON.stringify({ error: tokenData }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: tokenResponse.status })
    }

    // Valida quem está requisitando a integração
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Token de autorização do Supabase não fornecido');
    }
    const token = authHeader.replace('Bearer ', '');

    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) throw new Error('Não foi possível identificar seu usuário');

    // Cria/Atualiza a integração na tabela de segurança no BD do Supabase
    // Primeiro limpamos qualquer vinculo anterior para evitar conflitos de chave primária
    await supabase
      .from('user_integrations')
      .delete()
      .eq('user_id', user.id);

    const { error: insertError } = await supabase
      .from('user_integrations')
      .insert({
        user_id: user.id,
        mp_access_token: tokenData.access_token,
        mp_refresh_token: tokenData.refresh_token,
        mp_public_key: tokenData.public_key,
        updated_at: new Date().toISOString()
      });

    if (insertError) {
      console.error('Erro ao salvar integração no banco:', insertError);
      throw new Error(`Erro ao salvar no banco de dados: ${insertError.message}`);
    }

    return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 })
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 })
  }
})
