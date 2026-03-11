import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { Env } from '@env';

// Required for iOS to properly close the in-app browser after the redirect
WebBrowser.maybeCompleteAuthSession();

export interface OidcLoginHook {
  request: AuthSession.AuthRequest | null;
  response: AuthSession.AuthSessionResult | null;
  promptAsync: (options?: AuthSession.AuthRequestPromptOptions) => Promise<AuthSession.AuthSessionResult>;
  redirectUri: string;
  discovery: AuthSession.DiscoveryDocument | null;
}

export function useOidcLogin(
  authority: string | null,
  clientId: string | null,
): OidcLoginHook {
  const redirectUri = AuthSession.makeRedirectUri({
    scheme: Env.SCHEME,
    path: 'auth/callback',
  });

  const discovery = AuthSession.useAutoDiscovery(authority ?? '');

  const [request, response, promptAsync] = AuthSession.useAuthRequest(
    {
      clientId: clientId ?? '',
      redirectUri,
      scopes: ['openid', 'email', 'profile', 'offline_access'],
      usePKCE: true,
      responseType: AuthSession.ResponseType.Code,
    },
    // Pass null when authority is absent so the request is not created prematurely
    authority ? discovery : null,
  );

  return {
    request,
    response,
    promptAsync,
    redirectUri,
    discovery: discovery ?? null,
  };
}
