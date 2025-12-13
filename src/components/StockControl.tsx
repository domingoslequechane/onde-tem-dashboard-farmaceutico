import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Search, Plus, Download, RefreshCw, Edit, Package, Upload, Trash2, ToggleLeft, X } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import AddMedicineModal from './AddMedicineModal';
import ImportMedicinesModal from './ImportMedicinesModal';
import { useImport } from '@/contexts/ImportContext';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Medicine {
  id: string;
  nome: string;
  preco: number;
  categoria: string;
  disponivel: boolean;
}

interface StockControlProps {
  expanded?: boolean;
}

const ITEMS_PER_PAGE = 100;

const StockControl = ({ expanded = false }: StockControlProps) => {
  const { importState } = useImport();
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [availabilityFilter, setAvailabilityFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [editingMedicine, setEditingMedicine] = useState<Medicine | null>(null);
  const [farmaciaId, setFarmaciaId] = useState<string>('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [categories, setCategories] = useState<string[]>([]);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Open modal when user clicks maximize on floating indicator
  useEffect(() => {
    if (importState.isImporting && !importState.isMinimized) {
      setIsImportModalOpen(true);
    }
  }, [importState.isImporting, importState.isMinimized]);

  // Extract unique categories from medicines
  useEffect(() => {
    const uniqueCategories = [...new Set(medicines.map(m => m.categoria))]
      .filter(cat => cat && cat !== 'Sem categoria')
      .sort((a, b) => a.localeCompare(b));
    setCategories(uniqueCategories);
  }, [medicines]);

  const fetchMedicines = async (reset = true) => {
    if (reset) {
      setIsLoading(true);
      setMedicines([]);
    } else {
      setIsLoadingMore(true);
    }
    
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;

      const { data: farmaciaData, error: farmaciaError } = await supabase
        .from('farmacias')
        .select('id')
        .eq('user_id', userData.user.id)
        .maybeSingle();

      if (farmaciaError) throw farmaciaError;
      
      if (!farmaciaData) {
        setMedicines([]);
        toast({
          title: "Nenhuma farmácia associada",
          description: "Este usuário não possui uma farmácia vinculada.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      setFarmaciaId(farmaciaData.id);

      // Get total count
      const { count } = await supabase
        .from('estoque')
        .select('*', { count: 'exact', head: true })
        .eq('farmacia_id', farmaciaData.id);
      
      setTotalCount(count || 0);

      // Fetch records with offset
      const offset = reset ? 0 : medicines.length;
      const { data, error } = await supabase
        .from('estoque')
        .select(`
          medicamento_id,
          preco,
          disponivel,
          medicamentos (
            nome,
            categoria
          )
        `)
        .eq('farmacia_id', farmaciaData.id)
        .order('medicamentos(nome)')
        .range(offset, offset + ITEMS_PER_PAGE - 1);

      if (error) throw error;

      const formattedMedicines = (data || []).map((item: any) => ({
        id: item.medicamento_id,
        nome: item.medicamentos.nome,
        preco: parseFloat(item.preco),
        categoria: item.medicamentos.categoria || 'Sem categoria',
        disponivel: item.disponivel,
      }));

      if (reset) {
        setMedicines(formattedMedicines);
      } else {
        setMedicines(prev => [...prev, ...formattedMedicines]);
      }
    } catch (error) {
      console.error('Erro ao buscar medicamentos:', error);
      toast({
        title: "Erro ao carregar dados",
        description: "Não foi possível carregar o estoque.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchMedicines(true);
  }, []);

  // Real-time subscription for live updates
  useEffect(() => {
    if (!farmaciaId) return;

    const channel = supabase
      .channel('estoque-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'estoque',
          filter: `farmacia_id=eq.${farmaciaId}`
        },
        async (payload) => {
          // Fetch the full record with medication details
          const { data } = await supabase
            .from('estoque')
            .select(`
              medicamento_id,
              preco,
              disponivel,
              medicamentos (
                nome,
                categoria
              )
            `)
            .eq('medicamento_id', payload.new.medicamento_id)
            .eq('farmacia_id', farmaciaId)
            .single();

          if (data) {
            const newMedicine: Medicine = {
              id: data.medicamento_id,
              nome: data.medicamentos.nome,
              preco: Number(data.preco),
              categoria: data.medicamentos.categoria || 'Sem categoria',
              disponivel: data.disponivel,
            };
            setMedicines(prev => {
              // Check if already exists
              if (prev.some(m => m.id === newMedicine.id)) return prev;
              return [...prev, newMedicine].sort((a, b) => a.nome.localeCompare(b.nome));
            });
            setTotalCount(prev => prev + 1);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'estoque',
          filter: `farmacia_id=eq.${farmaciaId}`
        },
        async (payload) => {
          // Fetch updated record with medication details
          const { data } = await supabase
            .from('estoque')
            .select(`
              medicamento_id,
              preco,
              disponivel,
              medicamentos (
                nome,
                categoria
              )
            `)
            .eq('medicamento_id', payload.new.medicamento_id)
            .eq('farmacia_id', farmaciaId)
            .single();

          if (data) {
            setMedicines(prev => prev.map(m => 
              m.id === data.medicamento_id 
                ? {
                    id: data.medicamento_id,
                    nome: data.medicamentos.nome,
                    preco: Number(data.preco),
                    categoria: data.medicamentos.categoria || 'Sem categoria',
                    disponivel: data.disponivel,
                  }
                : m
            ));
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'estoque',
          filter: `farmacia_id=eq.${farmaciaId}`
        },
        (payload) => {
          setMedicines(prev => prev.filter(m => m.id !== payload.old.medicamento_id));
          setTotalCount(prev => Math.max(0, prev - 1));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [farmaciaId]);

  const filteredMedicines = medicines.filter(medicine =>
    medicine.nome.toLowerCase().includes(searchTerm.toLowerCase()) &&
    (categoryFilter === 'all' || medicine.categoria === categoryFilter) &&
    (availabilityFilter === 'all' || 
      (availabilityFilter === 'available' && medicine.disponivel) ||
      (availabilityFilter === 'unavailable' && !medicine.disponivel))
  );

  const displayedMedicines = expanded ? filteredMedicines : filteredMedicines.slice(0, 5);
  const hasMore = expanded && medicines.length < totalCount;

  const handleLoadMore = () => {
    fetchMedicines(false);
  };

  const isAllSelected = displayedMedicines.length > 0 && displayedMedicines.every(m => selectedIds.has(m.id));
  const isSomeSelected = selectedIds.size > 0;

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(displayedMedicines.map(m => m.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    const newSelected = new Set(selectedIds);
    if (checked) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedIds(newSelected);
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.size === 0 || !farmaciaId) return;
    
    setIsProcessing(true);
    try {
      const idsArray = Array.from(selectedIds);
      const batchSize = 100; // Process in batches to avoid "Bad Request" error
      const totalBatches = Math.ceil(idsArray.length / batchSize);
      
      for (let i = 0; i < totalBatches; i++) {
        const batch = idsArray.slice(i * batchSize, (i + 1) * batchSize);
        const { error } = await supabase
          .from('estoque')
          .delete()
          .eq('farmacia_id', farmaciaId)
          .in('medicamento_id', batch);

        if (error) throw error;
      }

      toast({
        title: "Medicamentos removidos",
        description: `${selectedIds.size} medicamento(s) removido(s) do estoque.`,
      });
      
      clearSelection();
      fetchMedicines(true);
    } catch (error) {
      console.error('Erro ao remover medicamentos:', error);
      toast({
        title: "Erro ao remover",
        description: "Não foi possível remover os medicamentos.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
      setShowDeleteDialog(false);
    }
  };

  const handleToggleAvailability = async (makeAvailable: boolean) => {
    if (selectedIds.size === 0 || !farmaciaId) return;
    
    setIsProcessing(true);
    try {
      const { error } = await supabase
        .from('estoque')
        .update({ disponivel: makeAvailable, atualizado_em: new Date().toISOString() })
        .eq('farmacia_id', farmaciaId)
        .in('medicamento_id', Array.from(selectedIds));

      if (error) throw error;

      toast({
        title: "Disponibilidade atualizada",
        description: `${selectedIds.size} medicamento(s) marcado(s) como ${makeAvailable ? 'disponível' : 'indisponível'}.`,
      });
      
      clearSelection();
      fetchMedicines(true);
    } catch (error) {
      console.error('Erro ao atualizar disponibilidade:', error);
      toast({
        title: "Erro ao atualizar",
        description: "Não foi possível atualizar a disponibilidade.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExportSelected = () => {
    const toExport = selectedIds.size > 0 
      ? medicines.filter(m => selectedIds.has(m.id))
      : medicines;
    
    const csvContent = [
      'Nome,Preço,Categoria,Disponível',
      ...toExport.map(m => 
        `${m.nome},${m.preco.toFixed(2)},${m.categoria},${m.disponivel ? 'Sim' : 'Não'}`
      )
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', `estoque_farmacia_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    toast({
      title: "Relatório exportado!",
      description: `${toExport.length} medicamento(s) exportado(s).`,
    });
  };

  return (
    <>
      <Card className={`border-none shadow-lg ${expanded ? "flex flex-col h-full" : "h-fit"}`}>
        <CardHeader className="pb-3 px-4 sm:px-6 bg-gradient-to-br from-primary/5 to-secondary/5 border-b">
          <CardTitle className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-base sm:text-lg">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-primary text-primary-foreground">
                <Package className="h-5 w-5" />
              </div>
              <span className="truncate">Gestão de Medicamentos</span>
            </div>
            <div className="flex gap-2 w-full sm:w-auto flex-wrap">
              <Button 
                size="sm" 
                onClick={() => {
                  setEditingMedicine(null);
                  setIsModalOpen(true);
                }}
                className="bg-secondary hover:bg-secondary/90 flex-1 sm:flex-none gap-1 h-8 text-xs"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Novo</span>
              </Button>
              <Button 
                size="sm" 
                onClick={() => setIsImportModalOpen(true)} 
                variant="outline"
                className="flex-1 sm:flex-none gap-1 h-8 text-xs border-primary text-primary hover:bg-primary/10"
              >
                <Upload className="h-3.5 w-3.5" />
                <span>Importar</span>
              </Button>
              <Button 
                size="sm" 
                onClick={() => fetchMedicines(true)} 
                variant="outline"
                className="flex-1 sm:flex-none gap-1 h-8 text-xs"
                disabled={isLoading}
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                <span>Atualizar</span>
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className={`p-4 sm:p-6 ${expanded ? "flex-1 flex flex-col overflow-hidden" : ""}`}>
          <div className={`${expanded ? "flex-1 flex flex-col min-h-0" : ""} space-y-3`}>
            <div className="flex flex-col sm:flex-row gap-2 overflow-visible">
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Buscar medicamento..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-9 text-sm"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-40 h-9 text-sm flex-shrink-0">
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas categorias</SelectItem>
                {categories.map(category => (
                  <SelectItem key={category} value={category}>{category}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={availabilityFilter} onValueChange={setAvailabilityFilter}>
              <SelectTrigger className="w-full sm:w-36 h-9 text-sm flex-shrink-0">
                <SelectValue placeholder="Disponibilidade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos status</SelectItem>
                <SelectItem value="available">Disponíveis</SelectItem>
                <SelectItem value="unavailable">Indisponíveis</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Selection actions bar */}
          {isSomeSelected && (
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-2.5 bg-primary/10 border border-primary/30 rounded-lg animate-in slide-in-from-top-2 duration-200">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-primary whitespace-nowrap">
                  {selectedIds.size} selecionado(s)
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearSelection}
                  className="h-7 px-2 text-xs"
                >
                  <X className="h-3 w-3 mr-1" />
                  Limpar
                </Button>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleToggleAvailability(true)}
                  disabled={isProcessing}
                  className="h-7 px-2 text-xs gap-1 border-secondary text-secondary hover:bg-secondary/10 flex-shrink-0"
                >
                  <ToggleLeft className="h-3 w-3" />
                  <span className="hidden sm:inline">Disponível</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleToggleAvailability(false)}
                  disabled={isProcessing}
                  className="h-7 px-2 text-xs gap-1 border-amber-500 text-amber-600 hover:bg-amber-50 flex-shrink-0"
                >
                  <ToggleLeft className="h-3 w-3" />
                  <span className="hidden sm:inline">Indisponível</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportSelected}
                  disabled={isProcessing}
                  className="h-7 px-2 text-xs gap-1 flex-shrink-0"
                >
                  <Download className="h-3 w-3" />
                  <span className="hidden sm:inline">Exportar</span>
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setShowDeleteDialog(true)}
                  disabled={isProcessing}
                  className="h-7 px-2 text-xs gap-1 flex-shrink-0"
                >
                  <Trash2 className="h-3 w-3" />
                  <span className="hidden sm:inline">Remover</span>
                </Button>
              </div>
            </div>
          )}

          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              <RefreshCw className="animate-spin h-6 w-6 mx-auto mb-2" />
              <p className="text-sm">Carregando medicamentos...</p>
            </div>
          ) : displayedMedicines.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Package className="h-10 w-10 mx-auto mb-2 opacity-50" />
              <p className="font-medium text-sm">Nenhum medicamento encontrado</p>
              <p className="text-xs">Adicione medicamentos ao seu estoque</p>
            </div>
          ) : (
            <div className={`${expanded ? "flex-1 flex flex-col min-h-0" : ""}`}>
              {/* Select all header - outside scrollable container */}
              <div className="flex items-center gap-2 px-2 py-1.5 bg-muted/50 rounded-lg mb-2">
                <Checkbox
                  id="select-all"
                  checked={isAllSelected}
                  onCheckedChange={(checked) => handleSelectAll(checked === true)}
                />
                <label htmlFor="select-all" className="text-xs font-medium cursor-pointer">
                  Selecionar todos ({displayedMedicines.length})
                </label>
              </div>

              <div ref={scrollContainerRef} className={`grid grid-cols-1 lg:grid-cols-2 gap-2 pr-2 auto-rows-min ${expanded ? "flex-1 overflow-y-auto" : "max-h-[450px] overflow-y-auto"}`}>
              {displayedMedicines.map((medicine) => (
                <div 
                  key={medicine.id} 
                  className={`p-2.5 sm:p-3 bg-card border rounded-lg hover:shadow-md transition-all duration-200 hover:border-primary/50 h-fit ${selectedIds.has(medicine.id) ? 'border-primary bg-primary/5' : ''}`}
                >
                  <div className="flex items-start gap-2">
                    <Checkbox
                      id={`select-${medicine.id}`}
                      checked={selectedIds.has(medicine.id)}
                      onCheckedChange={(checked) => handleSelectOne(medicine.id, checked === true)}
                      className="mt-0.5"
                    />
                    <div className="flex-1 min-w-0 flex flex-col sm:flex-row items-start gap-2">
                      <div className="flex-1 min-w-0 w-full">
                        <div className="flex items-start justify-between gap-2 mb-1.5">
                          <label 
                            htmlFor={`select-${medicine.id}`}
                            className="font-semibold text-foreground text-xs sm:text-sm truncate cursor-pointer"
                          >
                            {medicine.nome}
                          </label>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setEditingMedicine(medicine);
                              setIsModalOpen(true);
                            }}
                            className="h-7 w-7 sm:hidden flex-shrink-0"
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                        </div>
                        <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                          <span className="px-1.5 py-0.5 bg-muted rounded text-xs font-medium">
                            {medicine.categoria}
                          </span>
                          <span className="font-semibold text-foreground">
                            {medicine.preco.toFixed(2)} MT
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
                        <Badge 
                          variant={medicine.disponivel ? "default" : "destructive"}
                          className={`text-xs px-1.5 py-0 ${medicine.disponivel ? "bg-secondary" : ""}`}
                        >
                          {medicine.disponivel ? 'Disponível' : 'Indisponível'}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setEditingMedicine(medicine);
                            setIsModalOpen(true);
                          }}
                          className="h-7 w-7 hidden sm:flex"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              {/* Load more button */}
              {expanded && hasMore && (
                <div className="col-span-full flex flex-col items-center justify-center gap-2 py-4">
                  <span className="text-xs text-muted-foreground">
                    Mostrando {medicines.length} de {totalCount}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleLoadMore}
                    disabled={isLoadingMore}
                    className="gap-2"
                  >
                    <RefreshCw className={`h-4 w-4 ${isLoadingMore ? 'animate-spin' : ''}`} />
                    {isLoadingMore ? 'Carregando...' : 'Carregar mais 100'}
                  </Button>
                </div>
              )}
              
              {/* Show count when all loaded */}
              {expanded && !hasMore && medicines.length > 0 && (
                <div className="text-center py-2">
                  <span className="text-xs text-muted-foreground">
                    {medicines.length} medicamento(s) carregado(s)
                  </span>
                </div>
              )}
              </div>
            </div>
          )}
          </div>

          <Button
            variant="outline" 
            className="w-full h-11 gap-2 mt-4" 
            onClick={handleExportSelected}
            disabled={medicines.length === 0}
          >
            <Download size={18} />
            Exportar Relatório CSV
          </Button>
        </CardContent>
      </Card>

      <AddMedicineModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingMedicine(null);
        }}
        onSuccess={() => {
          fetchMedicines(true);
        }}
        editingMedicine={editingMedicine}
        farmaciaId={farmaciaId}
      />

      <ImportMedicinesModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onSuccess={() => {
          fetchMedicines(true);
        }}
        farmaciaId={farmaciaId}
      />

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="rounded-xl max-w-[90vw] sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base">Remover medicamentos</AlertDialogTitle>
            <AlertDialogDescription className="text-sm">
              Tem certeza que deseja remover {selectedIds.size} medicamento(s) do seu estoque? 
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="text-sm">Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteSelected}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 text-sm"
            >
              {isProcessing ? 'Removendo...' : 'Remover'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default StockControl;
