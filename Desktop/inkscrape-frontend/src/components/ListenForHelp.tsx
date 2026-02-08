import { useState, useRef, useEffect } from 'react';
import { HelpCircle, Volume2, VolumeX, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

interface ListenForHelpProps {
  title: string;
  explanation: string;
  className?: string;
}

export function ListenForHelp({ title, explanation, className }: ListenForHelpProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioUrlRef = useRef<string | null>(null);

  // Check for reduced motion preference
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);
    
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  // Load voices on mount (some browsers need this)
  useEffect(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.getVoices();
    }
  }, []);

  // Cleanup audio on unmount or dialog close
  useEffect(() => {
    return () => {
      stopAudio();
      if (audioUrlRef.current) {
        URL.revokeObjectURL(audioUrlRef.current);
      }
    };
  }, []);

  const stopAudio = () => {
    // Stop Web Speech API
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    // Also stop any HTML audio element if present
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsPlaying(false);
  };

  const handleClose = () => {
    stopAudio();
    setIsOpen(false);
    setError(null);
  };

  // Use browser's built-in Web Speech API for reliable TTS
  const playAudio = async () => {
    if (isPlaying) {
      stopAudio();
      return;
    }

    setError(null);

    // Check if Web Speech API is available
    if (!('speechSynthesis' in window)) {
      setError('Text-to-speech is not supported in this browser.');
      return;
    }

    setIsLoading(true);

    try {
      // Cancel any ongoing speech
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(explanation);
      utterance.rate = 0.9; // Slightly slower for clarity
      utterance.pitch = 1;
      
      // Try to find a good English voice
      const voices = window.speechSynthesis.getVoices();
      const englishVoice = voices.find(
        (voice) => voice.lang.startsWith('en') && voice.name.includes('Female')
      ) || voices.find(
        (voice) => voice.lang.startsWith('en')
      );
      
      if (englishVoice) {
        utterance.voice = englishVoice;
      }

      utterance.onstart = () => {
        setIsPlaying(true);
        setIsLoading(false);
      };

      utterance.onend = () => {
        setIsPlaying(false);
      };

      utterance.onerror = (event) => {
        console.error('Speech synthesis error:', event);
        setError('Failed to play audio. Please try again.');
        setIsPlaying(false);
        setIsLoading(false);
      };

      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.error('TTS error:', err);
      setError('Audio unavailable. Please read the text above.');
      setIsLoading(false);
    }
  };

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        className={cn(
          'gap-1.5 text-xs text-muted-foreground hover:text-foreground',
          'focus-visible:ring-2 focus-visible:ring-ring',
          className
        )}
        onClick={() => setIsOpen(true)}
        aria-label={`Listen for help about ${title}`}
      >
        <HelpCircle className="h-3.5 w-3.5" />
        <span>Listen for help</span>
      </Button>

      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-serif">
              <HelpCircle className="h-5 w-5 text-primary" />
              {title}
            </DialogTitle>
            <DialogDescription className="sr-only">
              Help information with audio option
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <p className="text-sm text-muted-foreground leading-relaxed">
              {explanation}
            </p>

            {error && (
              <p className="text-xs text-muted-foreground italic" role="alert">
                {error}
              </p>
            )}

            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={playAudio}
                disabled={isLoading || prefersReducedMotion}
                className="gap-2"
                aria-label={isPlaying ? 'Stop audio' : 'Play audio'}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading...
                  </>
                ) : isPlaying ? (
                  <>
                    <VolumeX className="h-4 w-4" />
                    Stop audio
                  </>
                ) : (
                  <>
                    <Volume2 className="h-4 w-4" />
                    Play audio
                  </>
                )}
              </Button>

              {prefersReducedMotion && (
                <span className="text-xs text-muted-foreground">
                  Audio disabled (reduced motion)
                </span>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
