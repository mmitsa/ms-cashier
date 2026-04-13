import { useState } from 'react';
import { useLogin } from '@/hooks/useApi';
import { ShoppingBag, Eye, EyeOff, Loader2, ArrowRight } from 'lucide-react';

export function LoginScreen({ onBack }: { onBack?: () => void }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const loginMutation = useLogin();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) return;
    loginMutation.mutate({ username, password });
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 dark:from-gray-900 dark:via-gray-950 dark:to-gray-900"
      dir="rtl"
    >
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl dark:shadow-dark-soft p-8 w-full max-w-md mx-4 dark:border dark:border-gray-800">
        {/* Logo & Title */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <ShoppingBag className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">MPOS</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">نظام نقاط البيع المتكامل</p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              اسم المستخدم
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-blue-500 dark:focus:ring-brand-500 focus:border-transparent outline-none transition bg-gray-50 dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-500"
              placeholder="أدخل اسم المستخدم"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              كلمة المرور
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-blue-500 dark:focus:ring-brand-500 focus:border-transparent outline-none transition bg-gray-50 dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-500 pl-12"
                placeholder="أدخل كلمة المرور"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {loginMutation.isError && (
            <div className="bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400 p-3 rounded-xl text-sm border border-red-100 dark:border-red-800">
              {(loginMutation.error as any)?.response?.data?.errors?.[0] || 'اسم المستخدم أو كلمة المرور غير صحيحة'}
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
                جاري تسجيل الدخول...
              </>
            ) : (
              'تسجيل الدخول'
            )}
          </button>
        </form>

        {/* Back to Landing */}
        {onBack && (
          <button
            onClick={onBack}
            className="mt-6 w-full flex items-center justify-center gap-2 text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition"
          >
            <ArrowRight className="w-4 h-4" />
            العودة للصفحة الرئيسية
          </button>
        )}

      </div>
    </div>
  );
}
