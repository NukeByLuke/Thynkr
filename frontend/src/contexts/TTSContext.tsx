import {
  createContext,
  useContext,
  useState,
  useRef,
  useCallback,
  useEffect,
  ReactNode,
} from 'react';
import api from '../lib/api';

// TTS voice options
export const TTS_VOICES = [
  { id: 'alloy', name: 'Alloy', description: 'Neutral, balanced voice' },
  { id: 'echo', name: 'Echo', description: 'Warm, conversational voice' },
  { id: 'fable', name: 'Fable', description: 'Expressive, narrative voice' },
  { id: 'onyx', name: 'Onyx', description: 'Deep, authoritative voice' },
  { id: 'nova', name: 'Nova', description: 'Friendly, energetic voice' },
  { id: 'shimmer', name: 'Shimmer', description: 'Clear, pleasant voice' },
] as const;

export type TTSVoice = (typeof TTS_VOICES)[number]['id'];

// Speed options
export const TTS_SPEEDS = [
  { value: 0.75, label: '0.75×' },
  { value: 1.0, label: '1×' },
  { value: 1.25, label: '1.25×' },
  { value: 1.5, label: '1.5×' },
] as const;

interface TTSTrack {
  id: string;
  title: string;
  text: string;
  studyPackId?: string;
  pageNumber?: number;
}

interface TTSContextType {
  // Playback state
  isPlaying: boolean;
  isLoading: boolean;
  currentTrack: TTSTrack | null;
  currentTime: number;
  duration: number;

  // Queue
  queue: TTSTrack[];

  // User preferences
  voice: TTSVoice;
  speed: number;

  // Controls
  play: (track: TTSTrack) => Promise<void>;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  seekTo: (time: number) => void;
  seekRelative: (seconds: number) => void;

  // Queue management
  addToQueue: (tracks: TTSTrack[]) => void;
  clearQueue: () => void;
  playNext: () => void;

  // Preferences
  setVoice: (voice: TTSVoice) => void;
  setSpeed: (speed: number) => void;

  // Mini player visibility
  isMinimized: boolean;
  setIsMinimized: (minimized: boolean) => void;
}

const TTSContext = createContext<TTSContextType | null>(null);

export function useTTS() {
  const context = useContext(TTSContext);
  if (!context) {
    throw new Error('useTTS must be used within a TTSProvider');
  }
  return context;
}

interface TTSProviderProps {
  children: ReactNode;
}

export function TTSProvider({ children }: TTSProviderProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentTrack, setCurrentTrack] = useState<TTSTrack | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [queue, setQueue] = useState<TTSTrack[]>([]);
  const [isMinimized, setIsMinimized] = useState(false);

  // Load preferences from localStorage
  const [voice, setVoiceState] = useState<TTSVoice>(() => {
    const saved = localStorage.getItem('tts-voice');
    return (saved as TTSVoice) || 'alloy';
  });

  const [speed, setSpeedState] = useState(() => {
    const saved = localStorage.getItem('tts-speed');
    return saved ? parseFloat(saved) : 1.0;
  });

  // Initialize audio element
  useEffect(() => {
    const audio = new Audio();
    audio.preload = 'auto';
    audioRef.current = audio;

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleDurationChange = () => {
      setDuration(audio.duration);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      // Play next in queue if available
      if (queue.length > 0) {
        const [nextTrack, ...rest] = queue;
        setQueue(rest);
        playTrack(nextTrack);
      }
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('durationchange', handleDurationChange);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('durationchange', handleDurationChange);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.pause();
      audio.src = '';
    };
  }, []);

  // Update playback rate when speed changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = speed;
    }
  }, [speed]);

  // Sync preferences to backend and localStorage
  const setVoice = useCallback((newVoice: TTSVoice) => {
    setVoiceState(newVoice);
    localStorage.setItem('tts-voice', newVoice);
    api.patch('/tts/preferences', { voice: newVoice }).catch(() => {});
  }, []);

  const setSpeed = useCallback((newSpeed: number) => {
    setSpeedState(newSpeed);
    localStorage.setItem('tts-speed', newSpeed.toString());
    if (audioRef.current) {
      audioRef.current.playbackRate = newSpeed;
    }
    api.patch('/tts/preferences', { speed: newSpeed }).catch(() => {});
  }, []);

  // Fetch audio from backend
  const fetchAudio = useCallback(
    async (track: TTSTrack): Promise<Blob> => {
      let response;

      if (track.studyPackId !== undefined && track.pageNumber !== undefined) {
        // Use study pack page endpoint for better caching
        response = await api.post(
          `/tts/study-pack/${track.studyPackId}/page/${track.pageNumber}`,
          { voice, speed },
          { responseType: 'blob' }
        );
      } else {
        // Use generic TTS endpoint
        response = await api.post(
          '/tts',
          { text: track.text, voice, speed },
          { responseType: 'blob' }
        );
      }

      return response.data;
    },
    [voice, speed]
  );

  // Play a track
  const playTrack = useCallback(
    async (track: TTSTrack) => {
      if (!audioRef.current) return;

      setIsLoading(true);
      setCurrentTrack(track);

      try {
        const blob = await fetchAudio(track);
        const url = URL.createObjectURL(blob);

        // Cleanup old URL
        if (audioRef.current.src.startsWith('blob:')) {
          URL.revokeObjectURL(audioRef.current.src);
        }

        audioRef.current.src = url;
        audioRef.current.playbackRate = speed;
        await audioRef.current.play();
        setIsPlaying(true);
      } catch (error) {
        console.error('Failed to play TTS:', error);
        setCurrentTrack(null);
      } finally {
        setIsLoading(false);
      }
    },
    [fetchAudio, speed]
  );

  const play = useCallback(
    async (track: TTSTrack) => {
      await playTrack(track);
    },
    [playTrack]
  );

  const pause = useCallback(() => {
    audioRef.current?.pause();
  }, []);

  const resume = useCallback(() => {
    audioRef.current?.play();
  }, []);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      if (audioRef.current.src.startsWith('blob:')) {
        URL.revokeObjectURL(audioRef.current.src);
      }
      audioRef.current.src = '';
    }
    setCurrentTrack(null);
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
  }, []);

  const seekTo = useCallback(
    (time: number) => {
      if (audioRef.current) {
        audioRef.current.currentTime = Math.max(0, Math.min(time, duration));
      }
    },
    [duration]
  );

  const seekRelative = useCallback(
    (seconds: number) => {
      if (audioRef.current) {
        const newTime = Math.max(0, Math.min(audioRef.current.currentTime + seconds, duration));
        audioRef.current.currentTime = newTime;
      }
    },
    [duration]
  );

  const addToQueue = useCallback((tracks: TTSTrack[]) => {
    setQueue((prev) => [...prev, ...tracks]);
  }, []);

  const clearQueue = useCallback(() => {
    setQueue([]);
  }, []);

  const playNext = useCallback(() => {
    if (queue.length > 0) {
      const [nextTrack, ...rest] = queue;
      setQueue(rest);
      playTrack(nextTrack);
    }
  }, [queue, playTrack]);

  const value: TTSContextType = {
    isPlaying,
    isLoading,
    currentTrack,
    currentTime,
    duration,
    queue,
    voice,
    speed,
    play,
    pause,
    resume,
    stop,
    seekTo,
    seekRelative,
    addToQueue,
    clearQueue,
    playNext,
    setVoice,
    setSpeed,
    isMinimized,
    setIsMinimized,
  };

  return <TTSContext.Provider value={value}>{children}</TTSContext.Provider>;
}
