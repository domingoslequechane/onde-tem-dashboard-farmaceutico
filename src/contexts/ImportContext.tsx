import { createContext, useContext, useState, useRef, useCallback, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface ParsedMedicine {
  nome: string;
  preco: number;
  categoria: string;
  disponivel: boolean;
}

interface ImportState {
  isImporting: boolean;
  isMinimized: boolean;
  progress: number;
  currentIndex: number;
  totalItems: number;
  skippedCount: number;
  remainingTimeSeconds: number;
  actionText: string;
}

interface ImportContextType {
  importState: ImportState;
  startImport: (
    parsedData: ParsedMedicine[],
    farmaciaId: string,
    clearExistingStock: boolean,
    onSuccess: () => void
  ) => Promise<void>;
  minimizeImport: () => void;
  maximizeImport: () => void;
  cancelImport: () => void;
}

const ImportContext = createContext<ImportContextType | undefined>(undefined);

export const useImport = () => {
  const context = useContext(ImportContext);
  if (!context) {
    throw new Error('useImport must be used within an ImportProvider');
  }
  return context;
};

export const ImportProvider = ({ children }: { children: ReactNode }) => {
  const [importState, setImportState] = useState<ImportState>({
    isImporting: false,
    isMinimized: false,
    progress: 0,
    currentIndex: 0,
    totalItems: 0,
    skippedCount: 0,
    remainingTimeSeconds: 0,
    actionText: 'Importando medicamentos',
  });

  const importCancelledRef = useRef(false);
  const importStartTimeRef = useRef<number>(0);
  const onSuccessRef = useRef<(() => void) | null>(null);

  const cancelImport = useCallback(() => {
    importCancelledRef.current = true;
  }, []);

  const minimizeImport = useCallback(() => {
    setImportState(prev => ({ ...prev, isMinimized: true }));
  }, []);

  const maximizeImport = useCallback(() => {
    setImportState(prev => ({ ...prev, isMinimized: false }));
  }, []);

  const startImport = useCallback(async (
    parsedData: ParsedMedicine[],
    farmaciaId: string,
    clearExistingStock: boolean,
    onSuccess: () => void
  ) => {
    if (importState.isImporting) return;

    onSuccessRef.current = onSuccess;
    importCancelledRef.current = false;
    importStartTimeRef.current = Date.now();

    // Data is already pre-analyzed by ImportMedicinesModal, so we skip analysis here
    const totalToProcess = parsedData.length;
    const estimatedTimeSeconds = Math.ceil(totalToProcess * 0.8);

    setImportState({
      isImporting: true,
      isMinimized: false,
      progress: 0,
      currentIndex: 0,
      totalItems: totalToProcess,
      skippedCount: 0,
      remainingTimeSeconds: estimatedTimeSeconds,
      actionText: clearExistingStock ? 'Limpando estoque existente...' : 'Importando medicamentos',
    });

    let successCount = 0;
    let errorCount = 0;

    try {
      // Clear existing stock if option is selected
      if (clearExistingStock) {
        const { error: deleteError } = await supabase
          .from('estoque')
          .delete()
          .eq('farmacia_id', farmaciaId);
        
        if (deleteError) {
          console.error('Erro ao limpar estoque:', deleteError);
          toast({
            title: "Erro ao limpar estoque",
            description: "Não foi possível limpar o estoque existente.",
            variant: "destructive",
          });
          setImportState(prev => ({ ...prev, isImporting: false }));
          return;
        }
      }

      // Update action text after clearing
      setImportState(prev => ({ ...prev, actionText: 'Importando medicamentos' }));

      // Check if cancelled
      if (importCancelledRef.current) {
        toast({
          title: "Importação cancelada",
          description: "A importação foi interrompida antes de iniciar.",
        });
        onSuccessRef.current?.();
        setImportState(prev => ({ ...prev, isImporting: false, isMinimized: false }));
        return;
      }

      // If nothing to import
      if (totalToProcess === 0) {
        toast({
          title: "Nenhum medicamento para importar",
          description: "Todos os medicamentos já existem no estoque.",
        });
        onSuccessRef.current?.();
        setImportState(prev => ({ ...prev, isImporting: false, isMinimized: false }));
        return;
      }

      // === BATCH IMPORT: Much faster than individual inserts ===
      const batchSize = 100;
      const totalBatches = Math.ceil(parsedData.length / batchSize);
      
      // First, fetch ALL existing medications from catalog for ID lookup (paginated)
      setImportState(prev => ({ ...prev, actionText: 'Carregando catálogo...' }));
      const existingMedications = new Map<string, string>(); // name -> id
      let from = 0;
      let hasMore = true;
      
      while (hasMore) {
        const { data: existingMeds } = await supabase
          .from('medicamentos')
          .select('id, nome')
          .range(from, from + 999);
        
        if (existingMeds && existingMeds.length > 0) {
          existingMeds.forEach(med => {
            existingMedications.set(med.nome.toLowerCase().trim(), med.id);
          });
          from += 1000;
          hasMore = existingMeds.length === 1000;
        } else {
          hasMore = false;
        }
      }

      setImportState(prev => ({ ...prev, actionText: 'Importando medicamentos' }));

      // Process in batches
      for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
        if (importCancelledRef.current) {
          toast({
            title: "Importação interrompida",
            description: `${successCount} medicamento(s) importado(s) antes da interrupção.`,
          });
          onSuccessRef.current?.();
          setImportState(prev => ({ ...prev, isImporting: false, isMinimized: false }));
          return;
        }

        const start = batchIndex * batchSize;
        const end = Math.min(start + batchSize, parsedData.length);
        const batch = parsedData.slice(start, end);
        
        // Update progress
        const elapsedMs = Date.now() - importStartTimeRef.current;
        const processedCount = start;
        const avgTimePerItem = processedCount > 0 ? elapsedMs / processedCount : 50;
        const remainingItems = parsedData.length - end;
        const estimatedRemainingMs = avgTimePerItem * remainingItems;
        
        setImportState(prev => ({
          ...prev,
          currentIndex: end,
          progress: Math.round((end / parsedData.length) * 100),
          remainingTimeSeconds: Math.ceil(estimatedRemainingMs / 1000),
        }));

        // Separate items that need new medications vs existing
        const newMedicationsToCreate: { nome: string; categoria: string }[] = [];
        const batchMedicineData: { medicine: ParsedMedicine; normalizedName: string }[] = [];

        for (const medicine of batch) {
          const normalizedName = medicine.nome.toLowerCase().trim();
          batchMedicineData.push({ medicine, normalizedName });
          
          if (!existingMedications.has(normalizedName)) {
            newMedicationsToCreate.push({
              nome: medicine.nome,
              categoria: medicine.categoria,
            });
          }
        }

        // Batch insert new medications if any
        if (newMedicationsToCreate.length > 0) {
          const { data: createdMeds, error: createError } = await supabase
            .from('medicamentos')
            .insert(newMedicationsToCreate)
            .select('id, nome');

          if (createError) {
            console.error('Erro ao criar medicamentos em lote:', createError);
            errorCount += newMedicationsToCreate.length;
          } else if (createdMeds) {
            createdMeds.forEach(med => {
              existingMedications.set(med.nome.toLowerCase().trim(), med.id);
            });
          }
        }

        // Prepare stock entries for batch insert
        const stockEntries: { farmacia_id: string; medicamento_id: string; preco: number; disponivel: boolean }[] = [];
        
        for (const { medicine, normalizedName } of batchMedicineData) {
          const medicamentoId = existingMedications.get(normalizedName);
          if (medicamentoId) {
            stockEntries.push({
              farmacia_id: farmaciaId,
              medicamento_id: medicamentoId,
              preco: medicine.preco,
              disponivel: medicine.disponivel,
            });
          } else {
            errorCount++;
          }
        }

        // Batch insert stock entries
        if (stockEntries.length > 0) {
          const { error: insertError } = await supabase
            .from('estoque')
            .insert(stockEntries);

          if (insertError) {
            console.error('Erro ao inserir estoque em lote:', insertError);
            errorCount += stockEntries.length;
          } else {
            successCount += stockEntries.length;
          }
        }
      }

      const messages: string[] = [];
      if (successCount > 0) messages.push(`${successCount} importado(s)`);
      if (errorCount > 0) messages.push(`${errorCount} erro(s)`);

      toast({
        title: "Importação concluída!",
        description: messages.join(', ') + '.',
        variant: errorCount > 0 ? "destructive" : "default",
      });

      onSuccessRef.current?.();
    } catch (error) {
      console.error('Erro na importação:', error);
      toast({
        title: "Erro na importação",
        description: "Ocorreu um erro durante a importação.",
        variant: "destructive",
      });
    } finally {
      setImportState(prev => ({ ...prev, isImporting: false, isMinimized: false }));
    }
  }, [importState.isImporting]);

  return (
    <ImportContext.Provider value={{ importState, startImport, minimizeImport, maximizeImport, cancelImport }}>
      {children}
    </ImportContext.Provider>
  );
};
