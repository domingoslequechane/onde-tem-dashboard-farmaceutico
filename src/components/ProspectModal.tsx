import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Trash2, Save, Building2, History } from 'lucide-react';
import ProspectInteractionTimeline from './ProspectInteractionTimeline';
import ProspectInteractionForm from './ProspectInteractionForm';
import type { Prospect } from './AdminProspects';

interface ProspectModalProps {
  isOpen: boolean;
  onClose: () => void;
  prospect: Prospect | null;
  onSuccess: () => void;
}

const STATUS_OPTIONS = [
  { value: 'lead', label: 'Lead' },
  { value: 'contacto', label: 'Contacto' },
  { value: 'negociacao', label: 'Negociação' },
  { value: 'proposta', label: 'Proposta' },
  { value: 'fechado', label: 'Fechado' },
  { value: 'perdido', label: 'Perdido' },
];

const FONTE_OPTIONS = [
  { value: 'indicacao', label: 'Indicação' },
  { value: 'visita', label: 'Visita Presencial' },
  { value: 'google', label: 'Google/Pesquisa' },
  { value: 'redes_sociais', label: 'Redes Sociais' },
  { value: 'outro', label: 'Outro' },
];

const ProspectModal = ({ isOpen, onClose, prospect, onSuccess }: ProspectModalProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [showInteractionForm, setShowInteractionForm] = useState(false);
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    telefone: '',
    whatsapp: '',
    cidade: '',
    bairro: '',
    estado: '',
    status: 'lead' as Prospect['status'],
    fonte: '',
    responsavel: '',
    notas: '',
    valor_estimado: '',
    data_proximo_followup: '',
  });

  useEffect(() => {
    if (prospect) {
      setFormData({
        nome: prospect.nome || '',
        email: prospect.email || '',
        telefone: prospect.telefone || '',
        whatsapp: prospect.whatsapp || '',
        cidade: prospect.cidade || '',
        bairro: prospect.bairro || '',
        estado: prospect.estado || '',
        status: prospect.status || 'lead',
        fonte: prospect.fonte || '',
        responsavel: prospect.responsavel || '',
        notas: prospect.notas || '',
        valor_estimado: prospect.valor_estimado?.toString() || '',
        data_proximo_followup: prospect.data_proximo_followup?.split('T')[0] || '',
      });
    } else {
      setFormData({
        nome: '',
        email: '',
        telefone: '',
        whatsapp: '',
        cidade: '',
        bairro: '',
        estado: '',
        status: 'lead',
        fonte: '',
        responsavel: '',
        notas: '',
        valor_estimado: '',
        data_proximo_followup: '',
      });
    }
    setShowInteractionForm(false);
  }, [prospect, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const payload = {
        nome: formData.nome,
        email: formData.email || null,
        telefone: formData.telefone || null,
        whatsapp: formData.whatsapp || null,
        cidade: formData.cidade || null,
        bairro: formData.bairro || null,
        estado: formData.estado || null,
        status: formData.status,
        fonte: formData.fonte || null,
        responsavel: formData.responsavel || null,
        notas: formData.notas || null,
        valor_estimado: formData.valor_estimado ? parseFloat(formData.valor_estimado) : null,
        data_proximo_followup: formData.data_proximo_followup || null,
        atualizado_em: new Date().toISOString(),
      };

      if (prospect) {
        const { error } = await supabase
          .from('prospectos')
          .update(payload)
          .eq('id', prospect.id);

        if (error) throw error;
        toast({ title: 'Prospecto actualizado com sucesso!' });
      } else {
        const { error } = await supabase
          .from('prospectos')
          .insert({
            ...payload,
            criado_por: user?.id,
          });

        if (error) throw error;
        toast({ title: 'Prospecto criado com sucesso!' });
      }

      onSuccess();
    } catch (error: any) {
      toast({
        title: 'Erro ao guardar',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!prospect || !confirm('Tem certeza que deseja eliminar este prospecto?')) return;

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('prospectos')
        .delete()
        .eq('id', prospect.id);

      if (error) throw error;
      toast({ title: 'Prospecto eliminado com sucesso!' });
      onSuccess();
    } catch (error: any) {
      toast({
        title: 'Erro ao eliminar',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            {prospect ? prospect.nome : 'Novo Prospecto'}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="info" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="info" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Informações
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2" disabled={!prospect}>
              <History className="h-4 w-4" />
              Histórico
            </TabsTrigger>
          </TabsList>

          <TabsContent value="info" className="mt-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Nome */}
              <div className="space-y-2">
                <Label htmlFor="nome">Nome da Farmácia *</Label>
                <Input
                  id="nome"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  placeholder="Ex: Farmácia Popular"
                  required
                />
              </div>

              {/* Contact Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="email@farmacia.co.mz"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="telefone">Telefone</Label>
                  <Input
                    id="telefone"
                    value={formData.telefone}
                    onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                    placeholder="84 123 4567"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="whatsapp">WhatsApp</Label>
                  <Input
                    id="whatsapp"
                    value={formData.whatsapp}
                    onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                    placeholder="84 123 4567"
                  />
                </div>
              </div>

              {/* Location */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cidade">Cidade</Label>
                  <Input
                    id="cidade"
                    value={formData.cidade}
                    onChange={(e) => setFormData({ ...formData, cidade: e.target.value })}
                    placeholder="Maputo"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bairro">Bairro</Label>
                  <Input
                    id="bairro"
                    value={formData.bairro}
                    onChange={(e) => setFormData({ ...formData, bairro: e.target.value })}
                    placeholder="Polana"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="estado">Província</Label>
                  <Input
                    id="estado"
                    value={formData.estado}
                    onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                    placeholder="Maputo"
                  />
                </div>
              </div>

              {/* Status & Source */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => setFormData({ ...formData, status: value as Prospect['status'] })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Fonte</Label>
                  <Select
                    value={formData.fonte}
                    onValueChange={(value) => setFormData({ ...formData, fonte: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Como conheceu?" />
                    </SelectTrigger>
                    <SelectContent>
                      {FONTE_OPTIONS.map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Value & Followup */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="valor_estimado">Valor Estimado (MZN)</Label>
                  <Input
                    id="valor_estimado"
                    type="number"
                    value={formData.valor_estimado}
                    onChange={(e) => setFormData({ ...formData, valor_estimado: e.target.value })}
                    placeholder="1000"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="data_proximo_followup">Próximo Follow-up</Label>
                  <Input
                    id="data_proximo_followup"
                    type="date"
                    value={formData.data_proximo_followup}
                    onChange={(e) => setFormData({ ...formData, data_proximo_followup: e.target.value })}
                  />
                </div>
              </div>

              {/* Responsavel */}
              <div className="space-y-2">
                <Label htmlFor="responsavel">Responsável</Label>
                <Input
                  id="responsavel"
                  value={formData.responsavel}
                  onChange={(e) => setFormData({ ...formData, responsavel: e.target.value })}
                  placeholder="Nome do vendedor/responsável"
                />
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="notas">Notas</Label>
                <Textarea
                  id="notas"
                  value={formData.notas}
                  onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
                  placeholder="Observações sobre este prospecto..."
                  rows={3}
                />
              </div>

              {/* Actions */}
              <div className="flex justify-between gap-4 pt-4 border-t">
                {prospect && (
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={handleDelete}
                    disabled={isLoading}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Eliminar
                  </Button>
                )}
                <div className="flex gap-2 ml-auto">
                  <Button type="button" variant="outline" onClick={onClose}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={isLoading}>
                    <Save className="h-4 w-4 mr-2" />
                    {isLoading ? 'A guardar...' : 'Guardar'}
                  </Button>
                </div>
              </div>
            </form>
          </TabsContent>

          <TabsContent value="history" className="mt-4">
            {prospect && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-medium">Histórico de Interações</h3>
                  <Button
                    size="sm"
                    onClick={() => setShowInteractionForm(!showInteractionForm)}
                  >
                    {showInteractionForm ? 'Cancelar' : '+ Nova Interação'}
                  </Button>
                </div>

                {showInteractionForm && (
                  <ProspectInteractionForm
                    prospectId={prospect.id}
                    onSuccess={() => {
                      setShowInteractionForm(false);
                    }}
                    onCancel={() => setShowInteractionForm(false)}
                  />
                )}

                <ProspectInteractionTimeline prospectId={prospect.id} />
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default ProspectModal;
