import React from 'react';
import { Plan } from '../types';
import { 
  Calendar, Shuffle, Scroll, Award, Plus, Settings, 
  Moon, Sun, ChevronDown, Check, BookOpen, X, Menu, 
  Sparkles, Layers
} from 'lucide-react';

export type MainTab = 'agenda' | 'quick_review' | 'library' | 'assessment';

interface Props {
  activeTab: MainTab;
  onSelectTab: (tab: MainTab) => void;
  plans: Plan[];
  activePlan: Plan | null;
  onSelectPlan: (id: string) => void;
  onOpenCreatePlan: () => void;
  onOpenSettings: () => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  studentName: string;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<Props> = ({
  activeTab,
  onSelectTab,
  plans,
  activePlan,
  onSelectPlan,
  onOpenCreatePlan,
  onOpenSettings,
  darkMode,
  onToggleDarkMode,
  studentName,
  isMobileOpen,
  onCloseMobile
}) => {
  const navItems = [
    {
      id: 'agenda' as MainTab,
      label: 'الورد والجدول اليومي',
      icon: Calendar,
      badge: null
    },
    {
      id: 'quick_review' as MainTab,
      label: 'جلسة مراجعة سريعة',
      icon: Shuffle,
      badge: 'جديد'
    },
    {
      id: 'library' as MainTab,
      label: 'بنك المتون العلمية',
      icon: Scroll,
      badge: null
    },
    {
      id: 'assessment' as MainTab,
      label: 'التقييم والاختبارات',
      icon: Award,
      badge: null
    }
  ];

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 p-4 select-none">
      {/* Brand Header */}
      <div className="flex items-center justify-between pb-5 border-b border-stone-200 dark:border-stone-800">
        <div 
          onClick={() => {
            onSelectTab('agenda');
            onCloseMobile();
          }}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-700 text-white flex items-center justify-center font-bold text-lg shadow-sm group-hover:bg-emerald-800 transition-colors">
            ت
          </div>
          <div>
            <h1 className="text-xl font-bold font-amiri tracking-tight text-emerald-950 dark:text-emerald-100 leading-none">
              تِبْيَان
            </h1>
            <p className="text-[11px] text-stone-500 mt-1">
              خطط القرآن والمتون العلمية
            </p>
          </div>
        </div>

        {/* Mobile close button */}
        <button
          onClick={onCloseMobile}
          className="md:hidden p-1.5 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Active Plan Selector Box */}
      {plans.length > 0 && activePlan && (
        <div className="my-4 p-3 rounded-xl bg-stone-50 dark:bg-stone-800/50 border border-stone-200 dark:border-stone-800">
          <div className="flex items-center justify-between text-[11px] text-stone-500 mb-1">
            <span>الخطة النشطة الحالية:</span>
            <span className="font-semibold text-emerald-700 dark:text-emerald-400">
              {activePlan.type === 'quran' ? 'قرآن كريم' : 'متن علمي'}
            </span>
          </div>

          <div className="relative">
            <select
              value={activePlan.id}
              onChange={(e) => onSelectPlan(e.target.value)}
              className="w-full text-xs font-bold text-stone-900 dark:text-stone-100 bg-white dark:bg-stone-900 rounded-lg border border-stone-300 dark:border-stone-700 py-1.5 pr-2.5 pl-7 focus:outline-emerald-600 cursor-pointer appearance-none truncate"
            >
              {plans.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-stone-400 absolute left-2 top-2 pointer-events-none" />
          </div>

          <div className="flex items-center justify-between text-[10px] text-stone-400 mt-2 font-mono">
            <span>{activePlan.materialName}</span>
            <span>{activePlan.tasks.length} يوماً</span>
          </div>
        </div>
      )}

      {/* Primary Action: New Plan Button */}
      <button
        onClick={() => {
          onOpenCreatePlan();
          onCloseMobile();
        }}
        className="w-full mb-5 flex items-center justify-center gap-2 py-2.5 px-4 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-xs transition-all active:scale-98"
      >
        <Plus className="w-4 h-4" />
        <span>إنشاء خطة جديدة</span>
      </button>

      {/* Navigation Links */}
      <div className="space-y-1.5 flex-1 overflow-y-auto pr-0.5">
        <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider px-3 mb-2 block">
          القائمة الرئيسية
        </span>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => {
                onSelectTab(item.id);
                onCloseMobile();
              }}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all text-right ${
                isActive
                  ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-bold border border-emerald-200 dark:border-emerald-800/80 shadow-2xs'
                  : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 hover:text-stone-900 dark:hover:text-stone-200'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-700 dark:text-emerald-400' : 'text-stone-400'}`} />
                <span>{item.label}</span>
              </div>

              {item.badge && (
                <span className="px-1.5 py-0.5 text-[10px] font-bold bg-amber-500 text-white rounded-md leading-none">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Footer Profile & Preferences */}
      <div className="pt-4 border-t border-stone-200 dark:border-stone-800 mt-auto space-y-3">
        {/* User preview */}
        <div className="flex items-center justify-between px-2 text-xs">
          <div className="truncate">
            <span className="text-[10px] text-stone-400 block">المستخدم:</span>
            <span className="font-bold text-stone-800 dark:text-stone-200 truncate block">
              {studentName || 'طالب العلم المبارك'}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={onToggleDarkMode}
              className="p-1.5 rounded-lg text-stone-500 hover:bg-stone-100 dark:hover:bg-stone-800"
              title={darkMode ? 'المظهر النهاري' : 'المظهر الليلي'}
            >
              {darkMode ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4" />}
            </button>

            <button
              type="button"
              onClick={onOpenSettings}
              className="p-1.5 rounded-lg text-stone-500 hover:bg-stone-100 dark:hover:bg-stone-800"
              title="الإعدادات والتنبيهات"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar (RTL: on the right) */}
      <aside className="hidden md:block w-64 xl:w-72 shrink-0 border-l border-stone-200 dark:border-stone-800 h-screen sticky top-0 z-30">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer (Slide-over on RTL) */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Backdrop */}
          <div 
            onClick={onCloseMobile}
            className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs transition-opacity"
          />

          {/* Drawer container */}
          <div className="fixed inset-y-0 right-0 w-72 max-w-[85vw] shadow-2xl z-50 animate-in slide-in-from-right duration-200">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
