import { useState, useCallback } from "react";

// Configurazione base opzionale
interface BatchConfig {
  chunkSize?: number;
  delayMs?: number;
}

// I parametri che passerai ogni volta che avvii il processo
interface StartBatchArgs {
  getTotalItems: () => Promise<number>;
  processChunk: (skip: number, take: number) => Promise<void>;
  onSuccess?: () => void;
  onError?: (error: any) => void;
}

export function useBatchProcessor({
  chunkSize = 10,
  delayMs = 1200,
}: BatchConfig = {}) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [error, setError] = useState<string | null>(null);

  const startBatch = useCallback(
    async ({
      getTotalItems,
      processChunk,
      onSuccess,
      onError,
    }: StartBatchArgs) => {
      setIsProcessing(true);
      setError(null);
      setProgress({ current: 0, total: 0 });

      try {
        // 1. Chiediamo al server quanti elementi totali ci sono
        const total = await getTotalItems();
        setProgress({ current: 0, total });

        if (total === 0) {
          onSuccess?.();
          setIsProcessing(false);
          return;
        }

        // 2. Iniziamo il ciclo a blocchi
        let processed = 0;
        for (let skip = 0; skip < total; skip += chunkSize) {
          // Eseguiamo l'azione specifica per questo chunk
          await processChunk(skip, chunkSize);

          // Aggiorniamo lo stato per la barra di progresso
          processed = Math.min(skip + chunkSize, total);
          setProgress({ current: processed, total });

          // 3. Pausa strategica, solo se non siamo all'ultimo giro
          if (processed < total && delayMs > 0) {
            await new Promise((resolve) => setTimeout(resolve, delayMs));
          }
        }

        // Finito con successo!
        onSuccess?.();
      } catch (err: any) {
        setError(err.message || "Errore imprevisto durante il batching");
        onError?.(err);
      } finally {
        setIsProcessing(false);
      }
    },
    [chunkSize, delayMs],
  );

  // Calcolo di utilità per il frontend (es. per una progress bar)
  const percentage =
    progress.total > 0
      ? Math.round((progress.current / progress.total) * 100)
      : 0;

  return {
    startBatch,
    isProcessing,
    progress,
    percentage,
    error,
  };
}
