import React, { useState, useEffect, useMemo } from 'react';
import { DailyTask, Plan, EvaluationGrade } from '../types';
import { playChimeSound } from '../utils/notifications';
import { VoiceVerificationPanel } from './VoiceVerificationPanel';
import confetti from 'canvas-confetti';
import { 
  Shuffle, Play, Pause, RotateCcw, Check, Star, 
  Mic, MicOff, Volume2, Sparkles, BookOpen, AlertCircle, 
  Eye, EyeOff, CheckCircle2, Flame, Award
} from 'lucide-react';

interface Props {
  plan: Plan | null;
  onUpdatePlan: (updatedPlan: Plan) => void;
  onOpenCreatePlan: () => void;
}

interface QuickReviewLog {
  id: string;
  timestamp: string;
  title: string;
  portionDesc: string;
  grade: EvaluationGrade;
  stars: number;
  timeSeconds: number;
}

export const QuickRevisionView: React.FC<Props> = ({
  plan,
  onUpdatePlan,
  onOpenCreatePlan
}) => {
  // Pool of candidate tasks to test
  const candidateTasks = useMemo(() => {
    if (!plan) return [];
    // Prefer non-rest tasks with either new memorization or revision portion
    return plan.tasks.filter(t => !t.isRestDay && (t.newMemorization || t.revisionPortion));
  }, [plan]);

  // Selected random task
  const [currentTask, setCurrentTask] = useState<DailyTask | null>(null);
  const [filterOnlyCompleted, setFilterOnlyCompleted] = useState<boolean>(true);
  
  // Interactive testing state
  const [isBlindMode, setIsBlindMode] = useState<boolean>(false);
  const [repsDone, setRepsDone] = useState<number>(0);
  const targetReps = 5;

  // Session timer
  const [seconds, setSeconds] = useState<number>(0);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(true);

  // Rating & Review session history
  const [selectedStars, setSelectedStars] = useState<number>(5);
  const [historyLogs, setHistoryLogs] = useState<QuickReviewLog[]>([]);

  // Function to pick a new random portion
  const pickRandomPortion = (preferCompletedOnly = filterOnlyCompleted) => {
    if (!plan || candidateTasks.length === 0) return;

    let pool = candidateTasks;
    if (preferCompletedOnly) {
      const completedOnly = candidateTasks.filter(t => t.status === 'completed');
      if (completedOnly.length > 0) {
        pool = completedOnly;
      }
    }

    // Pick random different from current if possible
    let nextTask: DailyTask;
    if (pool.length === 1) {
      nextTask = pool[0];
    } else {
      const filtered = currentTask ? pool.filter(t => t.id !== currentTask.id) : pool;
      const candidates = filtered.length > 0 ? filtered : pool;
      const randomIndex = Math.floor(Math.random() * candidates.length);
      nextTask = candidates[randomIndex];
    }

    setCurrentTask(nextTask);
    setRepsDone(0);
    setSeconds(0);
    setIsTimerRunning(true);
    setSelectedStars(5);
    playChimeSound('repetition');
  };

  // Initialize with random portion on mount or plan change
  useEffect(() => {
    if (plan && (!currentTask || !plan.tasks.some(t => t.id === currentTask.id))) {
      pickRandomPortion();
    }
  }, [plan]);

  // Timer interval
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isTimerRunning && currentTask) {
      interval = setInterval(() => {
        setSeconds(prev => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerRunning, currentTask]);

  const handleIncrementRep = () => {
    const next = repsDone + 1;
    setRepsDone(next);
    playChimeSound('repetition');
    if (next === targetReps) {
      playChimeSound('complete');
    }
  };

  const handleCompleteQuickReview = () => {
    if (!currentTask || !plan) return;

    let grade: EvaluationGrade = 'excellent';
    if (selectedStars === 4) grade = 'very_good';
    else if (selectedStars === 3) grade = 'good';
    else if (selectedStars <= 2) grade = 'needs_revision';

    const portionTitle = currentTask.newMemorization?.title || currentTask.revisionPortion?.title || `اليوم ${currentTask.dayNumber}`;
    const portionDesc = currentTask.newMemorization?.description || currentTask.revisionPortion?.description || '';

    const newLog: QuickReviewLog = {
      id: 'log_' + Date.now(),
      timestamp: new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' }),
      title: portionTitle,
      portionDesc,
      grade,
      stars: selectedStars,
      timeSeconds: seconds
    };

    setHistoryLogs(prev => [newLog, ...prev]);

    // Also update task evaluation in plan if rating is good
    if (currentTask.evaluation) {
      const updatedTask: DailyTask = {
        ...currentTask,
        evaluation: {
          ...currentTask.evaluation,
          stars: Math.max(currentTask.evaluation.stars, selectedStars),
          grade
        }
      };
      const updatedPlan: Plan = {
        ...plan,
        tasks: plan.tasks.map(t => t.id === currentTask.id ? updatedTask : t)
      };
      onUpdatePlan(updatedPlan);
    }

    playChimeSound('complete');
    confetti({
      particleCount: 60,
      spread: 70,
      origin: { y: 0.6 }
    });

    // Roll next portion
    pickRandomPortion();
  };

  const formatTime = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!plan) {
    return (
      <div className="w-full py-16 px-4 text-center">
        <div className="w-16 h-16 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center mx-auto mb-4">
          <Shuffle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-stone-900 dark:text-stone-100 mb-2">
          لا توجد خطة نشطة لإجراء المراجعة السريعة
        </h2>
        <p className="text-sm text-stone-500 max-w-md mx-auto mb-6">
          أنشئ خطة حفظ للقرآن أو المتون أولاً لتتمكن من خوض جلسات مراجعة مباغتة واختبار استحضار الذهن.
        </p>
        <button
          onClick={onOpenCreatePlan}
          className="px-6 py-2.5 bg-emerald-700 text-white font-medium text-sm rounded-xl hover:bg-emerald-800 transition-colors shadow-sm"
        >
          + إنشاء خطة جديدة
        </button>
      </div>
    );
  }

  const portionToShow = currentTask?.newMemorization || currentTask?.revisionPortion;

  return (
    <div className="space-y-6 w-full">
      {/* View Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-5 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 flex items-center justify-center">
              <Shuffle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                <span>جلسة مراجعة سريعة مباغتة</span>
                <span className="text-[11px] font-semibold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 px-2 py-0.5 rounded-full">
                  تثبيت واستحضار
                </span>
              </h2>
              <p className="text-xs text-stone-500">
                الخطة الحالية: <strong className="text-stone-700 dark:text-stone-300">{plan.title}</strong> ({plan.materialName})
              </p>
            </div>
          </div>
        </div>

        {/* Filter & Next Button */}
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-xs text-stone-600 dark:text-stone-400 cursor-pointer bg-stone-50 dark:bg-stone-800/60 px-3 py-1.5 rounded-xl border border-stone-200 dark:border-stone-700">
            <input
              type="checkbox"
              checked={filterOnlyCompleted}
              onChange={(e) => {
                const checked = e.target.checked;
                setFilterOnlyCompleted(checked);
                pickRandomPortion(checked);
              }}
              className="rounded text-emerald-600 focus:ring-emerald-500"
            />
            <span>المحفوظ المنجز فقط</span>
          </label>

          <button
            onClick={() => pickRandomPortion()}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs rounded-xl shadow-sm transition-all active:scale-95 whitespace-nowrap"
          >
            <Shuffle className="w-4 h-4" />
            <span>اقتراح مقطع عشوائي آخر</span>
          </button>
        </div>
      </div>

      {/* Main Flashcard Stage */}
      {currentTask && portionToShow ? (
        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
          {/* Header of Question */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-stone-100 dark:border-stone-800">
            <div className="flex items-center gap-2 text-xs text-stone-500">
              <span className="px-2.5 py-1 rounded-lg bg-stone-100 dark:bg-stone-800 font-bold text-stone-800 dark:text-stone-200 font-mono">
                اليوم {currentTask.dayNumber} ({currentTask.dayName})
              </span>
              <span>·</span>
              <span>تاريخ الورد: {currentTask.date}</span>
            </div>

            <button
              onClick={() => setIsBlindMode(!isBlindMode)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors"
            >
              {isBlindMode ? <Eye className="w-3.5 h-3.5 text-emerald-600" /> : <EyeOff className="w-3.5 h-3.5 text-stone-500" />}
              <span>{isBlindMode ? 'إظهار نص المقطع' : 'وضع التسميع الغيبي (إخفاء التفاصيل)'}</span>
            </button>
          </div>

          {/* Random Passage Challenge Box */}
          <div className="py-6 px-6 sm:px-10 rounded-2xl bg-gradient-to-br from-emerald-50/60 to-stone-50 dark:from-emerald-950/20 dark:to-stone-900/60 border border-emerald-200 dark:border-emerald-900/50 text-center space-y-4">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-100/80 dark:bg-emerald-900/50 px-3 py-1 rounded-full">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>المقرر المقترح للتسميع الآن:</span>
            </div>

            <h3 className={`text-2xl sm:text-3xl font-extrabold font-amiri text-stone-900 dark:text-stone-100 leading-relaxed transition-all ${
              isBlindMode ? 'blur-md select-none' : ''
            }`}>
              {portionToShow.title}
            </h3>

            <p className={`text-sm text-stone-600 dark:text-stone-400 max-w-xl mx-auto transition-all ${
              isBlindMode ? 'blur-md select-none' : ''
            }`}>
              {portionToShow.description}
            </p>

            {isBlindMode && (
              <p className="text-xs text-amber-700 dark:text-amber-400 font-medium">
                «تم تمويه التفاصيل لتسميع المقطع غيباً من صدرك كأنك في حلقة تسميع»
              </p>
            )}
          </div>

          {/* Controls Deck: Repetitions & Timer */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            {/* Repetitions Counter */}
            <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/40 border border-stone-200 dark:border-stone-700/60 flex items-center justify-between">
              <div>
                <span className="text-xs text-stone-500 block mb-0.5">ترديد المقطع</span>
                <span className="text-xl font-bold font-mono text-stone-900 dark:text-stone-100">
                  {repsDone} <span className="text-xs text-stone-400">/ {targetReps} مرات</span>
                </span>
              </div>
              <button
                onClick={handleIncrementRep}
                className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-xs active:scale-95 transition-all"
              >
                + عدّ تكرار
              </button>
            </div>

            {/* Session Stopwatch */}
            <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/40 border border-stone-200 dark:border-stone-700/60 flex items-center justify-between">
              <div>
                <span className="text-xs text-stone-500 block mb-0.5">وقت الاستحضار</span>
                <span className="text-xl font-bold font-mono text-stone-900 dark:text-stone-100">
                  {formatTime(seconds)}
                </span>
              </div>
              <button
                onClick={() => setIsTimerRunning(!isTimerRunning)}
                className="p-2.5 rounded-xl border border-stone-300 dark:border-stone-600 hover:bg-white dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300"
              >
                {isTimerRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </button>
            </div>

          </div>

          {/* Voice Recitation & Speech Recognition Panel (In-Memory RAM transient) */}
          <VoiceVerificationPanel
            targetTextPrompt={portionToShow.title}
          />

          {/* Quick Evaluation & Save */}
          <div className="pt-4 border-t border-stone-100 dark:border-stone-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-stone-700 dark:text-stone-300">
                تقييم إتقان هذا المقطع:
              </span>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((starVal) => (
                  <button
                    key={starVal}
                    type="button"
                    onClick={() => setSelectedStars(starVal)}
                    className="p-1 hover:scale-110 transition-transform"
                  >
                    <Star
                      className={`w-5 h-5 ${
                        starVal <= selectedStars
                          ? 'fill-amber-400 text-amber-400'
                          : 'text-stone-300 dark:text-stone-600'
                      }`}
                    />
                  </button>
                ))}
              </div>
              <span className="text-xs text-stone-500">
                ({selectedStars === 5 ? 'ممتاز' : selectedStars === 4 ? 'جيد جداً' : selectedStars === 3 ? 'جيد' : 'يحتاج تثبيت'})
              </span>
            </div>

            <button
              onClick={handleCompleteQuickReview}
              className="flex items-center gap-2 px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs rounded-xl shadow-md transition-all active:scale-95"
            >
              <Check className="w-4 h-4" />
              <span>توثيق التقييم والانتقال لمقطع تالٍ</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="p-8 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl text-center text-xs text-stone-500">
          لا توجد مقاطع مطابقة حالياً للمراجعة.
        </div>
      )}

      {/* History of Quick Reviews Taken in this Session */}
      {historyLogs.length > 0 && (
        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-6 shadow-xs space-y-3">
          <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>المقاطع التي تم استحضارها في هذه الجلسة ({historyLogs.length}):</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {historyLogs.map((log) => (
              <div 
                key={log.id} 
                className="p-3.5 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/60 dark:bg-stone-800/40 text-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between text-[11px] text-stone-400 mb-1">
                    <span className="font-mono">{log.timestamp}</span>
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-3 h-3 ${
                            i < log.stars ? 'fill-amber-400 text-amber-400' : 'text-stone-300 dark:text-stone-700'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="font-bold text-stone-900 dark:text-stone-100 font-amiri text-sm mb-1">
                    {log.title}
                  </div>
                </div>
                <div className="text-[11px] text-emerald-700 dark:text-emerald-400 pt-2 border-t border-stone-200 dark:border-stone-700 mt-2">
                  استغرق {log.timeSeconds} ثانية
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
