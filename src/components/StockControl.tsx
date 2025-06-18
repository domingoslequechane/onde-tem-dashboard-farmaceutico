
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, Plus, Download } from 'lucide-react';
import AddMedicineModal from '@/components/AddMedicineModal';

interface Medicine {
  id: number;
  name: string;
  quantity: number;
  status: 'Disponível' | 'Pouco' | 'Esgotado';
  lastUpdate: string;
}

const StockControl = () => {
  const [medicines, setMedicines] = useState<Medicine[]>([
    { id: 1, name: 'Paracetamol', quantity: 42, status: 'Disponível', lastUpdate: '11:25' },
    { id: 2, name: 'Insulina', quantity: 5, status: 'Pouco', lastUpdate: '10:40' },
    { id: 3, name: 'Amoxicilina', quantity: 28, status: 'Disponível', lastUpdate: '09:15' },
    { id: 4, name: 'Omeprazol', quantity: 0, status: 'Esgotado', lastUpdate: '08:30' },
    { id: 5, name: 'Dipirona', quantity: 15, status: 'Disponível', lastUpdate: '07:45' },
  ]);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const filteredMedicines = medicines.filter(medicine =>
    medicine.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Disponível': return 'bg-green-100 text-green-800';
      case 'Pouco': return 'bg-yellow-100 text-yellow-800';
      case 'Esgotado': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleAddMedicine = (medicine: Omit<Medicine, 'id' | 'lastUpdate'>) => {
    const newMedicine = {
      ...medicine,
      id: medicines.length + 1,
      lastUpdate: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    };
    setMedicines([newMedicine, ...medicines]);
  };

  const handleExport = () => {
    const csvContent = [
      'Nome,Quantidade,Status,Última Atualização',
      ...medicines.map(m => `${m.name},${m.quantity},${m.status},${m.lastUpdate}`)
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', 'estoque_farmacia_central_1606.csv');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <Card className="h-fit">
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
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
          <Input
            placeholder="Buscar medicamento (ex: Paracetamol)"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="space-y-3 max-h-80 overflow-y-auto">
          {filteredMedicines.slice(0, 5).map((medicine) => (
            <div key={medicine.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 truncate">{medicine.name}</p>
                <p className="text-sm text-gray-500">Qtd: {medicine.quantity} | {medicine.lastUpdate}</p>
              </div>
              <Badge className={getStatusColor(medicine.status)}>
                {medicine.status}
              </Badge>
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

      <AddMedicineModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAdd={handleAddMedicine}
      />
    </Card>
  );
};

export default StockControl;
