import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

// Função helper para obter data/hora atual no fuso horário do Brasil (UTC-3)
export function getBrazilDateTime(): Date {
  const now = new Date()
  // Converte para o fuso horário do Brasil
  const brazilTimeString = now.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' })
  return new Date(brazilTimeString)
}

// Função helper para converter data para ISO string no fuso do Brasil
export function getBrazilDateTimeISO(): string {
  return getBrazilDateTime().toISOString()
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Formatar moeda em Real Brasileiro
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value || 0)
}

// Formatar data no padrão brasileiro (DD/MM)
export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return '-'
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    if (isNaN(dateObj.getTime())) return '-'
    return format(dateObj, 'dd/MM', { locale: ptBR })
  } catch {
    return '-'
  }
}

// Formatar data completa (DD/MM/AAAA) quando necessário
export function formatDateFull(date: string | Date | null | undefined): string {
  if (!date) return '-'
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    if (isNaN(dateObj.getTime())) return '-'
    return format(dateObj, 'dd/MM/yyyy', { locale: ptBR })
  } catch {
    return '-'
  }
}

// Calcular MTTR (Mean Time To Resolution)
export function calculateMTTR(ocorrencias: Array<{ status: string; data_ocorrencia: string; data_criacao?: string }>): number {
  const finalizadas = ocorrencias.filter(o => o.status === 'FINALIZADO')
  if (finalizadas.length === 0) return 0

  const tempos = finalizadas.map(o => {
    try {
      const inicio = new Date(o.data_ocorrencia || o.data_criacao || '')
      const fim = new Date()
      const diffTime = fim.getTime() - inicio.getTime()
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
      return diffDays >= 0 ? diffDays : 0
    } catch {
      return 0
    }
  }).filter(t => t > 0)

  if (tempos.length === 0) return 0
  const soma = tempos.reduce((acc, t) => acc + t, 0)
  return Math.round(soma / tempos.length)
}

// Calcular Taxa de Reincidência (razão entre registros com Reincidência = Sim / total de registros)
export function calculateRecurrenceRate(ocorrencias: Array<{ reincidencia?: string }>): number {
  if (ocorrencias.length === 0) return 0

  const totalRegistros = ocorrencias.length
  const registrosComReincidencia = ocorrencias.filter(o => o.reincidencia === 'SIM').length

  if (totalRegistros === 0) return 0
  return Math.round((registrosComReincidencia / totalRegistros) * 100)
}

// Calcular Impacto Financeiro Total
export function calculateFinancialImpact(ocorrencias: Array<{ valor?: number }>): number {
  return ocorrencias.reduce((acc, o) => acc + (Number(o.valor) || 0), 0)
}

// Obter Status SLA (não usado mas mantido para compatibilidade)
export function getSLAStatus(dias: number): string {
  if (dias <= 1) return 'Crítico'
  if (dias <= 3) return 'Alto'
  if (dias <= 7) return 'Médio'
  return 'Baixo'
}

// Calcular Comparativo Semanal (semana atual vs semana anterior)
export function getWeekComparison(ocorrencias: Array<{ data_ocorrencia: string }>) {
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
