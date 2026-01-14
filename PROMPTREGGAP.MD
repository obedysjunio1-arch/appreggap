PROMPT DEFINITIVO – CRIAÇÃO DO APP WEB PWA REGGAP
1. VISÃO GERAL DO APLICATIVO
Nome do App: REGGAP
Significado: Registro de GAP (Ocorrências, Falhas, Problemas)
Objetivo Principal:
Criar um aplicativo web PWA para registrar, acompanhar, analisar e medir ocorrências, falhas e problemas operacionais e comerciais, com foco em melhoria contínua de processos, tomada de decisão baseada em dados e geração de insights estratégicos.
Áreas de Atuação:
•	Logística
•	Comercial
Idioma Principal: Português – Brasil (pt-BR)
________________________________________
2. EXPERIÊNCIA, DESIGN E PORTABILIDADE
•	Tipo: Aplicativo Web PWA (Progressive Web App)
•	Compatibilidade: Desktop, Tablet e Mobile
•	Layout: 100% responsivo (mobile-first)
•	Estilo Visual:
o	Moderno
o	Profissional
o	Corporativo (SaaS Logístico)
o	Clean, com boa hierarquia visual
•	UX/UI:
o	Foco em produtividade
o	Fluxos rápidos de cadastro
o	Dashboards claros e intuitivos
________________________________________
3. STACK TECNOLÓGICA
Frontend
•	Framework: Next.js (App Router)
•	Linguagem: TypeScript
•	Estilização:
o	Tailwind CSS v4
o	ShadCN UI (componentes, modais, tabelas, filtros, cards, gráficos)
Backend / Dados
•	Banco Principal: Supabase (PostgreSQL)
•	Banco de Suporte: Google Sheets
o	Sincronização automática da tabela OCORRENCIAS do Supabase para o Google Sheets
Integrações Extras
•	WhatsApp (envio de relatórios e compartilhamento de ocorrências)
•	Exportações: HTML, PDF, CSV, XLSX
________________________________________
4. MODELAGEM DE DADOS (SUPABASE)
Tabelas e Valores Padrão
TIPO_COLAB
•	COLAB_SEPARAÇÃO
•	COLAB_QUALIDADE
•	COLAB_TRANSPORTE
•	COLAB_RECEBIMENTO
•	COLAB_ESTOQUE
•	COLAB_ADM_LOGISTICA
•	COLAB_VENDEDOR
•	COLAB_PROMOTOR
•	COLAB_ADM_COMERCIAL
TIPO_OCORRENCIA
•	DEVOLUCAO TOTAL
•	CANCELAMENTO
•	REFATURAMENTO
•	FALHA OPERACIONAL
•	FALHA COMERCIAL
•	FALHA DE PROCEDIMENTO
SETOR
•	QUALIDADE
•	COMERCIAL
•	TRANSPORTE
•	RECEBIMENTO
•	SEPARAÇÃO
•	ESTOQUE
•	ADMINISTRATIVO
MOTIVO
•	ERRO DE DIGITAÇÃO
•	DESACORDO
•	SEM PEDIDO
•	ATRASO NO RESUMO ROTAS
•	ATRASO LIB. MAPA
•	ERRO DE ESTOQUE
•	ERRO NO RECEBIMENTO
•	DIVERG. DE CADASTRO
•	DIVERG. DE QUALIDADE
•	ERRO DE SEPARAÇÃO
•	FALHA NO REPASSE
•	FALHA NA CONFERENCIA
•	MOROSIDADE NA VALIDAÇÃO
•	MOROSIDADE NO LANÇAMENTO
•	FURO DE PROCEDIMENTO
•	FALHA DE COMUNICAÇÃO
CLIENTES
•	Importados da planilha DADOSCLIENTES.xlsx
•	Campos esperados: Cliente, Rede, Cidade, UF, Vendedor
STATUS
•	EM ABERTO
•	FINALIZADO
________________________________________
5. TELA DE LOGIN
•	Login via Modal translúcido
•	Senha única: ocorrenciasdocemel
•	Botão de visualizar/ocultar senha
•	Background com imagem (BACKGROUND.PNG)
•	Logo central (LOGO.PNG)
•	Bloqueio total de acesso sem autenticação
________________________________________
6. TELA DASHBOARD (INTELIGÊNCIA E ANÁLISE)
Filtros Dinâmicos (ShadCN UI)
•	Busca livre (qualquer campo – digitacional)
•	Período:
o	Hoje, Ontem
o	Semana Atual / Anterior
o	Mês Atual / Anterior
o	Ano Atual / Anterior
•	Intervalo entre datas
•	Setor
•	Motivo
•	Tipo de Ocorrência
•	Status
•	Tipo de Colaborador
•	Vendedor
•	Cliente
•	Rede
•	Cidade
•	UF
Cards Indicadores (KPIs)
•	Nº total de Ocorrências
•	Nº de Refaturamentos
•	Valor total de Refaturamentos (R$)
•	Nº de Cancelamentos
•	Valor total de Cancelamentos (R$)
Gráficos (ShadCN UI)
•	Top 10 Motivos – Colunas (100% largura)
•	Top 10 Clientes – Colunas (100% largura)
•	Top 5 Tipo de Ocorrência – Colunas (lado esquerdo)
•	Top 5 Setores – Colunas (lado direito)
•	Top 5 Tipo de Colaborador – Pizza
•	Top 5 Redes – Pizza
Insights Inteligentes
•	Análises automáticas sobre:
o	Reincidência de problemas
o	Setores mais impactados
o	Motivos críticos
o	Clientes e redes com maior volume de ocorrências
o	Evolução temporal dos GAPs
Tabelas Analíticas
•	Top 3 Ocorrências por Setor x Motivo
•	Top 3 Ocorrências por Tipo_Colab x Motivo
•	Top 3 Ocorrências por Setor x Tipo_Ocorrência
•	Top 3 Ocorrências por Rede x Motivo
________________________________________
7. TELA OCORRÊNCIAS (CADASTRO)
Campos
•	Data da Ocorrência (auto preenchida – editável) [Obrigatório]
•	Setor Responsável [Obrigatório]
•	Tipo de Colaborador [Obrigatório]
•	Tipo de Ocorrência [Obrigatório]
•	Motivo [Obrigatório]
•	Cliente (lista Supabase) [Opcional]
•	Rede (auto pelo cliente – editável) [Opcional]
•	Cidade (auto pelo cliente – editável) [Opcional]
•	UF (auto pelo cliente – editável) [Opcional]
•	Vendedor (auto pelo cliente – editável) [Opcional]
•	Valor (numérico) [Opcional]
•	Detalhamento (texto livre) [Obrigatório]
•	Resultado [Opcional]
•	Tratativa [Opcional]
•	Status (default: EM ABERTO) [Obrigatório]
________________________________________
8. TELA RELATÓRIOS
Filtros
(Mesmos filtros do Dashboard)
Ações
•	Gerar Relatório HTML
•	Exportar PDF
•	Exportar CSV
•	Exportar XLSX
•	Enviar via WhatsApp
Tabela de Registros
•	Scroll horizontal (ScrollArea)
•	Ordenação:
1.	Status = EM ABERTO
2.	Data (mais recente)
•	Paginação: até 50 registros por página
Ações por Registro
•	Editar: Modal com todos os campos (atualiza Supabase + Google Sheets)
•	Excluir: Modal de confirmação (remove do App, Supabase e Sheets)
•	Compartilhar: Envio via WhatsApp com resumo formatado e emojis
________________________________________
9. TELA CONFIGURAÇÕES
Modais de Cadastro (CRUD Completo)
•	Clientes
•	Motivos
•	Tipo de Ocorrência
•	Tipo de Colaborador
•	Setor
•	Status
Todos os cadastros devem refletir exatamente as tabelas do Supabase, com sincronização total e imediata.
________________________________________
10. REQUISITOS EXTRAS IMPORTANTES
•	Validação de campos obrigatórios
•	Feedback visual (toasts, loaders, alerts)
•	Performance otimizada
•	Código limpo, organizado e escalável
•	Estrutura preparada para futuras permissões e perfis de usuário
•	PWA com suporte offline básico (cache de leitura)

