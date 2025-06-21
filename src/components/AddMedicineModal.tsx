import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

interface Medicine {
  id?: number;
  name: string;
  price: number;
  category: string;
  status: 'Disponível' | 'Indisponível';
  promotion?: {
    discount: number;
    validUntil: string;
  };
}

interface AddMedicineModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (medicine: Omit<Medicine, 'id' | 'lastUpdate'>) => void;
  editingMedicine?: Medicine | null;
  onUpdate?: (id: number, updates: Partial<Medicine>) => void;
}

const categories = [
  'Analgésico', 'Antibiótico', 'Gastroprotetor', 'Hormônio', 
  'Anti-inflamatório', 'Anti-hipertensivo', 'Antidiabético'
];

const AddMedicineModal = ({ 
  isOpen, 
  onClose, 
  onAdd, 
  editingMedicine = null, 
  onUpdate 
}: AddMedicineModalProps) => {
  const [formData, setFormData] = useState({
    name: '',
    price: 0,
    category: '',
    status: 'Disponível' as 'Disponível' | 'Indisponível',
    hasPromotion: false,
    discount: 0,
    validUntil: ''
  });

  useEffect(() => {
    if (editingMedicine) {
      setFormData({
        name: editingMedicine.name,
        price: editingMedicine.price,
        category: editingMedicine.category,
        status: editingMedicine.status,
        hasPromotion: !!editingMedicine.promotion,
        discount: editingMedicine.promotion?.discount || 0,
        validUntil: editingMedicine.promotion?.validUntil || ''
      });
    } else {
      setFormData({
        name: '',
        price: 0,
        category: '',
        status: 'Disponível',
        hasPromotion: false,
        discount: 0,
        validUntil: ''
      });
    }
  }, [editingMedicine, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name && formData.category) {
      const medicineData: any = {
        name: formData.name,
        price: formData.price,
        category: formData.category,
        status: formData.status
      };

      if (formData.hasPromotion && formData.discount > 0) {
        medicineData.promotion = {
          discount: formData.discount,
          validUntil: formData.validUntil
        };
      }

      if (editingMedicine && onUpdate) {
        onUpdate(editingMedicine.id!, medicineData);
      } else {
        onAdd(medicineData);
      }

      onClose();
    }
  };

  const handleClose = () => {
    onClose();
    setFormData({
      name: '',
      price: 0,
      category: '',
      status: 'Disponível',
      hasPromotion: false,
      discount: 0,
      validUntil: ''
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md mx-4">
        <DialogHeader>
          <DialogTitle>
            {editingMedicine ? 'Editar Medicamento' : 'Adicionar Medicamento'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome do Medicamento</Label>
            <Input
              id="name"
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              placeholder="Digite o nome do medicamento"
              required
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Categoria</Label>
              <Select value={formData.category} onValueChange={(value) => setFormData({...formData, category: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma categoria" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="price">Preço (MT)</Label>
              <Input
                id="price"
                type="number"
                min="0"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData({...formData, price: Number(e.target.value)})}
                placeholder="0.00"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select value={formData.status} onValueChange={(value: 'Disponível' | 'Indisponível') => setFormData({...formData, status: value})}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Disponível">Disponível</SelectItem>
                <SelectItem value="Indisponível">Indisponível</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Promotion Section */}
          <div className="border-t pt-4 space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="promotion">Criar Promoção</Label>
              <Switch 
                checked={formData.hasPromotion}
                onCheckedChange={(checked) => setFormData({...formData, hasPromotion: checked})}
              />
            </div>
            
            {formData.hasPromotion && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="discount">Desconto (%)</Label>
                  <Input
                    id="discount"
                    type="number"
                    min="1"
                    max="50"
                    value={formData.discount}
                    onChange={(e) => setFormData({...formData, discount: Number(e.target.value)})}
                    placeholder="10"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="validUntil">Válido até</Label>
                  <Input
                    id="validUntil"
                    type="date"
                    value={formData.validUntil}
                    onChange={(e) => setFormData({...formData, validUntil: e.target.value})}
                  />
                </div>
              </div>
            )}
          </div>
          
          <div className="flex space-x-3 pt-4">
            <Button type="button" variant="outline" onClick={handleClose} className="flex-1">
              Cancelar
            </Button>
            <Button type="submit" className="flex-1 bg-green-500 hover:bg-green-600">
              {editingMedicine ? 'Salvar' : 'Adicionar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddMedicineModal;
