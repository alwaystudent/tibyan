import React, { useState, useMemo } from 'react';
import { GoalType, Plan, PlanType, UnitType } from '../types';
import { QURAN_SURAHS, JUZ_NAMES, COMMON_QURAN_PLANS } from '../data/quranData';
import { MATN_LIBRARY } from '../data/matnLibrary';
import { generatePlanSchedule } from '../utils/scheduler';
import { 
  X, Check, BookOpen, Scroll, Calendar, Clock, 
  RotateCcw, Sparkles, AlertCircle, ChevronLeft, ChevronRight 
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onPlanCreated: (newPlan: Plan) => void;
  initialMatnId?: string | null;
}

export const PlanCreatorModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onPlanCreated,
  initialMatnId
}) => {
  if (!isOpen) return null;

  // Wizard Step
  const [step, setStep] = useState<number>(1);

  // Form State
  const [planType, setPlanType] = useState<PlanType>(initialMatnId ? 'matn' : 'quran');
  const [goalType, setGoalType] = useState<GoalType>('memorization');
  const [title, setTitle] = useState<string>('');
  
  // Quran-specific
  const [quranMode, setQuranMode] = useState<'surahs' | 'pages' | 'juz' | 'preset'>('preset');
  const [startSurahNum, setStartSurahNum] = useState<number>(78); // An-Naba
  const [endSurahNum, setEndSurahNum] = useState<number>(114); // An-Nas
  const [startPage, setStartPage] = useState<number>(582);
  const [endPage, setEndPage] = useState<number>(604);
  const [startJuz, setStartJuz] = useState<number>(30);
  const [endJuz, setEndJuz] = useState<number>(30);

  // Matn-specific
  const [selectedMatnId, setSelectedMatnId] = useState<string>(initialMatnId || 'tuhfat-al-atfal');
  const [isCustomMatn, setIsCustomMatn] = useState<boolean>(false);
  const [customTitle, setCustomTitle] = useState<string>('');
  const [customAuthor, setCustomAuthor] = useState<string>('');
  const [customField, setCustomField] = useState<string>('متون علمية');
  const [customUnits, setCustomUnits] = useState<number>(50);
  const [customUnitType, setCustomUnitType] = useState<UnitType>('line');
  const [customUnitLabel, setCustomUnitLabel] = useState<string>('بيت');

  // Scheduling State
  const todayStr = new Date().toISOString().split('T')[0];
  const [startDate, setStartDate] = useState<string>(todayStr);
  const [pacingMethod, setPacingMethod] = useState<'duration' | 'daily_amount'>('duration');
  const [durationDays, setDurationDays] = useState<number>(14);
  const [dailyAmountInput, setDailyAmountInput] = useState<number>(2);
  const [restFriday, setRestFriday] = useState<boolean>(true);
  const [restSaturday, setRestSaturday] = useState<boolean>(false);
  const [targetReps, setTargetReps] = useState<number>(20);
  const [reminderEnabled, setReminderEnabled] = useState<boolean>(true);
  const [reminderTime, setReminderTime] = useState<string>('06:00');
  const [revisionRatio, setRevisionRatio] = useState<'none' | 'light' | 'moderate' | 'intensive'>('moderate');

  // Derived workload calculations
  const workload = useMemo(() => {
    if (planType === 'quran') {
      if (quranMode === 'pages') {
        const pagesCount = Math.max(1, endPage - startPage + 1);
        return {
          totalUnits: pagesCount,
          unitType: 'page' as UnitType,
          unitLabel: 'صفحة',
          materialName: 'القرآن الكريم',
          details: `من صفحة ${startPage} إلى صفحة ${endPage}`,
          startPoint: `صفحة ${startPage}`,
          endPoint: `صفحة ${endPage}`,
          defaultTitle: `${goalType === 'revision' ? 'مراجعة' : 'حفظ'} صفحات من المصحف (${startPage}-${endPage})`
        };
      } else if (quranMode === 'juz') {
        const sJuz = JUZ_NAMES[startJuz] || JUZ_NAMES[30];
        const eJuz = JUZ_NAMES[endJuz] || JUZ_NAMES[30];
        const pagesCount = Math.max(1, eJuz.endPage - sJuz.startPage + 1);
        return {
          totalUnits: pagesCount,
          unitType: 'page' as UnitType,
          unitLabel: 'صفحة',
          materialName: startJuz === endJuz ? sJuz.label : `من ${sJuz.label} إلى ${eJuz.label}`,
          details: `الصفحات من ${sJuz.startPage} إلى ${eJuz.endPage}`,
          startPoint: `صفحة ${sJuz.startPage}`,
          endPoint: `صفحة ${eJuz.endPage}`,
          defaultTitle: `${goalType === 'revision' ? 'مراجعة' : 'حفظ'} ${sJuz.label}`
        };
      } else if (quranMode === 'surahs') {
        const sSurah = QURAN_SURAHS.find(s => s.number === startSurahNum) || QURAN_SURAHS[0];
        const eSurah = QURAN_SURAHS.find(s => s.number === endSurahNum) || QURAN_SURAHS[113];
        const pStart = Math.min(sSurah.startPage, eSurah.startPage);
        const pEnd = Math.max(sSurah.endPage, eSurah.endPage);
        const pagesCount = Math.max(1, pEnd - pStart + 1);
        return {
          totalUnits: pagesCount,
          unitType: 'page' as UnitType,
          unitLabel: 'صفحة',
          materialName: sSurah.number === eSurah.number ? `سورة ${sSurah.arabicName}` : `من سورة ${sSurah.arabicName} إلى سورة ${eSurah.arabicName}`,
          details: `${pagesCount} صفحة (الصفحات ${pStart}-${pEnd})`,
          startPoint: `سورة ${sSurah.arabicName}`,
          endPoint: `سورة ${eSurah.arabicName}`,
          defaultTitle: `${goalType === 'revision' ? 'مراجعة' : 'حفظ'} سورة ${sSurah.arabicName}`
        };
      } else {
        // Preset default: Juz Amma
        return {
          totalUnits: 23,
          unitType: 'page' as UnitType,
          unitLabel: 'صفحة',
          materialName: 'جزء عمّ (المصحف الشريف)',
          details: 'من سورة النبأ إلى سورة الناس (23 صفحة)',
          startPoint: 'صفحة 582',
          endPoint: 'صفحة 604',
          defaultTitle: `${goalType === 'revision' ? 'مراجعة وتثبيت' : 'حفظ'} جزء عمّ`
        };
      }
    } else {
      // Matn
      if (isCustomMatn) {
        return {
          totalUnits: customUnits,
          unitType: customUnitType,
          unitLabel: customUnitLabel,
          materialName: customTitle || 'متن علمي مخصص',
          details: `${customAuthor ? 'تأليف: ' + customAuthor : ''} (${customUnits} ${customUnitLabel})`,
          startPoint: `${customUnitLabel} 1`,
          endPoint: `${customUnitLabel} ${customUnits}`,
          defaultTitle: `${goalType === 'revision' ? 'مراجعة' : 'حفظ'} ${customTitle || 'المتن'}`
        };
      } else {
        const item = MATN_LIBRARY.find(m => m.id === selectedMatnId) || MATN_LIBRARY[0];
        return {
          totalUnits: item.totalUnits,
          unitType: item.unitType,
          unitLabel: item.unitLabel,
          materialName: item.title,
          details: `للإمام ${item.author} (${item.totalUnits} ${item.unitLabel})`,
          startPoint: `${item.unitLabel} 1`,
          endPoint: `${item.unitLabel} ${item.totalUnits}`,
          defaultTitle: `${goalType === 'revision' ? 'مراجعة وتثبيت' : 'حفظ'} ${item.title}`
        };
      }
    }
  }, [
    planType, quranMode, startSurahNum, endSurahNum, startPage, endPage, startJuz, endJuz,
    goalType, isCustomMatn, customUnits, customUnitType, customUnitLabel, customTitle,
    customAuthor, selectedMatnId
  ]);

  // Adjust duration if using daily amount
  const calculatedDuration = useMemo(() => {
    if (pacingMethod === 'duration') {
      return Math.max(1, durationDays);
    }
    const perDay = Math.max(1, dailyAmountInput);
    const activeNeeded = Math.ceil(workload.totalUnits / perDay);
    // account for rest days roughly
    const restMultiplier = restFriday && restSaturday ? 7 / 5 : restFriday || restSaturday ? 7 / 6 : 1;
    return Math.ceil(activeNeeded * restMultiplier);
  }, [pacingMethod, durationDays, dailyAmountInput, workload.totalUnits, restFriday, restSaturday]);

  const handleApplyPreset = (preset: typeof COMMON_QURAN_PLANS[0]) => {
    setPlanType('quran');
    setQuranMode('pages');
    setStartPage(preset.startPage);
    setEndPage(preset.endPage);
    setDurationDays(preset.suggestedDays);
    setGoalType(preset.goalType);
    setTitle(preset.title);
  };

  const handleCreatePlan = () => {
    const finalTitle = title.trim() || workload.defaultTitle;
    const restDays: number[] = [];
    if (restFriday) restDays.push(5);
    if (restSaturday) restDays.push(6);

    const newPlan = generatePlanSchedule({
      title: finalTitle,
      type: planType,
      goalType,
      materialName: workload.materialName,
      materialDetails: workload.details,
      totalUnits: workload.totalUnits,
      unitType: workload.unitType,
      unitLabel: workload.unitLabel,
      startPoint: workload.startPoint,
      endPoint: workload.endPoint,
      startDate,
      durationDays: calculatedDuration,
      restDaysOfWeek: restDays,
      targetRepetitionsPerDay: targetReps,
      reminderEnabled,
      reminderTime,
      revisionRatio
    });

    onPlanCreated(newPlan);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/70 backdrop-blur-xs overflow-y-auto">
      <div 
        className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl transition-all my-8 text-stone-900 dark:text-stone-100"
        dir="rtl"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-stone-900 dark:text-stone-100">
                إنشاء خطة حفظ أو مراجعة جديدة
              </h2>
              <div className="flex items-center gap-2 text-xs text-stone-500">
                <span>الخطوة {step} من 3</span>
                <span>·</span>
                <span>{step === 1 ? 'تحديد المقرر والهدف' : step === 2 ? 'تفاصيل المادة والكمية' : 'الجدولة والتنبيهات'}</span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Wizard Steps Content */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* STEP 1: Domain & Goal */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-stone-900 dark:text-stone-100 mb-3">
                  1. اختر نوع المقرر المطلوب:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setPlanType('quran')}
                    className={`p-5 rounded-xl border text-right transition-all flex flex-col justify-between ${
                      planType === 'quran'
                        ? 'border-emerald-600 bg-emerald-50/60 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-200 ring-2 ring-emerald-500/20'
                        : 'border-stone-200 dark:border-stone-800 hover:border-stone-300 dark:hover:border-stone-700'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full mb-3">
                      <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 flex items-center justify-center">
                        <BookOpen className="w-5 h-5" />
                      </div>
                      {planType === 'quran' && (
                        <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs">
                          <Check className="w-3.5 h-3.5" />
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="font-bold text-base mb-1">القرآن الكريم</div>
                      <p className="text-xs text-stone-500 dark:text-stone-400">
                        حفظ أو مراجعة بالسور، الصفحات (604 صفحات)، أو الأجزاء (30 جزءاً).
                      </p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPlanType('matn')}
                    className={`p-5 rounded-xl border text-right transition-all flex flex-col justify-between ${
                      planType === 'matn'
                        ? 'border-emerald-600 bg-emerald-50/60 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-200 ring-2 ring-emerald-500/20'
                        : 'border-stone-200 dark:border-stone-800 hover:border-stone-300 dark:hover:border-stone-700'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full mb-3">
                      <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 flex items-center justify-center">
                        <Scroll className="w-5 h-5" />
                      </div>
                      {planType === 'matn' && (
                        <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs">
                          <Check className="w-3.5 h-3.5" />
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="font-bold text-base mb-1">المتون والمنظومات العلمية</div>
                      <p className="text-xs text-stone-500 dark:text-stone-400">
                        مكتبة المتون التراثية (نحو، تجويد، عقيدة، حديث، فقه) أو إضافة متن مخصص.
                      </p>
                    </div>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-stone-900 dark:text-stone-100 mb-3">
                  2. حدد طبيعة الهدف:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => setGoalType('memorization')}
                    className={`p-4 rounded-xl border text-right transition-all ${
                      goalType === 'memorization'
                        ? 'border-emerald-600 bg-emerald-50/60 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-200 ring-1 ring-emerald-500'
                        : 'border-stone-200 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-stone-800/40'
                    }`}
                  >
                    <div className="font-bold text-sm mb-1">حفظ جديد</div>
                    <p className="text-xs text-stone-500">حفظ يومي مركز مع التكرار والترديد لترسيخ الصدر.</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setGoalType('revision')}
                    className={`p-4 rounded-xl border text-right transition-all ${
                      goalType === 'revision'
                        ? 'border-emerald-600 bg-emerald-50/60 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-200 ring-1 ring-emerald-500'
                        : 'border-stone-200 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-stone-800/40'
                    }`}
                  >
                    <div className="font-bold text-sm mb-1">مراجعة وتثبيت</div>
                    <p className="text-xs text-stone-500">تعاهد ما تم حفظه سابقاً ودفع النسيان والتفلت.</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setGoalType('combined')}
                    className={`p-4 rounded-xl border text-right transition-all ${
                      goalType === 'combined'
                        ? 'border-emerald-600 bg-emerald-50/60 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-200 ring-1 ring-emerald-500'
                        : 'border-stone-200 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-stone-800/40'
                    }`}
                  >
                    <div className="font-bold text-sm mb-1">خطة مدمجة (موصى بها)</div>
                    <p className="text-xs text-stone-500">ورد حفظ جديد يومي + ورد مراجعة تراكمية لما سبق.</p>
                  </button>
                </div>
              </div>

              {/* Title input */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">
                  عنوان الخطة (اختياري، سيتم إنشاؤه تلقائياً إن ترك فارغاً):
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={`مثال: ${workload.defaultTitle}`}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 focus:outline-emerald-600"
                />
              </div>
            </div>
          )}

          {/* STEP 2: Material & Workload Details */}
          {step === 2 && (
            <div className="space-y-6">
              {planType === 'quran' ? (
                <div className="space-y-5">
                  {/* Presets vs Custom */}
                  <div className="flex items-center gap-2 p-1 bg-stone-100 dark:bg-stone-800 rounded-xl text-xs font-medium">
                    <button
                      type="button"
                      onClick={() => setQuranMode('preset')}
                      className={`flex-1 py-1.5 rounded-lg transition-colors ${
                        quranMode === 'preset' ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100 shadow-xs' : 'text-stone-500'
                      }`}
                    >
                      خطط قرآنية نموذجية
                    </button>
                    <button
                      type="button"
                      onClick={() => setQuranMode('surahs')}
                      className={`flex-1 py-1.5 rounded-lg transition-colors ${
                        quranMode === 'surahs' ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100 shadow-xs' : 'text-stone-500'
                      }`}
                    >
                      تحديد بالسور
                    </button>
                    <button
                      type="button"
                      onClick={() => setQuranMode('pages')}
                      className={`flex-1 py-1.5 rounded-lg transition-colors ${
                        quranMode === 'pages' ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100 shadow-xs' : 'text-stone-500'
                      }`}
                    >
                      تحديد بالصفحات
                    </button>
                    <button
                      type="button"
                      onClick={() => setQuranMode('juz')}
                      className={`flex-1 py-1.5 rounded-lg transition-colors ${
                        quranMode === 'juz' ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100 shadow-xs' : 'text-stone-500'
                      }`}
                    >
                      تحديد بالأجزاء
                    </button>
                  </div>

                  {/* Mode Content */}
                  {quranMode === 'preset' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {COMMON_QURAN_PLANS.map((preset) => (
                        <div
                          key={preset.id}
                          onClick={() => handleApplyPreset(preset)}
                          className="p-4 rounded-xl border border-stone-200 dark:border-stone-800 hover:border-emerald-500 dark:hover:border-emerald-600 bg-white dark:bg-stone-900 cursor-pointer transition-all"
                        >
                          <div className="font-bold text-sm text-stone-900 dark:text-stone-100 mb-1">
                            {preset.title}
                          </div>
                          <p className="text-xs text-stone-500 line-clamp-2 mb-2">
                            {preset.description}
                          </p>
                          <div className="flex items-center justify-between text-[11px] text-emerald-700 dark:text-emerald-400 font-medium">
                            <span>{preset.totalPages} صفحة</span>
                            <span>{preset.suggestedDays} يوماً مقترحاً</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {quranMode === 'surahs' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">
                          من سورة:
                        </label>
                        <select
                          value={startSurahNum}
                          onChange={(e) => setStartSurahNum(Number(e.target.value))}
                          className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900"
                        >
                          {QURAN_SURAHS.map((s) => (
                            <option key={s.number} value={s.number}>
                              {s.number}. سورة {s.arabicName} ({s.versesCount} آية)
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">
                          إلى سورة:
                        </label>
                        <select
                          value={endSurahNum}
                          onChange={(e) => setEndSurahNum(Number(e.target.value))}
                          className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900"
                        >
                          {QURAN_SURAHS.map((s) => (
                            <option key={s.number} value={s.number}>
                              {s.number}. سورة {s.arabicName} ({s.versesCount} آية)
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}

                  {quranMode === 'pages' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">
                          من صفحة (1 - 604):
                        </label>
                        <input
                          type="number"
                          min={1}
                          max={604}
                          value={startPage}
                          onChange={(e) => setStartPage(Number(e.target.value))}
                          className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">
                          إلى صفحة (1 - 604):
                        </label>
                        <input
                          type="number"
                          min={1}
                          max={604}
                          value={endPage}
                          onChange={(e) => setEndPage(Number(e.target.value))}
                          className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900"
                        />
                      </div>
                    </div>
                  )}

                  {quranMode === 'juz' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">
                          من الجزء (1 - 30):
                        </label>
                        <select
                          value={startJuz}
                          onChange={(e) => setStartJuz(Number(e.target.value))}
                          className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900"
                        >
                          {Object.entries(JUZ_NAMES).map(([num, item]) => (
                            <option key={num} value={num}>
                              {item.label} (ص {item.startPage}-{item.endPage})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">
                          إلى الجزء (1 - 30):
                        </label>
                        <select
                          value={endJuz}
                          onChange={(e) => setEndJuz(Number(e.target.value))}
                          className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900"
                        >
                          {Object.entries(JUZ_NAMES).map(([num, item]) => (
                            <option key={num} value={num}>
                              {item.label} (ص {item.startPage}-{item.endPage})
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* Matn Section */
                <div className="space-y-5">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-stone-900 dark:text-stone-100">
                      اختر المتن العلمي:
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsCustomMatn(!isCustomMatn)}
                      className="text-xs text-emerald-700 dark:text-emerald-400 font-semibold hover:underline"
                    >
                      {isCustomMatn ? '← العودة لمكتبة المتون الجاهزة' : '+ إدخال متن علمي مخصص'}
                    </button>
                  </div>

                  {!isCustomMatn ? (
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-60 overflow-y-auto pr-1">
                        {MATN_LIBRARY.map((item) => (
                          <div
                            key={item.id}
                            onClick={() => {
                              setSelectedMatnId(item.id);
                              if (item.popularDurations[1]) {
                                setDurationDays(item.popularDurations[1].days);
                              }
                            }}
                            className={`p-3.5 rounded-xl border text-right cursor-pointer transition-all ${
                              selectedMatnId === item.id
                                ? 'border-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/30 ring-1 ring-emerald-500'
                                : 'border-stone-200 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-stone-800/40'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-[11px] font-medium text-emerald-700 dark:text-emerald-400">
                                {item.field}
                              </span>
                              <span className="text-[11px] text-stone-500">
                                {item.totalUnits} {item.unitLabel}
                              </span>
                            </div>
                            <div className="font-bold text-xs text-stone-900 dark:text-stone-100 mb-1">
                              {item.title}
                            </div>
                            <div className="text-[11px] text-stone-500">
                              {item.author}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    /* Custom Matn Form */
                    <div className="p-4 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-800/30 space-y-3">
                      <div>
                        <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                          عنوان المتن أو المنظومة:
                        </label>
                        <input
                          type="text"
                          value={customTitle}
                          onChange={(e) => setCustomTitle(e.target.value)}
                          placeholder="مثلاً: لامية ابن تيمية"
                          className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                            اسم الناظم أو المؤلف:
                          </label>
                          <input
                            type="text"
                            value={customAuthor}
                            onChange={(e) => setCustomAuthor(e.target.value)}
                            placeholder="مثلاً: ابن تيمية الحراني"
                            className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                            الفن أو المجال:
                          </label>
                          <input
                            type="text"
                            value={customField}
                            onChange={(e) => setCustomField(e.target.value)}
                            placeholder="مثلاً: عقيدة، فقه، أصول"
                            className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                            العدد الكلي:
                          </label>
                          <input
                            type="number"
                            min={1}
                            value={customUnits}
                            onChange={(e) => setCustomUnits(Number(e.target.value))}
                            className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                            نوع الوحدة:
                          </label>
                          <select
                            value={customUnitType}
                            onChange={(e) => {
                              const val = e.target.value as UnitType;
                              setCustomUnitType(val);
                              if (val === 'line') setCustomUnitLabel('بيت');
                              else if (val === 'chapter') setCustomUnitLabel('باب');
                              else if (val === 'page') setCustomUnitLabel('صفحة');
                              else if (val === 'hadith') setCustomUnitLabel('حديث');
                            }}
                            className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900"
                          >
                            <option value="line">أبيات شعرية</option>
                            <option value="chapter">أبواب وفصول</option>
                            <option value="hadith">أحاديث</option>
                            <option value="page">صفحات</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                            المسمى المفرد:
                          </label>
                          <input
                            type="text"
                            value={customUnitLabel}
                            onChange={(e) => setCustomUnitLabel(e.target.value)}
                            placeholder="بيت / باب / حديث"
                            className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* STEP 3: Scheduling & Reminders */}
          {step === 3 && (
            <div className="space-y-6">
              {/* Method choice: duration vs daily pace */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-stone-700 dark:text-stone-300">
                      طريقة التقسيم والجدولة:
                    </label>
                  </div>
                  <div className="flex items-center gap-2 p-1 bg-stone-100 dark:bg-stone-800 rounded-xl text-xs font-medium">
                    <button
                      type="button"
                      onClick={() => setPacingMethod('duration')}
                      className={`flex-1 py-1.5 rounded-lg transition-colors ${
                        pacingMethod === 'duration' ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100 shadow-xs' : 'text-stone-500'
                      }`}
                    >
                      تحديد مدة الإنجاز (أيام)
                    </button>
                    <button
                      type="button"
                      onClick={() => setPacingMethod('daily_amount')}
                      className={`flex-1 py-1.5 rounded-lg transition-colors ${
                        pacingMethod === 'daily_amount' ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100 shadow-xs' : 'text-stone-500'
                      }`}
                    >
                      تحديد المقدار اليومي
                    </button>
                  </div>

                  {pacingMethod === 'duration' ? (
                    <div>
                      <label className="block text-xs text-stone-500 mb-1">
                        مدة الإنجاز بالكامل (بالأيام):
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={730}
                        value={durationDays}
                        onChange={(e) => setDurationDays(Number(e.target.value))}
                        className="w-full px-3 py-2 text-sm rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900"
                      />
                      <div className="flex items-center gap-1.5 mt-2">
                        {[7, 14, 21, 30, 60, 90].map((d) => (
                          <button
                            key={d}
                            type="button"
                            onClick={() => setDurationDays(d)}
                            className="px-2 py-0.5 text-[11px] rounded bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-200"
                          >
                            {d} يوم
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div>
                      <label className="block text-xs text-stone-500 mb-1">
                        المقدار اليومي المستهدف ({workload.unitLabel}):
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={100}
                        value={dailyAmountInput}
                        onChange={(e) => setDailyAmountInput(Number(e.target.value))}
                        className="w-full px-3 py-2 text-sm rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900"
                      />
                      <p className="text-[11px] text-stone-500 mt-1">
                        المدة المحسوبة المقدرة: ~{calculatedDuration} يوماً.
                      </p>
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                      تاريخ بدء الخطة:
                    </label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full px-3 py-2 text-sm rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900"
                    />
                  </div>

                  {/* Rest & Review Days */}
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">
                      أيام التثبيت والمراجعة الأسبوعية (بلا حفظ جديد):
                    </label>
                    <div className="flex items-center gap-4 text-xs">
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={restFriday}
                          onChange={(e) => setRestFriday(e.target.checked)}
                          className="rounded text-emerald-600 focus:ring-emerald-500"
                        />
                        <span>يوم الجمعة (مستحسن)</span>
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={restSaturday}
                          onChange={(e) => setRestSaturday(e.target.checked)}
                          className="rounded text-emerald-600 focus:ring-emerald-500"
                        />
                        <span>يوم السبت</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Repetitions & Reminders */}
              <div className="p-4 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-800/20 grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    هدف التكرار اليومي:
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={targetReps}
                    onChange={(e) => setTargetReps(Number(e.target.value))}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900"
                  />
                  <p className="text-[10px] text-stone-500 mt-1">تكرار الحفظ من 20 إلى 40 مرة</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    كثافة المراجعة التراكمية:
                  </label>
                  <select
                    value={revisionRatio}
                    onChange={(e) => setRevisionRatio(e.target.value as 'none' | 'light' | 'moderate' | 'intensive')}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900"
                  >
                    <option value="none">بدون مراجعة تراكمية</option>
                    <option value="light">خفيفة (آخر 3 أيام)</option>
                    <option value="moderate">معتدلة (آخر 5 أيام + مراجعة أسبوعية)</option>
                    <option value="intensive">مكثفة (آخر 10 أيام)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    تنبيه المتابعة اليومي:
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="time"
                      value={reminderTime}
                      onChange={(e) => setReminderTime(e.target.value)}
                      disabled={!reminderEnabled}
                      className="px-2.5 py-1.5 text-xs rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 disabled:opacity-50"
                    />
                    <label className="flex items-center gap-1 text-[11px] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={reminderEnabled}
                        onChange={(e) => setReminderEnabled(e.target.checked)}
                      />
                      <span>تفعيل</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Final Summary Card */}
              <div className="p-4 rounded-xl border border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/30">
                <div className="font-bold text-xs text-emerald-900 dark:text-emerald-200 mb-1 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  <span>ملخص الخطة المقترحة:</span>
                </div>
                <div className="text-xs text-stone-700 dark:text-stone-300 space-y-1">
                  <div>
                    <strong>المقرر:</strong> {workload.materialName} ({workload.totalUnits} {workload.unitLabel})
                  </div>
                  <div>
                    <strong>المدة الكلية:</strong> {calculatedDuration} يوماً · تاريخ البدء: {startDate}
                  </div>
                  <div>
                    <strong>معدل الإنجاز اليومي:</strong> حوالي{' '}
                    {(workload.totalUnits / Math.max(1, calculatedDuration * 0.85)).toFixed(1)}{' '}
                    {workload.unitLabel} في الأيام الفعلية.
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900/50">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-800 rounded-lg transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
              <span>السابق</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-stone-600 hover:text-stone-900 dark:hover:text-stone-200"
            >
              إلغاء
            </button>
          )}

          {step < 3 ? (
            <button
              type="button"
              onClick={() => setStep(step + 1)}
              className="flex items-center gap-1.5 px-5 py-2 text-xs font-medium text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-sm transition-all"
            >
              <span>التالي</span>
              <ChevronLeft className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleCreatePlan}
              className="flex items-center gap-2 px-6 py-2 text-xs font-medium text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-md transition-all"
            >
              <Check className="w-4 h-4" />
              <span>اعتماد وإنشاء الخطة المباركة</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
