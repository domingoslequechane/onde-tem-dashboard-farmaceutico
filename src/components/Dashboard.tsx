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

      <main className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 max-w-7xl">
        {/* Welcome Section */}
        <div className="mb-6 sm:mb-8 animate-fade-in">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-3">
            Bem-vindo, {user?.name}! 👋
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground mb-4">
            Gerencie seu estoque e analise a demanda em tempo real
          </p>
          
          <div className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-primary to-primary-light text-primary-foreground rounded-full text-sm font-medium shadow-md">
            <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span>Farmácia Verificada</span>
          </div>
        </div>
        
        <Tabs defaultValue="dashboard" className="w-full">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-5 mb-6 h-auto p-1.5 bg-muted/50 rounded-xl gap-1">
            <TabsTrigger 
              value="dashboard" 
              className="flex items-center justify-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-2.5 text-xs sm:text-sm rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-sm transition-all"
            >
              <LayoutDashboard className="h-4 w-4 flex-shrink-0" />
              <span className="truncate">Início</span>
            </TabsTrigger>
            <TabsTrigger 
              value="estoque" 
              className="flex items-center justify-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-2.5 text-xs sm:text-sm rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-sm transition-all"
            >
              <Package className="h-4 w-4 flex-shrink-0" />
              <span className="truncate">Estoque</span>
            </TabsTrigger>
            <TabsTrigger 
              value="demanda" 
              className="flex items-center justify-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-2.5 text-xs sm:text-sm rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-sm transition-all"
            >
              <TrendingUp className="h-4 w-4 flex-shrink-0" />
              <span className="truncate">Demanda</span>
            </TabsTrigger>
            <TabsTrigger 
              value="configuracoes" 
              className="flex items-center justify-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-2.5 text-xs sm:text-sm rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-sm transition-all col-span-2 sm:col-span-1"
            >
              <SettingsIcon className="h-4 w-4 flex-shrink-0" />
              <span className="truncate">Config.</span>
            </TabsTrigger>
            <TabsTrigger 
              value="suporte" 
              className="flex items-center justify-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-2.5 text-xs sm:text-sm rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-sm transition-all col-span-2 sm:col-span-1"
            >
              <MessageSquare className="h-4 w-4 flex-shrink-0" />
              <span className="truncate">Suporte</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="dashboard" className="mt-0 animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
              <div className="animate-slide-up">
                <StockControl />
              </div>
              <div className="animate-slide-up" style={{ animationDelay: '0.1s' }}>
                <DemandAnalysis />
              </div>
              <div className="md:col-span-2 xl:col-span-1 animate-slide-up" style={{ animationDelay: '0.2s' }}>
                <ServiceImpact />
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
