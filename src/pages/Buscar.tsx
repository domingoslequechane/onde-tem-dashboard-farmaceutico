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

  useEffect(() => {
    requestGeolocation();
    fetchMapboxToken();
  }, []);

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
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [userLocation.lng, userLocation.lat],
      zoom: 13,
    });

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    // Add user location marker
    new mapboxgl.Marker({ color: '#3b82f6' })
      .setLngLat([userLocation.lng, userLocation.lat])
      .setPopup(new mapboxgl.Popup().setHTML('<p class="font-semibold">Sua Localização</p>'))
      .addTo(map.current);

    return () => {
      map.current?.remove();
    };
  }, [mapboxToken, userLocation]);

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
        p_raio_km: 10,
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
          description: `Encontramos ${data.length} farmácia${data.length > 1 ? 's' : ''} com ${medicamento}`,
        });
      } else {
        toast({
          title: 'Nenhum resultado',
          description: 'Não encontramos farmácias com este medicamento próximas à sua localização',
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
        {/* Search Panel */}
        <div className="w-full lg:w-96 border-r border-border bg-background p-4 md:p-6 space-y-4 overflow-y-auto">
          <div>
            <h1 className="text-xl md:text-2xl font-bold mb-2">Buscar Medicamento</h1>
            <p className="text-sm text-muted-foreground">
              Encontre farmácias próximas com o medicamento que você precisa
            </p>
          </div>

          {/* Mapbox Token Input (temporary) - removed */}

          {/* Location Status */}
          <Card className="p-3 bg-muted/30">
            <div className="flex items-center gap-2">
              <MapPin className={`h-4 w-4 ${locationPermission === 'granted' ? 'text-primary' : 'text-muted-foreground'}`} />
              <span className="text-sm">
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
                  Tentar novamente
                </Button>
              )}
            </div>
          </Card>

          {/* Search Input */}
          <div className="space-y-2">
            <div className="flex gap-2">
              <Input
                placeholder="Digite o nome do medicamento"
                value={medicamento}
                onChange={(e) => setMedicamento(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && searchPharmacies()}
                className="flex-1"
              />
              <Button 
                onClick={searchPharmacies}
                disabled={searching || !userLocation}
                size="icon"
              >
                <Search className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Results List */}
          <div className="space-y-3">
            {pharmacies.length > 0 && (
              <h2 className="text-sm font-semibold text-muted-foreground">
                {pharmacies.length} Resultado{pharmacies.length > 1 ? 's' : ''} Encontrado{pharmacies.length > 1 ? 's' : ''}
              </h2>
            )}
            {pharmacies.map((pharmacy, index) => (
              <Card key={`${pharmacy.farmacia_id}-${index}`} className="p-4 space-y-2 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start gap-2">
                  <h3 className="font-semibold text-sm md:text-base">{pharmacy.farmacia_nome}</h3>
                  <span className="text-xs font-medium text-primary flex-shrink-0">
                    {pharmacy.distancia_km.toFixed(2)} km
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
                <div className="flex flex-wrap gap-2 text-xs">
                  {pharmacy.farmacia_telefone && (
                    <a 
                      href={`tel:${pharmacy.farmacia_telefone}`}
                      className="flex items-center gap-1 text-muted-foreground hover:text-foreground"
                    >
                      <Phone className="h-3 w-3" />
                      {pharmacy.farmacia_telefone}
                    </a>
                  )}
                  {pharmacy.farmacia_whatsapp && (
                    <a 
                      href={`https://wa.me/${pharmacy.farmacia_whatsapp.replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-primary hover:underline"
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
