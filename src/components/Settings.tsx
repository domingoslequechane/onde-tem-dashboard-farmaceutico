
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Camera, Clock, CreditCard, MapPin, Star, Shield, X, Plus } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const Settings = () => {
  const [pharmacyData, setPharmacyData] = useState({
    name: '',
    address: '',
    phone: '',
    email: '',
    hours: '07:00 - 22:00',
    description: '',
    delivery: false,
    emergencyService: false,
    acceptCards: false,
    deliveryRadius: 5
  });

  const [paymentMethods, setPaymentMethods] = useState<string[]>([]);
  const [newPaymentMethod, setNewPaymentMethod] = useState('');
  const [rating] = useState(0);
  const [totalReviews] = useState(0);

  const handleSave = () => {
    toast({
      title: "Configurações salvas!",
      description: "Perfil da farmácia atualizado com sucesso.",
    });
  };

  const handleAddPaymentMethod = () => {
    if (newPaymentMethod.trim() && !paymentMethods.includes(newPaymentMethod.trim())) {
      setPaymentMethods([...paymentMethods, newPaymentMethod.trim()]);
      setNewPaymentMethod('');
      toast({
        title: "Forma de pagamento adicionada!",
        description: `${newPaymentMethod} foi adicionado com sucesso.`,
      });
    }
  };

  const handleRemovePaymentMethod = (method: string) => {
    setPaymentMethods(paymentMethods.filter(m => m !== method));
    toast({
      title: "Forma de pagamento removida!",
      description: `${method} foi removido.`,
    });
  };

  const handleServiceToggle = (service: string, value: boolean) => {
    setPharmacyData({...pharmacyData, [service]: value});
    const serviceName = service === 'delivery' ? 'Entrega' : 
                       service === 'emergencyService' ? 'Atendimento de Emergência' : 'Cartões';
    toast({
      title: `${serviceName} ${value ? 'ativado' : 'desativado'}!`,
      description: `O serviço foi ${value ? 'habilitado' : 'desabilitado'} com sucesso.`,
    });
  };
  
  return (
    <div className="space-y-4 md:space-y-6">
      {/* Profile Header */}
      <Card>
        <CardHeader className="pb-3 md:pb-4">
          <CardTitle className="flex items-center justify-between text-base md:text-lg">
            <span className="truncate">Perfil da Farmácia</span>
            <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
              <Badge className="bg-green-100 text-green-800 text-xs whitespace-nowrap">
                ✅ Verificada
              </Badge>
              <Badge className="bg-blue-100 text-blue-800 text-xs whitespace-nowrap">
                ⭐ Premium
              </Badge>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 md:space-y-6">
          {/* Photo Upload */}
          <div className="flex items-center space-x-3 sm:space-x-4">
            <div className="w-12 h-12 sm:w-20 sm:h-20 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-base sm:text-2xl">?</span>
            </div>
            <div className="min-w-0 flex-1">
              <Button variant="outline" size="sm" className="text-xs sm:text-sm">
                <Camera className="mr-1 sm:mr-2 flex-shrink-0" size={14} />
                <span className="whitespace-nowrap">Alterar Foto</span>
              </Button>
              <p className="text-xs text-gray-500 mt-1">JPG, PNG até 2MB</p>
            </div>
          </div>

          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm md:text-base">Nome da Farmácia</Label>
              <Input
                id="name"
                value={pharmacyData.name}
                onChange={(e) => setPharmacyData({...pharmacyData, name: e.target.value})}
                className="text-sm md:text-base"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-sm md:text-base">Telefone</Label>
              <Input
                id="phone"
                value={pharmacyData.phone}
                onChange={(e) => setPharmacyData({...pharmacyData, phone: e.target.value})}
                className="text-sm md:text-base"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address" className="text-sm md:text-base">Endereço Completo</Label>
            <Input
              id="address"
              value={pharmacyData.address}
              onChange={(e) => setPharmacyData({...pharmacyData, address: e.target.value})}
              className="text-sm md:text-base"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm md:text-base">Descrição</Label>
            <Textarea
              id="description"
              value={pharmacyData.description}
              onChange={(e) => setPharmacyData({...pharmacyData, description: e.target.value})}
              rows={3}
              className="text-sm md:text-base"
            />
          </div>
        </CardContent>
      </Card>

      {/* Operating Hours */}
      <Card>
        <CardHeader className="pb-3 md:pb-4">
          <CardTitle className="flex items-center text-base md:text-lg">
            <Clock className="mr-2 flex-shrink-0" size={16} />
            <span className="truncate">Horário de Funcionamento</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            {['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'].map((day, index) => (
              <div key={day} className="space-y-2">
                <Label className="text-xs sm:text-sm">{day}</Label>
                <Input 
                  defaultValue={index < 6 ? "07:00 - 22:00" : "08:00 - 20:00"} 
                  className="text-xs sm:text-sm"
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Services */}
      <Card>
        <CardHeader className="pb-3 md:pb-4">
          <CardTitle className="text-base md:text-lg">Serviços Oferecidos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 sm:space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 min-w-0 flex-1">
              <MapPin size={14} className="flex-shrink-0" />
              <span className="text-sm md:text-base whitespace-nowrap">Entrega Gratuita</span>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-3 flex-shrink-0">
              <Switch 
                checked={pharmacyData.delivery}
                onCheckedChange={(checked) => handleServiceToggle('delivery', checked)}
                className="scale-75 sm:scale-100"
              />
              {pharmacyData.delivery && (
                <div className="flex items-center space-x-1 sm:space-x-2">
                  <Input
                    type="number"
                    min="1"
                    max="50"
                    value={pharmacyData.deliveryRadius}
                    onChange={(e) => setPharmacyData({...pharmacyData, deliveryRadius: Number(e.target.value)})}
                    className="w-12 sm:w-16 h-6 sm:h-8 text-xs"
                  />
                  <span className="text-xs sm:text-sm text-gray-600 whitespace-nowrap">km</span>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 min-w-0 flex-1">
              <Shield size={14} className="flex-shrink-0" />
              <span className="text-sm md:text-base whitespace-nowrap overflow-hidden text-ellipsis">Atendimento de Emergência 24h</span>
            </div>
            <Switch 
              checked={pharmacyData.emergencyService}
              onCheckedChange={(checked) => handleServiceToggle('emergencyService', checked)}
              className="scale-75 sm:scale-100 flex-shrink-0"
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 min-w-0 flex-1">
              <CreditCard size={14} className="flex-shrink-0" />
              <span className="text-sm md:text-base whitespace-nowrap">Aceita Cartões</span>
            </div>
            <Switch 
              checked={pharmacyData.acceptCards}
              onCheckedChange={(checked) => handleServiceToggle('acceptCards', checked)}
              className="scale-75 sm:scale-100 flex-shrink-0"
            />
          </div>
        </CardContent>
      </Card>

      {/* Payment Methods */}
      <Card>
        <CardHeader className="pb-3 md:pb-4">
          <CardTitle className="flex items-center text-base md:text-lg">
            <CreditCard className="mr-2 flex-shrink-0" size={16} />
            <span className="truncate">Formas de Pagamento</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 sm:space-y-4">
            <div className="flex flex-wrap gap-1 sm:gap-2">
              {paymentMethods.map((method) => (
                <Badge key={method} variant="outline" className="px-2 sm:px-3 py-1 flex items-center space-x-1 sm:space-x-2 text-xs whitespace-nowrap">
                  <span>{method}</span>
                  <X 
                    size={12} 
                    className="cursor-pointer hover:text-red-500 flex-shrink-0"
                    onClick={() => handleRemovePaymentMethod(method)}
                  />
                </Badge>
              ))}
            </div>
            
            <div className="flex space-x-2">
              <Input
                placeholder="Nova forma de pagamento"
                value={newPaymentMethod}
                onChange={(e) => setNewPaymentMethod(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddPaymentMethod()}
                className="text-sm md:text-base"
              />
              <Button onClick={handleAddPaymentMethod} size="sm" className="flex-shrink-0">
                <Plus size={14} />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Rating Summary */}
      <Card>
        <CardHeader className="pb-3 md:pb-4">
          <CardTitle className="flex items-center text-base md:text-lg">
            <Star className="mr-2 flex-shrink-0" size={16} />
            <span className="truncate">Avaliação dos Clientes</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-3 sm:space-x-4">
            <div className="text-2xl sm:text-3xl font-bold text-yellow-500">{rating}</div>
            <div className="flex">
              {[1,2,3,4,5].map((star) => (
                <Star 
                  key={star} 
                  className={`w-4 h-4 sm:w-6 sm:h-6 ${star <= rating ? 'text-yellow-500 fill-current' : 'text-gray-300'}`}
                />
              ))}
            </div>
            <div className="text-gray-600 text-sm md:text-base whitespace-nowrap">
              {totalReviews} avaliações
            </div>
          </div>
          
          <div className="mt-3 sm:mt-4 space-y-2">
            <div className="flex items-center space-x-2">
              <span className="text-xs sm:text-sm w-8 sm:w-12 flex-shrink-0">5★</span>
              <div className="flex-1 bg-gray-200 rounded-full h-2">
                <div className="bg-yellow-500 h-2 rounded-full" style={{width: '75%'}}></div>
              </div>
              <span className="text-xs sm:text-sm text-gray-600 flex-shrink-0">186</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-xs sm:text-sm w-8 sm:w-12 flex-shrink-0">4★</span>
              <div className="flex-1 bg-gray-200 rounded-full h-2">
                <div className="bg-yellow-500 h-2 rounded-full" style={{width: '20%'}}></div>
              </div>
              <span className="text-xs sm:text-sm text-gray-600 flex-shrink-0">49</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-xs sm:text-sm w-8 sm:w-12 flex-shrink-0">3★</span>
              <div className="flex-1 bg-gray-200 rounded-full h-2">
                <div className="bg-yellow-500 h-2 rounded-full" style={{width: '3%'}}></div>
              </div>
              <span className="text-xs sm:text-sm text-gray-600 flex-shrink-0">8</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Button onClick={handleSave} className="w-full bg-green-500 hover:bg-green-600 text-sm md:text-base">
        Salvar Configurações
      </Button>
    </div>
  );
};

export default Settings;
