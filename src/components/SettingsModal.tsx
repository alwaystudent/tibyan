import React, { useRef } from 'react';
import { UserSettings, exportPlansToJSON, importPlansFromJSON, createStarterPlans } from '../utils/storage';
import { Plan } from '../types';
import { requestNotificationPermission, sendLocalNotification, playChimeSound } from '../utils/notifications';
import { 
  X, Bell, Volume2, Download, Upload, RotateCcw, 
  User, Moon, Sun, Check 
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  settings: UserSettings;
  onUpdateSettings: (newSettings: UserSettings) => void;
  plans: Plan[];
  onUpdatePlans: (plans: Plan[]) => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
}

export const SettingsModal: React.FC<Props> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  plans,
  onUpdatePlans,
  darkMode,
  onToggleDarkMode
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const handleTestNotification = async () => {
    const granted = await requestNotificationPermission();
    if (granted) {
      sendLocalNotification('تبيان | تذكير الورد اليومي', {
        body: 'حان الآن موعد وردك اليومي من الحفظ والمراجعة المباركة.'
      });
      playChimeSound('bell');
    } else {
      alert('يرجى السماح بالتنبيهات من إعدادات المتصفح');
    }
  };

  const handleExport = () => {
    exportPlansToJSON(plans);
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const imported = await importPlansFromJSON(file);
      onUpdatePlans(imported);
      alert(`تم استيراد ${imported.length} خطة بنجاح.`);
      onClose();
    } catch (err) {
      alert('عذراً، فشل استيراد الملف. تأكد من صحة الملف.');
    }
  };

  const handleResetDefaults = () => {
    if (confirm('هل أنت متأكد من رغبتك في إعادة ضبط الخطط للوضع الافتراضي؟ سيتم استبدال الخطط الحالية.')) {
      const starters = createStarterPlans();
      onUpdatePlans(starters);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/70 backdrop-blur-xs overflow-y-auto">
      <div 
        className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl transition-all my-8 text-stone-900 dark:text-stone-100"
        dir="rtl"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900/50">
          <h2 className="text-base font-bold text-stone-900 dark:text-stone-100">
            الإعدادات والتنبيهات والنسخ الاحتياطي
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto text-xs">
          {/* Profile Name */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-emerald-600" />
              <span>اسم الطالب (يظهر في شهادات الإنجاز):</span>
            </label>
            <input
              type="text"
              value={settings.studentName}
              onChange={(e) => onUpdateSettings({ ...settings, studentName: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900"
            />
          </div>

          {/* Theme & Audio */}
          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-stone-100 dark:border-stone-800">
            <button
              type="button"
              onClick={onToggleDarkMode}
              className="p-3 rounded-xl border border-stone-200 dark:border-stone-800 flex items-center justify-between hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors"
            >
              <div className="flex items-center gap-2">
                {darkMode ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-stone-600" />}
                <span className="font-semibold">{darkMode ? 'المظهر النهاري' : 'المظهر الليلي'}</span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                const next = !settings.soundEnabled;
                onUpdateSettings({ ...settings, soundEnabled: next });
                if (next) playChimeSound('repetition');
              }}
              className="p-3 rounded-xl border border-stone-200 dark:border-stone-800 flex items-center justify-between hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-emerald-600" />
                <span className="font-semibold">الأصوات والتنبيهات:</span>
              </div>
              <span className="text-[11px] text-stone-500">
                {settings.soundEnabled ? 'مفعلة' : 'معطلة'}
              </span>
            </button>
          </div>

          {/* Daily Notifications */}
          <div className="p-4 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-800/40 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-semibold">
                <Bell className="w-4 h-4 text-amber-500" />
                <span>إشعارات المتصفح للمتابعة اليومية:</span>
              </div>
              <button
                type="button"
                onClick={handleTestNotification}
                className="px-2.5 py-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 bg-white dark:bg-stone-700 border border-emerald-300 dark:border-emerald-700 rounded-lg hover:bg-emerald-50"
              >
                اختبار التنبيه
              </button>
            </div>
            <p className="text-[11px] text-stone-500">
              تصلك تذكرة بموعد ورد الحفظ والمراجعة في الوقت الذي تختاره لديمومة الإنجاز.
            </p>
          </div>

          {/* Backup & Restore */}
          <div className="space-y-3 pt-2 border-t border-stone-100 dark:border-stone-800">
            <span className="font-semibold text-stone-700 dark:text-stone-300 block">
              النسخ الاحتياطي ومزامنة الخطط:
            </span>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={handleExport}
                className="flex items-center justify-center gap-2 p-2.5 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 hover:bg-stone-50 text-stone-700 dark:text-stone-300 font-semibold"
              >
                <Download className="w-4 h-4 text-emerald-600" />
                <span>تصدير نسخة (JSON)</span>
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center justify-center gap-2 p-2.5 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 hover:bg-stone-50 text-stone-700 dark:text-stone-300 font-semibold"
              >
                <Upload className="w-4 h-4 text-emerald-600" />
                <span>استيراد نسخة</span>
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleImportFile}
                className="hidden"
              />
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={handleResetDefaults}
                className="text-stone-400 hover:text-red-600 text-[11px] flex items-center gap-1 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>إعادة ضبط الخطط الافتراضية الأولية</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-6 py-3 border-t border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900/50">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-xs font-semibold text-white bg-emerald-700 rounded-xl hover:bg-emerald-800"
          >
            حفظ وإغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
