'use client';

import { useState, useEffect, useRef } from 'react';
import {
  ChevronRight, ChevronLeft, Calendar, Phone, MessageCircle,
  Sparkles, CheckCircle2, Maximize2, X, Pause, Play, Award,
  Clock, ShieldCheck, Stethoscope, ArrowLeft
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export interface CampaignSlide {
  id: string;
  doctorName: string;
  doctorTitle: string;
  doctorDegree: string;
  specialty: string;
  campaignTitle: string;
  campaignSubtitle: string;
  imageSrc: string;
  keyPoints: string[];
  themeColor: string; // teal, blue, amber
  badgeText: string;
  phoneNumbers: string[];
  timing: string;
}

const campaignSlides: CampaignSlide[] = [
  {
    id: 'dr-khaled',
    doctorName: 'د/ خالد مأمون مؤنس',
    doctorTitle: 'مدرس واستشاري جراحة المخ والأعصاب وجراحة العمود الفقري',
    doctorDegree: 'كلية طب قصر العيني — جامعة القاهرة',
    specialty: 'المخ والأعصاب وجراحة العمود الفقري',
    campaignTitle: 'طفلك في خطر لو لاحظت الأعراض دي!',
    campaignSubtitle: 'تشخيص دقيق وعلاج متقدم لحالات تأخر الحركة والتطور وجراحات المخ والعمود الفقري للأطفال والبالغين',
    imageSrc: '/announcements/banner-dr-khaled.jpg',
    keyPoints: [
      'تأخر الحركة: زحف · مشي · اضطراب حركة الأطراف',
      'تأخر التطور: صعوبات الكلام · الأكل · البلع والتواصل',
      'علامات حرجة: صغر حجم الرأس · قيء مستمر طول اليوم · تشنجات أو صرع',
    ],
    themeColor: 'from-sky-900/90 via-blue-900/80 to-teal-950',
    badgeText: 'استشاري قصر العيني',
    phoneNumbers: ['01021869999', '0238120999'],
    timing: 'السبت والإثنين والأربعاء · بالحجز المسبق',
  },
  {
    id: 'dr-ashraf',
    doctorName: 'أ.د. أشرف عبد الفضيل السويفي',
    doctorTitle: 'أستاذ واستشاري الغدد الصماء واستشاري مرض السكري للأطفال',
    doctorDegree: 'لأول مرة في الحوامدية ببرج بلازما الطبي — بنقربلك أفضل أطباء مصر',
    specialty: 'غدد صماء وسكر الأطفال',
    campaignTitle: 'رعاية تخصصية لمرض السكري واضطرابات الغدد عند الأطفال',
    campaignSubtitle: 'متابعة دقيقة لمستويات السكر التراكمي وجرعات الإنسولين، وتقييم شامل لاضطرابات النمو وقصر القامة والغدة الدرقية',
    imageSrc: '/announcements/banner-dr-ashraf.jpg',
    keyPoints: [
      'تشخيص وعلاج داء السكري للأطفال واليافعين بأحدث البروتوكولات',
      'فحص هرمونات النمو وعلاج حالات قصر القامة وتأخر البلوغ',
      'متابعة شاملة لاضطرابات الغدة الدرقية والغدد النخامية والكظرية',
    ],
    themeColor: 'from-teal-950 via-cyan-900/80 to-slate-950',
    badgeText: 'أستاذ واستشاري غدد الأطفال',
    phoneNumbers: ['01021869999', '0238120999'],
    timing: 'عيادات السكر والغدد الصماء للأطفال',
  },
  {
    id: 'dr-abdelrahman',
    doctorName: 'دكتور عبد الرحمن الجابري',
    doctorTitle: 'مدرس مساعد الجراحة العامة والمناظير وجراحة أورام الثدي',
    doctorDegree: 'عضو كلية الجراحين الملكية بإنجلترا (MRCS)',
    specialty: 'جراحة عامة ومناظير وجراحة أورام الثدي',
    campaignTitle: 'عمليتك بالمنظار.. فتحات صغيرة ونقاهة أسرع',
    campaignSubtitle: 'أحدث تقنيات جراحات المناظير الدقيقة واستئصال الأورام بدون شق جراحي كبير وبأعلى معايير الأمان الطبي',
    imageSrc: '/announcements/banner-dr-abdelrahman.jpg',
    keyPoints: [
      'تكميم واستئصال المعدة وجراحات السمنة المفرطة بالمناظير',
      'استئصال المرارة والزائدة الدودية وعلاج الفتق بأنواعه بالمنظار',
      'جراحات واستئصال أورام الثدي مع الفحص والمسح المبكر',
    ],
    themeColor: 'from-blue-950 via-teal-900/80 to-slate-950',
    badgeText: 'عضو كلية الجراحين الملكية',
    phoneNumbers: ['01021869999', '01035719999', '0238120999'],
    timing: 'عيادات الجراحة العامة والمناظير والأورام',
  },
  {
    id: 'dr-ahmed-hawary',
    doctorName: 'دكتور أحمد مجدي الهواري',
    doctorTitle: 'استشاري جراحة المسالك البولية وأمراض الذكورة والعقم',
    doctorDegree: 'استشاري جراحات المسالك الدقيقة والمناظير',
    specialty: 'مسالك بولية وأمراض ذكورة وعقم',
    campaignTitle: 'لسه في فرصة تانية مع علاج انعدام الحيوانات المنوية',
    campaignSubtitle: 'بروتوكولات علاجية متطورة وتقنيات المسح الميكروسكوبي الدقيق لحالات العقم وتأخر الإنجاب وضعف الخصوبة',
    imageSrc: '/announcements/banner-dr-ahmed-hawary.jpg',
    keyPoints: [
      'علاج حالات انعدام وقلة الحيوانات المنوية بأحدث الطرق العلمية',
      'التفتيش الميكروسكوبي الدقيق للخصية (Micro-TESE)',
      'علاج دوالي الخصية بالميكروسكوب ومناظير المسالك البولية',
    ],
    themeColor: 'from-cyan-950 via-sky-900/80 to-teal-950',
    badgeText: 'استشاري المسالك والذكورة والعقم',
    phoneNumbers: ['01021869999', '01035719999', '0238120999'],
    timing: 'عيادات الذكورة والمسالك البولية والتناسلية',
  },
  {
    id: 'dr-doaa',
    doctorName: 'د/ دعاء عبد الرازق',
    doctorTitle: 'استشاري أمراض الدم',
    doctorDegree: 'استشاري أمراض الدم والاعتلالات المناعية والتجلط',
    specialty: 'أمراض الدم',
    campaignTitle: 'أمراض الدم.. من القلب إلى الدم نهتم بصدق',
    campaignSubtitle: 'تشخيص دقيق وعلاج متكامل لأمراض فقر الدم والأنيميا واعتلالات الصفائح الدموية ومشاكل السيولة والتجلط',
    imageSrc: '/announcements/banner-dr-doaa.jpg',
    keyPoints: [
      'تشخيص وعلاج الأنيميا الحادة والمزمنة وأنيميا البحر المتوسط (الثلاسيميا)',
      'علاج نقص واعتلالات الصفائح الدموية والأمراض المناعية',
      'متابعة حالات التجلط المتكرر واضطرابات سيولة الدم أثناء الحمل',
    ],
    themeColor: 'from-rose-950 via-red-950 to-slate-950',
    badgeText: 'استشاري أمراض الدم',
    phoneNumbers: ['01021869999', '0238120999'],
    timing: 'عيادة أمراض الدم والتحاليل المتقدمة',
  },
  {
    id: 'dr-mohamed-saber',
    doctorName: 'دكتور محمد صابر قطب',
    doctorTitle: 'أخصائي أمراض القلب والأوعية الدموية',
    doctorDegree: 'رسم قلب · إيكو · متابعة الضغط والكوليسترول',
    specialty: 'أخصائي أمراض القلب والأوعية الدموية',
    campaignTitle: 'أعراض إنذار القلب المبكرة.. نَفَسَك بيقصر من أقل مجهود؟',
    campaignSubtitle: 'الكشف المبكر بينقذ حياة.. تقييم شامل لكفاءة عضلة القلب والشرايين التاجية بموجات الإيكو الصوتية ورسم القلب',
    imageSrc: '/announcements/banner-dr-mohamed-saber.jpg',
    keyPoints: [
      'فحص عضلة القلب بالسونار والإيكو الدوبلر الملون',
      'رسم القلب بالمجهود ومتابعة خفقان وتسارع ضربات القلب',
      'ضبط ارتفاع ضغط الدم والدهون الثلاثية والكوليسترول الضار',
    ],
    themeColor: 'from-sky-950 via-teal-900/80 to-slate-950',
    badgeText: 'أخصائي أمراض القلب والأوعية',
    phoneNumbers: ['01021869999', '01035719999', '0238120999'],
    timing: 'يومياً بعيادات القلب والأوعية الدموية',
  },
  {
    id: 'dr-hussein',
    doctorName: 'دكتور حسين الشوري',
    doctorTitle: 'استشاري الأمراض الباطنية والسكر والسمنة والجهاز الهضمي',
    doctorDegree: 'الكشف بالسونار في عيادة الباطنة التخصصية',
    specialty: 'أمراض الباطنة والسكر والسمنة والجهاز الهضمي',
    campaignTitle: 'إزاي تظبط سكرك بشكل علمي ودائم؟',
    campaignSubtitle: 'ضبط السكر محتاج تحاليل دقيقة وخطة غذائية ومتابعة مستمرة.. مش مجرد روشتة دواء',
    imageSrc: '/announcements/banner-dr-hussein.jpg',
    keyPoints: [
      'كشف فوري بأحدث أجهزة السونار في عيادة الباطنة',
      'بروتوكول ضبط السكر التراكمي وتجنب مضاعفات القدم السكري والأعصاب',
      'خطة تغذية علاجية شاملة لعلاج السمنة واضطرابات الجهاز الهضمي',
    ],
    themeColor: 'from-teal-950 via-teal-900/90 to-emerald-950',
    badgeText: 'كشف بالسونار ومتابعة سكر',
    phoneNumbers: ['01021869999', '01035719999', '0238120999'],
    timing: 'يومياً بعيادات الباطنة · صباحاً ومساءً',
  },
  {
    id: 'dr-adel',
    doctorName: 'دكتور عادل عبد المنعم يونس',
    doctorTitle: 'استشاري الجراحة العامة وجراحة الأوعية الدموية',
    doctorDegree: 'علاج دوالي الساقين بالحقن والليزر من غير جراحة',
    specialty: 'جراحة عامة وجراحة أوعية دموية',
    campaignTitle: 'دوالي الساقين أزمة.. بس ليها حل نهائي!',
    campaignSubtitle: 'تخلص من آلام وثقل وتورم الساقين بأحدث التقنيات التداخلية بدون فتح جراحي وبدون تخدير كلي',
    imageSrc: '/announcements/banner-dr-adel.jpg',
    keyPoints: [
      'علاج دوالي الساقين السطحية والعميقة بالحقن التصلبي الرغوي',
      'تقنية الليزر التداخلي (EVLT) والعودة للمنزل في نفس اليوم',
      'فحص الدوبلر الملون وتقييم دقيق لكفاءة الدورة الدموية الطرفية',
    ],
    themeColor: 'from-cyan-950 via-teal-950 to-blue-950',
    badgeText: 'علاج بدون جراحة بالليزر',
    phoneNumbers: ['01021869999', '01035719999', '0238120999'],
    timing: 'الأحد والثلاثاء والخميس · عيادة الأوعية الدموية',
  },
];

interface Props {
  onBook: (specialty?: string, doctor?: string) => void;
}

export function MedicalCampaignsCarousel({ onBook }: Props) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const touchStartX = useRef<number | null>(null);

  const SLIDE_DURATION = 6000; // 6 seconds per slide

  // Auto-advance with progress bar
  useEffect(() => {
    if (!isPlaying) return;

    const interval = 50; // update progress every 50ms
    const step = (interval / SLIDE_DURATION) * 100;

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          setCurrentIndex((idx) => (idx + 1) % campaignSlides.length);
          return 0;
        }
        return prev + step;
      });
    }, interval);

    return () => clearInterval(timer);
  }, [isPlaying, currentIndex]);

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
    setProgress(0);
  };

  const nextSlide = () => {
    setCurrentIndex((idx) => (idx + 1) % campaignSlides.length);
    setProgress(0);
  };

  const prevSlide = () => {
    setCurrentIndex((idx) => (idx - 1 + campaignSlides.length) % campaignSlides.length);
    setProgress(0);
  };

  const current = campaignSlides[currentIndex];

  // Touch swipe support
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    // In RTL, dragging right moves to next, dragging left moves to prev
    if (diff > 50) {
      prevSlide();
    } else if (diff < -50) {
      nextSlide();
    }
    touchStartX.current = null;
  };

  return (
    <section
      className="relative my-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto"
      dir="rtl"
      onMouseEnter={() => setIsPlaying(false)}
      onMouseLeave={() => setIsPlaying(true)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-6 gap-4 border-b border-teal-900/10 pb-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 border border-teal-200/80 text-teal-800 text-xs font-bold mb-2 shadow-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <Sparkles className="w-3.5 h-3.5 text-teal-600" />
            حملات تخصصية واستشارات نخبة الأطباء
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            عيادات نخبة قصر العيني والجامعات ببرج بلازما
          </h2>
          <p className="text-sm text-slate-600 mt-1 max-w-2xl">
            نخبة من كبار الاستشاريين وأساتذة الجامعات في تخصصات المخ والأعصاب، الباطنة والسكر، والأوعية الدموية.
          </p>
        </div>

        {/* Play / Pause & Navigation Controls */}
        <div className="flex items-center gap-2 self-start md:self-auto">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
            title={isPlaying ? 'إيقاف مؤقت' : 'تشغيل تلقائي'}
            aria-label={isPlaying ? 'إيقاف التشغيل التلقائي' : 'تشغيل الكاروسيل'}
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>
          <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl p-1 shadow-xs">
            <button
              onClick={prevSlide}
              className="p-2 rounded-lg hover:bg-teal-50 hover:text-teal-700 text-slate-600 transition cursor-pointer"
              title="السابق"
              aria-label="الحملة السابقة"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
            <span className="text-xs font-bold text-slate-500 px-2 select-none">
              {currentIndex + 1} / {campaignSlides.length}
            </span>
            <button
              onClick={nextSlide}
              className="p-2 rounded-lg hover:bg-teal-50 hover:text-teal-700 text-slate-600 transition cursor-pointer"
              title="التالي"
              aria-label="الحملة التالية"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Carousel Card */}
      <div className="relative overflow-hidden rounded-3xl bg-slate-950 text-white shadow-2xl border border-teal-800/40">
        {/* Animated Background Gradient */}
        <div
          className={`absolute inset-0 bg-gradient-to-br ${current.themeColor} opacity-90 transition-all duration-700`}
        />
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff0a_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />

        {/* Progress Bar Header */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-white/10 z-20 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-teal-400 to-emerald-400 transition-all duration-75 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Slide Content Grid */}
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 p-6 sm:p-8 lg:p-10 items-center min-h-[460px]">
          
          {/* Visual Poster Column (5 cols) */}
          <div className="lg:col-span-5 flex flex-col items-center justify-center">
            <div className="relative group w-full max-w-[340px] aspect-square rounded-2xl overflow-hidden border-2 border-white/20 shadow-2xl bg-black/40">
              <img
                src={current.imageSrc}
                alt={current.doctorName}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                loading="eager"
              />
              
              {/* Badge on Poster */}
              <div className="absolute top-3 right-3 bg-teal-900/90 backdrop-blur-md text-teal-100 text-[11px] font-bold px-3 py-1 rounded-full border border-teal-500/30 flex items-center gap-1.5 shadow-md">
                <Award className="w-3.5 h-3.5 text-amber-400" />
                {current.badgeText}
              </div>

              {/* Lightbox Trigger Button Overlay */}
              <button
                onClick={() => setLightboxSrc(current.imageSrc)}
                className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 text-white font-bold cursor-pointer backdrop-blur-xs"
                title="اضغط لتكبير البوستر وقراءة كامل التفاصيل"
              >
                <div className="p-3 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-md">
                  <Maximize2 className="w-6 h-6 text-white" />
                </div>
                <span className="text-xs bg-slate-900/80 px-3 py-1 rounded-full border border-white/20">
                  عرض البوستر بحجم كامل
                </span>
              </button>
            </div>

            <div className="flex items-center gap-2 mt-3 text-xs text-teal-200/90 font-medium">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>متعاقدون مع كافة كبرى شركات التأمين والنقابات</span>
            </div>
          </div>

          {/* Details & Booking Column (7 cols) */}
          <div className="lg:col-span-7 flex flex-col justify-between space-y-5">
            <div>
              {/* Doctor Specialty Pill */}
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className="bg-teal-500/20 text-teal-200 border border-teal-400/30 text-xs px-3 py-1 rounded-full font-bold flex items-center gap-1.5">
                  <Stethoscope className="w-3.5 h-3.5 text-teal-300" />
                  {current.specialty}
                </span>
                <span className="bg-amber-400/20 text-amber-300 border border-amber-400/30 text-xs px-2.5 py-1 rounded-full font-bold flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {current.timing}
                </span>
              </div>

              {/* Doctor Name & Big Typography */}
              <h3 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight leading-tight">
                {current.doctorName}
              </h3>
              <p className="text-teal-300 font-bold text-sm sm:text-base mt-1">
                {current.doctorTitle}
              </p>
              <p className="text-slate-300 text-xs sm:text-sm mt-0.5 flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                {current.doctorDegree}
              </p>

              {/* Campaign Catchphrase */}
              <div className="my-4 p-3.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15">
                <h4 className="text-base sm:text-lg font-black text-amber-300 mb-1">
                  {current.campaignTitle}
                </h4>
                <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                  {current.campaignSubtitle}
                </p>
              </div>

              {/* Bullet Key Points */}
              <div className="space-y-2 mb-5">
                {current.keyPoints.map((point, idx) => (
                  <div key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-200">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{point}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Buttons Row */}
            <div className="pt-3 border-t border-white/10 flex flex-wrap items-center gap-3">
              <Button
                size="lg"
                onClick={() => onBook(current.specialty, current.doctorName)}
                className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black px-6 text-sm shadow-xl hover:shadow-emerald-500/20 active:scale-95 transition-transform cursor-pointer"
              >
                احجز كشفك مع الدكتور الآن
                <ArrowLeft className="w-4 h-4 mr-1.5" />
              </Button>

              <a
                href={`tel:${current.phoneNumbers[0]}`}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs sm:text-sm font-bold border border-white/15 transition cursor-pointer"
              >
                <Phone className="w-4 h-4 text-teal-300" />
                اتصال: {current.phoneNumbers[0]}
              </a>

              <a
                href="https://wa.me/201021869999"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-lg bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-200 text-xs sm:text-sm font-bold border border-emerald-500/30 transition cursor-pointer"
              >
                <MessageCircle className="w-4 h-4 text-emerald-400" />
                واتساب
              </a>
            </div>

          </div>
        </div>

        {/* Thumbnail Selector Strip */}
        <div className="bg-slate-900/80 backdrop-blur-md border-t border-white/10 px-4 py-3 flex items-center justify-between flex-wrap gap-3">
          <span className="text-xs text-slate-400 font-bold hidden sm:inline">
            اختر العيادة أو الحملة التخصصية:
          </span>
          <div className="flex items-center gap-2">
            {campaignSlides.map((slide, idx) => {
              const isActive = idx === currentIndex;
              return (
                <button
                  key={slide.id}
                  onClick={() => goToSlide(idx)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                    isActive
                      ? 'bg-teal-500 text-slate-950 shadow-md ring-2 ring-emerald-400'
                      : 'bg-white/10 hover:bg-white/20 text-slate-300'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-current" />
                  <span>{slide.doctorName.split(' ')[0]} {slide.doctorName.split(' ')[1]}</span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-1 text-[11px] text-teal-300">
            <span>فرع الحوامدية الرئيسي: أمام المرور، بجوار بنك الإسكندرية</span>
          </div>
        </div>
      </div>

      {/* Lightbox Modal for High-Res Poster Reading */}
      {lightboxSrc && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setLightboxSrc(null)}
        >
          <div
            className="relative max-w-2xl w-full bg-slate-900 border border-slate-700 rounded-3xl p-4 overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
              <span className="text-sm font-bold text-teal-300 flex items-center gap-1.5">
                <Award className="w-4 h-4 text-amber-400" />
                بوستر الحملة التخصصية المعتمد
              </span>
              <button
                onClick={() => setLightboxSrc(null)}
                className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
                aria-label="إغلاق"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="relative rounded-2xl overflow-hidden bg-black flex items-center justify-center max-h-[75vh]">
              <img
                src={lightboxSrc}
                alt="بوستر الحملة التخصصية بالحجم الكامل"
                className="max-h-[75vh] w-auto object-contain rounded-xl"
              />
            </div>

            <div className="pt-3 mt-3 border-t border-slate-800 flex items-center justify-between flex-wrap gap-2">
              <div className="text-xs text-slate-400">
                للحجز والاستفسار: 01021869999 — 01035719999 — 0238120999
              </div>
              <Button
                size="sm"
                onClick={() => {
                  setLightboxSrc(null);
                  onBook(current.specialty, current.doctorName);
                }}
                className="bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs"
              >
                احجز هذا الموعد الآن
                <ArrowLeft className="w-3.5 h-3.5 mr-1" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
