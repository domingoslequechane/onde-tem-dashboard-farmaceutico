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
import { CreditCard, Save, Building2 } from 'lucide-react';

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
    bairro: '',
    cidade: '',
    estado: '',
    cep: '',
    ponto_referencia: '',
    horario_abertura: '',
    horario_fechamento: '',
    ativa: true,
  });

  useEffect(() => {
    if (farmacia) {
      setPharmacyData({
        nome: farmacia.nome || '',
        telefone: farmacia.telefone || '',
        whatsapp: farmacia.whatsapp || '',
        endereco_completo: farmacia.endereco_completo || '',
        bairro: farmacia.bairro || '',
        cidade: farmacia.cidade || '',
        estado: farmacia.estado || '',
        cep: farmacia.cep || '',
        ponto_referencia: farmacia.ponto_referencia || '',
        horario_abertura: farmacia.horario_abertura || '',
        horario_fechamento: farmacia.horario_fechamento || '',
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
    <div className="space-y-4 sm:space-y-6 w-full">
      {/* Informações da Farmácia */}
      <Card className="border-none shadow-lg">
        <CardHeader className="bg-gradient-to-br from-primary/5 to-secondary/5 border-b px-4 sm:px-6 py-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-1.5 sm:p-2 rounded-lg bg-primary text-primary-foreground">
              <Building2 className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
            <div>
              <CardTitle className="text-base sm:text-lg">Informações da Farmácia</CardTitle>
              <CardDescription className="text-xs sm:text-sm">Gerencie os dados da sua farmácia</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 sm:space-y-6 p-4 sm:p-6">
          <div className="grid grid-cols-1 gap-3 sm:gap-4">
            <div className="space-y-1.5 sm:space-y-2">
              <Label htmlFor="nome" className="text-xs sm:text-sm font-medium">Nome da Farmácia</Label>
              <Input
                id="nome"
                value={pharmacyData.nome}
                onChange={(e) => setPharmacyData({ ...pharmacyData, nome: e.target.value })}
                className="h-9 sm:h-10 text-sm"
                placeholder="Ex: Farmácia Central"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-1.5 sm:space-y-2">
                <Label htmlFor="telefone" className="text-xs sm:text-sm font-medium">Telefone</Label>
                <Input
                  id="telefone"
                  value={pharmacyData.telefone}
                  onChange={(e) => setPharmacyData({ ...pharmacyData, telefone: e.target.value })}
                  className="h-9 sm:h-10 text-sm"
                  placeholder="(+258) 84 000 0000"
                />
              </div>
              <div className="space-y-1.5 sm:space-y-2">
                <Label htmlFor="whatsapp" className="text-xs sm:text-sm font-medium">WhatsApp</Label>
                <Input
                  id="whatsapp"
                  value={pharmacyData.whatsapp}
                  onChange={(e) => setPharmacyData({ ...pharmacyData, whatsapp: e.target.value })}
                  className="h-9 sm:h-10 text-sm"
                  placeholder="(+258) 84 000 0000"
                />
              </div>
            </div>

            <div className="space-y-1.5 sm:space-y-2">
              <Label className="text-xs sm:text-sm font-medium">Horário de Funcionamento</Label>
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="horario_abertura" className="text-[10px] sm:text-xs text-muted-foreground">Abertura</Label>
                  <Input
                    id="horario_abertura"
                    type="time"
                    value={pharmacyData.horario_abertura}
                    onChange={(e) => setPharmacyData({ ...pharmacyData, horario_abertura: e.target.value })}
                    className="h-9 sm:h-10 text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="horario_fechamento" className="text-[10px] sm:text-xs text-muted-foreground">Fechamento</Label>
                  <Input
                    id="horario_fechamento"
                    type="time"
                    value={pharmacyData.horario_fechamento}
                    onChange={(e) => setPharmacyData({ ...pharmacyData, horario_fechamento: e.target.value })}
                    className="h-9 sm:h-10 text-sm"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1.5 sm:space-y-2">
              <Label htmlFor="endereco" className="text-xs sm:text-sm font-medium">Endereço Completo</Label>
              <Input
                id="endereco"
                value={pharmacyData.endereco_completo}
                onChange={(e) => setPharmacyData({ ...pharmacyData, endereco_completo: e.target.value })}
                className="h-9 sm:h-10 text-sm"
                placeholder="Rua e número"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-1.5 sm:space-y-2">
                <Label htmlFor="bairro" className="text-xs sm:text-sm font-medium">Bairro</Label>
                <Input
                  id="bairro"
                  value={pharmacyData.bairro}
                  onChange={(e) => setPharmacyData({ ...pharmacyData, bairro: e.target.value })}
                  className="h-9 sm:h-10 text-sm"
                  placeholder="Nome do bairro"
                />
              </div>
              <div className="space-y-1.5 sm:space-y-2">
                <Label htmlFor="cidade" className="text-xs sm:text-sm font-medium">Cidade</Label>
                <Input
                  id="cidade"
                  value={pharmacyData.cidade}
                  onChange={(e) => setPharmacyData({ ...pharmacyData, cidade: e.target.value })}
                  className="h-9 sm:h-10 text-sm"
                  placeholder="Nome da cidade"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-1.5 sm:space-y-2">
                <Label htmlFor="estado" className="text-xs sm:text-sm font-medium">Província</Label>
                <Input
                  id="estado"
                  value={pharmacyData.estado}
                  onChange={(e) => setPharmacyData({ ...pharmacyData, estado: e.target.value })}
                  className="h-9 sm:h-10 text-sm"
                  placeholder="Nome da província"
                />
              </div>
              <div className="space-y-1.5 sm:space-y-2">
                <Label htmlFor="cep" className="text-xs sm:text-sm font-medium">CEP / Código Postal</Label>
                <Input
                  id="cep"
                  value={pharmacyData.cep}
                  onChange={(e) => setPharmacyData({ ...pharmacyData, cep: e.target.value })}
                  className="h-9 sm:h-10 text-sm"
                  placeholder="Código postal"
                />
              </div>
            </div>

            <div className="space-y-1.5 sm:space-y-2">
              <Label htmlFor="ponto_referencia" className="text-xs sm:text-sm font-medium">Ponto de Referência</Label>
              <Input
                id="ponto_referencia"
                value={pharmacyData.ponto_referencia}
                onChange={(e) => setPharmacyData({ ...pharmacyData, ponto_referencia: e.target.value })}
                className="h-9 sm:h-10 text-sm"
                placeholder="Ex: Próximo ao mercado central"
              />
            </div>
          </div>
          <div className="flex items-center justify-between p-3 sm:p-4 bg-muted rounded-lg">
            <div className="space-y-0.5">
              <Label htmlFor="ativa" className="text-xs sm:text-sm font-medium">Status da Farmácia</Label>
              <p className="text-[10px] sm:text-xs text-muted-foreground">
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
        <CardHeader className="bg-gradient-to-br from-primary/5 to-secondary/5 border-b px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 rounded-lg bg-primary text-primary-foreground">
                <CreditCard className="h-4 w-4 sm:h-5 sm:w-5" />
              </div>
              <div>
                <CardTitle className="text-base sm:text-lg">Assinatura</CardTitle>
                <CardDescription className="text-xs sm:text-sm">Gerencie seu plano e pagamentos</CardDescription>
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
        <CardContent className="space-y-4 sm:space-y-6 p-4 sm:p-6">
          <div className="flex items-center justify-between p-3 sm:p-4 bg-muted rounded-lg">
            <div>
              <p className="font-medium text-foreground text-sm sm:text-base">Plano Atual</p>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">
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
            <div className="space-y-1.5 sm:space-y-2">
              <Label className="text-xs sm:text-sm font-medium">Data de Vencimento</Label>
              <p className="text-xs sm:text-sm text-muted-foreground">
                {new Date(farmacia.data_vencimento).toLocaleDateString('pt-BR', {
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric'
                })}
              </p>
            </div>
          )}

          <Separator />

          <Button className="w-full h-10 sm:h-11 bg-secondary hover:bg-secondary/90 text-sm sm:text-base">
            Gerenciar Pagamento
          </Button>
        </CardContent>
      </Card>

      {/* Botão de Salvar */}
      <div className="flex justify-end pt-2 sm:pt-4">
        <Button 
          onClick={handleSave} 
          disabled={isSaving} 
          className="h-10 sm:h-11 px-6 sm:px-8 bg-primary hover:bg-primary/90 gap-2 text-sm w-full sm:w-auto"
        >
          <Save className="h-4 w-4" />
          {isSaving ? 'Salvando...' : 'Salvar Configurações'}
        </Button>
      </div>
    </div>
  );
};

export default Settings;
