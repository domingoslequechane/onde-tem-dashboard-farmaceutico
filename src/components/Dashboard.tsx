import { useState } from 'react';
import Header from '@/components/Header';
import StockControl from '@/components/StockControl';
import DemandAnalysis from '@/components/DemandAnalysis';
import ServiceImpact from '@/components/ServiceImpact';
import EmergencyAlert from '@/components/EmergencyAlert';
import Settings from '@/components/Settings';
import Support from '@/components/Support';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Package, TrendingUp, Settings as SettingsIcon, MessageSquare, LayoutDashboard } from 'lucide-react';

interface DashboardProps {
  user: { email: string; name: string } | null;
  onLogout: () => void;
  farmacia?: any;
}

const Dashboard = ({ user, onLogout, farmacia }: DashboardProps) => {
  const [showEmergencyAlert, setShowEmergencyAlert] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <Header user={user} onLogout={onLogout} />
      
      {showEmergencyAlert && (
        <EmergencyAlert onClose={() => setShowEmergencyAlert(false)} />
      )}

      <main className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 max-w-7xl pb-24 sm:pb-8">
        {/* Welcome Section */}
        <div className="mb-4 sm:mb-6 animate-fade-in">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-2">
            Bem-vindo, {user?.name}! 👋
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground mb-3">
            Gerencie seu estoque e analise a demanda em tempo real
          </p>
          
          <div className="inline-flex items-center gap-2 px-3 py-2 bg-emerald-500 text-white rounded-full text-sm sm:text-base font-medium shadow-md">
            <svg className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span>Farmácia Verificada</span>
          </div>
        </div>
        
        <Tabs defaultValue="dashboard" className="w-full">
          <TabsList className="fixed bottom-0 left-0 right-0 z-50 grid w-full grid-cols-5 h-auto p-1.5 bg-background border-t border-border shadow-lg sm:static sm:grid-cols-5 sm:mb-6 sm:p-1.5 sm:bg-muted/50 sm:rounded-xl sm:gap-1 sm:border-0 sm:shadow-none">
            <TabsTrigger 
              value="dashboard" 
              className="flex flex-col items-center justify-center gap-0.5 px-1 py-1.5 text-xs rounded-lg data-[state=active]:bg-primary/10 data-[state=active]:text-primary transition-all sm:flex-row sm:gap-2 sm:px-3 sm:py-2.5 sm:text-sm sm:data-[state=active]:bg-card sm:data-[state=active]:shadow-sm"
            >
              <LayoutDashboard className="h-5 w-5 sm:h-4 sm:w-4 flex-shrink-0" />
              <span className="truncate text-[9px] sm:text-xs leading-tight">Início</span>
            </TabsTrigger>
            <TabsTrigger 
              value="estoque" 
              className="flex flex-col items-center justify-center gap-0.5 px-1 py-1.5 text-xs rounded-lg data-[state=active]:bg-primary/10 data-[state=active]:text-primary transition-all sm:flex-row sm:gap-2 sm:px-3 sm:py-2.5 sm:text-sm sm:data-[state=active]:bg-card sm:data-[state=active]:shadow-sm"
            >
              <Package className="h-5 w-5 sm:h-4 sm:w-4 flex-shrink-0" />
              <span className="truncate text-[9px] sm:text-xs leading-tight">Estoque</span>
            </TabsTrigger>
            <TabsTrigger 
              value="demanda" 
              className="flex flex-col items-center justify-center gap-0.5 px-1 py-1.5 text-xs rounded-lg data-[state=active]:bg-primary/10 data-[state=active]:text-primary transition-all sm:flex-row sm:gap-2 sm:px-3 sm:py-2.5 sm:text-sm sm:data-[state=active]:bg-card sm:data-[state=active]:shadow-sm"
            >
              <TrendingUp className="h-5 w-5 sm:h-4 sm:w-4 flex-shrink-0" />
              <span className="truncate text-[9px] sm:text-xs leading-tight">Demanda</span>
            </TabsTrigger>
            <TabsTrigger 
              value="configuracoes" 
              className="flex flex-col items-center justify-center gap-0.5 px-1 py-1.5 text-xs rounded-lg data-[state=active]:bg-primary/10 data-[state=active]:text-primary transition-all sm:flex-row sm:gap-2 sm:px-3 sm:py-2.5 sm:text-sm sm:data-[state=active]:bg-card sm:data-[state=active]:shadow-sm"
            >
              <SettingsIcon className="h-5 w-5 sm:h-4 sm:w-4 flex-shrink-0" />
              <span className="truncate text-[9px] sm:text-xs leading-tight">Config.</span>
            </TabsTrigger>
            <TabsTrigger 
              value="suporte" 
              className="flex flex-col items-center justify-center gap-0.5 px-1 py-1.5 text-xs rounded-lg data-[state=active]:bg-primary/10 data-[state=active]:text-primary transition-all sm:flex-row sm:gap-2 sm:px-3 sm:py-2.5 sm:text-sm sm:data-[state=active]:bg-card sm:data-[state=active]:shadow-sm"
            >
              <MessageSquare className="h-5 w-5 sm:h-4 sm:w-4 flex-shrink-0" />
              <span className="truncate text-[9px] sm:text-xs leading-tight">Suporte</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="dashboard" className="mt-0 animate-fade-in">
            <div className="space-y-4 sm:space-y-6">
              {/* Resultados Onde Tem - Full width on top */}
              <div className="animate-slide-up">
                <ServiceImpact />
              </div>
              
              {/* Grid with Stock Control and Demand Analysis */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                <div className="animate-slide-up" style={{ animationDelay: '0.1s' }}>
                  <StockControl />
                </div>
                <div className="animate-slide-up" style={{ animationDelay: '0.2s' }}>
                  <DemandAnalysis />
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="estoque" className="mt-0 animate-fade-in">
            <StockControl expanded={true} />
          </TabsContent>
          
          <TabsContent value="demanda" className="mt-0 animate-fade-in">
            <DemandAnalysis expanded={true} />
          </TabsContent>
          
          <TabsContent value="configuracoes" className="mt-0 animate-fade-in">
            <Settings farmacia={farmacia} />
          </TabsContent>
          
          <TabsContent value="suporte" className="mt-0 animate-fade-in">
            <Support />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Dashboard;
