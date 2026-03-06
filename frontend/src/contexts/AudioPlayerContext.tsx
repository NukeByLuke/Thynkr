import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react';
import AudioPlayer from '@/components/audio/AudioPlayer';

interface OpenAudioPlayerOptions {
  text: string;
  title?: string;
  autoPlay?: boolean;
}

interface AudioPlayerRequest {
  id: number;
  text: string;
  title: string;
  autoPlay: boolean;
}

interface AudioPlayerContextValue {
  openAudioPlayer: (options: OpenAudioPlayerOptions) => void;
  closeAudioPlayer: () => void;
}

const AudioPlayerContext = createContext<AudioPlayerContextValue | undefined>(undefined);

export function AudioPlayerProvider({ children }: { children: ReactNode }) {
  const requestIdRef = useRef(0);
  const [request, setRequest] = useState<AudioPlayerRequest | null>(null);

  const closeAudioPlayer = useCallback(() => {
    setRequest(null);
  }, []);

  const openAudioPlayer = useCallback((options: OpenAudioPlayerOptions) => {
    const cleanText = options.text?.trim();
    if (!cleanText) {
      return;
    }

    requestIdRef.current += 1;

    setRequest({
      id: requestIdRef.current,
      text: cleanText,
      title: options.title?.trim() || 'Study Audio',
      autoPlay: options.autoPlay ?? true,
    });
  }, []);

  const value = useMemo(
    () => ({
      openAudioPlayer,
      closeAudioPlayer,
    }),
    [closeAudioPlayer, openAudioPlayer]
  );

  return (
    <AudioPlayerContext.Provider value={value}>
      {children}
      {request && (
        <AudioPlayer
          text={request.text}
          title={request.title}
          autoPlay={request.autoPlay}
          autoPlayKey={request.id}
          docked
          onClose={closeAudioPlayer}
        />
      )}
    </AudioPlayerContext.Provider>
  );
}

export function useAudioPlayer() {
  const context = useContext(AudioPlayerContext);
  if (!context) {
    throw new Error('useAudioPlayer must be used within an AudioPlayerProvider');
  }
  return context;
}
