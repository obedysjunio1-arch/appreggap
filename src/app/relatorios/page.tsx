'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import InternalLayout from '@/components/InternalLayout'

export const dynamic = 'force-dynamic'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useToast } from '@/components/ui/use-toast'
import { 
  ocorrenciasApi, 
  clientesApi, 
  setorApi, 
  motivoApi, 
  tipoOcorrenciaApi, 
  tipoColaboradorApi 
} from '@/lib/supabase-client'
import { 
  formatCurrency, 
  formatDate, 
  calculateRecurrenceRate, 
  calculateFinancialImpact,
  getWeekComparison
} from '@/lib/utils'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  ArrowLeft,
  Download,
  FileSpreadsheet,
  FileText,
  Share2,
  Trash2,
  Edit,
  Search,
  Filter,
  RefreshCw,
  X,
} from 'lucide-react'
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

interface Ocorrencia {
  id: string
  data_criacao: string
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

// Função helper para quebrar texto em linhas (usada antes de gerar HTML)
function breakTextIntoLinesTS(text: string, maxWordsPerLine: number = 3): string {
  const words = text.replace(/_/g, ' ').split(' ').filter(w => w.length > 0)
  const lines: string[] = []
  let currentLine: string[] = []
  
  words.forEach((word, index) => {
    currentLine.push(word)
    if (currentLine.length >= maxWordsPerLine || index === words.length - 1) {
      lines.push(currentLine.join(' '))
      currentLine = []
    }
  })
  
  return lines.length > 0 ? lines.join(' ') : text
}

// Função helper para quebrar o nome em até 3 palavras (1 palavra por linha) - usado antes de gerar HTML
function breakLabelIntoMax3WordsTS(text: string): string[] {
  if (!text) return []

  const words = text.trim().split(/\s+/)

  if (words.length <= 3) {
    return words
  }

  return [
    words[0],
    words[1],
    words.slice(2).join(' ')
  ]
}

export default function RelatoriosPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [ocorrencias, setOcorrencias] = useState<Ocorrencia[]>([])
  const [filteredOcorrencias, setFilteredOcorrencias] = useState<Ocorrencia[]>([])
  const [loading, setLoading] = useState(true)
  
  // Dados das tabelas de configuração para os filtros
  const [setores, setSetores] = useState<string[]>([])
  const [motivos, setMotivos] = useState<string[]>([])
  const [tiposOcorrencia, setTiposOcorrencia] = useState<string[]>([])
  const [tiposColaborador, setTiposColaborador] = useState<string[]>([])
  const [clientes, setClientes] = useState<Cliente[]>([])

  // Filtros
  const [busca, setBusca] = useState('')
  const [periodoInicio, setPeriodoInicio] = useState('')
  const [periodoFim, setPeriodoFim] = useState('')
  const [setor, setSetor] = useState('')
  const [motivo, setMotivo] = useState('')
  const [tipoOcorrencia, setTipoOcorrencia] = useState('')
  const [status, setStatus] = useState('')
  const [tipoColaborador, setTipoColaborador] = useState('')
  const [vendedor, setVendedor] = useState('')
  const [cliente, setCliente] = useState('')
  const [rede, setRede] = useState('')
  const [cidade, setCidade] = useState('')
  const [uf, setUf] = useState('')

  // Paginação
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 50

  // Dialogs
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [selectedOcorrencia, setSelectedOcorrencia] = useState<Ocorrencia | null>(null)
  const [editFormData, setEditFormData] = useState<Partial<Ocorrencia>>({})

  // Carregar dados das tabelas de configuração para os filtros
  const fetchFilterData = useCallback(async () => {
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
  }, [])

  const fetchData = useCallback(async () => {
    try {
      const data = await ocorrenciasApi.getAll()
      setOcorrencias(data || [])
      setFilteredOcorrencias(data || [])
      setLoading(false)
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
      toast({
        variant: 'destructive',
        title: 'Erro ao carregar dados',
        description: 'Não foi possível carregar as ocorrências.',
      })
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    fetchFilterData()
    fetchData()
  }, [fetchFilterData, fetchData])

  // Atualizar filtros quando a página receber foco (usuário voltou de outra tela)
  useEffect(() => {
    const handleFocus = () => {
      fetchFilterData()
    }
    
    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [fetchFilterData])

  const handleClearFilters = () => {
    setBusca('')
    setPeriodoInicio('')
    setPeriodoFim('')
    setSetor('')
    setMotivo('')
    setTipoOcorrencia('')
    setStatus('')
    setTipoColaborador('')
    setVendedor('')
    setCliente('')
    setRede('')
    setCidade('')
    setUf('')
    setCurrentPage(1)
    toast({
      title: 'Filtros limpos',
      description: 'Todos os filtros foram removidos.',
    })
  }

  const applyFilters = useCallback(() => {
    let filtered = [...ocorrencias]

    if (busca) {
      filtered = filtered.filter(o =>
        o.detalhamento.toLowerCase().includes(busca.toLowerCase()) ||
        (o.cliente && o.cliente.toLowerCase().includes(busca.toLowerCase())) ||
        (o.rede && o.rede.toLowerCase().includes(busca.toLowerCase())) ||
        (o.vendedor && o.vendedor.toLowerCase().includes(busca.toLowerCase()))
      )
    }

    if (periodoInicio) {
      filtered = filtered.filter(o => o.data_ocorrencia >= periodoInicio)
    }

    if (periodoFim) {
      filtered = filtered.filter(o => o.data_ocorrencia <= periodoFim)
    }

    if (setor) filtered = filtered.filter(o => o.setor === setor)
    if (motivo) filtered = filtered.filter(o => o.motivo === motivo)
    if (tipoOcorrencia) filtered = filtered.filter(o => o.tipo_ocorrencia === tipoOcorrencia)
    if (status) filtered = filtered.filter(o => o.status === status)
    if (tipoColaborador) filtered = filtered.filter(o => o.tipo_colaborador === tipoColaborador)
    if (vendedor) filtered = filtered.filter(o => o.vendedor === vendedor)
    if (cliente) filtered = filtered.filter(o => o.cliente === cliente)
    if (rede) filtered = filtered.filter(o => o.rede === rede)
    if (cidade) filtered = filtered.filter(o => o.cidade === cidade)
    if (uf) filtered = filtered.filter(o => o.uf === uf)

    // Ordenar: EM ABERTO primeiro, depois por data
    filtered.sort((a, b) => {
      if (a.status === 'EM ABERTO' && b.status !== 'EM ABERTO') return -1
      if (a.status !== 'EM ABERTO' && b.status === 'EM ABERTO') return 1
      return new Date(b.data_criacao).getTime() - new Date(a.data_criacao).getTime()
    })

    setFilteredOcorrencias(filtered)
    setCurrentPage(1)
  }, [busca, periodoInicio, periodoFim, setor, motivo, tipoOcorrencia, status, tipoColaborador, vendedor, cliente, rede, cidade, uf, ocorrencias])

  useEffect(() => {
    applyFilters()
  }, [applyFilters])

  const handleExportCSV = () => {
    const headers = [
      'Data', 'Setor', 'Tipo Colab', 'Tipo Ocorrência', 'Motivo',
      'Cliente', 'Rede', 'Cidade', 'UF', 'Vendedor', 'Valor',
      'Status', 'Reincidência'
    ]

    const rows = filteredOcorrencias.map(o => [
      formatDate(o.data_ocorrencia),
      o.setor,
      o.tipo_colaborador.replace(/_/g, ' '),
      o.tipo_ocorrencia.replace(/_/g, ' '),
      o.motivo.replace(/_/g, ' '),
      o.cliente || '',
      o.rede || '',
      o.cidade || '',
      o.uf || '',
      o.vendedor || '',
      o.valor ? formatCurrency(o.valor) : '',
      o.status,
      o.reincidencia || '',
    ])

    let csv = headers.join(',') + '\n'
    rows.forEach(row => {
      csv += row.map(cell => `"${cell}"`).join(',') + '\n'
    })

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `relatorio-reggap-${new Date().toISOString().split('T')[0]}.csv`
    link.click()

    toast({
      title: 'Relatório exportado',
      description: 'O arquivo CSV foi baixado com sucesso.',
    })
  }

  const handleExportXLSX = () => {
    // Preparar dados com todas as colunas
    const data = filteredOcorrencias.map(o => ({
      'Data Ocorrência': formatDate(o.data_ocorrencia),
      'Data Criação': formatDate(o.data_criacao),
      'Setor': o.setor,
      'Tipo Colaborador': o.tipo_colaborador.replace(/_/g, ' '),
      'Tipo Ocorrência': o.tipo_ocorrencia.replace(/_/g, ' '),
      'Motivo': o.motivo.replace(/_/g, ' '),
      'Cliente': o.cliente || '',
      'Rede': o.rede || '',
      'Cidade': o.cidade || '',
      'UF': o.uf || '',
      'Vendedor': o.vendedor || '',
      'Valor': o.valor || 0,
      'Status': o.status,
      'Reincidência': o.reincidencia || '',
      'NF Anterior': o.nf_anterior || '',
      'NF Substitua': o.nf_substituta || '',
      'Detalhamento': o.detalhamento || '',
      'Tratativa': o.tratativa || '',
      'Resultado': o.resultado || '',
    }))

    const ws = XLSX.utils.json_to_sheet(data)

    // Definir largura das colunas
    const colWidths = [
      { wch: 12 }, // Data Ocorrência
      { wch: 12 }, // Data Criação
      { wch: 15 }, // Setor
      { wch: 18 }, // Tipo Colaborador
      { wch: 18 }, // Tipo Ocorrência
      { wch: 25 }, // Motivo
      { wch: 20 }, // Cliente
      { wch: 15 }, // Rede
      { wch: 15 }, // Cidade
      { wch: 5 },  // UF
      { wch: 15 }, // Vendedor
      { wch: 12 }, // Valor
      { wch: 12 }, // Status
      { wch: 12 }, // Reincidência
      { wch: 15 }, // NF Anterior
      { wch: 15 }, // NF Substitua
      { wch: 40 }, // Detalhamento
      { wch: 40 }, // Tratativa
      { wch: 40 }, // Resultado
    ]
    ws['!cols'] = colWidths

    // Formatar cabeçalho (linha 1) - verde com texto branco em negrito
    const headerStyle = {
      fill: { fgColor: { rgb: '073e29' } }, // Verde #073e29
      font: { color: { rgb: 'FFFFFF' }, bold: true, sz: 11 },
      alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
      border: {
        top: { style: 'thin', color: { rgb: '000000' } },
        bottom: { style: 'thin', color: { rgb: '000000' } },
        left: { style: 'thin', color: { rgb: '000000' } },
        right: { style: 'thin', color: { rgb: '000000' } },
      },
    }

    // Aplicar estilo ao cabeçalho
    const range = XLSX.utils.decode_range(ws['!ref'] || 'A1')
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const cellAddress = XLSX.utils.encode_cell({ r: 0, c: C })
      if (!ws[cellAddress]) continue
      ws[cellAddress].s = headerStyle
    }

    // Adicionar filtros automáticos (autofilter)
    if (ws['!ref']) {
      ws['!autofilter'] = { ref: ws['!ref'] }
    }

    // Criar workbook e adicionar worksheet
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Ocorrências')
    
    // Salvar arquivo
    XLSX.writeFile(wb, `relatorio-reggap-${new Date().toISOString().split('T')[0]}.xlsx`)

    toast({
      title: 'Relatório exportado',
      description: 'O arquivo XLSX foi baixado com sucesso com formatação completa.',
    })
  }

  const handleGenerateHTMLReport = () => {
    // Calcular KPIs
    const kpis = {
      totalOcorrencias: filteredOcorrencias.length,
      refaturamentos: filteredOcorrencias.filter((o) => o.tipo_ocorrencia === 'REFATURAMENTO').length,
      valorRefaturamentos: filteredOcorrencias
        .filter((o) => o.tipo_ocorrencia === 'REFATURAMENTO')
        .reduce((acc, o) => acc + (o.valor || 0), 0),
      cancelamentos: filteredOcorrencias.filter((o) => o.tipo_ocorrencia === 'CANCELAMENTO').length,
      valorCancelamentos: filteredOcorrencias
        .filter((o) => o.tipo_ocorrencia === 'CANCELAMENTO')
        .reduce((acc, o) => acc + (o.valor || 0), 0),
      emAberto: filteredOcorrencias.filter((o) => o.status === 'EM ABERTO').length,
      finalizadas: filteredOcorrencias.filter((o) => o.status === 'FINALIZADO').length,
      taxaReincidencia: calculateRecurrenceRate(filteredOcorrencias),
      impactoFinanceiro: calculateFinancialImpact(filteredOcorrencias),
      comparativoSemanal: getWeekComparison(filteredOcorrencias),
    }

    // Top 10 Motivos
    const topMotivos = Object.entries(
      filteredOcorrencias.reduce(
        (acc, o) => {
          acc[o.motivo] = (acc[o.motivo] || 0) + 1
          return acc
        },
        {} as Record<string, number>
      )
    )
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([motivo, count]) => ({ name: motivo.replace(/_/g, ' '), value: count }))

    // Top 10 Clientes
    const topClientes = Object.entries(
      filteredOcorrencias.reduce(
        (acc, o) => {
          if (o.cliente) {
            acc[o.cliente] = (acc[o.cliente] || 0) + 1
          }
          return acc
        },
        {} as Record<string, number>
      )
    )
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([cliente, count]) => ({ name: cliente, value: count }))

