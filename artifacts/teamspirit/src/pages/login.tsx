import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { useQueryClient } from '@tanstack/react-query';
import { useGoogleLogin } from '@react-oauth/google';
import { api, ApiError } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FaGoogle, FaPhoneAlt } from 'react-icons/fa';
import { LuShieldCheck } from 'react-icons/lu';

export default function Login() {
  const [, setLoc] = useLocation();
  const qc = useQueryClient();
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
        if (e instanceof ApiError) setErr(e.body?.error ?? '登入失敗');
        else setErr(e?.message ?? '登入失敗');
        setLoading(false);
      }
    },
    onError: (error) => {
      setErr('Google 登入失敗');
      console.error('Google login failed:', error);
    },
  });

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || phone.length < 8) {
      setErr('請輸入有效的電話號碼');
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
      const errMsg = e instanceof ApiError ? (e.body?.error ?? '傳送失敗') : (e?.message ?? '傳送失敗');
      setErr(errMsg);
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp || otp.length < 4) {
      setErr('請輸入有效的驗證碼');
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
      const errMsg = e instanceof ApiError ? (e.body?.error ?? '驗證失敗') : (e?.message ?? '驗證失敗');
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
        : (e?.message ?? '測試登入失敗');
      setErr(`登入錯誤: ${errMsg}`);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 p-4 font-sans">
      <Card className="w-full max-w-md bg-zinc-900 border-zinc-800 shadow-2xl">
        <CardHeader className="text-center pb-2">
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 bg-lime-500 rounded-xl flex items-center justify-center shadow-lg shadow-lime-500/20">
              <span className="text-zinc-950 font-black text-2xl">T</span>
            </div>
          </div>
          <CardTitle className="text-3xl font-bold tracking-tighter text-white mb-2">TEAMSPIRIT</CardTitle>
          <CardDescription className="text-zinc-400">
            {step === 'phone' ? '請輸入您的電話號碼登入或註冊' : '請輸入傳送到您手機的 6 位驗證碼'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          <div className="flex flex-col space-y-4">
            
            {step === 'phone' ? (
              <form onSubmit={handleRequestOtp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-zinc-400 ml-1">電話號碼</Label>
                  <div className="relative">
                    <FaPhoneAlt className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 w-4 h-4" />
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="9123 4567"
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
                  {loading ? '傳送中...' : '傳送驗證碼'}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="otp" className="text-zinc-400 ml-1">驗證碼 (測試用: 123456)</Label>
                  <div className="relative">
                    <LuShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 w-5 h-5" />
                    <Input
                      id="otp"
                      type="text"
                      placeholder="123456"
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
                  {loading ? '驗證中...' : '驗證並登入'}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full text-zinc-500 hover:text-white hover:bg-transparent"
                  onClick={() => setStep('phone')}
                  disabled={loading}
                >
                  修改電話號碼
                </Button>
              </form>
            )}

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-zinc-800" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-zinc-900 px-2 text-zinc-500">其他登入方式</span>
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
                測試登入
              </Button>
            </div>
            
            {err && (
              <div className="p-3 text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-xl text-center animate-in fade-in zoom-in duration-300">
                {err}
              </div>
            )}
          </div>
          
          <p className="text-[10px] text-zinc-600 text-center px-4 leading-relaxed mt-4">
            登入即代表您同意我們的<span className="text-zinc-500 underline cursor-pointer mx-1">服務條款</span>與<span className="text-zinc-500 underline cursor-pointer mx-1">隱私權政策</span>。
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
