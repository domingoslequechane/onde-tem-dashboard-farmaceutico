import { useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Package, TrendingUp, Settings, MessageSquare } from 'lucide-react';

const FarmaciaNavigation = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  const navItems = [
    { path: '/farmacia/dashboard', label: 'Início', icon: LayoutDashboard },
    { path: '/farmacia/estoque', label: 'Estoque', icon: Package },
    { path: '/farmacia/demanda', label: 'Demanda', icon: TrendingUp },
    { path: '/farmacia/configuracoes', label: 'Configurações', icon: Settings },
    { path: '/farmacia/suporte', label: 'Suporte', icon: MessageSquare },
  ];

  return (
    <>
      {/* Desktop/Tablet Navigation */}
      <nav className="hidden sm:block bg-muted/30 border-b border-border mb-6">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="flex gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={`
                    flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all
                    border-b-2 -mb-px
                    ${active 
                      ? 'text-primary border-primary bg-background' 
                      : 'text-muted-foreground border-transparent hover:text-foreground hover:bg-muted/50'
                    }
                  `}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Mobile Bottom Navigation */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border shadow-lg">
        <div className="grid grid-cols-5 h-auto p-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`
                  flex flex-col items-center justify-center gap-0.5 px-1 py-1.5 text-xs rounded-lg transition-all
                  ${active 
                    ? 'bg-primary/10 text-primary' 
                    : 'text-muted-foreground hover:text-foreground'
                  }
                `}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                <span className="truncate text-[9px] leading-tight">
                  {item.label === 'Configurações' ? 'Config.' : item.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
};

export default FarmaciaNavigation;
