import { createContext, useContext, ReactNode } from 'react';
import { useHorseMarks, HorseMark, HorseMarkData } from '../hooks/useHorseMarks';

interface HorseMarksContextType {
  marks: Record<string, HorseMarkData>;
  setMark: (horseName: string, mark: HorseMark) => void;
  setMemo: (horseName: string, memo: string) => void;
  getMark: (horseName: string) => HorseMark;
  getMemo: (horseName: string) => string;
  getMarkData: (horseName: string) => HorseMarkData;
  clearMark: (horseName: string) => void;
  clearAll: () => void;
}

const HorseMarksContext = createContext<HorseMarksContextType | null>(null);

export function HorseMarksProvider({ children }: { children: ReactNode }) {
  const horseMarks = useHorseMarks();

  return (
    <HorseMarksContext.Provider value={horseMarks}>
      {children}
    </HorseMarksContext.Provider>
  );
}

export function useHorseMarksContext() {
  const context = useContext(HorseMarksContext);
  if (!context) {
    throw new Error('useHorseMarksContext must be used within HorseMarksProvider');
  }
  return context;
}
