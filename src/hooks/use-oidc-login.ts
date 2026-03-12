import { Env } from '@env';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { useEffect, useState } from 'react';

// Required for iOS to properly close the in-app browser after the redirect
WebBrowser.maybeCompleteAuthSession();

export interface OidcLoginHook {
  request: AuthSession.AuthRequest | null;
  response: AuthSession.AuthSessionResult | null;
  promptAsync: (options?: AuthSession.AuthRequestPromptOptions) => Promise<AuthSession.AuthSessionResult>;
  redirectUri: string;
  discovery: AuthSession.DiscoveryDocument | null;
}

export function useOidcLogin(authority: string | null, clientId: string | null): OidcLoginHook {
  const redirectUri = AuthSession.makeRedirectUri({
    scheme: Env.SCHEME,
    path: 'auth/callback',
  });

  const isValidAuthority = typeof authority === 'string' && authority.startsWith('https://') && authority.length > 8;
  const isValidClientId = typeof clientId === 'string' && clientId.length > 0;

  // Manage discovery manually so we can null-guard before fetching, which avoids
  // invariant failures inside useAutoDiscovery when authority is null or empty.
  const [discovery, setDiscovery] = useState<AuthSession.DiscoveryDocument | null>(null);
  useEffect(() => {
    if (!isValidAuthority || !authority) {
      setDiscovery(null);
      return;
    }
    let cancelled = false;
    AuthSession.resolveDiscoveryAsync(authority)
      .then((doc) => {
        if (!cancelled) setDiscovery(doc);
      })
      .catch(() => {
        if (!cancelled) setDiscovery(null);
      });
    return () => {
      cancelled = true;
    };
  }, [isValidAuthority, authority]);

  // Always provide a valid AuthRequestConfig; useAuthRequest is guarded by
  // passing null discovery when the credentials are not yet available.
  const [request, response, promptAsync] = AuthSession.useAuthRequest(
    {
      clientId: clientId ?? '',
      redirectUri,
      scopes: ['openid', 'email', 'profile', 'offline_access'],
      usePKCE: true,
      responseType: AuthSession.ResponseType.Code,
    },
    isValidAuthority && isValidClientId ? discovery : null
  );

  return {
    request,
    response,
    promptAsync,
    redirectUri,
    discovery,
  };
}
