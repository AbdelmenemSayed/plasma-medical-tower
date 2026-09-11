'use client';

import { useState } from 'react';
import { X, UserCheck, ShieldCheck, Activity, Calendar, Clock, MapPin, Stethoscope, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

interface BranchItem {
  id: string;
  name_ar: string;
  address_ar: string;
  is_active: boolean;
  status?: string;
}

interface Props {
  branches: BranchItem[];
  defaultBranchId?: string;
  onClose: () => void;
  onBook: (data: {
    patient_name: string;
    patient_phone: string;
    national_id?: string;
    patient_address?: string;
    specialty_ar: string;
    doctor_name: string;
    branch_id: string;
    appointment_date: string;
    appointment_time: string;
    visit_type: string;
    billing_type: 'cash' | 'insurance';
    insurance_company?: string;
    insurance_card_number?: string;
    checkInNow: boolean;
    notes?: string;
    chronic_conditions?: string;
  }) => Promise<void>;
  onNotice: (msg: string) => void;
}

const insuranceCompanies = [
  'مصر للتأمين',
  'ثروة كير',
  'أكسا مصر (AXA)',
  'متلايف (MetLife)',
  'بوبا مصر (Bupa)',
  'جي أي جي (GIG)',
  'الدلتا للتأمين',
];

const clinicsList = [
  { name: 'أمراض الباطنة والسكر والسمنة والجهاز الهضمي', doctor: 'دكتور حسين الشوري' },
  { name: 'المخ والأعصاب وجراحة العمود الفقري', doctor: 'د/ خالد مأمون مؤنس' },
  { name: 'جراحة عامة وجراحة أوعية دموية', doctor: 'دكتور عادل عبد المنعم يونس' },
  { name: 'مسالك بولية وأمراض ذكورة وعقم', doctor: 'د. محمود سامي' },
  { name: 'أخصائي أمراض القلب والأوعية الدموية', doctor: 'د. أحمد عادل' },
  { name: 'أمراض الدم', doctor: 'د. هاني يوسف' },
  { name: 'جراحة عامة ومناظير وجراحة أورام الثدي', doctor: 'د. تامر فاروق' },
  { name: 'غدد صماء وسكر الأطفال', doctor: 'د. سارة فتحي' },
  { name: 'السمنة والنحافة', doctor: 'د. ريهام كمال' },
  { name: 'نساء وتوليد', doctor: 'د. رانيا يوسف' },
  { name: 'مخ وأعصاب وفسيولوجيا الأعصاب الإكلينيكية', doctor: 'د. أيمن منصور' },
  { name: 'جراحة المسالك البولية والتناسلية', doctor: 'د. شريف النجار' },
  { name: 'الأشعة التشخيصية والسونار', doctor: 'د. عماد الدين مصطفى' },
  { name: 'التحاليل الطبية والمعامل', doctor: 'أستاذ حازم فوزي (المعمل)' },
  { name: 'طب وجراحة الأسنان', doctor: 'د. كريم عبد العزيز' },
];

export function ReceptionBookingModal({ branches, defaultBranchId, onClose, onBook, onNotice }: Props) {
  // Only active branches can be booked
  const activeBranches = branches.filter((b) => b.is_active !== false && b.status !== 'under_construction');

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [nationalId, setNationalId] = useState('');
  const [address, setAddress] = useState('');
  const [branchId, setBranchId] = useState(defaultBranchId || activeBranches[0]?.id || '');
  const [specialty, setSpecialty] = useState(clinicsList[0].name);
  const [doctor, setDoctor] = useState(clinicsList[0].doctor);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState('٧:٣٠ م');
  const [visitType, setVisitType] = useState('كشف جديد');
  const [billingType, setBillingType] = useState<'cash' | 'insurance'>('cash');
  const [insuranceCompany, setInsuranceCompany] = useState('');
  const [insuranceCard, setInsuranceCard] = useState('');
  const [chronicConditions, setChronicConditions] = useState('');
  const [notes, setNotes] = useState('');
  const [checkInNow, setCheckInNow] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSpecialtyChange = (spec: string) => {
    setSpecialty(spec);
    const matched = clinicsList.find((c) => c.name === spec);
    if (matched) setDoctor(matched.doctor);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('يرجى كتابة اسم المريض بالكامل');
      return;
    }
    if (!/^01[0125][0-9]{8}$/.test(phone.trim())) {
      setError('يرجى إدخال رقم موبايل مصري صحيح (11 رقماً يبدأ بـ 01)');
      return;
    }
    if (billingType === 'insurance' && !insuranceCompany) {
      setError('يرجى اختيار شركة التأمين التابع لها المريض');
      return;
    }
    if (!branchId) {
      setError('يرجى اختيار الفرع');
      return;
    }

    setLoading(true);
    try {
      await onBook({
        patient_name: name.trim(),
        patient_phone: phone.trim(),
        national_id: nationalId.trim() || undefined,
        patient_address: address.trim() || undefined,
        specialty_ar: specialty,
        doctor_name: doctor,
        branch_id: branchId,
        appointment_date: date,
        appointment_time: time,
        visit_type: visitType,
        billing_type: billingType,
        insurance_company: billingType === 'insurance' ? insuranceCompany : undefined,
        insurance_card_number: billingType === 'insurance' ? insuranceCard : undefined,
        checkInNow,
        notes: notes.trim() || undefined,
        chronic_conditions: chronicConditions.trim() || undefined,
      });
      onNotice(`تم تسجيل وحجز المريض ${name} ${checkInNow ? 'وتوجيهه لطابور الطبيب' : ''} بنجاح`);
      onClose();
    } catch {
      setError('حدث خطأ أثناء حفظ الحجز في قاعدة البيانات');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-layer" role="dialog" aria-modal="true" aria-label="تسجيل وحجز مريض من الاستقبال">
      <div className="modal-backdrop" onClick={onClose} />
      <div className="booking-modal" style={{ maxWidth: '850px' }}>
        <header className="border-b border-gray-200 pb-4">
          <div>
            <Badge className="bg-teal-700 text-white font-bold mb-1">
              <UserCheck className="w-3.5 h-3.5 ml-1" />
              نافذة الاستقبال الرسمية
            </Badge>
            <h2 className="text-2xl font-bold text-gray-900">تسجيل مريض وتنظيم الكشف</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              تسجيل بيانات المريض وتحديد نوع التغطية (كشف حر أو تأمين) وتوجيه الحالة لعيادة الطبيب المختص.
            </p>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-700">
            <X className="w-5 h-5" />
          </button>
        </header>

        <form onSubmit={handleSubmit} className="booking-body p-6 bg-gray-50/60">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-xs p-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          {/* Section 1: Financial / Insurance Classification */}
          <div className="bg-white border border-gray-200 rounded-xl p-4 mb-5 shadow-sm">
            <label className="text-xs font-bold text-gray-900 block mb-2">
              تصنيف حساب المريض وطريقة السداد (مهم جداً): *
            </label>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <button
                type="button"
                className={`p-3 rounded-xl border text-right transition-all flex items-start gap-3 ${
                  billingType === 'cash'
                    ? 'border-emerald-600 bg-emerald-50/60 shadow-sm'
                    : 'border-gray-200 bg-white hover:bg-gray-50'
                }`}
                onClick={() => setBillingType('cash')}
              >
                <div className={`w-5 h-5 rounded-full border flex items-center justify-center mt-0.5 ${
                  billingType === 'cash' ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-gray-300'
                }`}>
                  {billingType === 'cash' && <Check className="w-3 h-3" />}
                </div>
                <div>
                  <b className="text-xs text-emerald-950 block">كشف حر (حالة حرة)</b>
                  <span className="text-[11px] text-emerald-800/80 block mt-0.5">
                    سداد نقدي بأسعار المركز الرسمية بدون شركة تأمين
                  </span>
                </div>
              </button>

              <button
                type="button"
                className={`p-3 rounded-xl border text-right transition-all flex items-start gap-3 ${
                  billingType === 'insurance'
                    ? 'border-blue-600 bg-blue-50/60 shadow-sm'
                    : 'border-gray-200 bg-white hover:bg-gray-50'
                }`}
                onClick={() => setBillingType('insurance')}
              >
                <div className={`w-5 h-5 rounded-full border flex items-center justify-center mt-0.5 ${
                  billingType === 'insurance' ? 'border-blue-600 bg-blue-600 text-white' : 'border-gray-300'
                }`}>
                  {billingType === 'insurance' && <Check className="w-3 h-3" />}
                </div>
                <div>
                  <b className="text-xs text-blue-950 block">مؤمّن عليه (جهة تأمينية)</b>
                  <span className="text-[11px] text-blue-800/80 block mt-0.5">
                    تابع لشركة تأمين معتمدة بالمركز بنسبة تحمل أو خطاب تحويل
                  </span>
                </div>
              </button>
            </div>

            {billingType === 'insurance' && (
              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-blue-100 bg-blue-50/40 p-3 rounded-lg">
                <div>
                  <label className="text-[11px] font-bold text-blue-900 block mb-1">
                    اسم شركة التأمين: *
                  </label>
                  <select
                    className="w-full h-9 border border-blue-200 rounded-md bg-white text-xs px-2 focus:outline-blue-600"
                    value={insuranceCompany}
                    onChange={(e) => setInsuranceCompany(e.target.value)}
                    required={billingType === 'insurance'}
                  >
                    <option value="">اختار شركة التأمين...</option>
                    {insuranceCompanies.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-bold text-blue-900 block mb-1">
                    رقم الكارنيه / البوليصة:
                  </label>
                  <Input
                    className="h-9 text-xs"
                    placeholder="مثال: MS-882941"
                    value={insuranceCard}
                    onChange={(e) => setInsuranceCard(e.target.value)}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Section 2: Patient Info */}
          <div className="bg-white border border-gray-200 rounded-xl p-4 mb-5 shadow-sm">
            <h4 className="text-xs font-bold text-gray-800 mb-3">بيانات المريض الأساسية:</h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-gray-700 block mb-1">الاسم بالكامل: *</label>
                <Input
                  placeholder="مثال: محمد السيد إبراهيم"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="text-xs"
                  required
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-gray-700 block mb-1">رقم الموبايل: *</label>
                <Input
                  placeholder="01xxxxxxxxx"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="text-xs font-mono"
                  dir="ltr"
                  required
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-gray-700 block mb-1">الرقم القومي (اختياري):</label>
                <Input
                  placeholder="١٤ رقماً"
                  value={nationalId}
                  onChange={(e) => setNationalId(e.target.value)}
                  className="text-xs font-mono"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-gray-700 block mb-1">العنوان / المنطقة:</label>
                <Input
                  placeholder="المدينة والشارع"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="text-xs"
                />
              </div>
              <div className="col-span-2">
                <label className="text-[11px] font-bold text-gray-700 block mb-1">
                  أي أمراض مزمنة أو حساسية معروفة (يتم تثبيتها في السجل الطبي للمريض):
                </label>
                <Input
                  placeholder="ضغط، سكر، حساسية أدوية..."
                  value={chronicConditions}
                  onChange={(e) => setChronicConditions(e.target.value)}
                  className="text-xs"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Appointment, Branch, Clinic & Doctor */}
          <div className="bg-white border border-gray-200 rounded-xl p-4 mb-5 shadow-sm">
            <h4 className="text-xs font-bold text-gray-800 mb-3">تفاصيل الزيارة وتوجيه العيادة:</h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-gray-700 block mb-1">
                  الفرع الطبي: *
                </label>
                <select
                  className="w-full h-9 border border-gray-300 rounded-md bg-white text-xs px-2"
                  value={branchId}
                  onChange={(e) => setBranchId(e.target.value)}
                  required
                >
                  {activeBranches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name_ar} ({b.address_ar})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-gray-700 block mb-1">
                  نوع الزيارة:
                </label>
                <select
                  className="w-full h-9 border border-gray-300 rounded-md bg-white text-xs px-2"
                  value={visitType}
                  onChange={(e) => setVisitType(e.target.value)}
                >
                  <option>كشف جديد</option>
                  <option>استشارة ومتابعة</option>
                  <option>طلب كشف منزلي</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-gray-700 block mb-1">
                  التخصص والعيادة: *
                </label>
                <select
                  className="w-full h-9 border border-gray-300 rounded-md bg-white text-xs px-2"
                  value={specialty}
                  onChange={(e) => handleSpecialtyChange(e.target.value)}
                >
                  {clinicsList.map((c) => (
                    <option key={c.name} value={c.name}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-gray-700 block mb-1">
                  الطبيب المعالج:
                </label>
                <Input value={doctor} onChange={(e) => setDoctor(e.target.value)} className="text-xs" />
              </div>

              <div>
                <label className="text-[11px] font-bold text-gray-700 block mb-1">التاريخ:</label>
                <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="text-xs" />
              </div>

              <div>
                <label className="text-[11px] font-bold text-gray-700 block mb-1">الوقت التقريبي:</label>
                <Input value={time} onChange={(e) => setTime(e.target.value)} className="text-xs" />
              </div>

              <div className="col-span-2">
                <label className="text-[11px] font-bold text-gray-700 block mb-1">ملاحظات الاستقبال:</label>
                <Input
                  placeholder="أي تفاصيل خاصة بالدخول أو الدفع..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="text-xs"
                />
              </div>
            </div>
          </div>

          {/* Quick Check-in Toggle */}
          <div className="bg-teal-50 border border-teal-200 rounded-xl p-3 mb-4 flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-teal-900 m-0">
              <input
                type="checkbox"
                checked={checkInNow}
                onChange={(e) => setCheckInNow(e.target.checked)}
                className="w-4 h-4 accent-teal-700"
              />
              <span>تسجيل وصول فوري (Check-in) ونقل المريض مباشرة لطابور انتظار الطبيب</span>
            </label>
            <Badge variant="outline" className="text-teal-800 bg-white border-teal-300 text-[10px]">
              تحويل لحظي للعيادة
            </Badge>
          </div>

          <footer className="pt-2 flex justify-between items-center">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              إلغاء
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-teal-700 hover:bg-teal-800 text-white font-bold px-8 shadow-md"
            >
              {loading ? 'جاري التسجيل...' : 'تأكيد الحجز والدخول'}
            </Button>
          </footer>
        </form>
      </div>
    </div>
  );
}
