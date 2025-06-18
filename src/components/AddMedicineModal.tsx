
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

interface Medicine {
  name: string;
  quantity: number;
  status: 'Disponível' | 'Pouco' | 'Esgotado';
}

interface AddMedicineModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (medicine: Medicine) => void;
}

const medicines = ['Paracetamol', 'Insulina', 'Amoxicilina', 'Omeprazol', 'Dipirona', 'Ibuprofeno', 'Aspirina'];

const AddMedicineModal = ({ isOpen, onClose, onAdd }: AddMedicineModalProps) => {
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState(0);
  const [status, setStatus] = useState<'Disponível' | 'Pouco' | 'Esgotado'>('Disponível');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name && quantity >= 0) {
      onAdd({ name, quantity, status });
      setName('');
      setQuantity(0);
      setStatus('Disponível');
      onClose();
    }
  };

  const getAutoStatus = (qty: number) => {
    if (qty === 0) return 'Esgotado';
    if (qty <= 10) return 'Pouco';
    return 'Disponível';
  };

  const handleQuantityChange = (value: number) => {
    setQuantity(value);
    setStatus(getAutoStatus(value));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Adicionar Medicamento</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome do Medicamento</Label>
            <Select value={name} onValueChange={setName}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um medicamento" />
              </SelectTrigger>
              <SelectContent>
                {medicines.map((med) => (
                  <SelectItem key={med} value={med}>{med}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="quantity">Quantidade</Label>
            <Input
              id="quantity"
              type="number"
              min="0"
              max="100"
              value={quantity}
              onChange={(e) => handleQuantityChange(Number(e.target.value))}
              placeholder="0"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select value={status} onValueChange={(value: 'Disponível' | 'Pouco' | 'Esgotado') => setStatus(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Disponível">Disponível</SelectItem>
                <SelectItem value="Pouco">Pouco</SelectItem>
                <SelectItem value="Esgotado">Esgotado</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex space-x-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancelar
            </Button>
            <Button type="submit" className="flex-1 bg-green-500 hover:bg-green-600">
              Adicionar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddMedicineModal;
