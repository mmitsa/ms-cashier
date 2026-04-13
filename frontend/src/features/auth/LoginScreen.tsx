import { useState } from 'react';
import { useLogin } from '@/hooks/useApi';
import { ShoppingBag, Eye, EyeOff, Loader2, ArrowRight, ArrowLeft } from 'lucide-react';
import { useT, useLocale, useLocaleStore } from '@/lib/i18n';

const loginText = {
  ar: {
    subtitle: 'نظام نقاط البيع المتكامل',
    username: 'اسم المستخدم',
    usernamePlaceholder: 'أدخل اسم المستخدم',
    password: 'كلمة المرور',
    passwordPlaceholder: 'أدخل كلمة المرور',
    loginBtn: 'تسجيل الدخول',
    loggingIn: 'جاري تسجيل الدخول...',
    error: 'اسم المستخدم أو كلمة المرور غير صحيحة',
    back: 'العودة للصفحة الرئيسية',
  },
  en: {
    subtitle: 'The Complete Point of Sale System',
    username: 'Username',
    usernamePlaceholder: 'Enter your username',
    password: 'Password',
    passwordPlaceholder: 'Enter your password',
    loginBtn: 'Sign In',
    loggingIn: 'Signing in...',
    error: 'Invalid username or password',
    back: 'Back to home page',
  },
};

export function LoginScreen({ onBack }: { onBack?: () => void }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const loginMutation = useLogin();
  const t = useT();
  const locale = useLocale();
  const { setLocale } = useLocaleStore();
  const txt = loginText[locale];
  const BackArrow = locale === 'ar' ? ArrowRight : ArrowLeft;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) return;
    loginMutation.mutate({ username, password });
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 dark:from-gray-900 dark:via-gray-950 dark:to-gray-900"
      dir={t.dir}
    >
      {/* Language toggle */}
      <button
        onClick={() => setLocale(locale === 'ar' ? 'en' : 'ar')}
        className="fixed top-4 right-4 z-50 px-3 py-1.5 bg-white/10 backdrop-blur text-white text-xs font-bold rounded-lg hover:bg-white/20 transition"
      >
        {locale === 'ar' ? 'EN' : 'عربي'}
      </button>

      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl dark:shadow-dark-soft p-8 w-full max-w-md mx-4 dark:border dark:border-gray-800">
        {/* Logo & Title */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <ShoppingBag className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">MPOS</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">{txt.subtitle}</p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              {txt.username}
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-blue-500 dark:focus:ring-brand-500 focus:border-transparent outline-none transition bg-gray-50 dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-500"
              placeholder={txt.usernamePlaceholder}
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              {txt.password}
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-blue-500 dark:focus:ring-brand-500 focus:border-transparent outline-none transition bg-gray-50 dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-500 ltr:pr-12 rtl:pl-12"
                placeholder={txt.passwordPlaceholder}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute ltr:right-3 rtl:left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {loginMutation.isError && (
            <div className="bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400 p-3 rounded-xl text-sm border border-red-100 dark:border-red-800">
              {(loginMutation.error as any)?.response?.data?.errors?.[0] || txt.error}
            </div>
          )}

          <button
            type="submit"
            disabled={loginMutation.isPending || !username || !password}
            className="w-full py-3 bg-gradient-to-l from-blue-500 to-indigo-600 text-white font-medium rounded-xl hover:from-blue-600 hover:to-indigo-700 transition disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg"
          >
            {loginMutation.isPending ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                {txt.loggingIn}
              </>
            ) : (
              txt.loginBtn
            )}
          </button>
        </form>

        {/* Back to Landing */}
        {onBack && (
          <button
            onClick={onBack}
            className="mt-6 w-full flex items-center justify-center gap-2 text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition"
          >
            <BackArrow className="w-4 h-4" />
            {txt.back}
          </button>
        )}
      </div>
    </div>
  );
}
