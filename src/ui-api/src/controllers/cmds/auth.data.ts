require("dotenv").config();

export const REDIRECT_BASE_URL = (): string => process.env.REDIRECT_BASE_URL!;
export const REDIRECT_URI = () => `${REDIRECT_BASE_URL()}/authorization-code/callback`;
export const OKTA_ISSUER = (): string => process.env.OKTA_ISSUER!;
export const OKTA_TOKEN_URI = (): string => process.env.OKTA_TOKEN_URI!;
export const OKTA_CLIENT_ID = (): string => process.env.OKTA_CLIENT_ID!;
export const OKTA_SECRET = (): string => process.env.OKTA_SECRET!;