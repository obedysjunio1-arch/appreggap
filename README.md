# REGGAP - Registro de GAP

Sistema de registro e acompanhamento de ocorrências, falhas e problemas operacionais com foco em melhoria contínua de processos.

## 🚀 Tecnologias

- **Frontend**: Next.js 14 (App Router)
- **Linguagem**: TypeScript
- **Estilização**: Tailwind CSS v4 + ShadCN UI
- **Banco de Dados**: Supabase (PostgreSQL)
- **Integrações**: Google Sheets, WhatsApp
- **PWA**: Next PWA
- **Gráficos**: Recharts

## 📋 Funcionalidades

### Dashboard Inteligente
- KPIs em tempo real (MTTR, Taxa de Reincidência, Impacto Financeiro)
- Gráficos interativos (Top 10 Motivos, Clientes, Setores, etc.)
- Insights automáticos com análises de dados
- Filtros dinâmicos avançados
- Tabelas analíticas cruzadas

### Cadastro de Ocorrências
- Formulário completo com validações
- Autopreenchimento de dados do cliente
- SLA e prioridade
- Validações automáticas por tipo de ocorrência

### Relatórios
- Filtros avançados
- Exportação para CSV, XLSX, PDF
- Compartilhamento via WhatsApp
- Tabela com ordenação inteligente (em aberto primeiro)
- Paginação

### Configurações
- CRUD completo para:
  - Clientes
  - Motivos
  - Tipo de Ocorrência
  - Tipo de Colaborador
  - Setor
  - Status

### Extras
- Modo Dark/Light
- Login com senha única
- PWA instalável
- Layout 100% responsivo (mobile-first)

## 🛠️ Instalação

1. Clone o repositório
```bash
git clone <repositorio>
cd REGGAP
```

2. Instale as dependências
```bash
npm install
```

3. Configure o Supabase
- Crie um projeto no [Supabase](https://supabase.com)
- Copie a URL e a Chave Anônima
- Crie as tabelas (veja abaixo)

4. Configure as variáveis de ambiente
- Copie `.env.local.example` para `.env.local`
- Preencha com suas credenciais do Supabase

5. Execute o projeto
```bash
npm run dev
```

6. Acesse: `http://localhost:3000`

## 📊 Estrutura do Banco de Dados

### Tabelas Principais

#### `ocorrencias`
- id (uuid, primary key)
- data_criacao (timestamp)
- data_ocorrencia (date)
- data_conclusao (timestamp)
- setor (text)
- tipo_colaborador (text)
- tipo_ocorrencia (text)
- motivo (text)
- cliente (text, opcional)
- rede (text, opcional)
- cidade (text, opcional)
- uf (text, opcional)
- vendedor (text, opcional)
- valor (numeric, opcional)
- detalhamento (text)
- resultado (text, opcional)
- tratativa (text, opcional)
- status (text)
- prazo_dias (integer, opcional)
- prioridade (text, opcional)

#### `clientes`
- id (uuid, primary key)
- cliente (text)
- rede (text)
- cidade (text)
- uf (text)
- vendedor (text)

#### `tipo_ocorrencia`
- id (uuid, primary key)
- nome (text)
- ativo (boolean)

#### `tipo_colaborador`
- id (uuid, primary key)
- nome (text)
- ativo (boolean)

#### `setor`
- id (uuid, primary key)
- nome (text)
- ativo (boolean)

#### `motivo`
- id (uuid, primary key)
- nome (text)
- ativo (boolean)

#### `status`
- id (uuid, primary key)
- nome (text)
- ativo (boolean)

## 🔒 Autenticação

- Senha padrão: `ocorrenciasdocemel`
- Modifique no arquivo `src/store/useAuth.ts`

## 📱 PWA

O aplicativo é instalável como PWA em dispositivos móveis.

### Instalação
1. Abra o app no navegador do celular
2. Clique em "Adicionar à Tela Inicial"
3. O ícone do REGGAP aparecerá na tela inicial

### Offline
- Cache básico para leitura offline
- Rascunhos salvos localmente
- Sincronização automática ao reconectar

## 📤 Exportação de Dados

### Formatos Suportados
- **CSV**: Compatível com Excel
- **XLSX**: Formato nativo do Excel
- **PDF**: Relatório formatado
- **WhatsApp**: Resumo com emojis

### Como Usar
1. Vá para a tela de Relatórios
2. Aplique os filtros desejados
3. Clique no botão de exportação escolhido

## 🌐 Integração com Google Sheets

O sistema sincroniza automaticamente as ocorrências para uma planilha do Google Sheets.

### Configuração
1. Crie uma planilha no Google Sheets
2. Copie o ID da planilha
3. Configure no Supabase (via Edge Functions)

## 📧 Suporte

Para dúvidas ou sugestões, entre em contato.

## 📄 Licença

Este projeto é proprietário e confidencial.

---

**Desenvolvido com ❤️ para REGGAP**
