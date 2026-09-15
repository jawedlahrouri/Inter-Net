import { useState, useEffect, useRef } from 'react';
import { fetchRandomQuote, type QuoteResponse } from '@/services/api';
import { Sparkles, ArrowRight, Quote } from 'lucide-react';
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

  const handleFinish = () => {
    if (completedRef.current) return;
    completedRef.current = true;
    setIsFinishing(true);
    setTimeout(() => {
      onComplete();
    }, 400);
  };

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
    }, 150);

    return () => clearInterval(wordInterval);
  }, [quoteData]);

  useEffect(() => {
    if (!quoteData) return;
    const words = quoteData.quote.trim().split(/\s+/);

    if (displayedWordsCount > 0 && displayedWordsCount >= words.length) {
      const timerAuthor = setTimeout(() => {
        setShowAuthor(true);
      }, 300);

      const timerMediter = setTimeout(() => {
        setShowMediter(true);
      }, 900);
      const timerComplete = setTimeout(() => {
        handleFinish();
      }, 2800);

      return () => {
        clearTimeout(timerAuthor);
        clearTimeout(timerMediter);
        clearTimeout(timerComplete);
      };
    }
  }, [displayedWordsCount, quoteData]);

  const words = quoteData?.quote ? quoteData.quote.trim().split(/\s+/) : [];
  const currentText = words.slice(0, displayedWordsCount).join(' ');

  return (
    <div
      className={`fixed inset-0 z-50 bg-background/95 backdrop-blur-2xl flex flex-col items-center justify-center p-6 transition-opacity duration-500 ${isFinishing ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
        }`}
    >
      {/* Glow d'ambiance */}
      <div className="absolute w-[500px] h-[500px] bg-indigo-500/15 rounded-full blur-[120px] pointer-events-none -z-10" />
      <div className="absolute w-[300px] h-[300px] bg-cyan-500/15 rounded-full blur-[90px] pointer-events-none -z-10 translate-y-32" />

      {/* Bouton passer discret */}
      <div className="absolute top-6 right-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleFinish}
          className="text-xs text-muted-foreground hover:text-foreground gap-1.5"
        >
          Passer
          <ArrowRight className="size-3.5" />
        </Button>
      </div>

      <div className="max-w-2xl w-full text-center space-y-6">
        {/* Petite icône animée */}
        <div className="inline-flex items-center justify-center size-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 mb-2 shadow-lg shadow-indigo-500/10">
          <Quote className="size-5 animate-pulse" />
        </div>

        {/* Citation mot par mot */}
        <div className="min-h-[120px] flex items-center justify-center">
          {quoteData ? (
            <h2 className="text-2xl sm:text-3xl font-medium tracking-tight leading-relaxed text-foreground/90 font-serif italic">
              « {currentText}
              {displayedWordsCount < words.length && (
                <span className="inline-block w-2 h-6 ml-1 bg-indigo-400 animate-pulse align-middle" />
              )}
              {displayedWordsCount >= words.length && ' »'}
            </h2>
          ) : (
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Sparkles className="size-4 animate-spin text-indigo-400" />
              <span>Chargement de votre pensée du jour...</span>
            </div>
          )}
        </div>

        {/* Auteur de la citation */}
        <div
          className={`transition-all duration-700 ${showAuthor ? 'opacity-80 translate-y-0' : 'opacity-0 translate-y-2'
            }`}
        >
          {quoteData?.author && (
            <p className="text-sm font-medium text-muted-foreground tracking-wide">
              — {quoteData.author}
            </p>
          )}
        </div>

        {/* Le fameux "- à méditer" en petit en dessous */}
        <div
          className={`transition-all duration-700 delay-150 pt-2 ${showMediter ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
            }`}
        >
          <span className="inline-block text-xs italic tracking-widest text-indigo-400/90 font-mono bg-indigo-500/10 border border-indigo-500/20 px-3 py-1 rounded-full shadow-sm">
            - à méditer
          </span>
        </div>
      </div>

      {/* Barre de progression discrète en bas */}
      <div className="absolute bottom-10 max-w-xs w-full px-4">
        <div className="h-1 w-full bg-secondary/50 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 to-cyan-400 transition-all duration-300"
            style={{
              width: words.length > 0 ? `${(displayedWordsCount / words.length) * 100}%` : '20%',
            }}
          />
        </div>
      </div>
    </div>
  );
}
