'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import InternalLayout from '@/components/InternalLayout'

export const dynamic = 'force-dynamic'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/components/ui/use-toast'
import { 
  ocorrenciasApi, 
  clientesApi, 
  setorApi, 
  motivoApi, 
  tipoOcorrenciaApi, 
  tipoColaboradorApi 
} from '@/lib/supabase-client'
import { formatDate, getBrazilDateTime } from '@/lib/utils'
import { Plus, Save, ArrowLeft } from 'lucide-react'

interface Ocorrencia {
  id?: string
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

interface Cliente {
  cliente: string
  rede: string
  cidade: string
  uf: string
  vendedor: string
}

const STATUS = ['EM ABERTO', 'FINALIZADO']

const REINCIDENCIA = ['SIM', 'NÃO']

export default function OcorrenciasPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [setores, setSetores] = useState<string[]>([])
  const [motivos, setMotivos] = useState<string[]>([])
  const [tiposOcorrencia, setTiposOcorrencia] = useState<string[]>([])
  const [tiposColaborador, setTiposColaborador] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  const [formData, setFormData] = useState<Ocorrencia>({
    data_ocorrencia: (() => {
      const now = getBrazilDateTime()
      return now.toISOString().split('T')[0]
    })(),
    setor: '',
    tipo_colaborador: '',
    tipo_ocorrencia: '',
    motivo: '',
    detalhamento: '',
    status: 'EM ABERTO',
    reincidencia: 'NÃO',
  })

  useEffect(() => {
    loadFilterData()
  }, [])

