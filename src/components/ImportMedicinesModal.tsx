import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle, Download, Clock, Minimize2, Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useImport } from '@/contexts/ImportContext';
import { supabase } from '@/integrations/supabase/client';

interface ImportMedicinesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  farmaciaId: string;
}

interface ParsedMedicine {
  nome: string;
  preco: number;
  categoria: string;
  disponivel: boolean;
}

interface AnalysisResult {
  newItems: ParsedMedicine[];
  existingCount: number;
  duplicatesRemoved: number;
  totalParsed: number;
}

const ImportMedicinesModal = ({ isOpen, onClose, onSuccess, farmaciaId }: ImportMedicinesModalProps) => {
  const { importState, startImport, minimizeImport, cancelImport, maximizeImport } = useImport();
  const [parsedData, setParsedData] = useState<ParsedMedicine[]>([]);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [fileName, setFileName] = useState('');
  const [clearExistingStock, setClearExistingStock] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isUploading = importState.isImporting && !importState.isMinimized;

  // Estimate ~0.8 seconds per item for database operations
  const estimatedTimeSeconds = analysisResult ? Math.ceil(analysisResult.newItems.length * 0.8) : 0;
  const estimatedTimeFormatted = estimatedTimeSeconds >= 60 
    ? `${Math.ceil(estimatedTimeSeconds / 60)} minuto(s)` 
    : `${estimatedTimeSeconds} segundo(s)`;

  // Format remaining time
  const formatRemainingTime = (seconds: number) => {
    if (seconds >= 60) {
      const minutes = Math.ceil(seconds / 60);
      return `${minutes} minuto(s)`;
    }
    return `${seconds} segundo(s)`;
  };

  const resetState = () => {
    setParsedData([]);
    setAnalysisResult(null);
    setIsAnalyzing(false);
    setErrors([]);
    setFileName('');
    setClearExistingStock(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClose = () => {
    if (!importState.isImporting && !isAnalyzing) {
      resetState();
    }
    onClose();
  };

  const handleCancelClick = () => {
    if (importState.isImporting) {
      setShowCancelConfirm(true);
    } else {
      handleClose();
    }
  };

  const handleConfirmCancel = () => {
    cancelImport();
    setShowCancelConfirm(false);
    resetState();
  };

  const handleMinimize = () => {
    minimizeImport();
    onClose();
  };

  const downloadTemplate = () => {
    const csvContent = [
      'Nome,Preço,Categoria,Disponível',
      'Paracetamol 500mg,15.00,Analgésico,Sim',
      'Amoxicilina 500mg,45.00,Antibiótico,Sim',
      'Omeprazol 20mg,30.00,Gastroprotetor,Não'
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', 'modelo_importacao_medicamentos.csv');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    toast({
      title: "Modelo baixado!",
      description: "Use este arquivo como modelo para importação.",
    });
  };

  const parseCSV = (content: string): { medicines: ParsedMedicine[]; errors: string[] } => {
    const lines = content.split(/\r?\n/).filter(line => line.trim());
    const medicines: ParsedMedicine[] = [];
    const parseErrors: string[] = [];

    // Skip header line
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // Handle CSV with possible quotes
      const parts = line.match(/(".*?"|[^",]+)(?=\s*,|\s*$)/g);
      if (!parts || parts.length < 4) {
        parseErrors.push(`Linha ${i + 1}: formato inválido (esperado: Nome,Preço,Categoria,Disponível)`);
        continue;
      }

      const nome = parts[0]?.replace(/"/g, '').trim();
      const precoStr = parts[1]?.replace(/"/g, '').trim().replace(',', '.');
      const categoria = parts[2]?.replace(/"/g, '').trim();
      const disponivelStr = parts[3]?.replace(/"/g, '').trim().toLowerCase();

      if (!nome) {
        parseErrors.push(`Linha ${i + 1}: nome do medicamento é obrigatório`);
        continue;
      }

      const preco = parseFloat(precoStr);
      if (isNaN(preco) || preco < 0) {
        parseErrors.push(`Linha ${i + 1}: preço inválido "${precoStr}"`);
        continue;
      }

      if (!categoria) {
        parseErrors.push(`Linha ${i + 1}: categoria é obrigatória`);
        continue;
      }

      const disponivel = disponivelStr === 'sim' || disponivelStr === 'true' || disponivelStr === '1' || disponivelStr === 'yes';

      medicines.push({ nome, preco, categoria, disponivel });
    }

    return { medicines, errors: parseErrors };
  };

  const analyzeCSVData = async (medicines: ParsedMedicine[]): Promise<AnalysisResult> => {
    const totalParsed = medicines.length;
    
    // Remove duplicates from CSV based on medication name (case-insensitive)
    const uniqueData: ParsedMedicine[] = [];
    const seenNames = new Set<string>();
    for (const item of medicines) {
      const normalizedName = item.nome.toLowerCase().trim();
      if (!seenNames.has(normalizedName)) {
        seenNames.add(normalizedName);
        uniqueData.push(item);
      }
    }
    const duplicatesRemoved = totalParsed - uniqueData.length;

    // Fetch ONLY existing stock for this pharmacy with medication names (much faster)
    const existingStockNames = new Set<string>(); // normalized medication names in stock
    const pageSize = 1000;
    let from = 0;
    let hasMore = true;
    
    while (hasMore) {
      const { data: stockData, error } = await supabase
        .from('estoque')
        .select('medicamento_id, medicamentos(nome)')
        .eq('farmacia_id', farmaciaId)
        .range(from, from + pageSize - 1);
      
      if (error) {
        console.error('Error fetching stock:', error);
        break;
      }
      
      if (stockData && stockData.length > 0) {
        stockData.forEach(stock => {
          const med = stock.medicamentos as { nome: string } | null;
          if (med?.nome) {
            existingStockNames.add(med.nome.toLowerCase().trim());
          }
        });
        from += pageSize;
        hasMore = stockData.length === pageSize;
      } else {
        hasMore = false;
      }
    }
    
    console.log(`Loaded ${existingStockNames.size} stock entries for this pharmacy`);

    // Determine which medicines are new vs existing (compare against pharmacy's stock only)
    const newItems: ParsedMedicine[] = [];
    let existingCount = 0;
    
    for (const medicine of uniqueData) {
      const normalizedName = medicine.nome.toLowerCase().trim();
      
      if (existingStockNames.has(normalizedName)) {
        // Already exists in pharmacy stock
        existingCount++;
      } else {
        // New item to import
        newItems.push(medicine);
      }
    }

    return {
      newItems,
      existingCount,
      duplicatesRemoved,
      totalParsed
    };
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setErrors([]);
    setParsedData([]);
    setAnalysisResult(null);

    const fileExtension = file.name.split('.').pop()?.toLowerCase();

    if (fileExtension !== 'csv') {
      setErrors(['Formato não suportado. Por favor, use arquivos CSV.']);
      toast({
        title: "Formato não suportado",
        description: "Por favor, use arquivos no formato CSV.",
        variant: "destructive",
      });
      return;
    }

    try {
      const content = await file.text();
      const { medicines, errors: parseErrors } = parseCSV(content);

      setErrors(parseErrors);

      if (medicines.length === 0) {
        setErrors(prev => [...prev, 'Nenhum medicamento válido encontrado no arquivo.']);
        return;
      }

      setParsedData(medicines);
      
      // Start automatic analysis
      setIsAnalyzing(true);
      
      try {
        const result = await analyzeCSVData(medicines);
        setAnalysisResult(result);
      } catch (error) {
        console.error('Erro na análise:', error);
        setErrors(prev => [...prev, 'Erro ao analisar medicamentos existentes.']);
      } finally {
        setIsAnalyzing(false);
      }
    } catch (error) {
      console.error('Erro ao processar arquivo:', error);
      setErrors(['Erro ao processar o arquivo. Verifique o formato.']);
    }
  };

  const handleImport = async () => {
    const itemsToImport = clearExistingStock ? parsedData : (analysisResult?.newItems || []);
    
    if (itemsToImport.length === 0) {
      toast({
        title: "Nenhum dado para importar",
        description: clearExistingStock 
          ? "Selecione um arquivo válido primeiro."
          : "Todos os medicamentos já existem no estoque.",
        variant: "destructive",
      });
      return;
    }

    if (!farmaciaId) {
      toast({
        title: "Erro",
        description: "Farmácia não identificada.",
        variant: "destructive",
      });
      return;
    }

    // Pass the pre-analyzed data to skip re-analysis
    await startImport(itemsToImport, farmaciaId, clearExistingStock, () => {
      onSuccess();
      resetState();
      onClose();
    });
  };

  // Re-open modal when maximizing from minimized state
  const shouldShowModal = isOpen || (importState.isImporting && !importState.isMinimized);

  // Handle maximize from floating indicator
  if (importState.isImporting && !importState.isMinimized && !isOpen) {
    // Auto-open modal when maximizing
  }

  return (
    <Dialog open={shouldShowModal} onOpenChange={(open) => {
      if (!open && importState.isImporting) {
        // Don't close during import, minimize instead
        return;
      }
      if (!open) handleClose();
    }}>
      <DialogContent className="sm:max-w-md max-w-[95vw] rounded-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
            <FileSpreadsheet className="h-5 w-5 text-primary" />
            Importar Medicamentos
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            {importState.isImporting 
              ? "Aguarde enquanto os medicamentos são processados"
              : "Faça upload de um arquivo CSV com seus medicamentos"
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Template download - hidden during upload */}
          {!importState.isImporting && (
            <div className="bg-muted/50 rounded-lg p-3 border border-dashed">
              <p className="text-xs sm:text-sm text-muted-foreground mb-2">
                Baixe o modelo CSV para preencher seus medicamentos:
              </p>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={downloadTemplate}
                className="gap-2 text-xs h-8"
              >
                <Download className="h-3.5 w-3.5" />
                Baixar Modelo CSV
              </Button>
            </div>
          )}

          {/* File upload - hidden during upload */}
          {!importState.isImporting && !isAnalyzing && !analysisResult && (
            <div className="space-y-2">
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="hidden"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
              >
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                  <p className="text-xs sm:text-sm text-muted-foreground text-center">
                    <span className="font-semibold text-primary">Clique para selecionar</span> ou arraste o arquivo
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">CSV (máx. 10MB)</p>
                </div>
              </label>
              {fileName && !isAnalyzing && (
                <p className="text-xs text-muted-foreground text-center">
                  Arquivo selecionado: <span className="font-medium">{fileName}</span>
                </p>
              )}
            </div>
          )}

          {/* Analyzing state */}
          {isAnalyzing && (
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
              <Loader2 className="h-10 w-10 text-primary animate-spin" />
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    handleClose();
                  }}
                >
                  <Minimize2 className="h-4 w-4 mr-1" />
                  Minimizar
                </Button>
                <div className="text-left">
                  <p className="text-sm font-medium">Analisando arquivo...</p>
                  <p className="text-xs text-muted-foreground">
                    Verificando {parsedData.length} medicamentos
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Errors */}
          {errors.length > 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-1 text-xs max-h-24 overflow-y-auto">
                  {errors.map((error, index) => (
                    <p key={index}>{error}</p>
                  ))}
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Analysis Result Preview */}
          {analysisResult && !importState.isImporting && !isAnalyzing && (
            <div className="space-y-3">
              {/* Summary card */}
              <div className="bg-muted/50 rounded-lg p-3 border">
                <p className="text-xs font-medium mb-2">Resultado da análise:</p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-secondary"></div>
                    <span className="text-muted-foreground">Novos:</span>
                    <span className="font-medium text-secondary">{analysisResult.newItems.length}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                    <span className="text-muted-foreground">Já existentes:</span>
                    <span className="font-medium text-amber-600">{analysisResult.existingCount}</span>
                  </div>
                  {analysisResult.duplicatesRemoved > 0 && (
                    <div className="flex items-center gap-2 col-span-2">
                      <div className="w-2 h-2 rounded-full bg-muted-foreground"></div>
                      <span className="text-muted-foreground">Duplicatas removidas:</span>
                      <span className="font-medium">{analysisResult.duplicatesRemoved}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* New items preview */}
              {analysisResult.newItems.length > 0 ? (
                <Alert className="border-secondary">
                  <CheckCircle className="h-4 w-4 text-secondary" />
                  <AlertDescription>
                    <p className="font-medium text-xs sm:text-sm">
                      {analysisResult.newItems.length} medicamento(s) novo(s) para importar:
                    </p>
                    <div className="max-h-32 overflow-y-auto mt-2 space-y-1">
                      {analysisResult.newItems.slice(0, 5).map((med, index) => (
                        <div key={index} className="text-xs text-muted-foreground flex items-center gap-2">
                          <span className="font-medium truncate max-w-[150px]">{med.nome}</span>
                          <span>•</span>
                          <span>{med.preco.toFixed(2)} MT</span>
                          <span>•</span>
                          <span className={med.disponivel ? 'text-secondary' : 'text-destructive'}>
                            {med.disponivel ? 'Disponível' : 'Indisponível'}
                          </span>
                        </div>
                      ))}
                      {analysisResult.newItems.length > 5 && (
                        <p className="text-xs text-muted-foreground">
                          ...e mais {analysisResult.newItems.length - 5} medicamento(s)
                        </p>
                      )}
                    </div>
                    {analysisResult.newItems.length > 10 && (
                      <p className="text-xs text-amber-600 mt-2 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        Tempo estimado: {estimatedTimeFormatted}
                      </p>
                    )}
                  </AlertDescription>
                </Alert>
              ) : (
                <Alert className="border-amber-500">
                  <AlertCircle className="h-4 w-4 text-amber-500" />
                  <AlertDescription>
                    <p className="font-medium text-xs sm:text-sm text-amber-600">
                      Todos os {analysisResult.existingCount} medicamento(s) já existem no seu estoque.
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Selecione "Limpar estoque existente" para substituir os dados.
                    </p>
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {/* Import options */}
          {analysisResult && !importState.isImporting && !isAnalyzing && (
            <div className="space-y-3 border rounded-lg p-3 bg-muted/30">
              <p className="text-xs font-medium text-foreground">Opções de importação:</p>
              <div className="flex items-start space-x-2">
                <Checkbox 
                  id="clearStock" 
                  checked={clearExistingStock}
                  onCheckedChange={(checked) => setClearExistingStock(checked === true)}
                />
                <div className="grid gap-1 leading-none">
                  <Label 
                    htmlFor="clearStock" 
                    className="text-xs font-medium cursor-pointer"
                  >
                    Limpar estoque existente
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Remove todos os medicamentos atuais e importa {parsedData.length} do arquivo
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-2">
                <Checkbox 
                  id="keepStock" 
                  checked={!clearExistingStock}
                  onCheckedChange={(checked) => setClearExistingStock(checked !== true)}
                />
                <div className="grid gap-1 leading-none">
                  <Label 
                    htmlFor="keepStock" 
                    className="text-xs font-medium cursor-pointer"
                  >
                    Manter registros existentes
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Importa apenas os {analysisResult.newItems.length} medicamento(s) novo(s)
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Progress during import */}
          {importState.isImporting && (
            <div className="space-y-3">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{importState.actionText}</span>
                {importState.totalItems > 0 && (
                  <span className="font-medium">
                    ({importState.currentIndex}/{importState.totalItems}) • {importState.progress}%
                  </span>
                )}
              </div>
              <div className="w-full bg-muted rounded-full h-2.5 overflow-hidden">
                <div 
                  className="bg-primary h-2.5 rounded-full transition-all duration-300"
                  style={{ width: `${importState.progress}%` }}
                />
              </div>
              {importState.skippedCount > 0 && (
                <p className="text-xs text-amber-600 text-center">
                  {importState.skippedCount} medicamento(s) ignorado(s) (já existentes)
                </p>
              )}
              {importState.totalItems > 0 && (
                <div className="flex items-center justify-center gap-1.5 text-xs text-primary font-medium">
                  <Clock className="h-3.5 w-3.5" />
                  <span>Tempo estimado: {formatRemainingTime(importState.remainingTimeSeconds)}</span>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex gap-3 justify-end">
          {importState.isImporting ? (
            <>
              <Button variant="outline" onClick={handleMinimize} className="gap-2 text-xs sm:text-sm">
                <Minimize2 className="h-4 w-4" />
                Minimizar
              </Button>
              <Button variant="outline" onClick={handleCancelClick} className="text-xs sm:text-sm">
                Cancelar
              </Button>
            </>
          ) : isAnalyzing ? (
            <Button variant="outline" disabled className="text-xs sm:text-sm">
              Analisando...
            </Button>
          ) : (
            <>
              <Button variant="outline" onClick={handleCancelClick} className="text-xs sm:text-sm">
                Cancelar
              </Button>
              <Button 
                onClick={handleImport} 
                disabled={!analysisResult || (analysisResult.newItems.length === 0 && !clearExistingStock) || importState.isImporting}
                className="gap-2 text-xs sm:text-sm"
              >
                <Upload className="h-4 w-4" />
                Importar ({clearExistingStock ? parsedData.length : (analysisResult?.newItems.length || 0)})
              </Button>
            </>
          )}
        </div>
      </DialogContent>

      {/* Cancel confirmation dialog */}
      <AlertDialog open={showCancelConfirm} onOpenChange={setShowCancelConfirm}>
        <AlertDialogContent className="rounded-xl max-w-[90vw] sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base">Cancelar importação?</AlertDialogTitle>
            <AlertDialogDescription className="text-sm space-y-2">
              <p>A importação está em andamento ({importState.currentIndex}/{importState.totalItems} medicamentos processados).</p>
              <p className="text-amber-600 font-medium">
                Se cancelar agora, os {importState.currentIndex} medicamento(s) já importados permanecerão no sistema.
              </p>
              <p>Deseja realmente interromper a importação?</p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="text-sm">Continuar importando</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmCancel}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 text-sm"
            >
              Sim, interromper
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
};

export default ImportMedicinesModal;
