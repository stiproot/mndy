import { saveState } from "../state-manager";
import { Configs } from "../consts";
import OktaJwtVerifier from '@okta/jwt-verifier';
import axios from 'axios';
import qs from 'qs';
import { OKTA_ISSUER, OKTA_TOKEN_URI, OKTA_CLIENT_ID, OKTA_SECRET, REDIRECT_URI, IGNORE_AUTH } from "./auth.data";
import { Request, Response } from 'express';
import { DevAuthService } from "./dev-auth.service";

const oktaJwtVerifier = new OktaJwtVerifier({
  issuer: OKTA_ISSUER(),
  clientId: OKTA_CLIENT_ID(),
});

export const processExchangeCodeForTokenCmd = async (req: Request, res: Response) => {

  console.info("Processing exchange cmd.");

  const { code, codeVerifier, nonce } = req.body;
  let data = qs.stringify({
    'grant_type': 'authorization_code',
    'redirect_uri': REDIRECT_URI(),
    'code': code,
    'client_secret': OKTA_SECRET(),
    'client_id': OKTA_CLIENT_ID(),
    // 'code_verifier': codeVerifier
  });

  let config = {
    method: 'post',
    maxBodyLength: Infinity,
    url: OKTA_TOKEN_URI(),
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    data: data
  };

  const exchangeResp = await axios.request(config);

  const { id_token, access_token, refresh_token } = exchangeResp.data;
  const idToken = await oktaJwtVerifier.verifyIdToken(id_token, OKTA_CLIENT_ID(), nonce);
  const accessToken = await oktaJwtVerifier.verifyAccessToken(access_token, "api://default");

  const { email, name, title } = idToken.claims;

  // Persist usr information...
  const usrData = {
    id: email,
    name: name,
    title: title,
  };
  const state = [{ key: email, value: usrData }];
  await saveState(Configs.DAPR_USRS_STATE_STORE_NAME, state);

  console.info("Processed exchange cmd.");

  res.json({
    status: "ok",
    tokens: {
      accessToken: {
        raw: access_token,
        obj: accessToken
      },
      idToken: {
        raw: id_token,
        obj: idToken
      },
      refreshToken: {
        raw: refresh_token,
      }
    },
    usr: {
      email: email,
      name: name,
    }
  });
};

export const processRefreshTokenCmd = async (req: Request, res: Response) => {

  console.info("Processing refresh cmd.");

  const { refreshToken } = req.body;

  let data = qs.stringify({
    'grant_type': 'refresh_token',
    'client_id': OKTA_CLIENT_ID(),
    'client_secret': OKTA_SECRET(),
    'refresh_token': refreshToken,
  });

  let config = {
    method: 'post',
    maxBodyLength: Infinity,
    url: OKTA_TOKEN_URI(),
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    data: data
  };

  try {

    const exchangeResp = await axios.request(config);
    const { id_token, access_token, refresh_token } = exchangeResp.data;
    const idToken = await oktaJwtVerifier.verifyIdToken(id_token, OKTA_CLIENT_ID());
    const accessToken = await oktaJwtVerifier.verifyAccessToken(access_token, "api://default");

    console.info("Processed refresh cmd.");

    res.json({
      status: "ok",
      accessToken: {
        raw: access_token,
        obj: accessToken
      },
      idToken: {
        raw: id_token,
        obj: idToken
      },
      refreshToken: {
        raw: refresh_token,
      }
    });

  } catch (e) {
    console.error("Process refresh token failed: ", e);
    res.sendStatus(500);
  }
}

/**
 * Development authentication endpoint
 * WARNING: Only active when IGNORE_AUTH=true
 */
export const processDevAuthCmd = async (req: Request, res: Response) => {
  if (!IGNORE_AUTH()) {
    console.error("[DEV AUTH] Attempted to use dev auth endpoint when IGNORE_AUTH is false");
    return res.sendStatus(403);
  }

  DevAuthService.validateDevAuthEnabled();
  console.info("[DEV AUTH] Processing dev auth cmd.");

  const { fingerprint } = req.body;

  if (!fingerprint) {
    console.error("[DEV AUTH] No fingerprint provided");
    return res.status(400).json({ error: "fingerprint required" });
  }

  const response = DevAuthService.generateDevTokens(fingerprint);

  // Persist usr information to Dapr state store
  const usrData = {
    id: response.usr.email,
    name: response.usr.name,
    title: response.usr.title,
  };
  const state = [{ key: response.usr.email, value: usrData }];
  await saveState(Configs.DAPR_USRS_STATE_STORE_NAME, state);

  console.info("[DEV AUTH] Processed dev auth cmd successfully");

  res.json({
    status: "ok",
    ...response
  });
};