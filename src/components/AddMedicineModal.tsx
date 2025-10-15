import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface Medicine {
  id: string;
  nome: string;
  preco: number;
  categoria: string;
  quantidade: number;
  disponivel: boolean;
}

interface AddMedicineModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editingMedicine?: Medicine | null;
  farmaciaId: string;
}

const categories = [
  'Analgésico', 'Antibiótico', 'Gastroprotetor', 'Hormônio', 
  'Anti-inflamatório', 'Anti-hipertensivo', 'Antidiabético'
];

const AddMedicineModal = ({ 
  isOpen, 
  onClose, 
  onSuccess,
  editingMedicine = null,
  farmaciaId
}: AddMedicineModalProps) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nome: '',
    preco: 0,
    categoria: '',
    quantidade: 0,
    disponivel: true
  });

  useEffect(() => {
    if (editingMedicine) {
      setFormData({
        nome: editingMedicine.nome,
        preco: editingMedicine.preco,
        categoria: editingMedicine.categoria,
        quantidade: editingMedicine.quantidade,
        disponivel: editingMedicine.disponivel
      });
    } else {
      setFormData({
        nome: '',
        preco: 0,
        categoria: '',
        quantidade: 0,
        disponivel: true
      });
    }
  }, [editingMedicine, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nome || !formData.categoria) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      if (editingMedicine) {
        // Atualizar medicamento e estoque existente
        const { error: medError } = await supabase
          .from('medicamentos')
          .update({
            nome: formData.nome,
            categoria: formData.categoria
          })
          .eq('id', editingMedicine.id);

        if (medError) throw medError;

        const { error: stockError } = await supabase
          .from('estoque')
          .update({
            preco: formData.preco,
            quantidade: formData.quantidade,
            disponivel: formData.disponivel
          })
          .eq('medicamento_id', editingMedicine.id)
          .eq('farmacia_id', farmaciaId);

        if (stockError) throw stockError;

        toast({
          title: "Sucesso!",
          description: "Medicamento atualizado com sucesso"
        });
      } else {
        // Criar novo medicamento
        const { data: medData, error: medError } = await supabase
          .from('medicamentos')
          .insert({
            nome: formData.nome,
            categoria: formData.categoria
          })
          .select()
          .single();

        if (medError) throw medError;

        // Criar registro de estoque
        const { error: stockError } = await supabase
          .from('estoque')
          .insert({
            medicamento_id: medData.id,
            farmacia_id: farmaciaId,
            preco: formData.preco,
            quantidade: formData.quantidade,
            disponivel: formData.disponivel
          });

        if (stockError) throw stockError;

        toast({
          title: "Sucesso!",
          description: "Medicamento adicionado com sucesso"
        });
      }

      onSuccess();
      handleClose();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao salvar medicamento",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
      setFormData({
        nome: '',
        preco: 0,
        categoria: '',
        quantidade: 0,
        disponivel: true
      });
    }
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
            <Label htmlFor="nome">Nome do Medicamento</Label>
            <Input
              id="nome"
              type="text"
              value={formData.nome}
              onChange={(e) => setFormData({...formData, nome: e.target.value})}
              placeholder="Digite o nome do medicamento"
              required
              disabled={loading}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="categoria">Categoria</Label>
              <Select 
                value={formData.categoria} 
                onValueChange={(value) => setFormData({...formData, categoria: value})}
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="preco">Preço (MT)</Label>
              <Input
                id="preco"
                type="number"
                min="0"
                step="0.01"
                value={formData.preco}
                onChange={(e) => setFormData({...formData, preco: Number(e.target.value)})}
                placeholder="0.00"
                disabled={loading}
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quantidade">Quantidade</Label>
              <Input
                id="quantidade"
                type="number"
                min="0"
                value={formData.quantidade}
                onChange={(e) => setFormData({...formData, quantidade: Number(e.target.value)})}
                placeholder="0"
                disabled={loading}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="disponivel">Status</Label>
              <Select 
                value={formData.disponivel ? 'true' : 'false'} 
                onValueChange={(value) => setFormData({...formData, disponivel: value === 'true'})}
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Disponível</SelectItem>
                  <SelectItem value="false">Indisponível</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="flex space-x-3 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleClose} 
              className="flex-1"
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              className="flex-1 bg-green-500 hover:bg-green-600"
              disabled={loading}
            >
              {loading ? 'Salvando...' : editingMedicine ? 'Salvar' : 'Adicionar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddMedicineModal;
