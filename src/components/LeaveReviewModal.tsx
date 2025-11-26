import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Star } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface LeaveReviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  farmaciaId: string;
  farmaciaNome: string;
  onReviewSubmitted?: () => void;
}

export const LeaveReviewModal = ({
  open,
  onOpenChange,
  farmaciaId,
  farmaciaNome,
  onReviewSubmitted,
}: LeaveReviewModalProps) => {
  const { toast } = useToast();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [clienteNome, setClienteNome] = useState('');
  const [clienteEmail, setClienteEmail] = useState('');
  const [comentario, setComentario] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (rating === 0) {
      toast({
        title: 'Avaliação necessária',
        description: 'Por favor, selecione uma classificação em estrelas',
        variant: 'destructive',
      });
      return;
    }

    if (!clienteNome.trim()) {
      toast({
        title: 'Nome necessário',
        description: 'Por favor, informe seu nome',
        variant: 'destructive',
      });
      return;
    }

    setSubmitting(true);

    try {
      const { error } = await supabase.from('avaliacoes').insert({
        farmacia_id: farmaciaId,
        cliente_nome: clienteNome.trim(),
        cliente_email: clienteEmail.trim() || null,
        avaliacao: rating,
        comentario: comentario.trim() || null,
      });

      if (error) throw error;

      toast({
        title: 'Avaliação enviada',
        description: 'Obrigado pela sua avaliação!',
      });

      // Reset form
      setRating(0);
      setClienteNome('');
      setClienteEmail('');
      setComentario('');
      onOpenChange(false);
      onReviewSubmitted?.();
    } catch (error) {
      console.error('Error submitting review:', error);
      toast({
        title: 'Erro ao enviar avaliação',
        description: 'Não foi possível enviar sua avaliação. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Deixar Avaliação</DialogTitle>
          <DialogDescription>{farmaciaNome}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Star Rating */}
          <div className="space-y-2">
            <Label>Classificação *</Label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="transition-transform hover:scale-110"
                >
                  <Star
                    className={`h-8 w-8 ${
                      star <= (hoverRating || rating)
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-muted-foreground'
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Cliente Nome */}
          <div className="space-y-2">
            <Label htmlFor="clienteNome">Nome *</Label>
            <Input
              id="clienteNome"
              value={clienteNome}
              onChange={(e) => setClienteNome(e.target.value)}
              placeholder="Seu nome"
              required
            />
          </div>

          {/* Cliente Email */}
          <div className="space-y-2">
            <Label htmlFor="clienteEmail">Email (opcional)</Label>
            <Input
              id="clienteEmail"
              type="email"
              value={clienteEmail}
              onChange={(e) => setClienteEmail(e.target.value)}
              placeholder="seu@email.com"
            />
          </div>

          {/* Comentário */}
          <div className="space-y-2">
            <Label htmlFor="comentario">Comentário (opcional)</Label>
            <Textarea
              id="comentario"
              value={comentario}
              onChange={(e) => setComentario(e.target.value)}
              placeholder="Conte-nos sobre sua experiência..."
              rows={4}
            />
          </div>

          <div className="flex gap-2 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Enviando...' : 'Enviar Avaliação'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
