'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import {
  Activity, ArrowLeft, ArrowRight, BadgeCheck, Bell, CalendarDays, Check,
  CircleDollarSign, Clock, Clock3, ExternalLink, Eye, EyeOff, FileHeart, FlaskConical,
  HeartPulse, Hospital, LayoutDashboard, LoaderCircle, LogOut, MapPin, Menu, MessageCircle,
  Navigation, Package, Phone, Plus, QrCode, Radio, Search, Settings, ShieldCheck,
  Sparkles, Stethoscope, TestTube2, Users, WalletCards, X, Building2, UserCheck, CheckCircle2,
  HardHat, AlertCircle, Brain, Scissors, Baby, Droplet, Scale
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { supabase } from '@/lib/supabase';
import { RolePersonaSwitcher, defaultPersonas, type Persona } from '@/components/RolePersonaSwitcher';
import { DoctorWorkspace, type DoctorAppointmentItem } from '@/components/DoctorWorkspace';
import { PatientHistoryModal, type MedicalRecordItem, type PatientData } from '@/components/PatientHistoryModal';
import { ReceptionBookingModal } from '@/components/ReceptionBookingModal';
import { OmniSearchBar } from '@/components/OmniSearchBar';
import { NotificationDrawer, type NotificationItem } from '@/components/NotificationDrawer';
import { AttendanceSection } from '@/components/AttendanceSection';
import { InteractiveFlowChart } from '@/components/InteractiveFlowChart';
import { MedicalCampaignsCarousel } from '@/components/MedicalCampaignsCarousel';

type Screen = 'home' | 'login' | 'erp';
type BookingData = { specialty: string; doctor: string; date: string; time: string; name: string; phone: string; visitType: string; notes: string; insurance: 'yes' | 'no'; insuranceCompany: string; patientAddress: string; homeVisit: boolean; branchId: string; branchName: string };

const clinics = [
  { name: 'أمراض الباطنة والسكر والسمنة والجهاز الهضمي', meta: 'سونار باطنة · ضبط سكر وتغذية · مناظير جهاز هضمي', icon: Stethoscope, doctors: 'د. حسين الشوري واستشاريون' },
  { name: 'المخ والأعصاب وجراحة العمود الفقري', meta: 'جراحة المخ والأعصاب · العمود الفقري · تأخر الحركة عند الأطفال', icon: Brain, doctors: 'د/ خالد مأمون مؤنس (قصر العيني)' },
  { name: 'جراحة عامة وجراحة أوعية دموية', meta: 'دوالي الساقين بالحقن والليزر · قسطرة الأوعية · جراحات عامة', icon: Activity, doctors: 'د. عادل عبد المنعم يونس' },
  { name: 'مسالك بولية وأمراض ذكورة وعقم', meta: 'تفتيت حصوات · مناظير مسالك · علاج العقم والذكورة', icon: FlaskConical, doctors: '٣ استشاريين' },
  { name: 'أخصائي أمراض القلب والأوعية الدموية', meta: 'قسطرة قلبية · إيكو ورسم قلب · متابعة ضغط الدم', icon: HeartPulse, doctors: 'د. أحمد عادل' },
  { name: 'أمراض الدم', meta: 'تشخيص الأنيميا · اعتلالات التجلط والصفائح · أمراض الدم المناعية', icon: Droplet, doctors: 'استشاريو أمراض الدم' },
  { name: 'جراحة عامة ومناظير وجراحة أورام الثدي', meta: 'استئصال الأورام · جراحات المناظير الدقيقة · المسح المبكر', icon: Scissors, doctors: 'وحدة جراحة الأورام' },
  { name: 'غدد صماء وسكر الأطفال', meta: 'سكر الأطفال واليافعين · قصر القامة وتأخر النمو · الغدد', icon: Baby, doctors: 'د. سارة فتحي واستشاريون' },
  { name: 'السمنة والنحافة', meta: 'تغذية علاجية متخصصة · إنقاص وزيادة الوزن · فحص InBody', icon: Scale, doctors: 'أخصائيو السمنة والتغذية' },
  { name: 'نساء وتوليد', meta: 'متابعة الحمل الحرج · سونار 4D · ولادة بدون ألم ورعاية المرأة', icon: Users, doctors: '٤ استشاريات' },
  { name: 'مخ وأعصاب وفسيولوجيا الأعصاب الإكلينيكية', meta: 'رسم المخ (EEG) · رسم العضلات وسرعة الأعصاب (EMG)', icon: Brain, doctors: 'وحدة الفسيولوجيا العصبية' },
  { name: 'جراحة المسالك البولية والتناسلية', meta: 'جراحات البروستاتا بالتبخير · إصلاح مجرى البول والتشوهات', icon: Hospital, doctors: 'نخبة جراحي المسالك' },
  { name: 'الأشعة التشخيصية والسونار', meta: 'رنين مغناطيسي · أشعة مقطعية · دوبلر وسونار متقدم', icon: Radio, doctors: 'فريق استشاريي الأشعة' },
  { name: 'التحاليل الطبية والمعامل', meta: 'سحب منزلي مجاني · نتائج فورية رقمية · فحص هرمونات وشامل', icon: TestTube2, doctors: 'معمل بلازما المعتمد' },
  { name: 'طب وجراحة الأسنان', meta: 'زراعة وتجميل الأسنان · هوليوود سمايل · تقويم وعلاج جذور', icon: BadgeCheck, doctors: 'عيادات الأسنان المتكاملة' },
];

const doctorsList = [
  {
    name: 'د/ خالد مأمون مؤنس',
    title: 'مدرس واستشاري جراحة المخ والأعصاب وجراحة العمود الفقري',
    degree: 'كلية طب قصر العيني — جامعة القاهرة',
    next: 'اليوم · ٦:٣٠ م',
    initials: 'خم',
    accent: 'blue',
    specialty: 'المخ والأعصاب وجراحة العمود الفقري'
  },
  {
    name: 'دكتور حسين الشوري',
    title: 'استشاري الأمراض الباطنية والسكر والسمنة والجهاز الهضمي',
    degree: 'كشف بالسونار ومتابعة سكر دقيقة بخطة متكاملة',
    next: 'اليوم · ٧:٠٠ م',
    initials: 'حش',
    accent: 'mint',
    specialty: 'أمراض الباطنة والسكر والسمنة والجهاز الهضمي'
  },
  {
    name: 'دكتور عادل عبد المنعم يونس',
    title: 'استشاري الجراحة العامة وجراحة الأوعية الدموية',
    degree: 'علاج دوالي الساقين بالحقن والليزر من غير جراحة',
    next: 'غداً · ٥:٠٠ م',
    initials: 'عي',
    accent: 'sand',
    specialty: 'جراحة عامة وجراحة أوعية دموية'
  },
  {
    name: 'أ.د. أشرف عبد الفضيل السويفي',
    title: 'أستاذ واستشاري الغدد الصماء وسكر الأطفال',
    degree: 'قصر العيني والجامعات المصرية — لأول مرة بالحوامدية',
    next: 'الأحد · ٥:٠٠ م',
    initials: 'أس',
    accent: 'mint',
    specialty: 'غدد صماء وسكر الأطفال'
  },
  {
    name: 'دكتور عبد الرحمن الجابري',
    title: 'مدرس مساعد الجراحة العامة والمناظير وجراحة أورام الثدي',
    degree: 'عضو كلية الجراحين الملكية بإنجلترا (MRCS)',
    next: 'اليوم · ٨:٠٠ م',
    initials: 'عج',
    accent: 'blue',
    specialty: 'جراحة عامة ومناظير وجراحة أورام الثدي'
  },
  {
    name: 'دكتور أحمد مجدي الهواري',
    title: 'استشاري جراحة المسالك البولية وأمراض الذكورة والعقم',
    degree: 'استشاري جراحات المسالك الدقيقة والمناظير',
    next: 'غداً · ٦:٠٠ م',
    initials: 'أهـ',
    accent: 'sand',
    specialty: 'مسالك بولية وأمراض ذكورة وعقم'
  },
  {
    name: 'د/ دعاء عبد الرازق',
    title: 'استشاري أمراض الدم',
    degree: 'استشاري أمراض الدم والاعتلالات المناعية والتجلط',
    next: 'الإثنين · ٤:٣٠ م',
    initials: 'دع',
    accent: 'mint',
    specialty: 'أمراض الدم'
  },
  {
    name: 'دكتور محمد صابر قطب',
    title: 'أخصائي أمراض القلب والأوعية الدموية',
    degree: 'رسم قلب · إيكو · متابعة الضغط والكوليسترول',
    next: 'اليوم · ٧:٣٠ م',
    initials: 'مق',
    accent: 'blue',
    specialty: 'أخصائي أمراض القلب والأوعية الدموية'
  },
  {
    name: 'دكتور عمرو مصطفى',
    title: 'استشاري جراحة المسالك البولية والتناسلية',
    degree: 'مدرس جراحة المسالك بكلية طب قصر العيني',
    next: 'الثلاثاء · ٦:٠٠ م',
    initials: 'عم',
    accent: 'blue',
    specialty: 'جراحة المسالك البولية والتناسلية'
  },
  {
    name: 'دكتور زكريا محيسن',
    title: 'استشاري النساء والتوليد وتأخر الإنجاب',
    degree: 'استشاري النساء والتوليد بمستشفى الحوامدية العام',
    next: 'اليوم · ٧:٠٠ م',
    initials: 'زم',
    accent: 'mint',
    specialty: 'نساء وتوليد'
  },
  {
    name: 'دكتور داليا عبد المحسن',
    title: 'دكتوراه التغذية العلاجية وعلاج السمنة',
    degree: 'مدير إدارة التغذية بمديرية الصحة بالجيزة',
    next: 'الأربعاء · ٥:٠٠ م',
    initials: 'دم',
    accent: 'sand',
    specialty: 'السمنة والنحافة'
  },
  {
    name: 'د. أحمد عصام فولي',
    title: 'أخصائي أمراض المخ والأعصاب وفسيولوجيا الأعصاب الإكلينيكية',
    degree: 'أخصائي الفسيولوجيا العصبية ورسم المخ والأعصاب',
    next: 'الخميس · ٤:٠٠ م',
    initials: 'عف',
    accent: 'mint',
    specialty: 'مخ وأعصاب وفسيولوجيا الأعصاب الإكلينيكية'
  },
  {
    name: 'د. أحمد عادل',
    title: 'استشاري القلب والقسطرة التداخلية',
    degree: 'قصر العيني',
    next: 'اليوم · ٧:٣٠ م',
    initials: 'أع',
    accent: 'mint',
    specialty: 'أخصائي أمراض القلب والأوعية الدموية'
  },
  {
    name: 'د. سارة فتحي',
    title: 'استشاري طب الأطفال وغدد صماء وسكر الأطفال',
    degree: 'جامعة القاهرة',
    next: 'غدًا · ٤:٠٠ م',
    initials: 'سف',
    accent: 'sand',
    specialty: 'غدد صماء وسكر الأطفال'
  },
];

const insuranceCompanies = ['مصر للتأمين', 'ثروة كير', 'أكسا مصر', 'متلايف', 'بوبا مصر', 'جي أي جي (GIG)'];

