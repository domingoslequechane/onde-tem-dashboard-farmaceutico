
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
    name: 'Farmácia Central',
    address: 'Av. Julius Nyerere, 1234, Maputo',
    phone: '+258 84 123 4567',
    email: 'farmacia@exemplo.com',
    hours: '07:00 - 22:00',
    description: 'Farmácia líder em Maputo com mais de 20 anos de experiência',
    delivery: true,
    emergencyService: true,
    acceptCards: true,
    deliveryRadius: 5
  });

  const [paymentMethods, setPaymentMethods] = useState(['Multicaixa', 'Visa', 'Mastercard', 'M-Pesa', 'e-Mola']);
  const [newPaymentMethod, setNewPaymentMethod] = useState('');
  const [rating] = useState(4.8);
  const [totalReviews] = useState(247);

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
    <div className="space-y-4 px-2 sm:px-0">
      {/* Profile Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-sm sm:text-base">
            <span>Perfil da Farmácia</span>
            <div className="flex items-center space-x-1 sm:space-x-2">
              <Badge className="bg-green-100 text-green-800 text-xs whitespace-nowrap">
                ✅ Verificada
              </Badge>
              <Badge className="bg-blue-100 text-blue-800 text-xs whitespace-nowrap">
                ⭐ Premium
              </Badge>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 px-3 sm:px-6">
          {/* Photo Upload */}
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-lg">?</span>
            </div>
            <div>
              <Button variant="outline" size="sm" className="text-xs h-8">
                <Camera className="mr-1" size={12} />
                Alterar Foto
              </Button>
              <p className="text-xs text-gray-500 mt-1">JPG, PNG até 2MB</p>
            </div>
          </div>

          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="name" className="text-xs">Nome da Farmácia</Label>
              <Input
                id="name"
                value={pharmacyData.name}
                onChange={(e) => setPharmacyData({...pharmacyData, name: e.target.value})}
                className="h-9 text-xs"
              />
            </div>
            
            <div className="space-y-1">
              <Label htmlFor="phone" className="text-xs">Telefone</Label>
              <Input
                id="phone"
                value={pharmacyData.phone}
                onChange={(e) => setPharmacyData({...pharmacyData, phone: e.target.value})}
                className="h-9 text-xs"
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="address" className="text-xs">Endereço Completo</Label>
            <Input
              id="address"
              value={pharmacyData.address}
              onChange={(e) => setPharmacyData({...pharmacyData, address: e.target.value})}
              className="h-9 text-xs"
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="description" className="text-xs">Descrição</Label>
            <Textarea
              id="description"
              value={pharmacyData.description}
              onChange={(e) => setPharmacyData({...pharmacyData, description: e.target.value})}
              rows={2}
              className="text-xs"
            />
          </div>
        </CardContent>
      </Card>

      {/* Operating Hours */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-sm sm:text-base">
            <Clock className="mr-2" size={16} />
            Horário de Funcionamento
          </CardTitle>
        </CardHeader>
        <CardContent className="px-3 sm:px-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-3">
            {['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'].map((day, index) => (
              <div key={day} className="space-y-1">
                <Label className="text-xs">{day}</Label>
                <Input 
                  defaultValue={index < 6 ? "07:00 - 22:00" : "08:00 - 20:00"} 
                  className="text-xs h-8"
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Services */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm sm:text-base">Serviços Oferecidos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 px-3 sm:px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 min-w-0 flex-1">
              <MapPin size={14} className="flex-shrink-0" />
              <span className="text-xs whitespace-nowrap">Entrega Gratuita</span>
            </div>
            <div className="flex items-center space-x-2 flex-shrink-0">
              <Switch 
                checked={pharmacyData.delivery}
                onCheckedChange={(checked) => handleServiceToggle('delivery', checked)}
                className="scale-75"
              />
              {pharmacyData.delivery && (
                <div className="flex items-center space-x-1">
                  <Input
                    type="number"
                    min="1"
                    max="50"
                    value={pharmacyData.deliveryRadius}
                    onChange={(e) => setPharmacyData({...pharmacyData, deliveryRadius: Number(e.target.value)})}
                    className="w-12 h-6 text-xs"
                  />
                  <span className="text-xs text-gray-600">km</span>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 min-w-0 flex-1">
              <Shield size={14} className="flex-shrink-0" />
              <span className="text-xs whitespace-nowrap">Atendimento de Emergência 24h</span>
            </div>
            <Switch 
              checked={pharmacyData.emergencyService}
              onCheckedChange={(checked) => handleServiceToggle('emergencyService', checked)}
              className="scale-75 flex-shrink-0"
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 min-w-0 flex-1">
              <CreditCard size={14} className="flex-shrink-0" />
              <span className="text-xs whitespace-nowrap">Aceita Cartões</span>
            </div>
            <Switch 
              checked={pharmacyData.acceptCards}
              onCheckedChange={(checked) => handleServiceToggle('acceptCards', checked)}
              className="scale-75 flex-shrink-0"
            />
          </div>
        </CardContent>
      </Card>

      {/* Payment Methods */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-sm sm:text-base">
            <CreditCard className="mr-2" size={16} />
            Formas de Pagamento
          </CardTitle>
        </CardHeader>
        <CardContent className="px-3 sm:px-6">
          <div className="space-y-3">
            <div className="flex flex-wrap gap-1 sm:gap-2">
              {paymentMethods.map((method) => (
                <Badge key={method} variant="outline" className="px-2 py-1 flex items-center space-x-1 text-xs whitespace-nowrap">
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
                className="h-8 text-xs"
              />
              <Button onClick={handleAddPaymentMethod} size="sm" className="h-8 px-2">
                <Plus size={12} />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Rating Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-sm sm:text-base">
            <Star className="mr-2" size={16} />
            Avaliação dos Clientes
          </CardTitle>
        </CardHeader>
        <CardContent className="px-3 sm:px-6">
          <div className="flex items-center space-x-3 mb-3">
            <div className="text-2xl font-bold text-yellow-500">{rating}</div>
            <div className="flex">
              {[1,2,3,4,5].map((star) => (
                <Star 
                  key={star} 
                  className={`w-4 h-4 ${star <= rating ? 'text-yellow-500 fill-current' : 'text-gray-300'}`}
                />
              ))}
            </div>
            <div className="text-gray-600 text-sm">
              {totalReviews} avaliações
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <span className="text-xs w-8">5★</span>
              <div className="flex-1 bg-gray-200 rounded-full h-2">
                <div className="bg-yellow-500 h-2 rounded-full" style={{width: '75%'}}></div>
              </div>
              <span className="text-xs text-gray-600">186</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-xs w-8">4★</span>
              <div className="flex-1 bg-gray-200 rounded-full h-2">
                <div className="bg-yellow-500 h-2 rounded-full" style={{width: '20%'}}></div>
              </div>
              <span className="text-xs text-gray-600">49</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-xs w-8">3★</span>
              <div className="flex-1 bg-gray-200 rounded-full h-2">
                <div className="bg-yellow-500 h-2 rounded-full" style={{width: '3%'}}></div>
              </div>
              <span className="text-xs text-gray-600">8</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Button onClick={handleSave} className="w-full bg-green-500 hover:bg-green-600 text-sm h-10">
        Salvar Configurações
      </Button>
    </div>
  );
};

export default Settings;
