'use client'

import { useEffect, useState, useCallback } from 'react'
import { XCircle, Clock } from 'lucide-react'
import InternalLayout from '@/components/InternalLayout'

export const dynamic = 'force-dynamic'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
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
  getBrazilDateTime,
} from '@/lib/utils'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LabelList,
  Legend,
  LineChart,
  Line,
  RadarChart,
  PolarAngleAxis,
  PolarGrid,
  Radar,
  AreaChart,
  Area,
} from 'recharts'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from '@/components/ui/chart'
import {
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  DollarSign,
  Activity,
  RefreshCw,
  Filter,
  X,
} from 'lucide-react'

interface Ocorrencia {
  id?: string
  data_criacao?: string
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

export default function Dashboard() {
  const { toast } = useToast()
  const [ocorrencias, setOcorrencias] = useState<Ocorrencia[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  
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
  
  // Filtro de período para gráfico de evolução
  const [filtroEvolucao, setFiltroEvolucao] = useState<string>('todo_periodo')

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
      const ocorrencasData = await ocorrenciasApi.getAll({
        busca,
        periodo_inicio: periodoInicio,
        periodo_fim: periodoFim,
        setor,
        motivo,
        tipo_ocorrencia: tipoOcorrencia,
        status,
        tipo_colaborador: tipoColaborador,
        vendedor,
        cliente,
        rede,
        cidade,
        uf,
      })

      setOcorrencias(ocorrencasData || [])
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
  }, [busca, periodoInicio, periodoFim, setor, motivo, tipoOcorrencia, status, tipoColaborador, vendedor, cliente, rede, cidade, uf, toast])

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

