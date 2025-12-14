import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, TrendingUp, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface MissingProduct {
  name: string;
  searchCount: number;
  inOtherPharmacies: number;
}

interface MissingProductsCardProps {
  products: MissingProduct[];
  isLoading?: boolean;
  onAddToStock?: (productName: string) => void;
}

const MissingProductsCard = ({ products, isLoading, onAddToStock }: MissingProductsCardProps) => {
  if (isLoading) {
    return (
      <Card className="border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center text-sm text-amber-800">
            <AlertTriangle className="mr-2 h-4 w-4" />
            Oportunidades Perdidas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[180px] flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-amber-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (products.length === 0) {
    return (
      <Card className="border-emerald-200 bg-gradient-to-br from-emerald-50 to-green-50">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center text-sm text-emerald-800">
            <TrendingUp className="mr-2 h-4 w-4" />
            Oportunidades Perdidas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[180px] flex items-center justify-center text-center">
            <div>
              <div className="text-3xl mb-2">🎉</div>
              <p className="text-sm text-emerald-700 font-medium">Excelente!</p>
              <p className="text-xs text-emerald-600">Você tem todos os produtos procurados</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-sm">
          <div className="flex items-center text-amber-800">
            <AlertTriangle className="mr-2 h-4 w-4" />
            Oportunidades Perdidas
          </div>
          <Badge variant="outline" className="bg-amber-100 text-amber-700 border-amber-300">
            {products.length} produtos
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <p className="text-xs text-amber-700 mb-3">
          Produtos buscados por clientes que você não tem em stock
        </p>
        <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1">
          {products.slice(0, 5).map((product, index) => (
            <div 
              key={index} 
              className="flex items-center justify-between p-2 bg-white/80 rounded-lg border border-amber-100"
            >
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm text-gray-800 truncate">{product.name}</div>
                <div className="text-xs text-amber-600">
                  {product.searchCount}x buscado
                  {product.inOtherPharmacies > 0 && (
                    <span className="text-gray-500"> • {product.inOtherPharmacies} farmácias têm</span>
                  )}
                </div>
              </div>
              {onAddToStock && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onAddToStock(product.name)}
                  className="h-7 px-2 text-amber-700 hover:text-amber-900 hover:bg-amber-100"
                >
                  <Plus className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          ))}
        </div>
        {products.length > 5 && (
          <p className="text-xs text-amber-600 text-center pt-1">
            +{products.length - 5} mais produtos
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default MissingProductsCard;
