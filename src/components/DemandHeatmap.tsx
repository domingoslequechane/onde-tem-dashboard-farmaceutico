import { useEffect, useRef, useState } from 'react';
import { setOptions, importLibrary } from '@googlemaps/js-api-loader';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin } from 'lucide-react';

interface NeighborhoodData {
  name: string;
  searches: number;
  latitude?: number;
  longitude?: number;
  topProducts?: string[];
}

interface DemandHeatmapProps {
  neighborhoods?: NeighborhoodData[];
  onRegionClick?: (region: NeighborhoodData) => void;
}

const DemandHeatmap = ({ neighborhoods: propNeighborhoods, onRegionClick }: DemandHeatmapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<google.maps.Map | null>(null);
  const heatmap = useRef<google.maps.visualization.HeatmapLayer | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const [googleMapsKey, setGoogleMapsKey] = useState<string>('');
  const [neighborhoods, setNeighborhoods] = useState<NeighborhoodData[]>(propNeighborhoods || []);

  useEffect(() => {
    fetchGoogleMapsKey();
    if (!propNeighborhoods) {
      fetchNeighborhoodData();
    }
  }, []);

  useEffect(() => {
    if (propNeighborhoods) {
      setNeighborhoods(propNeighborhoods);
    }
  }, [propNeighborhoods]);

  const fetchNeighborhoodData = async () => {
    try {
      // Fetch from searches table with product selections
      const { data: searchesData, error: searchesError } = await supabase
        .from('searches')
        .select(`
          id,
          latitude,
          longitude,
          typed_text,
          submitted_text,
          product_selections (
            product_name
          )
        `)
        .not('latitude', 'is', null)
        .not('longitude', 'is', null);
      
      if (searchesError) throw searchesError;

      // Aggregate searches by location (grid-based clustering)
      const locationMap = new Map<string, { 
        searches: number; 
        lat: number; 
        lng: number;
        products: Map<string, number>;
      }>();
      
      searchesData?.forEach((search) => {
        if (!search.latitude || !search.longitude) return;
        
        const lat = Number(search.latitude);
        const lng = Number(search.longitude);
        
        // Create grid key (approximately 500m cells)
        const gridKey = `${Math.round(lat * 200) / 200}_${Math.round(lng * 200) / 200}`;
        
        const existing = locationMap.get(gridKey) || { 
          searches: 0, 
          lat, 
          lng, 
          products: new Map() 
        };
        
        // Get product name from selection or search text
        const productName = search.product_selections?.[0]?.product_name || 
                          search.submitted_text || 
                          search.typed_text;
        
        if (productName) {
          const normalizedName = productName.toLowerCase().trim();
          existing.products.set(normalizedName, (existing.products.get(normalizedName) || 0) + 1);
        }
        
        locationMap.set(gridKey, {
          searches: existing.searches + 1,
          lat: (existing.lat * existing.searches + lat) / (existing.searches + 1),
          lng: (existing.lng * existing.searches + lng) / (existing.searches + 1),
          products: existing.products,
        });
      });

      const neighborhoodData: NeighborhoodData[] = Array.from(locationMap.entries()).map(([key, data]) => {
        // Get top 5 products
        const sortedProducts = Array.from(data.products.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([name]) => name.charAt(0).toUpperCase() + name.slice(1));
        
        return {
          name: `Região ${key.replace('_', ', ')}`,
          searches: data.searches,
          latitude: data.lat,
          longitude: data.lng,
          topProducts: sortedProducts,
        };
      });

      setNeighborhoods(neighborhoodData);
    } catch (error) {
      console.error('Error fetching neighborhood data:', error);
    }
  };

  const fetchGoogleMapsKey = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('get-google-maps-key');
      if (error) throw error;
      setGoogleMapsKey(data.key);
    } catch (error) {
      console.error('Error fetching Google Maps key:', error);
    }
  };

  useEffect(() => {
    if (!mapContainer.current || !googleMapsKey || map.current) return;

    const initMap = async () => {
      try {
        setOptions({
          key: googleMapsKey,
          v: 'weekly',
        });

        await importLibrary('maps');
        await importLibrary('visualization');

        const mapInstance = new google.maps.Map(mapContainer.current!, {
          center: { lat: -25.9655, lng: 32.5892 }, // Mozambique center
          zoom: 10,
          mapTypeId: 'roadmap',
          styles: [
            { elementType: "geometry", stylers: [{ color: "#212121" }] },
            { elementType: "labels.icon", stylers: [{ visibility: "off" }] },
            { elementType: "labels.text.fill", stylers: [{ color: "#757575" }] },
            { elementType: "labels.text.stroke", stylers: [{ color: "#212121" }] },
            {
              featureType: "administrative",
              elementType: "geometry",
              stylers: [{ color: "#757575" }],
            },
            {
              featureType: "poi",
              elementType: "labels.text.fill",
              stylers: [{ color: "#757575" }],
            },
            {
              featureType: "water",
              elementType: "geometry",
              stylers: [{ color: "#000000" }],
            },
            {
              featureType: "water",
              elementType: "labels.text.fill",
              stylers: [{ color: "#3d3d3d" }],
            },
          ],
        });

        map.current = mapInstance;

        // Create heatmap data from neighborhoods
        const heatmapData = neighborhoods.map((area) => {
          const baseLat = -25.9655;
          const baseLng = 32.5892;
          const lat = area.latitude || baseLat + (Math.random() - 0.5) * 0.2;
          const lng = area.longitude || baseLng + (Math.random() - 0.5) * 0.2;

          return {
            location: new google.maps.LatLng(lat, lng),
            weight: area.searches,
          };
        });

        // Create heatmap layer
        const heatmapLayer = new google.maps.visualization.HeatmapLayer({
          data: heatmapData,
          map: mapInstance,
          radius: 30,
          opacity: 0.8,
          gradient: [
            'rgba(33,102,172,0)',
            'rgb(103,169,207)',
            'rgb(209,229,240)',
            'rgb(253,219,199)',
            'rgb(239,138,98)',
            'rgb(178,24,43)'
          ],
        });

        heatmap.current = heatmapLayer;

        // Add markers for individual points
        neighborhoods.forEach((area) => {
          const baseLat = -25.9655;
          const baseLng = 32.5892;
          const lat = area.latitude || baseLat + (Math.random() - 0.5) * 0.2;
          const lng = area.longitude || baseLng + (Math.random() - 0.5) * 0.2;

          // Determine color based on searches
          let color = '#3b82f6'; // blue
          if (area.searches >= 100) color = '#ef4444'; // red
          else if (area.searches >= 50) color = '#f59e0b'; // orange

          const marker = new google.maps.Marker({
            position: { lat, lng },
            map: mapInstance,
            icon: {
              path: google.maps.SymbolPath.CIRCLE,
              scale: Math.min(5 + (area.searches / 100) * 20, 25),
              fillColor: color,
              fillOpacity: 0.8,
              strokeColor: '#fff',
              strokeWeight: 2,
            },
          });

          const infoWindow = new google.maps.InfoWindow({
            content: `<div style="color: #000;"><strong>${area.name}</strong><br/>${area.searches} buscas</div>`,
          });

          marker.addListener('mouseover', () => {
            infoWindow.open(mapInstance, marker);
          });

          marker.addListener('mouseout', () => {
            infoWindow.close();
          });
        });
      } catch (error) {
        console.error('Error initializing Google Maps:', error);
      }
    };

    initMap();

    return () => {
      if (heatmap.current) {
        heatmap.current.setMap(null);
      }
    };
  }, [googleMapsKey, neighborhoods]);

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="py-3 sm:py-4 px-4 sm:px-6 flex-shrink-0">
        <CardTitle className="text-base sm:text-lg flex items-center gap-2">
          <MapPin className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
          Mapa de Demanda por Região
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0 flex-1 min-h-0">
        <div className="relative w-full h-full min-h-[300px] rounded-b-lg overflow-hidden">
          <div ref={mapContainer} className="absolute inset-0" />
          
          {/* Legend */}
          <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-sm rounded-lg p-2 sm:p-3 shadow-lg">
            <div className="text-xs sm:text-sm font-semibold mb-2 text-foreground">Intensidade de Demanda</div>
            <div className="flex flex-col space-y-1">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 rounded-full bg-blue-500"></div>
                <span className="text-xs text-foreground">Baixa</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 rounded-full bg-orange-500"></div>
                <span className="text-xs text-foreground">Média</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 rounded-full bg-red-500"></div>
                <span className="text-xs text-foreground">Alta</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DemandHeatmap;
