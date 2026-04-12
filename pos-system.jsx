import { useState, useEffect, useCallback, useMemo } from "react";
import {
  ShoppingCart, Package, Users, BarChart3, Settings, Home, Search,
  Plus, Minus, Trash2, CreditCard, Banknote, Smartphone, ChevronDown,
  ChevronLeft, ChevronRight, Bell, Moon, Sun, Menu, X, Eye, Edit,
  Download, Upload, Printer, BarChart, TrendingUp, TrendingDown,
  DollarSign, ShoppingBag, Warehouse, UserCheck, FileText, Calendar,
  Filter, RefreshCw, AlertTriangle, CheckCircle, Clock, ArrowUpDown,
  Layers, Tag, Box, Truck, Receipt, PieChart, Activity, Zap,
  Building2, Globe, Lock, Database, Monitor, Star
} from "lucide-react";

// --- Mock Data ---
const tenants = [
  { id: 1, name: "محل الأناقة للملابس", type: "ملابس", plan: "احترافي", status: "نشط", users: 5, sales: 45200 },
  { id: 2, name: "موبايل ستور", type: "موبايلات", plan: "أساسي", status: "نشط", users: 3, sales: 89100 },
  { id: 3, name: "حلويات السلطان", type: "حلويات", plan: "متقدم", status: "نشط", users: 4, sales: 23400 },
  { id: 4, name: "قطع غيار السيارات", type: "قطع غيار", plan: "احترافي", status: "معلق", users: 2, sales: 67800 },
];

const categories = ["ملابس رجالي", "ملابس حريمي", "أحذية", "اكسسوارات", "عطور", "إلكترونيات"];

const products = [
  { id: 1, name: "قميص رجالي كلاسيك", barcode: "6281000001", cat: "ملابس رجالي", cost: 120, prices: { retail: 200, half: 180, wholesale: 150 }, stock: 45, min: 10, unit: "قطعة" },
  { id: 2, name: "بنطلون جينز سليم", barcode: "6281000002", cat: "ملابس رجالي", cost: 180, prices: { retail: 320, half: 290, wholesale: 250 }, stock: 32, min: 8, unit: "قطعة" },
  { id: 3, name: "فستان سهرة", barcode: "6281000003", cat: "ملابس حريمي", cost: 250, prices: { retail: 450, half: 400, wholesale: 350 }, stock: 18, min: 5, unit: "قطعة" },
  { id: 4, name: "حذاء رياضي نايك", barcode: "6281000004", cat: "أحذية", cost: 350, prices: { retail: 550, half: 500, wholesale: 420 }, stock: 25, min: 10, unit: "زوج" },
  { id: 5, name: "ساعة يد كاجوال", barcode: "6281000005", cat: "اكسسوارات", cost: 90, prices: { retail: 180, half: 160, wholesale: 130 }, stock: 60, min: 15, unit: "قطعة" },
  { id: 6, name: "عطر رجالي فاخر", barcode: "6281000006", cat: "عطور", cost: 200, prices: { retail: 380, half: 340, wholesale: 280 }, stock: 3, min: 5, unit: "زجاجة" },
  { id: 7, name: "سماعات بلوتوث", barcode: "6281000007", cat: "إلكترونيات", cost: 150, prices: { retail: 280, half: 250, wholesale: 200 }, stock: 40, min: 12, unit: "قطعة" },
  { id: 8, name: "تيشيرت قطن", barcode: "6281000008", cat: "ملابس رجالي", cost: 60, prices: { retail: 120, half: 100, wholesale: 80 }, stock: 85, min: 20, unit: "قطعة" },
];

const customers = [
  { id: 1, name: "أحمد محمد", phone: "01012345678", balance: 1200, type: "قطاعي" },
  { id: 2, name: "شركة النور", phone: "01198765432", balance: -5600, type: "جملة" },
  { id: 3, name: "فاطمة علي", phone: "01234567890", balance: 800, type: "قطاعي" },
  { id: 4, name: "مؤسسة الأمل", phone: "01087654321", balance: -12000, type: "جملة" },
];

const recentSales = [
  { id: "INV-001", date: "2026-02-14", customer: "أحمد محمد", total: 1250, method: "كاش", status: "مكتمل" },
  { id: "INV-002", date: "2026-02-14", customer: "عميل نقدي", total: 680, method: "فيزا", status: "مكتمل" },
  { id: "INV-003", date: "2026-02-13", customer: "شركة النور", total: 8900, method: "آجل", status: "معلق" },
  { id: "INV-004", date: "2026-02-13", customer: "فاطمة علي", total: 2100, method: "انستاباي", status: "مكتمل" },
  { id: "INV-005", date: "2026-02-12", customer: "مؤسسة الأمل", total: 15600, method: "تقسيط", status: "جزئي" },
];

const warehouses = [
  { id: 1, name: "المخزن الرئيسي", location: "الإسكندرية - سموحة", items: 308, value: 125000 },
  { id: 2, name: "مخزن الفرع", location: "الإسكندرية - المنشية", items: 145, value: 58000 },
];

