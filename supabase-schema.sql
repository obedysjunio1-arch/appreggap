-- =====================================================
-- REGGAP - Estrutura do Banco de Dados
-- =====================================================
-- Execute este SQL no Supabase SQL Editor
-- =====================================================

-- 1. Tabela de Clientes
CREATE TABLE IF NOT EXISTS clientes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cliente TEXT NOT NULL,
  rede TEXT NOT NULL,
  cidade TEXT NOT NULL,
  uf TEXT NOT NULL,
  vendedor TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 2. Tabela de Tipo de Ocorrência
CREATE TABLE IF NOT EXISTS tipo_ocorrencia (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL UNIQUE,
  ativo BOOLEAN DEFAULT TRUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 3. Tabela de Tipo de Colaborador
CREATE TABLE IF NOT EXISTS tipo_colaborador (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL UNIQUE,
  ativo BOOLEAN DEFAULT TRUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 4. Tabela de Setor
CREATE TABLE IF NOT EXISTS setor (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL UNIQUE,
  ativo BOOLEAN DEFAULT TRUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 5. Tabela de Motivo
CREATE TABLE IF NOT EXISTS motivo (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL UNIQUE,
  ativo BOOLEAN DEFAULT TRUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 6. Tabela de Status
CREATE TABLE IF NOT EXISTS status (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL UNIQUE,
  ativo BOOLEAN DEFAULT TRUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 7. Tabela de Ocorrências
CREATE TABLE IF NOT EXISTS ocorrencias (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  data_criacao TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  data_conclusao TIMESTAMP WITH TIME ZONE,
  data_ocorrencia DATE NOT NULL,
  setor TEXT NOT NULL,
  tipo_colaborador TEXT NOT NULL,
  tipo_ocorrencia TEXT NOT NULL,
  motivo TEXT NOT NULL,
  cliente TEXT,
  rede TEXT,
  cidade TEXT,
  uf TEXT,
  vendedor TEXT,
  valor NUMERIC,
  detalhamento TEXT NOT NULL,
  resultado TEXT,
  tratativa TEXT,
  status TEXT NOT NULL,
  prazo_dias INTEGER,
  prioridade TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  CONSTRAINT check_status CHECK (status IN ('EM ABERTO', 'FINALIZADO')),
  CONSTRAINT check_prioridade CHECK (prioridade IN ('Baixa', 'Média', 'Alta', 'Crítica') OR prioridade IS NULL),
  CONSTRAINT check_valor CHECK (valor IS NULL OR valor >= 0)
);

-- =====================================================
-- ÍNDICES para performance
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_ocorrencias_data_criacao ON ocorrencias(data_criacao DESC);
CREATE INDEX IF NOT EXISTS idx_ocorrencias_data_ocorrencia ON ocorrencias(data_ocorrencia);
CREATE INDEX IF NOT EXISTS idx_ocorrencias_status ON ocorrencias(status);
CREATE INDEX IF NOT EXISTS idx_ocorrencias_setor ON ocorrencias(setor);
CREATE INDEX IF NOT EXISTS idx_ocorrencias_motivo ON ocorrencias(motivo);
CREATE INDEX IF NOT EXISTS idx_ocorrencias_tipo_ocorrencia ON ocorrencias(tipo_ocorrencia);
CREATE INDEX IF NOT EXISTS idx_ocorrencias_cliente ON ocorrencias(cliente);
CREATE INDEX IF NOT EXISTS idx_ocorrencias_rede ON ocorrencias(rede);
CREATE INDEX IF NOT EXISTS idx_ocorrencias_vendedor ON ocorrencias(vendedor);
CREATE INDEX IF NOT EXISTS idx_clientes_cliente ON clientes(cliente);

-- =====================================================
-- Função para atualizar updated_at automaticamente
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::text, NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para atualizar updated_at
CREATE TRIGGER update_clientes_updated_at BEFORE UPDATE ON clientes
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tipo_ocorrencia_updated_at BEFORE UPDATE ON tipo_ocorrencia
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tipo_colaborador_updated_at BEFORE UPDATE ON tipo_colaborador
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_setor_updated_at BEFORE UPDATE ON setor
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_motivo_updated_at BEFORE UPDATE ON motivo
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_status_updated_at BEFORE UPDATE ON status
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ocorrencias_updated_at BEFORE UPDATE ON ocorrencias
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- Inserção de dados iniciais (Defaults)
-- =====================================================

-- Tipo Ocorrência
INSERT INTO tipo_ocorrencia (nome, ativo) VALUES
  ('DEVOLUCAO TOTAL', TRUE),
  ('CANCELAMENTO', TRUE),
  ('REFATURAMENTO', TRUE),
  ('FALHA OPERACIONAL', TRUE),
  ('FALHA COMERCIAL', TRUE),
  ('FALHA DE PROCEDIMENTO', TRUE)
ON CONFLICT (nome) DO NOTHING;

-- Tipo Colaborador
INSERT INTO tipo_colaborador (nome, ativo) VALUES
  ('COLAB_SEPARAÇÃO', TRUE),
  ('COLAB_QUALIDADE', TRUE),
  ('COLAB_TRANSPORTE', TRUE),
  ('COLAB_RECEBIMENTO', TRUE),
  ('COLAB_ESTOQUE', TRUE),
  ('COLAB_ADM_LOGISTICA', TRUE),
  ('COLAB_VENDEDOR', TRUE),
  ('COLAB_PROMOTOR', TRUE),
  ('COLAB_ADM_COMERCIAL', TRUE)
ON CONFLICT (nome) DO NOTHING;

-- Setor
INSERT INTO setor (nome, ativo) VALUES
  ('QUALIDADE', TRUE),
  ('COMERCIAL', TRUE),
  ('TRANSPORTE', TRUE),
  ('RECEBIMENTO', TRUE),
  ('SEPARAÇÃO', TRUE),
  ('ESTOQUE', TRUE),
  ('ADMINISTRATIVO', TRUE)
ON CONFLICT (nome) DO NOTHING;

-- Motivo
INSERT INTO motivo (nome, ativo) VALUES
  ('ERRO DE DIGITAÇÃO', TRUE),
  ('DESACORDO', TRUE),
  ('SEM PEDIDO', TRUE),
  ('ATRASO NO RESUMO ROTAS', TRUE),
  ('ATRASO LIB. MAPA', TRUE),
  ('ERRO DE ESTOQUE', TRUE),
  ('ERRO NO RECEBIMENTO', TRUE),
  ('DIVERG. DE CADASTRO', TRUE),
  ('DIVERG. DE QUALIDADE', TRUE),
  ('ERRO DE SEPARAÇÃO', TRUE),
  ('FALHA NO REPASSE', TRUE),
  ('FALHA NA CONFERENCIA', TRUE),
  ('MOROSIDADE NA VALIDAÇÃO', TRUE),
  ('MOROSIDADE NO LANÇAMENTO', TRUE),
  ('FURO DE PROCEDIMENTO', TRUE),
  ('FALHA DE COMUNICAÇÃO', TRUE)
ON CONFLICT (nome) DO NOTHING;

-- Status
INSERT INTO status (nome, ativo) VALUES
  ('EM ABERTO', TRUE),
  ('FINALIZADO', TRUE)
ON CONFLICT (nome) DO NOTHING;

-- =====================================================
-- Row Level Security (RLS) - Habilitar RLS
-- =====================================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE tipo_ocorrencia ENABLE ROW LEVEL SECURITY;
ALTER TABLE tipo_colaborador ENABLE ROW LEVEL SECURITY;
ALTER TABLE setor ENABLE ROW LEVEL SECURITY;
ALTER TABLE motivo ENABLE ROW LEVEL SECURITY;
ALTER TABLE status ENABLE ROW LEVEL SECURITY;
ALTER TABLE ocorrencias ENABLE ROW LEVEL SECURITY;

-- Políticas de segurança simplificadas (para desenvolvimento)
-- Em produção, ajuste conforme necessário

CREATE POLICY "Permitir leitura pública para clientes"
ON clientes FOR SELECT USING (true);

CREATE POLICY "Permitir inserção pública para clientes"
ON clientes FOR INSERT WITH CHECK (true);

CREATE POLICY "Permitir atualização pública para clientes"
ON clientes FOR UPDATE USING (true);

CREATE POLICY "Permitir exclusão pública para clientes"
ON clientes FOR DELETE USING (true);

-- Políticas para tipo_ocorrencia
CREATE POLICY "Permitir tudo para tipo_ocorrencia"
ON tipo_ocorrencia FOR ALL USING (true);

-- Políticas para tipo_colaborador
CREATE POLICY "Permitir tudo para tipo_colaborador"
ON tipo_colaborador FOR ALL USING (true);

-- Políticas para setor
CREATE POLICY "Permitir tudo para setor"
ON setor FOR ALL USING (true);

-- Políticas para motivo
CREATE POLICY "Permitir tudo para motivo"
ON motivo FOR ALL USING (true);

-- Políticas para status
CREATE POLICY "Permitir tudo para status"
ON status FOR ALL USING (true);

-- Políticas para ocorrencias
CREATE POLICY "Permitir tudo para ocorrencias"
ON ocorrencias FOR ALL USING (true);

-- =====================================================
-- Concluído!
-- =====================================================

SELECT 'Estrutura do banco de dados REGGAP criada com sucesso!' AS mensagem;
