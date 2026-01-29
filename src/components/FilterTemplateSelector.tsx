import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Filter, Plus, Trash2, Check, X } from 'lucide-react';
import { FilterTemplate, FilterCondition, useFilterTemplates } from '../hooks/useFilterTemplates';

interface FilterTemplateSelectorProps {
  onApply: (conditions: FilterCondition | null) => void;
}

export default function FilterTemplateSelector({ onApply }: FilterTemplateSelectorProps) {
  const {
    templates,
    activeTemplateId,
    applyTemplate,
    clearTemplate,
    addTemplate,
    deleteTemplate,
    isDefaultTemplate,
  } = useFilterTemplates();

  const [isOpen, setIsOpen] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [newTemplateDesc, setNewTemplateDesc] = useState('');
  const [newConditions, setNewConditions] = useState<FilterCondition>({});

  const handleApply = (template: FilterTemplate) => {
    applyTemplate(template.id);
    onApply(template.conditions);
    setIsOpen(false);
  };

  const handleClear = () => {
    clearTemplate();
    onApply(null);
    setIsOpen(false);
  };

  const handleAdd = () => {
    if (!newTemplateName.trim()) return;

    addTemplate(newTemplateName, newTemplateDesc, newConditions);
    setNewTemplateName('');
    setNewTemplateDesc('');
    setNewConditions({});
    setShowAddForm(false);
  };

  const handleDelete = (id: string) => {
    if (isDefaultTemplate(id)) return;
    deleteTemplate(id);
  };

  const activeTemplate = templates.find(t => t.id === activeTemplateId);

  return (
    <div className="relative">
      {/* トリガーボタン */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
          activeTemplateId
            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50'
            : 'border'
        }`}
        style={{
          backgroundColor: activeTemplateId ? undefined : 'var(--bg-secondary)',
          borderColor: activeTemplateId ? undefined : 'var(--border)',
          color: activeTemplateId ? undefined : 'var(--text-primary)',
        }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <Filter className="w-4 h-4" />
        {activeTemplate ? activeTemplate.name : '絞り込み'}
      </motion.button>

      {/* ドロップダウン */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* オーバーレイ */}
            <motion.div
              className="fixed inset-0 z-40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
            />

            {/* メニュー */}
            <motion.div
              className="absolute top-full left-0 mt-2 w-72 rounded-xl shadow-xl z-50 overflow-hidden"
              style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              {/* ヘッダー */}
              <div className="p-3 border-b" style={{ borderColor: 'var(--border)' }}>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                    フィルターテンプレート
                  </span>
                  {activeTemplateId && (
                    <button
                      onClick={handleClear}
                      className="text-xs px-2 py-1 rounded bg-red-500/20 text-red-400 hover:bg-red-500/30"
                    >
                      クリア
                    </button>
                  )}
                </div>
              </div>

              {/* テンプレートリスト */}
              <div className="max-h-[300px] overflow-y-auto">
                {templates.map(template => (
                  <div
                    key={template.id}
                    className={`p-3 flex items-center justify-between hover:bg-[var(--bg-secondary)] cursor-pointer transition-colors ${
                      activeTemplateId === template.id ? 'bg-emerald-500/10' : ''
                    }`}
                    onClick={() => handleApply(template)}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                          {template.name}
                        </span>
                        {activeTemplateId === template.id && (
                          <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                        )}
                      </div>
                      <p className="text-xs truncate" style={{ color: 'var(--text-secondary)' }}>
                        {template.description}
                      </p>
                    </div>
                    {!isDefaultTemplate(template.id) && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(template.id);
                        }}
                        className="p-1 rounded hover:bg-red-500/20 ml-2"
                      >
                        <Trash2 className="w-4 h-4 text-red-400" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* 新規追加 */}
              <div className="border-t" style={{ borderColor: 'var(--border)' }}>
                {!showAddForm ? (
                  <button
                    onClick={() => setShowAddForm(true)}
                    className="w-full p-3 flex items-center gap-2 text-sm hover:bg-[var(--bg-secondary)] transition-colors"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    <Plus className="w-4 h-4" />
                    新規テンプレート作成
                  </button>
                ) : (
                  <div className="p-3 space-y-3">
                    <input
                      type="text"
                      placeholder="テンプレート名"
                      value={newTemplateName}
                      onChange={(e) => setNewTemplateName(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg text-sm"
                      style={{
                        backgroundColor: 'var(--bg-secondary)',
                        color: 'var(--text-primary)',
                        border: '1px solid var(--border)',
                      }}
                    />
                    <input
                      type="text"
                      placeholder="説明"
                      value={newTemplateDesc}
                      onChange={(e) => setNewTemplateDesc(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg text-sm"
                      style={{
                        backgroundColor: 'var(--bg-secondary)',
                        color: 'var(--text-primary)',
                        border: '1px solid var(--border)',
                      }}
                    />

                    {/* 簡易条件設定 */}
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
                        <span className="w-20">最低期待値</span>
                        <input
                          type="number"
                          step="0.1"
                          placeholder="1.0"
                          value={newConditions.minExpectedValue || ''}
                          onChange={(e) => setNewConditions({
                            ...newConditions,
                            minExpectedValue: e.target.value ? parseFloat(e.target.value) : undefined,
                          })}
                          className="flex-1 px-2 py-1 rounded text-xs"
                          style={{
                            backgroundColor: 'var(--bg-secondary)',
                            color: 'var(--text-primary)',
                            border: '1px solid var(--border)',
                          }}
                        />
                      </label>
                      <label className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
                        <span className="w-20">AI単勝順位</span>
                        <input
                          type="number"
                          placeholder="3"
                          value={newConditions.maxWinRateRank || ''}
                          onChange={(e) => setNewConditions({
                            ...newConditions,
                            maxWinRateRank: e.target.value ? parseInt(e.target.value) : undefined,
                          })}
                          className="flex-1 px-2 py-1 rounded text-xs"
                          style={{
                            backgroundColor: 'var(--bg-secondary)',
                            color: 'var(--text-primary)',
                            border: '1px solid var(--border)',
                          }}
                        />
                        <span>位以内</span>
                      </label>
                      <label className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
                        <span className="w-20">人気</span>
                        <input
                          type="number"
                          placeholder="1"
                          value={newConditions.minPopularity || ''}
                          onChange={(e) => setNewConditions({
                            ...newConditions,
                            minPopularity: e.target.value ? parseInt(e.target.value) : undefined,
                          })}
                          className="w-12 px-2 py-1 rounded text-xs"
                          style={{
                            backgroundColor: 'var(--bg-secondary)',
                            color: 'var(--text-primary)',
                            border: '1px solid var(--border)',
                          }}
                        />
                        <span>〜</span>
                        <input
                          type="number"
                          placeholder="18"
                          value={newConditions.maxPopularity || ''}
                          onChange={(e) => setNewConditions({
                            ...newConditions,
                            maxPopularity: e.target.value ? parseInt(e.target.value) : undefined,
                          })}
                          className="w-12 px-2 py-1 rounded text-xs"
                          style={{
                            backgroundColor: 'var(--bg-secondary)',
                            color: 'var(--text-primary)',
                            border: '1px solid var(--border)',
                          }}
                        />
                        <span>番人気</span>
                      </label>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={handleAdd}
                        disabled={!newTemplateName.trim()}
                        className="flex-1 px-3 py-2 rounded-lg text-sm font-medium bg-emerald-500 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        保存
                      </button>
                      <button
                        onClick={() => {
                          setShowAddForm(false);
                          setNewTemplateName('');
                          setNewTemplateDesc('');
                          setNewConditions({});
                        }}
                        className="px-3 py-2 rounded-lg text-sm"
                        style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
