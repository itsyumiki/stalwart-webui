/*
 * SPDX-FileCopyrightText: 2020 Stalwart Labs LLC <hello@stalw.art>
 *
 * SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-SEL
 */

import { type FormEvent, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowRight, Loader2 } from 'lucide-react';

import Logo from '@/components/common/Logo';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { getFixedDiscoveryAddress, startAuthFlow, startSsoFlow } from '@/services/auth/oauth';

export default function LoginPage() {
  const { t } = useTranslation();
  const location = useLocation();
  const originalPath = (location.state as { from?: string } | null)?.from ?? null;
  const [username, setUsername] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  // SSO-only when a discovery address is built in. `?manual=1` brings back the
  // account-name form as a break-glass path if the SSO provider is unavailable.
  const manual = new URLSearchParams(location.search).get('manual') === '1';
  const ssoOnly = getFixedDiscoveryAddress() !== '' && !manual;

  useDocumentTitle(t('login.title', 'Sign in'));

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = username.trim();
    if (!ssoOnly && !trimmed) return;

    setError(null);
    setLoading(true);

    try {
      if (ssoOnly) {
        await startSsoFlow(originalPath);
      } else {
        await startAuthFlow(trimmed, originalPath);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t('login.error', 'An unexpected error occurred'));
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-content-background px-4">
      <Card className="w-full max-w-sm shadow-sm">
        <CardHeader className="items-center text-center">
          <Logo />
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {!ssoOnly && (
              <div className="space-y-2">
                <p className="text-center text-sm text-muted-foreground">
                  {t('login.prompt', 'Enter your account name to continue')}
                </p>
                <Input
                  id="username"
                  type="text"
                  autoComplete="username"
                  autoFocus
                  placeholder={t('login.usernamePlaceholder', 'user@example.com')}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={loading}
                  aria-label={t('login.prompt', 'Enter your account name to continue')}
                />
              </div>
            )}

            {error && (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            )}

            <Button
              type="submit"
              className="w-full"
              autoFocus={ssoOnly}
              disabled={loading || (!ssoOnly && !username.trim())}
            >
              {loading ? (
                <Loader2 className="animate-spin" />
              ) : (
                <>
                  {ssoOnly ? t('login.sso', 'Sign in with SSO') : t('login.continue', 'Continue')}
                  <ArrowRight />
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
