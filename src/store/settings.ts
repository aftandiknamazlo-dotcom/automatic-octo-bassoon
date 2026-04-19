import { useState, useEffect } from 'react';

let currentLanguage: 'ru' | 'en' = 'ru';
let currentSound: boolean = true;
const listeners = new Set<() => void>();

export const settingsStore = {
  getLanguage: () => currentLanguage,
  getSound: () => currentSound,
  setLanguage: (lang: 'ru' | 'en') => {
    currentLanguage = lang;
    listeners.forEach(l => l());
  },
  toggleSound: () => {
    currentSound = !currentSound;
    listeners.forEach(l => l());
  },
  subscribe: (l: () => void) => {
    listeners.add(l);
    return () => { listeners.delete(l); };
  }
};

export const useSettings = () => {
  const [lang, setLang] = useState(currentLanguage);
  const [sound, setSound] = useState(currentSound);

  useEffect(() => {
    return settingsStore.subscribe(() => {
      setLang(settingsStore.getLanguage());
      setSound(settingsStore.getSound());
    });
  }, []);

  return { 
    language: lang, 
    soundEnabled: sound, 
    setLanguage: settingsStore.setLanguage, 
    toggleSound: settingsStore.toggleSound 
  };
};
