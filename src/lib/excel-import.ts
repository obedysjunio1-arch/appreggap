'use client'

import * as XLSX from 'xlsx'
import { Cliente } from './supabase'

export async function importClientesFromExcel(file: File): Promise<Cliente[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer)
        const workbook = XLSX.read(data, { type: 'array' })

        // Pegar a primeira planilha
        const firstSheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[firstSheetName]

        // Converter para JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet) as any[]

        // Mapear para o formato Cliente
        // Espera campos: Cliente, Rede, Cidade, UF, Vendedor
        const clientes: Cliente[] = jsonData
          .map((row) => {
            // Tentar diferentes variações de nomes de colunas (case-insensitive)
            const cliente = row['Cliente'] || row['cliente'] || row['CLIENTE'] || row['Cliente'] || ''
            const rede = row['Rede'] || row['rede'] || row['REDE'] || row['Rede'] || ''
            const cidade = row['Cidade'] || row['cidade'] || row['CIDADE'] || row['Cidade'] || ''
            const uf = row['UF'] || row['uf'] || row['Uf'] || ''
            const vendedor = row['Vendedor'] || row['vendedor'] || row['VENDEDOR'] || row['Vendedor'] || ''

            // Validar se tem pelo menos o nome do cliente
            if (!cliente || cliente.toString().trim() === '') {
              return null
            }

            return {
              cliente: cliente.toString().trim(),
              rede: rede ? rede.toString().trim() : '',
              cidade: cidade ? cidade.toString().trim() : '',
              uf: uf ? uf.toString().trim().toUpperCase() : '',
              vendedor: vendedor ? vendedor.toString().trim() : '',
            }
          })
          .filter((c): c is Cliente => c !== null)

        resolve(clientes)
      } catch (error) {
        reject(new Error('Erro ao processar arquivo Excel: ' + (error as Error).message))
      }
    }

    reader.onerror = () => {
      reject(new Error('Erro ao ler arquivo'))
    }

    reader.readAsArrayBuffer(file)
  })
}

export function exportClientesToExcel(clientes: Cliente[]): void {
  const worksheet = XLSX.utils.json_to_sheet(
    clientes.map((c) => ({
      Cliente: c.cliente,
      Rede: c.rede,
      Cidade: c.cidade,
      UF: c.uf,
      Vendedor: c.vendedor,
    }))
  )

  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Clientes')
  XLSX.writeFile(workbook, `clientes-export-${new Date().toISOString().split('T')[0]}.xlsx`)
}
