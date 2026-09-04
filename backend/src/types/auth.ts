export type AuthUser = {
  userId: string;
  username: string;
};

export type AuthTokenPayload = AuthUser & {
  sub: string;
  iat?: number;
  exp?: number;
};