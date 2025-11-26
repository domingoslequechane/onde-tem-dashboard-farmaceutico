import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Search, MapPin, Phone, ArrowLeft, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import logo from '@/assets/ondtem-logo.svg';

interface Pharmacy {
  farmacia_id: string;
  farmacia_nome: string;
  farmacia_endereco: string;
  farmacia_telefone: string;
  farmacia_whatsapp: string;
  medicamento_nome: string;
  medicamento_preco: number;
  medicamento_disponivel: boolean;
  distancia_km: number;
  farmacia_latitude: number;
  farmacia_longitude: number;
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
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
  const [searching, setSearching] = useState(false);
  const [locationPermission, setLocationPermission] = useState<'granted' | 'denied' | 'prompt'>('prompt');
  const [loadingToken, setLoadingToken] = useState(true);
  const [raioKm, setRaioKm] = useState(5);
  const [allMedicamentos, setAllMedicamentos] = useState<Medicamento[]>([]);
  const [loadingMedicamentos, setLoadingMedicamentos] = useState(true);

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
    } catch (error) {
      console.error('Error fetching medications:', error);
    } finally {
      setLoadingMedicamentos(false);
    }
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
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setLocationPermission('granted');
        toast({
          title: 'Localização obtida',
          description: 'Agora você pode buscar farmácias próximas',
        });
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

    // Add pharmacy marker from Google Maps link
    new mapboxgl.Marker({ color: '#10b981' })
      .setLngLat([34.8674968, -19.8305627])
      .setPopup(
        new mapboxgl.Popup().setHTML(`
          <div class="p-2">
            <p class="font-semibold">FARMACIA METRO FARMA MATACUANE</p>
            <p class="text-xs mt-1">Lat: -19.8305627, Lng: 34.8674968</p>
          </div>
        `)
      )
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
        p_raio_km: raioKm, // Use selected radius
      }) as { data: Pharmacy[] | null; error: any };

      if (error) throw error;

      setPharmacies(data || []);

      if (data && data.length > 0) {
        // Clear existing pharmacy markers
        markersRef.current.forEach(marker => marker.remove());
        markersRef.current = [];

        // Add pharmacy markers to map if coordinates are available
        data.forEach((pharmacy) => {
          if (pharmacy.farmacia_latitude && pharmacy.farmacia_longitude && map.current) {
            const marker = new mapboxgl.Marker({ color: '#10b981' })
              .setLngLat([pharmacy.farmacia_longitude, pharmacy.farmacia_latitude])
              .setPopup(
                new mapboxgl.Popup().setHTML(`
                  <div class="p-2">
                    <p class="font-semibold text-sm">${pharmacy.farmacia_nome}</p>
                    <p class="text-xs text-gray-600 mt-1">${pharmacy.distancia_km.toFixed(2)} km</p>
                    <p class="text-xs text-gray-600">MT ${pharmacy.medicamento_preco?.toFixed(2) || 'N/A'}</p>
                  </div>
                `)
              )
              .addTo(map.current);
            
            markersRef.current.push(marker);
          }
        });

        // Fit map to show all markers if we have coordinates
        if (markersRef.current.length > 0 && map.current) {
          const bounds = new mapboxgl.LngLatBounds();
          bounds.extend([userLocation.lng, userLocation.lat]);
          data.forEach((pharmacy) => {
            if (pharmacy.farmacia_latitude && pharmacy.farmacia_longitude) {
              bounds.extend([pharmacy.farmacia_longitude, pharmacy.farmacia_latitude]);
            }
          });
          map.current.fitBounds(bounds, { padding: 50 });
        }

        toast({
          title: 'Busca concluída',
          description: `Encontramos ${data.length} farmácia${data.length > 1 ? 's' : ''}`,
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
              <Input
                placeholder="Ex: Paracetamol"
                value={medicamento}
                onChange={(e) => setMedicamento(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && searchPharmacies()}
                className="flex-1"
              />
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
            {pharmacies.length > 0 && (
              <h2 className="text-sm font-semibold text-muted-foreground sticky top-0 bg-background pb-2">
                {pharmacies.length} Resultado{pharmacies.length > 1 ? 's' : ''}
              </h2>
            )}
            
            {/* Loading State */}
            {searching && (
              <Card className="p-6 text-center space-y-2">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto animate-pulse">
                  <Search className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold">Buscando farmácias...</h3>
                <p className="text-sm text-muted-foreground">
                  Procurando as melhores opções próximas a você
                </p>
              </Card>
            )}
            
            {/* Empty State */}
            {!searching && pharmacies.length === 0 && medicamento && (
              <Card className="p-6 text-center space-y-2">
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto">
                  <Search className="h-6 w-6 text-muted-foreground" />
                </div>
                <h3 className="font-semibold">Nenhuma farmácia encontrada</h3>
                <p className="text-sm text-muted-foreground">
                  Não encontramos farmácias com "{medicamento}" em um raio de {raioKm}km.
                  {raioKm < 50 && ' Tente aumentar o raio de busca acima.'}
                </p>
              </Card>
            )}

            {/* Initial State - Display All Medications */}
            {!searching && pharmacies.length === 0 && !medicamento && (
              <>
                <div className="mb-3">
                  <h2 className="text-sm font-semibold text-muted-foreground">
                    Medicamentos Disponíveis
                  </h2>
                  <p className="text-xs text-muted-foreground mt-1">
                    Clique em um medicamento para pesquisar farmácias
                  </p>
                </div>
                
                {loadingMedicamentos ? (
                  <Card className="p-6 text-center">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mx-auto animate-pulse">
                      <Search className="h-4 w-4 text-primary" />
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">Carregando medicamentos...</p>
                  </Card>
                ) : allMedicamentos.length === 0 ? (
                  <Card className="p-6 text-center">
                    <AlertCircle className="h-8 w-8 text-muted-foreground mx-auto" />
                    <p className="text-sm text-muted-foreground mt-2">Nenhum medicamento cadastrado</p>
                  </Card>
                ) : (
                  <div className="space-y-2">
                    {allMedicamentos.map((med) => (
                      <Card
                        key={med.id}
                        className="p-3 hover:shadow-md transition-all cursor-pointer border-l-4 border-l-transparent hover:border-l-primary"
                        onClick={() => setMedicamento(med.nome)}
                      >
                        <h3 className="font-medium text-sm">{med.nome}</h3>
                        {med.categoria && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {med.categoria}
                          </p>
                        )}
                      </Card>
                    ))}
                  </div>
                )}
              </>
            )}
            {pharmacies.map((pharmacy, index) => (
              <Card key={`${pharmacy.farmacia_id}-${index}`} className="p-3 space-y-2 hover:shadow-md transition-shadow cursor-pointer border-l-4 border-l-primary/20 hover:border-l-primary">
                <div className="flex justify-between items-start gap-2">
                  <h3 className="font-semibold text-sm">{pharmacy.farmacia_nome}</h3>
                  <span className="text-xs font-medium text-primary flex-shrink-0 bg-primary/10 px-2 py-1 rounded-full">
                    {pharmacy.distancia_km.toFixed(1)} km
                  </span>
                </div>
                <p className="text-xs text-muted-foreground flex items-start gap-1">
                  <MapPin className="h-3 w-3 mt-0.5 flex-shrink-0" />
                  {pharmacy.farmacia_endereco}
                </p>
                {pharmacy.medicamento_preco && (
                  <p className="text-sm font-semibold text-primary">
                    MT {pharmacy.medicamento_preco.toFixed(2)}
                  </p>
                )}
                <div className="flex flex-wrap gap-2 text-xs pt-1 border-t border-border">
                  {pharmacy.farmacia_telefone && (
                    <a 
                      href={`tel:${pharmacy.farmacia_telefone}`}
                      className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Phone className="h-3 w-3" />
                      Ligar
                    </a>
                  )}
                  {pharmacy.farmacia_whatsapp && (
                    <a 
                      href={`https://wa.me/${pharmacy.farmacia_whatsapp.replace(/\D/g, '')}`}
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
