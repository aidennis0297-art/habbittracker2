import React, { useState, useEffect } from 'react';
import { auth, signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, signOut, getMockEmail } from '../lib/firebase';
import { useHabitStore } from '../store/useHabitStore';
import { User, Lock, LogIn, UserPlus, LogOut, Loader2 } from 'lucide-react';

export default function Auth({ children }) {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  
  const { currentUserId, setUser } = useHabitStore();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUser(user.uid);
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [setUser]);

  const handleAuth = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    // Validation
    const validRegex = /^[a-zA-Z0-9]{4,}$/;
    if (!validRegex.test(username)) {
      setError("아이디는 영문/숫자 4자 이상이어야 합니다.");
      setLoading(false);
      return;
    }
    if (!validRegex.test(password)) {
      setError("비밀번호는 영문/숫자 4자 이상이어야 합니다.");
      setLoading(false);
      return;
    }

    try {
      const email = getMockEmail(username);
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
    } catch (err) {
      console.error(err);
      if (err.code === 'auth/email-already-in-use') setError("이미 존재하는 아이디입니다.");
      else if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') setError("아이디 또는 비밀번호가 잘못되었습니다.");
      else setError("인증 오류: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    signOut(auth);
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
            <h1 className="text-3xl font-bold text-gray-900">{isLogin ? '로그인' : '회원가입'}</h1>
            <p className="text-gray-500 text-sm">
              {isLogin ? '습관 데이터를 동기화하려면 로그인하세요' : '새로운 계정을 생성하세요'}
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
                  placeholder="영문/숫자 4자 이상"
                />
              </div>
            </div>

            {error && <p className="text-red-500 text-xs text-center font-medium bg-red-50 py-2 rounded-xl border border-red-100">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-emerald-500 text-white font-bold rounded-2xl shadow-lg shadow-emerald-200 hover:bg-emerald-600 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : isLogin ? (
                <>로그인 <LogIn size={18} /></>
              ) : (
                <>회원가입 <UserPlus size={18} /></>
              )}
            </button>
          </form>

          <div className="text-center pt-2">
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm text-gray-500 hover:text-emerald-500 font-medium transition-colors"
            >
              {isLogin ? '계정이 없으신가요? 회원가입' : '이미 계정이 있으신가요? 로그인'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="fixed top-4 right-4 z-50">
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-sm border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
        >
          로그아웃 <LogOut size={16} />
        </button>
      </div>
      {children}
    </>
  );
}
