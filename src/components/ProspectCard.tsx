import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Phone, MapPin, Calendar, AlertCircle } from 'lucide-react';
import { format, isPast, isToday, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { Prospect } from './AdminProspects';

interface ProspectCardProps {
  prospect: Prospect;
  onDragStart: (e: React.DragEvent, prospect: Prospect) => void;
  onClick: (prospect: Prospect) => void;
}

const ProspectCard = ({ prospect, onDragStart, onClick }: ProspectCardProps) => {
  const followupDate = prospect.data_proximo_followup ? parseISO(prospect.data_proximo_followup) : null;
  const isOverdue = followupDate && isPast(followupDate) && !isToday(followupDate);
  const isFollowupToday = followupDate && isToday(followupDate);

  const getFollowupBadge = () => {
    if (!followupDate) return null;
    
    if (isOverdue) {
      return (
        <Badge variant="destructive" className="text-xs flex items-center gap-1">
          <AlertCircle className="h-3 w-3" />
          Atrasado
        </Badge>
      );
    }
    if (isFollowupToday) {
      return (
        <Badge className="bg-yellow-500 hover:bg-yellow-600 text-white text-xs">
          Hoje
        </Badge>
      );
    }
    return null;
  };

  const getSourceIcon = (fonte?: string) => {
    switch (fonte) {
      case 'indicacao': return '👥';
      case 'visita': return '🚶';
      case 'google': return '🔍';
      case 'redes_sociais': return '📱';
      default: return '📌';
    }
  };

  return (
    <Card
      draggable
      onDragStart={(e) => onDragStart(e, prospect)}
      onClick={() => onClick(prospect)}
      className={`cursor-pointer hover:shadow-md transition-all border-l-4 ${
        isOverdue
          ? 'border-l-red-500 bg-red-50/50 dark:bg-red-950/20'
          : isFollowupToday
          ? 'border-l-yellow-500 bg-yellow-50/50 dark:bg-yellow-950/20'
          : 'border-l-transparent hover:border-l-primary'
      }`}
    >
      <CardContent className="p-3 space-y-2">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-sm truncate">{prospect.nome}</h4>
            {prospect.cidade && (
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                <MapPin className="h-3 w-3" />
                {prospect.cidade}
                {prospect.bairro && `, ${prospect.bairro}`}
              </p>
            )}
          </div>
          <span className="text-sm" title={prospect.fonte}>
            {getSourceIcon(prospect.fonte)}
          </span>
        </div>

        {/* Contact Info */}
        {prospect.telefone && (
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <Phone className="h-3 w-3" />
            {prospect.telefone}
          </p>
        )}

        {/* Value */}
        {prospect.valor_estimado && prospect.valor_estimado > 0 && (
          <div className="text-xs font-medium text-green-600 dark:text-green-400">
            💰 {prospect.valor_estimado.toLocaleString('pt-MZ')} MZN
          </div>
        )}

        {/* Follow-up */}
        <div className="flex items-center justify-between gap-2">
          {followupDate && (
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {format(followupDate, "d MMM", { locale: ptBR })}
            </p>
          )}
          {getFollowupBadge()}
        </div>

        {/* Responsavel */}
        {prospect.responsavel && (
          <p className="text-xs text-muted-foreground truncate">
            👤 {prospect.responsavel}
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default ProspectCard;