    // Top 5 Setores
    const topSetores = Object.entries(
      filteredOcorrencias.reduce(
        (acc, o) => {
          acc[o.setor] = (acc[o.setor] || 0) + 1
          return acc
        },
        {} as Record<string, number>
      )
    )
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([setor, count]) => ({ name: setor, value: count }))

    // Top 5 Tipo de Ocorrência
    const topTipoOcorrencia = Object.entries(
      filteredOcorrencias.reduce(
        (acc, o) => {
          acc[o.tipo_ocorrencia] = (acc[o.tipo_ocorrencia] || 0) + 1
          return acc
        },
        {} as Record<string, number>
      )
    )
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([tipo, count]) => ({ name: tipo.replace(/_/g, ' '), value: count }))

    // Top 5 Tipo de Colaborador
    const topTipoColaborador = Object.entries(
      filteredOcorrencias.reduce(
        (acc, o) => {
          acc[o.tipo_colaborador] = (acc[o.tipo_colaborador] || 0) + 1
          return acc
        },
        {} as Record<string, number>
      )
    )
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([tipo, count]) => ({ name: tipo.replace(/_/g, ' '), value: count }))

    // Top 5 Redes
    const topRedes = Object.entries(
      filteredOcorrencias.reduce(
        (acc, o) => {
          if (o.rede) {
            acc[o.rede] = (acc[o.rede] || 0) + 1
          }
          return acc
        },
        {} as Record<string, number>
      )
    )
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([rede, count]) => ({ name: rede, value: count }))

    // Evolução Temporal (por data de ocorrência) - formato DD/MM
    const porDataChart = filteredOcorrencias.reduce((acc, curr) => {
      const data = curr.data_ocorrencia
        ? format(new Date(curr.data_ocorrencia), 'dd/MM', { locale: ptBR })
        : 'Sem data'
      const valor = Number(curr.valor) || 0
      if (!acc[data]) {
        acc[data] = { count: 0, valor: 0 }
      }
      acc[data].count++
      acc[data].valor += valor
      return acc
    }, {} as Record<string, { count: number; valor: number }>)
    const porDataList = Object.entries(porDataChart)
      .map(([name, data]) => ({ name, count: data.count, valor: data.valor }))
      .sort((a, b) => {
        try {
          const dateA = new Date(a.name.split('/').reverse().join('-'))
          const dateB = new Date(b.name.split('/').reverse().join('-'))
          return dateA.getTime() - dateB.getTime()
        } catch {
          return 0
        }
      })

    // Por UF (quantidade de ocorrências, não valor)
    // Removido: Distribuição por UF - gráfico removido conforme solicitado
    const porUFList: Array<{ name: string; count: number; valor: number }> = []

    // Tabelas Analíticas Cruzadas (Top 10 de cada)
    
    // 1. Motivos x Setor
    const motivosXSetor: Record<string, number> = {}
    filteredOcorrencias.forEach((o) => {
      const key = `${o.motivo.replace(/_/g, ' ')} x ${o.setor}`
      motivosXSetor[key] = (motivosXSetor[key] || 0) + 1
    })
    const topMotivosXSetor = Object.entries(motivosXSetor)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([key, count]) => ({ key, count }))

    // 2. Clientes x Motivos
    const clientesXMotivos: Record<string, number> = {}
    filteredOcorrencias.forEach((o) => {
      if (o.cliente) {
        const key = `${o.cliente.substring(0, 30)} x ${o.motivo.replace(/_/g, ' ')}`
        clientesXMotivos[key] = (clientesXMotivos[key] || 0) + 1
      }
    })
    const topClientesXMotivos = Object.entries(clientesXMotivos)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([key, count]) => ({ key, count }))

    // 3. Tipo Colab x Motivos
    const tipoColabXMotivos: Record<string, number> = {}
    filteredOcorrencias.forEach((o) => {
      const key = `${o.tipo_colaborador.replace(/_/g, ' ')} x ${o.motivo.replace(/_/g, ' ')}`
      tipoColabXMotivos[key] = (tipoColabXMotivos[key] || 0) + 1
    })
    const topTipoColabXMotivos = Object.entries(tipoColabXMotivos)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([key, count]) => ({ key, count }))

    // 4. Tipo Colab x Tipo Ocorrência
    const tipoColabXTipoOcorrencia: Record<string, number> = {}
    filteredOcorrencias.forEach((o) => {
      const key = `${o.tipo_colaborador.replace(/_/g, ' ')} x ${o.tipo_ocorrencia.replace(/_/g, ' ')}`
      tipoColabXTipoOcorrencia[key] = (tipoColabXTipoOcorrencia[key] || 0) + 1
    })
    const topTipoColabXTipoOcorrencia = Object.entries(tipoColabXTipoOcorrencia)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([key, count]) => ({ key, count }))

    // 5. Vendedor x Tipo Ocorrência
    const vendedorXTipoOcorrencia: Record<string, number> = {}
    filteredOcorrencias.forEach((o) => {
      if (o.vendedor) {
        const key = `${o.vendedor} x ${o.tipo_ocorrencia.replace(/_/g, ' ')}`
        vendedorXTipoOcorrencia[key] = (vendedorXTipoOcorrencia[key] || 0) + 1
      }
    })
    const topVendedorXTipoOcorrencia = Object.entries(vendedorXTipoOcorrencia)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([key, count]) => ({ key, count }))

    // 6. Vendedor x Motivo
    const vendedorXMotivo: Record<string, number> = {}
    filteredOcorrencias.forEach((o) => {
      if (o.vendedor) {
        const key = `${o.vendedor} x ${o.motivo.replace(/_/g, ' ')}`
        vendedorXMotivo[key] = (vendedorXMotivo[key] || 0) + 1
      }
    })
    const topVendedorXMotivo = Object.entries(vendedorXMotivo)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([key, count]) => ({ key, count }))

    // Insights
    const insightsList: string[] = []

    if (filteredOcorrencias.length > 0) {
      insightsList.push(
        `📊 Total de ${filteredOcorrencias.length} ocorrência(s) registrada(s) no período selecionado, totalizando R$ ${kpis.impactoFinanceiro.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} em impacto financeiro.`
      )
    }

    if (topSetores.length > 0) {
      const topSetor = topSetores[0]
      const totalSetor = topSetores.reduce((acc, s) => acc + s.value, 0)
      const percentual = Math.round((topSetor.value / totalSetor) * 100)
      insightsList.push(
        `⚠️ Setor "${topSetor.name}" concentra ${percentual}% de todas as ocorrências (${topSetor.value} casos). Recomenda-se revisão dos procedimentos.`
      )
    }

    if (kpis.taxaReincidencia > 30) {
      insightsList.push(
        `🔴 Alta taxa de reincidência de ${kpis.taxaReincidencia}%. É necessário revisar os procedimentos e implementar ações corretivas urgentes.`
      )
    }

    if (topClientes.length > 0 && kpis.impactoFinanceiro > 0) {
      const top1Percent = (topClientes[0].value / filteredOcorrencias.length) * 100
      if (top1Percent > 20) {
        insightsList.push(`⚠️ Cliente "${topClientes[0].name}" concentra ${top1Percent.toFixed(1)}% das ocorrências.`)
      }
    }

    if (topMotivos.length > 0) {
      const topMotivo = topMotivos[0]
      const totalMotivos = topMotivos.reduce((acc, m) => acc + m.value, 0)
      const percentual = Math.round((topMotivo.value / totalMotivos) * 100)
      if (percentual > 25) {
        insightsList.push(
          `⚠️ Motivo "${topMotivo.name}" representa ${percentual}% das ocorrências (${topMotivo.value} casos). Necessária análise detalhada.`
        )
      }
    }

    // Filtros aplicados
    const filtrosAplicados: string[] = []
    if (periodoInicio && periodoFim)
      filtrosAplicados.push(`Período: ${formatDate(periodoInicio)} a ${formatDate(periodoFim)}`)
    if (setor) filtrosAplicados.push(`Setor: ${setor}`)
    if (motivo) filtrosAplicados.push(`Motivo: ${motivo.replace(/_/g, ' ')}`)
    if (tipoOcorrencia) filtrosAplicados.push(`Tipo: ${tipoOcorrencia.replace(/_/g, ' ')}`)
    if (status) filtrosAplicados.push(`Status: ${status}`)
    if (cliente) filtrosAplicados.push(`Cliente: ${cliente}`)
    if (rede) filtrosAplicados.push(`Rede: ${rede}`)
    if (cidade) filtrosAplicados.push(`Cidade: ${cidade}`)
    if (uf) filtrosAplicados.push(`UF: ${uf}`)
    if (vendedor) filtrosAplicados.push(`Vendedor: ${vendedor}`)
    if (busca) filtrosAplicados.push(`Busca: "${busca}"`)

    // Formatar datas antes de usar no HTML
    const periodoText =
      periodoInicio && periodoFim
        ? `${formatDate(periodoInicio)} a ${formatDate(periodoFim)}`
        : 'Período não especificado'

    const dataAtual = formatDate(new Date())
    const dataHoraAtual = format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
    const dataHoraCompleta = format(new Date(), "dd/MM/yyyy 'às' HH:mm:ss", { locale: ptBR })
    const tituloRelatorio = `Relatório de Ocorrências REGGAP - ${dataAtual}`

    // Gerar HTML puro com Chart.js (similar ao exemplo)
    const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${tituloRelatorio}</title>
