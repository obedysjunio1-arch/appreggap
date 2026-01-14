import { google } from 'googleapis'
import { Ocorrencia } from './supabase'

// Configuração do Google Sheets
const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_SPREADSHEET_ID || ''
const SERVICE_ACCOUNT_EMAIL = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || ''
const SERVICE_ACCOUNT_KEY = process.env.GOOGLE_SERVICE_ACCOUNT_KEY || ''

// Nome da aba (sheet) onde os dados serão salvos
const SHEET_NAME = 'Registros'

// Headers da planilha (ordem das colunas)
const HEADERS = [
  'id',
  'data_criacao',
  'data_conclusao',
  'data_ocorrencia',
  'setor',
  'tipo_colaborador',
  'tipo_ocorrencia',
  'motivo',
  'cliente',
  'rede',
  'cidade',
  'uf',
  'vendedor',
  'valor',
  'detalhamento',
  'resultado',
  'tratativa',
  'status',
  'reincidencia',
  'nf_anterior',
  'nf_substituta',
  'created_at',
  'updated_at',
]

/**
 * Inicializa e retorna o cliente autenticado do Google Sheets
 */
async function getAuthClient() {
  if (!SERVICE_ACCOUNT_KEY || !SERVICE_ACCOUNT_EMAIL) {
    throw new Error('Credenciais do Google Service Account não configuradas!')
  }

  const auth = new google.auth.JWT({
    email: SERVICE_ACCOUNT_EMAIL,
    key: SERVICE_ACCOUNT_KEY.replace(/\\n/g, '\n'),
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  })

  return auth
}

/**
 * Obtém o cliente do Google Sheets API
 */
async function getSheetsClient() {
  const auth = await getAuthClient()
  return google.sheets({ version: 'v4', auth })
}

/**
 * Converte uma ocorrência para array de valores (na ordem dos headers)
 */
function ocorrenciaToRow(ocorrencia: Ocorrencia): any[] {
  return [
    ocorrencia.id || '',
    ocorrencia.data_criacao || '',
    ocorrencia.data_conclusao || '',
    ocorrencia.data_ocorrencia || '',
    ocorrencia.setor || '',
    ocorrencia.tipo_colaborador || '',
    ocorrencia.tipo_ocorrencia || '',
    ocorrencia.motivo || '',
    ocorrencia.cliente || '',
    ocorrencia.rede || '',
    ocorrencia.cidade || '',
    ocorrencia.uf || '',
    ocorrencia.vendedor || '',
    ocorrencia.valor || '',
    ocorrencia.detalhamento || '',
    ocorrencia.resultado || '',
    ocorrencia.tratativa || '',
    ocorrencia.status || '',
    ocorrencia.reincidencia || '',
    ocorrencia.nf_anterior || '',
    ocorrencia.nf_substituta || '',
    ocorrencia.data_criacao || new Date().toISOString(),
    new Date().toISOString(),
  ]
}

/**
 * Garante que os headers existem na primeira linha da planilha
 */
async function ensureHeaders() {
  try {
    const sheets = await getSheetsClient()

    // Verifica se a aba existe, se não existir, cria
    const spreadsheet = await sheets.spreadsheets.get({
      spreadsheetId: SPREADSHEET_ID,
    })

    const sheetExists = spreadsheet.data.sheets?.some(
      (sheet) => sheet.properties?.title === SHEET_NAME
    )

    if (!sheetExists) {
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId: SPREADSHEET_ID,
        requestBody: {
          requests: [
            {
              addSheet: {
                properties: {
                  title: SHEET_NAME,
                },
              },
            },
          ],
        },
      })
    }

    // Verifica se a primeira linha tem headers
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A1:Z1`,
    })

    const existingHeaders = response.data.values?.[0] || []

    // Se não houver headers ou forem diferentes, atualiza
    if (existingHeaders.length === 0 || JSON.stringify(existingHeaders) !== JSON.stringify(HEADERS)) {
      await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEET_NAME}!A1`,
        valueInputOption: 'RAW',
        requestBody: {
          values: [HEADERS],
        },
      })
    }
  } catch (error) {
    console.error('Erro ao garantir headers:', error)
    throw error
  }
}

/**
 * Encontra a linha de uma ocorrência pelo ID
 */
