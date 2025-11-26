import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Star, ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Review {
  id: string;
  cliente_nome: string;
  avaliacao: number;
  comentario: string | null;
  criado_em: string;
}

interface ViewReviewsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  farmaciaId: string;
  farmaciaNome: string;
  refreshTrigger?: number;
}

const REVIEWS_PER_PAGE = 7;

export const ViewReviewsModal = ({
  open,
  onOpenChange,
  farmaciaId,
  farmaciaNome,
  refreshTrigger = 0,
}: ViewReviewsModalProps) => {
  const { toast } = useToast();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalReviews, setTotalReviews] = useState(0);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      // Get total count
      const { count } = await supabase
        .from('avaliacoes')
        .select('*', { count: 'exact', head: true })
        .eq('farmacia_id', farmaciaId);

      setTotalReviews(count || 0);

      // Get paginated reviews
      const { data, error } = await supabase
        .from('avaliacoes')
        .select('id, cliente_nome, avaliacao, comentario, criado_em')
        .eq('farmacia_id', farmaciaId)
        .order('criado_em', { ascending: false })
        .range((currentPage - 1) * REVIEWS_PER_PAGE, currentPage * REVIEWS_PER_PAGE - 1);

      if (error) throw error;
      setReviews(data || []);
    } catch (error) {
      console.error('Error fetching reviews:', error);
      toast({
        title: 'Erro ao carregar avaliações',
        description: 'Não foi possível carregar as avaliações',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchReviews();
    }
  }, [open, currentPage, farmaciaId, refreshTrigger]);

  const totalPages = Math.ceil(totalReviews / REVIEWS_PER_PAGE);

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'
            }`}
          />
        ))}
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Avaliações</DialogTitle>
          <DialogDescription>
            {farmaciaNome} • {totalReviews} avaliação{totalReviews !== 1 ? 'ões' : ''}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-3 pr-2">
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Carregando avaliações...
            </div>
          ) : reviews.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Ainda não há avaliações para esta farmácia
            </div>
          ) : (
            reviews.map((review) => (
              <Card key={review.id} className="p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <p className="font-semibold text-sm">{review.cliente_nome}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(review.criado_em), "d 'de' MMMM 'de' yyyy", {
                        locale: ptBR,
                      })}
                    </p>
                  </div>
                  {renderStars(review.avaliacao)}
                </div>
                {review.comentario && (
                  <p className="text-sm text-muted-foreground">{review.comentario}</p>
                )}
              </Card>
            ))
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-4 border-t">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1 || loading}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Anterior
            </Button>
            <span className="text-sm text-muted-foreground">
              Página {currentPage} de {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages || loading}
            >
              Próxima
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
