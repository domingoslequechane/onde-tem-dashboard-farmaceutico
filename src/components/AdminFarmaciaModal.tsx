import { useState, useEffect } from 'react';
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
    nome: '',
    email: '',
    plano: 'free',
    status_assinatura: 'ativa',
    ativa: true,
  });

  // Atualizar o formulário quando a farmácia em edição mudar
  useEffect(() => {
    if (farmacia) {
      setFormData({
        nome: farmacia.nome || '',
        email: farmacia.email || '',
        plano: farmacia.plano || 'free',
        status_assinatura: farmacia.status_assinatura || 'ativa',
        ativa: farmacia.ativa ?? true,
      });
    } else {
      // Reset do formulário para nova farmácia
      setFormData({
        nome: '',
        email: '',
        plano: 'free',
        status_assinatura: 'ativa',
        ativa: true,
      });
    }
  }, [farmacia]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email) {
      toast({
        title: "Email obrigatório",
        description: "Por favor, informe o email da farmácia.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      if (farmacia) {
        // Atualizar farmácia existente
        const updateData = {
          nome: formData.nome,
          email: formData.email,
          plano: formData.plano,
          status_assinatura: formData.status_assinatura,
          ativa: formData.ativa,
        };
        
        const { error } = await supabase
          .from('farmacias')
          .update(updateData)
          .eq('id', farmacia.id);

        if (error) throw error;

        toast({
          title: "Farmácia atualizada!",
          description: "As informações foram atualizadas com sucesso.",
        });
      } else {
        // Criar farmácia primeiro
        const { data: newPharmacy, error: farmaciaError } = await supabase
          .from('farmacias')
          .insert([{
            nome: formData.nome,
            email: formData.email,
            plano: formData.plano,
            status_assinatura: formData.status_assinatura,
            ativa: formData.ativa,
            account_status: 'pendente',
            // Valores padrão para campos obrigatórios
            cidade: 'A definir',
            estado: 'A definir',
            endereco_completo: 'A definir',
            latitude: 0,
            longitude: 0,
          }])
          .select()
          .single();

        if (farmaciaError) throw farmaciaError;

        // Enviar convite por email
        const { data: { session } } = await supabase.auth.getSession();
        
        const response = await supabase.functions.invoke('send-pharmacy-invite', {
          body: {
            email: formData.email,
            pharmacyName: formData.nome,
            pharmacyId: newPharmacy.id,
          },
          headers: {
            Authorization: `Bearer ${session?.access_token}`,
          },
        });

        if (response.error) {
          console.error('Erro ao enviar convite:', response.error);
          throw new Error('Erro ao enviar convite por email');
        }

        toast({
          title: "Farmácia criada!",
          description: `Convite enviado para ${formData.email}`,
          duration: 5000,
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
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">
            {farmacia ? 'Editar Farmácia' : 'Adicionar Nova Farmácia'}
          </DialogTitle>
          <DialogDescription>
            {farmacia ? 'Edite as informações básicas da farmácia' : 'Preencha as informações básicas. A farmácia receberá um convite por email.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-4">
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
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="farmacia@exemplo.com"
                required
                disabled={!!farmacia}
              />
              {!farmacia && (
                <p className="text-xs text-muted-foreground">
                  Um convite será enviado para este email
                </p>
              )}
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

            <div className="flex items-center space-x-2 pt-2">
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

          <div className="flex gap-3 justify-end pt-4 border-t">
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
