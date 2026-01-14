# 🚀 Guia de Instalação e Configuração - REGGAP

## 📋 Pré-requisitos

- Node.js 18+ instalado
- Conta no [Supabase](https://supabase.com) (gratuita)
- Navegador moderno (Chrome, Firefox, Edge, Safari)

---

## 🛠️ Passo 1: Configurar o Supabase

### 1.1 Criar Projeto no Supabase

1. Acesse [https://supabase.com](https://supabase.com)
2. Faça login ou crie uma conta
3. Clique em "New Project"
4. Preencha:
   - **Name**: REGGAP
   - **Database Password**: (anote esta senha)
   - **Region**: São Paulo (ou mais próxima)
5. Aguarde a criação do projeto (2-3 minutos)

### 1.2 Configurar o Banco de Dados

1. No painel do Supabase, clique em **SQL Editor** no menu lateral
2. Clique em "New Query"
3. Abra o arquivo `supabase-schema.sql` que está na pasta do projeto
4. Copie **TODO** o conteúdo do arquivo SQL
5. Cole no SQL Editor do Supabase
6. Clique em **Run** (ou pressione Ctrl+Enter)
7. Aguarde a mensagem: "Estrutura do banco de dados REGGAP criada com sucesso!"

### 1.3 Obter Credenciais

1. No menu lateral, clique em **Project Settings** (ícone de engrenagem)
2. Clique em **API**
3. Copie os seguintes valores:
   - **Project URL** (algo como: `https://xyzabc.supabase.co`)
   - **anon public** (chave longa começando com `eyJ...`)

---

## 🔧 Passo 2: Configurar o Projeto Local

### 2.1 Atualizar Variáveis de Ambiente

1. Abra o arquivo `.env.local` na pasta do projeto
2. Substitua os valores de exemplo pelas suas credenciais do Supabase:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://SEU-PROJETO.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=SUA-CHAVE-ANONIMA

# Google Sheets Integration (opcional)
GOOGLE_SHEETS_API_KEY=
GOOGLE_SHEETS_SPREADSHEET_ID=
```

3. Salve o arquivo

---

## 🚀 Passo 3: Executar o Aplicativo

### 3.1 Instalar Dependências (se já não instalou)

No terminal, dentro da pasta do projeto:

```bash
npm install
```

### 3.2 Iniciar o Servidor de Desenvolvimento

```bash
npm run dev
```

### 3.3 Acessar o Aplicativo

1. Abra o navegador
2. Acesse: `http://localhost:3000`
3. Você verá a tela de login

---

## 🔑 Passo 4: Fazer Login

### Senha Padrão

- **Usuário**: (não necessário)
- **Senha**: `ocorrenciasdocemel`

### Alterar a Senha

1. Abra o arquivo: `src/store/useAuth.ts`
2. Procure pela linha:
   ```typescript
   if (password === 'ocorrenciasdocemel') {
   ```
3. Substitua `'ocorrenciasdocemel'` pela senha desejada
4. Salve o arquivo

---

## 📊 Passo 5: Usar o Aplicativo

### Primeiro Uso

#### 1. Configurar Clientes
1. Faça login
2. Vá para **Configurações** no menu lateral
3. Clique na aba **Clientes**
4. Clique em "Novo Registro"
5. Adicione os clientes importando do Excel `DADOSCLIENTES.xlsx`

#### 2. Cadastrar Primeira Ocorrência
1. Vá para **Ocorrências** no menu
2. Preencha os campos obrigatórios (*)
3. Clique em "Salvar Ocorrência"

#### 3. Visualizar Dashboard
1. Vá para **Dashboard**
2. Veja os KPIs, gráficos e insights automáticos

#### 4. Gerar Relatórios
1. Vá para **Relatórios**
2. Aplique filtros se necessário
3. Clique em "Exportar PDF", "Exportar XLSX", etc.

---

## 📱 Passo 6: Instalar como PWA (Mobile)

### No Android (Chrome)
1. Abra `http://localhost:3000` no Chrome do celular
2. Clique no menu (três pontos)
3. Selecione "Adicionar à tela inicial"
4. O ícone do REGGAP aparecerá na tela inicial

### No iOS (Safari)
1. Abra `http://localhost:3000` no Safari do iPhone
2. Clique no botão de compartilhar (quadrado com seta)
3. Selecione "Adicionar à Tela de Início"

---

## 🌐 Passo 7: Publicar em Produção (Opcional)

### Usar Vercel (Recomendado)

1. Vá para [vercel.com](https://vercel.com)
2. Faça login com sua conta
3. Clique em "Add New Project"
4. Importe o repositório do REGGAP (GitHub, GitLab, etc.)
5. Configure as variáveis de ambiente:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
6. Clique em "Deploy"
7. Aguarde alguns minutos e o app estará online!

---

## 🔄 Integração com Google Sheets (Opcional)

### Configuração Avançada

A integração com Google Sheets permite sincronizar automaticamente todas as ocorrências para uma planilha.

#### Pré-requisitos
- Conta Google
- Google Cloud Project com API Sheets habilitada
- Service Account com credenciais JSON

#### Passos Básicos
1. Crie uma planilha no Google Sheets
2. Copie o ID da planilha (na URL)
3. Configure as credenciais no Supabase Edge Functions
4. Atualize as variáveis de ambiente no `.env.local`

**Nota**: Esta funcionalidade requer configuração adicional e conhecimento de Google Cloud APIs.

---

## 🐛 Solução de Problemas

### Problema: "Erro ao conectar com Supabase"

**Solução**:
1. Verifique se as credenciais no `.env.local` estão corretas
2. Verifique se o projeto Supabase está ativo
3. Tente recriar o banco de dados executando o SQL novamente

### Problema: "Erro ao carregar dados"

**Solução**:
1. Abra o console do navegador (F12)
2. Veja os erros na aba Console
3. Verifique se as tabelas foram criadas no Supabase
4. Verifique se as políticas RLS estão configuradas

### Problema: "Login não funciona"

**Solução**:
1. Verifique se a senha está correta: `ocorrenciasdocemel`
2. Limpe o cache do navegador
3. Tente usar uma janela de navegação anônima

### Problema: "PWA não instala"

**Solução**:
1. Verifique se está usando HTTPS (obrigatório em produção)
2. Em desenvolvimento, use `http://localhost`
3. Verifique se o manifesto PWA está sendo servido corretamente

---

## 📚 Recursos Adicionais

### Estrutura de Pastas

```
REGGAP/
├── src/
│   ├── app/              # Páginas Next.js (App Router)
│   │   ├── dashboard/   # Dashboard com KPIs e gráficos
│   │   ├── ocorrencias/ # Cadastro de ocorrências
│   │   ├── relatorios/  # Relatórios e exportações
│   │   └── configuracoes/# Configurações e CRUD
│   ├── components/       # Componentes React
│   │   ├── ui/         # Componentes ShadCN UI
│   │   ├── Login.tsx   # Tela de login
│   │   └── Layout.tsx  # Layout principal
│   ├── lib/            # Utilitários e Supabase client
│   └── store/          # Zustand stores (Auth, Theme)
├── public/             # Arquivos estáticos
├── supabase-schema.sql # Script SQL para criar tabelas
├── package.json        # Dependências
├── .env.local         # Variáveis de ambiente
└── README.md          # Documentação
```

### Principais Tecnologias

- **Next.js 14**: Framework React com App Router
- **TypeScript**: Tipagem estática
- **Tailwind CSS**: Estilização utility-first
- **ShadCN UI**: Componentes UI modernos
- **Supabase**: Backend como serviço (PostgreSQL + Auth)
- **Recharts**: Biblioteca de gráficos
- **Zustand**: Gerenciamento de estado
- **Next PWA**: Progressive Web App

---

## 📞 Suporte

Para dúvidas ou problemas:

1. Consulte o `README.md` para documentação técnica
2. Verifique os erros no console do navegador (F12)
3. Revise as configurações no Supabase

---

## ✅ Checklist de Configuração

- [ ] Projeto criado no Supabase
- [ ] Tabelas criadas via SQL
- [ ] Credenciais obtidas do Supabase
- [ ] `.env.local` configurado
- [ ] Dependências instaladas (`npm install`)
- [ ] Servidor iniciado (`npm run dev`)
- [ ] Login realizado com sucesso
- [ ] Clientes cadastrados
- [ ] Ocorrências registradas
- [ ] Dashboard visualizado
- [ ] Relatórios gerados
- [ ] Modo dark/light testado
- [ ] Responsividade verificada (mobile/tablet/desktop)

---

**Pronto! O REGGAP está configurado e pronto para uso! 🎉**