// --- Components ---
const Badge = ({ children, variant = "default" }) => {
  const styles = {
    default: "bg-gray-100 text-gray-700",
    success: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    danger: "bg-red-50 text-red-700 border border-red-200",
    warning: "bg-amber-50 text-amber-700 border border-amber-200",
    info: "bg-blue-50 text-blue-700 border border-blue-200",
    primary: "bg-indigo-50 text-indigo-700 border border-indigo-200",
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[variant]}`}>
      {children}
    </span>
  );
};

const StatCard = ({ icon: Icon, label, value, change, color, sub }) => (
  <div className="bg-white rounded-2xl p-5 border border-gray-100 hover:shadow-lg transition-all duration-300 group">
    <div className="flex items-start justify-between mb-3">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${color} group-hover:scale-110 transition-transform`}>
        <Icon size={20} className="text-white" />
      </div>
      {change && (
        <span className={`text-xs font-semibold flex items-center gap-0.5 ${change > 0 ? "text-emerald-600" : "text-red-500"}`}>
          {change > 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
          {Math.abs(change)}%
        </span>
      )}
    </div>
    <p className="text-2xl font-bold text-gray-900">{value}</p>
    <p className="text-sm text-gray-500 mt-1">{label}</p>
    {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
  </div>
);

const SidebarItem = ({ icon: Icon, label, active, onClick, badge }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
      active
        ? "bg-white text-indigo-900 shadow-sm border border-gray-100"
        : "text-gray-400 hover:text-white hover:bg-white/10"
    }`}
  >
    <Icon size={19} strokeWidth={active ? 2.2 : 1.8} />
    <span className="flex-1 text-right">{label}</span>
    {badge && (
      <span className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">{badge}</span>
    )}
  </button>
);

// --- Main App ---
export default function POSSystem() {
  const [activeModule, setActiveModule] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [cart, setCart] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("الكل");
  const [priceType, setPriceType] = useState("retail");
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showInvoice, setShowInvoice] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [adminView, setAdminView] = useState("tenants");

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchSearch = p.name.includes(searchTerm) || p.barcode.includes(searchTerm);
      const matchCat = selectedCategory === "الكل" || p.cat === selectedCategory;
      return matchSearch && matchCat;
    });
  }, [searchTerm, selectedCategory]);

  const cartTotal = useMemo(() => cart.reduce((sum, item) => sum + item.prices[priceType] * item.qty, 0), [cart, priceType]);
  const cartCost = useMemo(() => cart.reduce((sum, item) => sum + item.cost * item.qty, 0), [cart]);
  const cartProfit = cartTotal - cartCost;

  const addToCart = (product) => {
    setCart((prev) => {
      const existing = prev.find((p) => p.id === product.id);
      if (existing) {
        if (existing.qty >= product.stock) return prev;
        return prev.map((p) => (p.id === product.id ? { ...p, qty: p.qty + 1 } : p));
      }
      return [...prev, { ...product, qty: 1 }];
    });
  };

  const updateQty = (id, delta) => {
    setCart((prev) =>
      prev
        .map((p) => (p.id === id ? { ...p, qty: Math.max(0, p.qty + delta) } : p))
        .filter((p) => p.qty > 0)
    );
  };

  const lowStockItems = products.filter((p) => p.stock <= p.min);

  const modules = [
    { id: "dashboard", label: "لوحة التحكم", icon: Home },
    { id: "pos", label: "نقطة البيع", icon: ShoppingCart },
    { id: "inventory", label: "المخزون", icon: Package, badge: lowStockItems.length || null },
    { id: "sales", label: "المبيعات", icon: Receipt },
    { id: "customers", label: "العملاء والموردين", icon: Users },
    { id: "finance", label: "الحسابات والخزينة", icon: DollarSign },
    { id: "reports", label: "التقارير", icon: BarChart3 },
    { id: "warehouses", label: "المخازن", icon: Warehouse },
    { id: "employees", label: "الموظفين", icon: UserCheck },
    { id: "admin", label: "إدارة المستأجرين", icon: Building2 },
    { id: "settings", label: "الإعدادات", icon: Settings },
  ];

  // === RENDER MODULES ===

  const renderDashboard = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">مرحباً بك</h1>
          <p className="text-gray-500 text-sm mt-1">ملخص نشاطك التجاري اليوم — السبت ١٤ فبراير ٢٠٢٦</p>
        </div>
        <div className="flex gap-2">
          <button className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 flex items-center gap-2">
            <Calendar size={15} /> اليوم
          </button>
          <button className="px-4 py-2 bg-indigo-900 text-white rounded-xl text-sm hover:bg-indigo-800 flex items-center gap-2">
            <Download size={15} /> تصدير التقرير
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={ShoppingBag} label="مبيعات اليوم" value="٤,٨٣٠ ج.م" change={12.5} color="bg-indigo-600" sub="٢٣ فاتورة" />
        <StatCard icon={TrendingUp} label="صافي الربح" value="١,٢٤٠ ج.م" change={8.3} color="bg-emerald-600" sub="هامش ٢٥.٧%" />
        <StatCard icon={Users} label="عملاء جدد" value="٧" change={-2.1} color="bg-amber-500" sub="من أصل ١٥٢" />
        <StatCard icon={AlertTriangle} label="أصناف منخفضة" value={lowStockItems.length} color="bg-red-500" sub="تحتاج إعادة طلب" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-900">آخر المبيعات</h3>
            <button onClick={() => setActiveModule("sales")} className="text-sm text-indigo-600 hover:text-indigo-800">عرض الكل</button>
          </div>
          <div className="space-y-3">
            {recentSales.map((sale) => (
              <div key={sale.id} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-indigo-100 flex items-center justify-center">
                    <Receipt size={16} className="text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{sale.customer}</p>
                    <p className="text-xs text-gray-400">{sale.id} • {sale.date}</p>
                  </div>
                </div>
                <div className="text-left">
                  <p className="text-sm font-bold text-gray-900">{sale.total.toLocaleString()} ج.م</p>
                  <Badge variant={sale.status === "مكتمل" ? "success" : sale.status === "معلق" ? "warning" : "info"}>
                    {sale.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-5">
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <h3 className="font-bold text-gray-900 mb-4">إجراءات سريعة</h3>
            <div className="grid grid-cols-2 gap-2">
              {[
                { icon: ShoppingCart, label: "فاتورة جديدة", action: () => setActiveModule("pos") },
                { icon: Package, label: "إضافة صنف", action: () => setActiveModule("inventory") },
                { icon: Users, label: "عميل جديد", action: () => setActiveModule("customers") },
                { icon: Printer, label: "طباعة باركود", action: () => {} },
              ].map((btn, i) => (
                <button
                  key={i}
                  onClick={btn.action}
                  className="flex flex-col items-center gap-2 p-3 rounded-xl bg-gray-50 hover:bg-indigo-50 hover:text-indigo-700 transition-all text-gray-600 text-xs font-medium"
                >
                  <btn.icon size={20} />
                  {btn.label}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-gradient-to-br from-red-50 to-amber-50 rounded-2xl border border-red-100 p-5">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle size={18} className="text-red-500" />
              <h3 className="font-bold text-red-700">تنبيهات المخزون</h3>
            </div>
            <div className="space-y-2">
              {lowStockItems.map((item) => (
                <div key={item.id} className="flex items-center justify-between text-sm">
                  <span className="text-gray-700">{item.name}</span>
                  <Badge variant="danger">{item.stock} {item.unit}</Badge>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <h3 className="font-bold text-gray-900 mb-4">مبيعات الأسبوع</h3>
        <div className="flex items-end justify-between h-48 px-4">
          {["السبت", "الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة"].map((day, i) => {
            const heights = [75, 55, 85, 60, 90, 45, 95];
            return (
              <div key={day} className="flex flex-col items-center gap-2 flex-1">
                <div className="w-full max-w-[40px] rounded-t-lg transition-all duration-500 hover:opacity-80"
                  style={{
                    height: `${heights[i]}%`,
                    background: i === 6 ? "linear-gradient(180deg, #4F46E5, #1B4965)" : "linear-gradient(180deg, #E0E7FF, #C7D2FE)"
                  }}
                />
                <span className="text-xs text-gray-400">{day}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  const renderPOS = () => (
    <div className="flex gap-4 h-full" style={{ minHeight: "calc(100vh - 140px)" }}>
      <div className="flex-1 flex flex-col">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 relative">
            <Search size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="بحث بالاسم أو الباركود..."
              className="w-full pr-10 pl-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400"
            />
          </div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200"
          >
            <option>الكل</option>
            {categories.map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 overflow-y-auto flex-1">
          {filteredProducts.map((product) => (
            <button
              key={product.id}
              onClick={() => addToCart(product)}
              className="bg-white border border-gray-100 rounded-xl p-4 text-right hover:border-indigo-300 hover:shadow-md transition-all group relative"
            >
              <div className="w-full h-20 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg mb-3 flex items-center justify-center">
                <Box size={28} className="text-gray-300 group-hover:text-indigo-400 transition-colors" />
              </div>
              <p className="text-sm font-semibold text-gray-900 truncate">{product.name}</p>
              <p className="text-xs text-gray-400 mt-1">{product.barcode}</p>
              <div className="flex items-center justify-between mt-2">
                <Badge variant={product.stock <= product.min ? "danger" : "success"}>
                  {product.stock} {product.unit}
                </Badge>
                <span className="text-sm font-bold text-indigo-700">{product.prices[priceType]} ج.م</span>
              </div>
              {cart.find((c) => c.id === product.id) && (
                <div className="absolute top-2 left-2 w-6 h-6 bg-indigo-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                  {cart.find((c) => c.id === product.id).qty}
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="w-96 bg-white rounded-2xl border border-gray-100 flex flex-col">
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-gray-900 flex items-center gap-2">
              <ShoppingCart size={18} /> الفاتورة
            </h3>
            <select value={priceType} onChange={(e) => setPriceType(e.target.value)} className="text-xs px-2 py-1 border border-gray-200 rounded-lg">
              <option value="retail">قطاعي</option>
              <option value="half">نصف جملة</option>
              <option value="wholesale">جملة</option>
            </select>
          </div>
          <select value={selectedCustomer || ""} onChange={(e) => setSelectedCustomer(e.target.value || null)} className="w-full text-sm px-3 py-2 border border-gray-200 rounded-lg">
            <option value="">عميل نقدي</option>
            {customers.map((c) => <option key={c.id} value={c.name}>{c.name} ({c.type})</option>)}
          </select>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-300">
              <ShoppingCart size={48} strokeWidth={1} />
              <p className="mt-3 text-sm">الفاتورة فارغة</p>
            </div>
          ) : (
            cart.map((item) => (
              <div key={item.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-900">{item.name}</p>
                  <p className="text-xs text-gray-400">{item.prices[priceType]} × {item.qty}</p>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => updateQty(item.id, -1)} className="w-7 h-7 rounded-lg bg-white border border-gray-200 flex items-center justify-center hover:bg-red-50 hover:border-red-200">
                    <Minus size={14} />
                  </button>
                  <span className="w-8 text-center text-sm font-bold">{item.qty}</span>
                  <button onClick={() => updateQty(item.id, 1)} className="w-7 h-7 rounded-lg bg-white border border-gray-200 flex items-center justify-center hover:bg-green-50 hover:border-green-200">
                    <Plus size={14} />
                  </button>
                </div>
                <span className="text-sm font-bold text-gray-900 w-20 text-left">
                  {(item.prices[priceType] * item.qty).toLocaleString()} ج.م
                </span>
              </div>
            ))
          )}
        </div>

        <div className="p-4 border-t border-gray-100 space-y-3">
          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between text-gray-500"><span>عدد الأصناف</span><span>{cart.length}</span></div>
            <div className="flex justify-between text-gray-500"><span>عدد القطع</span><span>{cart.reduce((s, i) => s + i.qty, 0)}</span></div>
            <div className="flex justify-between text-emerald-600 font-medium"><span>الربح المتوقع</span><span>{cartProfit.toLocaleString()} ج.م</span></div>
            <div className="flex justify-between text-lg font-bold text-gray-900 pt-2 border-t border-gray-100"><span>الإجمالي</span><span>{cartTotal.toLocaleString()} ج.م</span></div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {[
              { icon: Banknote, label: "كاش", color: "bg-emerald-600 hover:bg-emerald-700" },
              { icon: CreditCard, label: "فيزا", color: "bg-blue-600 hover:bg-blue-700" },
              { icon: Smartphone, label: "انستاباي", color: "bg-purple-600 hover:bg-purple-700" },
              { icon: Clock, label: "آجل", color: "bg-amber-600 hover:bg-amber-700" },
            ].map((method) => (
              <button
                key={method.label}
                disabled={cart.length === 0}
                onClick={() => setShowInvoice(true)}
                className={`flex items-center justify-center gap-2 py-3 rounded-xl text-white text-sm font-medium transition-all ${cart.length === 0 ? "bg-gray-200 text-gray-400 cursor-not-allowed" : method.color}`}
              >
                <method.icon size={16} /> {method.label}
              </button>
            ))}
          </div>
          {cart.length > 0 && (
            <button onClick={() => setCart([])} className="w-full py-2 text-sm text-red-500 hover:text-red-700 hover:bg-red-50 rounded-xl transition-colors">
              مسح الفاتورة
            </button>
          )}
        </div>
      </div>

      {showInvoice && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowInvoice(false)}>
          <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle size={32} className="text-emerald-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">تمت العملية بنجاح!</h3>
              <p className="text-gray-500 text-sm mt-1">فاتورة رقم INV-006</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">العميل</span><span className="font-medium">{selectedCustomer || "عميل نقدي"}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">عدد الأصناف</span><span className="font-medium">{cart.length}</span></div>
              <div className="flex justify-between text-lg font-bold border-t border-gray-200 pt-2 mt-2"><span>الإجمالي</span><span className="text-indigo-700">{cartTotal.toLocaleString()} ج.م</span></div>
            </div>
            <div className="flex gap-3 mt-6">
              <button className="flex-1 py-3 bg-indigo-900 text-white rounded-xl text-sm font-medium hover:bg-indigo-800 flex items-center justify-center gap-2">
                <Printer size={16} /> طباعة
              </button>
              <button onClick={() => { setShowInvoice(false); setCart([]); }} className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-200">
                فاتورة جديدة
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderInventory = () => (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">إدارة المخزون</h1>
        <div className="flex gap-2">
          <button className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm flex items-center gap-2 hover:bg-gray-50"><Upload size={15} /> استيراد</button>
          <button className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm flex items-center gap-2 hover:bg-gray-50"><Tag size={15} /> طباعة باركود</button>
          <button className="px-4 py-2 bg-indigo-900 text-white rounded-xl text-sm flex items-center gap-2 hover:bg-indigo-800"><Plus size={15} /> إضافة صنف</button>
        </div>
      </div>
      <div className="grid grid-cols-4 gap-4">
        <StatCard icon={Package} label="إجمالي الأصناف" value={products.length} color="bg-indigo-600" />
        <StatCard icon={Box} label="إجمالي المخزون" value={products.reduce((s, p) => s + p.stock, 0)} color="bg-blue-600" />
        <StatCard icon={AlertTriangle} label="أصناف منخفضة" value={lowStockItems.length} color="bg-red-500" />
        <StatCard icon={DollarSign} label="قيمة المخزون" value={`${products.reduce((s, p) => s + p.cost * p.stock, 0).toLocaleString()} ج.م`} color="bg-emerald-600" />
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center gap-3">
          <div className="flex-1 relative">
            <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input placeholder="بحث في الأصناف..." className="w-full pr-10 pl-4 py-2.5 bg-gray-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200" />
          </div>
          <button className="px-3 py-2.5 bg-gray-50 rounded-xl text-sm flex items-center gap-2 text-gray-600"><Filter size={15} /> تصفية</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-gray-500">
                {["الباركود", "اسم الصنف", "التصنيف", "التكلفة", "قطاعي", "جملة", "الرصيد", "الحالة", "إجراءات"].map((h) => (
                  <th key={h} className="text-right px-4 py-3 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id} className="border-t border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-gray-400">{p.barcode}</td>
                  <td className="px-4 py-3 font-semibold text-gray-900">{p.name}</td>
                  <td className="px-4 py-3 text-gray-500">{p.cat}</td>
                  <td className="px-4 py-3">{p.cost} ج.م</td>
                  <td className="px-4 py-3 font-semibold text-indigo-700">{p.prices.retail} ج.م</td>
                  <td className="px-4 py-3">{p.prices.wholesale} ج.م</td>
                  <td className="px-4 py-3">{p.stock} {p.unit}</td>
                  <td className="px-4 py-3">
                    <Badge variant={p.stock <= p.min ? "danger" : p.stock <= p.min * 2 ? "warning" : "success"}>
                      {p.stock <= p.min ? "منخفض" : p.stock <= p.min * 2 ? "متوسط" : "متوفر"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <button className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center hover:bg-indigo-50 text-gray-400 hover:text-indigo-600"><Edit size={14} /></button>
                      <button className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center hover:bg-indigo-50 text-gray-400 hover:text-indigo-600"><Tag size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderSales = () => (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">إدارة المبيعات</h1>
        <button className="px-4 py-2 bg-indigo-900 text-white rounded-xl text-sm flex items-center gap-2" onClick={() => setActiveModule("pos")}>
          <Plus size={15} /> فاتورة جديدة
        </button>
      </div>
      <div className="grid grid-cols-4 gap-4">
        <StatCard icon={Receipt} label="إجمالي المبيعات" value="٢٨,٤٣٠ ج.م" change={15.2} color="bg-indigo-600" sub="هذا الشهر" />
        <StatCard icon={TrendingUp} label="صافي الأرباح" value="٧,١٠٨ ج.م" change={9.8} color="bg-emerald-600" sub="هامش ٢٥%" />
        <StatCard icon={FileText} label="عدد الفواتير" value="١٢٤" color="bg-blue-600" sub="هذا الشهر" />
        <StatCard icon={Clock} label="أقساط مستحقة" value="١٢,٦٠٠ ج.م" color="bg-amber-500" sub="٣ عملاء" />
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <div className="flex items-center gap-3 mb-4">
          {["الكل", "مكتمل", "معلق", "جزئي", "تقسيط"].map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab === "الكل" ? "all" : tab)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${(activeTab === "all" && tab === "الكل") || activeTab === tab ? "bg-indigo-900 text-white" : "bg-gray-50 text-gray-600 hover:bg-gray-100"}`}>
              {tab}
            </button>
          ))}
        </div>
        <div className="space-y-2">
          {recentSales.map((sale) => (
            <div key={sale.id} className="flex items-center justify-between p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
                  <Receipt size={18} className="text-indigo-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{sale.customer}</p>
                  <p className="text-xs text-gray-400">{sale.id} • {sale.date}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Badge variant={sale.method === "كاش" ? "success" : sale.method === "فيزا" ? "info" : "warning"}>{sale.method}</Badge>
                <Badge variant={sale.status === "مكتمل" ? "success" : sale.status === "معلق" ? "warning" : "info"}>{sale.status}</Badge>
                <span className="font-bold text-gray-900 w-28 text-left">{sale.total.toLocaleString()} ج.م</span>
                <div className="flex gap-1">
                  <button className="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center hover:bg-indigo-50 text-gray-400 hover:text-indigo-600"><Eye size={14} /></button>
                  <button className="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center hover:bg-indigo-50 text-gray-400 hover:text-indigo-600"><Printer size={14} /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderCustomers = () => (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">العملاء والموردين</h1>
        <button className="px-4 py-2 bg-indigo-900 text-white rounded-xl text-sm flex items-center gap-2"><Plus size={15} /> إضافة عميل</button>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {customers.map((c) => (
          <div key={c.id} className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-lg transition-all">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-400 to-indigo-600 flex items-center justify-center text-white font-bold text-lg">{c.name[0]}</div>
              <div>
                <p className="font-bold text-gray-900">{c.name}</p>
                <p className="text-xs text-gray-400">{c.phone}</p>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <Badge variant={c.type === "جملة" ? "primary" : "default"}>{c.type}</Badge>
              <span className={`text-sm font-bold ${c.balance >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                {c.balance >= 0 ? "+" : ""}{c.balance.toLocaleString()} ج.م
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderWarehouses = () => (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">إدارة المخازن</h1>
        <div className="flex gap-2">
          <button className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm flex items-center gap-2 hover:bg-gray-50"><ArrowUpDown size={15} /> تحويل بين المخازن</button>
          <button className="px-4 py-2 bg-indigo-900 text-white rounded-xl text-sm flex items-center gap-2"><Plus size={15} /> مخزن جديد</button>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        {warehouses.map((w) => (
          <div key={w.id} className="bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-lg transition-all">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center"><Warehouse size={22} className="text-indigo-600" /></div>
                <div>
                  <h3 className="font-bold text-gray-900">{w.name}</h3>
                  <p className="text-sm text-gray-400">{w.location}</p>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-xl p-3 text-center">
                <p className="text-xl font-bold text-gray-900">{w.items}</p>
                <p className="text-xs text-gray-400">صنف</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3 text-center">
                <p className="text-xl font-bold text-indigo-700">{w.value.toLocaleString()}</p>
                <p className="text-xs text-gray-400">قيمة (ج.م)</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderFinance = () => (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-gray-900">الحسابات والخزينة</h1>
      <div className="grid grid-cols-3 gap-4">
        <StatCard icon={Banknote} label="خزينة الكاش" value="١٨,٣٢٠ ج.م" change={5.4} color="bg-emerald-600" />
        <StatCard icon={CreditCard} label="حساب الفيزا" value="١٢,٨٥٠ ج.م" change={12.1} color="bg-blue-600" />
        <StatCard icon={Smartphone} label="انستاباي" value="٤,٢٠٠ ج.م" change={22.3} color="bg-purple-600" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><TrendingUp size={18} className="text-emerald-600" /> الإيرادات الأخيرة</h3>
          <div className="space-y-3">
            {[
              { desc: "مبيعات نقدية", amount: 4830, type: "كاش" },
              { desc: "تحصيل من شركة النور", amount: 2500, type: "فيزا" },
              { desc: "تحصيل قسط - مؤسسة الأمل", amount: 1500, type: "انستاباي" },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-emerald-50 rounded-xl">
                <span className="text-sm text-gray-700">{item.desc}</span>
                <div className="flex items-center gap-2">
                  <Badge variant="success">{item.type}</Badge>
                  <span className="text-sm font-bold text-emerald-700">+{item.amount.toLocaleString()} ج.م</span>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><TrendingDown size={18} className="text-red-500" /> المصروفات الأخيرة</h3>
          <div className="space-y-3">
            {[
              { desc: "إيجار المحل", amount: 3500, type: "كاش" },
              { desc: "فاتورة كهرباء", amount: 850, type: "فيزا" },
              { desc: "رواتب موظفين", amount: 8000, type: "كاش" },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-red-50 rounded-xl">
                <span className="text-sm text-gray-700">{item.desc}</span>
                <div className="flex items-center gap-2">
                  <Badge variant="danger">{item.type}</Badge>
                  <span className="text-sm font-bold text-red-600">-{item.amount.toLocaleString()} ج.م</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderReports = () => (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-gray-900">التقارير والإحصائيات</h1>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: Receipt, label: "تقرير المبيعات", desc: "مبيعات يومي/شهري/سنوي", color: "bg-indigo-100 text-indigo-600" },
          { icon: ShoppingBag, label: "تقرير المشتريات", desc: "مشتريات وتكاليف", color: "bg-blue-100 text-blue-600" },
          { icon: TrendingUp, label: "تقرير الأرباح", desc: "أرباح الأصناف", color: "bg-emerald-100 text-emerald-600" },
          { icon: Package, label: "تقرير المخزون", desc: "حركة الأصناف", color: "bg-amber-100 text-amber-600" },
          { icon: DollarSign, label: "المركز المالي", desc: "إيرادات ومصروفات", color: "bg-purple-100 text-purple-600" },
          { icon: Users, label: "كشف حساب عميل", desc: "حركات العملاء", color: "bg-pink-100 text-pink-600" },
          { icon: UserCheck, label: "تقرير الموظفين", desc: "حضور ورواتب", color: "bg-cyan-100 text-cyan-600" },
          { icon: Warehouse, label: "تقرير التحويلات", desc: "حركات المخازن", color: "bg-orange-100 text-orange-600" },
        ].map((report, i) => (
          <button key={i} className="bg-white rounded-2xl border border-gray-100 p-5 text-right hover:shadow-lg hover:border-indigo-200 transition-all group">
            <div className={`w-12 h-12 rounded-xl ${report.color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
              <report.icon size={22} />
            </div>
            <h3 className="font-bold text-gray-900">{report.label}</h3>
            <p className="text-xs text-gray-400 mt-1">{report.desc}</p>
          </button>
        ))}
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <h3 className="font-bold text-gray-900 mb-4">الأصناف الأكثر مبيعاً هذا الشهر</h3>
        <div className="space-y-3">
          {[
            { name: "تيشيرت قطن", sold: 124, revenue: 14880 },
            { name: "بنطلون جينز سليم", sold: 87, revenue: 27840 },
            { name: "حذاء رياضي نايك", sold: 65, revenue: 35750 },
            { name: "ساعة يد كاجوال", sold: 52, revenue: 9360 },
            { name: "قميص رجالي كلاسيك", sold: 48, revenue: 9600 },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-4">
              <span className="w-6 text-center text-sm font-bold text-gray-300">#{i + 1}</span>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-semibold text-gray-900">{item.name}</span>
                  <span className="text-sm text-gray-500">{item.sold} قطعة</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full bg-gradient-to-l from-indigo-400 to-indigo-600 transition-all duration-500" style={{ width: `${(item.sold / 124) * 100}%` }} />
                </div>
              </div>
              <span className="text-sm font-bold text-indigo-700 w-24 text-left">{item.revenue.toLocaleString()} ج.م</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderEmployees = () => (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">إدارة الموظفين</h1>
        <button className="px-4 py-2 bg-indigo-900 text-white rounded-xl text-sm flex items-center gap-2"><Plus size={15} /> إضافة موظف</button>
      </div>
      <div className="grid grid-cols-3 gap-4">
        {[
          { name: "محمد أحمد", role: "مدير المبيعات", salary: 5000, status: "حاضر", avatar: "م" },
          { name: "سارة خالد", role: "كاشير", salary: 3500, status: "حاضر", avatar: "س" },
          { name: "عمر حسن", role: "أمين مخزن", salary: 4000, status: "إجازة", avatar: "ع" },
        ].map((emp, i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-lg transition-all">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-bold text-lg">{emp.avatar}</div>
              <div>
                <p className="font-bold text-gray-900">{emp.name}</p>
                <p className="text-xs text-gray-400">{emp.role}</p>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <Badge variant={emp.status === "حاضر" ? "success" : "warning"}>{emp.status}</Badge>
              <span className="text-sm font-bold text-gray-900">{emp.salary.toLocaleString()} ج.م</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderAdmin = () => (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">إدارة المستأجرين</h1>
          <p className="text-sm text-gray-500 mt-1">لوحة التحكم المركزية — Multi-Tenant Administration</p>
        </div>
        <button className="px-4 py-2 bg-indigo-900 text-white rounded-xl text-sm flex items-center gap-2"><Plus size={15} /> مستأجر جديد</button>
      </div>
      <div className="grid grid-cols-4 gap-4">
        <StatCard icon={Building2} label="إجمالي المستأجرين" value={tenants.length} color="bg-indigo-600" />
        <StatCard icon={Globe} label="نشطين" value={tenants.filter((t) => t.status === "نشط").length} color="bg-emerald-600" />
        <StatCard icon={DollarSign} label="إجمالي المبيعات" value={`${(tenants.reduce((s, t) => s + t.sales, 0) / 1000).toFixed(0)}K ج.م`} color="bg-blue-600" />
        <StatCard icon={Users} label="إجمالي المستخدمين" value={tenants.reduce((s, t) => s + t.users, 0)} color="bg-purple-600" />
      </div>
      <div className="flex gap-3 mb-2">
        {[{k:"tenants",l:"المستأجرين"},{k:"plans",l:"الخطط"},{k:"system",l:"النظام"}].map(({k,l}) => (
          <button key={k} onClick={() => setAdminView(k)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${adminView === k ? "bg-indigo-900 text-white" : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"}`}>
            {l}
          </button>
        ))}
      </div>

      {adminView === "tenants" && (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-gray-500">
                {["المنشأة", "النشاط", "الخطة", "المستخدمين", "المبيعات", "الحالة", "إجراءات"].map((h) => (
                  <th key={h} className="text-right px-5 py-3 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tenants.map((t) => (
                <tr key={t.id} className="border-t border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-100 to-indigo-200 flex items-center justify-center"><Building2 size={18} className="text-indigo-600" /></div>
                      <span className="font-semibold text-gray-900">{t.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-gray-500">{t.type}</td>
                  <td className="px-5 py-4"><Badge variant="primary">{t.plan}</Badge></td>
                  <td className="px-5 py-4">{t.users}</td>
                  <td className="px-5 py-4 font-semibold">{t.sales.toLocaleString()} ج.م</td>
                  <td className="px-5 py-4"><Badge variant={t.status === "نشط" ? "success" : "warning"}>{t.status}</Badge></td>
                  <td className="px-5 py-4">
                    <div className="flex gap-1">
                      <button className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center hover:bg-indigo-50 text-gray-400 hover:text-indigo-600"><Eye size={14} /></button>
                      <button className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center hover:bg-indigo-50 text-gray-400 hover:text-indigo-600"><Edit size={14} /></button>
                      <button className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center hover:bg-indigo-50 text-gray-400 hover:text-indigo-600"><Lock size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {adminView === "plans" && (
        <div className="grid grid-cols-3 gap-4">
          {[
            { name: "أساسي", price: "١,٤٠٠", features: ["نقطة بيع واحدة", "مخزن واحد", "٣ مستخدمين", "تقارير أساسية"], color: "from-gray-100 to-gray-200", textColor: "text-gray-700" },
            { name: "متقدم", price: "٢,٨٠٠", features: ["٣ نقاط بيع", "٣ مخازن", "١٠ مستخدمين", "تقارير متقدمة", "تقسيط"], color: "from-indigo-500 to-indigo-700", textColor: "text-white", popular: true },
            { name: "احترافي", price: "٤,٢٠٠", features: ["نقاط بيع غير محدودة", "مخازن غير محدودة", "مستخدمين غير محدود", "كل التقارير", "تقسيط + API"], color: "from-gray-800 to-gray-900", textColor: "text-white" },
          ].map((plan, i) => (
            <div key={i} className={`rounded-2xl p-6 bg-gradient-to-br ${plan.color} ${plan.textColor} relative ${plan.popular ? "ring-2 ring-indigo-400 ring-offset-2" : ""}`}>
              {plan.popular && <span className="absolute -top-3 right-4 bg-amber-400 text-gray-900 px-3 py-1 rounded-full text-xs font-bold">الأكثر طلباً</span>}
              <h3 className="text-xl font-bold mb-1">{plan.name}</h3>
              <p className="text-3xl font-bold mb-4">{plan.price} <span className="text-sm font-normal opacity-70">ج.م / شهر</span></p>
              <div className="space-y-2">
                {plan.features.map((f, j) => (
                  <div key={j} className="flex items-center gap-2 text-sm"><CheckCircle size={14} className="opacity-70" />{f}</div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {adminView === "system" && (
        <div className="grid grid-cols-2 gap-4">
          {[
            { icon: Database, label: "قاعدة البيانات", status: "متصل", detail: "SQL Server - 2.4GB", variant: "success" },
            { icon: Globe, label: "الدومين", status: "نشط", detail: "pos.mmit.sa", variant: "success" },
            { icon: Lock, label: "SSL Certificate", status: "صالح", detail: "ينتهي: أغسطس 2026", variant: "success" },
            { icon: Monitor, label: "الخادم", status: "يعمل", detail: "GCP - 99.9% Uptime", variant: "success" },
          ].map((item, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center"><item.icon size={22} className="text-gray-600" /></div>
              <div className="flex-1">
                <p className="font-bold text-gray-900">{item.label}</p>
                <p className="text-xs text-gray-400">{item.detail}</p>
              </div>
              <Badge variant={item.variant}>{item.status}</Badge>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderSettings = () => (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-gray-900">الإعدادات</h1>
      <div className="grid grid-cols-2 gap-4">
        {[
          { icon: Building2, label: "بيانات المنشأة", desc: "الاسم والعنوان والشعار" },
          { icon: Users, label: "المستخدمين والصلاحيات", desc: "إدارة الحسابات والأدوار" },
          { icon: Printer, label: "إعدادات الطباعة", desc: "الفواتير والباركود" },
          { icon: Database, label: "النسخ الاحتياطي", desc: "نسخ واستعادة البيانات" },
          { icon: Bell, label: "التنبيهات", desc: "إعدادات الإشعارات" },
          { icon: Globe, label: "النظام", desc: "اللغة والعملة والضرائب" },
        ].map((setting, i) => (
          <button key={i} className="bg-white rounded-2xl border border-gray-100 p-5 text-right hover:shadow-lg hover:border-indigo-200 transition-all flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center"><setting.icon size={22} className="text-indigo-600" /></div>
            <div>
              <h3 className="font-bold text-gray-900">{setting.label}</h3>
              <p className="text-xs text-gray-400 mt-1">{setting.desc}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );

  const moduleRenderers = {
    dashboard: renderDashboard, pos: renderPOS, inventory: renderInventory, sales: renderSales,
    customers: renderCustomers, warehouses: renderWarehouses, finance: renderFinance,
    reports: renderReports, employees: renderEmployees, admin: renderAdmin, settings: renderSettings,
  };

  return (
    <div className="flex h-screen bg-gray-50" dir="rtl" style={{ fontFamily: "'IBM Plex Sans Arabic', 'Noto Sans Arabic', sans-serif" }}>
      <aside className={`${sidebarOpen ? "w-64" : "w-20"} bg-gradient-to-b from-gray-900 via-indigo-950 to-gray-900 flex flex-col transition-all duration-300 shrink-0`}>
        <div className="p-5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-400 to-indigo-600 flex items-center justify-center text-white font-bold text-lg shrink-0">M</div>
          {sidebarOpen && (
            <div>
              <h2 className="text-white font-bold text-sm">MS Cashier</h2>
              <p className="text-gray-400 text-xs">نظام المبيعات الشامل</p>
            </div>
          )}
        </div>
        <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
          {modules.map((mod) => (
            <SidebarItem key={mod.id} icon={mod.icon} label={sidebarOpen ? mod.label : ""} active={activeModule === mod.id} onClick={() => setActiveModule(mod.id)} badge={mod.badge} />
          ))}
        </nav>
        <div className="p-3">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="w-full py-2.5 rounded-xl bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 transition-all flex items-center justify-center">
            {sidebarOpen ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-6 shrink-0">
          <h2 className="font-bold text-gray-900">{modules.find((m) => m.id === activeModule)?.label}</h2>
          <div className="flex items-center gap-3">
            <div className="relative">
              <button className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors"><Bell size={18} /></button>
              {lowStockItems.length > 0 && <span className="absolute -top-1 -left-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">{lowStockItems.length}</span>}
            </div>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-400 to-indigo-600 flex items-center justify-center text-white font-bold text-sm cursor-pointer">م</div>
          </div>
        </header>
        <div className="flex-1 overflow-y-auto p-6">{moduleRenderers[activeModule]?.()}</div>
      </main>
    </div>
  );
}
