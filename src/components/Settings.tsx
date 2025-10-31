import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { CreditCard, Save, Building2, Bell } from 'lucide-react';

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
    <div className="space-y-6 max-w-4xl">
      {/* Informações da Farmácia */}
      <Card className="border-none shadow-lg">
        <CardHeader className="bg-gradient-to-br from-primary/5 to-secondary/5 border-b">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary text-primary-foreground">
              <Building2 size={20} />
            </div>
            <div>
              <CardTitle className="text-xl">Informações da Farmácia</CardTitle>
              <CardDescription>Gerencie os dados da sua farmácia</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6 p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nome" className="text-sm font-medium">Nome da Farmácia</Label>
              <Input
                id="nome"
                value={pharmacyData.nome}
                onChange={(e) => setPharmacyData({ ...pharmacyData, nome: e.target.value })}
                className="h-11"
                placeholder="Ex: Farmácia Central"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="telefone" className="text-sm font-medium">Telefone</Label>
              <Input
                id="telefone"
                value={pharmacyData.telefone}
                onChange={(e) => setPharmacyData({ ...pharmacyData, telefone: e.target.value })}
                className="h-11"
                placeholder="(+258) 84 000 0000"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="whatsapp" className="text-sm font-medium">WhatsApp</Label>
              <Input
                id="whatsapp"
                value={pharmacyData.whatsapp}
                onChange={(e) => setPharmacyData({ ...pharmacyData, whatsapp: e.target.value })}
                className="h-11"
                placeholder="(+258) 84 000 0000"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="horario" className="text-sm font-medium">Horário de Funcionamento</Label>
              <Input
                id="horario"
                value={pharmacyData.horario_funcionamento}
                onChange={(e) => setPharmacyData({ ...pharmacyData, horario_funcionamento: e.target.value })}
                className="h-11"
                placeholder="Ex: 08:00 - 20:00"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="endereco" className="text-sm font-medium">Endereço Completo</Label>
            <Input
              id="endereco"
              value={pharmacyData.endereco_completo}
              onChange={(e) => setPharmacyData({ ...pharmacyData, endereco_completo: e.target.value })}
              className="h-11"
              placeholder="Rua, Número, Bairro, Cidade"
            />
          </div>
          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
            <div className="space-y-0.5">
              <Label htmlFor="ativa" className="text-sm font-medium">Status da Farmácia</Label>
              <p className="text-xs text-muted-foreground">
                {pharmacyData.ativa ? 'Farmácia está ativa e visível' : 'Farmácia está inativa'}
              </p>
            </div>
            <Switch
              id="ativa"
              checked={pharmacyData.ativa}
              onCheckedChange={(checked) => setPharmacyData({ ...pharmacyData, ativa: checked })}
            />
          </div>
        </CardContent>
      </Card>

      {/* Assinatura */}
      <Card className="border-none shadow-lg">
        <CardHeader className="bg-gradient-to-br from-primary/5 to-secondary/5 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary text-primary-foreground">
                <CreditCard size={20} />
              </div>
              <div>
                <CardTitle className="text-xl">Assinatura</CardTitle>
                <CardDescription>Gerencie seu plano e pagamentos</CardDescription>
              </div>
            </div>
            <Badge 
              variant={farmacia?.plano === 'premium' ? 'default' : 'secondary'}
              className={farmacia?.plano === 'premium' ? 'bg-secondary' : ''}
            >
              {farmacia?.plano === 'premium' ? 'Premium' : 'Gratuito'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6 p-6">
          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
            <div>
              <p className="font-medium text-foreground">Plano Atual</p>
              <p className="text-sm text-muted-foreground mt-1">
                {farmacia?.plano === 'premium' ? 'Acesso a todos os recursos' : 'Recursos básicos'}
              </p>
            </div>
            <Badge 
              variant={farmacia?.status_assinatura === 'ativa' ? 'default' : 'destructive'}
              className={farmacia?.status_assinatura === 'ativa' ? 'bg-secondary' : ''}
            >
              {farmacia?.status_assinatura === 'ativa' ? 'Ativa' : 'Inativa'}
            </Badge>
          </div>

          {farmacia?.data_vencimento && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">Data de Vencimento</Label>
              <p className="text-sm text-muted-foreground">
                {new Date(farmacia.data_vencimento).toLocaleDateString('pt-BR', {
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric'
                })}
              </p>
            </div>
          )}

          <Separator />

          <Button className="w-full h-11 bg-secondary hover:bg-secondary/90" size="lg">
            Gerenciar Pagamento
          </Button>
        </CardContent>
      </Card>

      {/* Notificações */}
      <Card className="border-none shadow-lg">
        <CardHeader className="bg-gradient-to-br from-primary/5 to-secondary/5 border-b">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary text-primary-foreground">
              <Bell size={20} />
            </div>
            <div>
              <CardTitle className="text-xl">Notificações</CardTitle>
              <CardDescription>Configure suas preferências de notificações</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 p-6">
          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
            <div className="space-y-0.5">
              <Label htmlFor="email-alerts" className="text-sm font-medium">Alertas por Email</Label>
              <p className="text-xs text-muted-foreground">Receba notificações importantes por email</p>
            </div>
            <Switch id="email-alerts" />
          </div>
          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
            <div className="space-y-0.5">
              <Label htmlFor="sms-alerts" className="text-sm font-medium">Alertas por SMS</Label>
              <p className="text-xs text-muted-foreground">Receba notificações por mensagem de texto</p>
            </div>
            <Switch id="sms-alerts" />
          </div>
        </CardContent>
      </Card>

      {/* Botão de Salvar */}
      <div className="flex justify-end pt-4">
        <Button 
          onClick={handleSave} 
          disabled={isSaving} 
          size="lg" 
          className="h-12 px-8 bg-primary hover:bg-primary/90 gap-2"
        >
          <Save className="h-5 w-5" />
          {isSaving ? 'Salvando...' : 'Salvar Configurações'}
        </Button>
      </div>
    </div>
  );
};

export default Settings;
