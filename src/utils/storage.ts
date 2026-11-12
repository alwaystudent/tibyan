import { Plan } from '../types';
import { generatePlanSchedule } from './scheduler';

const STORAGE_KEY_PLANS = 'tibyan_plans_v1';
const STORAGE_KEY_ACTIVE_PLAN = 'tibyan_active_plan_id_v1';
const STORAGE_KEY_SETTINGS = 'tibyan_user_settings_v1';

export interface UserSettings {
  studentName: string;
  theme: 'light' | 'dark' | 'system';
  preferredReminderTime: string;
  soundEnabled: boolean;
  defaultRepetitions: number;
}

export const DEFAULT_SETTINGS: UserSettings = {
  studentName: 'طالب العلم المبارك',
  theme: 'system',
  preferredReminderTime: '06:00',
  soundEnabled: true,
  defaultRepetitions: 20
};

export function loadPlans(): Plan[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PLANS);
    if (!raw) {
      const initialPlans = createStarterPlans();
      savePlans(initialPlans);
      return initialPlans;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : createStarterPlans();
  } catch (e) {
    console.error('Failed to load plans from storage:', e);
    return createStarterPlans();
  }
}

export function savePlans(plans: Plan[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_PLANS, JSON.stringify(plans));
  } catch (e) {
    console.error('Failed to save plans:', e);
  }
}

export function loadActivePlanId(plans: Plan[]): string {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_ACTIVE_PLAN);
    if (saved && plans.some(p => p.id === saved)) {
      return saved;
    }
  } catch (e) {
    console.error(e);
  }
  return plans.length > 0 ? plans[0].id : '';
}

export function saveActivePlanId(id: string): void {
  try {
    localStorage.setItem(STORAGE_KEY_ACTIVE_PLAN, id);
  } catch (e) {
    console.error(e);
  }
}

export function loadSettings(): UserSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SETTINGS);
    if (raw) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
    }
  } catch (e) {
    console.error(e);
  }
  return DEFAULT_SETTINGS;
}

export function saveSettings(settings: UserSettings): void {
  try {
    localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));
  } catch (e) {
    console.error(e);
  }
}

export function createStarterPlans(): Plan[] {
  const today = new Date().toISOString().split('T')[0];

  // Starter Plan 1: تحفة الأطفال في التجويد
  const tuhfahPlan = generatePlanSchedule({
    title: 'خطة إتقان تحفة الأطفال في التجويد',
    type: 'matn',
    goalType: 'combined',
    category: 'تجويد وقراءات',
    materialName: 'تحفة الأطفال والغلمان',
    materialDetails: 'منظومة الجمزوري في أحكام النون والميم والمدود (61 بيتاً)',
    totalUnits: 61,
    unitType: 'line',
    unitLabel: 'بيت',
    startPoint: 'البيت 1 (المقدمة)',
    endPoint: 'البيت 61 (الخاتمة)',
    startDate: today,
    durationDays: 14,
    restDaysOfWeek: [5], // Friday is review/rest
    targetRepetitionsPerDay: 20,
    reminderEnabled: true,
    reminderTime: '06:00',
    revisionRatio: 'moderate'
  });

  // Mark Day 1 as completed with high rating for good initial showcase
  if (tuhfahPlan.tasks.length > 0) {
    tuhfahPlan.tasks[0].status = 'completed';
    tuhfahPlan.tasks[0].repetitionsDone = 20;
    tuhfahPlan.tasks[0].timeSpentMinutes = 25;
    tuhfahPlan.tasks[0].completedAt = new Date().toISOString();
    tuhfahPlan.tasks[0].evaluation = {
      grade: 'excellent',
      stars: 5,
      notes: 'تم استحضار الأبيات بسلاسة وربطها بالمقدمة.'
    };
  }

  // Starter Plan 2: مراجعة جزء عمّ
  const ammaPlan = generatePlanSchedule({
    title: 'مراجعة وتثبيت جزء عمّ (الجزء 30)',
    type: 'quran',
    goalType: 'revision',
    category: 'قرآن كريم',
    materialName: 'جزء عمّ (المصحف الشريف)',
    materialDetails: 'من سورة النبأ إلى سورة الناس (الصفحات 582 - 604)',
    totalUnits: 23,
    unitType: 'page',
    unitLabel: 'صفحة',
    startPoint: 'صفحة 582 (سورة النبأ)',
    endPoint: 'صفحة 604 (سورة الناس)',
    startDate: today,
    durationDays: 23,
    restDaysOfWeek: [5],
    targetRepetitionsPerDay: 10,
    reminderEnabled: true,
    reminderTime: '17:00',
    revisionRatio: 'intensive'
  });

  return [tuhfahPlan, ammaPlan];
}

export function exportPlansToJSON(plans: Plan[]): void {
  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(plans, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute('href', dataStr);
  downloadAnchor.setAttribute('download', `tibyan_plans_backup_${new Date().toISOString().split('T')[0]}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}

export function importPlansFromJSON(file: File): Promise<Plan[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const parsed = JSON.parse(text);
        if (Array.isArray(parsed) && parsed.length > 0) {
          resolve(parsed);
        } else {
          reject(new Error('ملف النسخ الاحتياطي غير صالح'));
        }
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error('فشل قراءة الملف'));
    reader.readAsText(file);
  });
}
