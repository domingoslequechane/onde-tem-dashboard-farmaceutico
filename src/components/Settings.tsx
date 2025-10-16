import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { CreditCard, Save } from 'lucide-react';

interface SettingsProps {
  farmacia?: any;
}

const Settings = ({ farmacia }: SettingsProps) => {
  const [isSaving, setIsSaving] = useState(false);
  const [pharmacyData, setPharmacyData] = useState({
    nome: '',
    telefone: '',
    whatsapp: '',
    endereco_completo: '',
    horario_funcionamento: '',
    ativa: true,
  });

  useEffect(() => {
    if (farmacia) {
      setPharmacyData({
        nome: farmacia.nome || '',
        telefone: farmacia.telefone || '',
        whatsapp: farmacia.whatsapp || '',
        endereco_completo: farmacia.endereco_completo || '',
        horario_funcionamento: farmacia.horario_funcionamento || '',
        ativa: farmacia.ativa ?? true,
      });
    }
  }, [farmacia]);

  const handleSave = async () => {
    if (!farmacia?.id) {
      toast({
        title: "Erro",
        description: "Farmácia não identificada.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('farmacias')
        .update(pharmacyData)
        .eq('id', farmacia.id);

      if (error) throw error;

      toast({
        title: "Configurações salvas",
        description: "Suas configurações foram atualizadas com sucesso.",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao salvar",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Informações da Farmácia */}
      <Card>
        <CardHeader>
          <CardTitle>Informações da Farmácia</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome da Farmácia</Label>
              <Input
                id="nome"
                value={pharmacyData.nome}
                onChange={(e) => setPharmacyData({ ...pharmacyData, nome: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="telefone">Telefone</Label>
              <Input
                id="telefone"
                value={pharmacyData.telefone}
                onChange={(e) => setPharmacyData({ ...pharmacyData, telefone: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="whatsapp">WhatsApp</Label>
              <Input
                id="whatsapp"
                value={pharmacyData.whatsapp}
                onChange={(e) => setPharmacyData({ ...pharmacyData, whatsapp: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="horario">Horário de Funcionamento</Label>
              <Input
                id="horario"
                value={pharmacyData.horario_funcionamento}
                onChange={(e) => setPharmacyData({ ...pharmacyData, horario_funcionamento: e.target.value })}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="endereco">Endereço Completo</Label>
            <Input
              id="endereco"
              value={pharmacyData.endereco_completo}
              onChange={(e) => setPharmacyData({ ...pharmacyData, endereco_completo: e.target.value })}
            />
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              id="ativa"
              checked={pharmacyData.ativa}
              onCheckedChange={(checked) => setPharmacyData({ ...pharmacyData, ativa: checked })}
            />
            <Label htmlFor="ativa">Farmácia Ativa</Label>
          </div>
        </CardContent>
      </Card>

      {/* Assinatura */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Assinatura</CardTitle>
            <Badge variant={farmacia?.plano === 'premium' ? 'default' : 'secondary'}>
              {farmacia?.plano || 'free'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Plano Atual</p>
              <p className="text-sm text-gray-500">
                {farmacia?.plano === 'premium' ? 'Premium' : 'Gratuito'}
              </p>
            </div>
            <CreditCard className="h-8 w-8 text-gray-400" />
          </div>
          
          <Separator />
          
          <div className="space-y-2">
            <p className="font-medium">Status da Assinatura</p>
            <Badge variant={farmacia?.status_assinatura === 'ativa' ? 'default' : 'destructive'}>
              {farmacia?.status_assinatura === 'ativa' ? 'Ativa' : 'Inativa'}
            </Badge>
          </div>

          {farmacia?.data_vencimento && (
            <div className="space-y-2">
              <p className="font-medium">Data de Vencimento</p>
              <p className="text-sm text-gray-600">
                {new Date(farmacia.data_vencimento).toLocaleDateString('pt-BR')}
              </p>
            </div>
          )}

          <Button className="w-full" variant="outline">
            Gerenciar Pagamento
          </Button>
        </CardContent>
      </Card>

      {/* Notificações */}
      <Card>
        <CardHeader>
          <CardTitle>Notificações</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="email-alerts">Alertas por Email</Label>
              <p className="text-sm text-gray-500">Receba notificações por email</p>
            </div>
            <Switch id="email-alerts" />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="sms-alerts">Alertas por SMS</Label>
              <p className="text-sm text-gray-500">Receba notificações por SMS</p>
            </div>
            <Switch id="sms-alerts" />
          </div>
        </CardContent>
      </Card>

      {/* Botão de Salvar */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isSaving} size="lg">
          <Save className="mr-2 h-4 w-4" />
          {isSaving ? 'Salvando...' : 'Salvar Configurações'}
        </Button>
      </div>
    </div>
  );
};

export default Settings;
