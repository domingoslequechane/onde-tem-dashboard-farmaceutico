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

  useEffect(() => {
    requestGeolocation();
    fetchMapboxToken();
    fetchAllMedicamentos();
    loadSearchHistory();
  }, []);

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
      // Remove if already exists
      const index = history.indexOf(searchTerm);
      if (index > -1) {
        history.splice(index, 1);
      }
      // Add to beginning
      history.unshift(searchTerm);
      // Keep only last 10 searches
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
      // Build Mapbox Directions API URL - always use real route distance
      const url = `https://api.mapbox.com/directions/v5/mapbox/${mode}/${userLocation.lng},${userLocation.lat};${item.farmacia_longitude},${item.farmacia_latitude}?geometries=geojson&access_token=${mapboxToken}`;
      
      const response = await fetch(url);
      const data = await response.json();

      if (data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        const realDistance = route.distance / 1000; // Real route distance in km
        
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

        // Set route info - use real route distance for both displays
        setRouteInfo({
          distance: realDistance,
          duration: route.duration / 60, // Convert to minutes
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
    } catch (error) {
      console.error('Error fetching nearby pharmacies:', error);
    }
  };

  const fetchAllPharmacies = async () => {
    try {
      const { data, error } = await supabase
        .from('farmacias')
        .select('*')
        .eq('ativa', true);

      if (error) throw error;

      // Clear existing markers
      markersRef.current.forEach(marker => marker.remove());
      markersRef.current = [];

      // Add all pharmacy markers to map
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
                <style>
                  .pharmacy-popup .mapboxgl-popup-content {
                    padding: 0;
                    border-radius: 12px;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                  }
                  .pharmacy-popup-close {
                    position: absolute;
                    top: 12px;
                    right: 12px;
                    width: 24px;
                    height: 24px;
                    border-radius: 6px;
                    background: #f1f5f9;
                    border: none;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.2s;
                    z-index: 10;
                  }
                  .pharmacy-popup-close:hover {
                    background: #e2e8f0;
                  }
                  .pharmacy-popup-close svg {
                    width: 14px;
                    height: 14px;
                    stroke: #64748b;
                    stroke-width: 2.5;
                  }
                </style>
                <div style="padding: 16px; padding-right: 44px; font-family: system-ui, -apple-system, sans-serif; position: relative;">
                  <button class="pharmacy-popup-close" onclick="this.closest('.mapboxgl-popup').remove()">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                  </button>
                  <h3 style="margin: 0 0 12px 0; font-weight: 600; font-size: 15px; color: #0f172a; line-height: 1.3; padding-right: 8px;">
                    ${farmacia.nome}
                  </h3>
                  <div style="display: flex; flex-direction: column; gap: 10px; font-size: 13px;">
                    ${farmacia.endereco_completo ? `
                      <div style="display: flex; align-items: start; gap: 10px;">
                        <svg style="width: 18px; height: 18px; flex-shrink: 0; margin-top: 1px;" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                          <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
                          <circle cx="12" cy="10" r="3"/>
                        </svg>
                        <span style="color: #64748b; line-height: 1.5;">${farmacia.endereco_completo}</span>
                      </div>
                    ` : ''}
                    ${farmacia.horario_abertura && farmacia.horario_fechamento ? `
                      <div style="display: flex; align-items: center; gap: 10px;">
                        <svg style="width: 18px; height: 18px; flex-shrink: 0;" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                          <circle cx="12" cy="12" r="10"/>
                          <polyline points="12 6 12 12 16 14"/>
                        </svg>
                        <span style="color: #64748b;">${farmacia.horario_abertura} - ${farmacia.horario_fechamento}</span>
                      </div>
                    ` : ''}
                    ${farmacia.telefone ? `
                      <div style="display: flex; align-items: center; gap: 10px;">
                        <svg style="width: 18px; height: 18px; flex-shrink: 0;" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                        </svg>
                        <a href="tel:${farmacia.telefone}" style="color: #10b981; text-decoration: none; font-weight: 500; transition: opacity 0.2s;" onmouseover="this.style.opacity='0.7'" onmouseout="this.style.opacity='1'">${farmacia.telefone}</a>
                      </div>
                    ` : ''}
                    ${farmacia.whatsapp ? `
                      <div style="display: flex; align-items: center; gap: 10px;">
                        <svg style="width: 18px; height: 18px; flex-shrink: 0;" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                          <path d="m3 21 1.65-3.8a9 9 0 1 1 3.4 2.9z"/>
                          <path d="M9 10a.5.5 0 0 0 1 0V9a.5.5 0 0 0-1 0v1a5 5 0 0 0 5 5h1a.5.5 0 0 0 0-1h-1a.5.5 0 0 0 0 1"/>
                        </svg>
                        <a href="https://wa.me/${farmacia.whatsapp.replace(/\D/g, '')}" target="_blank" style="color: #10b981; text-decoration: none; font-weight: 500; transition: opacity 0.2s;" onmouseover="this.style.opacity='0.7'" onmouseout="this.style.opacity='1'">${farmacia.whatsapp}</a>
                      </div>
                    ` : ''}
                  </div>
                </div>
              `)
            )
            .addTo(map.current);
          
          markersRef.current.push(marker);
        }
      });

      // Fit map to show user location and nearby pharmacies within radius
      if (markersRef.current.length > 0 && map.current && userLocation) {
        const bounds = new mapboxgl.LngLatBounds();
        
        // Include user location
        bounds.extend([userLocation.lng, userLocation.lat]);
        
        // Include pharmacies
        (data || []).forEach((farmacia) => {
          if (farmacia.latitude && farmacia.longitude) {
            bounds.extend([farmacia.longitude, farmacia.latitude]);
          }
        });
        
        // Fit bounds with generous padding to show context
        map.current.fitBounds(bounds, { 
          padding: { top: 100, bottom: 100, left: 100, right: 100 },
          maxZoom: 14 // Don't zoom in too much
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
      style: 'mapbox://styles/mapbox/light-v11', // Clean, minimal style similar to Google Maps
      center: [userLocation.lng, userLocation.lat],
      zoom: 12,
      pitch: 0,
      bearing: 0,
    });

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    // Add user location marker (blue marker for user)
    new mapboxgl.Marker({ color: '#3b82f6' })
      .setLngLat([userLocation.lng, userLocation.lat])
      .setPopup(
        new mapboxgl.Popup({ 
          closeButton: false,
          maxWidth: '200px',
          className: 'user-location-popup'
        }).setHTML(`
          <style>
            .user-location-popup .mapboxgl-popup-content {
              padding: 12px 16px;
              border-radius: 10px;
              box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            }
          </style>
          <div style="display: flex; align-items: center; gap: 8px; font-family: system-ui, -apple-system, sans-serif;">
            <svg style="width: 18px; height: 18px; flex-shrink: 0;" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
            <p style="margin: 0; font-weight: 600; font-size: 14px; color: #0f172a;">Sua Localização</p>
          </div>
        `)
      )
      .addTo(map.current);

    // Wait for map to load before adding radius circle and pharmacies
    map.current.on('load', () => {
      addRadiusCircle();
      fetchAllPharmacies(); // Show all pharmacies on initial load
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
    
    // Only refetch nearby pharmacies if there's an active search, otherwise show all
    if (userLocation && medicamentos.length > 0) {
      // Re-run search to update results with new radius
      searchPharmacies();
    }
  }, [raioKm]);

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

  const fetchPharmacyRatings = async (farmaciaIds: string[]) => {
    try {
      const { data, error } = await supabase
        .from('avaliacoes')
        .select('farmacia_id, avaliacao')
        .in('farmacia_id', farmaciaIds);

      if (error) throw error;

      // Calculate average ratings per pharmacy
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

  const renderStars = (rating: number, size: 'sm' | 'md' = 'sm') => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    
    const starSize = size === 'sm' ? 'h-3 w-3' : 'h-4 w-4';
    
    return (
      <div className="flex items-center gap-0.5">
        {/* Full stars */}
        {[...Array(fullStars)].map((_, i) => (
          <Star
            key={`full-${i}`}
            className={`${starSize} fill-yellow-400 text-yellow-400`}
          />
        ))}
        {/* Half star */}
        {hasHalfStar && (
          <div className="relative">
            <Star className={`${starSize} text-yellow-400`} />
            <div className="absolute inset-0 overflow-hidden" style={{ width: '50%' }}>
              <Star className={`${starSize} fill-yellow-400 text-yellow-400`} />
            </div>
          </div>
        )}
        {/* Empty stars */}
        {[...Array(emptyStars)].map((_, i) => (
          <Star
            key={`empty-${i}`}
            className={`${starSize} text-yellow-400`}
          />
        ))}
      </div>
    );
  };

  const searchPharmacies = async (searchTerm?: string) => {
    const termToSearch = searchTerm || medicamento;
    
    if (!termToSearch.trim()) {
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
    
    // Save to search history - use the full term
    saveToSearchHistory(termToSearch.trim());

    try {
      const { data, error } = await supabase.rpc('buscar_farmacias_proximas', {
        p_latitude: userLocation.lat,
        p_longitude: userLocation.lng,
        p_medicamento: termToSearch,
        p_raio_km: raioKm,
      }) as { data: MedicamentoFarmacia[] | null; error: any };

      if (error) throw error;

      if (data && data.length > 0) {
        // Calculate real route distances for unique pharmacies
        const uniquePharmacies = new Map<string, MedicamentoFarmacia>();
        data.forEach((item) => {
          if (!uniquePharmacies.has(item.farmacia_id)) {
            uniquePharmacies.set(item.farmacia_id, item);
          }
        });

        // Fetch real route distances for each pharmacy - ALWAYS use route distance
        const distancePromises = Array.from(uniquePharmacies.values()).map(async (pharmacy) => {
          try {
            const url = `https://api.mapbox.com/directions/v5/mapbox/walking/${userLocation.lng},${userLocation.lat};${pharmacy.farmacia_longitude},${pharmacy.farmacia_latitude}?access_token=${mapboxToken}`;
            const response = await fetch(url);
            const routeData = await response.json();
            
            if (routeData.routes && routeData.routes.length > 0) {
              const realDistance = routeData.routes[0].distance / 1000; // Real route distance in km
              console.log(`Real route distance for ${pharmacy.farmacia_nome}: ${realDistance.toFixed(2)} km (straight-line was ${pharmacy.distancia_km.toFixed(2)} km)`);
              return { farmacia_id: pharmacy.farmacia_id, distancia_km: realDistance };
            }
            // If no route found, keep Haversine as fallback
            console.warn(`No route found for ${pharmacy.farmacia_nome}, using Haversine: ${pharmacy.distancia_km.toFixed(2)} km`);
            return { farmacia_id: pharmacy.farmacia_id, distancia_km: pharmacy.distancia_km };
          } catch (err) {
            console.error(`Error calculating route distance for ${pharmacy.farmacia_nome}:`, err);
            return { farmacia_id: pharmacy.farmacia_id, distancia_km: pharmacy.distancia_km };
          }
        });

        const realDistances = await Promise.all(distancePromises);
        const distanceMap = new Map(realDistances.map(d => [d.farmacia_id, d.distancia_km]));

        // Fetch pharmacy ratings
        const farmaciaIds = Array.from(uniquePharmacies.keys());
        const ratingsMap = await fetchPharmacyRatings(farmaciaIds);

        // Update medications with real distances and ratings
        const updatedData = data.map(item => ({
          ...item,
          distancia_km: distanceMap.get(item.farmacia_id) || item.distancia_km,
          media_avaliacoes: ratingsMap.get(item.farmacia_id)?.media,
          total_avaliacoes: ratingsMap.get(item.farmacia_id)?.total,
        })).sort((a, b) => a.distancia_km - b.distancia_km); // Re-sort by real distance

        setMedicamentos(updatedData);

        // Clear existing pharmacy markers
        markersRef.current.forEach(marker => marker.remove());
        markersRef.current = [];

        // Group by pharmacy again with updated distances
        const updatedUniquePharmacies = new Map<string, MedicamentoFarmacia>();
        updatedData.forEach((item) => {
          if (!updatedUniquePharmacies.has(item.farmacia_id)) {
            updatedUniquePharmacies.set(item.farmacia_id, item);
          }
        });

        // Add pharmacy markers to map
        updatedUniquePharmacies.forEach((item) => {
          if (item.farmacia_latitude && item.farmacia_longitude && map.current) {
            const marker = new mapboxgl.Marker({ color: '#10b981' })
              .setLngLat([item.farmacia_longitude, item.farmacia_latitude])
              .setPopup(
                new mapboxgl.Popup().setHTML(`
                  <div class="p-2">
                    <p class="font-semibold text-sm">${item.farmacia_nome}</p>
                    <p class="text-xs text-gray-600 mt-1">${item.distancia_km.toFixed(2)} km (via rota)</p>
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
          updatedUniquePharmacies.forEach((item) => {
            if (item.farmacia_latitude && item.farmacia_longitude) {
              bounds.extend([item.farmacia_longitude, item.farmacia_latitude]);
            }
          });
          map.current.fitBounds(bounds, { padding: 50 });
        }

        toast({
          title: 'Busca concluída',
          description: `Encontramos ${updatedData.length} medicamento${updatedData.length > 1 ? 's' : ''}`,
        });
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
                    setIsInputFocused(true);
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
                  onBlur={() => {
                    // Delay to allow click on dropdown items
                    setTimeout(() => setIsInputFocused(false), 200);
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
                {isInputFocused && medicamento && filteredMedicamentos.length > 0 && !searching && (
                  <Card className="absolute top-full left-0 right-0 mt-1 z-50 max-h-[200px] overflow-y-auto shadow-lg bg-background">
                    {filteredMedicamentos.slice(0, 5).map((med, index) => (
                      <div
                        key={`${med.nome}-${index}`}
                        className="p-2 hover:bg-muted cursor-pointer border-b last:border-b-0"
                        onClick={() => {
                          setMedicamento(med.nome);
                          searchPharmacies(med.nome);
                          setIsInputFocused(false);
                        }}
                      >
                        <p className="text-sm font-medium">{med.nome}</p>
                      </div>
                    ))}
                  </Card>
                )}
              </div>
              <Button 
                onClick={() => searchPharmacies()}
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

            {/* Recent Searches Section */}
            {!searching && medicamentos.length === 0 && !medicamento && searchHistory.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <h2 className="text-sm font-semibold text-muted-foreground">Buscas Recentes</h2>
                </div>
                <div className="space-y-2">
                  {searchHistory.map((search, index) => (
                    <Card 
                      key={`recent-${index}`} 
                      className="p-3 hover:shadow-md transition-all cursor-pointer border-l-4 border-l-primary/20 hover:border-l-primary"
                      onClick={() => {
                        setMedicamento(search);
                        setTimeout(() => searchPharmacies(search), 100);
                      }}
                    >
                      <div className="flex justify-between items-center gap-2">
                        <div className="flex-1">
                          <p className="font-medium text-base">{search}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Toque para buscar novamente
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 flex-shrink-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            const newHistory = searchHistory.filter((_, i) => i !== index);
                            setSearchHistory(newHistory);
                            localStorage.setItem('ondtem_search_history', JSON.stringify(newHistory));
                          }}
                        >
                          <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Medications List - Ordered by proximity */}
            {medicamentos.map((item, index) => (
              <Card 
                key={`${item.medicamento_id}-${item.farmacia_id}-${index}`} 
                className={`p-3 space-y-2 hover:shadow-md transition-all cursor-pointer border-l-4 ${
                  selectedMedicamento?.medicamento_id === item.medicamento_id && selectedMedicamento?.farmacia_id === item.farmacia_id
                    ? 'border-l-green-600 bg-green-50' 
                    : 'border-l-green-500 hover:border-l-green-600 bg-green-50/50 hover:bg-green-50'
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
                  <div className="flex flex-col items-end flex-shrink-0">
                    <span className="text-sm font-semibold text-green-600">
                      {item.distancia_km.toFixed(1)} km
                    </span>
                    <span className="text-[10px] text-muted-foreground">via rota</span>
                  </div>
                </div>
                
                <div className="pt-2 border-t border-border space-y-2">
                  <div className="flex items-center gap-1">
                    <MapPin className="h-3 w-3 text-green-600" />
                    <p className="text-xs font-medium text-green-600">
                      {item.farmacia_nome}
                    </p>
                  </div>
                  
                  {/* Price and Rating on same line */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex-1">
                      {item.medicamento_preco && (
                        <p className="text-sm font-semibold text-green-600">
                          MT {item.medicamento_preco.toFixed(2)}
                        </p>
                      )}
                    </div>
                    
                    {/* Rating stars */}
                    {item.media_avaliacoes ? (
                      <div className="flex items-center gap-1">
                        {renderStars(item.media_avaliacoes, 'sm')}
                        <span className="text-xs font-semibold text-yellow-600">
                          {item.media_avaliacoes.toFixed(1)}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          ({item.total_avaliacoes})
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">Sem avaliações</span>
                    )}
                  </div>
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
                      className="flex items-center gap-1 text-green-600 hover:text-green-700 font-medium"
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
            <Card className="absolute top-4 left-1/2 transform -translate-x-1/2 p-2.5 shadow-lg z-10 w-[calc(100%-2rem)] max-w-md">
              <div className="flex items-start gap-2">
                <div className="flex-1 space-y-2">
                  <div>
                    <h3 className="font-semibold text-sm mb-0.5">{selectedMedicamento.medicamento_nome}</h3>
                    <p className="text-xs text-muted-foreground">{selectedMedicamento.farmacia_nome}</p>
                    {selectedMedicamento.media_avaliacoes ? (
                      <div className="flex items-center gap-1 mt-1">
                        {renderStars(selectedMedicamento.media_avaliacoes, 'sm')}
                        <span className="text-xs font-semibold text-yellow-600">
                          {selectedMedicamento.media_avaliacoes.toFixed(1)}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          ({selectedMedicamento.total_avaliacoes})
                        </span>
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground mt-1">Sem avaliações</p>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-xs">
                    <div>
                      <span className="font-medium text-muted-foreground">Distância:</span>
                      <p className="font-semibold">{routeInfo.distance.toFixed(2)} km</p>
                    </div>
                    <div>
                      <span className="font-medium text-muted-foreground">Tempo:</span>
                      <p className="font-semibold">
                        {Math.round(routeInfo.duration)} min {routeInfo.mode === 'walking' ? '🚶' : '🚗'}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-1.5">
                    <Button
                      size="sm"
                      variant={routeMode === 'walking' ? 'default' : 'outline'}
                      onClick={() => showRouteToPharmacy(selectedMedicamento, 'walking')}
                      className="text-xs h-7"
                    >
                      🚶 A pé
                    </Button>
                    <Button
                      size="sm"
                      variant={routeMode === 'driving' ? 'default' : 'outline'}
                      onClick={() => showRouteToPharmacy(selectedMedicamento, 'driving')}
                      className="text-xs h-7"
                    >
                      🚗 Viatura
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 gap-1.5 pt-1.5 border-t border-border">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setShowLeaveReview(true)}
                      className="text-xs h-7"
                    >
                      Deixar Avaliação
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setShowViewReviews(true)}
                      className="text-xs h-7"
                    >
                      Ver Avaliações
                    </Button>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={clearRoute}
                  className="h-5 w-5 p-0 flex-shrink-0"
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

      {/* Review Modals */}
      {selectedMedicamento && (
        <>
          <LeaveReviewModal
            open={showLeaveReview}
            onOpenChange={setShowLeaveReview}
            farmaciaId={selectedMedicamento.farmacia_id}
            farmaciaNome={selectedMedicamento.farmacia_nome}
            onReviewSubmitted={() => {
              setReviewRefreshTrigger(prev => prev + 1);
              // Refresh search results to update ratings
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
    </div>
  );
};

export default Buscar;