  // Atualizar filtros quando a página receber foco
  useEffect(() => {
    const handleFocus = () => {
      loadFilterData()
    }
    
    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [])

  const loadFilterData = async () => {
    try {
      const [setoresData, motivosData, tiposOcorrenciaData, tiposColaboradorData, clientesData] = await Promise.all([
        setorApi.getAll(),
        motivoApi.getAll(),
        tipoOcorrenciaApi.getAll(),
        tipoColaboradorApi.getAll(),
        clientesApi.getAll(),
      ])

      // Filtrar apenas os ativos e extrair os nomes
      setSetores((setoresData || []).filter(s => s.ativo).map(s => s.nome))
      setMotivos((motivosData || []).filter(m => m.ativo).map(m => m.nome))
      setTiposOcorrencia((tiposOcorrenciaData || []).filter(t => t.ativo).map(t => t.nome))
      setTiposColaborador((tiposColaboradorData || []).filter(t => t.ativo).map(t => t.nome))
      setClientes(clientesData || [])
    } catch (error) {
      console.error('Erro ao carregar dados dos filtros:', error)
    }
  }

  const handleClienteChange = (value: string) => {
    const cliente = clientes.find(c => c.cliente === value)
    if (cliente) {
      setFormData({
        ...formData,
        cliente: cliente.cliente,
        rede: cliente.rede,
        cidade: cliente.cidade,
        uf: cliente.uf,
        vendedor: cliente.vendedor,
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validações de campos obrigatórios
    if (!formData.data_ocorrencia || !formData.setor || !formData.tipo_colaborador ||
        !formData.tipo_ocorrencia || !formData.motivo || !formData.detalhamento || !formData.status) {
      toast({
        variant: 'destructive',
        title: 'Campos obrigatórios',
        description: 'Preencha todos os campos obrigatórios.',
      })
      return
    }

    // Validação automática para tipos específicos
    if (['CANCELAMENTO', 'REFATURAMENTO', 'DEVOLUCAO TOTAL'].includes(formData.tipo_ocorrencia) && !formData.valor) {
      toast({
        variant: 'destructive',
        title: 'Campo obrigatório',
        description: 'Para este tipo de ocorrência, o campo Valor é obrigatório.',
      })
      return
    }

    if (formData.status === 'FINALIZADO' && !formData.resultado) {
      toast({
        variant: 'destructive',
        title: 'Campo obrigatório',
        description: 'Para finalizar uma ocorrência, o campo Resultado é obrigatório.',
      })
      return
    }

    setSaving(true)
    try {
      await ocorrenciasApi.create(formData)
      toast({
        title: 'Ocorrência registrada!',
        description: 'A ocorrência foi salva com sucesso.',
      })

      // Reset form
      const now = getBrazilDateTime()
      setFormData({
        data_ocorrencia: now.toISOString().split('T')[0],
        setor: '',
        tipo_colaborador: '',
        tipo_ocorrencia: '',
        motivo: '',
        detalhamento: '',
        status: 'EM ABERTO',
        reincidencia: 'NÃO',
        nf_anterior: undefined,
        nf_substituta: undefined,
      })
    } catch (error) {
      console.error('Erro ao salvar ocorrência:', error)
      toast({
        variant: 'destructive',
        title: 'Erro ao salvar',
        description: 'Não foi possível salvar a ocorrência.',
      })
    }
    setSaving(false)
  }

  return (
    <InternalLayout>
      <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Nova Ocorrência</h1>
          <p className="text-muted-foreground mt-1">
            Cadastre uma nova ocorrência, falha ou problema
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.push('/dashboard')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
        </div>
      </div>

      {/* Formulário */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Dados da Ocorrência
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Informações Básicas */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Informações Básicas</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="data_ocorrencia">
                    Data da Ocorrência <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="data_ocorrencia"
                    type="date"
                    value={formData.data_ocorrencia}
                    onChange={(e) => setFormData({ ...formData, data_ocorrencia: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="setor">
                    Setor Responsável <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={formData.setor}
                    onValueChange={(value) => setFormData({ ...formData, setor: value })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {setores.map((setor) => (
                        <SelectItem key={setor} value={setor}>
                          {setor}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tipo_colaborador">
                    Tipo de Colaborador <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={formData.tipo_colaborador}
                    onValueChange={(value) => setFormData({ ...formData, tipo_colaborador: value })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {tiposColaborador.map((tipo) => (
                        <SelectItem key={tipo} value={tipo}>
                          {tipo.replace(/_/g, ' ')}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tipo_ocorrencia">
                    Tipo de Ocorrência <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={formData.tipo_ocorrencia}
                    onValueChange={(value) => setFormData({ ...formData, tipo_ocorrencia: value })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {tiposOcorrencia.map((tipo) => (
                        <SelectItem key={tipo} value={tipo}>
                          {tipo.replace(/_/g, ' ')}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="motivo">
                    Motivo <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={formData.motivo}
                    onValueChange={(value) => setFormData({ ...formData, motivo: value })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {motivos.map((motivo) => (
                        <SelectItem key={motivo} value={motivo}>
                          {motivo.replace(/_/g, ' ')}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="valor">Valor (R$)</Label>
                  <Input
                    id="valor"
                    type="number"
                    step="0.01"
                    placeholder="0,00"
                    value={formData.valor || ''}
                    onChange={(e) => setFormData({ ...formData, valor: parseFloat(e.target.value) || undefined })}
                  />
                  {['CANCELAMENTO', 'REFATURAMENTO', 'DEVOLUCAO TOTAL'].includes(formData.tipo_ocorrencia) && (
                    <p className="text-xs text-destructive">Campo obrigatório para este tipo</p>
                  )}
                </div>
                
                {/* Campos NF ANTERIOR e NF SUBSTITUTA - Aparecem apenas para REFATURAMENTO, CANCELAMENTO ou DEVOLUCAO TOTAL */}
                {['REFATURAMENTO', 'CANCELAMENTO', 'DEVOLUCAO TOTAL'].includes(formData.tipo_ocorrencia) && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="nf_anterior">NF ANTERIOR (Opcional)</Label>
                      <Input
                        id="nf_anterior"
                        placeholder="Número da nota fiscal anterior"
                        value={formData.nf_anterior || ''}
                        onChange={(e) => setFormData({ ...formData, nf_anterior: e.target.value.toUpperCase() })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="nf_substituta">NF SUBSTITUTA (Opcional)</Label>
                      <Input
                        id="nf_substituta"
                        placeholder="Número da nota fiscal substituta"
                        value={formData.nf_substituta || ''}
                        onChange={(e) => setFormData({ ...formData, nf_substituta: e.target.value.toUpperCase() })}
                      />
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Informações do Cliente */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Informações do Cliente (Opcional)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cliente">Cliente</Label>
                  <Select
                    value={formData.cliente}
                    onValueChange={handleClienteChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {clientes.map((cliente) => (
                        <SelectItem key={cliente.cliente} value={cliente.cliente}>
                          {cliente.cliente}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="rede">Rede</Label>
                  <Input
                    id="rede"
                    value={formData.rede || ''}
                    onChange={(e) => setFormData({ ...formData, rede: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cidade">Cidade</Label>
                  <Input
                    id="cidade"
                    value={formData.cidade || ''}
                    onChange={(e) => setFormData({ ...formData, cidade: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="uf">UF</Label>
                  <Input
                    id="uf"
                    maxLength={2}
                    value={formData.uf || ''}
                    onChange={(e) => setFormData({ ...formData, uf: e.target.value.toUpperCase() })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="vendedor">Vendedor</Label>
                  <Input
                    id="vendedor"
                    value={formData.vendedor || ''}
                    onChange={(e) => setFormData({ ...formData, vendedor: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* Detalhamento */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Detalhamento</h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="detalhamento">
                    Detalhamento da Ocorrência <span className="text-destructive">*</span>
                  </Label>
                  <Textarea
                    id="detalhamento"
                    placeholder="Descreva detalhadamente a ocorrência..."
                    value={formData.detalhamento}
                    onChange={(e) => setFormData((prev) => ({ ...prev, detalhamento: e.target.value }))}
                    required
                    rows={4}
                    className="resize-none"
                    onInput={(e) => {
                      // Força re-render apenas quando necessário
                      const target = e.target as HTMLTextAreaElement
                      target.style.height = 'auto'
                      target.style.height = `${target.scrollHeight}px`
                    }}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tratativa">Tratativa (Opcional)</Label>
                  <Textarea
                    id="tratativa"
                    placeholder="Descreva a tratativa realizada..."
                    value={formData.tratativa || ''}
                    onChange={(e) => setFormData((prev) => ({ ...prev, tratativa: e.target.value }))}
                    rows={3}
                    className="resize-none"
                    onInput={(e) => {
                      const target = e.target as HTMLTextAreaElement
                      target.style.height = 'auto'
                      target.style.height = `${target.scrollHeight}px`
                    }}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="resultado">
                    Resultado {formData.status === 'FINALIZADO' && <span className="text-destructive">*</span>}
                  </Label>
                  <Textarea
                    id="resultado"
                    placeholder="Descreva o resultado final..."
                    value={formData.resultado || ''}
                    onChange={(e) => setFormData((prev) => ({ ...prev, resultado: e.target.value }))}
                    rows={3}
                    className="resize-none"
                    onInput={(e) => {
                      const target = e.target as HTMLTextAreaElement
                      target.style.height = 'auto'
                      target.style.height = `${target.scrollHeight}px`
                    }}
                  />
                  {formData.status === 'FINALIZADO' && (
                    <p className="text-xs text-destructive">Campo obrigatório para finalizar</p>
                  )}
                </div>
              </div>
            </div>

            {/* Status */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Status</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="status">
                    Status <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => setFormData({ ...formData, status: value })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS.map((status) => (
                        <SelectItem key={status} value={status}>
                          {status}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Reincidência - Último campo */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Reincidência</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="reincidencia">Reincidência</Label>
                  <Select
                    value={formData.reincidencia || 'NÃO'}
                    onValueChange={(value) => setFormData({ ...formData, reincidencia: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {REINCIDENCIA.map((reincidencia) => (
                        <SelectItem key={reincidencia} value={reincidencia}>
                          {reincidencia}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Botões */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/dashboard')}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={saving}>
                <Save className="w-4 h-4 mr-2" />
                {saving ? 'Salvando...' : 'Salvar Ocorrência'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
      </div>
    </InternalLayout>
  )
}
