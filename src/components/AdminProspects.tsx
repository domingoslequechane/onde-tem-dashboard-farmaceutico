import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Filter } from 'lucide-react';
import ProspectCard from './ProspectCard';
import ProspectModal from './ProspectModal';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export interface Prospect {
  id: string;
  nome: string;
  email?: string;
  telefone?: string;
  whatsapp?: string;
  cidade?: string;
  bairro?: string;
  estado?: string;
  status: 'lead' | 'contacto' | 'negociacao' | 'proposta' | 'fechado' | 'perdido';
  fonte?: string;
  responsavel?: string;
  notas?: string;
  valor_estimado?: number;
  data_proximo_followup?: string;
  criado_em?: string;
  atualizado_em?: string;
}

const KANBAN_COLUMNS = [
  { id: 'lead', label: 'Lead', icon: '📥', color: 'bg-slate-500' },
  { id: 'contacto', label: 'Contacto', icon: '📞', color: 'bg-blue-500' },
  { id: 'negociacao', label: 'Negociação', icon: '🤝', color: 'bg-yellow-500' },
  { id: 'proposta', label: 'Proposta', icon: '📋', color: 'bg-orange-500' },
  { id: 'fechado', label: 'Fechado', icon: '✅', color: 'bg-green-500' },
] as const;

const AdminProspects = () => {
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCity, setSelectedCity] = useState<string>('all');
  const [selectedProspect, setSelectedProspect] = useState<Prospect | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [draggedProspect, setDraggedProspect] = useState<Prospect | null>(null);
  const [showLost, setShowLost] = useState(false);

  useEffect(() => {
    fetchProspects();
  }, []);

  const fetchProspects = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('prospectos')
        .select('*')
        .order('criado_em', { ascending: false });

      if (error) throw error;
      setProspects((data || []) as Prospect[]);
    } catch (error: any) {
      toast({
        title: 'Erro ao carregar prospectos',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDragStart = (e: React.DragEvent, prospect: Prospect) => {
    setDraggedProspect(prospect);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e: React.DragEvent, newStatus: string) => {
    e.preventDefault();
    if (!draggedProspect || draggedProspect.status === newStatus) {
      setDraggedProspect(null);
      return;
    }

    try {
      const { error } = await supabase
        .from('prospectos')
        .update({ status: newStatus, atualizado_em: new Date().toISOString() })
        .eq('id', draggedProspect.id);

      if (error) throw error;

      setProspects(prev =>
        prev.map(p =>
          p.id === draggedProspect.id ? { ...p, status: newStatus as Prospect['status'] } : p
        )
      );

      toast({
        title: 'Status actualizado',
        description: `${draggedProspect.nome} movido para ${newStatus}`,
      });
    } catch (error: any) {
      toast({
        title: 'Erro ao actualizar status',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setDraggedProspect(null);
    }
  };

  const handleProspectClick = (prospect: Prospect) => {
    setSelectedProspect(prospect);
    setIsModalOpen(true);
  };

  const handleAddNew = () => {
    setSelectedProspect(null);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedProspect(null);
  };

  const handleSaveSuccess = () => {
    fetchProspects();
    handleModalClose();
  };

  // Get unique cities for filter
  const cities = [...new Set(prospects.map(p => p.cidade).filter(Boolean))];

  // Filter prospects
  const filteredProspects = prospects.filter(p => {
    const matchesSearch = p.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.telefone?.includes(searchTerm);
    const matchesCity = selectedCity === 'all' || p.cidade === selectedCity;
    const matchesLost = showLost || p.status !== 'perdido';
    return matchesSearch && matchesCity && matchesLost;
  });

  // Get prospects for a specific column
  const getColumnProspects = (status: string) =>
    filteredProspects.filter(p => p.status === status);

  if (isLoading) {
    return (
      <Card className="border-none shadow-lg">
        <CardContent className="p-6 text-center text-muted-foreground">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          Carregando prospectos...
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card className="border-none shadow-lg">
        <CardHeader className="bg-gradient-to-br from-primary/5 to-secondary/5 border-b py-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle className="text-xl flex items-center gap-2">
                🎯 Prospecção de Clientes
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {filteredProspects.length} prospectos • {getColumnProspects('fechado').length} convertidos
              </p>
            </div>
            <Button onClick={handleAddNew} className="w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" />
              Novo Prospecto
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={18} />
              <Input
                placeholder="Buscar por nome, email ou telefone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedCity} onValueChange={setSelectedCity}>
              <SelectTrigger className="w-full sm:w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filtrar por cidade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as cidades</SelectItem>
                {cities.map(city => (
                  <SelectItem key={city} value={city!}>{city}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant={showLost ? 'default' : 'outline'}
              onClick={() => setShowLost(!showLost)}
              className="whitespace-nowrap"
            >
              {showLost ? '❌ Ocultar Perdidos' : '👁️ Ver Perdidos'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 min-h-[600px]">
        {KANBAN_COLUMNS.map(column => {
          const columnProspects = getColumnProspects(column.id);
          return (
            <div
              key={column.id}
              className="flex flex-col"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, column.id)}
            >
              <div className={`${column.color} text-white rounded-t-lg px-3 py-2 flex items-center justify-between`}>
                <span className="font-medium flex items-center gap-2">
                  {column.icon} {column.label}
                </span>
                <Badge variant="secondary" className="bg-white/20 text-white">
                  {columnProspects.length}
                </Badge>
              </div>
              <div className="flex-1 bg-muted/30 rounded-b-lg p-2 space-y-2 min-h-[400px]">
                {columnProspects.map(prospect => (
                  <ProspectCard
                    key={prospect.id}
                    prospect={prospect}
                    onDragStart={handleDragStart}
                    onClick={handleProspectClick}
                  />
                ))}
                {columnProspects.length === 0 && (
                  <div className="text-center text-muted-foreground text-sm py-8">
                    Arraste prospectos para cá
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Lost Column (conditional) */}
        {showLost && (
          <div
            className="flex flex-col"
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, 'perdido')}
          >
            <div className="bg-red-500 text-white rounded-t-lg px-3 py-2 flex items-center justify-between">
              <span className="font-medium flex items-center gap-2">
                ❌ Perdido
              </span>
              <Badge variant="secondary" className="bg-white/20 text-white">
                {getColumnProspects('perdido').length}
              </Badge>
            </div>
            <div className="flex-1 bg-muted/30 rounded-b-lg p-2 space-y-2 min-h-[400px]">
              {getColumnProspects('perdido').map(prospect => (
                <ProspectCard
                  key={prospect.id}
                  prospect={prospect}
                  onDragStart={handleDragStart}
                  onClick={handleProspectClick}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      <ProspectModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        prospect={selectedProspect}
        onSuccess={handleSaveSuccess}
      />
    </div>
  );
};

export default AdminProspects;
