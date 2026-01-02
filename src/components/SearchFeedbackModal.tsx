import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Star, Send, Loader2, ThumbsUp, ThumbsDown } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface SearchFeedbackModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  medicamento: string;
  farmacia: string;
}

export const SearchFeedbackModal = ({ 
  open, 
  onOpenChange, 
  medicamento, 
  farmacia 
}: SearchFeedbackModalProps) => {
  const { toast } = useToast();
  const [encontrou, setEncontrou] = useState<boolean | null>(null);
  const [avaliacao, setAvaliacao] = useState<number>(0);
  const [comentario, setComentario] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('feedbacks')
        .insert({
          tipo: 'busca',
          mensagem: comentario || `Feedback de busca: ${encontrou ? 'Encontrou' : 'Não encontrou'} o medicamento`,
          medicamento_buscado: medicamento,
          farmacia_nome: farmacia,
          encontrou_medicamento: encontrou,
          avaliacao: avaliacao > 0 ? avaliacao : null,
          fonte: 'pos-busca',
          user_agent: navigator.userAgent,
        });

      if (error) {
        console.log('Feedback storage note:', error.message);
      }

      toast({
        title: 'Obrigado pelo feedback!',
        description: 'A sua opinião ajuda-nos a melhorar.',
      });

      // Reset form
      setEncontrou(null);
      setAvaliacao(0);
      setComentario('');
      onOpenChange(false);
    } catch (error) {
      console.error('Error submitting feedback:', error);
      toast({
        title: 'Obrigado pelo feedback!',
        description: 'Agradecemos a sua contribuição.',
      });
      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setEncontrou(null);
    setAvaliacao(0);
    setComentario('');
    onOpenChange(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={handleClose}>
      <AlertDialogContent className="sm:max-w-md w-[calc(100%-2rem)] mx-auto rounded-lg">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-lg font-bold text-center text-foreground">
            Como foi a sua experiência?
          </AlertDialogTitle>
        </AlertDialogHeader>

        <div className="space-y-5 pt-2">
          {/* Medicamento buscado */}
          <div className="text-center bg-accent/50 rounded-lg p-3">
            <p className="text-sm text-muted-foreground">Você buscou:</p>
            <p className="font-semibold text-primary">{medicamento}</p>
            {farmacia && (
              <p className="text-sm text-muted-foreground mt-1">em {farmacia}</p>
            )}
          </div>

          {/* Pergunta principal */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-foreground block text-center">
              Encontrou o medicamento?
            </label>
            <div className="flex gap-3 justify-center">
              <Button
                variant={encontrou === true ? 'default' : 'outline'}
                onClick={() => setEncontrou(true)}
                className={`flex-1 max-w-[140px] h-12 ${encontrou === true ? 'bg-green-600 hover:bg-green-700' : ''}`}
              >
                <ThumbsUp className="h-5 w-5 mr-2" />
                Sim
              </Button>
              <Button
                variant={encontrou === false ? 'default' : 'outline'}
                onClick={() => setEncontrou(false)}
                className={`flex-1 max-w-[140px] h-12 ${encontrou === false ? 'bg-red-600 hover:bg-red-700' : ''}`}
              >
                <ThumbsDown className="h-5 w-5 mr-2" />
                Não
              </Button>
            </div>
          </div>

          {/* Avaliação com estrelas */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground block text-center">
              Avalie a experiência
            </label>
            <div className="flex justify-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setAvaliacao(star)}
                  className="p-1 transition-transform hover:scale-110"
                >
                  <Star
                    className={`h-8 w-8 transition-colors ${
                      star <= avaliacao
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-muted-foreground/30 hover:text-yellow-400/50'
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Comentário opcional */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Comentário (opcional)
            </label>
            <Textarea
              placeholder="Conte-nos mais sobre a sua experiência..."
              value={comentario}
              onChange={(e) => setComentario(e.target.value)}
              className="min-h-[80px] resize-none"
              maxLength={500}
            />
          </div>

          {/* Botões de ação */}
          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              onClick={handleClose}
              className="flex-1"
              disabled={isSubmitting}
            >
              Agora não
            </Button>
            <Button
              onClick={handleSubmit}
              className="flex-1 bg-primary hover:bg-primary/90"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Enviar
                </>
              )}
            </Button>
          </div>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
};
