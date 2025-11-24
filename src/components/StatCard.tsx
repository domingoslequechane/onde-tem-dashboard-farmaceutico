import { Card } from '@/components/ui/card';
import { TrendingUp, TrendingDown, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface StatCardProps {
  title: string;
  value: string | number;
  change: string;
  trend: 'up' | 'down';
  sparklineData?: number[];
}

const StatCard = ({ title, value, change, trend, sparklineData = [] }: StatCardProps) => {
  const points = sparklineData.length > 0 
    ? sparklineData 
    : [20, 35, 25, 45, 30, 50, 40];

  const max = Math.max(...points);
  const min = Math.min(...points);
  const range = max - min;

  const svgPoints = points.map((point, index) => {
    const x = (index / (points.length - 1)) * 100;
    const y = 100 - ((point - min) / range) * 80;
    return `${x},${y}`;
  }).join(' ');

  return (
    <Card className="p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <p className="text-sm text-muted-foreground mb-1">{title}</p>
          <p className="text-3xl font-bold text-foreground">{value}</p>
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <MoreVertical className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex items-center gap-2 mb-3">
        <span className={`text-sm font-medium ${trend === 'up' ? 'text-emerald-600' : 'text-red-600'}`}>
          {change}
        </span>
        <span className="text-xs text-muted-foreground">
          {trend === 'up' ? 'increase in 20 Days' : 'decrease than before'}
        </span>
      </div>

      <div className="h-16 w-full">
        <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          <defs>
            <linearGradient id={`gradient-${title}`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={trend === 'up' ? '#10b981' : '#ef4444'} stopOpacity="0.3" />
              <stop offset="100%" stopColor={trend === 'up' ? '#10b981' : '#ef4444'} stopOpacity="0" />
            </linearGradient>
          </defs>
          <polygon
            points={`0,100 ${svgPoints} 100,100`}
            fill={`url(#gradient-${title})`}
          />
          <polyline
            points={svgPoints}
            fill="none"
            stroke={trend === 'up' ? '#10b981' : '#ef4444'}
            strokeWidth="2"
          />
        </svg>
      </div>
    </Card>
  );
};

export default StatCard;
