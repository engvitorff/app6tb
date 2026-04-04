---
description: Retomar o desenvolvimento da integração com o Mercado Pago
---
Este arquivo atua como um 'Save State' (Ponto de Retorno) para finalizar a integração estrutural do Pagode Finance com a API do Mercado Pago (OAuth 2.0).

### Contexto e Estado Atual:
Nas sessões anteriores, nós preparamos toda a fundação da integração de pagamentos e segurança sem que as chaves ficassem expostas.
No Frontend:
- O módulo `api.ts` ganhou os métodos `getMercadoPagoIntegration`, `connectMercadoPago` e `getMercadoPagoBalance`.
- O arquivo `Dashboard.tsx` gerou a interface e alertas de verificação da conta do Mercado Pago, além de exibir o saldo em tempo real se autorizado.
- Foi criada a variável vazia `VITE_MP_CLIENT_ID` no `.env`.

No Backend:
- O terminal inicializou com sucesso o Supabase CLI gerando o local environment.
- Foram criadas duas Edge Functions (Deno):
  - `mp-connect` (Responsável pelo aperto de mão invisível e troca do Code pelo OAUTH Access Token).
  - `mp-balance` (Responsável por verificar saldos diretamente na API com aquele Access Token).

### Passo a Passo Restante:
O desenvolvedor (Vitor) precisa estar com o portal do MP aberto para prosseguirmos com os passos abaixo.

1. **Configuração de Chaves:** Adicionar o `Client ID` e o `Client Secret` reais na nuvem (Supabase Secrets) e o Client ID no `.env` do app.
2. **Setup do SQL:** Executar o script SQL que cria a tabela `user_integrations` onde guardaremos a autorização dos usuários ao efetuarem os tokens.
3. **Módulo PIX/Transação:** Criaremos a última e mais importante Edge Function (`mp-payments`), para geração massiva de QR Codes PIX dos contratantes e links dos Músicos Freelancers/Sócios.
4. **Deploy:** Lançar as Edge Functions online via `npx supabase functions deploy`.

Para iniciar, o usuário não precisará fazer nada além de chamar este workflow novamente via linha de comando ou chat!
