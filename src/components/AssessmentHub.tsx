import React, { useState, useMemo } from 'react';
import { Plan, QuizQuestion } from '../types';
import { calculatePlanStats } from '../utils/scheduler';
import { 
  Award, CheckCircle, Star, Sparkles, BookOpen, 
  HelpCircle, Printer, ArrowRight, RotateCcw, AlertTriangle, ShieldCheck
} from 'lucide-react';

interface Props {
  plan: Plan;
  studentName: string;
  onUpdateStudentName: (name: string) => void;
}

export const AssessmentHub: React.FC<Props> = ({
  plan,
  studentName,
  onUpdateStudentName
}) => {
  const [activeTab, setActiveTab] = useState<'analytics' | 'quiz' | 'certificate' | 'difficult_spots'>('analytics');
  
  // Quiz state
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [quizScore, setQuizScore] = useState<number>(0);
  const [showAnswer, setShowAnswer] = useState<boolean>(false);
  const [quizFinished, setQuizFinished] = useState<boolean>(false);

  const stats = useMemo(() => calculatePlanStats(plan), [plan]);

  // Aggregate evaluations
  const evaluationsBreakdown = useMemo(() => {
    let excellent = 0;
    let veryGood = 0;
    let good = 0;
    let needsRevision = 0;

    plan.tasks.forEach(t => {
      if (t.evaluation) {
        if (t.evaluation.stars === 5) excellent++;
        else if (t.evaluation.stars === 4) veryGood++;
        else if (t.evaluation.stars === 3) good++;
        else needsRevision++;
      }
    });

    const totalEvaluated = excellent + veryGood + good + needsRevision;

    return {
      excellent,
      veryGood,
      good,
      needsRevision,
      totalEvaluated
    };
  }, [plan]);

  // Difficult spots notebook
  const loggedDifficultSpots = useMemo(() => {
    const spots: { day: number; date: string; content: string }[] = [];
    plan.tasks.forEach(t => {
      if (t.evaluation?.difficultSpots && t.evaluation.difficultSpots.length > 0) {
        t.evaluation.difficultSpots.forEach(spot => {
          if (spot.trim()) {
            spots.push({
              day: taskDayNumber(t),
              date: t.date,
              content: spot
            });
          }
        });
      }
    });
    return spots;
  }, [plan]);

  function taskDayNumber(t: { dayNumber: number }) {
    return t.dayNumber;
  }

  // Generate contextual quiz questions based on the plan material
  const quizQuestions: QuizQuestion[] = useMemo(() => {
    if (plan.materialName.includes('تحفة الأطفال')) {
      return [
        {
          id: 'q1',
          prompt: 'أكمل قول الناظم رحمه الله: "لِلنُّونِ إِنْ تَسْكُنْ وَلِلتَّنْوِينِ ..."',
          context: 'باب أحكام النون الساكنة والتنوين',
          options: [
            'أَرْبَعُ أَحْكَامٍ فَخُذْ تَبْيِينِي',
            'خَمْسَةُ أَحْكَامٍ لِكُلِّ بَيَانِ',
            'أَحْكَامُ صِدْقٍ بَيَّنَهَا يَقِينِي',
            'ثَلاَثَةُ أَحْكَامٍ بِلَا تَبْيِينِ'
          ],
          correctAnswer: 'أَرْبَعُ أَحْكَامٍ فَخُذْ تَبْيِينِي',
          explanation: 'البيت الأول من أحكام النون الساكنة والتنوين وفيه بيان أن أحكامها أربعة: الإظهار، والإدغام، والإقلاب، والإخفاء.',
          type: 'multiple_choice'
        },
        {
          id: 'q2',
          prompt: 'ما هي حروف الإظهار الحلقي الستة في تحفة الأطفال؟',
          context: 'حكم الإظهار الحلقي',
          options: [
            'هَمْزٌ فَهَاءٌ ثُمَّ عَيْنٌ حَاءُ مُهْمَلَتَانِ ثُمَّ غَيْنٌ خَاءُ',
            'يَرْمُلُونَ فِي كُلِّ فَنٍّ وَمَغْنَى',
            'قُطْبُ جَدٍّ وَكُلُّ حَرْفٍ جَلِيّ',
            'صِفْ ذَا ثَنَا كَمْ جَادَ شَخْصٌ قَدْ سَمَا'
          ],
          correctAnswer: 'هَمْزٌ فَهَاءٌ ثُمَّ عَيْنٌ حَاءُ مُهْمَلَتَانِ ثُمَّ غَيْنٌ خَاءُ',
          explanation: 'تخرج هذه الحروف الستة من الحلق وتظهر النون عندها وجوباً.',
          type: 'multiple_choice'
        },
        {
          id: 'q3',
          prompt: 'أكمل الشطر: "وَالثَّانِ إِدْغَامٌ بِسِتَّةٍ أَتَتْ ..."',
          context: 'باب الإدغام',
          options: [
            'فِي يَرْمُلُونَ عِنْدَهُمْ قَدْ ثَبَتَتْ',
            'فِي حُرُوفِ الْحَلْقِ كَمَا وَرَدَتْ',
            'عِنْدَ الْقُرَّاءِ جَمِيعاً ظَهَرَتْ',
            'بِغُنَّةٍ أَوْ دُونِهَا انْتَشَرَتْ'
          ],
          correctAnswer: 'فِي يَرْمُلُونَ عِنْدَهُمْ قَدْ ثَبَتَتْ',
          explanation: 'حروف الإدغام مجموعة في لفظ: يرملون.',
          type: 'multiple_choice'
        }
      ];
    } else if (plan.materialName.includes('الآجرومية') || plan.materialName.includes('نحو')) {
      return [
        {
          id: 'q1',
          prompt: 'ما هو تعريف الكلام عند ابن آجروم في مطلع الآجرومية؟',
          context: 'باب الكلام',
          options: [
            'هُوَ اللَّفْظُ الْمُرَكَّبُ الْمُفِيدُ بِالْوَضْعِ',
            'هُوَ الصَّوْتُ الْمُشْتَمِلُ عَلَى بَعْضِ الْحُرُوفِ',
            'كُلُّ جُمْلَةٍ فِيهَا مُبْتَدَأٌ وَخَبَرٌ',
            'مَا يَحْسُنُ سُكُوتُ الْمُتَكَلِّمِ عَلَيْهِ فَقَطْ'
          ],
          correctAnswer: 'هُوَ اللَّفْظُ الْمُرَكَّبُ الْمُفِيدُ بِالْوَضْعِ',
          explanation: 'اشترط النحاة في الكلام أربعة قيود: اللفظ، والتركيب، والإفادة، والوضع العربي.',
          type: 'multiple_choice'
        },
        {
          id: 'q2',
          prompt: 'ما هي أقسام الكلام الثلاثة؟',
          context: 'أقسام الكلام',
          options: [
            'اسْمٌ، وَفِعْلٌ، وَحَرْفٌ جَاءَ لِمَعْنًى',
            'مُعْرَبٌ، وَمَبْنِيٌّ، وَمُشَبَّهٌ',
            'مَاضٍ، وَمُضَارِعٌ، وَأَمْرٌ',
            'مَرْفُوعٌ، وَمَنْصُوبٌ، وَمَجْرُورٌ'
          ],
          correctAnswer: 'اسْمٌ، وَفِعْلٌ، وَحَرْفٌ جَاءَ لِمَعْنًى',
          explanation: 'قال ابن آجروم: "وأقسامه ثلاثة: اسم وفعل وحرف جاء لمعنى".',
          type: 'multiple_choice'
        }
      ];
    } else {
      // General Quran & Review Questions
      return [
        {
          id: 'q1',
          prompt: 'قال تعالى في سورة النبأ: "عَمَّ يَتَسَاءَلُونَ * عَنِ النَّبَإِ الْعَظِيمِ * الَّذِي هُمْ فِيهِ ..."',
          context: 'سورة النبأ (الآية 3)',
          options: [
            'مُخْتَلِفُونَ',
            'يَمْتَرُونَ',
            'يُكَذِّبُونَ',
            'غَافِلُونَ'
          ],
          correctAnswer: 'مُخْتَلِفُونَ',
          explanation: 'الآية الكريمة: {الَّذِي هُمْ فِيهِ مُخْتَلِفُونَ * كَلَّا سَيَعْلَمُونَ}.',
          type: 'multiple_choice'
        },
        {
          id: 'q2',
          prompt: 'في سورة النازعات، ما الآية التي تلي قوله تعالى: "أَأَنْتُمْ أَشَدُّ خَلْقًا أَمِ السَّمَاءُ"؟',
          context: 'سورة النازعات (الآية 28)',
          options: [
            'بَنَاهَا * رَفَعَ سَمْكَهَا فَسَوَّاهَا',
            'وَالْأَرْضَ بَعْدَ ذَلِكَ دَحَاهَا',
            'وَأَغْطَشَ لَيْلَهَا وَأَخْرَجَ ضُحَاهَا',
            'مَتَاعًا لَكُمْ وَلِأَنْعَامِكُمْ'
          ],
          correctAnswer: 'بَنَاهَا * رَفَعَ سَمْكَهَا فَسَوَّاهَا',
          explanation: 'قوله تعالى: {أَأَنْتُمْ أَشَدُّ خَلْقًا أَمِ السَّمَاءُ بَنَاهَا * رَفَعَ سَمْكَهَا فَسَوَّاهَا}.',
          type: 'multiple_choice'
        },
        {
          id: 'q3',
          prompt: 'ما هي السورة التي بدأت بالقسم: "وَالشَّمْسِ وَضُحَاهَا"؟',
          context: 'جزء عمّ',
          options: [
            'سورة الشمس',
            'سورة الفجر',
            'سورة الليل',
            'سورة البلد'
          ],
          correctAnswer: 'سورة الشمس',
          explanation: 'سورة الشمس وهي خمس عشرة آية.',
          type: 'multiple_choice'
        }
      ];
    }
  }, [plan]);

  const handleSelectOption = (option: string) => {
    if (showAnswer) return;
    setSelectedOption(option);
    setShowAnswer(true);
    if (option === quizQuestions[currentQuestionIndex].correctAnswer) {
      setQuizScore(prev => prev + 1);
    }
  };

  const handleNextQuestion = () => {
    setSelectedOption(null);
    setShowAnswer(false);
    if (currentQuestionIndex + 1 < quizQuestions.length) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      setQuizFinished(true);
    }
  };

  const handleResetQuiz = () => {
    setCurrentQuestionIndex(0);
    setSelectedOption(null);
    setShowAnswer(false);
    setQuizScore(0);
    setQuizFinished(false);
  };

  const handlePrintCertificate = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-stone-200 dark:border-stone-800 pb-3 no-print">
        <button
          onClick={() => setActiveTab('analytics')}
          className={`flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl transition-all ${
            activeTab === 'analytics'
              ? 'bg-emerald-700 text-white shadow-xs'
              : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800'
          }`}
        >
          <Award className="w-4 h-4" />
          <span>مؤشرات الإتقان والتقييم</span>
        </button>

        <button
          onClick={() => setActiveTab('quiz')}
          className={`flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl transition-all ${
            activeTab === 'quiz'
              ? 'bg-emerald-700 text-white shadow-xs'
              : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800'
          }`}
        >
          <HelpCircle className="w-4 h-4" />
          <span>اختبار التسميع والتذكر</span>
        </button>

        <button
          onClick={() => setActiveTab('difficult_spots')}
          className={`flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl transition-all ${
            activeTab === 'difficult_spots'
              ? 'bg-emerald-700 text-white shadow-xs'
              : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800'
          }`}
        >
          <AlertTriangle className="w-4 h-4" />
          <span>دفتر المتشابهات والتفلت ({loggedDifficultSpots.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('certificate')}
          className={`flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl transition-all ${
            activeTab === 'certificate'
              ? 'bg-emerald-700 text-white shadow-xs'
              : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>شهادة إتمام المقرر</span>
        </button>
      </div>

      {/* TAB 1: ANALYTICS & MASTERY BREAKDOWN */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Overall Retention Rating */}
            <div className="p-6 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-xs flex flex-col justify-between">
              <div>
                <span className="text-xs font-semibold text-stone-500 block mb-1">
                  مؤشر الإتقان العام للمقرر
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-extrabold font-mono tabular-nums text-emerald-700 dark:text-emerald-400">
                    {stats?.avgStars}
                  </span>
                  <span className="text-sm text-stone-400">/ 5.0</span>
                </div>
              </div>
              <div className="pt-4 border-t border-stone-100 dark:border-stone-800 mt-4 text-xs text-stone-500">
                مبني على تقييمات الجلسات اليومية وتكرار المحفوظ.
              </div>
            </div>

            {/* Streak & Consistency */}
            <div className="p-6 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-xs flex flex-col justify-between">
              <div>
                <span className="text-xs font-semibold text-stone-500 block mb-1">
                  تتابع الالتزام (Current Streak)
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-extrabold font-mono tabular-nums text-amber-600 dark:text-amber-400">
                    {stats?.streak}
                  </span>
                  <span className="text-sm text-stone-500">يوماً متتالياً</span>
                </div>
              </div>
              <div className="pt-4 border-t border-stone-100 dark:border-stone-800 mt-4 text-xs text-stone-500">
                «أحب الأعمال إلى الله أدومها وإن قل».
              </div>
            </div>

            {/* Total Study Minutes & Repetitions */}
            <div className="p-6 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-xs flex flex-col justify-between">
              <div>
                <span className="text-xs font-semibold text-stone-500 block mb-1">
                  إجمالي الجهد المبذول
                </span>
                <div className="text-xl font-bold text-stone-900 dark:text-stone-100">
                  {stats?.totalMinutes} دقيقة · {stats?.totalReps} تكرار
                </div>
              </div>
              <div className="pt-4 border-t border-stone-100 dark:border-stone-800 mt-4 text-xs text-stone-500">
                ساعات مباركة في تحصيل العلم وحفظ كتاب الله.
              </div>
            </div>
          </div>

          {/* Qualitative Ratings Breakdown */}
          <div className="p-6 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <span>توزيع تقييمات الجودة والإتقان:</span>
            </h3>

            <div className="space-y-3">
              {/* Excellent */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-semibold text-emerald-800 dark:text-emerald-300">
                    ممتاز (حفظ متقن كالفاتحة)
                  </span>
                  <span className="font-mono tabular-nums text-stone-600 dark:text-stone-400">
                    {evaluationsBreakdown.excellent} يوم
                  </span>
                </div>
                <div className="w-full h-2.5 bg-stone-100 dark:bg-stone-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-emerald-600 rounded-full transition-all"
                    style={{
                      width: `${evaluationsBreakdown.totalEvaluated > 0 
                        ? (evaluationsBreakdown.excellent / evaluationsBreakdown.totalEvaluated) * 100 
                        : 0}%`
                    }}
                  />
                </div>
              </div>

              {/* Very Good */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-semibold text-blue-800 dark:text-blue-300">
                    جيد جداً (تردد يسير)
                  </span>
                  <span className="font-mono tabular-nums text-stone-600 dark:text-stone-400">
                    {evaluationsBreakdown.veryGood} يوم
                  </span>
                </div>
                <div className="w-full h-2.5 bg-stone-100 dark:bg-stone-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-600 rounded-full transition-all"
                    style={{
                      width: `${evaluationsBreakdown.totalEvaluated > 0 
                        ? (evaluationsBreakdown.veryGood / evaluationsBreakdown.totalEvaluated) * 100 
                        : 0}%`
                    }}
                  />
                </div>
              </div>

              {/* Good */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-semibold text-amber-800 dark:text-amber-300">
                    جيد (يحتاج تثبيتاً في المراجعة القادمة)
                  </span>
                  <span className="font-mono tabular-nums text-stone-600 dark:text-stone-400">
                    {evaluationsBreakdown.good} يوم
                  </span>
                </div>
                <div className="w-full h-2.5 bg-stone-100 dark:bg-stone-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-amber-500 rounded-full transition-all"
                    style={{
                      width: `${evaluationsBreakdown.totalEvaluated > 0 
                        ? (evaluationsBreakdown.good / evaluationsBreakdown.totalEvaluated) * 100 
                        : 0}%`
                    }}
                  />
                </div>
              </div>

              {/* Needs Revision */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-semibold text-red-800 dark:text-red-300">
                    بحاجة لتكثيف التكرار
                  </span>
                  <span className="font-mono tabular-nums text-stone-600 dark:text-stone-400">
                    {evaluationsBreakdown.needsRevision} يوم
                  </span>
                </div>
                <div className="w-full h-2.5 bg-stone-100 dark:bg-stone-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-red-500 rounded-full transition-all"
                    style={{
                      width: `${evaluationsBreakdown.totalEvaluated > 0 
                        ? (evaluationsBreakdown.needsRevision / evaluationsBreakdown.totalEvaluated) * 100 
                        : 0}%`
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: INTERACTIVE QUIZ (اختبار التسميع والتذكر) */}
      {activeTab === 'quiz' && (
        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-6 sm:p-8 shadow-xs max-w-4xl mx-auto w-full">
          {!quizFinished ? (
            <div className="space-y-6">
              <div className="flex items-center justify-between text-xs text-stone-500 border-b border-stone-100 dark:border-stone-800 pb-3">
                <span>السؤال {currentQuestionIndex + 1} من {quizQuestions.length}</span>
                <span className="font-mono tabular-nums">النتيجة الحالية: {quizScore}</span>
              </div>

              <div>
                <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 block mb-1">
                  {quizQuestions[currentQuestionIndex].context}
                </span>
                <h3 className="text-base font-bold text-stone-900 dark:text-stone-100 font-amiri leading-relaxed">
                  {quizQuestions[currentQuestionIndex].prompt}
                </h3>
              </div>

              {/* Options */}
              <div className="space-y-2.5">
                {quizQuestions[currentQuestionIndex].options?.map((option, idx) => {
                  const isCorrect = option === quizQuestions[currentQuestionIndex].correctAnswer;
                  const isSelected = selectedOption === option;

                  let btnStyle = 'border-stone-200 dark:border-stone-800 hover:border-stone-300 dark:hover:border-stone-700 bg-white dark:bg-stone-900 text-stone-800 dark:text-stone-200';
                  if (showAnswer) {
                    if (isCorrect) {
                      btnStyle = 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 font-bold';
                    } else if (isSelected) {
                      btnStyle = 'border-red-500 bg-red-50 dark:bg-red-950/40 text-red-900 dark:text-red-200';
                    }
                  }

                  return (
                    <button
                      key={idx}
                      type="button"
                      disabled={showAnswer}
                      onClick={() => handleSelectOption(option)}
                      className={`w-full p-4 rounded-xl border text-right text-xs transition-all flex items-center justify-between ${btnStyle}`}
                    >
                      <span className="font-amiri text-sm">{option}</span>
                      {showAnswer && isCorrect && (
                        <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Explanation & Next */}
              {showAnswer && (
                <div className="p-4 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 space-y-3">
                  <div className="text-xs text-stone-700 dark:text-stone-300">
                    <strong>الإيضاح:</strong> {quizQuestions[currentQuestionIndex].explanation}
                  </div>
                  <div className="flex justify-end">
                    <button
                      onClick={handleNextQuestion}
                      className="px-5 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl transition-colors"
                    >
                      {currentQuestionIndex + 1 < quizQuestions.length ? 'السؤال التالي ←' : 'عرض النتيجة النهائية'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center mx-auto">
                <Award className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-stone-900 dark:text-stone-100">
                اكتمل الاختبار المبارك!
              </h3>
              <p className="text-sm text-stone-600 dark:text-stone-400">
                أحسنت! نتيجتك هي {quizScore} من {quizQuestions.length}
              </p>
              <div className="pt-4">
                <button
                  onClick={handleResetQuiz}
                  className="px-6 py-2.5 text-xs font-medium bg-emerald-700 text-white rounded-xl hover:bg-emerald-800 transition-colors"
                >
                  إعادة الاختبار لتثبيت الذاكرة
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: DIFFICULT SPOTS NOTEBOOK */}
      {activeTab === 'difficult_spots' && (
        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-6 shadow-xs">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <span>دفتر المتشابهات ومواضع التردد الموثقة:</span>
            </h3>
            <p className="text-xs text-stone-500 mt-0.5">
              جميع الآيات والأبيات التي قيدتها أثناء جلسات الترديد للتركيز عليها وتفادي الخطأ فيها مستقبلاً.
            </p>
          </div>

          {loggedDifficultSpots.length === 0 ? (
            <div className="p-8 text-center text-xs text-stone-500 border border-dashed border-stone-200 dark:border-stone-800 rounded-xl">
              لم تسجل أي مواضع تردد حتى الآن. يمكنك تدوين أي آية متشابهة أو بيت شعر صعب أثناء جلسة الورد اليومي.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {loggedDifficultSpots.map((spot, idx) => (
                <div 
                  key={idx}
                  className="p-3.5 rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/40 dark:bg-amber-950/20"
                >
                  <div className="flex items-center justify-between text-[11px] text-amber-800 dark:text-amber-300 font-semibold mb-1">
                    <span>اليوم {spot.day}</span>
                    <span className="font-mono text-stone-400">{spot.date}</span>
                  </div>
                  <div className="text-xs text-stone-900 dark:text-stone-100 font-medium">
                    «{spot.content}»
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: CERTIFICATE OF COMPLETION (شهادة الإتمام والإجازة) */}
      {activeTab === 'certificate' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between no-print">
            <div className="flex items-center gap-3">
              <label className="text-xs font-semibold text-stone-700 dark:text-stone-300">
                اسم الطالب في الشهادة:
              </label>
              <input
                type="text"
                value={studentName}
                onChange={(e) => onUpdateStudentName(e.target.value)}
                className="px-3 py-1.5 text-xs rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900"
              />
            </div>

            <button
              onClick={handlePrintCertificate}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl transition-colors shadow-sm"
            >
              <Printer className="w-4 h-4" />
              <span>طباعة الشهادة الرسمية</span>
            </button>
          </div>

          {/* Certificate Printable Canvas */}
          <div className="p-8 sm:p-12 rounded-3xl bg-[#fdfcf7] dark:bg-stone-900 border-8 border-double border-emerald-800 dark:border-emerald-700 shadow-xl text-stone-900 dark:text-stone-100 text-center relative overflow-hidden">
            {/* Watermark / Calligraphic Title */}
            <div className="text-xs text-emerald-800 dark:text-emerald-400 font-bold uppercase tracking-widest mb-2">
              بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
            </div>

            <h2 className="text-3xl sm:text-4xl font-extrabold font-amiri text-emerald-950 dark:text-emerald-200 my-4">
              شَهَادَةُ إِتْمَامٍ وَإِتْقَانِ مُقَرَّر
            </h2>

            <div className="max-w-xl mx-auto space-y-4 my-6 text-sm leading-relaxed">
              <p className="text-stone-600 dark:text-stone-300">
                تَشْهَدُ مِنَصَّةُ «تِبْيَان» بِأَنَّ الطَّالِبَ الْمُبَارَك:
              </p>

              <div className="text-2xl sm:text-3xl font-bold font-amiri text-stone-900 dark:text-white underline decoration-emerald-600 decoration-2 underline-offset-8 py-1">
                {studentName || 'طالب العلم المبارك'}
              </div>

              <p className="text-stone-600 dark:text-stone-300 pt-2">
                قَدْ أَتَمَّ بِحَمْدِ اللَّهِ وَتَوْفِيقِهِ حِفْظَ وَمُرَاجَعَةَ مُقَرَّر:
              </p>

              <div className="text-xl sm:text-2xl font-bold font-amiri text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 py-2.5 px-6 rounded-2xl inline-block border border-emerald-200 dark:border-emerald-900">
                {plan.materialName} ({plan.title})
              </div>

              <p className="text-xs text-stone-500 pt-2">
                بِإِجْمَالِي {plan.totalUnits} {plan.unitLabel}، عَلَى مَدَارِ {plan.durationDays} يَوْمًا، وَبِمُعَدَّلِ تَقْيِيمِ إِتْقَان: 
                <strong className="text-emerald-700 dark:text-emerald-400 mr-1 font-bold">
                  {stats?.avgStars} مِنْ 5.0 (تَقْدِير: {stats?.avgStars && stats.avgStars >= 4.5 ? 'مُمْتَازٌ مُرْتَفِع' : 'جَيِّدٌ جِدًّا'})
                </strong>.
              </p>
            </div>

            {/* Footer Signature strip */}
            <div className="grid grid-cols-2 gap-8 pt-8 mt-6 border-t border-emerald-200 dark:border-emerald-800/80 text-xs text-stone-500">
              <div>
                <span>تاريخ الختم والإنجاز:</span>
                <div className="font-mono font-bold text-stone-800 dark:text-stone-200 mt-1">
                  {new Date().toISOString().split('T')[0]}
                </div>
              </div>
              <div>
                <span>الاعتماد والتوثيق:</span>
                <div className="font-amiri font-bold text-emerald-800 dark:text-emerald-300 mt-1 text-sm">
                  منصة تبيان لخطط القرآن والمتون العلمية
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
