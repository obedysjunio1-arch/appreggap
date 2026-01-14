'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import InternalLayout from '@/components/InternalLayout'

export const dynamic = 'force-dynamic'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useToast } from '@/components/ui/use-toast'
import {
  clientesApi,
  tipoOcorrenciaApi,
  tipoColaboradorApi,
  setorApi,
  motivoApi,
  statusApi,
} from '@/lib/supabase-client'
import {
  ArrowLeft,
  Plus,
  Edit,
  Trash2,
  RefreshCw,
  Save,
  FileSpreadsheet,
} from 'lucide-react'

interface Cliente {
  id?: string
  cliente: string
  rede: string
  cidade: string
  uf: string
  vendedor: string
}

interface TipoGenerico {
  id?: string
  nome: string
  ativo: boolean
}

type TabType = 'clientes' | 'tipo_ocorrencia' | 'tipo_colaborador' | 'setor' | 'motivo' | 'status'

export default function ConfiguracoesPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState<TabType>('clientes')
  const [loading, setLoading] = useState(true)

  // Dados
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [tipoOcorrencia, setTipoOcorrencia] = useState<TipoGenerico[]>([])
  const [tipoColaborador, setTipoColaborador] = useState<TipoGenerico[]>([])
  const [setores, setSetores] = useState<TipoGenerico[]>([])
  const [motivos, setMotivos] = useState<TipoGenerico[]>([])
  const [statusList, setStatusList] = useState<TipoGenerico[]>([])

  // Dialogs
  const [clienteDialogOpen, setClienteDialogOpen] = useState(false)
  const [genericDialogOpen, setGenericDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<any>(null)
  const [deleteTarget, setDeleteTarget] = useState<{ type: string; id: string } | null>(null)

  // Forms
  const [clienteFormData, setClienteFormData] = useState<Cliente>({
    cliente: '',
    rede: '',
    cidade: '',
    uf: '',
    vendedor: '',
  })

  const [genericFormData, setGenericFormData] = useState<TipoGenerico>({
    nome: '',
    ativo: true,
  })

  const loadAllData = useCallback(async () => {
    setLoading(true)
    try {
      const [cli, tipoOc, tipoCol, set, mot, st] = await Promise.all([
        clientesApi.getAll(),
        tipoOcorrenciaApi.getAll(),
        tipoColaboradorApi.getAll(),
        setorApi.getAll(),
        motivoApi.getAll(),
        statusApi.getAll(),
      ])

      setClientes(cli || [])
      setTipoOcorrencia(tipoOc || [])
      setTipoColaborador(tipoCol || [])
      setSetores(set || [])
      setMotivos(mot || [])
      setStatusList(st || [])
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
      toast({
        variant: 'destructive',
        title: 'Erro ao carregar',
        description: 'Não foi possível carregar os dados.',
      })
    }
    setLoading(false)
  }, [toast])

  useEffect(() => {
    loadAllData()
  }, [activeTab, loadAllData])

  const handleSaveCliente = async () => {
    try {
      if (clienteFormData.id) {
        await clientesApi.update(clienteFormData.id!, clienteFormData)
        toast({ title: 'Cliente atualizado!' })
      } else {
        await clientesApi.create(clienteFormData)
        toast({ title: 'Cliente cadastrado!' })
      }
      setClienteDialogOpen(false)
      setClienteFormData({
        cliente: '',
        rede: '',
        cidade: '',
        uf: '',
        vendedor: '',
      })
      await loadAllData()
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao salvar',
        description: 'Não foi possível salvar o cliente.',
      })
    }
  }

  const handleSaveGeneric = async (type: TabType) => {
    if (type === 'clientes') return // Clientes têm seu próprio handler

    try {
      const apiMap: Record<Exclude<TabType, 'clientes'>, any> = {
        tipo_ocorrencia: tipoOcorrenciaApi,
        tipo_colaborador: tipoColaboradorApi,
        setor: setorApi,
        motivo: motivoApi,
        status: statusApi,
      }

      const api = apiMap[type as Exclude<TabType, 'clientes'>]

      if (editingItem?.id) {
        await api.update(editingItem.id, genericFormData)
        toast({ title: 'Registro atualizado!' })
      } else {
        await api.create(genericFormData)
        toast({ title: 'Registro cadastrado!' })
      }
      setGenericDialogOpen(false)
      setEditingItem(null)
      setGenericFormData({ nome: '', ativo: true })
      await loadAllData()
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao salvar',
        description: 'Não foi possível salvar o registro.',
      })
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return

    try {
      const api = {
        clientes: clientesApi,
        tipo_ocorrencia: tipoOcorrenciaApi,
        tipo_colaborador: tipoColaboradorApi,
        setor: setorApi,
        motivo: motivoApi,
        status: statusApi,
      }[deleteTarget.type] as any

      await api.delete(deleteTarget.id)
      toast({ title: 'Registro excluído!' })
      setDeleteDialogOpen(false)
      setDeleteTarget(null)
      await loadAllData()
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao excluir',
        description: 'Não foi possível excluir o registro.',
      })
    }
  }


  const tabs = [
    { id: 'clientes' as TabType, label: 'Clientes', icon: '🏢' },
    { id: 'tipo_ocorrencia' as TabType, label: 'Tipo Ocorrência', icon: '📋' },
    { id: 'tipo_colaborador' as TabType, label: 'Tipo Colaborador', icon: '👥' },
    { id: 'setor' as TabType, label: 'Setor', icon: '🏭' },
    { id: 'motivo' as TabType, label: 'Motivos', icon: '❓' },
    { id: 'status' as TabType, label: 'Status', icon: '📊' },
  ]

  const getData = () => {
    switch (activeTab) {
      case 'clientes': return clientes
      case 'tipo_ocorrencia': return tipoOcorrencia
      case 'tipo_colaborador': return tipoColaborador
      case 'setor': return setores
      case 'motivo': return motivos
      case 'status': return statusList
      default: return []
    }
  }

  const renderTable = () => {
    const data = getData()

    if (activeTab === 'clientes') {
      return (
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left p-3 text-sm font-semibold">Cliente</th>
              <th className="text-left p-3 text-sm font-semibold">Rede</th>
              <th className="text-left p-3 text-sm font-semibold">Cidade</th>
              <th className="text-left p-3 text-sm font-semibold">UF</th>
              <th className="text-left p-3 text-sm font-semibold">Vendedor</th>
              <th className="text-left p-3 text-sm font-semibold">Ações</th>
            </tr>
          </thead>
          <tbody>
            {data.map((item: any) => (
              <tr key={item.id} className="border-b hover:bg-muted/50">
                <td className="p-3 text-sm">{item.cliente}</td>
                <td className="p-3 text-sm">{item.rede}</td>
                <td className="p-3 text-sm">{item.cidade}</td>
                <td className="p-3 text-sm">{item.uf}</td>
                <td className="p-3 text-sm">{item.vendedor}</td>
                <td className="p-3 text-sm">
                  <div className="flex gap-2">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => {
                        setClienteFormData(item)
                        setEditingItem(item)
                        setClienteDialogOpen(true)
                      }}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => {
                        setDeleteTarget({ type: 'clientes', id: item.id })
                        setDeleteDialogOpen(true)
                      }}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )
    }

    return (
      <table className="w-full">
        <thead>
          <tr className="border-b">
            <th className="text-left p-3 text-sm font-semibold">Nome</th>
            <th className="text-left p-3 text-sm font-semibold">Ativo</th>
            <th className="text-left p-3 text-sm font-semibold">Ações</th>
          </tr>
        </thead>
        <tbody>
          {data.map((item: any) => (
            <tr key={item.id} className="border-b hover:bg-muted/50">
              <td className="p-3 text-sm">{item.nome}</td>
              <td className="p-3 text-sm">
                {item.ativo ? (
                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Sim
                  </span>
                ) : (
                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                    Não
                  </span>
                )}
              </td>
              <td className="p-3 text-sm">
                <div className="flex gap-2">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => {
                      setGenericFormData(item)
                      setEditingItem(item)
                      setGenericDialogOpen(true)
                    }}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => {
                      setDeleteTarget({ type: activeTab, id: item.id })
                      setDeleteDialogOpen(true)
                    }}
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-lg text-muted-foreground">Carregando configurações...</p>
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
            <h1 className="text-3xl font-bold">Configurações</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie os cadastros do sistema
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.push('/dashboard')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          <Button onClick={loadAllData}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Card>
        <CardHeader>
          <div className="flex flex-wrap gap-2">
            {tabs.map((tab) => (
              <Button
                key={tab.id}
                variant={activeTab === tab.id ? 'default' : 'outline'}
                onClick={() => setActiveTab(tab.id)}
                className={activeTab === tab.id ? 'bg-[#073e29] hover:bg-[#073e29]/90 dark:bg-green-600 dark:hover:bg-green-700 text-white' : ''}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </Button>
            ))}
          </div>
        </CardHeader>
      </Card>

      {/* Conteúdo da Tab */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>
              {tabs.find(t => t.id === activeTab)?.label}
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                ({getData().length} registros)
              </span>
            </CardTitle>
            <div className="flex gap-2">
              <Button onClick={() => {
                setEditingItem(null)
                if (activeTab === 'clientes') {
                  setClienteFormData({
                    cliente: '',
                    rede: '',
                    cidade: '',
                    uf: '',
                    vendedor: '',
                  })
                  setClienteDialogOpen(true)
                } else {
                  setGenericFormData({ nome: '', ativo: true })
                  setGenericDialogOpen(true)
                }
              }} disabled={loading}>
                <Plus className="w-4 h-4 mr-2" />
                Novo Registro
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="w-full h-[600px]">
            <div className={activeTab === 'clientes' ? 'min-w-[1000px]' : 'min-w-[600px]'}>
              {getData().length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">Nenhum registro encontrado</p>
                  <Button
                    className="mt-4"
                    onClick={() => {
                      setEditingItem(null)
                      if (activeTab === 'clientes') {
                        setClienteDialogOpen(true)
                      } else {
                        setGenericDialogOpen(true)
                      }
                    }}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Adicionar Primeiro Registro
                  </Button>
                </div>
              ) : (
                renderTable()
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Dialog Cliente */}
      <Dialog open={clienteDialogOpen} onOpenChange={setClienteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingItem ? 'Editar Cliente' : 'Novo Cliente'}
            </DialogTitle>
            <DialogDescription>
              Preencha os dados do cliente
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Cliente *</Label>
              <Input
                value={clienteFormData.cliente}
                onChange={(e) => setClienteFormData({ ...clienteFormData, cliente: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Rede</Label>
              <Input
                value={clienteFormData.rede}
                onChange={(e) => setClienteFormData({ ...clienteFormData, rede: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Cidade</Label>
                <Input
                  value={clienteFormData.cidade}
                  onChange={(e) => setClienteFormData({ ...clienteFormData, cidade: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>UF</Label>
                <Input
                  maxLength={2}
                  value={clienteFormData.uf}
                  onChange={(e) => setClienteFormData({ ...clienteFormData, uf: e.target.value.toUpperCase() })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Vendedor</Label>
              <Input
                value={clienteFormData.vendedor}
                onChange={(e) => setClienteFormData({ ...clienteFormData, vendedor: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setClienteDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveCliente}>
              <Save className="w-4 h-4 mr-2" />
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Genérico */}
      <Dialog open={genericDialogOpen} onOpenChange={setGenericDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingItem ? 'Editar Registro' : 'Novo Registro'}
            </DialogTitle>
            <DialogDescription>
              {tabs.find(t => t.id === activeTab)?.label}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nome *</Label>
              <Input
                value={genericFormData.nome}
                onChange={(e) => setGenericFormData({ ...genericFormData, nome: e.target.value })}
                required
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="ativo"
                checked={genericFormData.ativo}
                onCheckedChange={(checked) => setGenericFormData({ ...genericFormData, ativo: checked })}
              />
              <Label htmlFor="ativo">Ativo</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setGenericDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={() => {
              if (activeTab !== 'clientes') {
                handleSaveGeneric(activeTab)
              }
            }}>
              <Save className="w-4 h-4 mr-2" />
              Salvar
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
              Tem certeza que deseja excluir este registro? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              <Trash2 className="w-4 h-4 mr-2" />
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
    </InternalLayout>
  )
}
