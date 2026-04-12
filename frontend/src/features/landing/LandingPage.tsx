import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, useInView, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import {
  ShoppingBag, Barcode, Scale, Printer, CreditCard,
  Shield, Building2, Users, BarChart3, Globe, Smartphone,
  CheckCircle2, ArrowLeft, Star, Zap, Cloud, Lock,
  Receipt, Package, DollarSign, UserCheck, FileCheck,
  ChevronDown, ChevronUp, Phone, Mail, MapPin, Play,
  Layers, Database, Wifi, Clock, TrendingUp, HeadphonesIcon,
  Menu, X, Loader2, Eye, EyeOff, ArrowRight, Send,
  Monitor, Sparkles, ChevronLeft, Search,
  UtensilsCrossed, ChefHat, QrCode, Fingerprint, GitBranch,
  Tablet, ConciergeBell, Store, Wallet,
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════
// Animation Utilities
// ═══════════════════════════════════════════════════════════

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0 },
};

const fadeDown = {
  hidden: { opacity: 0, y: -30 },
  visible: { opacity: 1, y: 0 },
};

const fadeInLeft = {
  hidden: { opacity: 0, x: 60 },
  visible: { opacity: 1, x: 0 },
};

const fadeInRight = {
  hidden: { opacity: 0, x: -60 },
  visible: { opacity: 1, x: 0 },
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.85 },
  visible: { opacity: 1, scale: 1 },
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

const staggerSlow = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.15 } },
};

function AnimatedSection({ children, className = '', id = '' }: { children: React.ReactNode; className?: string; id?: string }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-60px' });

  return (
    <motion.section
      ref={ref}
      id={id}
      className={className}
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
      variants={staggerContainer}
      transition={{ duration: 0.6 }}
    >
      {children}
    </motion.section>
  );
}

// Animated Counter
function Counter({ target, suffix = '', prefix = '' }: { target: number; suffix?: string; prefix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (!isInView) return;
    const duration = 2000;
    const startTime = Date.now();
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * target));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [isInView, target]);

  return <span ref={ref}>{prefix}{count.toLocaleString('en-US')}{suffix}</span>;
}

// Smooth scroll
function scrollTo(id: string) {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ═══════════════════════════════════════════════════════════
// Navbar
// ═══════════════════════════════════════════════════════════

function Navbar({ onLogin, onGetStarted }: { onLogin: () => void; onGetStarted: () => void }) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const navLinks = [
    { label: 'المميزات', id: 'features' },
    { label: 'جرّب النظام', id: 'demo' },
    { label: 'زاتكا', id: 'zatca' },
    { label: 'الأسعار', id: 'pricing' },
    { label: 'سجّل متجرك', id: 'register' },
    { label: 'الأسئلة', id: 'faq' },
  ];

  return (
    <>
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ type: 'spring', stiffness: 120, damping: 20 }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled ? 'bg-white/95 backdrop-blur-xl shadow-lg shadow-indigo-500/5' : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 py-3.5 flex items-center justify-between">
          <motion.div className="flex items-center gap-3 cursor-pointer" onClick={() => scrollTo('hero')} whileHover={{ scale: 1.03 }}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-lg">
              M
            </div>
            <span className={`font-bold text-lg transition-colors duration-300 ${scrolled ? 'text-gray-900' : 'text-white'}`}>
              MS Cashier
            </span>
          </motion.div>

          <div className={`hidden lg:flex items-center gap-7 text-sm font-medium ${scrolled ? 'text-gray-600' : 'text-white/80'}`}>
            {navLinks.map((link) => (
              <button
                key={link.id}
                onClick={() => scrollTo(link.id)}
                className="hover:text-indigo-500 transition-colors relative group"
              >
                {link.label}
                <span className="absolute -bottom-1 right-0 w-0 h-0.5 bg-indigo-500 rounded-full group-hover:w-full transition-all duration-300" />
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onLogin}
              className={`hidden sm:block px-5 py-2.5 rounded-xl font-medium text-sm transition-all ${
                scrolled ? 'text-gray-700 hover:bg-gray-100' : 'text-white hover:bg-white/10'
              }`}
            >
              تسجيل الدخول
            </button>
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              onClick={onGetStarted}
              className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-medium text-sm hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-500/25"
            >
              ابدأ الآن
            </motion.button>
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className={`lg:hidden p-2 rounded-lg transition ${scrolled ? 'text-gray-700 hover:bg-gray-100' : 'text-white hover:bg-white/10'}`}
            >
              {mobileOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </motion.nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-x-0 top-16 z-40 bg-white rounded-b-2xl shadow-2xl border-t border-gray-100 p-6 mx-4"
          >
            <div className="flex flex-col gap-1">
              {navLinks.map((link) => (
                <button
                  key={link.id}
                  onClick={() => { scrollTo(link.id); setMobileOpen(false); }}
                  className="py-3 px-4 text-right text-gray-700 font-medium hover:bg-indigo-50 hover:text-indigo-600 rounded-xl transition"
                >
                  {link.label}
                </button>
              ))}
              <hr className="my-2 border-gray-100" />
              <button
                onClick={() => { onLogin(); setMobileOpen(false); }}
                className="py-3 px-4 text-right text-gray-700 font-medium hover:bg-gray-50 rounded-xl transition"
              >
                تسجيل الدخول
              </button>
              <button
                onClick={() => { onGetStarted(); setMobileOpen(false); }}
                className="py-3 px-4 text-center text-white font-bold bg-indigo-600 hover:bg-indigo-700 rounded-xl transition mt-1"
              >
                ابدأ الآن مجاناً
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// ═══════════════════════════════════════════════════════════
// Hero Section
// ═══════════════════════════════════════════════════════════

function HeroSection({ onGetStarted }: { onGetStarted: () => void }) {
  const { scrollY } = useScroll();
  const bgY = useTransform(scrollY, [0, 500], [0, 150]);
  const opacity = useTransform(scrollY, [0, 400], [1, 0.3]);

  return (
    <section id="hero" className="relative overflow-hidden bg-gradient-to-bl from-blue-600 via-indigo-700 to-purple-800 text-white min-h-[100vh] flex items-center">
      {/* Parallax Decorative Elements */}
      <motion.div className="absolute inset-0 opacity-10" style={{ y: bgY }}>
        <div className="absolute top-20 right-20 w-72 h-72 bg-white rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 left-20 w-96 h-96 bg-blue-300 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-400 rounded-full blur-3xl" />
      </motion.div>

      {/* Animated Grid Pattern */}
      <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.3) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

      <motion.div className="relative max-w-7xl mx-auto px-6 py-24 lg:py-0 w-full" style={{ opacity }}>
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Text Content */}
          <motion.div
            className="text-center lg:text-right"
            initial="hidden"
            animate="visible"
            variants={staggerSlow}
          >
            <motion.div
              variants={fadeDown}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full text-sm mb-8 border border-white/20"
            >
              <Zap className="w-4 h-4 text-yellow-300" />
              <span>معتمد من هيئة الزكاة والضريبة والجمارك (زاتكا)</span>
            </motion.div>

            <motion.h1
              variants={fadeUp}
              transition={{ duration: 0.7 }}
              className="text-4xl lg:text-6xl font-bold leading-tight mb-6"
            >
              نظام نقاط البيع
              <br />
              <span className="bg-gradient-to-l from-yellow-300 to-orange-300 bg-clip-text text-transparent">
                الأكثر تكاملاً
              </span>
              <br />
              في المملكة
            </motion.h1>

            <motion.p
              variants={fadeUp}
              transition={{ duration: 0.7 }}
              className="text-lg lg:text-xl text-blue-100 mb-10 max-w-lg mx-auto lg:mx-0 lg:mr-0 leading-relaxed"
            >
              كاشير ذكي + ويتر + مطبخ + طلب ذاتي QR + إدارة فروع + ماكينات مدى + بصمة حضور + رواتب + فوترة زاتكا — منصة واحدة لإدارة متجرك ومطعمك بالكامل
            </motion.p>

            <motion.div variants={fadeUp} transition={{ duration: 0.7 }} className="flex flex-wrap gap-4 justify-center lg:justify-start">
              <motion.button
                whileHover={{ scale: 1.05, boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}
                whileTap={{ scale: 0.97 }}
                onClick={onGetStarted}
                className="group px-8 py-4 bg-white text-indigo-700 font-bold rounded-2xl shadow-xl flex items-center gap-2"
              >
                ابدأ الآن مجاناً
                <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05, backgroundColor: 'rgba(255,255,255,0.1)' }}
                whileTap={{ scale: 0.97 }}
                onClick={() => scrollTo('demo')}
                className="px-8 py-4 border-2 border-white/30 text-white font-medium rounded-2xl flex items-center gap-2 backdrop-blur-sm"
              >
                <Play className="w-5 h-5" />
                جرّب النظام مباشرة
              </motion.button>
            </motion.div>

            <motion.div variants={fadeUp} transition={{ duration: 0.7 }} className="flex flex-wrap gap-6 mt-12 justify-center lg:justify-start text-sm text-blue-200">
              {[
                { icon: Shield, text: 'متوافق مع المرحلة الثانية' },
                { icon: Lock, text: 'تشفير 256-bit' },
                { icon: Cloud, text: 'سحابي 99.9% uptime' },
              ].map((badge, i) => (
                <div key={i} className="flex items-center gap-2">
                  <badge.icon className="w-4 h-4" />
                  <span>{badge.text}</span>
                </div>
              ))}
            </motion.div>
          </motion.div>

          {/* Hero Visual - POS Preview */}
          <motion.div
            className="relative hidden lg:block"
            initial={{ opacity: 0, x: -80, rotateY: -5 }}
            animate={{ opacity: 1, x: 0, rotateY: 0 }}
            transition={{ duration: 0.9, delay: 0.3 }}
          >
            <div className="bg-white/10 backdrop-blur-lg rounded-3xl border border-white/20 p-6 shadow-2xl">
              <div className="bg-gray-900 rounded-2xl p-4 space-y-3">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-yellow-400" />
                  <div className="w-3 h-3 rounded-full bg-green-400" />
                  <span className="text-gray-400 text-xs mr-2">MS Cashier — نقطة البيع</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {['مياه معدنية', 'خبز أبيض', 'حليب طازج', 'أرز بسمتي', 'زيت زيتون', 'شاي أخضر'].map((item, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.6 + i * 0.1 }}
                      className="bg-gray-800 rounded-lg p-3 text-center hover:bg-gray-700 transition-colors cursor-pointer"
                    >
                      <div className="w-8 h-8 bg-indigo-500/20 rounded-lg mx-auto mb-1 flex items-center justify-center">
                        <Package className="w-4 h-4 text-indigo-400" />
                      </div>
                      <p className="text-white text-xs">{item}</p>
                      <p className="text-green-400 text-xs mt-0.5">{(5 + i * 8.5).toFixed(2)} ر.س</p>
                    </motion.div>
                  ))}
                </div>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.2 }}
                  className="bg-gray-800 rounded-lg p-3 flex justify-between items-center"
                >
                  <span className="text-white text-sm font-bold">الإجمالي: 157.50 ر.س</span>
                  <motion.span whileHover={{ scale: 1.1 }} className="bg-green-500 text-white text-xs px-3 py-1.5 rounded-lg font-bold cursor-pointer">
                    دفع
                  </motion.span>
                </motion.div>
              </div>
            </div>

            {/* Floating badges */}
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
              className="absolute -top-4 -left-4 bg-green-500 text-white px-4 py-2 rounded-xl shadow-lg text-sm font-bold"
            >
              <FileCheck className="w-4 h-4 inline ml-1" />
              متوافق زاتكا
            </motion.div>
            <motion.div
              animate={{ y: [0, 6, 0] }}
              transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut', delay: 0.5 }}
              className="absolute -bottom-4 -right-4 bg-orange-500 text-white px-4 py-2 rounded-xl shadow-lg text-sm font-bold"
            >
              <Barcode className="w-4 h-4 inline ml-1" />
              باركود سكانر
            </motion.div>
            <motion.div
              animate={{ y: [0, -6, 0] }}
              transition={{ repeat: Infinity, duration: 2.8, ease: 'easeInOut', delay: 1 }}
              className="absolute top-1/2 -left-8 bg-blue-500 text-white px-4 py-2 rounded-xl shadow-lg text-sm font-bold"
            >
              <Monitor className="w-4 h-4 inline ml-1" />
              تاتش
            </motion.div>
          </motion.div>
        </div>
      </motion.div>

      {/* Wave Divider */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1440 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M0 50L60 45C120 40 240 30 360 35C480 40 600 60 720 65C840 70 960 60 1080 50C1200 40 1320 30 1380 25L1440 20V100H1380C1320 100 1200 100 1080 100C960 100 840 100 720 100C600 100 480 100 360 100C240 100 120 100 60 100H0V50Z" fill="white" />
        </svg>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════
// Stats Bar with Counter Animation
// ═══════════════════════════════════════════════════════════

function StatsBar() {
  const stats = [
    { value: 2500, suffix: '+', label: 'متجر نشط' },
    { value: 1, suffix: 'M+', label: 'فاتورة شهرياً' },
    { value: 99.9, suffix: '%', label: 'وقت التشغيل' },
    { value: 24, suffix: '/7', label: 'دعم فني' },
  ];

  return (
    <AnimatedSection className="bg-white py-14 -mt-1">
      <div className="max-w-5xl mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, i) => (
            <motion.div key={i} variants={fadeUp} transition={{ duration: 0.5 }} className="text-center">
              <div className="text-3xl lg:text-4xl font-bold bg-gradient-to-l from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                {stat.value === 99.9
                  ? <><Counter target={99} />.9{stat.suffix}</>
                  : <Counter target={stat.value} suffix={stat.suffix} />
                }
              </div>
              <div className="text-gray-500 text-sm mt-1">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </AnimatedSection>
  );
}

