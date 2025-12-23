import { type AuthTokenModel } from './authTokens';
import { type ProfileModel } from './profile';

export interface AuthStateModel {
  tokens?: AuthTokenModel;
  profile?: ProfileModel;
  authReady?: boolean;
}
