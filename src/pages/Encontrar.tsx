import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { setOptions, importLibrary } from '@googlemaps/js-api-loader';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Search, MapPin, Phone, AlertCircle, X, Clock, Star, Navigation, Plus, Compass, Loader2, Eye, Map as MapIcon, Moon, Sun, MessageSquare, Crosshair, Satellite, Layers, Minimize2, Maximize2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import logo from '@/assets/ondtem-logo.png';
import pharmacyMarkerIcon from '@/assets/pharmacy-marker-icon.png';
import { LeaveReviewModal } from '@/components/LeaveReviewModal';
import { ViewReviewsModal } from '@/components/ViewReviewsModal';
import { FeedbackModal } from '@/components/FeedbackModal';
import { SearchFeedbackModal } from '@/components/SearchFeedbackModal';
import Fuse from 'fuse.js';
import { useSearchCapture } from '@/hooks/useSearchCapture';
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
  farmacia_mostrar_preco: boolean;
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
  const { theme, setTheme } = useTheme();
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const userMarkerRef = useRef<google.maps.Marker | null>(null);
  const radiusCircleRef = useRef<google.maps.Circle | null>(null);
  const accuracyCircleRef = useRef<google.maps.Circle | null>(null);
  const directionsRenderer = useRef<google.maps.DirectionsRenderer | null>(null);
  const directionsService = useRef<google.maps.DirectionsService | null>(null);
  const infoWindowsRef = useRef<google.maps.InfoWindow[]>([]);
  
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
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [showLeaveReview, setShowLeaveReview] = useState(false);
  const [showViewReviews, setShowViewReviews] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
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
  const [isFromSearch, setIsFromSearch] = useState(false);
  const [arrivalTime, setArrivalTime] = useState<string>('');
  const [selectedTravelMode, setSelectedTravelMode] = useState<'WALKING' | 'DRIVING'>('WALKING');
  const [travelModePreview, setTravelModePreview] = useState<'WALKING' | 'DRIVING' | null>('WALKING');
  const [searchStatus, setSearchStatus] = useState<'idle' | 'searching' | 'found' | 'not-found'>('idle');
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [isSearchCollapsed, setIsSearchCollapsed] = useState(false);
  const [locationAccuracy, setLocationAccuracy] = useState<number | null>(null);
  const userLocationWatchIdRef = useRef<number | null>(null);
  const didAutoRequestLocationRef = useRef(false);
  const lastLocationToastRef = useRef<number>(0);
  const [navigationStartTime, setNavigationStartTime] = useState<number | null>(null);
  const [selectedFromDropdown, setSelectedFromDropdown] = useState(false);
  const [travelDuration, setTravelDuration] = useState<string>('');
  const [mapViewMode, setMapViewMode] = useState<'2d' | '3d'>('2d');
  const [isNightMode, setIsNightMode] = useState(false);
  const [manualNightMode, setManualNightMode] = useState<'auto' | 'day' | 'night'>('auto');
  const [userHeading, setUserHeading] = useState<number>(0);
  const [isViewTransitioning, setIsViewTransitioning] = useState(false);
  const [mapType, setMapType] = useState<'roadmap' | 'satellite'>('roadmap');
  const [isNavCardMinimized, setIsNavCardMinimized] = useState(false);
  const [showSearchFeedback, setShowSearchFeedback] = useState(false);
  const searchFeedbackTimer = useRef<NodeJS.Timeout | null>(null);
  const navigationWatchId = useRef<number | null>(null);
  const currentRouteSteps = useRef<google.maps.DirectionsStep[]>([]);
  const currentStepIndex = useRef<number>(0);
  const destinationLocation = useRef<{ lat: number; lng: number } | null>(null);
  const lastAnnouncedDistance = useRef<number>(0);
  const hasAnnouncedTurn = useRef<boolean>(false);
  const searchDebounceTimer = useRef<NodeJS.Timeout | null>(null);
  const typedSearchText = useRef<string>('');
  const routeDotsRef = useRef<google.maps.Marker[]>([]);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; left: number; width: number } | null>(null);
  const lastUserPositionRef = useRef<{ lat: number; lng: number } | null>(null);

  // Base styles to hide all POIs including medical/pharmacies
  const baseMapStyles: google.maps.MapTypeStyle[] = [
    { featureType: 'poi', stylers: [{ visibility: 'off' }] },
    { featureType: 'poi.business', stylers: [{ visibility: 'off' }] },
    { featureType: 'poi.medical', stylers: [{ visibility: 'off' }] },
    { featureType: 'poi.park', stylers: [{ visibility: 'simplified' }] },
    { featureType: 'poi.government', stylers: [{ visibility: 'on' }] },
    { featureType: 'poi.school', stylers: [{ visibility: 'on' }] },
    { featureType: 'transit', stylers: [{ visibility: 'simplified' }] },
  ];

  // Night mode styles for Google Maps
  const nightModeStyles: google.maps.MapTypeStyle[] = [
    ...baseMapStyles,
    { elementType: 'geometry', stylers: [{ color: '#242f3e' }] },
    { elementType: 'labels.text.stroke', stylers: [{ color: '#242f3e' }] },
    { elementType: 'labels.text.fill', stylers: [{ color: '#746855' }] },
    { featureType: 'administrative.locality', elementType: 'labels.text.fill', stylers: [{ color: '#d59563' }] },
    { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#38414e' }] },
    { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#212a37' }] },
    { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#9ca5b3' }] },
    { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#746855' }] },
    { featureType: 'road.highway', elementType: 'geometry.stroke', stylers: [{ color: '#1f2835' }] },
    { featureType: 'road.highway', elementType: 'labels.text.fill', stylers: [{ color: '#f3d19c' }] },
    { featureType: 'transit', elementType: 'geometry', stylers: [{ color: '#2f3948' }] },
    { featureType: 'transit.station', elementType: 'labels.text.fill', stylers: [{ color: '#d59563' }] },
    { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#17263c' }] },
    { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#515c6d' }] },
    { featureType: 'water', elementType: 'labels.text.stroke', stylers: [{ color: '#17263c' }] },
  ];

  const dayModeStyles: google.maps.MapTypeStyle[] = [
    ...baseMapStyles,
  ];

  // Get current map styles based on manual night mode or auto detection
  const getCurrentMapStyles = useCallback(() => {
    if (manualNightMode === 'night') return nightModeStyles;
    if (manualNightMode === 'day') return dayModeStyles;
    // Auto mode - check time
    const hour = new Date().getHours();
    return (hour >= 18 || hour < 6) ? nightModeStyles : dayModeStyles;
  }, [manualNightMode]);

  // Toggle night mode manually
  const toggleNightMode = useCallback(() => {
    const newMode = manualNightMode === 'auto' 
      ? 'night' 
      : manualNightMode === 'night' 
        ? 'day' 
        : 'auto';
    setManualNightMode(newMode);
    
    const styles = newMode === 'night' ? nightModeStyles : newMode === 'day' ? dayModeStyles : getCurrentMapStyles();
    map.current?.setOptions({ styles });
    
    toast({
      title: newMode === 'auto' ? 'Modo automático' : newMode === 'night' ? 'Modo noturno' : 'Modo diurno',
      description: newMode === 'auto' ? 'O mapa ajusta-se automaticamente' : undefined,
    });
  }, [manualNightMode, getCurrentMapStyles, toast]);

  // Check if it's night time (after 18:00 or before 06:00)
  const checkNightMode = useCallback(() => {
    if (manualNightMode !== 'auto') return; // Don't auto-change if manual mode is set
    
    const hour = new Date().getHours();
    const shouldBeNightMode = hour >= 18 || hour < 6;
    if (shouldBeNightMode !== isNightMode) {
      setIsNightMode(shouldBeNightMode);
      if (map.current) {
        map.current.setOptions({
          styles: shouldBeNightMode ? nightModeStyles : dayModeStyles
        });
      }
    }
  }, [isNightMode, manualNightMode]);

  // Check night mode on mount and every minute
  useEffect(() => {
    checkNightMode();
    const interval = setInterval(checkNightMode, 60000);
    return () => clearInterval(interval);
  }, [checkNightMode]);

  useEffect(() => {
    checkLocationPermission();
    fetchGoogleMapsKey();
    fetchAllMedicamentos();
    loadSearchHistory();
  }, []);

  // Update dropdown position when input is focused
  const updateDropdownPosition = useCallback(() => {
    if (searchInputRef.current) {
      const rect = searchInputRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + 4,
        left: rect.left,
        width: rect.width,
      });
    }
  }, []);

  useEffect(() => {
    if (isInputFocused && medicamento.trim().length >= 2 && filteredMedicamentos.length > 0) {
      updateDropdownPosition();
      
      const handleScrollResize = () => updateDropdownPosition();
      window.addEventListener('scroll', handleScrollResize, true);
      window.addEventListener('resize', handleScrollResize);
      
      return () => {
        window.removeEventListener('scroll', handleScrollResize, true);
        window.removeEventListener('resize', handleScrollResize);
      };
    }
  }, [isInputFocused, medicamento, filteredMedicamentos.length, updateDropdownPosition]);

  useEffect(() => {
    if (locationPermission === 'denied') {
      setShowLocationDialog(true);
    } else if (!didAutoRequestLocationRef.current && !userLocation && !isGettingLocation) {
      // Tentar obter localização apenas uma vez automaticamente
      didAutoRequestLocationRef.current = true;
      requestGeolocation();
    }
  }, [locationPermission]);
  
  // Cleanup watchPosition on unmount
  useEffect(() => {
    return () => {
      if (userLocationWatchIdRef.current !== null) {
        navigator.geolocation.clearWatch(userLocationWatchIdRef.current);
        userLocationWatchIdRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    // Only initialize if we have a valid API key (non-empty string)
    if (googleMapsKey && googleMapsKey.trim().length > 0 && mapContainer.current && !map.current) {
      console.log('Valid Google Maps key detected, initializing map...');
      initializeMap();
    } else if (googleMapsKey === '' && !loadingToken) {
      console.error('Google Maps key is empty after loading');
      toast({
        title: 'Erro de Configuração',
        description: 'Chave do Google Maps não está configurada corretamente.',
        variant: 'destructive',
      });
    }
  }, [googleMapsKey, loadingToken]);

  // Adjust map zoom when radius changes
  useEffect(() => {
    if (!map.current || !userLocation) return;

    // Adjust zoom based on radius
    const zoomLevels: { [key: number]: number } = {
      1: 15,
      2: 14,
      4: 13,
      8: 12,
      16: 11
    };
    
    const targetZoom = zoomLevels[raioKm] || 13;
    map.current.setZoom(targetZoom);
    map.current.panTo(userLocation);
    
    // Update circle
    updateRadiusCircle(userLocation);
  }, [raioKm]);

  const initializeMap = async () => {
    // Strict validation before initialization
    if (!googleMapsKey || googleMapsKey.trim().length === 0) {
      console.error('Cannot initialize map: Google Maps key is missing or empty');
      return;
    }
    
    if (!mapContainer.current) {
      console.error('Cannot initialize map: Map container ref is null');
      return;
    }

    try {
      console.log('Initializing Google Maps with key:', googleMapsKey.substring(0, 10) + '...');
      
      // Configure Google Maps options with validated key
      setOptions({
        key: googleMapsKey.trim(),
        v: 'weekly',
      });

      // Load required libraries
      await Promise.all([
        importLibrary('maps'),
        importLibrary('geometry'),
        importLibrary('marker')
      ]);

      console.log('Google Maps libraries loaded successfully');

      // Now google.maps is available globally - use Vector Map for rotation/tilt support
      // Get initial styles based on current mode
      const initialStyles = getCurrentMapStyles();
      const hour = new Date().getHours();
      const isNight = hour >= 18 || hour < 6;
      setIsNightMode(isNight);
      
      const mapInstance = new google.maps.Map(mapContainer.current, {
        center: { lat: -25.9655, lng: 32.5892 },
        zoom: 13,
        mapTypeId: 'roadmap',
        mapId: 'DEMO_MAP_ID', // Required for tilt/rotation support
        // Desativar TODOS os controlos nativos
        mapTypeControl: false,
        fullscreenControl: false,
        streetViewControl: false,
        zoomControl: false,
        rotateControl: false,
        scaleControl: false,
        keyboardShortcuts: false,
        clickableIcons: false,
        gestureHandling: 'greedy',
        tilt: 0,
        heading: 0,
        styles: initialStyles
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

    // Adjust zoom based on radius (default 1km = zoom 15)
    const zoomLevels: { [key: number]: number } = {
      1: 15,
      2: 14,
      4: 13,
      8: 12,
      16: 11
    };
    
    const targetZoom = zoomLevels[raioKm] || 15;
    
    // Center map on user location
    map.current.setCenter(location);
    map.current.setZoom(targetZoom);

    // Calculate heading from last position
    let heading = userHeading;
    if (lastUserPositionRef.current && isNavigating) {
      heading = google.maps.geometry.spherical.computeHeading(
        new google.maps.LatLng(lastUserPositionRef.current.lat, lastUserPositionRef.current.lng),
        new google.maps.LatLng(location.lat, location.lng)
      );
      setUserHeading(heading);
    }
    lastUserPositionRef.current = location;

    // Create or update user marker with direction arrow during navigation
    if (!userMarkerRef.current) {
      userMarkerRef.current = new google.maps.Marker({
        position: location,
        map: map.current,
        icon: isNavigating ? {
          path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
          scale: 6,
          fillColor: '#4285F4',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 2,
          rotation: heading,
        } : {
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
      // Update icon with rotation during navigation
      if (isNavigating) {
        userMarkerRef.current.setIcon({
          path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
          scale: 6,
          fillColor: '#4285F4',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 2,
          rotation: heading,
        });
      }
    }

    updateRadiusCircle(location);
  };

  // Create InfoWindow content for pharmacy
  const createInfoWindowContent = (pharmacy: { 
    nome: string; 
    horario_abertura?: string | null; 
    horario_fechamento?: string | null;
    media_avaliacoes?: number;
    total_avaliacoes?: number;
  }) => {
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    
    let isOpen = false;
    let statusLabel = 'Horário não disponível';
    let statusColor = '#9ca3af';
    let statusBgColor = '#f3f4f6';
    
    if (pharmacy.horario_abertura && pharmacy.horario_fechamento) {
      const [openHour, openMin] = pharmacy.horario_abertura.split(':').map(Number);
      const [closeHour, closeMin] = pharmacy.horario_fechamento.split(':').map(Number);
      const openTime = openHour * 60 + openMin;
      const closeTime = closeHour * 60 + closeMin;
      
      isOpen = currentTime >= openTime && currentTime < closeTime;
      statusLabel = isOpen ? 'Aberto' : 'Fechado';
      statusColor = isOpen ? '#10b981' : '#ef4444';
      statusBgColor = isOpen ? '#d1fae5' : '#fee2e2';
    }

    const rating = pharmacy.media_avaliacoes || 0;
    const reviewCount = pharmacy.total_avaliacoes || 0;

    return `
      <div style="
        padding: 16px; 
        min-width: 260px;
        max-width: 280px;
        font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        background: linear-gradient(to bottom, #ffffff, #fafafa);
        border-radius: 12px;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
      ">
        <h3 style="
          margin: 0 0 12px 0; 
          font-size: 15px; 
          font-weight: 700; 
          color: #111827;
          line-height: 1.4;
          letter-spacing: -0.01em;
        ">
          ${pharmacy.nome}
        </h3>
        
        ${rating > 0 ? `
          <div style="
            display: flex;
            align-items: center;
            gap: 6px;
            margin-bottom: 10px;
            padding: 6px 10px;
            background: #fffbeb;
            border-radius: 8px;
            border: 1px solid #fef3c7;
          ">
            <div style="display: flex; gap: 2px;">
              ${Array(5).fill(0).map((_, i) => 
                `<span style="color: ${i < Math.round(rating) ? '#f59e0b' : '#e5e7eb'}; font-size: 14px;">★</span>`
              ).join('')}
            </div>
            <span style="
              font-size: 13px; 
              font-weight: 700; 
              color: #78350f;
              margin-left: 2px;
            ">
              ${rating.toFixed(1)}
            </span>
            <span style="
              font-size: 12px; 
              color: #92400e;
            ">(${reviewCount})</span>
          </div>
        ` : ''}
        
        ${pharmacy.horario_abertura && pharmacy.horario_fechamento ? `
          <div style="
            display: flex;
            align-items: center;
            gap: 6px;
            margin-bottom: 8px;
            font-size: 13px;
            color: #4b5563;
            padding: 4px 0;
          ">
            <span style="font-size: 14px;">🕒</span>
            <span style="font-weight: 500;">
              ${pharmacy.horario_abertura.slice(0, 5)} - ${pharmacy.horario_fechamento.slice(0, 5)}
            </span>
          </div>
        ` : ''}
        
        <div style="
          display: inline-flex;
          align-items: center;
          padding: 6px 12px;
          border-radius: 6px;
          background: ${statusBgColor};
          border: 1.5px solid ${statusColor}33;
        ">
          <span style="
            font-size: 13px; 
            font-weight: 700; 
            color: ${statusColor};
            letter-spacing: 0.01em;
          ">
            ${statusLabel}
          </span>
        </div>
      </div>
    `;
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

      // Clear existing markers and info windows
      markersRef.current.forEach(marker => marker.setMap(null));
      markersRef.current = [];
      infoWindowsRef.current.forEach(infoWindow => infoWindow.close());
      infoWindowsRef.current = [];

      // Add markers for all pharmacies
      if (pharmacies && pharmacies.length > 0) {
        pharmacies.forEach(async (pharmacy) => {
          // Fetch complete pharmacy data for info window
          const { data: fullData } = await supabase
            .from('farmacias')
            .select('*')
            .eq('id', pharmacy.id)
            .single();

          // Fetch ratings
          const { data: avaliacoes } = await supabase
            .from('avaliacoes')
            .select('avaliacao')
            .eq('farmacia_id', pharmacy.id);

          const media_avaliacoes = avaliacoes && avaliacoes.length > 0
            ? avaliacoes.reduce((sum, a) => sum + a.avaliacao, 0) / avaliacoes.length
            : 0;

          const marker = new google.maps.Marker({
            position: {
              lat: Number(pharmacy.latitude),
              lng: Number(pharmacy.longitude)
            },
            map: map.current!,
            icon: {
              url: pharmacyMarkerIcon,
              scaledSize: new google.maps.Size(40, 40),
              anchor: new google.maps.Point(20, 40),
            },
            title: pharmacy.nome
          });

          // Create InfoWindow
          const infoWindow = new google.maps.InfoWindow({
            content: createInfoWindowContent({
              nome: pharmacy.nome,
              horario_abertura: fullData?.horario_abertura,
              horario_fechamento: fullData?.horario_fechamento,
              media_avaliacoes: media_avaliacoes,
              total_avaliacoes: avaliacoes?.length || 0
            })
          });

          infoWindowsRef.current.push(infoWindow);

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
        duration: 5000,
      });
    } finally {
      setLoadingToken(false);
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
  };

  const fetchGoogleMapsKey = async () => {
    setLoadingToken(true);
    try {
      console.log('Fetching Google Maps API key...');
      const { data, error } = await supabase.functions.invoke('get-google-maps-key');
      
      if (error) {
        console.error('Supabase function error:', error);
        throw error;
      }
      
      if (!data || !data.key || data.key.trim().length === 0) {
        console.error('Received empty or invalid API key from server');
        throw new Error('API key inválida ou vazia');
      }
      
      console.log('Google Maps API key received successfully');
      setGoogleMapsKey(data.key.trim());
    } catch (error) {
      console.error('Error fetching Google Maps key:', error);
      setGoogleMapsKey(''); // Set empty to trigger error handling
      toast({
        title: 'Erro de Configuração',
        description: 'Não foi possível carregar a chave do Google Maps. Contacte o suporte.',
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

  // Only save to history when search was successful (found pharmacies with stock)
  const saveToSearchHistory = (searchTerm: string, wasSuccessful: boolean = true) => {
    if (!wasSuccessful || !searchTerm.trim()) return; // Only save successful searches
    
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
      // Fetch ALL medications - Supabase has default limit of 1000
      // We need to paginate to get all records
      let allData: Medicamento[] = [];
      let page = 0;
      const pageSize = 1000;
      let hasMore = true;

      while (hasMore) {
        const { data, error } = await supabase
          .from('medicamentos')
          .select('id, nome, categoria')
          .order('nome')
          .range(page * pageSize, (page + 1) * pageSize - 1);

        if (error) throw error;

        if (data && data.length > 0) {
          allData = [...allData, ...data];
          hasMore = data.length === pageSize;
          page++;
        } else {
          hasMore = false;
        }
      }

      console.log(`Loaded ${allData.length} medications from database`);
      setAllMedicamentos(allData);
      setFilteredMedicamentos(allData);
    } catch (error) {
      console.error('Error fetching medications:', error);
    } finally {
      setLoadingMedicamentos(false);
    }
  };

  // Autocomplete filtering with debounce for better performance
  useEffect(() => {
    // Reset if field is empty
    if (medicamento.trim().length === 0) {
      setMedicamentos([]);
      setSearchStatus('idle');
      setFilteredMedicamentos([]);
      // Reload all pharmacies on map
      if (map.current) {
        loadAllPharmacies();
      }
      return;
    }

    const searchTerm = medicamento.trim().toLowerCase();
    
    // Need at least 2 characters to search for better results
    if (searchTerm.length < 2) {
      setFilteredMedicamentos([]);
      return;
    }

    // Debounce the filtering to avoid flickering
    if (searchDebounceTimer.current) {
      clearTimeout(searchDebounceTimer.current);
    }

    searchDebounceTimer.current = setTimeout(() => {
      console.log('Filtering medications for:', searchTerm, 'Total medications:', allMedicamentos.length);

      // First, try simple prefix matching (best quality matches)
      const prefixMatches = allMedicamentos.filter(med => 
        med.nome.toLowerCase().startsWith(searchTerm)
      );
      
      console.log('Prefix matches:', prefixMatches.length);

      // Then try contains matching
      const containsMatches = allMedicamentos.filter(med => 
        med.nome.toLowerCase().includes(searchTerm) && 
        !med.nome.toLowerCase().startsWith(searchTerm)
      );
      
      console.log('Contains matches:', containsMatches.length);

      let finalResults: Medicamento[] = [];
      
      if (prefixMatches.length > 0 || containsMatches.length > 0) {
        // Combine: prefix matches first, then contains matches
        finalResults = [...prefixMatches.sort((a, b) => a.nome.localeCompare(b.nome)), 
                        ...containsMatches.sort((a, b) => a.nome.localeCompare(b.nome))];
      } else {
        // No direct matches - use fuzzy search for typo tolerance with STRICT settings
        const fuse = new Fuse(allMedicamentos, {
          keys: ['nome'],
          threshold: 0.3,
          distance: 50,
          minMatchCharLength: 3,
          includeScore: true,
          ignoreLocation: false,
          findAllMatches: false,
        });

        const fuzzyResults = fuse.search(searchTerm);
        console.log('Fuzzy results (raw):', fuzzyResults.length);
        
        const goodMatches = fuzzyResults.filter(result => result.score !== undefined && result.score < 0.35);
        console.log('Fuzzy results (filtered by score):', goodMatches.length);
        
        finalResults = goodMatches.map(result => result.item);
      }
      
      // Remove duplicates by name
      const uniqueNames = new Map<string, Medicamento>();
      finalResults.forEach(med => {
        if (!uniqueNames.has(med.nome.toLowerCase())) {
          uniqueNames.set(med.nome.toLowerCase(), med);
        }
      });
      
      const uniqueResults = Array.from(uniqueNames.values());
      console.log('Unique filtered medications:', uniqueResults.length);
      setFilteredMedicamentos(uniqueResults);
    }, 150); // 150ms debounce delay

    return () => {
      if (searchDebounceTimer.current) {
        clearTimeout(searchDebounceTimer.current);
      }
    };
  }, [medicamento, allMedicamentos]);

  // Hook para captura de buscas (novo sistema)
  const { completarBusca } = useSearchCapture({ userLocation, raioKm });

  const handleAutoSearch = async (options?: { trigger?: 'dropdown' | 'enter' }) => {
    if (!medicamento.trim() || !userLocation) return;

    const trigger = options?.trigger ?? 'dropdown';
    setSearchStatus('searching');

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

      // CASE 1: Product does not exist in catalog
      if (!medData || medData.length === 0) {
        setMedicamentos([]);
        setSearchStatus('not-found');
        // Register search with no_product outcome
        if (selectedFromDropdown || trigger === 'enter') {
          await completarBusca(
            typedSearchText.current,
            medicamento,
            null,
            [],
            { trigger, outcomeOverride: 'no_product' }
          );
        }
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
            cidade,
            mostrar_preco
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
            farmacia_mostrar_preco: farmacia.mostrar_preco ?? true,
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

      // CASE 2: Product exists but no pharmacy has stock within radius
      if (results.length === 0) {
        setSearchStatus('not-found');
        if (selectedFromDropdown || trigger === 'enter') {
          await completarBusca(
            typedSearchText.current,
            medicamento,
            medData?.[0]?.id || null,
            [],
            { trigger, outcomeOverride: 'no_pharmacy' }
          );
        }
        return;
      }

      // CASE 3: Success - found pharmacies with stock
      setSearchStatus('found');
      if (selectedFromDropdown || trigger === 'enter') {
        const farmaciaResults = results.map(r => ({
          farmacia_id: r.farmacia_id,
          distancia_km: r.distancia_km
        }));
        
        await completarBusca(
          typedSearchText.current,
          medicamento,
          medData?.[0]?.id || null,
          farmaciaResults,
          { trigger }
        );
        
        // Save to history ONLY on successful search
        saveToSearchHistory(medicamento, true);
      }

      // Add pharmacy markers to map
      if (map.current) {
        results.forEach(item => {
          const marker = new google.maps.Marker({
            position: {
              lat: item.farmacia_latitude,
              lng: item.farmacia_longitude
            },
            map: map.current!,
            icon: {
              url: pharmacyMarkerIcon,
              scaledSize: new google.maps.Size(40, 40),
              anchor: new google.maps.Point(20, 40),
            },
            title: item.farmacia_nome
          });

          const infoWindow = new google.maps.InfoWindow({
            content: createInfoWindowContent({
              nome: item.farmacia_nome,
              horario_abertura: item.farmacia_horario_abertura,
              horario_fechamento: item.farmacia_horario_fechamento,
              media_avaliacoes: item.media_avaliacoes,
              total_avaliacoes: item.total_avaliacoes
            })
          });

          infoWindowsRef.current.push(infoWindow);

          marker.addListener('mouseover', () => {
            infoWindowsRef.current.forEach(iw => iw.close());
            infoWindow.open(map.current!, marker);
          });

          marker.addListener('mouseout', () => {
            infoWindow.close();
          });

          marker.addListener('click', () => {
            setIsFromSearch(true);
            showRouteToPharmacy(item, 'walking');
          });

          markersRef.current.push(marker);
        });
      }
    } catch (error) {
      console.error('Error in auto search:', error);
      setSearchStatus('idle');
    }
  };

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

  const requestGeolocation = useCallback((forceRefine = false) => {
    if (!('geolocation' in navigator) || isGettingLocation) return;
    
    setIsGettingLocation(true);
    
    // Stop any existing watch
    if (userLocationWatchIdRef.current !== null) {
      navigator.geolocation.clearWatch(userLocationWatchIdRef.current);
      userLocationWatchIdRef.current = null;
    }
    
    // If forcing refine or no location yet, show toast
    if (forceRefine && locationAccuracy && locationAccuracy > 50) {
      toast({
        title: 'A melhorar precisão...',
        description: 'Aguarde enquanto obtemos uma localização mais precisa.',
      });
    }
    
    // Phase A: Quick location (accepts cache, low accuracy OK)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const newLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        const accuracy = position.coords.accuracy;
        
        setUserLocation(newLocation);
        setLocationAccuracy(accuracy);
        setLocationPermission('granted');
        
        if (map.current) {
          updateMapWithUserLocation(newLocation);
          updateAccuracyCircle(newLocation, accuracy);
        }
        
        // Phase B: Start watching for better accuracy (if current is poor or forcing refine)
        if (accuracy > 50 || forceRefine) {
          startAccuracyRefinement();
        } else {
          setIsGettingLocation(false);
          if (accuracy <= 30) {
            toast({
              title: 'Localização precisa',
              description: `Precisão: ${Math.round(accuracy)}m`,
            });
          }
        }
      },
      (error) => {
        console.error('Quick location error:', { code: error.code, message: error.message });
        
        if (error.code === 1) {
          // PERMISSION_DENIED
          setLocationPermission('denied');
          setShowLocationDialog(true);
          setIsGettingLocation(false);
        } else {
          // Phase B directly: Try watchPosition for better results
          startAccuracyRefinement();
        }
      },
      { enableHighAccuracy: false, timeout: 3000, maximumAge: forceRefine ? 0 : 60000 }
    );
  }, [isGettingLocation, locationAccuracy, toast]);
  
  // Update accuracy circle on map
  const updateAccuracyCircle = useCallback((location: { lat: number; lng: number }, accuracy: number) => {
    if (!map.current) return;
    
    // Remove existing accuracy circle
    if (accuracyCircleRef.current) {
      accuracyCircleRef.current.setMap(null);
    }
    
    // Only show accuracy circle if accuracy is poor (> 30m)
    if (accuracy > 30) {
      accuracyCircleRef.current = new google.maps.Circle({
        strokeColor: accuracy > 100 ? '#ef4444' : accuracy > 50 ? '#f59e0b' : '#3b82f6',
        strokeOpacity: 0.4,
        strokeWeight: 2,
        fillColor: accuracy > 100 ? '#ef4444' : accuracy > 50 ? '#f59e0b' : '#3b82f6',
        fillOpacity: 0.1,
        map: map.current,
        center: location,
        radius: accuracy,
        zIndex: 500
      });
    }
  }, []);
  
  const startAccuracyRefinement = useCallback(() => {
    // Clear existing watch if any
    if (userLocationWatchIdRef.current !== null) {
      navigator.geolocation.clearWatch(userLocationWatchIdRef.current);
    }
    
    let bestAccuracy = locationAccuracy || Infinity;
    let bestLocation: { lat: number; lng: number } | null = null;
    let goodReadingsCount = 0;
    const maxWatchTime = 20000; // 20 seconds max
    const startTime = Date.now();
    
    userLocationWatchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const newLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        const accuracy = position.coords.accuracy;
        
        // Only accept readings that are better than what we have
        // Or accept any reading if accuracy is good enough (< 50m)
        if (accuracy < bestAccuracy || accuracy <= 50) {
          bestAccuracy = accuracy;
          bestLocation = newLocation;
          
          setUserLocation(newLocation);
          setLocationAccuracy(accuracy);
          setLocationPermission('granted');
          
          if (map.current) {
            updateMapWithUserLocation(newLocation);
            updateAccuracyCircle(newLocation, accuracy);
          }
        }
        
        // Stop if accuracy is excellent
        if (accuracy <= 30) {
          goodReadingsCount++;
          if (goodReadingsCount >= 2) {
            // Got consistent excellent readings, stop watching
            if (userLocationWatchIdRef.current !== null) {
              navigator.geolocation.clearWatch(userLocationWatchIdRef.current);
              userLocationWatchIdRef.current = null;
            }
            setIsGettingLocation(false);
            toast({
              title: 'Localização precisa',
              description: `Precisão: ${Math.round(accuracy)}m`,
            });
          }
        } else if (accuracy <= 50) {
          // Good enough, but keep trying for a bit
          goodReadingsCount++;
          if (goodReadingsCount >= 3 || Date.now() - startTime > 10000) {
            if (userLocationWatchIdRef.current !== null) {
              navigator.geolocation.clearWatch(userLocationWatchIdRef.current);
              userLocationWatchIdRef.current = null;
            }
            setIsGettingLocation(false);
          }
        }
        
        // Timeout check
        if (Date.now() - startTime > maxWatchTime) {
          if (userLocationWatchIdRef.current !== null) {
            navigator.geolocation.clearWatch(userLocationWatchIdRef.current);
            userLocationWatchIdRef.current = null;
          }
          setIsGettingLocation(false);
          
          // If we still have poor accuracy, warn the user
          if (bestAccuracy > 100) {
            toast({
              title: 'Precisão limitada',
              description: `Precisão atual: ~${Math.round(bestAccuracy)}m. Tente num local com melhor sinal GPS.`,
              variant: 'destructive',
            });
          }
        }
      },
      (error) => {
        console.error('Watch position error:', { code: error.code, message: error.message });
        
        if (userLocationWatchIdRef.current !== null) {
          navigator.geolocation.clearWatch(userLocationWatchIdRef.current);
          userLocationWatchIdRef.current = null;
        }
        setIsGettingLocation(false);
        
        if (error.code === 1) {
          setLocationPermission('denied');
          setShowLocationDialog(true);
        } else {
          // Only show toast if we don't have any location and haven't shown one recently
          const now = Date.now();
          if (!userLocation && now - lastLocationToastRef.current > 30000) {
            lastLocationToastRef.current = now;
            toast({
              title: 'Localização indisponível',
              description: 'Verifique se o GPS está ativado e tente novamente.',
              variant: 'destructive',
            });
          }
        }
      },
      { enableHighAccuracy: true, timeout: 25000, maximumAge: 0 }
    );
    
    // Auto-stop after maxWatchTime
    setTimeout(() => {
      if (userLocationWatchIdRef.current !== null) {
        navigator.geolocation.clearWatch(userLocationWatchIdRef.current);
        userLocationWatchIdRef.current = null;
        setIsGettingLocation(false);
      }
    }, maxWatchTime);
  }, [toast, userLocation, locationAccuracy, updateAccuracyCircle]);

  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const from = new google.maps.LatLng(lat1, lng1);
    const to = new google.maps.LatLng(lat2, lng2);
    return google.maps.geometry.spherical.computeDistanceBetween(from, to) / 1000; // Convert to km
  };

  const handleBuscar = async (medicationName?: string, options?: { trigger?: 'dropdown' | 'enter' }) => {
    const searchTerm = medicationName || medicamento;
    const trigger = options?.trigger ?? 'dropdown';
    if (!searchTerm.trim() || !userLocation) {
      return;
    }

    setSearching(true);
    setSearchStatus('searching');

    try {
      // Clear existing markers
      markersRef.current.forEach(marker => marker.setMap(null));
      markersRef.current = [];

      // Fetch medications matching the search
      const { data: medData, error: medError } = await supabase
        .from('medicamentos')
        .select('id, nome')
        .ilike('nome', `%${searchTerm}%`);

      if (medError) throw medError;

      // CASE 1: Product does not exist in catalog
      if (!medData || medData.length === 0) {
        setMedicamentos([]);
        setSearchStatus('not-found');
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
            cidade,
            mostrar_preco
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
            farmacia_mostrar_preco: farmacia.mostrar_preco ?? true,
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

      // CASE 2: Product exists but no pharmacy has stock within radius
      if (results.length === 0) {
        setSearchStatus('not-found');
        setSearching(false);
        return;
      }

      // CASE 3: Success - found pharmacies with stock
      setSearchStatus('found');
      
      // Save to history ONLY on successful search with valid medication name
      if (medicationName) {
        saveToSearchHistory(medicationName, true);
      }

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
              url: pharmacyMarkerIcon,
              scaledSize: new google.maps.Size(40, 40),
              anchor: new google.maps.Point(20, 40),
            },
            title: item.farmacia_nome
          });

          // Create InfoWindow
          const infoWindow = new google.maps.InfoWindow({
            content: createInfoWindowContent({
              nome: item.farmacia_nome,
              horario_abertura: item.farmacia_horario_abertura,
              horario_fechamento: item.farmacia_horario_fechamento,
              media_avaliacoes: item.media_avaliacoes,
              total_avaliacoes: item.total_avaliacoes
            })
          });

          infoWindowsRef.current.push(infoWindow);

          // Show InfoWindow on hover
          marker.addListener('mouseover', () => {
            // Close all other info windows
            infoWindowsRef.current.forEach(iw => iw.close());
            infoWindow.open(map.current!, marker);
          });

          // Close InfoWindow on mouseout
          marker.addListener('mouseout', () => {
            infoWindow.close();
          });

          marker.addListener('click', () => {
            setIsFromSearch(true);
            showRouteToPharmacy(item, 'walking');
          });

          markersRef.current.push(marker);
        });
        
        console.log(`Added ${results.length} pharmacy markers to map`);
      }
    } catch (error) {
      console.error('Error searching medications:', error);
      setSearchStatus('idle');
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
        if (status === 'OK' && result && directionsRenderer.current && map.current) {
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

            // Adjust map to show route with pharmacy in visible area (top portion)
            // Add padding at bottom to account for info card
            const bounds = new google.maps.LatLngBounds();
            bounds.extend(origin);
            bounds.extend(destination);
            
            // Fit bounds with extra bottom padding to position markers in visible top area
            map.current.fitBounds(bounds, {
              top: 50,
              bottom: 320, // Account for info card height (~280px) + margin
              left: 50,
              right: 50
            });
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

  const clearRouteDots = () => {
    routeDotsRef.current.forEach(dot => dot.setMap(null));
    routeDotsRef.current = [];
  };

  const drawRouteWithDots = (route: google.maps.DirectionsRoute) => {
    if (!map.current) return;

    clearRouteDots();

    const path = route.overview_path;
    
    // Calculate distance-based spacing for consistent dot density
    // We want dots every ~15 meters for good visibility
    const targetDistanceMeters = 15;
    
    let lastPoint: google.maps.LatLng | null = null;
    let accumulatedDistance = 0;
    
    path.forEach((point, index) => {
      if (index === 0) {
        // Always draw the first point
        createRouteDot(point, true);
        lastPoint = point;
        return;
      }
      
      if (lastPoint) {
        const distance = google.maps.geometry.spherical.computeDistanceBetween(lastPoint, point);
        accumulatedDistance += distance;
        
        if (accumulatedDistance >= targetDistanceMeters) {
          createRouteDot(point, false);
          accumulatedDistance = 0;
        }
        
        lastPoint = point;
      }
    });
    
    // Always draw the last point
    if (path.length > 1) {
      createRouteDot(path[path.length - 1], true);
    }
  };

  const createRouteDot = (point: google.maps.LatLng, isEndpoint: boolean) => {
    if (!map.current) return;
    
    const dot = new google.maps.Marker({
      position: point,
      map: map.current,
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: isEndpoint ? 8 : 6,
        fillColor: '#10b981',
        fillOpacity: 1,
        strokeColor: '#ffffff',
        strokeWeight: 2,
      },
      zIndex: isEndpoint ? 110 : 100
    });
    routeDotsRef.current.push(dot);
  };

  const startNavigationWithMode = async (mode: 'WALKING' | 'DRIVING') => {
    if (!selectedMedicamento || !userLocation || !directionsService.current || !map.current) return;
    
    setSelectedTravelMode(mode);
    setIsNavigating(true);
    setCurrentInstruction('Preparando navegação...');
    setNextInstruction('');
    setNavigationStartTime(Date.now());
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
          const route = result.routes[0];

          // Use continuous line for BOTH walking and driving modes
          directionsRenderer.current.setOptions({
            suppressMarkers: true,
            polylineOptions: {
              strokeColor: '#10b981',
              strokeWeight: mode === 'WALKING' ? 6 : 8,
              strokeOpacity: 0.9,
              geodesic: true
            }
          });
          directionsRenderer.current.setDirections(result);

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

          // Set navigation view - tilted, zoomed in, rotated towards destination
          setMapViewMode('3d');
          
          // Calculate initial heading from user to destination
          const destLatLng = new google.maps.LatLng(
            selectedMedicamento.farmacia_latitude,
            selectedMedicamento.farmacia_longitude
          );
          const userLatLng = new google.maps.LatLng(userLocation.lat, userLocation.lng);
          const initialHeading = google.maps.geometry.spherical.computeHeading(userLatLng, destLatLng);
          setUserHeading(initialHeading);
          
          // Update user marker to arrow pointing towards destination
          if (userMarkerRef.current) {
            userMarkerRef.current.setIcon({
              path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
              scale: 6,
              fillColor: '#4285F4',
              fillOpacity: 1,
              strokeColor: '#ffffff',
              strokeWeight: 2,
              rotation: initialHeading,
            });
          }
          
          // Use moveCamera for smooth transition with heading
          map.current.moveCamera({
            center: userLocation,
            zoom: 18,
            tilt: 45,
            heading: initialHeading
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

                // Auto-rotate map to face direction of travel during navigation
                if (currentRouteSteps.current.length > currentStepIndex.current) {
                  const currentStep = currentRouteSteps.current[currentStepIndex.current];
                  if (currentStep.end_location) {
                    const heading = google.maps.geometry.spherical.computeHeading(
                      new google.maps.LatLng(newPos.lat, newPos.lng),
                      currentStep.end_location
                    );
                    
                    // Update user marker with direction arrow
                    setUserHeading(heading);
                    if (userMarkerRef.current) {
                      userMarkerRef.current.setIcon({
                        path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
                        scale: 6,
                        fillColor: '#4285F4',
                        fillOpacity: 1,
                        strokeColor: '#ffffff',
                        strokeWeight: 2,
                        rotation: heading,
                      });
                    }
                    
                    // Smooth camera update with heading aligned to direction
                    map.current?.moveCamera({
                      center: newPos,
                      heading: heading,
                      tilt: 45,
                      zoom: 18
                    });
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
                    // Calculate travel duration
                    if (navigationStartTime) {
                      const duration = Date.now() - navigationStartTime;
                      const minutes = Math.floor(duration / 60000);
                      const seconds = Math.floor((duration % 60000) / 1000);
                      setTravelDuration(`${minutes}min ${seconds}s`);
                    }
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
    
    // Clear route dots
    clearRouteDots();
    
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
      setMapViewMode('2d');
    }
    
    // Reset user marker to circle icon
    if (userMarkerRef.current) {
      userMarkerRef.current.setIcon({
        path: google.maps.SymbolPath.CIRCLE,
        scale: 10,
        fillColor: '#4285F4',
        fillOpacity: 1,
        strokeColor: '#ffffff',
        strokeWeight: 3,
      });
    }
  };

  const toggleMapView = () => {
    if (!map.current || isViewTransitioning) return;
    
    setIsViewTransitioning(true);
    
    const targetTilt = mapViewMode === '2d' ? 45 : 0;
    const targetHeading = mapViewMode === '3d' ? 0 : undefined;
    const currentZoom = map.current.getZoom() || 14;
    
    // Animate transition with zoom effect
    const animateView = async () => {
      // First, zoom out slightly for smooth transition
      map.current?.setZoom(currentZoom - 1);
      
      await new Promise(resolve => setTimeout(resolve, 150));
      
      // Apply tilt change
      map.current?.setTilt(targetTilt);
      if (targetHeading !== undefined) {
        map.current?.setHeading(targetHeading);
      }
      
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Zoom back in
      map.current?.setZoom(currentZoom);
      
      setMapViewMode(mapViewMode === '2d' ? '3d' : '2d');
      setIsViewTransitioning(false);
    };
    
    animateView();
  };

  const resetMapOrientation = () => {
    if (!map.current) return;
    map.current.setHeading(0);
  };

  const toggleMapType = () => {
    if (!map.current) return;
    const newType = mapType === 'roadmap' ? 'satellite' : 'roadmap';
    setMapType(newType);
    map.current.setMapTypeId(newType);
    toast({
      title: newType === 'satellite' ? 'Vista satélite' : 'Vista mapa',
    });
  };

  const recenterMap = () => {
    if (map.current && userLocation) {
      map.current.setCenter(userLocation);
      map.current.setZoom(18);
      map.current.setTilt(45);
    }
  };

  const handleDeselectPharmacy = () => {
    setSelectedMedicamento(null);
    setRouteInfo(null);
    if (directionsRenderer.current) {
      directionsRenderer.current.setDirections({ routes: [] } as any);
    }
    
    // Clear route dots
    clearRouteDots();
    
    // Reset map view to show radius circle
    if (map.current && userLocation) {
      const zoomLevels: { [key: number]: number } = {
        1: 15,
        2: 14,
        4: 13,
        8: 12,
        16: 11
      };
      
      const targetZoom = zoomLevels[raioKm] || 13;
      map.current.setCenter(userLocation);
      map.current.setZoom(targetZoom);
      map.current.setTilt(0); // Reset tilt
    }
    
    // Reload markers based on current search state
    if (medicamentos.length > 0) {
      // If there are search results, reload those markers
      markersRef.current.forEach(marker => marker.setMap(null));
      markersRef.current = [];
      infoWindowsRef.current.forEach(infoWindow => infoWindow.close());
      infoWindowsRef.current = [];
      
      // Re-add search result markers
      medicamentos.forEach(item => {
        const marker = new google.maps.Marker({
          position: {
            lat: item.farmacia_latitude,
            lng: item.farmacia_longitude
          },
          map: map.current!,
          icon: {
            url: pharmacyMarkerIcon,
            scaledSize: new google.maps.Size(40, 40),
            anchor: new google.maps.Point(20, 40),
          },
          title: item.farmacia_nome
        });

        const infoWindow = new google.maps.InfoWindow({
          content: createInfoWindowContent({
            nome: item.farmacia_nome,
            horario_abertura: item.farmacia_horario_abertura,
            horario_fechamento: item.farmacia_horario_fechamento,
            media_avaliacoes: item.media_avaliacoes,
            total_avaliacoes: item.total_avaliacoes
          })
        });

        infoWindowsRef.current.push(infoWindow);

        marker.addListener('mouseover', () => {
          infoWindowsRef.current.forEach(iw => iw.close());
          infoWindow.open(map.current!, marker);
        });

        marker.addListener('mouseout', () => {
          infoWindow.close();
        });

        marker.addListener('click', () => {
          setIsFromSearch(true);
          showRouteToPharmacy(item, 'walking');
        });

        markersRef.current.push(marker);
      });
    } else {
      // No search results, reload all pharmacies
      loadAllPharmacies();
    }
  };

  const handleClearSearch = () => {
    setMedicamento('');
    setSelectedFromDropdown(false);
  };

  const handleTravelModePreview = async (mode: 'WALKING' | 'DRIVING') => {
    if (!selectedMedicamento || !userLocation || !map.current || !directionsService.current || !directionsRenderer.current) return;
    
    setTravelModePreview(mode);

    try {
      const origin = new google.maps.LatLng(userLocation.lat, userLocation.lng);
      const destination = new google.maps.LatLng(selectedMedicamento.farmacia_latitude, selectedMedicamento.farmacia_longitude);

      const request: google.maps.DirectionsRequest = {
        origin: origin,
        destination: destination,
        travelMode: mode === 'WALKING' ? google.maps.TravelMode.WALKING : google.maps.TravelMode.DRIVING
      };

      directionsService.current.route(request, (result, status) => {
        if (status === 'OK' && result && directionsRenderer.current && map.current) {
          // Set route color based on mode
          directionsRenderer.current.setOptions({
            polylineOptions: {
              strokeColor: mode === 'WALKING' ? '#4F46E5' : '#10b981',
              strokeWeight: 6,
              strokeOpacity: 0.8
            }
          });
          directionsRenderer.current.setDirections(result);

          const route = result.routes[0];
          const leg = route.legs[0];

          if (leg) {
            // Update travel times
            if (mode === 'WALKING') {
              setWalkingDuration(leg.duration?.value ? leg.duration.value / 60 : 0);
            } else {
              setDrivingDuration(leg.duration?.value ? leg.duration.value / 60 : 0);
            }

            // Zoom to show the entire route
            const bounds = new google.maps.LatLngBounds();
            bounds.extend(origin);
            bounds.extend(destination);
            
            map.current.fitBounds(bounds, {
              top: 50,
              bottom: 320,
              left: 50,
              right: 50
            });
          }
        }
      });
    } catch (error) {
      console.error('Error calculating route preview:', error);
    }
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
      {/* Header - Always visible */}
      <div className="flex items-center justify-between p-3 md:p-4 bg-card border-b border-border shadow-sm transition-all duration-300">
        <div className="flex items-center gap-2 md:gap-3 min-w-0">
          <img src={logo} alt="ONDTem" className="h-8 md:h-10 flex-shrink-0" />
        </div>
        
        <div className="flex items-center gap-2">
          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="h-9 w-9"
            title={theme === 'dark' ? 'Modo claro' : 'Modo escuro'}
          >
            {theme === 'dark' ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </Button>
          
          {/* Feedback Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowFeedbackModal(true)}
            className="h-9 w-9"
            title="Enviar feedback"
          >
            <MessageSquare className="h-4 w-4" />
          </Button>
          
          <Button
            variant="outline"
            onClick={() => navigate('/home')}
            className="flex-shrink-0 text-sm md:text-base font-semibold"
          >
            Sou Farmacia
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Map Container */}
        <div ref={mapContainer} className="absolute inset-0 w-full h-full" />
        
        {/* Location Loading/Retry Button */}
        {!userLocation && !selectedMedicamento && !isNavigating && (
          isGettingLocation ? (
            <div className="absolute top-4 left-4 z-10 bg-card px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 border border-border">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              <span className="text-sm font-medium text-foreground">Obtendo localização...</span>
            </div>
          ) : (
            <Button 
              onClick={() => requestGeolocation()}
              className="absolute top-4 left-4 z-10 shadow-lg"
              size="sm"
              variant="default"
            >
              <MapPin className="h-4 w-4 mr-2" />
              Obter Localização
            </Button>
          )
        )}

        {/* Map Control Buttons - Custom controls only */}
        {!isNavigating && userLocation && (
          <div className="absolute bottom-44 right-4 flex flex-col gap-2 z-30">
            {/* Toggle Satellite/Map View */}
            <Button
              size="icon"
              variant="secondary"
              className="h-10 w-10 rounded-full shadow-lg bg-card hover:bg-accent border border-border"
              onClick={toggleMapType}
              title={mapType === 'roadmap' ? 'Vista satélite' : 'Vista mapa'}
            >
              {mapType === 'roadmap' ? (
                <Satellite className="h-4 w-4 text-primary" />
              ) : (
                <Layers className="h-4 w-4 text-primary" />
              )}
            </Button>
            
            {/* Toggle 2D/3D View */}
            <Button
              size="icon"
              variant="secondary"
              className="h-10 w-10 rounded-full shadow-lg bg-card hover:bg-accent border border-border"
              onClick={() => {
                toggleMapView();
              }}
              title={mapViewMode === '2d' ? 'Vista 3D' : 'Vista 2D'}
            >
              {mapViewMode === '2d' ? (
                <Eye className="h-4 w-4 text-primary" />
              ) : (
                <MapIcon className="h-4 w-4 text-primary" />
              )}
            </Button>
            
            {/* Reset Orientation (Compass) */}
            <Button
              size="icon"
              variant="secondary"
              className="h-10 w-10 rounded-full shadow-lg bg-card hover:bg-accent border border-border"
              onClick={() => {
                resetMapOrientation();
                toast({ title: 'Mapa orientado para norte' });
              }}
              title="Norte para cima"
            >
              <Compass className="h-4 w-4 text-primary" />
            </Button>
            
            {/* Night Mode Toggle */}
            <Button
              size="icon"
              variant="secondary"
              className="h-10 w-10 rounded-full shadow-lg bg-card hover:bg-accent border border-border"
              onClick={toggleNightMode}
              title={manualNightMode === 'auto' ? 'Automático' : manualNightMode === 'night' ? 'Noturno' : 'Diurno'}
            >
              {manualNightMode === 'night' ? (
                <Moon className="h-4 w-4 text-primary" />
              ) : manualNightMode === 'day' ? (
                <Sun className="h-4 w-4 text-primary" />
              ) : (
                <Sun className="h-4 w-4 text-muted-foreground" />
              )}
            </Button>
            
            {/* Recenter Button with Accuracy Indicator */}
            <div className="relative">
              <Button
                size="icon"
                variant="secondary"
                className={`h-10 w-10 rounded-full shadow-lg bg-card hover:bg-accent border border-border ${isGettingLocation ? 'animate-pulse' : ''}`}
                onClick={() => {
                  if (locationAccuracy && locationAccuracy > 50) {
                    requestGeolocation(true);
                  } else {
                    recenterMap();
                  }
                }}
                title={locationAccuracy ? `Precisão: ${Math.round(locationAccuracy)}m` : 'Centralizar no utilizador'}
              >
                {isGettingLocation ? (
                  <Loader2 className="h-4 w-4 text-primary animate-spin" />
                ) : (
                  <Crosshair className="h-4 w-4 text-primary" />
                )}
              </Button>
              {/* Accuracy indicator dot */}
              {locationAccuracy && (
                <div 
                  className={`absolute -top-1 -right-1 h-3 w-3 rounded-full border-2 border-card ${
                    locationAccuracy <= 30 ? 'bg-green-500' : 
                    locationAccuracy <= 50 ? 'bg-yellow-500' : 
                    locationAccuracy <= 100 ? 'bg-orange-500' : 'bg-red-500'
                  }`}
                  title={`Precisão: ${Math.round(locationAccuracy)}m`}
                />
              )}
            </div>
          </div>
        )}

        {/* Search Box - Hidden when pharmacy selected or during navigation */}
        {!selectedMedicamento && !isNavigating && (
          <>
            {isSearchCollapsed ? (
              <Button
                onClick={() => setIsSearchCollapsed(false)}
                className="absolute top-4 right-4 z-40 shadow-lg"
                size="icon"
                variant="default"
              >
                <Search className="h-4 w-4" />
              </Button>
            ) : (
          <div className="absolute top-2 left-2 right-2 md:left-auto md:top-2 md:right-2 md:w-[380px] md:max-h-[calc(100vh-120px)] md:overflow-y-auto bg-card rounded-xl shadow-lg p-4 z-40 transition-all duration-300 animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base md:text-lg font-bold text-foreground">Encontre ONDTem!</h2>
              <Button
                onClick={() => setIsSearchCollapsed(true)}
                size="icon"
                variant="ghost"
                className="h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="relative mb-3">
              {/* Search Input with Icon */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input
                  ref={searchInputRef}
                  type="text"
                  placeholder={loadingMedicamentos ? "Carregando catálogo..." : "Digite o medicamento..."}
                  value={medicamento}
                  disabled={loadingMedicamentos}
                  onChange={(e) => {
                    const value = e.target.value;
                    setMedicamento(value);
                    setSelectedFromDropdown(false);
                    typedSearchText.current = value;
                    setHighlightedIndex(-1);
                  }}
                  onKeyDown={(e) => {
                    const visibleMeds = filteredMedicamentos.slice(0, 8);
                    
                    if (e.key === 'ArrowDown') {
                      e.preventDefault();
                      if (visibleMeds.length > 0) {
                        setHighlightedIndex(prev => 
                          prev < visibleMeds.length - 1 ? prev + 1 : 0
                        );
                      }
                    } else if (e.key === 'ArrowUp') {
                      e.preventDefault();
                      if (visibleMeds.length > 0) {
                        setHighlightedIndex(prev => 
                          prev > 0 ? prev - 1 : visibleMeds.length - 1
                        );
                      }
                    } else if (e.key === 'Enter') {
                      e.preventDefault();
                      // If an item is highlighted, select it
                      if (highlightedIndex >= 0 && highlightedIndex < visibleMeds.length) {
                        const selectedMed = visibleMeds[highlightedIndex];
                        typedSearchText.current = medicamento;
                        setMedicamento(selectedMed.nome);
                        setSelectedFromDropdown(true);
                        setIsInputFocused(false);
                        setFilteredMedicamentos([]);
                        setHighlightedIndex(-1);
                        setTimeout(() => handleBuscar(selectedMed.nome), 50);
                      } else {
                        // No item highlighted - do regular search
                        const value = medicamento.trim();
                        if (value.length >= 3 && userLocation) {
                          setIsInputFocused(false);
                          setFilteredMedicamentos([]);
                          setHighlightedIndex(-1);
                          handleAutoSearch({ trigger: 'enter' });
                        }
                      }
                    } else if (e.key === 'Escape') {
                      e.preventDefault();
                      setIsInputFocused(false);
                      setFilteredMedicamentos([]);
                      setHighlightedIndex(-1);
                    }
                  }}
                  onFocus={() => {
                    setIsInputFocused(true);
                    setHighlightedIndex(-1);
                  }}
                  onBlur={() => setTimeout(() => {
                    setIsInputFocused(false);
                    setHighlightedIndex(-1);
                  }, 200)}
                  className="pl-10 pr-10 text-sm md:text-base h-10 md:h-11 rounded-lg border-2 border-border focus:border-primary transition-colors"
                />
                {medicamento ? (
                  <button
                    onClick={handleClearSearch}
                    className="absolute right-3 top-1/2 -translate-y-1/2 hover:bg-accent rounded-full p-1 transition-colors"
                  >
                    <X className="h-4 w-4 text-muted-foreground" />
                  </button>
                ) : loadingMedicamentos ? (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : null}
              </div>
            </div>

            {/* Autocomplete Suggestions - Rendered via Portal */}
            {isInputFocused && medicamento.trim().length >= 2 && filteredMedicamentos.length > 0 && dropdownPosition && createPortal(
              <div 
                className="fixed max-h-60 overflow-y-auto bg-card border border-border rounded-lg shadow-xl animate-in fade-in slide-in-from-top-1 duration-150"
                style={{
                  top: dropdownPosition.top,
                  left: dropdownPosition.left,
                  width: dropdownPosition.width,
                  zIndex: 99999,
                }}
                onMouseDown={(e) => e.preventDefault()}
              >
                {filteredMedicamentos.slice(0, 8).map((med, index) => (
                  <div
                    key={med.id}
                    className={`p-3 md:p-2.5 cursor-pointer transition-colors first:rounded-t-lg last:rounded-b-lg border-b border-border/50 last:border-b-0 flex items-start gap-2 ${
                      highlightedIndex === index 
                        ? 'bg-accent' 
                        : 'hover:bg-accent active:bg-accent/80'
                    }`}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      typedSearchText.current = medicamento;
                      setMedicamento(med.nome);
                      setSelectedFromDropdown(true);
                      setIsInputFocused(false);
                      setFilteredMedicamentos([]);
                      setHighlightedIndex(-1);
                      setTimeout(() => handleBuscar(med.nome), 50);
                    }}
                    onTouchEnd={(e) => {
                      e.preventDefault();
                      typedSearchText.current = medicamento;
                      setMedicamento(med.nome);
                      setSelectedFromDropdown(true);
                      setIsInputFocused(false);
                      setFilteredMedicamentos([]);
                      setHighlightedIndex(-1);
                      setTimeout(() => handleBuscar(med.nome), 50);
                    }}
                    onMouseEnter={() => setHighlightedIndex(index)}
                  >
                    <Plus className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-base md:text-sm text-foreground truncate">{med.nome}</div>
                      {med.categoria && (
                        <div className="text-xs text-muted-foreground mt-0.5 truncate">{med.categoria}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>,
              document.body
            )}

            {/* Radius Filter Buttons */}
            <div className="flex items-center gap-2 flex-wrap">
              <label className="text-xs md:text-sm font-semibold text-muted-foreground whitespace-nowrap flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                Raio:
              </label>
              <div className="flex gap-1.5 flex-wrap">
                {[1, 2, 4, 8, 16].map((radius) => (
                  <button
                    key={radius}
                    onClick={() => {
                      setRaioKm(radius);
                      // Re-execute search when radius changes if user already selected something
                      if (selectedFromDropdown && medicamento.trim()) {
                        setTimeout(() => handleBuscar(medicamento), 100);
                      }
                    }}
                    className={`px-3 py-1.5 rounded-full text-xs md:text-sm font-semibold transition-all duration-200 ${
                      raioKm === radius
                        ? 'bg-primary text-primary-foreground shadow-md scale-105'
                        : 'bg-card text-foreground hover:bg-accent border border-border hover:border-primary/50'
                    }`}
                  >
                    {radius}km
                  </button>
                ))}
              </div>
            </div>

            {/* Search Status Feedback */}
            {searchStatus !== 'idle' && (
              <div className={`mt-3 p-3 rounded-xl animate-in fade-in slide-in-from-top-2 duration-200 ${
                searchStatus === 'searching' ? 'bg-primary/5 border border-primary/20' :
                searchStatus === 'found' ? 'bg-accent border border-border' :
                'bg-destructive/10 border border-destructive/30'
              }`}>
                {searchStatus === 'searching' && (
                  <div className="flex items-center gap-3 text-primary">
                    <div className="h-5 w-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    <div className="flex-1">
                      <span className="text-sm font-medium">Buscando farmácias com </span>
                      <span className="text-sm font-bold text-primary">"{medicamento}"</span>
                      <span className="text-sm font-medium">...</span>
                    </div>
                  </div>
                )}
                {searchStatus === 'found' && (
                  <div className="flex items-center gap-2 text-primary">
                    <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <svg className="h-4 w-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <span className="text-sm font-semibold text-foreground">
                        {medicamentos.length} {medicamentos.length === 1 ? 'resultado' : 'resultados'} para{' '}
                      </span>
                      <span className="text-sm font-bold text-primary">"{medicamento}"</span>
                    </div>
                  </div>
                )}
                {searchStatus === 'not-found' && (
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-destructive/20 flex items-center justify-center flex-shrink-0">
                      <AlertCircle className="h-5 w-5 text-destructive" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-destructive text-sm">
                        Nenhum resultado para "{medicamento}"
                      </h4>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Tente aumentar o raio ou buscar outro medicamento.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Search Results */}
            {medicamentos.length > 0 && (
              <div className="mt-2 max-h-60 overflow-y-auto space-y-1.5">
                {medicamentos.map((item, index) => (
                  <Card
                    key={`${item.farmacia_id}-${index}`}
                    className="p-2 cursor-pointer hover:shadow-md transition-all duration-200 bg-accent border-l-2 border-l-primary"
                    onClick={() => showRouteToPharmacy(item, 'walking')}
                  >
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm md:text-base text-foreground truncate">{item.medicamento_nome}</h3>
                        <p className="text-xs md:text-sm text-muted-foreground truncate">{item.farmacia_nome}</p>
                      </div>
                      <div className="flex flex-col items-end gap-0.5 flex-shrink-0">
                        {item.farmacia_mostrar_preco ? (
                          <span className="text-sm md:text-base font-bold text-green-600">{item.medicamento_preco.toFixed(2)} MT</span>
                        ) : (
                          <span className="text-xs md:text-sm text-muted-foreground italic">Consultar preço</span>
                        )}
                        <span className="text-xs md:text-sm text-green-600 font-medium">{item.distancia_km.toFixed(1)}km</span>
                      </div>
                    </div>
                    {item.media_avaliacoes !== undefined && (
                      <div className="flex items-center gap-0.5 mt-1">
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        <span className="text-xs md:text-sm font-medium">{item.media_avaliacoes.toFixed(1)}</span>
                        <span className="text-xs md:text-sm text-muted-foreground">({item.total_avaliacoes})</span>
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            )}

            {/* Recent Searches */}
            {searchHistory.length > 0 && medicamento.trim().length === 0 && medicamentos.length === 0 && searchStatus === 'idle' && (
              <div className="mt-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs md:text-sm font-semibold text-muted-foreground flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5" />
                    Buscas Recentes
                  </h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs h-6 px-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    onClick={() => {
                      localStorage.removeItem('ondtem_search_history');
                      setSearchHistory([]);
                    }}
                  >
                    Limpar tudo
                  </Button>
                </div>
                <div className="space-y-1.5 max-h-40 overflow-y-auto">
                  {searchHistory.slice(0, 5).map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2.5 bg-muted/40 hover:bg-accent rounded-lg cursor-pointer group transition-all duration-200 border border-transparent hover:border-primary/20 hover:shadow-sm"
                      style={{ animationDelay: `${index * 50}ms` }}
                      onClick={() => {
                        typedSearchText.current = item;
                        setMedicamento(item);
                        setSelectedFromDropdown(true);
                        setTimeout(() => handleBuscar(item), 100);
                      }}
                    >
                      <div className="flex items-center gap-2.5 flex-1 min-w-0">
                        <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <Search className="h-3.5 w-3.5 text-primary" />
                        </div>
                        <span className="text-sm font-medium text-foreground truncate">{item}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="opacity-0 group-hover:opacity-100 transition-opacity h-7 w-7 p-0 hover:bg-destructive/10 hover:text-destructive rounded-full"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFromSearchHistory(item);
                        }}
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
            )}
          </>
        )}

        {/* Pharmacy Info Card - Hidden during navigation */}
        {selectedMedicamento && !isNavigating && (
          <Card className="absolute bottom-4 left-4 right-4 md:bottom-auto md:top-2 md:left-auto md:right-2 md:w-[380px] md:max-h-[calc(100vh-120px)] md:overflow-y-auto bg-card p-3 shadow-xl z-10 animate-in slide-in-from-bottom-5 md:slide-in-from-right-5 duration-300">
            <div className="space-y-2">
              {/* Header with medication name and close button */}
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-base md:text-lg lg:text-xl font-bold text-primary flex-1">
                  {selectedMedicamento.medicamento_nome} - {selectedMedicamento.farmacia_mostrar_preco ? `${selectedMedicamento.medicamento_preco.toFixed(2)} MT` : 'Consultar preço'}
                </h3>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleDeselectPharmacy}
                  className="h-7 w-7 hover:bg-accent shrink-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Pharmacy Name with Border */}
              <div className="border-l-4 border-l-green-500 pl-2">
                <p className="text-sm md:text-base lg:text-lg font-semibold text-foreground">{selectedMedicamento.farmacia_nome}</p>
              </div>

              {/* Star Rating and Operating Hours - Combined */}
              <div className="flex items-center justify-between gap-2">
                {selectedMedicamento.media_avaliacoes !== undefined && (
                  <div className="flex items-center gap-1">
                    <div className="flex items-center gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-3.5 w-3.5 md:h-4 md:w-4 ${
                            i < Math.round(selectedMedicamento.media_avaliacoes!)
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-xs md:text-sm font-bold">{selectedMedicamento.media_avaliacoes.toFixed(1)}</span>
                    <span className="text-[10px] md:text-xs text-muted-foreground">({selectedMedicamento.total_avaliacoes})</span>
                  </div>
                )}
                
                {/* Operating Hours */}
                {(() => {
                  const { isOpen, label } = isPharmacyOpen();
                  return (
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3 md:h-3.5 md:w-3.5 text-muted-foreground" />
                      <span className={`text-xs md:text-sm font-semibold ${isOpen ? 'text-green-600' : 'text-red-600'}`}>
                        {label}
                      </span>
                    </div>
                  );
                })()}
              </div>

              {/* Travel Metrics in One Line */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-sm md:text-base font-bold text-primary">📍 {routeInfo ? routeInfo.distance.toFixed(1) : selectedMedicamento.distancia_km.toFixed(1)} km</span>
                <Button
                  variant={travelModePreview === 'WALKING' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleTravelModePreview('WALKING')}
                  className="text-xs md:text-sm h-7 md:h-8 px-2"
                >
                  🚶 {walkingDuration > 0 ? `${Math.round(walkingDuration)}min` : 'A pé'}
                </Button>
                <Button
                  variant={travelModePreview === 'DRIVING' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleTravelModePreview('DRIVING')}
                  className="text-xs md:text-sm h-7 md:h-8 px-2"
                >
                  🚗 {drivingDuration > 0 ? `${Math.round(drivingDuration)}min` : 'Viatura'}
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => startNavigationWithMode(travelModePreview || 'WALKING')}
                  className="text-xs md:text-sm h-7 md:h-8 px-3 ml-auto bg-green-600 hover:bg-green-700 flex items-center gap-1"
                >
                  <Compass className="h-3 w-3 md:h-3.5 md:w-3.5" />
                  Iniciar
                </Button>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-3 gap-1.5 pt-1">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 md:h-8 text-xs md:text-sm"
                  onClick={() => setShowLeaveReview(true)}
                >
                  Avaliar
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 md:h-8 text-xs md:text-sm"
                  onClick={() => setShowViewReviews(true)}
                >
                  Avaliações
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 md:h-8 text-xs md:text-sm"
                  onClick={() => {
                    if (selectedMedicamento?.farmacia_telefone) {
                      window.location.href = `tel:${selectedMedicamento.farmacia_telefone}`;
                    } else {
                      toast({
                        title: 'Telefone indisponível',
                        description: 'Esta farmácia não tem número de telefone cadastrado.',
                        variant: 'destructive',
                        duration: 3000,
                      });
                    }
                  }}
                >
                  <Phone className="h-3 w-3 md:h-3.5 md:w-3.5 mr-1" />
                  Ligar
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Navigation UI - Improved layout */}
        {isNavigating && (
          <>
            {/* Navigation Instructions Card - Top */}
            <Card className="absolute top-4 left-4 right-4 lg:left-1/2 lg:-translate-x-1/2 lg:max-w-2xl bg-green-700 text-white p-4 md:p-5 shadow-xl z-20 animate-in fade-in slide-in-from-top-2 rounded-xl">
              <div className="space-y-3">
                {/* Current Direction */}
                <div className="flex items-start gap-3">
                  <div className="text-3xl md:text-4xl mt-1">↑</div>
                  <div className="flex-1">
                    <div className="text-lg md:text-xl lg:text-2xl font-bold leading-tight">{currentInstruction}</div>
                  </div>
                </div>
                
                {/* Next Direction */}
                {nextInstruction && (
                  <div className="flex items-center gap-2 pt-2 border-t border-white/20">
                    <span className="text-xs md:text-sm opacity-80">Depois</span>
                    <span className="text-sm md:text-base">↪</span>
                    <span className="text-xs md:text-sm opacity-90">{nextInstruction}</span>
                  </div>
                )}
              </div>
            </Card>

            {/* Control Buttons - Right side */}
            <div className="absolute right-4 bottom-60 md:bottom-64 lg:bottom-32 flex flex-col gap-3 z-30">
              {/* Toggle 2D/3D View */}
              <Button
                size="icon"
                variant="secondary"
                className="h-12 w-12 md:h-14 md:w-14 rounded-full shadow-lg bg-card hover:bg-accent border border-border"
                onClick={toggleMapView}
                title={mapViewMode === '2d' ? 'Vista 3D' : 'Vista 2D'}
              >
                {mapViewMode === '2d' ? (
                  <Eye className="h-5 w-5 md:h-6 md:w-6 text-primary" />
                ) : (
                  <MapIcon className="h-5 w-5 md:h-6 md:w-6 text-primary" />
                )}
              </Button>
              
              {/* Reset Orientation (Compass) */}
              <Button
                size="icon"
                variant="secondary"
                className="h-12 w-12 md:h-14 md:w-14 rounded-full shadow-lg bg-card hover:bg-accent border border-border"
                onClick={resetMapOrientation}
                title="Norte para cima"
              >
                <Compass className="h-5 w-5 md:h-6 md:w-6 text-primary" />
              </Button>
              
              {/* Recenter Button */}
              <Button
                size="icon"
                variant="secondary"
                className="h-12 w-12 md:h-14 md:w-14 rounded-full shadow-lg bg-card hover:bg-accent border border-border"
                onClick={recenterMap}
              >
                <MapPin className="h-5 w-5 md:h-6 md:w-6 text-primary" />
              </Button>
            </div>

            {/* Navigation Footer - Bottom card (mobile) / Side card (tablet/desktop) */}
            <Card className="absolute bottom-0 left-0 right-0 lg:bottom-4 lg:left-auto lg:right-4 lg:w-96 lg:rounded-xl bg-card border-t-2 lg:border-2 border-border p-4 md:p-5 shadow-2xl z-30 rounded-t-2xl lg:max-h-[calc(100vh-8rem)] lg:overflow-y-auto">
              <div className="space-y-4">
                {/* Header with Minimize and Close Buttons */}
                <div className="flex justify-between items-center">
                  <h3 className="text-base md:text-lg font-bold text-foreground">Navegação</h3>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setIsNavCardMinimized(!isNavCardMinimized)}
                      className="h-8 w-8"
                      title={isNavCardMinimized ? 'Maximizar' : 'Minimizar'}
                    >
                      {isNavCardMinimized ? (
                        <Maximize2 className="h-4 w-4" />
                      ) : (
                        <Minimize2 className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={stopNavigation}
                      className="text-sm font-medium hover:bg-destructive/10 hover:text-destructive"
                    >
                      Fechar
                    </Button>
                  </div>
                </div>

                {/* Collapsible content */}
                {!isNavCardMinimized && (
                  <>
                    {/* Trip Info Section */}
                    <div className="space-y-3 pb-3 border-b border-border">
                      {/* Destination */}
                      <div className="bg-muted/50 rounded-lg p-3">
                        <div className="text-xs md:text-sm font-semibold text-muted-foreground mb-1">Destino:</div>
                        <div className="text-sm md:text-base font-semibold text-foreground">{selectedMedicamento?.farmacia_nome}</div>
                      </div>
                    </div>

                    {/* Travel Time and Distance - Prominent Display */}
                    <div className="bg-primary/10 rounded-xl p-4 border border-primary/20">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-4xl md:text-5xl">{selectedTravelMode === 'WALKING' ? '🚶' : '🚗'}</span>
                          <div>
                            <div className="text-3xl md:text-4xl font-bold text-primary">
                              {Math.round(distanceToDestination * 1000 / (selectedTravelMode === 'WALKING' ? 80 : 800))} min
                            </div>
                            <div className="text-xs md:text-sm text-muted-foreground font-medium mt-1">
                              {Math.round(distanceToDestination * 1000)} m • Chegada: {arrivalTime}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </Card>
          </>
        )}
      </div>

      {/* Footer - Always visible */}
      <footer className="bg-card border-t border-border py-3 px-4 text-center text-xs md:text-sm text-muted-foreground transition-all duration-300">
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
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogAction 
              onClick={() => {
                setShowLocationDialog(false);
                requestGeolocation();
              }}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              Autorizar Localização
            </AlertDialogAction>
            <AlertDialogAction 
              onClick={() => navigate('/home')}
              className="bg-primary hover:bg-primary/90"
            >
              Sou Farmácia
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showArrivalModal} onOpenChange={handleCloseArrivalModal}>
        <AlertDialogContent className="sm:max-w-md w-[calc(100%-2rem)] mx-auto rounded-lg p-0 gap-0 overflow-hidden">
          <div className="relative">
            <button
              onClick={handleCloseArrivalModal}
              className="absolute top-3 right-3 z-10 p-1 rounded-full bg-background/80 hover:bg-background transition-colors"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="p-6 space-y-4">
              {/* Thank you message */}
              <div className="text-center space-y-2">
                <div className="text-4xl">🎉</div>
                <h2 className="text-xl font-bold text-primary">Chegou ao destino!</h2>
                <p className="text-sm text-muted-foreground">
                  Obrigado por usar o ONDTem para encontrar o seu medicamento.
                </p>
              </div>

              {/* Medicamento e Preço - apenas se veio de uma busca */}
              {selectedMedicamento && (
                <div className="space-y-3 bg-accent/50 rounded-lg p-4">
                  {isFromSearch && (
                    <>
                      <div className="text-sm text-muted-foreground">Você veio buscar:</div>
                      <h3 className="text-lg font-semibold text-primary">
                        {selectedMedicamento.medicamento_nome} {selectedMedicamento.farmacia_mostrar_preco ? `- ${selectedMedicamento.medicamento_preco.toFixed(2)} MT` : ''}
                      </h3>
                    </>
                  )}

                  {/* Nome da Farmácia com borda */}
                  <div className="border-l-4 border-primary pl-3 py-1">
                    <p className="font-medium text-foreground text-base uppercase">
                      {selectedMedicamento.farmacia_nome}
                    </p>
                  </div>

                  {/* Rating (se disponível) */}
                  {selectedMedicamento.media_avaliacoes !== undefined && selectedMedicamento.media_avaliacoes > 0 && (
                    <div className="flex items-center gap-2">
                      <div className="flex items-center">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`h-5 w-5 ${
                              star <= Math.round(selectedMedicamento.media_avaliacoes || 0)
                                ? 'fill-yellow-400 text-yellow-400'
                                : 'text-muted-foreground/30'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="font-semibold text-lg">
                        {selectedMedicamento.media_avaliacoes.toFixed(1)}
                      </span>
                      {selectedMedicamento.total_avaliacoes !== undefined && (
                        <span className="text-muted-foreground text-sm">
                          ({selectedMedicamento.total_avaliacoes})
                        </span>
                      )}
                    </div>
                  )}

                  {/* Métricas de viagem */}
                  {travelDuration && (
                    <div className="flex items-center gap-4 text-sm py-2 border-t border-border">
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="font-semibold">{travelDuration}</span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Botões de ação */}
              <div className="flex gap-2 pt-2">
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
                <Button
                  onClick={handleCloseArrivalModal}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  Ok
                </Button>
              </div>
            </div>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      {/* Feedback Modal */}
      <FeedbackModal
        open={showFeedbackModal}
        onOpenChange={setShowFeedbackModal}
      />

      {/* Search Feedback Modal - shown after navigation */}
      <SearchFeedbackModal
        open={showSearchFeedback}
        onOpenChange={setShowSearchFeedback}
        medicamento={selectedMedicamento?.medicamento_nome || medicamento}
        farmacia={selectedMedicamento?.farmacia_nome || ''}
      />
    </div>
  );
};

export default Buscar;