// ═══════════════════════════════════════════════════════════
// Features Section
// ═══════════════════════════════════════════════════════════

function FeaturesSection() {
  const features = [
    { icon: ShoppingBag, title: 'نقطة بيع ذكية', desc: 'شاشة تاتش بواجهة حديثة تدعم البيع السريع بالباركود والبحث، مع سلة مشتريات ذكية وحساب تلقائي للضريبة والخصومات', color: 'from-blue-500 to-indigo-500', bg: 'bg-blue-50' },
    { icon: ConciergeBell, title: 'واجهة الويتر', desc: 'واجهة مخصصة لأخذ الطلبات من الطاولات — اختيار الأصناف، إضافة ملاحظات، وإرسال مباشر للمطبخ والكاشير بتكامل تام', color: 'from-amber-500 to-orange-500', bg: 'bg-amber-50' },
    { icon: ChefHat, title: 'شاشة المطبخ (KDS)', desc: 'شاشة عرض للمطبخ بالوقت الحقيقي — ترتيب الطلبات حسب الأولوية، تتبع وقت التجهيز، وتحديث الحالة تلقائياً للويتر والكاشير', color: 'from-red-500 to-rose-500', bg: 'bg-red-50' },
    { icon: QrCode, title: 'طلب ذاتي QR للعميل', desc: 'يسكان العميل QR فتفتح له المنيو — يختار ويطلب ويدفع من جواله! مع عداد تجهيز حي وإشعار فوري بإتمام الطلب', color: 'from-violet-500 to-purple-600', bg: 'bg-violet-50' },
    { icon: Wallet, title: 'ربط ماكينات الدفع (مدى)', desc: 'تكامل مع أجهزة الدفع: Geidea, Nearpay, Ingenico, Verifone, STC Pay — إرسال المبلغ تلقائياً، استلام التأكيد، وتسوية يومية', color: 'from-emerald-500 to-green-600', bg: 'bg-emerald-50' },
    { icon: Fingerprint, title: 'بصمة حضور وانصراف', desc: 'ربط أجهزة البصمة (ZKTeco وغيرها)، تسجيل حضور وانصراف الموظفين تلقائياً، وإصدار تقارير دوام شاملة', color: 'from-sky-500 to-blue-600', bg: 'bg-sky-50' },
    { icon: GitBranch, title: 'إدارة فروع متعددة', desc: 'أضف فروع لمتجرك بباقات مرنة — مشاركة المنتجات أو فصلها، توزيع المخازن، وتفعيل فوري بعد الدفع', color: 'from-fuchsia-500 to-pink-600', bg: 'bg-fuchsia-50' },
    { icon: FileCheck, title: 'فوترة إلكترونية (زاتكا)', desc: 'متوافق بالكامل مع المرحلة الثانية — توليد QR Code, XML بصيغة UBL 2.1, إبلاغ وتصفية الفواتير تلقائياً', color: 'from-green-500 to-emerald-600', bg: 'bg-green-50' },
    { icon: Barcode, title: 'باركود سكانر + ميزان', desc: 'دعم أجهزة الباركود السلكية واللاسلكية وربط الموازين الرقمية (CAS, DIGI, Toledo) عبر Web Serial API', color: 'from-purple-500 to-pink-500', bg: 'bg-purple-50' },
    { icon: Package, title: 'مخزون ومخازن متعددة', desc: 'حتى 5 مخازن لكل متجر، تتبع الأصناف، تنبيهات نفاد، نقل بين المخازن، وربط المخازن بالفروع', color: 'from-orange-500 to-amber-500', bg: 'bg-orange-50' },
    { icon: UserCheck, title: 'موظفين ورواتب', desc: 'إدارة كاملة للموظفين، ضبط الرواتب، مسير شهري تلقائي، إصدار شيكات رواتب، وأرشفة دائمة', color: 'from-teal-500 to-cyan-600', bg: 'bg-teal-50' },
    { icon: DollarSign, title: 'حسابات وخزينة', desc: 'حسابات متعددة (نقدي، بنكي، رقمي)، تسجيل تلقائي للمعاملات، تقارير مالية شاملة ولحظية', color: 'from-yellow-500 to-orange-500', bg: 'bg-yellow-50' },
    { icon: Store, title: 'أقسام ومناطق تشغيل', desc: 'قسّم مطعمك لمناطق (داخلي، خارجي، VIP، بار) — كل منطقة بطاولاتها وطلباتها وإدارتها', color: 'from-lime-500 to-green-500', bg: 'bg-lime-50' },
    { icon: Users, title: 'صلاحيات مفصّلة', desc: 'تحكم كامل بصلاحيات كل مستخدم على كل شاشة — من يرى ماذا ومن يعدّل ماذا', color: 'from-cyan-500 to-blue-500', bg: 'bg-cyan-50' },
    { icon: CreditCard, title: 'طرق دفع متنوعة', desc: 'نقدي، مدى، فيزا، Apple Pay، STC Pay، تحويل، آجل، تقسيط — مع تسوية تلقائية', color: 'from-pink-500 to-rose-500', bg: 'bg-pink-50' },
    { icon: Smartphone, title: 'يعمل أوفلاين', desc: 'يحفظ البيانات محلياً ويزامنها تلقائياً عند عودة الإنترنت — لا تفقد أي عملية بيع أبداً', color: 'from-slate-500 to-gray-600', bg: 'bg-slate-50' },
    { icon: Tablet, title: 'تطبيق موبايل', desc: 'تطبيق نقطة بيع للآيفون والآيباد والأندرويد والتابلت — متوافق ومتزامن مع المنصة بالكامل', color: 'from-indigo-500 to-violet-500', bg: 'bg-indigo-50' },
    { icon: BarChart3, title: 'تقارير وتحليلات', desc: 'تقارير مبيعات يومية وشهرية، تحليل الأرباح لكل صنف، تصدير CSV، ولوحة تحكم لحظية', color: 'from-blue-500 to-indigo-600', bg: 'bg-blue-50' },
  ];

  return (
    <AnimatedSection className="py-20 bg-gray-50" id="features">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div variants={fadeUp} transition={{ duration: 0.6 }} className="text-center mb-16">
          <span className="text-indigo-600 font-semibold text-sm">كل ما تحتاجه في مكان واحد</span>
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mt-3">
            مميزات لا تجدها في نظام آخر
          </h2>
          <p className="text-gray-500 mt-4 max-w-2xl mx-auto text-lg">
            صُمم MS Cashier ليكون النظام الأشمل لإدارة نقاط البيع في المملكة العربية السعودية
          </p>
        </motion.div>

        <motion.div variants={staggerContainer} className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <motion.div
              key={i}
              variants={fadeUp}
              transition={{ duration: 0.4 }}
              whileHover={{ y: -6, boxShadow: '0 20px 40px rgba(79,70,229,0.08)' }}
              className="bg-white rounded-2xl p-6 border border-gray-100 group cursor-default"
            >
              <div className={`w-12 h-12 rounded-xl ${f.bg} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                <f.icon className="w-6 h-6 text-indigo-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">{f.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </AnimatedSection>
  );
}

// ═══════════════════════════════════════════════════════════
// ZATCA Section
// ═══════════════════════════════════════════════════════════

function ZatcaSection() {
  const phases = [
    { step: '1', title: 'التسجيل', desc: 'أدخل رقم ضريبة القيمة المضافة وبيانات المنشأة', icon: Building2 },
    { step: '2', title: 'الربط', desc: 'ربط تلقائي مع بوابة زاتكا واستلام شهادة CSID', icon: Wifi },
    { step: '3', title: 'التفعيل', desc: 'يتم إبلاغ الفواتير تلقائياً لزاتكا مع كل عملية بيع', icon: Zap },
    { step: '4', title: 'المتابعة', desc: 'لوحة تحكم لمراقبة حالة الفواتير وتاريخ الإرسال', icon: BarChart3 },
  ];

  return (
    <AnimatedSection className="py-20 bg-white" id="zatca">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <motion.div variants={fadeInLeft} transition={{ duration: 0.7 }}>
            <div className="inline-flex items-center gap-2 bg-green-50 text-green-700 px-4 py-2 rounded-full text-sm font-semibold mb-6">
              <FileCheck className="w-4 h-4" />
              متوافق مع هيئة الزكاة والضريبة
            </div>

            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-6">
              الفوترة الإلكترونية
              <br />
              <span className="text-green-600">بضغطة زر واحدة</span>
            </h2>

            <p className="text-gray-500 text-lg mb-8 leading-relaxed">
              النظام متوافق بالكامل مع متطلبات المرحلة الثانية (مرحلة الربط والتكامل).
              يتم توليد الفواتير بصيغة XML/UBL 2.1 وإرسالها لمنصة فاتورة تلقائياً.
            </p>

            <motion.div variants={staggerContainer} className="space-y-3 mb-8">
              {[
                'توليد QR Code تلقائياً على كل فاتورة (TLV Format)',
                'هاش SHA-256 لضمان سلامة الفاتورة',
                'إبلاغ فوري للفواتير المبسطة (B2C)',
                'تصفية الفواتير الضريبية (B2B)',
                'أرشفة كاملة بصيغة XML',
                'لوحة تحكم لمراقبة حالة الإرسال',
              ].map((item, i) => (
                <motion.div key={i} variants={fadeUp} transition={{ duration: 0.3 }} className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
                  <span className="text-gray-700">{item}</span>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>

          <motion.div variants={fadeInRight} transition={{ duration: 0.7 }} className="space-y-5">
            <h3 className="text-xl font-bold text-gray-900 mb-6">خطوات الربط مع زاتكا</h3>
            {phases.map((phase, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.15, duration: 0.5 }}
                viewport={{ once: true }}
                className="flex gap-4 items-start"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white font-bold text-lg shrink-0 shadow-lg">
                  {phase.step}
                </div>
                <div className="flex-1 bg-green-50/50 rounded-xl p-4 border border-green-100 hover:border-green-300 transition-colors">
                  <h4 className="font-bold text-gray-900 flex items-center gap-2">
                    <phase.icon className="w-4 h-4 text-green-600" />
                    {phase.title}
                  </h4>
                  <p className="text-gray-500 text-sm mt-1">{phase.desc}</p>
                </div>
              </motion.div>
            ))}

            <motion.div
              whileHover={{ scale: 1.02 }}
              className="bg-gradient-to-l from-green-500 to-emerald-600 rounded-2xl p-6 text-white mt-6"
            >
              <div className="flex items-center gap-3 mb-2">
                <Shield className="w-8 h-8" />
                <div>
                  <h4 className="font-bold text-lg">جاهز للتفعيل فوراً</h4>
                  <p className="text-green-100 text-sm">البنية التحتية مكتملة — فقط أدخل بيانات التفعيل</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </AnimatedSection>
  );
}

// ═══════════════════════════════════════════════════════════
// Multi-tenant Section
// ═══════════════════════════════════════════════════════════

function MultiTenantSection() {
  const cards = [
    {
      icon: Layers, title: 'فصل كامل للبيانات',
      desc: 'كل متجر يعمل في بيئة معزولة تماماً — لا يمكن لأي متجر الوصول لبيانات متجر آخر.',
      items: ['تشفير بيانات كل متجر', 'JWT Token لكل مستأجر', 'Global Query Filters', 'عزل كامل للبيانات'],
    },
    {
      icon: Database, title: 'إدارة مركزية',
      desc: 'لوحة تحكم للمدير تتيح إنشاء متاجر جديدة، إدارة الاشتراكات، ومراقبة الأداء.',
      items: ['إنشاء متجر بدقيقة واحدة', 'خطط اشتراك مرنة', 'تفعيل/إيقاف فوري', 'إحصائيات مركزية'],
    },
    {
      icon: Globe, title: 'مرونة كاملة',
      desc: 'كل متجر يمكنه تخصيص إعداداته — المنتجات، الأسعار، المستخدمين، وربط زاتكا.',
      items: ['إعدادات مستقلة', 'مستخدمين غير محدودين', 'تفعيل زاتكا لكل متجر', 'تقارير منفصلة'],
    },
  ];

  return (
    <AnimatedSection className="py-20 bg-gradient-to-bl from-indigo-50 via-white to-purple-50" id="multi-tenant">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div variants={fadeUp} transition={{ duration: 0.6 }} className="text-center mb-16">
          <span className="text-purple-600 font-semibold text-sm">منصة SaaS متكاملة</span>
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mt-3">
            إدارة متاجر متعددة
            <br />
            <span className="text-purple-600">من لوحة تحكم واحدة</span>
          </h2>
        </motion.div>

        <motion.div variants={staggerContainer} className="grid md:grid-cols-3 gap-8">
          {cards.map((card, i) => (
            <motion.div
              key={i}
              variants={fadeUp}
              transition={{ duration: 0.5 }}
              whileHover={{ y: -8 }}
              className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100"
            >
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center mb-6 shadow-lg">
                <card.icon className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">{card.title}</h3>
              <p className="text-gray-500 mb-6 leading-relaxed">{card.desc}</p>
              <ul className="space-y-2.5">
                {card.items.map((item, j) => (
                  <motion.li
                    key={j}
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ delay: j * 0.1 }}
                    viewport={{ once: true }}
                    className="flex items-center gap-2 text-sm"
                  >
                    <CheckCircle2 className="w-4 h-4 text-purple-500 shrink-0" />
                    <span className="text-gray-600">{item}</span>
                  </motion.li>
                ))}
              </ul>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </AnimatedSection>
  );
}

// ═══════════════════════════════════════════════════════════
// Pricing Section
// ═══════════════════════════════════════════════════════════

function PricingSection({ onGetStarted }: { onGetStarted: () => void }) {
  const [yearly, setYearly] = useState(false);
  const plans = [
    { name: 'أساسي', monthly: 1400, yearly: 14000, desc: 'مثالي للمتاجر الصغيرة', popular: false, features: ['مستخدمين: 3', 'مخزن واحد', 'نقطة بيع واحدة', 'إدارة المخزون', 'الفوترة الإلكترونية (زاتكا)', 'ربط ماكينات مدى', 'تقارير أساسية', 'يعمل أوفلاين', 'دعم فني بالإيميل'] },
    { name: 'متقدم', monthly: 2800, yearly: 28000, desc: 'للمطاعم والكافيهات والفروع', popular: true, features: ['مستخدمين: 10', '3 مخازن • 3 نقاط بيع', 'كل مميزات الأساسي', 'واجهة الويتر + شاشة المطبخ', 'طلب QR ذاتي للعميل', 'أقسام ومناطق التشغيل', 'تعدد الفروع', 'بصمة حضور + مسير رواتب', 'صلاحيات مفصّلة', 'دعم فني بالهاتف'] },
    { name: 'احترافي', monthly: 4200, yearly: 42000, desc: 'للشركات والسلاسل التجارية', popular: false, features: ['مستخدمين وفروع: غير محدود', 'مخازن ونقاط بيع: غير محدود', 'كل مميزات المتقدم', 'تطبيق موبايل مخصص', 'API مفتوح', 'تخصيص كامل', 'مدير حساب مخصص', 'دعم فني 24/7', 'SLA 99.9%'] },
  ];

  return (
    <AnimatedSection className="py-20 bg-white" id="pricing">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div variants={fadeUp} transition={{ duration: 0.6 }} className="text-center mb-12">
          <span className="text-indigo-600 font-semibold text-sm">خطط واضحة بدون مفاجآت</span>
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mt-3">
            اختر الخطة المناسبة لتجارتك
          </h2>
          <p className="text-gray-500 mt-4">جميع الخطط تشمل الفوترة الإلكترونية والتحديثات المجانية</p>

          {/* Yearly / Monthly toggle */}
          <div className="mt-8 flex items-center justify-center gap-4">
            <span className={`text-sm font-medium ${!yearly ? 'text-gray-900' : 'text-gray-400'}`}>شهري</span>
            <button
              onClick={() => setYearly(!yearly)}
              className={`relative w-14 h-7 rounded-full transition-colors ${yearly ? 'bg-indigo-600' : 'bg-gray-300'}`}
            >
              <motion.div
                layout
                className="absolute top-0.5 w-6 h-6 rounded-full bg-white shadow"
                style={{ left: yearly ? 'auto' : '2px', right: yearly ? '2px' : 'auto' }}
              />
            </button>
            <span className={`text-sm font-medium ${yearly ? 'text-gray-900' : 'text-gray-400'}`}>
              سنوي
              <span className="mr-1 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">وفّر 17%</span>
            </span>
          </div>
        </motion.div>

        <motion.div variants={staggerContainer} className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {plans.map((plan, i) => (
            <motion.div
              key={i}
              variants={scaleIn}
              transition={{ duration: 0.5 }}
              whileHover={{ y: -6 }}
              className={`relative rounded-2xl p-8 transition-all ${
                plan.popular
                  ? 'bg-gradient-to-b from-indigo-600 to-purple-700 text-white shadow-2xl scale-105 border-0 z-10'
                  : 'bg-white border-2 border-gray-100'
              }`}
            >
              {plan.popular && (
                <motion.div
                  initial={{ scale: 0 }}
                  whileInView={{ scale: 1 }}
                  transition={{ type: 'spring', delay: 0.3 }}
                  viewport={{ once: true }}
                  className="absolute -top-4 left-1/2 -translate-x-1/2 bg-yellow-400 text-gray-900 px-4 py-1 rounded-full text-sm font-bold"
                >
                  <Star className="w-3 h-3 inline ml-1" />
                  الأكثر طلباً
                </motion.div>
              )}

              <h3 className={`text-xl font-bold ${plan.popular ? 'text-white' : 'text-gray-900'}`}>{plan.name}</h3>
              <p className={`text-sm mt-1 ${plan.popular ? 'text-indigo-200' : 'text-gray-500'}`}>{plan.desc}</p>

              <div className="mt-6 mb-8">
                <AnimatePresence mode="wait">
                  <motion.div key={yearly ? 'yearly' : 'monthly'} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }}>
                    <span className={`text-4xl font-bold ${plan.popular ? 'text-white' : 'text-gray-900'}`}>
                      {(yearly ? plan.yearly : plan.monthly).toLocaleString('en-US')}
                    </span>
                    <span className={`text-sm ${plan.popular ? 'text-indigo-200' : 'text-gray-500'}`}>
                      {' '}ر.س / {yearly ? 'سنوياً' : 'شهرياً'}
                    </span>
                  </motion.div>
                </AnimatePresence>
              </div>

              <ul className="space-y-3 mb-8">
                {plan.features.map((f, j) => (
                  <li key={j} className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className={`w-4 h-4 shrink-0 ${plan.popular ? 'text-green-300' : 'text-green-500'}`} />
                    <span className={plan.popular ? 'text-indigo-100' : 'text-gray-600'}>{f}</span>
                  </li>
                ))}
              </ul>

              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={onGetStarted}
                className={`w-full py-3 rounded-xl font-bold transition-all ${
                  plan.popular
                    ? 'bg-white text-indigo-700 hover:bg-yellow-50 shadow-lg'
                    : 'bg-indigo-600 text-white hover:bg-indigo-700'
                }`}
              >
                ابدأ الآن
              </motion.button>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </AnimatedSection>
  );
}

// ═══════════════════════════════════════════════════════════
// FAQ Section with Accordion Animation
// ═══════════════════════════════════════════════════════════

function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const faqs = [
    { q: 'هل النظام متوافق مع هيئة الزكاة والضريبة؟', a: 'نعم، النظام متوافق بالكامل مع المرحلة الثانية (مرحلة الربط والتكامل). يتم توليد الفواتير بصيغة XML/UBL 2.1 وإرسالها لمنصة فاتورة تلقائياً مع كل عملية بيع.' },
    { q: 'هل يمكنني إدارة أكثر من فرع؟', a: 'بالتأكيد. النظام مصمم لتعدد المتاجر (Multi-Tenant) حيث يعمل كل فرع بشكل مستقل تماماً مع بياناته ومستخدميه الخاصين، ويمكنك إدارتهم جميعاً من لوحة تحكم مركزية.' },
    { q: 'ما الأجهزة المدعومة؟', a: 'يعمل النظام على أي جهاز يحتوي متصفح ويب حديث — كمبيوتر، لابتوب، تابلت، أو حتى جوال. كما يدعم أجهزة الباركود، الموازين الرقمية (CAS, DIGI, Toledo)، والطابعات الحرارية.' },
    { q: 'هل البيانات آمنة؟', a: 'نعم. النظام يستخدم تشفير 256-bit SSL، مصادقة JWT، وعزل كامل للبيانات بين المتاجر على مستوى قاعدة البيانات. بالإضافة لنسخ احتياطية يومية وحماية ضد تغيير TenantId.' },
    { q: 'كيف يتم إنشاء حساب جديد؟', a: 'يقوم مدير المنصة بإنشاء حسابك من لوحة التحكم المركزية. يتم تجهيز المتجر تلقائياً بمستودع رئيسي وصندوق نقدي وحساب مدير. بعدها يمكنك تسجيل الدخول مباشرة وبدء العمل.' },
    { q: 'ماذا لو احتجت مساعدة؟', a: 'فريق الدعم الفني متواجد على مدار الساعة عبر الهاتف، البريد الإلكتروني، والمحادثة المباشرة. كما نوفر قاعدة معرفة شاملة وفيديوهات تعليمية.' },
  ];

  return (
    <AnimatedSection className="py-20 bg-gray-50" id="faq">
      <div className="max-w-3xl mx-auto px-6">
        <motion.div variants={fadeUp} transition={{ duration: 0.6 }} className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900">الأسئلة الشائعة</h2>
          <p className="text-gray-500 mt-3">إجابات سريعة على الأسئلة التي تهمك</p>
        </motion.div>

        <motion.div variants={staggerContainer} className="space-y-3">
          {faqs.map((faq, i) => (
            <motion.div
              key={i}
              variants={fadeUp}
              transition={{ duration: 0.3 }}
              className="bg-white rounded-xl border border-gray-100 overflow-hidden"
            >
              <button
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                className="w-full flex items-center justify-between p-5 text-right hover:bg-gray-50/70 transition"
              >
                <span className="font-semibold text-gray-900 text-sm sm:text-base">{faq.q}</span>
                <motion.div
                  animate={{ rotate: openIndex === i ? 180 : 0 }}
                  transition={{ duration: 0.3 }}
                  className="mr-4 shrink-0"
                >
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                </motion.div>
              </button>
              <AnimatePresence initial={false}>
                {openIndex === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                    className="overflow-hidden"
                  >
                    <div className="px-5 pb-5 text-gray-500 leading-relaxed border-t border-gray-50 pt-3 text-sm">
                      {faq.a}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </AnimatedSection>
  );
}

// ═══════════════════════════════════════════════════════════
// Contact Form Section (Real)
// ═══════════════════════════════════════════════════════════

function ContactSection() {
  const [form, setForm] = useState({ name: '', phone: '', email: '', message: '' });
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.phone) return;
    setSending(true);
    // Simulate send (replace with actual API when available)
    await new Promise(r => setTimeout(r, 1200));
    setSending(false);
    setSent(true);
    setForm({ name: '', phone: '', email: '', message: '' });
  };

  return (
    <AnimatedSection className="py-20 bg-white" id="contact">
      <div className="max-w-5xl mx-auto px-6">
        <div className="grid md:grid-cols-2 gap-16 items-start">
          <motion.div variants={fadeInLeft} transition={{ duration: 0.7 }}>
            <span className="text-indigo-600 font-semibold text-sm">تواصل معنا</span>
            <h2 className="text-3xl font-bold text-gray-900 mt-3 mb-4">
              نحن هنا لمساعدتك
            </h2>
            <p className="text-gray-500 mb-8 leading-relaxed">
              أرسل لنا استفسارك وسيتواصل معك فريقنا خلال 24 ساعة كحد أقصى.
              نسعد بالإجابة على أي سؤال حول النظام.
            </p>

            <div className="space-y-5">
              {[
                { icon: Phone, text: '0500 000 000', label: 'هاتف' },
                { icon: Mail, text: 'info@mscashier.sa', label: 'بريد إلكتروني' },
                { icon: MapPin, text: 'الرياض، المملكة العربية السعودية', label: 'الموقع' },
                { icon: HeadphonesIcon, text: 'متاحين 24/7', label: 'دعم فني' },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: 30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  viewport={{ once: true }}
                  className="flex items-center gap-4"
                >
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">
                    <item.icon className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">{item.label}</p>
                    <p className="text-gray-700 font-medium">{item.text}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <motion.div variants={fadeInRight} transition={{ duration: 0.7 }}>
            <AnimatePresence mode="wait">
              {sent ? (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-green-50 border border-green-200 rounded-2xl p-10 text-center"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', delay: 0.2 }}
                  >
                    <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
                  </motion.div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">تم إرسال رسالتك بنجاح!</h3>
                  <p className="text-gray-500">سيتواصل معك فريقنا خلال 24 ساعة.</p>
                  <button
                    onClick={() => setSent(false)}
                    className="mt-6 px-6 py-2.5 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition"
                  >
                    إرسال رسالة أخرى
                  </button>
                </motion.div>
              ) : (
                <motion.form
                  key="form"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  onSubmit={handleSubmit}
                  className="bg-gray-50 rounded-2xl p-8 border border-gray-100 space-y-5"
                >
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">الاسم <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={e => setForm({ ...form, name: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none text-sm bg-white"
                      placeholder="الاسم الكامل"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">الهاتف <span className="text-red-500">*</span></label>
                      <input
                        type="tel"
                        value={form.phone}
                        onChange={e => setForm({ ...form, phone: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none text-sm bg-white"
                        placeholder="05xxxxxxxx"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">البريد</label>
                      <input
                        type="email"
                        value={form.email}
                        onChange={e => setForm({ ...form, email: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none text-sm bg-white"
                        placeholder="اختياري"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">الرسالة</label>
                    <textarea
                      value={form.message}
                      onChange={e => setForm({ ...form, message: e.target.value })}
                      rows={4}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none text-sm bg-white resize-none"
                      placeholder="كيف يمكننا مساعدتك؟"
                    />
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    type="submit"
                    disabled={sending || !form.name || !form.phone}
                    className="w-full py-3.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {sending ? (
                      <><Loader2 className="w-5 h-5 animate-spin" /> جارٍ الإرسال...</>
                    ) : (
                      <><Send className="w-5 h-5" /> إرسال</>
                    )}
                  </motion.button>
                </motion.form>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
    </AnimatedSection>
  );
}

// ═══════════════════════════════════════════════════════════
// Interactive Demo — Tabbed Multi-Service Showcase
// ═══════════════════════════════════════════════════════════

const DEMO_PRODUCTS = [
  { name: 'مياه معدنية', price: 2.00, barcode: '6281000000001', stock: 150, cat: 'مشروبات' },
  { name: 'خبز أبيض', price: 3.50, barcode: '6281000000002', stock: 80, cat: 'مخبوزات' },
  { name: 'حليب طازج', price: 7.00, barcode: '6281000000003', stock: 45, cat: 'ألبان' },
  { name: 'أرز بسمتي', price: 22.00, barcode: '6281000000004', stock: 60, cat: 'بقالة' },
  { name: 'زيت زيتون', price: 35.00, barcode: '6281000000005', stock: 30, cat: 'بقالة' },
  { name: 'شاي أخضر', price: 12.50, barcode: '6281000000006', stock: 90, cat: 'مشروبات' },
  { name: 'تونة معلبة', price: 8.75, barcode: '6281000000007', stock: 120, cat: 'بقالة' },
  { name: 'جبنة بيضاء', price: 15.00, barcode: '6281000000008', stock: 40, cat: 'ألبان' },
];

const DEMO_TABS = [
  { id: 'pos', label: 'نقطة البيع', icon: ShoppingBag, color: 'indigo' },
  { id: 'waiter', label: 'الويتر', icon: ConciergeBell, color: 'amber' },
  { id: 'kitchen', label: 'المطبخ', icon: ChefHat, color: 'red' },
  { id: 'qr', label: 'طلب QR', icon: QrCode, color: 'violet' },
  { id: 'terminal', label: 'مدى / دفع', icon: Wallet, color: 'emerald' },
  { id: 'fingerprint', label: 'البصمة', icon: Fingerprint, color: 'sky' },
  { id: 'branches', label: 'الفروع', icon: GitBranch, color: 'fuchsia' },
  { id: 'reports', label: 'التقارير', icon: BarChart3, color: 'blue' },
] as const;

const DEMO_STEPS = [
  { id: 'scan', title: 'مسح الباركود', desc: 'امسح المنتج أو ابحث بالاسم — يُضاف تلقائياً للسلة', icon: Barcode },
  { id: 'cart', title: 'إدارة السلة', desc: 'عدّل الكميات، اختر العميل، غيّر نوع السعر', icon: ShoppingBag },
  { id: 'pay', title: 'اختر طريقة الدفع', desc: 'كاش، فيزا، تحويل، أو آجل — مع حساب الباقي', icon: CreditCard },
  { id: 'invoice', title: 'فاتورة إلكترونية', desc: 'فاتورة متوافقة مع زاتكا + QR Code تلقائي', icon: Receipt },
  { id: 'report', title: 'تقارير لحظية', desc: 'تابع المبيعات والأرباح والمخزون لحظة بلحظة', icon: BarChart3 },
];

function InteractiveDemoSection({ onGetStarted }: { onGetStarted: () => void }) {
  const [activeTab, setActiveTab] = useState<string>('pos');
  const [demoCart, setDemoCart] = useState<{ name: string; price: number; qty: number }[]>([]);
  const [scanAnim, setScanAnim] = useState(false);

  const cartTotal = demoCart.reduce((s, i) => s + i.price * i.qty, 0);
  const tax = +(cartTotal * 0.15).toFixed(2);
  const grandTotal = +(cartTotal + tax).toFixed(2);

  useEffect(() => {
    if (activeTab === 'pos' && demoCart.length === 0) {
      const t1 = setTimeout(() => addDemoItem(0), 600);
      const t2 = setTimeout(() => addDemoItem(2), 1400);
      const t3 = setTimeout(() => addDemoItem(5), 2200);
      return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
    }
  }, [activeTab]);

  const addDemoItem = (idx: number) => {
    setScanAnim(true);
    setTimeout(() => setScanAnim(false), 500);
    const p = DEMO_PRODUCTS[idx];
    if (!p) return;
    setDemoCart(prev => {
      const existing = prev.find(i => i.name === p.name);
      if (existing) return prev.map(i => i.name === p.name ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { name: p.name, price: p.price, qty: 1 }];
    });
  };

  const colorMap: Record<string, { bg: string; text: string; activeBg: string; ring: string }> = {
    indigo:  { bg: 'bg-indigo-50', text: 'text-indigo-600', activeBg: 'bg-indigo-600', ring: 'ring-indigo-200' },
    amber:   { bg: 'bg-amber-50', text: 'text-amber-600', activeBg: 'bg-amber-500', ring: 'ring-amber-200' },
    red:     { bg: 'bg-red-50', text: 'text-red-600', activeBg: 'bg-red-500', ring: 'ring-red-200' },
    violet:  { bg: 'bg-violet-50', text: 'text-violet-600', activeBg: 'bg-violet-600', ring: 'ring-violet-200' },
    emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600', activeBg: 'bg-emerald-600', ring: 'ring-emerald-200' },
    sky:     { bg: 'bg-sky-50', text: 'text-sky-600', activeBg: 'bg-sky-600', ring: 'ring-sky-200' },
    fuchsia: { bg: 'bg-fuchsia-50', text: 'text-fuchsia-600', activeBg: 'bg-fuchsia-600', ring: 'ring-fuchsia-200' },
    blue:    { bg: 'bg-blue-50', text: 'text-blue-600', activeBg: 'bg-blue-600', ring: 'ring-blue-200' },
  };

  // ═══ Tab Screens ═══

  const renderTabContent = () => {
    switch (activeTab) {
      case 'pos': return (
        <div className="space-y-3">
          <div className="flex items-center gap-2 bg-gray-100 rounded-xl px-4 py-2.5">
            <Search className="w-4 h-4 text-gray-400" /><span className="text-xs text-gray-400 flex-1">بحث بالاسم أو الباركود...</span>
            <motion.div animate={scanAnim ? { scale: [1, 1.3, 1] } : {}}><Barcode className="w-5 h-5 text-indigo-500" /></motion.div>
          </div>
          <div className="grid grid-cols-4 gap-1.5">
            {DEMO_PRODUCTS.slice(0, 8).map((p, i) => (
              <motion.button key={i} whileHover={{ y: -2 }} whileTap={{ scale: 0.93 }} onClick={() => addDemoItem(i)}
                className="bg-white border border-gray-100 rounded-lg p-2 text-center hover:border-indigo-300 transition relative">
                <div className="w-7 h-7 bg-indigo-50 rounded-md mx-auto mb-1 flex items-center justify-center"><Package className="w-3.5 h-3.5 text-indigo-500" /></div>
                <p className="text-[9px] font-semibold text-gray-800 leading-tight truncate">{p.name}</p>
                <p className="text-[9px] font-bold text-indigo-600">{p.price.toFixed(2)}</p>
                {demoCart.find(c => c.name === p.name) && <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute -top-1 -left-1 w-4 h-4 bg-indigo-600 text-white rounded-full text-[8px] font-bold flex items-center justify-center">{demoCart.find(c => c.name === p.name)?.qty}</motion.div>}
              </motion.button>
            ))}
          </div>
          {demoCart.length > 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white border border-gray-100 rounded-xl p-3">
              {demoCart.map((c, i) => <div key={i} className="flex justify-between text-[10px] text-gray-700 py-0.5"><span>{c.name} ×{c.qty}</span><span className="font-bold">{(c.price * c.qty).toFixed(2)}</span></div>)}
              <div className="border-t border-gray-100 mt-2 pt-2 flex justify-between text-xs font-bold text-gray-900"><span>الإجمالي + 15%</span><span className="text-indigo-700">{grandTotal.toFixed(2)} ر.س</span></div>
              <motion.button whileTap={{ scale: 0.95 }} className="w-full mt-2 py-2 bg-green-500 text-white rounded-lg text-xs font-bold">دفع الآن</motion.button>
            </motion.div>
          )}
          <AnimatePresence>{scanAnim && <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="bg-green-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold text-center"><CheckCircle2 className="w-3 h-3 inline ml-1" /> تمت الإضافة!</motion.div>}</AnimatePresence>
        </div>
      );

      case 'waiter': return (
        <div className="space-y-3">
          <div className="flex items-center gap-2 mb-1"><ConciergeBell className="w-4 h-4 text-amber-500" /><span className="text-xs font-bold text-gray-800">اختر الطاولة</span></div>
          <div className="grid grid-cols-4 gap-2">
            {[{ n: 'T-01', s: 'مشغولة', c: 'bg-red-100 border-red-300 text-red-700' }, { n: 'T-02', s: 'فارغة', c: 'bg-green-50 border-green-300 text-green-700' }, { n: 'T-03', s: 'فارغة', c: 'bg-green-50 border-green-300 text-green-700' }, { n: 'T-04', s: 'محجوزة', c: 'bg-amber-50 border-amber-300 text-amber-700' }, { n: 'T-05', s: 'فارغة', c: 'bg-green-50 border-green-300 text-green-700' }, { n: 'T-06', s: 'مشغولة', c: 'bg-red-100 border-red-300 text-red-700' }, { n: 'VIP-1', s: 'فارغة', c: 'bg-green-50 border-green-300 text-green-700' }, { n: 'VIP-2', s: 'مشغولة', c: 'bg-red-100 border-red-300 text-red-700' }].map((t, i) => (
              <motion.div key={i} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.06 }}
                className={`border-2 rounded-xl p-2 text-center cursor-pointer hover:shadow-md transition ${t.c}`}>
                <p className="text-[10px] font-bold">{t.n}</p>
                <p className="text-[8px] mt-0.5">{t.s}</p>
              </motion.div>
            ))}
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
            <p className="text-[10px] font-bold text-amber-800 mb-2">طلب T-02 — ضيف (3 أشخاص)</p>
            {[{ n: 'لاتيه', q: 2, p: 18 }, { n: 'كابتشينو', q: 1, p: 20 }, { n: 'كيكة شوكولاتة', q: 1, p: 25 }].map((item, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: 15 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 + i * 0.12 }}
                className="flex justify-between text-[10px] text-gray-700 py-1 border-b border-amber-100 last:border-0">
                <span>{item.n} ×{item.q}</span><span className="font-bold">{item.p * item.q} ر.س</span>
              </motion.div>
            ))}
            <motion.button whileTap={{ scale: 0.95 }} className="w-full mt-2 py-2 bg-amber-500 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1"><Send className="w-3 h-3" /> إرسال للمطبخ</motion.button>
          </div>
        </div>
      );

      case 'kitchen': return (
        <div className="space-y-3">
          <div className="flex items-center justify-between"><div className="flex items-center gap-2"><ChefHat className="w-4 h-4 text-red-500" /><span className="text-xs font-bold text-gray-800">لوحة المطبخ</span></div><span className="text-[9px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-bold">3 طلبات</span></div>
          {[{ id: 'ORD-001', table: 'T-02', time: '2 دقيقة', items: ['لاتيه ×2', 'كابتشينو'], status: 'جديد', sc: 'border-red-400 bg-red-50' },
            { id: 'ORD-002', table: 'VIP-1', time: '5 دقائق', items: ['ستيك ×1', 'سلطة سيزر'], status: 'قيد التحضير', sc: 'border-amber-400 bg-amber-50' },
            { id: 'ORD-003', table: 'T-06', time: '8 دقائق', items: ['برجر ×2'], status: 'جاهز', sc: 'border-green-400 bg-green-50' }].map((o, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.15 }}
              className={`border-2 rounded-xl p-3 ${o.sc}`}>
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-[10px] font-bold text-gray-800">{o.id} — {o.table}</span>
                <div className="flex items-center gap-1"><Clock className="w-3 h-3 text-gray-400" /><span className="text-[9px] text-gray-500">{o.time}</span></div>
              </div>
              <div className="space-y-0.5 mb-2">{o.items.map((it, j) => <p key={j} className="text-[10px] text-gray-600">• {it}</p>)}</div>
              <div className="flex gap-1.5">
                {o.status === 'جديد' && <motion.button whileTap={{ scale: 0.95 }} className="flex-1 py-1.5 bg-amber-500 text-white rounded-lg text-[10px] font-bold">بدء التحضير</motion.button>}
                {o.status === 'قيد التحضير' && <motion.button whileTap={{ scale: 0.95 }} className="flex-1 py-1.5 bg-green-500 text-white rounded-lg text-[10px] font-bold">جاهز ✓</motion.button>}
                {o.status === 'جاهز' && <motion.button whileTap={{ scale: 0.95 }} className="flex-1 py-1.5 bg-blue-500 text-white rounded-lg text-[10px] font-bold">تم التسليم</motion.button>}
              </div>
            </motion.div>
          ))}
        </div>
      );

      case 'qr': return (
        <div className="space-y-3 text-center">
          <div className="flex items-center justify-center gap-2 mb-1"><QrCode className="w-4 h-4 text-violet-500" /><span className="text-xs font-bold text-gray-800">طلب العميل الذاتي</span></div>
          <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-28 h-28 bg-gray-900 rounded-2xl mx-auto flex items-center justify-center shadow-lg">
            <div className="grid grid-cols-8 gap-px p-2 w-full h-full">{Array.from({ length: 64 }).map((_, i) => <div key={i} className={`${Math.random() > 0.4 ? 'bg-white' : 'bg-gray-900'} rounded-[1px]`} />)}</div>
          </motion.div>
          <p className="text-[10px] text-gray-500">يسكان العميل الكود → تفتح المنيو</p>
          <div className="bg-violet-50 border border-violet-200 rounded-xl p-3 text-right">
            <p className="text-[10px] font-bold text-violet-800 mb-2">المنيو — كافيه الجوري</p>
            {[{ n: 'لاتيه بارد', p: 18 }, { n: 'موكا ساخن', p: 22 }, { n: 'تشيز كيك', p: 28 }].map((m, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 + i * 0.1 }}
                className="flex items-center justify-between py-1.5 border-b border-violet-100 last:border-0">
                <div className="flex items-center gap-2"><div className="w-6 h-6 bg-violet-100 rounded-md flex items-center justify-center"><UtensilsCrossed className="w-3 h-3 text-violet-500" /></div><span className="text-[10px] text-gray-700">{m.n}</span></div>
                <div className="flex items-center gap-2"><span className="text-[10px] font-bold text-violet-700">{m.p} ر.س</span><motion.button whileTap={{ scale: 0.85 }} className="w-5 h-5 bg-violet-500 text-white rounded-md text-[10px] font-bold">+</motion.button></div>
              </motion.div>
            ))}
            <motion.button whileTap={{ scale: 0.95 }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}
              className="w-full mt-2 py-2 bg-violet-600 text-white rounded-lg text-xs font-bold">تأكيد الطلب والدفع 💳</motion.button>
          </div>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }} className="bg-green-50 border border-green-200 rounded-xl p-2 text-center">
            <p className="text-[10px] font-bold text-green-700">⏱ وقت التجهيز المتوقع: 8 دقائق</p>
          </motion.div>
        </div>
      );

      case 'terminal': return (
        <div className="space-y-3">
          <div className="flex items-center gap-2 mb-1"><Wallet className="w-4 h-4 text-emerald-500" /><span className="text-xs font-bold text-gray-800">ماكينة الدفع</span></div>
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-4 text-center text-white">
            <div className="w-16 h-10 bg-gray-700 rounded-lg mx-auto mb-3 flex items-center justify-center border border-gray-600"><CreditCard className="w-6 h-6 text-emerald-400" /></div>
            <p className="text-lg font-bold">103.10 <span className="text-xs">ر.س</span></p>
            <p className="text-[10px] text-gray-400 mt-1">يرجى تمرير البطاقة...</p>
            <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1.5 }} className="w-8 h-1 bg-emerald-400 rounded-full mx-auto mt-3" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            {[{ n: 'Geidea', s: 'متصل', c: 'border-green-300 bg-green-50' }, { n: 'Nearpay', s: 'متصل', c: 'border-green-300 bg-green-50' }, { n: 'STC Pay', s: 'غير متصل', c: 'border-gray-200 bg-gray-50' }, { n: 'Ingenico', s: 'متصل', c: 'border-green-300 bg-green-50' }].map((d, i) => (
              <motion.div key={i} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.1 }}
                className={`border rounded-xl p-2.5 text-center ${d.c}`}>
                <p className="text-[10px] font-bold text-gray-800">{d.n}</p>
                <div className="flex items-center justify-center gap-1 mt-1"><div className={`w-1.5 h-1.5 rounded-full ${d.s === 'متصل' ? 'bg-green-500' : 'bg-gray-300'}`} /><span className="text-[8px] text-gray-500">{d.s}</span></div>
              </motion.div>
            ))}
          </div>
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }} className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-center">
            <CheckCircle2 className="w-5 h-5 text-emerald-500 mx-auto mb-1" />
            <p className="text-[10px] font-bold text-emerald-700">تم الدفع بنجاح — مدى ****4832</p>
            <p className="text-[8px] text-gray-500 mt-0.5">Auth: 847293 | RRN: 202602141234</p>
          </motion.div>
        </div>
      );

      case 'fingerprint': return (
        <div className="space-y-3">
          <div className="flex items-center gap-2 mb-1"><Fingerprint className="w-4 h-4 text-sky-500" /><span className="text-xs font-bold text-gray-800">حضور وانصراف</span></div>
          <div className="bg-sky-50 border border-sky-200 rounded-2xl p-4 text-center">
            <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ repeat: Infinity, duration: 2 }} className="w-16 h-16 bg-sky-100 rounded-full mx-auto mb-3 flex items-center justify-center border-2 border-sky-300">
              <Fingerprint className="w-8 h-8 text-sky-500" />
            </motion.div>
            <p className="text-xs font-bold text-gray-800">ضع إصبعك على الجهاز</p>
            <p className="text-[10px] text-gray-500">ZKTeco — متصل</p>
          </div>
          <div className="space-y-2">
            {[{ n: 'محمد عبدالرحمن', t: '08:02 ص', type: 'حضور', c: 'text-green-600 bg-green-50' }, { n: 'سارة الشهري', t: '08:15 ص', type: 'حضور', c: 'text-green-600 bg-green-50' }, { n: 'أحمد علي', t: '05:00 م', type: 'انصراف', c: 'text-red-600 bg-red-50' }].map((r, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 + i * 0.12 }}
                className="flex items-center gap-2 bg-white border border-gray-100 rounded-xl px-3 py-2">
                <div className="w-7 h-7 bg-sky-50 rounded-full flex items-center justify-center"><UserCheck className="w-3.5 h-3.5 text-sky-500" /></div>
                <div className="flex-1"><p className="text-[10px] font-semibold text-gray-800">{r.n}</p><p className="text-[8px] text-gray-400">{r.t}</p></div>
                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${r.c}`}>{r.type}</span>
              </motion.div>
            ))}
          </div>
          <div className="bg-white border border-gray-100 rounded-xl p-2.5 text-center">
            <p className="text-[10px] font-bold text-gray-700">مسير الرواتب — فبراير 2026</p>
            <p className="text-[9px] text-gray-500 mt-0.5">إجمالي الرواتب: <span className="font-bold text-sky-600">32,500 ر.س</span> — 6 موظفين</p>
          </div>
        </div>
      );

      case 'branches': return (
        <div className="space-y-3">
          <div className="flex items-center gap-2 mb-1"><GitBranch className="w-4 h-4 text-fuchsia-500" /><span className="text-xs font-bold text-gray-800">إدارة الفروع</span></div>
          {[{ n: 'الفرع الرئيسي — الرياض', s: 'نشط', users: 5, products: 340, c: 'border-green-300 bg-green-50' },
            { n: 'فرع جدة', s: 'نشط', users: 3, products: 280, c: 'border-green-300 bg-green-50' },
            { n: 'فرع الدمام', s: 'قيد التفعيل', users: 0, products: 0, c: 'border-amber-300 bg-amber-50' }].map((b, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.12 }}
              className={`border-2 rounded-xl p-3 ${b.c}`}>
              <div className="flex justify-between items-center mb-1">
                <span className="text-[10px] font-bold text-gray-800">{b.n}</span>
                <span className={`text-[8px] font-bold px-2 py-0.5 rounded-full ${b.s === 'نشط' ? 'bg-green-200 text-green-700' : 'bg-amber-200 text-amber-700'}`}>{b.s}</span>
              </div>
              <div className="flex gap-3 text-[9px] text-gray-500">
                <span><Users className="w-3 h-3 inline ml-0.5" />{b.users} مستخدم</span>
                <span><Package className="w-3 h-3 inline ml-0.5" />{b.products} منتج</span>
              </div>
            </motion.div>
          ))}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="bg-fuchsia-50 border border-fuchsia-200 rounded-xl p-3">
            <p className="text-[10px] text-gray-600 mb-2">مميزات الفروع:</p>
            {['مشاركة المنتجات أو فصلها', 'حتى 5 مخازن لكل فرع', 'تفعيل فوري بعد الدفع', 'باقات مرنة لكل فرع'].map((f, i) => (
              <div key={i} className="flex items-center gap-1.5 py-0.5"><CheckCircle2 className="w-3 h-3 text-fuchsia-500" /><span className="text-[9px] text-gray-700">{f}</span></div>
            ))}
          </motion.div>
        </div>
      );

      case 'reports': return (
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-2">
            {[{ l: 'مبيعات اليوم', v: '12,450', c: 'text-indigo-600', b: 'bg-indigo-50' }, { l: 'الفواتير', v: '47', c: 'text-green-600', b: 'bg-green-50' }, { l: 'صافي الربح', v: '3,820', c: 'text-purple-600', b: 'bg-purple-50' }].map((c, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className={`${c.b} rounded-xl p-2.5 text-center`}>
                <p className="text-[8px] text-gray-500">{c.l}</p><p className={`text-sm font-bold ${c.c}`}>{c.v}</p>
              </motion.div>
            ))}
          </div>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="bg-white rounded-xl p-3 border border-gray-100">
            <p className="text-[10px] font-bold text-gray-700 mb-2">مبيعات الأسبوع</p>
            <div className="flex items-end gap-1.5 h-20">
              {[65, 40, 78, 55, 90, 72, 85].map((h, i) => (
                <motion.div key={i} initial={{ height: 0 }} animate={{ height: `${h}%` }} transition={{ delay: 0.4 + i * 0.06 }} className="flex-1 bg-gradient-to-t from-indigo-500 to-indigo-400 rounded-t-md" />
              ))}
            </div>
            <div className="flex justify-between mt-1 text-[7px] text-gray-400">{['سبت', 'أحد', 'اثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة'].map(d => <span key={d}>{d}</span>)}</div>
          </motion.div>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="bg-white rounded-xl p-3 border border-gray-100">
            <p className="text-[10px] font-bold text-gray-700 mb-2">الأكثر مبيعاً</p>
            {[{ n: 'لاتيه', q: 340, pct: 100 }, { n: 'كابتشينو', q: 280, pct: 82 }, { n: 'مياه', q: 195, pct: 57 }].map((p, i) => (
              <div key={i} className="flex items-center gap-2 mb-1"><span className="text-[9px] text-gray-600 w-14 truncate">{p.n}</span>
                <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden"><motion.div initial={{ width: 0 }} animate={{ width: `${p.pct}%` }} transition={{ delay: 0.7 + i * 0.1 }} className="h-full bg-indigo-500 rounded-full" /></div>
                <span className="text-[8px] font-bold text-gray-700 w-6 text-left">{p.q}</span>
              </div>
            ))}
          </motion.div>
        </div>
      );

      default: return null;
    }
  };

  return (
    <AnimatedSection className="py-20 bg-white overflow-hidden" id="demo">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div variants={fadeUp} transition={{ duration: 0.6 }} className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-700 px-4 py-2 rounded-full text-sm font-semibold mb-5">
            <Play className="w-4 h-4" />
            عرض تفاعلي مباشر
          </div>
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900">
            شاهد كل خدمة
            <span className="text-indigo-600"> بالتفصيل</span>
          </h2>
          <p className="text-gray-500 mt-4 max-w-2xl mx-auto text-lg">
            تنقّل بين التبويبات لاستكشاف نقطة البيع، واجهة الويتر، شاشة المطبخ، طلب العميل، ماكينات الدفع، البصمة، والفروع
          </p>
        </motion.div>

        {/* ═══ Tabs ═══ */}
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {DEMO_TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            const c = colorMap[tab.color] ?? colorMap.indigo!;
            return (
              <motion.button
                key={tab.id}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all border-2 ${
                  isActive ? `${c.activeBg} text-white border-transparent shadow-lg` : `bg-white ${c.text} border-gray-100 hover:${c.bg} hover:border-gray-200`
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </motion.button>
            );
          })}
        </div>

        {/* ═══ Content Area ═══ */}
        <div className="max-w-xl mx-auto">
          <motion.div variants={scaleIn} transition={{ duration: 0.5 }}>
            <div className="bg-gray-900 rounded-[2rem] p-3 shadow-2xl">
              <div className="bg-gray-800 rounded-t-[1.5rem] px-5 py-2 flex items-center justify-between">
                <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-green-400" /><span className="text-[10px] text-gray-400 font-medium">MS Cashier — {DEMO_TABS.find(t => t.id === activeTab)?.label}</span></div>
                <div className="flex items-center gap-1.5"><Wifi className="w-3 h-3 text-gray-500" /><span className="text-[9px] text-gray-500 font-mono">{new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}</span></div>
              </div>
              <div className="bg-gray-50 min-h-[440px] max-h-[520px] overflow-y-auto p-4 relative">
                <AnimatePresence mode="wait">
                  <motion.div key={activeTab} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.25 }}>
                    {renderTabContent()}
                  </motion.div>
                </AnimatePresence>
              </div>
              <div className="bg-gray-800 rounded-b-[1.5rem] px-5 py-2 flex items-center justify-center"><div className="w-24 h-1 bg-gray-600 rounded-full" /></div>
            </div>
          </motion.div>

          {/* CTA */}
          <motion.div variants={fadeUp} transition={{ duration: 0.5 }} className="bg-gradient-to-l from-indigo-600 to-purple-600 rounded-2xl p-6 text-white text-center mt-8">
            <Sparkles className="w-7 h-7 mx-auto mb-2 text-yellow-300" />
            <h3 className="text-lg font-bold mb-1">أعجبك ما رأيت؟</h3>
            <p className="text-indigo-200 text-sm mb-4">ابدأ الآن واحصل على 14 يوم تجربة مجانية</p>
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }} onClick={onGetStarted}
              className="px-8 py-3 bg-white text-indigo-700 font-bold rounded-xl shadow-lg text-sm inline-flex items-center gap-2">
              ابدأ الآن <ArrowLeft className="w-4 h-4" />
            </motion.button>
          </motion.div>
        </div>
      </div>
    </AnimatedSection>
  );
}

