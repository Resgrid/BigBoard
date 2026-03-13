export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface DepartmentSsoConfig {
  ssoEnabled: boolean;
  providerType: 'oidc' | 'saml2' | null;
  authority: string | null;
  clientId: string | null;
  metadataUrl: string | null;
  entityId: string | null;
  allowLocalLogin: boolean;
  requireSso: boolean;
  requireMfa: boolean;
  oidcRedirectUri: string | null;
  oidcScopes: string | null;
  departmentCode: string | null;
}

export interface ExternalTokenRequest {
  provider: 'oidc' | 'saml2';
  external_token: string;
  department_code?: string;
  scope: string;
}

export interface SsoLoginCredentials {
  provider: 'oidc' | 'saml2';
  externalToken: string;
  departmentCode?: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  id_token: string;
  expires_in: number;
  token_type: string;
  expiration_date: string;
}

export interface LoginResponse {
  successful: boolean;
  message: string;
  authResponse: AuthResponse | null;
}
export interface ProfileModel {
  sub: string;
  jti: string;
  useage: string;
  at_hash: string;
  nbf: number;
  exp: number;
  iat: number;
  iss: string;
  name: string;
  oi_au_id: string;
  oi_tkn_id: string;
}

export type AuthStatus = 'idle' | 'signedIn' | 'signedOut' | 'loading' | 'error' | 'onboarding';

export interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  /** Stores the access-token expiry as a Unix-ms epoch string */
  refreshTokenExpiresOn: string | null;
  status: AuthStatus;
  error: string | null;
  profile: ProfileModel | null;
  userId: string | null;
  isFirstTime: boolean;
  /** True once Zustand has finished rehydrating from persisted storage */
  _hasHydrated: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  loginWithSso: (credentials: SsoLoginCredentials) => Promise<{ success: boolean; error?: Error }>;
  logout: () => Promise<void>;
  refreshAccessToken: () => Promise<void>;
  isAuthenticated: () => boolean;
  setIsOnboarding: () => void;
  setHasHydrated: (value: boolean) => void;
}
