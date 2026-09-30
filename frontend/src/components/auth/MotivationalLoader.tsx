import { useState, useEffect, useRef, useCallback } from 'react';
import { fetchRandomQuote, type QuoteResponse } from '@/services/api';
import { useSettings } from '@/context/SettingsContext';
import { Quote, X, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MotivationalLoaderProps {
  onComplete: () => void;
  mode?: 'login' | 'meditate';
}

/**
 * @brief Renders a fullscreen loader that types out a random motivational quote word by word, optionally over a meditation video.
 * @param onComplete Callback invoked once the loader finishes, via timeout, Escape key or click in meditate mode.
 * @param mode Loader variant, login or meditate; meditate enables the video and click-to-exit (defaults to login).
 * @return A fullscreen overlay with header controls, the animated quote and author, and a progress bar or exit hint.
 */
export function MotivationalLoader({
  onComplete,
  mode = 'login',
}: MotivationalLoaderProps) {
  const { settings } = useSettings();
  const [quoteData, setQuoteData] = useState<QuoteResponse | null>(null);
  const [displayedWordsCount, setDisplayedWordsCount] = useState<number>(0);
  const [showAuthor, setShowAuthor] = useState<boolean>(false);
  const [showMediter, setShowMediter] = useState<boolean>(false);
  const [isFinishing, setIsFinishing] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(!settings.meditation.sound_enabled);

  const completedRef = useRef(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const isMeditateMode = mode === 'meditate';
  const showVideo = isMeditateMode && settings.meditation.video_enabled;
  const videoUrl = settings.meditation.video_url || '/custom_vids/la_peace.mp4';

  const handleFinish = useCallback(() => {
    if (completedRef.current) return;
    completedRef.current = true;
    setIsFinishing(true);
    setTimeout(() => {
      onComplete();
    }, 350);
  }, [onComplete]);

  /**
   * @brief Finishes the loader when the container is clicked, but only in meditate mode.
   * @param e The mouse click event on the container.
   */
  const handleContainerClick = (e: React.MouseEvent) => {
    if (isMeditateMode) {
      handleFinish();
    }
  };

  useEffect(() => {
    /**
     * @brief Finishes the loader when the Escape key is pressed.
     * @param e The keyboard event received from the window.
     */
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
    /**
     * @brief Fetches a random quote and stores it, falling back to a default Churchill quote on failure.
     */
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
    }, 130);

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
      }, 550);

      let timerComplete: any = null;
      if (!isMeditateMode) {
        timerComplete = setTimeout(() => {
          handleFinish();
        }, 2600);
      }

      return () => {
        clearTimeout(timerAuthor);
        clearTimeout(timerMediter);
        if (timerComplete) clearTimeout(timerComplete);
      };
    }
  }, [displayedWordsCount, quoteData, handleFinish, isMeditateMode]);

  const words = quoteData?.quote ? quoteData.quote.trim().split(/\s+/) : [];
  const currentText = words.slice(0, displayedWordsCount).join(' ');

  return (
    <div
      onClick={handleContainerClick}
      className={`fixed inset-0 z-50 overflow-hidden flex flex-col items-center justify-between p-6 sm:p-8 transition-opacity duration-300 select-none ${
        isMeditateMode ? 'cursor-pointer' : ''
      } ${
        isFinishing ? 'opacity-0' : 'opacity-100'
      } ${
        showVideo ? 'bg-black' : 'bg-background/95 backdrop-blur-md'
      }`}
    >
      {showVideo && (
        <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
          <video
            ref={videoRef}
            src={videoUrl}
            autoPlay
            playsInline
            muted={isMuted}
            onEnded={handleFinish}
            className="w-full h-full object-cover scale-[1.02] transform transition-transform duration-1000"
          />
          <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]" />
          <div className="absolute inset-0 bg-radial from-transparent via-black/20 to-black/70" />
        </div>
      )}

      <div
        className="w-full max-w-4xl flex items-center justify-between z-20 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono uppercase tracking-widest text-white/70">
            INTER-NET • {isMeditateMode ? 'Méditation' : 'Bienvenue'}
          </span>
          {showVideo && (
            <span className="inline-flex items-center gap-1 text-[10px] font-mono text-emerald-400/90 bg-emerald-950/50 border border-emerald-500/30 px-2 py-0.5 rounded-full">
              <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Vidéo active
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {showVideo && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMuted((prev) => !prev)}
              className="text-xs text-white/70 hover:text-white gap-1.5 h-8 px-2.5 bg-black/30 hover:bg-black/50 border border-white/10 rounded-md cursor-pointer"
            >
              {isMuted ? (
                <>
                  <VolumeX className="size-3.5" />
                  <span className="text-[10px]">Muet</span>
                </>
              ) : (
                <>
                  <Volume2 className="size-3.5" />
                  <span className="text-[10px]">Son actif</span>
                </>
              )}
            </Button>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={handleFinish}
            className={`text-xs gap-1.5 h-8 px-2.5 cursor-pointer ${
              showVideo
                ? 'text-white/80 hover:text-white bg-black/30 hover:bg-black/50 border border-white/10'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <span>{isMeditateMode ? 'Quitter' : 'Passer'}</span>
            <span className="text-[10px] font-mono bg-white/10 px-1 py-0.5 rounded border border-white/20">
              Esc
            </span>
            <X className="size-3.5 ml-0.5" />
          </Button>
        </div>
      </div>

      <div className="max-w-2xl w-full text-center space-y-6 my-auto px-4 z-20 relative">
        <div
          className={`p-6 sm:p-10 rounded-2xl transition-all duration-500 ${
            showVideo
              ? 'bg-black/40 border border-white/15 backdrop-blur-md shadow-2xl'
              : ''
          }`}
        >
          <div className="inline-flex items-center justify-center size-10 rounded-full border border-white/20 bg-white/10 text-white/90 mb-3 shadow-inner">
            <Quote className="size-4" />
          </div>

          <div className="min-h-[100px] flex items-center justify-center">
            {quoteData ? (
              <h2
                className={`text-xl sm:text-3xl font-light leading-relaxed tracking-tight ${
                  showVideo ? 'text-white drop-shadow-md' : 'text-foreground/95'
                }`}
              >
                « {currentText}
                {displayedWordsCount < words.length && (
                  <span className="inline-block w-1.5 h-5 ml-1 bg-primary animate-pulse align-middle" />
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

          <div
            className={`transition-opacity duration-500 pt-2 ${
              showAuthor ? 'opacity-100' : 'opacity-0'
            }`}
          >
            {quoteData?.author && (
              <p
                className={`text-xs uppercase tracking-widest font-medium ${
                  showVideo ? 'text-white/80' : 'text-muted-foreground'
                }`}
              >
                — {quoteData.author}
              </p>
            )}
          </div>

          <div
            className={`transition-all duration-500 pt-4 ${
              showMediter ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-1'
            }`}
          >
            <span
              className={`inline-block text-[11px] font-mono px-3.5 py-1 rounded-full ${
                showVideo
                  ? 'text-white/90 bg-white/10 border border-white/20'
                  : 'text-muted-foreground bg-muted/40 border border-border/60'
              }`}
            >
              - à méditer
            </span>
          </div>
        </div>
      </div>

      <div className="w-full max-w-sm px-4 pb-2 z-20 relative text-center space-y-2">
        {isMeditateMode ? (
          <p
            className={`text-[11px] font-mono tracking-wide ${
              showVideo ? 'text-white/60' : 'text-muted-foreground'
            }`}
          >
            Cliquez n'importe où pour quitter • Reste jusqu'à la fin de la vidéo
          </p>
        ) : (
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
        )}
      </div>
    </div>
  );
}

export default MotivationalLoader;