// ═══════════════════════════════════════════════════════════
// CTA Section
// ═══════════════════════════════════════════════════════════

function CTASection({ onGetStarted }: { onGetStarted: () => void }) {
  return (
    <AnimatedSection className="py-20 bg-gradient-to-bl from-indigo-600 via-purple-600 to-blue-700 text-white relative overflow-hidden">
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-10 right-20 w-64 h-64 bg-white rounded-full blur-3xl" />
        <div className="absolute bottom-10 left-20 w-80 h-80 bg-blue-300 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-4xl mx-auto px-6 text-center">
        <motion.h2 variants={fadeUp} transition={{ duration: 0.6 }} className="text-3xl lg:text-5xl font-bold mb-6">
          جاهز لنقل تجارتك للمستوى التالي؟
        </motion.h2>
        <motion.p variants={fadeUp} transition={{ duration: 0.6 }} className="text-xl text-blue-100 mb-10 max-w-2xl mx-auto">
          انضم لأكثر من 2,500 متجر يستخدمون MS Cashier لإدارة مبيعاتهم بكفاءة
        </motion.p>

        <motion.div variants={fadeUp} transition={{ duration: 0.6 }} className="flex flex-wrap gap-4 justify-center">
          <motion.button
            whileHover={{ scale: 1.05, boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}
            whileTap={{ scale: 0.97 }}
            onClick={onGetStarted}
            className="group px-10 py-4 bg-white text-indigo-700 font-bold rounded-2xl shadow-xl text-lg flex items-center gap-2"
          >
            ابدأ الآن
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          </motion.button>
          <motion.a
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.97 }}
            href="tel:+966500000000"
            className="px-10 py-4 border-2 border-white/30 text-white font-medium rounded-2xl flex items-center gap-2 text-lg"
          >
            <Phone className="w-5 h-5" />
            تحدث مع مستشار
          </motion.a>
        </motion.div>

        <motion.div variants={fadeUp} transition={{ duration: 0.6 }} className="flex flex-wrap gap-8 justify-center mt-12 text-sm text-blue-200">
          <span className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4" /> بدون بطاقة ائتمان</span>
          <span className="flex items-center gap-2"><Clock className="w-4 h-4" /> إعداد في دقائق</span>
          <span className="flex items-center gap-2"><TrendingUp className="w-4 h-4" /> دعم فني مجاني</span>
        </motion.div>
      </div>
    </AnimatedSection>
  );
}

