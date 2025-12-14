import { useRef, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface SearchCaptureOptions {
  userLocation: { lat: number; lng: number } | null;
  raioKm: number;
}

interface PharmacyResult {
  farmacia_id: string;
  distancia_km: number;
}

// Get or create persistent session ID
const getOrCreateSessionId = (): string => {
  let sessionId = localStorage.getItem('ondtem_search_session_id');
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    localStorage.setItem('ondtem_search_session_id', sessionId);
  }
  return sessionId;
};

export const useSearchCapture = ({ userLocation, raioKm }: SearchCaptureOptions) => {
  const currentSearchId = useRef<string | null>(null);
  const currentProductSelectionId = useRef<string | null>(null);
  const abandonmentTimer = useRef<NodeJS.Timeout | null>(null);
  const hadProductSelection = useRef<boolean>(false);
  const outcomeRegistered = useRef<boolean>(false);

  // Clear abandonment timer
  const clearAbandonmentTimer = useCallback(() => {
    if (abandonmentTimer.current) {
      clearTimeout(abandonmentTimer.current);
      abandonmentTimer.current = null;
    }
  }, []);

  // Register search outcome (uses upsert to prevent duplicates)
  const registrarSearchOutcome = useCallback(async (
    searchId: string,
    status: 'success' | 'no_pharmacy' | 'no_product' | 'abandoned',
    pharmaciesCount: number,
    closestDistance: number | null
  ) => {
    if (outcomeRegistered.current) return;
    
    try {
      const { error } = await supabase.from('search_outcomes').upsert({
        search_id: searchId,
        outcome_status: status,
        pharmacies_found_count: pharmaciesCount,
        closest_pharmacy_distance: closestDistance
      }, {
        onConflict: 'search_id'
      });

      if (error) {
        console.error('Erro ao registrar search outcome:', error);
      } else {
        outcomeRegistered.current = true;
      }
    } catch (error) {
      console.error('Erro ao registrar search outcome:', error);
    }
  }, []);

  // Register new search - ONLY called on explicit user actions
  const registrarSearch = useCallback(async (
    typedText: string,
    submittedText: string
  ): Promise<string | null> => {
    // Clear previous abandonment timer
    clearAbandonmentTimer();

    // Mark previous search as abandoned if no product selection
    if (currentSearchId.current && !hadProductSelection.current && !outcomeRegistered.current) {
      await registrarSearchOutcome(currentSearchId.current, 'abandoned', 0, null);
    }

    // Reset state for new search
    hadProductSelection.current = false;
    outcomeRegistered.current = false;
    currentProductSelectionId.current = null;

    const sessionId = getOrCreateSessionId();

    try {
      const { data, error } = await supabase
        .from('searches')
        .insert({
          session_id: sessionId,
          typed_text: typedText,
          submitted_text: submittedText,
          latitude: userLocation?.lat,
          longitude: userLocation?.lng,
          search_radius: raioKm,
          source: 'web'
        })
        .select('id')
        .single();

      if (error) {
        console.error('Erro ao registrar search:', error);
        return null;
      }

      currentSearchId.current = data?.id || null;

      // Start abandonment timer (25 seconds)
      abandonmentTimer.current = setTimeout(() => {
        if (!hadProductSelection.current && currentSearchId.current && !outcomeRegistered.current) {
          registrarSearchOutcome(currentSearchId.current, 'abandoned', 0, null);
        }
      }, 25000);

      return data?.id || null;
    } catch (error) {
      console.error('Erro ao registrar search:', error);
      return null;
    }
  }, [userLocation, raioKm, clearAbandonmentTimer, registrarSearchOutcome]);

  // Register search normalization
  const registrarNormalization = useCallback(async (
    searchId: string,
    normalizedTerm: string | null,
    confidenceScore: number,
    matchType: 'catalog' | 'semantic' | 'none'
  ) => {
    try {
      const { error } = await supabase.from('search_normalizations').insert({
        search_id: searchId,
        normalized_term: normalizedTerm,
        confidence_score: confidenceScore,
        match_type: matchType
      });

      if (error) {
        console.error('Erro ao registrar normalization:', error);
      }
    } catch (error) {
      console.error('Erro ao registrar normalization:', error);
    }
  }, []);

  // Register product selection - ONLY when user explicitly clicks
  const registrarProductSelection = useCallback(async (
    searchId: string,
    productId: string | null,
    productName: string
  ): Promise<string | null> => {
    hadProductSelection.current = true;
    clearAbandonmentTimer();

    try {
      const { data, error } = await supabase
        .from('product_selections')
        .insert({
          search_id: searchId,
          product_id: productId,
          product_name: productName
        })
        .select('id')
        .single();

      if (error) {
        console.error('Erro ao registrar product selection:', error);
        return null;
      }

      currentProductSelectionId.current = data?.id || null;
      return data?.id || null;
    } catch (error) {
      console.error('Erro ao registrar product selection:', error);
      return null;
    }
  }, [clearAbandonmentTimer]);

  // Register impressions with full context
  const registrarImpressoes = useCallback(async (
    searchId: string,
    selectionId: string | null,
    farmacias: PharmacyResult[],
    medicamentoBuscado: string
  ) => {
    if (farmacias.length === 0) return;

    try {
      const impressoes = farmacias.map((f, index) => ({
        farmacia_id: f.farmacia_id,
        search_id: searchId,
        product_selection_id: selectionId,
        medicamento_buscado: medicamentoBuscado,
        cliente_latitude: userLocation?.lat,
        cliente_longitude: userLocation?.lng,
        distancia_km: f.distancia_km,
        rank_position: index + 1,
        is_closest: index === 0,
        is_first_option: index === 0
      }));

      const { error } = await supabase.from('impressoes_farmacia').insert(impressoes);

      if (error) {
        console.error('Erro ao registrar impressões:', error);
      }
    } catch (error) {
      console.error('Erro ao registrar impressões:', error);
    }
  }, [userLocation]);

  // Complete search flow helper
  const completarBusca = useCallback(async (
    typedText: string,
    selectedProductName: string,
    selectedProductId: string | null,
    farmaciasEncontradas: PharmacyResult[]
  ) => {
    // 1. Register search
    const searchId = await registrarSearch(typedText, selectedProductName);
    if (!searchId) return null;

    // 2. Register normalization (catalog match since user selected from autocomplete)
    await registrarNormalization(searchId, selectedProductName, 1.0, 'catalog');

    // 3. Register product selection
    const selectionId = await registrarProductSelection(searchId, selectedProductId, selectedProductName);

    // 4. Register outcome
    const closestDistance = farmaciasEncontradas.length > 0 
      ? Math.min(...farmaciasEncontradas.map(f => f.distancia_km))
      : null;

    if (farmaciasEncontradas.length > 0) {
      await registrarSearchOutcome(searchId, 'success', farmaciasEncontradas.length, closestDistance);
      // 5. Register impressions
      await registrarImpressoes(searchId, selectionId, farmaciasEncontradas, selectedProductName);
    } else {
      await registrarSearchOutcome(searchId, 'no_pharmacy', 0, null);
    }

    return { searchId, selectionId };
  }, [registrarSearch, registrarNormalization, registrarProductSelection, registrarSearchOutcome, registrarImpressoes]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearAbandonmentTimer();
      
      // Mark as abandoned if no outcome registered
      if (currentSearchId.current && !hadProductSelection.current && !outcomeRegistered.current) {
        // Use sendBeacon for reliable delivery on unmount
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://uacernprfbnascyfrkrb.supabase.co';
        const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVhY2VybnByZmJuYXNjeWZya3JiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAxODU5MDQsImV4cCI6MjA3NTc2MTkwNH0.ZpztCp8ikjD1RS61Pet-MusWIsJ-rbLPVT0G33lDUec';
        
        const payload = JSON.stringify({
          search_id: currentSearchId.current,
          outcome_status: 'abandoned',
          pharmacies_found_count: 0,
          closest_pharmacy_distance: null
        });

        navigator.sendBeacon(
          `${supabaseUrl}/rest/v1/search_outcomes`,
          new Blob([payload], { type: 'application/json' })
        );
      }
    };
  }, [clearAbandonmentTimer]);

  // Handle page unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (currentSearchId.current && !hadProductSelection.current && !outcomeRegistered.current) {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://uacernprfbnascyfrkrb.supabase.co';
        const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVhY2VybnByZmJuYXNjeWZya3JiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAxODU5MDQsImV4cCI6MjA3NTc2MTkwNH0.ZpztCp8ikjD1RS61Pet-MusWIsJ-rbLPVT0G33lDUec';
        
        const payload = JSON.stringify({
          search_id: currentSearchId.current,
          outcome_status: 'abandoned',
          pharmacies_found_count: 0,
          closest_pharmacy_distance: null
        });

        navigator.sendBeacon(
          `${supabaseUrl}/rest/v1/search_outcomes`,
          new Blob([payload], { type: 'application/json' })
        );
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  return {
    currentSearchId: currentSearchId.current,
    currentProductSelectionId: currentProductSelectionId.current,
    registrarSearch,
    registrarNormalization,
    registrarProductSelection,
    registrarSearchOutcome,
    registrarImpressoes,
    completarBusca
  };
};
