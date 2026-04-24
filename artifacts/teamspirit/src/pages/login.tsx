import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { useQueryClient } from '@tanstack/react-query';
import { api, ApiError } from '@/lib/api';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const GOOGLE_CLIENT_ID = "123456789-dummy-client-id.apps.googleusercontent.com"; // Should be in env

export default function Login() {
  const [, setLoc] = useLocation();
  const qc = useQueryClient();
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleGoogleSuccess = async (credentialResponse: any) => {
    setErr(null);
    setLoading(true);
    try {
      await api('/auth/google', {
        method: 'POST',
        body: JSON.stringify({ credential: credentialResponse.credential }),
      });
      await qc.invalidateQueries();
      setLoc('/dashboard');
    } catch (e: any) {
      if (e instanceof ApiError) setErr(e.body?.error ?? 'Google 登入失敗');
      else setErr(e?.message ?? 'Google 登入失敗');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setErr(null);
    setLoading(true);
    try {
      await api('/auth/demo', { method: 'POST' });
      await qc.invalidateQueries();
      setLoc('/dashboard');
    } catch (e: any) {
      setErr('測試登入失敗');
    } finally {
      setLoading(false);
    }
  };

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <div className="min-h-screen flex items-center justify-center bg-zinc-950 p-4">
        <Card className="w-full max-w-md bg-zinc-900 border-zinc-800">
          <CardHeader className="text-center pb-8 pt-10">
            <CardTitle className="text-4xl font-display font-bold uppercase tracking-tight text-white mb-2">
              TEAMSPIRIT
            </CardTitle>
            <CardDescription className="text-base text-zinc-400">
              請使用 Google 帳號登入或註冊
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pb-10 flex flex-col items-center">
            {err && (
              <div className="text-sm text-red-400 bg-red-950/30 px-4 py-2 rounded-md border border-red-900/50 w-full text-center">
                {err}
              </div>
            )}
            
            <div className="w-full flex justify-center mt-2">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => setErr('Google 登入發生錯誤')}
                theme="filled_black"
                shape="rectangular"
                size="large"
                text="continue_with"
                width="300"
              />
            </div>
            
            <div className="w-full max-w-[300px] mt-4 relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-zinc-800" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-zinc-900 px-2 text-zinc-500">開發測試專用</span>
              </div>
            </div>

            <Button 
              variant="outline" 
              className="w-full max-w-[300px] mt-4" 
              onClick={handleDemoLogin}
              disabled={loading}
            >
              一鍵登入 (Demo User)
            </Button>
            
            <p className="text-xs text-zinc-600 text-center max-w-[280px] mt-4">
              登入即表示您同意我們的服務條款與隱私權政策。
            </p>
          </CardContent>
        </Card>
      </div>
    </GoogleOAuthProvider>
  );
}