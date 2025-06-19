
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Search, Plus, Download, Edit, Trash } from 'lucide-react';
import AddMedicineModal from '@/components/AddMedicineModal';
import { toast } from '@/hooks/use-toast';

interface Medicine {
  id: number;
  name: string;
  price: number;
  category: string;
  status: 'Disponível' | 'Indisponível';
  lastUpdate: string;
  promotion?: {
    discount: number;
    validUntil: string;
  };
}

interface StockControlProps {
  expanded?: boolean;
}

const StockControl = ({ expanded = false }: StockControlProps) => {
  const [medicines, setMedicines] = useState<Medicine[]>([
    { 
      id: 1, 
      name: 'Paracetamol', 
      price: 15.50,
      category: 'Analgésico',
      status: 'Disponível', 
      lastUpdate: '11:25',
      promotion: { discount: 10, validUntil: '2024-07-30' }
    },
    { 
      id: 2, 
      name: 'Insulina', 
      price: 250.00,
      category: 'Hormônio',
      status: 'Disponível', 
      lastUpdate: '10:40' 
    },
    { 
      id: 3, 
      name: 'Amoxicilina', 
      price: 35.75,
      category: 'Antibiótico',
      status: 'Disponível', 
      lastUpdate: '09:15' 
    },
    { 
      id: 4, 
      name: 'Omeprazol', 
      price: 22.90,
      category: 'Gastroprotetor',
      status: 'Indisponível', 
      lastUpdate: '08:30' 
    },
    { 
      id: 5,
      name: 'Dipirona', 
      price: 12.30,
      category: 'Analgésico',
      status: 'Disponível', 
      lastUpdate: '07:45' 
    },
  ]);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMedicine, setEditingMedicine] = useState<Medicine | null>(null);
  const [statusConfirmDialog, setStatusConfirmDialog] = useState<{
    isOpen: boolean;
    medicine: Medicine | null;
  }>({ isOpen: false, medicine: null });

  const categories = ['Analgésico', 'Antibiótico', 'Gastroprotetor', 'Hormônio', 'Anti-inflamatório'];

  const filteredMedicines = medicines.filter(medicine =>
    medicine.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
    (categoryFilter === 'all' || medicine.category === categoryFilter)
  );

  const handleAddMedicine = (medicine: Omit<Medicine, 'id' | 'lastUpdate'>) => {
    const newMedicine = {
      ...medicine,
      id: medicines.length + 1,
      lastUpdate: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    };
    setMedicines([newMedicine, ...medicines]);
  };

  const handleUpdateMedicine = (id: number, updates: Partial<Medicine>) => {
    setMedicines(medicines.map(med => 
      med.id === id 
        ? { ...med, ...updates, lastUpdate: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) }
        : med
    ));
    toast({
      title: "Medicamento atualizado!",
      description: "As informações foram salvas com sucesso.",
    });
  };

  const handleDeleteMedicine = (id: number) => {
    setMedicines(medicines.filter(med => med.id !== id));
    toast({
      title: "Medicamento removido!",
      description: "O item foi removido do seu estoque.",
    });
  };

  const handleStatusChangeRequest = (medicine: Medicine) => {
    setStatusConfirmDialog({ isOpen: true, medicine });
  };

  const handleConfirmStatusChange = () => {
    if (!statusConfirmDialog.medicine) return;

    const medicine = statusConfirmDialog.medicine;
    const newStatus = medicine.status === 'Disponível' ? 'Indisponível' : 'Disponível';
    
    handleUpdateMedicine(medicine.id, { status: newStatus });
    
    toast({
      title: `Status alterado!`,
      description: `${medicine.name} agora está ${newStatus.toLowerCase()}.`,
    });

    setStatusConfirmDialog({ isOpen: false, medicine: null });
  };

  const handleTogglePromotion = (id: number) => {
    const medicine = medicines.find(med => med.id === id);
    if (!medicine) return;

    if (medicine.promotion) {
      // Remove promotion
      handleUpdateMedicine(id, { promotion: undefined });
      toast({
        title: "Promoção removida!",
        description: `${medicine.name} não está mais em promoção.`,
      });
    } else {
      // Add promotion
      const newPromotion = {
        discount: 15,
        validUntil: '2024-12-31'
      };
      handleUpdateMedicine(id, { promotion: newPromotion });
      toast({
        title: "Promoção criada!",
        description: `${medicine.name} agora tem 15% de desconto.`,
      });
    }
  };

  const handleEditMedicine = (medicine: Medicine) => {
    setEditingMedicine(medicine);
    setIsModalOpen(true);
  };

  const handleExport = () => {
    const csvContent = [
      'Nome,Preço,Categoria,Status,Última Atualização,Promoção',
      ...medicines.map(m => 
        `${m.name},${m.price.toFixed(2)},${m.category},${m.status},${m.lastUpdate},${m.promotion ? `${m.promotion.discount}% até ${m.promotion.validUntil}` : 'Não'}`
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
      <Card className={expanded ? "" : "h-fit"}>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Gestão de Medicamentos</span>
            <Button size="sm" onClick={() => setIsModalOpen(true)} className="bg-green-500 hover:bg-green-600">
              <Plus size={16} className="mr-1" />
              Adicionar
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex space-x-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <Input
                placeholder="Buscar medicamento (ex: Paracetamol)"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-40">
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

          <div className="space-y-3 max-h-80 overflow-y-auto">
            {displayedMedicines.map((medicine) => (
              <div 
                key={medicine.id} 
                className="p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => handleStatusChangeRequest(medicine)}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <p className="font-medium text-gray-900 truncate">{medicine.name}</p>
                      {medicine.promotion && (
                        <Badge className="bg-orange-100 text-orange-800 text-xs">
                          -{medicine.promotion.discount}%
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">
                      {medicine.category} | {medicine.price.toFixed(2)} MT | {medicine.lastUpdate}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge className={medicine.status === 'Disponível' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                      {medicine.status}
                    </Badge>
                  </div>
                </div>
                
                {expanded && (
                  <div className="flex items-center justify-between pt-2 border-t" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-gray-600">Promoção:</span>
                      <Switch 
                        checked={!!medicine.promotion}
                        onCheckedChange={() => handleTogglePromotion(medicine.id)}
                      />
                    </div>
                    <div className="flex space-x-1">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleEditMedicine(medicine)}
                      >
                        <Edit size={14} />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleDeleteMedicine(medicine.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash size={14} />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          <Button 
            variant="outline" 
            className="w-full" 
            onClick={handleExport}
          >
            <Download size={16} className="mr-2" />
            Exportar CSV
          </Button>
        </CardContent>
      </Card>

      <AddMedicineModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingMedicine(null);
        }}
        onAdd={handleAddMedicine}
        editingMedicine={editingMedicine}
        onUpdate={(id, updates) => {
          handleUpdateMedicine(id, updates);
          setEditingMedicine(null);
        }}
      />

      <AlertDialog open={statusConfirmDialog.isOpen} onOpenChange={(open) => !open && setStatusConfirmDialog({ isOpen: false, medicine: null })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Alterar Status do Medicamento</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja alterar o status de "{statusConfirmDialog.medicine?.name}" 
              de {statusConfirmDialog.medicine?.status} para{' '}
              {statusConfirmDialog.medicine?.status === 'Disponível' ? 'Indisponível' : 'Disponível'}?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmStatusChange}>
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default StockControl;
