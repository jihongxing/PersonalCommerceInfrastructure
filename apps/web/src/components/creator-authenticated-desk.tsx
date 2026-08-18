'use client';

import { useEffect, useState } from 'react';

import { loadWebAuthConfiguration } from '../configuration/auth';
import { creatorAuthCopy } from '../content/user-facing-copy';
import {
  createSupabaseSessionProvider,
  type AuthSession,
  type AuthSessionProvider,
} from '../lib/auth/session';
import { Button } from './ui/button';
import { FormField } from './ui/form-field';
import { Input } from './ui/input';
import { StatusMessage } from './ui/status-message';
import { Surface } from './ui/surface';
import { CreatorIdentityWorkspace } from './creator-identity-workspace';
import { CreatorEarningsWorkspace } from './creator-earnings-workspace';
import { CreatorReservationWorkspace } from './creator-reservation-workspace';
import { CreatorContractWorkspace } from './creator-contract-workspace';
import { PatternNavigation } from './pattern-navigation';

export function CreatorAuthenticatedDesk() {
  const [sessionProvider, setSessionProvider] = useState<AuthSessionProvider | null>(null);
  const [configurationReady, setConfigurationReady] = useState(false);
  const [session, setSession] = useState<AuthSession | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<'sign-in' | 'sign-up'>('sign-in');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    try {
      setSessionProvider(
        createSupabaseSessionProvider(
          { ...loadWebAuthConfiguration(), authBaseUrl: '/api/auth' },
          window.localStorage,
        ),
      );
    } catch {
      setConfigurationReady(true);
    }
  }, []);

  useEffect(() => {
    if (sessionProvider === null) {
      return;
    }
    setConfigurationReady(true);
    setSession(sessionProvider.getSession());
    return sessionProvider.subscribe(setSession);
  }, [sessionProvider]);

  async function submit(): Promise<void> {
    if (sessionProvider === null || email.trim().length === 0 || password.length === 0) {
      return;
    }
    setBusy(true);
    setMessage('');
    try {
      if (mode === 'sign-in') {
        await sessionProvider.signIn(email.trim(), password);
        setMessage(creatorAuthCopy.signedIn);
      } else {
        const nextSession = await sessionProvider.signUp(email.trim(), password);
        setMessage(nextSession === null ? creatorAuthCopy.confirmEmail : creatorAuthCopy.signedUp);
      }
      setPassword('');
    } catch {
      setMessage(creatorAuthCopy.failed);
    } finally {
      setBusy(false);
    }
  }

  if (!configurationReady) {
    return <StatusMessage>{creatorAuthCopy.initializing}</StatusMessage>;
  }

  if (sessionProvider === null) {
    return <StatusMessage>{creatorAuthCopy.configurationMissing}</StatusMessage>;
  }

  if (session === null) {
    return (
      <main className="ds-workspace-page ds-page">
        <Surface className="ds-page__surface" tone="raised">
          <p className="ds-eyebrow">{creatorAuthCopy.eyebrow}</p>
          <h1 className="ds-heading-page">{creatorAuthCopy.title}</h1>
          <p className="ds-body-secondary ds-measure">{creatorAuthCopy.description}</p>
          <div className="ds-section-stack">
            <FormField htmlFor="creator-email" label={creatorAuthCopy.emailLabel}>
              <Input
                id="creator-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </FormField>
            <FormField htmlFor="creator-password" label={creatorAuthCopy.passwordLabel}>
              <Input
                id="creator-password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </FormField>
          </div>
          <div className="ds-action-row ds-section-stack">
            <Button disabled={busy} onClick={() => void submit()} type="button">
              {mode === 'sign-in' ? creatorAuthCopy.signIn : creatorAuthCopy.signUp}
            </Button>
            <Button
              onClick={() => setMode(mode === 'sign-in' ? 'sign-up' : 'sign-in')}
              type="button"
              variant="outline"
            >
              {mode === 'sign-in' ? creatorAuthCopy.switchToSignUp : creatorAuthCopy.switchToSignIn}
            </Button>
          </div>
          {message.length !== 0 ? <StatusMessage>{message}</StatusMessage> : null}
        </Surface>
      </main>
    );
  }

  return (
    <div className="ds-workspace-page ds-page">
      <PatternNavigation audience="creator" />
      <CreatorIdentityWorkspace
        accessTokenProvider={sessionProvider}
        userEmail={session.userEmail}
        onSignOut={() => void sessionProvider.signOut()}
      />
      <CreatorEarningsWorkspace accessTokenProvider={sessionProvider} />
      <CreatorReservationWorkspace accessTokenProvider={sessionProvider} />
      <CreatorContractWorkspace accessTokenProvider={sessionProvider} />
    </div>
  );
}