<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
<style>
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
  
  @page {
    size: A4 portrait;
    margin: 10mm 12mm;
  }
  
  body {
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    background: white;
    padding: 0;
    margin: 0;
    color: #333;
    font-size: 8px;
    width: 100%;
    max-width: 210mm;
    margin: 0 auto;
  }
  
  .page {
    width: 100%;
    max-width: 210mm;
    margin: 0 auto;
    padding: 5mm;
    page-break-after: auto;
    display: flex;
    flex-direction: column;
  }
  
  .header {
    background: linear-gradient(135deg, #073e29 0%, #0a4d33 100%);
    color: white;
    padding: 12px;
    border-radius: 6px;
    margin-bottom: 12px;
    display: flex;
    align-items: center;
    gap: 15px;
  }
  
  .header-logo {
    width: 50px;
    height: 50px;
    background: white;
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }
  
  .header-logo img {
    width: 100%;
    height: 100%;
    object-fit: contain;
    padding: 4px;
  }
  
  .header-content {
    flex: 1;
  }
  
  .header h1 {
    font-size: 18px;
    margin-bottom: 4px;
    font-weight: 700;
  }
  
  .header-info {
    font-size: 9px;
    opacity: 0.95;
    margin-bottom: 3px;
  }
  
  .kpi-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 6px;
    margin-bottom: 12px;
    page-break-inside: avoid;
    break-inside: avoid;
  }
  
  .kpi-grid-large {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
    margin-bottom: 12px;
    margin-top: 12px;
    page-break-inside: avoid;
    break-inside: avoid;
  }
  
  .kpi-card-large {
    border: 2px solid #073e29;
    border-radius: 8px;
    padding: 12px;
    background: linear-gradient(135deg, #f0fdf4 0%, #ffffff 100%);
    page-break-inside: avoid;
    break-inside: avoid;
  }
  
  .kpi-title-large {
    font-size: 11px;
    color: #073e29;
    margin-bottom: 8px;
    text-transform: uppercase;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  
  .kpi-value-large {
    font-size: 32px;
    font-weight: bold;
    color: #073e29;
    margin-bottom: 6px;
    line-height: 1.2;
  }
  
  .kpi-desc-large {
    font-size: 9px;
    color: #065f46;
    margin-top: 4px;
    font-weight: 600;
  }
  
  .kpi-card {
    border: 1px solid #ddd;
    border-radius: 6px;
    padding: 8px;
    background: #f9fafb;
    page-break-inside: avoid;
    break-inside: avoid;
  }
  
  .kpi-title {
    font-size: 7px;
    color: #666;
    margin-bottom: 3px;
    text-transform: uppercase;
    font-weight: 600;
  }
  
  .kpi-value {
    font-size: 13px;
    font-weight: bold;
    color: #073e29;
    margin-bottom: 2px;
  }
  
  .kpi-desc {
    font-size: 6px;
    color: #999;
    margin-top: 2px;
  }
  
  .filters-container {
    background: #f0fdf4;
    border: 1px solid #073e29;
    border-radius: 6px;
    padding: 8px;
    margin-bottom: 12px;
    page-break-inside: avoid;
    break-inside: avoid;
  }
  
  .filters-title {
    font-size: 10px;
    font-weight: bold;
    color: #073e29;
    margin-bottom: 4px;
  }
  
  .filters-list {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
  }
  
  .filter-tag {
    background: #d1fae5;
    color: #065f46;
    padding: 3px 8px;
    border-radius: 3px;
    font-size: 7px;
    font-weight: 600;
  }
  
  .chart-section {
    margin-bottom: 10px;
    page-break-inside: avoid;
    break-inside: avoid;
  }
  
  .chart-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
    margin-bottom: 10px;
    page-break-inside: avoid;
    break-inside: avoid;
  }
  
  .chart-title {
    font-size: 11px;
    font-weight: bold;
    margin-bottom: 6px;
    color: #073e29;
    border-bottom: 2px solid #073e29;
    padding-bottom: 3px;
  }

  .chart-container {
    border: 1px solid #ddd;
    border-radius: 6px;
    padding: 8px;
    background: white;
    height: 160px;
    position: relative;
    width: 100%;
    page-break-inside: avoid;
    break-inside: avoid;
    overflow: hidden;
  }
  
  .analytical-tables-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
    margin-bottom: 15px;
    page-break-inside: avoid;
    break-inside: avoid;
  }
  
  .analytical-table-container {
    border: 1px solid #ddd;
    border-radius: 6px;
    padding: 8px;
    background: white;
    page-break-inside: avoid;
    break-inside: avoid;
  }
  
  .analytical-table-title {
    font-size: 10px;
    font-weight: bold;
    color: #073e29;
    margin-bottom: 6px;
    border-bottom: 2px solid #073e29;
    padding-bottom: 3px;
  }
  
  .analytical-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 7px;
    margin-top: 6px;
  }
  
  .analytical-table thead {
    background: #073e29;
    color: white;
  }
  
  .analytical-table th {
    padding: 5px 4px;
    text-align: left;
    font-weight: bold;
    font-size: 7px;
    border: 1px solid #073e29;
  }
  
  .analytical-table td {
    padding: 4px;
    border: 1px solid #ddd;
    color: #333;
    font-size: 7px;
  }
  
  .analytical-table tbody tr:nth-child(even) {
    background: #f9fafb;
  }
  
  .analytical-table tbody tr:hover {
    background: #f0fdf4;
  }
  
  .insights-container {
    border: 1px solid #ddd;
    border-radius: 6px;
    padding: 8px;
    background: #f0fdf4;
    margin-bottom: 10px;
    page-break-inside: avoid;
    break-inside: avoid;
  }
  
  .insights-title {
    font-size: 11px;
    font-weight: bold;
    color: #073e29;
    margin-bottom: 6px;
    border-bottom: 2px solid #073e29;
    padding-bottom: 3px;
  }
  
  .insight-item {
    font-size: 8px;
    margin-bottom: 4px;
    padding-left: 6px;
    line-height: 1.4;
    color: #333;
  }
  
  .data-table-section {
    margin-top: 12px;
    margin-bottom: 12px;
    page-break-inside: avoid;
    break-inside: avoid;
  }
  
  .data-table-title {
    font-size: 12px;
    font-weight: bold;
    color: #073e29;
    margin-bottom: 8px;
    border-bottom: 2px solid #073e29;
    padding-bottom: 4px;
  }
  
  .data-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 7px;
    margin-bottom: 15px;
    page-break-inside: avoid;
    break-inside: avoid;
  }
  
  .data-table thead {
    background: #073e29;
    color: white;
  }
  
  .data-table th {
    padding: 6px 4px;
    text-align: left;
    font-weight: bold;
    font-size: 7px;
  }
  
  .data-table td {
    padding: 4px;
    border: 1px solid #ddd;
    color: #333;
    word-wrap: break-word;
    word-break: break-word;
    overflow-wrap: break-word;
  }
  
  .data-table td.detalhamento-cell {
    max-width: 200px;
    white-space: normal;
    line-height: 1.4;
    font-size: 6.5px;
  }
  
  .data-table tbody tr:nth-child(even) {
    background: #f9fafb;
  }
  
  .footer {
    margin-top: auto;
    padding-top: 12px;
    border-top: 2px solid #073e29;
    text-align: center;
    font-size: 7px;
    color: #666;
    page-break-inside: avoid;
    break-inside: avoid;
  }
  
  @media print {
    body {
      padding: 0;
      margin: 0;
      width: 210mm;
      max-width: 210mm;
    }
    .page {
      padding: 0;
      margin: 0;
      width: 210mm;
      max-width: 210mm;
    }
    .no-print {
      display: none !important;
    }
    .chart-container, .data-table, .chart-grid, .chart-section, 
    .analytical-tables-grid, .analytical-table-container, .kpi-grid {
      page-break-inside: avoid !important;
      break-inside: avoid !important;
    }
    .header {
      page-break-after: avoid !important;
      break-after: avoid !important;
    }
    .kpi-grid, .filters-container, .insights-container {
      page-break-after: avoid !important;
      break-after: avoid !important;
    }
  }
