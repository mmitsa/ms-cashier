import type { Translations } from './ar';

export const en: Translations = {
  dir: 'ltr' as any,
  lang: 'en',
  label: 'English',
  flag: '🇺🇸',

  // ─── Nav ───
  nav: {
    features: 'Features',
    demo: 'Live Demo',
    compliance: 'Tax Compliance',
    pricing: 'Pricing',
    register: 'Register',
    faq: 'FAQ',
    login: 'Sign In',
    startNow: 'Get Started',
  },

  // ─── Hero ───
  hero: {
    badge: 'Compliant with global e-invoicing standards',
    title: 'The Most Complete',
    titleHighlight: 'Point of Sale',
    titleEnd: 'System for Your Business',
    subtitle:
      'Smart POS + Waiter + Kitchen Display + QR Self-Order + Multi-Branch + Payment Terminals + Attendance + Payroll + E-Invoicing — one platform to manage your store and restaurant',
    cta: 'Start Free Trial',
    ctaSecondary: 'Try Live Demo',
    trust1: 'Certified E-Invoicing',
    trust2: '256-bit Encryption',
    trust3: 'Cloud 99.9% Uptime',
  },

  // ─── Stats ───
  stats: {
    stores: 'Active Stores',
    invoices: 'Monthly Invoices',
    uptime: 'Uptime',
    support: 'Support',
  },

  // ─── Features ───
  features: {
    sectionLabel: 'Everything you need in one place',
    sectionTitle: 'Features you won\'t find elsewhere',
    sectionSubtitle: 'MPOS is designed to be the most comprehensive POS system for businesses worldwide',

    pos: { title: 'Smart POS', desc: 'Modern touch interface with fast barcode scanning, smart cart with automatic tax and discount calculations' },
    waiter: { title: 'Waiter Interface', desc: 'Dedicated interface for table orders — select items, add notes, and send directly to kitchen and cashier' },
    kitchen: { title: 'Kitchen Display (KDS)', desc: 'Real-time kitchen display — order prioritization, prep time tracking, and automatic status updates' },
    qr: { title: 'QR Self-Order', desc: 'Customers scan QR to see the menu — order and pay from their phone with live prep tracking' },
    payment: { title: 'Payment Terminals', desc: 'Integration with Geidea, Nearpay, Ingenico, Verifone, Stripe, STC Pay — auto-send amounts and daily settlement' },
    attendance: { title: 'Fingerprint Attendance', desc: 'Connect ZKTeco and other devices for automatic clock-in/out with comprehensive attendance reports' },
    branches: { title: 'Multi-Branch Management', desc: 'Add branches with flexible plans — share or separate products, distribute warehouses, instant activation' },
    einvoice: { title: 'E-Invoicing', desc: 'Compliant with global e-invoicing standards — ZATCA (Saudi), Egyptian E-Invoice, UAE, and more. QR Code + XML/JSON' },
    barcode: { title: 'Barcode Scanner + Scale', desc: 'Support for wired and wireless barcode scanners and digital scales (CAS, DIGI, Toledo) via Web Serial API' },
    inventory: { title: 'Multi-Warehouse Inventory', desc: 'Up to 5 warehouses per store, item tracking, low-stock alerts, inter-warehouse transfers' },
    hr: { title: 'Employees & Payroll', desc: 'Complete employee management, salary setup, automatic monthly payroll, payslip generation, and archiving' },
    finance: { title: 'Accounts & Treasury', desc: 'Multiple accounts (cash, bank, digital), automatic transaction logging, comprehensive real-time financial reports' },
    zones: { title: 'Floor Zones', desc: 'Divide your restaurant into zones (indoor, outdoor, VIP, bar) — each with its own tables, orders, and management' },
    permissions: { title: 'Granular Permissions', desc: 'Full control over each user\'s access to every screen — who sees what and who edits what' },
    payments: { title: 'Multiple Payment Methods', desc: 'Cash, cards, Apple Pay, Google Pay, bank transfer, credit, installments — with automatic settlement' },
    offline: { title: 'Works Offline', desc: 'Saves data locally and auto-syncs when internet returns — never lose a sale' },
    mobile: { title: 'Mobile App', desc: 'POS app for iPhone, iPad, Android, and tablet — fully synced with the platform' },
    reports: { title: 'Reports & Analytics', desc: 'Daily and monthly sales reports, per-item profit analysis, CSV export, and real-time dashboard' },
  },

  // ─── Demo ───
  demo: {
    label: 'Interactive Live Demo',
    title: 'See every feature in detail',
    subtitle: 'Browse through tabs to explore POS, waiter interface, kitchen display, customer ordering, payment terminals, attendance, and branches',
    tabs: {
      pos: 'POS',
      waiter: 'Waiter',
      kitchen: 'Kitchen',
      qr: 'QR Order',
      payment: 'Payment',
      attendance: 'Attendance',
      branches: 'Branches',
      reports: 'Reports',
    },
    cta: 'Start Now',
    ctaSubtitle: 'Get 14 days free trial',
    liked: 'Like what you see?',
  },

  // ─── E-Invoice / Compliance ───
  compliance: {
    badge: 'Compliant with global e-invoicing standards',
    title: 'E-Invoicing with one click',
    subtitle: 'The system complies with e-invoicing requirements across multiple countries. Invoices are generated in certified formats and submitted to tax authorities automatically.',
    features: [
      'Automatic QR Code on every invoice',
      'Digital signature and encryption for invoice integrity',
      'Real-time reporting to tax authorities',
      'Support for certified XML/JSON formats',
      'Complete archiving and audit trail',
      'Dashboard to monitor submission status',
    ],
    countries: {
      title: 'Supported Countries',
      sa: 'Saudi Arabia (ZATCA)',
      eg: 'Egypt (E-Invoice)',
      ae: 'UAE',
      jo: 'Jordan',
      more: 'More coming soon...',
    },
    steps: {
      title: 'Activation Steps',
      s1: { title: 'Register', desc: 'Enter your business details and tax ID' },
      s2: { title: 'Connect', desc: 'Automatic connection with tax gateway' },
      s3: { title: 'Activate', desc: 'Invoices are reported automatically with each sale' },
      s4: { title: 'Monitor', desc: 'Dashboard to track invoice status' },
    },
    readyTitle: 'Ready to activate now',
    readyDesc: 'Infrastructure is complete — just enter your activation details',
  },

  // ─── Multi-Tenant ───
  multiTenant: {
    badge: 'Integrated SaaS Platform',
    title: 'Manage multiple stores from one dashboard',
    isolation: {
      title: 'Complete Data Isolation',
      desc: 'Each store operates in a fully isolated environment — no store can access another store\'s data.',
      features: ['Encrypted per-store data', 'JWT Token per tenant', 'Global Query Filters', 'Complete data isolation'],
    },
    central: {
      title: 'Central Management',
      desc: 'Admin dashboard to create new stores, manage subscriptions, and monitor performance.',
      features: ['Create a store in one minute', 'Flexible subscription plans', 'Instant activation/deactivation', 'Centralized analytics'],
    },
    flexible: {
      title: 'Full Flexibility',
      desc: 'Each store can customize its settings — products, prices, users, and invoicing.',
      features: ['Independent settings', 'Unlimited users', 'Per-store invoicing', 'Separate reports'],
    },
  },

  // ─── Pricing ───
  pricing: {
    label: 'Simple, transparent pricing',
    title: 'Choose the right plan for your business',
    subtitle: 'All plans include e-invoicing and free updates',
    monthly: 'Monthly',
    yearly: 'Yearly',
    save: 'Save 17%',
    currency: 'USD',
    currencySymbol: '$',
    perMonth: '/month',
    plans: {
      basic: {
        name: 'Basic',
        desc: 'Perfect for small stores',
        price: '49',
        yearlyPrice: '41',
        features: ['3 Users', '1 Warehouse', '1 POS Terminal', 'Inventory Management', 'E-Invoicing', 'Payment Terminal Integration', 'Basic Reports', 'Works Offline', 'Email Support'],
      },
      pro: {
        name: 'Professional',
        desc: 'For restaurants, cafes & branches',
        price: '99',
        yearlyPrice: '82',
        popular: 'Most Popular',
        features: ['10 Users', '3 Warehouses • 3 POS Terminals', 'All Basic features', 'Waiter UI + Kitchen Display', 'QR Self-Order', 'Floor Zones', 'Multi-Branch', 'Attendance + Payroll', 'Granular Permissions', 'Phone Support'],
      },
      enterprise: {
        name: 'Enterprise',
        desc: 'For chains & large businesses',
        price: '149',
        yearlyPrice: '124',
        features: ['Unlimited users & branches', 'Unlimited warehouses & POS', 'All Professional features', 'Custom Mobile App', 'Open API', 'Full Customization', 'Dedicated Account Manager', '24/7 Support', '99.9% SLA'],
      },
    },
  },

  // ─── Registration ───
  register: {
    label: 'Register your store',
    title: 'New Subscription Request',
    subtitle: 'Submit your request and get a 14-day free trial',
    steps: ['Store Info', 'Admin Account', 'Plan & Submit'],
    fields: {
      storeName: { label: 'Store Name', placeholder: 'e.g. Downtown Market' },
      businessType: 'Business Type',
      ownerName: { label: 'Owner Name', placeholder: 'Full name' },
      phone: { label: 'Phone', placeholder: '+1 (555) 000-0000' },
      email: { label: 'Email', placeholder: 'Optional' },
      city: { label: 'City', placeholder: 'e.g. New York' },
      taxId: { label: 'Tax ID', placeholder: 'Optional' },
      address: { label: 'Address', placeholder: 'Optional' },
      country: { label: 'Country', placeholder: 'Select country' },
    },
    businessTypes: ['Retail', 'Wholesale', 'Restaurant', 'Cafe', 'Pharmacy', 'Grocery', 'Other'],
    next: 'Next',
    back: 'Back',
    submit: 'Submit Request',
  },

  // ─── FAQ ───
  faq: {
    title: 'Frequently Asked Questions',
    subtitle: 'Quick answers to common questions',
    items: [
      { q: 'Does the system support e-invoicing?', a: 'Yes, MPOS supports certified e-invoicing in multiple countries including Saudi Arabia (ZATCA), Egypt, UAE, with more being added regularly.' },
      { q: 'Can I manage multiple branches?', a: 'Yes, you can add branches with flexible plans, share or separate products and warehouses.' },
      { q: 'What devices are supported?', a: 'Works on any device with a web browser: desktop, tablet, iPad, or smartphone. No installation needed.' },
      { q: 'Is my data secure?', a: 'All data is encrypted with 256-bit encryption and protected by complete tenant isolation.' },
      { q: 'Does it work offline?', a: 'Yes, the system works offline and automatically syncs data when internet connection returns.' },
      { q: 'What if I need help?', a: 'Our support team is available 24/7 via phone, email, and live chat.' },
    ],
  },

  // ─── Contact ───
  contact: {
    label: 'Contact Us',
    title: 'We\'re here to help',
    subtitle: 'Send us your inquiry and our team will get back to you within 24 hours.',
    phone: '+1 (555) 000-0000',
    email: 'info@mpos.app',
    location: 'Global — Cloud-based',
    supportLabel: 'Support',
    supportValue: 'Available 24/7',
    fields: {
      name: { label: 'Name', placeholder: 'Full name' },
      phone: { label: 'Phone', placeholder: '+1 (555) 000-0000' },
      email: { label: 'Email', placeholder: 'Optional' },
      message: { label: 'Message', placeholder: 'How can we help?' },
    },
    send: 'Send',
  },

  // ─── CTA ───
  cta: {
    title: 'Ready to take your business to the next level?',
    subtitle: 'Join thousands of stores using MPOS to manage their sales efficiently',
    primary: 'Get Started',
    secondary: 'Talk to a Consultant',
    trust: ['No credit card required', 'Setup in minutes', 'Free support'],
  },

  // ─── Footer ───
  footer: {
    desc: 'The most complete point-of-sale system — compliant with global e-invoicing standards with multi-branch support.',
    product: 'Product',
    legal: 'Support & Legal',
    contactUs: 'Contact Us',
    links: {
      features: 'Features',
      pricing: 'Pricing',
      einvoice: 'E-Invoicing',
      faq: 'FAQ',
      contact: 'Contact Us',
      privacy: 'Privacy Policy',
      terms: 'Terms of Service',
    },
    copyright: 'MPOS. All rights reserved.',
  },

  // ─── Common ───
  common: {
    startNow: 'Get Started',
    learnMore: 'Learn More',
    required: '*',
    loading: 'Loading...',
  },
};
