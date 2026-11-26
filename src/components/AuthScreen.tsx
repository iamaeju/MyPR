import { useState, type FormEvent } from 'react';
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import { toKoreanAuthError } from '../utils/authErrors';
import { MyPRLogo } from './MyPRLogo';

type Mode = 'login' | 'signup';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function AuthScreen() {
  const [mode, setMode] = useState<Mode>('login');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(
    isSupabaseConfigured
      ? null
      : '로그인 서버 설정이 빠져 있어요. 관리자에게 문의해주세요. (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY 누락)'
  );
  const [notice, setNotice] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isSignup = mode === 'signup';

  const switchMode = (next: Mode) => {
    setMode(next);
    setNotice(null);
    if (isSupabaseConfigured) setError(null);
  };

  const validate = (): string | null => {
    if (isSignup) {
      const name = username.trim();
      if (name.length < 2 || name.length > 20) return '사용자명은 2~20자로 입력해주세요.';
    }
    if (!EMAIL_PATTERN.test(email.trim())) return '이메일 형식이 올바르지 않아요.';
    if (password.length < 6) return '비밀번호는 6자 이상이어야 해요.';
    return null;
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (isSubmitting) return;
    setNotice(null);

    if (!supabase) return;

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    setIsSubmitting(true);
    try {
      if (isSignup) {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: { username: username.trim() },
            emailRedirectTo: window.location.origin,
          },
        });
        if (signUpError) throw signUpError;

        // Supabase returns a user with no identities when the email is already taken
        // (and email confirmation is on), instead of an error.
        if (data.user && data.user.identities && data.user.identities.length === 0) {
          setError('이미 가입된 이메일이에요. 로그인해주세요.');
          return;
        }
        if (!data.session) {
          setNotice(
            `${email.trim()} 으로 인증 메일을 보냈어요. 메일의 링크를 누른 뒤 로그인해주세요.`
          );
          setPassword('');
          setMode('login');
        }
        // With a session, AuthGate switches to the app automatically.
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (signInError) throw signInError;
      }
    } catch (err) {
      setError(toKoreanAuthError(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass =
    'w-full h-[52px] rounded-2xl bg-[#2A2A33] border border-[#3D3D47] px-4 text-[16px] text-white placeholder:text-[#6B6B76] ' +
    'focus:outline-none focus:border-[#8E8EA0] focus:ring-2 focus:ring-white/10 transition-colors ' +
    '[&:-webkit-autofill]:[-webkit-text-fill-color:#fff] [&:-webkit-autofill]:[box-shadow:0_0_0_1000px_#2A2A33_inset]';
  const labelClass = 'block text-[14px] font-medium text-[#B4B4C0] mb-2';

  return (
    <div className="min-h-[100dvh] w-full bg-gradient-to-b from-[#1B1B22] to-[#24242D] text-white flex items-center justify-center px-5 py-10">
      <div className="w-full max-w-[400px]">
        <div className="flex flex-col items-center mb-8">
          <div className="flex items-center gap-2.5">
            <MyPRLogo className="h-9 w-auto text-white" />
            <span className="text-[24px] font-bold tracking-[-0.03em]">MyPR</span>
          </div>
          <h1 className="mt-6 text-[26px] font-bold tracking-[-0.03em]">
            {isSignup ? '회원가입' : '로그인'}
          </h1>
          <p className="mt-1.5 text-[14px] text-[#9A9AA6]">
            {isSignup ? '나를 표현하는 카드를 만들어보세요.' : '다시 오신 걸 환영해요.'}
          </p>
        </div>

        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
          {isSignup && (
            <div>
              <label htmlFor="auth-username" className={labelClass}>
                사용자명
              </label>
              <input
                id="auth-username"
                type="text"
                autoComplete="nickname"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="2~20자"
                className={inputClass}
              />
            </div>
          )}

          <div>
            <label htmlFor="auth-email" className={labelClass}>
              이메일
            </label>
            <input
              id="auth-email"
              type="email"
              inputMode="email"
              autoComplete="email"
              autoCapitalize="none"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="auth-password" className={labelClass}>
              비밀번호
            </label>
            <input
              id="auth-password"
              type="password"
              autoComplete={isSignup ? 'new-password' : 'current-password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="6자 이상"
              className={inputClass}
            />
          </div>

          {error && (
            <div
              role="alert"
              className="flex items-start gap-2.5 rounded-2xl border border-[#7A3B42] bg-[#3F262B] px-4 py-3.5 text-[14px] leading-relaxed text-[#FFB4BC]"
            >
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" />
              <span>{error}</span>
            </div>
          )}

          {notice && (
            <div
              role="status"
              className="flex items-start gap-2.5 rounded-2xl border border-[#2F6B4C] bg-[#1F3A2C] px-4 py-3.5 text-[14px] leading-relaxed text-[#A6F0C6]"
            >
              <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" />
              <span>{notice}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting || !isSupabaseConfigured}
            className="mt-1 h-[54px] rounded-2xl bg-white text-[#111111] text-[16px] font-bold tracking-[-0.01em] inline-flex items-center justify-center gap-2 hover:bg-[#EDEDED] active:scale-[0.99] transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />}
            {isSignup ? '회원가입' : '로그인'}
          </button>
        </form>

        <p className="mt-7 text-center text-[14px] text-[#9A9AA6]">
          {isSignup ? '이미 계정이 있으신가요? ' : '아직 계정이 없으신가요? '}
          <button
            type="button"
            onClick={() => switchMode(isSignup ? 'login' : 'signup')}
            className="font-semibold text-[#9DB2FF] underline underline-offset-4 hover:text-white cursor-pointer"
          >
            {isSignup ? '로그인' : '회원가입'}
          </button>
        </p>
      </div>
    </div>
  );
}
