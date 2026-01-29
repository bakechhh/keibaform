import { useState, useEffect, useCallback } from 'react';

// フィルター条件の型
export interface FilterCondition {
  // AI予測
  minWinRate?: number;
  maxWinRate?: number;
  minPlaceRate?: number;
  minShowRate?: number;

  // 指数
  minFinalScore?: number;
  minMiningIndex?: number;
  minPowerScore?: number;

  // 順位
  maxWinRateRank?: number;
  maxFinalRank?: number;
  maxPowerRank?: number;

  // オッズ
  minOdds?: number;
  maxOdds?: number;

  // 人気
  minPopularity?: number;
  maxPopularity?: number;

  // 期待値
  minExpectedValue?: number;

  // ステータス
  statuses?: string[];

  // 効率ランク
  efficiencyRanks?: string[];
}

export interface FilterTemplate {
  id: string;
  name: string;
  description: string;
  conditions: FilterCondition;
  createdAt: string;
  updatedAt: string;
}

const STORAGE_KEY = 'umaai-filter-templates';

// デフォルトテンプレート
const DEFAULT_TEMPLATES: FilterTemplate[] = [
  {
    id: 'value-bet',
    name: 'バリューベット',
    description: '期待値1.0以上の馬',
    conditions: {
      minExpectedValue: 1.0,
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'top-ai',
    name: 'AI上位',
    description: 'AI単勝予測TOP3',
    conditions: {
      maxWinRateRank: 3,
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '穴馬候補',
    name: '穴馬候補',
    description: '6番人気以下でAI複勝率20%以上',
    conditions: {
      minPopularity: 6,
      minShowRate: 0.2,
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'axis-candidate',
    name: '軸馬候補',
    description: '最終スコア上位かつ人気5番以内',
    conditions: {
      maxFinalRank: 3,
      maxPopularity: 5,
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'high-power',
    name: '高総合力',
    description: '総合力TOP5',
    conditions: {
      maxPowerRank: 5,
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

function loadTemplatesFromStorage(): FilterTemplate[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // デフォルトテンプレートとマージ
      const customTemplates = parsed.filter((t: FilterTemplate) =>
        !DEFAULT_TEMPLATES.find(d => d.id === t.id)
      );
      return [...DEFAULT_TEMPLATES, ...customTemplates];
    }
  } catch (e) {
    console.error('Failed to load filter templates:', e);
  }
  return DEFAULT_TEMPLATES;
}

function saveTemplatesToStorage(templates: FilterTemplate[]): void {
  try {
    // デフォルト以外のテンプレートのみ保存
    const customTemplates = templates.filter(t =>
      !DEFAULT_TEMPLATES.find(d => d.id === t.id)
    );
    localStorage.setItem(STORAGE_KEY, JSON.stringify(customTemplates));
  } catch (e) {
    console.error('Failed to save filter templates:', e);
  }
}

export function useFilterTemplates() {
  const [templates, setTemplates] = useState<FilterTemplate[]>([]);
  const [activeTemplateId, setActiveTemplateId] = useState<string | null>(null);

  // 初期読み込み
  useEffect(() => {
    const loaded = loadTemplatesFromStorage();
    setTemplates(loaded);
  }, []);

  // テンプレート追加
  const addTemplate = useCallback((name: string, description: string, conditions: FilterCondition) => {
    const newTemplate: FilterTemplate = {
      id: `custom-${Date.now()}`,
      name,
      description,
      conditions,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setTemplates(prev => {
      const updated = [...prev, newTemplate];
      saveTemplatesToStorage(updated);
      return updated;
    });

    return newTemplate.id;
  }, []);

  // テンプレート更新
  const updateTemplate = useCallback((id: string, updates: Partial<FilterTemplate>) => {
    setTemplates(prev => {
      const updated = prev.map(t =>
        t.id === id
          ? { ...t, ...updates, updatedAt: new Date().toISOString() }
          : t
      );
      saveTemplatesToStorage(updated);
      return updated;
    });
  }, []);

  // テンプレート削除
  const deleteTemplate = useCallback((id: string) => {
    // デフォルトテンプレートは削除不可
    if (DEFAULT_TEMPLATES.find(t => t.id === id)) {
      return false;
    }

    setTemplates(prev => {
      const updated = prev.filter(t => t.id !== id);
      saveTemplatesToStorage(updated);
      return updated;
    });

    if (activeTemplateId === id) {
      setActiveTemplateId(null);
    }

    return true;
  }, [activeTemplateId]);

  // テンプレートを適用
  const applyTemplate = useCallback((id: string) => {
    setActiveTemplateId(id);
  }, []);

  // テンプレートをクリア
  const clearTemplate = useCallback(() => {
    setActiveTemplateId(null);
  }, []);

  // アクティブなテンプレートを取得
  const getActiveTemplate = useCallback((): FilterTemplate | null => {
    if (!activeTemplateId) return null;
    return templates.find(t => t.id === activeTemplateId) || null;
  }, [activeTemplateId, templates]);

  // テンプレートがデフォルトかどうか
  const isDefaultTemplate = useCallback((id: string): boolean => {
    return !!DEFAULT_TEMPLATES.find(t => t.id === id);
  }, []);

  return {
    templates,
    activeTemplateId,
    addTemplate,
    updateTemplate,
    deleteTemplate,
    applyTemplate,
    clearTemplate,
    getActiveTemplate,
    isDefaultTemplate,
  };
}

// フィルター適用関数
export function applyFilterConditions<T extends {
  predictions: { win_rate: number; place_rate: number; show_rate: number; win_rate_rank: number };
  indices: { final_score: number; mining_index: number };
  powerScore: number;
  powerRank: number;
  finalRank: number;
  tanshoOdds: number;
  popularity: number;
  analysis: { status: string };
  efficiency: { rank: string };
}>(
  items: T[],
  conditions: FilterCondition
): T[] {
  return items.filter(item => {
    // AI予測
    if (conditions.minWinRate !== undefined && item.predictions.win_rate < conditions.minWinRate) return false;
    if (conditions.maxWinRate !== undefined && item.predictions.win_rate > conditions.maxWinRate) return false;
    if (conditions.minPlaceRate !== undefined && item.predictions.place_rate < conditions.minPlaceRate) return false;
    if (conditions.minShowRate !== undefined && item.predictions.show_rate < conditions.minShowRate) return false;

    // 指数
    if (conditions.minFinalScore !== undefined && item.indices.final_score < conditions.minFinalScore) return false;
    if (conditions.minMiningIndex !== undefined && item.indices.mining_index < conditions.minMiningIndex) return false;
    if (conditions.minPowerScore !== undefined && item.powerScore < conditions.minPowerScore) return false;

    // 順位
    if (conditions.maxWinRateRank !== undefined && item.predictions.win_rate_rank > conditions.maxWinRateRank) return false;
    if (conditions.maxFinalRank !== undefined && item.finalRank > conditions.maxFinalRank) return false;
    if (conditions.maxPowerRank !== undefined && item.powerRank > conditions.maxPowerRank) return false;

    // オッズ
    if (conditions.minOdds !== undefined && item.tanshoOdds < conditions.minOdds) return false;
    if (conditions.maxOdds !== undefined && item.tanshoOdds > conditions.maxOdds) return false;

    // 人気
    if (conditions.minPopularity !== undefined && item.popularity < conditions.minPopularity) return false;
    if (conditions.maxPopularity !== undefined && item.popularity > conditions.maxPopularity) return false;

    // 期待値
    if (conditions.minExpectedValue !== undefined) {
      const ev = item.predictions.win_rate * item.tanshoOdds;
      if (ev < conditions.minExpectedValue) return false;
    }

    // ステータス
    if (conditions.statuses && conditions.statuses.length > 0) {
      if (!conditions.statuses.includes(item.analysis.status)) return false;
    }

    // 効率ランク
    if (conditions.efficiencyRanks && conditions.efficiencyRanks.length > 0) {
      if (!conditions.efficiencyRanks.includes(item.efficiency.rank)) return false;
    }

    return true;
  });
}
