import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar } from 'lucide-react';

const AgendaWidget = () => {
  const today = new Date();
  const dayName = today.toLocaleDateString('pt-BR', { weekday: 'long' });
  const formattedDate = today.toLocaleDateString('pt-BR', { 
    day: 'numeric',
    month: 'long',
    year: 'numeric' 
  });

  const events = [
    {
      time: '7:30 AM - 8:30 AM',
      title: 'Conferência de Estoque',
      color: 'bg-pink-100 border-l-4 border-pink-500',
      textColor: 'text-pink-900'
    },
    {
      time: '9:00 AM - 10:00 AM',
      title: 'Reunião com Fornecedor',
      color: 'bg-blue-100 border-l-4 border-blue-500',
      textColor: 'text-blue-900'
    },
    {
      time: '10:30 AM - 11:30 AM',
      title: 'Atualização de Preços',
      color: 'bg-purple-100 border-l-4 border-purple-500',
      textColor: 'text-purple-900'
    },
  ];

  return (
    <Card className="h-full">
      <div className="p-6">
        <h3 className="text-lg font-semibold mb-4">Minha Agenda</h3>

        <div className="mb-6">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <Calendar className="h-4 w-4" />
            <span className="uppercase">{dayName}</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold">+7</span>
            <span className="text-sm text-muted-foreground">
              {formattedDate.split(' de ').slice(1).join(' de ')}
            </span>
          </div>
        </div>

        <div className="space-y-3">
          {events.map((event, index) => (
            <div
              key={index}
              className={`p-3 rounded-lg ${event.color}`}
            >
              <p className={`text-sm font-semibold ${event.textColor} mb-1`}>
                {event.title}
              </p>
              <p className="text-xs text-muted-foreground">{event.time}</p>
            </div>
          ))}
        </div>

        <div className="mt-6 pt-4 border-t">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Próximo evento</span>
            <Badge variant="secondary" className="text-xs">
              Em 45min
            </Badge>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default AgendaWidget;
