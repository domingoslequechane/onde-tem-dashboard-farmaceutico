
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Camera, Clock, CreditCard, MapPin, Star, Shield } from 'lucide-react';
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
    acceptCards: true
  });

  const [rating] = useState(4.8);
  const [totalReviews] = useState(247);

  const handleSave = () => {
    toast({
      title: "Configurações salvas!",
      description: "Perfil da farmácia atualizado com sucesso.",
    });
  };

  const paymentMethods = ['Multicaixa', 'Visa', 'Mastercard', 'M-Pesa', 'e-Mola'];
  
  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Perfil da Farmácia</span>
            <div className="flex items-center space-x-2">
              <Badge className="bg-green-100 text-green-800">
                ✅ Verificada
              </Badge>
              <Badge className="bg-blue-100 text-blue-800">
                ⭐ Premium
              </Badge>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Photo Upload */}
          <div className="flex items-center space-x-4">
            <div className="w-20 h-20 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center">
              <Camera className="text-white" size={24} />
            </div>
            <div>
              <Button variant="outline" size="sm">
                Alterar Foto
              </Button>
              <p className="text-xs text-gray-500 mt-1">JPG, PNG até 2MB</p>
            </div>
          </div>

          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome da Farmácia</Label>
              <Input
                id="name"
                value={pharmacyData.name}
                onChange={(e) => setPharmacyData({...pharmacyData, name: e.target.value})}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="phone">Telefone</Label>
              <Input
                id="phone"
                value={pharmacyData.phone}
                onChange={(e) => setPharmacyData({...pharmacyData, phone: e.target.value})}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Endereço Completo</Label>
            <Input
              id="address"
              value={pharmacyData.address}
              onChange={(e) => setPharmacyData({...pharmacyData, address: e.target.value})}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={pharmacyData.description}
              onChange={(e) => setPharmacyData({...pharmacyData, description: e.target.value})}
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Operating Hours */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Clock className="mr-2" size={20} />
            Horário de Funcionamento
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'].map((day, index) => (
              <div key={day} className="space-y-2">
                <Label className="text-sm">{day}</Label>
                <Input 
                  defaultValue={index < 6 ? "07:00 - 22:00" : "08:00 - 20:00"} 
                  className="text-sm"
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Services */}
      <Card>
        <CardHeader>
          <CardTitle>Serviços Oferecidos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <MapPin size={16} />
              <span>Entrega Gratuita (raio 5km)</span>
            </div>
            <Switch checked={pharmacyData.delivery} />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Shield size={16} />
              <span>Atendimento de Emergência 24h</span>
            </div>
            <Switch checked={pharmacyData.emergencyService} />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <CreditCard size={16} />
              <span>Aceita Cartões</span>
            </div>
            <Switch checked={pharmacyData.acceptCards} />
          </div>
        </CardContent>
      </Card>

      {/* Payment Methods */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <CreditCard className="mr-2" size={20} />
            Formas de Pagamento
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {paymentMethods.map((method) => (
              <Badge key={method} variant="outline" className="px-3 py-1">
                {method}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Rating Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Star className="mr-2" size={20} />
            Avaliação dos Clientes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            <div className="text-3xl font-bold text-yellow-500">{rating}</div>
            <div className="flex">
              {[1,2,3,4,5].map((star) => (
                <Star 
                  key={star} 
                  className={`w-6 h-6 ${star <= rating ? 'text-yellow-500 fill-current' : 'text-gray-300'}`}
                />
              ))}
            </div>
            <div className="text-gray-600">
              {totalReviews} avaliações
            </div>
          </div>
          
          <div className="mt-4 space-y-2">
            <div className="flex items-center space-x-2">
              <span className="text-sm w-12">5★</span>
              <div className="flex-1 bg-gray-200 rounded-full h-2">
                <div className="bg-yellow-500 h-2 rounded-full" style={{width: '75%'}}></div>
              </div>
              <span className="text-sm text-gray-600">186</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm w-12">4★</span>
              <div className="flex-1 bg-gray-200 rounded-full h-2">
                <div className="bg-yellow-500 h-2 rounded-full" style={{width: '20%'}}></div>
              </div>
              <span className="text-sm text-gray-600">49</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm w-12">3★</span>
              <div className="flex-1 bg-gray-200 rounded-full h-2">
                <div className="bg-yellow-500 h-2 rounded-full" style={{width: '3%'}}></div>
              </div>
              <span className="text-sm text-gray-600">8</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Button onClick={handleSave} className="w-full bg-green-500 hover:bg-green-600">
        Salvar Configurações
      </Button>
    </div>
  );
};

export default Settings;
