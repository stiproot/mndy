/**
 * Development Authentication Service
 *
 * WARNING: This service is for development only!
 * Generates mock authentication tokens based on browser fingerprints.
 * Should NEVER be used in production environments.
 */

export interface IDevTokenResponse {
    tokens: {
        accessToken: {
            raw: string;
            obj: {
                sub: string;
                email: string;
                name: string;
                expiresAt: number;
            };
        };
        idToken: {
            raw: string;
            obj: {
                sub: string;
                email: string;
                name: string;
                expiresAt: number;
            };
        };
        refreshToken: {
            raw: string;
            obj: {
                sub: string;
                expiresAt: number;
            };
        };
    };
    usr: {
        email: string;
        name: string;
        title: string;
    };
}

export class DevAuthService {
    /**
     * Generate mock tokens for a given fingerprint
     * Tokens are valid for 24 hours in dev mode
     */
    public static generateDevTokens(fingerprint: string): IDevTokenResponse {
        const now = Math.floor(Date.now() / 1000);
        const expiresAt = now + 86400; // 24 hours from now

        // Create mock JWT-like tokens (base64 encoded JSON)
        const accessTokenObj = {
            sub: fingerprint,
            email: `dev-${fingerprint.substring(0, 8)}@local.dev`,
            name: "Dev User",
            aud: "api://default",
            iss: "dev-auth",
            iat: now,
            exp: expiresAt,
            expiresAt: expiresAt,
        };

        const idTokenObj = {
            sub: fingerprint,
            email: `dev-${fingerprint.substring(0, 8)}@local.dev`,
            name: "Dev User",
            aud: "dev-client",
            iss: "dev-auth",
            iat: now,
            exp: expiresAt,
            expiresAt: expiresAt,
        };

        const refreshTokenObj = {
            sub: fingerprint,
            iat: now,
            exp: expiresAt,
            expiresAt: expiresAt,
        };

        // Encode as base64 to simulate JWT format
        const accessTokenRaw = `dev.${Buffer.from(JSON.stringify(accessTokenObj)).toString('base64')}.sig`;
        const idTokenRaw = `dev.${Buffer.from(JSON.stringify(idTokenObj)).toString('base64')}.sig`;
        const refreshTokenRaw = `dev.${Buffer.from(JSON.stringify(refreshTokenObj)).toString('base64')}.sig`;

        return {
            tokens: {
                accessToken: {
                    raw: accessTokenRaw,
                    obj: accessTokenObj,
                },
                idToken: {
                    raw: idTokenRaw,
                    obj: idTokenObj,
                },
                refreshToken: {
                    raw: refreshTokenRaw,
                    obj: refreshTokenObj,
                },
            },
            usr: {
                email: `dev-${fingerprint.substring(0, 8)}@local.dev`,
                name: "Dev User",
                title: "Developer",
            },
        };
    }

    /**
     * Validate that dev auth is enabled
     * Logs warning to console
     */
    public static validateDevAuthEnabled(): boolean {
        console.warn("⚠️  DEV AUTH MODE ACTIVE - This should NEVER be used in production!");
        return true;
    }
}
