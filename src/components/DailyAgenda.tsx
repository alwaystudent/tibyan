import React, { useState, useMemo } from 'react';
import { DailyTask, Plan } from '../types';
import { calculatePlanStats, rescheduleRemainingTasks } from '../utils/scheduler';
import { DailySessionModal } from './DailySessionModal';
import { 
  CheckCircle2, Clock, Calendar, AlertCircle, Play, 
  RotateCcw, Sparkles, Star, Printer, RefreshCw, 
  ChevronDown, BookOpen, Layers, Shuffle
} from 'lucide-react';

interface Props {
  plans: Plan[];
  activePlan: Plan | null;
  onSelectPlan: (planId: string) => void;
  onUpdatePlan: (updatedPlan: Plan) => void;
  onOpenCreateModal: () => void;
  onOpenQuickReview?: () => void;
}

export const DailyAgenda: React.FC<Props> = ({
  plans,
  activePlan,
  onSelectPlan,
  onUpdatePlan,
  onOpenCreateModal,
  onOpenQuickReview
}) => {
  const [selectedTaskForModal, setSelectedTaskForModal] = useState<DailyTask | null>(null);
  const [filterMode, setFilterMode] = useState<'all' | 'pending' | 'completed' | 'rest'>('all');
  const [reschedulePromptDate, setReschedulePromptDate] = useState<string>('');
  const [showRescheduleDialog, setShowRescheduleDialog] = useState<boolean>(false);

  const todayStr = new Date().toISOString().split('T')[0];

  const planStats = useMemo(() => {
    if (!activePlan) return null;
    return calculatePlanStats(activePlan);
  }, [activePlan]);

  // Find today's task in active plan
  const todayTask = useMemo(() => {
    if (!activePlan) return null;
    const match = activePlan.tasks.find(t => t.date === todayStr);
    if (match) return match;
    // fallback to first pending task
    return activePlan.tasks.find(t => t.status === 'pending') || activePlan.tasks[0];
  }, [activePlan, todayStr]);

  if (!activePlan) {
    return (
      <div className="max-w-4xl mx-auto py-16 px-4 text-center">
        <div className="w-16 h-16 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center mx-auto mb-4">
          <BookOpen className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-stone-900 dark:text-stone-100 mb-2">
          لا توجد خطط حفظ أو مراجعة حالياً
        </h2>
        <p className="text-sm text-stone-500 max-w-md mx-auto mb-6">
          ابدأ بإنشاء خطتك الأولى لحفظ القرآن الكريم أو أحد المتون العلمية مع الجدولة اليومية ونظام التقييم.
        </p>
        <button
          onClick={onOpenCreateModal}
          className="px-6 py-2.5 bg-emerald-700 text-white font-medium text-sm rounded-xl hover:bg-emerald-800 transition-colors shadow-sm"
        >
          + إنشاء خطة جديدة
        </button>
      </div>
    );
  }

  const filteredTasks = activePlan.tasks.filter(t => {
    if (filterMode === 'pending') return t.status === 'pending' || t.status === 'partial';
    if (filterMode === 'completed') return t.status === 'completed';
    if (filterMode === 'rest') return t.isRestDay;
    return true;
  });

  const handleSaveTask = (updatedTask: DailyTask) => {
    const updatedTasks = activePlan.tasks.map(t => 
      t.id === updatedTask.id ? updatedTask : t
    );
    const updatedPlan: Plan = {
      ...activePlan,
      tasks: updatedTasks,
      updatedAt: new Date().toISOString()
    };
    onUpdatePlan(updatedPlan);
  };

  const handleQuickToggleTask = (task: DailyTask) => {
    const nextStatus = task.status === 'completed' ? 'pending' : 'completed';
    const updated: DailyTask = {
      ...task,
      status: nextStatus,
      completedAt: nextStatus === 'completed' ? new Date().toISOString() : undefined,
      evaluation: nextStatus === 'completed' ? {
        grade: 'excellent',
        stars: 5,
        notes: 'تم الإنجاز'
      } : undefined
    };
    handleSaveTask(updated);
  };

  const handleApplyReschedule = () => {
    const dateToUse = reschedulePromptDate || todayStr;
    const rescheduled = rescheduleRemainingTasks(activePlan, dateToUse);
    onUpdatePlan(rescheduled);
    setShowRescheduleDialog(false);
  };

  const handlePrintSchedule = () => {
    window.print();
  };

  return (
    <div className="space-y-8">
      {/* Plan Selector & Progress Strip */}
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-stone-100 dark:border-stone-800">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-700 text-white flex items-center justify-center font-bold text-lg shadow-sm">
              {activePlan.type === 'quran' ? 'قرآن' : 'متن'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <select
                  value={activePlan.id}
                  onChange={(e) => onSelectPlan(e.target.value)}
                  className="font-bold text-lg text-stone-900 dark:text-stone-100 bg-transparent border-none p-0 focus:ring-0 cursor-pointer hover:text-emerald-700 dark:hover:text-emerald-400"
                >
                  {plans.map((p) => (
                    <option key={p.id} value={p.id} className="dark:bg-stone-900">
                      {p.title}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-stone-400 pointer-events-none" />
              </div>
              <div className="flex items-center gap-2 text-xs text-stone-500 mt-0.5">
                <span>{activePlan.materialName}</span>
                <span>·</span>
                <span>{activePlan.materialDetails}</span>
                <span>·</span>
                <span>{activePlan.totalUnits} {activePlan.unitLabel}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {onOpenQuickReview && (
              <button
                onClick={onOpenQuickReview}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-800 dark:text-emerald-300 bg-emerald-100/80 dark:bg-emerald-950/60 hover:bg-emerald-200/80 dark:hover:bg-emerald-900/60 border border-emerald-300 dark:border-emerald-800 rounded-lg transition-colors"
                title="بدء جلسة مراجعة مباغتة بمقاطع عشوائية"
              >
                <Shuffle className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
                <span>جلسة مراجعة سريعة</span>
              </button>
            )}

            <button
              onClick={() => setShowRescheduleDialog(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-stone-700 dark:text-stone-300 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 rounded-lg transition-colors"
              title="إعادة ضبط وتوزيع المهام المتبقية بدءاً من اليوم"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>إعادة جدولة المتبقي</span>
            </button>

            <button
              onClick={handlePrintSchedule}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-stone-700 dark:text-stone-300 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 rounded-lg transition-colors no-print"
              title="طباعة الجدول"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>طباعة الجدول</span>
            </button>

            <button
              onClick={onOpenCreateModal}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition-colors"
            >
              <span>+ خطة جديدة</span>
            </button>
          </div>
        </div>

        {/* Progress Metrics Strip */}
        {planStats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 text-center">
            <div className="p-2.5 rounded-xl bg-stone-50 dark:bg-stone-800/40">
              <span className="text-[11px] text-stone-500 block mb-0.5">نسبة الإنجاز</span>
              <div className="text-xl font-bold font-mono tabular-nums text-emerald-700 dark:text-emerald-400">
                {planStats.completionPercent}%
              </div>
              <span className="text-[10px] text-stone-400">
                {planStats.completedDays} من {planStats.totalDays} يوم
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-stone-50 dark:bg-stone-800/40">
              <span className="text-[11px] text-stone-500 block mb-0.5">أيام الالتزام (Streak)</span>
              <div className="text-xl font-bold font-mono tabular-nums text-amber-600 dark:text-amber-400">
                {planStats.streak} {planStats.streak === 1 ? 'يوم' : 'أيام'}
              </div>
              <span className="text-[10px] text-stone-400">تتابع مبارك</span>
            </div>

            <div className="p-2.5 rounded-xl bg-stone-50 dark:bg-stone-800/40">
              <span className="text-[11px] text-stone-500 block mb-0.5">معدل الإتقان والتقييم</span>
              <div className="text-xl font-bold font-mono tabular-nums text-stone-900 dark:text-stone-100 flex items-center justify-center gap-1">
                <span>{planStats.avgStars}</span>
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
              </div>
              <span className="text-[10px] text-stone-400">من 5 نجوم</span>
            </div>

            <div className="p-2.5 rounded-xl bg-stone-50 dark:bg-stone-800/40">
              <span className="text-[11px] text-stone-500 block mb-0.5">مجموع التكرارات</span>
              <div className="text-xl font-bold font-mono tabular-nums text-stone-900 dark:text-stone-100">
                {planStats.totalReps}
              </div>
              <span className="text-[10px] text-stone-400">تكراراً موثقاً</span>
            </div>
          </div>
        )}
      </div>

      {/* TODAY'S WIERD HERO CARD (ورد اليوم) */}
      {todayTask && (
        <div className="bg-gradient-to-br from-emerald-900 to-emerald-950 text-white rounded-2xl p-6 shadow-md relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 bg-emerald-800/80 border border-emerald-700/60 rounded-lg text-xs font-semibold text-emerald-100">
                  مقرر اليوم · اليوم {todayTask.dayNumber} ({todayTask.dayName})
                </span>
                <span className="text-xs text-emerald-200">
                  تاريخ: {todayTask.date}
                </span>
              </div>

              {todayTask.status === 'completed' && (
                <div className="flex items-center gap-1 text-xs text-emerald-300 font-semibold bg-emerald-800/60 px-3 py-1 rounded-lg">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>تم إنجاز وتقييم ورد اليوم بفضل الله</span>
                </div>
              )}
            </div>

            {/* Portions Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-5">
              {todayTask.newMemorization ? (
                <div className="p-4 rounded-xl bg-emerald-800/40 border border-emerald-700/60 backdrop-blur-xs">
                  <div className="flex items-center gap-2 text-emerald-200 text-xs font-semibold mb-2">
                    <BookOpen className="w-4 h-4" />
                    <span>مقرر الحفظ الجديد:</span>
                  </div>
                  <div className="text-xl font-bold font-amiri text-white mb-1">
                    {todayTask.newMemorization.title}
                  </div>
                  <div className="text-xs text-emerald-200">
                    المقدار: {todayTask.newMemorization.amount} {todayTask.newMemorization.unit} · {todayTask.newMemorization.description}
                  </div>
                </div>
              ) : todayTask.isRestDay ? (
                <div className="p-4 rounded-xl bg-emerald-800/40 border border-emerald-700/60">
                  <div className="text-sm font-bold text-white mb-1">
                    يوم راحة ومراجعة أسبوعية
                  </div>
                  <div className="text-xs text-emerald-200">
                    لا يوجد حفظ جديد اليوم. استثمر الوقت في تثبيت ما مضى.
                  </div>
                </div>
              ) : null}

              {todayTask.revisionPortion && (
                <div className="p-4 rounded-xl bg-emerald-800/40 border border-emerald-700/60 backdrop-blur-xs">
                  <div className="flex items-center gap-2 text-amber-300 text-xs font-semibold mb-2">
                    <RotateCcw className="w-4 h-4" />
                    <span>مقرر المراجعة والتثبيت:</span>
                  </div>
                  <div className="text-xl font-bold font-amiri text-white mb-1">
                    {todayTask.revisionPortion.title}
                  </div>
                  <div className="text-xs text-emerald-200">
                    {todayTask.revisionPortion.description}
                  </div>
                </div>
              )}
            </div>

            {/* Actions Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-emerald-800/80">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedTaskForModal(todayTask)}
                  className="flex items-center gap-2 px-5 py-2.5 bg-white text-emerald-950 font-bold text-sm rounded-xl hover:bg-emerald-50 transition-all shadow-sm active:scale-95"
                >
                  <Play className="w-4 h-4 fill-emerald-900" />
                  <span>بدء جلسة التسميع والترديد</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickToggleTask(todayTask)}
                  className="px-4 py-2.5 bg-emerald-800/80 hover:bg-emerald-800 text-white text-xs font-medium rounded-xl border border-emerald-700/80 transition-colors"
                >
                  {todayTask.status === 'completed' ? 'تراجع عن الإنجاز' : 'تحديد كمنجز سريعاً'}
                </button>
              </div>

              {todayTask.evaluation && (
                <div className="flex items-center gap-1.5 text-xs text-emerald-100 bg-emerald-900/80 px-3 py-1.5 rounded-lg border border-emerald-700">
                  <span>تقييمك:</span>
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-3.5 h-3.5 ${
                          i < (todayTask.evaluation?.stars || 0)
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-emerald-700'
                        }`}
                      />
                    ))}
                  </div>
                  {todayTask.evaluation.notes && (
                    <span className="text-[11px] text-emerald-300">
                      «{todayTask.evaluation.notes}»
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* PLAN TIMETABLE & DETAILED SCHEDULE TABLE */}
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-base font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-emerald-600" />
              <span>الجدول الزمني المفصل لمقرر الخطة ({activePlan.tasks.length} يوماً)</span>
            </h3>
            <p className="text-xs text-stone-500 mt-0.5">
              توزيع المقررات اليومية وتفاصيل المراجعة وتقييم الإتقان لكل يوم
            </p>
          </div>

          {/* Filter tabs */}
          <div className="flex items-center gap-1 p-1 bg-stone-100 dark:bg-stone-800 rounded-xl text-xs font-medium">
            <button
              onClick={() => setFilterMode('all')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                filterMode === 'all' ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100 shadow-xs' : 'text-stone-600 dark:text-stone-400'
              }`}
            >
              الكل ({activePlan.tasks.length})
            </button>
            <button
              onClick={() => setFilterMode('pending')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                filterMode === 'pending' ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100 shadow-xs' : 'text-stone-600 dark:text-stone-400'
              }`}
            >
              المتبقي
            </button>
            <button
              onClick={() => setFilterMode('completed')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                filterMode === 'completed' ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100 shadow-xs' : 'text-stone-600 dark:text-stone-400'
              }`}
            >
              المنجز
            </button>
            <button
              onClick={() => setFilterMode('rest')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                filterMode === 'rest' ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100 shadow-xs' : 'text-stone-600 dark:text-stone-400'
              }`}
            >
              أيام التثبيت
            </button>
          </div>
        </div>

        {/* Schedule Table */}
        <div className="overflow-x-auto border border-stone-200 dark:border-stone-800 rounded-xl">
          <table className="w-full text-right text-xs">
            <thead className="bg-stone-50 dark:bg-stone-800/60 text-stone-600 dark:text-stone-400 border-b border-stone-200 dark:border-stone-800">
              <tr>
                <th className="py-3 px-4 font-semibold">اليوم والتاريخ</th>
                <th className="py-3 px-4 font-semibold">مقرر الحفظ الجديد</th>
                <th className="py-3 px-4 font-semibold">مقرر المراجعة التراكمية</th>
                <th className="py-3 px-4 font-semibold text-center">التكرارات</th>
                <th className="py-3 px-4 font-semibold text-center">التقييم</th>
                <th className="py-3 px-4 font-semibold text-center">الحالة</th>
                <th className="py-3 px-4 font-semibold text-left">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 dark:divide-stone-800/80">
              {filteredTasks.map((task) => {
                const isToday = task.date === todayStr;
                const isCompleted = task.status === 'completed';

                return (
                  <tr
                    key={task.id}
                    className={`hover:bg-stone-50/80 dark:hover:bg-stone-800/40 transition-colors ${
                      isToday ? 'bg-emerald-50/40 dark:bg-emerald-950/20 font-medium' : ''
                    }`}
                  >
                    {/* Day & Date */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className={`w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold font-mono ${
                          isCompleted
                            ? 'bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-300'
                            : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300'
                        }`}>
                          {task.dayNumber}
                        </span>
                        <div>
                          <div className="text-stone-900 dark:text-stone-100 font-bold">
                            {task.dayName} {isToday && <span className="text-[10px] text-emerald-600 mr-1 font-semibold">(اليوم)</span>}
                          </div>
                          <div className="text-[10px] text-stone-400 font-mono">
                            {task.date}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* New Memorization */}
                    <td className="py-3 px-4">
                      {task.newMemorization ? (
                        <div>
                          <div className="font-bold text-stone-900 dark:text-stone-100 font-amiri text-sm">
                            {task.newMemorization.title}
                          </div>
                          <div className="text-[11px] text-stone-500">
                            {task.newMemorization.amount} {task.newMemorization.unit}
                          </div>
                        </div>
                      ) : task.isRestDay ? (
                        <span className="text-amber-700 dark:text-amber-400 text-xs">
                          يوم تثبيت ومراجعة أسبوعية
                        </span>
                      ) : (
                        <span className="text-stone-400">-</span>
                      )}
                    </td>

                    {/* Revision Portion */}
                    <td className="py-3 px-4">
                      {task.revisionPortion ? (
                        <div className="text-stone-700 dark:text-stone-300">
                          <span className="font-amiri text-xs font-medium">
                            {task.revisionPortion.title}
                          </span>
                        </div>
                      ) : (
                        <span className="text-stone-400">-</span>
                      )}
                    </td>

                    {/* Repetitions */}
                    <td className="py-3 px-4 text-center whitespace-nowrap font-mono tabular-nums">
                      <span className="font-bold text-stone-800 dark:text-stone-200">
                        {task.repetitionsDone || 0}
                      </span>
                      <span className="text-stone-400 text-[11px]">
                        /{task.repetitionsTarget || 20}
                      </span>
                    </td>

                    {/* Evaluation Stars */}
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      {task.evaluation ? (
                        <div className="flex items-center justify-center gap-0.5" title={`تقييم: ${task.evaluation.grade}`}>
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-3 h-3 ${
                                i < (task.evaluation?.stars || 0)
                                  ? 'fill-amber-400 text-amber-400'
                                  : 'text-stone-200 dark:text-stone-700'
                              }`}
                            />
                          ))}
                        </div>
                      ) : (
                        <span className="text-stone-400 text-[11px]">-</span>
                      )}
                    </td>

                    {/* Status Badge */}
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <button
                        onClick={() => handleQuickToggleTask(task)}
                        className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all ${
                          isCompleted
                            ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300'
                            : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-200'
                        }`}
                      >
                        {isCompleted ? '✓ منجز' : 'قيد الإنجاز'}
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-left whitespace-nowrap">
                      <button
                        onClick={() => setSelectedTaskForModal(task)}
                        className="px-2.5 py-1 text-[11px] font-medium text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 rounded-lg transition-colors"
                      >
                        جلسة التسميع / تقييم
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Reschedule Modal Dialog */}
      {showRescheduleDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-6 w-full max-w-md shadow-2xl text-stone-900 dark:text-stone-100">
            <h3 className="font-bold text-base mb-2">
              إعادة جدولة الأيام والمهام المتبقية
            </h3>
            <p className="text-xs text-stone-500 mb-4">
              إذا فاتتك أيام من الورد بسبب عارض، يمكنك بضغطة زر إعادة توزيع المهام المتبقية بدءاً من اليوم أو تاريخ محدد دون فقدان سجل إنجازاتك السابقة.
            </p>

            <div className="space-y-3 mb-5">
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300">
                تاريخ استئناف الجدول:
              </label>
              <input
                type="date"
                defaultValue={todayStr}
                onChange={(e) => setReschedulePromptDate(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900"
              />
            </div>

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowRescheduleDialog(false)}
                className="px-4 py-2 text-xs text-stone-600 hover:text-stone-900"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleApplyReschedule}
                className="px-5 py-2 text-xs font-medium text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl"
              >
                تطبيق إعادة الجدولة
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Active Daily Session Modal */}
      {selectedTaskForModal && (
        <DailySessionModal
          plan={activePlan}
          task={selectedTaskForModal}
          isOpen={true}
          onClose={() => setSelectedTaskForModal(null)}
          onSaveTask={handleSaveTask}
        />
      )}
    </div>
  );
};
