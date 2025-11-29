import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { supabase } from '@/integrations/supabase/client';

interface DemandHeatmapProps {
  neighborhoods: Array<{
    name: string;
    searches: number;
    latitude?: number;
    longitude?: number;
  }>;
}

const DemandHeatmap = ({ neighborhoods }: DemandHeatmapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapboxToken, setMapboxToken] = useState<string>('');

  useEffect(() => {
    fetchMapboxToken();
  }, []);

  const fetchMapboxToken = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('get-mapbox-token');
      if (error) throw error;
      setMapboxToken(data.token);
    } catch (error) {
      console.error('Error fetching Mapbox token:', error);
    }
  };

  useEffect(() => {
    if (!mapContainer.current || !mapboxToken || map.current) return;

    mapboxgl.accessToken = mapboxToken;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: [32.5892, -25.9655], // Mozambique center
      zoom: 10,
    });

    map.current.on('load', () => {
      if (!map.current) return;

      // Create heatmap data from neighborhoods
      const features = neighborhoods.map((area, index) => {
        // Generate approximate coordinates if not provided
        const baseLat = -25.9655;
        const baseLng = 32.5892;
        const lat = area.latitude || baseLat + (Math.random() - 0.5) * 0.2;
        const lng = area.longitude || baseLng + (Math.random() - 0.5) * 0.2;

        return {
          type: 'Feature' as const,
          properties: {
            name: area.name,
            searches: area.searches,
          },
          geometry: {
            type: 'Point' as const,
            coordinates: [lng, lat],
          },
        };
      });

      const geojsonData: GeoJSON.FeatureCollection = {
        type: 'FeatureCollection',
        features: features,
      };

      // Add heatmap source
      map.current!.addSource('demand-heatmap', {
        type: 'geojson',
        data: geojsonData,
      });

      // Add heatmap layer
      map.current!.addLayer({
        id: 'demand-heat',
        type: 'heatmap',
        source: 'demand-heatmap',
        maxzoom: 15,
        paint: {
          // Increase weight based on searches
          'heatmap-weight': [
            'interpolate',
            ['linear'],
            ['get', 'searches'],
            0, 0,
            100, 1
          ],
          // Increase intensity as zoom level increases
          'heatmap-intensity': [
            'interpolate',
            ['linear'],
            ['zoom'],
            0, 1,
            15, 3
          ],
          // Color ramp for heatmap
          'heatmap-color': [
            'interpolate',
            ['linear'],
            ['heatmap-density'],
            0, 'rgba(33,102,172,0)',
            0.2, 'rgb(103,169,207)',
            0.4, 'rgb(209,229,240)',
            0.6, 'rgb(253,219,199)',
            0.8, 'rgb(239,138,98)',
            1, 'rgb(178,24,43)'
          ],
          // Adjust radius by zoom level
          'heatmap-radius': [
            'interpolate',
            ['linear'],
            ['zoom'],
            0, 15,
            15, 30
          ],
          // Transition from heatmap to circle layer
          'heatmap-opacity': [
            'interpolate',
            ['linear'],
            ['zoom'],
            7, 1,
            15, 0
          ],
        }
      });

      // Add circle layer for individual points at higher zoom
      map.current!.addLayer({
        id: 'demand-points',
        type: 'circle',
        source: 'demand-heatmap',
        minzoom: 12,
        paint: {
          'circle-radius': [
            'interpolate',
            ['linear'],
            ['get', 'searches'],
            0, 5,
            100, 25
          ],
          'circle-color': [
            'interpolate',
            ['linear'],
            ['get', 'searches'],
            0, '#3b82f6',
            50, '#f59e0b',
            100, '#ef4444'
          ],
          'circle-opacity': 0.8,
          'circle-stroke-width': 2,
          'circle-stroke-color': '#fff'
        }
      });

      // Add labels
      map.current!.addLayer({
        id: 'demand-labels',
        type: 'symbol',
        source: 'demand-heatmap',
        minzoom: 13,
        layout: {
          'text-field': ['get', 'name'],
          'text-size': 12,
          'text-offset': [0, 1.5],
          'text-anchor': 'top'
        },
        paint: {
          'text-color': '#ffffff',
          'text-halo-color': '#000000',
          'text-halo-width': 1
        }
      });

      // Add popup on hover
      const popup = new mapboxgl.Popup({
        closeButton: false,
        closeOnClick: false
      });

      map.current!.on('mouseenter', 'demand-points', (e) => {
        if (!map.current || !e.features || e.features.length === 0) return;
        map.current.getCanvas().style.cursor = 'pointer';

        const coordinates = (e.features[0].geometry as any).coordinates.slice();
        const { name, searches } = e.features[0].properties as any;

        popup
          .setLngLat(coordinates)
          .setHTML(`<strong>${name}</strong><br/>${searches} buscas`)
          .addTo(map.current);
      });

      map.current!.on('mouseleave', 'demand-points', () => {
        if (!map.current) return;
        map.current.getCanvas().style.cursor = '';
        popup.remove();
      });
    });

    // Add navigation controls
    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    return () => {
      map.current?.remove();
    };
  }, [mapboxToken, neighborhoods]);

  return (
    <div className="relative w-full h-64 sm:h-80 md:h-96 rounded-lg overflow-hidden">
      <div ref={mapContainer} className="absolute inset-0" />
      
      {/* Legend */}
      <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-sm rounded-lg p-2 sm:p-3 shadow-lg">
        <div className="text-xs sm:text-sm font-semibold mb-2">Intensidade de Demanda</div>
        <div className="flex flex-col space-y-1">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 rounded-full bg-blue-500"></div>
            <span className="text-xs">Baixa</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 rounded-full bg-orange-500"></div>
            <span className="text-xs">Média</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 rounded-full bg-red-500"></div>
            <span className="text-xs">Alta</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DemandHeatmap;
