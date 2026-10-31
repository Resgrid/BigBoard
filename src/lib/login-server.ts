/** Which server a sign-in goes to, as the login form labels it. */
export type LoginServerKind = 'us_west' | 'eu_central' | 'custom';

export interface LoginServer {
  kind: LoginServerKind;
  /** The server's host name, shown beside "Custom" so a self-hosted or test server is recognizable. */
  host: string;
}

// The Resgrid hosted sites, matching DEFAULT_RESGRID_LOCATIONS in the server URL bottom sheet. Kept here rather than
// imported so the login form's label does not pull in the selector's UI.
const HOSTED_SERVERS: readonly { kind: LoginServerKind; apiUrl: string }[] = [
  { kind: 'us_west', apiUrl: 'https://api.resgrid.com' },
  { kind: 'eu_central', apiUrl: 'https://api-eu-central.resgrid.com' },
];

// Reduce a URL to its bare base (no trailing slash, no /api/vX suffix); hostnames are case-insensitive, so lowercase it.
const toComparableUrl = (url: string) =>
  url
    .trim()
    .replace(/\/+$/, '')
    .replace(/\/api\/v\d+$/i, '')
    .toLowerCase();

// RN's URL polyfill does not implement hostname, so the host is read from the address directly.
const hostOf = (url: string) => /^[a-z][a-z\d+.-]*:\/\/([^/?#]+)/i.exec(url.trim())?.[1]?.toLowerCase() ?? url.trim();

/** Names the server behind an API URL (with or without the /api/vX suffix): a Resgrid hosted site, or a custom one. */
export const describeLoginServer = (apiUrl: string): LoginServer => {
  const comparable = toComparableUrl(apiUrl);
  const hosted = HOSTED_SERVERS.find((server) => toComparableUrl(server.apiUrl) === comparable);
  return { kind: hosted?.kind ?? 'custom', host: hostOf(apiUrl) };
};
