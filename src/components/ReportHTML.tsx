'use client'

import { useRef } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LabelList,
  Legend,
} from 'recharts'
import { Ocorrencia } from '@/lib/supabase'
import { formatCurrency, calculateMTTR, calculateRecurrenceRate, calculateFinancialImpact } from '@/lib/utils'

interface ReportHTMLProps {
  ocorrencias: Ocorrencia[]
  filters: {
    periodoInicio?: string
    periodoFim?: string
    setor?: string
    motivo?: string
    tipoOcorrencia?: string
    status?: string
    cliente?: string
    busca?: string
  }
}

const COLORS = ['#073e29', '#2e6b4d', '#4a9170', '#70b896', '#9cdebd']

export function ReportHTML({ ocorrencias, filters }: ReportHTMLProps) {
  const reportRef = useRef<HTMLDivElement>(null)

  const handlePrint = () => {
    window.print()
  }

  const handleDownloadPDF = async () => {
    if (!reportRef.current) return

    try {
      // @ts-ignore
      const html2pdf = (await import('html2pdf.js')).default

      const opt = {
        margin: [10, 10, 10, 10] as [number, number, number, number],
        filename: `Relatorio_REGGAP_${format(new Date(), 'yyyy-MM-dd_HHmm')}.pdf`,
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm' as const, format: 'a4' as const, orientation: 'portrait' as const },
      }

      html2pdf().set(opt).from(reportRef.current).save()
    } catch (error) {
      console.error('Erro ao gerar PDF:', error)
      // Fallback para print
      window.print()
    }
  }

  // Calcular KPIs
  const kpis = {
    totalOcorrencias: ocorrencias.length,
    refaturamentos: ocorrencias.filter((o) => o.tipo_ocorrencia === 'REFATURAMENTO').length,
    valorRefaturamentos: ocorrencias
      .filter((o) => o.tipo_ocorrencia === 'REFATURAMENTO')
      .reduce((acc, o) => acc + (o.valor || 0), 0),
    cancelamentos: ocorrencias.filter((o) => o.tipo_ocorrencia === 'CANCELAMENTO').length,
    valorCancelamentos: ocorrencias
      .filter((o) => o.tipo_ocorrencia === 'CANCELAMENTO')
      .reduce((acc, o) => acc + (o.valor || 0), 0),
    emAberto: ocorrencias.filter((o) => o.status === 'EM ABERTO').length,
    finalizadas: ocorrencias.filter((o) => o.status === 'FINALIZADO').length,
    mttr: calculateMTTR(ocorrencias),
    taxaReincidencia: calculateRecurrenceRate(ocorrencias),
    impactoFinanceiro: calculateFinancialImpact(ocorrencias),
  }

  // Top 10 Motivos
  const topMotivos = Object.entries(
    ocorrencias.reduce(
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
    ocorrencias.reduce(
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
    ocorrencias.reduce(
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
    ocorrencias.reduce(
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
    ocorrencias.reduce(
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
    ocorrencias.reduce(
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

  // Insights
  const insights: Array<{ type: 'warning' | 'danger' | 'success' | 'info'; title: string; description: string }> = []

  if (topSetores.length > 0) {
    const topSetor = topSetores[0]
    const totalSetor = topSetores.reduce((acc, s) => acc + s.value, 0)
    const percentual = Math.round((topSetor.value / totalSetor) * 100)
    insights.push({
      type: 'warning',
      title: '⚠️ Setor com mais ocorrências',
      description: `O setor ${topSetor.name} concentra ${percentual}% de todas as ocorrências (${topSetor.value} casos). Recomenda-se revisão dos procedimentos.`,
    })
  }

  if (kpis.taxaReincidencia > 30) {
    insights.push({
      type: 'danger',
      title: '🔴 Alta taxa de reincidência',
      description: `A taxa de reincidência está em ${kpis.taxaReincidencia}%. É necessário revisar os procedimentos e implementar ações corretivas urgentes.`,
    })
  }

  if (topMotivos.length > 0) {
    const topMotivo = topMotivos[0]
    const totalMotivos = topMotivos.reduce((acc, m) => acc + m.value, 0)
    const percentual = Math.round((topMotivo.value / totalMotivos) * 100)
    if (percentual > 25) {
      insights.push({
        type: 'warning',
        title: '⚠️ Motivo crítico identificado',
        description: `O motivo "${topMotivo.name}" representa ${percentual}% das ocorrências (${topMotivo.value} casos). Necessária análise detalhada.`,
      })
    }
  }

  if (kpis.impactoFinanceiro > 0) {
    insights.push({
      type: 'success',
      title: '💰 Impacto financeiro',
      description: `O impacto financeiro total é de ${formatCurrency(kpis.impactoFinanceiro)}, sendo ${formatCurrency(kpis.valorRefaturamentos)} em refaturamentos e ${formatCurrency(kpis.valorCancelamentos)} em cancelamentos.`,
    })
  }

  // Filtros aplicados
  const filtrosAplicados: string[] = []
  if (filters.periodoInicio && filters.periodoFim) {
    try {
      filtrosAplicados.push(
        `Período: ${format(new Date(filters.periodoInicio), 'dd/MM/yyyy', { locale: ptBR })} a ${format(new Date(filters.periodoFim), 'dd/MM/yyyy', { locale: ptBR })}`
      )
    } catch (e) {
      filtrosAplicados.push(`Período: ${filters.periodoInicio} a ${filters.periodoFim}`)
    }
  }
  if (filters.setor) filtrosAplicados.push(`Setor: ${filters.setor}`)
  if (filters.motivo) filtrosAplicados.push(`Motivo: ${filters.motivo.replace(/_/g, ' ')}`)
  if (filters.tipoOcorrencia) filtrosAplicados.push(`Tipo: ${filters.tipoOcorrencia.replace(/_/g, ' ')}`)
  if (filters.status) filtrosAplicados.push(`Status: ${filters.status}`)
  if (filters.cliente) filtrosAplicados.push(`Cliente: ${filters.cliente}`)
  if (filters.busca) filtrosAplicados.push(`Busca: ${filters.busca}`)

  const periodoText =
    filters.periodoInicio && filters.periodoFim
      ? (() => {
          try {
            return `${format(new Date(filters.periodoInicio), 'dd/MM/yyyy', { locale: ptBR })} a ${format(new Date(filters.periodoFim), 'dd/MM/yyyy', { locale: ptBR })}`
          } catch {
            return `${filters.periodoInicio} a ${filters.periodoFim}`
          }
        })()
      : 'Período não especificado'

  return (
    <div className="print-container">
      <style>{`
        @media print {
          .no-print {
            display: none !important;
          }
          .print-container {
            padding: 0 !important;
            margin: 0 !important;
          }
        }
        .report-container {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          background: white;
          padding: 20px;
          max-width: 1200px;
          margin: 0 auto;
        }
        .report-header {
          background: linear-gradient(135deg, #073e29 0%, #0a4d33 100%);
          color: white;
          padding: 30px;
          border-radius: 10px;
          margin-bottom: 30px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .report-title {
          font-size: 28px;
          font-weight: bold;
          margin: 0;
        }
        .report-subtitle {
          font-size: 14px;
          opacity: 0.9;
          margin-top: 5px;
        }
        .report-date {
          text-align: right;
          font-size: 12px;
        }
        .logo-img {
          max-width: 100px;
          max-height: 100px;
          margin-bottom: 10px;
          border-radius: 8px;
          background: white;
          padding: 5px;
        }
        .stats-cards {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
          margin-bottom: 30px;
        }
        .stat-card {
          background: linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%);
          border: 2px solid #073e29;
          border-radius: 10px;
          padding: 20px;
          text-align: center;
          box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        .stat-card-title {
          font-size: 12px;
          color: #073e29;
          font-weight: bold;
          margin-bottom: 10px;
          text-transform: uppercase;
        }
        .stat-card-value {
          font-size: 32px;
          font-weight: bold;
          color: #073e29;
          margin-bottom: 5px;
        }
        .stat-card-subvalue {
          font-size: 14px;
          color: #666;
        }
        .section-title {
          font-size: 20px;
          font-weight: bold;
          color: #073e29;
          margin: 30px 0 20px 0;
          padding-bottom: 10px;
          border-bottom: 3px solid #073e29;
        }
        .filters-container {
          background: #f0fdf4;
          border: 2px solid #073e29;
          border-radius: 10px;
          padding: 20px;
          margin-bottom: 30px;
        }
        .filters-list {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          margin-top: 10px;
        }
        .filter-tag {
          background: #d1fae5;
          color: #065f46;
          padding: 5px 15px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 600;
        }
        .charts-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
          gap: 30px;
          margin-bottom: 30px;
        }
        .chart-container {
          background: white;
          border: 2px solid #e5e7eb;
          border-radius: 10px;
          padding: 20px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .chart-title {
          font-size: 16px;
          font-weight: bold;
          color: #073e29;
          margin-bottom: 15px;
          text-align: center;
        }
        .insights-container {
          background: #f0fdf4;
          border: 2px solid #073e29;
          border-radius: 10px;
          padding: 20px;
          margin-bottom: 30px;
        }
        .insights-title {
          font-size: 18px;
          font-weight: bold;
          color: #073e29;
          margin-bottom: 15px;
        }
        .insights-list {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 15px;
          list-style: none;
          padding: 0;
        }
        .insight-card {
          padding: 15px;
          border-radius: 8px;
          border-left: 4px solid;
        }
        .insight-warning {
          background: #fef3c7;
          border-color: #f59e0b;
          color: #92400e;
        }
        .insight-danger {
          background: #fee2e2;
          border-color: #ef4444;
          color: #991b1b;
        }
        .insight-success {
          background: #d1fae5;
          border-color: #10b981;
          color: #065f46;
        }
        .insight-info {
          background: #dbeafe;
          border-color: #3b82f6;
          color: #1e40af;
        }
        .insight-card h4 {
          margin-bottom: 5px;
          font-size: 14px;
          font-weight: bold;
        }
        .insight-card p {
          font-size: 12px;
          margin: 0;
        }
        .data-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 30px;
          background: white;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .data-table th {
          background: #073e29;
          color: white;
          padding: 12px;
          text-align: left;
          font-weight: bold;
          font-size: 12px;
        }
        .data-table td {
          padding: 10px;
          border-bottom: 1px solid #e5e7eb;
          font-size: 11px;
        }
        .data-table tr:hover {
          background: #f9fafb;
        }
        .print-button {
          position: fixed;
          top: 20px;
          right: 20px;
          background: #073e29;
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 8px;
          font-size: 16px;
          font-weight: bold;
          cursor: pointer;
          box-shadow: 0 4px 6px rgba(0,0,0,0.3);
          z-index: 1000;
        }
        .print-button:hover {
          background: #0a4d33;
        }
        .resumo-executivo {
          background: white;
          border: 2px solid #073e29;
          border-radius: 10px;
          padding: 20px;
          margin-bottom: 30px;
        }
        .resumo-executivo p {
          color: #374151;
          font-size: 14px;
          line-height: 1.8;
          margin: 0;
        }
      `}</style>

      <div className="no-print" style={{ position: 'fixed', top: '20px', right: '20px', zIndex: 1000, display: 'flex', gap: '10px' }}>
        <button
          className="print-button"
          onClick={handlePrint}
          style={{
            background: '#073e29',
            color: 'white',
            border: 'none',
            padding: '12px 24px',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: 'bold',
            cursor: 'pointer',
            boxShadow: '0 4px 6px rgba(0,0,0,0.3)',
          }}
        >
          🖨️ Imprimir PDF
        </button>
        <button
          className="print-button"
          onClick={handleDownloadPDF}
          style={{
            background: '#059669',
            color: 'white',
            border: 'none',
            padding: '12px 24px',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: 'bold',
            cursor: 'pointer',
            boxShadow: '0 4px 6px rgba(0,0,0,0.3)',
            marginLeft: '10px',
          }}
        >
          📥 Salvar PDF
        </button>
      </div>

      <div ref={reportRef} className="report-container">
        {/* Header */}
        <div className="report-header">
          <div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo.png"
              alt="REGGAP Logo"
              className="logo-img"
              onError={(e) => {
                const target = e.target as HTMLImageElement
                target.style.display = 'none'
              }}
            />
            <h1 className="report-title">REGGAP - Relatório de Ocorrências</h1>
            <p className="report-subtitle">Sistema de Gestão de GAPs - Grupo DoceMel</p>
          </div>
          <div className="report-date">
            <div>Gerado em: {format(new Date(), 'dd/MM/yyyy, HH:mm:ss', { locale: ptBR })}</div>
            <div>Período: {periodoText}</div>
          </div>
        </div>

        {/* Filtros Aplicados */}
        {filtrosAplicados.length > 0 && (
          <div className="filters-container">
            <h3 style={{ color: '#073e29', marginBottom: '10px', fontSize: '16px', fontWeight: 'bold' }}>Filtros Aplicados</h3>
            <div className="filters-list">
              {filtrosAplicados.map((filtro, index) => (
                <span key={index} className="filter-tag">
                  {filtro}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Resumo Executivo */}
        <div className="resumo-executivo">
          <h3 style={{ color: '#073e29', marginBottom: '15px', fontSize: '18px', fontWeight: 'bold' }}>Resumo Executivo</h3>
          <p>
            Este relatório apresenta um resumo completo das ocorrências registradas no período selecionado, com foco em análise
            de causas, impactos financeiros e identificação de pontos críticos para melhoria contínua dos processos logísticos e
            comerciais. Total de {kpis.totalOcorrencias} ocorrência(s) registrada(s), sendo {kpis.emAberto} em aberto e{' '}
            {kpis.finalizadas} finalizadas.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="stats-cards">
          <div className="stat-card">
            <div className="stat-card-title">Total de Ocorrências</div>
            <div className="stat-card-value">{kpis.totalOcorrencias}</div>
            <div className="stat-card-subvalue">{kpis.emAberto} em aberto • {kpis.finalizadas} finalizadas</div>
          </div>
          <div className="stat-card">
            <div className="stat-card-title">Refaturamentos</div>
            <div className="stat-card-value">{kpis.refaturamentos}</div>
            <div className="stat-card-subvalue">{formatCurrency(kpis.valorRefaturamentos)}</div>
          </div>
          <div className="stat-card">
            <div className="stat-card-title">Cancelamentos</div>
            <div className="stat-card-value">{kpis.cancelamentos}</div>
            <div className="stat-card-subvalue">{formatCurrency(kpis.valorCancelamentos)}</div>
          </div>
          <div className="stat-card">
            <div className="stat-card-title">Impacto Financeiro</div>
            <div className="stat-card-value">{formatCurrency(kpis.impactoFinanceiro)}</div>
            <div className="stat-card-subvalue">Soma total</div>
          </div>
          <div className="stat-card">
            <div className="stat-card-title">MTTR</div>
            <div className="stat-card-value">{kpis.mttr}</div>
            <div className="stat-card-subvalue">dias (tempo médio)</div>
          </div>
          <div className="stat-card">
            <div className="stat-card-title">Taxa de Reincidência</div>
            <div className="stat-card-value">{kpis.taxaReincidencia}%</div>
            <div className="stat-card-subvalue">{kpis.taxaReincidencia > 30 ? '⚠️ Alta' : '✅ Controlada'}</div>
          </div>
        </div>

        {/* Gráficos */}
        <h2 className="section-title">📊 Análises Gráficas</h2>
        <div className="charts-grid">
          {/* Top 10 Motivos */}
          {topMotivos.length > 0 && (
            <div className="chart-container">
              <div className="chart-title">Top 10 Motivos de Ocorrência</div>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={topMotivos} margin={{ top: 20, right: 30, left: 20, bottom: 100 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.3} />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={120} tick={{ fontSize: 11, fill: '#6b7280' }} interval={0} />
                  <YAxis tick={{ fontSize: 12, fill: '#6b7280' }} stroke="#9ca3af" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    }}
                    cursor={{ fill: '#f3f4f6' }}
                  />
                  <Bar dataKey="value" fill="#073e29" radius={[8, 8, 0, 0]} stroke="#065f46" strokeWidth={1}>
                    <LabelList dataKey="value" position="top" style={{ fill: '#073e29', fontSize: 12, fontWeight: 'bold' }} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Top 10 Clientes */}
          {topClientes.length > 0 && (
            <div className="chart-container">
              <div className="chart-title">Top 10 Clientes com Mais Ocorrências</div>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={topClientes} margin={{ top: 20, right: 30, left: 20, bottom: 100 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.3} />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={120} tick={{ fontSize: 11, fill: '#6b7280' }} interval={0} />
                  <YAxis tick={{ fontSize: 12, fill: '#6b7280' }} stroke="#9ca3af" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    }}
                    cursor={{ fill: '#f3f4f6' }}
                  />
                  <Bar dataKey="value" fill="#10b981" radius={[8, 8, 0, 0]} stroke="#059669" strokeWidth={1}>
                    <LabelList dataKey="value" position="top" style={{ fill: '#059669', fontSize: 12, fontWeight: 'bold' }} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Top 5 Setores */}
          {topSetores.length > 0 && (
            <div className="chart-container">
              <div className="chart-title">Top 5 Setores</div>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={topSetores} layout="vertical" margin={{ top: 10, right: 50, left: 20, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.3} />
                  <XAxis type="number" tick={{ fontSize: 12, fill: '#6b7280' }} stroke="#9ca3af" />
                  <YAxis dataKey="name" type="category" width={150} tick={{ fontSize: 11, fill: '#6b7280' }} stroke="#9ca3af" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    }}
                    cursor={{ fill: '#f3f4f6' }}
                  />
                  <Bar dataKey="value" fill="#065f46" radius={[0, 8, 8, 0]} stroke="#047857" strokeWidth={1}>
                    <LabelList dataKey="value" position="right" style={{ fill: '#065f46', fontSize: 12, fontWeight: 'bold' }} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Top 5 Tipo de Ocorrência */}
          {topTipoOcorrencia.length > 0 && (
            <div className="chart-container">
              <div className="chart-title">Top 5 Tipos de Ocorrência</div>
              <ResponsiveContainer width="100%" height={400}>
                <PieChart>
                  <Pie
                    data={topTipoOcorrencia}
                    cx="50%"
                    cy="50%"
                    labelLine={true}
                    label={({ name, value, percent }) => {
                      const shortName = name.length > 20 ? name.substring(0, 20) + '...' : name
                      return `${shortName}: ${value} (${(percent * 100).toFixed(1)}%)`
                    }}
                    outerRadius={110}
                    fill="#8884d8"
                    dataKey="value"
                    stroke="#fff"
                    strokeWidth={2}
                  >
                    {topTipoOcorrencia.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                      fontSize: '12px',
                    }}
                    formatter={(value: number, name: string, props: any) => [
                      `${value} ocorrências (${((value / topTipoOcorrencia.reduce((acc, e) => acc + e.value, 0)) * 100).toFixed(1)}%)`,
                      props.payload.name,
                    ]}
                  />
                  <Legend
                    verticalAlign="bottom"
                    height={80}
                    formatter={(value, entry: any) => {
                      const total = topTipoOcorrencia.reduce((acc, e) => acc + e.value, 0)
                      const percent = ((entry.payload.value / total) * 100).toFixed(1)
                      return `${value}: ${entry.payload.value} (${percent}%)`
                    }}
                    wrapperStyle={{ fontSize: '11px', paddingTop: '1rem' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Top 5 Tipo de Colaborador */}
          {topTipoColaborador.length > 0 && (
            <div className="chart-container">
              <div className="chart-title">Top 5 Tipos de Colaborador</div>
              <ResponsiveContainer width="100%" height={400}>
                <PieChart>
                  <Pie
                    data={topTipoColaborador}
                    cx="50%"
                    cy="50%"
                    labelLine={true}
                    label={({ name, value, percent }) => {
                      const shortName = name.length > 20 ? name.substring(0, 20) + '...' : name
                      return `${shortName}: ${value} (${(percent * 100).toFixed(1)}%)`
                    }}
                    outerRadius={110}
                    fill="#8884d8"
                    dataKey="value"
                    stroke="#fff"
                    strokeWidth={2}
                  >
                    {topTipoColaborador.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                      fontSize: '12px',
                    }}
                    formatter={(value: number, name: string, props: any) => [
                      `${value} ocorrências (${((value / topTipoColaborador.reduce((acc, e) => acc + e.value, 0)) * 100).toFixed(1)}%)`,
                      props.payload.name,
                    ]}
                  />
                  <Legend
                    verticalAlign="bottom"
                    height={80}
                    formatter={(value, entry: any) => {
                      const total = topTipoColaborador.reduce((acc, e) => acc + e.value, 0)
                      const percent = ((entry.payload.value / total) * 100).toFixed(1)
                      return `${value}: ${entry.payload.value} (${percent}%)`
                    }}
                    wrapperStyle={{ fontSize: '11px', paddingTop: '1rem' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Top 5 Redes */}
          {topRedes.length > 0 && (
            <div className="chart-container">
              <div className="chart-title">Top 5 Redes</div>
              <ResponsiveContainer width="100%" height={400}>
                <PieChart>
                  <Pie
                    data={topRedes}
                    cx="50%"
                    cy="50%"
                    labelLine={true}
                    label={({ name, value, percent }) => {
                      const shortName = name.length > 20 ? name.substring(0, 20) + '...' : name
                      return `${shortName}: ${value} (${(percent * 100).toFixed(1)}%)`
                    }}
                    outerRadius={110}
                    fill="#8884d8"
                    dataKey="value"
                    stroke="#fff"
                    strokeWidth={2}
                  >
                    {topRedes.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                      fontSize: '12px',
                    }}
                    formatter={(value: number, name: string, props: any) => [
                      `${value} ocorrências (${((value / topRedes.reduce((acc, e) => acc + e.value, 0)) * 100).toFixed(1)}%)`,
                      props.payload.name,
                    ]}
                  />
                  <Legend
                    verticalAlign="bottom"
                    height={80}
                    formatter={(value, entry: any) => {
                      const total = topRedes.reduce((acc, e) => acc + e.value, 0)
                      const percent = ((entry.payload.value / total) * 100).toFixed(1)
                      return `${value}: ${entry.payload.value} (${percent}%)`
                    }}
                    wrapperStyle={{ fontSize: '11px', paddingTop: '1rem' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Insights */}
        {insights.length > 0 && (
          <div className="insights-container">
            <h3 className="insights-title">💡 Insights Automáticos</h3>
            <ul className="insights-list">
              {insights.map((insight, index) => (
                <li key={index}>
                  <div className={`insight-card insight-${insight.type}`}>
                    <h4>{insight.title}</h4>
                    <p>{insight.description}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Tabela de Dados */}
        <h2 className="section-title">📋 Dados Detalhados ({ocorrencias.length} registros)</h2>
        <table className="data-table">
          <thead>
            <tr>
              <th>Data</th>
              <th>Setor</th>
              <th>Tipo</th>
              <th>Motivo</th>
              <th>Cliente</th>
              <th>Valor</th>
              <th>Status</th>
              <th>Prioridade</th>
            </tr>
          </thead>
          <tbody>
            {ocorrencias.slice(0, 100).map((item, index) => {
              let formattedDate = '-'
              try {
                if (item.data_ocorrencia) {
                  formattedDate = format(new Date(item.data_ocorrencia), 'dd/MM/yyyy', { locale: ptBR })
                }
              } catch {
                formattedDate = item.data_ocorrencia || '-'
              }
              return (
                <tr key={index}>
                  <td>{formattedDate}</td>
                  <td>{item.setor}</td>
                  <td>{item.tipo_ocorrencia.replace(/_/g, ' ')}</td>
                  <td>{(item.motivo || '-').replace(/_/g, ' ').substring(0, 30)}</td>
                  <td>{(item.cliente || '-').substring(0, 30)}</td>
                  <td>{item.valor ? formatCurrency(item.valor) : '-'}</td>
                  <td>{item.status}</td>
                  <td>{item.prioridade || '-'}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {ocorrencias.length > 100 && (
          <p style={{ textAlign: 'center', color: '#6b7280', fontSize: '12px', marginTop: '10px' }}>
            Mostrando primeiros 100 de {ocorrencias.length} registros
          </p>
        )}

        {/* Footer */}
        <div style={{ background: '#1f2937', color: 'white', padding: '20px', textAlign: 'center', marginTop: '30px', borderRadius: '10px' }}>
          <p style={{ margin: 0, fontSize: '14px', fontWeight: 'bold' }}>REGGAP - Sistema de Gestão de Ocorrências</p>
          <p style={{ margin: '5px 0 0 0', fontSize: '12px', opacity: 0.8 }}>Grupo DoceMel | Relatório gerado em {format(new Date(), 'dd/MM/yyyy HH:mm:ss', { locale: ptBR })}</p>
        </div>
      </div>
    </div>
  )
}
