import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Phone, MessageCircle, Mail, MapPin, Users, StickyNote } from 'lucide-react';

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

const ProspectInteractionTimeline = ({ prospectId }: ProspectInteractionTimelineProps) => {
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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
                    </div>
                    <p className="text-sm text-foreground whitespace-pre-wrap">
                      {interaction.descricao}
                    </p>
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
