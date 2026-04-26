import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { useQueryClient } from '@tanstack/react-query';
import { useGoogleLogin } from '@react-oauth/google';
import { api, ApiError } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FaGoogle } from 'react-icons/fa'; // Assuming react-icons is installed

export default function Login() {
  const [, setLoc] = useLocation();
  const qc = useQueryClient();
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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

  const handleTestLogin = async () => {
    setErr(null);
    setLoading(true);
    try {
      const response = await api('/auth/test-login', {
        method: 'POST',
      });
      console.log("Test login response:", response);
      try {
        await qc.invalidateQueries();
      } catch (qErr) {
        console.error("Invalidate queries error:", qErr);
      }
      setLoc('/dashboard');
    } catch (e: any) {
      console.error("Test login error:", e, e.body);
      const errMsg = e instanceof ApiError 
        ? (e.body?.error ?? `API Error ${e.status}: ${JSON.stringify(e.body)}`)
        : (e?.message ?? '測試登入失敗');
      setErr(`登入錯誤: ${errMsg}`);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 p-4">
      <Card className="w-full max-w-md bg-zinc-900 border-zinc-800">
        <CardHeader className="text-center pb-2">
          <CardTitle className="text-3xl font-bold tracking-tighter text-white mb-2">TEAMSPIRIT</CardTitle>
          <CardDescription className="text-zinc-400">
            請使用 Google 帳號登入或註冊
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          <div className="flex flex-col space-y-4">
            <Button
              variant="outline"
              className="w-full h-12 flex items-center justify-center gap-3 bg-white text-zinc-900 hover:bg-zinc-100 hover:text-zinc-900 border-0 transition-all duration-200"
              onClick={handleGoogleLogin}
              disabled={loading}
              data-testid="button-google-login"
            >
              <FaGoogle className="w-5 h-5 text-red-500" />
              <span className="font-semibold text-base">{loading ? '處理中...' : '使用 Google 帳號登入'}</span>
            </Button>
            
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-zinc-700" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-zinc-900 px-2 text-zinc-500">或</span>
              </div>
            </div>

            <Button
              variant="secondary"
              className="w-full h-12 flex items-center justify-center gap-3 bg-zinc-800 text-white hover:bg-zinc-700 border-0 transition-all duration-200"
              onClick={handleTestLogin}
              disabled={loading}
              data-testid="button-test-login"
            >
              <span className="font-semibold text-base">{loading ? '處理中...' : '開發測試登入 (無需密碼)'}</span>
            </Button>
            
            {err && (
              <div className="p-3 text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-md text-center">
                {err}
              </div>
            )}
          </div>
          
          <p className="text-xs text-zinc-500 text-center px-4">
            登入即代表您同意我們的服務條款與隱私權政策。
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