  const handleRefresh = async () => {
    setRefreshing(true)
    await Promise.all([fetchFilterData(), fetchData()])
    setRefreshing(false)
    toast({
      title: 'Dados atualizados',
      description: 'O dashboard foi atualizado com sucesso.',
    })
  }

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
    toast({
      title: 'Filtros limpos',
      description: 'Todos os filtros foram removidos.',
    })
  }

  // Função para calcular comparativo semana atual vs semana anterior
  const calcularComparativoSemanal = () => {
    const now = getBrazilDateTime()
    
    // Semana atual (segunda a domingo)
    const inicioSemanaAtual = new Date(now)
    inicioSemanaAtual.setDate(now.getDate() - now.getDay() + 1) // Segunda-feira
    inicioSemanaAtual.setHours(0, 0, 0, 0)
    
    const fimSemanaAtual = new Date(inicioSemanaAtual)
    fimSemanaAtual.setDate(inicioSemanaAtual.getDate() + 6) // Domingo
    fimSemanaAtual.setHours(23, 59, 59, 999)
    
    // Semana anterior
    const inicioSemanaAnterior = new Date(inicioSemanaAtual)
    inicioSemanaAnterior.setDate(inicioSemanaAtual.getDate() - 7)
    
    const fimSemanaAnterior = new Date(fimSemanaAtual)
    fimSemanaAnterior.setDate(fimSemanaAtual.getDate() - 7)
    
    const semanaAtual = ocorrencias.filter(o => {
      if (!o.data_ocorrencia) return false
      const data = new Date(o.data_ocorrencia)
      return data >= inicioSemanaAtual && data <= fimSemanaAtual
    }).length
    
    const semanaAnterior = ocorrencias.filter(o => {
      if (!o.data_ocorrencia) return false
      const data = new Date(o.data_ocorrencia)
      return data >= inicioSemanaAnterior && data <= fimSemanaAnterior
    }).length
    
    const diferenca = semanaAtual - semanaAnterior
    const percentual = semanaAnterior > 0 
      ? Math.round((diferenca / semanaAnterior) * 100) 
      : (semanaAtual > 0 ? 100 : 0)
    
    return {
      semanaAtual,
      semanaAnterior,
      diferenca,
      percentual,
      isPositive: diferenca >= 0
    }
  }

  const comparativoSemanal = calcularComparativoSemanal()

  // KPIs
  const kpis = {
    totalOcorrencias: ocorrencias.length,
    refaturamentos: ocorrencias.filter(o => o.tipo_ocorrencia === 'REFATURAMENTO').length,
    valorRefaturamentos: ocorrencias
      .filter(o => o.tipo_ocorrencia === 'REFATURAMENTO')
      .reduce((acc, o) => acc + (o.valor || 0), 0),
    cancelamentos: ocorrencias.filter(o => o.tipo_ocorrencia === 'CANCELAMENTO').length,
    valorCancelamentos: ocorrencias
      .filter(o => o.tipo_ocorrencia === 'CANCELAMENTO')
      .reduce((acc, o) => acc + (o.valor || 0), 0),
    emAberto: ocorrencias.filter(o => o.status === 'EM ABERTO').length,
    finalizadas: ocorrencias.filter(o => o.status === 'FINALIZADO').length,
    taxaReincidencia: calculateRecurrenceRate(ocorrencias),
    impactoFinanceiro: calculateFinancialImpact(ocorrencias),
  }

  // Cores para os gráficos
  const COLORS = ['#073e29', '#10b981', '#059669', '#047857', '#065f46', '#064e3b']

  function getChartColor(index: number) {
    return COLORS[index % COLORS.length]
  }

  // Função para quebrar texto em múltiplas linhas (retorna array)
  const breakTextIntoLines = (text: string, maxCharsPerLine: number = 12) => {
    const words = text.replace(/_/g, ' ').split(' ')
    const lines: string[] = []
    let currentLine = ''
    
    words.forEach(word => {
      if ((currentLine + ' ' + word).length <= maxCharsPerLine || currentLine === '') {
        currentLine = currentLine ? `${currentLine} ${word}` : word
      } else {
        if (currentLine) lines.push(currentLine)
        currentLine = word
      }
    })
    if (currentLine) lines.push(currentLine)
    return lines.length > 0 ? lines : [text]
  }

  // Função para renderizar tick com múltiplas linhas
  const renderMultiLineTick = (text: string) => {
    const lines = breakTextIntoLines(text, 12)
    return (
      <g>
        {lines.map((line, index) => (
          <text
            key={index}
            x={0}
            y={index * 14}
            textAnchor="middle"
            fontSize={10}
            fill="#6b7280"
          >
            {line}
          </text>
        ))}
      </g>
    )
  }

  // Top 10 Motivos
  const topMotivos = Object.entries(
    ocorrencias.reduce((acc, o) => {
      acc[o.motivo] = (acc[o.motivo] || 0) + 1
      return acc
    }, {} as Record<string, number>)
  )
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([motivo, count]) => ({ 
      name: motivo.replace(/_/g, ' '), 
      value: count,
      labelLines: breakTextIntoLines(motivo, 12)
    }))

  // Top 10 Clientes
  const topClientes = Object.entries(
    ocorrencias.reduce((acc, o) => {
      if (o.cliente) {
        acc[o.cliente] = (acc[o.cliente] || 0) + 1
      }
      return acc
    }, {} as Record<string, number>)
  )
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([cliente, count]) => ({ 
      name: cliente.substring(0, 30), 
      value: count,
      labelLines: breakTextIntoLines(cliente.substring(0, 30), 12)
    }))

  // Top 5 Tipo Ocorrência
  const topTipoOcorrencia = Object.entries(
    ocorrencias.reduce((acc, o) => {
      acc[o.tipo_ocorrencia] = (acc[o.tipo_ocorrencia] || 0) + 1
      return acc
    }, {} as Record<string, number>)
  )
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([tipo, count]) => ({ 
      name: tipo.replace(/_/g, ' '), 
      value: count,
      labelLines: breakTextIntoLines(tipo, 12)
    }))

  // Top 5 Setores
  const topSetores = Object.entries(
    ocorrencias.reduce((acc, o) => {
      acc[o.setor] = (acc[o.setor] || 0) + 1
      return acc
    }, {} as Record<string, number>)
  )
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([setor, count]) => ({ 
      name: setor, 
      value: count,
      labelLines: breakTextIntoLines(setor, 12)
    }))

  // Top 5 Tipo Colaborador (para Radar Chart)
  const topTipoColaboradorRadar = Object.entries(
    ocorrencias.reduce((acc, o) => {
      acc[o.tipo_colaborador] = (acc[o.tipo_colaborador] || 0) + 1
      return acc
    }, {} as Record<string, number>)
  )
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([tipo, count]) => {
      const name = tipo.replace(/_/g, ' ')
      return { 
        name,
        labelLines: breakTextIntoLines(name, 12),
        value: count 
      }
    })
  
  const tipoColabChartConfig: ChartConfig = {
    value: {
      label: "Tipo de Colaborador",
      color: "#059669", // Verde mais claro para contraste
    },
  }

  // Top 5 Redes (para Radar Chart)
  const topRedesRadar = Object.entries(
    ocorrencias.reduce((acc, o) => {
      if (o.rede) {
        acc[o.rede] = (acc[o.rede] || 0) + 1
      }
      return acc
    }, {} as Record<string, number>)
  )
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([rede, count]) => {
      const name = rede
      return { 
        name,
        labelLines: breakTextIntoLines(name, 12),
        value: count 
      }
    })
  
  const redesChartConfig: ChartConfig = {
    value: {
      label: "Redes",
      color: "#10b981", // Verde ainda mais claro para contraste
    },
  }

  // Função para obter intervalo de datas baseado no filtro
  const getDateRange = (filtro: string) => {
    const now = getBrazilDateTime()
    let inicio: Date, fim: Date
    
    switch (filtro) {
      case 'hoje':
        inicio = new Date(now)
        inicio.setHours(0, 0, 0, 0)
        fim = new Date(now)
        fim.setHours(23, 59, 59, 999)
        break
      case 'ontem':
        inicio = new Date(now)
        inicio.setDate(now.getDate() - 1)
        inicio.setHours(0, 0, 0, 0)
        fim = new Date(inicio)
        fim.setHours(23, 59, 59, 999)
        break
      case 'semana_atual':
        inicio = new Date(now)
        inicio.setDate(now.getDate() - now.getDay() + 1) // Segunda-feira
        inicio.setHours(0, 0, 0, 0)
        fim = new Date(inicio)
        fim.setDate(inicio.getDate() + 6) // Domingo
        fim.setHours(23, 59, 59, 999)
        break
      case 'semana_anterior':
        inicio = new Date(now)
        inicio.setDate(now.getDate() - now.getDay() - 6) // Segunda-feira da semana anterior
        inicio.setHours(0, 0, 0, 0)
        fim = new Date(inicio)
        fim.setDate(inicio.getDate() + 6) // Domingo
        fim.setHours(23, 59, 59, 999)
        break
      case 'mes_atual':
        inicio = new Date(now.getFullYear(), now.getMonth(), 1)
        fim = new Date(now.getFullYear(), now.getMonth() + 1, 0)
        fim.setHours(23, 59, 59, 999)
        break
      case 'mes_anterior':
        inicio = new Date(now.getFullYear(), now.getMonth() - 1, 1)
        fim = new Date(now.getFullYear(), now.getMonth(), 0)
        fim.setHours(23, 59, 59, 999)
        break
      case 'trimestre_atual':
        const trimestreAtual = Math.floor(now.getMonth() / 3)
        inicio = new Date(now.getFullYear(), trimestreAtual * 3, 1)
        fim = new Date(now.getFullYear(), (trimestreAtual + 1) * 3, 0)
        fim.setHours(23, 59, 59, 999)
        break
      case 'trimestre_anterior':
        const trimestreAnterior = Math.floor(now.getMonth() / 3) - 1
        inicio = new Date(now.getFullYear(), trimestreAnterior * 3, 1)
        fim = new Date(now.getFullYear(), (trimestreAnterior + 1) * 3, 0)
        fim.setHours(23, 59, 59, 999)
        break
      case 'semestre_atual':
        const semestreAtual = Math.floor(now.getMonth() / 6)
        inicio = new Date(now.getFullYear(), semestreAtual * 6, 1)
        fim = new Date(now.getFullYear(), (semestreAtual + 1) * 6, 0)
        fim.setHours(23, 59, 59, 999)
        break
      case 'semestre_anterior':
        const semestreAnterior = Math.floor(now.getMonth() / 6) - 1
        inicio = new Date(now.getFullYear(), semestreAnterior * 6, 1)
        fim = new Date(now.getFullYear(), (semestreAnterior + 1) * 6, 0)
        fim.setHours(23, 59, 59, 999)
        break
      case 'ano_atual':
        inicio = new Date(now.getFullYear(), 0, 1)
        fim = new Date(now.getFullYear(), 11, 31)
        fim.setHours(23, 59, 59, 999)
        break
      case 'ano_anterior':
        inicio = new Date(now.getFullYear() - 1, 0, 1)
        fim = new Date(now.getFullYear() - 1, 11, 31)
        fim.setHours(23, 59, 59, 999)
        break
      default: // todo_periodo
        return null
    }
    
    return { inicio, fim }
  }

  // Evolução Temporal (por data de ocorrência) - Para AreaChart - MEDINDO POR QUANTIDADE
  const dateRange = getDateRange(filtroEvolucao)
  const ocorrenciasFiltradas = dateRange
    ? ocorrencias.filter(o => {
        if (!o.data_ocorrencia) return false
        const data = new Date(o.data_ocorrencia)
        return data >= dateRange.inicio && data <= dateRange.fim
      })
    : ocorrencias

  const evolucaoTemporal = ocorrenciasFiltradas.reduce((acc, curr) => {
    const data = curr.data_ocorrencia
      ? (() => {
          try {
            const date = new Date(curr.data_ocorrencia)
            return date.toISOString().split('T')[0] // Formato YYYY-MM-DD
          } catch {
            return null
          }
        })()
      : null
    if (!data) return acc
    if (!acc[data]) {
      acc[data] = { count: 0 }
    }
    acc[data].count++
    return acc
  }, {} as Record<string, { count: number }>)
  
  const evolucaoTemporalList = Object.entries(evolucaoTemporal)
    .map(([date, data]) => ({ date, quantidade: data.count }))
    .sort((a, b) => {
      try {
        return new Date(a.date).getTime() - new Date(b.date).getTime()
      } catch {
        return 0
      }
    })
  
  const evolucaoChartConfig: ChartConfig = {
    quantidade: {
      label: "Quantidade de Registros",
      color: "#047857", // Verde escuro para contraste
    },
  }

  const tipoOcorrenciaChartConfig: ChartConfig = {
    value: {
      label: "Quantidade",
      color: "#059669",
    },
  }

  const topMotivosChartConfig: ChartConfig = {
    value: {
      label: "Quantidade",
      color: "#073e29",
    },
  }

  const topClientesChartConfig: ChartConfig = {
    value: {
      label: "Quantidade",
      color: "#10b981",
    },
  }

  const topSetoresChartConfig: ChartConfig = {
    value: {
      label: "Quantidade",
      color: "#065f46",
    },
  }


  // Insights automáticos
  const insights = []
  if (topSetores.length > 0) {
    const topSetor = topSetores[0]
    const totalSetor = topSetores.reduce((acc, s) => acc + s.value, 0)
    const percentual = Math.round((topSetor.value / totalSetor) * 100)
    insights.push({
      type: 'warning',
      icon: AlertTriangle,
      title: `Setor com mais ocorrências`,
      description: `O setor ${topSetor.name} concentra ${percentual}% de todas as ocorrências (${topSetor.value} casos)`,
    })
  }

  if (kpis.taxaReincidencia > 30) {
    insights.push({
      type: 'danger',
      icon: AlertTriangle,
      title: `Alta taxa de reincidência`,
      description: `A taxa de reincidência está em ${kpis.taxaReincidencia}%. É necessário revisar os procedimentos`,
    })
  } else if (kpis.taxaReincidencia > 0) {
    insights.push({
      type: 'success',
      icon: CheckCircle2,
      title: `Taxa de reincidência controlada`,
      description: `A taxa de reincidência está em ${kpis.taxaReincidencia}%. Os procedimentos estão funcionando`,
    })
  }

  if (topMotivos.length > 0) {
    const topMotivo = topMotivos[0]
    const totalMotivos = topMotivos.reduce((acc, m) => acc + m.value, 0)
    const percentual = Math.round((topMotivo.value / totalMotivos) * 100)
    insights.push({
      type: 'info',
      icon: Activity,
      title: `Motivo mais frequente`,
      description: `O motivo "${topMotivo.name}" representa ${percentual}% de todas as ocorrências (${topMotivo.value} casos)`,
    })
  }

  if (kpis.impactoFinanceiro > 0) {
    insights.push({
      type: 'warning',
      icon: DollarSign,
      title: `Impacto financeiro total`,
      description: `O impacto financeiro acumulado é de ${formatCurrency(kpis.impactoFinanceiro)}`,
    })
  }

  if (kpis.emAberto > 0 && kpis.finalizadas > 0) {
    const percentualFinalizadas = Math.round((kpis.finalizadas / (kpis.emAberto + kpis.finalizadas)) * 100)
    insights.push({
      type: 'success',
      icon: CheckCircle2,
      title: `Taxa de resolução`,
      description: `${percentualFinalizadas}% das ocorrências já foram finalizadas`,
    })
  }

  if (topClientes.length > 0) {
    const topCliente = topClientes[0]
    const totalClientes = topClientes.reduce((acc, c) => acc + c.value, 0)
    const percentual = Math.round((topCliente.value / totalClientes) * 100)
    insights.push({
      type: 'info',
      icon: Activity,
      title: `Cliente com mais ocorrências`,
      description: `O cliente "${topCliente.name}" concentra ${percentual}% de todas as ocorrências (${topCliente.value} casos)`,
    })
  }

  // Tabelas analíticas (Top 10 de cada)
  const topSetorMotivo = Object.entries(
    ocorrencias.reduce((acc, o) => {
      const key = `${o.setor} x ${o.motivo.replace(/_/g, ' ')}`
      acc[key] = (acc[key] || 0) + 1
      return acc
    }, {} as Record<string, number>)
  )
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([key, count]) => ({ key, count }))

  const topColabMotivo = Object.entries(
    ocorrencias.reduce((acc, o) => {
      const key = `${o.tipo_colaborador.replace(/_/g, ' ')} x ${o.motivo.replace(/_/g, ' ')}`
      acc[key] = (acc[key] || 0) + 1
      return acc
    }, {} as Record<string, number>)
  )
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([key, count]) => ({ key, count }))

  const topSetorTipoOcorrencia = Object.entries(
    ocorrencias.reduce((acc, o) => {
      const key = `${o.setor} x ${o.tipo_ocorrencia.replace(/_/g, ' ')}`
      acc[key] = (acc[key] || 0) + 1
      return acc
    }, {} as Record<string, number>)
  )
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([key, count]) => ({ key, count }))

  const topRedeMotivo = Object.entries(
    ocorrencias.reduce((acc, o) => {
      if (o.rede) {
        const key = `${o.rede} x ${o.motivo.replace(/_/g, ' ')}`
        acc[key] = (acc[key] || 0) + 1
      }
      return acc
    }, {} as Record<string, number>)
  )
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([key, count]) => ({ key, count }))

  // Clientes x Motivos
  const topClientesXMotivos = Object.entries(
    ocorrencias.reduce((acc, o) => {
      if (o.cliente) {
        const key = `${o.cliente.substring(0, 30)} x ${o.motivo.replace(/_/g, ' ')}`
        acc[key] = (acc[key] || 0) + 1
      }
      return acc
    }, {} as Record<string, number>)
  )
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([key, count]) => ({ key, count }))

  // Tipo Colab x Tipo Ocorrência
  const topTipoColabXTipoOcorrencia = Object.entries(
    ocorrencias.reduce((acc, o) => {
      const key = `${o.tipo_colaborador.replace(/_/g, ' ')} x ${o.tipo_ocorrencia.replace(/_/g, ' ')}`
      acc[key] = (acc[key] || 0) + 1
      return acc
    }, {} as Record<string, number>)
  )
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([key, count]) => ({ key, count }))

  // Vendedor x Tipo Ocorrência
  const topVendedorXTipoOcorrencia = Object.entries(
    ocorrencias.reduce((acc, o) => {
      if (o.vendedor) {
        const key = `${o.vendedor} x ${o.tipo_ocorrencia.replace(/_/g, ' ')}`
        acc[key] = (acc[key] || 0) + 1
      }
      return acc
    }, {} as Record<string, number>)
  )
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([key, count]) => ({ key, count }))

  // Vendedor x Motivo
  const topVendedorXMotivo = Object.entries(
    ocorrencias.reduce((acc, o) => {
      if (o.vendedor) {
        const key = `${o.vendedor} x ${o.motivo.replace(/_/g, ' ')}`
        acc[key] = (acc[key] || 0) + 1
      }
      return acc
    }, {} as Record<string, number>)
  )
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([key, count]) => ({ key, count }))

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 animate-spin mx-auto mb-4 text-[#073e29] dark:text-green-400" />
          <p className="text-lg text-muted-foreground">Carregando dashboard...</p>
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
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Análise e inteligência de ocorrências
          </p>
        </div>
        <Button onClick={handleRefresh} disabled={refreshing}>
          <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filtros Dinâmicos
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>Busca Livre</Label>
                <Input
                  placeholder="Digite para buscar..."
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                />
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
                      <SelectItem key={m} value={m}>{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Tipo de Ocorrência</Label>
                <Select value={tipoOcorrencia || 'all'} onValueChange={(v) => setTipoOcorrencia(v === 'all' ? '' : v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {tiposOcorrencia.map(t => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                <Label>Tipo de Colaborador</Label>
                <Select value={tipoColaborador || 'all'} onValueChange={(v) => setTipoColaborador(v === 'all' ? '' : v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {tiposColaborador.map(t => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Vendedor</Label>
                <Select value={vendedor || 'all'} onValueChange={(v) => setVendedor(v === 'all' ? '' : v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {Array.from(new Set(clientes.map(c => c.vendedor).filter(Boolean))).map(v => (
                      <SelectItem key={v} value={v!}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Cliente</Label>
                <Select value={cliente || 'all'} onValueChange={(v) => setCliente(v === 'all' ? '' : v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {clientes.map(c => (
                      <SelectItem key={c.cliente} value={c.cliente}>{c.cliente}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Rede</Label>
                <Select value={rede || 'all'} onValueChange={(v) => setRede(v === 'all' ? '' : v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {Array.from(new Set(clientes.map(c => c.rede).filter(Boolean))).map(r => (
                      <SelectItem key={r} value={r!}>{r}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Cidade</Label>
                <Select value={cidade || 'all'} onValueChange={(v) => setCidade(v === 'all' ? '' : v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    {Array.from(new Set(clientes.map(c => c.cidade).filter(Boolean))).map(c => (
                      <SelectItem key={c} value={c!}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>UF</Label>
                <Select value={uf || 'all'} onValueChange={(v) => setUf(v === 'all' ? '' : v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    {Array.from(new Set(clientes.map(c => c.uf).filter(Boolean))).map(u => (
                      <SelectItem key={u} value={u!}>{u}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </ScrollArea>
        </CardContent>
        )}
      </Card>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Ocorrências</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.totalOcorrencias}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {kpis.emAberto} em aberto • {kpis.finalizadas} finalizadas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Refaturamentos</CardTitle>
            <RefreshCw className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.refaturamentos}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Total: {formatCurrency(kpis.valorRefaturamentos)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cancelamentos</CardTitle>
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.cancelamentos}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Total: {formatCurrency(kpis.valorCancelamentos)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Impacto Financeiro</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(kpis.impactoFinanceiro)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Soma total (Refaturamento + Cancelamento + Devolução)
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Comparativo Semanal e Taxa de Reincidência - Cards expandidos lateralmente */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="lg:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-base font-semibold">Comparativo Semanal</CardTitle>
            <Activity className="h-5 w-5 text-[#073e29] dark:text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className={`text-4xl font-bold ${comparativoSemanal.isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {comparativoSemanal.semanaAtual}
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Semana Atual: {comparativoSemanal.semanaAtual} ocorrências
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Semana Anterior: {comparativoSemanal.semanaAnterior} ocorrências
                </p>
                <p className={`text-xs font-semibold mt-2 ${comparativoSemanal.isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {comparativoSemanal.isPositive ? '↑' : '↓'} {Math.abs(comparativoSemanal.diferenca)} ({Math.abs(comparativoSemanal.percentual)}%)
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-base font-semibold">Taxa de Reincidência</CardTitle>
            <TrendingUp className="h-5 w-5 text-[#073e29] dark:text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className={`text-4xl font-bold ${kpis.taxaReincidencia > 30 ? 'text-red-600 dark:text-red-400' : 'text-[#073e29] dark:text-green-400'}`}>
                  {kpis.taxaReincidencia}%
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  {kpis.taxaReincidencia > 30 ? '⚠️ Alta - Requer atenção' : '✅ Controlada'}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Razão entre registros com Reincidência = Sim / Total de registros
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Insights Inteligentes */}
      {insights.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {insights.map((insight, index) => {
            const Icon = insight.icon
            const bgColor = insight.type === 'danger' ? 'bg-red-50 dark:bg-red-900/20' :
                           insight.type === 'warning' ? 'bg-yellow-50 dark:bg-yellow-900/20' :
                           insight.type === 'success' ? 'bg-green-50 dark:bg-green-900/20' :
                           'bg-green-50 dark:bg-green-900/20'
            const textColor = insight.type === 'danger' ? 'text-red-700 dark:text-red-300' :
                              insight.type === 'warning' ? 'text-yellow-700 dark:text-yellow-300' :
                              insight.type === 'success' ? 'text-green-700 dark:text-green-300' :
                              'text-[#073e29] dark:text-green-300'

            return (
              <Card key={index} className={bgColor}>
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <Icon className={`w-5 h-5 mt-0.5 ${textColor}`} />
                    <div>
                      <h4 className={`font-semibold ${textColor}`}>{insight.title}</h4>
                      <p className="text-sm mt-1 text-muted-foreground">{insight.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top 10 Motivos - ShadCN Bar Chart with Label */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Top 10 Motivos de Ocorrência</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={topMotivosChartConfig} className="h-[350px] w-full">
              <BarChart
                accessibilityLayer
                data={topMotivos}
                margin={{
                  top: 20,
                  right: 30,
                  left: 20,
                  bottom: 140,
                }}
              >
                <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.3} />
                <XAxis
                  dataKey="name"
                  tickLine={false}
                  tickMargin={10}
                  axisLine={false}
                  interval={0}
                  tick={({ x, y, payload }: any) => {
                    const text = payload?.payload?.name || payload?.value || ''
                    const lines = payload?.payload?.labelLines || breakTextIntoLines(text, 12)
                    return (
                      <g transform={`translate(${x},${y})`}>
                        <text
                          x={0}
                          y={0}
                          dy={16}
                          textAnchor="middle"
                          fill="#1f2937"
                          fontSize={10}
                          fontWeight="bold"
                        >
                          {lines.map((line: string, index: number) => (
                            <tspan
                              key={index}
                              x={0}
                              dy={index === 0 ? 0 : 14}
                            >
                              {line}
                            </tspan>
                          ))}
                        </text>
                      </g>
                    )
                  }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 12, fill: '#1f2937', fontWeight: 'bold' }}
                />
                <ChartTooltip
                  cursor={false}
                  content={
                    <ChartTooltipContent
                      hideLabel
                      formatter={(value: any) => {
                        const numValue = typeof value === 'number' ? value : parseFloat(String(value))
                        return [
                          `${numValue} ocorrência(s)`,
                          'Quantidade'
                        ]
                      }}
                    />
                  }
                />
                <Bar 
                  dataKey="value" 
                  fill="var(--color-value)" 
                  radius={8}
                >
                  <LabelList
                    position="top"
                    offset={12}
                    className="fill-foreground"
                    fontSize={12}
                    style={{ fontWeight: 'bold' }}
                    formatter={(value: any) => value}
                  />
                </Bar>
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Top 10 Clientes - ShadCN Bar Chart with Label */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Top 10 Clientes com Mais Ocorrências</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={topClientesChartConfig} className="h-[350px] w-full">
              <BarChart
                accessibilityLayer
                data={topClientes}
                margin={{
                  top: 20,
                  right: 30,
                  left: 20,
                  bottom: 140,
                }}
              >
                <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.3} />
                <XAxis
                  dataKey="name"
                  tickLine={false}
                  tickMargin={10}
                  axisLine={false}
                  interval={0}
                  tick={({ x, y, payload }: any) => {
                    const text = payload?.payload?.name || payload?.value || ''
                    const lines = payload?.payload?.labelLines || breakTextIntoLines(text, 12)
                    return (
                      <g transform={`translate(${x},${y})`}>
                        <text
                          x={0}
                          y={0}
                          dy={16}
                          textAnchor="middle"
                          fill="#1f2937"
                          fontSize={10}
                          fontWeight="bold"
                        >
                          {lines.map((line: string, index: number) => (
                            <tspan
                              key={index}
                              x={0}
                              dy={index === 0 ? 0 : 14}
                            >
                              {line}
                            </tspan>
                          ))}
                        </text>
                      </g>
                    )
                  }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 12, fill: '#1f2937', fontWeight: 'bold' }}
                />
                <ChartTooltip
                  cursor={false}
                  content={
                    <ChartTooltipContent
                      hideLabel
                      formatter={(value: any) => {
                        const numValue = typeof value === 'number' ? value : parseFloat(String(value))
                        return [
                          `${numValue} ocorrência(s)`,
                          'Quantidade'
                        ]
                      }}
                    />
                  }
                />
                <Bar 
                  dataKey="value" 
                  fill="var(--color-value)" 
                  radius={8}
                >
                  <LabelList
                    position="top"
                    offset={12}
                    className="fill-foreground"
                    fontSize={12}
                    style={{ fontWeight: 'bold' }}
                    formatter={(value: any) => value}
                  />
                </Bar>
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Top 5 Tipo Ocorrência - ShadCN Bar Chart with Label */}
        <Card>
          <CardHeader>
            <CardTitle>Top 5 Tipos de Ocorrência</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={tipoOcorrenciaChartConfig} className="h-[350px] w-full">
              <BarChart
                accessibilityLayer
                data={topTipoOcorrencia}
                margin={{
                  top: 20,
                  right: 30,
                  left: 20,
                  bottom: 140,
                }}
              >
                <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.3} />
                <XAxis
                  dataKey="name"
                  tickLine={false}
                  tickMargin={10}
                  axisLine={false}
                  interval={0}
                  tick={({ x, y, payload }: any) => {
                    const text = payload?.payload?.name || payload?.value || ''
                    const lines = payload?.payload?.labelLines || breakTextIntoLines(text, 12)
                    return (
                      <g transform={`translate(${x},${y})`}>
                        <text
                          x={0}
                          y={0}
                          dy={16}
                          textAnchor="middle"
                          fill="#1f2937"
                          fontSize={10}
                          fontWeight="bold"
                        >
                          {lines.map((line: string, index: number) => (
                            <tspan
                              key={index}
                              x={0}
                              dy={index === 0 ? 0 : 14}
                            >
                              {line}
                            </tspan>
                          ))}
                        </text>
                      </g>
                    )
                  }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 12, fill: '#1f2937', fontWeight: 'bold' }}
                />
                <ChartTooltip
                  cursor={false}
                  content={
                    <ChartTooltipContent
                      hideLabel
                      formatter={(value: any) => {
                        const numValue = typeof value === 'number' ? value : parseFloat(String(value))
                        return [
                          `${numValue} ocorrência(s)`,
                          'Quantidade'
                        ]
                      }}
                    />
                  }
                />
                <Bar 
                  dataKey="value" 
                  fill="var(--color-value)" 
                  radius={8}
                >
                  <LabelList
                    position="top"
                    offset={12}
                    className="fill-foreground"
                    fontSize={12}
                    style={{ fontWeight: 'bold' }}
                    formatter={(value: any) => value}
                  />
                </Bar>
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Top 5 Setores - ShadCN Bar Chart with Label */}
        <Card>
          <CardHeader>
            <CardTitle>Top 5 Setores</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={topSetoresChartConfig} className="h-[350px] w-full">
              <BarChart
                accessibilityLayer
                data={topSetores}
                margin={{
                  top: 20,
                  right: 30,
                  left: 20,
                  bottom: 140,
                }}
              >
                <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.3} />
                <XAxis
                  dataKey="name"
                  tickLine={false}
                  tickMargin={10}
                  axisLine={false}
                  interval={0}
                  tick={({ x, y, payload }: any) => {
                    const text = payload?.payload?.name || payload?.value || ''
                    const lines = payload?.payload?.labelLines || breakTextIntoLines(text, 12)
                    return (
                      <g transform={`translate(${x},${y})`}>
                        <text
                          x={0}
                          y={0}
                          dy={16}
                          textAnchor="middle"
                          fill="#1f2937"
                          fontSize={10}
                          fontWeight="bold"
                        >
                          {lines.map((line: string, index: number) => (
                            <tspan
                              key={index}
                              x={0}
                              dy={index === 0 ? 0 : 14}
                            >
                              {line}
                            </tspan>
                          ))}
                        </text>
                      </g>
                    )
                  }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 12, fill: '#1f2937', fontWeight: 'bold' }}
                />
                <ChartTooltip
                  cursor={false}
                  content={
                    <ChartTooltipContent
                      hideLabel
                      formatter={(value: any) => {
                        const numValue = typeof value === 'number' ? value : parseFloat(String(value))
                        return [
                          `${numValue} ocorrência(s)`,
                          'Quantidade'
                        ]
                      }}
                    />
                  }
                />
                <Bar 
                  dataKey="value" 
                  fill="var(--color-value)" 
                  radius={8}
                >
                  <LabelList
                    position="top"
                    offset={12}
                    className="fill-foreground"
                    fontSize={12}
                    style={{ fontWeight: 'bold' }}
                    formatter={(value: any) => value}
                  />
                </Bar>
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Top 5 Tipo Colaborador - Radar Chart */}
        <Card>
          <CardHeader className="items-center">
            <CardTitle>Top 5 Tipos de Colaborador</CardTitle>
          </CardHeader>
          <CardContent className="pb-0">
            {topTipoColaboradorRadar.length > 0 ? (
              <ChartContainer
                config={tipoColabChartConfig}
                className="mx-auto aspect-square max-h-[350px]"
              >
                <RadarChart data={topTipoColaboradorRadar}>
                  <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                  <PolarAngleAxis 
                    dataKey="name" 
                    tick={({ x, y, payload }: any) => {
                      const text = payload?.payload?.name || payload?.value || ''
                      const lines = payload?.payload?.labelLines || breakTextIntoLines(text, 12)
                      return (
                        <g transform={`translate(${x},${y})`}>
                          <text
                            x={0}
                            y={0}
                            textAnchor="middle"
                            fill="#1f2937"
                            fontSize={10}
                            fontWeight="bold"
                          >
                            {lines.map((line: string, index: number) => (
                              <tspan
                                key={index}
                                x={0}
                                dy={index === 0 ? 0 : 12}
                              >
                                {line}
                              </tspan>
                            ))}
                          </text>
                        </g>
                      )
                    }}
                  />
                  <PolarGrid stroke="#e5e7eb" />
                  <Radar
                    dataKey="value"
                    fill="var(--color-value)"
                    fillOpacity={0.6}
                    stroke="var(--color-value)"
                    strokeWidth={2}
                    dot={{
                      r: 5,
                      fill: "var(--color-value)",
                      fillOpacity: 1,
                      stroke: "#fff",
                      strokeWidth: 2,
                    }}
                    label={({ value, name }: any) => (
                      <text
                        x={0}
                        y={0}
                        dy={-10}
                        textAnchor="middle"
                        fill="#1f2937"
                        fontSize={10}
                        fontWeight="bold"
                      >
                        {value}
                      </text>
                    )}
                  />
                </RadarChart>
              </ChartContainer>
            ) : (
              <div className="h-[350px] flex items-center justify-center text-muted-foreground">
                Sem dados para exibir
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top 5 Redes - Radar Chart */}
        <Card>
          <CardHeader className="items-center">
            <CardTitle>Top 5 Redes</CardTitle>
          </CardHeader>
          <CardContent className="pb-0">
            {topRedesRadar.length > 0 ? (
              <ChartContainer
                config={redesChartConfig}
                className="mx-auto aspect-square max-h-[350px]"
              >
                <RadarChart data={topRedesRadar}>
                  <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                  <PolarAngleAxis 
                    dataKey="name" 
                    tick={({ x, y, payload }: any) => {
                      const text = payload?.payload?.name || payload?.value || ''
                      const lines = payload?.payload?.labelLines || breakTextIntoLines(text, 12)
                      return (
                        <g transform={`translate(${x},${y})`}>
                          <text
                            x={0}
                            y={0}
                            textAnchor="middle"
                            fill="#1f2937"
                            fontSize={10}
                            fontWeight="bold"
                          >
                            {lines.map((line: string, index: number) => (
                              <tspan
                                key={index}
                                x={0}
                                dy={index === 0 ? 0 : 12}
                              >
                                {line}
                              </tspan>
                            ))}
                          </text>
                        </g>
                      )
                    }}
                  />
                  <PolarGrid stroke="#e5e7eb" />
                  <Radar
                    dataKey="value"
                    fill="var(--color-value)"
                    fillOpacity={0.6}
                    stroke="var(--color-value)"
                    strokeWidth={2}
                    dot={{
                      r: 5,
                      fill: "var(--color-value)",
                      fillOpacity: 1,
                      stroke: "#fff",
                      strokeWidth: 2,
                    }}
                    label={({ value, name }: any) => (
                      <text
                        x={0}
                        y={0}
                        dy={-10}
                        textAnchor="middle"
                        fill="#1f2937"
                        fontSize={10}
                        fontWeight="bold"
                      >
                        {value}
                      </text>
                    )}
                  />
                </RadarChart>
              </ChartContainer>
            ) : (
              <div className="h-[350px] flex items-center justify-center text-muted-foreground">
                Sem dados para exibir
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Evolução Temporal - Area Chart (Largura Total) */}
      <div className="grid grid-cols-1 gap-4">
        <Card className="pt-0">
          <CardHeader className="flex items-center gap-2 space-y-0 border-b py-5 sm:flex-row">
            <div className="grid flex-1 gap-1">
              <CardTitle>Evolução no Tempo (Quantidade de Registros)</CardTitle>
              <CardDescription>
                Evolução da quantidade de ocorrências registradas ao longo do tempo
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Label htmlFor="filtro-evolucao" className="text-sm">Período:</Label>
              <Select value={filtroEvolucao} onValueChange={setFiltroEvolucao}>
                <SelectTrigger id="filtro-evolucao" className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hoje">Hoje</SelectItem>
                  <SelectItem value="ontem">Ontem</SelectItem>
                  <SelectItem value="semana_atual">Semana Atual</SelectItem>
                  <SelectItem value="semana_anterior">Semana Anterior</SelectItem>
                  <SelectItem value="mes_atual">Mês Atual</SelectItem>
                  <SelectItem value="mes_anterior">Mês Anterior</SelectItem>
                  <SelectItem value="trimestre_atual">Trimestre Atual</SelectItem>
                  <SelectItem value="trimestre_anterior">Trimestre Anterior</SelectItem>
                  <SelectItem value="semestre_atual">Semestre Atual</SelectItem>
                  <SelectItem value="semestre_anterior">Semestre Anterior</SelectItem>
                  <SelectItem value="ano_atual">Ano Atual</SelectItem>
                  <SelectItem value="ano_anterior">Ano Anterior</SelectItem>
                  <SelectItem value="todo_periodo">Todo Período</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
            {evolucaoTemporalList.length > 0 ? (
              <ChartContainer
                config={evolucaoChartConfig}
                className="aspect-auto h-[300px] w-full"
              >
                <AreaChart data={evolucaoTemporalList} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                  <defs>
                    <linearGradient id="fillQuantidade" x1="0" y1="0" x2="0" y2="1">
                      <stop
                        offset="5%"
                        stopColor="var(--color-quantidade)"
                        stopOpacity={0.8}
                      />
                      <stop
                        offset="95%"
                        stopColor="var(--color-quantidade)"
                        stopOpacity={0.1}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} />
                  <XAxis
                    dataKey="date"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    minTickGap={32}
                    tick={{ fontSize: 11, fill: '#1f2937' }}
                    tickFormatter={(value) => {
                      try {
                        const date = new Date(value)
                        return date.toLocaleDateString("pt-BR", {
                          day: "2-digit",
                          month: "2-digit",
                        })
                      } catch {
                        return value
                      }
                    }}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#1f2937' }}
                    tickFormatter={(value) => `${value}`}
                  />
                  <ChartTooltip
                    cursor={false}
                    content={
                      <ChartTooltipContent
                        labelFormatter={(value) => {
                          try {
                            const date = typeof value === 'string' ? new Date(value) : value
                            if (date instanceof Date && !isNaN(date.getTime())) {
                              return date.toLocaleDateString("pt-BR", {
                                day: "2-digit",
                                month: "2-digit",
                              })
                            }
                            return String(value)
                          } catch {
                            return String(value)
                          }
                        }}
                        formatter={(value: any) => {
                          const numValue = typeof value === 'number' ? value : parseFloat(String(value))
                          return [
                            `${numValue} registro(s)`,
                            'Quantidade'
                          ]
                        }}
                        indicator="dot"
                      />
                    }
                  />
                  <Area
                    dataKey="quantidade"
                    type="natural"
                    fill="url(#fillQuantidade)"
                    stroke="var(--color-quantidade)"
                    strokeWidth={2}
                    stackId="a"
                    dot={{ 
                      r: 4, 
                      fill: "var(--color-quantidade)",
                      stroke: "#fff",
                      strokeWidth: 2
                    }}
                    activeDot={{ 
                      r: 6, 
                      fill: "var(--color-quantidade)",
                      stroke: "#fff",
                      strokeWidth: 2
                    }}
                    label={({ quantidade, date }: any) => {
                      // Mostrar valores apenas em alguns pontos para não poluir
                      const index = evolucaoTemporalList.findIndex((d: any) => d.date === date)
                      if (index % Math.ceil(evolucaoTemporalList.length / 8) === 0 || index === evolucaoTemporalList.length - 1) {
                        return (
                          <text
                            x={0}
                            y={-8}
                            textAnchor="middle"
                            fill="#1f2937"
                            fontSize={10}
                            fontWeight="bold"
                          >
                            {quantidade}
                          </text>
                        )
                      }
                      return null
                    }}
                  />
                </AreaChart>
              </ChartContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                Sem dados para exibir
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tabelas Analíticas (Top 10 de cada, 2 por linha) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Top 10: Motivos x Setor</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {topSetorMotivo.length > 0 ? (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="text-left p-2 font-semibold">Combinação</th>
                      <th className="text-right p-2 font-semibold">Qtd</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topSetorMotivo.map((item, index) => (
                      <tr key={index} className="border-b hover:bg-muted/50">
                        <td className="p-2">{item.key.substring(0, 50)}{item.key.length > 50 ? '...' : ''}</td>
                        <td className="p-2 text-right font-semibold text-[#073e29] dark:text-green-400">{item.count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">Nenhum dado disponível</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top 10: Clientes x Motivos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {topClientesXMotivos.length > 0 ? (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="text-left p-2 font-semibold">Combinação</th>
                      <th className="text-right p-2 font-semibold">Qtd</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topClientesXMotivos.map((item, index) => (
                      <tr key={index} className="border-b hover:bg-muted/50">
                        <td className="p-2">{item.key.substring(0, 50)}{item.key.length > 50 ? '...' : ''}</td>
                        <td className="p-2 text-right font-semibold text-[#073e29] dark:text-green-400">{item.count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">Nenhum dado disponível</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top 10: Tipo Colab x Motivos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {topColabMotivo.length > 0 ? (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="text-left p-2 font-semibold">Combinação</th>
                      <th className="text-right p-2 font-semibold">Qtd</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topColabMotivo.map((item, index) => (
                      <tr key={index} className="border-b hover:bg-muted/50">
                        <td className="p-2">{item.key.substring(0, 50)}{item.key.length > 50 ? '...' : ''}</td>
                        <td className="p-2 text-right font-semibold text-[#073e29] dark:text-green-400">{item.count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">Nenhum dado disponível</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top 10: Tipo Colab x Tipo Ocorrência</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {topTipoColabXTipoOcorrencia.length > 0 ? (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="text-left p-2 font-semibold">Combinação</th>
                      <th className="text-right p-2 font-semibold">Qtd</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topTipoColabXTipoOcorrencia.map((item, index) => (
                      <tr key={index} className="border-b hover:bg-muted/50">
                        <td className="p-2">{item.key.substring(0, 50)}{item.key.length > 50 ? '...' : ''}</td>
                        <td className="p-2 text-right font-semibold text-[#073e29] dark:text-green-400">{item.count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">Nenhum dado disponível</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top 10: Vendedor x Tipo Ocorrência</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {topVendedorXTipoOcorrencia.length > 0 ? (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="text-left p-2 font-semibold">Combinação</th>
                      <th className="text-right p-2 font-semibold">Qtd</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topVendedorXTipoOcorrencia.map((item, index) => (
                      <tr key={index} className="border-b hover:bg-muted/50">
                        <td className="p-2">{item.key.substring(0, 50)}{item.key.length > 50 ? '...' : ''}</td>
                        <td className="p-2 text-right font-semibold text-[#073e29] dark:text-green-400">{item.count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">Nenhum dado disponível</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top 10: Vendedor x Motivo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {topVendedorXMotivo.length > 0 ? (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="text-left p-2 font-semibold">Combinação</th>
                      <th className="text-right p-2 font-semibold">Qtd</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topVendedorXMotivo.map((item, index) => (
                      <tr key={index} className="border-b hover:bg-muted/50">
                        <td className="p-2">{item.key.substring(0, 50)}{item.key.length > 50 ? '...' : ''}</td>
                        <td className="p-2 text-right font-semibold text-[#073e29] dark:text-green-400">{item.count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">Nenhum dado disponível</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      </div>
    </InternalLayout>
  )
}
