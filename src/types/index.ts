export type PlanType = 'quran' | 'matn';

export type GoalType = 'memorization' | 'revision' | 'combined';

export type QuranSelectionType = 'pages' | 'juz' | 'surahs' | 'custom_range';

export type UnitType = 'page' | 'ayah' | 'surah' | 'juz' | 'line' | 'chapter' | 'hadith' | 'lesson';

export type EvaluationGrade = 'excellent' | 'very_good' | 'good' | 'needs_revision' | 'unaccomplished';

export interface DailyTask {
  id: string;
  dayNumber: number; // 1, 2, 3...
  date: string; // YYYY-MM-DD
  dayName: string; // الأحد, الإثنين...
  isRestDay: boolean;
  
  // Portions
  newMemorization?: {
    title: string;
    description: string;
    from: string;
    to: string;
    amount: number;
    unit: string;
  };
  
  revisionPortion?: {
    title: string;
    description: string;
    from: string;
    to: string;
    amount: number;
    unit: string;
  };

  // Execution & Evaluation
  status: 'pending' | 'completed' | 'partial' | 'skipped';
  completedAt?: string;
  repetitionsDone: number;
  repetitionsTarget: number;
  timeSpentMinutes: number;
  evaluation?: {
    grade: EvaluationGrade;
    stars: number; // 1-5
    notes?: string;
    difficultSpots?: string[]; // المتشابهات أو مواضع التردد
  };
}

export interface Plan {
  id: string;
  title: string;
  type: PlanType;
  goalType: GoalType;
  category?: string; // نحو، تجويد، عقيدة، قرآن...
  materialName: string; // مثلاً: تحفة الأطفال، القرآن الكريم، الآجرومية
  materialDetails?: string; // تفاصيل المقرر
  
  // Total workload
  totalUnits: number;
  unitType: UnitType;
  unitLabel: string; // أبيات، صفحات، سور...
  startPoint: string; // مثلاً: من البيت 1 أو من سورة البقرة
  endPoint: string;   // مثلاً: إلى البيت 61 أو إلى سورة الناس

  // Time parameters
  startDate: string; // YYYY-MM-DD
  targetEndDate: string; // YYYY-MM-DD
  durationDays: number;
  restDaysOfWeek: number[]; // 0: Sunday, 5: Friday, 6: Saturday
  
  // Settings
  targetRepetitionsPerDay: number;
  reminderEnabled: boolean;
  reminderTime: string; // "06:30"
  revisionRatio: 'none' | 'light' | 'moderate' | 'intensive'; // نسبة المراجعة مع الحفظ
  
  // Daily schedule
  tasks: DailyTask[];
  
  // Timestamps
  createdAt: string;
  updatedAt: string;
}

export interface MatnLibraryItem {
  id: string;
  title: string;
  author: string;
  field: 'تجويد وقراءات' | 'نحو وصرف' | 'عقيدة وتوحيد' | 'حديث ومصطلح' | 'فقه وأصول' | 'سيرة وآداب';
  totalUnits: number;
  unitType: UnitType;
  unitLabel: string;
  description: string;
  popularDurations: { days: number; label: string }[];
  sampleExcerpt?: string;
  chaptersCount?: number;
}

export interface QuranSurah {
  number: number;
  name: string;
  arabicName: string;
  versesCount: number;
  startPage: number;
  endPage: number;
  juzNumber: number;
  revelationType: 'مكية' | 'مدنية';
}

export interface QuizQuestion {
  id: string;
  prompt: string;
  context: string;
  options?: string[];
  correctAnswer: string;
  explanation?: string;
  type: 'fill_blank' | 'multiple_choice' | 'next_line';
}
