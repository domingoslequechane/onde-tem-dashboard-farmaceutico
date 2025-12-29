import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Phone, MessageCircle, Mail, MapPin, Users, StickyNote, Pencil, X, Check } from 'lucide-react';
import { toast } from 'sonner';

interface Interaction {
  id: string;
  prospecto_id: string;
  tipo: 'chamada' | 'whatsapp' | 'email' | 'visita' | 'reuniao' | 'nota';
  descricao: string;
  resultado?: 'positivo' | 'neutro' | 'negativo' | null;
  criado_em: string;
}

interface ProspectInteractionTimelineProps {
  prospectId: string;
  onInteractionUpdated?: () => void;
}

const TIPO_CONFIG = {
  chamada: { icon: Phone, label: 'Chamada', color: 'bg-blue-500' },
  whatsapp: { icon: MessageCircle, label: 'WhatsApp', color: 'bg-green-500' },
  email: { icon: Mail, label: 'Email', color: 'bg-purple-500' },
  visita: { icon: MapPin, label: 'Visita', color: 'bg-orange-500' },
  reuniao: { icon: Users, label: 'Reunião', color: 'bg-indigo-500' },
  nota: { icon: StickyNote, label: 'Nota', color: 'bg-gray-500' },
};

const RESULTADO_CONFIG = {
  positivo: { label: 'Positivo', icon: '✅', className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' },
  neutro: { label: 'Neutro', icon: '⚪', className: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200' },
  negativo: { label: 'Negativo', icon: '❌', className: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' },
};

const ProspectInteractionTimeline = ({ prospectId, onInteractionUpdated }: ProspectInteractionTimelineProps) => {
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{
    tipo: string;
    descricao: string;
    resultado: string;
  }>({ tipo: '', descricao: '', resultado: '' });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchInteractions();
  }, [prospectId]);

  const fetchInteractions = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('prospecto_interacoes')
        .select('*')
        .eq('prospecto_id', prospectId)
        .order('criado_em', { ascending: false });

      if (error) throw error;
      setInteractions((data || []) as Interaction[]);
    } catch (error) {
      console.error('Error fetching interactions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartEdit = (interaction: Interaction) => {
    setEditingId(interaction.id);
    setEditForm({
      tipo: interaction.tipo,
      descricao: interaction.descricao,
      resultado: interaction.resultado || '',
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditForm({ tipo: '', descricao: '', resultado: '' });
  };

  const handleSaveEdit = async (interactionId: string) => {
    if (!editForm.descricao.trim()) {
      toast.error('A descrição é obrigatória');
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('prospecto_interacoes')
        .update({
          tipo: editForm.tipo,
          descricao: editForm.descricao.trim(),
          resultado: editForm.resultado || null,
        })
        .eq('id', interactionId);

      if (error) throw error;

      toast.success('Interação atualizada com sucesso');
      setEditingId(null);
      setEditForm({ tipo: '', descricao: '', resultado: '' });
      fetchInteractions();
      onInteractionUpdated?.();
    } catch (error) {
      console.error('Error updating interaction:', error);
      toast.error('Erro ao atualizar interação');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="text-center text-muted-foreground py-8">
        Carregando histórico...
      </div>
    );
  }

  if (interactions.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-8 bg-muted/30 rounded-lg">
        <StickyNote className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p>Nenhuma interação registada</p>
        <p className="text-sm">Adicione a primeira interação para começar o histórico</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {interactions.map((interaction, index) => {
        const config = TIPO_CONFIG[interaction.tipo];
        const Icon = config.icon;
        const resultadoConfig = interaction.resultado ? RESULTADO_CONFIG[interaction.resultado] : null;
        const isEditing = editingId === interaction.id;

        return (
          <div key={interaction.id} className="relative">
            {/* Timeline connector */}
            {index < interactions.length - 1 && (
              <div className="absolute left-5 top-12 bottom-0 w-0.5 bg-border -mb-4" />
            )}

            <Card className="ml-0">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  {/* Icon */}
                  <div className={`${config.color} text-white p-2 rounded-full flex-shrink-0`}>
                    <Icon className="h-4 w-4" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    {isEditing ? (
                      <div className="space-y-3">
                        <div className="flex gap-2">
                          <Select
                            value={editForm.tipo}
                            onValueChange={(value) => setEditForm(prev => ({ ...prev, tipo: value }))}
                          >
                            <SelectTrigger className="w-[140px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="chamada">Chamada</SelectItem>
                              <SelectItem value="whatsapp">WhatsApp</SelectItem>
                              <SelectItem value="email">Email</SelectItem>
                              <SelectItem value="visita">Visita</SelectItem>
                              <SelectItem value="reuniao">Reunião</SelectItem>
                              <SelectItem value="nota">Nota</SelectItem>
                            </SelectContent>
                          </Select>

                          <Select
                            value={editForm.resultado}
                            onValueChange={(value) => setEditForm(prev => ({ ...prev, resultado: value }))}
                          >
                            <SelectTrigger className="w-[130px]">
                              <SelectValue placeholder="Resultado" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="positivo">✅ Positivo</SelectItem>
                              <SelectItem value="neutro">⚪ Neutro</SelectItem>
                              <SelectItem value="negativo">❌ Negativo</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <Textarea
                          value={editForm.descricao}
                          onChange={(e) => setEditForm(prev => ({ ...prev, descricao: e.target.value }))}
                          rows={3}
                          className="resize-none"
                        />

                        <div className="flex gap-2 justify-end">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleCancelEdit}
                            disabled={isSaving}
                          >
                            <X className="h-4 w-4 mr-1" />
                            Cancelar
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleSaveEdit(interaction.id)}
                            disabled={isSaving}
                          >
                            <Check className="h-4 w-4 mr-1" />
                            {isSaving ? 'Guardando...' : 'Guardar'}
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="font-medium text-sm">{config.label}</span>
                          <span className="text-xs text-muted-foreground">
                            {format(parseISO(interaction.criado_em), "d 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                          </span>
                          {resultadoConfig && (
                            <Badge variant="secondary" className={resultadoConfig.className}>
                              {resultadoConfig.icon} {resultadoConfig.label}
                            </Badge>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 ml-auto"
                            onClick={() => handleStartEdit(interaction)}
                            title="Editar interação"
                          >
                            <Pencil className="h-3 w-3" />
                          </Button>
                        </div>
                        <p className="text-sm text-foreground whitespace-pre-wrap">
                          {interaction.descricao}
                        </p>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );
      })}
    </div>
  );
};

export default ProspectInteractionTimeline;
