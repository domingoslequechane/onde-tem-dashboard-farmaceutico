import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Scale, AlertCircle, CheckCircle, MinusCircle } from 'lucide-react';

export interface DemandGap {
  medication: string;
  totalDemand: number;
  pharmaciesWithStock: number;
  gapScore: number;
  inYourStock: boolean;
}

interface DemandGapTableProps {
  gaps: DemandGap[];
  isLoading?: boolean;
}

const DemandGapTable = ({ gaps, isLoading }: DemandGapTableProps) => {
  const getGapIndicator = (gap: DemandGap) => {
    if (!gap.inYourStock && gap.gapScore > 3) {
      return {
        icon: <AlertCircle className="h-4 w-4 text-red-500" />,
        label: 'Alta',
        color: 'bg-red-100 text-red-700 border-red-200',
        recommendation: 'Adicionar ao stock'
      };
    }
    if (gap.gapScore > 1.5) {
      return {
        icon: <MinusCircle className="h-4 w-4 text-amber-500" />,
        label: 'Média',
        color: 'bg-amber-100 text-amber-700 border-amber-200',
        recommendation: gap.inYourStock ? 'Aumentar quantidade' : 'Considerar adicionar'
      };
    }
    return {
      icon: <CheckCircle className="h-4 w-4 text-emerald-500" />,
      label: 'Baixa',
      color: 'bg-emerald-100 text-emerald-700 border-emerald-200',
      recommendation: 'Equilibrado'
    };
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center text-sm">
            <Scale className="mr-2 h-4 w-4 text-primary" />
            Gap Procura vs Oferta
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

  if (gaps.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center text-sm">
            <Scale className="mr-2 h-4 w-4 text-primary" />
            Gap Procura vs Oferta
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[200px] flex items-center justify-center text-center text-muted-foreground text-sm">
            Nenhum dado de gap disponível
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
            <Scale className="mr-2 h-4 w-4 text-primary" />
            Gap Procura vs Oferta
          </div>
          <Badge variant="outline" className="text-xs">
            Top {gaps.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="text-xs">
                <TableHead className="py-2 px-3">Medicamento</TableHead>
                <TableHead className="py-2 px-3 text-center">Procura</TableHead>
                <TableHead className="py-2 px-3 text-center">Oferta</TableHead>
                <TableHead className="py-2 px-3 text-center">Gap</TableHead>
                <TableHead className="py-2 px-3">Recomendação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {gaps.slice(0, 10).map((gap, index) => {
                const indicator = getGapIndicator(gap);
                return (
                  <TableRow key={index} className="text-xs">
                    <TableCell className="py-2 px-3 font-medium">
                      <div className="flex items-center gap-2">
                        {gap.inYourStock && (
                          <span className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" title="No seu stock" />
                        )}
                        <span className="truncate max-w-[150px]">{gap.medication}</span>
                      </div>
                    </TableCell>
                    <TableCell className="py-2 px-3 text-center font-semibold text-blue-600">
                      {gap.totalDemand}
                    </TableCell>
                    <TableCell className="py-2 px-3 text-center">
                      {gap.pharmaciesWithStock} farm.
                    </TableCell>
                    <TableCell className="py-2 px-3 text-center">
                      <Badge variant="outline" className={`text-xs ${indicator.color}`}>
                        {indicator.icon}
                        <span className="ml-1">{indicator.label}</span>
                      </Badge>
                    </TableCell>
                    <TableCell className="py-2 px-3 text-muted-foreground">
                      {indicator.recommendation}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default DemandGapTable;
