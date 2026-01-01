export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
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
  refreshTokenExpiresOn: string | null;
  status: AuthStatus;
  error: string | null;
  profile: ProfileModel | null;
  userId: string | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  refreshAccessToken: () => Promise<void>;
  isFirstTime: boolean;
  isAuthenticated: () => boolean;
  setIsOnboarding: () => void;
}
