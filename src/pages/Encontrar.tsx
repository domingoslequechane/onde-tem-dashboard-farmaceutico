import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { setOptions, importLibrary } from '@googlemaps/js-api-loader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Search, MapPin, Phone, ArrowLeft, AlertCircle, X, Clock, Star, Navigation } from 'lucide-react';
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
  farmacia_telefone: string | null;
  farmacia_whatsapp: string | null;
  farmacia_latitude: number;
  farmacia_longitude: number;
  farmacia_horario_abertura: string | null;
  farmacia_horario_fechamento: string | null;
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
  const map = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const userMarkerRef = useRef<google.maps.Marker | null>(null);
  const radiusCircleRef = useRef<google.maps.Circle | null>(null);
  const directionsRenderer = useRef<google.maps.DirectionsRenderer | null>(null);
  const directionsService = useRef<google.maps.DirectionsService | null>(null);
  
  const [googleMapsKey, setGoogleMapsKey] = useState('');
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
  const [isNavigating, setIsNavigating] = useState(false);
  const [showArrivalModal, setShowArrivalModal] = useState(false);
  const [walkingDuration, setWalkingDuration] = useState(0);
  const [drivingDuration, setDrivingDuration] = useState(0);
  const [currentInstruction, setCurrentInstruction] = useState<string>('');
  const [nextInstruction, setNextInstruction] = useState<string>('');
  const [distanceToDestination, setDistanceToDestination] = useState<number>(0);
  const [distanceToNextStep, setDistanceToNextStep] = useState<number>(0);
  const [arrivalTime, setArrivalTime] = useState<string>('');
  const [selectedTravelMode, setSelectedTravelMode] = useState<'WALKING' | 'DRIVING'>('WALKING');
  const [medicamentosComprar, setMedicamentosComprar] = useState<string[]>([]);
  const [novoMedicamento, setNovoMedicamento] = useState('');
  const [showAddMedicationModal, setShowAddMedicationModal] = useState(false);
  const navigationWatchId = useRef<number | null>(null);
  const currentRouteSteps = useRef<google.maps.DirectionsStep[]>([]);
  const currentStepIndex = useRef<number>(0);
  const destinationLocation = useRef<{ lat: number; lng: number } | null>(null);
  const lastAnnouncedDistance = useRef<number>(0);
  const hasAnnouncedTurn = useRef<boolean>(false);

  useEffect(() => {
    checkLocationPermission();
    fetchGoogleMapsKey();
    fetchAllMedicamentos();
    loadSearchHistory();
  }, []);

  useEffect(() => {
    if (locationPermission === 'denied') {
      setShowLocationDialog(true);
    } else if (locationPermission === 'prompt') {
      requestGeolocation();
    }
  }, [locationPermission]);

  useEffect(() => {
    if (googleMapsKey && mapContainer.current && !map.current) {
      initializeMap();
    }
  }, [googleMapsKey]);

  // Adjust map zoom when radius changes
  useEffect(() => {
    if (!map.current || !userLocation || !radiusCircleRef.current) return;

    const bounds = new google.maps.LatLngBounds();
    const circleBounds = radiusCircleRef.current.getBounds();
    if (circleBounds) {
      bounds.union(circleBounds);
      map.current.fitBounds(bounds);
    }
  }, [raioKm]);

  const initializeMap = async () => {
    if (!googleMapsKey || !mapContainer.current) return;

    try {
      console.log('Initializing Google Maps with key:', googleMapsKey?.substring(0, 10) + '...');
      
      // Configure Google Maps options
      setOptions({
        key: googleMapsKey,
        v: 'weekly',
      });

      // Load required libraries
      await Promise.all([
        importLibrary('maps'),
        importLibrary('geometry'),
        importLibrary('marker')
      ]);

      console.log('Google Maps libraries loaded successfully');

      // Now google.maps is available globally
      const mapInstance = new google.maps.Map(mapContainer.current, {
        center: { lat: -25.9655, lng: 32.5892 },
        zoom: 13,
        mapTypeId: 'roadmap', // Standard Maps view
        mapTypeControl: true, // Allow switching between map types
        fullscreenControl: true, // Allow fullscreen
        streetViewControl: true, // Allow street view
        zoomControl: true,
        scaleControl: true, // Show scale information
        styles: [
          {
            featureType: 'poi.business',
            stylers: [{ visibility: 'off' }]
          },
          {
            featureType: 'poi.medical',
            stylers: [{ visibility: 'off' }]
          }
        ]
      });

      map.current = mapInstance;
      directionsService.current = new google.maps.DirectionsService();
      directionsRenderer.current = new google.maps.DirectionsRenderer({
        map: mapInstance,
        suppressMarkers: true,
        polylineOptions: {
          strokeColor: '#4F46E5',
          strokeWeight: 6,
          strokeOpacity: 0.8
        }
      });

      console.log('Map initialized successfully');

      if (userLocation) {
        updateMapWithUserLocation(userLocation);
      }

      // Load all pharmacies and display on map
      loadAllPharmacies();
    } catch (error) {
      console.error('Error initializing Google Maps:', error);
      toast({
        title: 'Erro ao carregar mapa',
        description: 'Não foi possível carregar o Google Maps. Verifique sua conexão.',
        variant: 'destructive',
      });
    }
  };

  const updateMapWithUserLocation = (location: { lat: number; lng: number }) => {
    if (!map.current) return;

    // Center map on user location
    map.current.setCenter(location);
    map.current.setZoom(14);

    // Create or update user marker
    if (!userMarkerRef.current) {
      userMarkerRef.current = new google.maps.Marker({
        position: location,
        map: map.current,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 10,
          fillColor: '#4285F4',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 3,
        },
        zIndex: 1000
      });
    } else {
      userMarkerRef.current.setPosition(location);
    }

    updateRadiusCircle(location);
  };

  const loadAllPharmacies = async () => {
    if (!map.current) return;

    try {
      console.log('Loading all pharmacies from database...');
      
      const { data: pharmacies, error } = await supabase
        .from('farmacias')
        .select('id, nome, latitude, longitude, telefone, whatsapp')
        .eq('ativa', true)
        .not('latitude', 'is', null)
        .not('longitude', 'is', null);

      if (error) throw error;

      console.log(`Found ${pharmacies?.length || 0} pharmacies in database`);

      // Clear existing markers
      markersRef.current.forEach(marker => marker.setMap(null));
      markersRef.current = [];

      // Add markers for all pharmacies
      if (pharmacies && pharmacies.length > 0) {
        pharmacies.forEach(pharmacy => {
          const marker = new google.maps.Marker({
            position: {
              lat: Number(pharmacy.latitude),
              lng: Number(pharmacy.longitude)
            },
            map: map.current!,
            icon: {
              url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                <svg xmlns="http://www.w3.org/2000/svg" width="40" height="52" viewBox="0 0 40 52">
                  <path fill="#10b981" stroke="#ffffff" stroke-width="2" d="M20,0 C31,0 40,9 40,20 C40,35 20,52 20,52 C20,52 0,35 0,20 C0,9 9,0 20,0 Z"/>
                  <rect x="13" y="12" width="14" height="16" fill="#ffffff" rx="1"/>
                  <rect x="18" y="14" width="4" height="12" fill="#10b981"/>
                  <rect x="15" y="18" width="10" height="4" fill="#10b981"/>
                </svg>
              `),
              scaledSize: new google.maps.Size(40, 52),
              anchor: new google.maps.Point(20, 52),
            },
            title: pharmacy.nome,
            animation: google.maps.Animation.DROP
          });

          marker.addListener('click', async () => {
            console.log('Pharmacy clicked:', pharmacy.nome);
            
            // Fetch complete pharmacy data and available medications
            try {
              const { data: farmaciaData, error: farmaciaError } = await supabase
                .from('farmacias')
                .select('*')
                .eq('id', pharmacy.id)
                .single();

              if (farmaciaError) throw farmaciaError;

              // Fetch available medications at this pharmacy
              const { data: stockData, error: stockError } = await supabase
                .from('estoque')
                .select(`
                  medicamento_id,
                  preco,
                  medicamentos!inner (
                    id,
                    nome,
                    categoria
                  )
                `)
                .eq('farmacia_id', pharmacy.id)
                .eq('disponivel', true)
                .limit(1);

              if (stockError) throw stockError;

              if (stockData && stockData.length > 0 && userLocation) {
                const medication = stockData[0];
                const distance = calculateDistance(
                  userLocation.lat,
                  userLocation.lng,
                  farmaciaData.latitude,
                  farmaciaData.longitude
                );

                // Fetch reviews
                const { data: reviewsData } = await supabase
                  .from('avaliacoes')
                  .select('avaliacao')
                  .eq('farmacia_id', pharmacy.id);

                let mediaAvaliacoes: number | undefined;
                let totalAvaliacoes: number | undefined;

                if (reviewsData && reviewsData.length > 0) {
                  const sum = reviewsData.reduce((acc, r) => acc + r.avaliacao, 0);
                  mediaAvaliacoes = sum / reviewsData.length;
                  totalAvaliacoes = reviewsData.length;
                }

                const item: MedicamentoFarmacia = {
                  medicamento_id: medication.medicamento_id,
                  medicamento_nome: medication.medicamentos.nome,
                  medicamento_categoria: medication.medicamentos.categoria,
                  medicamento_preco: medication.preco,
                  farmacia_id: farmaciaData.id,
                  farmacia_nome: farmaciaData.nome,
                  farmacia_endereco: `${farmaciaData.bairro || ''}, ${farmaciaData.cidade || ''}`.trim(),
                  farmacia_telefone: farmaciaData.telefone,
                  farmacia_whatsapp: farmaciaData.whatsapp,
                  farmacia_latitude: farmaciaData.latitude,
                  farmacia_longitude: farmaciaData.longitude,
                  farmacia_horario_abertura: farmaciaData.horario_abertura,
                  farmacia_horario_fechamento: farmaciaData.horario_fechamento,
                  distancia_km: distance,
                  media_avaliacoes: mediaAvaliacoes,
                  total_avaliacoes: totalAvaliacoes,
                };

                showRouteToPharmacy(item, 'walking');
              }
            } catch (error) {
              console.error('Error fetching pharmacy details:', error);
              toast({
                title: 'Erro',
                description: 'Não foi possível carregar os detalhes da farmácia',
                variant: 'destructive',
              });
            }
          });

          markersRef.current.push(marker);
        });

        console.log(`Added ${pharmacies.length} pharmacy markers to map`);
      }
    } catch (error) {
      console.error('Error loading pharmacies:', error);
      toast({
        title: 'Erro ao carregar farmácias',
        description: 'Não foi possível carregar as farmácias no mapa.',
        variant: 'destructive',
      });
    }
  };

  const updateRadiusCircle = (location: { lat: number; lng: number }) => {
    if (!map.current) return;

    // Remove existing circle
    if (radiusCircleRef.current) {
      radiusCircleRef.current.setMap(null);
    }

    // Create new circle with green color
    radiusCircleRef.current = new google.maps.Circle({
      strokeColor: '#10b981',
      strokeOpacity: 0.8,
      strokeWeight: 3,
      fillColor: '#10b981',
      fillOpacity: 0.15,
      map: map.current,
      center: location,
      radius: raioKm * 1000
    });

    // Fit bounds to circle with animation
    const bounds = radiusCircleRef.current.getBounds();
    if (bounds) {
      map.current.fitBounds(bounds);
    }
  };

  const fetchGoogleMapsKey = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('get-google-maps-key');
      if (error) throw error;
      setGoogleMapsKey(data.key);
    } catch (error) {
      console.error('Error fetching Google Maps key:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar a chave do Google Maps',
        variant: 'destructive',
      });
    } finally {
      setLoadingToken(false);
    }
  };

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

  const removeFromSearchHistory = (searchTerm: string) => {
    try {
      const history = searchHistory.filter(item => item !== searchTerm);
      setSearchHistory(history);
      localStorage.setItem('ondtem_search_history', JSON.stringify(history));
    } catch (error) {
      console.error('Error removing from search history:', error);
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

  const checkLocationPermission = async () => {
    if ('permissions' in navigator) {
      try {
        const result = await navigator.permissions.query({ name: 'geolocation' });
        setLocationPermission(result.state);
        
        result.addEventListener('change', () => {
          setLocationPermission(result.state);
        });
      } catch (error) {
        console.error('Error checking location permission:', error);
        setLocationPermission('prompt');
      }
    } else {
      setLocationPermission('prompt');
    }
  };

  const requestGeolocation = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setUserLocation(newLocation);
          setLocationPermission('granted');
          
          if (map.current) {
            updateMapWithUserLocation(newLocation);
          }
        },
        (error) => {
          console.error('Error getting location:', error);
          setLocationPermission('denied');
          setShowLocationDialog(true);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    }
  };

  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const from = new google.maps.LatLng(lat1, lng1);
    const to = new google.maps.LatLng(lat2, lng2);
    return google.maps.geometry.spherical.computeDistanceBetween(from, to) / 1000; // Convert to km
  };

  const handleBuscar = async () => {
    if (!medicamento.trim() || !userLocation) {
      toast({
        title: 'Atenção',
        description: 'Por favor, insira o nome do medicamento e permita o acesso à localização',
        variant: 'destructive',
      });
      return;
    }

    setSearching(true);
    saveToSearchHistory(medicamento);

    try {
      // Clear existing markers
      markersRef.current.forEach(marker => marker.setMap(null));
      markersRef.current = [];

      // Fetch medications matching the search
      const { data: medData, error: medError } = await supabase
        .from('medicamentos')
        .select('id, nome')
        .ilike('nome', `%${medicamento}%`);

      if (medError) throw medError;

      if (!medData || medData.length === 0) {
        toast({
          title: 'Medicamento não encontrado',
          description: 'Não foram encontradas farmácias com este medicamento',
          variant: 'destructive',
        });
        setMedicamentos([]);
        setSearching(false);
        return;
      }

      // Fetch stock information with pharmacy details
      const medicamentoIds = medData.map(m => m.id);
      
      const { data: stockData, error: stockError } = await supabase
        .from('estoque')
        .select(`
          medicamento_id,
          preco,
          farmacias!inner (
            id,
            nome,
            latitude,
            longitude,
            telefone,
            whatsapp,
            horario_abertura,
            horario_fechamento,
            bairro,
            cidade
          ),
          medicamentos!inner (
            id,
            nome,
            categoria
          )
        `)
        .in('medicamento_id', medicamentoIds)
        .eq('disponivel', true);

      if (stockError) throw stockError;

      // Process and calculate distances
      const results: MedicamentoFarmacia[] = [];
      
      stockData?.forEach((item: any) => {
        const farmacia = item.farmacias;
        if (!farmacia.latitude || !farmacia.longitude) return;

        const distance = calculateDistance(
          userLocation.lat,
          userLocation.lng,
          farmacia.latitude,
          farmacia.longitude
        );

        if (distance <= raioKm) {
          results.push({
            medicamento_id: item.medicamento_id,
            medicamento_nome: item.medicamentos.nome,
            medicamento_categoria: item.medicamentos.categoria,
            medicamento_preco: item.preco,
            farmacia_id: farmacia.id,
            farmacia_nome: farmacia.nome,
            farmacia_endereco: `${farmacia.bairro || ''}, ${farmacia.cidade || ''}`.trim(),
            farmacia_telefone: farmacia.telefone,
            farmacia_whatsapp: farmacia.whatsapp,
            farmacia_latitude: farmacia.latitude,
            farmacia_longitude: farmacia.longitude,
            farmacia_horario_abertura: farmacia.horario_abertura,
            farmacia_horario_fechamento: farmacia.horario_fechamento,
            distancia_km: distance,
          });
        }
      });

      // Fetch reviews for pharmacies
      const farmaciaIds = results.map(r => r.farmacia_id);
      if (farmaciaIds.length > 0) {
        const { data: reviewsData } = await supabase
          .from('avaliacoes')
          .select('farmacia_id, avaliacao')
          .in('farmacia_id', farmaciaIds);

        if (reviewsData) {
          const reviewsByFarmacia: Record<string, { sum: number; count: number }> = {};
          
          reviewsData.forEach(review => {
            if (!reviewsByFarmacia[review.farmacia_id]) {
              reviewsByFarmacia[review.farmacia_id] = { sum: 0, count: 0 };
            }
            reviewsByFarmacia[review.farmacia_id].sum += review.avaliacao;
            reviewsByFarmacia[review.farmacia_id].count += 1;
          });

          results.forEach(result => {
            const reviewInfo = reviewsByFarmacia[result.farmacia_id];
            if (reviewInfo) {
              result.media_avaliacoes = reviewInfo.sum / reviewInfo.count;
              result.total_avaliacoes = reviewInfo.count;
            }
          });
        }
      }

      // Sort by distance
      results.sort((a, b) => a.distancia_km - b.distancia_km);

      setMedicamentos(results);

      // Add pharmacy markers to map with custom icons
      if (map.current) {
        results.forEach(item => {
          const marker = new google.maps.Marker({
            position: {
              lat: item.farmacia_latitude,
              lng: item.farmacia_longitude
            },
            map: map.current!,
            icon: {
              url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                <svg xmlns="http://www.w3.org/2000/svg" width="40" height="52" viewBox="0 0 40 52">
                  <path fill="#26a74d" stroke="#ffffff" stroke-width="2" d="M20,0 C31,0 40,9 40,20 C40,35 20,52 20,52 C20,52 0,35 0,20 C0,9 9,0 20,0 Z"/>
                  <rect x="13" y="12" width="14" height="16" fill="#ffffff" rx="1"/>
                  <rect x="18" y="14" width="4" height="12" fill="#26a74d"/>
                  <rect x="15" y="18" width="10" height="4" fill="#26a74d"/>
                </svg>
              `),
              scaledSize: new google.maps.Size(40, 52),
              anchor: new google.maps.Point(20, 52),
            },
            title: item.farmacia_nome,
            animation: google.maps.Animation.DROP
          });

          marker.addListener('click', () => {
            showRouteToPharmacy(item, 'walking');
          });

          markersRef.current.push(marker);
        });
        
        console.log(`Added ${results.length} pharmacy markers to map`);
      }

      if (results.length === 0) {
        toast({
          title: 'Nenhuma farmácia encontrada',
          description: `Não há farmácias com ${medicamento} em um raio de ${raioKm}km`,
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error searching medications:', error);
      toast({
        title: 'Erro na busca',
        description: 'Ocorreu um erro ao buscar medicamentos',
        variant: 'destructive',
      });
    } finally {
      setSearching(false);
    }
  };

  const showRouteToPharmacy = async (item: MedicamentoFarmacia, mode: 'walking' | 'driving' = 'walking') => {
    if (!userLocation || !directionsService.current || !directionsRenderer.current) return;

    try {
      // Fetch complete pharmacy data
      const { data: farmaciaData, error: farmaciaError } = await supabase
        .from('farmacias')
        .select('*')
        .eq('id', item.farmacia_id)
        .single();

      if (farmaciaError) throw farmaciaError;

      const origin = new google.maps.LatLng(userLocation.lat, userLocation.lng);
      const destination = new google.maps.LatLng(item.farmacia_latitude, item.farmacia_longitude);

      // Get both walking and driving routes
      const walkingRequest: google.maps.DirectionsRequest = {
        origin: origin,
        destination: destination,
        travelMode: google.maps.TravelMode.WALKING
      };

      const drivingRequest: google.maps.DirectionsRequest = {
        origin: origin,
        destination: destination,
        travelMode: google.maps.TravelMode.DRIVING
      };

      const [walkingResult, drivingResult] = await Promise.all([
        new Promise<google.maps.DirectionsResult>((resolve, reject) => {
          directionsService.current!.route(walkingRequest, (result, status) => {
            if (status === 'OK' && result) resolve(result);
            else reject(status);
          });
        }),
        new Promise<google.maps.DirectionsResult>((resolve, reject) => {
          directionsService.current!.route(drivingRequest, (result, status) => {
            if (status === 'OK' && result) resolve(result);
            else reject(status);
          });
        })
      ]);

      if (walkingResult.routes[0]?.legs[0]?.duration) {
        setWalkingDuration(walkingResult.routes[0].legs[0].duration.value / 60);
      }

      if (drivingResult.routes[0]?.legs[0]?.duration) {
        setDrivingDuration(drivingResult.routes[0].legs[0].duration.value / 60);
      }

      // Display the selected mode route
      const request: google.maps.DirectionsRequest = {
        origin: origin,
        destination: destination,
        travelMode: mode === 'walking' ? google.maps.TravelMode.WALKING : google.maps.TravelMode.DRIVING
      };

      directionsService.current.route(request, (result, status) => {
        if (status === 'OK' && result && directionsRenderer.current) {
          // Set route color based on mode
          directionsRenderer.current.setOptions({
            polylineOptions: {
              strokeColor: mode === 'walking' ? '#4F46E5' : '#10b981',
              strokeWeight: 6,
              strokeOpacity: 0.8
            }
          });
          directionsRenderer.current.setDirections(result);

          const route = result.routes[0];
          const leg = route.legs[0];

          if (leg) {
            const realDistance = leg.distance?.value ? leg.distance.value / 1000 : item.distancia_km;

            setRouteInfo({
              distance: realDistance,
              duration: leg.duration?.value ? leg.duration.value / 60 : 0,
              mode: mode,
            });

            setSelectedMedicamento({
              ...item,
              distancia_km: realDistance,
              farmacia_telefone: farmaciaData.telefone,
              farmacia_whatsapp: farmaciaData.whatsapp,
              farmacia_horario_abertura: farmaciaData.horario_abertura,
              farmacia_horario_fechamento: farmaciaData.horario_fechamento,
            });
            setRouteMode(mode);
          }
        }
      });
    } catch (error) {
      console.error('Error fetching route:', error);
      toast({
        title: 'Erro ao calcular rota',
        description: 'Não foi possível calcular a rota para esta farmácia',
        variant: 'destructive',
      });
    }
  };

  const isPharmacyOpen = () => {
    if (!selectedMedicamento?.farmacia_horario_abertura || !selectedMedicamento?.farmacia_horario_fechamento) {
      return { isOpen: true, label: 'Horário não definido' };
    }

    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    
    const [openHour, openMin] = selectedMedicamento.farmacia_horario_abertura.split(':').map(Number);
    const [closeHour, closeMin] = selectedMedicamento.farmacia_horario_fechamento.split(':').map(Number);
    
    const openTime = openHour * 60 + openMin;
    const closeTime = closeHour * 60 + closeMin;
    
    const isOpen = currentTime >= openTime && currentTime <= closeTime;
    
    return {
      isOpen,
      label: isOpen ? 'Aberto' : 'Fechado'
    };
  };

  const speakText = (text: string) => {
    try {
      if ('speechSynthesis' in window) {
        // Cancel any ongoing speech
        window.speechSynthesis.cancel();
        
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'pt-BR';
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        utterance.volume = 1.0;
        
        window.speechSynthesis.speak(utterance);
      }
    } catch (error) {
      console.error('Error with speech synthesis:', error);
    }
  };

  const playNavigationSound = (type: 'start' | 'turn' | 'arrival') => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      if (type === 'start') {
        oscillator.frequency.setValueAtTime(400, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(600, audioContext.currentTime + 0.2);
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.3);
      } else if (type === 'turn') {
        oscillator.frequency.setValueAtTime(600, audioContext.currentTime);
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15);
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.15);
      } else if (type === 'arrival') {
        oscillator.frequency.setValueAtTime(500, audioContext.currentTime);
        oscillator.frequency.setValueAtTime(700, audioContext.currentTime + 0.15);
        oscillator.frequency.setValueAtTime(500, audioContext.currentTime + 0.3);
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.5);
      }
    } catch (error) {
      console.error('Error playing sound:', error);
    }
  };

  const getTurnDirection = (instruction: string): 'esquerda' | 'direita' | null => {
    const lowerInstruction = instruction.toLowerCase();
    if (lowerInstruction.includes('esquerda') || lowerInstruction.includes('left')) {
      return 'esquerda';
    } else if (lowerInstruction.includes('direita') || lowerInstruction.includes('right')) {
      return 'direita';
    }
    return null;
  };

  const startNavigationWithMode = async (mode: 'WALKING' | 'DRIVING') => {
    if (!selectedMedicamento || !userLocation || !directionsService.current || !map.current) return;
    
    // Add current medication to list if not already there
    if (selectedMedicamento && !medicamentosComprar.includes(selectedMedicamento.medicamento_nome)) {
      setMedicamentosComprar([...medicamentosComprar, selectedMedicamento.medicamento_nome]);
    }
    
    setSelectedTravelMode(mode);
    setIsNavigating(true);
    setCurrentInstruction('Preparando navegação...');
    setNextInstruction('');
    destinationLocation.current = {
      lat: selectedMedicamento.farmacia_latitude,
      lng: selectedMedicamento.farmacia_longitude
    };
    playNavigationSound('start');

    try {
      const request: google.maps.DirectionsRequest = {
        origin: new google.maps.LatLng(userLocation.lat, userLocation.lng),
        destination: new google.maps.LatLng(selectedMedicamento.farmacia_latitude, selectedMedicamento.farmacia_longitude),
        travelMode: mode === 'WALKING' ? google.maps.TravelMode.WALKING : google.maps.TravelMode.DRIVING,
        provideRouteAlternatives: false
      };

      directionsService.current.route(request, (result, status) => {
        if (status === 'OK' && result && directionsRenderer.current && map.current) {
          // Configure renderer for navigation mode with colored route based on mode
          directionsRenderer.current.setOptions({
            suppressMarkers: true,
            polylineOptions: {
              strokeColor: mode === 'WALKING' ? '#4F46E5' : '#10b981',
              strokeWeight: 8,
              strokeOpacity: 0.9
            }
          });
          directionsRenderer.current.setDirections(result);

          const route = result.routes[0];
          currentRouteSteps.current = route.legs[0]?.steps || [];
          currentStepIndex.current = 0;

          if (currentRouteSteps.current.length > 0) {
            const firstStep = currentRouteSteps.current[0];
            setCurrentInstruction(firstStep.instructions?.replace(/<[^>]*>/g, '') || 'Siga em frente');
            
            // Set next instruction
            if (currentRouteSteps.current.length > 1) {
              const secondStep = currentRouteSteps.current[1];
              setNextInstruction(secondStep.instructions?.replace(/<[^>]*>/g, '') || '');
            }
            
            // Calculate distance to first step
            if (firstStep.distance) {
              setDistanceToNextStep(firstStep.distance.value);
            }
          }

          // Calculate arrival time
          if (route.legs[0]?.duration) {
            const arrivalDate = new Date(Date.now() + route.legs[0].duration.value * 1000);
            setArrivalTime(arrivalDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));
          }

          // Set navigation view - tilted, zoomed in, and position destination at top of screen
          map.current.setZoom(18);
          map.current.setTilt(45);
          
          // Calculate bounds to position destination at top and user at bottom
          const bounds = new google.maps.LatLngBounds();
          bounds.extend(userLocation);
          bounds.extend(new google.maps.LatLng(
            selectedMedicamento.farmacia_latitude,
            selectedMedicamento.farmacia_longitude
          ));
          
          // Fit bounds with padding to position destination at top
          map.current.fitBounds(bounds, {
            top: 100,    // Destination near top
            bottom: 400, // User near bottom
            left: 50,
            right: 50
          });

          // Calculate initial distance to destination
          const initialDist = calculateDistance(
            userLocation.lat,
            userLocation.lng,
            selectedMedicamento.farmacia_latitude,
            selectedMedicamento.farmacia_longitude
          );
          setDistanceToDestination(initialDist);

          // Start real-time tracking with high precision
          let lastUpdateTime = Date.now();
          let lastPosition = { ...userLocation };

          navigationWatchId.current = navigator.geolocation.watchPosition(
            (position) => {
              const now = Date.now();
              const newPos = {
                lat: position.coords.latitude,
                lng: position.coords.longitude
              };

              // Throttle updates - update every second or every 3 meters
              const timeSinceLastUpdate = now - lastUpdateTime;
              const distanceMoved = calculateDistance(lastPosition.lat, lastPosition.lng, newPos.lat, newPos.lng) * 1000;

              if (timeSinceLastUpdate >= 1000 || distanceMoved >= 3) {
                setUserLocation(newPos);
                lastUpdateTime = now;
                lastPosition = newPos;

                // Update user marker position
                if (userMarkerRef.current) {
                  userMarkerRef.current.setPosition(newPos);
                }

                // Smoothly pan map to follow user
                if (map.current) {
                  map.current.panTo(newPos);
                  
                  // Update heading/bearing if available
                  if (position.coords.heading !== null && position.coords.heading !== undefined) {
                    map.current.setHeading(position.coords.heading);
                  }
                }

                // Calculate distance to destination
                if (destinationLocation.current) {
                  const distToDest = calculateDistance(
                    newPos.lat,
                    newPos.lng,
                    destinationLocation.current.lat,
                    destinationLocation.current.lng
                  );
                  setDistanceToDestination(distToDest);

                  // Check for arrival (within 30 meters)
                  if (distToDest < 0.03) {
                    stopNavigation();
                    playNavigationSound('arrival');
                    speakText('Você chegou ao destino');
                    setShowArrivalModal(true);
                    return;
                  }
                }

                // Update current step and instruction
                if (currentRouteSteps.current.length > 0 && currentStepIndex.current < currentRouteSteps.current.length) {
                  const currentStep = currentRouteSteps.current[currentStepIndex.current];
                  const stepEndLocation = currentStep.end_location;
                  
                  if (stepEndLocation) {
                    // Calculate distance to end of current step
                    const distToStepEnd = calculateDistance(
                      newPos.lat,
                      newPos.lng,
                      stepEndLocation.lat(),
                      stepEndLocation.lng()
                    );
                    
                    const distToStepMeters = distToStepEnd * 1000;
                    setDistanceToNextStep(distToStepMeters);

                    // Announce upcoming turn at 100m and 50m
                    const nextStep = currentRouteSteps.current[currentStepIndex.current + 1];
                    if (nextStep && distToStepMeters > 20) {
                      const turnDirection = getTurnDirection(nextStep.instructions || '');
                      
                      if (turnDirection) {
                        // Announce at 100 meters
                        if (distToStepMeters <= 100 && distToStepMeters > 50 && lastAnnouncedDistance.current !== 100) {
                          speakText(`Curve à ${turnDirection} em ${Math.round(distToStepMeters)} metros`);
                          lastAnnouncedDistance.current = 100;
                        }
                        // Announce at 50 meters
                        else if (distToStepMeters <= 50 && distToStepMeters > 20 && lastAnnouncedDistance.current !== 50) {
                          speakText(`Curve à ${turnDirection} em ${Math.round(distToStepMeters)} metros`);
                          lastAnnouncedDistance.current = 50;
                        }
                      }
                    }

                    // If close to step end, advance to next step
                    if (distToStepEnd < 0.02) { // 20 meters
                      if (currentStepIndex.current < currentRouteSteps.current.length - 1) {
                        currentStepIndex.current++;
                        const nextStep = currentRouteSteps.current[currentStepIndex.current];
                        if (nextStep) {
                          setCurrentInstruction(nextStep.instructions?.replace(/<[^>]*>/g, '') || 'Siga em frente');
                          playNavigationSound('turn');
                          
                          // Reset announcement tracking for new step
                          lastAnnouncedDistance.current = 0;
                          
                          // Update next instruction
                          if (currentStepIndex.current < currentRouteSteps.current.length - 1) {
                            const followingStep = currentRouteSteps.current[currentStepIndex.current + 1];
                            setNextInstruction(followingStep.instructions?.replace(/<[^>]*>/g, '') || '');
                          } else {
                            setNextInstruction('');
                          }
                          
                          if (nextStep.distance) {
                            setDistanceToNextStep(nextStep.distance.value);
                          }
                        }
                      }
                    }
                  }
                }
              }
            },
            (error) => {
              console.error('Navigation error:', error);
              toast({
                title: 'Erro de Localização',
                description: 'Não foi possível obter sua localização. Verifique as permissões.',
                variant: 'destructive',
              });
            },
            {
              enableHighAccuracy: true,
              maximumAge: 0,
              timeout: 10000
            }
          );
        } else {
          console.error('Directions request failed:', status);
          toast({
            title: 'Erro na Rota',
            description: 'Não foi possível calcular a rota. Tente novamente.',
            variant: 'destructive',
          });
          setIsNavigating(false);
        }
      });
    } catch (error) {
      console.error('Error starting navigation:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível iniciar a navegação',
        variant: 'destructive',
      });
      setIsNavigating(false);
    }
  };

  const stopNavigation = () => {
    if (navigationWatchId.current !== null) {
      navigator.geolocation.clearWatch(navigationWatchId.current);
      navigationWatchId.current = null;
    }
    
    // Cancel any ongoing speech
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    
    setIsNavigating(false);
    setCurrentInstruction('');
    setNextInstruction('');
    setDistanceToNextStep(0);
    setDistanceToDestination(0);
    setArrivalTime('');
    currentStepIndex.current = 0;
    currentRouteSteps.current = [];
    destinationLocation.current = null;
    lastAnnouncedDistance.current = 0;
    hasAnnouncedTurn.current = false;
    
    if (map.current) {
      map.current.setTilt(0);
      map.current.setHeading(0);
      map.current.setZoom(14);
    }
  };

  const recenterMap = () => {
    if (map.current && userLocation) {
      map.current.setCenter(userLocation);
      map.current.setZoom(18);
    }
  };

  const handleStartNavigationWithMode = (mode: 'WALKING' | 'DRIVING') => {
    startNavigationWithMode(mode);
  };

  const handleDeselectPharmacy = () => {
    setSelectedMedicamento(null);
    setRouteInfo(null);
    if (directionsRenderer.current) {
      directionsRenderer.current.setDirections({ routes: [] } as any);
    }
    // Reload all pharmacies on map
    loadAllPharmacies();
  };

  const handleAddMedicamento = () => {
    if (novoMedicamento.trim() && !medicamentosComprar.includes(novoMedicamento.trim())) {
      setMedicamentosComprar([...medicamentosComprar, novoMedicamento.trim()]);
      setNovoMedicamento('');
    }
  };

  const handleRemoveMedicamento = (med: string) => {
    setMedicamentosComprar(medicamentosComprar.filter(m => m !== med));
  };

  const handleCallPharmacy = () => {
    if (selectedMedicamento?.farmacia_telefone) {
      window.location.href = `tel:${selectedMedicamento.farmacia_telefone}`;
    }
  };

  const handleCloseArrivalModal = () => {
    setShowArrivalModal(false);
    setSelectedMedicamento(null);
    if (directionsRenderer.current) {
      directionsRenderer.current.setDirections({ routes: [] } as any);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden">
      {/* Header - Hidden during navigation on mobile */}
      <div className={`${isNavigating ? 'hidden md:flex' : 'flex'} items-center justify-between p-3 md:p-4 bg-card border-b border-border shadow-sm transition-all duration-300`}>
        <div className="flex items-center gap-2 md:gap-3 min-w-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/')}
            className="flex-shrink-0 h-9 w-9 md:h-10 md:w-10"
          >
            <ArrowLeft className="h-5 w-5 md:h-6 md:w-6" />
          </Button>
          <img src={logo} alt="ONDTem" className="h-8 md:h-10 flex-shrink-0" />
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="flex items-center gap-1 md:gap-2">
            {[1, 2, 4, 8, 16].map((km) => (
              <Button
                key={km}
                variant={raioKm === km ? 'default' : 'outline'}
                size="sm"
                onClick={() => setRaioKm(km)}
                className="h-8 px-2 md:px-3 text-xs md:text-sm font-medium transition-all duration-200"
              >
                {km}km
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Map Container */}
        <div ref={mapContainer} className="absolute inset-0 w-full h-full" />

        {/* Search Box - Hidden during navigation on mobile/tablet */}
        {!isNavigating && (
          <div className="absolute top-4 left-4 right-4 md:left-auto md:w-96 bg-card rounded-lg shadow-lg p-3 md:p-4 z-10 transition-all duration-300">
            <h2 className="text-xl md:text-2xl font-bold mb-3 md:mb-4 text-primary">Encontre ONDTem!</h2>
            
            <div className="relative mb-3">
              <Input
                type="text"
                placeholder="Digite o medicamento..."
                value={medicamento}
                onChange={(e) => setMedicamento(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleBuscar()}
                onFocus={() => setIsInputFocused(true)}
                onBlur={() => setTimeout(() => setIsInputFocused(false), 200)}
                className="pr-10 text-base md:text-sm"
              />
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />

              {/* Autocomplete Suggestions */}
              {isInputFocused && medicamento.trim().length > 0 && filteredMedicamentos.length > 0 && (
                <Card className="absolute top-full left-0 right-0 mt-2 max-h-60 overflow-y-auto z-20 animate-in fade-in slide-in-from-top-2">
                  {filteredMedicamentos.slice(0, 5).map((med) => (
                    <div
                      key={med.id}
                      className="p-3 hover:bg-accent cursor-pointer transition-colors"
                      onClick={() => {
                        setMedicamento(med.nome);
                        setIsInputFocused(false);
                        setTimeout(() => handleBuscar(), 100);
                      }}
                    >
                      <div className="font-medium text-sm md:text-base">{med.nome}</div>
                      {med.categoria && (
                        <div className="text-xs text-muted-foreground mt-1">{med.categoria}</div>
                      )}
                    </div>
                  ))}
                </Card>
              )}
            </div>

            <div className="flex gap-2">
              <Button 
                onClick={handleBuscar} 
                disabled={searching || !userLocation}
                className="flex-1 text-base md:text-sm h-10 md:h-9"
              >
                {searching ? 'Buscando...' : 'Buscar'}
              </Button>
              <Button 
                onClick={() => setShowAddMedicationModal(true)}
                variant="outline"
                className="text-base md:text-sm h-10 md:h-9 px-3"
              >
                + Medicamentos
              </Button>
            </div>

            {/* Search Results */}
            {medicamentos.length > 0 && (
              <div className="mt-4 max-h-80 overflow-y-auto space-y-2">
                {medicamentos.map((item, index) => (
                  <Card
                    key={`${item.farmacia_id}-${index}`}
                    className="p-3 cursor-pointer hover:shadow-md transition-all duration-200 bg-green-50 border-l-4 border-l-green-500"
                    onClick={() => showRouteToPharmacy(item, 'walking')}
                  >
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-base text-foreground truncate">{item.medicamento_nome}</h3>
                        <p className="text-sm text-muted-foreground truncate">{item.farmacia_nome}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1 flex-shrink-0">
                        <span className="text-lg font-bold text-green-600">{item.medicamento_preco.toFixed(2)} MT</span>
                        <span className="text-sm text-green-600 font-medium">{item.distancia_km.toFixed(1)}km</span>
                      </div>
                    </div>
                    {item.medicamento_categoria && (
                      <span className="inline-block mt-2 px-2 py-1 text-xs bg-accent text-accent-foreground rounded-md">
                        {item.medicamento_categoria}
                      </span>
                    )}
                    {item.media_avaliacoes !== undefined && (
                      <div className="flex items-center gap-1 mt-2">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm font-medium">{item.media_avaliacoes.toFixed(1)}</span>
                        <span className="text-xs text-muted-foreground">({item.total_avaliacoes})</span>
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            )}

            {/* Recent Searches */}
            {searchHistory.length > 0 && medicamento.trim().length === 0 && medicamentos.length === 0 && (
              <div className="mt-4">
                <h3 className="text-sm font-semibold mb-2 text-muted-foreground">Buscas Recentes</h3>
                <div className="space-y-1">
                  {searchHistory.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 hover:bg-accent rounded-md cursor-pointer group transition-colors"
                    >
                      <span
                        className="flex-1 text-sm"
                        onClick={() => {
                          setMedicamento(item);
                          setTimeout(() => handleBuscar(), 100);
                        }}
                      >
                        {item}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="opacity-0 group-hover:opacity-100 transition-opacity h-6 px-2 text-xs"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFromSearchHistory(item);
                        }}
                      >
                        Remover
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Pharmacy Info Card - Hidden during navigation */}
        {selectedMedicamento && !isNavigating && (
          <Card className="absolute bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-card p-4 md:p-5 shadow-xl z-10 animate-in slide-in-from-bottom-5 duration-300">
            <div className="space-y-3">
              {/* Close/Hide Button */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <h3 className="text-lg md:text-xl font-bold text-primary">{selectedMedicamento.medicamento_nome}</h3>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDeselectPharmacy}
                  className="h-8 px-2 hover:bg-accent"
                >
                  Ocultar
                </Button>
              </div>

              {/* Pharmacy Name with Border */}
              <div className="border-l-4 border-l-green-500 pl-3">
                <p className="text-base md:text-lg font-semibold text-foreground">{selectedMedicamento.farmacia_nome}</p>
              </div>

              {/* Star Rating */}
              {selectedMedicamento.media_avaliacoes !== undefined && (
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-6 w-6 ${
                          i < Math.round(selectedMedicamento.media_avaliacoes!)
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-xl font-bold">{selectedMedicamento.media_avaliacoes.toFixed(1)}</span>
                  <span className="text-sm text-muted-foreground">({selectedMedicamento.total_avaliacoes})</span>
                </div>
              )}

              {/* Operating Hours */}
              {(() => {
                const { isOpen, label } = isPharmacyOpen();
                return (
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-muted-foreground" />
                    <span className={`text-base font-semibold ${isOpen ? 'text-green-600' : 'text-red-600'}`}>
                      {label}
                    </span>
                  </div>
                );
              })()}

              {/* Distance and Duration */}
              {routeInfo && (
                <div className="flex items-center justify-between text-sm border-t border-border pt-3">
                  <span className="font-medium">{routeInfo.distance.toFixed(1)} km</span>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1">
                      <span className="text-muted-foreground">🚶</span>
                      <span className="font-bold">{walkingDuration.toFixed(0)} min</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-muted-foreground">🚗</span>
                      <span className="font-bold">{drivingDuration.toFixed(0)} min</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Travel Mode Selection Buttons */}
              <div className="pt-2 border-t border-border">
                <label className="text-sm font-semibold mb-2 block text-muted-foreground">Como vai se dirigir?</label>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 h-10"
                    onClick={() => handleStartNavigationWithMode('WALKING')}
                  >
                    <span className="text-lg mr-2">🚶</span>
                    A pé
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 h-10"
                    onClick={() => handleStartNavigationWithMode('DRIVING')}
                  >
                    <span className="text-lg mr-2">🚗</span>
                    Veículo
                  </Button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-3 gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowLeaveReview(true)}
                >
                  Avaliar
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowViewReviews(true)}
                >
                  Avaliações
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCallPharmacy}
                  disabled={!selectedMedicamento?.farmacia_telefone}
                >
                  <Phone className="h-4 w-4 mr-1" />
                  Ligar
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Navigation UI - Google Maps style */}
        {isNavigating && (
          <>
            {/* Trip Info Card - Top */}
            <Card className="absolute top-4 left-4 right-4 md:left-1/2 md:-translate-x-1/2 md:max-w-lg bg-card p-3 shadow-xl z-30 animate-in fade-in slide-in-from-top-2 rounded-lg">
              <div className="space-y-2 text-sm">
                <div className="font-semibold text-primary">A comprar:</div>
                <div className="flex flex-wrap gap-1">
                  {medicamentosComprar.map((med, idx) => (
                    <span key={idx} className="inline-block px-2 py-1 bg-primary/10 text-primary rounded-md text-xs">
                      {med}
                    </span>
                  ))}
                </div>
                <div className="pt-1 border-t border-border">
                  <span className="font-semibold text-foreground">Destino: </span>
                  <span className="text-muted-foreground">{selectedMedicamento?.farmacia_nome}</span>
                </div>
              </div>
            </Card>

            {/* Navigation Instructions Card */}
            <Card className="absolute top-28 left-4 right-4 md:left-1/2 md:-translate-x-1/2 md:max-w-lg bg-green-700 text-white p-4 shadow-xl z-20 animate-in fade-in slide-in-from-top-2 rounded-lg">
              <div className="space-y-2">
                {/* Current Direction */}
                <div className="flex items-start gap-3">
                  <div className="text-4xl mt-1">↑</div>
                  <div className="flex-1">
                    <div className="text-2xl font-bold leading-tight">{currentInstruction}</div>
                  </div>
                </div>
                
                {/* Next Direction */}
                {nextInstruction && (
                  <div className="flex items-center gap-2 pt-2 border-t border-white/20">
                    <span className="text-sm opacity-80">Depois</span>
                    <span className="text-sm">↪</span>
                    <span className="text-sm opacity-90">{nextInstruction}</span>
                  </div>
                )}
              </div>
            </Card>

            {/* Control Buttons - Right side */}
            <div className="absolute right-4 bottom-40 flex flex-col gap-3 z-30">
              {/* Recenter Button */}
              <Button
                size="icon"
                variant="secondary"
                className="h-14 w-14 rounded-full shadow-lg bg-white hover:bg-gray-100"
                onClick={recenterMap}
              >
                <MapPin className="h-6 w-6 text-primary" />
              </Button>
            </div>

            {/* Navigation Footer - Bottom */}
            <Card className="absolute bottom-0 left-0 right-0 bg-white border-t-2 border-gray-200 p-4 shadow-2xl z-30 rounded-t-2xl">
              <div className="flex items-center justify-between">
                {/* Close Button with Text */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={stopNavigation}
                  className="text-sm font-medium"
                >
                  Fechar
                </Button>

                {/* Travel Time and Distance */}
                <div className="flex flex-col items-center">
                  <div className="flex items-center gap-2">
                    <span className="text-3xl font-bold">{Math.round(distanceToDestination * 1000 / (selectedTravelMode === 'WALKING' ? 80 : 800))} min</span>
                    <span className="text-xl">{selectedTravelMode === 'WALKING' ? '🚶' : '🚗'}</span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {Math.round(distanceToDestination * 1000)} m • {arrivalTime}
                  </div>
                </div>

                {/* Empty space for symmetry */}
                <div className="w-16"></div>
              </div>
            </Card>
          </>
        )}
      </div>

      {/* Footer - Hidden during navigation on mobile */}
      <footer className={`${isNavigating ? 'hidden md:block' : 'block'} bg-card border-t border-border py-3 px-4 text-center text-xs md:text-sm text-muted-foreground transition-all duration-300`}>
        © {new Date().getFullYear()} ONDTem. by <a href="https://onixagence.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary/80 font-medium transition-colors">Onix Agence</a>
      </footer>

      {/* Modals */}
      <LeaveReviewModal
        open={showLeaveReview}
        onOpenChange={setShowLeaveReview}
        farmaciaId={selectedMedicamento?.farmacia_id || ''}
        farmaciaNome={selectedMedicamento?.farmacia_nome || ''}
        onReviewSubmitted={() => {
          setReviewRefreshTrigger(prev => prev + 1);
        }}
      />

      <ViewReviewsModal
        open={showViewReviews}
        onOpenChange={setShowViewReviews}
        farmaciaId={selectedMedicamento?.farmacia_id || ''}
        farmaciaNome={selectedMedicamento?.farmacia_nome || ''}
        refreshTrigger={reviewRefreshTrigger}
      />

      <AlertDialog open={showLocationDialog} onOpenChange={setShowLocationDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              Localização Desativada
            </AlertDialogTitle>
            <AlertDialogDescription className="text-base">
              Para usar o ONDTem, você precisa ativar a localização no seu dispositivo. 
              Por favor, ative a localização nas configurações do navegador e recarregue a página.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => window.location.reload()}>
              Recarregar Página
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showArrivalModal} onOpenChange={handleCloseArrivalModal}>
        <AlertDialogContent className="rounded-lg">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl">Você chegou!</AlertDialogTitle>
            <AlertDialogDescription className="text-base space-y-2">
              <div className="font-semibold text-foreground">
                {selectedMedicamento?.farmacia_nome}
              </div>
              {selectedMedicamento?.farmacia_telefone && (
                <div className="text-muted-foreground">
                  Telefone: {selectedMedicamento.farmacia_telefone}
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row gap-2">
            {selectedMedicamento?.farmacia_telefone && (
              <Button
                variant="outline"
                onClick={handleCallPharmacy}
                className="flex-1"
              >
                <Phone className="h-4 w-4 mr-2" />
                Ligar
              </Button>
            )}
            <AlertDialogAction
              onClick={handleCloseArrivalModal}
              className="flex-1"
            >
              Ok
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Add Medications Modal */}
      <AlertDialog open={showAddMedicationModal} onOpenChange={setShowAddMedicationModal}>
        <AlertDialogContent className="rounded-lg max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl">Adicionar Medicamentos</AlertDialogTitle>
            <AlertDialogDescription className="text-base">
              Adicione os medicamentos que pretende comprar durante a viagem
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="space-y-4 py-4">
            {/* Medications List */}
            {medicamentosComprar.length > 0 && (
              <div>
                <label className="text-sm font-semibold mb-2 block">Medicamentos na lista:</label>
                <div className="space-y-2">
                  {medicamentosComprar.map((med, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 bg-accent rounded-md animate-in fade-in slide-in-from-left-2">
                      <span className="text-sm">{med}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveMedicamento(med)}
                        className="h-6 px-2 text-xs hover:bg-destructive/10 hover:text-destructive"
                      >
                        Remover
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Add Medication Input */}
            <div>
              <label className="text-sm font-semibold mb-2 block">Adicionar novo medicamento:</label>
              <div className="flex gap-2">
                <Input
                  placeholder="Nome do medicamento..."
                  value={novoMedicamento}
                  onChange={(e) => setNovoMedicamento(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddMedicamento()}
                  className="flex-1 text-base md:text-sm"
                />
                <Button
                  size="sm"
                  onClick={handleAddMedicamento}
                  disabled={!novoMedicamento.trim()}
                >
                  Adicionar
                </Button>
              </div>
            </div>
          </div>
          
          <AlertDialogFooter>
            <Button
              onClick={() => setShowAddMedicationModal(false)}
              className="w-full"
            >
              Concluído
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Buscar;
