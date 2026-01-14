# Instruções de Configuração - Integração Google Sheets

## 📋 Pré-requisitos

1. **Criar arquivo `.env.local`** na raiz do projeto com as seguintes variáveis:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://jwbcohqsvwbvcqifgfct.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp3YmNvaHFzdndidmNxaWZnZmN0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgwNjg4ODksImV4cCI6MjA4MzY0NDg4OX0.7Ez__O1yECjwoRvUEtY-c3HAzDSF6uy2zJFj_caACoM
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=sb_publishable_3mCIYdKlFRldbtWRToj-aQ_46VTOHpk
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp3YmNvaHFzdndidmNxaWZnZmN0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODA2ODg4OSwiZXhwIjoyMDgzNjQ0ODg5fQ.yMAo9_R7RW__wcHehNBF2yuFPR97ZhnvGm45L8-XqcI
SUPABASE_SECRET_KEY=sb_secret_aVbGqRInmwUkm6JtySNfDQ_R1sThkQh
SUPABASE_ACCESS_TOKEN=sbp_0a0ca2da6b7b26bb393cfdbb29861d4a76f80a5e

# Google Sheets Configuration
GOOGLE_SHEETS_SPREADSHEET_ID=1MqJFlBeGWLIzxOoeNKksfuiGNhSG8hIvKMF_r-kqCko
GOOGLE_SERVICE_ACCOUNT_EMAIL=reggap@reggap.iam.gserviceaccount.com
GOOGLE_SERVICE_ACCOUNT_KEY=-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQCl/458xvkGEx/K\nA6daqXcE7NEEEikNYClBZDD65gV7kybup1gISshX8a4s6X1eD0laxoH6krbE2F/t\nBmwuK7Rnw4D1MV/ApxDLARK/ZA1nQXkqBH6AddEko4g7G5QWdwDoM6HwX09XV8Ly\n2z882RZR7+mHI/KK8e0zEiZsno3o7WRLjtqMSK823M3Bdvy3Gm2tjVR6ikR1+9hO\nC/6/rpdI0YMAJ3XpCN6H4BAQR6ZeyYLo4rfI5fJlEK04F2XBfl/C2M7R3QPIDgXA\npy035JdFb08H3mmfNZ4ZdrAfyr3+Je/eZOoFfSEYOSIRPA2HA1VfaJ4/jTGY1o8j\nItygOAqdAgMBAAECggEAFVv4iOAuX0R7MOp+8HjBRoo1S92NWDoBHPeoIMSTvIae\n+hLgzjJXLI+9vmwt1DpJ0UsdIvGZYGNKFozewyMfA8IBeCtJ+5dTnxdsguF8Iwbm\n8QvifiOKzXjYWOivyaM24+nu4qfU5PN3M3oYHTt+tnzVEu1CcnP2Nj3V4WCWeHvM\nOkrYmA8SjAPAME6AbcT6t1wbmDudiD5OAFZkwh+r7vOEGvZE7xmxk1AB0KNXiNYF\nQejAtRpWla0jWE88UXXtgXV+0ln6LNR3t8ElqjfEs+ZAYhDXoFDpZRDPEZSsHnpV\nO3wmUtNiaz8a/DyOBoxtw76GTFTEe+wBUXrmu84ceQKBgQDUmHMZ13R5bJJhKS1i\n2iEyTwtMVNm5n4koE8Tje8szZBvgODN/f9dc1Axh5B8h+yvnLFMZuVZNYUX4M9ch\nCtjYI4SCKseMCiipF7nRBlYAjhdGjHgQYoH9XUv+46VCibi7CSrmYvXaQLd3TFkl\nRvqxKT+zdyDM1YjAZdl8v5ZPNQKBgQDH46X5tMFuOvhOxD1nu/JwlXAs2sxN2mRS\nW1748fRfqY8OkyY7Dc4KnbdeKPdHcq3W4DF1hbRuvf4OhUrKhlrhgf0I78RAjKyJ\nyaJfA2w1/bUGmQmRuHwNLIPRn10ZbL9dDCHgwSVEQecCeFZ+ioC+IcQJaSak/owt\nk+UHHr2yyQKBgQDGpLvHxZ27Z0tPJd6WoyKpk1oHNLFL1Fmf7PjnZeB0YHH7jAfy\ndk2RG0GGplTAt6RKGQx82MRfASkTxbyZzzzWmDlUNwzFOSjM9rJVMQpi8mGlNdNp\n2+GCEA7WV3cvOOg3O1Wud4EpMZc8DUauoifUKaqv0fv/6PYicAhLm+iikQKBgQCx\ndZrZ2K7NtQ7Tpwc4/DQd3Z4MRGeTSqs8LqBfdTdWYot+Dgen7/aXmDO+JbJ7PQW2\nua1PP9fTZVuS+qVOrf8rK6NAdtUN1ZYscdV0cu5z9HztkZpcQ6PmcjnJNamKs/Ak\npGvDRNZYBgYYPEvV5hKsOf/3tuG3I8HBiQaQzqrteQKBgDRqKKKd9k9lbpIqx8XB\nEPkIQPHyiIsjCePb6GvpGIg43j+LPA+PtZGVAIQUObCZbXyRjT4VD+PQ3VIffBkh\nH0g7bsM7R6EXWQ8CKnbHU1jdrKcFxSDcQtL7u0zmTW/3zWaS9lYpFPyQje2dKlqw\nCL99xgQzdTjF28/bqI04Zop0\n-----END PRIVATE KEY-----\n
```

## 🔧 Funcionalidades Implementadas

### 1. **Sincronização Automática**
- ✅ **Criar**: Quando uma nova ocorrência é criada no Supabase, ela é automaticamente salva no Google Sheets
- ✅ **Atualizar**: Quando uma ocorrência é atualizada no Supabase, ela é automaticamente atualizada no Google Sheets
- ✅ **Deletar**: Quando uma ocorrência é deletada no Supabase, ela é automaticamente removida do Google Sheets

### 2. **Sincronização Manual**
- ✅ Endpoint API: `POST /api/sync-sheets`
- ✅ Sincroniza todas as ocorrências do Supabase para o Google Sheets
- ✅ Substitui todos os dados existentes na planilha

### 3. **Estrutura da Planilha**
- ✅ Aba: `Registros`
- ✅ Headers automáticos na primeira linha
- ✅ Ordem das colunas conforme definido no sistema

## 📝 Como Usar

### Sincronização Manual via API

```bash
# Usando curl
curl -X POST http://localhost:3000/api/sync-sheets

