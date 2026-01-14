import { useRef } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
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
  AreaChart,
  Area
} from 'recharts';

interface ReportHTMLProps {
  data: any[];
  stats: {
    nfPendentes: number;
    totalPendente: number;
    nfCancelamento: number;
    totalCancelamento: number;
    nfAtraso: number;
    totalAtraso: number;
    nfValidadas: number;
    totalValidadas: number;
    nfLancadas: number;
    totalLancadas: number;
    totalGeral: number;
  };
  filters: any;
}

const COLORS = ['#073e29', '#2e6b4d', '#4a9170', '#70b896', '#9cdebd'];

export function ReportHTML({ data, stats, filters }: ReportHTMLProps) {
  const reportRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    if (!reportRef.current) return;
    
    try {
      // @ts-ignore
      const html2pdf = (await import('html2pdf.js')).default;
      
      const opt = {
        margin: [10, 10, 10, 10] as [number, number, number, number],
        filename: `Relatorio_Devolucoes_${format(new Date(), 'yyyy-MM-dd_HHmm')}.pdf`,
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm' as const, format: 'a4' as const, orientation: 'portrait' as const }
      };

      html2pdf().set(opt).from(reportRef.current).save();
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      // Fallback para print
      window.print();
    }
  };

  // Calcular dados dos gráficos
  const topClientesChart = data.reduce((acc: any, curr) => {
    const name = curr.nome_cliente || 'Desconhecido';
    const valor = Number(curr.valor_total_nota) || 0;
    acc[name] = (acc[name] || 0) + valor;
    return acc;
  }, {});
  const topClientesList = Object.entries(topClientesChart)
    .map(([name, value]) => ({ name, value }))
    .sort((a: any, b: any) => b.value - a.value)
    .slice(0, 5);

  const topVendedoresChart = data.reduce((acc: any, curr) => {
    const vendedor = curr.vendedor || 'Desconhecido';
    const valor = Number(curr.valor_total_nota) || 0;
    acc[vendedor] = (acc[vendedor] || 0) + valor;
    return acc;
  }, {});
  const topVendedoresList = Object.entries(topVendedoresChart)
    .map(([name, value]) => ({ name, value }))
    .sort((a: any, b: any) => b.value - a.value)
    .slice(0, 5);

  const topRedesChart = data.reduce((acc: any, curr) => {
    const rede = curr.rede || 'Sem rede';
    const valor = Number(curr.valor_total_nota) || 0;
    acc[rede] = (acc[rede] || 0) + valor;
    return acc;
  }, {});
  const topRedesList = Object.entries(topRedesChart)
    .map(([name, value]) => ({ name, value }))
    .sort((a: any, b: any) => b.value - a.value)
    .slice(0, 5);

  const cancelamentoChart = data
    .filter(d => d.resultado === 'TRATATIVA DE ANULAÇÃO')
    .reduce((acc: any, curr) => {
      const date = new Date(curr.data_emissao || curr.created_at);
      const day = format(date, 'dd/MM', { locale: ptBR });
      acc[day] = (acc[day] || 0) + 1;
      return acc;
    }, {});
  const cancelamentoEntries = Object.entries(cancelamentoChart)
    .sort((a: any, b: any) => {
      const dateA = new Date(a[0].split('/').reverse().join('-'));
      const dateB = new Date(b[0].split('/').reverse().join('-'));
      return dateA.getTime() - dateB.getTime();
    })
    .slice(0, 10)
    .map(([name, value]) => ({ name, value }));

  const municipioChart = data.reduce((acc: any, curr) => {
    const municipio = curr.cidade_origem || 'N/A';
    acc[municipio] = (acc[municipio] || 0) + (Number(curr.valor_total_nota) || 0);
    return acc;
  }, {});
  const municipioList = Object.entries(municipioChart)
    .map(([name, value]) => ({ name, value }))
    .sort((a: any, b: any) => b.value - a.value)
    .slice(0, 6);

  const motivosChart = data.reduce((acc: any, curr) => {
    const motivo = curr.motivo_nome || 'Não informado';
    acc[motivo] = (acc[motivo] || 0) + 1;
    return acc;
  }, {});
  const motivosList = Object.entries(motivosChart)
    .map(([name, value]) => ({ name, value }))
    .sort((a: any, b: any) => b.value - a.value)
    .slice(0, 5);

  const produtosMap: Record<string, number> = {};
  data.forEach(devol => {
    const itens = devol.itens || [];
    itens.forEach((item: any) => {
      const produto = item.descricao || 'Desconhecido';
      const palavras = produto.split(' ');
      const nomeReduzido = palavras.slice(0, 2).join(' ');
      const quantidade = Number(item.quantidade) || 0;
      produtosMap[nomeReduzido] = (produtosMap[nomeReduzido] || 0) + quantidade;
    });
  });
  const topProdutosList = Object.entries(produtosMap)
    .map(([name, quantidade]) => ({ name, quantidade }))
    .sort((a: any, b: any) => b.quantidade - a.quantidade)
    .slice(0, 10);

  // Calcular insights
  const totalValue = data.reduce((sum, d) => sum + (Number(d.valor_total_nota) || 0), 0);
  const totalReturns = data.length;
  const insightsList: string[] = [];
  
  if (totalReturns > 0) {
    insightsList.push(`Total de ${totalReturns} devolucao(oes) no periodo selecionado, totalizando R$ ${totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}.`);
  }
  
  if (topClientesList.length > 0 && totalValue > 0) {
    const top1Percent = ((topClientesList[0].value as number) / totalValue) * 100;
    if (top1Percent > 20) {
      insightsList.push(`Cliente "${topClientesList[0].name}" concentra ${top1Percent.toFixed(1)}% do valor total de devolucoes.`);
    }
  }
  
  if (topVendedoresList.length > 0) {
    insightsList.push(`Vendedor "${topVendedoresList[0].name}" lidera em devolucoes com R$ ${(topVendedoresList[0].value as number).toLocaleString('pt-BR')}.`);
  }
  
  if (topProdutosList.length > 0) {
    insightsList.push(`Produto "${topProdutosList[0].name}" e o mais devolvido com ${topProdutosList[0].quantidade.toFixed(2)} unidades.`);
  }

  const periodoText = filters.startDate && filters.endDate 
    ? `${format(filters.startDate, 'dd/MM/yyyy', { locale: ptBR })} a ${format(filters.endDate, 'dd/MM/yyyy', { locale: ptBR })}`
    : filters.period || 'Período não especificado';

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
          list-style: none;
          padding: 0;
        }
        .insights-list li {
          padding: 8px 0;
          border-bottom: 1px solid #d1d5db;
          font-size: 14px;
          color: #374151;
        }
        .insights-list li:last-child {
          border-bottom: none;
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
            boxShadow: '0 4px 6px rgba(0,0,0,0.3)'
          }}
        >
          🖨️ Imprimir
        </button>
        <button 
          className="print-button" 
          onClick={handleDownloadPDF}
          style={{
            background: '#073e29',
            color: 'white',
            border: 'none',
            padding: '12px 24px',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: 'bold',
            cursor: 'pointer',
            boxShadow: '0 4px 6px rgba(0,0,0,0.3)'
          }}
        >
          📥 Salvar PDF
        </button>
      </div>

      <div ref={reportRef} className="report-container">
        {/* Header */}
        <div className="report-header">
          <div>
            <h1 className="report-title">Relatório de Devoluções</h1>
            <p className="report-subtitle">GRUPO DOCE MEL</p>
          </div>
          <div className="report-date">
            <div>Gerado em: {format(new Date(), 'dd/MM/yyyy, HH:mm:ss', { locale: ptBR })}</div>
            <div>Período: {periodoText}</div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="stats-cards">
          <div className="stat-card">
            <div className="stat-card-title">NF Pendentes</div>
            <div className="stat-card-value">{stats.nfPendentes}</div>
            <div className="stat-card-subvalue">R$ {stats.totalPendente.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
          </div>
          <div className="stat-card">
            <div className="stat-card-title">NF Cancelamento</div>
            <div className="stat-card-value">{stats.nfCancelamento}</div>
            <div className="stat-card-subvalue">R$ {stats.totalCancelamento.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
          </div>
          <div className="stat-card">
            <div className="stat-card-title">NF em Atraso</div>
            <div className="stat-card-value">{stats.nfAtraso}</div>
            <div className="stat-card-subvalue">R$ {stats.totalAtraso.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
          </div>
          <div className="stat-card">
            <div className="stat-card-title">NF Validadas</div>
            <div className="stat-card-value">{stats.nfValidadas}</div>
            <div className="stat-card-subvalue">R$ {stats.totalValidadas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
          </div>
          <div className="stat-card">
            <div className="stat-card-title">Total Geral</div>
            <div className="stat-card-value">{data.length}</div>
            <div className="stat-card-subvalue">R$ {stats.totalGeral.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
          </div>
        </div>

        {/* Gráficos */}
        <h2 className="section-title">📊 Análises Gráficas</h2>
        <div className="charts-grid">
          <div className="chart-container">
            <div className="chart-title">Top 5 Clientes (Valor)</div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topClientesList}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip formatter={(value: any) => `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} />
                <Bar dataKey="value" fill="#073e29" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="chart-container">
            <div className="chart-title">Top 5 Vendedores (Valor)</div>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={topVendedoresList}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${percent ? (percent * 100).toFixed(0) : 0}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {topVendedoresList.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: any) => `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="chart-container">
            <div className="chart-title">Top 5 Redes (Valor)</div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topRedesList}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value: any) => `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} />
                <Bar dataKey="value" fill="#2e6b4d" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="chart-container">
            <div className="chart-title">Notas em Cancelamento</div>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={cancelamentoEntries}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Area type="monotone" dataKey="value" stroke="#073e29" fill="#70b896" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="chart-container">
            <div className="chart-title">Distribuição por Município</div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={municipioList}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip formatter={(value: any) => `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} />
                <Bar dataKey="value" fill="#4a9170" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="chart-container">
            <div className="chart-title">Principais Motivos</div>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={motivosList}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${percent ? (percent * 100).toFixed(0) : 0}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {motivosList.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="chart-container">
            <div className="chart-title">Produtos Críticos (Top 10)</div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topProdutosList} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={150} />
                <Tooltip formatter={(value: any) => `${value.toFixed(2)} unidades`} />
                <Bar dataKey="quantidade" fill="#9cdebd" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Insights */}
        <div className="insights-container">
          <h3 className="insights-title">💡 Insights Automáticos</h3>
          <ul className="insights-list">
            {insightsList.map((insight, index) => (
              <li key={index}>{insight}</li>
            ))}
          </ul>
        </div>

        {/* Tabela de Dados */}
        <h2 className="section-title">📋 Dados Detalhados</h2>
        <table className="data-table">
          <thead>
            <tr>
              <th>Data Emissão</th>
              <th>Nota Fiscal</th>
              <th>Cliente</th>
              <th>Vendedor</th>
              <th>Valor</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {data.slice(0, 50).map((item, index) => (
              <tr key={index}>
                <td>{item.data_emissao ? format(new Date(item.data_emissao), 'dd/MM/yyyy', { locale: ptBR }) : '-'}</td>
                <td>{item.numero || '-'}</td>
                <td>{(item.nome_cliente || '-').substring(0, 30)}</td>
                <td>{item.vendedor || '-'}</td>
                <td>R$ {(Number(item.valor_total_nota) || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                <td>{item.resultado || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

