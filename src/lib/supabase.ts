import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

if (!supabaseUrl || !supabaseAnonKey) {
  if (process.env.NODE_ENV === 'development') {
    console.error('⚠️ Variáveis de ambiente do Supabase não configuradas!')
    console.error('Certifique-se de que NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY estão definidas no arquivo .env.local')
  }
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
  },
})

export interface Ocorrencia {
  id?: string
  data_criacao?: string
  data_conclusao?: string
  data_ocorrencia: string
  setor: string
  tipo_colaborador: string
  tipo_ocorrencia: string
  motivo: string
  cliente?: string
  rede?: string
  cidade?: string
  uf?: string
  vendedor?: string
  valor?: number
  detalhamento: string
  resultado?: string
  tratativa?: string
  status: string
  reincidencia?: string
  nf_anterior?: string
  nf_substituta?: string
}

export interface Cliente {
  id?: string
  cliente: string
  rede: string
  cidade: string
  uf: string
  vendedor: string
}

export interface TipoOcorrencia {
  id?: string
  nome: string
  ativo: boolean
}

export interface TipoColaborador {
  id?: string
  nome: string
  ativo: boolean
}

export interface Setor {
  id?: string
  nome: string
  ativo: boolean
}

export interface Motivo {
  id?: string
  nome: string
  ativo: boolean
}

export interface Status {
  id?: string
  nome: string
  ativo: boolean
}
