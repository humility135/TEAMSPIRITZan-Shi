import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { useQueryClient } from '@tanstack/react-query';
import { api, ApiError } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function Login() {
  const [, setLoc] = useLocation();
  const qc = useQueryClient();
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [hint, setHint] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const requestOtp = async () => {
    setErr(null); setLoading(true);
    try {
      const r = await api<{ ok: boolean; hint?: string }>('/auth/request-otp', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });
      setHint(r.hint ?? null);
      setStep('otp');
    } catch (e: any) {
      setErr(e?.message ?? '發送失敗');
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async () => {
    setErr(null); setLoading(true);
    try {
      await api('/auth/verify-otp', {
        method: 'POST',
        body: JSON.stringify({ email, code, name: name.trim() || undefined }),
      });
      await qc.invalidateQueries();
      setLoc('/dashboard');
    } catch (e: any) {
      if (e instanceof ApiError) setErr(e.body?.error ?? '驗證失敗');
      else setErr(e?.message ?? '驗證失敗');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 p-4">
      <Card className="w-full max-w-md bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-2xl">TEAMSPIRIT</CardTitle>
          <CardDescription>
            {step === 'email' ? '輸入 Email 登入或註冊' : '輸入收到嘅驗證碼'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {step === 'email' ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  inputMode="email"
                  placeholder="例如 player@example.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  data-testid="input-email"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">名稱（選填，新用戶用）</Label>
                <Input
                  id="name"
                  placeholder="球員名稱"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  data-testid="input-name"
                />
              </div>
              {err && <div className="text-sm text-red-400">{err}</div>}
              <Button
                className="w-full"
                disabled={!email || loading}
                onClick={requestOtp}
                data-testid="button-request-otp"
              >
                {loading ? '發送中…' : '發送驗證碼'}
              </Button>
              <p className="text-xs text-zinc-500 text-center">
                示範模式：驗證碼固定為 123456
              </p>
            </>
          ) : (
            <>
              {hint && (
                <div className="rounded-md bg-zinc-800 px-3 py-2 text-sm text-zinc-300">
                  {hint}
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="code">驗證碼</Label>
                <Input
                  id="code"
                  inputMode="numeric"
                  placeholder="123456"
                  value={code}
                  onChange={e => setCode(e.target.value)}
                  data-testid="input-otp"
                />
              </div>
              {err && <div className="text-sm text-red-400">{err}</div>}
              <Button
                className="w-full"
                disabled={!code || loading}
                onClick={verifyOtp}
                data-testid="button-verify-otp"
              >
                {loading ? '驗證中…' : '登入'}
              </Button>
              <Button
                variant="ghost"
                className="w-full"
                onClick={() => { setStep('email'); setCode(''); setErr(null); }}
              >
                返回
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
