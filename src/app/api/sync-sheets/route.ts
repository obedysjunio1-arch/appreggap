import { NextRequest, NextResponse } from 'next/server'
import { ocorrenciasApi } from '@/lib/supabase-client'
import { syncAllToSheets } from '@/lib/google-sheets-server'

export async function POST(request: NextRequest) {
  try {
    // Busca todas as ocorrências do Supabase
    const ocorrencias = await ocorrenciasApi.getAll()

    // Sincroniza com Google Sheets
    await syncAllToSheets(ocorrencias)

    return NextResponse.json({
      success: true,
      message: `✅ ${ocorrencias.length} ocorrências sincronizadas com sucesso!`,
      count: ocorrencias.length,
    })
  } catch (error: any) {
    console.error('Erro ao sincronizar com Google Sheets:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Erro ao sincronizar com Google Sheets',
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Use POST para sincronizar dados com Google Sheets',
    endpoint: '/api/sync-sheets',
    method: 'POST',
  })
}
