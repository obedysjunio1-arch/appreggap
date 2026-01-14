import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  FileText, 
  Users, 
  DollarSign, 
  CheckCircle, 
  Clock, 
  XCircle, 
  RotateCcw, 
  AlertTriangle, 
  Download, 
  Filter, 
  Building, 
  PieChart,
  Calendar,
  Activity,
  Truck,
  AlertCircle,
  SortAsc,
  SortDesc,
  LineChart,
  Target
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '../components/ui/table'
import { Input } from '../components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import { Alert, AlertDescription, AlertTitle } from '../components/ui/alert'
import { Progress } from '../components/ui/progress'
import { Separator } from '../components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs'
import { Badge } from '../components/ui/badge'
import { Bar } from 'react-chartjs-2'
import { useTheme, useIsDarkMode } from '../context/ThemeContext'
import PageHeader from '../components/PageHeader.jsx'
import { getRegistrosWithFilters } from '../lib/supabase'
import { DivMotion } from '../components/ui/divmotion.jsx'
import { API_URL } from '../config/api'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
)


const Dashboard = () => {
  const navigate = useNavigate()
  const { theme } = useTheme()
  const isDarkMode = useIsDarkMode()
  const cssVars = typeof window !== 'undefined' ? getComputedStyle(document.documentElement) : null
  const textColor = (cssVars?.getPropertyValue('--text') || (theme === 'dark' ? '#FFFFFF' : '#0f172a')).trim()
  const gridColor = theme === 'dark' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)'
  // State management
  const [stats, setStats] = useState({
    totalNotas: 0,
    notasEntregues: 0,
    notasPendentes: 0,
    notasCanceladas: 0,
    notasDevolvidas: 0,
    eficiencia: 0,
    valorPendente: 0,
    notasAtrasadas: 0,
    notasHoje: 0
  })
  
  const [dashboardData, setDashboardData] = useState({})
  const [registros, setRegistros] = useState([])
  const [chartsReady, setChartsReady] = useState(false)
  const [recentFiles, setRecentFiles] = useState([])
  const [loading, setLoading] = useState(true)
  const [chartData, setChartData] = useState({
    evolution: null,
    statusDistribution: null,
    topFretistas: null,
    topClients: null
  })
  const [systemStatus, setSystemStatus] = useState({
    api: 'offline',
    database: 'disconnected',
    sheets: 'no_connection',
    updatedAt: null
  })
  
  // Estado para opções de filtros dinâmicos
  const [filterOptions, setFilterOptions] = useState({
    periods: [
      { value: 'hoje', label: 'Hoje' },
      { value: 'ontem', label: 'Ontem' },
      { value: 'ultimos7dias', label: 'Últimos 7 dias' },
      { value: 'ultimos30dias', label: 'Últimos 30 dias' },
      { value: 'mesAtual', label: 'Mês atual' },
      { value: 'mesAnterior', label: 'Mês anterior' },
      { value: 'personalizado', label: 'Período personalizado' }
    ],
    fretistas: [],
    placas: [],
    clientes: [],
    redes: [],
    vendedores: [],
    ufs: [],
    status: [],
    situacoes: []
  })
  // Estados de ordenação para tabelas
  const [sortAtrasos, setSortAtrasos] = useState({ key: 'cliente', order: 'asc' })
  const [sortVencimentos, setSortVencimentos] = useState({ key: 'cliente', order: 'asc' })
  
  // Health check do sistema (API, banco, Google Sheets)
  useEffect(() => {
    let cancelled = false
    async function fetchHealth() {
      try {
        const resp = await fetch(`${API_URL}/api/health`)
        if (!resp.ok) throw new Error('Falha ao obter saúde do sistema')
        const json = await resp.json()
        if (!cancelled) {
          setSystemStatus({
            api: json.api === 'online' ? 'online' : 'offline',
            database: json.database === 'connected' ? 'connected' : 'disconnected',
            sheets: json.sheets === 'synced' ? 'synced' : 'no_connection',
            updatedAt: new Date()
          })
        }
      } catch (e) {
        if (!cancelled) {
          setSystemStatus({
            api: 'offline',
            database: 'disconnected',
            sheets: 'no_connection',
            updatedAt: new Date()
          })
        }
      }
    }
    fetchHealth()
    const id = setInterval(fetchHealth, 30000)
    return () => { cancelled = true; clearInterval(id) }
  }, [])
  
  // Filter states
  const [filters, setFilters] = useState({
    dateFrom: '',
    dateTo: '',
    period: '',
    fretista: '',
    placa: '',
    cliente: '',
    rede: '',
    vendedor: '',
    uf: '',
    status: '',
    situacao: '',
    searchText: '',
    dateRange: {
      start: '',
      end: ''
    }
  })

  // Estado separado para busca livre (com debounce)
  const [searchInput, setSearchInput] = useState('')

  // NÃO carregar filtros salvos - sempre começar sem filtros
  // useEffect(() => {
  //   try {
  //     const saved = JSON.parse(localStorage.getItem('dashboardFilters') || 'null')
  //     if (saved && typeof saved === 'object') {
  //       setFilters(prev => ({ ...prev, ...saved }))
  //     }
  //   } catch {}
  // }, [])



  // Fetch dashboard data
  const fetchDashboardData = React.useCallback(async () => {
    try {
      setLoading(true)
      const queryParams = new URLSearchParams()

      // Resolver período em dataFrom/dataTo
      const resolvePeriod = () => {
        const today = new Date()
        const toISO = (d) => d.toISOString().slice(0,10)
        const startOfMonth = (d) => new Date(d.getFullYear(), d.getMonth(), 1)
        const endOfMonth = (d) => new Date(d.getFullYear(), d.getMonth() + 1, 0)
        switch (filters.period) {
          case 'hoje': {
            const d = toISO(today)
            return { dateFrom: d, dateTo: d }
          }
          case 'ontem': {
            const y = new Date(today); y.setDate(y.getDate() - 1)
            const d = toISO(y)
            return { dateFrom: d, dateTo: d }
          }
          case 'ultimos7dias': {
            const start = new Date(today); start.setDate(start.getDate() - 6)
            return { dateFrom: toISO(start), dateTo: toISO(today) }
          }
          case 'ultimos30dias': {
            const start = new Date(today); start.setDate(start.getDate() - 29)
            return { dateFrom: toISO(start), dateTo: toISO(today) }
          }
          case 'mesAtual': {
            const s = startOfMonth(today)
            const e = endOfMonth(today)
            return { dateFrom: toISO(s), dateTo: toISO(e) }
          }
          case 'mesAnterior': {
            const prev = new Date(today.getFullYear(), today.getMonth() - 1, 1)
            const s = startOfMonth(prev)
            const e = endOfMonth(prev)
            return { dateFrom: toISO(s), dateTo: toISO(e) }
          }
          case 'personalizado': {
            const start = filters.dateRange.start || filters.dateFrom || ''
            const end = filters.dateRange.end || filters.dateTo || ''
            return { dateFrom: start, dateTo: end }
          }
          default: {
            return {
              dateFrom: filters.dateFrom || (filters.dateRange.start || ''),
              dateTo: filters.dateTo || (filters.dateRange.end || '')
            }
          }
        }
      }

      const periodDates = resolvePeriod()
      const effectiveFilters = { ...filters, ...periodDates }

      Object.entries(effectiveFilters).forEach(([key, value]) => {
        // Não enviar parâmetros vazios ou apenas espaços
        if (value && key !== 'dateRange' && String(value).trim() !== '') {
          queryParams.append(key, value)
        }
      })

      const response = await fetch(`${API_URL}/api/dashboard?${queryParams}`)
      const data = await response.json()
      setDashboardData(data)
    } catch (error) {
      console.error('Erro ao carregar dados do dashboard:', error)
    } finally {
      setLoading(false)
    }
  }, [filters])

  const mapFiltersToSupabase = React.useCallback(() => {
    const today = new Date()
    const toISO = (d) => d.toISOString().slice(0,10)
    const startOfMonth = (d) => new Date(d.getFullYear(), d.getMonth(), 1)
    const endOfMonth = (d) => new Date(d.getFullYear(), d.getMonth() + 1, 0)
    let dataInicio = filters.dateFrom || filters.dateRange.start || ''
    let dataFim = filters.dateTo || filters.dateRange.end || ''

    switch (filters.period) {
      case 'hoje': {
        const d = toISO(today)
        dataInicio = d; dataFim = d
        break
      }
      case 'ontem': {
        const y = new Date(today); y.setDate(y.getDate() - 1)
        const d = toISO(y)
        dataInicio = d; dataFim = d
        break
      }
      case 'ultimos7dias': {
        const start = new Date(today); start.setDate(start.getDate() - 6)
        dataInicio = toISO(start); dataFim = toISO(today)
        break
      }
      case 'ultimos30dias': {
        const start = new Date(today); start.setDate(start.getDate() - 29)
        dataInicio = toISO(start); dataFim = toISO(today)
        break
      }
      case 'mesAtual': {
        const s = startOfMonth(today)
        const e = endOfMonth(today)
        dataInicio = toISO(s); dataFim = toISO(e)
        break
      }
      case 'mesAnterior': {
        const prev = new Date(today.getFullYear(), today.getMonth() - 1, 1)
        const s = startOfMonth(prev)
        const e = endOfMonth(prev)
        dataInicio = toISO(s); dataFim = toISO(e)
        break
      }
      case 'personalizado': {
        dataInicio = filters.dateRange.start || filters.dateFrom || ''
        dataFim = filters.dateRange.end || filters.dateTo || ''
        break
      }
      default: {}
    }

    return {
      // Só incluir dataInicio e dataFim se realmente tiverem valores
      ...(dataInicio && dataInicio.trim() !== '' ? { dataInicio } : {}),
      ...(dataFim && dataFim.trim() !== '' ? { dataFim } : {}),
      ...(filters.fretista && filters.fretista.trim() !== '' ? { fretista: filters.fretista } : {}),
      ...(filters.placa && filters.placa.trim() !== '' ? { placa: filters.placa } : {}),
      ...(filters.cliente && filters.cliente.trim() !== '' ? { cliente: filters.cliente } : {}),
      ...(filters.rede && filters.rede.trim() !== '' ? { rede: filters.rede } : {}),
      ...(filters.vendedor && filters.vendedor.trim() !== '' ? { vendedor: filters.vendedor } : {}),
      ...(filters.uf && filters.uf.trim() !== '' ? { uf: filters.uf } : {}),
      ...(filters.status && filters.status.trim() !== '' ? { status: filters.status } : {}),
      ...(filters.situacao && filters.situacao.trim() !== '' ? { situacao: filters.situacao } : {}),
      ...(filters.searchText && filters.searchText.trim() !== '' ? { busca: filters.searchText } : {})
    }
  }, [filters])

  const fetchRegistros = React.useCallback(async () => {
    try {
      const filtrosSupabase = mapFiltersToSupabase()
      const { data } = await getRegistrosWithFilters(filtrosSupabase)
      setRegistros(Array.isArray(data) ? data : [])
      setChartsReady(true)
    } catch (e) {
      setRegistros([])
      setChartsReady(false)
    }
  }, [mapFiltersToSupabase])

  // Fetch filter options from backend
  const fetchFilterOptions = React.useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/api/dashboard/filter-options`)
      const data = await response.json()
      setFilterOptions(prev => ({
        ...prev,
        fretistas: data.fretistas?.map(f => ({ value: f, label: f })) || [],
        placas: data.placas?.map(p => ({ value: p, label: p })) || [],
        clientes: data.clientes?.map(c => ({ value: c, label: c })) || [],
        redes: data.redes?.map(r => ({ value: r, label: r })) || [],
        vendedores: data.vendedores?.map(v => ({ value: v, label: v })) || [],
        ufs: data.ufs?.map(u => ({ value: u, label: u })) || [],
        status: data.status?.map(s => ({ value: s, label: s })) || [],
        situacoes: data.situacoes?.map(s => ({ value: s, label: s })) || []
      }))
    } catch (error) {
      console.error('Erro ao carregar opções de filtros:', error)
    }
  }, [])

  // NÃO salvar filtros no localStorage - sempre começar sem filtros
  // useEffect(() => {
  //   try { localStorage.setItem('dashboardFilters', JSON.stringify(filters)) } catch {}
  // }, [filters])

  // Sincronizar searchInput com filters.searchText após debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== filters.searchText) {
        updateFilter('searchText', searchInput)
      }
    }, 500) // Aguardar 500ms após parar de digitar
    
    return () => {
      clearTimeout(timer)
    }
  }, [searchInput]) // eslint-disable-line react-hooks/exhaustive-deps

  // Sincronizar filters.searchText inicial com searchInput
  useEffect(() => {
    setSearchInput(filters.searchText || '')
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchDashboardData()
    fetchRegistros()
    fetchFilterOptions()
  }, [fetchDashboardData, fetchRegistros, fetchFilterOptions])

  // Tratamento robusto para erro ResizeObserver (erro conhecido do React/Radix UI)
  useEffect(() => {
    // Suprimir ResizeObserver errors no console
    const originalConsoleError = console.error
    console.error = (...args) => {
      if (args[0]?.toString().includes('ResizeObserver')) {
        return // Suprime o erro
      }
      originalConsoleError.apply(console, args)
    }

    // Tratamento de erros não capturados
    const errorHandler = (event) => {
      if (event.message && (
        event.message.includes('ResizeObserver loop') ||
        event.message.includes('ResizeObserver loop limit exceeded') ||
        event.message.includes('ResizeObserver loop completed')
      )) {
        event.preventDefault()
        event.stopPropagation()
        return false
      }
    }

    // Tratamento de promises rejeitadas
    const rejectionHandler = (event) => {
      const reason = event.reason
      if (reason && (
        (typeof reason === 'string' && reason.includes('ResizeObserver')) ||
        (reason.message && reason.message.includes('ResizeObserver'))
      )) {
        event.preventDefault()
        return false
      }
    }

    window.addEventListener('error', errorHandler, true)
    window.addEventListener('unhandledrejection', rejectionHandler, true)

    return () => {
      console.error = originalConsoleError
      window.removeEventListener('error', errorHandler, true)
      window.removeEventListener('unhandledrejection', rejectionHandler, true)
    }
  }, [])

  // Normalização de status - manter valores originais do banco (CANCELADO, PROCESSADO, etc)
  const normalizeStatus = (s) => {
    const v = (s || 'PENDENTE').toString().trim().toUpperCase()
    // Manter valores originais do banco: CANCELADO, PROCESSADO, ENTREGUE, PENDENTE
    // Apenas normalizar variações comuns
    if (v === 'DEVOLVIDO') return 'DEVOLVIDA'
    // Retornar o valor original (já em maiúsculas) para manter consistência com o banco
    return v
  }

  const getValorTotal = () => {
    return registros.reduce((sum, r) => sum + (parseFloat(r.valor_total) || 0), 0)
  }

  const getValorPendente = () => {
    return registros.filter(r => normalizeStatus(r.status) === 'PENDENTE').reduce((sum, r) => sum + (parseFloat(r.valor_total) || 0), 0)
  }

  const countByStatus = (key) => {
    const target = key.toUpperCase()
    // Contar status considerando variações (CANCELADO/CANCELADA, etc)
    return registros.filter(r => {
      const statusNorm = normalizeStatus(r.status)
      if (target === 'CANCELADA') {
        return statusNorm === 'CANCELADO' || statusNorm === 'CANCELADA'
      }
      if (target === 'DEVOLVIDA') {
        return statusNorm === 'DEVOLVIDA' || statusNorm === 'DEVOLVIDO'
      }
      return statusNorm === target
    }).length
  }

  const uniq = (arr) => Array.from(new Set(arr))

  const groupBy = (arr, getKey) => {
    const map = new Map()
    for (const item of arr) {
      const k = getKey(item)
      map.set(k, (map.get(k) || []).concat([item]))
    }
    return map
  }

  const monthKey = (d) => {
    try {
      const dt = new Date(d)
      const y = dt.getFullYear()
      const m = String(dt.getMonth() + 1).padStart(2, '0')
      return `${y}-${m}`
    } catch { return '' }
  }

  const labelFromMonthKey = (mk) => {
    const [y,m] = mk.split('-')
    return `${m}/${y}`
  }

  const buildFretistaStatusBarData = () => {
    const pendentes = registros.filter(r => normalizeStatus(r.status) === 'PENDENTE')
    const labels = uniq(pendentes.map(r => r.fretista || '—'))
    return {
      labels,
      datasets: [{
        label: 'Pendentes',
        data: labels.map(f => pendentes.filter(r => (r.fretista || '—') === f).length),
        backgroundColor: 'rgba(245, 158, 11, 0.6)',
        borderColor: 'rgba(245, 158, 11, 1)',
        borderWidth: 1
      }]
    }
  }

  const buildFretistaLineData = (statusKey = 'PENDENTE') => {
    const status = statusKey.toUpperCase()
    const pendentes = registros.filter(r => normalizeStatus(r.status) === status)
    const mapF = groupBy(pendentes, r => r.fretista || '—')
    const sorted = Array.from(mapF.entries()).sort((a,b) => b[1].length - a[1].length).slice(0,5)
    // Apenas meses que ainda têm registros pendentes
    const monthsWithPendentes = uniq(pendentes.map(r => monthKey(r.data_emissao)).filter(Boolean)).sort()
    const datasets = sorted.map(([f, items], i) => ({
      label: `${f}`,
      data: monthsWithPendentes.map(mk => items.filter(it => monthKey(it.data_emissao) === mk).length),
      borderColor: ['#3b82f6','#10b981','#ef4444','#f59e0b','#8b5cf6'][i % 5],
      backgroundColor: ['#93c5fd','#6ee7b7','#fecaca','#fde68a','#d8b4fe'][i % 5],
      tension: 0.3,
      fill: false
    }))
    return { labels: monthsWithPendentes.map(labelFromMonthKey), datasets }
  }

  const [selectedClient, setSelectedClient] = useState('')
  const clientsList = React.useMemo(() => uniq(registros.map(r => r.nome_fantasia || r.cliente || '—')).filter(Boolean), [registros])

  const buildClienteDonutData = () => {
    const client = selectedClient || clientsList[0] || '—'
    const arr = registros.filter(r => (r.nome_fantasia || r.cliente || '—') === client)
    const labels = ['ENTREGUE','PENDENTE','CANCELADA','DEVOLVIDA']
    const data = labels.map(s => {
      if (s === 'CANCELADA') {
        return arr.filter(r => {
          const st = normalizeStatus(r.status)
          return st === 'CANCELADO' || st === 'CANCELADA'
        }).length
      }
      if (s === 'DEVOLVIDA') {
        return arr.filter(r => {
          const st = normalizeStatus(r.status)
          return st === 'DEVOLVIDA' || st === 'DEVOLVIDO'
        }).length
      }
      return arr.filter(r => normalizeStatus(r.status) === s).length
    })
    return {
      labels,
      datasets: [{
        data,
        backgroundColor: ['#22c55e','#f59e0b','#ef4444','#f97316'],
        borderColor: ['#16a34a','#d97706','#dc2626','#ea580c'],
        borderWidth: 1
      }]
    }
  }

  const buildClienteRankingBarData = () => {
    const mapC = new Map()
    for (const r of registros) {
      const k = r.nome_fantasia || r.cliente || '—'
      const st = normalizeStatus(r.status)
      if (st === 'PENDENTE') {
        if (!mapC.has(k)) mapC.set(k, 0)
        mapC.set(k, mapC.get(k) + 1)
      }
    }
    const sorted = Array.from(mapC.entries()).sort((a,b) => b[1] - a[1]).slice(0,10)
    return {
      labels: sorted.map(([c]) => c),
      datasets: [{
        label: 'Pendentes',
        data: sorted.map(([,v]) => v),
        backgroundColor: 'rgba(59, 130, 246, 0.6)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 1
      }]
    }
  }

  const buildRedeStackedData = () => {
    const labels = uniq(registros.map(r => r.rede || '—'))
    const statuses = ['PENDENTE','ENTREGUE','CANCELADA','DEVOLVIDA']
    const datasets = statuses.map((s, idx) => ({
      label: s,
      data: labels.map(rede => {
        const registrosRede = registros.filter(r => (r.rede || '—') === rede)
        if (s === 'CANCELADA') {
          return registrosRede.filter(r => {
            const st = normalizeStatus(r.status)
            return st === 'CANCELADO' || st === 'CANCELADA'
          }).length
        }
        if (s === 'DEVOLVIDA') {
          return registrosRede.filter(r => {
            const st = normalizeStatus(r.status)
            return st === 'DEVOLVIDA' || st === 'DEVOLVIDO'
          }).length
        }
        return registrosRede.filter(r => normalizeStatus(r.status) === s).length
      }),
      backgroundColor: ['#f59e0b','#22c55e','#ef4444','#f97316'][idx],
      borderColor: ['#d97706','#16a34a','#dc2626','#ea580c'][idx],
      borderWidth: 1
    }))
    return { labels, datasets }
  }

  const buildUFHeat = (statusKey = 'PENDENTE') => {
    const status = statusKey.toUpperCase()
    const mapUF = new Map()
    for (const r of registros) {
      const uf = r.uf || '—'
      const st = normalizeStatus(r.status)
      if (st !== status) continue
      mapUF.set(uf, (mapUF.get(uf) || 0) + 1)
    }
    return Array.from(mapUF.entries()).sort((a,b) => b[1] - a[1])
  }

  const buildUFLineData = (statusKey = 'PENDENTE') => {
    const status = statusKey.toUpperCase()
    const mapUF = groupBy(registros.filter(r => normalizeStatus(r.status) === status), r => r.uf || '—')
    const sorted = Array.from(mapUF.entries()).sort((a,b) => b[1].length - a[1].length).slice(0,5)
    const months = uniq(registros.map(r => monthKey(r.data_emissao)).filter(Boolean)).sort()
    const datasets = sorted.map(([uf, items], i) => ({
      label: uf,
      data: months.map(mk => items.filter(it => monthKey(it.data_emissao) === mk).length),
      borderColor: ['#3b82f6','#10b981','#ef4444','#f59e0b','#8b5cf6'][i % 5],
      backgroundColor: ['#93c5fd','#6ee7b7','#fecaca','#fde68a','#d8b4fe'][i % 5],
      tension: 0.3,
      fill: false
    }))
    return { labels: months.map(labelFromMonthKey), datasets }
  }

  const buildVendedorProblemsData = () => {
    const mapV = new Map()
    for (const r of registros) {
      const v = r.vendedor || '—'
      const st = normalizeStatus(r.status)
      if (st === 'PENDENTE') {
        if (!mapV.has(v)) mapV.set(v, 0)
        mapV.set(v, mapV.get(v) + 1)
      }
    }
    const sorted = Array.from(mapV.entries()).sort((a,b) => b[1] - a[1]).slice(0,10)
    return {
      labels: sorted.map(([v]) => v),
      datasets: [{
        label: 'Pendentes',
        data: sorted.map(([,n]) => n),
        backgroundColor: 'rgba(234, 88, 12, 0.6)',
        borderColor: 'rgba(234, 88, 12, 1)',
        borderWidth: 1
      }]
    }
  }

  const buildPlacaStatusData = () => {
    const pendentes = registros.filter(r => normalizeStatus(r.status) === 'PENDENTE')
    const labels = uniq(pendentes.map(r => r.placa || '—'))
    return {
      labels,
      datasets: [{
        label: 'Pendentes',
        data: labels.map(p => pendentes.filter(r => (r.placa || '—') === p).length),
        backgroundColor: 'rgba(245, 158, 11, 0.6)',
        borderColor: 'rgba(245, 158, 11, 1)',
        borderWidth: 1
      }]
    }
  }

  const avgDays = (emissao, entrega) => {
    if (!emissao || !entrega) return null
    try {
      const d1 = new Date(emissao)
      const d2 = new Date(entrega)
      const diff = Math.floor((d2 - d1) / (1000*60*60*24))
      return diff >= 0 ? diff : null
    } catch { return null }
  }

  const buildPlacaAvgEntregaLineData = () => {
    const mapP = groupBy(registros.filter(r => r.data_entrega), r => r.placa || '—')
    const sorted = Array.from(mapP.entries()).map(([placa, items]) => {
      const vals = items.map(it => avgDays(it.data_emissao, it.data_entrega)).filter(v => v !== null)
      const media = vals.length ? vals.reduce((a,b)=>a+b,0)/vals.length : 0
      return { placa, media }
    }).sort((a,b)=> b.media - a.media).slice(0,10)
    return {
      labels: sorted.map(x=>x.placa),
      datasets: [{
        label: 'Dias médios de entrega',
        data: sorted.map(x=>Number(x.media.toFixed(2))),
        backgroundColor: 'rgba(16, 185, 129, 0.6)',
        borderColor: 'rgba(16, 185, 129, 1)',
        borderWidth: 1
      }]
    }
  }

  const buildStatusOverTimeData = () => {
    const daysMap = new Map()
    const statuses = ['ENTREGUE','PENDENTE','DEVOLVIDA','CANCELADA']
    for (const r of registros) {
      const d = (r.data_emissao || '').slice(0,10)
      if (!d) continue
      const st = normalizeStatus(r.status)
      if (!daysMap.has(d)) daysMap.set(d, {ENTREGUE:0,PENDENTE:0,DEVOLVIDA:0,CANCELADA:0})
      
      // Mapear status para categorias
      if (st === 'ENTREGUE') {
        daysMap.get(d).ENTREGUE++
      } else if (st === 'PENDENTE') {
        daysMap.get(d).PENDENTE++
      } else if (st === 'DEVOLVIDA' || st === 'DEVOLVIDO') {
        daysMap.get(d).DEVOLVIDA++
      } else if (st === 'CANCELADO' || st === 'CANCELADA') {
        daysMap.get(d).CANCELADA++
      }
    }
    const labels = Array.from(daysMap.keys()).sort()
    const datasets = statuses.map((s, idx)=>({
      label: s,
      data: labels.map(d => daysMap.get(d)[s]||0),
      borderColor: ['#22c55e','#f59e0b','#f97316','#ef4444'][idx],
      backgroundColor: ['#86efac','#fde68a','#fdba74','#fecaca'][idx],
      tension: 0.3,
      fill: false
    }))
    return { labels, datasets }
  }

  const buildWeekdayBarsData = () => {
    const hoje = new Date()
    const seteDiasAtras = new Date(hoje)
    seteDiasAtras.setDate(hoje.getDate() - 7)
    
    const pendentesUltimos7Dias = registros.filter(r => {
      if (normalizeStatus(r.status) !== 'PENDENTE') return false
      try {
        const dataEmissao = new Date(r.data_emissao)
        return dataEmissao >= seteDiasAtras && dataEmissao <= hoje
      } catch {
        return false
      }
    })
    
    const week = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb']
    const counts = new Array(7).fill(0)
    for (const r of pendentesUltimos7Dias) {
      try {
        const d = new Date(r.data_emissao)
        counts[d.getDay()]++
      } catch {}
    }
    return {
      labels: week,
      datasets: [{
        label: 'Pendências',
        data: counts,
        backgroundColor: 'rgba(59, 130, 246, 0.6)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 1
      }]
    }
  }


  const buildRedeStatusHeatmapData = () => {
    const redes = uniq(registros.map(r => r.rede || '—')).filter(r => r !== '—')
    const statuses = ['PENDENTE', 'ENTREGUE', 'CANCELADA', 'DEVOLVIDA']
    const matrix = redes.map(rede => {
      const redeRegistros = registros.filter(r => (r.rede || '—') === rede)
      return {
        rede,
        statuses: statuses.map(status => {
          let count = 0
          if (status === 'CANCELADA') {
            count = redeRegistros.filter(r => {
              const st = normalizeStatus(r.status)
              return st === 'CANCELADO' || st === 'CANCELADA'
            }).length
          } else if (status === 'DEVOLVIDA') {
            count = redeRegistros.filter(r => {
              const st = normalizeStatus(r.status)
              return st === 'DEVOLVIDA' || st === 'DEVOLVIDO'
            }).length
          } else {
            count = redeRegistros.filter(r => normalizeStatus(r.status) === status).length
          }
          return { status, count }
        })
      }
    })
    
    // Encontrar o valor máximo de PENDENTE para normalizar as cores (foco em PENDENTE)
    const maxPendente = Math.max(...matrix.map(m => {
      const pendente = m.statuses.find(s => s.status === 'PENDENTE')
      return pendente ? pendente.count : 0
    }), 1)
    
    return { matrix, maxPendente, statuses, redes }
  }

  const getHeatmapColor = (count, maxCount, status) => {
    if (count === 0) return 'rgba(229, 231, 235, 0.3)' // cinza claro
    
    // Para PENDENTE: cores de amarelo claro a vermelho escuro (maior intensidade)
    if (status === 'PENDENTE') {
      const intensity = count / maxCount
      if (intensity < 0.2) return 'rgba(254, 240, 138, 0.8)' // amarelo claro
      if (intensity < 0.4) return 'rgba(251, 191, 36, 0.8)' // amarelo
      if (intensity < 0.6) return 'rgba(245, 158, 11, 0.8)' // laranja claro
      if (intensity < 0.8) return 'rgba(239, 68, 68, 0.8)' // vermelho claro
      return 'rgba(185, 28, 28, 0.9)' // vermelho escuro
    }
    
    // Para outros status: cores mais suaves
    const intensity = Math.min(count / maxCount, 1)
    if (status === 'ENTREGUE') {
      return `rgba(34, 197, 94, ${intensity * 0.6 + 0.2})` // verde
    }
    if (status === 'CANCELADA') {
      return `rgba(239, 68, 68, ${intensity * 0.5 + 0.2})` // vermelho suave
    }
    if (status === 'DEVOLVIDA') {
      return `rgba(249, 115, 22, ${intensity * 0.5 + 0.2})` // laranja suave
    }
    return 'rgba(229, 231, 235, 0.5)'
  }

  const clearFilters = () => {
    setFilters({
      dateFrom: '',
      dateTo: '',
      period: '',
      fretista: '',
      placa: '',
      cliente: '',
      rede: '',
      vendedor: '',
      uf: '',
      status: '',
      situacao: '',
      searchText: '',
      dateRange: {
        start: '',
        end: ''
      }
    })
    setSearchInput('')
  }

  // Helper para exibir badge de Situação padronizada (igual ao Registros)
  const renderSituacaoBadge = (situacaoRaw) => {
    const situacao = (situacaoRaw || 'PENDENTE').toString()
    switch (situacao.toLowerCase()) {
      case 'pendente':
        return <Badge variant="secondary" className="text-xs bg-yellow-100 text-yellow-800">PENDENTE</Badge>
      case 'cancelada':
        return <Badge variant="destructive" className="text-xs">CANCELADA</Badge>
      case 'entregue':
        return <Badge variant="outline" className="text-xs text-green-700 border-green-200">ENTREGUE</Badge>
      case 'devolvida':
        return <Badge variant="secondary" className="text-xs bg-orange-100 text-orange-800">DEVOLVIDA</Badge>
      default:
        return <Badge variant="secondary" className="text-xs bg-muted text-foreground">{situacao.toUpperCase()}</Badge>
    }
  }

  const updateFilter = (key, value) => {
    // Usar setTimeout para evitar conflitos de renderização com ResizeObserver
    setTimeout(() => {
      setFilters(prev => ({
        ...prev,
        [key]: value
      }))
    }, 0)
  }

  const handleDateFilter = () => {
    fetchDashboardData()
  }

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  // Ordenação local para tabelas de Atrasos e Vencimentos
  const getSortVal = (item, key) => {
    if (key === 'valor') {
      const v = item.valor
      const num = typeof v === 'number' ? v : parseFloat(String(v).replace(/[^0-9.,-]/g, '').replace('.', '').replace(',', '.'))
      return isNaN(num) ? 0 : num
    }
    if (key === 'dataEntrega' || key === 'vencimento') {
      const dateStr = item[key]
      if (!dateStr) return ''
      try {
        const date = new Date(dateStr)
        return isNaN(date.getTime()) ? '' : date.getTime()
      } catch {
        return ''
      }
    }
    return String(item[key] ?? '').toLowerCase()
  }

  const atrasosSorted = React.useMemo(() => {
    const arr = Array.isArray(dashboardData.atrasosTop) ? [...dashboardData.atrasosTop] : []
    arr.sort((a, b) => {
      const va = getSortVal(a, sortAtrasos.key)
      const vb = getSortVal(b, sortAtrasos.key)
      if (va < vb) return sortAtrasos.order === 'asc' ? -1 : 1
      if (va > vb) return sortAtrasos.order === 'asc' ? 1 : -1
      return 0
    })
    return arr
  }, [dashboardData.atrasosTop, sortAtrasos])

  const vencimentosSorted = React.useMemo(() => {
    const arr = Array.isArray(dashboardData.vencimentosProximos) ? [...dashboardData.vencimentosProximos] : []
    arr.sort((a, b) => {
      const va = getSortVal(a, sortVencimentos.key)
      const vb = getSortVal(b, sortVencimentos.key)
      if (va < vb) return sortVencimentos.order === 'asc' ? -1 : 1
      if (va > vb) return sortVencimentos.order === 'asc' ? 1 : -1
      return 0
    })
    return arr
  }, [dashboardData.vencimentosProximos, sortVencimentos])

  const handleSortAtrasos = (key) => {
    setSortAtrasos(prev => ({ key, order: prev.key === key ? (prev.order === 'asc' ? 'desc' : 'asc') : 'asc' }))
  }

  const handleSortVencimentos = (key) => {
    setSortVencimentos(prev => ({ key, order: prev.key === key ? (prev.order === 'asc' ? 'desc' : 'asc') : 'asc' }))
  }

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'entregue': return 'bg-green-900 text-white-800 border-white-200'
      case 'pendente': return 'bg-red-900 text-white-800 border-white-500'
      case 'cancelado': return 'bg-red-100 text-red-800 border-red-200'
      case 'devolvido': return 'bg-orange-100 text-orange-800 border-orange-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getDiasGradientColor = (dias) => {
    if (dias === undefined || dias === null) return 'bg-muted text-foreground border-border'
    const d = Number(dias)
    if (isNaN(d)) return 'bg-muted text-foreground border-border'
    if (d <= 0) return 'bg-red-900 text-white border-red-900'
    if (d <= 1) return 'bg-red-800 text-white border-red-800'
    if (d <= 3) return 'bg-red-700 text-white border-red-700'
    if (d <= 7) return 'bg-red-500 text-white border-red-500'
    if (d <= 14) return 'bg-red-300 text-red-800 border-red-300'
    return 'bg-red-100 text-red-800 border-red-100'
  }

  const handleExportLast100Registros = async () => {
    try {
      const response = await fetch(`${API_URL}/api/registros/ultimos-100`)
      if (!response.ok) throw new Error('Erro ao buscar registros')
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.style.display = 'none'
      a.href = url
      a.download = `registros_ultimos_100_${new Date().toISOString().split('T')[0]}.xlsx`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Erro ao exportar registros:', error)
      alert('Erro ao exportar registros. Tente novamente.')
    }
  }

  const calculateEfficiencyPercent = () => {
    const total = registros.length
    if (total === 0) return 0
    const pendentes = countByStatus('PENDENTE')
    const ratio = pendentes / total
    const eficiencia = (1 - ratio) * 100
    return Number(eficiencia.toFixed(2))
  }

  const getDeliveredPercent = () => {
    const total = registros.length
    const entregues = countByStatus('ENTREGUE')
    return total > 0 ? Number(((entregues / total) * 100).toFixed(2)) : 0
  }

  if (loading) {
    return (
      <div className="dashboard-container max-w-none mx-auto py-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="card">
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="dashboard-container max-w-none mx-auto py-6 space-y-6">
      {/* Header banner */}
      <PageHeader
        title="Dashboard"
        subtitle="Visão geral do sistema de notas fiscais"
        icon={<PieChart style={{color: isDarkMode ? '#ffffffff' : '#ffffffff', borderColor: isDarkMode ? '#ffffffff' : '#c2c2c2ff'}} className="h-6 w-6 text-green-600" />}
      />

      {/* Alerts Section */}
      {dashboardData.notasAtrasadas > 0 && (
        <Alert style={{borderColor: 'white', textColor: 'white',fontWeight: 'bold'}} className="border-white-600 bg-red-600">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Atenção!</AlertTitle>
          <AlertDescription>
            Você tem {dashboardData.notasAtrasadas} notas fiscais em atraso que precisam de atenção.
          </AlertDescription>
        </Alert>
      )}

      {/* Filters Section */}
       <Card className="card">
         <CardHeader>
           <CardTitle className="flex items-center gap-2">
             <Filter className="h-5 w-5" />
             Filtros
           </CardTitle>
           <CardDescription>
             Filtre os dados do dashboard por período e outros critérios
           </CardDescription>
         </CardHeader>
         <CardContent>
           {/* Primeira linha de filtros - Datas e Período */}
           <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="space-y-3 text-sm">
              <label className="block font-medium text-muted-foreground">Data Início</label>
              <Input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => updateFilter('dateFrom', e.target.value)}
              />
            </div>
            <div className="space-y-3 text-sm">
              <label className="block font-medium text-muted-foreground">Data Fim</label>
              <Input
                type="date"
                value={filters.dateTo}
                onChange={(e) => updateFilter('dateTo', e.target.value)}
              />
            </div>
            <div className="space-y-3 text-sm">
              <label className="block font-medium text-muted-foreground">Período</label>
              <Select value={filters.period} onValueChange={(value) => updateFilter('period', value)}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Selecione o período" />
                </SelectTrigger>
                <SelectContent>
                  {filterOptions.periods.map((period) => (
                     <SelectItem key={period.value} value={period.value}>
                       {period.label}
                     </SelectItem>
                   ))}
                 </SelectContent>
               </Select>
             </div>
           </div>

           {/* Segunda linha de filtros - Fretista, Placa, Cliente */}
           <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
             <div>
               <label className="block text-sm font-medium mb-2">Fretista</label>
               <Select value={filters.fretista} onValueChange={(value) => updateFilter('fretista', value)}>
                 <SelectTrigger>
                   <SelectValue placeholder="Selecione o fretista" />
                 </SelectTrigger>
                 <SelectContent>
                   {filterOptions.fretistas.map((fretista) => (
                     <SelectItem key={fretista.value} value={fretista.value}>
                       {fretista.label}
                     </SelectItem>
                   ))}
                 </SelectContent>
               </Select>
             </div>
             <div>
               <label className="block text-sm font-medium mb-2">Placa</label>
              <Select 
                value={filters.placa} 
                onValueChange={(value) => updateFilter('placa', value)}
              >
                 <SelectTrigger>
                   <SelectValue placeholder="Selecione a placa" />
                 </SelectTrigger>
                 <SelectContent>
                   {filterOptions.placas.map((placa) => (
                     <SelectItem key={placa.value} value={placa.value}>
                       {placa.label}
                     </SelectItem>
                   ))}
                 </SelectContent>
               </Select>
             </div>
             <div>
               <label className="block text-sm font-medium mb-2">Cliente</label>
              <Select 
                value={filters.cliente} 
                onValueChange={(value) => updateFilter('cliente', value)}
              >
                 <SelectTrigger>
                   <SelectValue placeholder="Selecione o cliente" />
                 </SelectTrigger>
                 <SelectContent>
                   {filterOptions.clientes.map((cliente) => (
                     <SelectItem key={cliente.value} value={cliente.value}>
                       {cliente.label}
                     </SelectItem>
                   ))}
                 </SelectContent>
               </Select>
             </div>
           </div>

           {/* Terceira linha de filtros - Rede, Vendedor, UF */}
           <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
             <div>
               <label className="block text-sm font-medium mb-2">Rede</label>
              <Select 
                value={filters.rede} 
                onValueChange={(value) => updateFilter('rede', value)}
              >
                 <SelectTrigger>
                   <SelectValue placeholder="Selecione a rede" />
                 </SelectTrigger>
                 <SelectContent>
                   {filterOptions.redes.map((rede) => (
                     <SelectItem key={rede.value} value={rede.value}>
                       {rede.label}
                     </SelectItem>
                   ))}
                 </SelectContent>
               </Select>
             </div>
             <div>
               <label className="block text-sm font-medium mb-2">Vendedor</label>
               <Select value={filters.vendedor} onValueChange={(value) => updateFilter('vendedor', value)}>
                 <SelectTrigger>
                   <SelectValue placeholder="Selecione o vendedor" />
                 </SelectTrigger>
                 <SelectContent>
                   {filterOptions.vendedores.map((vendedor) => (
                     <SelectItem key={vendedor.value} value={vendedor.value}>
                       {vendedor.label}
                     </SelectItem>
                   ))}
                 </SelectContent>
               </Select>
             </div>
             <div>
               <label className="block text-sm font-medium mb-2">UF</label>
               <Select value={filters.uf} onValueChange={(value) => updateFilter('uf', value)}>
                 <SelectTrigger>
                   <SelectValue placeholder="Selecione a UF" />
                 </SelectTrigger>
                 <SelectContent>
                   {filterOptions.ufs.map((uf) => (
                     <SelectItem key={uf.value} value={uf.value}>
                       {uf.label}
                     </SelectItem>
                   ))}
                 </SelectContent>
               </Select>
             </div>
           </div>

           {/* Quarta linha de filtros - Status, Situação, Busca */}
           <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
             <div>
               <label className="block text-sm font-medium mb-2">Status</label>
               <Select value={filters.status} onValueChange={(value) => updateFilter('status', value)}>
                 <SelectTrigger>
                   <SelectValue placeholder="Selecione o status" />
                 </SelectTrigger>
                 <SelectContent>
                   {filterOptions.status.map((status) => (
                     <SelectItem key={status.value} value={status.value}>
                       {status.label}
                     </SelectItem>
                   ))}
                 </SelectContent>
               </Select>
             </div>
             <div>
               <label className="block text-sm font-medium mb-2">Situação</label>
               <Select value={filters.situacao} onValueChange={(value) => updateFilter('situacao', value)}>
                 <SelectTrigger>
                   <SelectValue placeholder="Selecione a situação" />
                 </SelectTrigger>
                 <SelectContent>
                   {filterOptions.situacoes.map((situacao) => (
                     <SelectItem key={situacao.value} value={situacao.value}>
                       {situacao.label}
                     </SelectItem>
                   ))}
                 </SelectContent>
               </Select>
             </div>
             <div>
               <label className="block text-sm font-medium mb-2">Busca Livre</label>
               <Input
                 type="text"
                 placeholder="Digite para buscar..."
                 value={searchInput}
                 onChange={(e) => setSearchInput(e.target.value)}
               />
             </div>
           </div>

           <div className="flex gap-2">
            <Button variant="secondary" onClick={() => { fetchDashboardData(); fetchRegistros(); }}>Aplicar Filtros</Button>
            <Button variant="outline" onClick={clearFilters}>Limpar Filtros</Button>
          </div>
         </CardContent>
       </Card>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <DivMotion><Card className="card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Notas</CardTitle>
            <FileText className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-semibold">{registros.length}</div>
            <p className="text-xs text-muted-foreground">
              +{dashboardData.crescimentoNotas || 0}% em relação ao mês anterior
            </p>
            <Progress value={dashboardData.totalNotas > 0 ? Math.min((dashboardData.totalNotas / 100) * 100, 100) : 0} className="mt-2" />
          </CardContent>
        </Card></DivMotion>

        <DivMotion><Card className="card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Notas Entregues</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-semibold text-green-700">{countByStatus('ENTREGUE')}</div>
            <p className="text-xs text-muted-foreground">
              {getDeliveredPercent()}% do total
            </p>
            <Progress value={getDeliveredPercent()} className="mt-2" />
          </CardContent>
        </Card></DivMotion>

        <DivMotion><Card className="card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
            <DollarSign className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-semibold text-emerald-700">{formatCurrency(getValorTotal())}</div>
            <p className="text-xs text-muted-foreground">
              +{dashboardData.crescimentoValor || 0}% em relação ao mês anterior
            </p>
            <Progress value={dashboardData.crescimentoValor > 0 ? Math.min(dashboardData.crescimentoValor, 100) : 0} className="mt-2" />
          </CardContent>
        </Card></DivMotion>

        <DivMotion><Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pendente</CardTitle>
            <DollarSign className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-semibold text-yellow-700">{formatCurrency(getValorPendente())}</div>
            <p className="text-xs text-muted-foreground">
              {countByStatus('PENDENTE')} notas pendentes
            </p>
          </CardContent>
        </Card></DivMotion>
      </div>

      {/* Status Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-yellow-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground">Pendentes</p>
                <p className="text-xl font-semibold text-yellow-700">{countByStatus('PENDENTE')}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground">Canceladas</p>
                <p className="text-xl font-semibold text-red-700">{countByStatus('CANCELADA')}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground">Devolvidas</p>
                <p className="text-xl font-semibold text-orange-700">{countByStatus('DEVOLVIDA')}</p>
              </div>
              <RotateCcw className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        {(dashboardData.notasProcessadas > 0 || dashboardData.notasReenviadas > 0 || dashboardData.notasPagas > 0 || dashboardData.notasOutros > 0) && (
          <>
            {dashboardData.notasProcessadas > 0 && (
              <Card className="border-l-4 border-l-blue-500">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">Processadas</p>
                      <p className="text-xl font-semibold text-blue-700">{dashboardData.notasProcessadas}</p>
                    </div>
                    <CheckCircle className="h-8 w-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>
            )}
            {dashboardData.notasReenviadas > 0 && (
              <Card className="border-l-4 border-l-purple-500">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">Reenviadas</p>
                      <p className="text-xl font-semibold text-purple-700">{dashboardData.notasReenviadas}</p>
                    </div>
                    <RotateCcw className="h-8 w-8 text-purple-500" />
                  </div>
                </CardContent>
              </Card>
            )}
            {dashboardData.notasPagas > 0 && (
              <Card className="border-l-4 border-l-green-500">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">Pagas</p>
                      <p className="text-xl font-semibold text-green-700">{dashboardData.notasPagas}</p>
                    </div>
                    <DollarSign className="h-8 w-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>
            )}
            {dashboardData.notasOutros > 0 && (
              <Card className="border-l-4 border-l-gray-500">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">Outros</p>
                      <p className="text-xl font-semibold text-gray-700">{dashboardData.notasOutros}</p>
                    </div>
                    <FileText className="h-8 w-8 text-gray-500" />
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}

        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground">Eficiência</p>
                <p className="text-xl font-semibold text-blue-700">{calculateEfficiencyPercent()}%</p>
              </div>
              <Activity className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Analytics */}
        <Tabs defaultValue="charts" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="charts">Gráficos</TabsTrigger>
            <TabsTrigger value="vencimentos">Vencimentos</TabsTrigger>
            <TabsTrigger value="atrasos">Atrasos</TabsTrigger>
            <TabsTrigger value="acoes">Ações Rápidas</TabsTrigger>
          </TabsList>

        <TabsContent value="charts" className="space-y-6">
          <div className="grid w-full grid-cols-1 lg:grid-cols-2 gap-6">
            <DivMotion><Card className="w-full shadow-2xl border dark:border-neutral-800 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-xl ring-1 ring-black/5 dark:ring-white/10">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Truck className="h-5 w-5" />
                  Status por Fretista
                </CardTitle>
              </CardHeader>
              <CardContent>
                {chartsReady ? (
                  <Bar
                    data={buildFretistaStatusBarData()}
                    options={{
                      responsive: true,
                      plugins: { legend: { position: 'bottom', labels: { color: textColor } } },
                      scales: { x: { stacked: true, ticks: { color: textColor }, grid: { color: gridColor } }, y: { stacked: true, ticks: { color: textColor }, grid: { color: gridColor } } }
                    }}
                  />
                ) : (
                  <div className="h-64 flex items-center justify-center text-muted-foreground">Carregando...</div>
                )}
              </CardContent>
            </Card></DivMotion>

            <DivMotion><Card className="w-full grid w-full shadow-2xl border dark:border-neutral-800 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-xl ring-1 ring-black/5 dark:ring-white/10">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LineChart className="h-5 w-5" />
                  Evolução por Fretista (Pendentes)
                </CardTitle>
              </CardHeader>
              <CardContent>
                {chartsReady ? (
                  <Bar
                    data={buildFretistaLineData('PENDENTE')}
                    options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { color: textColor } } }, scales: { x: { ticks: { color: textColor }, grid: { color: gridColor } }, y: { ticks: { color: textColor }, grid: { color: gridColor } } } }}
                  />
                ) : (
                  <div className="h-64 flex items-center justify-center text-muted-foreground">Carregando...</div>
                )}
              </CardContent>
            </Card></DivMotion>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <DivMotion><Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="h-5 w-5" />
                  Top 10 Clientes com Pendências de Canhotos
                </CardTitle>
              </CardHeader>
              <CardContent>
                {chartsReady ? (
                  <Bar data={buildClienteRankingBarData()} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { ticks: { color: textColor }, grid: { color: gridColor } }, y: { ticks: { color: textColor }, grid: { color: gridColor } } } }} />
                ) : (
                  <div className="h-64 flex items-center justify-center text-muted-foreground">Carregando...</div>
                )}
              </CardContent>
            </Card></DivMotion>
          </div>

          {/* Heatmap Rede × Status */}
          <DivMotion><Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                Heatmap – Rede × Status
              </CardTitle>
              <CardDescription>
                Intensidade de registros por status em cada rede (maior número de "PENDENTE" = cor mais forte)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {chartsReady ? (
                (() => {
                  const heatmapData = buildRedeStatusHeatmapData()
                  return (
                    <div className="overflow-x-auto">
                      <div className="min-w-full">
                        <table className="w-full border-collapse">
                          <thead>
                            <tr>
                              <th className="p-2 text-left border-b text-sm font-medium text-muted-foreground">Rede</th>
                              {heatmapData.statuses.map(status => (
                                <th key={status} className="p-2 text-center border-b text-sm font-medium text-muted-foreground">
                                  {status}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {heatmapData.matrix.map((row, idx) => (
                              <tr key={idx} className="hover:bg-muted/50">
                                <td className="p-2 border-b text-sm font-medium">{row.rede}</td>
                                {row.statuses.map((cell, cellIdx) => (
                                  <td key={cellIdx} className="p-2 border-b text-center">
                                    <div
                                      className="inline-block px-3 py-2 rounded text-sm font-semibold text-white min-w-[60px]"
                                      style={{
                                        backgroundColor: getHeatmapColor(cell.count, heatmapData.maxPendente, cell.status)
                                      }}
                                    >
                                      {cell.count}
                                    </div>
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )
                })()
              ) : (
                <div className="h-64 flex items-center justify-center text-muted-foreground">Carregando...</div>
              )}
            </CardContent>
          </Card></DivMotion>

          {/* Removido: UF × Pendências (Heat) e Pendências por UF (Evolução) */}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <DivMotion><Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Ranking por Vendedor (Problemas)
                </CardTitle>
              </CardHeader>
              <CardContent>
                {chartsReady ? (
                  <Bar data={buildVendedorProblemsData()} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { ticks: { color: textColor }, grid: { color: gridColor } }, y: { ticks: { color: textColor }, grid: { color: gridColor } } } }} />
                ) : (
                  <div className="h-64 flex items-center justify-center text-muted-foreground">Carregando...</div>
                )}
              </CardContent>
            </Card></DivMotion>

            <DivMotion><Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Truck className="h-5 w-5" />
                  Status por Placa
                </CardTitle>
              </CardHeader>
              <CardContent>
                {chartsReady ? (
                  <Bar data={buildPlacaStatusData()} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { ticks: { color: textColor }, grid: { color: gridColor } }, y: { ticks: { color: textColor }, grid: { color: gridColor } } } }} />
                ) : (
                  <div className="h-64 flex items-center justify-center text-muted-foreground">Carregando...</div>
                )}
              </CardContent>
            </Card></DivMotion>
          </div>

          {/* Removido: Tempo médio por Placa e Evolução dos Status */}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <DivMotion><Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Pendências dos Ultimos 7 dias
                </CardTitle>
              </CardHeader>
              <CardContent>
                {chartsReady ? (
                  <Bar data={buildWeekdayBarsData()} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { ticks: { color: textColor }, grid: { color: gridColor } }, y: { ticks: { color: textColor }, grid: { color: gridColor } } } }} />
                ) : (
                  <div className="h-64 flex items-center justify-center text-muted-foreground">Carregando...</div>
                )}
              </CardContent>
            </Card></DivMotion>

          </div>
        </TabsContent>

        <TabsContent value="atrasos">
          <DivMotion><Card className="card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                Top 30 Maiores Atrasos
              </CardTitle>
              <CardDescription>
                Registros com situação diferente de "Dentro do Prazo"
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table className="tabela-registros w-full text-sm">
                  <TableHeader className="bg-muted/50">
                    <TableRow className="border-b">
                      <TableHead className="text-left p-2 text-muted-foreground font-medium">
                        <Button variant="ghost" size="sm" onClick={() => handleSortAtrasos('cliente')} className="flex items-center gap-1 p-0 h-auto">
                          Cliente {sortAtrasos.key === 'cliente' ? (sortAtrasos.order === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />) : null}
                        </Button>
                      </TableHead>
                      <TableHead className="text-left p-2 text-muted-foreground font-medium">Nota Fiscal</TableHead>
                      <TableHead className="text-left p-2 text-muted-foreground font-medium">
                        <Button variant="ghost" size="sm" onClick={() => handleSortAtrasos('valor')} className="flex items-center gap-1 p-0 h-auto">
                          Valor {sortAtrasos.key === 'valor' ? (sortAtrasos.order === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />) : null}
                        </Button>
                      </TableHead>
                      <TableHead className="text-left p-2 text-muted-foreground font-medium">Fretista</TableHead>
                      <TableHead className="text-left p-2 text-muted-foreground font-medium">Data de Entrega</TableHead>
                      <TableHead className="text-left p-2 text-muted-foreground font-medium">Emissão</TableHead>
                      <TableHead className="text-left p-2 text-muted-foreground font-medium">Dias de Atraso</TableHead>
                      <TableHead className="text-left p-2 text-muted-foreground font-medium">Situação</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {atrasosSorted && atrasosSorted.length > 0 ? (
                      atrasosSorted
                        .filter(item => {
                          const st = normalizeStatus(item.status || '')
                          return st === 'PENDENTE'
                        })
                        .map((item, index) => (
                          <TableRow key={index} className="border-b hover:bg-gray-50">
                            <TableCell className="p-2">{item.cliente}</TableCell>
                            <TableCell className="p-2">{item.numeroNota}</TableCell>
                            <TableCell className="p-2">{formatCurrency(item.valor)}</TableCell>
                            <TableCell className="p-2">{item.fretista || '-'}</TableCell>
                            <TableCell className="p-2">{item.dataEntrega || '-'}</TableCell>
                            <TableCell className="p-2">{item.emissao}</TableCell>
                            <TableCell className="p-2">
                              <Badge className={getDiasGradientColor(item.diasAtraso)}>
                                {item.diasAtraso} dias
                              </Badge>
                            </TableCell>
                            <TableCell className="p-2">
                              {renderSituacaoBadge(item.situacao)}
                            </TableCell>
                          </TableRow>
                        ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan="8" className="text-center py-8 text-muted-foreground">
                          Nenhum atraso encontrado
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card></DivMotion>
        </TabsContent>

        <TabsContent value="vencimentos">
          <DivMotion><Card className="card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Top 30 Vencimentos Próximos
              </CardTitle>
              <CardDescription>
                Notas fiscais com vencimento nos próximos dias
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table className="tabela-registros w-full text-sm">
                  <TableHeader className="bg-muted/50">
                    <TableRow className="border-b">
                      <TableHead className="text-left p-2 text-muted-foreground font-medium">
                        <Button variant="ghost" size="sm" onClick={() => handleSortVencimentos('cliente')} className="flex items-center gap-1 p-0 h-auto">
                          Cliente {sortVencimentos.key === 'cliente' ? (sortVencimentos.order === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />) : null}
                        </Button>
                      </TableHead>
                      <TableHead className="text-left p-2 text-muted-foreground font-medium">Nota Fiscal</TableHead>
                      <TableHead className="text-left p-2 text-muted-foreground font-medium">
                        <Button variant="ghost" size="sm" onClick={() => handleSortVencimentos('valor')} className="flex items-center gap-1 p-0 h-auto">
                          Valor {sortVencimentos.key === 'valor' ? (sortVencimentos.order === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />) : null}
                        </Button>
                      </TableHead>
                      <TableHead className="text-left p-2 text-muted-foreground font-medium">Fretista</TableHead>
                      <TableHead className="text-left p-2 text-muted-foreground font-medium">
                        <Button variant="ghost" size="sm" onClick={() => handleSortVencimentos('dataEntrega')} className="flex items-center gap-1 p-0 h-auto">
                          Data de Entrega {sortVencimentos.key === 'dataEntrega' ? (sortVencimentos.order === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />) : null}
                        </Button>
                      </TableHead>
                      <TableHead className="text-left p-2 text-muted-foreground font-medium">
                        <Button variant="ghost" size="sm" onClick={() => handleSortVencimentos('vencimento')} className="flex items-center gap-1 p-0 h-auto">
                          Vencimento {sortVencimentos.key === 'vencimento' ? (sortVencimentos.order === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />) : null}
                        </Button>
                      </TableHead>
                      <TableHead className="text-left p-2 text-muted-foreground font-medium">Dias Restantes</TableHead>
                      <TableHead className="text-left p-2 text-muted-foreground font-medium">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {vencimentosSorted && vencimentosSorted.length > 0 ? (
                      vencimentosSorted
                        .filter(v => {
                          const st = normalizeStatus(v.status || '')
                          return st === 'PENDENTE'
                        })
                        .map((item, index) => (
                          <TableRow key={index} className="border-b hover:bg-gray-50">
                            <TableCell className="p-2">{item.cliente}</TableCell>
                            <TableCell className="p-2">{item.numeroNota}</TableCell>
                            <TableCell className="p-2">{formatCurrency(item.valor)}</TableCell>
                            <TableCell className="p-2">{item.fretista || '-'}</TableCell>
                            <TableCell className="p-2">{item.dataEntrega || '-'}</TableCell>
                            <TableCell className="p-2">{item.vencimento}</TableCell>
                            <TableCell className="p-2">
                              <Badge className={getDiasGradientColor(item.diasRestantes)}>
                                {item.diasRestantes} dias
                              </Badge>
                            </TableCell>
                            <TableCell className="p-2">
                              <Badge className={getStatusColor(item.status)}>
                                {item.status}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan="8" className="text-center py-8 text-muted-foreground">
                          Nenhum vencimento próximo encontrado
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card></DivMotion>
        </TabsContent>

        <TabsContent value="acoes">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Recent Files */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Arquivos Recentes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {recentFiles.length > 0 ? (
                    recentFiles.map((file, index) => (
                      <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <FileText className="h-4 w-4 text-green-600 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <span className="text-sm font-medium block whitespace-normal break-words">{file.nome}</span>
                          <span className="text-xs text-muted-foreground">{file.data} - {file.status}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-4 text-muted-foreground">
                      <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Nenhum arquivo processado ainda</p>
                    </div>
                  )}
                </div>
                <Separator className="my-4" />
                <Button variant="outline" size="sm" className="w-full" onClick={handleExportLast100Registros}>
                  <Download className="mr-2 h-4 w-4" />
                  Ver Todos os Registros
                </Button>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <DivMotion><Card className="card">
              <CardHeader>
                <CardTitle>Ações Rápidas</CardTitle>
                <CardDescription>
                  Acesso rápido às funcionalidades mais utilizadas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-4">
                  <Button className="h-16 flex items-center justify-start gap-3" onClick={() => navigate('/processar')}>
                    <FileText className="h-6 w-6" />
                    <div className="text-left">
                      <div className="font-medium">Processar PDF</div>
                      <div className="text-xs opacity-70">Upload e análise</div>
                    </div>
                  </Button>
                  <Button variant="outline" className="h-16 flex items-center justify-start gap-3" onClick={() => navigate('/relatorios')}>
                    <Download className="h-6 w-6" />
                    <div className="text-left">
                      <div className="font-medium">Exportar Excel</div>
                      <div className="text-xs opacity-70">Relatórios completos</div>
                    </div>
                  </Button>
                  <Button variant="outline" className="h-16 flex items-center justify-start gap-3" onClick={() => navigate('/usuarios')}>
                    <Users className="h-6 w-6" />
                    <div className="text-left">
                      <div className="font-medium">Gerenciar Usuários</div>
                      <div className="text-xs opacity-70">Controle de acesso</div>
                    </div>
                  </Button>
                </div>
              </CardContent>
            </Card></DivMotion>

            {/* System Status */}
            <DivMotion><Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Status do Sistema
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">API Backend</span>
                  <Badge className={`${systemStatus.api === 'online' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>
                    {systemStatus.api === 'online' ? 'Online' : 'Offline'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Banco de Dados</span>
                  <Badge className={`${systemStatus.database === 'connected' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>
                    {systemStatus.database === 'connected' ? 'Conectado' : 'Desconectado'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Google Sheets</span>
                  <Badge className={`${systemStatus.sheets === 'synced' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>
                    {systemStatus.sheets === 'synced' ? 'Sincronizado' : 'Sem Conexão'}
                  </Badge>
                </div>
                <Separator />
                <div className="text-xs text-muted-foreground">
                  Última atualização: {systemStatus.updatedAt ? systemStatus.updatedAt.toLocaleString('pt-BR') : '—'}
                </div>
              </CardContent>
            </Card></DivMotion>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default Dashboard
