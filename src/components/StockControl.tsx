import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Plus, Download, RefreshCw, Edit, Package } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import AddMedicineModal from './AddMedicineModal';

interface Medicine {
  id: string;
  nome: string;
  preco: number;
  categoria: string;
  quantidade: number;
  disponivel: boolean;
}

interface StockControlProps {
  expanded?: boolean;
}

const StockControl = ({ expanded = false }: StockControlProps) => {
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMedicine, setEditingMedicine] = useState<Medicine | null>(null);
  const [farmaciaId, setFarmaciaId] = useState<string>('');

  const categories = ['Analgésico', 'Antibiótico', 'Gastroprotetor', 'Hormônio', 'Anti-inflamatório'];

  const fetchMedicines = async () => {
    setIsLoading(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;

      const { data: farmaciaData, error: farmaciaError } = await supabase
        .from('farmacias')
        .select('id')
        .eq('user_id', userData.user.id)
        .single();

      if (farmaciaError) throw farmaciaError;
      setFarmaciaId(farmaciaData.id);

      const { data, error } = await supabase
        .from('estoque')
        .select(`
          medicamento_id,
          quantidade,
          preco,
          disponivel,
          medicamentos (
            nome,
            categoria
          )
        `)
        .eq('farmacia_id', farmaciaData.id)
        .order('medicamentos(nome)');

      if (error) throw error;

      const formattedMedicines = data.map((item: any) => ({
        id: item.medicamento_id,
        nome: item.medicamentos.nome,
        preco: parseFloat(item.preco),
        categoria: item.medicamentos.categoria || 'Sem categoria',
        quantidade: item.quantidade,
        disponivel: item.disponivel,
      }));

      setMedicines(formattedMedicines);
      toast({
        title: "Dados carregados!",
        description: `${formattedMedicines.length} medicamentos encontrados.`,
      });
    } catch (error) {
      console.error('Erro ao buscar medicamentos:', error);
      toast({
        title: "Erro ao carregar dados",
        description: "Não foi possível carregar o estoque.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMedicines();
  }, []);

  const filteredMedicines = medicines.filter(medicine =>
    medicine.nome.toLowerCase().includes(searchTerm.toLowerCase()) &&
    (categoryFilter === 'all' || medicine.categoria === categoryFilter)
  );

  const handleExport = () => {
    const csvContent = [
      'Nome,Preço,Categoria,Quantidade,Disponível',
      ...medicines.map(m => 
        `${m.nome},${m.preco.toFixed(2)},${m.categoria},${m.quantidade},${m.disponivel ? 'Sim' : 'Não'}`
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
      description: "Arquivo CSV baixado com sucesso.",
    });
  };

  const displayedMedicines = expanded ? filteredMedicines : filteredMedicines.slice(0, 5);

  return (
    <>
      <Card className={`border-none shadow-lg ${expanded ? "" : "h-fit"}`}>
        <CardHeader className="pb-4 bg-gradient-to-br from-primary/5 to-secondary/5 border-b">
          <CardTitle className="flex items-center justify-between text-lg sm:text-xl">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-primary text-primary-foreground">
                <Package size={20} />
              </div>
              <span className="truncate">Gestão de Medicamentos</span>
            </div>
            <div className="flex gap-2">
              <Button 
                size="sm" 
                onClick={() => {
                  setEditingMedicine(null);
                  setIsModalOpen(true);
                }}
                className="bg-secondary hover:bg-secondary/90 flex-shrink-0 gap-1"
              >
                <Plus size={16} />
                <span className="hidden sm:inline">Novo</span>
              </Button>
              <Button 
                size="sm" 
                onClick={fetchMedicines} 
                variant="outline"
                className="flex-shrink-0 gap-1"
                disabled={isLoading}
              >
                <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
                <span className="hidden sm:inline">Atualizar</span>
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={18} />
              <Input
                placeholder="Buscar medicamento..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-11"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-48 h-11">
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas Categorias</SelectItem>
                {categories.map(category => (
                  <SelectItem key={category} value={category}>{category}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground">
              <RefreshCw className="animate-spin h-8 w-8 mx-auto mb-2" />
              Carregando medicamentos...
            </div>
          ) : displayedMedicines.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="font-medium">Nenhum medicamento encontrado</p>
              <p className="text-sm">Adicione medicamentos ao seu estoque</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
              {displayedMedicines.map((medicine) => (
                <div 
                  key={medicine.id} 
                  className="p-4 bg-card border rounded-lg hover:shadow-md transition-all duration-200 hover:border-primary/50"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <p className="font-semibold text-foreground truncate">{medicine.nome}</p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                        <span className="px-2 py-1 bg-muted rounded text-xs font-medium">
                          {medicine.categoria}
                        </span>
                        <span className="font-semibold text-foreground">
                          {medicine.preco.toFixed(2)} MT
                        </span>
                        <span>Qtd: <strong>{medicine.quantidade}</strong></span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Badge 
                        variant={medicine.disponivel && medicine.quantidade > 0 ? "default" : "destructive"}
                        className={medicine.disponivel && medicine.quantidade > 0 ? "bg-secondary" : ""}
                      >
                        {medicine.disponivel && medicine.quantidade > 0 ? 'Disponível' : 'Indisponível'}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setEditingMedicine(medicine);
                          setIsModalOpen(true);
                        }}
                        className="h-9 w-9"
                      >
                        <Edit size={16} />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <Button 
            variant="outline" 
            className="w-full h-11 gap-2" 
            onClick={handleExport}
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
          fetchMedicines();
        }}
        editingMedicine={editingMedicine}
        farmaciaId={farmaciaId}
      />
    </>
  );
};

export default StockControl;
