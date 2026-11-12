import React, { useState, useEffect } from 'react';
import { DailyTask, EvaluationGrade, Plan } from '../types';
import { playChimeSound } from '../utils/notifications';
import { VoiceVerificationPanel } from './VoiceVerificationPanel';
import confetti from 'canvas-confetti';
import { 
  X, Check, RotateCcw, Play, Pause, Mic, MicOff, 
  Volume2, Star, Sparkles, BookOpen, Clock, AlertCircle
} from 'lucide-react';

interface Props {
  plan: Plan;
  task: DailyTask;
  isOpen: boolean;
  onClose: () => void;
  onSaveTask: (updatedTask: DailyTask) => void;
}

export const DailySessionModal: React.FC<Props> = ({
  plan,
  task,
  isOpen,
  onClose,
  onSaveTask
}) => {
  if (!isOpen) return null;

  // Repetition state
  const targetReps = task.repetitionsTarget || plan.targetRepetitionsPerDay || 20;
  const [repsDone, setRepsDone] = useState<number>(task.repetitionsDone || 0);

  // Timer state
  const [secondsElapsed, setSecondsElapsed] = useState<number>((task.timeSpentMinutes || 0) * 60);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(true);

  // Evaluation state
  const [stars, setStars] = useState<number>(task.evaluation?.stars || 5);
  const [grade, setGrade] = useState<EvaluationGrade>(task.evaluation?.grade || 'excellent');
  const [notes, setNotes] = useState<string>(task.evaluation?.notes || '');
  const [difficultSpots, setDifficultSpots] = useState<string>(
    task.evaluation?.difficultSpots?.join('\n') || ''
  );
  

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setSecondsElapsed(prev => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerRunning]);

  // Sync stars to grade
  const handleStarSelect = (rating: number) => {
    setStars(rating);
    if (rating === 5) setGrade('excellent');
    else if (rating === 4) setGrade('very_good');
    else if (rating === 3) setGrade('good');
    else if (rating >= 2) setGrade('needs_revision');
    else setGrade('unaccomplished');
  };

  const handleIncrementRep = () => {
    const next = repsDone + 1;
    setRepsDone(next);
    playChimeSound('repetition');
    if (next === targetReps) {
      playChimeSound('complete');
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 }
      });
    }
  };

  // Format time
  const formatTime = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSaveAndComplete = () => {
    const timeSpentMins = Math.max(1, Math.round(secondsElapsed / 60));
    const spotsArray = difficultSpots.split('\n').map(s => s.trim()).filter(Boolean);

    const updated: DailyTask = {
      ...task,
      status: 'completed',
      completedAt: new Date().toISOString(),
      repetitionsDone: repsDone,
      timeSpentMinutes: timeSpentMins,
      evaluation: {
        stars,
        grade,
        notes: notes.trim(),
        difficultSpots: spotsArray
      }
    };

    playChimeSound('complete');
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 }
    });

    onSaveTask(updated);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/70 backdrop-blur-xs overflow-y-auto">
      <div 
        className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl transition-all my-8 text-stone-900 dark:text-stone-100"
        dir="rtl"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center font-bold">
              {task.dayNumber}
            </div>
            <div>
              <h2 className="text-base font-bold text-stone-900 dark:text-stone-100">
                جلسة الورد اليومي · {task.dayName}
              </h2>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                {plan.materialName} ({plan.title})
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Portions Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {task.newMemorization && (
              <div className="p-4 rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/50 dark:bg-emerald-950/20">
                <div className="flex items-center gap-2 mb-2 text-emerald-800 dark:text-emerald-300 font-semibold text-sm">
                  <BookOpen className="w-4 h-4" />
                  <span>مقرر الحفظ الجديد</span>
                </div>
                <div className="text-lg font-bold text-stone-900 dark:text-stone-100 font-amiri">
                  {task.newMemorization.title}
                </div>
                <p className="text-xs text-stone-600 dark:text-stone-400 mt-1">
                  المقدار: {task.newMemorization.amount} {task.newMemorization.unit}
                </p>
              </div>
            )}

            {task.revisionPortion && (
              <div className="p-4 rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/50 dark:bg-amber-950/20">
                <div className="flex items-center gap-2 mb-2 text-amber-800 dark:text-amber-300 font-semibold text-sm">
                  <RotateCcw className="w-4 h-4" />
                  <span>مقرر المراجعة والتثبيت</span>
                </div>
                <div className="text-lg font-bold text-stone-900 dark:text-stone-100 font-amiri">
                  {task.revisionPortion.title}
                </div>
                <p className="text-xs text-stone-600 dark:text-stone-400 mt-1">
                  {task.revisionPortion.description}
                </p>
              </div>
            )}
          </div>

          {/* Repetition Counter & Timer Deck */}
          <div className="p-5 rounded-2xl bg-stone-100 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700/60 flex flex-col sm:flex-row items-center justify-between gap-6">
            {/* Repetitions Counter */}
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={handleIncrementRep}
                className="group relative flex flex-col items-center justify-center w-24 h-24 rounded-2xl bg-emerald-700 text-white shadow-lg shadow-emerald-700/20 hover:bg-emerald-800 active:scale-95 transition-all"
              >
                <span className="text-2xl font-bold font-mono tabular-nums leading-none">
                  {repsDone}
                </span>
                <span className="text-[11px] text-emerald-100 mt-1">
                  من {targetReps} تكرار
                </span>
                <span className="text-[9px] uppercase tracking-wider text-emerald-200 mt-0.5">
                  انقر للعد
                </span>
              </button>

              <div className="space-y-1.5">
                <div className="text-sm font-semibold text-stone-800 dark:text-stone-200">
                  سنة التكرار والترديد
                </div>
                <div className="text-xs text-stone-500 dark:text-stone-400 max-w-xs">
                  «تكرار المحفوظ 20 إلى 40 مرة أثبتُ للصدر وأطردُ للنسيان»
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={() => setRepsDone(prev => Math.max(0, prev - 1))}
                    className="px-2.5 py-1 text-xs font-medium rounded-lg bg-white dark:bg-stone-700 border border-stone-300 dark:border-stone-600 hover:bg-stone-50"
                  >
                    -1
                  </button>
                  <button
                    onClick={() => setRepsDone(prev => prev + 5)}
                    className="px-2.5 py-1 text-xs font-medium rounded-lg bg-white dark:bg-stone-700 border border-stone-300 dark:border-stone-600 hover:bg-stone-50"
                  >
                    +5
                  </button>
                  <button
                    onClick={() => setRepsDone(0)}
                    className="px-2.5 py-1 text-xs text-stone-500 hover:text-stone-700 dark:hover:text-stone-300"
                  >
                    تصفير
                  </button>
                </div>
              </div>
            </div>

            {/* Session Stopwatch */}
            <div className="flex items-center gap-3 border-t sm:border-t-0 sm:border-r border-stone-200 dark:border-stone-700 pt-4 sm:pt-0 sm:pr-6">
              <div className="text-center sm:text-right">
                <div className="flex items-center gap-1.5 text-xs text-stone-500 dark:text-stone-400">
                  <Clock className="w-3.5 h-3.5" />
                  <span>وقت الجلسة</span>
                </div>
                <div className="text-2xl font-mono tabular-nums font-bold text-stone-900 dark:text-stone-100">
                  {formatTime(secondsElapsed)}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsTimerRunning(!isTimerRunning)}
                className={`p-2.5 rounded-xl border transition-colors ${
                  isTimerRunning
                    ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800'
                    : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                }`}
                title={isTimerRunning ? 'إيقاف مؤقت' : 'استئناف الوقت'}
              >
                {isTimerRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Voice Recitation & Speech Recognition Panel (In-Memory RAM transient) */}
          <VoiceVerificationPanel
            targetTextPrompt={task.newMemorization?.title || task.revisionPortion?.title}
          />

          {/* Evaluation System (نظام التقييم) */}
          <div className="p-5 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-800/30 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>تقييم الإتقان للإنجاز اليومي</span>
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  قس جودة استحضارك للمقرر بكل أمانة لضبط المراجعة اللاحقة
                </p>
              </div>

              {/* Star Selector */}
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((starVal) => (
                  <button
                    key={starVal}
                    type="button"
                    onClick={() => handleStarSelect(starVal)}
                    className="p-1 hover:scale-110 transition-transform"
                    title={`${starVal} نجوم`}
                  >
                    <Star
                      className={`w-6 h-6 ${
                        starVal <= stars
                          ? 'fill-amber-400 text-amber-400'
                          : 'text-stone-300 dark:text-stone-600'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Qualitative Descriptor */}
            <div className="flex items-center gap-2 text-xs">
              <span className="font-semibold text-stone-700 dark:text-stone-300">التقدير:</span>
              <span className={`px-2.5 py-1 rounded-md font-medium ${
                grade === 'excellent' 
                  ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
                  : grade === 'very_good'
                  ? 'bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300'
                  : grade === 'good'
                  ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300'
                  : 'bg-red-100 dark:bg-red-950 text-red-800 dark:text-red-300'
              }`}>
                {grade === 'excellent' && 'ممتاز · حفظ متقن كالفاتحة بلا تردد'}
                {grade === 'very_good' && 'جيد جداً · تردد يسير تم تداركه'}
                {grade === 'good' && 'جيد · يحتاج تثبيتاً في ورد المراجعة'}
                {grade === 'needs_revision' && 'يحتاج إعادة وتكثيف التكرار'}
                {grade === 'unaccomplished' && 'لم ينجز بالكامل'}
              </span>
            </div>

            {/* Notes & Difficult spots */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
              <div>
                <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">
                  ملاحظات الإنجاز أو التدبر:
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="مثلاً: تم التركيز على مخرج حرف الضاد وتثبيت أرباع السورة"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 focus:outline-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                  <span>المتشابهات أو مواضع التردد لتثبيتها:</span>
                </label>
                <input
                  type="text"
                  value={difficultSpots}
                  onChange={(e) => setDifficultSpots(e.target.value)}
                  placeholder="مثلاً: الآية 14 مع الآية 28، أو الشطر الثاني من البيت 12"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 focus:outline-emerald-600"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900/50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-800 rounded-lg transition-colors"
          >
            إغلاق دون حفظ
          </button>

          <button
            type="button"
            onClick={handleSaveAndComplete}
            className="flex items-center gap-2 px-5 py-2 text-xs font-medium text-white bg-emerald-700 rounded-lg hover:bg-emerald-800 shadow-sm transition-all"
          >
            <Check className="w-4 h-4" />
            <span>توثيق الإنجاز وتقييم الورد اليومي</span>
          </button>
        </div>
      </div>
    </div>
  );
};
