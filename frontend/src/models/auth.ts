export interface LoginCredentials {
  username: string;
  password: string;
}

export interface AuthTokens {
  access: string;
  refresh: string;
  store_name?: string;
}

export interface AuthUser {
  id: number;
  username: string;
  email: string;
}
