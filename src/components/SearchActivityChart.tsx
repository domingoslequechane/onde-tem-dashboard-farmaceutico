import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const SearchActivityChart = () => {
  const data = [
    { week: 'Week 1', thisMonth: 12, lastMonth: 8 },
    { week: 'Week 2', thisMonth: 16, lastMonth: 10 },
    { week: 'Week 3', thisMonth: 14, lastMonth: 12 },
    { week: 'Week 4', thisMonth: 18, lastMonth: 6 },
  ];

  const maxValue = 20;

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold">Estatísticas de Buscas</h3>
        <div className="flex gap-3 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-violet-600"></div>
            <span>Este Mês</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-gray-300"></div>
            <span>Mês Passado</span>
          </div>
        </div>
      </div>

      <div className="relative h-64">
        {/* Y-axis labels */}
        <div className="absolute left-0 top-0 bottom-8 flex flex-col justify-between text-xs text-muted-foreground">
          {[20, 16, 12, 8, 4, 1].map((value) => (
            <div key={value}>{value}h</div>
          ))}
        </div>

        {/* Chart area */}
        <div className="ml-8 h-full flex items-end gap-4 pb-8">
          {data.map((item, index) => (
            <div key={index} className="flex-1 flex flex-col items-center gap-3">
              {/* Bars */}
              <div className="w-full flex gap-1 items-end" style={{ height: '200px' }}>
                <div className="flex-1 relative group">
                  <div
                    className="w-full bg-violet-600 rounded-t-lg transition-all hover:bg-violet-700 cursor-pointer"
                    style={{ height: `${(item.thisMonth / maxValue) * 100}%` }}
                  >
                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Badge variant="secondary" className="text-xs whitespace-nowrap">
                        {item.thisMonth}h 42m
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="flex-1 relative group">
                  <div
                    className="w-full bg-gray-300 rounded-t-lg transition-all hover:bg-gray-400 cursor-pointer"
                    style={{ height: `${(item.lastMonth / maxValue) * 100}%` }}
                  >
                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Badge variant="secondary" className="text-xs whitespace-nowrap">
                        {item.lastMonth}h 32m
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
              {/* X-axis label */}
              <span className="text-xs text-muted-foreground">{item.week}</span>
            </div>
          ))}
        </div>

        {/* Current indicator */}
        <div className="absolute right-0 top-1/3 transform -translate-y-1/2">
          <div className="flex items-center gap-2">
            <div className="border-l-2 border-dashed border-gray-300 h-32"></div>
            <div className="bg-white border rounded-lg p-2 shadow-md">
              <div className="text-xs text-muted-foreground">2 Sept 2023</div>
              <div className="font-semibold">12h 42m</div>
              <div className="text-xs text-emerald-600">6h 32m</div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default SearchActivityChart;
