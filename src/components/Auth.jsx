import React, { useState, useEffect } from 'react';
import { api, tokenStorage } from '../api/client';
import { useHabitStore } from '../store/useHabitStore';
import { User, Lock, LogIn, UserPlus, LogOut, Loader2, Sparkles } from 'lucide-react';

export default function Auth({ children }) {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const { currentUserId, currentUser, setUser } = useHabitStore();

  // Check existing session on mount
  useEffect(() => {
    async function checkAuth() {
      const token = tokenStorage.get();
      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }

      try {
        const res = await api.auth.me();
        if (res && res.user) {
          setUser(res.user);
        } else {
          tokenStorage.remove();
          setUser(null);
        }
      } catch (err) {
        console.warn('Session verification failed:', err);
        tokenStorage.remove();
        setUser(null);
      } finally {
        setLoading(false);
      }
    }

    checkAuth();
  }, [setUser]);

  const handleAuth = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    const validRegex = /^[a-zA-Z0-9_-]{4,}$/;
    if (!validRegex.test(username)) {
      setError('아이디는 영문, 숫자, 특수문자(_-) 포함 4자 이상이어야 합니다.');
      setSubmitting(false);
      return;
    }
    if (password.length < 4) {
      setError('비밀번호는 4자 이상이어야 합니다.');
      setSubmitting(false);
      return;
    }

    try {
      let res;
      if (isLogin) {
        res = await api.auth.login(username, password);
      } else {
        res = await api.auth.register(username, password);
      }

      if (res && res.token && res.user) {
        tokenStorage.set(res.token);
        setUser(res.user);
      }
    } catch (err) {
      setError(err.message || '인증 처리 중 오류가 발생했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = () => {
    tokenStorage.remove();
    setUser(null);
  };

  if (loading && !currentUserId) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  if (!currentUserId) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 p-4">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-8 space-y-6">
          <div className="text-center space-y-2">
            <div className="inline-flex p-3 rounded-2xl bg-emerald-50 text-emerald-600 mb-1">
              <Sparkles className="w-6 h-6" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">{isLogin ? '로그인' : '회원가입'}</h1>
            <p className="text-gray-500 text-sm">
              {isLogin
                ? '실제 데이터베이스와 실시간 동기화되는 습관 트래커입니다.'
                : '새로운 계정을 생성하고 나만의 습관을 관리해보세요.'}
            </p>
          </div>

          <form onSubmit={handleAuth} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-600 uppercase ml-1">아이디</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-emerald-50 focus:border-emerald-400 transition-all outline-none"
                  placeholder="영문/숫자 4자 이상"
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-600 uppercase ml-1">비밀번호</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-emerald-50 focus:border-emerald-400 transition-all outline-none"
                  placeholder="4자 이상"
                  required
                />
              </div>
            </div>

            {error && (
              <p className="text-red-500 text-xs text-center font-medium bg-red-50 py-2 rounded-xl border border-red-100">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-4 bg-emerald-500 text-white font-bold rounded-2xl shadow-lg shadow-emerald-200 hover:bg-emerald-600 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              {submitting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : isLogin ? (
                <>
                  로그인 <LogIn size={18} />
                </>
              ) : (
                <>
                  회원가입 <UserPlus size={18} />
                </>
              )}
            </button>
          </form>

          <div className="text-center pt-2">
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setError('');
              }}
              className="text-sm text-gray-500 hover:text-emerald-500 font-medium transition-colors"
            >
              {isLogin ? '계정이 없으신가요? 회원가입' : '이미 계정이 있으신가요? 로그인'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const displayName = currentUser?.username || '사용자';

  return (
    <>
      <div className="fixed top-4 right-4 z-50 flex items-center gap-2">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-white/90 backdrop-blur rounded-full border border-gray-200 shadow-sm text-xs font-semibold text-gray-700">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>{displayName}</span>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-full shadow-sm border border-gray-200 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors"
        >
          로그아웃 <LogOut size={14} />
        </button>
      </div>
      {children}
    </>
  );
}
