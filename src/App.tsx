/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Plan } from './types';
import { 
  loadPlans, savePlans, loadActivePlanId, saveActivePlanId, 
  loadSettings, saveSettings, UserSettings 
} from './utils/storage';
import { Sidebar, MainTab } from './components/Sidebar';
import { DailyAgenda } from './components/DailyAgenda';
import { QuickRevisionView } from './components/QuickRevisionView';
import { MatnLibraryView } from './components/MatnLibraryView';
import { AssessmentHub } from './components/AssessmentHub';
import { PlanCreatorModal } from './components/PlanCreatorModal';
import { SettingsModal } from './components/SettingsModal';
import { playChimeSound } from './utils/notifications';
import { Bell, Menu, Sparkles, Plus, Shuffle } from 'lucide-react';

export default function App() {
  const [plans, setPlans] = useState<Plan[]>(() => loadPlans());
  const [activePlanId, setActivePlanId] = useState<string>(() => loadActivePlanId(plans));
  const [settings, setSettings] = useState<UserSettings>(() => loadSettings());
  const [activeTab, setActiveTab] = useState<MainTab>('agenda');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [initialMatnForCreation, setInitialMatnForCreation] = useState<string | null>(null);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState<boolean>(false);

  // Theme
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  // Sync dark mode class
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Persist plans & active plan
  const handleSelectPlan = (id: string) => {
    setActivePlanId(id);
    saveActivePlanId(id);
  };

  const handleUpdatePlans = (newPlans: Plan[]) => {
    setPlans(newPlans);
    savePlans(newPlans);
    if (!newPlans.some(p => p.id === activePlanId) && newPlans.length > 0) {
      handleSelectPlan(newPlans[0].id);
    }
  };

  const handleUpdateActivePlan = (updatedPlan: Plan) => {
    const updated = plans.map(p => p.id === updatedPlan.id ? updatedPlan : p);
    handleUpdatePlans(updated);
  };

  const handlePlanCreated = (newPlan: Plan) => {
    const updated = [newPlan, ...plans];
    handleUpdatePlans(updated);
    handleSelectPlan(newPlan.id);
    setActiveTab('agenda');
    playChimeSound('complete');
  };

  const handleUpdateSettings = (newSettings: UserSettings) => {
    setSettings(newSettings);
    saveSettings(newSettings);
  };

  const activePlan = useMemo(() => {
    return plans.find(p => p.id === activePlanId) || (plans.length > 0 ? plans[0] : null);
  }, [plans, activePlanId]);

  // Daily reminder check
  const todayStr = new Date().toISOString().split('T')[0];
  const todayTask = useMemo(() => {
    if (!activePlan) return null;
    return activePlan.tasks.find(t => t.date === todayStr);
  }, [activePlan, todayStr]);

  const isTodayTaskPending = todayTask && todayTask.status === 'pending' && !todayTask.isRestDay;

  return (
    <div className="min-h-screen w-full bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-stone-100 flex flex-col md:flex-row font-sans transition-colors selection:bg-emerald-600 selection:text-white overflow-x-hidden" dir="rtl">
      {/* Sidebar (Desktop Persistent on RTL right, Mobile Slide-over) */}
      <Sidebar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        plans={plans}
        activePlan={activePlan}
        onSelectPlan={handleSelectPlan}
        onOpenCreatePlan={() => {
          setInitialMatnForCreation(null);
          setIsCreateModalOpen(true);
        }}
        onOpenSettings={() => setIsSettingsModalOpen(true)}
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode(!darkMode)}
        studentName={settings.studentName}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* Main Content Area: Expands to 100% of User Screen Width */}
      <div className="flex-1 min-w-0 w-full flex flex-col min-h-screen">
        {/* Mobile Top Header */}
        <header className="md:hidden sticky top-0 z-20 bg-white/95 dark:bg-stone-900/95 backdrop-blur-md border-b border-stone-200 dark:border-stone-800 px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setIsMobileSidebarOpen(true)}
              className="p-1.5 text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg"
              aria-label="فتح القائمة"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-emerald-700 text-white flex items-center justify-center font-bold text-xs">
                ت
              </div>
              <span className="font-bold font-amiri text-base text-stone-900 dark:text-stone-100">
                تِبْيَان
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('quick_review')}
              className="p-1.5 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-lg text-xs font-semibold flex items-center gap-1"
              title="مراجعة سريعة"
            >
              <Shuffle className="w-4 h-4" />
              <span className="hidden sm:inline">مراجعة سريعة</span>
            </button>

            <button
              onClick={() => {
                setInitialMatnForCreation(null);
                setIsCreateModalOpen(true);
              }}
              className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-white bg-emerald-700 rounded-lg hover:bg-emerald-800"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>خطة</span>
            </button>
          </div>
        </header>

        {/* Content Viewport */}
        <main className="flex-1 w-full px-4 sm:px-8 lg:px-10 py-6 sm:py-8">
          {/* Subtle Daily Follow-up Reminder Banner */}
          {isTodayTaskPending && activeTab === 'agenda' && (
            <div className="mb-6 p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 flex items-center justify-between gap-4 text-xs">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300 flex items-center justify-center shrink-0">
                  <Bell className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-bold text-amber-900 dark:text-amber-200">
                    تذكير المتابعة اليومية:
                  </span>
                  <span className="text-amber-800 dark:text-amber-300 mr-1.5">
                    ورد اليوم ({todayTask.newMemorization?.title || todayTask.revisionPortion?.title}) بانتظارك للإنجاز والتسميع.
                  </span>
                </div>
              </div>

              <span className="text-[11px] text-amber-700 dark:text-amber-400 font-semibold whitespace-nowrap">
                «قليلٌ دائم خيرٌ من كثيرٍ منقطع»
              </span>
            </div>
          )}

          {/* Active Tab View */}
          {activeTab === 'agenda' && (
            <DailyAgenda
              plans={plans}
              activePlan={activePlan}
              onSelectPlan={handleSelectPlan}
              onUpdatePlan={handleUpdateActivePlan}
              onOpenCreateModal={() => {
                setInitialMatnForCreation(null);
                setIsCreateModalOpen(true);
              }}
              onOpenQuickReview={() => setActiveTab('quick_review')}
            />
          )}

          {activeTab === 'quick_review' && (
            <QuickRevisionView
              plan={activePlan}
              onUpdatePlan={handleUpdateActivePlan}
              onOpenCreatePlan={() => {
                setInitialMatnForCreation(null);
                setIsCreateModalOpen(true);
              }}
            />
          )}

          {activeTab === 'library' && (
            <MatnLibraryView
              onSelectMatnToCreate={(matnId) => {
                setInitialMatnForCreation(matnId);
                setIsCreateModalOpen(true);
              }}
            />
          )}

          {activeTab === 'assessment' && activePlan && (
            <AssessmentHub
              plan={activePlan}
              studentName={settings.studentName}
              onUpdateStudentName={(name) => handleUpdateSettings({ ...settings, studentName: name })}
            />
          )}

          {activeTab === 'assessment' && !activePlan && (
            <div className="text-center py-16 text-stone-500 text-xs">
              يرجى إنشاء خطة أولاً لعرض تقييمات الإتقان والاختبارات.
            </div>
          )}
        </main>

        {/* Clean scholarly footer */}
        <footer className="border-t border-stone-200 dark:border-stone-800/80 py-5 text-center text-xs text-stone-500 bg-white/50 dark:bg-stone-900/50 mt-auto no-print w-full">
          <div className="w-full px-4 sm:px-8 lg:px-10 flex flex-col sm:flex-row items-center justify-between gap-2">
            <div className="font-amiri text-stone-600 dark:text-stone-400">
              «مَنْ حَفِظَ الْمُتُونَ حَازَ الْفُنُونَ، وَمَنْ تَعَاهَدَ الْقُرْآنَ كَانَ لَهُ نُورًا وَشَفِيعًا»
            </div>
            <div className="text-[11px] text-stone-400">
              تبيان · منصة خطط حفظ ومراجعة القرآن الكريم والمتون العلمية
            </div>
          </div>
        </footer>
      </div>

      {/* Plan Creator Modal */}
      <PlanCreatorModal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setInitialMatnForCreation(null);
        }}
        onPlanCreated={handlePlanCreated}
        initialMatnId={initialMatnForCreation}
      />

      {/* Settings & Backup Modal */}
      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
        plans={plans}
        onUpdatePlans={handleUpdatePlans}
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode(!darkMode)}
      />
    </div>
  );
}
