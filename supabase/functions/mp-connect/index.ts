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
    const { code, redirectUri } = await req.json();
    
    const mpClientId = Deno.env.get('MP_CLIENT_ID');
    const mpClientSecret = Deno.env.get('MP_CLIENT_SECRET');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

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
        return new Response(JSON.stringify({ error: tokenData }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: tokenResponse.status })
    }

    // Valida quem está requisitando a integração
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Token de autorização do Supabase não fornecido');
    }
    const token = authHeader.replace('Bearer ', '');

    const supabase = createClient(supabaseUrl!, supabaseServiceKey!);
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) throw new Error('Não foi possível identificar seu usuário');

    // Cria/Atualiza a integração na tabela de segurança no BD do Supabase
    const { error: upsertError } = await supabase
      .from('user_integrations')
      .upsert({
        user_id: user.id,
        mp_access_token: tokenData.access_token,
        mp_refresh_token: tokenData.refresh_token,
        mp_public_key: tokenData.public_key,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' });

    if (upsertError) throw upsertError;

    return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 })
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 })
  }
})
