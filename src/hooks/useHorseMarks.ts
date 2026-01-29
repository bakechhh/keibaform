import { useState, useEffect, useCallback } from 'react';

// 馬印の種類
export const HORSE_MARKS = ['◎', '◯', '▲', '△', '☆', '✕', '消'] as const;
export type HorseMark = typeof HORSE_MARKS[number] | null;

// 馬印の色設定（ライト・ダーク両モードで見やすい色）
export const MARK_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  '◎': { bg: '#dc2626', text: '#ffffff', label: '本命' },
  '◯': { bg: '#2563eb', text: '#ffffff', label: '対抗' },
  '▲': { bg: '#16a34a', text: '#ffffff', label: '単穴' },
  '△': { bg: '#ca8a04', text: '#ffffff', label: '連下' },
  '☆': { bg: '#9333ea', text: '#ffffff', label: '注目' },
  '✕': { bg: '#6b7280', text: '#ffffff', label: '軽視' },
  '消': { bg: '#374151', text: '#d1d5db', label: '消し' },
};

// 馬データの型
export interface HorseMarkData {
  mark: HorseMark;
  memo: string;
  updatedAt: string;
}

// localStorage のキー
const STORAGE_KEY = 'umaai-horse-marks';

// デフォルト値
const defaultMarkData: HorseMarkData = {
  mark: null,
  memo: '',
  updatedAt: new Date().toISOString(),
};

// localStorage から読み込み
function loadMarksFromStorage(): Record<string, HorseMarkData> {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error('Failed to load horse marks from localStorage:', e);
  }
  return {};
}

// localStorage に保存
function saveMarksToStorage(marks: Record<string, HorseMarkData>): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(marks));
  } catch (e) {
    console.error('Failed to save horse marks to localStorage:', e);
  }
}

// 古いデータをクリーンアップ（30日以上前のデータを削除）
function cleanupOldMarks(marks: Record<string, HorseMarkData>): Record<string, HorseMarkData> {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const cleaned: Record<string, HorseMarkData> = {};
  for (const [name, data] of Object.entries(marks)) {
    const updatedAt = new Date(data.updatedAt);
    if (updatedAt > thirtyDaysAgo) {
      cleaned[name] = data;
    }
  }
  return cleaned;
}

export function useHorseMarks() {
  const [marks, setMarks] = useState<Record<string, HorseMarkData>>({});

  // 初期読み込み
  useEffect(() => {
    const loaded = loadMarksFromStorage();
    const cleaned = cleanupOldMarks(loaded);
    setMarks(cleaned);
    // クリーンアップ後のデータを保存
    if (Object.keys(loaded).length !== Object.keys(cleaned).length) {
      saveMarksToStorage(cleaned);
    }
  }, []);

  // 馬印を設定
  const setMark = useCallback((horseName: string, mark: HorseMark) => {
    setMarks(prev => {
      const newMarks = {
        ...prev,
        [horseName]: {
          ...prev[horseName] || defaultMarkData,
          mark,
          updatedAt: new Date().toISOString(),
        },
      };
      saveMarksToStorage(newMarks);
      return newMarks;
    });
  }, []);

  // メモを設定
  const setMemo = useCallback((horseName: string, memo: string) => {
    setMarks(prev => {
      const newMarks = {
        ...prev,
        [horseName]: {
          ...prev[horseName] || defaultMarkData,
          memo,
          updatedAt: new Date().toISOString(),
        },
      };
      saveMarksToStorage(newMarks);
      return newMarks;
    });
  }, []);

  // 馬印を取得
  const getMark = useCallback((horseName: string): HorseMark => {
    return marks[horseName]?.mark || null;
  }, [marks]);

  // メモを取得
  const getMemo = useCallback((horseName: string): string => {
    return marks[horseName]?.memo || '';
  }, [marks]);

  // 馬データを取得
  const getMarkData = useCallback((horseName: string): HorseMarkData => {
    return marks[horseName] || defaultMarkData;
  }, [marks]);

  // 印をクリア
  const clearMark = useCallback((horseName: string) => {
    setMarks(prev => {
      const newMarks = { ...prev };
      if (newMarks[horseName]) {
        newMarks[horseName] = {
          ...newMarks[horseName],
          mark: null,
          updatedAt: new Date().toISOString(),
        };
      }
      saveMarksToStorage(newMarks);
      return newMarks;
    });
  }, []);

  // 全データをクリア（開発用）
  const clearAll = useCallback(() => {
    setMarks({});
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return {
    marks,
    setMark,
    setMemo,
    getMark,
    getMemo,
    getMarkData,
    clearMark,
    clearAll,
  };
}
