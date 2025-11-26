import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Search, MapPin, Phone, ArrowLeft, AlertCircle, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import logo from '@/assets/ondtem-logo.svg';

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
  const [raioKm, setRaioKm] = useState(5);
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

  useEffect(() => {
    requestGeolocation();
    fetchMapboxToken();
    fetchAllMedicamentos();
  }, []);

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

  // Filter medications based on input - show only unique names
  useEffect(() => {
    if (medicamento.trim().length > 0) {
      const filtered = allMedicamentos.filter(med =>
        med.nome.toLowerCase().includes(medicamento.toLowerCase())
      );
      
      // Get unique medication names
      const uniqueNames = new Map<string, Medicamento>();
      filtered.forEach(med => {
        if (!uniqueNames.has(med.nome.toLowerCase())) {
          uniqueNames.set(med.nome.toLowerCase(), med);
        }
      });
      
      setFilteredMedicamentos(Array.from(uniqueNames.values()));
    } else {
      // Show unique names when no search
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
      // Build Mapbox Directions API URL
      const url = `https://api.mapbox.com/directions/v5/mapbox/${mode}/${userLocation.lng},${userLocation.lat};${item.farmacia_longitude},${item.farmacia_latitude}?geometries=geojson&access_token=${mapboxToken}`;
      
      const response = await fetch(url);
      const data = await response.json();

      if (data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        
        // Remove existing route layer if it exists
        if (map.current.getLayer('route')) {
          map.current.removeLayer('route');
        }
        if (map.current.getSource('route')) {
          map.current.removeSource('route');
        }

        // Add route to map
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

        // Fit map to show the entire route
        const coordinates = route.geometry.coordinates;
        const bounds = coordinates.reduce(
          (bounds: mapboxgl.LngLatBounds, coord: [number, number]) => {
            return bounds.extend(coord as [number, number]);
          },
          new mapboxgl.LngLatBounds(coordinates[0], coordinates[0])
        );
        map.current.fitBounds(bounds, { padding: 80 });

        // Set route info
        setRouteInfo({
          distance: route.distance / 1000, // Convert to km
          duration: route.duration / 60, // Convert to minutes
          mode: mode,
        });
        setSelectedMedicamento(item);
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
    
    // Clear pharmacy markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];
    
    // Reset filtered medications to show all
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

  const fetchNearbyPharmacies = async (lat: number, lng: number) => {
    try {
      const { data, error } = await supabase
        .from('farmacias')
        .select('*')
        .eq('ativa', true);

      if (error) throw error;

      // Calculate distance for each pharmacy in real-time
      const farmaciasComDistancia = (data || [])
        .map((farmacia) => {
          const R = 6371; // Earth radius in km
          const dLat = (farmacia.latitude - lat) * Math.PI / 180;
          const dLon = (farmacia.longitude - lng) * Math.PI / 180;
          const a = 
            Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat * Math.PI / 180) * Math.cos(farmacia.latitude * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
          const distancia_km = R * c;

          return {
            ...farmacia,
            distancia_km
          };
        })
        .filter(f => f.distancia_km <= raioKm)
        .sort((a, b) => a.distancia_km - b.distancia_km);

      // Add pharmacy markers to map
      markersRef.current.forEach(marker => marker.remove());
      markersRef.current = [];

      farmaciasComDistancia.forEach((farmacia) => {
        if (farmacia.latitude && farmacia.longitude && map.current) {
          const marker = new mapboxgl.Marker({ color: '#10b981' })
            .setLngLat([farmacia.longitude, farmacia.latitude])
            .setPopup(
              new mapboxgl.Popup().setHTML(`
                <div class="p-2">
                  <p class="font-semibold text-sm">${farmacia.nome}</p>
                  <p class="text-xs text-gray-600 mt-1">${farmacia.distancia_km.toFixed(2)} km</p>
                  <p class="text-xs text-gray-600">${farmacia.endereco_completo}</p>
                </div>
              `)
            )
            .addTo(map.current);
          
          markersRef.current.push(marker);
        }
      });

      // Fit map to show all markers
      if (markersRef.current.length > 0 && map.current) {
        const bounds = new mapboxgl.LngLatBounds();
        bounds.extend([lng, lat]);
        farmaciasComDistancia.forEach((farmacia) => {
          if (farmacia.latitude && farmacia.longitude) {
            bounds.extend([farmacia.longitude, farmacia.latitude]);
          }
        });
        map.current.fitBounds(bounds, { padding: 50 });
      }

      toast({
        title: 'Farmácias próximas',
        description: `Encontramos ${farmaciasComDistancia.length} farmácia${farmaciasComDistancia.length !== 1 ? 's' : ''} próxima${farmaciasComDistancia.length !== 1 ? 's' : ''}`,
      });
    } catch (error) {
      console.error('Error fetching nearby pharmacies:', error);
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
          description: 'Buscando farmácias próximas...',
        });
        
        // Automatically fetch nearby pharmacies
        fetchNearbyPharmacies(coords.lat, coords.lng);
      },
      (error) => {
        setLocationPermission('denied');
        toast({
          title: 'Permissão negada',
          description: 'Por favor, permita acesso à sua localização para encontrar farmácias próximas',
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
      zoom: 13,
    });

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    // Add user location marker
    new mapboxgl.Marker({ color: '#3b82f6' })
      .setLngLat([userLocation.lng, userLocation.lat])
      .setPopup(new mapboxgl.Popup().setHTML('<p class="font-semibold">Sua Localização</p>'))
      .addTo(map.current);

    // Wait for map to load before adding radius circle
    map.current.on('load', () => {
      addRadiusCircle();
    });

    return () => {
      map.current?.remove();
    };
  }, [mapboxToken, userLocation]);


  // Update radius circle when raioKm changes
  useEffect(() => {
    if (map.current && map.current.isStyleLoaded()) {
      addRadiusCircle();
    }
    
    // Refetch nearby pharmacies when radius changes
    if (userLocation) {
      fetchNearbyPharmacies(userLocation.lat, userLocation.lng);
    }
  }, [raioKm, userLocation]);

  const addRadiusCircle = () => {
    if (!map.current || !userLocation) return;

    // Remove existing radius circle if it exists
    if (map.current.getLayer('radius-circle-outline')) {
      map.current.removeLayer('radius-circle-outline');
    }
    if (map.current.getLayer('radius-circle')) {
      map.current.removeLayer('radius-circle');
    }
    if (map.current.getSource('radius')) {
      map.current.removeSource('radius');
    }

    // Create circle using turf-like calculation
    const center = [userLocation.lng, userLocation.lat];
    const radiusInMeters = raioKm * 1000;
    const points = 64;
    const coords = [];

    for (let i = 0; i < points; i++) {
      const angle = (i * 360) / points;
      const radians = (angle * Math.PI) / 180;
      
      // Calculate point on circle (approximate, works for small distances)
      const dx = radiusInMeters * Math.cos(radians);
      const dy = radiusInMeters * Math.sin(radians);
      
      const lat = userLocation.lat + (dy / 111320);
      const lng = userLocation.lng + (dx / (111320 * Math.cos(userLocation.lat * Math.PI / 180)));
      
      coords.push([lng, lat]);
    }
    
    // Close the circle
    coords.push(coords[0]);

    // Add the circle as a source and layer
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

  const searchPharmacies = async () => {
    if (!medicamento.trim()) {
      toast({
        title: 'Atenção',
        description: 'Por favor, digite o nome do medicamento',
        variant: 'destructive',
      });
      return;
    }

    if (!userLocation) {
      toast({
        title: 'Localização necessária',
        description: 'Por favor, permita acesso à sua localização',
        variant: 'destructive',
      });
      requestGeolocation();
      return;
    }

    setSearching(true);

    try {
      const { data, error } = await supabase.rpc('buscar_farmacias_proximas', {
        p_latitude: userLocation.lat,
        p_longitude: userLocation.lng,
        p_medicamento: medicamento,
        p_raio_km: raioKm,
      }) as { data: MedicamentoFarmacia[] | null; error: any };

      if (error) throw error;

      setMedicamentos(data || []);

      if (data && data.length > 0) {
        // Clear existing pharmacy markers
        markersRef.current.forEach(marker => marker.remove());
        markersRef.current = [];

        // Group by pharmacy to avoid duplicate markers
        const uniquePharmacies = new Map<string, MedicamentoFarmacia>();
        data.forEach((item) => {
          if (!uniquePharmacies.has(item.farmacia_id)) {
            uniquePharmacies.set(item.farmacia_id, item);
          }
        });

        // Add pharmacy markers to map
        uniquePharmacies.forEach((item) => {
          if (item.farmacia_latitude && item.farmacia_longitude && map.current) {
            const marker = new mapboxgl.Marker({ color: '#10b981' })
              .setLngLat([item.farmacia_longitude, item.farmacia_latitude])
              .setPopup(
                new mapboxgl.Popup().setHTML(`
                  <div class="p-2">
                    <p class="font-semibold text-sm">${item.farmacia_nome}</p>
                    <p class="text-xs text-gray-600 mt-1">${item.distancia_km.toFixed(2)} km</p>
                  </div>
                `)
              )
              .addTo(map.current);
            
            markersRef.current.push(marker);
          }
        });

        // Fit map to show all markers
        if (markersRef.current.length > 0 && map.current) {
          const bounds = new mapboxgl.LngLatBounds();
          bounds.extend([userLocation.lng, userLocation.lat]);
          uniquePharmacies.forEach((item) => {
            if (item.farmacia_latitude && item.farmacia_longitude) {
              bounds.extend([item.farmacia_longitude, item.farmacia_latitude]);
            }
          });
          map.current.fitBounds(bounds, { padding: 50 });
        }

        toast({
          title: 'Busca concluída',
          description: `Encontramos ${data.length} medicamento${data.length > 1 ? 's' : ''}`,
        });
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
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-3 md:px-4 py-3 md:py-4 flex justify-between items-center">
          <div className="flex items-center gap-2 md:gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/')}
              className="h-8 w-8 md:h-10 md:w-10"
            >
              <ArrowLeft className="h-4 w-4 md:h-5 md:w-5" />
            </Button>
            <img src={logo} alt="ONDTem" className="h-6 md:h-8" />
          </div>
          <Button 
            variant="ghost" 
            onClick={() => navigate('/entrar')}
            className="text-xs md:text-sm"
            size="sm"
          >
            Entrar
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:flex-row">
        {/* Search Panel - Google Maps style */}
        <div className="w-full lg:w-[400px] border-r border-border bg-background flex flex-col overflow-hidden">
          {/* Search Header */}
          <div className="p-4 border-b border-border space-y-4">
            <div>
              <h1 className="text-xl font-bold mb-1">Buscar Medicamento</h1>
              <p className="text-sm text-muted-foreground">
                Encontre farmácias próximas
              </p>
            </div>

            {/* Location Status */}
            <div className="flex items-center gap-2 text-sm">
              <MapPin className={`h-4 w-4 ${locationPermission === 'granted' ? 'text-primary' : 'text-muted-foreground'}`} />
              <span>
                {locationPermission === 'granted' 
                  ? 'Localização ativa' 
                  : locationPermission === 'denied' 
                    ? 'Localização negada' 
                    : 'Obtendo localização...'}
              </span>
              {locationPermission === 'denied' && (
                <Button
                  variant="link"
                  size="sm"
                  onClick={requestGeolocation}
                  className="ml-auto text-xs h-auto p-0"
                >
                  Ativar
                </Button>
              )}
            </div>

            {/* Search Input */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  placeholder="Ex: Paracetamol"
                  value={medicamento}
                  onChange={(e) => setMedicamento(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && searchPharmacies()}
                  onFocus={() => {
                    // Show unique medication names on focus
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
                  className="pr-8"
                />
                {(medicamento || selectedMedicamento) && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={clearSearch}
                    className="absolute right-0 top-0 h-full w-8 hover:bg-transparent"
                  >
                    <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                  </Button>
                )}
                
                {/* Autocomplete Dropdown */}
                {medicamento && filteredMedicamentos.length > 0 && medicamentos.length === 0 && !searching && (
                  <Card className="absolute top-full left-0 right-0 mt-1 z-50 max-h-[200px] overflow-y-auto shadow-lg">
                    {filteredMedicamentos.slice(0, 5).map((med, index) => (
                      <div
                        key={`${med.nome}-${index}`}
                        className="p-2 hover:bg-muted cursor-pointer border-b last:border-b-0"
                        onClick={() => {
                          setMedicamento(med.nome);
                          searchPharmacies();
                        }}
                      >
                        <p className="text-sm font-medium">{med.nome}</p>
                      </div>
                    ))}
                  </Card>
                )}
              </div>
              <Button 
                onClick={searchPharmacies}
                disabled={searching || !userLocation}
                size="icon"
                className="flex-shrink-0"
              >
                <Search className="h-4 w-4" />
              </Button>
            </div>

            {/* Radius Selector */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground whitespace-nowrap">Raio de busca:</span>
              <div className="flex gap-1 flex-1">
                {[1, 2, 3, 4, 5].map((km) => (
                  <Button
                    key={km}
                    variant={raioKm === km ? "default" : "outline"}
                    size="sm"
                    onClick={() => setRaioKm(km)}
                    className="flex-1 text-xs h-8"
                  >
                    {km}km
                  </Button>
                ))}
              </div>
            </div>
          </div>

          {/* Results List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {medicamentos.length > 0 && (
              <h2 className="text-sm font-semibold text-muted-foreground sticky top-0 bg-background pb-2">
                {medicamentos.length} Medicamento{medicamentos.length > 1 ? 's' : ''} encontrado{medicamentos.length > 1 ? 's' : ''}
              </h2>
            )}
            
            {/* Loading State */}
            {searching && (
              <Card className="p-6 text-center space-y-2">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto animate-pulse">
                  <Search className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold">Buscando medicamentos...</h3>
                <p className="text-sm text-muted-foreground">
                  Procurando as melhores opções próximas a você
                </p>
              </Card>
            )}
            
            {/* Empty State */}
            {!searching && medicamentos.length === 0 && medicamento && (
              <Card className="p-6 text-center space-y-2">
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto">
                  <Search className="h-6 w-6 text-muted-foreground" />
                </div>
                <h3 className="font-semibold">Nenhum medicamento encontrado</h3>
                <p className="text-sm text-muted-foreground">
                  Não encontramos "{medicamento}" em farmácias próximas em um raio de {raioKm}km.
                  {raioKm < 5 && ' Tente aumentar o raio de busca acima.'}
                </p>
              </Card>
            )}

            {/* Medications List - Ordered by proximity */}
            {medicamentos.map((item, index) => (
              <Card 
                key={`${item.medicamento_id}-${item.farmacia_id}-${index}`} 
                className={`p-3 space-y-2 hover:shadow-md transition-all cursor-pointer border-l-4 ${
                  selectedMedicamento?.medicamento_id === item.medicamento_id && selectedMedicamento?.farmacia_id === item.farmacia_id
                    ? 'border-l-primary bg-primary/5' 
                    : 'border-l-primary/20 hover:border-l-primary'
                }`}
                onClick={() => showRouteToPharmacy(item, routeMode)}
              >
                <div className="flex justify-between items-start gap-2">
                  <div className="flex-1">
                    <h3 className="font-semibold text-base">{item.medicamento_nome}</h3>
                    {item.medicamento_categoria && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {item.medicamento_categoria}
                      </p>
                    )}
                  </div>
                  <span className="text-xs font-medium text-primary flex-shrink-0 bg-primary/10 px-2 py-1 rounded-full">
                    {item.distancia_km.toFixed(1)} km
                  </span>
                </div>
                
                <div className="pt-2 border-t border-border space-y-1">
                  <p className="text-xs font-medium flex items-center gap-1">
                    <MapPin className="h-3 w-3 text-primary" />
                    {item.farmacia_nome}
                  </p>
                  {item.medicamento_preco && (
                    <p className="text-sm font-semibold text-primary">
                      MT {item.medicamento_preco.toFixed(2)}
                    </p>
                  )}
                </div>
                
                <div className="flex flex-wrap gap-2 text-xs pt-2 border-t border-border">
                  {item.farmacia_telefone && (
                    <a 
                      href={`tel:${item.farmacia_telefone}`}
                      className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Phone className="h-3 w-3" />
                      Ligar
                    </a>
                  )}
                  {item.farmacia_whatsapp && (
                    <a 
                      href={`https://wa.me/${item.farmacia_whatsapp.replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-primary hover:underline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      WhatsApp
                    </a>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Map */}
        <div className="flex-1 relative h-[400px] lg:h-auto">
          <div ref={mapContainer} className="absolute inset-0" />
          
          {/* Route Info Overlay */}
          {routeInfo && selectedMedicamento && (
            <Card className="absolute top-4 left-1/2 transform -translate-x-1/2 p-4 shadow-lg z-10 max-w-sm w-[calc(100%-2rem)]">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <h3 className="font-semibold text-sm mb-1">{selectedMedicamento.medicamento_nome}</h3>
                  <p className="text-xs text-muted-foreground mb-2">{selectedMedicamento.farmacia_nome}</p>
                  <div className="space-y-1 text-xs">
                    <p className="flex items-center gap-2">
                      <span className="font-medium">Distância:</span>
                      <span>{routeInfo.distance.toFixed(2)} km</span>
                    </p>
                    <p className="flex items-center gap-2">
                      <span className="font-medium">Tempo estimado:</span>
                      <span>
                        {Math.round(routeInfo.duration)} min {routeInfo.mode === 'walking' ? '(a pé)' : '(de viatura)'}
                      </span>
                    </p>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <Button
                      size="sm"
                      variant={routeMode === 'walking' ? 'default' : 'outline'}
                      onClick={() => showRouteToPharmacy(selectedMedicamento, 'walking')}
                      className="text-xs h-7 flex-1"
                    >
                      🚶 A pé
                    </Button>
                    <Button
                      size="sm"
                      variant={routeMode === 'driving' ? 'default' : 'outline'}
                      onClick={() => showRouteToPharmacy(selectedMedicamento, 'driving')}
                      className="text-xs h-7 flex-1"
                    >
                      🚗 Viatura
                    </Button>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={clearRoute}
                  className="h-6 w-6 p-0"
                >
                  ✕
                </Button>
              </div>
            </Card>
          )}
          {loadingToken && (
            <div className="absolute inset-0 bg-muted/90 flex items-center justify-center p-4">
              <Card className="p-6 max-w-md text-center space-y-2">
                <p className="text-sm text-muted-foreground">Carregando mapa...</p>
              </Card>
            </div>
          )}
          {!loadingToken && !mapboxToken && (
            <div className="absolute inset-0 bg-muted/90 flex items-center justify-center p-4">
              <Card className="p-6 max-w-md text-center space-y-2">
                <AlertCircle className="h-8 w-8 text-destructive mx-auto" />
                <h3 className="font-semibold">Erro ao Carregar Mapa</h3>
                <p className="text-sm text-muted-foreground">
                  Não foi possível carregar a configuração do mapa. Por favor, tente novamente mais tarde.
                </p>
              </Card>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-border bg-background mt-auto">
        <div className="container mx-auto px-4 py-4">
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
    </div>
  );
};

export default Buscar;
