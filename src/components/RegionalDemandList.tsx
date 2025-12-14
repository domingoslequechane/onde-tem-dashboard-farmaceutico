import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, TrendingUp, ChevronRight } from 'lucide-react';

export interface RegionalDemand {
  regionName: string;
  latitude: number;
  longitude: number;
  totalSearches: number;
  topProducts: string[];
  distanceKm: number;
}

interface RegionalDemandListProps {
  regions: RegionalDemand[];
  isLoading?: boolean;
  onRegionClick?: (region: RegionalDemand) => void;
}

const RADIUS_OPTIONS = [1, 2, 4, 8, 16];

const RegionalDemandList = ({ regions, isLoading, onRegionClick }: RegionalDemandListProps) => {
  const [selectedRadius, setSelectedRadius] = useState(4);

  const filteredRegions = regions.filter(r => r.distanceKm <= selectedRadius);

  const getLevelBadge = (searches: number) => {
    if (searches > 50) return { label: 'Alta', color: 'bg-red-100 text-red-700 border-red-200' };
    if (searches > 20) return { label: 'Média', color: 'bg-amber-100 text-amber-700 border-amber-200' };
    return { label: 'Baixa', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' };
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center text-sm">
            <MapPin className="mr-2 h-4 w-4 text-primary" />
            Demanda por Região
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[200px] flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-sm">
          <div className="flex items-center">
            <MapPin className="mr-2 h-4 w-4 text-primary" />
            Demanda por Região
          </div>
          <Badge variant="outline" className="text-xs">
            {filteredRegions.length} locais
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Radius Filter */}
        <div className="flex items-center gap-1 flex-wrap">
          <span className="text-xs text-muted-foreground mr-1">Raio:</span>
          {RADIUS_OPTIONS.map(radius => (
            <Button
              key={radius}
              variant={selectedRadius === radius ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedRadius(radius)}
              className="h-6 px-2 text-xs"
            >
              {radius}km
            </Button>
          ))}
        </div>

        {/* Regions List */}
        <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1">
          {filteredRegions.length === 0 ? (
            <div className="h-[150px] flex items-center justify-center text-center text-muted-foreground text-sm">
              <div>
                <MapPin className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Nenhuma busca neste raio</p>
                <p className="text-xs">Tente aumentar o raio de busca</p>
              </div>
            </div>
          ) : (
            filteredRegions
              .sort((a, b) => b.totalSearches - a.totalSearches)
              .map((region, index) => {
                const level = getLevelBadge(region.totalSearches);
                return (
                  <div 
                    key={index}
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border cursor-pointer hover:bg-muted transition-colors"
                    onClick={() => onRegionClick?.(region)}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm truncate">{region.regionName}</span>
                        <Badge variant="outline" className={`text-xs ${level.color}`}>
                          {level.label}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {region.distanceKm.toFixed(1)}km
                        </span>
                        <span className="flex items-center gap-1">
                          <TrendingUp className="h-3 w-3" />
                          {region.totalSearches} buscas
                        </span>
                      </div>
                      {region.topProducts.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {region.topProducts.slice(0, 3).map((product, i) => (
                            <span 
                              key={i} 
                              className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded"
                            >
                              {product}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  </div>
                );
              })
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default RegionalDemandList;
