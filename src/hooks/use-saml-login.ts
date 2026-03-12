import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';

import { logger } from '@/lib/logging';

export type SamlLoginResult = { type: 'success'; redirectUrl: string; samlResponse: string } | { type: 'cancel' } | { type: 'error'; error: string };

export interface SamlLoginHook {
  startSamlLogin: () => Promise<SamlLoginResult>;
  extractSamlResponse: (url: string) => string | null;
}

export function useSamlLogin(idpSsoUrl: string | null): SamlLoginHook {
  function extractSamlResponse(url: string): string | null {
    try {
      const { queryParams } = Linking.parse(url);
      const samlResponse = queryParams?.saml_response as string | undefined;
      return samlResponse ?? null;
    } catch {
      return null;
    }
  }

  async function startSamlLogin(): Promise<SamlLoginResult> {
    if (!idpSsoUrl) {
      logger.warn({ message: 'useSamlLogin: No IdP SSO URL provided' });
      return { type: 'error', error: 'No IdP SSO URL provided' };
    }

    const redirectUrl = Linking.createURL('auth/callback');

    let idpHost: string;
    try {
      idpHost = new URL(idpSsoUrl).host;
    } catch {
      idpHost = '<invalid-url>';
    }

    logger.info({
      message: 'useSamlLogin: Opening IdP SSO URL in browser',
      context: { idpHost, redirectUrl },
    });

    const result = await WebBrowser.openAuthSessionAsync(idpSsoUrl, redirectUrl);

    if (result.type === 'success') {
      const samlResponse = extractSamlResponse(result.url);
      if (!samlResponse) {
        logger.warn({
          message: 'useSamlLogin: Auth session succeeded but no saml_response found in redirect URL',
          context: { url: result.url },
        });
        return { type: 'error', error: 'No SAML response in redirect URL' };
      }
      logger.info({ message: 'useSamlLogin: Auth session completed successfully' });
      return { type: 'success', redirectUrl: result.url, samlResponse };
    }

    if (result.type === 'cancel' || result.type === 'dismiss') {
      logger.info({ message: 'useSamlLogin: Auth session was cancelled by user' });
      // Ensure the browser is fully dismissed on iOS before returning
      WebBrowser.dismissAuthSession();
      return { type: 'cancel' };
    }

    // 'locked' – another session is already open
    logger.warn({
      message: 'useSamlLogin: Auth session ended with unexpected result type',
      context: { type: result.type },
    });
    return { type: 'error', error: `Unexpected auth session result: ${(result as { type: string }).type}` };
  }

  return { startSamlLogin, extractSamlResponse };
}