async function findRowByID(id: string): Promise<number | null> {
  try {
    const sheets = await getSheetsClient()

    // Busca todas as linhas (exceto header)
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A2:A`,
    })

    const rows = response.data.values || []
    const rowIndex = rows.findIndex((row) => row[0] === id)

    if (rowIndex === -1) return null

    // Retorna o número da linha (rowIndex + 2 porque: +1 para header, +1 para índice base 0)
    return rowIndex + 2
  } catch (error) {
    console.error('Erro ao buscar linha por ID:', error)
    return null
  }
}

/**
 * Obtém o ID da aba (sheet) pelo nome
 */
async function getSheetId(): Promise<number> {
  const sheets = await getSheetsClient()
  const spreadsheet = await sheets.spreadsheets.get({
    spreadsheetId: SPREADSHEET_ID,
  })

  const sheet = spreadsheet.data.sheets?.find(
    (s) => s.properties?.title === SHEET_NAME
  )

  if (!sheet?.properties?.sheetId) {
    throw new Error(`Aba "${SHEET_NAME}" não encontrada!`)
  }

  return sheet.properties.sheetId
}

/**
 * Exporta todas as ocorrências do Supabase para o Google Sheets
 */
export async function exportAllToSheets(ocorrencias: Ocorrencia[]): Promise<void> {
  try {
    if (!SPREADSHEET_ID) {
      throw new Error('ID da planilha não configurado!')
    }

    const sheets = await getSheetsClient()

    // Garante que os headers existem
    await ensureHeaders()

    // Converte todas as ocorrências para arrays
    const rows = ocorrencias.map(ocorrenciaToRow)

    if (rows.length === 0) {
      // Nenhuma ocorrência para exportar
      return
    }

    // Limpa todas as linhas existentes (exceto header)
    await sheets.spreadsheets.values.clear({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A2:Z`,
    })

    // Adiciona todas as linhas de uma vez
    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A2`,
      valueInputOption: 'RAW',
      insertDataOption: 'INSERT_ROWS',
      requestBody: {
        values: rows,
      },
    })

    // Sincronização concluída com sucesso
  } catch (error) {
    console.error('Erro ao exportar para Google Sheets:', error)
    throw error
  }
}

/**
 * Salva uma nova ocorrência no Google Sheets
 */
export async function saveToSheets(ocorrencia: Ocorrencia): Promise<void> {
  try {
    if (!SPREADSHEET_ID) {
      throw new Error('ID da planilha não configurado!')
    }

    const sheets = await getSheetsClient()

    // Garante que os headers existem
    await ensureHeaders()

    // Converte a ocorrência para array
    const row = ocorrenciaToRow(ocorrencia)

    // Adiciona a nova linha
    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A2`,
      valueInputOption: 'RAW',
      insertDataOption: 'INSERT_ROWS',
      requestBody: {
        values: [row],
      },
    })

    // Ocorrência salva com sucesso
  } catch (error) {
    console.error('Erro ao salvar no Google Sheets:', error)
    throw error
  }
}

/**
 * Atualiza uma ocorrência existente no Google Sheets
 */
export async function updateInSheets(ocorrencia: Ocorrencia): Promise<void> {
  try {
    if (!SPREADSHEET_ID) {
      throw new Error('ID da planilha não configurado!')
    }

    if (!ocorrencia.id) {
      throw new Error('ID da ocorrência é obrigatório para atualização!')
    }

    const sheets = await getSheetsClient()

    // Encontra a linha pelo ID
    const rowNumber = await findRowByID(ocorrencia.id)

    if (!rowNumber) {
      // Se não encontrar, cria uma nova linha
      // Ocorrência não encontrada, criando nova linha
      await saveToSheets(ocorrencia)
      return
    }

    // Converte a ocorrência para array
    const row = ocorrenciaToRow(ocorrencia)

    // Atualiza a linha existente
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A${rowNumber}:V${rowNumber}`,
      valueInputOption: 'RAW',
      requestBody: {
        values: [row],
      },
    })

    // Ocorrência atualizada com sucesso
  } catch (error) {
    console.error('Erro ao atualizar no Google Sheets:', error)
    throw error
  }
}

/**
 * Remove uma ocorrência do Google Sheets
 */
export async function deleteFromSheets(id: string): Promise<void> {
  try {
    if (!SPREADSHEET_ID) {
      throw new Error('ID da planilha não configurado!')
    }

    const sheets = await getSheetsClient()

    // Encontra a linha pelo ID
    const rowNumber = await findRowByID(id)

    if (!rowNumber) {
      // Ocorrência não encontrada no Google Sheets
      return
    }

    // Remove a linha
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      requestBody: {
        requests: [
          {
            deleteDimension: {
              range: {
                sheetId: await getSheetId(),
                dimension: 'ROWS',
                startIndex: rowNumber - 1, // -1 porque o índice começa em 0
                endIndex: rowNumber,
              },
            },
          },
        ],
      },
    })

    // Ocorrência removida com sucesso
  } catch (error) {
    console.error('Erro ao remover do Google Sheets:', error)
    throw error
  }
}

/**
 * Sincroniza todas as ocorrências do Supabase para o Google Sheets
 * (substitui todos os dados existentes)
 */
export async function syncAllToSheets(ocorrencias: Ocorrencia[]): Promise<void> {
  await exportAllToSheets(ocorrencias)
}
