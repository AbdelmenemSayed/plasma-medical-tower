'use client';

import { useState } from 'react';
import { Clock, UserCheck, AlertTriangle, Sparkles, Plus, Calendar, ArrowLeft, ShieldCheck, CheckCircle2, XCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export interface AttendanceRecord {
  id: string;
  employee_name: string;
  position: string;
  branch_name: string;
  clock_in: string;
  clock_out?: string;
  official_start: string;
  total_hours: string;
  delay_minutes: number;
  deduction_amount: number; // خصم التأخير بالجنيه
  overtime_hours: number;
  overtime_bonus: number; // حافز الأوفر تايم بالجنيه
  status: 'on_time' | 'late' | 'overtime' | 'absent';
  date: string;
}

const initialAttendanceData: AttendanceRecord[] = [
  {
    id: 'att-1',
    employee_name: 'باشمهندس عمرو',
    position: 'المالك والمشرف العام (General Owner)',
    branch_name: 'المقر الرئيسي (كافة الفروع)',
    official_start: '09:00 ص',
    clock_in: '08:52 ص',
    clock_out: '05:30 م',
    total_hours: '8.5 ساعة',
    delay_minutes: 0,
    deduction_amount: 0,
    overtime_hours: 0.5,
    overtime_bonus: 250,
    status: 'overtime',
    date: '2026-09-11'
  },
  {
    id: 'att-2',
    employee_name: 'د. طارق الجيزاوي',
    position: 'مدير فرع الحوامدية الرئيسي',
    branch_name: 'فرع الحوامدية الرئيسي',
    official_start: '09:00 ص',
    clock_in: '08:58 ص',
    clock_out: '05:00 م',
    total_hours: '8 ساعات',
    delay_minutes: 0,
    deduction_amount: 0,
    overtime_hours: 0,
    overtime_bonus: 0,
    status: 'on_time',
    date: '2026-09-11'
  },
  {
    id: 'att-3',
    employee_name: 'د. أشرف عبد السلام',
    position: 'مدير فرع البدرشين',
    branch_name: 'فرع البدرشين',
    official_start: '09:00 ص',
    clock_in: '09:05 ص',
    clock_out: '05:15 م',
    total_hours: '8.2 ساعة',
    delay_minutes: 5,
    deduction_amount: 0,
    overtime_hours: 0.2,
    overtime_bonus: 80,
    status: 'on_time',
    date: '2026-09-11'
  },
  {
    id: 'att-4',
    employee_name: 'د. أحمد عادل',
    position: 'استشاري القلب والقسطرة',
    branch_name: 'فرع الحوامدية الرئيسي',
    official_start: '10:00 ص',
    clock_in: '09:55 ص',
    clock_out: '06:00 م',
    total_hours: '8 ساعات',
    delay_minutes: 0,
    deduction_amount: 0,
    overtime_hours: 1,
    overtime_bonus: 400,
    status: 'overtime',
    date: '2026-09-11'
  },
  {
    id: 'att-5',
    employee_name: 'د. سارة فتحي',
    position: 'استشاري طب الأطفال وحديثي الولادة',
    branch_name: 'فرع البدرشين',
    official_start: '10:00 ص',
    clock_in: '10:25 ص',
    clock_out: '04:00 م',
    total_hours: '5.5 ساعة',
    delay_minutes: 25,
    deduction_amount: 150,
    overtime_hours: 0,
    overtime_bonus: 0,
    status: 'late',
    date: '2026-09-11'
  },
  {
    id: 'att-6',
    employee_name: 'أستاذة منّة إبراهيم',
    position: 'مسؤولة الاستقبال وتنظيم الحالات',
    branch_name: 'فرع الحوامدية الرئيسي',
    official_start: '08:30 ص',
    clock_in: '08:26 ص',
    clock_out: '04:30 م',
    total_hours: '8 ساعات',
    delay_minutes: 0,
    deduction_amount: 0,
    overtime_hours: 0,
    overtime_bonus: 0,
    status: 'on_time',
    date: '2026-09-11'
  },
  {
    id: 'att-7',
    employee_name: 'أستاذ حازم فوزي',
    position: 'أخصائي معمل وسحب عينات',
    branch_name: 'فرع الحوامدية الرئيسي',
    official_start: '08:00 ص',
    clock_in: '08:45 ص',
    clock_out: '04:00 م',
    total_hours: '7.2 ساعة',
    delay_minutes: 45,
    deduction_amount: 120,
    overtime_hours: 0,
    overtime_bonus: 0,
    status: 'late',
    date: '2026-09-11'
  },
  {
    id: 'att-8',
    employee_name: 'أستاذة ريهام سمير',
    position: 'محاسبة المركز والماليات',
    branch_name: 'فرع الحوامدية الرئيسي',
    official_start: '09:00 ص',
    clock_in: '08:50 ص',
    clock_out: '06:30 م',
    total_hours: '9.5 ساعة',
    delay_minutes: 0,
    deduction_amount: 0,
    overtime_hours: 1.5,
    overtime_bonus: 180,
    status: 'overtime',
    date: '2026-09-11'
  }
];

interface Props {
  activeRole: string;
  onNotice: (msg: string) => void;
}

export function AttendanceSection({ activeRole, onNotice }: Props) {
  const [attendance, setAttendance] = useState<AttendanceRecord[]>(initialAttendanceData);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showManualModal, setShowManualModal] = useState(false);

  // Manual Clock-in state
  const [manualName, setManualName] = useState('');
  const [manualPosition, setManualPosition] = useState('طبيب');
  const [manualBranch, setManualBranch] = useState('فرع الحوامدية الرئيسي');
  const [manualTime, setManualTime] = useState('09:00 ص');

  const filtered = attendance.filter((r) => {
    const matchesSearch =
      r.employee_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.position.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.branch_name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'all' || r.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const totalPresent = attendance.length;
  const totalLate = attendance.filter((r) => r.status === 'late').length;
  const totalOvertime = attendance.filter((r) => r.overtime_hours > 0).length;
  const totalDeductions = attendance.reduce((acc, r) => acc + r.deduction_amount, 0);
  const totalBonus = attendance.reduce((acc, r) => acc + r.overtime_bonus, 0);

  const handleManualClockIn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualName.trim()) return;

    const newRecord: AttendanceRecord = {
      id: `att-${Date.now()}`,
      employee_name: manualName.trim(),
      position: manualPosition,
      branch_name: manualBranch,
      official_start: '09:00 ص',
      clock_in: manualTime,
      total_hours: 'قيد الدوام',
      delay_minutes: 0,
      deduction_amount: 0,
      overtime_hours: 0,
      overtime_bonus: 0,
      status: 'on_time',
      date: new Date().toISOString().split('T')[0]
    };

    setAttendance([newRecord, ...attendance]);
    setShowManualModal(false);
    onNotice(`تم تسجيل بصمة حضور ${manualName} بنجاح الساعة ${manualTime}`);
  };

  return (
    <div className="attendance-section">
      <div className="section-page-head">
        <div>
          <Badge className="bg-teal-700 text-white">إدارة الموارد البشرية والدوام</Badge>
          <h2>سجل الغياب والحضور والأوفر تايم</h2>
          <p>متابعة أوقات بصمة الحضور والانصراف، احتساب التأخير والخصم التلقائي، وساعات العمل الإضافية لكل وظيفة.</p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={() => setShowManualModal(true)}
            className="bg-teal-700 hover:bg-teal-800 text-white font-bold"
          >
            <Plus className="w-4 h-4 ml-1" /> تسجيل حضور موظف يدوي
          </Button>
        </div>
      </div>

      {/* KPI Cards for Attendance */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500 font-bold">الحضور اليوم</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <b className="text-2xl font-bold text-gray-900 block mt-2">{totalPresent} موظفاً</b>
          <span className="text-[11px] text-emerald-700 mt-1 block">نسبة الحضور ٩٨٪</span>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500 font-bold">حالات التأخير</span>
            <div className="w-8 h-8 rounded-lg bg-red-100 text-red-800 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <b className="text-2xl font-bold text-red-700 block mt-2">{totalLate} حالات</b>
          <span className="text-[11px] text-red-600 mt-1 block">إجمالي الخصم التلقائي: {totalDeductions} ج.م</span>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500 font-bold">العمل الإضافي (Overtime)</span>
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <b className="text-2xl font-bold text-amber-900 block mt-2">{totalOvertime} موظفين</b>
          <span className="text-[11px] text-amber-700 mt-1 block">إجمالي حافز الإضافي: +{totalBonus} ج.م</span>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500 font-bold">صافي التأثير المالي</span>
            <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-800 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <b className="text-2xl font-bold text-teal-800 block mt-2">
            {totalBonus - totalDeductions > 0 ? `+${totalBonus - totalDeductions}` : totalBonus - totalDeductions} ج.م
          </b>
          <span className="text-[11px] text-gray-500 mt-1 block">تحديث آلي بنهاية الشهر مع الرواتب</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-gray-200 rounded-2xl p-3.5 mb-4 shadow-sm flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-[260px]">
          <Input
            placeholder="ابحث بالاسم، المنصب الوظيفي، أو الفرع..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="text-xs h-9"
          />
        </div>

        <div className="flex items-center gap-1.5">
          <button
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              filterStatus === 'all' ? 'bg-teal-700 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            onClick={() => setFilterStatus('all')}
          >
            الكل ({attendance.length})
          </button>
          <button
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              filterStatus === 'on_time' ? 'bg-emerald-700 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            onClick={() => setFilterStatus('on_time')}
          >
            حاضر في الموعد ({attendance.filter((r) => r.status === 'on_time').length})
          </button>
          <button
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              filterStatus === 'late' ? 'bg-red-700 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            onClick={() => setFilterStatus('late')}
          >
            متأخر ({attendance.filter((r) => r.status === 'late').length})
          </button>
          <button
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              filterStatus === 'overtime' ? 'bg-amber-700 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            onClick={() => setFilterStatus('overtime')}
          >
            أوفر تايم ({attendance.filter((r) => r.status === 'overtime').length})
          </button>
        </div>
      </div>

      {/* Main Attendance Table */}
      <div className="data-table rounded-2xl overflow-hidden shadow-sm">
        <div className="table-head">
          <span>الموظف والوظيفة (Position)</span>
          <span>الفرع وموعد البدء</span>
          <span>بصمة الحضور والانصراف</span>
          <span>ساعات العمل والتأخير</span>
          <span>الخصومات والإضافي</span>
        </div>

        {filtered.map((r) => (
          <div className="table-row" key={r.id}>
            <div>
              <b className="text-sm font-bold text-gray-900 block">{r.employee_name}</b>
              <span className="text-xs text-gray-600 block">{r.position}</span>
            </div>

            <div>
              <b className="text-xs text-gray-900 block">{r.branch_name}</b>
              <small className="text-gray-500 font-mono">الدوام الرسمي: {r.official_start}</small>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-100">
                  حضور: {r.clock_in}
                </span>
                {r.clock_out && (
                  <span className="font-mono text-xs text-gray-600 bg-gray-50 px-2 py-0.5 rounded border border-gray-200">
                    انصراف: {r.clock_out}
                  </span>
                )}
              </div>
              <small className="text-gray-500 block mt-1">التاريخ: {r.date}</small>
            </div>

            <div>
              <b className="text-xs text-gray-900 block">{r.total_hours}</b>
              {r.delay_minutes > 0 ? (
                <span className="text-[11px] font-bold text-red-600 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> تأخير {r.delay_minutes} دقيقة
                </span>
              ) : (
                <span className="text-[11px] font-bold text-emerald-700 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> ملتزم بالموعد
                </span>
              )}
            </div>

            <div>
              {r.deduction_amount > 0 && (
                <span className="text-xs font-bold text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded block mb-1">
                  خصم تلقائي: -{r.deduction_amount} ج.م
                </span>
              )}
              {r.overtime_hours > 0 && (
                <span className="text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded block">
                  أوفر تايم (+{r.overtime_hours} س): +{r.overtime_bonus} ج.م
                </span>
              )}
              {r.deduction_amount === 0 && r.overtime_hours === 0 && (
                <Badge variant="outline" className="text-gray-600 bg-gray-50 text-[10px]">
                  دوام منتظم
                </Badge>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Manual Clock-in Modal */}
      {showManualModal && (
        <div className="modal-layer" role="dialog" aria-modal="true" aria-label="تسجيل حضور موظف">
          <div className="modal-backdrop" onClick={() => setShowManualModal(false)} />
          <div className="booking-modal" style={{ maxWidth: '550px' }}>
            <header className="border-b border-gray-200 pb-3">
              <div>
                <Badge className="bg-teal-700 text-white">تسجيل حضور يدوي</Badge>
                <h3 className="text-lg font-bold text-gray-900 mt-1">إثبات بصمة حضور للموظف</h3>
              </div>
              <button onClick={() => setShowManualModal(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </header>

            <form onSubmit={handleManualClockIn} className="p-5 bg-gray-50 flex flex-col gap-3">
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">اسم الموظف: *</label>
                <Input
                  value={manualName}
                  onChange={(e) => setManualName(e.target.value)}
                  placeholder="مثال: د. مصطفى الشريف"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">الوظيفة والمنصب: *</label>
                <select
                  className="w-full h-9 border border-gray-300 rounded-md bg-white text-xs px-2"
                  value={manualPosition}
                  onChange={(e) => setManualPosition(e.target.value)}
                >
                  <option>طبيب معالج</option>
                  <option>مدير فرع</option>
                  <option>موظف استقبال</option>
                  <option>أخصائي معمل</option>
                  <option>أخصائي أشعة</option>
                  <option>محاسب</option>
                  <option>مشرف إداري</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">الفرع التابع له:</label>
                <select
                  className="w-full h-9 border border-gray-300 rounded-md bg-white text-xs px-2"
                  value={manualBranch}
                  onChange={(e) => setManualBranch(e.target.value)}
                >
                  <option>فرع الحوامدية الرئيسي</option>
                  <option>فرع البدرشين</option>
                  <option>فرع طموه / المنيب</option>
                  <option>فرع العياط</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">وقت الحضور:</label>
                <Input
                  value={manualTime}
                  onChange={(e) => setManualTime(e.target.value)}
                  placeholder="09:00 ص"
                />
              </div>

              <div className="pt-3 border-t border-gray-200 flex justify-between">
                <Button type="button" variant="outline" onClick={() => setShowManualModal(false)}>
                  إلغاء
                </Button>
                <Button type="submit" className="bg-teal-700 hover:bg-teal-800 text-white font-bold">
                  تأكيد الحضور
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
