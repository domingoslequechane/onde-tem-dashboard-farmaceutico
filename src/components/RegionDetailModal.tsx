
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface RegionDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  regionName: string;
  regionData: {
    found: { name: string, count: number }[];
    notFound: { name: string, count: number }[];
  };
}

const RegionDetailModal = ({ isOpen, onClose, regionName, regionData }: RegionDetailModalProps) => {
  const chartData = [
    ...regionData.found.map(item => ({ name: item.name, encontrados: item.count, naoEncontrados: 0 })),
    ...regionData.notFound.map(item => {
      const existing = regionData.found.find(f => f.name === item.name);
      return existing 
        ? null 
        : { name: item.name, encontrados: 0, naoEncontrados: item.count };
    }).filter(Boolean)
  ].reduce((acc, curr) => {
    if (!curr) return acc;
    const existing = acc.find(item => item.name === curr.name);
    if (existing) {
      existing.encontrados += curr.encontrados;
      existing.naoEncontrados += curr.naoEncontrados;
    } else {
      acc.push(curr);
    }
    return acc;
  }, [] as any[]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Medicamentos Procurados - {regionName}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="name" 
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="encontrados" fill="#10b981" name="Encontrados" />
                <Bar dataKey="naoEncontrados" fill="#ef4444" name="Não Encontrados" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-green-50 p-3 rounded-lg">
              <h4 className="font-medium text-green-800 mb-2">Medicamentos Encontrados</h4>
              <div className="space-y-1">
                {regionData.found.map((item, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span>{item.name}</span>
                    <span className="font-medium">{item.count}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="bg-red-50 p-3 rounded-lg">
              <h4 className="font-medium text-red-800 mb-2">Medicamentos Não Encontrados</h4>
              <div className="space-y-1">
                {regionData.notFound.map((item, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span>{item.name}</span>
                    <span className="font-medium">{item.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RegionDetailModal;
