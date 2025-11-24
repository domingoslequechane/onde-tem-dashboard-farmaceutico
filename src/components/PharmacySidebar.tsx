import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  TrendingUp,
  Calendar,
  MessageSquare,
  Package,
  Users,
  BookOpen,
  Briefcase,
  DollarSign,
  HelpCircle,
  Settings,
  Sun,
  Moon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import ondeTemLogo from '@/assets/onde-tem-logo.png';

interface PharmacySidebarProps {
  className?: string;
}

const PharmacySidebar = ({ className }: PharmacySidebarProps) => {
  const location = useLocation();

  const mainMenu = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
    { icon: TrendingUp, label: 'Analytics', path: '/analytics' },
    { icon: Calendar, label: 'Calendar', path: '/calendar' },
    { icon: MessageSquare, label: 'Messages', path: '/messages' },
  ];

  const academicManagement = [
    { icon: Package, label: 'Stock', path: '/stock' },
    { icon: Users, label: 'Customers', path: '/customers' },
    { icon: BookOpen, label: 'Orders', path: '/orders' },
    { icon: Briefcase, label: 'Suppliers', path: '/suppliers' },
    { icon: DollarSign, label: 'Financial', path: '/financial' },
  ];

  const otherMenu = [
    { icon: HelpCircle, label: 'Help & Center', path: '/help' },
    { icon: Settings, label: 'Settings', path: '/farmacia/settings' },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <aside className={cn("h-screen border-r bg-card flex flex-col", className)}>
      {/* Logo */}
      <div className="p-6 border-b">
        <img src={ondeTemLogo} alt="Onde Tem?" className="h-8" />
        <p className="text-xs text-muted-foreground mt-2">Painel da Farmácia</p>
      </div>

      {/* Scrollable Menu */}
      <div className="flex-1 overflow-y-auto py-4">
        {/* Main Menu */}
        <div className="px-3 mb-6">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-3">
            Main Menu
          </p>
          <nav className="space-y-1">
            {mainMenu.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  isActive(item.path)
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <item.icon className="h-5 w-5 flex-shrink-0" />
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>
        </div>

        {/* Academic Management */}
        <div className="px-3 mb-6">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-3">
            Pharmacy Management
          </p>
          <nav className="space-y-1">
            {academicManagement.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  isActive(item.path)
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <item.icon className="h-5 w-5 flex-shrink-0" />
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>
        </div>

        <Separator className="mx-3 my-4" />

        {/* Other Menu */}
        <div className="px-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-3">
            Other Menu
          </p>
          <nav className="space-y-1">
            {otherMenu.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  isActive(item.path)
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <item.icon className="h-5 w-5 flex-shrink-0" />
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>
        </div>
      </div>

      {/* Theme Toggle */}
      <div className="p-4 border-t">
        <div className="flex items-center gap-2 p-2 bg-muted rounded-lg">
          <Button variant="ghost" size="sm" className="flex-1">
            <Sun className="h-4 w-4 mr-2" />
            Light
          </Button>
          <Button variant="ghost" size="sm" className="flex-1 bg-background">
            <Moon className="h-4 w-4 mr-2" />
            Dark
          </Button>
        </div>
      </div>
    </aside>
  );
};

export default PharmacySidebar;
