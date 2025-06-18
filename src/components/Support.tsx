
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, Send, User, Bot, Phone, Mail, Video, FileText } from 'lucide-react';

interface Message {
  id: number;
  text: string;
  isUser: boolean;
  timestamp: string;
}

const Support = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      text: "Olá! Como posso ajudá-lo hoje? Estou aqui para esclarecer dúvidas sobre o uso da plataforma Onde Tem.",
      isUser: false,
      timestamp: "14:30"
    }
  ]);
  const [newMessage, setNewMessage] = useState('');

  const autoResponses = [
    "Entendi sua solicitação. Vou verificar isso para você e retornar em breve.",
    "Obrigado por entrar em contato! Para problemas técnicos, recomendo verificar se sua internet está estável.",
    "Essa é uma ótima pergunta! Você pode encontrar mais informações na seção de tutoriais do dashboard.",
    "Para alterar informações da farmácia, acesse a aba 'Configurações' no menu principal.",
    "Caso o problema persista, posso agendar uma chamada de suporte para você. Seria útil?",
    "Vou encaminhar sua solicitação para nossa equipe técnica. Você receberá um retorno em até 2 horas."
  ];

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      const userMessage: Message = {
        id: messages.length + 1,
        text: newMessage,
        isUser: true,
        timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
      };

      setMessages([...messages, userMessage]);
      
      // Simulate auto response after a delay
      setTimeout(() => {
        const randomResponse = autoResponses[Math.floor(Math.random() * autoResponses.length)];
        const botMessage: Message = {
          id: messages.length + 2,
          text: randomResponse,
          isUser: false,
          timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
        };
        setMessages(prev => [...prev, botMessage]);
      }, 1000 + Math.random() * 2000); // Random delay between 1-3 seconds

      setNewMessage('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  return (
    <div className="space-y-6">
      {/* Support Options */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardContent className="p-4 text-center">
            <MessageCircle className="mx-auto mb-2 text-blue-500" size={32} />
            <h3 className="font-medium">Chat Online</h3>
            <p className="text-sm text-gray-600">Disponível 24/7</p>
            <Badge className="mt-2 bg-green-100 text-green-800">Online</Badge>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardContent className="p-4 text-center">
            <Phone className="mx-auto mb-2 text-green-500" size={32} />
            <h3 className="font-medium">Telefone</h3>
            <p className="text-sm text-gray-600">+258 84 000 0000</p>
            <Badge className="mt-2 bg-blue-100 text-blue-800">8h-18h</Badge>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardContent className="p-4 text-center">
            <Mail className="mx-auto mb-2 text-purple-500" size={32} />
            <h3 className="font-medium">E-mail</h3>
            <p className="text-sm text-gray-600">suporte@ondetem.co.mz</p>
            <Badge className="mt-2 bg-orange-100 text-orange-800">24-48h</Badge>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardContent className="p-4 text-center">
            <Video className="mx-auto mb-2 text-red-500" size={32} />
            <h3 className="font-medium">Videochamada</h3>
            <p className="text-sm text-gray-600">Suporte visual</p>
            <Badge className="mt-2 bg-yellow-100 text-yellow-800">Agendado</Badge>
          </CardContent>
        </Card>
      </div>

      {/* Live Chat */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <MessageCircle className="mr-2" size={20} />
            Chat de Suporte
            <Badge className="ml-2 bg-green-100 text-green-800">Online</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Chat Messages */}
            <div className="h-80 overflow-y-auto border rounded-lg p-4 bg-gray-50 space-y-3">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
                >
                  <div className="flex items-start space-x-2 max-w-xs">
                    {!message.isUser && (
                      <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                        <Bot size={16} className="text-white" />
                      </div>
                    )}
                    <div
                      className={`p-3 rounded-lg ${
                        message.isUser
                          ? 'bg-green-500 text-white'
                          : 'bg-white border'
                      }`}
                    >
                      <p className="text-sm">{message.text}</p>
                      <p className={`text-xs mt-1 ${message.isUser ? 'text-green-100' : 'text-gray-500'}`}>
                        {message.timestamp}
                      </p>
                    </div>
                    {message.isUser && (
                      <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                        <User size={16} className="text-white" />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Message Input */}
            <div className="flex space-x-2">
              <Input
                placeholder="Digite sua mensagem..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                className="flex-1"
              />
              <Button onClick={handleSendMessage} className="bg-green-500 hover:bg-green-600">
                <Send size={16} />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* FAQ Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className="mr-2" size={20} />
            Perguntas Frequentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="border-l-4 border-blue-500 pl-4">
              <h4 className="font-medium text-gray-900">Como atualizar o status dos medicamentos?</h4>
              <p className="text-sm text-gray-600 mt-1">
                Na aba "Estoque", clique diretamente sobre o medicamento para alterar seu status entre Disponível/Indisponível.
              </p>
            </div>
            
            <div className="border-l-4 border-green-500 pl-4">
              <h4 className="font-medium text-gray-900">Como criar uma promoção?</h4>
              <p className="text-sm text-gray-600 mt-1">
                Use o toggle "Promoção" ao lado de cada medicamento na visualização expandida do estoque.
              </p>
            </div>
            
            <div className="border-l-4 border-orange-500 pl-4">
              <h4 className="font-medium text-gray-900">Como interpretar o mapa de demanda?</h4>
              <p className="text-sm text-gray-600 mt-1">
                As cores indicam o nível de demanda: vermelho (alta), amarelo (média), verde (baixa). Clique nas regiões para ver detalhes.
              </p>
            </div>

            <div className="border-l-4 border-purple-500 pl-4">
              <h4 className="font-medium text-gray-900">Como exportar relatórios?</h4>
              <p className="text-sm text-gray-600 mt-1">
                Use o botão "Exportar CSV" na seção de estoque ou "Download do Relatório Completo" nos resultados.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tutorials */}
      <Card>
        <CardHeader>
          <CardTitle>Tutoriais em Vídeo</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-100 p-4 rounded-lg">
              <div className="w-full h-32 bg-gray-300 rounded mb-3 flex items-center justify-center">
                <Video size={32} className="text-gray-500" />
              </div>
              <h4 className="font-medium">Primeiros Passos</h4>
              <p className="text-sm text-gray-600">Como configurar sua farmácia na plataforma</p>
              <p className="text-xs text-gray-500 mt-1">Duração: 5 min</p>
            </div>

            <div className="bg-gray-100 p-4 rounded-lg">
              <div className="w-full h-32 bg-gray-300 rounded mb-3 flex items-center justify-center">
                <Video size={32} className="text-gray-500" />
              </div>
              <h4 className="font-medium">Gestão de Estoque</h4>
              <p className="text-sm text-gray-600">Como adicionar e gerenciar medicamentos</p>
              <p className="text-xs text-gray-500 mt-1">Duração: 8 min</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Support;
