import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageSquare } from 'lucide-react';

const Support = () => {
  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Chat de Suporte
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex items-center justify-center py-8">
        <div className="text-center space-y-3 px-4">
          <div className="mx-auto w-14 h-14 bg-gradient-to-br from-green-100 to-blue-100 rounded-full flex items-center justify-center">
            <MessageSquare className="h-7 w-7 text-green-600" />
          </div>
          <div>
            <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-2">
              Em Breve
            </h3>
            <p className="text-sm sm:text-base text-muted-foreground max-w-md mx-auto">
              Estamos desenvolvendo uma nova funcionalidade de chat em tempo real para melhor atendê-lo. 
              Aguarde, em breve você poderá conversar diretamente com nossa equipe de suporte!
            </p>
          </div>
          <div className="pt-3">
            <p className="text-xs sm:text-sm text-muted-foreground">
              Enquanto isso, você pode nos contatar por:
            </p>
            <p className="text-sm sm:text-base font-medium text-green-600 mt-1.5">
              suporte@ondetem.com
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default Support;
