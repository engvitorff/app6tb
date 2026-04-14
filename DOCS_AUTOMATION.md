# 🚀 Pagode Finance - Guia de Automação Total

Agora o seu projeto está configurado para que você não precise se preocupar com processos manuais.

## 🛠️ Comandos de Terminal (NPM)

Sempre que terminar uma alteração no código:

### 1. Atualizar TUDO (Recomendado)
Salva no Git, envia para o GitHub, atualiza a Vercel e sobe as Edge Functions do Supabase:
```powershell
npm run deploy-all
```

### 2. Apenas Código (Vite/Vercel)
```powershell
npm run deploy
```

### 3. Apenas Funções do Supabase
```powershell
npm run deploy-functions
```

---

## 🌩️ Automação via GitHub (CI/CD)

Configurei um **GitHub Action** que monitora a pasta `supabase/functions`.
- **Como funciona:** Sempre que você der um `push` (ou usar o `npm run deploy-all`), o próprio GitHub vai tentar subir suas funções para o Supabase.

### ⚠️ Ação Necessária no GitHub:
Para a automação via GitHub funcionar, você precisa adicionar dois "Secrets" no seu repositório do GitHub (**Settings > Secrets and variables > Actions > New repository secret**):
1.  **`SUPABASE_ACCESS_TOKEN`**: Pegue o seu token em [supabase.com/dashboard/account/tokens](https://supabase.com/dashboard/account/tokens).
2.  **`SUPABASE_PROJECT_ID`**: Use o código `wzsgnqwszqcgctslumug`.

---

## 🗄️ Supabase CLI Instalado
O `supabase-cli` agora faz parte do seu projeto. Você pode rodar comandos diretamente se desejar:
- `npx supabase status`
- `npx supabase functions list`

---
*Configurado por Antigravity* 🚀
