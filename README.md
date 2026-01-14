# REGGAP - Sistema de Gestão de Ocorrências

<div align="center">

![REGGAP Logo](public/reggaplogo.png)

**Sistema completo de registro, acompanhamento e análise de ocorrências operacionais com foco em melhoria contínua de processos logísticos.**

[![Next.js](https://img.shields.io/badge/Next.js-14.1-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-green?style=flat-square&logo=supabase)](https://supabase.com)
[![PWA](https://img.shields.io/badge/PWA-Enabled-purple?style=flat-square&logo=pwa)](https://web.dev/progressive-web-apps/)

</div>

---

## 📋 Índice

- [Visão Geral](#-visão-geral)
- [Características Principais](#-características-principais)
- [Tecnologias Utilizadas](#-tecnologias-utilizadas)
- [Arquitetura do Sistema](#-arquitetura-do-sistema)
- [Instalação e Configuração](#-instalação-e-configuração)
- [Estrutura do Banco de Dados](#-estrutura-do-banco-de-dados)
- [Funcionalidades Detalhadas](#-funcionalidades-detalhadas)
- [Integrações](#-integrações)
- [Segurança](#-segurança)
- [Deploy](#-deploy)
- [Desenvolvimento](#-desenvolvimento)
- [Suporte](#-suporte)

---

## 🎯 Visão Geral

O **REGGAP** é uma solução empresarial desenvolvida para gerenciar de forma eficiente ocorrências, falhas e problemas operacionais em ambientes logísticos. O sistema oferece uma plataforma completa que permite desde o registro inicial de ocorrências até análises avançadas com insights automáticos, facilitando a tomada de decisões estratégicas e a melhoria contínua dos processos.

### Objetivos do Sistema

- **Centralização**: Unificar o registro de todas as ocorrências operacionais em um único sistema
- **Rastreabilidade**: Manter histórico completo e auditável de todas as ocorrências
- **Análise**: Fornecer ferramentas avançadas de análise e relatórios
- **Integração**: Sincronizar dados com sistemas externos (Google Sheets)
- **Acessibilidade**: Disponibilizar acesso via web e aplicativo móvel (PWA)

---

## ✨ Características Principais

### 🎨 Interface Moderna e Responsiva
- Design baseado em **ShadCN UI** com componentes acessíveis
- **Modo claro/escuro** automático
- Layout **100% responsivo** (mobile-first)
- Animações suaves e feedback visual em tempo real

### 📊 Dashboard Inteligente
- **KPIs em tempo real**: Taxa de Reincidência, Comparativo Semanal, Impacto Financeiro
- **Gráficos interativos**: Top 10 Motivos, Clientes, Setores, Tipos de Ocorrência
- **Insights automáticos**: Análises inteligentes com recomendações
- **Filtros dinâmicos**: Sistema de filtragem avançado com atualização automática
- **Tabelas analíticas cruzadas**: Análises combinadas de múltiplas dimensões

### 📝 Gestão de Ocorrências
- **Formulário completo** com validações em tempo real
- **Autopreenchimento** de dados do cliente
- **Campos condicionais** baseados no tipo de ocorrência
- **Histórico completo** de alterações
- **Edição inline** de status e prioridade

### 📈 Relatórios Avançados
- **Múltiplos formatos de exportação**: CSV, XLSX (formatado), PDF
- **Filtros avançados** aplicáveis aos relatórios
- **Gráficos interativos** no relatório HTML
- **Compartilhamento via WhatsApp**
- **Paginação inteligente** com ordenação customizada

### ⚙️ Configurações Centralizadas
- **CRUD completo** para todas as entidades de suporte
- **Ativação/desativação** de registros
- **Sincronização automática** com filtros do sistema
- **Interface intuitiva** com scroll areas para grandes volumes

### 📱 Progressive Web App (PWA)
- **Instalável** em dispositivos móveis (Android e iOS)
- **Funcionalidade offline** básica
- **Notificações** (futuro)
- **Ícone personalizado** na tela inicial

---

## 🛠️ Tecnologias Utilizadas

### Frontend
- **[Next.js 14.1](https://nextjs.org/)** - Framework React com App Router
- **[TypeScript](https://www.typescriptlang.org/)** - Tipagem estática
- **[Tailwind CSS](https://tailwindcss.com/)** - Framework CSS utility-first
- **[ShadCN UI](https://ui.shadcn.com/)** - Componentes acessíveis e customizáveis
- **[Recharts](https://recharts.org/)** - Biblioteca de gráficos React
- **[Chart.js](https://www.chartjs.org/)** - Gráficos para relatórios HTML

### Backend & Banco de Dados
- **[Supabase](https://supabase.com/)** - Backend-as-a-Service
  - PostgreSQL como banco de dados
  - Row Level Security (RLS) para segurança
  - APIs REST automáticas
  - Real-time subscriptions (futuro)

### Integrações
- **[Google Sheets API](https://developers.google.com/sheets/api)** - Sincronização automática
- **WhatsApp Web** - Compartilhamento de relatórios

### Ferramentas de Desenvolvimento
- **[Next PWA](https://github.com/shadowwalker/next-pwa)** - Suporte PWA
- **[XLSX](https://sheetjs.com/)** - Manipulação de planilhas Excel
- **[jsPDF](https://github.com/parallax/jsPDF)** - Geração de PDFs
- **[date-fns](https://date-fns.org/)** - Manipulação de datas
- **[Zustand](https://github.com/pmndrs/zustand)** - Gerenciamento de estado

---

## 🏗️ Arquitetura do Sistema

### Estrutura de Pastas

```
REGGAP/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/               # API Routes (Google Sheets)
│   │   ├── dashboard/         # Página do Dashboard
│   │   ├── ocorrencias/       # Página de Cadastro
│   │   ├── relatorios/        # Página de Relatórios
│   │   └── configuracoes/     # Página de Configurações
│   ├── components/            # Componentes React
│   │   ├── ui/               # Componentes ShadCN UI
│   │   └── ...               # Componentes customizados
│   ├── lib/                   # Bibliotecas e utilitários
│   │   ├── supabase.ts       # Cliente Supabase
│   │   ├── supabase-client.ts # API client
│   │   ├── google-sheets-server.ts # Integração Google Sheets
│   │   └── utils.ts          # Funções utilitárias
│   └── store/                 # Estado global (Zustand)
├── public/                    # Arquivos estáticos
│   ├── manifest.json         # Manifest PWA
│   └── reggaplogo.png        # Logo do aplicativo
├── supabase-schema.sql       # Schema do banco de dados
└── package.json              # Dependências do projeto
```

### Fluxo de Dados

```
┌─────────────┐
│   Cliente   │
└──────┬──────┘
       │
       ▼
┌─────────────────┐
│  Next.js App    │
│  (Frontend)     │
└──────┬──────────┘
       │
       ├──────────────┐
       │              │
       ▼              ▼
┌─────────────┐  ┌──────────────┐
│  Supabase   │  │ Google Sheets│
│  (PostgreSQL)│  │   (Sync)     │
└─────────────┘  └──────────────┘
```

---

## 🚀 Instalação e Configuração

### Pré-requisitos

- **Node.js** 18.x ou superior
- **npm** ou **yarn**
- Conta no [Supabase](https://supabase.com) (gratuita)
- Conta no [Google Cloud](https://cloud.google.com) (para integração com Sheets - opcional)

### Passo 1: Clonar o Repositório

```bash
git clone <repository-url>
cd REGGAP
```

### Passo 2: Instalar Dependências

```bash
npm install
```

### Passo 3: Configurar Supabase

1. **Criar projeto no Supabase**:
   - Acesse [https://supabase.com](https://supabase.com)
   - Crie um novo projeto
   - Anote a **URL do projeto** e a **chave anônima (anon key)**

2. **Configurar o banco de dados**:
   - No painel do Supabase, vá em **SQL Editor**
   - Execute o script `supabase-schema.sql` que está na raiz do projeto
   - Isso criará todas as tabelas, índices e políticas RLS necessárias

### Passo 4: Configurar Variáveis de Ambiente

Crie um arquivo `.env.local` na raiz do projeto:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anon-aqui

# Google Sheets Integration (Opcional)
GOOGLE_SHEETS_SPREADSHEET_ID=seu-spreadsheet-id
GOOGLE_SERVICE_ACCOUNT_EMAIL=seu-service-account@projeto.iam.gserviceaccount.com
GOOGLE_SERVICE_ACCOUNT_KEY=-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n

# App URL (para PWA e metadata)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

> **⚠️ Importante**: Nunca commite o arquivo `.env.local` no repositório. Ele já está no `.gitignore`.

### Passo 5: Executar o Projeto

```bash
# Modo desenvolvimento
npm run dev

# Build para produção
npm run build

# Executar produção
npm start
```

O aplicativo estará disponível em `http://localhost:3000`

### Passo 6: Configurar Autenticação

O sistema utiliza autenticação simples com senha única. Para alterar a senha padrão:

1. Abra `src/store/useAuth.ts`
2. Modifique a constante `CORRECT_PASSWORD`
3. Reinicie o servidor

> **🔒 Segurança**: Em produção, considere implementar autenticação mais robusta (JWT, OAuth, etc.)

---

## 📊 Estrutura do Banco de Dados

### Tabelas Principais

#### `ocorrencias`
Tabela central do sistema, armazena todas as ocorrências registradas.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | UUID | Identificador único (PK) |
| `data_criacao` | TIMESTAMP | Data/hora de criação do registro |
| `data_ocorrencia` | DATE | Data em que a ocorrência aconteceu |
| `setor` | TEXT | Setor responsável |
| `tipo_colaborador` | TEXT | Tipo de colaborador envolvido |
| `tipo_ocorrencia` | TEXT | Tipo da ocorrência |
| `motivo` | TEXT | Motivo da ocorrência |
| `cliente` | TEXT | Cliente afetado (opcional) |
| `rede` | TEXT | Rede do cliente (opcional) |
| `cidade` | TEXT | Cidade (opcional) |
| `uf` | TEXT | Estado (opcional) |
| `vendedor` | TEXT | Vendedor responsável (opcional) |
| `valor` | NUMERIC | Valor financeiro envolvido (opcional) |
| `detalhamento` | TEXT | Detalhamento da ocorrência |
| `tratativa` | TEXT | Tratativa aplicada (opcional) |
| `resultado` | TEXT | Resultado final (opcional) |
| `status` | TEXT | Status atual (EM ABERTO / FINALIZADO) |
| `reincidencia` | TEXT | Indica se é reincidência (SIM / NÃO) |
| `nf_anterior` | TEXT | NF anterior (condicional) |
| `nf_substituta` | TEXT | NF substituta (condicional) |

#### Tabelas de Suporte

- **`clientes`**: Cadastro de clientes
- **`tipo_ocorrencia`**: Tipos de ocorrência disponíveis
- **`tipo_colaborador`**: Tipos de colaboradores
- **`setor`**: Setores da empresa
- **`motivo`**: Motivos de ocorrências
- **`status`**: Status disponíveis

Todas as tabelas de suporte possuem:
- `id` (UUID, PK)
- `nome` (TEXT)
- `ativo` (BOOLEAN) - para soft delete
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

### Índices e Performance

O banco possui índices otimizados para:
- Busca por cliente
- Filtros por data
- Filtros por setor/motivo/tipo
- Ordenação por data de criação

### Row Level Security (RLS)

Todas as tabelas possuem RLS habilitado. As políticas atuais permitem:
- **Leitura**: Pública (para desenvolvimento)
- **Escrita**: Pública (para desenvolvimento)

> **⚠️ Produção**: Ajuste as políticas RLS conforme necessário para seu ambiente de produção.

---

## 🎯 Funcionalidades Detalhadas

### Dashboard

#### KPIs Principais
- **Taxa de Reincidência**: Percentual de ocorrências marcadas como reincidentes
- **Comparativo Semanal**: Comparação entre semana atual e anterior
- **Impacto Financeiro**: Soma total dos valores das ocorrências
- **Taxa de Resolução**: Percentual de ocorrências finalizadas

#### Gráficos Disponíveis
1. **Top 10 Motivos de Ocorrência** - Gráfico de barras horizontal
2. **Top 10 Clientes com Mais Ocorrências** - Gráfico de barras horizontal
3. **Top 5 Tipos de Ocorrência** - Gráfico de barras horizontal
4. **Top 5 Setores** - Gráfico de barras horizontal
5. **Top 5 Tipos de Colaborador** - Gráfico radar
6. **Top 5 Redes** - Gráfico radar
7. **Evolução no Tempo** - Gráfico de área com filtros de período

#### Insights Automáticos
O sistema gera insights baseados em:
- Concentração de ocorrências por setor
- Taxa de reincidência
- Motivo mais frequente
- Impacto financeiro
- Taxa de resolução
- Cliente com mais ocorrências

### Cadastro de Ocorrências

- **Formulário completo** com validação em tempo real
- **Campos condicionais**: NF Anterior e NF Substitua aparecem apenas para tipos específicos
- **Autopreenchimento**: Ao selecionar um cliente, preenche automaticamente rede, cidade, UF e vendedor
- **Conversão automática**: Todos os campos de texto convertem para maiúsculas
- **Validações**: Campos obrigatórios são validados antes do envio

### Relatórios

#### Filtros Disponíveis
- Período (início e fim)
- Setor
- Motivo
- Tipo de Ocorrência
- Status
- Tipo de Colaborador
- Vendedor
- Cliente
- Rede
- Cidade
- UF
- Busca livre (no detalhamento)

#### Exportações
- **CSV**: Formato simples, compatível com Excel
- **XLSX**: Formato nativo Excel com formatação (cabeçalho verde, filtros automáticos)
- **PDF**: Relatório formatado com gráficos e tabelas
- **HTML**: Relatório interativo com gráficos Chart.js
- **WhatsApp**: Resumo formatado para compartilhamento

### Configurações

Interface centralizada para gerenciar:
- **Clientes**: CRUD completo com scroll areas
- **Tipo de Ocorrência**: Ativação/desativação
- **Tipo de Colaborador**: Ativação/desativação
- **Setor**: Ativação/desativação
- **Motivo**: Ativação/desativação
- **Status**: Ativação/desativação

Todas as alterações são refletidas automaticamente nos filtros do sistema.

---

## 🔗 Integrações

### Google Sheets

O sistema sincroniza automaticamente todas as ocorrências com uma planilha do Google Sheets.

#### Configuração

1. **Criar Service Account no Google Cloud**:
   - Acesse [Google Cloud Console](https://console.cloud.google.com)
   - Crie um projeto ou use existente
   - Habilite a API do Google Sheets
   - Crie uma Service Account
   - Baixe a chave JSON

2. **Compartilhar planilha com Service Account**:
   - Crie uma planilha no Google Sheets
   - Compartilhe com o email da Service Account (permissão de Editor)
   - Copie o ID da planilha (da URL)

3. **Configurar variáveis de ambiente**:
   - `GOOGLE_SHEETS_SPREADSHEET_ID`: ID da planilha
   - `GOOGLE_SERVICE_ACCOUNT_EMAIL`: Email da Service Account
   - `GOOGLE_SERVICE_ACCOUNT_KEY`: Chave privada (formato PEM)

#### Funcionalidades
- **Sincronização automática**: Toda criação/atualização/exclusão é refletida no Sheets
- **Sincronização completa**: Função para sincronizar todas as ocorrências de uma vez
- **Tratamento de erros**: Erros não interrompem o fluxo principal

---

## 🔒 Segurança

### Implementações de Segurança

1. **Row Level Security (RLS)**: Habilitado em todas as tabelas do Supabase
2. **Variáveis de Ambiente**: Credenciais sensíveis nunca expostas no código
3. **Validação de Entrada**: Todos os formulários possuem validação
4. **Sanitização**: Dados são sanitizados antes de exibição
5. **HTTPS**: Recomendado para produção
6. **Autenticação**: Sistema de login (pode ser expandido)

### Boas Práticas Implementadas

- ✅ Logs de produção removidos (apenas erros críticos)
- ✅ Credenciais em variáveis de ambiente
- ✅ `.gitignore` configurado para arquivos sensíveis
- ✅ Validação de tipos com TypeScript
- ✅ Tratamento de erros em todas as operações

### Recomendações para Produção

1. **Autenticação**: Implementar JWT ou OAuth
2. **RLS Policies**: Ajustar políticas do Supabase para seu caso de uso
3. **Rate Limiting**: Implementar limitação de requisições
4. **CORS**: Configurar CORS adequadamente
5. **HTTPS**: Usar sempre HTTPS em produção
6. **Backup**: Configurar backups automáticos do Supabase

---

## 🚢 Deploy

### Vercel (Recomendado)

1. **Conectar repositório**:
   - Acesse [Vercel](https://vercel.com)
   - Conecte seu repositório GitHub/GitLab

2. **Configurar variáveis de ambiente**:
   - Adicione todas as variáveis do `.env.local` no painel da Vercel

3. **Deploy automático**:
   - A cada push na branch principal, o deploy é automático

### Outras Plataformas

O projeto pode ser deployado em qualquer plataforma que suporte Next.js:
- **Netlify**
- **AWS Amplify**
- **Railway**
- **DigitalOcean App Platform**
- **Self-hosted** (Docker, PM2, etc.)

### Build de Produção

```bash
npm run build
npm start
```

---

## 💻 Desenvolvimento

### Scripts Disponíveis

```bash
# Desenvolvimento
npm run dev          # Inicia servidor de desenvolvimento

# Build
npm run build        # Cria build de produção
npm start           # Executa build de produção

# Qualidade
npm run lint        # Executa ESLint
```

### Estrutura de Componentes

Os componentes seguem a arquitetura do ShadCN UI:
- Componentes base em `src/components/ui/`
- Componentes customizados em `src/components/`
- Hooks customizados quando necessário

### Padrões de Código

- **TypeScript**: Tipagem estrita habilitada
- **ESLint**: Configurado com regras do Next.js
- **Prettier**: Formatação automática (recomendado)
- **Convenções**: Nomes em camelCase, componentes em PascalCase

### Contribuindo

1. Crie uma branch para sua feature
2. Faça suas alterações
3. Execute `npm run lint` e `npm run build`
4. Crie um Pull Request

---

## 📱 PWA - Progressive Web App

O REGGAP é um PWA completo, permitindo instalação em dispositivos móveis.

### Instalação no Android

1. Abra o app no Chrome
2. Toque no menu (3 pontos)
3. Selecione "Adicionar à tela inicial"
4. O ícone aparecerá na tela inicial

### Instalação no iOS

1. Abra o app no Safari
2. Toque no botão de compartilhar
3. Selecione "Adicionar à Tela de Início"
4. O ícone aparecerá na tela inicial

### Funcionalidades PWA

- ✅ Instalável
- ✅ Ícone personalizado
- ✅ Tema colorido
- ✅ Modo standalone
- ⏳ Cache offline (em desenvolvimento)
- ⏳ Notificações push (futuro)

---

## 📚 Documentação Adicional

- [Instruções de Instalação](INSTRUCOES.md)
- [Configuração Google Sheets](INSTRUCOES_GOOGLE_SHEETS.md)
- [Guia de Deploy](DEPLOY.md)
- [Schema do Banco de Dados](supabase-schema.sql)

---

## 🐛 Troubleshooting

### Problemas Comuns

**Erro: "Variáveis de ambiente do Supabase não configuradas"**
- Verifique se o arquivo `.env.local` existe
- Confirme que as variáveis estão corretas
- Reinicie o servidor após alterar `.env.local`

**Erro: "Failed to fetch" ao carregar dados**
- Verifique a conexão com a internet
- Confirme que a URL do Supabase está correta
- Verifique as políticas RLS no Supabase

**PWA não instala no celular**
- Certifique-se de estar usando HTTPS (ou localhost)
- Verifique se o `manifest.json` está acessível
- Limpe o cache do navegador

**Erro ao exportar para Google Sheets**
- Verifique as credenciais da Service Account
- Confirme que a planilha foi compartilhada com o email da Service Account
- Verifique os logs do servidor

---

## 📞 Suporte

Para dúvidas, sugestões ou problemas:

- **Issues**: Abra uma issue no repositório
- **Email**: Entre em contato com a equipe de desenvolvimento

---

## 📄 Licença

Este projeto é proprietário e confidencial. Todos os direitos reservados.

---

## 🙏 Agradecimentos

Desenvolvido com as seguintes tecnologias open-source:
- Next.js
- React
- Supabase
- ShadCN UI
- E todas as outras bibliotecas listadas em `package.json`

---

<div align="center">

**Desenvolvido com ❤️ para REGGAP**

*Sistema de Gestão de Ocorrências - Versão 1.0*

</div>
