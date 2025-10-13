import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Plus, Download, RefreshCw } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

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

  const categories = ['Analgésico', 'Antibiótico', 'Gastroprotetor', 'Hormônio', 'Anti-inflamatório'];

  const fetchMedicines = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('estoque')
        .select(`
          id,
          quantidade,
          preco,
          disponivel,
          medicamentos (
            nome,
            categoria
          )
        `)
        .eq('disponivel', true)
        .order('medicamentos(nome)');

      if (error) throw error;

      const formattedMedicines = data.map((item: any) => ({
        id: item.id,
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
    <Card className={expanded ? "" : "h-fit"}>
      <CardHeader className="pb-3 md:pb-4">
        <CardTitle className="flex items-center justify-between text-base md:text-lg">
          <span className="truncate mr-2">Gestão de Medicamentos</span>
          <Button 
            size="sm" 
            onClick={fetchMedicines} 
            className="bg-green-500 hover:bg-green-600 flex-shrink-0"
            disabled={isLoading}
          >
            <RefreshCw size={14} className={`mr-1 ${isLoading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Atualizar</span>
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 md:space-y-4">
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <Input
              placeholder="Buscar medicamento"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 text-sm"
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              {categories.map(category => (
                <SelectItem key={category} value={category}>{category}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="text-center py-8 text-gray-500">
            Carregando medicamentos...
          </div>
        ) : displayedMedicines.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            Nenhum medicamento encontrado
          </div>
        ) : (
          <div className="space-y-2 md:space-y-3 max-h-80 overflow-y-auto">
            {displayedMedicines.map((medicine) => (
              <div 
                key={medicine.id} 
                className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0 mr-2">
                    <div className="flex items-center space-x-2 mb-1">
                      <p className="font-medium text-gray-900 truncate text-sm md:text-base">{medicine.nome}</p>
                    </div>
                    <div className="text-xs md:text-sm text-gray-500 space-y-1">
                      <p>{medicine.categoria}</p>
                      <p>{medicine.preco.toFixed(2)} MT | Qtd: {medicine.quantidade}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 flex-shrink-0">
                    <Badge className={`text-xs ${medicine.disponivel && medicine.quantidade > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {medicine.disponivel && medicine.quantidade > 0 ? 'Disponível' : 'Indisponível'}
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <Button 
          variant="outline" 
          className="w-full text-sm" 
          onClick={handleExport}
          disabled={medicines.length === 0}
        >
          <Download size={16} className="mr-2" />
          Exportar CSV
        </Button>
      </CardContent>
    </Card>
  );
};

export default StockControl;
