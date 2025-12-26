import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Phone, MessageCircle, Mail, MapPin, Users, StickyNote, Save } from 'lucide-react';

interface ProspectInteractionFormProps {
  prospectId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

const TIPO_OPTIONS = [
  { value: 'chamada', label: 'Chamada', icon: Phone },
  { value: 'whatsapp', label: 'WhatsApp', icon: MessageCircle },
  { value: 'email', label: 'Email', icon: Mail },
  { value: 'visita', label: 'Visita', icon: MapPin },
  { value: 'reuniao', label: 'Reunião', icon: Users },
  { value: 'nota', label: 'Nota', icon: StickyNote },
];

const RESULTADO_OPTIONS = [
  { value: 'positivo', label: 'Positivo', icon: '✅' },
  { value: 'neutro', label: 'Neutro', icon: '⚪' },
  { value: 'negativo', label: 'Negativo', icon: '❌' },
];

const ProspectInteractionForm = ({ prospectId, onSuccess, onCancel }: ProspectInteractionFormProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [tipo, setTipo] = useState<string>('chamada');
  const [descricao, setDescricao] = useState('');
  const [resultado, setResultado] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!descricao.trim()) {
      toast({
        title: 'Descrição obrigatória',
        description: 'Por favor, descreva o que aconteceu nesta interação.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { error } = await supabase
        .from('prospecto_interacoes')
        .insert({
          prospecto_id: prospectId,
          tipo,
          descricao: descricao.trim(),
          resultado: resultado || null,
          criado_por: user?.id,
        });

      if (error) throw error;

      toast({ title: 'Interação registada com sucesso!' });
      onSuccess();
    } catch (error: any) {
      toast({
        title: 'Erro ao registar interação',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Nova Interação</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Tipo de Interação */}
          <div className="space-y-2">
            <Label>Tipo de Interação</Label>
            <div className="flex flex-wrap gap-2">
              {TIPO_OPTIONS.map(opt => {
                const Icon = opt.icon;
                const isSelected = tipo === opt.value;
                return (
                  <Button
                    key={opt.value}
                    type="button"
                    variant={isSelected ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setTipo(opt.value)}
                    className={isSelected ? '' : 'hover:bg-primary/10'}
                  >
                    <Icon className="h-4 w-4 mr-1" />
                    {opt.label}
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Descrição */}
          <div className="space-y-2">
            <Label htmlFor="descricao">Descrição *</Label>
            <Textarea
              id="descricao"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Descreva o que aconteceu nesta interação..."
              rows={4}
              required
            />
          </div>

          {/* Resultado */}
          <div className="space-y-2">
            <Label>Resultado</Label>
            <div className="flex gap-2">
              {RESULTADO_OPTIONS.map(opt => {
                const isSelected = resultado === opt.value;
                return (
                  <Button
                    key={opt.value}
                    type="button"
                    variant={isSelected ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setResultado(isSelected ? null : opt.value)}
                    className={
                      isSelected
                        ? opt.value === 'positivo'
                          ? 'bg-green-600 hover:bg-green-700'
                          : opt.value === 'negativo'
                          ? 'bg-red-600 hover:bg-red-700'
                          : ''
                        : ''
                    }
                  >
                    {opt.icon} {opt.label}
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              <Save className="h-4 w-4 mr-2" />
              {isLoading ? 'A guardar...' : 'Guardar Interação'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default ProspectInteractionForm;
