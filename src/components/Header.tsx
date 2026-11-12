import React from 'react';
import { Settings, Sparkles, BookOpen } from 'lucide-react';

export type MainTab = 'agenda' | 'library' | 'assessment';

interface Props {
  activeTab: MainTab;
  onSelectTab: (tab: MainTab) => void;
  onOpenCreatePlan: () => void;
  onOpenSettings: () => void;
}

export const Header: React.FC<Props> = ({
  activeTab,
  onSelectTab,
  onOpenCreatePlan,
  onOpenSettings
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/90 dark:bg-stone-900/90 backdrop-blur-md border-b border-stone-200 dark:border-stone-800 w-full">
      <div className="w-full px-4 sm:px-8 lg:px-12 flex items-center justify-between gap-8 h-16">
        {/* Zone 1: Brand Wordmark (Single text element wordmark) */}
        <div className="flex items-center gap-2.5 whitespace-nowrap shrink-0 cursor-pointer" onClick={() => onSelectTab('agenda')}>
          <div className="w-8 h-8 rounded-lg bg-emerald-700 text-white flex items-center justify-center font-bold text-base shadow-sm">
            ت
          </div>
          <span className="text-xl font-bold font-amiri tracking-tight text-emerald-950 dark:text-emerald-100 whitespace-nowrap shrink-0">
            تِبْيَان
          </span>
        </div>

        {/* Zone 2: 3-4 Concise Navigation Links */}
        <nav className="flex items-center gap-6 text-xs sm:text-sm font-medium text-stone-600 dark:text-stone-300">
          <button
            onClick={() => onSelectTab('agenda')}
            className={`transition-colors whitespace-nowrap shrink-0 py-1 border-b-2 ${
              activeTab === 'agenda'
                ? 'text-emerald-700 dark:text-emerald-400 border-emerald-600 font-bold'
                : 'border-transparent hover:text-stone-900 dark:hover:text-white'
            }`}
          >
            الورد والجدول اليومي
          </button>

          <button
            onClick={() => onSelectTab('library')}
            className={`transition-colors whitespace-nowrap shrink-0 py-1 border-b-2 ${
              activeTab === 'library'
                ? 'text-emerald-700 dark:text-emerald-400 border-emerald-600 font-bold'
                : 'border-transparent hover:text-stone-900 dark:hover:text-white'
            }`}
          >
            بنك المتون العلمية
          </button>

          <button
            onClick={() => onSelectTab('assessment')}
            className={`transition-colors whitespace-nowrap shrink-0 py-1 border-b-2 ${
              activeTab === 'assessment'
                ? 'text-emerald-700 dark:text-emerald-400 border-emerald-600 font-bold'
                : 'border-transparent hover:text-stone-900 dark:hover:text-white'
            }`}
          >
            التقييم والاختبارات
          </button>
        </nav>

        {/* Zone 3: 1 Primary Action + Settings */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onOpenSettings}
            className="p-2 text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
            title="الإعدادات والتنبيهات"
          >
            <Settings className="w-4 h-4" />
          </button>

          <button
            onClick={onOpenCreatePlan}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-700 rounded-xl hover:bg-emerald-800 shadow-sm transition-all whitespace-nowrap shrink-0"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>خطة جديدة</span>
          </button>
        </div>
      </div>
    </header>
  );
};
