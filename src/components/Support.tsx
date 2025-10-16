import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageSquare } from 'lucide-react';

const Support = () => {
  return (
    <Card className="h-[600px] sm:h-[700px] flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Chat de Suporte
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex items-center justify-center">
        <div className="text-center space-y-4 p-8">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-green-100 to-blue-100 rounded-full flex items-center justify-center">
            <MessageSquare className="h-8 w-8 text-green-600" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Em Breve
            </h3>
            <p className="text-gray-600 max-w-md">
              Estamos desenvolvendo uma nova funcionalidade de chat em tempo real para melhor atendê-lo. 
              Aguarde, em breve você poderá conversar diretamente com nossa equipe de suporte!
            </p>
          </div>
          <div className="pt-4">
            <p className="text-sm text-gray-500">
              Enquanto isso, você pode nos contatar por:
            </p>
            <p className="text-sm font-medium text-green-600 mt-2">
              suporte@ondetem.com
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default Support;
