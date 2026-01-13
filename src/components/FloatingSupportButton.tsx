import { useState, useRef, useEffect, useCallback } from 'react';
import { Bot, User, Phone, Send, Loader2, Paperclip, X, FileText, Trash2, ChevronLeft, Download, Mail, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useNavigate, useLocation } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import * as XLSX from 'xlsx';
import mammoth from 'mammoth';
import * as pdfjsLib from 'pdfjs-dist';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface Message {
  id?: string;
  role: 'user' | 'assistant';
  content: string;
  file?: {
    name: string;
    content: string;
    type: string;
  };
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const MAX_TEXTAREA_HEIGHT = 120;

const WELCOME_MESSAGE: Message = {
  role: 'assistant',
  content: '# Olá! 👋\n\nSou o **assistente virtual** da ONDTem. Como posso ajudá-lo hoje?\n\n## Posso ajudar com:\n- Gestão de estoque\n- Análise de demanda\n- Configurações da farmácia\n- **Conversão de ficheiros para CSV**\n\n💡 **Dica**: Envie ficheiros com dados de medicamentos para conversão!'
};

type ViewMode = 'menu' | 'chat' | 'human';

interface FloatingSupportButtonProps {
  farmaciaId?: string;
}

const FloatingSupportButton = ({ farmaciaId }: FloatingSupportButtonProps) => {
  const { toast } = useToast();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('menu');
  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [attachedFile, setAttachedFile] = useState<{ name: string; content: string; type: string } | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Don't show on support page
  if (location.pathname === '/farmacia/suporte') {
    return null;
  }

  // Load chat history when opening chat
  const loadChatHistory = async () => {
    if (!farmaciaId) return;
    
    setIsLoadingHistory(true);
    try {
      // First, clean old messages (7+ days)
      await supabase.rpc('delete_old_support_messages');

      const { data, error } = await supabase
        .from('suporte_mensagens')
        .select('*')
        .eq('farmacia_id', farmaciaId)
        .order('criado_em', { ascending: true });

      if (error) throw error;

      if (data && data.length > 0) {
        const historyMessages: Message[] = data.map(msg => ({
          id: msg.id,
          role: msg.role as 'user' | 'assistant',
          content: msg.content,
          file: msg.file_name ? { name: msg.file_name, content: '', type: '' } : undefined
        }));
        setMessages([WELCOME_MESSAGE, ...historyMessages]);
      } else {
        setMessages([WELCOME_MESSAGE]);
      }
    } catch (error) {
      console.error('Error loading chat history:', error);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollAreaRef.current && viewMode === 'chat') {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages, viewMode]);

  // Auto-resize textarea
  const adjustTextareaHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      const newHeight = Math.min(textarea.scrollHeight, MAX_TEXTAREA_HEIGHT);
      textarea.style.height = `${newHeight}px`;
    }
  }, []);

  useEffect(() => {
    adjustTextareaHeight();
  }, [inputValue, adjustTextareaHeight]);

  const saveMessage = async (message: Message) => {
    if (!farmaciaId) return;

    try {
      await supabase
        .from('suporte_mensagens')
        .insert({
          farmacia_id: farmaciaId,
          role: message.role,
          content: message.content,
          file_name: message.file?.name || null
        });
    } catch (error) {
      console.error('Error saving message:', error);
    }
  };

  const clearHistory = async () => {
    if (!farmaciaId) return;

    try {
      const { error } = await supabase
        .from('suporte_mensagens')
        .delete()
        .eq('farmacia_id', farmaciaId);

      if (error) throw error;

      setMessages([WELCOME_MESSAGE]);
      toast({
        title: 'Histórico limpo',
        description: 'O histórico de conversas foi apagado.',
      });
    } catch (error) {
      console.error('Error clearing history:', error);
    }
  };

  // Parse Excel files (.xlsx, .xls)
  const parseExcel = async (file: File): Promise<string> => {
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'array' });
    let content = '';
    workbook.SheetNames.forEach((sheetName, index) => {
      const sheet = workbook.Sheets[sheetName];
      if (index > 0) content += `\n\n--- Folha: ${sheetName} ---\n`;
      content += XLSX.utils.sheet_to_csv(sheet);
    });
    return content;
  };

  // Parse Word files (.docx, .doc)
  const parseWord = async (file: File): Promise<string> => {
    const buffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer: buffer });
    return result.value;
  };

  // Parse PDF files
  const parsePDF = async (file: File): Promise<string> => {
    const buffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
    let text = '';
    const maxPages = Math.min(pdf.numPages, 50);
    for (let i = 1; i <= maxPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const pageText = content.items
        .map((item: any) => item.str)
        .join(' ');
      text += pageText + '\n';
    }
    return text;
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedExtensions = ['.csv', '.txt', '.json', '.pdf', '.xlsx', '.xls', '.doc', '.docx'];
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    
    if (!allowedExtensions.includes(fileExtension)) {
      toast({
        title: 'Tipo de ficheiro não suportado',
        description: 'Por favor, envie ficheiros CSV, TXT, JSON, PDF, Excel ou Word.',
        variant: 'destructive',
      });
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: 'Ficheiro muito grande',
        description: 'O tamanho máximo é 10MB.',
        variant: 'destructive',
      });
      return;
    }

    const isBinaryFile = ['.pdf', '.xlsx', '.xls', '.doc', '.docx'].includes(fileExtension);
    if (isBinaryFile) {
      toast({
        title: 'A processar ficheiro...',
        description: 'Extraindo conteúdo, aguarde.',
      });
    }

    try {
      let content = '';
      
      if (['.csv', '.txt', '.json'].includes(fileExtension)) {
        content = await file.text();
      } else if (['.xlsx', '.xls'].includes(fileExtension)) {
        content = await parseExcel(file);
      } else if (['.docx', '.doc'].includes(fileExtension)) {
        content = await parseWord(file);
      } else if (fileExtension === '.pdf') {
        content = await parsePDF(file);
      }
      
      if (!content.trim()) {
        toast({
          title: 'Ficheiro vazio',
          description: 'Não foi possível extrair conteúdo do ficheiro.',
          variant: 'destructive',
        });
        return;
      }
      
      setAttachedFile({
        name: file.name,
        content: content.slice(0, 50000),
        type: file.type || 'text/plain'
      });
      
      if (isBinaryFile) {
        toast({
          title: 'Ficheiro processado!',
          description: `Conteúdo extraído com sucesso.`,
        });
      }
      
      textareaRef.current?.focus();
    } catch (error) {
      console.error('Error parsing file:', error);
      toast({
        title: 'Erro ao processar ficheiro',
        description: 'Não foi possível extrair o conteúdo.',
        variant: 'destructive',
      });
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeAttachedFile = () => {
    setAttachedFile(null);
    textareaRef.current?.focus();
  };

  const downloadCSV = (csvContent: string) => {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `medicamentos_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast({
      title: 'CSV baixado!',
      description: 'Ficheiro pronto para importação.',
    });
  };

  const extractCSVFromMessage = (content: string): string | null => {
    const csvMatch = content.match(/---CSV_START---([\s\S]*?)---CSV_END---/);
    return csvMatch ? csvMatch[1].trim() : null;
  };

  const sendMessage = async () => {
    if ((!inputValue.trim() && !attachedFile) || isLoading) return;

    let messageContent = inputValue.trim();
    
    if (attachedFile) {
      const fileContext = `\n\n[Ficheiro anexado: ${attachedFile.name}]\n\`\`\`\n${attachedFile.content}\n\`\`\``;
      messageContent = messageContent ? `${messageContent}${fileContext}` : `Por favor, analise este ficheiro e converta para CSV:${fileContext}`;
    }

    const userMessage: Message = { 
      role: 'user', 
      content: messageContent,
      file: attachedFile || undefined
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setAttachedFile(null);
    setIsLoading(true);

    await saveMessage(userMessage);

    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/support-chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages.filter(m => m !== WELCOME_MESSAGE), userMessage].map(m => ({
            role: m.role,
            content: m.content
          }))
        }),
      });

      if (!response.ok) throw new Error('Erro ao enviar mensagem');
      if (!response.body) throw new Error('Resposta vazia');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantContent = '';
      let textBuffer = '';

      setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf('\n')) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (line.startsWith(':') || line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') break;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              assistantContent += content;
              setMessages(prev => {
                const newMessages = [...prev];
                const lastMessage = newMessages[newMessages.length - 1];
                if (lastMessage?.role === 'assistant') {
                  lastMessage.content = assistantContent;
                }
                return newMessages;
              });
            }
          } catch {
            textBuffer = line + '\n' + textBuffer;
            break;
          }
        }
      }

      if (assistantContent) {
        await saveMessage({ role: 'assistant', content: assistantContent });
      }

    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível enviar a mensagem',
        variant: 'destructive',
      });
      setMessages(prev => {
        const newMessages = [...prev];
        if (newMessages[newMessages.length - 1]?.role === 'assistant' && !newMessages[newMessages.length - 1]?.content) {
          newMessages.pop();
        }
        return newMessages;
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatMessage = (content: string) => {
    const csvContent = extractCSVFromMessage(content);
    const contentWithoutCSV = content.replace(/---CSV_START---[\s\S]*?---CSV_END---/, '').trim();
    
    const elements: React.ReactNode[] = [];
    const lines = contentWithoutCSV.split('\n');

    lines.forEach((line, index) => {
      if (/^[-*_]{3,}$/.test(line.trim())) return;

      if (line.startsWith('# ')) {
        elements.push(<h1 key={index} className="text-sm font-bold mb-1">{formatInline(line.slice(2))}</h1>);
        return;
      }
      if (line.startsWith('## ')) {
        elements.push(<h2 key={index} className="text-xs font-semibold mb-1">{formatInline(line.slice(3))}</h2>);
        return;
      }
      if (/^[-*•]\s/.test(line)) {
        elements.push(
          <div key={index} className="flex items-start gap-1.5 my-0.5 text-xs">
            <span className="text-primary font-bold">•</span>
            <span>{formatInline(line.slice(2))}</span>
          </div>
        );
        return;
      }
      if (line.trim() === '') {
        elements.push(<div key={index} className="h-1" />);
        return;
      }
      elements.push(<p key={index} className="text-xs my-0.5">{formatInline(line)}</p>);
    });

    if (csvContent) {
      elements.push(
        <div key="csv-download" className="mt-2 p-2 bg-primary/10 border border-primary/20 rounded-lg">
          <Button size="sm" onClick={() => downloadCSV(csvContent)} className="w-full gap-2 h-8 text-xs">
            <Download className="h-3 w-3" />
            Baixar CSV
          </Button>
        </div>
      );
    }

    return elements;
  };

  const formatInline = (text: string): React.ReactNode => {
    const parts: React.ReactNode[] = [];
    let remaining = text;
    let key = 0;

    while (remaining.length > 0) {
      const boldMatch = remaining.match(/^\*\*([^*]+)\*\*/);
      if (boldMatch) {
        parts.push(<strong key={key++} className="font-semibold">{boldMatch[1]}</strong>);
        remaining = remaining.slice(boldMatch[0].length);
        continue;
      }
      const nextSpecial = remaining.search(/\*\*/);
      if (nextSpecial === -1) {
        parts.push(remaining);
        break;
      } else if (nextSpecial === 0) {
        parts.push(remaining[0]);
        remaining = remaining.slice(1);
      } else {
        parts.push(remaining.slice(0, nextSpecial));
        remaining = remaining.slice(nextSpecial);
      }
    }
    return parts;
  };

  const openChat = () => {
    setViewMode('chat');
    loadChatHistory();
    setTimeout(() => textareaRef.current?.focus(), 100);
  };

  const renderMenu = () => (
    <div className="space-y-4">
      <div className="space-y-1">
        <h4 className="font-semibold text-foreground">Precisa de ajuda?</h4>
        <p className="text-sm text-muted-foreground">Escolha uma opção para obter suporte</p>
      </div>
      
      <div className="space-y-2">
        <Button
          variant="outline"
          className="w-full justify-start gap-3 h-auto py-3 border-border/50 hover:bg-primary/5"
          onClick={openChat}
        >
          <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
            <Bot className="h-4 w-4 text-primary" />
          </div>
          <div className="text-left">
            <div className="font-medium">Chat com IA</div>
            <div className="text-xs text-muted-foreground">Respostas instantâneas 24/7</div>
          </div>
        </Button>
        
        <Button
          variant="outline"
          className="w-full justify-start gap-3 h-auto py-3 border-border/50 hover:bg-primary/5"
          onClick={() => setViewMode('human')}
        >
          <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="h-4 w-4 text-primary" />
          </div>
          <div className="text-left">
            <div className="font-medium">Falar com humano</div>
            <div className="text-xs text-muted-foreground">Resposta em até 24h úteis</div>
          </div>
        </Button>
        
        <Button
          variant="outline"
          className="w-full justify-start gap-3 h-auto py-3 border-border/50 hover:bg-primary/5"
          asChild
        >
          <a href="tel:+258853135136">
            <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
              <Phone className="h-4 w-4 text-primary" />
            </div>
            <div className="text-left">
              <div className="font-medium">Ligar agora</div>
              <div className="text-xs text-muted-foreground">+258 853 135 136</div>
            </div>
          </a>
        </Button>
      </div>
    </div>
  );

  const renderHumanSupport = () => (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setViewMode('menu')}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <h4 className="font-semibold text-foreground">Contacto Humano</h4>
      </div>
      
      <p className="text-sm text-muted-foreground">
        Entre em contacto com a nossa equipa através dos canais abaixo:
      </p>
      
      <div className="space-y-3">
        <div className="p-3 bg-muted/50 rounded-lg space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Mail className="h-4 w-4 text-primary" />
            <span>Email (Geral)</span>
          </div>
          <a href="mailto:comercial@ondtem.com" className="text-primary text-sm hover:underline block">
            comercial@ondtem.com
          </a>
        </div>

        <div className="p-3 bg-muted/50 rounded-lg space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Mail className="h-4 w-4 text-primary" />
            <span>Email (Adesão)</span>
          </div>
          <a href="mailto:adesao@ondtem.com" className="text-primary text-sm hover:underline block">
            adesao@ondtem.com
          </a>
        </div>

        <div className="p-3 bg-muted/50 rounded-lg space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Phone className="h-4 w-4 text-primary" />
            <span>Telefone</span>
          </div>
          <div className="space-y-1">
            <a href="tel:+258853135136" className="text-primary text-sm hover:underline block">
              +258 853 135 136
            </a>
            <a href="tel:+258868499221" className="text-primary text-sm hover:underline block">
              +258 868 499 221
            </a>
          </div>
        </div>
      </div>
    </div>
  );

  const renderChat = () => (
    <div className="flex flex-col h-[400px]">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-border/50">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setViewMode('menu')}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center">
            <Bot className="h-3.5 w-3.5 text-primary" />
          </div>
          <span className="font-medium text-sm">Suporte IA</span>
        </div>
        {messages.length > 1 && farmaciaId && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive">
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Limpar histórico?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta ação irá apagar todo o histórico de conversas.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={clearHistory} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  Limpar
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>

      {/* Messages */}
      {isLoadingHistory ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : (
        <ScrollArea ref={scrollAreaRef} className="flex-1 py-2">
          <div className="space-y-3 pr-2">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex gap-2 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {message.role === 'assistant' && (
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                    <Bot className="h-3 w-3 text-primary" />
                  </div>
                )}
                <div
                  className={`max-w-[85%] rounded-xl px-3 py-2 ${
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted/50 border border-border/50'
                  }`}
                >
                  {message.role === 'user' ? (
                    <div className="text-xs">{message.content.split('\n\n[Ficheiro anexado:')[0]}</div>
                  ) : (
                    <div className="text-xs">
                      {message.content ? formatMessage(message.content) : (
                        <div className="flex items-center gap-1">
                          <Loader2 className="h-3 w-3 animate-spin" />
                          <span className="text-muted-foreground">A pensar...</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                {message.role === 'user' && (
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                    <User className="h-3 w-3 text-primary-foreground" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
      )}

      {/* Input */}
      <div className="pt-2 border-t border-border/50">
        {attachedFile && (
          <div className="flex items-center gap-2 mb-2 bg-primary/5 border border-primary/20 rounded-lg px-2 py-1.5">
            <FileText className="h-3 w-3 text-primary" />
            <span className="text-xs truncate flex-1">{attachedFile.name}</span>
            <Button variant="ghost" size="icon" className="h-5 w-5" onClick={removeAttachedFile}>
              <X className="h-2.5 w-2.5" />
            </Button>
          </div>
        )}

        <div className="flex gap-1.5 items-end">
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.txt,.json,.pdf,.xlsx,.xls,.doc,.docx"
            onChange={handleFileSelect}
            className="hidden"
          />
          
          <Button
            variant="outline"
            size="icon"
            className="flex-shrink-0 h-8 w-8 border-border/50"
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading}
          >
            <Paperclip className="h-3.5 w-3.5" />
          </Button>

          <Textarea
            ref={textareaRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Digite..."
            disabled={isLoading}
            className="flex-1 min-h-[32px] max-h-[80px] resize-none text-xs py-2 px-3 border-border/50"
            rows={1}
          />
          
          <Button 
            onClick={sendMessage} 
            disabled={isLoading || (!inputValue.trim() && !attachedFile)}
            size="icon"
            className="flex-shrink-0 h-8 w-8"
          >
            {isLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <Popover open={isOpen} onOpenChange={(open) => {
      setIsOpen(open);
      if (!open) setViewMode('menu');
    }}>
      <PopoverTrigger asChild>
        <Button
          size="icon"
          className="fixed bottom-24 sm:bottom-6 right-4 sm:right-6 h-14 w-14 rounded-full shadow-lg z-50 bg-primary hover:bg-primary/90 transition-transform hover:scale-105"
        >
          <Bot className="h-6 w-6" />
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        side="top" 
        align="end" 
        className={`p-4 border-border/50 ${viewMode === 'chat' ? 'w-80 sm:w-96' : 'w-72'}`}
        sideOffset={8}
      >
        {viewMode === 'menu' && renderMenu()}
        {viewMode === 'human' && renderHumanSupport()}
        {viewMode === 'chat' && renderChat()}
      </PopoverContent>
    </Popover>
  );
};

export default FloatingSupportButton;
