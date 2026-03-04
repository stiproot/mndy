import OktaJwtVerifier from '@okta/jwt-verifier';
import { Request, Response } from 'express';
import { OKTA_ISSUER, OKTA_CLIENT_ID, IGNORE_AUTH } from "./auth.data";

const oktaJwtVerifier = new OktaJwtVerifier({
    issuer: OKTA_ISSUER(),
    clientId: OKTA_CLIENT_ID(),
});

export async function validateToken(req: Request , res: Response, next: () => void) {
    // Development auth bypass
    if (IGNORE_AUTH()) {
        const fingerprint = req.headers['x-fingerprint'];

        if (!fingerprint) {
            console.warn("[DEV AUTH] No fingerprint header found");
            return res.sendStatus(401);
        }

        console.log(`[DEV AUTH] Bypassing Okta validation for fingerprint: ${fingerprint}`);
        return next();
    }

    // Production Okta validation
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        console.warn("no token found");
        return res.sendStatus(401);
    }

    try {
        await oktaJwtVerifier.verifyAccessToken(token, "api://default");
        // req.user = jwt.claims;
        next();
    } catch (err) {
        res.sendStatus(403);
    }
}