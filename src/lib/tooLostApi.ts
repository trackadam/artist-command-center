import { supabase } from "../supabaseClient";

const TOOLOST_STATE_KEY = "toolost_oauth_state";
const TOOLOST_CODE_VERIFIER_KEY = "toolost_oauth_code_verifier";

export const TOOLOST_ENVIRONMENT = "sandbox";

export const TOOLOST_SCOPES = [
  "read:profile",
  "read:catalog",
  "read:analytics",
  "read:earnings",
].join(" ");

export type TooLostTokenResponse = {
  token_type: string;
  expires_in: number;
  access_token: string;
  refresh_token?: string;
  scope?: string;
};

export type TooLostConnection = {
  id: string;
  user_id: string;
  token_type: string | null;
  expires_at: string | null;
  scope: string | null;
  environment: string | null;
  created_at: string | null;
  updated_at: string | null;
};

export type TooLostPrivateConnection = TooLostConnection & {
  access_token: string;
  refresh_token: string | null;
};

function getEnvValue(key: string) {
  const value = import.meta.env[key];

  if (!value) {
    throw new Error(`Missing ${key} in your environment variables.`);
  }

  return value as string;
}

export function getTooLostConfig() {
  return {
    apiBaseUrl: getEnvValue("VITE_TOOLOST_API_BASE_URL"),
    authorizeUrl: getEnvValue("VITE_TOOLOST_AUTHORIZE_URL"),
    tokenUrl: getEnvValue("VITE_TOOLOST_TOKEN_URL"),
    redirectUri: getEnvValue("VITE_TOOLOST_REDIRECT_URI"),
    clientId: getEnvValue("VITE_TOOLOST_CLIENT_ID"),
  };
}

function base64UrlEncode(bytes: Uint8Array) {
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });

  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function randomBase64Url(byteLength: number) {
  const bytes = new Uint8Array(byteLength);
  crypto.getRandomValues(bytes);
  return base64UrlEncode(bytes);
}

export function generateCodeVerifier() {
  return randomBase64Url(32);
}

export function generateRandomState() {
  return randomBase64Url(24);
}

export async function generateCodeChallenge(codeVerifier: string) {
  const encoder = new TextEncoder();
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(codeVerifier));
  return base64UrlEncode(new Uint8Array(digest));
}

export async function startTooLostOAuth() {
  const config = getTooLostConfig();
  const state = generateRandomState();
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = await generateCodeChallenge(codeVerifier);

  sessionStorage.setItem(TOOLOST_STATE_KEY, state);
  sessionStorage.setItem(TOOLOST_CODE_VERIFIER_KEY, codeVerifier);

  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    response_type: "code",
    scope: TOOLOST_SCOPES,
    state,
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
  });

  window.location.assign(`${config.authorizeUrl}?${params.toString()}`);
}

export async function exchangeTooLostCode(code: string, returnedState: string | null) {
  const expectedState = sessionStorage.getItem(TOOLOST_STATE_KEY);
  const codeVerifier = sessionStorage.getItem(TOOLOST_CODE_VERIFIER_KEY);

  if (!code) {
    throw new Error("Too Lost did not return an authorization code.");
  }

  if (!returnedState || !expectedState || returnedState !== expectedState) {
    throw new Error("Invalid OAuth state. Please try connecting Too Lost again.");
  }

  if (!codeVerifier) {
    throw new Error("Missing PKCE code verifier. Please try connecting Too Lost again.");
  }

  const config = getTooLostConfig();
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    code,
    code_verifier: codeVerifier,
  });

  const response = await fetch(config.tokenUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = typeof payload?.message === "string" ? payload.message : "Too Lost token exchange failed.";
    throw new Error(message);
  }

  sessionStorage.removeItem(TOOLOST_STATE_KEY);
  sessionStorage.removeItem(TOOLOST_CODE_VERIFIER_KEY);

  return payload as TooLostTokenResponse;
}

async function getCurrentUserId() {
  const { data, error } = await supabase.auth.getUser();

  if (error) {
    throw new Error(error.message);
  }

  if (!data.user) {
    throw new Error("You must be signed in before connecting Too Lost.");
  }

  return data.user.id;
}

function getExpiresAt(expiresIn: number) {
  return new Date(Date.now() + expiresIn * 1000).toISOString();
}

export async function saveTooLostConnection(tokenResponse: TooLostTokenResponse) {
  const userId = await getCurrentUserId();

  const { data, error } = await supabase
    .from("toolost_connections")
    .upsert(
      {
        user_id: userId,
        access_token: tokenResponse.access_token,
        refresh_token: tokenResponse.refresh_token || null,
        token_type: tokenResponse.token_type || "Bearer",
        expires_in: tokenResponse.expires_in,
        expires_at: getExpiresAt(tokenResponse.expires_in),
        scope: tokenResponse.scope || TOOLOST_SCOPES,
        environment: TOOLOST_ENVIRONMENT,
      },
      { onConflict: "user_id,environment" },
    )
    .select("id,user_id,token_type,expires_at,scope,environment,created_at,updated_at")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as TooLostConnection;
}

export async function getTooLostConnection() {
  await getCurrentUserId();

  const { data, error } = await supabase
    .from("toolost_connections")
    .select("id,user_id,token_type,expires_at,scope,environment,created_at,updated_at")
    .eq("environment", TOOLOST_ENVIRONMENT)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data as TooLostConnection | null;
}

async function getTooLostPrivateConnection() {
  await getCurrentUserId();

  const { data, error } = await supabase
    .from("toolost_connections")
    .select("id,user_id,access_token,refresh_token,token_type,expires_at,scope,environment,created_at,updated_at")
    .eq("environment", TOOLOST_ENVIRONMENT)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data as TooLostPrivateConnection | null;
}

export async function disconnectTooLost() {
  await getCurrentUserId();

  const { error } = await supabase
    .from("toolost_connections")
    .delete()
    .eq("environment", TOOLOST_ENVIRONMENT);

  if (error) {
    throw new Error(error.message);
  }
}

export function isTooLostTokenExpired(connection: TooLostConnection | null) {
  if (!connection?.expires_at) return false;
  return new Date(connection.expires_at).getTime() <= Date.now();
}

export async function testTooLostProfile() {
  const connection = await getTooLostPrivateConnection();

  if (!connection?.access_token) {
    throw new Error("Too Lost is not connected yet.");
  }

  if (isTooLostTokenExpired(connection)) {
    throw new Error("Your Too Lost access token is expired. Disconnect and reconnect Too Lost Sandbox.");
  }

  const config = getTooLostConfig();
  const response = await fetch(`${config.apiBaseUrl}/me`, {
    headers: {
      Authorization: `${connection.token_type || "Bearer"} ${connection.access_token}`,
    },
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = typeof payload?.message === "string" ? payload.message : "Too Lost /me test failed.";
    throw new Error(message);
  }

  return payload;
}
