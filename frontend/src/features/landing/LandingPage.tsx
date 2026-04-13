import { useState, useEffect, useRef } from 'react';
import { motion, useInView, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import {
  ShoppingBag, Barcode, Scale, Printer, CreditCard,
  Shield, Building2, Users, BarChart3, Globe, Smartphone,
  CheckCircle2, ArrowLeft, Star, Zap, Cloud, Lock,
  Receipt, Package, DollarSign, UserCheck, FileCheck,
  ChevronDown, Phone, Mail, MapPin, Play,
  Layers, Database, Wifi, Clock, TrendingUp, HeadphonesIcon,
  Menu, X, Loader2, ArrowRight, Send,
  Monitor, Sparkles, ChevronLeft,
  UtensilsCrossed, ChefHat, QrCode, Fingerprint,
  ConciergeBell, Store,
  ShoppingCart, Palette, Truck, Heart, Share2, Bell,
  Code2, Webhook, Plug, Moon, Coffee, Scissors, Wine,
  ScanLine, Tag, Boxes, ClipboardList, Award,
  CookingPot, LayoutGrid, Megaphone, Gift,
} from 'lucide-react';
import { useLocale, useLocaleStore } from '@/lib/i18n';

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
  const { locale, setLocale } = useLocaleStore();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const navLinks = [
    { label: locale === 'ar' ? 'المميزات' : 'Features', id: 'features' },
    { label: locale === 'ar' ? 'المتجر الإلكتروني' : 'E-Store', id: 'estore' },
    { label: locale === 'ar' ? 'أنواع الأعمال' : 'Business Types', id: 'business-types' },
    { label: locale === 'ar' ? 'الأسعار' : 'Pricing', id: 'pricing' },
    { label: locale === 'ar' ? 'تسجيل' : 'Register', id: 'register' },
    { label: locale === 'ar' ? 'تواصل معنا' : 'Contact', id: 'contact' },
  ];

  return (
    <>
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ type: 'spring', stiffness: 120, damping: 20 }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled ? 'bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl shadow-lg shadow-brand-500/5' : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 py-3.5 flex items-center justify-between">
          <motion.div className="flex items-center gap-3 cursor-pointer" onClick={() => scrollTo('hero')} whileHover={{ scale: 1.03 }}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white font-bold text-lg shadow-lg">
              M
            </div>
            <span className={`font-bold text-lg transition-colors duration-300 ${scrolled ? 'text-gray-900 dark:text-white' : 'text-white'}`}>
              MPOS
            </span>
          </motion.div>

          <div className={`hidden lg:flex items-center gap-7 text-sm font-medium ${scrolled ? 'text-gray-600 dark:text-gray-300' : 'text-white/80'}`}>
            {navLinks.map((link) => (
              <button
                key={link.id}
                onClick={() => scrollTo(link.id)}
                className="hover:text-brand-500 transition-colors relative group"
              >
                {link.label}
                <span className="absolute -bottom-1 right-0 w-0 h-0.5 bg-brand-500 rounded-full group-hover:w-full transition-all duration-300" />
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setLocale(locale === 'ar' ? 'en' : 'ar')}
              className={`px-3 py-2 rounded-xl font-medium text-xs transition-all ${
                scrolled ? 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800' : 'text-white/80 hover:bg-white/10'
              }`}
            >
              {locale === 'ar' ? 'EN' : 'عربي'}
            </button>
            <button
              onClick={onLogin}
              className={`hidden sm:block px-5 py-2.5 rounded-xl font-medium text-sm transition-all ${
                scrolled ? 'text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800' : 'text-white hover:bg-white/10'
              }`}
            >
              {locale === 'ar' ? 'تسجيل الدخول' : 'Sign In'}
            </button>
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              onClick={onGetStarted}
              className="px-5 py-2.5 bg-brand-600 text-white rounded-xl font-medium text-sm hover:bg-brand-700 transition-colors shadow-lg shadow-brand-500/25"
            >
              {locale === 'ar' ? 'ابدأ مجاناً' : 'Start Free'}
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

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-x-0 top-16 z-40 bg-white dark:bg-gray-900 rounded-b-2xl shadow-2xl border-t border-gray-100 dark:border-gray-800 p-6 mx-4"
          >
            <div className="flex flex-col gap-1">
              {navLinks.map((link) => (
                <button
                  key={link.id}
                  onClick={() => { scrollTo(link.id); setMobileOpen(false); }}
                  className={`py-3 px-4 ${locale === 'ar' ? 'text-right' : 'text-left'} text-gray-700 dark:text-gray-200 font-medium hover:bg-brand-50 dark:hover:bg-brand-950 hover:text-brand-600 rounded-xl transition`}
                >
                  {link.label}
                </button>
              ))}
              <hr className="my-2 border-gray-100 dark:border-gray-800" />
              <button
                onClick={() => { onLogin(); setMobileOpen(false); }}
                className={`py-3 px-4 ${locale === 'ar' ? 'text-right' : 'text-left'} text-gray-700 dark:text-gray-200 font-medium hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl transition`}
              >
                {locale === 'ar' ? 'تسجيل الدخول' : 'Sign In'}
              </button>
              <button
                onClick={() => { onGetStarted(); setMobileOpen(false); }}
                className="py-3 px-4 text-center text-white font-bold bg-brand-600 hover:bg-brand-700 rounded-xl transition mt-1"
              >
                {locale === 'ar' ? 'ابدأ مجاناً' : 'Start Free'}
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

function HeroSection({ onGetStarted, onLogin }: { onGetStarted: () => void; onLogin: () => void }) {
  const { scrollY } = useScroll();
  const bgY = useTransform(scrollY, [0, 500], [0, 150]);
  const opacity = useTransform(scrollY, [0, 400], [1, 0.3]);
  const locale = useLocale();

  return (
    <section id="hero" className="relative overflow-hidden bg-gradient-to-bl from-brand-600 via-brand-700 to-purple-800 text-white min-h-[100vh] flex items-center">
      <motion.div className="absolute inset-0 opacity-10" style={{ y: bgY }}>
        <div className="absolute top-20 right-20 w-72 h-72 bg-white rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 left-20 w-96 h-96 bg-blue-300 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-brand-400 rounded-full blur-3xl" />
      </motion.div>

      <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.3) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

      <motion.div className="relative max-w-7xl mx-auto px-6 py-24 lg:py-0 w-full" style={{ opacity }}>
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <motion.div
            className={`text-center ${locale === 'ar' ? 'lg:text-right' : 'lg:text-left'}`}
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
              <span>{locale === 'ar' ? 'نظام نقاط بيع متكامل + متجر إلكتروني' : 'Complete POS + E-commerce Platform'}</span>
            </motion.div>

            <motion.h1
              variants={fadeUp}
              transition={{ duration: 0.7 }}
              className="text-4xl lg:text-6xl font-bold leading-tight mb-6"
            >
              {locale === 'ar' ? 'أدِر مبيعاتك' : 'Manage Your Sales'}
              <br />
              <span className={`bg-clip-text text-transparent ${locale === 'ar' ? 'bg-gradient-to-l' : 'bg-gradient-to-r'} from-yellow-300 to-orange-300`}>
                {locale === 'ar' ? 'بذكاء وسرعة' : 'Smart & Fast'}
              </span>
              <br />
              {locale === 'ar' ? 'من أي مكان' : 'From Anywhere'}
            </motion.h1>

            <motion.p
              variants={fadeUp}
              transition={{ duration: 0.7 }}
              className={`text-lg lg:text-xl text-blue-100 mb-10 max-w-lg mx-auto ${locale === 'ar' ? 'lg:mx-0 lg:mr-0' : 'lg:mx-0 lg:ml-0'} leading-relaxed`}
            >
              {locale === 'ar'
                ? 'نقطة بيع + متجر إلكتروني + إدارة مخزون + مطعم + رواتب + فوترة إلكترونية + تسويق — كل ما تحتاجه في منصة واحدة.'
                : 'POS + E-commerce + Inventory + Restaurant + Payroll + E-invoicing + Marketing — everything you need in one platform.'}
            </motion.p>

            <motion.div variants={fadeUp} transition={{ duration: 0.7 }} className="flex flex-wrap gap-4 justify-center lg:justify-start">
              <motion.button
                whileHover={{ scale: 1.05, boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}
                whileTap={{ scale: 0.97 }}
                onClick={onGetStarted}
                className="group px-8 py-4 bg-white text-brand-700 font-bold rounded-2xl shadow-xl flex items-center gap-2"
              >
                {locale === 'ar' ? 'ابدأ مجاناً — 14 يوم' : 'Start Free — 14 Days'}
                <ArrowLeft className={`w-5 h-5 transition-transform ${locale === 'ar' ? 'group-hover:-translate-x-1' : 'group-hover:translate-x-1 rotate-180'}`} />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05, backgroundColor: 'rgba(255,255,255,0.1)' }}
                whileTap={{ scale: 0.97 }}
                onClick={onLogin}
                className="px-8 py-4 border-2 border-white/30 text-white font-medium rounded-2xl flex items-center gap-2 backdrop-blur-sm"
              >
                <Play className="w-5 h-5" />
                {locale === 'ar' ? 'تسجيل الدخول' : 'Sign In'}
              </motion.button>
            </motion.div>

            <motion.div variants={fadeUp} transition={{ duration: 0.7 }} className="flex flex-wrap gap-6 mt-12 justify-center lg:justify-start text-sm text-blue-200">
              {[
                { icon: Shield, text: locale === 'ar' ? 'متوافق ZATCA' : 'ZATCA Compliant' },
                { icon: Lock, text: locale === 'ar' ? 'بياناتك مشفرة' : 'Encrypted Data' },
                { icon: Cloud, text: locale === 'ar' ? 'سحابي + أوفلاين' : 'Cloud + Offline' },
                { icon: Smartphone, text: 'PWA' },
              ].map((badge, i) => (
                <div key={i} className="flex items-center gap-2">
                  <badge.icon className="w-4 h-4" />
                  <span>{badge.text}</span>
                </div>
              ))}
            </motion.div>
          </motion.div>

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
                  <span className="text-gray-400 text-xs mr-2">MPOS</span>
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
                      <div className="w-8 h-8 bg-brand-500/20 rounded-lg mx-auto mb-1 flex items-center justify-center">
                        <Package className="w-4 h-4 text-brand-400" />
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

            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
              className="absolute -top-4 -left-4 bg-green-500 text-white px-4 py-2 rounded-xl shadow-lg text-sm font-bold"
            >
              <FileCheck className="w-4 h-4 inline ml-1" />
              ZATCA
            </motion.div>
            <motion.div
              animate={{ y: [0, 6, 0] }}
              transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut', delay: 0.5 }}
              className="absolute -bottom-4 -right-4 bg-orange-500 text-white px-4 py-2 rounded-xl shadow-lg text-sm font-bold"
            >
              <ShoppingCart className="w-4 h-4 inline ml-1" />
              متجر إلكتروني
            </motion.div>
            <motion.div
              animate={{ y: [0, -6, 0] }}
              transition={{ repeat: Infinity, duration: 2.8, ease: 'easeInOut', delay: 1 }}
              className="absolute top-1/2 -left-8 bg-purple-500 text-white px-4 py-2 rounded-xl shadow-lg text-sm font-bold"
            >
              <Heart className="w-4 h-4 inline ml-1" />
              ولاء
            </motion.div>
          </motion.div>
        </div>
      </motion.div>

      <div className="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1440 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M0 50L60 45C120 40 240 30 360 35C480 40 600 60 720 65C840 70 960 60 1080 50C1200 40 1320 30 1380 25L1440 20V100H1380C1320 100 1200 100 1080 100C960 100 840 100 720 100C600 100 480 100 360 100C240 100 120 100 60 100H0V50Z" className="fill-white dark:fill-gray-950" />
        </svg>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════
// Stats Bar
// ═══════════════════════════════════════════════════════════

function StatsBar() {
  const locale = useLocale();
  const stats = [
    { value: 2500, suffix: '+', label: locale === 'ar' ? 'متجر نشط' : 'Active Stores' },
    { value: 1, suffix: 'M+', label: locale === 'ar' ? 'فاتورة صادرة' : 'Invoices Issued' },
    { value: 99, suffix: '.9%', label: locale === 'ar' ? 'وقت التشغيل' : 'Uptime' },
    { value: 24, suffix: '/7', label: locale === 'ar' ? 'دعم فني' : 'Support' },
  ];

  return (
    <AnimatedSection className="bg-white dark:bg-gray-950 py-14 -mt-1">
      <div className="max-w-5xl mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, i) => (
            <motion.div key={i} variants={fadeUp} transition={{ duration: 0.5 }} className="text-center">
              <div className="text-3xl lg:text-4xl font-bold bg-gradient-to-l from-brand-600 to-brand-500 bg-clip-text text-transparent">
                <Counter target={stat.value} suffix={stat.suffix} />
              </div>
              <div className="text-gray-500 dark:text-gray-400 text-sm mt-1">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </AnimatedSection>
  );
}

// ═══════════════════════════════════════════════════════════
// Core Features Grid (Grouped by Category)
// ═══════════════════════════════════════════════════════════

function FeaturesSection() {
  const locale = useLocale();
  const [activeCategory, setActiveCategory] = useState(0);

  const categories = [
    {
      id: 'pos',
      label: locale === 'ar' ? 'نقطة البيع' : 'POS',
      icon: ShoppingBag,
      color: 'brand',
      features: [
        { icon: Monitor, title: locale === 'ar' ? 'متعدد الأجهزة' : 'Multi-Device', desc: locale === 'ar' ? 'يعمل على تاتش سكرين، تابلت، كمبيوتر، وموبايل' : 'Works on touchscreen, tablet, PC, and mobile' },
        { icon: Tag, title: locale === 'ar' ? '4 مستويات تسعير' : '4 Pricing Tiers', desc: locale === 'ar' ? 'تجزئة، نصف جملة، جملة، مخصص — لكل عميل سعره' : 'Retail, semi-wholesale, wholesale, custom' },
        { icon: Barcode, title: locale === 'ar' ? 'مسح الباركود + ميزان' : 'Barcode + Scale', desc: locale === 'ar' ? 'ماسح باركود وربط مع الميزان الإلكتروني' : 'Barcode scanner and electronic scale integration' },
        { icon: CreditCard, title: locale === 'ar' ? 'طرق دفع متعددة' : 'Multiple Payments', desc: locale === 'ar' ? 'نقد، بطاقة، تحويل، آجل، أقساط — ودفع مُقسّم' : 'Cash, card, transfer, credit, installments, split' },
        { icon: Wifi, title: locale === 'ar' ? 'وضع أوفلاين' : 'Offline Mode', desc: locale === 'ar' ? 'استمر بالبيع بدون إنترنت — مزامنة تلقائية لاحقاً' : 'Keep selling without internet — auto-sync later' },
        { icon: Layers, title: locale === 'ar' ? 'متغيرات العناصر' : 'Item Variants', desc: locale === 'ar' ? 'أحجام، ألوان، ونكهات — لكل صنف متغيرات متعددة' : 'Sizes, colors, flavors — multiple variants per item', isNew: true },
        { icon: Monitor, title: locale === 'ar' ? 'شاشة عرض العميل' : 'Customer Display', desc: locale === 'ar' ? 'شاشة ثانية تعرض للعميل المنتجات والإجمالي' : 'Second screen showing items and total to customer', isNew: true },
        { icon: Receipt, title: locale === 'ar' ? 'فاتورة إلكترونية' : 'E-Invoice', desc: locale === 'ar' ? 'فواتير ZATCA متوافقة تلقائياً مع QR Code' : 'ZATCA-compliant invoices with automatic QR Code' },
      ],
    },
    {
      id: 'estore',
      label: locale === 'ar' ? 'المتجر الإلكتروني' : 'E-Store',
      icon: ShoppingCart,
      color: 'emerald',
      features: [
        { icon: Store, title: locale === 'ar' ? 'متجر لكل مستأجر' : 'Store per Tenant', desc: locale === 'ar' ? 'كل عميل يحصل على متجر إلكتروني مستقل تماماً' : 'Each tenant gets a fully independent online store', isNew: true },
        { icon: Palette, title: locale === 'ar' ? 'قوالب متعددة' : 'Multiple Templates', desc: locale === 'ar' ? 'اختر من قوالب تصميم احترافية وخصصها لعلامتك' : 'Choose from professional templates and customize', isNew: true },
        { icon: Database, title: locale === 'ar' ? 'ربط مع المخزون' : 'Inventory Sync', desc: locale === 'ar' ? 'مزامنة تلقائية بين المتجر ونقطة البيع والمخزون' : 'Auto-sync between store, POS, and inventory', isNew: true },
        { icon: Printer, title: locale === 'ar' ? 'طباعة تلقائية' : 'Auto Print', desc: locale === 'ar' ? 'الطلبات الإلكترونية تطبع مباشرة في المتجر للتجهيز' : 'Online orders auto-print in store for preparation', isNew: true },
        { icon: CreditCard, title: locale === 'ar' ? '5 بوابات دفع' : '5 Payment Gateways', desc: locale === 'ar' ? 'Stripe, PayTabs, Tap, Moyasar, Fawry' : 'Stripe, PayTabs, Tap, Moyasar, Fawry', isNew: true },
        { icon: Truck, title: locale === 'ar' ? 'إعدادات شحن مرنة' : 'Flexible Shipping', desc: locale === 'ar' ? 'مناطق شحن، أسعار متعددة، توصيل محلي' : 'Shipping zones, multiple rates, local delivery', isNew: true },
      ],
    },
    {
      id: 'inventory',
      label: locale === 'ar' ? 'المخزون' : 'Inventory',
      icon: Package,
      color: 'orange',
      features: [
        { icon: BarChart3, title: locale === 'ar' ? 'تتبع آني' : 'Real-time Tracking', desc: locale === 'ar' ? 'رصد المخزون لحظياً مع تنبيهات انخفاض المخزون' : 'Live stock monitoring with low-stock alerts' },
        { icon: Building2, title: locale === 'ar' ? 'مستودعات متعددة' : 'Multi-Warehouse', desc: locale === 'ar' ? 'إدارة مستودعات متعددة مع تحويلات بينها' : 'Manage multiple warehouses with inter-transfers' },
        { icon: Scale, title: locale === 'ar' ? 'وحدات قياس' : 'Units of Measure', desc: locale === 'ar' ? 'وحدات قياس مع تحويلات تلقائية (كرتون ← قطعة)' : 'Units with auto-conversions (carton to piece)' },
        { icon: CookingPot, title: locale === 'ar' ? 'وصفات وإنتاج' : 'Recipes & Production', desc: locale === 'ar' ? 'وصفات تصنيع + حساب تكلفة الغذاء تلقائياً' : 'Manufacturing recipes + auto food cost calculation' },
        { icon: ClipboardList, title: locale === 'ar' ? 'استيراد/تصدير CSV' : 'CSV Import/Export', desc: locale === 'ar' ? 'استيراد المنتجات من ملفات CSV وتصدير التقارير' : 'Import products from CSV and export reports', isNew: true },
        { icon: ScanLine, title: locale === 'ar' ? 'جرد RFID + QR' : 'RFID + QR Stocktake', desc: locale === 'ar' ? 'جرد ذكي بتقنية RFID أو مسح QR Code' : 'Smart stocktake with RFID or QR Code scanning', isNew: true },
      ],
    },
    {
      id: 'restaurant',
      label: locale === 'ar' ? 'المطعم' : 'Restaurant',
      icon: UtensilsCrossed,
      color: 'red',
      features: [
        { icon: LayoutGrid, title: locale === 'ar' ? 'مخطط الطوابق' : 'Floor Plan', desc: locale === 'ar' ? 'تصميم مخطط المطعم وإدارة الطاولات بصرياً' : 'Design floor layout and manage tables visually' },
        { icon: ConciergeBell, title: locale === 'ar' ? 'نظام النادل' : 'Waiter System', desc: locale === 'ar' ? 'تطبيق خاص بالنادل لأخذ الطلبات من الطاولة' : 'Dedicated waiter app for tableside ordering' },
        { icon: ChefHat, title: locale === 'ar' ? 'شاشة المطبخ KDS' : 'Kitchen Display', desc: locale === 'ar' ? 'شاشة عرض الطلبات في المطبخ مع حالات تتبع' : 'Kitchen order display with status tracking' },
        { icon: QrCode, title: locale === 'ar' ? 'طلب ذاتي QR' : 'QR Self-Order', desc: locale === 'ar' ? 'العميل يسكان QR ويطلب بنفسه ويدفع من هاتفه' : 'Customer scans QR, orders and pays from phone' },
        { icon: Printer, title: locale === 'ar' ? 'محطات مطبخ متعددة' : 'Multi Kitchen Stations', desc: locale === 'ar' ? 'توجيه تلقائي للطلبات لمحطات المطبخ المختلفة' : 'Auto-route orders to different kitchen stations' },
        { icon: Clock, title: locale === 'ar' ? 'وقت التجهيز' : 'Prep Time', desc: locale === 'ar' ? 'تتبع وقت تجهيز كل طلب مع تنبيهات التأخير' : 'Track prep time per order with delay alerts' },
      ],
    },
    {
      id: 'hr',
      label: locale === 'ar' ? 'الموظفين والمالية' : 'HR & Finance',
      icon: Users,
      color: 'sky',
      features: [
        { icon: DollarSign, title: locale === 'ar' ? 'رواتب وحضور' : 'Payroll & Attendance', desc: locale === 'ar' ? 'مسير رواتب + ربط أجهزة البصمة (ZKTeco, Hikvision)' : 'Payroll + fingerprint devices (ZKTeco, Hikvision)' },
        { icon: Fingerprint, title: locale === 'ar' ? 'أجهزة بصمة' : 'Biometric Devices', desc: locale === 'ar' ? 'تسجيل حضور وانصراف تلقائي من الجهاز' : 'Auto check-in/out from biometric device' },
        { icon: Receipt, title: locale === 'ar' ? 'حسابات مالية' : 'Financial Accounts', desc: locale === 'ar' ? 'شجرة حسابات + إيرادات/مصروفات + ميزانية' : 'Chart of accounts + revenue/expenses + balance sheet' },
        { icon: FileCheck, title: locale === 'ar' ? 'فوترة ZATCA' : 'ZATCA E-Invoicing', desc: locale === 'ar' ? 'فوترة إلكترونية سعودية متوافقة بالكامل' : 'Fully compliant Saudi e-invoicing' },
        { icon: UserCheck, title: locale === 'ar' ? 'مندوبين مبيعات' : 'Sales Reps', desc: locale === 'ar' ? 'تتبع أداء المندوبين مع نظام عمولات مرن' : 'Track rep performance with flexible commissions' },
        { icon: Shield, title: locale === 'ar' ? 'صلاحيات متقدمة' : 'Advanced Permissions', desc: locale === 'ar' ? 'تحكم دقيق بصلاحيات كل موظف لكل شاشة' : 'Granular access control per employee per screen' },
      ],
    },
    {
      id: 'marketing',
      label: locale === 'ar' ? 'التسويق' : 'Marketing',
      icon: Megaphone,
      color: 'pink',
      features: [
        { icon: Gift, title: locale === 'ar' ? 'برنامج ولاء بالنقاط' : 'Loyalty Points', desc: locale === 'ar' ? 'مكافآت بالنقاط + بطاقات ولاء + عروض خاصة للأعضاء' : 'Point rewards + loyalty cards + member-only offers', isNew: true },
        { icon: Award, title: locale === 'ar' ? 'بطاقات ولاء' : 'Loyalty Cards', desc: locale === 'ar' ? 'بطاقات رقمية ومطبوعة لكل عميل' : 'Digital and physical cards for every customer', isNew: true },
        { icon: Share2, title: locale === 'ar' ? 'ربط التواصل الاجتماعي' : 'Social Media Integration', desc: locale === 'ar' ? 'نشر تلقائي للعروض والمنتجات الجديدة على حساباتك' : 'Auto-publish offers and new products to your accounts', isNew: true },
        { icon: Bell, title: locale === 'ar' ? 'نظام إشعارات' : 'Notifications System', desc: locale === 'ar' ? 'إشعارات آنية للعملاء والموظفين (بريد + Push)' : 'Real-time notifications for customers & staff', isNew: true },
        { icon: TrendingUp, title: locale === 'ar' ? 'تحليلات التسويق' : 'Marketing Analytics', desc: locale === 'ar' ? 'تتبع حملاتك ومعرفة أكثر العروض نجاحاً' : 'Track campaigns and top-performing offers', isNew: true },
        { icon: Heart, title: locale === 'ar' ? 'استهداف العملاء' : 'Customer Targeting', desc: locale === 'ar' ? 'تقسيم العملاء حسب سلوك الشراء والإنفاق' : 'Segment customers by purchase behavior', isNew: true },
      ],
    },
    {
      id: 'dev',
      label: locale === 'ar' ? 'للمطورين' : 'Developers',
      icon: Code2,
      color: 'violet',
      features: [
        { icon: Code2, title: locale === 'ar' ? 'API عام' : 'Public API', desc: locale === 'ar' ? 'RESTful API كامل مع مفاتيح API آمنة' : 'Full RESTful API with secure API keys', isNew: true },
        { icon: Webhook, title: locale === 'ar' ? 'نظام Webhooks' : 'Webhooks', desc: locale === 'ar' ? 'إشعارات لحظية لأحداث البيع والمخزون والطلبات' : 'Real-time event notifications for sales & orders', isNew: true },
        { icon: Plug, title: locale === 'ar' ? 'تكاملات خارجية' : 'External Integrations', desc: locale === 'ar' ? 'ربط مع أنظمة محاسبة، توصيل، وتسويق خارجية' : 'Connect with accounting, delivery, and marketing', isNew: true },
        { icon: Globe, title: locale === 'ar' ? 'PWA تطبيق ويب' : 'PWA Web App', desc: locale === 'ar' ? 'ثبّته كتطبيق على أي جهاز — بدون متجر تطبيقات' : 'Install as app on any device — no app store needed' },
        { icon: Moon, title: locale === 'ar' ? 'وضع داكن' : 'Dark Mode', desc: locale === 'ar' ? 'واجهة مريحة للعمل ليلاً مع تبديل تلقائي' : 'Comfortable night interface with auto-switch' },
        { icon: Globe, title: locale === 'ar' ? 'RTL عربي كامل' : 'Full Arabic RTL', desc: locale === 'ar' ? 'واجهة عربية بالكامل مع دعم اللغة الإنجليزية' : 'Full Arabic interface with English support' },
      ],
    },
  ];

  const activeCat = categories[activeCategory]!;

  return (
    <AnimatedSection className="py-24 bg-gray-50 dark:bg-gray-900" id="features">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div variants={fadeUp} transition={{ duration: 0.6 }} className="text-center mb-14">
          <span className="text-brand-600 font-semibold text-sm">{locale === 'ar' ? 'كل ما تحتاجه' : 'Everything You Need'}</span>
          <h2 className="text-3xl lg:text-5xl font-bold text-gray-900 dark:text-white mt-3">
            {locale === 'ar' ? 'منصة متكاملة لإدارة أعمالك' : 'Complete Business Management Platform'}
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mt-4 max-w-2xl mx-auto text-lg">
            {locale === 'ar' ? '7 محاور رئيسية تغطي كل جوانب عملك — من نقطة البيع للتسويق' : '7 core pillars covering every aspect of your business'}
          </p>
        </motion.div>

        {/* Category Tabs */}
        <motion.div variants={fadeUp} transition={{ duration: 0.5 }} className="flex flex-wrap justify-center gap-2 mb-12">
          {categories.map((cat, i) => {
            const Icon = cat.icon;
            const isActive = activeCategory === i;
            return (
              <motion.button
                key={cat.id}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setActiveCategory(i)}
                className={`flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold transition-all border-2 ${
                  isActive
                    ? 'bg-brand-600 text-white border-transparent shadow-lg shadow-brand-500/25'
                    : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-100 dark:border-gray-700 hover:border-brand-200 dark:hover:border-brand-800'
                }`}
              >
                <Icon className="w-4 h-4" />
                {cat.label}
                {cat.id === 'estore' || cat.id === 'marketing' || cat.id === 'dev' ? (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${isActive ? 'bg-yellow-400 text-gray-900' : 'bg-brand-100 text-brand-700 dark:bg-brand-900 dark:text-brand-300'}`}>
                    {locale === 'ar' ? 'جديد' : 'NEW'}
                  </span>
                ) : null}
              </motion.button>
            );
          })}
        </motion.div>

        {/* Features Grid */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeCat.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-5"
          >
            {activeCat.features.map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05, duration: 0.3 }}
                whileHover={{ y: -6, boxShadow: '0 20px 40px rgba(79,70,229,0.08)' }}
                className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 group cursor-default relative"
              >
                {f.isNew && (
                  <span className="absolute top-4 left-4 text-[10px] bg-brand-100 dark:bg-brand-900 text-brand-700 dark:text-brand-300 px-2 py-0.5 rounded-full font-bold">
                    {locale === 'ar' ? 'جديد' : 'NEW'}
                  </span>
                )}
                <div className="w-12 h-12 rounded-xl bg-brand-50 dark:bg-brand-950 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <f.icon className="w-6 h-6 text-brand-600 dark:text-brand-400" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{f.title}</h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </AnimatePresence>
      </div>
    </AnimatedSection>
  );
}

// ═══════════════════════════════════════════════════════════
// E-Store Highlight Section (NEW)
// ═══════════════════════════════════════════════════════════

function EStoreSection() {
  const locale = useLocale();

  const gateways = ['Stripe', 'PayTabs', 'Tap', 'Moyasar', 'Fawry'];

  return (
    <AnimatedSection className="py-24 bg-white dark:bg-gray-950" id="estore">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <motion.div variants={fadeInLeft} transition={{ duration: 0.7 }}>
            <div className="inline-flex items-center gap-2 bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 px-4 py-2 rounded-full text-sm font-semibold mb-6">
              <ShoppingCart className="w-4 h-4" />
              {locale === 'ar' ? 'جديد بالكامل' : 'Brand New'}
            </div>

            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-6">
              {locale === 'ar' ? 'متجر إلكتروني متكامل لكل عميل' : 'Complete E-Store for Every Client'}
            </h2>

            <p className="text-gray-500 dark:text-gray-400 text-lg mb-8 leading-relaxed">
              {locale === 'ar'
                ? 'كل مستأجر يحصل على متجر إلكتروني مستقل مربوط مباشرة بنقطة البيع والمخزون. الطلبات تصل فوراً وتُطبع تلقائياً للتجهيز.'
                : 'Every tenant gets an independent online store directly linked to POS and inventory. Orders arrive instantly and auto-print for preparation.'}
            </p>

            <div className="space-y-3 mb-8">
              {[
                locale === 'ar' ? 'قوالب تصميم احترافية قابلة للتخصيص' : 'Customizable professional design templates',
                locale === 'ar' ? 'ربط كامل مع المخزون — لا بيع لمنتج نفد' : 'Full inventory sync — no selling out-of-stock items',
                locale === 'ar' ? 'طلبات مباشرة تظهر على نقطة البيع' : 'Direct orders appear on the POS',
                locale === 'ar' ? 'طباعة تلقائية للطلبات الجديدة' : 'Auto-print new orders',
                locale === 'ar' ? 'إعدادات شحن مرنة حسب المنطقة' : 'Flexible shipping settings by region',
              ].map((item, i) => (
                <motion.div key={i} variants={fadeUp} transition={{ duration: 0.3 }} className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 mt-0.5 shrink-0" />
                  <span className="text-gray-700 dark:text-gray-300">{item}</span>
                </motion.div>
              ))}
            </div>

            <div className="flex flex-wrap gap-3">
              {gateways.map((gw, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.1 }}
                  viewport={{ once: true }}
                  className="px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-xl text-sm font-semibold text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700"
                >
                  {gw}
                </motion.div>
              ))}
            </div>
          </motion.div>

          <motion.div variants={fadeInRight} transition={{ duration: 0.7 }}>
            <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-3xl p-8 text-white shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -translate-y-20 translate-x-20" />
              <div className="relative">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                    <Store className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-lg">{locale === 'ar' ? 'متجرك الإلكتروني' : 'Your Online Store'}</h4>
                    <p className="text-emerald-100 text-sm">mystore.mpos.sa</p>
                  </div>
                </div>

                <div className="space-y-3">
                  {[
                    { icon: Palette, text: locale === 'ar' ? 'قوالب تصميم جاهزة' : 'Ready-made templates' },
                    { icon: Package, text: locale === 'ar' ? 'مزامنة المخزون آنياً' : 'Real-time inventory sync' },
                    { icon: Printer, text: locale === 'ar' ? 'طباعة تلقائية للطلبات' : 'Auto-print orders' },
                    { icon: Truck, text: locale === 'ar' ? 'شحن وتوصيل مرن' : 'Flexible shipping & delivery' },
                    { icon: CreditCard, text: locale === 'ar' ? '5 بوابات دفع' : '5 payment gateways' },
                  ].map((item, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: 20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 + i * 0.1 }}
                      viewport={{ once: true }}
                      className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3"
                    >
                      <item.icon className="w-5 h-5 text-emerald-200" />
                      <span className="text-sm font-medium">{item.text}</span>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </AnimatedSection>
  );
}

// ═══════════════════════════════════════════════════════════
// Business Types Section
// ═══════════════════════════════════════════════════════════

function BusinessTypesSection() {
  const locale = useLocale();

  const businesses = [
    { icon: UtensilsCrossed, name: locale === 'ar' ? 'مطعم' : 'Restaurant', desc: locale === 'ar' ? 'نادل + مطبخ + طاولات + QR' : 'Waiter + Kitchen + Tables + QR', color: 'from-red-500 to-rose-600' },
    { icon: ShoppingBag, name: locale === 'ar' ? 'تجزئة' : 'Retail', desc: locale === 'ar' ? 'باركود + مخزون + عملاء + فروع' : 'Barcode + Inventory + Clients + Branches', color: 'from-brand-500 to-brand-700' },
    { icon: Boxes, name: locale === 'ar' ? 'بقالة / سوبرماركت' : 'Grocery / Supermarket', desc: locale === 'ar' ? 'ميزان + باركود + وصفات + موردين' : 'Scale + Barcode + Recipes + Suppliers', color: 'from-green-500 to-emerald-600' },
    { icon: Coffee, name: locale === 'ar' ? 'كافيه' : 'Cafe', desc: locale === 'ar' ? 'طلب ذاتي + كاشير + ولاء' : 'Self-order + POS + Loyalty', color: 'from-amber-500 to-orange-600' },
    { icon: Scissors, name: locale === 'ar' ? 'بوتيك / صالون' : 'Boutique / Salon', desc: locale === 'ar' ? 'حجوزات + متغيرات + عملاء' : 'Bookings + Variants + Clients', color: 'from-pink-500 to-fuchsia-600' },
    { icon: Wine, name: locale === 'ar' ? 'بار / لاونج' : 'Bar / Lounge', desc: locale === 'ar' ? 'طاولات + نادل + مخبخ + تقارير' : 'Tables + Waiter + Kitchen + Reports', color: 'from-violet-500 to-purple-600' },
  ];

  return (
    <AnimatedSection className="py-24 bg-gray-50 dark:bg-gray-900" id="business-types">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div variants={fadeUp} transition={{ duration: 0.6 }} className="text-center mb-16">
          <span className="text-brand-600 font-semibold text-sm">{locale === 'ar' ? 'مناسب لجميع الأعمال' : 'For All Business Types'}</span>
          <h2 className="text-3xl lg:text-5xl font-bold text-gray-900 dark:text-white mt-3">
            {locale === 'ar' ? 'مهما كان نوع عملك' : 'Whatever Your Business'}
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mt-4 max-w-xl mx-auto text-lg">
            {locale === 'ar' ? 'MPOS مصمم ليتكيف مع أي نشاط تجاري' : 'MPOS is designed to adapt to any business'}
          </p>
        </motion.div>

        <motion.div variants={staggerContainer} className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {businesses.map((biz, i) => (
            <motion.div
              key={i}
              variants={fadeUp}
              transition={{ duration: 0.4 }}
              whileHover={{ y: -8, scale: 1.02 }}
              className="bg-white dark:bg-gray-800 rounded-2xl p-8 border border-gray-100 dark:border-gray-700 text-center group cursor-default"
            >
              <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${biz.color} flex items-center justify-center mx-auto mb-5 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                <biz.icon className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{biz.name}</h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm">{biz.desc}</p>
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
  const locale = useLocale();

  const phases = [
    { step: '1', title: locale === 'ar' ? 'تفعيل الشهادة' : 'Certificate Activation', desc: locale === 'ar' ? 'أدخل بيانات ZATCA وفعّل الشهادة بضغطة زر' : 'Enter ZATCA data and activate with one click', icon: Building2 },
    { step: '2', title: locale === 'ar' ? 'ربط تلقائي' : 'Auto Integration', desc: locale === 'ar' ? 'ربط مباشر مع بوابة ZATCA — بدون تدخل تقني' : 'Direct link to ZATCA portal — no technical work', icon: Wifi },
    { step: '3', title: locale === 'ar' ? 'إصدار الفواتير' : 'Issue Invoices', desc: locale === 'ar' ? 'كل فاتورة تصدر متوافقة تلقائياً مع QR Code' : 'Every invoice auto-compliant with QR Code', icon: Zap },
    { step: '4', title: locale === 'ar' ? 'تقارير وتدقيق' : 'Reports & Audit', desc: locale === 'ar' ? 'تقارير ضريبية جاهزة مع سجل تدقيق كامل' : 'Tax reports ready with full audit log', icon: BarChart3 },
  ];

  return (
    <AnimatedSection className="py-24 bg-white dark:bg-gray-950" id="zatca">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <motion.div variants={fadeInLeft} transition={{ duration: 0.7 }}>
            <div className="inline-flex items-center gap-2 bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300 px-4 py-2 rounded-full text-sm font-semibold mb-6">
              <FileCheck className="w-4 h-4" />
              {locale === 'ar' ? 'متوافق بالكامل' : 'Fully Compliant'}
            </div>

            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-6">
              {locale === 'ar' ? 'فوترة إلكترونية ZATCA' : 'ZATCA E-Invoicing'}
            </h2>

            <p className="text-gray-500 dark:text-gray-400 text-lg mb-8 leading-relaxed">
              {locale === 'ar'
                ? 'فواتير متوافقة مع هيئة الزكاة والضريبة والجمارك — المرحلتين الأولى والثانية. QR Code تلقائي على كل فاتورة.'
                : 'Invoices compliant with ZATCA — Phase 1 and Phase 2. Automatic QR Code on every invoice.'}
            </p>

            <div className="space-y-3 mb-8">
              {[
                locale === 'ar' ? 'فاتورة ضريبية + فاتورة مبسطة' : 'Standard + Simplified invoices',
                locale === 'ar' ? 'QR Code تلقائي متوافق مع المواصفات' : 'Auto QR Code per specifications',
                locale === 'ar' ? 'ربط مباشر مع بوابة ZATCA' : 'Direct ZATCA portal integration',
                locale === 'ar' ? 'تقارير ضريبية جاهزة للتقديم' : 'Tax reports ready for submission',
                locale === 'ar' ? 'حفظ وأرشفة لمدة 7+ سنوات' : 'Storage and archiving for 7+ years',
              ].map((item, i) => (
                <motion.div key={i} variants={fadeUp} transition={{ duration: 0.3 }} className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
                  <span className="text-gray-700 dark:text-gray-300">{item}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <motion.div variants={fadeInRight} transition={{ duration: 0.7 }} className="space-y-5">
            {phases.map((phase, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: locale === 'ar' ? -30 : 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.15, duration: 0.5 }}
                viewport={{ once: true }}
                className="flex gap-4 items-start"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white font-bold text-lg shrink-0 shadow-lg">
                  {phase.step}
                </div>
                <div className="flex-1 bg-green-50/50 dark:bg-green-950/30 rounded-xl p-4 border border-green-100 dark:border-green-900 hover:border-green-300 dark:hover:border-green-700 transition-colors">
                  <h4 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <phase.icon className="w-4 h-4 text-green-600 dark:text-green-400" />
                    {phase.title}
                  </h4>
                  <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{phase.desc}</p>
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
                  <h4 className="font-bold text-lg">{locale === 'ar' ? 'جاهز للمرحلة الثانية' : 'Phase 2 Ready'}</h4>
                  <p className="text-green-100 text-sm">{locale === 'ar' ? 'ربط مباشر — بدون أي تعديلات مطلوبة منك' : 'Direct integration — no changes needed from you'}</p>
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
// Pricing Section
// ═══════════════════════════════════════════════════════════

function PricingSection({ onGetStarted }: { onGetStarted: () => void }) {
  const [yearly, setYearly] = useState(false);
  const locale = useLocale();

  const plans = [
    {
      name: locale === 'ar' ? 'أساسي' : 'Basic',
      desc: locale === 'ar' ? 'للمتاجر الصغيرة' : 'For small stores',
      price: yearly ? 79 : 99,
      popular: false,
      features: [
        locale === 'ar' ? 'نقطة بيع واحدة' : '1 POS terminal',
        locale === 'ar' ? 'إدارة مخزون أساسية' : 'Basic inventory management',
        locale === 'ar' ? 'فوترة إلكترونية ZATCA' : 'ZATCA e-invoicing',
        locale === 'ar' ? 'تقارير أساسية' : 'Basic reports',
        locale === 'ar' ? 'دعم بريد إلكتروني' : 'Email support',
      ],
    },
    {
      name: locale === 'ar' ? 'احترافي' : 'Professional',
      desc: locale === 'ar' ? 'للأعمال النامية' : 'For growing businesses',
      price: yearly ? 159 : 199,
      popular: true,
      popularLabel: locale === 'ar' ? 'الأكثر طلباً' : 'Most Popular',
      features: [
        locale === 'ar' ? 'حتى 5 نقاط بيع' : 'Up to 5 POS terminals',
        locale === 'ar' ? 'متجر إلكتروني كامل' : 'Full online store',
        locale === 'ar' ? 'إدارة مخزون + مستودعات' : 'Inventory + warehouses',
        locale === 'ar' ? 'نظام مطعم كامل' : 'Full restaurant system',
        locale === 'ar' ? 'رواتب وحضور + بصمة' : 'Payroll + biometric',
        locale === 'ar' ? 'برنامج ولاء' : 'Loyalty program',
        locale === 'ar' ? 'API + Webhooks' : 'API + Webhooks',
        locale === 'ar' ? 'دعم أولوية' : 'Priority support',
      ],
    },
    {
      name: locale === 'ar' ? 'مؤسسات' : 'Enterprise',
      desc: locale === 'ar' ? 'للشركات والسلاسل' : 'For companies & chains',
      price: yearly ? 349 : 449,
      popular: false,
      features: [
        locale === 'ar' ? 'نقاط بيع غير محدودة' : 'Unlimited POS terminals',
        locale === 'ar' ? 'فروع متعددة' : 'Multiple branches',
        locale === 'ar' ? 'كل مميزات الاحترافي' : 'All Professional features',
        locale === 'ar' ? 'مندوبين + عمولات' : 'Sales reps + commissions',
        locale === 'ar' ? 'تكاملات خارجية مخصصة' : 'Custom integrations',
        locale === 'ar' ? 'مدير حساب مخصص' : 'Dedicated account manager',
        locale === 'ar' ? 'SLA 99.99%' : '99.99% SLA',
      ],
    },
  ];

  return (
    <AnimatedSection className="py-24 bg-white dark:bg-gray-950" id="pricing">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div variants={fadeUp} transition={{ duration: 0.6 }} className="text-center mb-12">
          <span className="text-brand-600 font-semibold text-sm">{locale === 'ar' ? 'أسعار شفافة' : 'Transparent Pricing'}</span>
          <h2 className="text-3xl lg:text-5xl font-bold text-gray-900 dark:text-white mt-3">
            {locale === 'ar' ? 'باقات تناسب كل الأحجام' : 'Plans for Every Size'}
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mt-4">
            {locale === 'ar' ? 'ابدأ مجاناً لمدة 14 يوم — بدون بطاقة ائتمان' : 'Start free for 14 days — no credit card required'}
          </p>

          <div className="mt-8 flex items-center justify-center gap-4">
            <span className={`text-sm font-medium ${!yearly ? 'text-gray-900 dark:text-white' : 'text-gray-400'}`}>
              {locale === 'ar' ? 'شهري' : 'Monthly'}
            </span>
            <button
              onClick={() => setYearly(!yearly)}
              className={`relative w-14 h-7 rounded-full transition-colors ${yearly ? 'bg-brand-600' : 'bg-gray-300 dark:bg-gray-600'}`}
            >
              <motion.div
                layout
                className="absolute top-0.5 w-6 h-6 rounded-full bg-white shadow"
                style={{ left: yearly ? 'auto' : '2px', right: yearly ? '2px' : 'auto' }}
              />
            </button>
            <span className={`text-sm font-medium ${yearly ? 'text-gray-900 dark:text-white' : 'text-gray-400'}`}>
              {locale === 'ar' ? 'سنوي' : 'Yearly'}
              <span className={`${locale === 'ar' ? 'mr-1' : 'ml-1'} text-xs bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 px-2 py-0.5 rounded-full`}>
                {locale === 'ar' ? 'وفر 20%' : 'Save 20%'}
              </span>
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
                  ? 'bg-gradient-to-b from-brand-600 to-purple-700 text-white shadow-2xl scale-105 border-0 z-10'
                  : 'bg-white dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700'
              }`}
            >
              {plan.popular && plan.popularLabel && (
                <motion.div
                  initial={{ scale: 0 }}
                  whileInView={{ scale: 1 }}
                  transition={{ type: 'spring', delay: 0.3 }}
                  viewport={{ once: true }}
                  className="absolute -top-4 left-1/2 -translate-x-1/2 bg-yellow-400 text-gray-900 px-4 py-1 rounded-full text-sm font-bold"
                >
                  <Star className={`w-3 h-3 inline ${locale === 'ar' ? 'ml-1' : 'mr-1'}`} />
                  {plan.popularLabel}
                </motion.div>
              )}

              <h3 className={`text-xl font-bold ${plan.popular ? 'text-white' : 'text-gray-900 dark:text-white'}`}>{plan.name}</h3>
              <p className={`text-sm mt-1 ${plan.popular ? 'text-brand-200' : 'text-gray-500 dark:text-gray-400'}`}>{plan.desc}</p>

              <div className="mt-6 mb-8">
                <AnimatePresence mode="wait">
                  <motion.div key={yearly ? 'yearly' : 'monthly'} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }}>
                    <span className={`text-4xl font-bold ${plan.popular ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
                      {plan.price}
                    </span>
                    <span className={`text-sm ${plan.popular ? 'text-brand-200' : 'text-gray-500 dark:text-gray-400'}`}>
                      {' '}{locale === 'ar' ? 'ر.س/شهر' : 'SAR/mo'}
                    </span>
                  </motion.div>
                </AnimatePresence>
              </div>

              <ul className="space-y-3 mb-8">
                {plan.features.map((f, j) => (
                  <li key={j} className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className={`w-4 h-4 shrink-0 ${plan.popular ? 'text-green-300' : 'text-green-500'}`} />
                    <span className={plan.popular ? 'text-brand-100' : 'text-gray-600 dark:text-gray-300'}>{f}</span>
                  </li>
                ))}
              </ul>

              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={onGetStarted}
                className={`w-full py-3 rounded-xl font-bold transition-all ${
                  plan.popular
                    ? 'bg-white text-brand-700 hover:bg-yellow-50 shadow-lg'
                    : 'bg-brand-600 text-white hover:bg-brand-700'
                }`}
              >
                {locale === 'ar' ? 'ابدأ مجاناً' : 'Start Free'}
              </motion.button>
            </motion.div>
          ))}
        </motion.div>

        {/* Addons callout */}
        <motion.div
          variants={fadeUp}
          transition={{ duration: 0.5 }}
          className="mt-12 max-w-3xl mx-auto text-center bg-brand-50 dark:bg-brand-950 rounded-2xl p-8 border border-brand-100 dark:border-brand-900"
        >
          <Sparkles className="w-6 h-6 text-brand-600 mx-auto mb-3" />
          <h4 className="font-bold text-gray-900 dark:text-white text-lg mb-2">
            {locale === 'ar' ? 'إضافات مدفوعة حسب الحاجة' : 'Paid Add-ons As Needed'}
          </h4>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            {locale === 'ar'
              ? 'فروع إضافية، نقاط بيع إضافية، مندوبين مبيعات، تكاملات مخصصة — ادفع فقط لما تحتاجه'
              : 'Extra branches, POS terminals, sales reps, custom integrations — pay only for what you need'}
          </p>
        </motion.div>
      </div>
    </AnimatedSection>
  );
}

// ═══════════════════════════════════════════════════════════
// FAQ Section
// ═══════════════════════════════════════════════════════════

function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const locale = useLocale();

  const faqs = [
    {
      q: locale === 'ar' ? 'هل MPOS يعمل بدون إنترنت؟' : 'Does MPOS work offline?',
      a: locale === 'ar' ? 'نعم، يمكنك البيع وإصدار الفواتير بدون إنترنت. عند عودة الاتصال، تتم المزامنة تلقائياً مع السيرفر.' : 'Yes, you can sell and issue invoices offline. When connection returns, auto-sync happens with the server.',
    },
    {
      q: locale === 'ar' ? 'هل يدعم ZATCA المرحلة الثانية؟' : 'Does it support ZATCA Phase 2?',
      a: locale === 'ar' ? 'نعم، MPOS متوافق بالكامل مع المرحلة الأولى والثانية من الفوترة الإلكترونية السعودية.' : 'Yes, MPOS is fully compliant with Phase 1 and Phase 2 of Saudi e-invoicing.',
    },
    {
      q: locale === 'ar' ? 'كيف يعمل المتجر الإلكتروني؟' : 'How does the online store work?',
      a: locale === 'ar' ? 'كل مستأجر يحصل على متجر إلكتروني مستقل مربوط مباشرة بالمخزون ونقطة البيع. الطلبات تظهر مباشرة وتُطبع تلقائياً للتجهيز.' : 'Each tenant gets an independent store linked directly to inventory and POS. Orders appear instantly and auto-print for preparation.',
    },
    {
      q: locale === 'ar' ? 'هل يوجد فترة تجريبية؟' : 'Is there a free trial?',
      a: locale === 'ar' ? 'نعم، 14 يوم تجربة مجانية بدون بطاقة ائتمان. كل المميزات متاحة خلال الفترة التجريبية.' : 'Yes, 14-day free trial without a credit card. All features available during trial.',
    },
    {
      q: locale === 'ar' ? 'هل يدعم الفروع المتعددة؟' : 'Does it support multiple branches?',
      a: locale === 'ar' ? 'نعم، مع فصل تام أو مشاركة للمنتجات والمخزون بين الفروع. إدارة مركزية من لوحة واحدة.' : 'Yes, with full separation or sharing of products and inventory between branches. Central management from one dashboard.',
    },
    {
      q: locale === 'ar' ? 'كيف يعمل برنامج الولاء؟' : 'How does the loyalty program work?',
      a: locale === 'ar' ? 'نظام نقاط تلقائي — كل عملية شراء تكسب العميل نقاط يستبدلها بخصومات أو هدايا. بطاقات ولاء رقمية ومطبوعة.' : 'Auto point system — every purchase earns points redeemable for discounts or gifts. Digital and physical loyalty cards.',
    },
    {
      q: locale === 'ar' ? 'هل يوجد API للمطورين؟' : 'Is there an API for developers?',
      a: locale === 'ar' ? 'نعم، RESTful API كامل مع مفاتيح API آمنة ونظام Webhooks لإشعارات الأحداث لحظياً.' : 'Yes, full RESTful API with secure API keys and Webhooks for real-time event notifications.',
    },
    {
      q: locale === 'ar' ? 'على أي أجهزة يعمل؟' : 'What devices does it work on?',
      a: locale === 'ar' ? 'PWA يعمل على أي جهاز — كمبيوتر، تابلت، موبايل، تاتش سكرين. ثبّته كتطبيق بدون متجر تطبيقات.' : 'PWA works on any device — PC, tablet, mobile, touchscreen. Install as app without app store.',
    },
  ];

  return (
    <AnimatedSection className="py-24 bg-gray-50 dark:bg-gray-900" id="faq">
      <div className="max-w-3xl mx-auto px-6">
        <motion.div variants={fadeUp} transition={{ duration: 0.6 }} className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white">
            {locale === 'ar' ? 'الأسئلة الشائعة' : 'Frequently Asked Questions'}
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mt-3">
            {locale === 'ar' ? 'إجابات سريعة لأكثر الأسئلة شيوعاً' : 'Quick answers to the most common questions'}
          </p>
        </motion.div>

        <motion.div variants={staggerContainer} className="space-y-3">
          {faqs.map((faq, i) => (
            <motion.div
              key={i}
              variants={fadeUp}
              transition={{ duration: 0.3 }}
              className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden"
            >
              <button
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                className={`w-full flex items-center justify-between p-5 ${locale === 'ar' ? 'text-right' : 'text-left'} hover:bg-gray-50/70 dark:hover:bg-gray-700/50 transition`}
              >
                <span className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base">{faq.q}</span>
                <motion.div
                  animate={{ rotate: openIndex === i ? 180 : 0 }}
                  transition={{ duration: 0.3 }}
                  className={`${locale === 'ar' ? 'mr-4' : 'ml-4'} shrink-0`}
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
                    <div className="px-5 pb-5 text-gray-500 dark:text-gray-400 leading-relaxed border-t border-gray-50 dark:border-gray-700 pt-3 text-sm">
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
// Contact Section
// ═══════════════════════════════════════════════════════════

function ContactSection() {
  const [form, setForm] = useState({ name: '', phone: '', email: '', message: '' });
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const locale = useLocale();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.phone) return;
    setSending(true);
    await new Promise(r => setTimeout(r, 1200));
    setSending(false);
    setSent(true);
    setForm({ name: '', phone: '', email: '', message: '' });
  };

  return (
    <AnimatedSection className="py-24 bg-white dark:bg-gray-950" id="contact">
      <div className="max-w-5xl mx-auto px-6">
        <div className="grid md:grid-cols-2 gap-16 items-start">
          <motion.div variants={fadeInLeft} transition={{ duration: 0.7 }}>
            <span className="text-brand-600 font-semibold text-sm">{locale === 'ar' ? 'تواصل معنا' : 'Contact Us'}</span>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mt-3 mb-4">
              {locale === 'ar' ? 'نحب نسمع منك' : 'We\'d Love to Hear From You'}
            </h2>
            <p className="text-gray-500 dark:text-gray-400 mb-8 leading-relaxed">
              {locale === 'ar' ? 'فريقنا جاهز لمساعدتك والإجابة على كل استفساراتك.' : 'Our team is ready to help and answer all your questions.'}
            </p>

            <div className="space-y-5">
              {[
                { icon: Phone, text: '0500 000 000', label: locale === 'ar' ? 'الهاتف' : 'Phone' },
                { icon: Mail, text: 'info@mpos.sa', label: locale === 'ar' ? 'البريد' : 'Email' },
                { icon: MapPin, text: locale === 'ar' ? 'الرياض، المملكة العربية السعودية' : 'Riyadh, Saudi Arabia', label: locale === 'ar' ? 'الموقع' : 'Location' },
                { icon: HeadphonesIcon, text: locale === 'ar' ? '24/7 دعم فني' : '24/7 Technical Support', label: locale === 'ar' ? 'الدعم' : 'Support' },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: 30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  viewport={{ once: true }}
                  className="flex items-center gap-4"
                >
                  <div className="w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-950 flex items-center justify-center shrink-0">
                    <item.icon className="w-5 h-5 text-brand-600 dark:text-brand-400" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">{item.label}</p>
                    <p className="text-gray-700 dark:text-gray-200 font-medium">{item.text}</p>
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
                  className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-2xl p-10 text-center"
                >
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.2 }}>
                    <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
                  </motion.div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{locale === 'ar' ? 'تم إرسال رسالتك بنجاح!' : 'Message sent successfully!'}</h3>
                  <p className="text-gray-500 dark:text-gray-400">{locale === 'ar' ? 'سيتواصل معك فريقنا خلال 24 ساعة.' : 'Our team will contact you within 24 hours.'}</p>
                  <button
                    onClick={() => setSent(false)}
                    className="mt-6 px-6 py-2.5 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition"
                  >
                    {locale === 'ar' ? 'إرسال رسالة أخرى' : 'Send another message'}
                  </button>
                </motion.div>
              ) : (
                <motion.form
                  key="form"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  onSubmit={handleSubmit}
                  className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-8 border border-gray-100 dark:border-gray-700 space-y-5"
                >
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{locale === 'ar' ? 'الاسم' : 'Name'} <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={e => setForm({ ...form, name: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none text-sm bg-white dark:bg-gray-900 dark:text-white"
                      placeholder={locale === 'ar' ? 'اسمك الكامل' : 'Your full name'}
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{locale === 'ar' ? 'الهاتف' : 'Phone'} <span className="text-red-500">*</span></label>
                      <input
                        type="tel"
                        value={form.phone}
                        onChange={e => setForm({ ...form, phone: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none text-sm bg-white dark:bg-gray-900 dark:text-white"
                        placeholder="05xxxxxxxx"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{locale === 'ar' ? 'البريد' : 'Email'}</label>
                      <input
                        type="email"
                        value={form.email}
                        onChange={e => setForm({ ...form, email: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none text-sm bg-white dark:bg-gray-900 dark:text-white"
                        placeholder="email@example.com"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{locale === 'ar' ? 'الرسالة' : 'Message'}</label>
                    <textarea
                      value={form.message}
                      onChange={e => setForm({ ...form, message: e.target.value })}
                      rows={4}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none text-sm bg-white dark:bg-gray-900 dark:text-white resize-none"
                      placeholder={locale === 'ar' ? 'كيف نقدر نساعدك؟' : 'How can we help you?'}
                    />
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    type="submit"
                    disabled={sending || !form.name || !form.phone}
                    className="w-full py-3.5 bg-brand-600 text-white font-bold rounded-xl hover:bg-brand-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {sending ? (
                      <><Loader2 className="w-5 h-5 animate-spin" /> {locale === 'ar' ? 'جاري الإرسال...' : 'Sending...'}</>
                    ) : (
                      <><Send className="w-5 h-5" /> {locale === 'ar' ? 'إرسال' : 'Send'}</>
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
// Subscription Request Form
// ═══════════════════════════════════════════════════════════

function SubscriptionFormSection() {
  const locale = useLocale();
  const BUSINESS_TYPES = locale === 'ar'
    ? ['مطعم', 'كافيه', 'سوبرماركت', 'بقالة', 'تجزئة', 'بوتيك', 'صالون', 'بار', 'أخرى']
    : ['Restaurant', 'Cafe', 'Supermarket', 'Grocery', 'Retail', 'Boutique', 'Salon', 'Bar', 'Other'];

  const PLAN_OPTIONS = [
    { id: 1, name: locale === 'ar' ? 'أساسي' : 'Basic', price: locale === 'ar' ? '99 ر.س/شهر' : '99 SAR/mo' },
    { id: 2, name: locale === 'ar' ? 'احترافي' : 'Professional', price: locale === 'ar' ? '199 ر.س/شهر' : '199 SAR/mo' },
    { id: 3, name: locale === 'ar' ? 'مؤسسات' : 'Enterprise', price: locale === 'ar' ? '449 ر.س/شهر' : '449 SAR/mo' },
  ];

  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    storeName: '', businessType: BUSINESS_TYPES[0] || '', ownerName: '', phone: '', email: '',
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
        setError(data.errors?.[0] || (locale === 'ar' ? 'حدث خطأ. حاول مرة أخرى.' : 'An error occurred. Please try again.'));
      }
    } catch {
      setError(locale === 'ar' ? 'تعذر الاتصال بالخادم. حاول لاحقاً.' : 'Could not connect to server. Please try later.');
    } finally {
      setSubmitting(false);
    }
  };

  const stepLabels = locale === 'ar'
    ? ['بيانات المتجر', 'حساب المدير', 'الباقة والتأكيد']
    : ['Store Info', 'Admin Account', 'Plan & Confirm'];

  const inputCls = "w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none text-sm bg-white dark:bg-gray-900 dark:text-white";

  return (
    <AnimatedSection className="py-24 bg-gradient-to-bl from-brand-50 dark:from-brand-950 via-white dark:via-gray-950 to-blue-50 dark:to-gray-950" id="register">
      <div className="max-w-3xl mx-auto px-6">
        <motion.div variants={fadeUp} transition={{ duration: 0.6 }} className="text-center mb-12">
          <span className="text-brand-600 font-semibold text-sm">{locale === 'ar' ? 'ابدأ الآن' : 'Get Started'}</span>
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mt-3">
            {locale === 'ar' ? 'سجّل متجرك مجاناً' : 'Register Your Store Free'}
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mt-3 max-w-xl mx-auto">
            {locale === 'ar' ? '14 يوم تجربة مجانية — كل المميزات — بدون بطاقة ائتمان' : '14-day free trial — all features — no credit card'}
          </p>
        </motion.div>

        <motion.div variants={scaleIn} transition={{ duration: 0.5 }}>
          <AnimatePresence mode="wait">
            {success ? (
              <motion.div
                key="ok"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-2xl p-12 text-center"
              >
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.2 }}>
                  <CheckCircle2 className="w-20 h-20 text-green-500 mx-auto mb-5" />
                </motion.div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">{locale === 'ar' ? 'تم إرسال طلبك بنجاح!' : 'Request submitted successfully!'}</h3>
                <p className="text-gray-500 dark:text-gray-400 text-lg mb-2">{locale === 'ar' ? 'سيتم مراجعة طلبك خلال 24 ساعة كحد أقصى.' : 'Your request will be reviewed within 24 hours.'}</p>
                <p className="text-gray-400 text-sm">{locale === 'ar' ? 'بعد الموافقة ستتلقى بيانات الدخول وفترة تجريبية مجانية 14 يوماً.' : 'After approval, you will receive login credentials and a 14-day free trial.'}</p>
                <div className="mt-8">
                  <button
                    onClick={() => { setSuccess(false); setStep(1); setForm({ storeName: '', businessType: BUSINESS_TYPES[0] || '', ownerName: '', phone: '', email: '', address: '', city: '', vatNumber: '', planId: 2, adminUsername: '', adminPassword: '', adminFullName: '', notes: '' }); }}
                    className="px-6 py-2.5 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition"
                  >
                    {locale === 'ar' ? 'إرسال طلب آخر' : 'Submit another request'}
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
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden"
              >
                <div className="flex bg-gray-50 dark:bg-gray-900 border-b border-gray-100 dark:border-gray-700">
                  {stepLabels.map((stepLabel, idx) => {
                    const s = { n: idx + 1, t: stepLabel };
                    return (
                      <button
                        key={s.n}
                        type="button"
                        onClick={() => { if (s.n < step || (s.n === 2 && step1Valid) || (s.n === 3 && step1Valid && step2Valid)) setStep(s.n); }}
                        className={`flex-1 py-3.5 text-sm font-medium text-center transition-all border-b-2 ${
                          step === s.n ? 'border-brand-600 text-brand-600 bg-white dark:bg-gray-800' : step > s.n ? 'border-green-500 text-green-600 bg-green-50/30 dark:bg-green-950/30' : 'border-transparent text-gray-400'
                        }`}
                      >
                        <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs ${locale === 'ar' ? 'ml-2' : 'mr-2'} ${
                          step > s.n ? 'bg-green-500 text-white' : step === s.n ? 'bg-brand-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-500'
                        }`}>
                          {step > s.n ? <CheckCircle2 className="w-3.5 h-3.5" /> : s.n}
                        </span>
                        {s.t}
                      </button>
                    );
                  })}
                </div>

                <div className="p-8 space-y-5">
                  <AnimatePresence mode="wait">
                    {step === 1 && (
                      <motion.div key="s1" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="space-y-5">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{locale === 'ar' ? 'اسم المتجر' : 'Store Name'} <span className="text-red-500">*</span></label>
                            <input type="text" value={form.storeName} onChange={e => set('storeName', e.target.value)} className={inputCls} placeholder={locale === 'ar' ? 'مثال: كافيه الجوري' : 'e.g. Al Jouri Cafe'} required />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{locale === 'ar' ? 'نوع النشاط' : 'Business Type'}</label>
                            <select value={form.businessType} onChange={e => set('businessType', e.target.value)} className={inputCls}>
                              {BUSINESS_TYPES.map(bt => <option key={bt} value={bt}>{bt}</option>)}
                            </select>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{locale === 'ar' ? 'اسم المالك' : 'Owner Name'} <span className="text-red-500">*</span></label>
                            <input type="text" value={form.ownerName} onChange={e => set('ownerName', e.target.value)} className={inputCls} placeholder={locale === 'ar' ? 'الاسم الثلاثي' : 'Full name'} required />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{locale === 'ar' ? 'الهاتف' : 'Phone'} <span className="text-red-500">*</span></label>
                            <input type="tel" value={form.phone} onChange={e => set('phone', e.target.value)} className={inputCls} placeholder="05xxxxxxxx" required />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{locale === 'ar' ? 'البريد الإلكتروني' : 'Email'}</label>
                            <input type="email" value={form.email} onChange={e => set('email', e.target.value)} className={inputCls} placeholder="email@example.com" />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{locale === 'ar' ? 'المدينة' : 'City'} <span className="text-red-500">*</span></label>
                            <input type="text" value={form.city} onChange={e => set('city', e.target.value)} className={inputCls} placeholder={locale === 'ar' ? 'مثال: الرياض' : 'e.g. Riyadh'} required />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{locale === 'ar' ? 'الرقم الضريبي' : 'Tax ID (VAT)'} <span className="text-red-500">*</span></label>
                            <input type="text" value={form.vatNumber} onChange={e => set('vatNumber', e.target.value)} className={inputCls} placeholder="3xxxxxxxx00003" required dir="ltr" />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{locale === 'ar' ? 'العنوان' : 'Address'}</label>
                            <input type="text" value={form.address} onChange={e => set('address', e.target.value)} className={inputCls} placeholder={locale === 'ar' ? 'العنوان التفصيلي' : 'Detailed address'} />
                          </div>
                        </div>
                        <button type="button" onClick={() => setStep(2)} disabled={!step1Valid} className="w-full py-3.5 bg-brand-600 text-white font-bold rounded-xl hover:bg-brand-700 transition disabled:opacity-40 flex items-center justify-center gap-2">
                          {locale === 'ar' ? 'التالي' : 'Next'} <ChevronLeft className={`w-4 h-4 ${locale === 'en' ? 'rotate-180' : ''}`} />
                        </button>
                      </motion.div>
                    )}

                    {step === 2 && (
                      <motion.div key="s2" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="space-y-5">
                        <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-xl p-4 text-sm text-amber-800 dark:text-amber-200">
                          <strong>{locale === 'ar' ? 'تنبيه:' : 'Note:'}</strong> {locale === 'ar' ? 'اختر اسم مستخدم وكلمة مرور قوية. ستستخدمها لتسجيل الدخول لمتجرك.' : 'Choose a strong username and password for store login.'}
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{locale === 'ar' ? 'الاسم الكامل للمدير' : 'Admin Full Name'} <span className="text-red-500">*</span></label>
                          <input type="text" value={form.adminFullName} onChange={e => set('adminFullName', e.target.value)} className={inputCls} placeholder={locale === 'ar' ? 'مثال: أحمد محمد' : 'e.g. John Smith'} required />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{locale === 'ar' ? 'اسم المستخدم' : 'Username'} <span className="text-red-500">*</span></label>
                            <input type="text" value={form.adminUsername} onChange={e => set('adminUsername', e.target.value.replace(/\s/g, ''))} className={inputCls} placeholder={locale === 'ar' ? '3 أحرف على الأقل' : 'Min 3 characters'} required dir="ltr" minLength={3} />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{locale === 'ar' ? 'كلمة المرور' : 'Password'} <span className="text-red-500">*</span></label>
                            <input type="password" value={form.adminPassword} onChange={e => set('adminPassword', e.target.value)} className={inputCls} placeholder={locale === 'ar' ? '6 أحرف على الأقل' : 'Min 6 characters'} required dir="ltr" minLength={6} />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{locale === 'ar' ? 'ملاحظات' : 'Notes'}</label>
                          <textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={2} className={`${inputCls} resize-none`} placeholder={locale === 'ar' ? 'أي متطلبات خاصة...' : 'Any special requirements...'} />
                        </div>
                        <div className="flex gap-3">
                          <button type="button" onClick={() => setStep(3)} disabled={!step2Valid} className="flex-1 py-3.5 bg-brand-600 text-white font-bold rounded-xl hover:bg-brand-700 transition disabled:opacity-40 flex items-center justify-center gap-2">
                            {locale === 'ar' ? 'التالي' : 'Next'} <ChevronLeft className={`w-4 h-4 ${locale === 'en' ? 'rotate-180' : ''}`} />
                          </button>
                          <button type="button" onClick={() => setStep(1)} className="px-6 py-3.5 border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 font-medium rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                            {locale === 'ar' ? 'السابق' : 'Back'}
                          </button>
                        </div>
                      </motion.div>
                    )}

                    {step === 3 && (
                      <motion.div key="s3" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="space-y-5">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">{locale === 'ar' ? 'اختر الباقة' : 'Select a plan'}</label>
                        <div className="grid grid-cols-3 gap-3">
                          {PLAN_OPTIONS.map(plan => (
                            <button
                              key={plan.id}
                              type="button"
                              onClick={() => set('planId', plan.id)}
                              className={`p-4 rounded-xl border-2 text-center transition-all ${
                                form.planId === plan.id
                                  ? 'border-brand-500 bg-brand-50 dark:bg-brand-950 ring-2 ring-brand-500/20'
                                  : 'border-gray-200 dark:border-gray-600 hover:border-brand-300'
                              }`}
                            >
                              {form.planId === plan.id && (
                                <div className="flex justify-center mb-1"><CheckCircle2 className="w-5 h-5 text-brand-600" /></div>
                              )}
                              <p className="font-bold text-gray-900 dark:text-white">{plan.name}</p>
                              <p className="text-xs text-brand-600 mt-1">{plan.price}</p>
                            </button>
                          ))}
                        </div>

                        <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-5 space-y-2 text-sm">
                          <h4 className="font-bold text-gray-900 dark:text-white mb-3">{locale === 'ar' ? 'ملخص الطلب' : 'Order Summary'}</h4>
                          <div className="flex justify-between"><span className="text-gray-500">{locale === 'ar' ? 'المتجر:' : 'Store:'}</span><span className="font-medium text-gray-900 dark:text-white">{form.storeName}</span></div>
                          <div className="flex justify-between"><span className="text-gray-500">{locale === 'ar' ? 'المالك:' : 'Owner:'}</span><span className="font-medium text-gray-900 dark:text-white">{form.ownerName}</span></div>
                          <div className="flex justify-between"><span className="text-gray-500">{locale === 'ar' ? 'الباقة:' : 'Plan:'}</span><span className="font-medium text-gray-900 dark:text-white">{PLAN_OPTIONS.find(p => p.id === form.planId)?.name}</span></div>
                          <hr className="border-gray-200 dark:border-gray-700" />
                          <div className="flex justify-between text-green-700 dark:text-green-400 font-bold">
                            <span>{locale === 'ar' ? 'الفترة التجريبية:' : 'Trial Period:'}</span>
                            <span>{locale === 'ar' ? '14 يوم مجاناً' : '14 days free'}</span>
                          </div>
                        </div>

                        {error && (
                          <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-xl p-3 text-sm text-red-700 dark:text-red-300 flex items-center gap-2">
                            <X className="w-4 h-4 shrink-0" /> {error}
                          </div>
                        )}

                        <div className="flex gap-3">
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.97 }}
                            type="submit"
                            disabled={submitting}
                            className="flex-1 py-3.5 bg-gradient-to-l from-brand-600 to-purple-600 text-white font-bold rounded-xl hover:from-brand-700 hover:to-purple-700 transition disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg"
                          >
                            {submitting ? <><Loader2 className="w-5 h-5 animate-spin" /> {locale === 'ar' ? 'جاري الإرسال...' : 'Submitting...'}</> : <><Send className="w-5 h-5" /> {locale === 'ar' ? 'إرسال الطلب' : 'Submit Request'}</>}
                          </motion.button>
                          <button type="button" onClick={() => setStep(2)} className="px-6 py-3.5 border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 font-medium rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                            {locale === 'ar' ? 'السابق' : 'Back'}
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
// CTA Section
// ═══════════════════════════════════════════════════════════

function CTASection({ onGetStarted }: { onGetStarted: () => void }) {
  const locale = useLocale();
  return (
    <AnimatedSection className="py-24 bg-gradient-to-bl from-brand-600 via-purple-600 to-blue-700 text-white relative overflow-hidden">
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-10 right-20 w-64 h-64 bg-white rounded-full blur-3xl" />
        <div className="absolute bottom-10 left-20 w-80 h-80 bg-blue-300 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-4xl mx-auto px-6 text-center">
        <motion.h2 variants={fadeUp} transition={{ duration: 0.6 }} className="text-3xl lg:text-5xl font-bold mb-6">
          {locale === 'ar' ? 'جاهز تبدأ؟' : 'Ready to Start?'}
        </motion.h2>
        <motion.p variants={fadeUp} transition={{ duration: 0.6 }} className="text-xl text-blue-100 mb-10 max-w-2xl mx-auto">
          {locale === 'ar'
            ? 'انضم لآلاف المتاجر التي تدير أعمالها بـ MPOS. ابدأ تجربتك المجانية اليوم.'
            : 'Join thousands of stores managing their business with MPOS. Start your free trial today.'}
        </motion.p>

        <motion.div variants={fadeUp} transition={{ duration: 0.6 }} className="flex flex-wrap gap-4 justify-center">
          <motion.button
            whileHover={{ scale: 1.05, boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}
            whileTap={{ scale: 0.97 }}
            onClick={onGetStarted}
            className="group px-10 py-4 bg-white text-brand-700 font-bold rounded-2xl shadow-xl text-lg flex items-center gap-2"
          >
            {locale === 'ar' ? 'ابدأ مجاناً — 14 يوم' : 'Start Free — 14 Days'}
            <ArrowLeft className={`w-5 h-5 transition-transform ${locale === 'ar' ? 'group-hover:-translate-x-1' : 'group-hover:translate-x-1 rotate-180'}`} />
          </motion.button>
          <motion.a
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.97 }}
            href="tel:0500000000"
            className="px-10 py-4 border-2 border-white/30 text-white font-medium rounded-2xl flex items-center gap-2 text-lg"
          >
            <Phone className="w-5 h-5" />
            {locale === 'ar' ? 'تواصل معنا' : 'Contact Us'}
          </motion.a>
        </motion.div>

        <motion.div variants={fadeUp} transition={{ duration: 0.6 }} className="flex flex-wrap gap-8 justify-center mt-12 text-sm text-blue-200">
          {[
            { icon: CheckCircle2, text: locale === 'ar' ? 'بدون بطاقة ائتمان' : 'No credit card required' },
            { icon: Clock, text: locale === 'ar' ? 'تفعيل فوري' : 'Instant activation' },
            { icon: TrendingUp, text: locale === 'ar' ? 'إلغاء بأي وقت' : 'Cancel anytime' },
          ].map((item, i) => (
            <span key={i} className="flex items-center gap-2">
              <item.icon className="w-4 h-4" />
              {item.text}
            </span>
          ))}
        </motion.div>
      </div>
    </AnimatedSection>
  );
}

// ═══════════════════════════════════════════════════════════
// Footer
// ═══════════════════════════════════════════════════════════

function FooterWithLinks({ onPrivacy, onTerms }: { onPrivacy: () => void; onTerms: () => void }) {
  const locale = useLocale();
  return (
    <footer className="bg-gray-900 text-gray-400 py-16">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid md:grid-cols-4 gap-12 mb-12">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white font-bold">
                M
              </div>
              <span className="text-white font-bold text-lg">MPOS</span>
            </div>
            <p className="text-sm leading-relaxed">
              {locale === 'ar'
                ? 'نظام نقاط بيع سحابي متكامل مع متجر إلكتروني. مصمم للأعمال في السعودية والمنطقة العربية.'
                : 'Complete cloud POS system with e-commerce. Designed for businesses in Saudi Arabia and the Arab region.'}
            </p>
          </div>

          <div>
            <h4 className="text-white font-bold mb-4">{locale === 'ar' ? 'المنتج' : 'Product'}</h4>
            <ul className="space-y-2 text-sm">
              {[
                { label: locale === 'ar' ? 'المميزات' : 'Features', id: 'features' },
                { label: locale === 'ar' ? 'الأسعار' : 'Pricing', id: 'pricing' },
                { label: locale === 'ar' ? 'المتجر الإلكتروني' : 'E-Store', id: 'estore' },
                { label: locale === 'ar' ? 'الأسئلة الشائعة' : 'FAQ', id: 'faq' },
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
            <h4 className="text-white font-bold mb-4">{locale === 'ar' ? 'القانوني' : 'Legal'}</h4>
            <ul className="space-y-2 text-sm">
              <li><button onClick={() => scrollTo('contact')} className="hover:text-white transition">{locale === 'ar' ? 'تواصل معنا' : 'Contact Us'}</button></li>
              <li><button onClick={onPrivacy} className="hover:text-white transition">{locale === 'ar' ? 'سياسة الخصوصية' : 'Privacy Policy'}</button></li>
              <li><button onClick={onTerms} className="hover:text-white transition">{locale === 'ar' ? 'الشروط والأحكام' : 'Terms & Conditions'}</button></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold mb-4">{locale === 'ar' ? 'تواصل معنا' : 'Contact'}</h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-2"><Phone className="w-4 h-4" /> 0500 000 000</li>
              <li className="flex items-center gap-2"><Mail className="w-4 h-4" /> info@mpos.sa</li>
              <li className="flex items-center gap-2"><MapPin className="w-4 h-4" /> {locale === 'ar' ? 'الرياض، السعودية' : 'Riyadh, Saudi Arabia'}</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-8 flex flex-wrap justify-between items-center gap-4">
          <p className="text-sm">&copy; {new Date().getFullYear()} MPOS. {locale === 'ar' ? 'جميع الحقوق محفوظة.' : 'All rights reserved.'}</p>
          <div className="flex gap-6 text-sm">
            <button onClick={onPrivacy} className="hover:text-white transition">{locale === 'ar' ? 'الخصوصية' : 'Privacy'}</button>
            <button onClick={onTerms} className="hover:text-white transition">{locale === 'ar' ? 'الشروط' : 'Terms'}</button>
          </div>
        </div>
      </div>
    </footer>
  );
}

// ═══════════════════════════════════════════════════════════
// Privacy Policy Page
// ═══════════════════════════════════════════════════════════

function PrivacyPolicyPage({ onBack }: { onBack: () => void }) {
  useEffect(() => { window.scrollTo(0, 0); }, []);
  const locale = useLocale();

  const sections = [
    { title: 'مقدمة', content: 'نحن في MPOS نلتزم بحماية خصوصية مستخدمينا وعملائنا. توضح سياسة الخصوصية هذه كيفية جمع واستخدام وحماية المعلومات الشخصية التي تقدمها عند استخدام منصتنا لنقاط البيع.' },
    { title: 'المعلومات التي نجمعها', items: ['بيانات التسجيل: اسم المتجر، اسم المالك، رقم الهاتف، البريد الإلكتروني.', 'البيانات الضريبية: الرقم الضريبي المطلوب للتوافق مع ZATCA.', 'بيانات المعاملات: الفواتير، المبيعات، حركات المخزون.', 'بيانات الموظفين: أسماء الموظفين، بيانات الحضور والرواتب.', 'بيانات الاستخدام: سجلات الدخول، أنماط الاستخدام.'] },
    { title: 'أمان البيانات', items: ['تشفير كلمات المرور باستخدام BCrypt.', 'رموز JWT مشفرة للمصادقة.', 'تشفير الاتصالات عبر HTTPS/TLS.', 'نسخ احتياطي دوري.', 'فصل تام بين بيانات المستأجرين (Multi-Tenant).'] },
    { title: 'حقوقك', items: ['الوصول إلى بياناتك وطلب نسخة.', 'تصحيح البيانات غير الدقيقة.', 'حذف حسابك وبياناتك.', 'تصدير بياناتك.'] },
    { title: 'التواصل', content: 'لأي استفسار: privacy@mpos.sa' },
  ];

  return (
    <div dir={locale === 'ar' ? 'rtl' : 'ltr'} className="min-h-screen bg-gray-50 dark:bg-gray-950" style={{ fontFamily: locale === 'ar' ? "'IBM Plex Sans Arabic', sans-serif" : "'Inter', sans-serif" }}>
      <div className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <button onClick={onBack} className="flex items-center gap-2 text-brand-600 font-medium text-sm">
            {locale === 'ar' ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
            {locale === 'ar' ? 'العودة للرئيسية' : 'Back to Home'}
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white font-bold text-xs">M</div>
            <span className="font-bold text-gray-900 dark:text-white">MPOS</span>
          </div>
        </div>
      </div>
      <div className="max-w-4xl mx-auto px-6 py-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl bg-brand-100 dark:bg-brand-900 flex items-center justify-center"><Shield className="w-6 h-6 text-brand-600" /></div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{locale === 'ar' ? 'سياسة الخصوصية' : 'Privacy Policy'}</h1>
          </div>
          <div className="space-y-8" dir="rtl">
            {sections.map((s, idx) => (
              <div key={idx} className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-3">{s.title}</h2>
                {s.content && <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">{s.content}</p>}
                {s.items && <ul className="mt-3 space-y-2">{s.items.map((item, i) => <li key={i} className="flex gap-2 text-sm text-gray-600 dark:text-gray-400"><CheckCircle2 className="w-4 h-4 text-green-500 shrink-0 mt-0.5" /><span>{item}</span></li>)}</ul>}
              </div>
            ))}
          </div>
          <div className="mt-12 text-center">
            <button onClick={onBack} className="px-8 py-3 bg-brand-600 text-white font-bold rounded-xl hover:bg-brand-700 transition">{locale === 'ar' ? 'العودة للرئيسية' : 'Back to Home'}</button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// Terms Page
// ═══════════════════════════════════════════════════════════

function TermsPage({ onBack }: { onBack: () => void }) {
  useEffect(() => { window.scrollTo(0, 0); }, []);
  const locale = useLocale();

  const sections = [
    { title: 'القبول والأهلية', items: ['باستخدامك للمنصة فإنك تقر بموافقتك على هذه الشروط.', 'يجب أن يكون عمرك 18 سنة أو أكثر.', 'يجب أن تكون مفوضاً قانونياً عن المنشأة التجارية.'] },
    { title: 'الاشتراك والفوترة', items: ['فترة تجريبية مجانية 14 يوماً.', 'بعد انتهاء التجربة، يتوقف الوصول حتى إتمام الدفع.', 'الأسعار قابلة للتعديل مع إشعار مسبق 30 يوماً.'] },
    { title: 'الفوترة الإلكترونية', items: ['فواتير متوافقة مع ZATCA.', 'المشترك مسؤول عن إدخال بيانات التفعيل الصحيحة.', 'المنصة تسهل الربط ولكنها لا تضمن القبول في حال بيانات خاطئة.'] },
    { title: 'القانون الحاكم', content: 'تخضع هذه الاتفاقية لأنظمة المملكة العربية السعودية. يحال أي نزاع للجهات القضائية المختصة في الرياض.' },
    { title: 'التواصل', content: 'لأي استفسار: legal@mpos.sa' },
  ];

  return (
    <div dir={locale === 'ar' ? 'rtl' : 'ltr'} className="min-h-screen bg-gray-50 dark:bg-gray-950" style={{ fontFamily: locale === 'ar' ? "'IBM Plex Sans Arabic', sans-serif" : "'Inter', sans-serif" }}>
      <div className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <button onClick={onBack} className="flex items-center gap-2 text-brand-600 font-medium text-sm">
            {locale === 'ar' ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
            {locale === 'ar' ? 'العودة للرئيسية' : 'Back to Home'}
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white font-bold text-xs">M</div>
            <span className="font-bold text-gray-900 dark:text-white">MPOS</span>
          </div>
        </div>
      </div>
      <div className="max-w-4xl mx-auto px-6 py-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-900 flex items-center justify-center"><FileCheck className="w-6 h-6 text-amber-600" /></div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{locale === 'ar' ? 'الشروط والأحكام' : 'Terms & Conditions'}</h1>
          </div>
          <div className="space-y-8" dir="rtl">
            {sections.map((s, idx) => (
              <div key={idx} className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-3">{s.title}</h2>
                {s.content && <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">{s.content}</p>}
                {s.items && <ul className="mt-3 space-y-2">{s.items.map((item, i) => <li key={i} className="flex gap-2 text-sm text-gray-600 dark:text-gray-400"><CheckCircle2 className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" /><span>{item}</span></li>)}</ul>}
              </div>
            ))}
          </div>
          <div className="mt-12 text-center">
            <button onClick={onBack} className="px-8 py-3 bg-brand-600 text-white font-bold rounded-xl hover:bg-brand-700 transition">{locale === 'ar' ? 'العودة للرئيسية' : 'Back to Home'}</button>
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
  const locale = useLocale();

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
    <div dir={locale === 'ar' ? 'rtl' : 'ltr'} className="min-h-screen scroll-smooth" style={{ fontFamily: locale === 'ar' ? "'IBM Plex Sans Arabic', 'Noto Sans Arabic', sans-serif" : "'Inter', 'system-ui', sans-serif" }}>
      <Navbar onLogin={onLogin} onGetStarted={handleGetStarted} />
      <HeroSection onGetStarted={handleGetStarted} onLogin={onLogin} />
      <StatsBar />
      <FeaturesSection />
      <EStoreSection />
      <BusinessTypesSection />
      <ZatcaSection />
      <PricingSection onGetStarted={handleGetStarted} />
      <SubscriptionFormSection />
      <FAQSection />
      <ContactSection />
      <CTASection onGetStarted={handleGetStarted} />
      <FooterWithLinks onPrivacy={() => setActivePage('privacy')} onTerms={() => setActivePage('terms')} />
    </div>
  );
}
