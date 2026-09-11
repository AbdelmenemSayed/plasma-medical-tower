'use client';

import { useState } from 'react';
import { Activity, ArrowUpRight, Calendar, TrendingUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

type Period = 'today' | 'week' | 'month';

interface DataPoint {
  timeLabel: string;
  visits: number;
  cashVisits: number;
  insuranceVisits: number;
  revenue: number;
  heightPercent: number;
}

const todayData: DataPoint[] = [
  { timeLabel: '9:00 ص', visits: 12, cashVisits: 7, insuranceVisits: 5, revenue: 5400, heightPercent: 42 },
  { timeLabel: '10:00 ص', visits: 18, cashVisits: 11, insuranceVisits: 7, revenue: 8100, heightPercent: 62 },
  { timeLabel: '11:00 ص', visits: 24, cashVisits: 14, insuranceVisits: 10, revenue: 10800, heightPercent: 82 },
  { timeLabel: '12:00 م', visits: 20, cashVisits: 12, insuranceVisits: 8, revenue: 9000, heightPercent: 70 },
  { timeLabel: '1:00 م', visits: 15, cashVisits: 9, insuranceVisits: 6, revenue: 6750, heightPercent: 52 },
  { timeLabel: '2:00 م', visits: 10, cashVisits: 6, insuranceVisits: 4, revenue: 4500, heightPercent: 35 },
  { timeLabel: '3:00 م', visits: 8, cashVisits: 5, insuranceVisits: 3, revenue: 3600, heightPercent: 28 },
  { timeLabel: '4:00 م', visits: 14, cashVisits: 8, insuranceVisits: 6, revenue: 6300, heightPercent: 48 },
  { timeLabel: '5:00 م', visits: 22, cashVisits: 13, insuranceVisits: 9, revenue: 9900, heightPercent: 76 },
  { timeLabel: '6:00 م', visits: 29, cashVisits: 17, insuranceVisits: 12, revenue: 13050, heightPercent: 100 },
  { timeLabel: '7:00 م', visits: 26, cashVisits: 15, insuranceVisits: 11, revenue: 11700, heightPercent: 90 },
  { timeLabel: '8:00 م', visits: 21, cashVisits: 12, insuranceVisits: 9, revenue: 9450, heightPercent: 72 },
  { timeLabel: '9:00 م', visits: 16, cashVisits: 10, insuranceVisits: 6, revenue: 7200, heightPercent: 55 },
  { timeLabel: '10:00 م', visits: 9, cashVisits: 5, insuranceVisits: 4, revenue: 4050, heightPercent: 30 },
];

const weekData: DataPoint[] = [
  { timeLabel: 'السبت', visits: 142, cashVisits: 82, insuranceVisits: 60, revenue: 63900, heightPercent: 88 },
  { timeLabel: 'الأحد', visits: 156, cashVisits: 90, insuranceVisits: 66, revenue: 70200, heightPercent: 96 },
  { timeLabel: 'الاثنين', visits: 138, cashVisits: 78, insuranceVisits: 60, revenue: 62100, heightPercent: 85 },
  { timeLabel: 'الثلاثاء', visits: 162, cashVisits: 95, insuranceVisits: 67, revenue: 72900, heightPercent: 100 },
  { timeLabel: 'الأربعاء', visits: 149, cashVisits: 86, insuranceVisits: 63, revenue: 67050, heightPercent: 92 },
  { timeLabel: 'الخميس', visits: 158, cashVisits: 92, insuranceVisits: 66, revenue: 71100, heightPercent: 98 },
  { timeLabel: 'الجمعة', visits: 94, cashVisits: 56, insuranceVisits: 38, revenue: 42300, heightPercent: 58 },
];

const monthData: DataPoint[] = [
  { timeLabel: 'الأسبوع ١', visits: 980, cashVisits: 560, insuranceVisits: 420, revenue: 441000, heightPercent: 86 },
  { timeLabel: 'الأسبوع ٢', visits: 1050, cashVisits: 610, insuranceVisits: 440, revenue: 472500, heightPercent: 92 },
  { timeLabel: 'الأسبوع ٣', visits: 1140, cashVisits: 660, insuranceVisits: 480, revenue: 513000, heightPercent: 100 },
  { timeLabel: 'الأسبوع ٤', visits: 1020, cashVisits: 590, insuranceVisits: 430, revenue: 459000, heightPercent: 89 },
];

interface Props {
  onNotice: (msg: string) => void;
}

export function InteractiveFlowChart({ onNotice }: Props) {
  const [period, setPeriod] = useState<Period>('today');
  const [hoveredPoint, setHoveredPoint] = useState<DataPoint | null>(null);

  const data = period === 'today' ? todayData : period === 'week' ? weekData : monthData;
  const totalVisits = data.reduce((sum, d) => sum + d.visits, 0);
  const totalRevenue = data.reduce((sum, d) => sum + d.revenue, 0);

  return (
    <article className="ops-card flow-chart relative">
      <div className="ops-card-head flex items-center justify-between mb-3">
        <div>
          <div className="flex items-center gap-2">
            <small className="text-gray-500 font-bold">الحركة المباشرة للمرضى</small>
            <Badge variant="outline" className="text-[10px] text-teal-800 bg-teal-50">
              تفاعلي حي
            </Badge>
          </div>
          <h3 className="text-sm font-bold text-gray-900 mt-0.5">
            {period === 'today' ? 'الزيارات اليومية على مدار ساعات العمل' : period === 'week' ? 'إجمالي زيارات الأسبوع' : 'المعدل الشهري للزيارات'}
          </h3>
        </div>

        {/* Period Selector Tabs */}
        <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg">
          <button
            className={`px-2.5 py-1 text-xs font-bold rounded-md transition-colors ${
              period === 'today' ? 'bg-white text-teal-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}
            onClick={() => {
              setPeriod('today');
              onNotice('تم عرض توزيع ساعات الذروة اليومية');
            }}
          >
            اليوم (بالساعات)
          </button>
          <button
            className={`px-2.5 py-1 text-xs font-bold rounded-md transition-colors ${
              period === 'week' ? 'bg-white text-teal-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}
            onClick={() => {
              setPeriod('week');
              onNotice('تم عرض زيارات أيام الأسبوع');
            }}
          >
            هذا الأسبوع
          </button>
          <button
            className={`px-2.5 py-1 text-xs font-bold rounded-md transition-colors ${
              period === 'month' ? 'bg-white text-teal-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}
            onClick={() => {
              setPeriod('month');
              onNotice('تم عرض الإحصائيات الشهرية');
            }}
          >
            الشهر
          </button>
        </div>
      </div>

      {/* Floating Tooltip Display when Hovered */}
      <div className="min-h-[38px] mb-2 px-3 py-1.5 bg-teal-50/80 border border-teal-200 rounded-xl flex items-center justify-between transition-all">
        {hoveredPoint ? (
          <div className="flex items-center justify-between w-full text-xs">
            <span className="font-bold text-teal-950 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-teal-700" />
              توقيت: <b>{hoveredPoint.timeLabel}</b>
            </span>
            <span className="text-gray-700">
              الزيارات: <b className="text-teal-900">{hoveredPoint.visits} مريض</b>
              <span className="text-gray-400 mx-1">|</span>
              (حر: <b>{hoveredPoint.cashVisits}</b> · تأمين: <b>{hoveredPoint.insuranceVisits}</b>)
            </span>
            <span className="text-emerald-800 font-bold font-mono">
              إيراد: {hoveredPoint.revenue.toLocaleString('ar-EG')} ج.م
            </span>
          </div>
        ) : (
          <div className="text-xs text-gray-500 flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-teal-600" />
            مرر مؤشر الفأرة على أي عمود لاستعراض عدد الحالات وتفاصيل الكشف الحر والتأمين والإيراد.
          </div>
        )}
      </div>

      {/* Dynamic Interactive Bars */}
      <div className="bars-chart h-[180px] flex items-end gap-2 px-2 pb-1 border-b border-gray-200 bg-gray-50/30">
        {data.map((item, i) => {
          const isHovered = hoveredPoint?.timeLabel === item.timeLabel;
          return (
            <span
              key={i}
              className="h-full flex-1 flex flex-col justify-end items-center gap-1 cursor-pointer transition-transform hover:scale-105"
              onMouseEnter={() => setHoveredPoint(item)}
              onMouseLeave={() => setHoveredPoint(null)}
            >
              <i
                style={{ height: `${item.heightPercent}%` }}
                className={`w-full rounded-t-md transition-all duration-300 ${
                  isHovered
                    ? 'bg-gradient-to-t from-teal-700 to-amber-500 shadow-md scale-x-110'
                    : 'bg-gradient-to-t from-teal-800 to-teal-500 hover:from-teal-700 hover:to-teal-400'
                }`}
              />
              <small className="text-[9px] text-gray-500 font-medium whitespace-nowrap overflow-hidden">
                {item.timeLabel}
              </small>
            </span>
          );
        })}
      </div>

      <footer className="flex items-center justify-between text-xs text-gray-600 mt-3 pt-2">
        <span className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-teal-600 inline-block" />
          إجمالي الزيارات في هذه الفترة: <b className="text-teal-950">{totalVisits.toLocaleString('ar-EG')} كشف</b>
        </span>
        <b className="text-emerald-700 flex items-center gap-1">
          <TrendingUp className="w-3.5 h-3.5" />
          +{period === 'today' ? '١٨٪ عن الأمس' : '+٢٤٪ نمو شهري'}
        </b>
      </footer>
    </article>
  );
}
