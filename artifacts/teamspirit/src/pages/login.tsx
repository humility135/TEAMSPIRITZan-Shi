import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { useQueryClient } from '@tanstack/react-query';
import { api, ApiError } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || 'dummy-client-id.apps.googleusercontent.com';

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
      setLoc('/');
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
      await api('/auth/demo', {
        method: 'POST',
      });
      await qc.invalidateQueries();
      setLoc('/');
    } catch (e: any) {
      if (e instanceof ApiError) setErr(e.body?.error ?? '測試登入失敗');
      else setErr(e?.message ?? '測試登入失敗');
    } finally {
      setLoading(false);
    }
  };

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <div className="min-h-screen flex items-center justify-center bg-zinc-950 p-4">
        <Card className="w-full max-w-md bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-2xl text-center font-display tracking-wider text-primary">TEAMSPIRIT</CardTitle>
            <CardDescription className="text-center">
              使用 Google 帳戶登入或註冊
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {err && <div className="text-sm text-red-400 text-center">{err}</div>}
            
            <div className="flex justify-center">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => {
                  setErr('Google 登入發生錯誤');
                }}
                useOneTap
              />
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-zinc-800" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-zinc-900 px-2 text-zinc-500">或者</span>
              </div>
            </div>

            <Button
              variant="outline"
              className="w-full border-zinc-700 text-zinc-300 hover:bg-zinc-800"
              disabled={loading}
              onClick={handleDemoLogin}
              data-testid="button-demo-login"
            >
              {loading ? '登入中…' : '示範帳戶登入'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </GoogleOAuthProvider>
  );
}
