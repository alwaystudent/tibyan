import { DailyTask, GoalType, Plan, PlanType, UnitType } from '../types';

export interface PlanGenerationParams {
  title: string;
  type: PlanType;
  goalType: GoalType;
  category?: string;
  materialName: string;
  materialDetails?: string;
  totalUnits: number;
  unitType: UnitType;
  unitLabel: string;
  startPoint: string;
  endPoint: string;
  startDate: string; // YYYY-MM-DD
  durationDays: number; // calendar days
  restDaysOfWeek: number[]; // 0: Sunday, 1: Mon, ... 5: Friday, 6: Sat
  targetRepetitionsPerDay: number;
  reminderEnabled: boolean;
  reminderTime: string;
  revisionRatio: 'none' | 'light' | 'moderate' | 'intensive';
  startUnitIndex?: number;
  endUnitIndex?: number;
}

const ARABIC_DAYS = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

export function generatePlanSchedule(params: PlanGenerationParams): Plan {
  const planId = 'plan_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
  const start = new Date(params.startDate + 'T00:00:00');
  
  // Calculate active days vs rest days
  let activeDaysCount = 0;
  for (let i = 0; i < params.durationDays; i++) {
    const currentDay = new Date(start);
    currentDay.setDate(start.getDate() + i);
    const dayOfWeek = currentDay.getDay();
    if (!params.restDaysOfWeek.includes(dayOfWeek)) {
      activeDaysCount++;
    }
  }

  // Fallback if all days are rest days
  if (activeDaysCount === 0) {
    activeDaysCount = params.durationDays;
  }

  // Calculate daily units distribution
  const total = Math.max(1, params.totalUnits);
  const basePerDay = Math.floor(total / activeDaysCount);
  const remainder = total % activeDaysCount;

  const tasks: DailyTask[] = [];
  let currentUnitOffset = 0;
  let activeDayIndex = 0;

  for (let i = 0; i < params.durationDays; i++) {
    const currentDate = new Date(start);
    currentDate.setDate(start.getDate() + i);
    const dateStr = currentDate.toISOString().split('T')[0];
    const dayOfWeek = currentDate.getDay();
    const dayName = ARABIC_DAYS[dayOfWeek];
    const isRest = params.restDaysOfWeek.includes(dayOfWeek);

    const taskId = `task_${planId}_day_${i + 1}`;

    if (isRest) {
      // Review or Consolidation day
      tasks.push({
        id: taskId,
        dayNumber: i + 1,
        date: dateStr,
        dayName,
        isRestDay: true,
        status: 'pending',
        repetitionsDone: 0,
        repetitionsTarget: 5,
        timeSpentMinutes: 0,
        revisionPortion: {
          title: 'يوم مراجعة وتثبيت أسبوعي',
          description: 'مراجعة كافة ما تم إنجازه خلال الأسبوع المنصرم لربط المحفوظ وتثبيته.',
          from: 'المحفوظ الأسبوعي',
          to: 'نهاية ورد الأسبوع',
          amount: currentUnitOffset,
          unit: params.unitLabel
        }
      });
      continue;
    }

    // Distribute units: distribute remainder across the first few days
    let dayAmount = basePerDay + (activeDayIndex < remainder ? 1 : 0);
    if (dayAmount <= 0) dayAmount = 1;

    const fromUnit = currentUnitOffset + 1;
    const toUnit = Math.min(total, currentUnitOffset + dayAmount);
    currentUnitOffset = toUnit;
    activeDayIndex++;

    const unitDesc = formatUnitRange(params.type, params.unitType, fromUnit, toUnit, params.unitLabel, params.startPoint);

    // Cumulative revision portion
    let revisionPortion = undefined;
    if (params.goalType === 'combined' || params.goalType === 'revision' || params.revisionRatio !== 'none') {
      if (params.goalType === 'revision') {
        // Pure revision plan
        revisionPortion = {
          title: `مراجعة الورد المقرر: ${unitDesc}`,
          description: `تلاوة ومراجعة متأنية مع التكرار والتدقيق.`,
          from: `${params.unitLabel} ${fromUnit}`,
          to: `${params.unitLabel} ${toUnit}`,
          amount: dayAmount,
          unit: params.unitLabel
        };
      } else if (fromUnit > 1) {
        // Cumulative review of recent units
        const revLookback = params.revisionRatio === 'intensive' ? 10 : params.revisionRatio === 'moderate' ? 5 : 3;
        const revStart = Math.max(1, fromUnit - revLookback);
        const revEnd = fromUnit - 1;
        revisionPortion = {
          title: `مراجعة تراكمية للمحفوظ القريب`,
          description: `مراجعة من ${params.unitLabel} ${revStart} إلى ${params.unitLabel} ${revEnd} قبل الشروع في الجديد.`,
          from: `${params.unitLabel} ${revStart}`,
          to: `${params.unitLabel} ${revEnd}`,
          amount: (revEnd - revStart + 1),
          unit: params.unitLabel
        };
      }
    }

    // New memorization portion (if memorization or combined)
    const newPortion = params.goalType !== 'revision' ? {
      title: `حفظ ${unitDesc}`,
      description: `حفظ جديد مع التكرار ${params.targetRepetitionsPerDay} مرة لترسيخ الذاكرة.`,
      from: `${params.unitLabel} ${fromUnit}`,
      to: `${params.unitLabel} ${toUnit}`,
      amount: dayAmount,
      unit: params.unitLabel
    } : undefined;

    tasks.push({
      id: taskId,
      dayNumber: i + 1,
      date: dateStr,
      dayName,
      isRestDay: false,
      newMemorization: newPortion,
      revisionPortion: revisionPortion,
      status: 'pending',
      repetitionsDone: 0,
      repetitionsTarget: params.targetRepetitionsPerDay,
      timeSpentMinutes: 0
    });
  }

  // Calculate target end date
  const endDate = new Date(start);
  endDate.setDate(start.getDate() + params.durationDays - 1);
  const endDateStr = endDate.toISOString().split('T')[0];

  return {
    id: planId,
    title: params.title,
    type: params.type,
    goalType: params.goalType,
    category: params.category || (params.type === 'quran' ? 'قرآن كريم' : 'متون علمية'),
    materialName: params.materialName,
    materialDetails: params.materialDetails,
    totalUnits: params.totalUnits,
    unitType: params.unitType,
    unitLabel: params.unitLabel,
    startPoint: params.startPoint,
    endPoint: params.endPoint,
    startDate: params.startDate,
    targetEndDate: endDateStr,
    durationDays: params.durationDays,
    restDaysOfWeek: params.restDaysOfWeek,
    targetRepetitionsPerDay: params.targetRepetitionsPerDay,
    reminderEnabled: params.reminderEnabled,
    reminderTime: params.reminderTime,
    revisionRatio: params.revisionRatio,
    tasks,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

function formatUnitRange(planType: PlanType, unitType: UnitType, from: number, to: number, unitLabel: string, baseStartPoint: string): string {
  if (from === to) {
    return `${unitLabel} رقم ${from}`;
  }
  return `من ${unitLabel} ${from} إلى ${unitLabel} ${to}`;
}

export function rescheduleRemainingTasks(plan: Plan, fromDate: string): Plan {
  const tasks = [...plan.tasks];
  const pendingIndices = tasks
    .map((t, idx) => (t.status === 'pending' || t.status === 'partial') ? idx : -1)
    .filter(idx => idx !== -1);

  if (pendingIndices.length === 0) return plan;

  const newStart = new Date(fromDate + 'T00:00:00');
  let currentOffsetDate = 0;

  for (const idx of pendingIndices) {
    const task = { ...tasks[idx] };
    const dateObj = new Date(newStart);
    dateObj.setDate(newStart.getDate() + currentOffsetDate);
    
    task.date = dateObj.toISOString().split('T')[0];
    task.dayName = ARABIC_DAYS[dateObj.getDay()];
    tasks[idx] = task;
    currentOffsetDate++;
  }

  const lastTask = tasks[tasks.length - 1];

  return {
    ...plan,
    tasks,
    targetEndDate: lastTask.date,
    updatedAt: new Date().toISOString()
  };
}

export function calculatePlanStats(plan: Plan) {
  const total = plan.tasks.length;
  const completed = plan.tasks.filter(t => t.status === 'completed').length;
  const partial = plan.tasks.filter(t => t.status === 'partial').length;
  const pending = plan.tasks.filter(t => t.status === 'pending').length;
  
  const completionPercent = total > 0 ? Math.round((completed / total) * 100) : 0;
  
  // Evaluation scores average
  const scoredTasks = plan.tasks.filter(t => t.evaluation && t.evaluation.stars > 0);
  const avgStars = scoredTasks.length > 0 
    ? (scoredTasks.reduce((acc, t) => acc + (t.evaluation?.stars || 0), 0) / scoredTasks.length).toFixed(1)
    : '5.0';

  // Calculate current streak
  let streak = 0;
  const todayStr = new Date().toISOString().split('T')[0];
  const pastTasks = plan.tasks.filter(t => t.date <= todayStr);
  
  for (let i = pastTasks.length - 1; i >= 0; i--) {
    const t = pastTasks[i];
    if (t.status === 'completed' || t.isRestDay) {
      if (!t.isRestDay) streak++;
    } else {
      break;
    }
  }

  // Total repetitions completed
  const totalReps = plan.tasks.reduce((sum, t) => sum + (t.repetitionsDone || 0), 0);
  const totalMinutes = plan.tasks.reduce((sum, t) => sum + (t.timeSpentMinutes || 0), 0);

  return {
    totalDays: total,
    completedDays: completed,
    partialDays: partial,
    pendingDays: pending,
    completionPercent,
    avgStars: parseFloat(avgStars),
    streak,
    totalReps,
    totalMinutes,
    isFullyCompleted: completed === total && total > 0
  };
}
