import React, { useState, useMemo } from 'react';
import { MATN_LIBRARY } from '../data/matnLibrary';
import { MatnLibraryItem } from '../types';
import { Search, BookOpen, Scroll, Clock, Sparkles, Filter, ChevronLeft } from 'lucide-react';

interface Props {
  onSelectMatnToCreate: (matnId: string) => void;
}

export const MatnLibraryView: React.FC<Props> = ({ onSelectMatnToCreate }) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedField, setSelectedField] = useState<string>('all');

  const fields = useMemo(() => {
    const list = Array.from(new Set(MATN_LIBRARY.map(m => m.field)));
    return ['all', ...list];
  }, []);

  const filteredItems = useMemo(() => {
    return MATN_LIBRARY.filter(item => {
      const matchField = selectedField === 'all' || item.field === selectedField;
      const matchSearch = 
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchField && matchSearch;
    });
  }, [searchQuery, selectedField]);

  return (
    <div className="space-y-6">
      {/* Header & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
            <Scroll className="w-5 h-5 text-emerald-700 dark:text-emerald-400" />
            <span>بنك ومكتبة المتون العلمية التراثية</span>
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            تصفح أمهات المنظومات والكتب المختصرة المعتمدة في شتى الفنون الشرعية والعربية، وأنشئ خطة حفظ بضغطة زر.
          </p>
        </div>

        {/* Search input */}
        <div className="relative w-full md:w-72">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ابحث عن متن، ناظم، أو فن..."
            className="w-full pl-3 pr-9 py-2 text-xs rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 focus:outline-emerald-600"
          />
          <Search className="w-4 h-4 text-stone-400 absolute right-3 top-2.5 pointer-events-none" />
        </div>
      </div>

      {/* Field Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
        {fields.map((f) => (
          <button
            key={f}
            onClick={() => setSelectedField(f)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-colors ${
              selectedField === f
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-50'
            }`}
          >
            {f === 'all' ? 'جميع الفنون' : f}
          </button>
        ))}
      </div>

      {/* Mutoon Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-5">
        {filteredItems.map((matn) => (
          <div
            key={matn.id}
            className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-5 shadow-xs hover:border-emerald-500/50 dark:hover:border-emerald-600/50 transition-all flex flex-col justify-between"
          >
            <div>
              {/* Header: Field badge + Units */}
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-0.5 rounded-md">
                  {matn.field}
                </span>
                <span className="text-stone-500 font-mono text-[11px]">
                  {matn.totalUnits} {matn.unitLabel}
                </span>
              </div>

              {/* Title & Author */}
              <h3 className="font-bold text-sm text-stone-900 dark:text-stone-100 mb-1">
                {matn.title}
              </h3>
              <p className="text-xs text-stone-500 mb-3">
                {matn.author}
              </p>

              {/* Sample Excerpt */}
              {matn.sampleExcerpt && (
                <div className="p-3 rounded-xl bg-stone-50 dark:bg-stone-800/40 border border-stone-100 dark:border-stone-800/80 mb-3 text-center">
                  <p className="font-amiri text-xs text-stone-800 dark:text-stone-200 whitespace-pre-line leading-relaxed">
                    {matn.sampleExcerpt}
                  </p>
                </div>
              )}

              {/* Description */}
              <p className="text-xs text-stone-600 dark:text-stone-400 line-clamp-2 mb-4 leading-relaxed">
                {matn.description}
              </p>
            </div>

            {/* Durations & Action */}
            <div className="pt-3 border-t border-stone-100 dark:border-stone-800">
              <div className="flex items-center gap-1.5 text-[11px] text-stone-500 mb-3">
                <Clock className="w-3.5 h-3.5 text-stone-400" />
                <span>المدد المقترحة:</span>
                <div className="flex items-center gap-1 font-mono">
                  {matn.popularDurations.map((d, i) => (
                    <span key={i} className="bg-stone-100 dark:bg-stone-800 px-1.5 py-0.5 rounded text-[10px]">
                      {d.days} يوماً
                    </span>
                  ))}
                </div>
              </div>

              <button
                onClick={() => onSelectMatnToCreate(matn.id)}
                className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-700 hover:text-white rounded-xl text-xs font-semibold border border-emerald-200 dark:border-emerald-900/60 transition-all"
              >
                <span>إنشاء خطة حفظ لهذا المتن</span>
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
