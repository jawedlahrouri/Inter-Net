import { useState, useEffect, useRef, useCallback } from 'react';
import { fetchRandomQuote, type QuoteResponse } from '@/services/api';
import { Quote, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MotivationalLoaderProps {
  onComplete: () => void;
}

export function MotivationalLoader({ onComplete }: MotivationalLoaderProps) {
  const [quoteData, setQuoteData] = useState<QuoteResponse | null>(null);
  const [displayedWordsCount, setDisplayedWordsCount] = useState<number>(0);
  const [showAuthor, setShowAuthor] = useState<boolean>(false);
  const [showMediter, setShowMediter] = useState<boolean>(false);
  const [isFinishing, setIsFinishing] = useState<boolean>(false);

  const completedRef = useRef(false);

  const handleFinish = useCallback(() => {
    if (completedRef.current) return;
    completedRef.current = true;
    setIsFinishing(true);
    setTimeout(() => {
      onComplete();
    }, 300);
  }, [onComplete]);

  // Keyboard shortcut (Escape to skip)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleFinish();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleFinish]);

  useEffect(() => {
    let isMounted = true;
    async function loadQuote() {
      try {
        const data = await fetchRandomQuote();
        if (isMounted) {
          setQuoteData(data);
        }
      } catch {
        if (isMounted) {
          setQuoteData({
            quote: "Le succès n'est pas final, l'échec n'est pas fatal : c'est le courage de continuer qui compte.",
            author: "Winston Churchill",
          });
        }
      }
    }
    loadQuote();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!quoteData) return;

    const words = quoteData.quote.trim().split(/\s+/);
    if (words.length === 0) return;

    const wordInterval = setInterval(() => {
      setDisplayedWordsCount((prev) => {
        if (prev < words.length) {
          return prev + 1;
        } else {
          clearInterval(wordInterval);
          return prev;
        }
      });
    }, 140);

    return () => clearInterval(wordInterval);
  }, [quoteData]);

  useEffect(() => {
    if (!quoteData) return;
    const words = quoteData.quote.trim().split(/\s+/);

    if (displayedWordsCount > 0 && displayedWordsCount >= words.length) {
      const timerAuthor = setTimeout(() => {
        setShowAuthor(true);
      }, 250);

      const timerMediter = setTimeout(() => {
        setShowMediter(true);
      }, 600);

      const timerComplete = setTimeout(() => {
        handleFinish();
      }, 2600);

      return () => {
        clearTimeout(timerAuthor);
        clearTimeout(timerMediter);
        clearTimeout(timerComplete);
      };
    }
  }, [displayedWordsCount, quoteData, handleFinish]);

  const words = quoteData?.quote ? quoteData.quote.trim().split(/\s+/) : [];
  const currentText = words.slice(0, displayedWordsCount).join(' ');

  return (
    <div
      className={`fixed inset-0 z-50 bg-background/95 backdrop-blur-md flex flex-col items-center justify-between p-8 transition-opacity duration-300 ${
        isFinishing ? 'opacity-0' : 'opacity-100'
      }`}
    >
      {/* Top action bar */}
      <div className="w-full max-w-4xl flex items-center justify-between">
        <span className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground/60 select-none">
          INTER-NET • Pause
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleFinish}
          className="text-xs text-muted-foreground hover:text-foreground gap-1.5 h-8 px-2.5 cursor-pointer"
        >
          <span>Passer</span>
          <span className="text-[10px] font-mono bg-muted/60 px-1 py-0.5 rounded border border-border/50">
            Esc
          </span>
          <X className="size-3.5 ml-0.5" />
        </Button>
      </div>

      {/* Main Quote Container */}
      <div className="max-w-2xl w-full text-center space-y-6 my-auto px-4">
        <div className="inline-flex items-center justify-center size-9 rounded-md border border-border/80 bg-muted/30 text-muted-foreground mb-1">
          <Quote className="size-4" />
        </div>

        {/* Word by word quote display */}
        <div className="min-h-[100px] flex items-center justify-center">
          {quoteData ? (
            <h2 className="text-xl sm:text-2xl font-normal leading-relaxed text-foreground/95 tracking-tight">
              « {currentText}
              {displayedWordsCount < words.length && (
                <span className="inline-block w-1.5 h-5 ml-1 bg-primary/70 animate-pulse align-middle" />
              )}
              {displayedWordsCount >= words.length && ' »'}
            </h2>
          ) : (
            <div className="flex items-center gap-2 text-muted-foreground text-xs font-mono">
              <div className="size-3.5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <span>Chargement de votre pensée du jour...</span>
            </div>
          )}
        </div>

        {/* Author */}
        <div
          className={`transition-opacity duration-500 ${
            showAuthor ? 'opacity-100' : 'opacity-0'
          }`}
        >
          {quoteData?.author && (
            <p className="text-xs uppercase tracking-widest text-muted-foreground font-medium">
              — {quoteData.author}
            </p>
          )}
        </div>

        {/* - à méditer */}
        <div
          className={`transition-all duration-500 pt-1 ${
            showMediter ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-1'
          }`}
        >
          <span className="inline-block text-[11px] font-mono text-muted-foreground bg-muted/40 border border-border/60 px-3 py-1 rounded-md">
            - à méditer
          </span>
        </div>
      </div>

      {/* Discreet linear progress bar at the bottom */}
      <div className="w-full max-w-xs px-4 pb-2">
        <div className="h-[2px] w-full bg-muted/50 rounded-full overflow-hidden">
          <div
            className="h-full bg-foreground/70 transition-all duration-200"
            style={{
              width:
                words.length > 0
                  ? `${(displayedWordsCount / words.length) * 100}%`
                  : '10%',
            }}
          />
        </div>
      </div>
    </div>
  );
}

export default MotivationalLoader;