11. MELHORIAS E MAIS IMPLEMENTAÇÕES

🔥 1. INTELIGÊNCIA, ANÁLISE E MELHORIA CONTÍNUA (CORE DO REGGAP)
📈 Indicadores Avançados (KPIs)
•	MTTR (Mean Time To Resolution)
→ Tempo médio para finalizar uma ocorrência
•	Taxa de Reincidência (%)
→ Ocorrências repetidas do mesmo motivo/setor/cliente
•	Índice de Impacto Financeiro
→ (Valor total / Nº de ocorrências (REFATURAMENTO E CANCELAMENTO E DEVOLUÇÃO)
•	Ranking de Gargalos
→ Motivos + Setores que mais geram GAP
•	Comparativo Mês x Mês / Ano x Ano
________________________________________
🧠 Insights Automáticos (quase “IA”)
•	“⚠️ O setor Separação teve aumento de +32% em falhas este mês”
•	“📉 O motivo Erro de Separação caiu após mudança de procedimento”
•	“🔥 Cliente X está entre os Top 3 reincidentes há 3 meses”
•	“💰 68% do impacto financeiro vem de apenas 3 motivos”
Esses insights aparecem em cards inteligentes, não só texto.
________________________________________
🚦 2. GESTÃO DE STATUS, SLA E PRIORIDADE
🕒 SLA e Prazo
•	Campo opcional: Prazo máximo de resolução
•	Contador visual:
o	🟢 Dentro do prazo
o	🟡 Próximo do vencimento
o	🔴 SLA estourado
________________________________________
🚨 Prioridade da Ocorrência
•	Baixa | Média | Alta | Crítica
•	Define:
o	Cor do registro
o	Ordem na tabela
o	Destaque no dashboard
________________________________________________________________________________
📤 7. RELATÓRIOS MAIS PODEROSOS
📄 Relatórios Inteligentes
•	Capa com:
o	Logo
Header
o	Período
o	Resumo executivo
•	Gráficos + tabelas
•	Insights automáticos no final
Footer
________________________________________
📲 WhatsApp
•	Resumo diário
•	Resumo semanal por setor
•	Emojis + formatação profissional
Exemplo:
📊 REGGAP – RESUMO SEMANAL

🔴 Ocorrências: 48
⚠️ Principais Motivos:
1️⃣ Erro de Separação (14)
2️⃣ Falha Comunicação (9)

💰 Impacto Financeiro: R$ 18.450,00
________________________________________
🔄 8. AUTOMAÇÕES
🤖 Regras Automáticas
•	Se Tipo = Cancelamento → exigir Valor
•	Se Tipo = Refaturamento → exigir Valor
Se Tipo = Devolução → exigir Valor
•	Se Status = Finalizado → exigir Resultado
________________________________________
⏰ Alertas
•	Ocorrência sem tratativa há X dias
•	SLA próximo do vencimento
•	Pico anormal de registros
________________________________________
📥 9. IMPORTAÇÃO E INTEGRAÇÃO
•	Importar ocorrências via Excel
•	Importar clientes em massa________________________________________
🎨 10. EXPERIÊNCIA DO USUÁRIO (UX DIFERENCIAL)
•	Modo Dark / Light
________________________________________
📱 11. PWA DE VERDADE
•	Instalação no celular
•	Uso offline (rascunho)
•	Sincronização automática ao reconectar
•	Ícone e splash screen personalizados

________________________________________
Resultado esperado:
Um aplicativo SaaS profissional, robusto, escalável e pronto para uso corporativo, focado em controle de GAPs, análise de falhas e melhoria contínua dos processos logísticos e comerciais.