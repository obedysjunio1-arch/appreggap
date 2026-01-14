import { supabase, Ocorrencia, Cliente, TipoOcorrencia, TipoColaborador, Setor, Motivo, Status } from './supabase'

export const ocorrenciasApi = {
  async getAll(filters?: any) {
    let query = supabase
      .from('ocorrencias')
      .select('*')
      .order('data_criacao', { ascending: false })

    if (filters?.busca) {
      query = query.ilike('detalhamento', `%${filters.busca}%`)
    }

    if (filters?.periodo_inicio && filters?.periodo_fim) {
      query = query.gte('data_ocorrencia', filters.periodo_inicio)
        .lte('data_ocorrencia', filters.periodo_fim)
    }

    if (filters?.setor) {
      query = query.eq('setor', filters.setor)
    }

    if (filters?.motivo) {
      query = query.eq('motivo', filters.motivo)
    }

    if (filters?.tipo_ocorrencia) {
      query = query.eq('tipo_ocorrencia', filters.tipo_ocorrencia)
    }

    if (filters?.status) {
      query = query.eq('status', filters.status)
    }

    if (filters?.tipo_colaborador) {
      query = query.eq('tipo_colaborador', filters.tipo_colaborador)
    }

    if (filters?.vendedor) {
      query = query.eq('vendedor', filters.vendedor)
    }

    if (filters?.cliente) {
      query = query.eq('cliente', filters.cliente)
    }

    if (filters?.rede) {
      query = query.eq('rede', filters.rede)
    }

    if (filters?.cidade) {
      query = query.eq('cidade', filters.cidade)
    }

    if (filters?.uf) {
      query = query.eq('uf', filters.uf)
    }

    const { data, error } = await query
    if (error) throw error
    return data
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from('ocorrencias')
      .select('*')
      .eq('id', id)
      .single()
    if (error) throw error
    return data
  },

  async create(ocorrencia: Ocorrencia) {
    const { data, error } = await supabase
      .from('ocorrencias')
      .insert([{
        ...ocorrencia,
        data_criacao: new Date().toISOString(),
      }])
      .select()
      .single()
    if (error) throw error
    
    // Sincroniza com Google Sheets via API
    try {
      await fetch('/api/sheets/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
    } catch (sheetsError) {
      console.error('Erro ao sincronizar com Google Sheets:', sheetsError)
      // Não lança erro para não interromper o fluxo principal
    }
    
    return data
  },

  async update(id: string, ocorrencia: Partial<Ocorrencia>) {
    const { data, error } = await supabase
      .from('ocorrencias')
      .update(ocorrencia)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    
    // Sincroniza com Google Sheets via API
    try {
      await fetch('/api/sheets/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
    } catch (sheetsError) {
      console.error('Erro ao sincronizar com Google Sheets:', sheetsError)
      // Não lança erro para não interromper o fluxo principal
    }
    
    return data
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('ocorrencias')
      .delete()
      .eq('id', id)
    if (error) throw error
    
    // Remove do Google Sheets via API
    try {
      await fetch('/api/sheets/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
    } catch (sheetsError) {
      console.error('Erro ao remover do Google Sheets:', sheetsError)
      // Não lança erro para não interromper o fluxo principal
    }
  },

  async syncToSheets(ocorrencia: Ocorrencia) {
    // Sincroniza uma ocorrência específica com Google Sheets via API
    try {
      const response = await fetch('/api/sheets/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ocorrencia),
      })
      const result = await response.json()
      if (!result.success) throw new Error(result.error)
      return { success: true }
    } catch (error) {
      throw error
    }
  },

  async syncAllToSheets(ocorrencias: Ocorrencia[]) {
    // Sincroniza todas as ocorrências com Google Sheets via API
    try {
      const response = await fetch('/api/sync-sheets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      const result = await response.json()
      if (!result.success) throw new Error(result.error)
      return { success: true, count: result.count || ocorrencias.length }
    } catch (error) {
      throw error
    }
  }
}

export const clientesApi = {
  async getAll() {
    const { data, error } = await supabase
      .from('clientes')
      .select('*')
      .order('cliente')
    if (error) throw error
    return data
  },

  async create(cliente: Cliente) {
    const { data, error } = await supabase
      .from('clientes')
      .insert([cliente])
      .select()
      .single()
    if (error) throw error
    return data
  },

  async update(id: string, cliente: Partial<Cliente>) {
    const { data, error } = await supabase
      .from('clientes')
      .update(cliente)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('clientes')
      .delete()
      .eq('id', id)
    if (error) throw error
  }
}

export const tipoOcorrenciaApi = {
  async getAll() {
    const { data, error } = await supabase
      .from('tipo_ocorrencia')
      .select('*')
      .order('nome')
    if (error) throw error
    return data
  },

  async create(tipo: TipoOcorrencia) {
    const { data, error } = await supabase
      .from('tipo_ocorrencia')
      .insert([tipo])
      .select()
      .single()
    if (error) throw error
    return data
  },

  async update(id: string, tipo: Partial<TipoOcorrencia>) {
    const { data, error } = await supabase
      .from('tipo_ocorrencia')
      .update(tipo)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('tipo_ocorrencia')
      .delete()
      .eq('id', id)
    if (error) throw error
  }
}

export const tipoColaboradorApi = {
  async getAll() {
    const { data, error } = await supabase
      .from('tipo_colaborador')
      .select('*')
      .order('nome')
    if (error) throw error
    return data
  },

  async create(tipo: TipoColaborador) {
    const { data, error } = await supabase
      .from('tipo_colaborador')
      .insert([tipo])
      .select()
      .single()
    if (error) throw error
    return data
  },

  async update(id: string, tipo: Partial<TipoColaborador>) {
    const { data, error } = await supabase
      .from('tipo_colaborador')
      .update(tipo)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('tipo_colaborador')
      .delete()
      .eq('id', id)
    if (error) throw error
  }
}

export const setorApi = {
  async getAll() {
    const { data, error } = await supabase
      .from('setor')
      .select('*')
      .order('nome')
    if (error) throw error
    return data
  },

  async create(setor: Setor) {
    const { data, error } = await supabase
      .from('setor')
      .insert([setor])
      .select()
      .single()
    if (error) throw error
    return data
  },

  async update(id: string, setor: Partial<Setor>) {
    const { data, error } = await supabase
      .from('setor')
      .update(setor)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('setor')
      .delete()
      .eq('id', id)
    if (error) throw error
  }
}

export const motivoApi = {
  async getAll() {
    const { data, error } = await supabase
      .from('motivo')
      .select('*')
      .order('nome')
    if (error) throw error
    return data
  },

  async create(motivo: Motivo) {
    const { data, error } = await supabase
      .from('motivo')
      .insert([motivo])
      .select()
      .single()
    if (error) throw error
    return data
  },

  async update(id: string, motivo: Partial<Motivo>) {
    const { data, error } = await supabase
      .from('motivo')
      .update(motivo)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('motivo')
      .delete()
      .eq('id', id)
    if (error) throw error
  }
}

export const statusApi = {
  async getAll() {
    const { data, error } = await supabase
      .from('status')
      .select('*')
      .order('nome')
    if (error) throw error
    return data
  },

  async create(status: Status) {
    const { data, error } = await supabase
      .from('status')
      .insert([status])
      .select()
      .single()
    if (error) throw error
    return data
  },

  async update(id: string, status: Partial<Status>) {
    const { data, error } = await supabase
      .from('status')
      .update(status)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('status')
      .delete()
      .eq('id', id)
    if (error) throw error
  }
}