# Usando fetch no JavaScript
fetch('/api/sync-sheets', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
})
  .then(res => res.json())
  .then(data => console.log(data))
```

### Sincronização Manual via Código

```typescript
import { ocorrenciasApi } from '@/lib/supabase-client'

// Buscar todas as ocorrências e sincronizar
const ocorrencias = await ocorrenciasApi.getAll()
await ocorrenciasApi.syncAllToSheets(ocorrencias)
```

## 🔐 Permissões do Google Sheets

Certifique-se de que a service account `reggap@reggap.iam.gserviceaccount.com` tem permissão de **Editor** na planilha do Google Sheets.

## ⚠️ Observações Importantes

1. **Chave Privada**: A chave privada no `.env.local` deve manter os `\n` para quebras de linha
2. **ID da Planilha**: O ID está na URL do Google Sheets: `1MqJFlBeGWLIzxOoeNKksfuiGNhSG8hIvKMF_r-kqCko`
3. **Aba**: A aba será criada automaticamente com o nome `Registros` se não existir
4. **Headers**: Os headers são criados/atualizados automaticamente na primeira linha

## 🐛 Troubleshooting

### Erro: "Credenciais do Google Service Account não configuradas!"
- Verifique se as variáveis `GOOGLE_SERVICE_ACCOUNT_EMAIL` e `GOOGLE_SERVICE_ACCOUNT_KEY` estão no `.env.local`
- Reinicie o servidor Next.js após adicionar as variáveis

### Erro: "ID da planilha não configurado!"
- Verifique se `GOOGLE_SHEETS_SPREADSHEET_ID` está no `.env.local`

### Erro: "Aba não encontrada!"
- A aba será criada automaticamente na primeira sincronização
- Verifique se a service account tem permissão de Editor na planilha

### Sincronização não funciona
- Verifique os logs do console para erros específicos
- Certifique-se de que a service account tem acesso à planilha
- Verifique se o formato da chave privada está correto (com `\n`)

## 📚 Arquivos Criados/Modificados

- ✅ `src/lib/google-sheets-server.ts` - Módulo de integração com Google Sheets (server-side)
- ✅ `src/lib/supabase-client.ts` - Integração automática nas operações CRUD
- ✅ `src/app/api/sync-sheets/route.ts` - Endpoint para sincronização manual completa
- ✅ `src/app/api/sheets/save/route.ts` - Endpoint para salvar ocorrência
- ✅ `src/app/api/sheets/update/route.ts` - Endpoint para atualizar ocorrência
- ✅ `src/app/api/sheets/delete/route.ts` - Endpoint para deletar ocorrência
- ✅ `.env.local.example` - Exemplo de configuração

## 🔄 Arquitetura

A integração foi implementada usando **API Routes** do Next.js para garantir que o código do Google Sheets execute apenas no servidor (server-side), já que a biblioteca `googleapis` requer módulos Node.js que não estão disponíveis no navegador.

### Fluxo de Sincronização Automática:

1. **Cliente** → Operação CRUD no Supabase (create/update/delete)
2. **Cliente** → Chama API route correspondente (`/api/sheets/save`, `/api/sheets/update`, `/api/sheets/delete`)
3. **Servidor** → Executa operação no Google Sheets usando `googleapis`
4. **Servidor** → Retorna resultado para o cliente

Isso garante que:
- ✅ O código do Google Sheets não é incluído no bundle do cliente
- ✅ As credenciais ficam seguras no servidor
- ✅ A sincronização funciona tanto em desenvolvimento quanto em produção
