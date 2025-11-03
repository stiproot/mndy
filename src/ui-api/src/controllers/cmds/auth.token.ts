import OktaJwtVerifier from '@okta/jwt-verifier';
import { Request, Response } from 'express';
import { OKTA_ISSUER, OKTA_CLIENT_ID } from "./auth.data";

const oktaJwtVerifier = new OktaJwtVerifier({
    issuer: OKTA_ISSUER(),
    clientId: OKTA_CLIENT_ID(),
});

export async function validateToken(req: Request , res: Response, next: () => void) {
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