// ═══════════════════════════════════════════════════════════
// Footer
// ═══════════════════════════════════════════════════════════

function FooterWithLinks({ onPrivacy, onTerms }: { onPrivacy: () => void; onTerms: () => void }) {
  return (
    <footer className="bg-gray-900 text-gray-400 py-16">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid md:grid-cols-4 gap-12 mb-12">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold">
                M
              </div>
              <span className="text-white font-bold text-lg">MS Cashier</span>
            </div>
            <p className="text-sm leading-relaxed">
              نظام نقاط البيع الأكثر تكاملاً في المملكة العربية السعودية — متوافق مع زاتكا ويدعم تعدد الفروع.
            </p>
          </div>

          <div>
            <h4 className="text-white font-bold mb-4">المنتج</h4>
            <ul className="space-y-2 text-sm">
              {[
                { label: 'المميزات', id: 'features' },
                { label: 'الأسعار', id: 'pricing' },
                { label: 'الفوترة الإلكترونية', id: 'zatca' },
                { label: 'الأسئلة الشائعة', id: 'faq' },
              ].map(link => (
                <li key={link.id}>
                  <button onClick={() => scrollTo(link.id)} className="hover:text-white transition">
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold mb-4">الدعم والقانونية</h4>
            <ul className="space-y-2 text-sm">
              <li><button onClick={() => scrollTo('contact')} className="hover:text-white transition">تواصل معنا</button></li>
              <li><button onClick={() => scrollTo('faq')} className="hover:text-white transition">الأسئلة الشائعة</button></li>
              <li><button onClick={onPrivacy} className="hover:text-white transition">سياسة الخصوصية</button></li>
              <li><button onClick={onTerms} className="hover:text-white transition">الشروط والأحكام</button></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold mb-4">تواصل معنا</h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-2"><Phone className="w-4 h-4" /> 0500 000 000</li>
              <li className="flex items-center gap-2"><Mail className="w-4 h-4" /> info@mscashier.sa</li>
              <li className="flex items-center gap-2"><MapPin className="w-4 h-4" /> الرياض، المملكة العربية السعودية</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-8 flex flex-wrap justify-between items-center gap-4">
          <p className="text-sm">&copy; {new Date().getFullYear()} MS Cashier. جميع الحقوق محفوظة.</p>
          <div className="flex gap-6 text-sm">
            <button onClick={onPrivacy} className="hover:text-white transition">سياسة الخصوصية</button>
            <button onClick={onTerms} className="hover:text-white transition">الشروط والأحكام</button>
          </div>
        </div>
      </div>
    </footer>
  );
}

// ═══════════════════════════════════════════════════════════
// Subscription Request Form (Real API integration)
// ═══════════════════════════════════════════════════════════

const BUSINESS_TYPES = ['تجزئة', 'جملة', 'مطعم', 'مقهى', 'صيدلية', 'بقالة', 'أخرى'];
const PLAN_OPTIONS = [
  { id: 1, name: 'أساسي', price: '1,400 ر.س/شهر' },
  { id: 2, name: 'متقدم', price: '2,800 ر.س/شهر' },
  { id: 3, name: 'احترافي', price: '4,200 ر.س/شهر' },
];

function SubscriptionFormSection() {
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    storeName: '', businessType: 'تجزئة', ownerName: '', phone: '', email: '',
    address: '', city: '', vatNumber: '', planId: 2, adminUsername: '',
    adminPassword: '', adminFullName: '', notes: '',
  });

  const set = (key: string, val: string | number) => setForm(p => ({ ...p, [key]: val }));

  const step1Valid = form.storeName && form.ownerName && form.phone && form.city && form.vatNumber;
  const step2Valid = form.adminFullName && form.adminUsername.length >= 3 && form.adminPassword.length >= 6;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const API_URL = import.meta.env.VITE_API_URL || '/api/v1';
      const res = await fetch(`${API_URL}/subscriptions/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) {
        setSuccess(true);
      } else {
        setError(data.errors?.[0] || 'حدث خطأ. حاول مرة أخرى.');
      }
    } catch {
      setError('تعذر الاتصال بالخادم. حاول لاحقاً.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatedSection className="py-20 bg-gradient-to-bl from-indigo-50 via-white to-blue-50" id="register">
      <div className="max-w-3xl mx-auto px-6">
        <motion.div variants={fadeUp} transition={{ duration: 0.6 }} className="text-center mb-12">
          <span className="text-indigo-600 font-semibold text-sm">سجّل متجرك الآن</span>
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mt-3">
            طلب اشتراك جديد
          </h2>
          <p className="text-gray-500 mt-3 max-w-xl mx-auto">
            أرسل طلبك وسيتم مراجعته وتفعيل حسابك مع فترة تجريبية مجانية 14 يوماً
          </p>
        </motion.div>

        <motion.div variants={scaleIn} transition={{ duration: 0.5 }}>
          <AnimatePresence mode="wait">
            {success ? (
              <motion.div
                key="ok"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-green-50 border border-green-200 rounded-2xl p-12 text-center"
              >
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.2 }}>
                  <CheckCircle2 className="w-20 h-20 text-green-500 mx-auto mb-5" />
                </motion.div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">تم إرسال طلبك بنجاح!</h3>
                <p className="text-gray-500 text-lg mb-2">سيتم مراجعة طلبك خلال 24 ساعة كحد أقصى.</p>
                <p className="text-gray-400 text-sm">بعد الموافقة ستتلقى بيانات الدخول وفترة تجريبية مجانية 14 يوماً.</p>
                <div className="mt-8 flex gap-3 justify-center">
                  <button
                    onClick={() => { setSuccess(false); setStep(1); setForm({ storeName: '', businessType: 'تجزئة', ownerName: '', phone: '', email: '', address: '', city: '', vatNumber: '', planId: 2, adminUsername: '', adminPassword: '', adminFullName: '', notes: '' }); }}
                    className="px-6 py-2.5 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition"
                  >
                    إرسال طلب آخر
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.form
                key="form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onSubmit={handleSubmit}
                className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden"
              >
                {/* Progress */}
                <div className="flex bg-gray-50 border-b border-gray-100">
                  {[{ n: 1, t: 'بيانات المتجر' }, { n: 2, t: 'حساب المدير' }, { n: 3, t: 'الباقة والإرسال' }].map(s => (
                    <button
                      key={s.n}
                      type="button"
                      onClick={() => { if (s.n < step || (s.n === 2 && step1Valid) || (s.n === 3 && step1Valid && step2Valid)) setStep(s.n); }}
                      className={`flex-1 py-3.5 text-sm font-medium text-center transition-all border-b-2 ${
                        step === s.n ? 'border-indigo-600 text-indigo-600 bg-white' : step > s.n ? 'border-green-500 text-green-600 bg-green-50/30' : 'border-transparent text-gray-400'
                      }`}
                    >
                      <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs ml-2 ${
                        step > s.n ? 'bg-green-500 text-white' : step === s.n ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-500'
                      }`}>
                        {step > s.n ? <CheckCircle2 className="w-3.5 h-3.5" /> : s.n}
                      </span>
                      {s.t}
                    </button>
                  ))}
                </div>

                <div className="p-8 space-y-5">
                  <AnimatePresence mode="wait">
                    {step === 1 && (
                      <motion.div key="s1" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="space-y-5">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">اسم المتجر <span className="text-red-500">*</span></label>
                            <input type="text" value={form.storeName} onChange={e => set('storeName', e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none text-sm bg-white" placeholder="مثال: سوبرماركت النور" required />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">نوع النشاط</label>
                            <select value={form.businessType} onChange={e => set('businessType', e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 outline-none text-sm bg-white">
                              {BUSINESS_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">اسم المالك <span className="text-red-500">*</span></label>
                            <input type="text" value={form.ownerName} onChange={e => set('ownerName', e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none text-sm bg-white" placeholder="الاسم الكامل" required />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">الهاتف <span className="text-red-500">*</span></label>
                            <input type="tel" value={form.phone} onChange={e => set('phone', e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 outline-none text-sm bg-white" placeholder="05xxxxxxxx" required />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">البريد الإلكتروني</label>
                            <input type="email" value={form.email} onChange={e => set('email', e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 outline-none text-sm bg-white" placeholder="اختياري" />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">المدينة <span className="text-red-500">*</span></label>
                            <input type="text" value={form.city} onChange={e => set('city', e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 outline-none text-sm bg-white" placeholder="مثال: الرياض" required />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">الرقم الضريبي <span className="text-red-500">*</span></label>
                            <input type="text" value={form.vatNumber} onChange={e => set('vatNumber', e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 outline-none text-sm bg-white" placeholder="3XXXXXXXXXXXXXXX" required dir="ltr" />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">العنوان</label>
                            <input type="text" value={form.address} onChange={e => set('address', e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 outline-none text-sm bg-white" placeholder="اختياري" />
                          </div>
                        </div>
                        <button type="button" onClick={() => setStep(2)} disabled={!step1Valid} className="w-full py-3.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition disabled:opacity-40 flex items-center justify-center gap-2">
                          التالي <ChevronLeft className="w-4 h-4" />
                        </button>
                      </motion.div>
                    )}

                    {step === 2 && (
                      <motion.div key="s2" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="space-y-5">
                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
                          <strong>تنبيه:</strong> اختر اسم مستخدم وكلمة مرور قوية. ستستخدمها لتسجيل الدخول لمتجرك.
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1.5">الاسم الكامل للمدير <span className="text-red-500">*</span></label>
                          <input type="text" value={form.adminFullName} onChange={e => set('adminFullName', e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none text-sm bg-white" placeholder="مثال: أحمد محمد" required />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">اسم المستخدم <span className="text-red-500">*</span></label>
                            <input type="text" value={form.adminUsername} onChange={e => set('adminUsername', e.target.value.replace(/\s/g, ''))} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 outline-none text-sm bg-white" placeholder="3 أحرف على الأقل" required dir="ltr" minLength={3} />
                            {form.adminUsername && form.adminUsername.length < 3 && <p className="text-xs text-red-500 mt-1">يجب 3 أحرف على الأقل</p>}
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">كلمة المرور <span className="text-red-500">*</span></label>
                            <input type="password" value={form.adminPassword} onChange={e => set('adminPassword', e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 outline-none text-sm bg-white" placeholder="6 أحرف على الأقل" required dir="ltr" minLength={6} />
                            {form.adminPassword && form.adminPassword.length < 6 && <p className="text-xs text-red-500 mt-1">يجب 6 أحرف على الأقل</p>}
                            {form.adminPassword.length >= 6 && <p className="text-xs text-green-600 mt-1">كلمة المرور مقبولة</p>}
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1.5">ملاحظات إضافية</label>
                          <textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={2} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 outline-none text-sm bg-white resize-none" placeholder="أي متطلبات خاصة أو ملاحظات..." />
                        </div>
                        <div className="flex gap-3">
                          <button type="button" onClick={() => setStep(3)} disabled={!step2Valid} className="flex-1 py-3.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition disabled:opacity-40 flex items-center justify-center gap-2">
                            التالي <ChevronLeft className="w-4 h-4" />
                          </button>
                          <button type="button" onClick={() => setStep(1)} className="px-6 py-3.5 border border-gray-200 text-gray-600 font-medium rounded-xl hover:bg-gray-50 transition">
                            السابق
                          </button>
                        </div>
                      </motion.div>
                    )}

                    {step === 3 && (
                      <motion.div key="s3" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="space-y-5">
                        <label className="block text-sm font-medium text-gray-700 mb-3">اختر الباقة</label>
                        <div className="grid grid-cols-3 gap-3">
                          {PLAN_OPTIONS.map(plan => (
                            <button
                              key={plan.id}
                              type="button"
                              onClick={() => set('planId', plan.id)}
                              className={`p-4 rounded-xl border-2 text-center transition-all ${
                                form.planId === plan.id
                                  ? 'border-indigo-500 bg-indigo-50 ring-2 ring-indigo-500/20'
                                  : 'border-gray-200 hover:border-indigo-300'
                              }`}
                            >
                              {form.planId === plan.id && (
                                <div className="flex justify-center mb-1"><CheckCircle2 className="w-5 h-5 text-indigo-600" /></div>
                              )}
                              <p className="font-bold text-gray-900">{plan.name}</p>
                              <p className="text-xs text-indigo-600 mt-1">{plan.price}</p>
                            </button>
                          ))}
                        </div>

                        {/* Summary */}
                        <div className="bg-gray-50 rounded-xl p-5 space-y-2 text-sm">
                          <h4 className="font-bold text-gray-900 mb-3">ملخص الطلب</h4>
                          <div className="flex justify-between"><span className="text-gray-500">المتجر:</span><span className="font-medium text-gray-900">{form.storeName}</span></div>
                          <div className="flex justify-between"><span className="text-gray-500">المالك:</span><span className="font-medium text-gray-900">{form.ownerName}</span></div>
                          <div className="flex justify-between"><span className="text-gray-500">المدير:</span><span className="font-medium text-gray-900">{form.adminFullName}</span></div>
                          <div className="flex justify-between"><span className="text-gray-500">اسم المستخدم:</span><span className="font-medium text-gray-900" dir="ltr">{form.adminUsername}</span></div>
                          <div className="flex justify-between"><span className="text-gray-500">الباقة:</span><span className="font-medium text-gray-900">{PLAN_OPTIONS.find(p => p.id === form.planId)?.name}</span></div>
                          <hr className="border-gray-200" />
                          <div className="flex justify-between text-green-700 font-bold">
                            <span>الفترة التجريبية:</span>
                            <span>14 يوم مجاناً</span>
                          </div>
                        </div>

                        {error && (
                          <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700 flex items-center gap-2">
                            <X className="w-4 h-4 shrink-0" /> {error}
                          </div>
                        )}

                        <div className="flex gap-3">
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.97 }}
                            type="submit"
                            disabled={submitting}
                            className="flex-1 py-3.5 bg-gradient-to-l from-indigo-600 to-purple-600 text-white font-bold rounded-xl hover:from-indigo-700 hover:to-purple-700 transition disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg"
                          >
                            {submitting ? <><Loader2 className="w-5 h-5 animate-spin" /> جارٍ الإرسال...</> : <><Send className="w-5 h-5" /> إرسال طلب الاشتراك</>}
                          </motion.button>
                          <button type="button" onClick={() => setStep(2)} className="px-6 py-3.5 border border-gray-200 text-gray-600 font-medium rounded-xl hover:bg-gray-50 transition">
                            السابق
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.form>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </AnimatedSection>
  );
}

// ═══════════════════════════════════════════════════════════
// Privacy Policy Page
// ═══════════════════════════════════════════════════════════

function PrivacyPolicyPage({ onBack }: { onBack: () => void }) {
  useEffect(() => { window.scrollTo(0, 0); }, []);

  const sections = [
    {
      title: 'مقدمة',
      content: `نحن في MS Cashier نلتزم بحماية خصوصية مستخدمينا وعملائنا. توضح سياسة الخصوصية هذه كيفية جمع واستخدام وحماية المعلومات الشخصية التي تقدمها عند استخدام منصتنا لنقاط البيع. باستخدامك للمنصة، فإنك توافق على الممارسات الموضحة في هذه السياسة.`,
    },
    {
      title: 'المعلومات التي نجمعها',
      items: [
        'بيانات التسجيل: اسم المتجر، اسم المالك، رقم الهاتف، البريد الإلكتروني، المدينة، العنوان.',
        'البيانات الضريبية: الرقم الضريبي (VAT Number) المطلوب للتوافق مع هيئة الزكاة والضريبة والجمارك (ZATCA).',
        'بيانات الحساب: اسم المستخدم وكلمة المرور المشفرة.',
        'بيانات المعاملات: الفواتير، المبيعات، المشتريات، حركات المخزون، والمعاملات المالية.',
        'بيانات الموظفين: أسماء الموظفين، أرقام الهوية، بيانات الحضور والرواتب.',
        'بيانات العملاء والموردين: الأسماء، أرقام الهواتف، العناوين، الأرصدة.',
        'بيانات الاستخدام: سجلات الدخول، عناوين IP، نوع المتصفح، أنماط الاستخدام.',
      ],
    },
    {
      title: 'كيف نستخدم معلوماتك',
      items: [
        'تقديم خدمات نقطة البيع وإدارة المخزون والحسابات.',
        'إصدار الفواتير الإلكترونية المتوافقة مع متطلبات ZATCA.',
        'إدارة حسابك والاشتراك والفوترة.',
        'تحسين أداء المنصة وتطوير ميزات جديدة.',
        'التواصل معك بخصوص حسابك أو تحديثات الخدمة.',
        'الامتثال للمتطلبات القانونية والتنظيمية في المملكة العربية السعودية.',
        'منع الاحتيال وضمان أمان المنصة.',
      ],
    },
    {
      title: 'فصل البيانات وأمان المستأجرين',
      content: `نطبق نموذج تعدد المستأجرين (Multi-Tenant) مع فصل تام للبيانات بين المتاجر. لا يمكن لأي متجر الاطلاع على بيانات متجر آخر. يتم تطبيق فلاتر أمان على مستوى قاعدة البيانات لضمان عزل البيانات بشكل كامل. جميع عمليات الحفظ تخضع للتحقق من هوية المستأجر لمنع أي تسريب عبر الحسابات.`,
    },
    {
      title: 'تشفير البيانات وحمايتها',
      items: [
        'تشفير كلمات المرور باستخدام خوارزمية BCrypt.',
        'استخدام رموز JWT مشفرة للمصادقة.',
        'تشفير الاتصالات عبر بروتوكول HTTPS/TLS.',
        'نسخ احتياطي دوري لقواعد البيانات.',
        'مراقبة أمنية مستمرة وسجلات تدقيق لكل العمليات.',
      ],
    },
    {
      title: 'مشاركة البيانات مع أطراف ثالثة',
      content: `لا نبيع أو نؤجر أو نشارك بياناتك الشخصية مع أطراف ثالثة لأغراض تسويقية. قد نشارك البيانات في الحالات التالية فقط:`,
      items: [
        'الامتثال لمتطلبات هيئة الزكاة والضريبة والجمارك (ZATCA) فيما يتعلق بالفوترة الإلكترونية.',
        'الاستجابة لأوامر قضائية أو طلبات حكومية رسمية.',
        'حماية حقوقنا القانونية أو سلامة المستخدمين.',
        'مقدمو خدمات فنية موثوقون (استضافة، حوسبة سحابية) ملزمون باتفاقيات سرية.',
      ],
    },
    {
      title: 'الاحتفاظ بالبيانات',
      content: `نحتفظ ببياناتك طوال فترة اشتراكك النشط. بعد إلغاء الاشتراك، نحتفظ بالبيانات لمدة 90 يوماً لتمكينك من استعادة حسابك. بعد ذلك، يتم حذف البيانات نهائياً. البيانات المالية والضريبية يتم الاحتفاظ بها وفقاً للمتطلبات القانونية في المملكة العربية السعودية (7 سنوات كحد أدنى).`,
    },
    {
      title: 'حقوقك',
      items: [
        'الوصول إلى بياناتك الشخصية وطلب نسخة منها.',
        'تصحيح البيانات غير الدقيقة.',
        'حذف حسابك وبياناتك (مع مراعاة المتطلبات القانونية).',
        'الاعتراض على معالجة بياناتك.',
        'نقل بياناتك إلى مزود خدمة آخر (تصدير البيانات).',
      ],
    },
    {
      title: 'ملفات تعريف الارتباط (Cookies)',
      content: `نستخدم ملفات تعريف الارتباط وتقنيات التخزين المحلي لتحسين تجربتك، وتذكر تفضيلاتك، والحفاظ على جلسة تسجيل الدخول. يمكنك تعطيل ملفات تعريف الارتباط من إعدادات المتصفح، لكن ذلك قد يؤثر على بعض وظائف المنصة.`,
    },
    {
      title: 'التعديلات على السياسة',
      content: `نحتفظ بالحق في تحديث هذه السياسة في أي وقت. سنبلغك بأي تغييرات جوهرية عبر البريد الإلكتروني أو إشعار داخل المنصة قبل 30 يوماً من تاريخ السريان. استمرارك في استخدام المنصة بعد التحديث يعني موافقتك على السياسة المحدثة.`,
    },
    {
      title: 'التواصل',
      content: `لأي استفسار بخصوص سياسة الخصوصية، تواصل معنا عبر:\n• البريد الإلكتروني: privacy@mscashier.sa\n• الهاتف: 0500 000 000\n• العنوان: الرياض، المملكة العربية السعودية`,
    },
  ];

  return (
    <div dir="rtl" className="min-h-screen bg-gray-50 scroll-smooth" style={{ fontFamily: "'IBM Plex Sans Arabic', 'Noto Sans Arabic', sans-serif" }}>
      {/* Top bar */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <button onClick={onBack} className="flex items-center gap-2 text-indigo-600 font-medium text-sm hover:text-indigo-700 transition">
            <ArrowRight className="w-4 h-4" /> العودة للرئيسية
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xs">M</div>
            <span className="font-bold text-gray-900">MS Cashier</span>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <div className="mb-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center">
                <Shield className="w-6 h-6 text-indigo-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">سياسة الخصوصية</h1>
                <p className="text-sm text-gray-400 mt-1">آخر تحديث: {new Date().toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
              </div>
            </div>
          </div>

          <div className="space-y-8">
            {sections.map((section, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05, duration: 0.4 }}
                className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
              >
                <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <span className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center text-xs font-bold">{idx + 1}</span>
                  {section.title}
                </h2>
                {section.content && (
                  <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-line">{section.content}</p>
                )}
                {section.items && (
                  <ul className="mt-3 space-y-2">
                    {section.items.map((item, i) => (
                      <li key={i} className="flex gap-2 text-sm text-gray-600">
                        <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </motion.div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <button onClick={onBack} className="px-8 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition">
              العودة للرئيسية
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// Terms & Conditions Page
// ═══════════════════════════════════════════════════════════

function TermsPage({ onBack }: { onBack: () => void }) {
  useEffect(() => { window.scrollTo(0, 0); }, []);

  const sections = [
    {
      title: 'مقدمة وتعريفات',
      content: `مرحباً بك في منصة MS Cashier لنقاط البيع. تحكم هذه الشروط والأحكام ("الاتفاقية") استخدامك للمنصة والخدمات المقدمة من خلالها. يرجى قراءتها بعناية قبل استخدام الخدمة.`,
      items: [
        '"المنصة": نظام MS Cashier لنقاط البيع وجميع خدماته.',
        '"المزود": شركة MS Cashier المالكة والمشغلة للمنصة.',
        '"المستخدم" أو "المشترك": أي شخص أو كيان يسجل في المنصة ويستخدم خدماتها.',
        '"المتجر": الحساب التجاري المنشأ على المنصة لإدارة نقطة البيع.',
        '"الفترة التجريبية": المدة المجانية المقدمة للمشترك الجديد (14 يوماً).',
        '"الاشتراك": الرسوم الدورية المطلوبة لاستمرار استخدام المنصة بعد الفترة التجريبية.',
      ],
    },
    {
      title: 'القبول والأهلية',
      items: [
        'باستخدامك للمنصة فإنك تقر بأنك قرأت وفهمت ووافقت على هذه الشروط.',
        'يجب أن يكون عمرك 18 سنة أو أكثر لاستخدام المنصة.',
        'يجب أن تكون مفوضاً قانونياً عن المنشأة التجارية التي تسجلها.',
        'تتحمل مسؤولية صحة جميع البيانات المقدمة عند التسجيل.',
      ],
    },
    {
      title: 'الاشتراك والفوترة',
      items: [
        'يحصل كل متجر جديد على فترة تجريبية مجانية مدتها 14 يوماً.',
        'بعد انتهاء الفترة التجريبية، يتوقف الوصول لجميع أدوات المنصة حتى إتمام الدفع.',
        'يتم إصدار الفواتير بشكل شهري أو سنوي حسب الباقة المختارة.',
        'الأسعار قابلة للتعديل مع إشعار مسبق لا يقل عن 30 يوماً.',
        'عند عدم الدفع خلال 15 يوماً من تاريخ الاستحقاق، يتم تعليق الحساب تلقائياً.',
        'البيانات تبقى محفوظة لمدة 90 يوماً بعد تعليق الحساب.',
        'يمكن ترقية أو تخفيض الباقة في أي وقت مع تسوية الفرق.',
      ],
    },
    {
      title: 'استخدام المنصة',
      content: 'يلتزم المستخدم بالآتي:',
      items: [
        'استخدام المنصة للأغراض التجارية المشروعة فقط.',
        'عدم محاولة الوصول إلى بيانات متاجر أخرى أو حسابات غير مصرح بها.',
        'الحفاظ على سرية بيانات تسجيل الدخول وعدم مشاركتها مع أطراف غير مصرح لها.',
        'الإبلاغ الفوري عن أي اختراق أمني أو استخدام غير مصرح به.',
        'عدم استخدام المنصة لأنشطة غير قانونية أو مخالفة للأنظمة السعودية.',
        'عدم محاولة التلاعب بالنظام أو استغلال الثغرات التقنية.',
        'الالتزام بمتطلبات الفوترة الإلكترونية الصادرة من هيئة ZATCA.',
      ],
    },
    {
      title: 'الفوترة الإلكترونية وزاتكا',
      items: [
        'توفر المنصة أدوات إصدار الفواتير الإلكترونية المتوافقة مع متطلبات ZATCA.',
        'يتحمل المشترك مسؤولية إدخال بيانات التفعيل الصحيحة (شهادات ZATCA، مفاتيح API).',
        'المنصة تسهل عملية الربط ولكنها لا تضمن قبول ZATCA للفواتير في حال وجود بيانات خاطئة.',
        'يجب على المشترك الاحتفاظ بنسخ من الفواتير الإلكترونية وفقاً للمتطلبات القانونية.',
        'المنصة غير مسؤولة عن أي غرامات ناتجة عن عدم التزام المشترك بمتطلبات ZATCA.',
      ],
    },
    {
      title: 'البيانات والملكية الفكرية',
      items: [
        'تظل بيانات المشترك التجارية (فواتير، منتجات، عملاء) ملكاً له.',
        'يمنح المشترك المنصة ترخيصاً محدوداً لمعالجة وتخزين البيانات لتقديم الخدمة.',
        'جميع حقوق الملكية الفكرية للمنصة (الكود، التصميم، العلامة التجارية) محفوظة للمزود.',
        'يحق للمشترك تصدير بياناته في أي وقت خلال فترة الاشتراك النشط.',
        'لا يجوز نسخ أو توزيع أو إعادة بيع أي جزء من المنصة.',
      ],
    },
    {
      title: 'التوقف والصيانة',
      items: [
        'قد يتم إجراء صيانة دورية مع إشعار مسبق لا يقل عن 24 ساعة.',
        'نسعى لتوفير وقت تشغيل 99.9%، لكن لا نضمن عدم حدوث انقطاعات.',
        'لا نتحمل مسؤولية الأضرار الناتجة عن انقطاع الخدمة لأسباب خارجة عن سيطرتنا.',
        'في حالة القوة القاهرة، يتم تمديد فترة الاشتراك بمقدار مدة الانقطاع.',
      ],
    },
    {
      title: 'تحديد المسؤولية',
      items: [
        'المنصة مقدمة "كما هي" دون ضمانات صريحة أو ضمنية.',
        'لا نتحمل مسؤولية الأضرار المباشرة أو غير المباشرة الناتجة عن استخدام المنصة.',
        'مسؤوليتنا الإجمالية لا تتجاوز قيمة الاشتراك المدفوع للأشهر الثلاثة الأخيرة.',
        'يتحمل المشترك مسؤولية النسخ الاحتياطي لبياناته.',
      ],
    },
    {
      title: 'إنهاء الاشتراك',
      items: [
        'يمكن للمشترك إلغاء اشتراكه في أي وقت مع سريان الإلغاء نهاية فترة الفوترة الحالية.',
        'لا يتم استرداد المبالغ المدفوعة عن الفترة الحالية.',
        'يحق للمزود إنهاء الحساب فوراً في حالة مخالفة الشروط.',
        'عند الإنهاء، يتم الاحتفاظ بالبيانات لمدة 90 يوماً ثم حذفها نهائياً.',
        'يمكن طلب تصدير البيانات خلال فترة الـ 90 يوماً.',
      ],
    },
    {
      title: 'القانون الحاكم وحل النزاعات',
      items: [
        'تخضع هذه الاتفاقية لأنظمة المملكة العربية السعودية.',
        'في حالة وجود نزاع، يتم حله ودياً أولاً.',
        'إذا تعذر الحل الودي، يحال النزاع للجهات القضائية المختصة في مدينة الرياض.',
        'تكون النسخة العربية من هذه الاتفاقية هي المرجع في حالة وجود تعارض مع أي ترجمة.',
      ],
    },
    {
      title: 'التعديلات',
      content: `نحتفظ بالحق في تعديل هذه الشروط في أي وقت. سيتم إخطارك بالتعديلات الجوهرية قبل 30 يوماً من سريانها عبر البريد الإلكتروني أو إشعار داخل المنصة. استمرارك في استخدام المنصة بعد تاريخ السريان يعني قبولك للشروط المعدلة.`,
    },
    {
      title: 'التواصل',
      content: `لأي استفسار بخصوص الشروط والأحكام:\n• البريد الإلكتروني: legal@mscashier.sa\n• الهاتف: 0500 000 000\n• العنوان: الرياض، المملكة العربية السعودية`,
    },
  ];

  return (
    <div dir="rtl" className="min-h-screen bg-gray-50 scroll-smooth" style={{ fontFamily: "'IBM Plex Sans Arabic', 'Noto Sans Arabic', sans-serif" }}>
      {/* Top bar */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <button onClick={onBack} className="flex items-center gap-2 text-indigo-600 font-medium text-sm hover:text-indigo-700 transition">
            <ArrowRight className="w-4 h-4" /> العودة للرئيسية
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xs">M</div>
            <span className="font-bold text-gray-900">MS Cashier</span>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <div className="mb-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center">
                <FileCheck className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">الشروط والأحكام</h1>
                <p className="text-sm text-gray-400 mt-1">آخر تحديث: {new Date().toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
              </div>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
              <strong>مهم:</strong> باستخدامك لمنصة MS Cashier فإنك توافق على جميع الشروط والأحكام المذكورة أدناه. يرجى قراءتها بعناية.
            </div>
          </div>

          <div className="space-y-8">
            {sections.map((section, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05, duration: 0.4 }}
                className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
              >
                <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <span className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center text-xs font-bold">{idx + 1}</span>
                  {section.title}
                </h2>
                {section.content && (
                  <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-line">{section.content}</p>
                )}
                {section.items && (
                  <ul className="mt-3 space-y-2">
                    {section.items.map((item, i) => (
                      <li key={i} className="flex gap-2 text-sm text-gray-600">
                        <CheckCircle2 className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </motion.div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <button onClick={onBack} className="px-8 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition">
              العودة للرئيسية
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// Main Landing Page
// ═══════════════════════════════════════════════════════════

export function LandingPage({ onLogin }: { onLogin: () => void }) {
  const [activePage, setActivePage] = useState<'home' | 'privacy' | 'terms'>('home');

  const handleGetStarted = () => {
    scrollTo('register');
  };

  if (activePage === 'privacy') {
    return <PrivacyPolicyPage onBack={() => setActivePage('home')} />;
  }

  if (activePage === 'terms') {
    return <TermsPage onBack={() => setActivePage('home')} />;
  }

  return (
    <div dir="rtl" className="min-h-screen scroll-smooth" style={{ fontFamily: "'IBM Plex Sans Arabic', 'Noto Sans Arabic', sans-serif" }}>
      <Navbar onLogin={onLogin} onGetStarted={handleGetStarted} />
      <HeroSection onGetStarted={handleGetStarted} />
      <StatsBar />
      <FeaturesSection />
      <InteractiveDemoSection onGetStarted={handleGetStarted} />
      <ZatcaSection />
      <MultiTenantSection />
      <PricingSection onGetStarted={handleGetStarted} />
      <SubscriptionFormSection />
      <FAQSection />
      <ContactSection />
      <CTASection onGetStarted={handleGetStarted} />
      <FooterWithLinks onPrivacy={() => setActivePage('privacy')} onTerms={() => setActivePage('terms')} />
    </div>
  );
}
