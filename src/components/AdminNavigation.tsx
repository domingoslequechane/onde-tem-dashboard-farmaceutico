import { useNavigate, useLocation } from 'react-router-dom';
import { BarChart3, Building2, Users } from 'lucide-react';

const AdminNavigation = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  const navItems = [
    { path: '/admin/estatisticas', label: 'Estatísticas', icon: BarChart3 },
    { path: '/admin/farmacias', label: 'Farmácias', icon: Building2 },
    { path: '/admin/administradores', label: 'Administradores', icon: Users },
  ];

  return (
    <nav className="bg-muted/30 border-b border-border mb-6">
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
                <span className="hidden sm:inline">{item.label}</span>
                <span className="sm:hidden">{item.label.split(' ')[0]}</span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};

export default AdminNavigation;
