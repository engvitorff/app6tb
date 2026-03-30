# 🚀 Pagode Finance - Guia de Automação

Agora você tem comandos prontos para sincronizar seu projeto com o GitHub, Vercel e Supabase.

## 🛠️ Como usar os novos comandos

### 1. Atualizar e Enviar Tudo (Git + Vercel)
Sempre que fizer uma mudança e quiser subir para a nuvem:
```powershell
npm run deploy
```
**O que isso faz:**
- Faz o `git add .` (salva todas as mudanças locais).
- Faz o `git commit` com uma mensagem padrão.
- Envia os arquivos para os dois repositórios do GitHub (`origin` e `app6tb`).
- **Vercel:** Como está conectado ao seu GitHub, ele vai detectar o envio e iniciar o "Build" (publicação) do site automaticamente.

### 2. Apenas Enviar ao GitHub
Se você já fez o commit e só quer enviar:
```powershell
npm run push-all
```

---

## 🗄️ Supabase (Banco de Dados)

### Como subir mudanças no banco:
No momento, a forma mais segura sem instalar o CLI é:
1. Abra o arquivo `supabase_migration.sql`.
2. Copie o código.
3. Cole no **SQL Editor** do seu painel do Supabase e clique em **RUN**.

> **Dica:** Se futuramente você instalar o `supabase-cli`, podemos automatizar isso via terminal também!

---

## 🌩️ Vercel (Hospedagem)
O site é atualizado automaticamente pelo GitHub. Para conferir o status:
- Acesse seu painel da Vercel.
- Veja o histórico de **Deployments**.

---
*Configurado por Antigravity* 🚀