// 6 Branches: 4 Active + 2 Under Construction
const initialBranches = [
  { id: 'b-hawamdia', name_ar: 'فرع الحوامدية الرئيسي', name_en: 'Main Al Hawamdia', address_ar: 'بجوار بنك الإسكندرية، أمام مرور الحوامدية', phone: '01021869999', city_ar: 'الجيزة', status: 'active', is_active: true, completion_rate: 100, opening_hours: '٩ ص - ١١ م', notes: 'الفرع الرئيسي المتكامل: عيادات، طوارئ، معمل، وأشعة' },
  { id: 'b-badrasheen', name_ar: 'فرع البدرشين', name_en: 'Al Badrasheen', address_ar: 'شارع النيل، مجمع العيادات التخصصية', phone: '01035719999', city_ar: 'الجيزة', status: 'active', is_active: true, completion_rate: 100, opening_hours: '٩ ص - ١١ م', notes: 'عيادات تخصصية متكاملة وقسم استقبال وطوارئ' },
  { id: 'b-tamouh', name_ar: 'فرع طموه / المنيب', name_en: 'Tamouh / El Mounib', address_ar: 'طريق مصر أسوان الزراعي، مدخل طموه', phone: '0238120999', city_ar: 'الجيزة', status: 'active', is_active: true, completion_rate: 100, opening_hours: '٩ ص - ١٠ م', notes: 'مركز سحب عينات واستقبال وعيادات خارجية' },
  { id: 'b-ayat', name_ar: 'فرع العياط', name_en: 'Al Ayat', address_ar: 'شارع الجيش، برج الأطباء، الدور الثاني', phone: '01021869998', city_ar: 'الجيزة', status: 'active', is_active: true, completion_rate: 100, opening_hours: '١٠ ص - ١٠ م', notes: 'عيادات استشارية متقدمة ومركز أشعة رقمي' },
  { id: 'b-october', name_ar: 'فرع مدينة 6 أكتوبر', name_en: '6th of October', address_ar: 'المحور المركزي، بالقرب من ميدان الحصري', phone: '01099912345', city_ar: 'الجيزة', status: 'under_construction', is_active: false, completion_rate: 75, opening_hours: 'قريباً', notes: 'فرع قيد التجهيز والتشطيب (نسبة الإنجاز ٧٥٪ - الافتتاح قريباً)' },
  { id: 'b-maadi', name_ar: 'فرع المعادي', name_en: 'Maadi Branch', address_ar: 'شارع النصر، المعادي الجديدة', phone: '01088854321', city_ar: 'القاهرة', status: 'under_construction', is_active: false, completion_rate: 40, opening_hours: 'المرحلة الإنشائية', notes: 'فرع قيد الإنشاء والترخيص (نسبة الإنجاز ٤٠٪ - الربع الأول ٢٠٢٧)' },
];

const initialPatientsData: PatientData[] = [
  { id: 'p1', mrn: 'PLZ-1001', full_name_ar: 'أحمد محمد السيد', phone: '01012345678', gender: 'male', billing_type: 'cash', address_ar: 'الحوامدية - شارع الجمهورية', chronic_conditions: 'ارتفاع ضغط الدم المزمن، حساسية موسمية خفيفة', created_at: '2026-08-10' },
  { id: 'p2', mrn: 'PLZ-1002', full_name_ar: 'منى عبد الرحمن حسن', phone: '01123456789', gender: 'female', billing_type: 'insurance', insurance_company: 'مصر للتأمين', insurance_card_number: 'MS-882941', address_ar: 'البدرشين - بجوار محطة القطار', chronic_conditions: 'حساسية شديدة من البنسلين ومشتقاته', created_at: '2026-08-18' },
  { id: 'p3', mrn: 'PLZ-1003', full_name_ar: 'محمود خليل إبراهيم', phone: '01234567890', gender: 'male', billing_type: 'insurance', insurance_company: 'أكسا مصر', insurance_card_number: 'AX-551029', address_ar: 'طموه - الجزيرة', chronic_conditions: 'داء السكري من النوع الثاني، جراحة غضروف قطني سابقة عام ٢٠٢٠', created_at: '2026-08-25' },
  { id: 'p4', mrn: 'PLZ-1004', full_name_ar: 'فاطمة علي الدسوقي', phone: '01555667788', gender: 'female', billing_type: 'cash', address_ar: 'العياط - شارع الكورنيش', chronic_conditions: 'لا توجد أمراض مزمنة، متابعة صحة المرأة', created_at: '2026-09-02' },
];

const initialAppointmentsData: DoctorAppointmentItem[] = [
  { id: 'app1', booking_code: 'PMT-24098', patient_name: 'أحمد محمد السيد', patient_phone: '01012345678', specialty_ar: 'القلب والأوعية الدموية', doctor_name: 'د. أحمد عادل', appointment_date: '2026-09-11', appointment_time: '٧:٣٠ م', visit_type: 'كشف جديد', billing_type: 'cash', status: 'checked_in', notes: 'صداع مستمر وخفقان سريع', branch_id: 'b-hawamdia' },
  { id: 'app2', booking_code: 'PMT-24097', patient_name: 'منى عبد الرحمن حسن', patient_phone: '01123456789', specialty_ar: 'طب الأطفال', doctor_name: 'د. سارة فتحي', appointment_date: '2026-09-11', appointment_time: '٨:٠٠ م', visit_type: 'متابعة', billing_type: 'insurance', insurance_company: 'مصر للتأمين', status: 'checked_in', notes: 'ارتفاع في درجة حرارة الطفل وكحة', branch_id: 'b-badrasheen' },
  { id: 'app3', booking_code: 'PMT-24096', patient_name: 'محمود خليل إبراهيم', patient_phone: '01234567890', specialty_ar: 'العظام والمفاصل', doctor_name: 'د. محمد الشاذلي', appointment_date: '2026-09-11', appointment_time: '٨:٣٠ م', visit_type: 'كشف جديد', billing_type: 'insurance', insurance_company: 'أكسا مصر', status: 'confirmed', notes: 'ألم حاد في الركبة اليمنى بعد التواء', branch_id: 'b-hawamdia' },
  { id: 'app4', booking_code: 'PMT-24095', patient_name: 'فاطمة علي الدسوقي', patient_phone: '01555667788', specialty_ar: 'النساء والتوليد', doctor_name: 'د. رانيا يوسف', appointment_date: '2026-09-11', appointment_time: '٩:٠٠ م', visit_type: 'متابعة حمل', billing_type: 'cash', status: 'confirmed', notes: 'سونار ومتابعة شهر سابع', branch_id: 'b-ayat' },
];

const initialMedicalRecords: MedicalRecordItem[] = [
  {
    id: 'mr1',
    patient_name: 'أحمد محمد السيد',
    patient_phone: '01012345678',
    patient_mrn: 'PLZ-1001',
    specialty_ar: 'القلب والأوعية الدموية',
    doctor_name: 'د. أحمد عادل',
    chief_complaint: 'صداع خلف الرأس مع دوخة وخفقان متكرر',
    diagnosis: 'ارتفاع أولي في ضغط الدم من الدرجة الأولى (Primary Essential Hypertension Stage 1)',
    vitals: { bp: '145/92', hr: 82, temp: 36.8, blood_sugar: 98, weight: 81 },
    prescriptions: [
      { drug_name: 'Concor 5mg', dose: 'قرص صباحاً على الريق', duration: 'مستمر' },
      { drug_name: 'Aspirin Protect 100mg', dose: 'قرص يومياً بعد الغداء', duration: 'مستمر' }
    ],
    lab_requests: 'صورة دم كاملة CBC، دهون ثلاثية وكوليسترول Lipid Profile',
    clinical_notes: 'الاستجابة جيدة، تم نصح المريض بتقليل الأملاح والمشي نصف ساعة يومياً',
    follow_up_date: '2026-09-25',
    created_at: '2026-08-11T19:30:00Z'
  },
  {
    id: 'mr2',
    patient_name: 'أحمد محمد السيد',
    patient_phone: '01012345678',
    patient_mrn: 'PLZ-1001',
    specialty_ar: 'الباطنة والسكر',
    doctor_name: 'د. إبراهيم فؤاد',
    chief_complaint: 'متابعة دورية لتحليل السكر الصائم',
    diagnosis: 'مرحلة ما قبل السكري (Impaired Fasting Glucose)',
    vitals: { bp: '130/84', hr: 76, temp: 37.0, blood_sugar: 118, weight: 80 },
    prescriptions: [
      { drug_name: 'Glucophage 500mg', dose: 'قرص مرة واحدة مع وجبة العشاء', duration: 'شهر' }
    ],
    clinical_notes: 'سكر تراكمي HbA1c بنسبة ٥.٩٪، ينصح بضبط السكريات والنشويات',
    follow_up_date: '2026-10-10',
    created_at: '2026-08-28T18:00:00Z'
  },
  {
    id: 'mr3',
    patient_name: 'محمود خليل إبراهيم',
    patient_phone: '01234567890',
    patient_mrn: 'PLZ-1003',
    specialty_ar: 'العظام والمفاصل',
    doctor_name: 'د. محمد الشاذلي',
    chief_complaint: 'ألم أسفل الظهر يمتد للساق اليمنى مع تنميل',
    diagnosis: 'انزلاق غضروفي قطني L4-L5 مع عرق النسا (Sciatica)',
    vitals: { bp: '125/80', hr: 74, temp: 36.9, blood_sugar: 135, weight: 89 },
    prescriptions: [
      { drug_name: 'Celebrex 200mg', dose: 'كبسولة بعد الأكل عند اللزوم', duration: '١٠ أيام' },
      { drug_name: 'Milga Advance', dose: 'قرص مرتين يومياً بعد الأكل', duration: 'شهر' }
    ],
    radiology_requests: 'رنين مغناطيسي MRI على الفقرات القطنية',
    clinical_notes: 'تم تحويل الحالة لجلسات علاج طبيعي وتجنب حمل الأوزان الثقيلة',
    follow_up_date: '2026-09-18',
    created_at: '2026-08-26T20:15:00Z'
  }
];

const initialBooking: BookingData = {
  specialty: 'القلب والأوعية الدموية',
  doctor: 'د. أحمد عادل',
  date: '2026-09-11',
  time: '٧:٣٠ م',
  name: '',
  phone: '',
  visitType: 'كشف جديد',
  notes: '',
  insurance: 'no',
  insuranceCompany: '',
  patientAddress: '',
  homeVisit: false,
  branchId: 'b-hawamdia',
  branchName: 'فرع الحوامدية الرئيسي'
};

function Brand({ light = false, compact = false }: { light?: boolean; compact?: boolean }) {
  return (
    <div className={`brand ${light ? 'light' : ''} ${compact ? 'compact' : ''}`}>
      <img className="brand-logo" src="/pmt-logo.jpeg" alt="برج بلازما الطبي" />
    </div>
  );
}

export default function Home() {
  const [screen, setScreen] = useState<Screen>('home');
  const [bookingOpen, setBookingOpen] = useState(false);
  const [bookingStep, setBookingStep] = useState(1);
  const [booking, setBooking] = useState(initialBooking);
  const [session, setSession] = useState<Session | null>(null);
  const [notice, setNotice] = useState('');

  // Active Role Persona (Default: Admin for comprehensive review)
  const [activePersona, setActivePersona] = useState<Persona>(defaultPersonas[0]);

  useEffect(() => {
    supabase?.auth.getSession().then(({ data }) => setSession(data.session));
    const listener = supabase?.auth.onAuthStateChange((_event, next) => setSession(next));

    // Support direct ERP query param: ?erp or ?screen=erp
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('screen') === 'erp' || params.has('erp') || params.get('view') === 'erp') {
        setScreen('erp');
      }
    }

    return () => listener?.data.subscription.unsubscribe();
  }, []);

  const openBooking = (specialty?: string, doctor?: string) => {
    setBooking((old) => ({ ...old, specialty: specialty || old.specialty, doctor: doctor || old.doctor }));
    setBookingStep(specialty ? 2 : 1);
    setBookingOpen(true);
  };

  const toast = (text: string) => {
    setNotice(text);
    window.setTimeout(() => setNotice(''), 3000);
  };

  return (
    <main dir="rtl" className="pmt-app">
      {screen === 'home' && (
        <PublicSite
          onBook={openBooking}
          onLogin={() => setScreen('erp')}
          branches={initialBranches}
        />
      )}

      {screen === 'login' && (
        <Login
          onBack={() => setScreen('home')}
          onSuccess={() => setScreen('erp')}
          onDemoSelect={(persona) => {
            setActivePersona(persona);
            setScreen('erp');
            toast(`تم تسجيل الدخول بصلاحية: ${persona.title}`);
          }}
        />
      )}

      {screen === 'erp' && (
        <ERP
          session={session}
          activePersona={activePersona}
          onSelectPersona={setActivePersona}
          onBack={() => setScreen('home')}
          onNotice={toast}
        />
      )}

      {bookingOpen && (
        <BookingWizard
          step={bookingStep}
          setStep={setBookingStep}
          data={booking}
          setData={setBooking}
          onClose={() => setBookingOpen(false)}
        />
      )}

      {notice && (
        <div className="notice">
          <Check />
          {notice}
        </div>
      )}
    </main>
  );
}

