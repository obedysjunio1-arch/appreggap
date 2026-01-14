import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

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

// Formatar data no padrão brasileiro
export function formatDate(date: string | Date | null | undefined): string {
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

// Calcular Taxa de Reincidência
export function calculateRecurrenceRate(ocorrencias: Array<{ motivo: string; cliente?: string }>): number {
  if (ocorrencias.length === 0) return 0

  const ocorrenciasPorMotivoCliente = new Map<string, number>()
  ocorrencias.forEach(o => {
    const key = `${o.motivo}_${o.cliente || 'SEM_CLIENTE'}`
    ocorrenciasPorMotivoCliente.set(key, (ocorrenciasPorMotivoCliente.get(key) || 0) + 1)
  })

  const reincidencias = Array.from(ocorrenciasPorMotivoCliente.values()).filter(count => count > 1).length
  const total = ocorrenciasPorMotivoCliente.size

  if (total === 0) return 0
  return Math.round((reincidencias / total) * 100)
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
