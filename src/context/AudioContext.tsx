import React, { createContext, useContext, useState, useEffect, useRef } from 'react';

export const AMBIENCE_TRACKS = {
  TRACK_1: "/sounds/ambiance1.mp3",
  TRACK_2: "/sounds/ambiance2.mp3",
  TRACK_3: "/sounds/ambiance3.mp3"
};

interface AudioContextType {
  isAmbiencePlaying: boolean;
  currentTrack: string;
  toggleAmbience: () => void;
  changeTrack: (url: string) => void;
  playSFX: (url: string) => void;
}

const AudioContext = createContext<AudioContextType | undefined>(undefined);

export const AudioProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentTrack, setCurrentTrack] = useState(AMBIENCE_TRACKS.TRACK_1);
  const [isAmbiencePlaying, setIsAmbiencePlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = new Audio();
    audio.loop = true;
    audio.volume = 0.3;
    audioRef.current = audio;

    return () => {
      audio.pause();
      audio.src = "";
      audioRef.current = null;
    };
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const playAudio = async () => {
      try {
        audio.pause();
        audio.src = `${currentTrack}?v=${Date.now()}`;
        audio.load();
        
        if (isAmbiencePlaying) {
          await audio.play();
        }
      } catch (error) {
        console.error(error);
      }
    };

    playAudio();
  }, [currentTrack]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isAmbiencePlaying) {
      audio.play().catch(() => {});
    } else {
      audio.pause();
    }
  }, [isAmbiencePlaying]);

  useEffect(() => {
    const unlock = () => {
      const audio = audioRef.current;
      if (!audio || !isAmbiencePlaying || !audio.paused) return;
      audio.play().catch(() => {});
    };

    window.addEventListener('click', unlock);
    return () => window.removeEventListener('click', unlock);
  }, [isAmbiencePlaying]);

  const toggleAmbience = () => {
    setIsAmbiencePlaying(prev => !prev);
  };

  const changeTrack = (url: string) => {
    if (currentTrack === url) return;
    setCurrentTrack(url);
    setIsAmbiencePlaying(true);
  };

  const playSFX = (url: string) => {
    const sfx = new Audio(`${url}?v=${Date.now()}`);
    sfx.volume = 0.4;
    sfx.play().catch(() => {});
  };

  return (
    <AudioContext.Provider
      value={{ isAmbiencePlaying, currentTrack, toggleAmbience, changeTrack, playSFX }}
    >
      {children}
    </AudioContext.Provider>
  );
};

export const useGlobalAudio = () => {
  const context = useContext(AudioContext);
  if (!context) throw new Error("useGlobalAudio must be used within AudioProvider");
  return context;
};