function PublicSite({ onBook, onLogin, branches }: { onBook: (specialty?: string, doctor?: string) => void; onLogin: () => void; branches: typeof initialBranches }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    setMenuOpen(false);
  };

  return (
    <>
      {/* Direct ERP Access Announcement Top Banner */}
      <div className="bg-gradient-to-r from-teal-950 via-teal-900 to-teal-950 text-white px-4 py-2.5 flex items-center justify-between text-xs border-b border-teal-700/60 shadow-md flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
          <span className="font-bold">نظام الإدارة السريرية والـ ERP لبرج بلازما الطبي:</span>
          <span className="text-teal-200 hidden md:inline">لوحة التحكم، البحث الشامل، التنبيهات، الغياب والأوفر تايم، الفروع الستة، والعيادات.</span>
        </div>
        <button
          onClick={onLogin}
          className="bg-emerald-500 hover:bg-emerald-400 text-teal-950 font-bold px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 transition-transform active:scale-95 shadow cursor-pointer"
        >
          <LayoutDashboard className="w-3.5 h-3.5" />
          دخول لوحة التحكم والـ ERP فوراً
          <ArrowLeft className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="utility-bar">
        <div>
          <span><MapPin /> فروعنا: الحوامدية، البدرشين، طموه، العياط · وقريباً 6 أكتوبر والمعادي</span>
          <a href="tel:01021869999"><Phone /> 01021869999</a>
        </div>
        <div>
          <span className="open-dot" /> 4 فروع مفتوحة اليوم حتى ١١ مساءً
        </div>
      </div>

      <header className="main-header">
        <Brand />
        <nav className={menuOpen ? 'open' : ''}>
          <button onClick={() => scrollTo('home')}>الرئيسية</button>
          <button onClick={() => scrollTo('campaigns')}>استشارات النخبة</button>
          <button onClick={() => scrollTo('branches')}>الفروع (٦)</button>
          <button onClick={() => scrollTo('clinics')}>العيادات والتخصصات</button>
          <button onClick={() => scrollTo('doctors')}>الأطباء</button>
          <button onClick={() => scrollTo('services')}>الخدمات</button>
          <button onClick={() => scrollTo('contact')}>الموقع والتواصل</button>
        </nav>
        <div className="main-actions">
          <button className="staff-link font-bold text-teal-800 flex items-center gap-1.5 bg-teal-50 px-3 py-1.5 rounded-lg border border-teal-200 hover:bg-teal-100" onClick={onLogin}>
            <LayoutDashboard className="w-4 h-4 text-teal-700" />
            لوحة تحكم المنظومة (ERP)
          </button>
          <Button onClick={() => onBook()}>احجز كشف</Button>
          <button className="mobile-menu" aria-label="القائمة" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </header>

      <section className="new-hero" id="home">
        <div className="hero-grid-noise" aria-hidden="true" />
        <div className="hero-main">
          <Badge className="local-badge">
            <span className="signal-dot" /> شبكة رعاية متكاملة تغطي الجيزة والقاهرة
          </Badge>
          <p className="hero-kicker">برج بلازما الطبي · رعاية تخصصية تليق بأهلك</p>
          <h1>رعاية قريبة.<br /><em>ونبض يطمنك.</em></h1>
          <p>
            سواء كنت كشفاً حراً أو تابعاً لإحدى كبرى شركات التأمين، أطباؤنا متاحون لخدمتك في ٤ فروع عاملة مع خطة توسع متقدمة بفرعين جديدين.
          </p>
          <div className="hero-cta flex flex-wrap gap-3 items-center">
            <Button size="lg" onClick={() => onBook()}>احجز موعدك الآن <ArrowLeft /></Button>
            <Button size="lg" variant="outline" onClick={onLogin} className="border-teal-700 text-teal-900 bg-white hover:bg-teal-50 font-bold">
              <LayoutDashboard className="w-4 h-4 ml-1 text-teal-700" />
              لوحة التحكم والـ ERP (مباشر)
            </Button>
            <a className="whatsapp-btn" href="https://wa.me/201021869999" target="_blank" rel="noreferrer">
              <MessageCircle /> كلمنا واتساب
            </a>
          </div>
          <div className="vitals-card" aria-label="مؤشر الخدمة المباشرة">
            <div className="vitals-title">
              <span className="live-dot" /> الخدمة تعمل الآن بكافة الفروع
              <small>تحديث مباشر</small>
            </div>
            <svg viewBox="0 0 620 86" className="pulse-line" aria-hidden="true">
              <path className="pulse-fade" d="M0 44H116l18-18 20 48 29-67 25 37h74l21-18 19 18h123l19-18 19 18h138" />
              <path className="pulse-stroke" d="M0 44H116l18-18 20 48 29-67 25 37h74l21-18 19 18h123l19-18 19 18h138" />
            </svg>
            <div className="vitals-values">
              <span><b>٤ فروع</b>عاملة بكفاءة</span>
              <span><b>فرعان</b>تحت الإنشاء</span>
              <span><b>٩٨٪</b>رضا الزوار</span>
            </div>
          </div>
        </div>

        <div className="hero-photo">
          <div className="hero-orbit orbit-one" aria-hidden="true" />
          <div className="hero-orbit orbit-two" aria-hidden="true" />
          <img src="/egyptian-care-hero.png" alt="طبيبة مصرية تتحدث مع أم وابنتها في عيادة حديثة" />
          <div className="photo-label">
            <span><BadgeCheck /> استقبال ومتابعة يومية بكافة الفروع</span>
            <strong>السبت–الخميس ٩ص–١١م</strong>
          </div>
          <div className="floating-ticket">
            <span>أقرب موعد متاح</span>
            <b>اليوم · ٧:٣٠ م</b>
            <button onClick={() => onBook('القلب والأوعية الدموية', 'د. أحمد عادل')}>
              احجزه الآن <ArrowLeft />
            </button>
          </div>
          <div className="care-beacon">
            <HeartPulse />
            <span>متابعة حية<br /><b>مع كل زيارة</b></span>
          </div>
        </div>
      </section>

      {/* Quick Navigation Strip */}
      <section className="quick-strip">
        <a href="tel:01021869999">
          <span><Phone /></span>
          <div>
            <b>احجز بالتليفون</b>
            <small>01021869999</small>
          </div>
          <ArrowLeft />
        </a>
        <button onClick={() => onBook()}>
          <span><CalendarDays /></span>
          <div>
            <b>حجز أونلاين</b>
            <small>اختار دكتورك وفرعك</small>
          </div>
          <ArrowLeft />
        </button>
        <button onClick={() => scrollTo('branches')}>
          <span><Building2 /></span>
          <div>
            <b>فروعنا الستة</b>
            <small>٤ عاملة + ٢ قيد التجهيز</small>
          </div>
          <ArrowLeft />
        </button>
        <a href="https://wa.me/201021869999" target="_blank" rel="noreferrer">
          <span><MessageCircle /></span>
          <div>
            <b>خدمة العملاء</b>
            <small>واتساب على مدار الساعة</small>
          </div>
          <ArrowLeft />
        </a>
      </section>

      {/* Medical Campaigns & Elite Consultant Carousel */}
      <div id="campaigns">
        <MedicalCampaignsCarousel onBook={onBook} />
      </div>

      {/* Branches Showcase Section */}
      <section className="content-section bg-gray-50/50" id="branches">
        <div className="section-title">
          <div>
            <span className="overline">شبكة فروع بلازما</span>
            <h2>٤ فروع عاملة وفرعان تحت الإنشاء</h2>
          </div>
          <p>
            تنتشر فروع برج بلازما الطبي لتقديم خدمات طبية وسريرية بمعايير عالمية وربط موحد للسجلات الطبية.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {branches.map((b) => {
            const isActive = b.status === 'active';
            return (
              <article key={b.id} className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className={isActive ? 'badge-branch-active' : 'badge-branch-const'}>
                      {isActive ? 'فرع عامل ومتاح للحجز' : `تحت الإنشاء (${b.completion_rate}٪)`}
                    </span>
                    <span className="text-[11px] text-gray-500 font-bold">{b.city_ar}</span>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{b.name_ar}</h3>
                  <p className="text-xs text-gray-600 mb-3 flex items-start gap-1.5 leading-relaxed">
                    <MapPin className="w-3.5 h-3.5 text-teal-700 shrink-0 mt-0.5" />
                    {b.address_ar}
                  </p>

                  {!isActive && (
                    <div className="const-progress-wrap">
                      <div className="const-progress-label">
                        <span>نسبة الإنجاز والتجهيز:</span>
                        <span>{b.completion_rate}٪</span>
                      </div>
                      <div className="const-progress-bar">
                        <div className="const-progress-fill" style={{ width: `${b.completion_rate}%` }} />
                      </div>
                    </div>
                  )}

                  <p className="text-xs text-gray-500 bg-gray-50 p-2.5 rounded-lg border border-gray-100 mt-2">
                    {b.notes}
                  </p>
                </div>

                <div className="pt-4 mt-4 border-t border-gray-100 flex items-center justify-between">
                  <div className="text-xs text-gray-600">
                    <Clock3 className="w-3.5 h-3.5 inline ml-1 text-teal-700" />
                    {b.opening_hours}
                  </div>
                  {isActive ? (
                    <Button size="sm" onClick={() => onBook()} className="bg-teal-700 hover:bg-teal-800 text-white text-xs">
                      احجز بالفرع <ArrowLeft className="w-3.5 h-3.5 mr-1" />
                    </Button>
                  ) : (
                    <Badge variant="outline" className="text-amber-700 border-amber-300 bg-amber-50 text-[10px]">
                      الافتتاح قريباً
                    </Badge>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* Clinics Section */}
      <section className="content-section clinics-section" id="clinics">
        <div className="section-title">
          <div>
            <span className="overline">عيادات برج بلازما</span>
            <h2>التخصص الصح، من أول مرة.</h2>
          </div>
          <p>اختار التخصص واحجز مباشرة. نقبل الحالات الحرة والتعاقدات التأمينية الكبرى.</p>
        </div>
        <div className="clinic-grid">
          {clinics.map(({ name, meta, icon: Icon, doctors: count }, i) => (
            <button key={name} className={`clinic-tile clinic-${i}`} onClick={() => onBook(name)}>
              <span className="clinic-icon"><Icon /></span>
              <span className="clinic-copy">
                <b>{name}</b>
                <small>{meta}</small>
              </span>
              <span className="clinic-count">{count}</span>
              <ArrowLeft />
            </button>
          ))}
        </div>
      </section>

      {/* Doctors Section */}
      <section className="content-section doctors-section" id="doctors">
        <div className="section-title">
          <div>
            <span className="overline">نخبة الأطباء</span>
            <h2>استشاريون بخبرة سريرية رائدة</h2>
          </div>
          <button onClick={() => onBook()}>عرض كل المواعيد <ArrowLeft /></button>
        </div>
        <div className="new-doctor-grid">
          {doctorsList.map((doctor) => (
            <article className="new-doctor-card" key={doctor.name}>
              <div className={`doctor-avatar large ${doctor.accent}`}>{doctor.initials}</div>
              <Badge><span className="online-dot" /> متاح للحجز</Badge>
              <h3>{doctor.name}</h3>
              <p>{doctor.title}</p>
              <div className="doctor-facts">
                <span><BadgeCheck /> {doctor.degree}</span>
                <span><Clock3 /> {doctor.next}</span>
              </div>
              <Button variant="outline" onClick={() => onBook(doctor.specialty, doctor.name)}>
                اختار ميعاد <ArrowLeft />
              </Button>
            </article>
          ))}
        </div>
      </section>

      {/* Contact Section */}
      <section className="location-section" id="contact">
        <div className="map-art">
          <div className="map-grid" />
          <span className="road road-1" />
          <span className="road road-2" />
          <div className="map-pin">
            <MapPin />
            <b>برج بلازما الطبي</b>
            <small>الحوامدية · الجيزة</small>
          </div>
        </div>
        <div className="location-copy">
          <span className="overline">الفروع والتواصل</span>
          <h2>خدمة سريعة في قلب الجيزة</h2>
          <p>
            المقر الرئيسي بالحوامدية بجوار بنك الإسكندرية، أمام المرور. مع فروع في البدرشين، طموه، العياط، والفرعين الجديدين في 6 أكتوبر والمعادي.
          </p>
          <div className="phone-list">
            <a href="tel:01021869999"><Phone /> 01021869999</a>
            <a href="tel:01035719999"><Phone /> 01035719999</a>
            <a href="tel:0238120999"><Phone /> 02 3812 0999</a>
          </div>
          <a className="directions" href="https://maps.google.com/?q=Plasma+Medical+Tower+Al+Hawamdia" target="_blank" rel="noreferrer">
            افتح على خرائط جوجل <ExternalLink />
          </a>
        </div>
      </section>

      <footer className="new-footer">
        <Brand light />
        <div>
          <a href="tel:01021869999">الطوارئ والاستفسار: 01021869999</a>
          <span>© ٢٠٢٦ برج بلازما الطبي — منظومة الرعاية الطبية والإدارية الموحدة</span>
        </div>
        <button onClick={onLogin} className="flex items-center gap-1.5 text-teal-200 font-bold bg-teal-900/80 hover:bg-teal-800 px-3.5 py-1.5 rounded-lg border border-teal-700/60 transition-colors shadow-sm">
          لوحة تحكم المنظومة (ERP) <ArrowLeft className="w-4 h-4" />
        </button>
      </footer>
    </>
  );
}

function BookingWizard({ step, setStep, data, setData, onClose }: { step: number; setStep: (n: number) => void; data: BookingData; setData: (d: BookingData) => void; onClose: () => void }) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [bookingCode, setBookingCode] = useState('');
  const [branches, setBranches] = useState<Array<Record<string, any>>>(initialBranches.filter((b) => b.is_active));

  useEffect(() => {
    if (supabase) {
      supabase.from('pmt_branches').select('*').eq('is_active', true).order('created_at').then(({ data: rows }) => {
        if (rows && rows.length > 0) {
          setBranches(rows);
          if (!data.branchId) setData({ ...data, branchId: rows[0].id, branchName: rows[0].name_ar });
        }
      });
    }
  }, [data.branchId]);

  const update = (key: keyof BookingData, value: string) => setData({ ...data, [key]: value });

  const submit = async () => {
    setError('');
    if (!data.branchId || !data.name.trim() || !/^01[0125][0-9]{8}$/.test(data.phone)) {
      setError('اختار الفرع واكتب الاسم ورقم موبايل مصري صحيح.');
      return;
    }
    setSaving(true);
    const code = `PMT-${Date.now().toString().slice(-6)}`;

    if (supabase) {
      await supabase.from('pmt_appointments').insert({
        booking_code: code,
        patient_name: data.name.trim(),
        patient_phone: data.phone,
        specialty_ar: data.specialty,
        doctor_name: data.doctor,
        appointment_date: data.date,
        appointment_time: data.time,
        visit_type: data.visitType,
        notes: data.notes || null,
        billing_type: data.insurance === 'yes' ? 'insurance' : 'cash',
        insurance_company: data.insurance === 'yes' ? data.insuranceCompany : null,
        patient_address: data.patientAddress || null,
        home_visit_requested: data.homeVisit,
        branch_id: data.branchId
      });
    }

    setSaving(false);
    setBookingCode(code);
    setStep(5);
  };

  const canContinue = step === 1
    ? Boolean(data.branchId && data.specialty && data.insurance && (data.insurance === 'no' || data.insuranceCompany))
    : step === 2 ? data.doctor
      : step === 3 ? data.date && data.time
        : true;

  const selectedDate = ({ '2026-09-11': 'الجمعة ١١ سبتمبر', '2026-09-12': 'السبت ١٢ سبتمبر', '2026-09-13': 'الأحد ١٣ سبتمبر' } as Record<string, string>)[data.date] || data.date;

  return (
    <div className="modal-layer" role="dialog" aria-modal="true" aria-label="حجز موعد">
      <div className="modal-backdrop" onClick={onClose} />
      <div className="booking-modal">
        <header>
          <div>
            <Badge>حجز حقيقي ومؤكد</Badge>
            <h2>{step === 5 ? 'تم حجز موعدك بنجاح' : 'احجز في أقل من دقيقتين'}</h2>
          </div>
          <button onClick={onClose}><X /></button>
        </header>

        <div className="booking-progress">
          {['الفرع والتأمين', 'الطبيب', 'الموعد', 'بياناتك', 'التأكيد'].map((label, i) => (
            <span className={step >= i + 1 ? 'active' : ''} key={label}>
              <i>{step > i + 1 ? <Check /> : i + 1}</i>
              <b>{label}</b>
            </span>
          ))}
        </div>

        <div className="booking-body">
          {step === 1 && (
            <div className="booking-step">
              <span className="step-kicker">١ / ٤</span>
              <h3>اختار الفرع ونوع الكشف والتخصص</h3>

              <label className="branch-picker">
                الفرع الذي تريد الحجز فيه:
                <select
                  value={data.branchId}
                  onChange={(e) => {
                    const b = branches.find((item) => item.id === e.target.value);
                    setData({ ...data, branchId: e.target.value, branchName: b?.name_ar || '' });
                  }}
                >
                  {branches.map((b) => (
                    <option value={b.id} key={b.id}>{b.name_ar} — {b.address_ar}</option>
                  ))}
                </select>
              </label>

              <p className="step-hint">هل أنت تابع لشركة تأمين؟</p>
              <div className="insurance-choice">
                <button
                  type="button"
                  className={data.insurance === 'no' ? 'selected' : ''}
                  onClick={() => setData({ ...data, insurance: 'no', insuranceCompany: '' })}
                >
                  <b>كشف حر عادي</b>
                  <small>سداد نقدي في المركز بأسعار المكان</small>
                </button>
                <button
                  type="button"
                  className={data.insurance === 'yes' ? 'selected' : ''}
                  onClick={() => update('insurance', 'yes')}
                >
                  <b>نعم، مؤمّن عليّ</b>
                  <small>تغطية تأمينية معتمدة</small>
                </button>
              </div>

              {data.insurance === 'yes' && (
                <label className="inline-field">
                  شركة التأمين
                  <select value={data.insuranceCompany} onChange={(e) => update('insuranceCompany', e.target.value)}>
                    <option value="">اختار الشركة...</option>
                    {insuranceCompanies.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </label>
              )}

              <p className="step-hint">اختار التخصص المطلوب</p>
              <div className="booking-options">
                {clinics.slice(0, 6).map(({ name, icon: Icon }) => (
                  <button
                    key={name}
                    type="button"
                    className={data.specialty === name ? 'selected' : ''}
                    onClick={() => update('specialty', name)}
                  >
                    <Icon />
                    <b>{name}</b>
                    {data.specialty === name && <Check />}
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="booking-step">
              <span className="step-kicker">٢ / ٤</span>
              <h3>اختار الطبيب المناسب</h3>
              <div className="booking-doctors">
                {doctorsList.map((d) => (
                  <button
                    key={d.name}
                    type="button"
                    className={data.doctor === d.name ? 'selected' : ''}
                    onClick={() => update('doctor', d.name)}
                  >
                    <span className={`doctor-avatar ${d.accent}`}>{d.initials}</span>
                    <span>
                      <b>{d.name}</b>
                      <small>{d.title}</small>
                      <em>{d.next}</em>
                    </span>
                    {data.doctor === d.name && <Check />}
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="booking-step">
              <span className="step-kicker">٣ / ٤</span>
              <h3>اختار اليوم والموعد المناسب</h3>
              <div className="date-options">
                {[
                  ['2026-09-11', 'الجمعة', '١١ سبتمبر'],
                  ['2026-09-12', 'السبت', '١٢ سبتمبر'],
                  ['2026-09-13', 'الأحد', '١٣ سبتمبر'],
                ].map(([val, day, d]) => (
                  <button
                    key={val}
                    type="button"
                    className={data.date === val ? 'selected' : ''}
                    onClick={() => update('date', val)}
                  >
                    <small>{day}</small>
                    <b>{d}</b>
                  </button>
                ))}
              </div>

              <p className="slots-label">المواعيد المسائية المتاحة</p>
              <div className="time-options">
                {['٤:٠٠ م', '٥:٣٠ م', '٦:٣٠ م', '٧:٣٠ م', '٨:٣٠ م', '٩:٠٠ م'].map((time) => (
                  <button
                    key={time}
                    type="button"
                    className={data.time === time ? 'selected' : ''}
                    onClick={() => update('time', time)}
                  >
                    {time}
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 4 && (
            <form className="booking-step" onSubmit={(e) => { e.preventDefault(); submit(); }}>
              <span className="step-kicker">٤ / ٤</span>
              <h3>بيانات المريض للتأكيد</h3>
              <div className="booking-form">
                <label>
                  الاسم بالكامل
                  <Input value={data.name} onChange={(e) => update('name', e.target.value)} placeholder="مثال: أحمد محمد السيد" required />
                </label>
                <label>
                  رقم الموبايل
                  <Input value={data.phone} onChange={(e) => update('phone', e.target.value)} placeholder="01xxxxxxxxx" inputMode="tel" required />
                </label>
                <label>
                  العنوان بالتفصيل
                  <Input value={data.patientAddress} onChange={(e) => update('patientAddress', e.target.value)} placeholder="الشارع، الحي، المنطقة" />
                </label>
                <label className="check-field">
                  <input type="checkbox" checked={data.homeVisit} onChange={(e) => setData({ ...data, homeVisit: e.target.checked })} />
                  أحتاج طلب كشف منزلي
                </label>
                <label>
                  نوع الزيارة
                  <select value={data.visitType} onChange={(e) => update('visitType', e.target.value)}>
                    <option>كشف جديد</option>
                    <option>متابعة واستشارة</option>
                  </select>
                </label>
                <label>
                  ملاحظات
                  <textarea value={data.notes} onChange={(e) => update('notes', e.target.value)} placeholder="أي أعراض أو تفاصيل تود إخبار الطبيب بها" />
                </label>
              </div>
              {error && <p className="form-error">{error}</p>}
            </form>
          )}

          {step === 5 && (
            <div className="booking-success">
              <span className="success-icon"><Check /></span>
              <h3>حجزك اتأكد بنجاح يا {data.name.split(' ')[0]}</h3>
              <p>احتفظ بكود الحجز، واظهره لموظف الاستقبال بالفرع قبل موعدك بـ ١٥ دقيقة.</p>
              <div className="real-ticket">
                <div>
                  <small>كود الحجز</small>
                  <b>{bookingCode}</b>
                  <span>{data.doctor}<br />{data.specialty}</span>
                </div>
                <div>
                  <small>الفرع والميعاد</small>
                  <b>{data.branchName}</b>
                  <span>{selectedDate} · {data.time}</span>
                </div>
                <QrCode />
              </div>
              <div className="success-actions">
                <a
                  href={`https://wa.me/201021869999?text=${encodeURIComponent(`مرحباً، تم حجز موعدي برقم ${bookingCode} في ${data.branchName}`)}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  <MessageCircle /> تأكيد على واتساب
                </a>
                <button onClick={onClose}>إغلاق</button>
              </div>
            </div>
          )}
        </div>

        {step < 5 && (
          <footer>
            <Button variant="ghost" disabled={step === 1 || saving} onClick={() => setStep(step - 1)}>
              <ArrowRight /> السابق
            </Button>
            {step < 4 ? (
              <Button disabled={!canContinue || saving} onClick={() => setStep(step + 1)}>
                التالي <ArrowLeft />
              </Button>
            ) : (
              <Button disabled={saving} onClick={submit}>
                {saving ? <><LoaderCircle className="spin" /> جاري التأكيد</> : <>تأكيد الحجز <Check /></>}
              </Button>
            )}
          </footer>
        )}
      </div>
    </div>
  );
}

function Login({ onBack, onSuccess, onDemoSelect }: { onBack: () => void; onSuccess: () => void; onDemoSelect: (p: Persona) => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setMessage('');
    if (!supabase) {
      setMessage('خدمة الاتصال غير مفعلة.');
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setMessage('البريد الإلكتروني أو كلمة المرور غير صحيحة.');
      return;
    }
    onSuccess();
  };

  return (
    <section className="auth-screen">
      <div className="auth-visual">
        <Brand light />
        <div>
          <Badge><ShieldCheck /> نظام آمن وموحّد للكوادر الطبية والإدارية</Badge>
          <h1>إدارة الفروع.<br />والعيادات المتكاملة.</h1>
          <p>منظومة واحدة تربط المدير العام، مديري الفروع، الاستقبال، والأطباء مع سجل المرضى والتاريخ المرضي.</p>
        </div>
        <div className="auth-note">
          <ShieldCheck />
          <span>
            <b>اتصال مشفّر وقاعدة بيانات محمية</b>
            <small>عزل كامل للصلاحيات والبيانات السريرية عبر Supabase RLS</small>
          </span>
        </div>
      </div>

      <div className="auth-panel">
        <button className="auth-back" onClick={onBack}>
          <ArrowRight /> الرجوع للموقع
        </button>

        <form onSubmit={submit}>
          <span className="overline">بوابة فريق العمل والعيادات</span>
          <h2>أهلاً بعودتك</h2>
          <p>سجّل دخولك بالبريد المعتمد أو استخدم الدخول التجريبي السريع للأدوار.</p>

          {/* Fast Role Demo Selector */}
          <div className="bg-teal-50/80 border border-teal-200 rounded-xl p-3 mb-5">
            <span className="text-[11px] font-bold text-teal-900 block mb-2">
              ⚡ معاينة فورية حسب الدور (اضغط لتجربة أي دور مباشرة):
            </span>
            <div className="grid grid-cols-2 gap-2">
              {defaultPersonas.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => onDemoSelect(p)}
                  className="bg-white hover:bg-teal-100/70 border border-teal-200 text-right p-2 rounded-lg text-xs font-bold text-teal-950 transition-colors flex items-center gap-1.5"
                >
                  <p.icon className="w-3.5 h-3.5 text-teal-700 shrink-0" />
                  <span className="truncate">{p.title.split(' ')[0]} {p.title.split(' ')[1] || ''}: {p.name.split(' ')[0]}</span>
                </button>
              ))}
            </div>
          </div>

          <label>
            البريد الإلكتروني
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@plasmamedical.eg"
              autoComplete="email"
              required
            />
          </label>

          <label>
            كلمة المرور
            <div className="password-field">
              <Input
                type={show ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                required
              />
              <button type="button" aria-label="إظهار كلمة المرور" onClick={() => setShow(!show)}>
                {show ? <EyeOff /> : <Eye />}
              </button>
            </div>
          </label>

          {message && (
            <p className={message.startsWith('تم') ? 'form-success' : 'form-error'}>
              {message}
            </p>
          )}

          <Button type="submit" size="lg" disabled={loading} className="w-full mt-4">
            {loading ? <><LoaderCircle className="spin" /> جاري الدخول...</> : <>دخول آمن <ArrowLeft /></>}
          </Button>
        </form>
      </div>
    </section>
  );
}

function ERP({
  session,
  activePersona,
  onSelectPersona,
  onBack,
  onNotice
}: {
  session: Session | null;
  activePersona: Persona;
  onSelectPersona: (p: Persona) => void;
  onBack: () => void;
  onNotice: (s: string) => void;
}) {
  const [activeTab, setActiveTab] = useState('نظرة عامة');
  const [appointments, setAppointments] = useState<DoctorAppointmentItem[]>(initialAppointmentsData);
  const [patients, setPatients] = useState<PatientData[]>(initialPatientsData);
  const [medicalRecords, setMedicalRecords] = useState<MedicalRecordItem[]>(initialMedicalRecords);
  const [branches, setBranches] = useState(initialBranches);

  // Modals & Navigation Drawers
  const [receptionModalOpen, setReceptionModalOpen] = useState(false);
  const [selectedPatientForHistory, setSelectedPatientForHistory] = useState<PatientData | null>(null);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [notificationDrawerOpen, setNotificationDrawerOpen] = useState(false);

  // Quick Attendance (Clock In/Out) State
  const [isClockedIn, setIsClockedIn] = useState(false);
  const [clockInTime, setClockInTime] = useState<string | null>(null);

  // Real-time Digital Clock (Updates every second)
  const [currentTime, setCurrentTime] = useState<string>('');
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('ar-EG', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true
        })
      );
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  // Notifications State
  const [notifications, setNotifications] = useState<NotificationItem[]>([
    {
      id: 'notif-1',
      type: 'appointment',
      title: 'حالة جديدة في الاستقبال',
      message: 'سجلت أستاذة منّة وصول المريض أحمد محمد السيد لعيادة القلب (كشف حر).',
      time: 'منذ ٥ د',
      isRead: false,
      actionTab: 'المواعيد والاستقبال'
    },
    {
      id: 'notif-2',
      type: 'doctor_done',
      title: 'اكتمال فحص حالة د. أحمد عادل',
      message: 'أنهى د. أحمد عادل تشخيص المريض محمود خليل وحفظ الروشتة في السجل الطبي.',
      time: 'منذ ١٢ د',
      isRead: false,
      actionTab: 'السجل الطبي'
    },
    {
      id: 'notif-3',
      type: 'lab_ready',
      title: 'نتائج تحاليل معملية جاهزة',
      message: 'تم اعتماد نتائج صورة الدم الكاملة CBC للمريضة منى عبد الرحمن من معمل الحوامدية.',
      time: 'منذ ٢٥ د',
      isRead: true,
      actionTab: 'المعمل'
    },
    {
      id: 'notif-4',
      type: 'system',
      title: 'تقرير حضور الفروع الصباحي',
      message: 'اكتمل تسجيل بصمات الحضور في فرعي الحوامدية والبدرشين بنسبة ٩٤٪.',
      time: 'منذ ٤٥ د',
      isRead: true,
      actionTab: 'الغياب والحضور'
    }
  ]);

  // Handle Quick Attendance Toggle
  const handleToggleClockIn = () => {
    const timeStr = new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit', hour12: true });
    if (!isClockedIn) {
      setIsClockedIn(true);
      setClockInTime(timeStr);
      onNotice(`تم تسجيل بصمة حضور ${activePersona.name} الساعة ${timeStr} بنجاح ✅`);
      const newNotif: NotificationItem = {
        id: `notif-${Date.now()}`,
        type: 'system',
        title: 'تسجيل بصمة حضور',
        message: `سجل ${activePersona.name} (${activePersona.title}) حضوراً إلكترونياً الساعة ${timeStr}.`,
        time: 'الآن',
        isRead: false,
        actionTab: 'الغياب والحضور'
      };
      setNotifications((prev) => [newNotif, ...prev]);
    } else {
      setIsClockedIn(false);
      onNotice(`تم تسجيل بصمة انصراف ${activePersona.name} الساعة ${timeStr}`);
      const newNotif: NotificationItem = {
        id: `notif-${Date.now()}`,
        type: 'system',
        title: 'تسجيل بصمة انصراف',
        message: `سجل ${activePersona.name} (${activePersona.title}) انصرافاً إلكترونياً الساعة ${timeStr}.`,
        time: 'الآن',
        isRead: false,
        actionTab: 'الغياب والحضور'
      };
      setNotifications((prev) => [newNotif, ...prev]);
    }
  };

  // New staff form state
  const [newStaff, setNewStaff] = useState({ name: '', email: '', phone: '', role: 'doctor', branchId: 'b-hawamdia', specialty: 'القلب والأوعية الدموية' });
  const [staffSaving, setStaffSaving] = useState(false);

  // Load from Supabase on mount
  useEffect(() => {
    if (!supabase) return;

    supabase.from('pmt_branches').select('*').order('created_at').then(({ data }) => {
      if (data && data.length > 0) setBranches(data as any);
    });

    supabase.from('pmt_patients').select('*').order('created_at', { ascending: false }).then(({ data }) => {
      if (data && data.length > 0) setPatients(data as any);
    });

    supabase.from('pmt_appointments').select('*').order('created_at', { ascending: false }).then(({ data }) => {
      if (data && data.length > 0) setAppointments(data as any);
    });

    supabase.from('pmt_medical_records').select('*').order('created_at', { ascending: false }).then(({ data }) => {
      if (data && data.length > 0) setMedicalRecords(data as any);
    });
  }, []);

  // Filtered lists based on current role and branch scope
  const scopedAppointments = useMemo(() => {
    if (activePersona.role === 'admin' || activePersona.branchId === 'all') {
      return appointments;
    }
    // Branch manager / Reception / Doctor sees only their branch
    return appointments.filter((a) => !a.branch_id || a.branch_id === activePersona.branchId);
  }, [appointments, activePersona]);

  const scopedPatients = useMemo(() => {
    return patients;
  }, [patients]);

  // Handle Saving Clinical Diagnosis
  const handleSaveDiagnosis = async (record: Partial<MedicalRecordItem>, appointmentId?: string) => {
    const newRecord: MedicalRecordItem = {
      id: `mr-${Date.now()}`,
      patient_name: record.patient_name || '',
      patient_phone: record.patient_phone || '',
      patient_mrn: record.patient_mrn || 'PLZ-1001',
      specialty_ar: record.specialty_ar || 'القلب والأوعية الدموية',
      doctor_name: record.doctor_name || activePersona.name,
      chief_complaint: record.chief_complaint,
      diagnosis: record.diagnosis || '',
      vitals: record.vitals,
      prescriptions: record.prescriptions,
      lab_requests: record.lab_requests,
      radiology_requests: record.radiology_requests,
      clinical_notes: record.clinical_notes,
      follow_up_date: record.follow_up_date,
      created_at: new Date().toISOString(),
    };

    setMedicalRecords([newRecord, ...medicalRecords]);

    // Update appointment status to completed
    if (appointmentId) {
      setAppointments((prev) =>
        prev.map((app) => (app.id === appointmentId ? { ...app, status: 'completed' } : app))
      );
    }

    // Trigger alarm/notification for reception and doctor workspace
    const doctorFinishedNotif: NotificationItem = {
      id: `notif-${Date.now()}`,
      type: 'doctor_done',
      title: `انتهاء كشف: ${newRecord.patient_name}`,
      message: `أنهى الطبيب فحص وتشخيص ${newRecord.patient_name} بعيادة ${newRecord.specialty_ar}. تم حفظ الروشتة وجاهز لاستدعاء الحالة التالية.`,
      time: 'الآن',
      isRead: false,
      actionTab: 'المواعيد والاستقبال'
    };
    setNotifications((prev) => [doctorFinishedNotif, ...prev]);
    onNotice(`تم حفظ التشخيص والروشتة بنجاح، وإرسال تنبيه فوري للاستقبال لاستدعاء الحالة التالية! 🔔`);

    if (supabase) {
      await supabase.from('pmt_medical_records').insert(newRecord);
      if (appointmentId) {
        await supabase.from('pmt_appointments').update({ status: 'completed' }).eq('id', appointmentId);
      }
    }
  };

  // Handle Reception Booking
  const handleReceptionBook = async (data: any) => {
    const code = `PMT-${Date.now().toString().slice(-6)}`;
    const newApp: DoctorAppointmentItem = {
      id: `app-${Date.now()}`,
      booking_code: code,
      patient_name: data.patient_name,
      patient_phone: data.patient_phone,
      patient_address: data.patient_address,
      specialty_ar: data.specialty_ar,
      doctor_name: data.doctor_name,
      branch_id: data.branch_id,
      appointment_date: data.appointment_date,
      appointment_time: data.appointment_time,
      visit_type: data.visit_type,
      billing_type: data.billing_type,
      insurance_company: data.insurance_company,
      status: data.checkInNow ? 'checked_in' : 'confirmed',
      notes: data.notes,
    };

    // Check if patient exists, otherwise create
    const existing = patients.find((p) => p.phone === data.patient_phone);
    if (!existing) {
      const newPt: PatientData = {
        id: `p-${Date.now()}`,
        mrn: `PLZ-${Math.floor(1000 + Math.random() * 9000)}`,
        full_name_ar: data.patient_name,
        phone: data.patient_phone,
        billing_type: data.billing_type,
        insurance_company: data.insurance_company,
        insurance_card_number: data.insurance_card_number,
        address_ar: data.patient_address,
        chronic_conditions: data.chronic_conditions || 'لا توجد أمراض مزمنة مسجلة',
        created_at: new Date().toISOString(),
      };
      setPatients([newPt, ...patients]);
      if (supabase) await supabase.from('pmt_patients').insert(newPt);
    }

    setAppointments([newApp, ...appointments]);
    if (supabase) await supabase.from('pmt_appointments').insert(newApp);
  };

  // Handle Create Staff
  const handleCreateStaff = async (e: FormEvent) => {
    e.preventDefault();
    if (activePersona.role !== 'admin') {
      onNotice('إنشاء وتعيين الموظفين متاح للمدير العام فقط');
      return;
    }
    setStaffSaving(true);
    setTimeout(() => {
      setStaffSaving(false);
      onNotice(`تم إنشاء حساب ${newStaff.name} وتعيين دوره كـ (${newStaff.role}) بنجاح`);
      setNewStaff({ name: '', email: '', phone: '', role: 'doctor', branchId: 'b-hawamdia', specialty: 'القلب والأوعية الدموية' });
    }, 600);
  };

  const nav = [
    ['نظرة عامة', LayoutDashboard],
    ['عيادة الطبيب', Stethoscope],
    ['المرضى', Users],
    ['المواعيد والاستقبال', CalendarDays],
    ['الغياب والحضور', Clock],
    ['الفروع (٦)', Building2],
    ['السجل الطبي', FileHeart],
    ['المعمل', FlaskConical],
    ['الأشعة', Radio],
    ['الفواتير', WalletCards],
    ['الموظفون والصلاحيات', Settings],
  ] as const;

  return (
    <div className="ops-shell">
      {/* Sidebar */}
      <aside className="ops-sidebar">
        <Brand light />
        <nav>
          {nav.map(([label, Icon]) => {
            const isActive = activeTab === label;
            return (
              <button
                key={label}
                className={isActive ? 'active' : ''}
                onClick={() => {
                  setActiveTab(label);
                  onNotice(`تم الانتقال إلى: ${label}`);
                }}
              >
                <Icon />
                <span>{label}</span>
              </button>
            );
          })}
        </nav>

        {/* User Info & Persona Badge */}
        <div className="ops-user">
          <span>{activePersona.name.slice(0, 1)}</span>
          <div>
            <b>{activePersona.name}</b>
            <small>{activePersona.title}</small>
          </div>
          <button onClick={onBack} title="تسجيل الخروج والرجوع للموقع">
            <LogOut />
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <section className="ops-main">
        {/* Top Header */}
        <header>
          <div>
            <span>الجمعة، ١١ سبتمبر ٢٠٢٦ · برج بلازما الطبي</span>
            <h1>{activeTab}</h1>
          </div>

          <div className="flex items-center gap-2">
            {/* Quick Clock-in/out button */}
            <button
              onClick={handleToggleClockIn}
              className={`clock-in-btn ${isClockedIn ? 'clocked-in' : ''}`}
              title={isClockedIn ? `أنت مسجل حضور (${clockInTime}) - اضغط للبصمة والانصراف` : 'اضغط لتسجيل بصمة الحضور الآن'}
            >
              <Clock className="w-3.5 h-3.5 ml-1" />
              <span>{isClockedIn ? `حضور (${clockInTime})` : 'تسجيل حضور'}</span>
            </button>

            {/* Omnibar Search Button */}
            <button
              aria-label="البحث الشامل"
              onClick={() => setSearchModalOpen(true)}
              title="البحث الشامل في النظام (Ctrl+K)"
            >
              <Search />
            </button>

            {/* Notifications Dropdown */}
            <div className="relative">
              <button
                aria-label="التنبيهات"
                onClick={() => setNotificationDrawerOpen(!notificationDrawerOpen)}
                title="مركز التنبيهات والإشعارات"
              >
                <Bell />
                {notifications.filter((n) => !n.isRead).length > 0 && (
                  <i>{notifications.filter((n) => !n.isRead).length}</i>
                )}
              </button>

              <NotificationDrawer
                isOpen={notificationDrawerOpen}
                onClose={() => setNotificationDrawerOpen(false)}
                notifications={notifications}
                onMarkAllRead={() => {
                  setNotifications(notifications.map((n) => ({ ...n, isRead: true })));
                  onNotice('تم تحديد جميع التنبيهات كمقروءة');
                }}
                onClear={() => {
                  setNotifications([]);
                  onNotice('تم مسح جميع التنبيهات');
                }}
                onNavigate={(tab) => {
                  setActiveTab(tab);
                  onNotice(`تم الانتقال إلى: ${tab}`);
                }}
              />
            </div>

            <Button
              onClick={() => setReceptionModalOpen(true)}
              className="bg-teal-700 hover:bg-teal-800 text-white font-bold"
            >
              <Plus className="w-4 h-4 ml-1" /> مريض جديد (الاستقبال)
            </Button>
          </div>
        </header>

        <div className="ops-content">
          {/* Interactive Role Persona Switcher */}
          <RolePersonaSwitcher activePersona={activePersona} onSelectPersona={onSelectPersona} />

          {/* TAB 1: OVERVIEW */}
          {activeTab === 'نظرة عامة' && (
            <>
              <div className="ops-welcome">
                <div>
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300">
                      <span className="open-dot" /> النظام متصل والعيادات نشطة
                    </Badge>
                    <span className="text-xs text-gray-500 font-medium">الوردية الصباحية · ٦ فروع متزامنة</span>
                  </div>
                  <h2>{new Date().getHours() < 12 ? 'صباح الخير' : 'مساء الخير'}، {activePersona.name}</h2>
                  <p>
                    {activePersona.role === 'admin'
                      ? 'أنت تعمل بصلاحية المدير العام: إشراف كامل على الفروع الستة ومتابعة التقارير الموحدة.'
                      : activePersona.role === 'branch_manager'
                        ? `أنت في بوابة مدير الفرع: صلاحياتك محصورة حصرياً على (${activePersona.branchName}).`
                        : activePersona.role === 'doctor'
                          ? `أنت في عيادة (${activePersona.specialty}): استقبل الحالات وسجل التشخيص في السجل الطبي.`
                          : 'أنت في بوابة الاستقبال: سجّل المرضى، حدد كشف حر أو تأمين، ووجّه المريض للعيادة.'}
                  </p>
                </div>
                <div className="realtime-clock-badge">
                  <span className="realtime-pulse-dot" />
                  <Clock3 className="w-5 h-5 text-teal-700 shrink-0" />
                  <div className="flex flex-col">
                    <small>التوقيت الفعلي المباشر</small>
                    <b className="font-mono text-sm tracking-wide">{currentTime || '٠١:١٥:٤٢ م'}</b>
                  </div>
                </div>
              </div>

              {/* KPIs */}
              <div className="ops-kpis">
                <article>
                  <span><Users /></span>
                  <small>إجمالي المرضى بالفرع</small>
                  <b>{scopedPatients.length}</b>
                  <em>نشط ومسجل</em>
                </article>
                <article>
                  <span><Clock3 /></span>
                  <small>حالات بانتظار الكشف</small>
                  <b>{scopedAppointments.filter((a) => a.status === 'checked_in').length}</b>
                  <em>في طابور العيادة</em>
                </article>
                <article>
                  <span><ShieldCheck /></span>
                  <small>كشوفات التأمين المعتمد</small>
                  <b>{scopedAppointments.filter((a) => a.billing_type === 'insurance').length}</b>
                  <em>مصر للتأمين / أكسا / بوبا</em>
                </article>
                <article>
                  <span><CircleDollarSign /></span>
                  <small>حالات كشف حر (نقدي)</small>
                  <b>{scopedAppointments.filter((a) => a.billing_type === 'cash').length}</b>
                  <em>بأسعار المركز الرسمية</em>
                </article>
              </div>

              {/* Dynamic Interactive Daily Visits Chart */}
              <div className="mb-6">
                <InteractiveFlowChart onNotice={onNotice} />
              </div>

              {/* Appointments & Live Queue */}
              <div className="ops-grid">
                <article className="ops-card appointments-card">
                  <div className="ops-card-head">
                    <div>
                      <small>مباشر من الاستقبال والعيادات</small>
                      <h3>طابور الحالات اليوم</h3>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => setReceptionModalOpen(true)}>
                      <Plus className="w-3.5 h-3.5 ml-1" /> تسجيل حالة
                    </Button>
                  </div>

                  <div className="flex flex-col gap-1">
                    {scopedAppointments.slice(0, 5).map((r) => (
                      <div className="appointment-row" key={r.booking_code}>
                        <b>{r.booking_code}</b>
                        <div>
                          <strong>{r.patient_name}</strong>
                          <small>{r.specialty_ar} · {r.doctor_name} · {r.appointment_time}</small>
                        </div>
                        <div className="flex items-center gap-1.5">
                          {r.billing_type === 'insurance' ? (
                            <span className="badge-insurance text-[9px]">تأمين</span>
                          ) : (
                            <span className="badge-cash text-[9px]">حر</span>
                          )}
                          <Badge variant={r.status === 'checked_in' ? 'default' : 'outline'} className="text-[9px]">
                            {r.status === 'checked_in' ? 'بالعيادة' : r.status === 'completed' ? 'تم الكشف' : 'مؤكد'}
                          </Badge>
                          {r.status === 'checked_in' && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                onNotice(`🔔 نداء فوري: استدعاء المريض (${r.patient_name}) للدخول إلى عيادة ${r.specialty_ar} بالدور الثاني!`);
                              }}
                              className="text-[10px] h-6 px-2 text-teal-700 hover:bg-teal-50"
                              title="استدعاء الحالة للدخول للعيادة"
                            >
                              استدعاء
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </article>

                {/* Branches Status Overview */}
                <article className="ops-card">
                  <div className="ops-card-head">
                    <div>
                      <small>شبكة المنشأة</small>
                      <h3>حالة الفروع الستة</h3>
                    </div>
                    <Badge variant="outline" className="text-teal-800 bg-teal-50">٦ فروع</Badge>
                  </div>

                  <div className="flex flex-col gap-2.5">
                    {branches.map((b) => (
                      <div key={b.id} className="p-2.5 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-between">
                        <div>
                          <b className="text-xs text-gray-900 block">{b.name_ar}</b>
                          <span className="text-[10px] text-gray-500">{b.city_ar} · {b.opening_hours}</span>
                        </div>
                        <span className={b.status === 'active' ? 'badge-branch-active text-[9px]' : 'badge-branch-const text-[9px]'}>
                          {b.status === 'active' ? 'عامل' : `تحت الإنشاء (${b.completion_rate}٪)`}
                        </span>
                      </div>
                    ))}
                  </div>
                </article>
              </div>
            </>
          )}

          {/* TAB 2: DOCTOR CLINIC WORKSPACE */}
          {activeTab === 'عيادة الطبيب' && (
            <DoctorWorkspace
              doctorName={activePersona.role === 'doctor' ? activePersona.name : 'د. أحمد عادل'}
              specialty={activePersona.specialty || 'القلب والأوعية الدموية'}
              appointments={scopedAppointments}
              patients={scopedPatients}
              medicalRecords={medicalRecords}
              onSaveDiagnosis={handleSaveDiagnosis}
              onNotice={onNotice}
            />
          )}

          {/* TAB 3: PATIENTS DIRECTORY */}
          {activeTab === 'المرضى' && (
            <div>
              <div className="section-page-head">
                <div>
                  <Badge className="bg-teal-700 text-white">سجل المرضى الموحد</Badge>
                  <h2>ملفات المرضى والتاريخ المرضي</h2>
                  <p>تصفح بيانات المرضى، تصنيف الحساب (كشف حر / تأمين)، والتاريخ الصحي والزيارات السابقة.</p>
                </div>
                <Button onClick={() => setReceptionModalOpen(true)}>
                  <Plus className="w-4 h-4 ml-1" /> تسجيل مريض جديد
                </Button>
              </div>

              <div className="data-table rounded-2xl overflow-hidden shadow-sm">
                <div className="table-head">
                  <span>الرقم الطبي والمريض</span>
                  <span>الهاتف والعنوان</span>
                  <span>تصنيف الدفع</span>
                  <span>التاريخ الصحي المزمن</span>
                  <span>إجراء</span>
                </div>

                {scopedPatients.map((p) => {
                  const isInsurance = p.billing_type === 'insurance';
                  const recordCount = medicalRecords.filter(
                    (r) => r.patient_phone === p.phone || r.patient_name === p.full_name_ar
                  ).length;

                  return (
                    <div className="table-row" key={p.id}>
                      <div>
                        <b className="text-sm font-bold text-gray-900 block">{p.full_name_ar}</b>
                        <span className="font-mono text-xs text-teal-700 font-bold">{p.mrn}</span>
                      </div>

                      <div>
                        <span dir="ltr" className="font-mono font-medium block">{p.phone}</span>
                        <small className="text-gray-500">{p.address_ar || 'غير محدد'}</small>
                      </div>

                      <div>
                        {isInsurance ? (
                          <span className="badge-insurance">
                            <ShieldCheck className="w-3 h-3" />
                            تأمين: {p.insurance_company}
                          </span>
                        ) : (
                          <span className="badge-cash">
                            <Activity className="w-3 h-3" />
                            كشف حر
                          </span>
                        )}
                      </div>

                      <div>
                        <span className="text-xs text-gray-600 line-clamp-1">
                          {p.chronic_conditions || 'سليم / لا توجد أمراض مزمنة'}
                        </span>
                        <small className="text-teal-700 font-bold block mt-0.5">
                          {recordCount} استشارة مسجلة
                        </small>
                      </div>

                      <div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedPatientForHistory(p)}
                          className="text-xs text-teal-800 border-teal-300 hover:bg-teal-50"
                        >
                          <FileHeart className="w-3.5 h-3.5 ml-1 text-rose-600" />
                          فتح الملف الطبي
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 4: APPOINTMENTS & RECEPTION */}
          {activeTab === 'المواعيد والاستقبال' && (
            <div>
              <div className="section-page-head">
                <div>
                  <Badge className="bg-teal-700 text-white">الاستقبال والطوابير</Badge>
                  <h2>مواعيد المركز والحالات الوافدة</h2>
                  <p>إدارة الحجوزات، تصنيف نوع الكشف (حر أم تأمين)، وتأكيد وصول المريض وتوجيهه للعيادة.</p>
                </div>
                <div className="flex gap-2">
                  <Button onClick={() => setReceptionModalOpen(true)}>
                    <Plus className="w-4 h-4 ml-1" /> حجز واستقبال مريض
                  </Button>
                </div>
              </div>

              <div className="data-table rounded-2xl overflow-hidden shadow-sm">
                <div className="table-head">
                  <span>كود الحجز والمريض</span>
                  <span>العيادة والطبيب</span>
                  <span>الميعاد والفرع</span>
                  <span>طريقة السداد</span>
                  <span>الحالة والإجراء</span>
                </div>

                {scopedAppointments.map((app) => (
                  <div className="table-row" key={app.id}>
                    <div>
                      <b className="text-sm font-bold font-mono text-teal-800 block">{app.booking_code}</b>
                      <strong className="text-xs text-gray-900">{app.patient_name}</strong>
                      <span dir="ltr" className="text-[11px] text-gray-500 font-mono block">{app.patient_phone}</span>
                    </div>

                    <div>
                      <b className="text-xs text-gray-900 block">{app.specialty_ar}</b>
                      <small className="text-gray-600">{app.doctor_name}</small>
                    </div>

                    <div>
                      <span className="text-xs font-bold text-gray-800 block">{app.appointment_time}</span>
                      <small className="text-gray-500">{app.appointment_date}</small>
                    </div>

                    <div>
                      {app.billing_type === 'insurance' ? (
                        <span className="badge-insurance">
                          <ShieldCheck className="w-3 h-3" />
                          تأمين: {app.insurance_company}
                        </span>
                      ) : (
                        <span className="badge-cash">
                          <Activity className="w-3 h-3" />
                          كشف حر
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {app.status === 'confirmed' && (
                        <Button
                          size="sm"
                          onClick={() => {
                            setAppointments(appointments.map((a) => a.id === app.id ? { ...a, status: 'checked_in' } : a));
                            onNotice(`تم تسجيل وصول ${app.patient_name} وتحويله لعيادة ${app.specialty_ar}`);
                          }}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] h-7 px-2.5"
                        >
                          <UserCheck className="w-3.5 h-3.5 ml-1" />
                          تسجيل وصول
                        </Button>
                      )}

                      {app.status === 'checked_in' && (
                        <Button
                          size="sm"
                          onClick={() => {
                            setActiveTab('عيادة الطبيب');
                            onNotice(`تم فتح عيادة ${app.specialty_ar} لفحص المريض ${app.patient_name}`);
                          }}
                          className="bg-teal-700 hover:bg-teal-800 text-white text-[11px] h-7 px-2.5"
                        >
                          <Stethoscope className="w-3.5 h-3.5 ml-1" />
                          بدء الكشف
                        </Button>
                      )}

                      {app.status === 'completed' && (
                        <Badge className="bg-gray-100 text-gray-700 text-[10px]">
                          تم الكشف والتشخيص
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB: ATTENDANCE & OVERTIME */}
          {activeTab === 'الغياب والحضور' && (
            <AttendanceSection activeRole={activePersona.role} onNotice={onNotice} />
          )}

          {/* TAB 5: THE 6 BRANCHES */}
          {activeTab === 'الفروع (٦)' && (
            <div>
              <div className="section-page-head">
                <div>
                  <Badge className="bg-teal-700 text-white">إدارة المنظومة الجغرافية</Badge>
                  <h2>الفروع الستة لبرج بلازما الطبي</h2>
                  <p>٤ فروع عاملة بكامل طاقتها السريرية + فرعان قيد الإنشاء والتجهيز.</p>
                </div>
                {activePersona.role === 'admin' && (
                  <Badge variant="outline" className="text-teal-800 bg-teal-50 border-teal-300">
                    صلاحية إضافة وتعديل الفروع مفعلة
                  </Badge>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {branches.map((b) => {
                  const isActive = b.status === 'active';
                  return (
                    <article key={b.id} className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <span className={isActive ? 'badge-branch-active' : 'badge-branch-const'}>
                            {isActive ? 'فرع عامل ونشط' : `تحت الإنشاء (${b.completion_rate}٪)`}
                          </span>
                          <span className="text-xs text-gray-500 font-bold">{b.city_ar}</span>
                        </div>

                        <h3 className="text-xl font-bold text-gray-900 mb-2">{b.name_ar}</h3>
                        <p className="text-xs text-gray-600 mb-2 flex items-start gap-1.5 leading-relaxed">
                          <MapPin className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
                          {b.address_ar}
                        </p>
                        <p className="text-xs text-teal-800 font-mono mb-3">
                          <Phone className="w-3.5 h-3.5 inline ml-1" /> {b.phone}
                        </p>

                        {!isActive ? (
                          <div className="const-progress-wrap bg-amber-50/70 p-3 rounded-xl border border-amber-100">
                            <div className="const-progress-label text-amber-900">
                              <span className="flex items-center gap-1 font-bold">
                                <HardHat className="w-3.5 h-3.5 text-amber-700" />
                                تقدم الأعمال الإنشائية:
                              </span>
                              <b>{b.completion_rate}٪</b>
                            </div>
                            <div className="const-progress-bar">
                              <div className="const-progress-fill" style={{ width: `${b.completion_rate}%` }} />
                            </div>
                            <p className="text-[11px] text-amber-800 mt-2 m-0 leading-relaxed">
                              {b.notes}
                            </p>
                          </div>
                        ) : (
                          <div className="bg-teal-50/60 p-3 rounded-xl border border-teal-100 text-xs text-teal-900">
                            <b>الخدمات التشغيلية: </b>
                            {b.notes}
                          </div>
                        )}
                      </div>

                      <div className="pt-4 mt-5 border-t border-gray-100 flex items-center justify-between">
                        <span className="text-xs text-gray-500">
                          {b.opening_hours}
                        </span>
                        {activePersona.role === 'admin' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setBranches(branches.map((item) => item.id === b.id ? { ...item, is_active: !item.is_active } : item));
                              onNotice(`تم تحديث حالة ${b.name_ar}`);
                            }}
                            className="text-xs"
                          >
                            {b.is_active ? 'تعطيل مؤقت' : 'تفعيل'}
                          </Button>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 6: MEDICAL RECORDS (EMR) */}
          {activeTab === 'السجل الطبي' && (
            <div>
              <div className="section-page-head">
                <div>
                  <Badge className="bg-teal-700 text-white">السجل الإكلينيكي الطبي</Badge>
                  <h2>سجل التشخيصات والتقارير الطبية</h2>
                  <p>تاريخ الفحوصات والروشتات الصادرة من أطباء المركز لكافة الحالات.</p>
                </div>
              </div>

              <div className="data-table rounded-2xl overflow-hidden shadow-sm">
                <div className="table-head">
                  <span>المريض والتاريخ</span>
                  <span>العيادة والطبيب المعالج</span>
                  <span>التشخيص السريري</span>
                  <span>الروشتة المقررة</span>
                  <span>إجراء</span>
                </div>

                {medicalRecords.map((r) => {
                  const pt = patients.find((p) => p.phone === r.patient_phone || p.full_name_ar === r.patient_name);
                  let rxCount = 0;
                  if (Array.isArray(r.prescriptions)) rxCount = r.prescriptions.length;

                  return (
                    <div className="table-row" key={r.id}>
                      <div>
                        <b className="text-sm font-bold text-gray-900 block">{r.patient_name}</b>
                        <small className="text-gray-500 font-mono">
                          {new Date(r.created_at).toLocaleDateString('ar-EG')}
                        </small>
                      </div>

                      <div>
                        <b className="text-xs text-teal-800 block">{r.specialty_ar}</b>
                        <small className="text-gray-600">{r.doctor_name}</small>
                      </div>

                      <div>
                        <p className="text-xs font-semibold text-gray-900 m-0 line-clamp-2">
                          {r.diagnosis}
                        </p>
                        {r.chief_complaint && (
                          <small className="text-gray-500 block mt-0.5">الشكوى: {r.chief_complaint}</small>
                        )}
                      </div>

                      <div>
                        <span className="text-xs text-gray-600 font-medium block">
                          {rxCount > 0 ? `${rxCount} أصناف دوائية` : 'متابعة وفحوصات'}
                        </span>
                        {r.follow_up_date && (
                          <small className="text-teal-700 font-bold block">إعادة: {r.follow_up_date}</small>
                        )}
                      </div>

                      <div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            if (pt) setSelectedPatientForHistory(pt);
                            else setSelectedPatientForHistory({
                              id: 'temp',
                              mrn: r.patient_mrn || 'PLZ-1001',
                              full_name_ar: r.patient_name,
                              phone: r.patient_phone,
                              billing_type: 'cash',
                              chronic_conditions: 'حالة مسجلة بالعيادة'
                            });
                          }}
                          className="text-xs text-teal-800 border-teal-300 hover:bg-teal-50"
                        >
                          عرض الملف الكامل
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 7: LAB & RADIOLOGY */}
          {['المعمل', 'الأشعة'].includes(activeTab) && (
            <div>
              <div className="section-page-head">
                <div>
                  <Badge className="bg-teal-700 text-white">الخدمات التشخيصية</Badge>
                  <h2>{activeTab === 'المعمل' ? 'إدارة المعمل وسحب العينات' : 'قسم الأشعة والتصوير الطبي'}</h2>
                  <p>متابعة طلبات الفحوصات المحولة من الأطباء والنتائج الجاهزة للتسليم.</p>
                </div>
              </div>

              <div className="data-table rounded-2xl overflow-hidden shadow-sm">
                <div className="table-head">
                  <span>المريض</span>
                  <span>الفحص المطلوب</span>
                  <span>الحالة</span>
                  <span>تاريخ الطلب</span>
                  <span>إجراء</span>
                </div>
                {[
                  { id: 'l1', name: 'أحمد محمد السيد', test: 'تحليل صورة دم كاملة CBC + سكر صائم', status: 'جاهز للتسليم', date: 'اليوم' },
                  { id: 'l2', name: 'محمود خليل إبراهيم', test: 'رنين مغناطيسي MRI على الفقرات القطنية', status: 'قيد التنفيذ', date: 'اليوم' },
                  { id: 'l3', name: 'منى عبد الرحمن حسن', test: 'مزرعة بول ومضادات حيوية', status: 'قيد التحضير', date: 'أمس' },
                ].map((row) => (
                  <div className="table-row" key={row.id}>
                    <b>{row.name}</b>
                    <span className="text-xs font-bold text-gray-800">{row.test}</span>
                    <Badge variant="outline" className="text-teal-800 border-teal-300 bg-teal-50">
                      {row.status}
                    </Badge>
                    <span className="text-xs text-gray-500">{row.date}</span>
                    <Button size="sm" variant="ghost" onClick={() => onNotice('تم فتح تقرير النتيجة الرقمية')}>
                      عرض النتيجة
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 8: FINANCES */}
          {activeTab === 'الفواتير' && (
            <div>
              <div className="section-page-head">
                <div>
                  <Badge className="bg-teal-700 text-white">الماليات والحسابات</Badge>
                  <h2>إيرادات الكشوفات ومطالبات التأمين</h2>
                  <p>متابعة حركة النقدية الواردة من الكشف الحر ومطالبات شركات التأمين والمصروفات.</p>
                </div>
              </div>

              <div className="finance-summary">
                <article>
                  <small>إجمالي الوارد (كشف حر + تأمين)</small>
                  <b>٩٤٬٨٠٠ جنيه</b>
                </article>
                <article>
                  <small>المصروفات التشغيلية</small>
                  <b>١٦٬٢٠٠ جنيه</b>
                </article>
                <article>
                  <small>صافي الإيراد التشغيلي</small>
                  <b className="text-emerald-700">٧٨٬٦٠٠ جنيه</b>
                </article>
              </div>

              <div className="data-table rounded-2xl overflow-hidden shadow-sm">
                <div className="table-head">
                  <span>نوع الحركة</span>
                  <span>البند والتصنيف</span>
                  <span>الجهة أو الشركة</span>
                  <span>المبلغ</span>
                  <span>التاريخ</span>
                </div>
                {[
                  { id: 'f1', type: 'وارد', item: 'كشوفات نقدية (حالات حرة)', company: 'سداد نقدي مباشر', amount: '٥٢٬٠٠٠', date: 'اليوم' },
                  { id: 'f2', type: 'وارد', item: 'مطالبات تأمين صحي', company: 'مصر للتأمين + أكسا', amount: '٤٢٬٨٠٠', date: 'اليوم' },
                  { id: 'f3', type: 'صادر', item: 'مستلزمات معامل وأشعة', company: 'الموردين الطبيين', amount: '١٦٬٢٠٠', date: 'أمس' },
                ].map((f) => (
                  <div className="table-row" key={f.id}>
                    <Badge variant={f.type === 'وارد' ? 'default' : 'outline'}>{f.type}</Badge>
                    <b className="text-xs text-gray-900">{f.item}</b>
                    <span className="text-xs text-gray-600">{f.company}</span>
                    <b className="text-sm font-bold text-teal-800">{f.amount} جنيه</b>
                    <span className="text-xs text-gray-500">{f.date}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 9: STAFF & ROLES MANAGEMENT */}
          {activeTab === 'الموظفون والصلاحيات' && (
            <div>
              <div className="section-page-head">
                <div>
                  <Badge className="bg-teal-700 text-white">الهيكل الوظيفي والصلاحيات</Badge>
                  <h2>تصنيفات الموظفين وإدارة الأدوار</h2>
                  <p>تحديد الصلاحيات: المدير العام، مديرو الفروع، الاستقبال، الأطباء، وباقي الوحدات التشغيلية.</p>
                </div>
              </div>

              {/* Roles Breakdown Cards */}
              <div className="roles-grid mb-6">
                {[
                  ['المدير العام (الأدمن)', 'صاحب المنشأة، تحكم شامل في كافة الفروع والوحدات والتقارير المالية والسريرية.'],
                  ['مدير الفرع (Branch Manager)', 'نفس صلاحيات الإدارة التشغيلية ولكن مقيدة حصرياً بالفرع الخاص به.'],
                  ['الاستقبال (Reception)', 'تسجيل المرضى، تصنيف (كشف حر / تأمين صحي)، إدارة المواعيد، وتحويل الحالات للعيادات.'],
                  ['الأطباء (Doctors)', 'فحص الحالات، الاطلاع على التاريخ المرضي، تسجيل التشخيص والروشتة في السجل الطبي.'],
                  ['المعمل والتحاليل', 'استلام العينات، تنفيذ التحاليل الطبية، ورفع النتائج على النظام.'],
                  ['الأشعة والتصوير', 'جدولة فحوصات الأشعة والرنين والسونار وإصدار التقارير.'],
                  ['الحسابات والماليات', 'متابعة الإيرادات النقدية، مطالبات شركات التأمين، وتسويات الأطباء.'],
                ].map(([title, desc]) => (
                  <article key={title} className="rounded-xl">
                    <ShieldCheck />
                    <b>{title}</b>
                    <p>{desc}</p>
                  </article>
                ))}
              </div>

              {/* Form to Create New Staff / Doctor */}
              {activePersona.role === 'admin' && (
                <form className="staff-create-form rounded-2xl" onSubmit={handleCreateStaff}>
                  <div>
                    <span className="overline">إضافة موظف / طبيب جديد</span>
                    <h3>تعيين عضو فريق عمل جديد وربطه بفرع ودور</h3>
                    <p>يتم تعيين الصلاحية وتحديد الفرع المسؤول عنه وعيادة التخصص فوراً.</p>
                  </div>

                  <Input
                    placeholder="الاسم بالكامل (e.g. د. مصطفى الشريف)"
                    value={newStaff.name}
                    onChange={(e) => setNewStaff({ ...newStaff, name: e.target.value })}
                    required
                  />

                  <Input
                    type="email"
                    placeholder="البريد الإلكتروني (e.g. m.sherif@plasmamedical.eg)"
                    value={newStaff.email}
                    onChange={(e) => setNewStaff({ ...newStaff, email: e.target.value })}
                    required
                  />

                  <Input
                    placeholder="رقم الموبايل"
                    value={newStaff.phone}
                    onChange={(e) => setNewStaff({ ...newStaff, phone: e.target.value })}
                    required
                  />

                  <select
                    value={newStaff.role}
                    onChange={(e) => setNewStaff({ ...newStaff, role: e.target.value })}
                  >
                    <option value="doctor">طبيب معالج</option>
                    <option value="branch_manager">مدير فرع</option>
                    <option value="reception">موظف استقبال</option>
                    <option value="laboratory">أخصائي معمل</option>
                    <option value="radiology">أخصائي أشعة</option>
                    <option value="accounting">محاسب</option>
                    <option value="admin">مدير نظام عام</option>
                  </select>

                  <select
                    value={newStaff.branchId}
                    onChange={(e) => setNewStaff({ ...newStaff, branchId: e.target.value })}
                  >
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name_ar} {b.status !== 'active' ? '(قيد الإنشاء)' : ''}
                      </option>
                    ))}
                  </select>

                  {newStaff.role === 'doctor' && (
                    <select
                      value={newStaff.specialty}
                      onChange={(e) => setNewStaff({ ...newStaff, specialty: e.target.value })}
                    >
                      {clinics.map((c) => (
                        <option key={c.name} value={c.name}>{c.name}</option>
                      ))}
                    </select>
                  )}

                  <div className="col-span-2 pt-2">
                    <Button type="submit" disabled={staffSaving} className="bg-teal-700 hover:bg-teal-800 text-white font-bold">
                      {staffSaving ? 'جاري الحفظ...' : 'حفظ وتفعيل الحساب'}
                    </Button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Reception Booking Modal */}
      {receptionModalOpen && (
        <ReceptionBookingModal
          branches={branches}
          defaultBranchId={activePersona.branchId !== 'all' ? activePersona.branchId : 'b-hawamdia'}
          onClose={() => setReceptionModalOpen(false)}
          onBook={handleReceptionBook}
          onNotice={onNotice}
        />
      )}

      {/* Patient Medical History Modal */}
      {selectedPatientForHistory && (
        <PatientHistoryModal
          patient={selectedPatientForHistory}
          records={medicalRecords.filter(
            (r) => r.patient_phone === selectedPatientForHistory.phone || r.patient_name === selectedPatientForHistory.full_name_ar
          )}
          onClose={() => setSelectedPatientForHistory(null)}
          onNewConsultation={() => {
            setSelectedPatientForHistory(null);
            setActiveTab('عيادة الطبيب');
            onNotice(`تم فتح عيادة الفحص للمريض ${selectedPatientForHistory.full_name_ar}`);
          }}
        />
      )}

      {/* Omni-search modal */}
      <OmniSearchBar
        isOpen={searchModalOpen}
        onClose={() => setSearchModalOpen(false)}
        patients={patients}
        appointments={appointments}
        onSelectPatient={(pt) => {
          setSelectedPatientForHistory(pt);
          setSearchModalOpen(false);
        }}
        onNavigateSection={(sec) => {
          setActiveTab(sec);
          setSearchModalOpen(false);
          onNotice(`تم الانتقال إلى: ${sec}`);
        }}
        onNotice={onNotice}
      />
    </div>
  );
}
