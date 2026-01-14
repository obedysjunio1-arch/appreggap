# 🚀 Guia de Deploy - REGGAP na Vercel

Este guia fornece instruções completas para fazer o deploy da aplicação REGGAP na plataforma Vercel.

## 📋 Pré-requisitos

- Conta na [Vercel](https://vercel.com)
- Conta no [Supabase](https://supabase.com)
- Conta no [Google Cloud Platform](https://cloud.google.com) (para integração com Google Sheets)
- Código do projeto em um repositório Git (GitHub, GitLab ou Bitbucket)

## 🔧 Configuração Inicial

### 1. Preparar o Repositório Git

Certifique-se de que seu projeto está em um repositório Git e todas as alterações foram commitadas:

```bash
git add .
git commit -m "Preparando para deploy"
git push origin main
```

### 2. Configurar Variáveis de Ambiente

Antes de fazer o deploy, você precisa configurar todas as variáveis de ambiente necessárias na Vercel.

#### Acesse o Dashboard da Vercel:

1. Faça login em [vercel.com](https://vercel.com)
2. Importe seu repositório (se ainda não tiver)
3. Vá em **Settings** > **Environment Variables**

#### Adicione as seguintes variáveis:

**Supabase:**
- `NEXT_PUBLIC_SUPABASE_URL` - URL do seu projeto Supabase
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Chave pública (anon key)
- `SUPABASE_SERVICE_ROLE_KEY` - Chave de serviço (service role key)

**Google Sheets:**
- `GOOGLE_SHEETS_SPREADSHEET_ID` - ID da planilha
- `GOOGLE_SERVICE_ACCOUNT_EMAIL` - Email da conta de serviço
- `GOOGLE_PRIVATE_KEY` - Chave privada completa (com quebras de linha `\n`)

**Configurações:**
- `NODE_ENV=production`
- `NEXT_PUBLIC_APP_URL` - URL da aplicação (será configurada automaticamente pela Vercel)

### 3. Configurar o Supabase

#### Habilitar CORS para o domínio da Vercel:

No dashboard do Supabase:
1. Vá em **Settings** > **API**
2. Adicione a URL da Vercel em **Additional Allowed Redirect URLs**
   - Exemplo: `https://seu-app.vercel.app`

#### Configurar Row Level Security (RLS):

Certifique-se de que as políticas RLS estão configuradas corretamente para permitir operações necessárias.

### 4. Configurar Google Cloud Platform

#### Criar Conta de Serviço:

1. Acesse o [Google Cloud Console](https://console.cloud.google.com)
2. Crie um novo projeto ou selecione um existente
3. Vá em **IAM & Admin** > **Service Accounts**
4. Crie uma nova conta de serviço
5. Baixe o arquivo JSON da chave privada
6. Extraia o `private_key` do JSON (incluindo as quebras de linha)

#### Compartilhar Planilha:

1. Abra sua planilha no Google Sheets
2. Clique em **Compartilhar**
3. Adicione o email da conta de serviço com permissão de **Editor**

## 📦 Processo de Deploy

### Opção 1: Deploy via Dashboard da Vercel

1. **Importar Repositório:**
   - Acesse [vercel.com/new](https://vercel.com/new)
   - Selecione seu repositório Git
   - Clique em **Import**

2. **Configurar Projeto:**
   - Framework Preset: **Next.js** (deve ser detectado automaticamente)
   - Root Directory: `./` (raiz do projeto)
   - Build Command: `npm run build` (padrão)
   - Output Directory: `.next` (padrão)
   - Install Command: `npm install` (padrão)

3. **Adicionar Variáveis de Ambiente:**
   - Clique em **Environment Variables**
   - Adicione todas as variáveis listadas acima
   - Configure para todos os ambientes (Production, Preview, Development)

4. **Deploy:**
   - Clique em **Deploy**
   - Aguarde o processo de build e deploy

### Opção 2: Deploy via Vercel CLI

1. **Instalar Vercel CLI:**
   ```bash
   npm i -g vercel
   ```

2. **Login:**
   ```bash
   vercel login
   ```

3. **Deploy:**
   ```bash
   vercel
   ```

4. **Deploy de Produção:**
   ```bash
   vercel --prod
   ```

## ✅ Verificações Pós-Deploy

Após o deploy, verifique:

1. **Aplicação está funcionando:**
   - Acesse a URL fornecida pela Vercel
   - Teste o login
   - Verifique se os dados estão sendo carregados

2. **Integração com Supabase:**
   - Teste CRUD de ocorrências
   - Verifique se os dados aparecem corretamente

3. **Integração com Google Sheets:**
   - Crie uma ocorrência
   - Verifique se foi salva no Google Sheets

4. **Logs e Erros:**
   - Acesse **Functions** > **Logs** na Vercel
   - Verifique se há erros

## 🔍 Troubleshooting

### Erro de Build

**Problema:** Build falha na Vercel

**Soluções:**
- Verifique se todas as dependências estão no `package.json`
- Verifique se há erros de TypeScript: `npm run build` localmente
- Verifique os logs de build na Vercel

### Erro de Variáveis de Ambiente

**Problema:** Variáveis de ambiente não estão sendo reconhecidas

**Soluções:**
- Verifique se todas as variáveis foram adicionadas na Vercel
- Certifique-se de que as variáveis não têm espaços extras
- Faça um novo deploy após adicionar variáveis

### Erro de CORS no Supabase

**Problema:** Erro de CORS ao acessar Supabase

**Soluções:**
- Adicione a URL da Vercel nas configurações de CORS do Supabase
- Verifique se a URL está correta (com ou sem www)

### Erro de Google Sheets

**Problema:** Erro ao salvar no Google Sheets

**Soluções:**
- Verifique se a chave privada está correta (com quebras de linha)
- Verifique se a conta de serviço tem permissão na planilha
- Verifique se o ID da planilha está correto

## 📝 Configurações do Next.js para Vercel

O projeto já está configurado com `next.config.js` otimizado para Vercel:

- ✅ PWA desabilitado em desenvolvimento
- ✅ Standalone output habilitado
- ✅ TypeScript e ESLint configurados

## 🔐 Segurança

### Variáveis Sensíveis:

- ✅ `SUPABASE_SERVICE_ROLE_KEY` - Apenas servidor
- ✅ `GOOGLE_PRIVATE_KEY` - Apenas servidor
- ✅ `NEXT_PUBLIC_*` - Expostas no cliente (use apenas variáveis públicas)

### Boas Práticas:

1. Nunca commite `.env.local` no Git
2. Use diferentes projetos Supabase para dev/prod
3. Revise periodicamente as permissões das contas de serviço
4. Monitore os logs para identificar problemas

## 📊 Monitoramento

### Verificar Deploy:

1. Acesse o dashboard da Vercel
2. Vá em **Deployments**
3. Verifique o status do último deploy
4. Clique em **View Function Logs** para ver logs em tempo real

### Alertas:

Configure alertas no Supabase e Vercel para:
- Erros de API
- Uso excessivo de recursos
- Falhas de deploy

## 🔄 Atualizações Futuras

Após o deploy inicial, para atualizar a aplicação:

1. Faça commit das alterações:
   ```bash
   git add .
   git commit -m "Sua mensagem"
   git push
   ```

2. A Vercel fará deploy automático via webhook do Git

3. Ou faça deploy manual:
   ```bash
   vercel --prod
   ```

## 📞 Suporte

Em caso de problemas:

1. Verifique os logs na Vercel
2. Verifique os logs no Supabase
3. Consulte a documentação:
   - [Vercel Docs](https://vercel.com/docs)
   - [Supabase Docs](https://supabase.com/docs)
   - [Next.js Docs](https://nextjs.org/docs)

---

**Última atualização:** $(date)
