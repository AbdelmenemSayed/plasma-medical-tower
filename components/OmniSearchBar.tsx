'use client';

import { useState, useMemo, useEffect } from 'react';
import { Search, X, Users, Stethoscope, FileHeart, WalletCards, ArrowLeft, Building2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { PatientData } from './PatientHistoryModal';
import type { DoctorAppointmentItem } from './DoctorWorkspace';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  patients: PatientData[];
  appointments: DoctorAppointmentItem[];
  onSelectPatient: (p: PatientData) => void;
  onNavigateSection: (tabName: string) => void;
  onNotice: (msg: string) => void;
}

const staffDirectory = [
  { name: 'باشمهندس عمرو', role: 'المالك وصاحب المنشأة (General Owner)', branch: 'كافة الفروع', section: 'الموظفون والصلاحيات' },
  { name: 'د. طارق الجيزاوي', role: 'مدير فرع الحوامدية الرئيسي', branch: 'الحوامدية', section: 'الفروع (٦)' },
  { name: 'د. أشرف عبد السلام', role: 'مدير فرع البدرشين', branch: 'البدرشين', section: 'الفروع (٦)' },
  { name: 'د. أحمد عادل', role: 'استشاري القلب والقسطرة', branch: 'الحوامدية', section: 'عيادة الطبيب' },
  { name: 'د. سارة فتحي', role: 'استشاري طب الأطفال وحديثي الولادة', branch: 'البدرشين', section: 'عيادة الطبيب' },
  { name: 'د. محمد الشاذلي', role: 'استشاري جراحة العظام والعمود الفقري', branch: 'الحوامدية', section: 'عيادة الطبيب' },
  { name: 'د. إبراهيم فؤاد', role: 'استشاري الباطنة والغدد والسكر', branch: 'العياط', section: 'عيادة الطبيب' },
  { name: 'أستاذة منّة إبراهيم', role: 'مسؤولة الاستقبال وتنظيم الحالات', branch: 'الحوامدية', section: 'المواعيد والاستقبال' },
  { name: 'أستاذ حازم فوزي', role: 'مدير وحدة التحاليل والمعمل', branch: 'الحوامدية', section: 'المعمل' },
  { name: 'أستاذة ريهام سمير', role: 'رئيس قسم الحسابات والماليات', branch: 'الحوامدية', section: 'الفواتير' },
];

const clinicsList = [
  { name: 'عيادة القلب والأوعية الدموية', doctor: 'د. أحمد عادل', fee: '450 جنيه' },
  { name: 'عيادة العظام والمفاصل', doctor: 'د. محمد الشاذلي', fee: '400 جنيه' },
  { name: 'عيادة طب الأطفال', doctor: 'د. سارة فتحي', fee: '350 جنيه' },
  { name: 'عيادة الباطنة والسكر', doctor: 'د. إبراهيم فؤاد', fee: '350 جنيه' },
  { name: 'قسم التحاليل وسحب العينات', doctor: 'معمل بلازما الرقمي', fee: 'حسب الفحص' },
  { name: 'قسم الأشعة الرقمية والسونار', doctor: 'وحدة الأشعة المتقدمة', fee: 'حسب الفحص' },
];

