import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BarChart3, TrendingUp, CheckCircle, XCircle, Search, ArrowUpRight, ArrowDownRight, ChevronDown, ChevronUp, Sparkles, Loader2, History, ChevronLeft, ChevronRight, AlertTriangle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, LineChart, Line } from 'recharts';
import RegionDetailModal from '@/components/RegionDetailModal';
import MissingProductsCard, { MissingProduct } from '@/components/MissingProductsCard';
import DemandGapTable, { DemandGap } from '@/components/DemandGapTable';
import RegionalDemandList, { RegionalDemand } from '@/components/RegionalDemandList';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { pt } from 'date-fns/locale';
import { formatMarkdownToHtml } from '@/lib/formatMarkdown';

interface DemandAnalysisProps {
  expanded?: boolean;
}

interface AnalysisHistory {
  id: string;
  analise: string;
  criado_em: string;
}

interface MedicationDemand {
  name: string;
  found: number;
  notFound: number;
  searches: number;
  trend: number;
  category: string;
}

interface MonthlyData {
  month: string;
  indicacoes: number;
  buscas: number;
}

const DemandAnalysis = ({ expanded = false }: DemandAnalysisProps) => {
  const { toast } = useToast();
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showHorizontalChart, setShowHorizontalChart] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [analysisHistory, setAnalysisHistory] = useState<AnalysisHistory[]>([]);
  const [currentHistoryIndex, setCurrentHistoryIndex] = useState(0);
  const [showHistory, setShowHistory] = useState(false);
  const [farmaciaId, setFarmaciaId] = useState<string | null>(null);
  const [farmaciaLocation, setFarmaciaLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isAiContentExpanded, setIsAiContentExpanded] = useState(() => {
    const saved = localStorage.getItem('aiAnalysisExpanded');
    return saved !== null ? saved === 'true' : true;
  });
  
  const [demandData, setDemandData] = useState<MedicationDemand[]>([]);
  const [neighborhoods, setNeighborhoods] = useState<any[]>([]);
  const [monthlyComparison, setMonthlyComparison] = useState<MonthlyData[]>([]);
  const [missingProducts, setMissingProducts] = useState<MissingProduct[]>([]);
  const [demandGaps, setDemandGaps] = useState<DemandGap[]>([]);
  const [regionalDemand, setRegionalDemand] = useState<RegionalDemand[]>([]);
  const [pharmacyStock, setPharmacyStock] = useState<Set<string>>(new Set());
  const [totalStats, setTotalStats] = useState({ 
    totalSearches: 0, 
    found: 0, 
    notFound: 0,
    growthRate: 0,
    missedOpportunities: 0
  });

  useEffect(() => {
    fetchDemandData();
    if (expanded) {
      fetchFarmaciaAndHistory();
    }
  }, [expanded]);

  const fetchDemandData = async () => {
    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        setIsLoading(false);
        return;
      }

      // Buscar farmácia do usuário
      const { data: farmacia } = await supabase
        .from('farmacias')
        .select('id, bairro, cidade, latitude, longitude')
        .eq('user_id', session.user.id)
        .single();

      if (!farmacia) {
        setIsLoading(false);
        return;
      }

      setFarmaciaId(farmacia.id);
      if (farmacia.latitude && farmacia.longitude) {
        setFarmaciaLocation({ lat: Number(farmacia.latitude), lng: Number(farmacia.longitude) });
      }

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      // Buscar stock da farmácia (para identificar produtos que não temos)
      const { data: stockData } = await supabase
        .from('estoque')
        .select('medicamento_id, medicamentos(nome)')
        .eq('farmacia_id', farmacia.id)
        .eq('disponivel', true);

      const stockNames = new Set<string>();
      stockData?.forEach((item: any) => {
        if (item.medicamentos?.nome) {
          stockNames.add(item.medicamentos.nome.toLowerCase());
        }
      });
      setPharmacyStock(stockNames);

      // Buscar impressões da farmácia (novas tabelas de tracking)
      const { data: impressoes } = await supabase
        .from('impressoes_farmacia')
        .select('id, medicamento_buscado, criado_em, search_id, is_first_option, is_closest, rank_position')
        .eq('farmacia_id', farmacia.id)
        .gte('criado_em', thirtyDaysAgo.toISOString());

      // Buscar dados de product_selections para tracking mais preciso
      const { data: productSelections } = await supabase
        .from('product_selections')
        .select('id, product_name, search_id, criado_em')
        .gte('criado_em', thirtyDaysAgo.toISOString());

      // Buscar outcomes das buscas
      const { data: searchOutcomes } = await supabase
        .from('search_outcomes')
        .select('search_id, outcome_status, pharmacies_found_count')
        .gte('criado_em', thirtyDaysAgo.toISOString());

      // Buscar todas as buscas com localização (para demanda regional)
      const { data: searchesWithLocation } = await supabase
        .from('searches')
        .select('id, latitude, longitude, typed_text, submitted_text, criado_em')
        .gte('criado_em', thirtyDaysAgo.toISOString())
        .not('latitude', 'is', null)
        .not('longitude', 'is', null);

      // Criar mapa de outcomes por search_id
      const outcomesMap = new Map<string, string>();
      searchOutcomes?.forEach(o => outcomesMap.set(o.search_id, o.outcome_status));

      // Calcular estatísticas gerais
      const totalSearches = productSelections?.length || 0;
      const successCount = searchOutcomes?.filter(o => o.outcome_status === 'success').length || 0;
      const noPharmacyCount = searchOutcomes?.filter(o => o.outcome_status === 'no_pharmacy').length || 0;
      const noProductCount = searchOutcomes?.filter(o => o.outcome_status === 'no_product').length || 0;

      // Calcular taxa de crescimento comparando com mês anterior
      const sixtyDaysAgo = new Date();
      sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

      const { data: previousMonthImpressions } = await supabase
        .from('impressoes_farmacia')
        .select('id')
        .eq('farmacia_id', farmacia.id)
        .gte('criado_em', sixtyDaysAgo.toISOString())
        .lt('criado_em', thirtyDaysAgo.toISOString());

      const currentImpressions = impressoes?.length || 0;
      const previousImpressions = previousMonthImpressions?.length || 0;
      const growthRate = previousImpressions > 0 
        ? Math.round(((currentImpressions - previousImpressions) / previousImpressions) * 100)
        : currentImpressions > 0 ? 100 : 0;

      // Agrupar medicamentos mais buscados (usando product_selections + impressões)
      const medicamentoCounts: Record<string, { found: number; notFound: number; impressions: number }> = {};
      
      // Contar impressões da nossa farmácia
      impressoes?.forEach(imp => {
        const med = imp.medicamento_buscado.toLowerCase();
        if (!medicamentoCounts[med]) {
          medicamentoCounts[med] = { found: 0, notFound: 0, impressions: 0 };
        }
        medicamentoCounts[med].impressions++;
        // Se temos impressão, significa que o cliente encontrou na nossa farmácia
        medicamentoCounts[med].found++;
      });

      // Adicionar product_selections onde não temos impressão (oportunidades perdidas)
      productSelections?.forEach(ps => {
        const med = ps.product_name.toLowerCase();
        if (!medicamentoCounts[med]) {
          medicamentoCounts[med] = { found: 0, notFound: 0, impressions: 0 };
        }
        
        const hasOurImpression = impressoes?.some(
          imp => imp.search_id === ps.search_id && imp.medicamento_buscado.toLowerCase() === med
        );
        
        if (!hasOurImpression) {
          medicamentoCounts[med].notFound++;
        }
      });

      // Converter para array com tendências
      const demandArray: MedicationDemand[] = Object.entries(medicamentoCounts)
        .map(([name, counts]) => {
          const total = counts.found + counts.notFound;
          return {
            name: name.charAt(0).toUpperCase() + name.slice(1),
            found: counts.found,
            notFound: counts.notFound,
            searches: total,
            trend: Math.round((Math.random() - 0.3) * 20), // TODO: calcular tendência real
            category: 'Medicamento'
          };
        })
        .sort((a, b) => b.searches - a.searches)
        .slice(0, 15);

      setDemandData(demandArray);

      // Identificar produtos que não temos no stock mas são buscados (Oportunidades Perdidas)
      const missingProductsMap: Record<string, { count: number; inOtherPharmacies: number }> = {};
      
      productSelections?.forEach(ps => {
        const productNameLower = ps.product_name.toLowerCase();
        if (!stockNames.has(productNameLower)) {
          if (!missingProductsMap[ps.product_name]) {
            missingProductsMap[ps.product_name] = { count: 0, inOtherPharmacies: 0 };
          }
          missingProductsMap[ps.product_name].count++;
        }
      });

      // Contar quantas farmácias têm cada produto em falta
      const { data: allStock } = await supabase
        .from('estoque')
        .select('medicamentos(nome), farmacia_id')
        .eq('disponivel', true);

      const stockByProduct: Record<string, Set<string>> = {};
      allStock?.forEach((item: any) => {
        const name = item.medicamentos?.nome;
        if (name) {
          if (!stockByProduct[name]) stockByProduct[name] = new Set();
          stockByProduct[name].add(item.farmacia_id);
        }
      });

      Object.keys(missingProductsMap).forEach(productName => {
        const matchingStock = Object.entries(stockByProduct).find(
          ([name]) => name.toLowerCase() === productName.toLowerCase()
        );
        if (matchingStock) {
          missingProductsMap[productName].inOtherPharmacies = matchingStock[1].size;
        }
      });

      const missingProductsArray: MissingProduct[] = Object.entries(missingProductsMap)
        .map(([name, data]) => ({
          name,
          searchCount: data.count,
          inOtherPharmacies: data.inOtherPharmacies
        }))
        .sort((a, b) => b.searchCount - a.searchCount);

      setMissingProducts(missingProductsArray);

      // Calcular Gap Analysis (Procura vs Oferta)
      const gapAnalysis: DemandGap[] = Object.entries(medicamentoCounts)
        .map(([name, counts]) => {
          const totalDemand = counts.found + counts.notFound;
          const matchingStock = Object.entries(stockByProduct).find(
            ([stockName]) => stockName.toLowerCase() === name
          );
          const pharmaciesWithStock = matchingStock ? matchingStock[1].size : 0;
          const gapScore = pharmaciesWithStock > 0 ? totalDemand / pharmaciesWithStock : totalDemand * 2;
          
          return {
            medication: name.charAt(0).toUpperCase() + name.slice(1),
            totalDemand,
            pharmaciesWithStock,
            gapScore,
            inYourStock: stockNames.has(name)
          };
        })
        .filter(g => g.totalDemand > 0)
        .sort((a, b) => b.gapScore - a.gapScore)
        .slice(0, 15);

      setDemandGaps(gapAnalysis);

      // Calcular demanda regional (usando coordenadas das buscas)
      if (farmacia.latitude && farmacia.longitude) {
        const pharmacyLat = Number(farmacia.latitude);
        const pharmacyLng = Number(farmacia.longitude);

        const regionMap: Record<string, { 
          searches: number; 
          lat: number; 
          lng: number; 
          products: Record<string, number>;
        }> = {};

        searchesWithLocation?.forEach(search => {
          const searchLat = Number(search.latitude);
          const searchLng = Number(search.longitude);
          
          // Calcular distância
          const R = 6371;
          const dLat = (searchLat - pharmacyLat) * Math.PI / 180;
          const dLon = (searchLng - pharmacyLng) * Math.PI / 180;
          const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(pharmacyLat * Math.PI / 180) * Math.cos(searchLat * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
          const distance = R * c;

          // Agrupar por proximidade (~500m de raio)
          const regionKey = `${Math.round(searchLat * 100) / 100},${Math.round(searchLng * 100) / 100}`;
          
          if (!regionMap[regionKey]) {
            regionMap[regionKey] = {
              searches: 0,
              lat: searchLat,
              lng: searchLng,
              products: {}
            };
          }
          
          regionMap[regionKey].searches++;
          
          const productName = search.submitted_text || search.typed_text;
          if (productName) {
            regionMap[regionKey].products[productName] = (regionMap[regionKey].products[productName] || 0) + 1;
          }
        });

        const regionalArray: RegionalDemand[] = Object.entries(regionMap)
          .map(([key, data]) => {
            const distanceKm = Math.sqrt(
              Math.pow((data.lat - pharmacyLat) * 111, 2) + 
              Math.pow((data.lng - pharmacyLng) * 111 * Math.cos(pharmacyLat * Math.PI / 180), 2)
            );
            
            const topProducts = Object.entries(data.products)
              .sort((a, b) => b[1] - a[1])
              .slice(0, 3)
              .map(([name]) => name);

            return {
              regionName: `Zona ${key.split(',')[0].slice(-4)}`,
              latitude: data.lat,
              longitude: data.lng,
              totalSearches: data.searches,
              topProducts,
              distanceKm
            };
          })
          .sort((a, b) => b.totalSearches - a.totalSearches);

        setRegionalDemand(regionalArray);
      }

      // Atualizar estatísticas totais
      setTotalStats({
        totalSearches,
        found: successCount,
        notFound: noPharmacyCount + noProductCount,
        growthRate,
        missedOpportunities: missingProductsArray.reduce((sum, p) => sum + p.searchCount, 0)
      });

      // Buscar dados mensais para o gráfico de comparação (últimos 6 meses)
      const monthlyData: MonthlyData[] = [];
      for (let i = 5; i >= 0; i--) {
        const monthDate = subMonths(new Date(), i);
        const monthStart = startOfMonth(monthDate);
        const monthEnd = endOfMonth(monthDate);

        const { data: monthImpressions } = await supabase
          .from('impressoes_farmacia')
          .select('id')
          .eq('farmacia_id', farmacia.id)
          .gte('criado_em', monthStart.toISOString())
          .lte('criado_em', monthEnd.toISOString());

        const { data: monthSelections } = await supabase
          .from('product_selections')
          .select('id')
          .gte('criado_em', monthStart.toISOString())
          .lte('criado_em', monthEnd.toISOString());

        monthlyData.push({
          month: format(monthDate, 'MMM', { locale: pt }),
          indicacoes: monthImpressions?.length || 0,
          buscas: monthSelections?.length || 0
        });
      }

      setMonthlyComparison(monthlyData);

      // Dados regionais simplificados para compatibilidade
      const neighborhoodArray = regionalDemand.map(r => ({
        name: r.regionName,
        searches: r.totalSearches,
        level: r.totalSearches > 50 ? 'Alta' : r.totalSearches > 20 ? 'Média' : 'Baixa',
        color: r.totalSearches > 50 ? 'bg-red-500' : r.totalSearches > 20 ? 'bg-yellow-500' : 'bg-green-500'
      }));

      setNeighborhoods(neighborhoodArray);

    } catch (error) {
      console.error('Erro ao buscar dados de demanda:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegionClick = (region: any) => {
    setSelectedRegion(region.name || region.regionName);
    setIsModalOpen(true);
  };

  const getSelectedRegionData = () => {
    const region = neighborhoods.find(n => n.name === selectedRegion);
    return region?.detailData || { found: [], notFound: [] };
  };

  const fetchFarmaciaAndHistory = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      const { data: farmacia } = await supabase
        .from('farmacias')
        .select('id')
        .eq('user_id', session.user.id)
        .single();

      if (farmacia) {
        setFarmaciaId(farmacia.id);
        
        const { data: history } = await supabase
          .from('analises_ia')
          .select('id, analise, criado_em')
          .eq('farmacia_id', farmacia.id)
          .order('criado_em', { ascending: false });

        if (history && history.length > 0) {
          setAnalysisHistory(history);
          setAiAnalysis(history[0].analise);
          setShowAnalysis(true);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar histórico:', error);
    }
  };

  const saveAnalysisToHistory = async (analysis: string) => {
    if (!farmaciaId) return;

    try {
      const { data, error } = await supabase
        .from('analises_ia')
        .insert({
          farmacia_id: farmaciaId,
          analise: analysis,
          dados_contexto: { 
            demandData, 
            totalStats, 
            neighborhoods,
            missingProducts,
            demandGaps,
            regionalDemand
          } as any
        })
        .select('id, analise, criado_em')
        .single();

      if (error) throw error;

      if (data) {
        setAnalysisHistory(prev => [data, ...prev]);
        setCurrentHistoryIndex(0);
      }
    } catch (error) {
      console.error('Erro ao salvar análise:', error);
    }
  };

  const handleAnalyzeWithAI = async () => {
    setIsAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke('analyze-demand', {
        body: { 
          demandData, 
          totalStats, 
          neighborhoods,
          missingProducts,
          demandGaps,
          regionalDemand
        }
      });

      if (error) throw error;

      if (data?.error) {
        toast({
          title: "Erro",
          description: data.error,
          variant: "destructive",
        });
        return;
      }

      if (data?.analysis) {
        setAiAnalysis(data.analysis);
        setShowAnalysis(true);
        setCurrentHistoryIndex(0);
        setShowHistory(false);
        await saveAnalysisToHistory(data.analysis);
      }
    } catch (error) {
      console.error('Error analyzing with AI:', error);
      toast({
        title: "Erro",
        description: "Não foi possível realizar a análise com IA. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const toggleAiContentExpanded = () => {
    const newValue = !isAiContentExpanded;
    setIsAiContentExpanded(newValue);
    localStorage.setItem('aiAnalysisExpanded', String(newValue));
  };

  const successRate = totalStats.totalSearches > 0
    ? Math.round((totalStats.found / (totalStats.found + totalStats.notFound)) * 100) 
    : 0;

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = demandData.find(d => d.name === label);
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
          <p className="font-semibold text-gray-900">{label}</p>
          <p className="text-xs text-gray-500 mb-2">{data?.category}</p>
          <div className="space-y-1">
            <p className="text-sm flex items-center gap-1">
              <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block"></span>
              Encontrados: <span className="font-medium">{payload[0]?.value}</span>
            </p>
            <p className="text-sm flex items-center gap-1">
              <span className="w-3 h-3 rounded-full bg-red-500 inline-block"></span>
              Não encontrados: <span className="font-medium">{payload[1]?.value}</span>
            </p>
            <p className="text-sm text-gray-600 pt-1 border-t">
              Taxa de sucesso: <span className="font-bold text-emerald-600">{Math.round((payload[0]?.value / (payload[0]?.value + payload[1]?.value)) * 100)}%</span>
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  const HorizontalTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = demandData.find(d => d.name === label);
      const foundValue = payload.find((p: any) => p.dataKey === 'found')?.value || 0;
      const notFoundValue = payload.find((p: any) => p.dataKey === 'notFound')?.value || 0;
      const total = foundValue + notFoundValue;
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
          <p className="font-semibold text-gray-900">{label}</p>
          <p className="text-xs text-gray-500 mb-2">{data?.category}</p>
          <div className="space-y-1">
            <p className="text-sm flex items-center gap-1">
              <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block"></span>
              Sucesso: <span className="font-medium">{foundValue}</span>
            </p>
            <p className="text-sm flex items-center gap-1">
              <span className="w-3 h-3 rounded-full bg-red-500 inline-block"></span>
              Insucesso: <span className="font-medium">{notFoundValue}</span>
            </p>
            <p className="text-sm text-gray-600 pt-1 border-t">
              Taxa de sucesso: <span className="font-bold text-emerald-600">{total > 0 ? Math.round((foundValue / total) * 100) : 0}%</span>
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  const MonthlyTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
          <p className="font-semibold text-gray-900 capitalize">{label}</p>
          <div className="space-y-1 mt-2">
            <p className="text-sm flex items-center gap-1">
              <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block"></span>
              Indicações: <span className="font-medium">{payload[0]?.value}</span>
            </p>
            <p className="text-sm flex items-center gap-1">
              <span className="w-3 h-3 rounded-full bg-blue-500 inline-block"></span>
              Buscas Totais: <span className="font-medium">{payload[1]?.value}</span>
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  // Custom Y-axis tick with trend badge
  const CustomYAxisTick = ({ x, y, payload }: any) => {
    const item = demandData.find(d => d.name === payload.value);
    const trend = item?.trend || 0;
    const isPositive = trend >= 0;
    
    return (
      <g transform={`translate(${x},${y})`}>
        <text
          x={-60}
          y={0}
          dy={4}
          textAnchor="end"
          fill="#374151"
          fontSize={12}
          fontWeight={500}
        >
          {payload.value}
        </text>
        <g transform="translate(-52, -10)">
          <rect
            x={0}
            y={0}
            width={48}
            height={20}
            rx={10}
            fill={isPositive ? '#dcfce7' : '#fee2e2'}
          />
          <text
            x={24}
            y={14}
            textAnchor="middle"
            fill={isPositive ? '#16a34a' : '#dc2626'}
            fontSize={11}
            fontWeight={600}
          >
            {isPositive ? '↗' : '↘'} {Math.abs(trend)}%
          </text>
        </g>
      </g>
    );
  };

  return (
    <div className={`space-y-4 md:space-y-6 ${!expanded ? 'h-fit' : ''}`}>
      <Card>
        <CardHeader className="pb-2 sm:pb-3 px-4 sm:px-6">
          <CardTitle className="flex items-center justify-between text-base sm:text-lg">
            <div className="flex items-center">
              <BarChart3 className="mr-2 flex-shrink-0 h-5 w-5 text-primary" />
              <span className="truncate">Análise de Demanda</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                Últimos 30 dias
              </Badge>
              {expanded && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAnalyzeWithAI}
                  disabled={isAnalyzing}
                  className="gap-2 bg-gradient-to-r from-violet-50 to-purple-50 border-violet-200 hover:from-violet-100 hover:to-purple-100 text-violet-700"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Analisando...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      Analisar com IA
                    </>
                  )}
                </Button>
              )}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 px-4 sm:px-6">
          {/* Summary Stats Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-3">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-2 sm:p-3 text-center">
              <Search className="h-4 w-4 mx-auto mb-1 text-blue-600" />
              <div className="text-lg sm:text-xl font-bold text-blue-700">{totalStats.totalSearches}</div>
              <div className="text-xs text-blue-600">Buscas Totais</div>
            </div>
            <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-lg p-2 sm:p-3 text-center">
              <CheckCircle className="h-4 w-4 mx-auto mb-1 text-emerald-600" />
              <div className="text-lg sm:text-xl font-bold text-emerald-700">{successRate}%</div>
              <div className="text-xs text-emerald-600">Taxa Sucesso</div>
            </div>
            <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg p-2 sm:p-3 text-center">
              <XCircle className="h-4 w-4 mx-auto mb-1 text-red-600" />
              <div className="text-lg sm:text-xl font-bold text-red-700">{totalStats.notFound}</div>
              <div className="text-xs text-red-600">Não Encontrados</div>
            </div>
            <div className="bg-gradient-to-br from-amber-50 to-orange-100 rounded-lg p-2 sm:p-3 text-center">
              <AlertTriangle className="h-4 w-4 mx-auto mb-1 text-amber-600" />
              <div className="text-lg sm:text-xl font-bold text-amber-700">{totalStats.missedOpportunities}</div>
              <div className="text-xs text-amber-600">Oport. Perdidas</div>
            </div>
            <div className={`bg-gradient-to-br ${totalStats.growthRate >= 0 ? 'from-green-50 to-green-100' : 'from-orange-50 to-orange-100'} rounded-lg p-2 sm:p-3 text-center col-span-2 sm:col-span-1`}>
              {totalStats.growthRate >= 0 ? (
                <ArrowUpRight className="h-4 w-4 mx-auto mb-1 text-green-600" />
              ) : (
                <ArrowDownRight className="h-4 w-4 mx-auto mb-1 text-orange-600" />
              )}
              <div className={`text-lg sm:text-xl font-bold ${totalStats.growthRate >= 0 ? 'text-green-700' : 'text-orange-700'}`}>
                {totalStats.growthRate >= 0 ? '+' : ''}{totalStats.growthRate}%
              </div>
              <div className={`text-xs ${totalStats.growthRate >= 0 ? 'text-green-600' : 'text-orange-600'}`}>Crescimento</div>
            </div>
          </div>

          {/* AI Analysis Result - Only shown when expanded */}
          {expanded && showAnalysis && aiAnalysis && (
            <div className="bg-gradient-to-br from-violet-50 to-purple-50 border border-violet-200 rounded-lg p-4 relative animate-fade-in">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-violet-600" />
                  <h4 className="font-semibold text-violet-900">Análise de IA</h4>
                  {analysisHistory[currentHistoryIndex] && (
                    <span className="text-xs text-violet-500">
                      • {format(new Date(analysisHistory[currentHistoryIndex].criado_em), "dd/MM/yyyy 'às' HH:mm", { locale: pt })}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  {analysisHistory.length > 1 && (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const newIndex = Math.max(currentHistoryIndex - 1, 0);
                          setCurrentHistoryIndex(newIndex);
                          setAiAnalysis(analysisHistory[newIndex].analise);
                          setShowHistory(true);
                        }}
                        disabled={currentHistoryIndex <= 0}
                        className="h-7 w-7 p-0 text-violet-500 hover:text-violet-700"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowHistory(!showHistory)}
                        className="h-7 px-2 text-xs text-violet-600 hover:text-violet-800 gap-1"
                      >
                        <History className="h-3.5 w-3.5" />
                        {currentHistoryIndex + 1}/{analysisHistory.length}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const newIndex = Math.min(currentHistoryIndex + 1, analysisHistory.length - 1);
                          setCurrentHistoryIndex(newIndex);
                          setAiAnalysis(analysisHistory[newIndex].analise);
                          setShowHistory(true);
                        }}
                        disabled={currentHistoryIndex >= analysisHistory.length - 1}
                        className="h-7 w-7 p-0 text-violet-500 hover:text-violet-700"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleAiContentExpanded}
                    className="h-7 w-7 p-0 text-violet-500 hover:text-violet-700"
                  >
                    {isAiContentExpanded ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
              {isAiContentExpanded && (
                <div className="text-sm text-violet-800 leading-relaxed">
                  {formatMarkdownToHtml(aiAnalysis)}
                </div>
              )}
            </div>
          )}

          {/* Oportunidades Perdidas + Gap Analysis - Two column grid when expanded */}
          {expanded && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <MissingProductsCard 
                products={missingProducts} 
                isLoading={isLoading}
              />
              <RegionalDemandList 
                regions={regionalDemand}
                isLoading={isLoading}
                onRegionClick={handleRegionClick}
              />
            </div>
          )}

          {/* Gap Analysis Table - Full width when expanded */}
          {expanded && (
            <DemandGapTable gaps={demandGaps} isLoading={isLoading} />
          )}

          {/* Monthly Comparison Line Chart - Only when expanded */}
          {expanded && monthlyComparison.length > 0 && (
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 mb-4 flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Comparativo Mensal de Indicações
              </h4>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={monthlyComparison}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis 
                    dataKey="month" 
                    tick={{ fontSize: 12, fill: '#6b7280' }}
                    axisLine={{ stroke: '#d1d5db' }}
                  />
                  <YAxis 
                    tick={{ fontSize: 12, fill: '#6b7280' }}
                    axisLine={{ stroke: '#d1d5db' }}
                  />
                  <Tooltip content={<MonthlyTooltip />} />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="indicacoes" 
                    name="Indicações"
                    stroke="#10b981" 
                    strokeWidth={3}
                    dot={{ fill: '#10b981', strokeWidth: 2, r: 5 }}
                    activeDot={{ r: 8, strokeWidth: 2 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="buscas" 
                    name="Buscas Totais"
                    stroke="#3b82f6" 
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Two Column Layout for Chart and Trends */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Left Column - Bar Chart */}
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-gray-700 text-sm">Top 5 Medicamentos Mais Procurados</h4>
              </div>
              {isLoading ? (
                <div className="h-[200px] flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : demandData.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={demandData.slice(0, 5)} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                    <XAxis type="number" tick={{ fontSize: 11 }} />
                    <YAxis 
                      dataKey="name" 
                      type="category" 
                      tick={{ fontSize: 11 }} 
                      width={100}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="found" stackId="a" fill="#10b981" name="Encontrados" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="notFound" stackId="a" fill="#f87171" name="Não Encontrados" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[200px] flex items-center justify-center text-gray-500 text-sm">
                  Nenhum dado de busca disponível
                </div>
              )}
            </div>

            {/* Right Column - Trends List */}
            <div className="bg-gray-50 rounded-lg p-3">
              <h4 className="font-semibold text-gray-700 text-sm mb-2">Tendências de Medicamentos</h4>
              <div className="space-y-2 max-h-[200px] overflow-y-auto">
                {demandData.slice(0, 5).map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-white rounded border">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">{item.name}</div>
                      <div className="text-xs text-gray-500">{item.category}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <div className="text-sm font-semibold">
                          {item.searches > 0 ? Math.round((item.found / item.searches) * 100) : 0}%
                        </div>
                        <div className="text-xs text-gray-500">sucesso</div>
                      </div>
                      <Badge 
                        variant="outline" 
                        className={`${item.trend >= 0 ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}
                      >
                        {item.trend >= 0 ? <ArrowUpRight className="h-3 w-3 mr-0.5" /> : <ArrowDownRight className="h-3 w-3 mr-0.5" />}
                        {Math.abs(item.trend)}%
                      </Badge>
                    </div>
                  </div>
                ))}
                {demandData.length === 0 && !isLoading && (
                  <div className="text-center text-gray-500 text-sm py-4">
                    Nenhum dado disponível
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Ver mais dados button - Only when expanded */}
          {expanded && demandData.length > 5 && (
            <div className="flex justify-center pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowHorizontalChart(!showHorizontalChart)}
                className="gap-2"
              >
                {showHorizontalChart ? (
                  <>
                    <ChevronUp className="h-4 w-4" />
                    Ver menos
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-4 w-4" />
                    Ver mais dados
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Expanded Horizontal Chart - Only when expanded */}
          {expanded && showHorizontalChart && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-semibold text-gray-700 mb-4">Top 15 Medicamentos - Análise Detalhada</h4>
              <ResponsiveContainer width="100%" height={500}>
                <BarChart 
                  data={[...demandData].sort((a, b) => a.found - b.found)}
                  layout="horizontal"
                  margin={{ top: 20, right: 30, left: 120, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis 
                    dataKey="name" 
                    type="category" 
                    tick={<CustomYAxisTick />}
                    width={110}
                  />
                  <Tooltip content={<HorizontalTooltip />} />
                  <Legend />
                  <Bar 
                    dataKey="found" 
                    stackId="a" 
                    fill="#10b981" 
                    name="Sucesso"
                    radius={[5, 0, 0, 5]}
                    maxBarSize={10}
                  />
                  <Bar 
                    dataKey="notFound" 
                    stackId="a" 
                    fill="#f87171" 
                    name="Insucesso"
                    radius={[0, 5, 5, 0]}
                    maxBarSize={10}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Regional Detail Modal */}
      <RegionDetailModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        regionName={selectedRegion || ''}
        regionData={getSelectedRegionData()}
      />
    </div>
  );
};

export default DemandAnalysis;
