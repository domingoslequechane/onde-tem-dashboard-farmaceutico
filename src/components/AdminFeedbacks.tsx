import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, Star, ThumbsUp, ThumbsDown, Trash2, RefreshCw, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';

interface Feedback {
  id: string;
  tipo: string;
  mensagem: string;
  medicamento_buscado: string | null;
  farmacia_nome: string | null;
  encontrou_medicamento: boolean | null;
  avaliacao: number | null;
  fonte: string | null;
  criado_em: string;
}

const AdminFeedbacks = () => {
  const { toast } = useToast();
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [filteredFeedbacks, setFilteredFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [tipoFilter, setTipoFilter] = useState<string>('todos');

  const fetchFeedbacks = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('feedbacks')
        .select('*')
        .order('criado_em', { ascending: false });

      if (error) throw error;
      setFeedbacks(data || []);
      setFilteredFeedbacks(data || []);
    } catch (error) {
      console.error('Error fetching feedbacks:', error);
      toast({
        title: 'Erro ao carregar feedbacks',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeedbacks();
  }, []);

  useEffect(() => {
    let filtered = feedbacks;

    // Filter by type
    if (tipoFilter !== 'todos') {
      filtered = filtered.filter(f => f.tipo === tipoFilter);
    }

    // Filter by search term
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(f =>
        f.mensagem.toLowerCase().includes(term) ||
        f.medicamento_buscado?.toLowerCase().includes(term) ||
        f.farmacia_nome?.toLowerCase().includes(term)
      );
    }

    setFilteredFeedbacks(filtered);
  }, [searchTerm, tipoFilter, feedbacks]);

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('feedbacks')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setFeedbacks(prev => prev.filter(f => f.id !== id));
      toast({
        title: 'Feedback removido',
      });
    } catch (error) {
      console.error('Error deleting feedback:', error);
      toast({
        title: 'Erro ao remover feedback',
        variant: 'destructive',
      });
    }
  };

  const getTipoLabel = (tipo: string) => {
    const labels: Record<string, { label: string; color: string }> = {
      sugestao: { label: '💡 Sugestão', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' },
      bug: { label: '🐛 Bug', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300' },
      elogio: { label: '⭐ Elogio', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' },
      busca: { label: '🔍 Busca', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300' },
      outro: { label: '📝 Outro', color: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300' },
    };
    return labels[tipo] || labels.outro;
  };

  const stats = {
    total: feedbacks.length,
    encontrou: feedbacks.filter(f => f.encontrou_medicamento === true).length,
    naoEncontrou: feedbacks.filter(f => f.encontrou_medicamento === false).length,
    mediaAvaliacao: feedbacks.filter(f => f.avaliacao).length > 0
      ? (feedbacks.filter(f => f.avaliacao).reduce((acc, f) => acc + (f.avaliacao || 0), 0) / feedbacks.filter(f => f.avaliacao).length).toFixed(1)
      : 'N/A',
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <MessageSquare className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
              <ThumbsUp className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Encontrou</p>
              <p className="text-2xl font-bold text-green-600">{stats.encontrou}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center">
              <ThumbsDown className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Não encontrou</p>
              <p className="text-2xl font-bold text-red-600">{stats.naoEncontrou}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-yellow-100 dark:bg-yellow-900 flex items-center justify-center">
              <Star className="h-5 w-5 text-yellow-600 fill-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Média</p>
              <p className="text-2xl font-bold">{stats.mediaAvaliacao}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar em feedbacks..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={tipoFilter} onValueChange={setTipoFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os tipos</SelectItem>
            <SelectItem value="sugestao">💡 Sugestão</SelectItem>
            <SelectItem value="bug">🐛 Bug</SelectItem>
            <SelectItem value="elogio">⭐ Elogio</SelectItem>
            <SelectItem value="busca">🔍 Busca</SelectItem>
            <SelectItem value="outro">📝 Outro</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" onClick={fetchFeedbacks} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      {/* Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">Data</TableHead>
                <TableHead className="w-[100px]">Tipo</TableHead>
                <TableHead>Mensagem</TableHead>
                <TableHead className="w-[150px]">Medicamento</TableHead>
                <TableHead className="w-[80px] text-center">Encontrou</TableHead>
                <TableHead className="w-[80px] text-center">Avaliação</TableHead>
                <TableHead className="w-[60px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <RefreshCw className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ) : filteredFeedbacks.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    Nenhum feedback encontrado
                  </TableCell>
                </TableRow>
              ) : (
                filteredFeedbacks.map((feedback) => {
                  const tipoInfo = getTipoLabel(feedback.tipo);
                  return (
                    <TableRow key={feedback.id}>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(feedback.criado_em), 'dd/MM/yy HH:mm', { locale: pt })}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={tipoInfo.color}>
                          {tipoInfo.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-[300px]">
                        <p className="truncate">{feedback.mensagem}</p>
                      </TableCell>
                      <TableCell className="text-sm">
                        {feedback.medicamento_buscado || '-'}
                      </TableCell>
                      <TableCell className="text-center">
                        {feedback.encontrou_medicamento === true && (
                          <ThumbsUp className="h-4 w-4 text-green-600 mx-auto" />
                        )}
                        {feedback.encontrou_medicamento === false && (
                          <ThumbsDown className="h-4 w-4 text-red-600 mx-auto" />
                        )}
                        {feedback.encontrou_medicamento === null && '-'}
                      </TableCell>
                      <TableCell className="text-center">
                        {feedback.avaliacao ? (
                          <div className="flex items-center justify-center gap-1">
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            <span className="text-sm font-medium">{feedback.avaliacao}</span>
                          </div>
                        ) : '-'}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(feedback.id)}
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
};

export default AdminFeedbacks;