export function OmniSearchBar({
  isOpen,
  onClose,
  patients,
  appointments,
  onSelectPatient,
  onNavigateSection,
  onNotice,
}: Props) {
  const [query, setQuery] = useState('');

  // Keyboard shortcut: Escape to close
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  const cleanQuery = query.trim().toLowerCase();

  // Search in Staff & Doctors
  const matchedStaff = useMemo(() => {
    if (!cleanQuery) return [];
    return staffDirectory.filter(
      (s) =>
        s.name.toLowerCase().includes(cleanQuery) ||
        s.role.toLowerCase().includes(cleanQuery) ||
        s.branch.toLowerCase().includes(cleanQuery)
    );
  }, [cleanQuery]);

  // Search in Patients & MRN / Phone
  const matchedPatients = useMemo(() => {
    if (!cleanQuery) return [];
    return patients.filter(
      (p) =>
        p.full_name_ar.toLowerCase().includes(cleanQuery) ||
        p.phone.includes(cleanQuery) ||
        p.mrn.toLowerCase().includes(cleanQuery) ||
        (p.insurance_company && p.insurance_company.toLowerCase().includes(cleanQuery))
    );
  }, [cleanQuery, patients]);

  // Search in Clinics & Services
  const matchedClinics = useMemo(() => {
    if (!cleanQuery) return [];
    return clinicsList.filter(
      (c) =>
        c.name.toLowerCase().includes(cleanQuery) ||
        c.doctor.toLowerCase().includes(cleanQuery)
    );
  }, [cleanQuery]);

  // Search in Appointments & Financials
  const matchedAppointments = useMemo(() => {
    if (!cleanQuery) return [];
    return appointments.filter(
      (a) =>
        a.booking_code.toLowerCase().includes(cleanQuery) ||
        a.patient_name.toLowerCase().includes(cleanQuery) ||
        a.patient_phone.includes(cleanQuery) ||
        a.doctor_name.toLowerCase().includes(cleanQuery) ||
        (a.billing_type && a.billing_type.includes(cleanQuery))
    );
  }, [cleanQuery, appointments]);

  if (!isOpen) return null;

  return (
    <div className="modal-layer" role="dialog" aria-modal="true" aria-label="شريط البحث الشامل">
      <div className="modal-backdrop" onClick={onClose} />
      <div className="booking-modal omni-search-modal" style={{ maxWidth: '750px', top: '10%' }}>
        {/* Search Header Input */}
        <div className="p-4 border-b border-gray-200 flex items-center gap-3 bg-white">
          <Search className="w-5 h-5 text-teal-700 shrink-0" />
          <input
            type="text"
            className="w-full bg-transparent border-0 text-base font-medium focus:outline-none placeholder-gray-400 text-gray-900"
            placeholder="ابحث عن مريض، رقم تليفون، كود MRN، موظف، طبيب، أو عيادة..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="text-gray-400 hover:text-gray-600 p-1 rounded-full text-xs"
            >
              مسح
            </button>
          )}
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Results Area */}
        <div className="booking-body p-4 bg-gray-50/70 max-h-[550px] overflow-y-auto">
          {!cleanQuery ? (
            <div className="py-12 text-center text-gray-400 text-xs">
              <Search className="w-10 h-10 text-teal-700/20 mx-auto mb-2" />
              اكتب اسم المريض، رقم الموبايل، أو وظيفة الموظف، أو التخصص للبحث الفوري عبر المنظومة.
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {/* 1. Patients Results */}
              {matchedPatients.length > 0 && (
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-teal-900 mb-2">
                    <Users className="w-3.5 h-3.5 text-teal-700" />
                    سجل المرضى ({matchedPatients.length})
                  </div>
                  <div className="flex flex-col gap-1.5">
                    {matchedPatients.map((p) => (
                      <div
                        key={p.id}
                        onClick={() => {
                          onSelectPatient(p);
                          onClose();
                        }}
                        className="bg-white p-3 rounded-xl border border-gray-200 hover:border-teal-600 hover:bg-teal-50/40 transition-all cursor-pointer flex items-center justify-between"
                      >
                        <div>
                          <b className="text-xs text-gray-900 block">{p.full_name_ar}</b>
                          <span className="text-[11px] text-gray-500 font-mono">
                            الرقم الطبي: <b className="text-teal-800">{p.mrn}</b> · الهاتف: <span dir="ltr">{p.phone}</span>
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {p.billing_type === 'insurance' ? (
                            <span className="badge-insurance text-[9px]">
                              تأمين: {p.insurance_company}
                            </span>
                          ) : (
                            <span className="badge-cash text-[9px]">كشف حر</span>
                          )}
                          <Button size="sm" variant="ghost" className="text-xs text-teal-800 h-7">
                            فتح الملف <ArrowLeft className="w-3.5 h-3.5 mr-1" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 2. Staff & Doctors Results */}
              {matchedStaff.length > 0 && (
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-teal-900 mb-2">
                    <Stethoscope className="w-3.5 h-3.5 text-teal-700" />
                    فريق العمل والأطباء ({matchedStaff.length})
                  </div>
                  <div className="flex flex-col gap-1.5">
                    {matchedStaff.map((s, idx) => (
                      <div
                        key={idx}
                        onClick={() => {
                          onNavigateSection(s.section);
                          onNotice(`تم الانتقال إلى: ${s.section}`);
                          onClose();
                        }}
                        className="bg-white p-3 rounded-xl border border-gray-200 hover:border-teal-600 hover:bg-teal-50/40 transition-all cursor-pointer flex items-center justify-between"
                      >
                        <div>
                          <b className="text-xs text-gray-900 block">{s.name}</b>
                          <span className="text-[11px] text-gray-600">{s.role}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-[10px] bg-gray-50">
                            {s.branch}
                          </Badge>
                          <Button size="sm" variant="ghost" className="text-xs text-teal-800 h-7">
                            عرض الصلاحيات <ArrowLeft className="w-3.5 h-3.5 mr-1" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 3. Clinics Results */}
              {matchedClinics.length > 0 && (
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-teal-900 mb-2">
                    <Building2 className="w-3.5 h-3.5 text-teal-700" />
                    العيادات والخدمات الطبية ({matchedClinics.length})
                  </div>
                  <div className="flex flex-col gap-1.5">
                    {matchedClinics.map((c, idx) => (
                      <div
                        key={idx}
                        onClick={() => {
                          onNavigateSection('عيادة الطبيب');
                          onClose();
                        }}
                        className="bg-white p-3 rounded-xl border border-gray-200 hover:border-teal-600 hover:bg-teal-50/40 transition-all cursor-pointer flex items-center justify-between"
                      >
                        <div>
                          <b className="text-xs text-gray-900 block">{c.name}</b>
                          <span className="text-[11px] text-gray-500">الطبيب: {c.doctor}</span>
                        </div>
                        <span className="text-xs font-bold text-teal-800">{c.fee}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 4. Appointments Results */}
              {matchedAppointments.length > 0 && (
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-teal-900 mb-2">
                    <WalletCards className="w-3.5 h-3.5 text-teal-700" />
                    الحجوزات والتعاملات ({matchedAppointments.length})
                  </div>
                  <div className="flex flex-col gap-1.5">
                    {matchedAppointments.map((a) => (
                      <div
                        key={a.id}
                        onClick={() => {
                          onNavigateSection('المواعيد والاستقبال');
                          onClose();
                        }}
                        className="bg-white p-3 rounded-xl border border-gray-200 hover:border-teal-600 hover:bg-teal-50/40 transition-all cursor-pointer flex items-center justify-between"
                      >
                        <div>
                          <b className="text-xs font-mono text-teal-800">{a.booking_code}</b>
                          <span className="text-xs text-gray-900 block">{a.patient_name}</span>
                          <span className="text-[10px] text-gray-500">{a.specialty_ar} · {a.appointment_time}</span>
                        </div>
                        <Badge variant="outline" className="text-[10px]">
                          {a.status === 'checked_in' ? 'بالعيادة' : a.status === 'completed' ? 'تم الكشف' : 'مؤكد'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* No results */}
              {matchedPatients.length === 0 &&
                matchedStaff.length === 0 &&
                matchedClinics.length === 0 &&
                matchedAppointments.length === 0 && (
                  <div className="py-8 text-center text-gray-400 text-xs">
                    لم يتم العثور على أي نتائج مطابقة لكلمة البحث: &quot;{query}&quot;
                  </div>
                )}
            </div>
          )}
        </div>

        <footer className="p-3 bg-white border-t border-gray-200 flex justify-between items-center text-xs text-gray-500">
          <span>اضغط <b>Esc</b> للإغلاق</span>
          <Button size="sm" variant="ghost" onClick={onClose}>إغلاق</Button>
        </footer>
      </div>
    </div>
  );
}
