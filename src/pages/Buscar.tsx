import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Search, MapPin, Phone, ArrowLeft, AlertCircle, X, Clock, Star } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import logo from '@/assets/ondtem-logo.svg';
import { LeaveReviewModal } from '@/components/LeaveReviewModal';
import { ViewReviewsModal } from '@/components/ViewReviewsModal';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface MedicamentoFarmacia {
  medicamento_id: string;
  medicamento_nome: string;
  medicamento_categoria: string | null;
  medicamento_preco: number;
  farmacia_id: string;
  farmacia_nome: string;
  farmacia_endereco: string;
  farmacia_telefone: string;
  farmacia_whatsapp: string;
  farmacia_latitude: number;
  farmacia_longitude: number;
  distancia_km: number;
  media_avaliacoes?: number;
  total_avaliacoes?: number;
}

interface Medicamento {
  id: string;
  nome: string;
  categoria: string | null;
}

const Buscar = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  
  const [mapboxToken, setMapboxToken] = useState('');
  const [medicamento, setMedicamento] = useState('');
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [medicamentos, setMedicamentos] = useState<MedicamentoFarmacia[]>([]);
  const [searching, setSearching] = useState(false);
  const [locationPermission, setLocationPermission] = useState<'granted' | 'denied' | 'prompt'>('prompt');
  const [loadingToken, setLoadingToken] = useState(true);
  const [raioKm, setRaioKm] = useState(1);
  const [allMedicamentos, setAllMedicamentos] = useState<Medicamento[]>([]);
  const [loadingMedicamentos, setLoadingMedicamentos] = useState(true);
  const [filteredMedicamentos, setFilteredMedicamentos] = useState<Medicamento[]>([]);
  const [selectedMedicamento, setSelectedMedicamento] = useState<MedicamentoFarmacia | null>(null);
  const [routeInfo, setRouteInfo] = useState<{
    distance: number;
    duration: number;
    mode: 'walking' | 'driving';
  } | null>(null);
  const [routeMode, setRouteMode] = useState<'walking' | 'driving'>('walking');
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [showLeaveReview, setShowLeaveReview] = useState(false);
  const [showViewReviews, setShowViewReviews] = useState(false);
  const [reviewRefreshTrigger, setReviewRefreshTrigger] = useState(0);
  const [showLocationDialog, setShowLocationDialog] = useState(false);

  useEffect(() => {
    requestGeolocation();
    fetchMapboxToken();
    fetchAllMedicamentos();
    loadSearchHistory();
  }, []);

  useEffect(() => {
    if (locationPermission === 'denied') {
      setShowLocationDialog(true);
    }
  }, [locationPermission]);

  const loadSearchHistory = () => {
    try {
      const history = localStorage.getItem('ondtem_search_history');
      if (history) {
        setSearchHistory(JSON.parse(history));
      }
    } catch (error) {
      console.error('Error loading search history:', error);
    }
  };

  const saveToSearchHistory = (searchTerm: string) => {
    try {
      const history = [...searchHistory];
      const index = history.indexOf(searchTerm);
      if (index > -1) {
        history.splice(index, 1);
      }
      history.unshift(searchTerm);
      const newHistory = history.slice(0, 10);
      setSearchHistory(newHistory);
      localStorage.setItem('ondtem_search_history', JSON.stringify(newHistory));
    } catch (error) {
      console.error('Error saving search history:', error);
    }
  };

  const fetchAllMedicamentos = async () => {
    try {
      const { data, error } = await supabase
        .from('medicamentos')
        .select('id, nome, categoria')
        .order('nome');

      if (error) throw error;
      setAllMedicamentos(data || []);
      setFilteredMedicamentos(data || []);
    } catch (error) {
      console.error('Error fetching medications:', error);
    } finally {
      setLoadingMedicamentos(false);
    }
  };

  useEffect(() => {
    if (medicamento.trim().length > 0) {
      const filtered = allMedicamentos.filter(med =>
        med.nome.toLowerCase().includes(medicamento.toLowerCase())
      );
      
      const uniqueNames = new Map<string, Medicamento>();
      filtered.forEach(med => {
        if (!uniqueNames.has(med.nome.toLowerCase())) {
          uniqueNames.set(med.nome.toLowerCase(), med);
        }
      });
      
      setFilteredMedicamentos(Array.from(uniqueNames.values()));
    } else {
      const uniqueNames = new Map<string, Medicamento>();
      allMedicamentos.forEach(med => {
        if (!uniqueNames.has(med.nome.toLowerCase())) {
          uniqueNames.set(med.nome.toLowerCase(), med);
        }
      });
      setFilteredMedicamentos(Array.from(uniqueNames.values()));
    }
  }, [medicamento, allMedicamentos]);

  const showRouteToPharmacy = async (item: MedicamentoFarmacia, mode: 'walking' | 'driving' = 'walking') => {
    if (!map.current || !userLocation) return;

    try {
      const url = `https://api.mapbox.com/directions/v5/mapbox/${mode}/${userLocation.lng},${userLocation.lat};${item.farmacia_longitude},${item.farmacia_latitude}?geometries=geojson&access_token=${mapboxToken}`;
      
      const response = await fetch(url);
      const data = await response.json();

      if (data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        const realDistance = route.distance / 1000;
        
        if (map.current.getLayer('route')) {
          map.current.removeLayer('route');
        }
        if (map.current.getSource('route')) {
          map.current.removeSource('route');
        }

        map.current.addSource('route', {
          type: 'geojson',
          data: {
            type: 'Feature',
            properties: {},
            geometry: route.geometry,
          },
        });

        map.current.addLayer({
          id: 'route',
          type: 'line',
          source: 'route',
          layout: {
            'line-join': 'round',
            'line-cap': 'round',
          },
          paint: {
            'line-color': mode === 'walking' ? '#3b82f6' : '#10b981',
            'line-width': 4,
            'line-opacity': 0.8,
          },
        });

        const coordinates = route.geometry.coordinates;
        const bounds = coordinates.reduce(
          (bounds: mapboxgl.LngLatBounds, coord: [number, number]) => {
            return bounds.extend(coord as [number, number]);
          },
          new mapboxgl.LngLatBounds(coordinates[0], coordinates[0])
        );
        map.current.fitBounds(bounds, { padding: 80 });

        setRouteInfo({
          distance: realDistance,
          duration: route.duration / 60,
          mode: mode,
        });
        setSelectedMedicamento({ ...item, distancia_km: realDistance });
        setRouteMode(mode);
      }
    } catch (error) {
      console.error('Error fetching route:', error);
      toast({
        title: 'Erro ao calcular rota',
        description: 'Não foi possível calcular a rota para esta farmácia',
        variant: 'destructive',
      });
    }
  };

  const clearRoute = () => {
    if (!map.current) return;
    
    if (map.current.getLayer('route')) {
      map.current.removeLayer('route');
    }
    if (map.current.getSource('route')) {
      map.current.removeSource('route');
    }
    
    setSelectedMedicamento(null);
    setRouteInfo(null);
  };

  const clearSearch = () => {
    setMedicamento('');
    setMedicamentos([]);
    clearRoute();
    
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];
    
    setFilteredMedicamentos(allMedicamentos);
  };

  const fetchMapboxToken = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('get-mapbox-token');
      if (error) throw error;
      if (data?.token) {
        setMapboxToken(data.token);
      }
    } catch (error) {
      console.error('Error fetching Mapbox token:', error);
      toast({
        title: 'Erro ao carregar mapa',
        description: 'Não foi possível carregar a configuração do mapa',
        variant: 'destructive',
      });
    } finally {
      setLoadingToken(false);
    }
  };

  const fetchAllPharmacies = async () => {
    try {
      const { data, error } = await supabase
        .from('farmacias')
        .select('*')
        .eq('ativa', true);

      if (error) throw error;

      markersRef.current.forEach(marker => marker.remove());
      markersRef.current = [];

      (data || []).forEach((farmacia) => {
        if (farmacia.latitude && farmacia.longitude && map.current) {
          const marker = new mapboxgl.Marker({ color: '#10b981' })
            .setLngLat([farmacia.longitude, farmacia.latitude])
            .setPopup(
              new mapboxgl.Popup({ 
                closeButton: false,
                closeOnClick: false,
                maxWidth: '320px',
                className: 'pharmacy-popup'
              }).setHTML(`
                <div style="padding: 12px; font-family: system-ui, -apple-system, sans-serif;">
                  <h3 style="margin: 0 0 8px 0; font-weight: 600; font-size: 14px;">${farmacia.nome}</h3>
                  <p style="margin: 0; font-size: 12px; color: #64748b;">${farmacia.endereco_completo}</p>
                </div>
              `)
            )
            .addTo(map.current);
          
          markersRef.current.push(marker);
        }
      });

      if (markersRef.current.length > 0 && map.current && userLocation) {
        const bounds = new mapboxgl.LngLatBounds();
        bounds.extend([userLocation.lng, userLocation.lat]);
        (data || []).forEach((farmacia) => {
          if (farmacia.latitude && farmacia.longitude) {
            bounds.extend([farmacia.longitude, farmacia.latitude]);
          }
        });
        map.current.fitBounds(bounds, { 
          padding: { top: 100, bottom: 100, left: 100, right: 100 },
          maxZoom: 14
        });
      }
    } catch (error) {
      console.error('Error fetching all pharmacies:', error);
    }
  };

  const requestGeolocation = () => {
    if (!navigator.geolocation) {
      toast({
        title: 'Erro',
        description: 'Seu navegador não suporta geolocalização',
        variant: 'destructive',
      });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setUserLocation(coords);
        setLocationPermission('granted');
        toast({
          title: 'Localização obtida',
          description: 'Mapa carregado com sucesso',
        });
      },
      (error) => {
        setLocationPermission('denied');
        toast({
          title: 'Permissão negada',
          description: 'Por favor, permita acesso à sua localização',
          variant: 'destructive',
        });
        console.error('Geolocation error:', error);
      }
    );
  };

  useEffect(() => {
    if (!mapContainer.current || !mapboxToken || !userLocation) return;

    mapboxgl.accessToken = mapboxToken;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/light-v11',
      center: [userLocation.lng, userLocation.lat],
      zoom: 12,
      pitch: 0,
      bearing: 0,
    });

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    new mapboxgl.Marker({ color: '#3b82f6' })
      .setLngLat([userLocation.lng, userLocation.lat])
      .setPopup(
        new mapboxgl.Popup({ 
          closeButton: false,
          maxWidth: '200px',
        }).setHTML(`<div style="padding: 10px; font-weight: 600; font-size: 13px;">Sua Localização</div>`)
      )
      .addTo(map.current);

    map.current.on('load', () => {
      addRadiusCircle();
      fetchAllPharmacies();
    });

    return () => {
      map.current?.remove();
    };
  }, [mapboxToken, userLocation]);

  useEffect(() => {
    if (map.current && map.current.isStyleLoaded()) {
      addRadiusCircle();
    }
    
    if (userLocation && medicamentos.length > 0) {
      searchPharmacies();
    }
  }, [raioKm]);

  const addRadiusCircle = () => {
    if (!map.current || !userLocation) return;

    if (map.current.getLayer('radius-circle-outline')) {
      map.current.removeLayer('radius-circle-outline');
    }
    if (map.current.getLayer('radius-circle')) {
      map.current.removeLayer('radius-circle');
    }
    if (map.current.getSource('radius')) {
      map.current.removeSource('radius');
    }

    const center = [userLocation.lng, userLocation.lat];
    const radiusInMeters = raioKm * 1000;
    const points = 64;
    const coords = [];

    for (let i = 0; i < points; i++) {
      const angle = (i * 360) / points;
      const radians = (angle * Math.PI) / 180;
      
      const dx = radiusInMeters * Math.cos(radians);
      const dy = radiusInMeters * Math.sin(radians);
      
      const lat = userLocation.lat + (dy / 111320);
      const lng = userLocation.lng + (dx / (111320 * Math.cos(userLocation.lat * Math.PI / 180)));
      
      coords.push([lng, lat]);
    }
    
    coords.push(coords[0]);

    map.current.addSource('radius', {
      type: 'geojson',
      data: {
        type: 'Feature',
        geometry: {
          type: 'Polygon',
          coordinates: [coords],
        },
        properties: {},
      },
    });

    map.current.addLayer({
      id: 'radius-circle',
      type: 'fill',
      source: 'radius',
      paint: {
        'fill-color': '#3b82f6',
        'fill-opacity': 0.1,
      },
    });

    map.current.addLayer({
      id: 'radius-circle-outline',
      type: 'line',
      source: 'radius',
      paint: {
        'line-color': '#3b82f6',
        'line-width': 2,
        'line-opacity': 0.5,
      },
    });
  };

  const fetchPharmacyRatings = async (farmaciaIds: string[]) => {
    try {
      const { data, error } = await supabase
        .from('avaliacoes')
        .select('farmacia_id, avaliacao')
        .in('farmacia_id', farmaciaIds);

      if (error) throw error;

      const ratingsMap = new Map<string, { media: number; total: number }>();
      
      (data || []).forEach((review) => {
        const existing = ratingsMap.get(review.farmacia_id) || { media: 0, total: 0 };
        const newTotal = existing.total + 1;
        const newMedia = ((existing.media * existing.total) + review.avaliacao) / newTotal;
        ratingsMap.set(review.farmacia_id, { media: newMedia, total: newTotal });
      });

      return ratingsMap;
    } catch (error) {
      console.error('Error fetching pharmacy ratings:', error);
      return new Map();
    }
  };

  const renderStars = (rating: number, size: 'sm' | 'md' = 'md') => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const iconSize = size === 'sm' ? 'h-2.5 w-2.5' : 'h-3 w-3';

    for (let i = 0; i < fullStars; i++) {
      stars.push(<Star key={i} className={`${iconSize} fill-yellow-400 text-yellow-400`} />);
    }
    if (hasHalfStar) {
      stars.push(<Star key="half" className={`${iconSize} fill-yellow-400/50 text-yellow-400`} />);
    }
    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<Star key={`empty-${i}`} className={`${iconSize} text-gray-300`} />);
    }
    return stars;
  };

  const searchPharmacies = async (searchTerm?: string) => {
    const term = searchTerm || medicamento;
    if (!term || !userLocation) return;

    setSearching(true);
    clearRoute();

    try {
      const { data, error } = await supabase
        .rpc('buscar_farmacias_proximas', {
          p_latitude: userLocation.lat,
          p_longitude: userLocation.lng,
          p_medicamento: term,
          p_raio_km: raioKm
        });

      if (error) throw error;

      if (data && data.length > 0) {
        saveToSearchHistory(term);
        
        const farmaciaIds = [...new Set(data.map((item: any) => item.farmacia_id))];
        const ratingsMap = await fetchPharmacyRatings(farmaciaIds);

        const medicamentosComAvaliacoes = data.map((item: any) => {
          const ratings = ratingsMap.get(item.farmacia_id);
          return {
            ...item,
            media_avaliacoes: ratings?.media || 0,
            total_avaliacoes: ratings?.total || 0,
          };
        });

        setMedicamentos(medicamentosComAvaliacoes);

        markersRef.current.forEach(marker => marker.remove());
        markersRef.current = [];

        medicamentosComAvaliacoes.forEach((item: MedicamentoFarmacia) => {
          if (item.farmacia_latitude && item.farmacia_longitude && map.current) {
            const marker = new mapboxgl.Marker({ color: '#10b981' })
              .setLngLat([item.farmacia_longitude, item.farmacia_latitude])
              .addTo(map.current);
            markersRef.current.push(marker);
          }
        });

        if (map.current && medicamentosComAvaliacoes.length > 0) {
          const bounds = new mapboxgl.LngLatBounds();
          bounds.extend([userLocation.lng, userLocation.lat]);
          medicamentosComAvaliacoes.forEach((item: MedicamentoFarmacia) => {
            if (item.farmacia_latitude && item.farmacia_longitude) {
              bounds.extend([item.farmacia_longitude, item.farmacia_latitude]);
            }
          });
          map.current.fitBounds(bounds, { padding: 50 });
        }
      } else {
        setMedicamentos([]);
      }
    } catch (error) {
      console.error('Search error:', error);
      toast({
        title: 'Erro na busca',
        description: 'Não foi possível buscar as farmácias. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col overflow-x-hidden w-full">
      {/* Header */}
      <header className="border-b border-border bg-background/95 backdrop-blur sticky top-0 z-50 w-full">
        <div className="px-3 md:px-4 py-3 md:py-4 flex justify-between items-center gap-2 max-w-full min-w-0">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/')}
              className="h-9 w-9 md:h-10 md:w-10 flex-shrink-0"
            >
              <ArrowLeft className="h-4 w-4 md:h-5 md:w-5" />
            </Button>
            <img src={logo} alt="ONDTem" className="h-6 md:h-8 flex-shrink-0" />
          </div>
          <Button 
            variant="ghost" 
            onClick={() => navigate('/entrar')}
            className="text-xs md:text-sm px-3 md:px-4 h-8 md:h-9 flex-shrink-0"
            size="sm"
          >
            Entrar
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden w-full">
        {/* Search Panel */}
        <div className="w-full md:w-80 border-r border-border bg-background flex flex-col overflow-hidden">
          {/* Search Header */}
          <div className="p-3 md:p-4 border-b border-border space-y-2 md:space-y-3">
            <h1 className="text-lg md:text-xl font-bold truncate">Encontre ONDTem!</h1>

            {/* Search Input */}
            <div className="flex gap-2 w-full min-w-0">
              <div className="relative flex-1 min-w-0">
                <Input
                  placeholder="Ex: Paracetamol"
                  value={medicamento}
                  onChange={(e) => setMedicamento(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && searchPharmacies()}
                  onFocus={() => {
                    setIsInputFocused(true);
                    const filtered = medicamento ? 
                      allMedicamentos.filter(med => med.nome.toLowerCase().includes(medicamento.toLowerCase())) : 
                      allMedicamentos;
                    
                    const uniqueNames = new Map<string, Medicamento>();
                    filtered.forEach(med => {
                      if (!uniqueNames.has(med.nome.toLowerCase())) {
                        uniqueNames.set(med.nome.toLowerCase(), med);
                      }
                    });
                    
                    setFilteredMedicamentos(Array.from(uniqueNames.values()).slice(0, 5));
                  }}
                  onBlur={() => {
                    setTimeout(() => setIsInputFocused(false), 200);
                  }}
                  className="pr-8 h-10 md:h-11 text-sm md:text-base"
                />
                {(medicamento || selectedMedicamento) && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={clearSearch}
                    className="absolute right-0 top-0 h-full w-9 md:w-10"
                  >
                    <X className="h-4 w-4 md:h-5 md:w-5" />
                  </Button>
                )}
                
                {/* Autocomplete */}
                {isInputFocused && medicamento && filteredMedicamentos.length > 0 && !searching && (
                  <Card className="absolute top-full left-0 right-0 mt-1 z-50 max-h-48 overflow-y-auto">
                    {filteredMedicamentos.slice(0, 5).map((med, index) => (
                      <div
                        key={`${med.nome}-${index}`}
                        className="p-2.5 md:p-3 hover:bg-muted cursor-pointer border-b last:border-b-0"
                        onClick={() => {
                          setMedicamento(med.nome);
                          searchPharmacies(med.nome);
                          setIsInputFocused(false);
                        }}
                      >
                        <p className="text-sm md:text-base font-medium truncate">{med.nome}</p>
                      </div>
                    ))}
                  </Card>
                )}
              </div>
              
              {/* Radius Mobile */}
              <Select value={raioKm.toString()} onValueChange={(value) => setRaioKm(Number(value))}>
                <SelectTrigger className="w-16 h-10 md:h-11 text-sm md:hidden">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5].map((km) => (
                    <SelectItem key={km} value={km.toString()} className="text-sm md:text-base">
                      {km}km
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Button 
                onClick={() => searchPharmacies()}
                disabled={searching || !userLocation}
                size="icon"
                className="flex-shrink-0 h-10 w-10 md:h-11 md:w-11"
              >
                <Search className="h-4 w-4 md:h-5 md:w-5" />
              </Button>
            </div>

            {/* Radius Desktop */}
            <div className="hidden md:flex items-center gap-2">
              <span className="text-sm text-muted-foreground whitespace-nowrap">Raio:</span>
              <div className="flex gap-1 flex-1">
                {[1, 2, 3, 4, 5].map((km) => (
                  <Button
                    key={km}
                    variant={raioKm === km ? "default" : "outline"}
                    size="sm"
                    onClick={() => setRaioKm(km)}
                    className="flex-1 text-sm h-9"
                  >
                    {km}km
                  </Button>
                ))}
              </div>
            </div>
          </div>

          {/* Results */}
          <div className="flex-1 overflow-y-auto p-3 md:p-4 space-y-2 md:space-y-3">
            {medicamentos.length > 0 && (
              <h2 className="text-sm md:text-base font-semibold text-muted-foreground sticky top-0 bg-background pb-2">
                {medicamentos.length} Medicamento{medicamentos.length > 1 ? 's' : ''} encontrado{medicamentos.length > 1 ? 's' : ''}
              </h2>
            )}
            
            {searching && (
              <Card className="p-4 md:p-6 text-center space-y-3">
                <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto animate-pulse">
                  <Search className="h-6 w-6 md:h-7 md:w-7 text-primary" />
                </div>
                <h3 className="font-semibold text-base md:text-lg">Buscando...</h3>
              </Card>
            )}
            
            {!searching && medicamentos.length === 0 && medicamento && (
              <Card className="p-4 md:p-6 text-center space-y-3">
                <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-muted flex items-center justify-center mx-auto">
                  <Search className="h-6 w-6 md:h-7 md:w-7 text-muted-foreground" />
                </div>
                <h3 className="font-semibold text-base md:text-lg">Nenhum medicamento encontrado</h3>
                <p className="text-sm md:text-base text-muted-foreground">
                  Não encontramos "{medicamento}" em farmácias próximas.
                </p>
              </Card>
            )}

            {!searching && medicamentos.length === 0 && !medicamento && searchHistory.length > 0 && (
              <div className="space-y-2 md:space-y-3">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 md:h-5 md:w-5 text-muted-foreground" />
                  <h2 className="text-sm md:text-base font-semibold text-muted-foreground">Buscas Recentes</h2>
                </div>
                {searchHistory.map((search, index) => (
                  <Card 
                    key={index} 
                    className="p-2.5 md:p-3 hover:shadow-md transition-all cursor-pointer"
                    onClick={() => {
                      setMedicamento(search);
                      setTimeout(() => searchPharmacies(search), 100);
                    }}
                  >
                    <div className="flex justify-between items-center gap-2">
                      <p className="font-medium text-sm md:text-base truncate flex-1">{search}</p>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 md:h-8 md:w-8"
                        onClick={(e) => {
                          e.stopPropagation();
                          const newHistory = searchHistory.filter((_, i) => i !== index);
                          setSearchHistory(newHistory);
                          localStorage.setItem('ondtem_search_history', JSON.stringify(newHistory));
                        }}
                      >
                        <X className="h-3.5 w-3.5 md:h-4 md:w-4" />
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}

            {medicamentos.map((item, index) => (
              <Card 
                key={index} 
                className="p-2.5 md:p-3 space-y-2 hover:shadow-md transition-all cursor-pointer border-l-4 border-l-green-500"
                onClick={() => showRouteToPharmacy(item, routeMode)}
              >
                <div className="flex justify-between items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm md:text-base truncate">{item.medicamento_nome}</h3>
                    {item.medicamento_categoria && (
                      <p className="text-xs md:text-sm text-muted-foreground truncate">{item.medicamento_categoria}</p>
                    )}
                  </div>
                  <span className="text-sm md:text-base font-semibold text-green-600 whitespace-nowrap">
                    {item.distancia_km.toFixed(1)} km
                  </span>
                </div>
                
                <div className="pt-2 border-t space-y-1.5">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 md:h-4 md:w-4 text-green-600 flex-shrink-0" />
                    <p className="text-xs md:text-sm font-medium text-green-600 truncate">{item.farmacia_nome}</p>
                  </div>
                  
                  {item.medicamento_preco && (
                    <p className="text-sm md:text-base font-semibold text-green-600">MT {item.medicamento_preco.toFixed(2)}</p>
                  )}
                  
                  {item.media_avaliacoes ? (
                    <div className="flex items-center gap-1">
                      {renderStars(item.media_avaliacoes, 'sm')}
                      <span className="text-xs md:text-sm font-semibold text-yellow-600">
                        {item.media_avaliacoes.toFixed(1)}
                      </span>
                      <span className="text-xs md:text-sm text-muted-foreground">
                        ({item.total_avaliacoes})
                      </span>
                    </div>
                  ) : (
                    <span className="text-xs md:text-sm text-muted-foreground">Sem avaliações</span>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Map */}
        <div className="flex-1 relative h-96 md:h-auto overflow-hidden">
          <div ref={mapContainer} className="absolute inset-0" />
          
          {/* Route Info */}
          {routeInfo && selectedMedicamento && (
            <Card className="absolute top-3 left-3 right-3 md:left-1/2 md:-translate-x-1/2 md:w-96 p-3 md:p-4 shadow-lg z-10">
              <div className="flex items-start gap-2">
                <div className="flex-1 space-y-2 min-w-0">
                  <h3 className="font-semibold text-sm md:text-base truncate">{selectedMedicamento.medicamento_nome}</h3>
                  <p className="text-xs md:text-sm text-muted-foreground truncate">{selectedMedicamento.farmacia_nome}</p>
                  
                  {selectedMedicamento.media_avaliacoes ? (
                    <div className="flex items-center gap-1">
                      {renderStars(selectedMedicamento.media_avaliacoes, 'sm')}
                      <span className="text-xs md:text-sm font-semibold text-yellow-600">
                        {selectedMedicamento.media_avaliacoes.toFixed(1)}
                      </span>
                    </div>
                  ) : (
                    <p className="text-xs md:text-sm text-muted-foreground">Sem avaliações</p>
                  )}
                  
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground text-xs md:text-sm">Distância:</span>
                      <p className="font-semibold text-sm md:text-base">{routeInfo.distance.toFixed(2)} km</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-xs md:text-sm">Tempo:</span>
                      <p className="font-semibold text-sm md:text-base">{Math.round(routeInfo.duration)} min</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      size="sm"
                      variant={routeMode === 'walking' ? 'default' : 'outline'}
                      onClick={() => showRouteToPharmacy(selectedMedicamento, 'walking')}
                      className="text-xs md:text-sm h-8 md:h-9"
                    >
                      🚶 A pé
                    </Button>
                    <Button
                      size="sm"
                      variant={routeMode === 'driving' ? 'default' : 'outline'}
                      onClick={() => showRouteToPharmacy(selectedMedicamento, 'driving')}
                      className="text-xs md:text-sm h-8 md:h-9"
                    >
                      🚗 Viatura
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setShowLeaveReview(true)}
                      className="text-xs md:text-sm h-8 md:h-9"
                    >
                      Avaliar
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setShowViewReviews(true)}
                      className="text-xs md:text-sm h-8 md:h-9"
                    >
                      Ver Avaliações
                    </Button>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={clearRoute}
                  className="h-5 w-5 md:h-6 md:w-6 p-0"
                >
                  ✕
                </Button>
              </div>
            </Card>
          )}

          {loadingToken && (
            <div className="absolute inset-0 bg-muted/90 flex items-center justify-center">
              <Card className="p-6 text-center">
                <p className="text-sm md:text-base">Carregando mapa...</p>
              </Card>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t bg-background">
        <div className="px-3 md:px-4 py-3 md:py-4">
          <p className="text-center text-xs md:text-sm text-muted-foreground">
            © {new Date().getFullYear()} ONDTem. Todos os direitos reservados. by{' '}
            <a 
              href="https://onixagence.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              Onix Agence
            </a>
          </p>
        </div>
      </footer>

      {/* Modals */}
      {selectedMedicamento && (
        <>
          <LeaveReviewModal
            open={showLeaveReview}
            onOpenChange={setShowLeaveReview}
            farmaciaId={selectedMedicamento.farmacia_id}
            farmaciaNome={selectedMedicamento.farmacia_nome}
            onReviewSubmitted={() => {
              setReviewRefreshTrigger(prev => prev + 1);
              searchPharmacies();
            }}
          />
          <ViewReviewsModal
            open={showViewReviews}
            onOpenChange={setShowViewReviews}
            farmaciaId={selectedMedicamento.farmacia_id}
            farmaciaNome={selectedMedicamento.farmacia_nome}
            refreshTrigger={reviewRefreshTrigger}
          />
        </>
      )}

      <AlertDialog open={showLocationDialog} onOpenChange={setShowLocationDialog}>
        <AlertDialogContent className="w-[calc(100%-2rem)] mx-4 max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              Ativar Geolocalização
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p className="text-sm">
                Para encontrar farmácias próximas, precisamos acessar sua localização.
              </p>
              <p className="text-sm">
                Ative a geolocalização nas configurações do navegador e recarregue.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction 
              onClick={() => {
                setShowLocationDialog(false);
                requestGeolocation();
              }}
            >
              Tentar Novamente
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Buscar;