</style>
</head>
<body>
<button class="no-print" onclick="window.print()" style="position: fixed; top: 10px; right: 10px; z-index: 1000; background: #073e29; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; font-weight: bold; box-shadow: 0 4px 6px rgba(0,0,0,0.3);">
  🖨️ Imprimir PDF
</button>

<div class="page">
  <div class="header">
    <div class="header-logo">
      <img src="/logo.png" alt="Logo REGGAP" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">
      <span style="display:none; font-size: 14px; font-weight: bold; color: #073e29;">RG</span>
    </div>
    <div class="header-content">
      <h1>REGGAP - Relatório de Ocorrências</h1>
      <div class="header-info">Gerado em: ${dataHoraAtual}</div>
      <div class="header-info">Período: ${periodoText}</div>
    </div>
  </div>
  
  ${filtrosAplicados.length > 0 ? `
  <div class="filters-container">
    <div class="filters-title">Filtros Aplicados</div>
    <div class="filters-list">
      ${filtrosAplicados.map((f) => `<span class="filter-tag">${f}</span>`).join('')}
    </div>
  </div>
  ` : ''}
  
  <div class="kpi-grid">
    <div class="kpi-card">
      <div class="kpi-title">Total de Ocorrências</div>
      <div class="kpi-value">${kpis.totalOcorrencias}</div>
      <div class="kpi-desc">${kpis.emAberto} em aberto • ${kpis.finalizadas} finalizadas</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-title">Refaturamentos</div>
      <div class="kpi-value">${kpis.refaturamentos}</div>
      <div class="kpi-desc">R$ ${kpis.valorRefaturamentos.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-title">Cancelamentos</div>
      <div class="kpi-value">${kpis.cancelamentos}</div>
      <div class="kpi-desc">R$ ${kpis.valorCancelamentos.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-title">Impacto Financeiro</div>
      <div class="kpi-value">R$ ${kpis.impactoFinanceiro.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}</div>
      <div class="kpi-desc">Total</div>
    </div>
  </div>
  
  <!-- Comparativo Semanal e Taxa de Reincidência - Cards lado a lado -->
  <div class="kpi-grid-large">
    <div class="kpi-card-large">
      <div class="kpi-title-large">
        <span>Comparativo Semanal</span>
        <span style="font-size: 16px;">📊</span>
      </div>
      <div class="kpi-value-large" style="color: ${kpis.comparativoSemanal.isPositive ? '#059669' : '#dc2626'};">${kpis.comparativoSemanal.semanaAtual}</div>
      <div class="kpi-desc-large" style="color: ${kpis.comparativoSemanal.isPositive ? '#065f46' : '#dc2626'};">
        Semana Atual: ${kpis.comparativoSemanal.semanaAtual} ocorrências<br>
        Semana Anterior: ${kpis.comparativoSemanal.semanaAnterior} ocorrências<br>
        ${kpis.comparativoSemanal.isPositive ? '↑' : '↓'} ${Math.abs(kpis.comparativoSemanal.diferenca)} (${Math.abs(kpis.comparativoSemanal.percentual)}%)
      </div>
    </div>
    <div class="kpi-card-large">
      <div class="kpi-title-large">
        <span>Taxa de Reincidência</span>
        <span style="font-size: 16px;">📈</span>
      </div>
      <div class="kpi-value-large" style="color: ${kpis.taxaReincidencia > 30 ? '#dc2626' : '#073e29'};">${kpis.taxaReincidencia}%</div>
      <div class="kpi-desc-large" style="color: ${kpis.taxaReincidencia > 30 ? '#dc2626' : '#065f46'};">${kpis.taxaReincidencia > 30 ? '⚠️ Alta - Requer atenção urgente' : '✅ Controlada - Dentro dos parâmetros aceitáveis'}</div>
    </div>
  </div>
  
  <!-- Evolução no Tempo (Largura Total) -->
  ${porDataList.length > 0 ? `
  <div class="chart-section" style="width: 100%; margin-bottom: 15px;">
    <div class="chart-title">Evolução no Tempo (Valor)</div>
    <div class="chart-container" style="height: 200px;">
      <canvas id="chartEvolucao"></canvas>
    </div>
  </div>
  ` : '<div class="chart-section" style="width: 100%; margin-bottom: 15px;"><div class="chart-title">Evolução no Tempo</div><div class="chart-container" style="display: flex; align-items: center; justify-content: center; color: #999; font-size: 10px; height: 200px;">Sem dados</div></div>'}
  
  <!-- Seção 1: Top 10 Motivos de Ocorrência | Top 10 Clientes com Mais Ocorrências -->
  <div class="chart-grid">
    ${topMotivos.length > 0 ? `
    <div class="chart-section">
      <div class="chart-title">Top 10 Motivos de Ocorrência</div>
      <div class="chart-container">
        <canvas id="chartTopMotivos"></canvas>
      </div>
    </div>
    ` : '<div class="chart-section"><div class="chart-title">Top 10 Motivos de Ocorrência</div><div class="chart-container" style="display: flex; align-items: center; justify-content: center; color: #999; font-size: 10px;">Sem dados</div></div>'}
    
    ${topClientes.length > 0 ? `
    <div class="chart-section">
      <div class="chart-title">Top 10 Clientes com Mais Ocorrências</div>
      <div class="chart-container">
        <canvas id="chartTopClientes"></canvas>
      </div>
    </div>
    ` : '<div class="chart-section"><div class="chart-title">Top 10 Clientes com Mais Ocorrências</div><div class="chart-container" style="display: flex; align-items: center; justify-content: center; color: #999; font-size: 10px;">Sem dados</div></div>'}
  </div>
  
  <!-- Seção 2: Top 5 Tipos de Ocorrência | Top 5 Setores -->
  <div class="chart-grid">
    ${topTipoOcorrencia.length > 0 ? `
    <div class="chart-section">
      <div class="chart-title">Top 5 Tipos de Ocorrência</div>
      <div class="chart-container">
        <canvas id="chartTopTipoOcorrencia"></canvas>
      </div>
    </div>
    ` : '<div class="chart-section"><div class="chart-title">Top 5 Tipos de Ocorrência</div><div class="chart-container" style="display: flex; align-items: center; justify-content: center; color: #999; font-size: 10px;">Sem dados</div></div>'}
    
    ${topSetores.length > 0 ? `
    <div class="chart-section">
      <div class="chart-title">Top 5 Setores</div>
      <div class="chart-container">
        <canvas id="chartTopSetores"></canvas>
      </div>
    </div>
    ` : '<div class="chart-section"><div class="chart-title">Top 5 Setores</div><div class="chart-container" style="display: flex; align-items: center; justify-content: center; color: #999; font-size: 10px;">Sem dados</div></div>'}
  </div>
  
  <!-- Seção 3: Top 5 Tipos de Colaborador | Top 5 Redes -->
  <div class="chart-grid">
    ${topTipoColaborador.length > 0 ? `
    <div class="chart-section">
      <div class="chart-title">Top 5 Tipos de Colaborador</div>
      <div class="chart-container">
        <canvas id="chartTopTipoColaborador"></canvas>
      </div>
    </div>
    ` : '<div class="chart-section"><div class="chart-title">Top 5 Tipos de Colaborador</div><div class="chart-container" style="display: flex; align-items: center; justify-content: center; color: #999; font-size: 10px;">Sem dados</div></div>'}
    
    ${topRedes.length > 0 ? `
    <div class="chart-section">
      <div class="chart-title">Top 5 Redes</div>
      <div class="chart-container">
        <canvas id="chartTopRedes"></canvas>
      </div>
    </div>
    ` : '<div class="chart-section"><div class="chart-title">Top 5 Redes</div><div class="chart-container" style="display: flex; align-items: center; justify-content: center; color: #999; font-size: 10px;">Sem dados</div></div>'}
  </div>
  
  ${insightsList.length > 0 ? `
  <div class="insights-container">
    <div class="insights-title">💡 Insights Automáticos</div>
    ${insightsList.map((insight) => `<div class="insight-item">${insight}</div>`).join('')}
  </div>
  ` : ''}
  
  <!-- Tabelas Analíticas Cruzadas (Top 10 de cada, 2 por linha) -->
  <div class="analytical-tables-grid">
    ${topMotivosXSetor.length > 0 ? `
    <div class="analytical-table-container">
      <div class="analytical-table-title">Top 10: Motivos x Setor</div>
      <table class="analytical-table">
        <thead>
          <tr>
            <th>Combinação</th>
            <th style="text-align: center; width: 50px;">Qtd</th>
          </tr>
        </thead>
        <tbody>
          ${topMotivosXSetor.map((item) => `
            <tr>
              <td>${item.key.substring(0, 40)}${item.key.length > 40 ? '...' : ''}</td>
              <td style="text-align: center; font-weight: bold;">${item.count}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
    ` : '<div class="analytical-table-container"><div class="analytical-table-title">Top 10: Motivos x Setor</div><div style="text-align: center; padding: 20px; color: #999; font-size: 9px;">Sem dados</div></div>'}
    
    ${topClientesXMotivos.length > 0 ? `
    <div class="analytical-table-container">
      <div class="analytical-table-title">Top 10: Clientes x Motivos</div>
      <table class="analytical-table">
        <thead>
          <tr>
            <th>Combinação</th>
            <th style="text-align: center; width: 50px;">Qtd</th>
          </tr>
        </thead>
        <tbody>
          ${topClientesXMotivos.map((item) => `
            <tr>
              <td>${item.key.substring(0, 40)}${item.key.length > 40 ? '...' : ''}</td>
              <td style="text-align: center; font-weight: bold;">${item.count}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
    ` : '<div class="analytical-table-container"><div class="analytical-table-title">Top 10: Clientes x Motivos</div><div style="text-align: center; padding: 20px; color: #999; font-size: 9px;">Sem dados</div></div>'}
  </div>
  
  <div class="analytical-tables-grid">
    ${topTipoColabXMotivos.length > 0 ? `
    <div class="analytical-table-container">
      <div class="analytical-table-title">Top 10: Tipo Colab x Motivos</div>
      <table class="analytical-table">
        <thead>
          <tr>
            <th>Combinação</th>
            <th style="text-align: center; width: 50px;">Qtd</th>
          </tr>
        </thead>
        <tbody>
          ${topTipoColabXMotivos.map((item) => `
            <tr>
              <td>${item.key.substring(0, 40)}${item.key.length > 40 ? '...' : ''}</td>
              <td style="text-align: center; font-weight: bold;">${item.count}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
    ` : '<div class="analytical-table-container"><div class="analytical-table-title">Top 10: Tipo Colab x Motivos</div><div style="text-align: center; padding: 20px; color: #999; font-size: 9px;">Sem dados</div></div>'}
    
    ${topTipoColabXTipoOcorrencia.length > 0 ? `
    <div class="analytical-table-container">
      <div class="analytical-table-title">Top 10: Tipo Colab x Tipo Ocorrência</div>
      <table class="analytical-table">
        <thead>
          <tr>
            <th>Combinação</th>
            <th style="text-align: center; width: 50px;">Qtd</th>
          </tr>
        </thead>
        <tbody>
          ${topTipoColabXTipoOcorrencia.map((item) => `
            <tr>
              <td>${item.key.substring(0, 40)}${item.key.length > 40 ? '...' : ''}</td>
              <td style="text-align: center; font-weight: bold;">${item.count}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
    ` : '<div class="analytical-table-container"><div class="analytical-table-title">Top 10: Tipo Colab x Tipo Ocorrência</div><div style="text-align: center; padding: 20px; color: #999; font-size: 9px;">Sem dados</div></div>'}
  </div>
  
  <div class="analytical-tables-grid">
    ${topVendedorXTipoOcorrencia.length > 0 ? `
    <div class="analytical-table-container">
      <div class="analytical-table-title">Top 10: Vendedor x Tipo Ocorrência</div>
      <table class="analytical-table">
        <thead>
          <tr>
            <th>Combinação</th>
            <th style="text-align: center; width: 50px;">Qtd</th>
          </tr>
        </thead>
        <tbody>
          ${topVendedorXTipoOcorrencia.map((item) => `
            <tr>
              <td>${item.key.substring(0, 40)}${item.key.length > 40 ? '...' : ''}</td>
              <td style="text-align: center; font-weight: bold;">${item.count}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
    ` : '<div class="analytical-table-container"><div class="analytical-table-title">Top 10: Vendedor x Tipo Ocorrência</div><div style="text-align: center; padding: 20px; color: #999; font-size: 9px;">Sem dados</div></div>'}
    
    ${topVendedorXMotivo.length > 0 ? `
    <div class="analytical-table-container">
      <div class="analytical-table-title">Top 10: Vendedor x Motivo</div>
      <table class="analytical-table">
        <thead>
          <tr>
            <th>Combinação</th>
            <th style="text-align: center; width: 50px;">Qtd</th>
          </tr>
        </thead>
        <tbody>
          ${topVendedorXMotivo.map((item) => `
            <tr>
              <td>${item.key.substring(0, 40)}${item.key.length > 40 ? '...' : ''}</td>
              <td style="text-align: center; font-weight: bold;">${item.count}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
    ` : '<div class="analytical-table-container"><div class="analytical-table-title">Top 10: Vendedor x Motivo</div><div style="text-align: center; padding: 20px; color: #999; font-size: 9px;">Sem dados</div></div>'}
  </div>
  
  ${filteredOcorrencias.length > 0 ? `
  <div class="data-table-section">
    <div class="data-table-title">Registros Detalhados (${filteredOcorrencias.length}${filteredOcorrencias.length > 100 ? ' - Mostrando primeiros 100' : ''})</div>
    <table class="data-table">
      <thead>
        <tr>
          <th>Data</th>
          <th>Setor</th>
          <th>Tipo</th>
          <th>Motivo</th>
          <th>Cliente</th>
          <th>Tipo Colab</th>
          <th>Valor</th>
          <th>Status</th>
          <th>Detalhamento</th>
        </tr>
      </thead>
      <tbody>
        ${filteredOcorrencias.slice(0, 100).map((item) => {
          let formattedDate = '-'
          try {
            if (item.data_ocorrencia) {
              formattedDate = formatDate(item.data_ocorrencia)
            }
          } catch {
            formattedDate = String(item.data_ocorrencia || '-')
          }
          const setorSafe = String(item.setor || '-')
          const tipoSafe = String(item.tipo_ocorrencia || '').replace(/_/g, ' ').substring(0, 15)
          const motivoSafe = String(item.motivo || '').replace(/_/g, ' ').substring(0, 20)
          const clienteSafe = String(item.cliente || '-').substring(0, 25)
          const tipoColabSafe = String(item.tipo_colaborador || '-').replace(/_/g, ' ').substring(0, 20)
          const valorFormat = (item.valor || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })
          const statusSafe = String(item.status || '-')
          const detalhamentoSafe = String(item.detalhamento || '-').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;')
          return '<tr>' +
            '<td>' + formattedDate + '</td>' +
            '<td>' + setorSafe + '</td>' +
            '<td>' + tipoSafe + '</td>' +
            '<td>' + motivoSafe + '</td>' +
            '<td>' + clienteSafe + '</td>' +
            '<td>' + tipoColabSafe + '</td>' +
            '<td><strong>R$ ' + valorFormat + '</strong></td>' +
            '<td>' + statusSafe + '</td>' +
            '<td class="detalhamento-cell">' + detalhamentoSafe + '</td>' +
            '</tr>'
        }).join('')}
      </tbody>
    </table>
  </div>
  ` : ''}
  
  <div class="footer">
    <p>REGGAP - Sistema de Gestão de Ocorrências | Grupo DoceMel</p>
    <p>Relatório gerado em ${dataHoraCompleta}</p>
  </div>
</div>

<script>
  Chart.defaults.font.size = 8;
  Chart.defaults.color = '#1f2937';
  Chart.defaults.borderColor = '#e5e7eb';
  
  // Função para quebrar texto em até 3 palavras por linha
  function breakTextIntoLines(text, maxWordsPerLine = 3) {
    const words = text.replace(/_/g, ' ').split(' ').filter(w => w.length > 0);
    const lines = [];
    let currentLine = [];
    
    words.forEach((word, index) => {
      currentLine.push(word);
      if (currentLine.length >= maxWordsPerLine || index === words.length - 1) {
        lines.push(currentLine.join(' '));
        currentLine = [];
      }
    });
    
    return lines.length > 0 ? lines : [text];
  }
  
  // Função para quebrar o nome em até 3 palavras (1 palavra por linha)
  function breakLabelIntoMax3Words(text) {
    if (!text) return [];

    const words = text.trim().split(/\\s+/);

    if (words.length <= 3) {
      return words;
    }

    return [
      words[0],
      words[1],
      words.slice(2).join(' ')
    ];
  }
  
  // Plugin para desenhar labels com quebra de linha no eixo X
  const xAxisLabelPlugin = {
    id: 'xAxisLabelPlugin',
    afterDraw: (chart) => {
      const ctx = chart.ctx;
      const xScale = chart.scales.x;
      if (!xScale) return;
      
      ctx.save();
      ctx.font = 'bold 8px Arial';
      ctx.fillStyle = '#1f2937';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      
      xScale.ticks.forEach((tick) => {
        const label = String(tick.label || '');
        const lines = breakTextIntoLines(label, 3);
        const x = tick.x;
        const y = xScale.bottom + 8;
        
        lines.forEach((line, lineIndex) => {
          ctx.fillText(line, x, y + (lineIndex * 10));
        });
      });
      
      ctx.restore();
    }
  };
  
  // Plugin para desenhar labels com quebra de linha em gráficos Radar
  const radarLabelPlugin = {
    id: 'radarLabelPlugin',
    afterDraw: (chart) => {
      const ctx = chart.ctx;
      const scale = chart.scales.r;
      if (!scale) return;
      
      const labels = chart.data.labels || [];
      const centerX = scale.xCenter;
      const centerY = scale.yCenter;
      const maxRadius = scale.drawingArea;
      
      ctx.save();
      ctx.font = 'bold 8px Arial';
      ctx.fillStyle = '#1f2937';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      labels.forEach((label, index) => {
        const angle = (index * 2 * Math.PI) / labels.length - Math.PI / 2;
        const labelRadius = maxRadius + 20;
        const x = centerX + Math.cos(angle) * labelRadius;
        const y = centerY + Math.sin(angle) * labelRadius;
        
        const labelText = String(label);
        const lines = breakTextIntoLines(labelText, 3);
        
        lines.forEach((line, lineIndex) => {
          const offsetY = (lineIndex - (lines.length - 1) / 2) * 10;
          ctx.fillText(line, x, y + offsetY);
        });
      });
      
      ctx.restore();
    }
  };
  
  const commonChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: '#073e29',
        borderWidth: 1,
        padding: 8,
        titleFont: { size: 9 },
        bodyFont: { size: 8 }
      }
    },
    scales: {
      x: {
        grid: { color: '#e5e7eb', drawBorder: false },
        ticks: { color: '#1f2937', font: { size: 7 }, maxRotation: 45, minRotation: 45 }
      },
      y: {
        grid: { color: '#e5e7eb', drawBorder: false },
        ticks: { color: '#1f2937', font: { size: 7 }, beginAtZero: true }
      }
    }
  };
  
  ${porDataList.length > 0 ? `
  // Gráfico de Evolução no Tempo (Area Chart com valores visíveis)
  const evolucaoData = ${JSON.stringify(porDataList.map((d) => ({ name: d.name, valor: d.valor })))};
  new Chart(document.getElementById('chartEvolucao'), {
    type: 'line',
    data: {
      labels: evolucaoData.map((d) => d.name),
      datasets: [{
        label: 'Valor Total (R$)',
        data: evolucaoData.map((d) => d.valor),
        borderColor: '#047857',
        backgroundColor: 'rgba(4, 120, 87, 0.2)',
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointBackgroundColor: '#047857',
        pointBorderColor: '#fff',
        pointBorderWidth: 2
      }]
    },
    options: {
      ...commonChartOptions,
      plugins: {
        ...commonChartOptions.plugins,
        legend: { display: true, position: 'bottom', labels: { color: '#1f2937', font: { size: 8 } } },
        tooltip: {
          ...commonChartOptions.plugins.tooltip,
          callbacks: {
            label: (context) => 'R$ ' + context.parsed.y.toLocaleString('pt-BR', { minimumFractionDigits: 2 })
          }
        },
      },
      scales: {
        ...commonChartOptions.scales,
        y: {
          ...commonChartOptions.scales.y,
          ticks: {
            ...commonChartOptions.scales.y.ticks,
            callback: (value) => 'R$ ' + (value / 1000).toFixed(0) + 'k'
          }
        },
        x: {
          ...commonChartOptions.scales.x,
          ticks: {
            ...commonChartOptions.scales.x.ticks,
            maxRotation: 45,
            minRotation: 45
          }
        }
      }
    },
    plugins: [{
      id: 'datalabels',
      afterDraw: (chart) => {
        const ctx = chart.ctx;
        const data = chart.data.datasets[0].data;
        const meta = chart.getDatasetMeta(0);
        const total = data.length;
        
        meta.data.forEach((point, index) => {
          if (index % Math.ceil(total / 8) === 0 || index === total - 1) {
            const value = data[index];
            const x = point.x;
            const y = point.y - 10;
            ctx.save();
            ctx.fillStyle = '#1f2937';
            ctx.font = 'bold 9px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'bottom';
            ctx.fillText('R$ ' + (value / 1000).toFixed(0) + 'k', x, y);
            ctx.restore();
          }
        });
      }
    }]
  });
  ` : ''}
  
  ${topMotivos.length > 0 ? `
  // Gráfico Top 10 Motivos (ShadCN Style)
  const chartTopMotivos = new Chart(
    document.getElementById('chartTopMotivos'),
    {
      type: 'bar',
      data: {
        labels: ${JSON.stringify(
          topMotivos.map(d => breakLabelIntoMax3WordsTS(d.name.replace(/_/g, ' ')))
        )},
        datasets: [{
          label: 'Quantidade',
          data: ${JSON.stringify(topMotivos.map(d => d.value))},
          backgroundColor: '#073e29',
          borderColor: '#065f46',
          borderWidth: 0,
          borderRadius: 8
        }]
      },
      options: {
        ...commonChartOptions,
        layout: {
          padding: {
            top: 20,
            bottom: 80
          }
        },
        scales: {
          ...commonChartOptions.scales,
          y: {
            ...commonChartOptions.scales.y,
            grid: { display: false },
            ticks: {
              ...commonChartOptions.scales.y.ticks,
              stepSize: 1,
              color: '#1f2937',
              font: { size: 8, weight: 'bold' }
            }
          },
          x: {
            ...commonChartOptions.scales.x,
            grid: { display: false },
            ticks: { display: false }
          }
        },
        plugins: {
          ...commonChartOptions.plugins,
          legend: { display: false },
          tooltip: {
            ...commonChartOptions.plugins.tooltip,
            callbacks: {
              title: (items) =>
                items[0].label.join(' '),
              label: (context) =>
                context.parsed.y + ' ocorrência(s)'
            }
          }
        }
      },
      plugins: [{
        id: 'barValueAndLabel',
        afterDraw(chart) {
          const ctx = chart.ctx;
          const dataset = chart.data.datasets[0];
          const labels = chart.data.labels;
          const meta = chart.getDatasetMeta(0);

          meta.data.forEach((bar, index) => {
            const value = dataset.data[index];
            const lines = labels[index]; // sempre array

            ctx.save();

            // 🔹 Valor acima da barra
            ctx.fillStyle = '#1f2937';
            ctx.font = 'bold 9px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'bottom';
            ctx.fillText(String(value), bar.x, bar.y - 6);

            // 🔹 Nome abaixo da barra (1 palavra por linha)
            ctx.font = 'normal 8px Arial';
            ctx.textBaseline = 'top';

            lines.forEach((word, i) => {
              ctx.fillText(
                word,
                bar.x,
                bar.base + 8 + i * 10
              );
            });

            ctx.restore();
          });
        }
      }]
    }
  );
  ` : ''}
  
  ${topClientes.length > 0 ? `
  // Gráfico Top 10 Clientes (ShadCN Style)
  const chartTopClientes = new Chart(
    document.getElementById('chartTopClientes'),
    {
      type: 'bar',
      data: {
        labels: ${JSON.stringify(
          topClientes.map(d => breakLabelIntoMax3WordsTS(d.name.replace(/_/g, ' ')))
        )},
        datasets: [{
          label: 'Quantidade',
          data: ${JSON.stringify(topClientes.map(d => d.value))},
          backgroundColor: '#10b981',
          borderColor: '#059669',
          borderWidth: 0,
          borderRadius: 8
        }]
      },
      options: {
        ...commonChartOptions,
        layout: {
          padding: {
            top: 20,
            bottom: 80
          }
        },
        scales: {
          ...commonChartOptions.scales,
          y: {
            ...commonChartOptions.scales.y,
            grid: { display: false },
            ticks: {
              ...commonChartOptions.scales.y.ticks,
              stepSize: 1,
              color: '#1f2937',
              font: { size: 8, weight: 'bold' }
            }
          },
          x: {
            ...commonChartOptions.scales.x,
            grid: { display: false },
            ticks: { display: false }
          }
        },
        plugins: {
          ...commonChartOptions.plugins,
          legend: { display: false },
          tooltip: {
            ...commonChartOptions.plugins.tooltip,
            callbacks: {
              title: (items) =>
                items[0].label.join(' '),
              label: (context) =>
                context.parsed.y + ' ocorrência(s)'
            }
          }
        }
      },
      plugins: [{
        id: 'barValueAndLabel',
        afterDraw(chart) {
          const ctx = chart.ctx;
          const dataset = chart.data.datasets[0];
          const labels = chart.data.labels;
          const meta = chart.getDatasetMeta(0);

          meta.data.forEach((bar, index) => {
            const value = dataset.data[index];
            const lines = labels[index]; // sempre array

            ctx.save();

            // 🔹 Valor acima da barra
            ctx.fillStyle = '#1f2937';
            ctx.font = 'bold 9px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'bottom';
            ctx.fillText(String(value), bar.x, bar.y - 6);

            // 🔹 Nome abaixo da barra (1 palavra por linha)
            ctx.font = 'normal 8px Arial';
            ctx.textBaseline = 'top';

            lines.forEach((word, i) => {
              ctx.fillText(
                word,
                bar.x,
                bar.base + 8 + i * 10
              );
            });

            ctx.restore();
          });
        }
      }]
    }
  );
  ` : ''}
  
  
  ${topSetores.length > 0 ? `
  // Gráfico Top 5 Setores (ShadCN Style)
  const chartTopSetores = new Chart(
    document.getElementById('chartTopSetores'),
    {
      type: 'bar',
      data: {
        labels: ${JSON.stringify(
          topSetores.map(d => breakLabelIntoMax3WordsTS(d.name.replace(/_/g, ' ')))
        )},
        datasets: [{
          label: 'Quantidade',
          data: ${JSON.stringify(topSetores.map(d => d.value))},
          backgroundColor: '#065f46',
          borderColor: '#047857',
          borderWidth: 0,
          borderRadius: 8
        }]
      },
      options: {
        ...commonChartOptions,
        layout: {
          padding: {
            top: 20,
            bottom: 80
          }
        },
        scales: {
          ...commonChartOptions.scales,
          y: {
            ...commonChartOptions.scales.y,
            grid: { display: false },
            ticks: {
              ...commonChartOptions.scales.y.ticks,
              stepSize: 1,
              color: '#1f2937',
              font: { size: 8, weight: 'bold' }
            }
          },
          x: {
            ...commonChartOptions.scales.x,
            grid: { display: false },
            ticks: { display: false }
          }
        },
        plugins: {
          ...commonChartOptions.plugins,
          legend: { display: false },
          tooltip: {
            ...commonChartOptions.plugins.tooltip,
            callbacks: {
              title: (items) =>
                items[0].label.join(' '),
              label: (context) =>
                context.parsed.y + ' ocorrência(s)'
            }
          }
        }
      },
      plugins: [{
        id: 'barValueAndLabel',
        afterDraw(chart) {
          const ctx = chart.ctx;
          const dataset = chart.data.datasets[0];
          const labels = chart.data.labels;
          const meta = chart.getDatasetMeta(0);

          meta.data.forEach((bar, index) => {
            const value = dataset.data[index];
            const lines = labels[index]; // sempre array

            ctx.save();

            // 🔹 Valor acima da barra
            ctx.fillStyle = '#1f2937';
            ctx.font = 'bold 9px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'bottom';
            ctx.fillText(String(value), bar.x, bar.y - 6);

            // 🔹 Nome abaixo da barra (1 palavra por linha)
            ctx.font = 'normal 8px Arial';
            ctx.textBaseline = 'top';

            lines.forEach((word, i) => {
              ctx.fillText(
                word,
                bar.x,
                bar.base + 8 + i * 10
              );
            });

            ctx.restore();
          });
        }
      }]
    }
  );
  ` : ''}
  
  ${topTipoOcorrencia.length > 0 ? `
  // Gráfico Top 5 Tipo de Ocorrência (ShadCN Style)
  const chartTopTipoOcorrencia = new Chart(
    document.getElementById('chartTopTipoOcorrencia'),
    {
      type: 'bar',
      data: {
        labels: ${JSON.stringify(
          topTipoOcorrencia.map(d => breakLabelIntoMax3WordsTS(d.name.replace(/_/g, ' ')))
        )},
        datasets: [{
          label: 'Quantidade',
          data: ${JSON.stringify(topTipoOcorrencia.map(d => d.value))},
          backgroundColor: '#059669',
          borderColor: '#047857',
          borderWidth: 0,
          borderRadius: 8
        }]
      },
      options: {
        ...commonChartOptions,
        layout: {
          padding: {
            top: 20,
            bottom: 80
          }
        },
        scales: {
          ...commonChartOptions.scales,
          y: {
            ...commonChartOptions.scales.y,
            grid: { display: false },
            ticks: {
              ...commonChartOptions.scales.y.ticks,
              stepSize: 1,
              color: '#1f2937',
              font: { size: 8, weight: 'bold' }
            }
          },
          x: {
            ...commonChartOptions.scales.x,
            grid: { display: false },
            ticks: { display: false }
          }
        },
        plugins: {
          ...commonChartOptions.plugins,
          legend: { display: false },
          tooltip: {
            ...commonChartOptions.plugins.tooltip,
            callbacks: {
              title: (items) =>
                items[0].label.join(' '),
              label: (context) =>
                context.parsed.y + ' ocorrência(s)'
            }
          }
        }
      },
      plugins: [{
        id: 'barValueAndLabel',
        afterDraw(chart) {
          const ctx = chart.ctx;
          const dataset = chart.data.datasets[0];
          const labels = chart.data.labels;
          const meta = chart.getDatasetMeta(0);

          meta.data.forEach((bar, index) => {
            const value = dataset.data[index];
            const lines = labels[index]; // sempre array

            ctx.save();

            // 🔹 Valor acima da barra
            ctx.fillStyle = '#1f2937';
            ctx.font = 'bold 9px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'bottom';
            ctx.fillText(String(value), bar.x, bar.y - 6);

            // 🔹 Nome abaixo da barra (1 palavra por linha)
            ctx.font = 'normal 8px Arial';
            ctx.textBaseline = 'top';

            lines.forEach((word, i) => {
              ctx.fillText(
                word,
                bar.x,
                bar.base + 8 + i * 10
              );
            });

            ctx.restore();
          });
        }
      }]
    }
  );
  ` : ''}
  
  ${topTipoColaborador.length > 0 ? `
  // Gráfico Top 5 Tipo de Colaborador (Radar Chart com valores visíveis)
  new Chart(document.getElementById('chartTopTipoColaborador'), {
    type: 'radar',
    data: {
      labels: ${JSON.stringify(topTipoColaborador.map((d) => breakTextIntoLinesTS(d.name, 3)))},
      datasets: [{
        label: 'Quantidade',
        data: ${JSON.stringify(topTipoColaborador.map((d) => d.value))},
        backgroundColor: 'rgba(5, 150, 105, 0.2)',
        borderColor: '#059669',
        borderWidth: 2,
        pointBackgroundColor: '#059669',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 5
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { 
          display: true, 
          position: 'bottom', 
          labels: { color: '#1f2937', font: { size: 8 }, padding: 8 }
        },
        tooltip: {
          ...commonChartOptions.plugins.tooltip,
          callbacks: {
            label: (context) => context.label + ': ' + context.parsed.r + ' ocorrência(s)'
          }
        }
      },
      scales: {
        r: {
          beginAtZero: true,
          ticks: {
            stepSize: 1,
            color: '#1f2937',
            font: { size: 8 }
          },
          grid: {
            color: '#e5e7eb'
          },
          pointLabels: {
            display: false
          }
        }
      }
    },
    plugins: [radarLabelPlugin, {
      id: 'datalabels',
      afterDraw: (chart) => {
        const ctx = chart.ctx;
        const data = chart.data.datasets[0].data;
        const meta = chart.getDatasetMeta(0);
        
        meta.data.forEach((point, index) => {
          const value = data[index];
          const angle = point.angle;
          const radius = point.radius;
          const x = point.x + Math.cos(angle) * (radius + 15);
          const y = point.y + Math.sin(angle) * (radius + 15);
          
          ctx.save();
          ctx.fillStyle = '#1f2937';
          ctx.font = 'bold 9px Arial';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(String(value), x, y);
          ctx.restore();
        });
      }
    }]
  });
  ` : ''}
  
  ${topRedes.length > 0 ? `
  // Gráfico Top 5 Redes (Radar Chart com valores visíveis e quebra de texto)
  const chartTopRedes = new Chart(document.getElementById('chartTopRedes'), {
    type: 'radar',
    data: {
      labels: ${JSON.stringify(topRedes.map((d) => breakTextIntoLinesTS(d.name, 3)))},
      datasets: [{
        label: 'Quantidade',
        data: ${JSON.stringify(topRedes.map((d) => d.value))},
        backgroundColor: 'rgba(16, 185, 129, 0.2)',
        borderColor: '#10b981',
        borderWidth: 2,
        pointBackgroundColor: '#10b981',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 5
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { 
          display: true, 
          position: 'bottom', 
          labels: { color: '#1f2937', font: { size: 8 }, padding: 8 }
        },
        tooltip: {
          ...commonChartOptions.plugins.tooltip,
          callbacks: {
            label: (context) => context.label + ': ' + context.parsed.r + ' ocorrência(s)'
          }
        }
      },
      scales: {
        r: {
          beginAtZero: true,
          ticks: {
            stepSize: 1,
            color: '#1f2937',
            font: { size: 8 }
          },
          grid: {
            color: '#e5e7eb'
          },
          pointLabels: {
            display: false
          }
        }
      }
    },
    plugins: [radarLabelPlugin, {
      id: 'datalabels',
      afterDraw: (chart) => {
        const ctx = chart.ctx;
        const data = chart.data.datasets[0].data;
        const meta = chart.getDatasetMeta(0);
        
        meta.data.forEach((point, index) => {
          const value = data[index];
          const angle = point.angle;
          const radius = point.radius;
          const x = point.x + Math.cos(angle) * (radius + 15);
          const y = point.y + Math.sin(angle) * (radius + 15);
          
          ctx.save();
          ctx.fillStyle = '#1f2937';
          ctx.font = 'bold 9px Arial';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(String(value), x, y);
          ctx.restore();
        });
      }
    }]
  });
  ` : ''}
</script>
</body>
</html>`

    // Criar e abrir nova janela com o HTML
    const newWindow = window.open('', '_blank')
    if (newWindow) {
      newWindow.document.write(html)
      newWindow.document.close()
    }

    toast({
      title: 'Relatório HTML gerado!',
      description: 'O relatório foi aberto em uma nova janela. Use o botão Imprimir PDF para salvar.',
    })
  }

  const handleExportPDF = () => {
    const doc = new jsPDF('l', 'mm', 'a4')

    doc.setFontSize(16)
    doc.text('RELATÓRIO DE OCORRÊNCIAS - REGGAP', 14, 15)
    doc.setFontSize(10)
    doc.text(`Gerado em: ${formatDate(new Date())}`, 14, 22)
    doc.text(`Total de registros: ${filteredOcorrencias.length}`, 14, 28)

    const tableData = filteredOcorrencias.map(o => [
      formatDate(o.data_ocorrencia),
      o.setor,
      o.motivo.replace(/_/g, ' '),
      o.cliente || '-',
      o.status,
      o.valor ? formatCurrency(o.valor) : '-',
    ])

    autoTable(doc, {
      head: [['Data', 'Setor', 'Motivo', 'Cliente', 'Status', 'Valor']],
      body: tableData,
      startY: 35,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [7, 62, 41] },
    })

    doc.save(`relatorio-reggap-${new Date().toISOString().split('T')[0]}.pdf`)

    toast({
      title: 'Relatório exportado',
      description: 'O arquivo PDF foi baixado com sucesso.',
    })
  }

  const handleWhatsAppShare = () => {
    const summary = filteredOcorrencias.slice(0, 5).map((o, i) => (
      `${i + 1}. ${o.motivo.replace(/_/g, ' ')} - ${o.cliente || 'N/A'} - ${formatDate(o.data_ocorrencia)}`
    )).join('\n')

    const message = `📊 REGGAP - RELATÓRIO\n\n📅 Período: ${periodoInicio || 'Início'} a ${periodoFim || 'Fim'}\n🔴 Ocorrências: ${filteredOcorrencias.length}\n\n⚠️ Principais:\n${summary}\n\n💰 Impacto: ${formatCurrency(
      filteredOcorrencias.filter(o => o.valor).reduce((acc, o) => acc + (o.valor || 0), 0)
    )}`

    const encodedMessage = encodeURIComponent(message)
    const whatsappUrl = `https://wa.me/?text=${encodedMessage}`
    window.open(whatsappUrl, '_blank')

    toast({
      title: 'Compartilhando...',
      description: 'Abrindo WhatsApp para compartilhar o relatório.',
    })
  }

  const handleEdit = (ocorrencia: Ocorrencia) => {
    setSelectedOcorrencia(ocorrencia)
    setEditFormData({
      ...ocorrencia,
    })
    setEditDialogOpen(true)
  }

  const handleSaveEdit = async () => {
    if (!selectedOcorrencia?.id) return

    try {
      await ocorrenciasApi.update(selectedOcorrencia.id, editFormData)
      toast({
        title: 'Ocorrência atualizada!',
        description: 'As alterações foram salvas com sucesso.',
      })
      setEditDialogOpen(false)
      await fetchData()
    } catch (error) {
      console.error('Erro ao atualizar:', error)
      toast({
        variant: 'destructive',
        title: 'Erro ao atualizar',
        description: 'Não foi possível salvar as alterações.',
      })
    }
  }

  const handleDelete = async () => {
    if (!selectedOcorrencia?.id) return

    try {
      await ocorrenciasApi.delete(selectedOcorrencia.id)
      toast({
        title: 'Ocorrência excluída!',
        description: 'A ocorrência foi removida com sucesso.',
      })
      setDeleteDialogOpen(false)
      await fetchData()
    } catch (error) {
      console.error('Erro ao excluir:', error)
      toast({
        variant: 'destructive',
        title: 'Erro ao excluir',
        description: 'Não foi possível excluir a ocorrência.',
      })
    }
  }

  const totalPages = Math.ceil(filteredOcorrencias.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentOcorrencias = filteredOcorrencias.slice(startIndex, endIndex)

  const STATUS_OPTIONS = ['EM ABERTO', 'FINALIZADO']

  const handleStatusClick = async (ocorrencia: Ocorrencia) => {
    const currentIndex = STATUS_OPTIONS.indexOf(ocorrencia.status)
    const nextIndex = (currentIndex + 1) % STATUS_OPTIONS.length
    const newStatus = STATUS_OPTIONS[nextIndex]
    
    try {
      await ocorrenciasApi.update(ocorrencia.id!, { status: newStatus })
      toast({
        title: 'Status atualizado!',
        description: `Status alterado para ${newStatus}`,
      })
      await fetchData()
    } catch (error) {
      console.error('Erro ao atualizar status:', error)
      toast({
        variant: 'destructive',
        title: 'Erro ao atualizar',
        description: 'Não foi possível atualizar o status.',
      })
    }
  }


  const getStatusBadge = (status: string, ocorrencia: Ocorrencia) => {
    const colors = {
      'EM ABERTO': 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200',
      'FINALIZADO': 'bg-green-100 text-green-800 hover:bg-green-200',
    }
    return (
      <button
        onClick={() => handleStatusClick(ocorrencia)}
        className={`px-2 py-1 rounded-full text-xs font-medium cursor-pointer transition-colors ${colors[status as keyof typeof colors]}`}
        title="Clique para alterar o status"
      >
        {status}
      </button>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-lg text-muted-foreground">Carregando relatórios...</p>
        </div>
      </div>
    )
  }

  return (
    <InternalLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Relatórios</h1>
            <p className="text-muted-foreground mt-1">
              Visualize e exporte dados de ocorrências
            </p>
          </div>
          <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.push('/dashboard')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          <Button onClick={fetchData} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Filtros e Ações */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filtros e Exportações
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
            >
              {showFilters ? <X className="w-4 h-4" /> : <Filter className="w-4 h-4" />}
            </Button>
          </div>
        </CardHeader>
        {showFilters && (
        <CardContent>
          <div className="flex justify-end mb-4">
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearFilters}
              className="flex items-center gap-2"
            >
              <X className="w-4 h-4" />
              Limpar Filtros
            </Button>
          </div>
          <ScrollArea className="max-h-80">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="space-y-2">
                <Label>Busca</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar..."
                    value={busca}
                    onChange={(e) => setBusca(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Período Início</Label>
                <Input
                  type="date"
                  value={periodoInicio}
                  onChange={(e) => setPeriodoInicio(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Período Fim</Label>
                <Input
                  type="date"
                  value={periodoFim}
                  onChange={(e) => setPeriodoFim(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={status || 'all'} onValueChange={(v) => setStatus(v === 'all' ? '' : v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="EM ABERTO">Em Aberto</SelectItem>
                    <SelectItem value="FINALIZADO">Finalizado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Setor</Label>
                <Select value={setor || 'all'} onValueChange={(v) => setSetor(v === 'all' ? '' : v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {setores.map(s => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Motivo</Label>
                <Select value={motivo || 'all'} onValueChange={(v) => setMotivo(v === 'all' ? '' : v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {motivos.map(m => (
                      <SelectItem key={m} value={m}>{m.replace(/_/g, ' ')}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Tipo Ocorrência</Label>
                <Select value={tipoOcorrencia || 'all'} onValueChange={(v) => setTipoOcorrencia(v === 'all' ? '' : v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {tiposOcorrencia.map(t => (
                      <SelectItem key={t} value={t}>{t.replace(/_/g, ' ')}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </ScrollArea>

          {/* Botões de Exportação */}
          <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t">
            <Button onClick={handleGenerateHTMLReport} className="bg-[#073e29] hover:bg-[#073e29]/90 text-white">
              <FileText className="w-4 h-4 mr-2" />
              Gerar Relatório HTML
            </Button>
            <Button onClick={handleExportCSV} variant="outline">
              <FileSpreadsheet className="w-4 h-4 mr-2" />
              Exportar CSV
            </Button>
            <Button onClick={handleExportXLSX} variant="outline">
              <FileSpreadsheet className="w-4 h-4 mr-2" />
              Exportar XLSX
            </Button>
            <Button onClick={handleExportPDF} variant="outline">
              <FileText className="w-4 h-4 mr-2" />
              Exportar PDF
            </Button>
            <Button onClick={handleWhatsAppShare} variant="outline">
              <Share2 className="w-4 h-4 mr-2" />
              WhatsApp
            </Button>
          </div>
        </CardContent>
        )}
      </Card>

      {/* Tabela de Registros */}
      <Card>
        <CardHeader>
          <CardTitle>
            Registros ({filteredOcorrencias.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="w-full h-[600px]">
            <div className="min-w-[1200px]">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 text-sm font-semibold">Data</th>
                    <th className="text-left p-3 text-sm font-semibold">Setor</th>
                    <th className="text-left p-3 text-sm font-semibold">Tipo</th>
                    <th className="text-left p-3 text-sm font-semibold">Motivo</th>
                    <th className="text-left p-3 text-sm font-semibold">Cliente</th>
                    <th className="text-left p-3 text-sm font-semibold">Valor</th>
                    <th className="text-left p-3 text-sm font-semibold">Status</th>
                    <th className="text-left p-3 text-sm font-semibold">Reincidência</th>
                    <th className="text-left p-3 text-sm font-semibold">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {currentOcorrencias.map((ocorrencia) => (
                    <tr key={ocorrencia.id} className="border-b hover:bg-muted/50">
                      <td className="p-3 text-sm">{formatDate(ocorrencia.data_ocorrencia)}</td>
                      <td className="p-3 text-sm">{ocorrencia.setor}</td>
                      <td className="p-3 text-sm">{ocorrencia.tipo_ocorrencia.replace(/_/g, ' ')}</td>
                      <td className="p-3 text-sm">{ocorrencia.motivo.replace(/_/g, ' ')}</td>
                      <td className="p-3 text-sm">{ocorrencia.cliente || '-'}</td>
                      <td className="p-3 text-sm">{ocorrencia.valor ? formatCurrency(ocorrencia.valor) : '-'}</td>
                      <td className="p-3 text-sm">{getStatusBadge(ocorrencia.status, ocorrencia)}</td>
                      <td className="p-3 text-sm">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          ocorrencia.reincidencia === 'SIM' 
                            ? 'bg-red-100 text-red-800' 
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {ocorrencia.reincidencia || 'NÃO'}
                        </span>
                      </td>
                      <td className="p-3 text-sm">
                        <div className="flex gap-2">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleEdit(ocorrencia)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => {
                              setSelectedOcorrencia(ocorrencia)
                              setDeleteDialogOpen(true)
                            }}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {currentOcorrencias.length === 0 && (
                    <tr>
                      <td colSpan={9} className="p-8 text-center text-muted-foreground">
                        Nenhum registro encontrado
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </ScrollArea>

          {/* Paginação */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                Mostrando {startIndex + 1} a {Math.min(endIndex, filteredOcorrencias.length)} de {filteredOcorrencias.length} registros
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  Próxima
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog de Edição Completo */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Ocorrência - Todos os Campos</DialogTitle>
            <DialogDescription>
              Altere qualquer campo da ocorrência selecionada
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[70vh]">
            <div className="space-y-6 py-4 pr-4">
              {/* Informações Básicas */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">Informações Básicas</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Data da Ocorrência</Label>
                    <Input
                      type="date"
                      value={editFormData.data_ocorrencia ? editFormData.data_ocorrencia.split('T')[0] : ''}
                      onChange={(e) => setEditFormData({ ...editFormData, data_ocorrencia: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Setor</Label>
                    <Input
                      value={editFormData.setor || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, setor: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Tipo de Colaborador</Label>
                    <Input
                      value={editFormData.tipo_colaborador || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, tipo_colaborador: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Tipo de Ocorrência</Label>
                    <Input
                      value={editFormData.tipo_ocorrencia || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, tipo_ocorrencia: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Motivo</Label>
                    <Input
                      value={editFormData.motivo || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, motivo: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Valor</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={editFormData.valor || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, valor: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                  
                  {/* Campos NF ANTERIOR e NF SUBSTITUTA - Aparecem apenas para REFATURAMENTO, CANCELAMENTO ou DEVOLUCAO TOTAL */}
                  {['REFATURAMENTO', 'CANCELAMENTO', 'DEVOLUCAO TOTAL'].includes(editFormData.tipo_ocorrencia || '') && (
                    <>
                      <div className="space-y-2">
                        <Label>NF ANTERIOR (Opcional)</Label>
                        <Input
                          placeholder="Número da nota fiscal anterior"
                          value={editFormData.nf_anterior || ''}
                          onChange={(e) => setEditFormData({ ...editFormData, nf_anterior: e.target.value.toUpperCase() })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>NF SUBSTITUTA (Opcional)</Label>
                        <Input
                          placeholder="Número da nota fiscal substituta"
                          value={editFormData.nf_substituta || ''}
                          onChange={(e) => setEditFormData({ ...editFormData, nf_substituta: e.target.value.toUpperCase() })}
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Informações do Cliente */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">Informações do Cliente</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Cliente</Label>
                    <Input
                      value={editFormData.cliente || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, cliente: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Rede</Label>
                    <Input
                      value={editFormData.rede || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, rede: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Cidade</Label>
                    <Input
                      value={editFormData.cidade || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, cidade: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>UF</Label>
                    <Input
                      maxLength={2}
                      value={editFormData.uf || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, uf: e.target.value.toUpperCase() })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Vendedor</Label>
                    <Input
                      value={editFormData.vendedor || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, vendedor: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* Status e Reincidência */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">Status e Reincidência</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select
                      value={editFormData.status}
                      onValueChange={(value) => setEditFormData({ ...editFormData, status: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="EM ABERTO">Em Aberto</SelectItem>
                        <SelectItem value="FINALIZADO">Finalizado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Reincidência</Label>
                    <Select
                      value={editFormData.reincidencia || 'NÃO'}
                      onValueChange={(value) => setEditFormData({ ...editFormData, reincidencia: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="SIM">SIM</SelectItem>
                        <SelectItem value="NÃO">NÃO</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Detalhamento e Tratativas */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">Detalhamento e Tratativas</h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Detalhamento</Label>
                    <Textarea
                      value={editFormData.detalhamento || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, detalhamento: e.target.value })}
                      rows={4}
                      className="resize-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Tratativa</Label>
                    <Textarea
                      value={editFormData.tratativa || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, tratativa: e.target.value })}
                      rows={3}
                      className="resize-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Resultado</Label>
                    <Textarea
                      value={editFormData.resultado || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, resultado: e.target.value })}
                      rows={3}
                      className="resize-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          </ScrollArea>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveEdit}>
              Salvar Alterações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Exclusão */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir esta ocorrência? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
    </InternalLayout>
  )
}
