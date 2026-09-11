'use client';

import { X, FileHeart, Calendar, Stethoscope, ShieldCheck, Pill, Activity, Clock, CheckCircle2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export interface MedicalRecordItem {
  id: string;
  patient_id?: string;
  patient_name: string;
  patient_phone: string;
  patient_mrn?: string;
  specialty_ar: string;
  doctor_name: string;
  chief_complaint?: string;
  diagnosis: string;
  vitals?: {
    bp?: string;
    hr?: number | string;
    temp?: number | string;
    blood_sugar?: number | string;
    weight?: number | string;
  };
  prescriptions?: Array<{ drug_name: string; dose: string; duration: string }> | string;
  lab_requests?: string;
  radiology_requests?: string;
  clinical_notes?: string;
  follow_up_date?: string;
  created_at: string;
}

export interface PatientData {
  id: string;
  mrn: string;
  full_name_ar: string;
  phone: string;
  gender?: string;
  date_of_birth?: string;
  blood_group?: string;
  address_ar?: string;
  billing_type: 'cash' | 'insurance';
  insurance_company?: string;
  insurance_card_number?: string;
  chronic_conditions?: string;
  created_at?: string;
}

interface Props {
  patient: PatientData;
  records: MedicalRecordItem[];
  onClose: () => void;
  onNewConsultation?: () => void;
}

export function PatientHistoryModal({ patient, records, onClose, onNewConsultation }: Props) {
  const isInsurance = patient.billing_type === 'insurance';

  return (
    <div className="modal-layer" role="dialog" aria-modal="true" aria-label="الملف الطبي والتاريخ المرضي">
      <div className="modal-backdrop" onClick={onClose} />
      <div className="booking-modal" style={{ maxWidth: '900px' }}>
        <header className="border-b border-gray-200 pb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="outline" className="text-teal-700 bg-teal-50 border-teal-200">
                الملف الطبي الإلكتروني (EMR)
              </Badge>
              {isInsurance ? (
                <span className="badge-insurance">
                  <ShieldCheck className="w-3 h-3" />
                  مؤمّن: {patient.insurance_company || 'شركة تأمين معتمدة'} {patient.insurance_card_number ? `(${patient.insurance_card_number})` : ''}
                </span>
              ) : (
                <span className="badge-cash">
                  <Activity className="w-3 h-3" />
                  كشف حر (أسعار المركز العادية)
                </span>
              )}
            </div>
            <h2 className="text-2xl font-bold text-gray-900">{patient.full_name_ar}</h2>
            <p className="text-xs text-gray-500 mt-1">
              الرقم الطبي الموحد: <b className="text-teal-800 font-mono">{patient.mrn}</b> · الهاتف: <span dir="ltr" className="font-mono">{patient.phone}</span>
              {patient.address_ar ? ` · العنوان: ${patient.address_ar}` : ''}
            </p>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-700">
            <X className="w-5 h-5" />
          </button>
        </header>

        <div className="booking-body p-6 bg-gray-50/70">
          {/* Chronic Conditions Banner */}
          <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-4 mb-6">
            <h4 className="text-xs font-bold text-amber-900 flex items-center gap-2 mb-1">
              <FileHeart className="w-4 h-4 text-amber-700" />
              التاريخ الصحي المزمن والحساسية:
            </h4>
            <p className="text-xs text-amber-800 leading-relaxed">
              {patient.chronic_conditions || 'لا توجد أمراض مزمنة أو حساسية مسجلة مسبقاً.'}
            </p>
          </div>

          {/* Chronological Timeline */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-bold text-gray-800 flex items-center gap-2">
                <Clock className="w-4 h-4 text-teal-700" />
                سجل الزيارات والتشخيصات السابقة منذ أول زيارة:
              </h3>
              <span className="text-xs text-gray-500 font-medium">
                إجمالي الاستشارات: {records.length}
              </span>
            </div>

            {records.length === 0 ? (
              <div className="bg-white border border-gray-200 rounded-xl p-8 text-center text-gray-500 text-xs">
                لا توجد كشوفات أو تشخيصات سابقة مسجلة لهذا المريض بعد.
              </div>
            ) : (
              <div className="medical-history-timeline">
                {records.map((rec) => {
                  const vitals = rec.vitals || {};
                  let rxList: Array<{ drug_name: string; dose: string; duration: string }> = [];
                  if (Array.isArray(rec.prescriptions)) {
                    rxList = rec.prescriptions;
                  } else if (typeof rec.prescriptions === 'string' && rec.prescriptions.trim()) {
                    try {
                      const parsed = JSON.parse(rec.prescriptions);
                      if (Array.isArray(parsed)) rxList = parsed;
                    } catch {
                      // plain string
                    }
                  }

                  return (
                    <article key={rec.id} className="timeline-item">
                      <div className="timeline-item-head">
                        <div className="flex items-center gap-2">
                          <Stethoscope className="w-4 h-4 text-teal-700" />
                          <b className="text-sm text-gray-900">{rec.specialty_ar}</b>
                          <span className="text-xs text-gray-600">({rec.doctor_name})</span>
                        </div>
                        <span className="text-xs text-gray-500 font-mono flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-gray-400" />
                          {new Date(rec.created_at).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })}
                        </span>
                      </div>

                      <div className="timeline-item-body">
                        {rec.chief_complaint && (
                          <p className="mb-2">
                            <span className="text-gray-500 font-bold">شكوى المريض: </span>
                            <span className="text-gray-800">{rec.chief_complaint}</span>
                          </p>
                        )}

                        <div className="bg-teal-50/70 border border-teal-100 rounded-lg p-3 my-2">
                          <span className="text-xs font-bold text-teal-900 block mb-1">التشخيص الطبي:</span>
                          <p className="text-xs font-semibold text-teal-950 m-0">{rec.diagnosis}</p>
                        </div>

                        {/* Vitals if present */}
                        {(vitals.bp || vitals.hr || vitals.temp || vitals.blood_sugar) && (
                          <div className="flex flex-wrap gap-3 my-2 text-[11px] text-gray-600 bg-gray-50 border border-gray-200 rounded-md p-2">
                            {vitals.bp && <span>ضغط الدم: <b>{vitals.bp}</b></span>}
                            {vitals.hr && <span>النبض: <b>{vitals.hr} نبضة/د</b></span>}
                            {vitals.temp && <span>الحرارة: <b>{vitals.temp} °C</b></span>}
                            {vitals.blood_sugar && <span>السكر: <b>{vitals.blood_sugar} mg/dL</b></span>}
                          </div>
                        )}

                        {/* Prescriptions */}
                        {rxList.length > 0 && (
                          <div className="mt-3">
                            <span className="text-xs font-bold text-gray-700 flex items-center gap-1">
                              <Pill className="w-3.5 h-3.5 text-emerald-600" />
                              الروشتة والعلاج المقرّر:
                            </span>
                            <div className="prescriptions-tag-list">
                              {rxList.map((rx, idx) => (
                                <span key={idx} className="prescription-pill">
                                  {rx.drug_name} — {rx.dose} ({rx.duration})
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {rec.clinical_notes && (
                          <p className="text-xs text-gray-600 mt-2 italic bg-gray-50 p-2 rounded">
                            ملاحظات الطبيب: {rec.clinical_notes}
                          </p>
                        )}

                        {rec.follow_up_date && (
                          <p className="text-xs text-teal-700 font-bold mt-2 flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            موعد الاستشارة القادمة: {rec.follow_up_date}
                          </p>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <footer className="p-4 border-t border-gray-200 bg-white flex justify-between">
          <Button variant="outline" onClick={onClose}>إغلاق الملف</Button>
          {onNewConsultation && (
            <Button onClick={() => { onClose(); onNewConsultation(); }} className="bg-teal-700 hover:bg-teal-800 text-white">
              <Stethoscope className="w-4 h-4 ml-1" />
              بدء كشف وتشخيص جديد للمريض
            </Button>
          )}
        </footer>
      </div>
    </div>
  );
}
