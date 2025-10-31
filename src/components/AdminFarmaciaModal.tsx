import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface AdminFarmaciaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  farmacia?: any;
}

const AdminFarmaciaModal = ({ isOpen, onClose, onSuccess, farmacia }: AdminFarmaciaModalProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    nome: farmacia?.nome || '',
    email: farmacia?.email || '',
    telefone: farmacia?.telefone || '',
    whatsapp: farmacia?.whatsapp || '',
    endereco_completo: farmacia?.endereco_completo || '',
    bairro: farmacia?.bairro || '',
    cidade: farmacia?.cidade || '',
    estado: farmacia?.estado || '',
    cep: farmacia?.cep || '',
    latitude: farmacia?.latitude || '',
    longitude: farmacia?.longitude || '',
    horario_funcionamento: farmacia?.horario_funcionamento || '',
    plano: farmacia?.plano || 'free',
    status_assinatura: farmacia?.status_assinatura || 'ativa',
    ativa: farmacia?.ativa ?? true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (farmacia) {
        // Atualizar farmácia existente
        const { error } = await supabase
          .from('farmacias')
          .update(formData)
          .eq('id', farmacia.id);

        if (error) throw error;

        toast({
          title: "Farmácia atualizada!",
          description: "As informações foram atualizadas com sucesso.",
        });
      } else {
        // Criar nova farmácia
        const { error } = await supabase
          .from('farmacias')
          .insert([formData]);

        if (error) throw error;

        toast({
          title: "Farmácia criada!",
          description: "A farmácia foi cadastrada com sucesso.",
        });
      }

      onSuccess();
      onClose();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Ocorreu um erro ao salvar a farmácia.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">
            {farmacia ? 'Editar Farmácia' : 'Adicionar Nova Farmácia'}
          </DialogTitle>
          <DialogDescription>
            Preencha as informações da farmácia abaixo
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome da Farmácia *</Label>
              <Input
                id="nome"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                placeholder="Ex: Farmácia Central"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="telefone">Telefone</Label>
              <Input
                id="telefone"
                value={formData.telefone}
                onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                placeholder="(+258) 84 000 0000"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="whatsapp">WhatsApp</Label>
              <Input
                id="whatsapp"
                value={formData.whatsapp}
                onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                placeholder="(+258) 84 000 0000"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cidade">Cidade *</Label>
              <Input
                id="cidade"
                value={formData.cidade}
                onChange={(e) => setFormData({ ...formData, cidade: e.target.value })}
                placeholder="Ex: Maputo"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bairro">Bairro</Label>
              <Input
                id="bairro"
                value={formData.bairro}
                onChange={(e) => setFormData({ ...formData, bairro: e.target.value })}
                placeholder="Ex: Sommerschield"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="estado">Província *</Label>
              <Input
                id="estado"
                value={formData.estado}
                onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                placeholder="Ex: Maputo"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cep">CEP</Label>
              <Input
                id="cep"
                value={formData.cep}
                onChange={(e) => setFormData({ ...formData, cep: e.target.value })}
                placeholder="Ex: 1100"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="horario">Horário de Funcionamento</Label>
              <Input
                id="horario"
                value={formData.horario_funcionamento}
                onChange={(e) => setFormData({ ...formData, horario_funcionamento: e.target.value })}
                placeholder="Ex: 08:00 - 20:00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="latitude">Latitude *</Label>
              <Input
                id="latitude"
                type="number"
                step="any"
                value={formData.latitude}
                onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                placeholder="Ex: -25.9692"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="longitude">Longitude *</Label>
              <Input
                id="longitude"
                type="number"
                step="any"
                value={formData.longitude}
                onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                placeholder="Ex: 32.5732"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="plano">Plano</Label>
              <Select value={formData.plano} onValueChange={(value) => setFormData({ ...formData, plano: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="free">Gratuito</SelectItem>
                  <SelectItem value="premium">Premium</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status_assinatura">Status Assinatura</Label>
              <Select value={formData.status_assinatura} onValueChange={(value) => setFormData({ ...formData, status_assinatura: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ativa">Ativa</SelectItem>
                  <SelectItem value="inativa">Inativa</SelectItem>
                  <SelectItem value="pendente">Pendente</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="endereco">Endereço Completo *</Label>
            <Input
              id="endereco"
              value={formData.endereco_completo}
              onChange={(e) => setFormData({ ...formData, endereco_completo: e.target.value })}
              placeholder="Rua, Número, Bairro"
              required
            />
          </div>

          <div className="flex items-center justify-between pt-4 border-t">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="ativa"
                checked={formData.ativa}
                onChange={(e) => setFormData({ ...formData, ativa: e.target.checked })}
                className="h-4 w-4"
              />
              <Label htmlFor="ativa" className="font-normal cursor-pointer">
                Farmácia Ativa
              </Label>
            </div>
          </div>

          <div className="flex gap-3 justify-end pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              Cancelar
            </Button>
            <Button type="submit" className="bg-primary hover:bg-primary/90" disabled={isLoading}>
              {isLoading ? 'Salvando...' : (farmacia ? 'Atualizar' : 'Criar Farmácia')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AdminFarmaciaModal;
