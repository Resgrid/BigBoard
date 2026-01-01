import { getItem, removeItem, setItem } from '@/lib/storage';

import { type AuthResponse } from './types';

const TOKEN = 'token';
const AUTH_RESPONSE = 'authResponse';

export type TokenType = {
  access: string;
  refresh: string;
};

export const getToken = () => getItem<TokenType>(TOKEN);
export const getAuth = () => getItem<AuthResponse>(AUTH_RESPONSE);
export const removeToken = () => removeItem(TOKEN);
export const setToken = (value: TokenType) => setItem<TokenType>(TOKEN, value);
