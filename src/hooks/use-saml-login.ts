import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';

import { logger } from '@/lib/logging';

export interface SamlLoginHook {
  startSamlLogin: () => Promise<void>;
  extractSamlResponse: (url: string) => string | null;
}

export function useSamlLogin(idpSsoUrl: string | null): SamlLoginHook {
  async function startSamlLogin(): Promise<void> {
    if (!idpSsoUrl) {
      logger.warn({ message: 'useSamlLogin: No IdP SSO URL provided' });
      return;
    }

    logger.info({
      message: 'useSamlLogin: Opening IdP SSO URL in browser',
      context: { idpSsoUrl },
    });

    await WebBrowser.openBrowserAsync(idpSsoUrl);
  }

  function extractSamlResponse(url: string): string | null {
    try {
      const { queryParams } = Linking.parse(url);
      const samlResponse = queryParams?.saml_response as string | undefined;
      return samlResponse ?? null;
    } catch {
      return null;
    }
  }

  return { startSamlLogin, extractSamlResponse };
}
