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
import { Copy, RefreshCw } from 'lucide-react';

interface AdminFarmaciaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  farmacia?: any;
}

const AdminFarmaciaModal = ({ isOpen, onClose, onSuccess, farmacia }: AdminFarmaciaModalProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState('');
  const [formData, setFormData] = useState({
    nome: farmacia?.nome || '',
    email: '', // Email não é armazenado na tabela farmacias, apenas usado na criação
    telefone: farmacia?.telefone || '',
    whatsapp: farmacia?.whatsapp || '',
    endereco_completo: farmacia?.endereco_completo || '',
    bairro: farmacia?.bairro || '',
    cidade: farmacia?.cidade || '',
    estado: farmacia?.estado || '',
    cep: farmacia?.cep || '',
    latitude: farmacia?.latitude?.toString() || '',
    longitude: farmacia?.longitude?.toString() || '',
    horario_abertura: farmacia?.horario_funcionamento?.split(' - ')[0] || '08:00',
    horario_fechamento: farmacia?.horario_funcionamento?.split(' - ')[1] || '20:00',
    plano: farmacia?.plano || 'free',
    status_assinatura: farmacia?.status_assinatura || 'ativa',
    ativa: farmacia?.ativa ?? true,
  });

  const generatePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%&*';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setGeneratedPassword(password);
    return password;
  };

  const copyPassword = () => {
    navigator.clipboard.writeText(generatedPassword);
    toast({
      title: "Senha copiada!",
      description: "A senha foi copiada para a área de transferência.",
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!farmacia && !formData.email) {
      toast({
        title: "Email obrigatório",
        description: "Por favor, informe o email da farmácia.",
        variant: "destructive",
      });
      return;
    }

    if (!farmacia && !generatedPassword) {
      toast({
        title: "Senha não gerada",
        description: "Por favor, gere uma senha antes de salvar.",
        variant: "destructive",
      });
      return;
    }

    // Validar coordenadas
    const lat = parseFloat(formData.latitude);
    const lng = parseFloat(formData.longitude);
    
    if (isNaN(lat) || lat < -90 || lat > 90) {
      toast({
        title: "Latitude inválida",
        description: "A latitude deve estar entre -90 e 90.",
        variant: "destructive",
      });
      return;
    }

    if (isNaN(lng) || lng < -180 || lng > 180) {
      toast({
        title: "Longitude inválida",
        description: "A longitude deve estar entre -180 e 180.",
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
          telefone: formData.telefone,
          whatsapp: formData.whatsapp,
          endereco_completo: formData.endereco_completo,
          bairro: formData.bairro,
          cidade: formData.cidade,
          estado: formData.estado,
          cep: formData.cep,
          latitude: parseFloat(formData.latitude),
          longitude: parseFloat(formData.longitude),
          horario_funcionamento: `${formData.horario_abertura} - ${formData.horario_fechamento}`,
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
        // Criar conta de usuário para a farmácia
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: formData.email,
          password: generatedPassword,
          options: {
            emailRedirectTo: `${window.location.origin}/farmacia/reset-password`,
            data: {
              email: formData.email
            }
          }
        });

        if (authError) throw authError;

        if (!authData.user) throw new Error('Erro ao criar usuário');

        // A role 'farmacia' é criada automaticamente pelo trigger handle_new_user_role
        
        // Criar farmácia vinculada ao usuário
        const farmaciaData = {
          nome: formData.nome,
          telefone: formData.telefone,
          whatsapp: formData.whatsapp,
          endereco_completo: formData.endereco_completo,
          bairro: formData.bairro,
          cidade: formData.cidade,
          estado: formData.estado,
          cep: formData.cep,
          latitude: parseFloat(formData.latitude),
          longitude: parseFloat(formData.longitude),
          horario_funcionamento: `${formData.horario_abertura} - ${formData.horario_fechamento}`,
          plano: formData.plano,
          status_assinatura: formData.status_assinatura,
          ativa: formData.ativa,
          user_id: authData.user.id
        };
        
        const { error: farmaciaError } = await supabase
          .from('farmacias')
          .insert([farmaciaData]);

        if (farmaciaError) throw farmaciaError;

        toast({
          title: "Farmácia criada!",
          description: `Conta criada com email: ${formData.email}. Senha: ${generatedPassword}`,
          duration: 10000,
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
              <Label htmlFor="email">Email {!farmacia && '*'}</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="farmacia@exemplo.com"
                required={!farmacia}
                disabled={!!farmacia}
              />
            </div>

            {!farmacia && (
              <div className="space-y-2">
                <Label htmlFor="senha">Senha Automática *</Label>
                <div className="flex gap-2">
                  <Input
                    id="senha"
                    type="text"
                    value={generatedPassword}
                    readOnly
                    placeholder="Clique para gerar"
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={generatePassword}
                    title="Gerar nova senha"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                  {generatedPassword && (
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={copyPassword}
                      title="Copiar senha"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            )}

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
              <Label htmlFor="cep">NUIT</Label>
              <Input
                id="cep"
                value={formData.cep}
                onChange={(e) => setFormData({ ...formData, cep: e.target.value })}
                placeholder="Ex: 123456789"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="horario_abertura">Horário de Abertura</Label>
              <Input
                id="horario_abertura"
                type="time"
                value={formData.horario_abertura}
                onChange={(e) => setFormData({ ...formData, horario_abertura: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="horario_fechamento">Horário de Fechamento</Label>
              <Input
                id="horario_fechamento"
                type="time"
                value={formData.horario_fechamento}
                onChange={(e) => setFormData({ ...formData, horario_fechamento: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="latitude">Latitude * (-90 a 90)</Label>
              <Input
                id="latitude"
                type="number"
                step="0.0000001"
                min="-90"
                max="90"
                value={formData.latitude}
                onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                placeholder="Ex: -25.9692"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="longitude">Longitude * (-180 a 180)</Label>
              <Input
                id="longitude"
                type="number"
                step="0.0000001"
                min="-180"
                max="180"
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
