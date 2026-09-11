'use client';

import { useState } from 'react';
import {
  Stethoscope, Users, Clock, ShieldCheck, Activity, Plus, Trash2,
  CheckCircle2, FileHeart, AlertCircle, Calendar, Save, Sparkles
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PatientHistoryModal, type MedicalRecordItem, type PatientData } from './PatientHistoryModal';

export interface DoctorAppointmentItem {
  id: string;
  booking_code: string;
  patient_id?: string;
  patient_name: string;
  patient_phone: string;
  patient_address?: string;
  specialty_ar: string;
  doctor_name: string;
  appointment_date: string;
  appointment_time: string;
  visit_type: string;
  billing_type: 'cash' | 'insurance';
  insurance_company?: string;
  status: 'pending' | 'confirmed' | 'checked_in' | 'in_consultation' | 'completed' | 'cancelled';
  notes?: string;
  branch_id?: string;
}

interface Props {
  doctorName: string;
  specialty: string;
  appointments: DoctorAppointmentItem[];
  patients: PatientData[];
  medicalRecords: MedicalRecordItem[];
  onSaveDiagnosis: (record: Partial<MedicalRecordItem>, appointmentId?: string) => Promise<void>;
  onNotice: (msg: string) => void;
}

export function DoctorWorkspace({
  doctorName,
  specialty,
  appointments,
  patients,
  medicalRecords,
  onSaveDiagnosis,
  onNotice,
}: Props) {
  // Filter queue for this doctor's specialty / appointments that are checked_in or confirmed
  const queuePatients = appointments.filter(
    (a) => a.status === 'checked_in' || a.status === 'confirmed' || a.status === 'in_consultation'
  );

  const [selectedAppId, setSelectedAppId] = useState<string>(
    queuePatients[0]?.id || ''
  );
  const selectedApp = queuePatients.find((a) => a.id === selectedAppId) || queuePatients[0];

  // Match patient profile
  const patientProfile = patients.find(
    (p) => (selectedApp?.patient_phone && p.phone === selectedApp.patient_phone) || (selectedApp?.patient_name && p.full_name_ar === selectedApp.patient_name)
  );

  // Past medical history for this specific patient
  const patientPastRecords = medicalRecords.filter(
    (r) => (selectedApp?.patient_phone && r.patient_phone === selectedApp.patient_phone) || (selectedApp?.patient_name && r.patient_name === selectedApp.patient_name)
  );

  // Modal for full history
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  // Consultation Form State
  const [chiefComplaint, setChiefComplaint] = useState(selectedApp?.notes || '');
  const [diagnosis, setDiagnosis] = useState('');
  const [bp, setBp] = useState('120/80');
  const [hr, setHr] = useState('75');
  const [temp, setTemp] = useState('37.0');
  const [sugar, setSugar] = useState('105');
  const [weight, setWeight] = useState('78');
  const [labRequests, setLabRequests] = useState('');
  const [radiologyRequests, setRadiologyRequests] = useState('');
  const [doctorNotes, setDoctorNotes] = useState('');
  const [followUpDate, setFollowUpDate] = useState('2026-09-25');
  const [saving, setSaving] = useState(false);

  // Prescriptions list builder
  const [prescriptions, setPrescriptions] = useState<Array<{ drug_name: string; dose: string; duration: string }>>([
    { drug_name: 'Concor 5mg', dose: 'قرص صباحاً', duration: 'شهر' },
  ]);

  const addPrescription = () => {
    setPrescriptions([...prescriptions, { drug_name: '', dose: '', duration: '' }]);
  };

  const removePrescription = (index: number) => {
    setPrescriptions(prescriptions.filter((_, i) => i !== index));
  };

  const updatePrescription = (index: number, field: 'drug_name' | 'dose' | 'duration', val: string) => {
    const updated = [...prescriptions];
    updated[index][field] = val;
    setPrescriptions(updated);
  };

  const handleSelectPatient = (app: DoctorAppointmentItem) => {
    setSelectedAppId(app.id);
    setChiefComplaint(app.notes || '');
    setDiagnosis('');
  };

  const handleSave = async () => {
    if (!diagnosis.trim()) {
      onNotice('يرجى كتابة التشخيص الطبي للحالة قبل الحفظ');
      return;
    }
    if (!selectedApp) {
      onNotice('لا يوجد مريض محدد حالياً');
      return;
    }

    setSaving(true);
    try {
      await onSaveDiagnosis({
        patient_name: selectedApp.patient_name,
        patient_phone: selectedApp.patient_phone,
        patient_mrn: patientProfile?.mrn || `PLZ-${Math.floor(1000 + Math.random() * 9000)}`,
        specialty_ar: specialty || selectedApp.specialty_ar,
        doctor_name: doctorName,
        chief_complaint: chiefComplaint,
        diagnosis,
        vitals: {
          bp,
          hr,
          temp,
          blood_sugar: sugar,
          weight,
        },
        prescriptions: prescriptions.filter((p) => p.drug_name.trim()),
        lab_requests: labRequests,
        radiology_requests: radiologyRequests,
        clinical_notes: doctorNotes,
        follow_up_date: followUpDate,
      }, selectedApp.id);

      onNotice(`تم حفظ تشخيص المريض ${selectedApp.patient_name} بنجاح وإغلاق الكشف`);
      setDiagnosis('');
      setChiefComplaint('');
    } catch {
      onNotice('حدث خطأ أثناء حفظ التشخيص');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="doctor-workspace">
      {/* Top Banner */}
      <div className="bg-gradient-to-l from-teal-900 via-teal-800 to-cyan-900 text-white p-5 rounded-2xl mb-6 shadow-md flex items-center justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-teal-700/80 text-teal-100 text-xs px-2.5 py-1 rounded-full font-bold flex items-center gap-1">
              <Stethoscope className="w-3.5 h-3.5" />
              عيادة {specialty}
            </span>
            <Badge className="bg-emerald-500 text-white font-bold">العيادة تعمل والنداء نشط</Badge>
          </div>
          <h2 className="text-2xl font-bold text-white">مرحباً بك يا {doctorName}</h2>
          <p className="text-xs text-teal-100/90 mt-1">
            الحالات الواردة من الاستقبال جاهزة للفحص وتسجيل التشخيص وتحديث التاريخ الطبي التراكمي.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-white/10 backdrop-blur-sm border border-white/15 rounded-xl px-4 py-2 text-center">
            <small className="text-[10px] text-teal-200 block">حالات في الانتظار</small>
            <b className="text-xl font-bold text-white">{queuePatients.length}</b>
          </div>
          <div className="bg-white/10 backdrop-blur-sm border border-white/15 rounded-xl px-4 py-2 text-center">
            <small className="text-[10px] text-teal-200 block">فحوصات اليوم المكتملة</small>
            <b className="text-xl font-bold text-emerald-300">
              {appointments.filter((a) => a.status === 'completed').length}
            </b>
          </div>
        </div>
      </div>

      {/* Main Grid: Queue on Right, Clinical Examination on Left */}
      <div className="doctor-clinic-grid">
        {/* Right Column: Queue directed by Reception */}
        <div className="queue-panel">
          <div className="flex items-center justify-between border-b border-gray-100 pb-2">
            <h3>
              <Users className="w-4 h-4 text-teal-700" />
              طابور الانتظار (الاستقبال)
            </h3>
            <span className="text-[11px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full">
              {queuePatients.length} حالة
            </span>
          </div>

          {queuePatients.length === 0 ? (
            <div className="text-center py-12 text-gray-400 text-xs">
              <CheckCircle2 className="w-8 h-8 text-teal-600/30 mx-auto mb-2" />
              لا توجد حالات بانتظار الكشف حالياً.
              <br />
              <small className="text-gray-400">أي مريض يسجله الاستقبال سيظهر هنا فوراً.</small>
            </div>
          ) : (
            <div className="flex flex-col gap-2 max-h-[600px] overflow-y-auto pl-1">
              {queuePatients.map((app) => {
                const isSelected = app.id === selectedApp?.id;
                const isInsurance = app.billing_type === 'insurance';
                return (
                  <button
                    key={app.id}
                    onClick={() => handleSelectPatient(app)}
                    className={`patient-queue-card ${isSelected ? 'selected' : ''}`}
                  >
                    <div className="flex items-center justify-between">
                      <b className="text-xs text-gray-900">{app.patient_name}</b>
                      <span className="font-mono text-[10px] text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded">
                        {app.booking_code}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-[11px] text-gray-500">
                      <Clock className="w-3 h-3 text-gray-400" />
                      <span>{app.appointment_time}</span>
                      <span>· {app.visit_type}</span>
                    </div>

                    <div className="flex items-center justify-between mt-1 pt-1 border-t border-gray-100/80">
                      {isInsurance ? (
                        <span className="badge-insurance text-[9px] py-0.5">
                          <ShieldCheck className="w-2.5 h-2.5" />
                          تأمين: {app.insurance_company || 'معتمد'}
                        </span>
                      ) : (
                        <span className="badge-cash text-[9px] py-0.5">
                          <Activity className="w-2.5 h-2.5" />
                          كشف حر
                        </span>
                      )}

                      <Badge
                        variant="outline"
                        className={`text-[9px] px-1.5 py-0 ${app.status === 'checked_in' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-teal-50 text-teal-700 border-teal-200'}`}
                      >
                        {app.status === 'checked_in' ? 'وصل بالعيادة' : 'مؤكد'}
                      </Badge>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Left Column: Examination & Diagnosis Form */}
        <div className="consultation-form-card">
          {selectedApp ? (
            <>
              {/* Selected Patient Clinical Header */}
              <div className="patient-clinical-header">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="bg-white/20 text-white text-[10px] px-2 py-0.5 rounded font-mono">
                      {patientProfile?.mrn || 'PLZ-8842'}
                    </span>
                    {selectedApp.billing_type === 'insurance' ? (
                      <span className="bg-blue-500/30 text-blue-100 text-[11px] px-2 py-0.5 rounded flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3" />
                        تأمين: {selectedApp.insurance_company || 'شركة تأمين'}
                      </span>
                    ) : (
                      <span className="bg-emerald-500/30 text-emerald-100 text-[11px] px-2 py-0.5 rounded flex items-center gap-1">
                        <Activity className="w-3 h-3" />
                        حالة حرة (كشف بأسعار المركز)
                      </span>
                    )}
                  </div>
                  <h3 className="text-xl font-bold text-white">{selectedApp.patient_name}</h3>
                  <p className="text-xs text-teal-100/80 mt-0.5">
                    الهاتف: <span dir="ltr" className="font-mono">{selectedApp.patient_phone}</span>
                    {selectedApp.patient_address ? ` · العنوان: ${selectedApp.patient_address}` : ''}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowHistoryModal(true)}
                    className="bg-white text-teal-900 hover:bg-teal-50 text-xs font-bold shadow-sm"
                  >
                    <FileHeart className="w-4 h-4 ml-1 text-rose-600" />
                    التاريخ المرضي الشامل ({patientPastRecords.length} زيارات)
                  </Button>
                </div>
              </div>

              {/* Chronic Conditions Notice */}
              {patientProfile?.chronic_conditions && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4 flex items-start gap-2 text-xs text-amber-900">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <b>تنبيه التاريخ الصحي المزمن: </b>
                    <span>{patientProfile.chronic_conditions}</span>
                  </div>
                </div>
              )}

              {/* Vitals Recording Grid */}
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-2 flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-teal-700" />
                  العلامات الحيوية المقاسة (Vitals):
                </label>
                <div className="vitals-inputs-grid">
                  <label>
                    ضغط الدم (BP)
                    <Input value={bp} onChange={(e) => setBp(e.target.value)} placeholder="120/80" />
                  </label>
                  <label>
                    النبض (HR)
                    <Input value={hr} onChange={(e) => setHr(e.target.value)} placeholder="75" />
                  </label>
                  <label>
                    الحرارة (°C)
                    <Input value={temp} onChange={(e) => setTemp(e.target.value)} placeholder="37.0" />
                  </label>
                  <label>
                    السكر (mg/dL)
                    <Input value={sugar} onChange={(e) => setSugar(e.target.value)} placeholder="105" />
                  </label>
                </div>
              </div>

              {/* Chief Complaint */}
              <div className="mb-4">
                <label className="text-xs font-bold text-gray-700 block mb-1">
                  الشكوى الرئيسية الحالية (Chief Complaint):
                </label>
                <textarea
                  className="w-full border border-gray-300 rounded-lg p-3 text-xs focus:outline-teal-700 bg-gray-50/50"
                  rows={2}
                  placeholder="وصف شكوى المريض وأعراضه الحالية..."
                  value={chiefComplaint}
                  onChange={(e) => setChiefComplaint(e.target.value)}
                />
              </div>

              {/* Clinical Diagnosis - REQUIRED */}
              <div className="mb-4">
                <label className="text-xs font-bold text-teal-900 block mb-1 flex items-center gap-1">
                  <Stethoscope className="w-4 h-4 text-teal-700" />
                  التشخيص الطبي السريري (Clinical Diagnosis): *
                </label>
                <textarea
                  className="w-full border-2 border-teal-600/60 rounded-lg p-3 text-xs font-medium focus:outline-teal-700 bg-teal-50/20"
                  rows={3}
                  placeholder="اكتب التشخيص الطبي الدقيق للحالة، مثلاً: ارتفاع ضغط الدم الأساسي، التهاب المفاصل الروماتويدي..."
                  value={diagnosis}
                  onChange={(e) => setDiagnosis(e.target.value)}
                  required
                />
              </div>

              {/* Prescriptions & Medications */}
              <div className="mb-5 bg-gray-50 border border-gray-200 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <label className="text-xs font-bold text-gray-800 flex items-center gap-1.5 m-0">
                    <Sparkles className="w-4 h-4 text-teal-700" />
                    الروشتة والعلاج الدوائي المقرّر:
                  </label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addPrescription}
                    className="h-7 text-xs text-teal-800 border-teal-300 hover:bg-teal-50"
                  >
                    <Plus className="w-3.5 h-3.5 ml-1" /> إضافة صنف دواء
                  </Button>
                </div>

                <div className="flex flex-col gap-2">
                  {prescriptions.map((p, idx) => (
                    <div key={idx} className="grid grid-cols-12 gap-2 items-center bg-white p-2 border border-gray-200 rounded-lg">
                      <div className="col-span-5">
                        <Input
                          placeholder="اسم الدواء والتركيز (e.g. Concor 5mg)"
                          value={p.drug_name}
                          onChange={(e) => updatePrescription(idx, 'drug_name', e.target.value)}
                          className="h-8 text-xs"
                        />
                      </div>
                      <div className="col-span-4">
                        <Input
                          placeholder="الجرعة (e.g. قرص بعد الإفطار)"
                          value={p.dose}
                          onChange={(e) => updatePrescription(idx, 'dose', e.target.value)}
                          className="h-8 text-xs"
                        />
                      </div>
                      <div className="col-span-2">
                        <Input
                          placeholder="المدة (e.g. أسبوعين)"
                          value={p.duration}
                          onChange={(e) => updatePrescription(idx, 'duration', e.target.value)}
                          className="h-8 text-xs"
                        />
                      </div>
                      <div className="col-span-1 text-center">
                        <button
                          type="button"
                          onClick={() => removePrescription(idx)}
                          className="text-red-500 hover:text-red-700 p-1"
                          title="حذف الصنف"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Lab & Radiology Requests */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">
                    طلبات التحاليل المعملية:
                  </label>
                  <Input
                    placeholder="e.g. صورة دم كاملة CBC، سكر تراكمي HbA1c، وظائف كلى..."
                    value={labRequests}
                    onChange={(e) => setLabRequests(e.target.value)}
                    className="text-xs"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">
                    طلبات الأشعة والفحوصات:
                  </label>
                  <Input
                    placeholder="e.g. إيكو على القلب Echo، أشعة سينية على الصدر..."
                    value={radiologyRequests}
                    onChange={(e) => setRadiologyRequests(e.target.value)}
                    className="text-xs"
                  />
                </div>
              </div>

              {/* Doctor Notes & Follow-up */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">
                    ملاحظات وتوصيات للمريض:
                  </label>
                  <Input
                    placeholder="نظام غذائي، راحة، متابعة قياس الضغط..."
                    value={doctorNotes}
                    onChange={(e) => setDoctorNotes(e.target.value)}
                    className="text-xs"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-teal-700" />
                    موعد الاستشارة القادمة:
                  </label>
                  <Input
                    type="date"
                    value={followUpDate}
                    onChange={(e) => setFollowUpDate(e.target.value)}
                    className="text-xs"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="border-t border-gray-200 pt-4 flex items-center justify-between">
                <Button
                  variant="outline"
                  onClick={() => setShowHistoryModal(true)}
                  className="text-teal-800"
                >
                  <FileHeart className="w-4 h-4 ml-1" />
                  مراجعة التاريخ المرضي للمريض
                </Button>

                <Button
                  onClick={handleSave}
                  disabled={saving || !diagnosis.trim()}
                  className="bg-teal-700 hover:bg-teal-800 text-white font-bold px-6 py-2 h-10 shadow-md"
                >
                  {saving ? (
                    'جاري حفظ السجل الطبي...'
                  ) : (
                    <>
                      <Save className="w-4 h-4 ml-1.5" />
                      حفظ التشخيص في السجل الطبي وإنهاء الكشف
                    </>
                  )}
                </Button>
              </div>
            </>
          ) : (
            <div className="text-center py-24 text-gray-400">
              <Stethoscope className="w-12 h-12 text-teal-700/30 mx-auto mb-3" />
              <h3 className="text-base font-bold text-gray-700 mb-1">عيادة الفحص السريري</h3>
              <p className="text-xs text-gray-500">اختار مريضاً من طابور الانتظار على اليمين لبدء الفحص وتسجيل التشخيص.</p>
            </div>
          )}
        </div>
      </div>

      {/* Patient Medical History Modal */}
      {showHistoryModal && selectedApp && (
        <PatientHistoryModal
          patient={
            patientProfile || {
              id: 'temp',
              mrn: 'PLZ-1001',
              full_name_ar: selectedApp.patient_name,
              phone: selectedApp.patient_phone,
              billing_type: selectedApp.billing_type,
              insurance_company: selectedApp.insurance_company,
              address_ar: selectedApp.patient_address,
              chronic_conditions: 'حالة مسجلة بالاستقبال',
            }
          }
          records={patientPastRecords}
          onClose={() => setShowHistoryModal(false)}
        />
      )}
    </div>
  );
}
