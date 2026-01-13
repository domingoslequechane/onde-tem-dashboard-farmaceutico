import { useState, useRef, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Bot, User, Loader2, Paperclip, X, FileText, Trash2, Phone, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { formatMarkdownToHtml, formatInlineMarkdown } from '@/lib/formatMarkdown';
import * as XLSX from 'xlsx';
import mammoth from 'mammoth';
import * as pdfjsLib from 'pdfjs-dist';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
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
const MAX_TEXTAREA_HEIGHT = 150;

const WELCOME_MESSAGE: Message = {
  role: 'assistant',
  content: '# Olá! 👋\n\nSou o **assistente virtual** da ONDTem. Como posso ajudá-lo hoje?\n\n## Posso ajudar com:\n- Gestão de estoque\n- Análise de demanda\n- Configurações da farmácia\n- **Conversão de ficheiros para CSV** (PDF, Excel, Word, etc.)\n- Estruturação da base de dados\n- Problemas técnicos\n\n💡 **Dica**: Envie qualquer ficheiro com dados de medicamentos e eu converto para CSV pronto para importar!'
};

interface SupportProps {
  farmaciaId?: string;
}

const Support = ({ farmaciaId }: SupportProps) => {
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [attachedFile, setAttachedFile] = useState<{ name: string; content: string; type: string } | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load chat history on mount
  useEffect(() => {
    if (farmaciaId) {
      loadChatHistory();
    } else {
      setIsLoadingHistory(false);
    }
  }, [farmaciaId]);

  // Auto-focus after loading
  useEffect(() => {
    if (!isLoadingHistory) {
      textareaRef.current?.focus();
    }
  }, [isLoadingHistory]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages]);

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

  const loadChatHistory = async () => {
    if (!farmaciaId) return;
    
    try {
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
      }
    } catch (error) {
      console.error('Error loading chat history:', error);
    } finally {
      setIsLoadingHistory(false);
    }
  };

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
      toast({
        title: 'Erro',
        description: 'Não foi possível limpar o histórico.',
        variant: 'destructive',
      });
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
    const maxPages = Math.min(pdf.numPages, 50); // Limit to 50 pages
    for (let i = 1; i <= maxPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const pageText = content.items
        .map((item: any) => item.str)
        .join(' ');
      text += pageText + '\n';
    }
    if (pdf.numPages > 50) {
      text += `\n[Nota: Apenas as primeiras 50 páginas de ${pdf.numPages} foram processadas]`;
    }
    return text;
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Accept more file types for AI processing
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

    // Show loading toast for binary files
    const isBinaryFile = ['.pdf', '.xlsx', '.xls', '.doc', '.docx'].includes(fileExtension);
    if (isBinaryFile) {
      toast({
        title: 'A processar ficheiro...',
        description: 'Extraindo conteúdo, aguarde um momento.',
      });
    }

    try {
      let content = '';
      
      // Parse based on file type
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
          description: 'Não foi possível extrair conteúdo do ficheiro. Pode ser um PDF escaneado ou ficheiro protegido.',
          variant: 'destructive',
        });
        return;
      }
      
      setAttachedFile({
        name: file.name,
        content: content.slice(0, 50000), // Increased limit for parsed content
        type: file.type || 'text/plain'
      });
      
      if (isBinaryFile) {
        toast({
          title: 'Ficheiro processado!',
          description: `Conteúdo de "${file.name}" extraído com sucesso.`,
        });
      }
      
      textareaRef.current?.focus();
    } catch (error) {
      console.error('Error parsing file:', error);
      toast({
        title: 'Erro ao processar ficheiro',
        description: 'Não foi possível extrair o conteúdo. Tente um formato diferente.',
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

  // Download CSV from content
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
      description: 'O ficheiro está pronto para importação no estoque.',
    });
  };

  // Extract CSV from message
  const extractCSVFromMessage = (content: string): string | null => {
    const csvMatch = content.match(/---CSV_START---([\s\S]*?)---CSV_END---/);
    if (csvMatch) {
      return csvMatch[1].trim();
    }
    return null;
  };

  const sendMessage = async () => {
    if ((!inputValue.trim() && !attachedFile) || isLoading) return;

    let messageContent = inputValue.trim();
    
    if (attachedFile) {
      const fileContext = `\n\n[Ficheiro anexado: ${attachedFile.name}]\n\`\`\`\n${attachedFile.content}\n\`\`\``;
      messageContent = messageContent ? `${messageContent}${fileContext}` : `Por favor, analise este ficheiro e converta para CSV de medicamentos:${fileContext}`;
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

    // Save user message
    await saveMessage(userMessage);

    setTimeout(() => textareaRef.current?.focus(), 0);

    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/support-chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [...messages.filter(m => m !== WELCOME_MESSAGE), userMessage].map(m => ({
            role: m.role,
            content: m.content
          }))
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Erro ao enviar mensagem');
      }

      if (!response.body) {
        throw new Error('Resposta vazia do servidor');
      }

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

      // Process remaining buffer
      if (textBuffer.trim()) {
        for (let raw of textBuffer.split('\n')) {
          if (!raw) continue;
          if (raw.endsWith('\r')) raw = raw.slice(0, -1);
          if (raw.startsWith(':') || raw.trim() === '') continue;
          if (!raw.startsWith('data: ')) continue;
          const jsonStr = raw.slice(6).trim();
          if (jsonStr === '[DONE]') continue;
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
          } catch { /* ignore */ }
        }
      }

      // Save assistant message
      if (assistantContent) {
        await saveMessage({ role: 'assistant', content: assistantContent });
      }

    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Não foi possível enviar a mensagem',
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
      textareaRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Enhanced markdown formatting with CSV support
  const formatMessage = (content: string) => {
    // Check for CSV content
    const csvContent = extractCSVFromMessage(content);
    const contentWithoutCSV = content.replace(/---CSV_START---[\s\S]*?---CSV_END---/, '').trim();
    
    const formattedContent = formatMarkdownToHtml(contentWithoutCSV);
    
    // If there's CSV content, wrap in a fragment with the download button
    if (csvContent) {
      return (
        <>
          {formattedContent}
          <div className="mt-4 p-3 bg-primary/10 border border-primary/20 rounded-lg">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium text-sm text-foreground">CSV Pronto!</p>
                  <p className="text-xs text-muted-foreground">Ficheiro formatado para importação</p>
                </div>
              </div>
              <Button
                size="sm"
                onClick={() => downloadCSV(csvContent)}
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                Baixar CSV
              </Button>
            </div>
          </div>
        </>
      );
    }

    return formattedContent;
  };

  const renderUserMessage = (message: Message) => {
    if (message.file) {
      const textContent = message.content.split('\n\n[Ficheiro anexado:')[0];
      return (
        <div className="space-y-2">
          {textContent && <div className="text-sm leading-relaxed">{textContent}</div>}
          <div className="flex items-center gap-2 bg-primary-foreground/20 rounded-lg px-3 py-2">
            <FileText className="h-4 w-4" />
            <span className="text-xs font-medium truncate">{message.file.name}</span>
          </div>
        </div>
      );
    }
    return <div className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</div>;
  };

  if (isLoadingHistory) {
    return (
      <Card className="flex flex-col h-[calc(100vh-180px)] sm:h-[calc(100vh-160px)] items-center justify-center border-border/50">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground mt-2">Carregando histórico...</p>
      </Card>
    );
  }

  const requestHumanSupport = () => {
    const userRequest: Message = {
      role: 'user',
      content: 'Quero falar com um atendente humano'
    };
    
    const assistantResponse: Message = {
      role: 'assistant',
      content: `# Suporte Humano Solicitado 🧑‍💼\n\nA sua solicitação foi registada com sucesso!\n\n## O que acontece agora?\n\n1. **Notificação enviada** - A nossa equipa de suporte foi notificada\n2. **Contacto em breve** - Um especialista entrará em contacto consigo em até **24 horas úteis**\n3. **Canais de contacto** - Poderá receber contacto via:\n   - Email registado na conta\n   - WhatsApp da farmácia\n\n## Contacto Directo\n\nSe preferir, pode contactar-nos directamente:\n- 📧 **Email (Geral):** comercial@ondtem.com\n- 📧 **Email (Adesão):** adesao@ondtem.com\n- 📞 **Telefone:** +258 853 135 136 ou +258 868 499 221\n\n*Enquanto aguarda, posso continuar a ajudá-lo com outras questões!*`
    };
    
    setMessages(prev => [...prev, userRequest, assistantResponse]);
    saveMessage(userRequest);
    saveMessage(assistantResponse);
    
    toast({
      title: 'Suporte humano solicitado',
      description: 'A nossa equipa entrará em contacto em breve.',
    });
  };

  return (
    <div className="relative h-[calc(100vh-180px)] sm:h-[calc(100vh-160px)] flex gap-4">
      <Card className="flex flex-col flex-1 h-full border-border/50 shadow-sm">
        <CardHeader className="pb-3 border-b border-border/50 bg-muted/30">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2.5 text-base">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                <Bot className="h-4 w-4 text-primary" />
              </div>
              <div>
                <span className="font-semibold">Suporte</span>
                <p className="text-xs font-normal text-muted-foreground">Assistente ONDTem</p>
              </div>
            </CardTitle>
            {messages.length > 1 && farmaciaId && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Limpar histórico?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Esta ação irá apagar todo o histórico de conversas. Esta ação não pode ser desfeita.
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
        </CardHeader>
        <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
          <ScrollArea ref={scrollAreaRef} className="flex-1 px-4 py-3">
            <div className="space-y-4">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {message.role === 'assistant' && (
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center shadow-sm">
                      <Bot className="h-4 w-4 text-primary" />
                    </div>
                  )}
                  <div
                    className={`max-w-[85%] sm:max-w-[80%] rounded-2xl px-4 py-3 shadow-sm ${
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground rounded-br-md'
                        : 'bg-card border border-border/50 text-card-foreground rounded-bl-md'
                    }`}
                  >
                    {message.role === 'user' ? (
                      renderUserMessage(message)
                    ) : (
                      <div className="text-sm leading-relaxed">
                        {message.content ? formatMessage(message.content) : (
                          <div className="flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span className="text-muted-foreground text-xs">A pensar...</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  {message.role === 'user' && (
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center shadow-sm">
                      <User className="h-4 w-4 text-primary-foreground" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>

          <div className="p-4 border-t border-border/50 bg-background/50">
            {attachedFile && (
              <div className="flex items-center gap-2 mb-3 bg-primary/5 border border-primary/20 rounded-lg px-3 py-2">
                <FileText className="h-4 w-4 text-primary" />
                <span className="text-sm truncate flex-1 font-medium">{attachedFile.name}</span>
                <Button variant="ghost" size="icon" className="h-6 w-6 hover:bg-destructive/10 hover:text-destructive" onClick={removeAttachedFile}>
                  <X className="h-3 w-3" />
                </Button>
              </div>
            )}

            <div className="flex gap-2 items-end">
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
                className="flex-shrink-0 border-border/50 hover:bg-primary/5 hover:border-primary/30"
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading}
                title="Anexar ficheiro"
              >
                <Paperclip className="h-4 w-4" />
              </Button>

              <Textarea
                ref={textareaRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Digite sua mensagem..."
                disabled={isLoading}
                className="flex-1 min-h-[44px] max-h-[150px] resize-none overflow-y-auto border-border/50 focus:border-primary/50 bg-background"
                rows={1}
              />
              
              <Button 
                onClick={sendMessage} 
                disabled={isLoading || (!inputValue.trim() && !attachedFile)}
                size="icon"
                className="flex-shrink-0 shadow-sm"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2.5 text-center">
              Envie ficheiros para conversão automática para CSV
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions Panel */}
      <div className="hidden lg:block w-80 shrink-0">
        <div className="sticky top-0 p-4 space-y-4">
          <div className="space-y-1">
            <h4 className="font-semibold text-foreground">Precisa de ajuda?</h4>
            <p className="text-sm text-muted-foreground">
              Escolha uma opção para obter suporte
            </p>
          </div>
          
          <div className="space-y-2">
            <Button
              variant="outline"
              className="w-full justify-start gap-3 h-auto py-3 border-border/50 hover:bg-primary/5"
              onClick={() => {
                textareaRef.current?.focus();
              }}
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
              onClick={requestHumanSupport}
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
      </div>
    </div>
  );
};

export default Support;
