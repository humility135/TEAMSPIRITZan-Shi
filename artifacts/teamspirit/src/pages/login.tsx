import React, { useState } from 'react';
import { useLocation, Link } from 'wouter';
import { useQueryClient } from '@tanstack/react-query';
import { useGoogleLogin } from '@react-oauth/google';
import { api, ApiError } from '@/lib/api';
import { useI18n } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FaGoogle, FaPhoneAlt } from 'react-icons/fa';
import { LuShieldCheck } from 'react-icons/lu';

export default function Login() {
  const [, setLoc] = useLocation();
  const qc = useQueryClient();
  const { t, lang, setLang } = useI18n();
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Phone Login State
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');

  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setErr(null);
      setLoading(true);
      try {
        await api('/auth/google', {
          method: 'POST',
          body: JSON.stringify({ token: tokenResponse.access_token }),
        });
        await qc.invalidateQueries();
        setLoc('/dashboard');
      } catch (e: any) {
        if (e instanceof ApiError) setErr(e.body?.error ?? t('loginFailed'));
        else setErr(e?.message ?? t('loginFailed'));
        setLoading(false);
      }
    },
    onError: (error) => {
      setErr(t('loginGoogleFailed'));
      console.error('Google login failed:', error);
    },
  });

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || phone.length < 8) {
      setErr(t('loginPhoneInvalid'));
      return;
    }
    setErr(null);
    setLoading(true);
    try {
      await api('/auth/request-otp', {
        method: 'POST',
        body: JSON.stringify({ phone }),
      });
      setStep('otp');
      setLoading(false);
    } catch (e: any) {
      const errMsg = e instanceof ApiError ? (e.body?.error ?? t('loginSendFailed')) : (e?.message ?? t('loginSendFailed'));
      setErr(errMsg);
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp || otp.length < 4) {
      setErr(t('loginOtpInvalid'));
      return;
    }
    setErr(null);
    setLoading(true);
    try {
      await api('/auth/verify-otp', {
        method: 'POST',
        body: JSON.stringify({ phone, code: otp }),
      });
      await qc.invalidateQueries();
      setLoc('/dashboard');
    } catch (e: any) {
      const errMsg = e instanceof ApiError ? (e.body?.error ?? t('loginVerifyFailed')) : (e?.message ?? t('loginVerifyFailed'));
      setErr(errMsg);
      setLoading(false);
    }
  };

  const handleTestLogin = async () => {
    setErr(null);
    setLoading(true);
    try {
      await api('/auth/test-login', {
        method: 'POST',
      });
      await qc.invalidateQueries();
      setLoc('/dashboard');
    } catch (e: any) {
      console.error("Test login error:", e);
      const errMsg = e instanceof ApiError
        ? (e.body?.error ?? `API Error ${e.status}`)
        : (e?.message ?? t('loginTestFailed'));
      setErr(`${t('loginErrorPrefix')}${errMsg}`);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 p-4 font-sans relative">
      <div className="absolute top-4 right-4">
        <Button variant="ghost" size="sm" className="font-bold tracking-wide uppercase text-zinc-400 hover:text-white" onClick={() => setLang(lang === 'zh' ? 'en' : 'zh')}>
          {lang === 'zh' ? 'EN' : '中'}
        </Button>
      </div>
      <Card className="w-full max-w-md bg-zinc-900 border-zinc-800 shadow-2xl">
        <CardHeader className="text-center pb-2">
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 bg-lime-500 rounded-xl flex items-center justify-center shadow-lg shadow-lime-500/20">
              <span className="text-zinc-950 font-black text-2xl">T</span>
            </div>
          </div>
          <CardTitle className="text-3xl font-bold tracking-tighter text-white mb-2">{t('loginTitle')}</CardTitle>
          <CardDescription className="text-zinc-400">
            {step === 'phone' ? t('loginPhoneStepDesc') : t('loginOtpStepDesc')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          <div className="flex flex-col space-y-4">

            {step === 'phone' ? (
              <form onSubmit={handleRequestOtp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-zinc-400 ml-1">{t('loginPhoneLabel')}</Label>
                  <div className="relative">
                    <FaPhoneAlt className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 w-4 h-4" />
                    <Input
                      id="phone"
                      type="tel"
                      placeholder={t('loginPhonePlaceholder')}
                      className="pl-10 bg-zinc-800 border-zinc-700 text-white focus:ring-lime-500/20 focus:border-lime-500 h-12 text-lg"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      disabled={loading}
                    />
                  </div>
                </div>
                <Button
                  type="submit"
                  className="w-full h-12 bg-lime-500 text-zinc-950 hover:bg-lime-400 font-bold text-base transition-all active:scale-[0.98]"
                  disabled={loading}
                >
                  {loading ? t('loginSending') : t('loginSendOtp')}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="otp" className="text-zinc-400 ml-1">{t('loginOtpLabel')}</Label>
                  <div className="relative">
                    <LuShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 w-5 h-5" />
                    <Input
                      id="otp"
                      type="text"
                      placeholder={t('loginOtpPlaceholder')}
                      className="pl-10 bg-zinc-800 border-zinc-700 text-white focus:ring-lime-500/20 focus:border-lime-500 h-12 text-lg tracking-[0.5em] font-mono"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      disabled={loading}
                      maxLength={6}
                      autoFocus
                    />
                  </div>
                </div>
                <Button
                  type="submit"
                  className="w-full h-12 bg-lime-500 text-zinc-950 hover:bg-lime-400 font-bold text-base transition-all active:scale-[0.98]"
                  disabled={loading}
                >
                  {loading ? t('loginVerifying') : t('loginVerify')}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full text-zinc-500 hover:text-white hover:bg-transparent"
                  onClick={() => setStep('phone')}
                  disabled={loading}
                >
                  {t('loginChangePhone')}
                </Button>
              </form>
            )}

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-zinc-800" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-zinc-900 px-2 text-zinc-500">{t('loginOtherMethods')}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                className="h-12 bg-white text-zinc-900 hover:bg-zinc-100 border-0 transition-all"
                onClick={() => handleGoogleLogin()}
                disabled={loading}
              >
                <FaGoogle className="w-4 h-4 mr-2 text-red-500" />
                Google
              </Button>

              <Button
                variant="secondary"
                className="h-12 bg-zinc-800 text-white hover:bg-zinc-700 border-0 transition-all"
                onClick={handleTestLogin}
                disabled={loading}
              >
                {t('loginTest')}
              </Button>
            </div>

            {err && (
              <div className="p-3 text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-xl text-center animate-in fade-in zoom-in duration-300">
                {err}
              </div>
            )}
          </div>

          <p className="text-[10px] text-zinc-600 text-center px-4 leading-relaxed mt-4">
            {t('loginFooter')}<Link href="/terms"><span className="text-zinc-500 underline cursor-pointer mx-1">{t('loginFooterService')}</span></Link>{t('loginFooterAnd')}<Link href="/terms"><span className="text-zinc-500 underline cursor-pointer mx-1">{t('loginFooterPrivacy')}</span></Link>{t('loginFooterSuffix')}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
