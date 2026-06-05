/* Too Lost API v17.1 fresh build - ISRC validator export fixed */
import { supabase } from "../supabaseClient";

const TOOLOST_STATE_KEY = "toolost_oauth_state";
const TOOLOST_CODE_VERIFIER_KEY = "toolost_oauth_code_verifier";

export const TOOLOST_ENVIRONMENT = "sandbox";

export const TOOLOST_SCOPES = [
  "read:profile",
  "read:catalog",
  "read:preferences",
  "read:audience",
  "read:analytics",
  "read:releases",
  "write:releases",
  "read:earnings",
  "read:sales",
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

export type TooLostEndpointKey =
  | "profile"
  | "releases"
  | "analyticsOverview"
  | "analyticsTracks"
  | "analyticsPlatforms"
  | "analyticsTotalStreams"
  | "salesOverview"
  | "salesTracks"
  | "salesReleases"
  | "salesChannels"
  | "salesTerritories"
  | "lookupPlatforms"
  | "lookupGenres"
  | "lookupLanguages"
  | "lookupCountries"
  | "preferencesLabel"
  | "preferencesArtists";

export type TooLostEndpointDefinition = {
  key: TooLostEndpointKey;
  label: string;
  path: string;
  section: "Connection" | "Catalog" | "Analytics" | "Sales" | "Lookup" | "Preferences";
  description: string;
  scope?: string;
};

export const TOOLOST_ENDPOINTS: TooLostEndpointDefinition[] = [
  {
    key: "profile",
    label: "Profile",
    path: "/me",
    section: "Connection",
    description: "Authenticated Too Lost user and label profile.",
    scope: "read:profile",
  },
  {
    key: "releases",
    label: "Releases",
    path: "/releases",
    section: "Catalog",
    description: "Too Lost release catalog list.",
    scope: "read:releases",
  },
  {
    key: "analyticsOverview",
    label: "Analytics Overview",
    path: "/analytics/overview",
    section: "Analytics",
    description: "Top-level streaming analytics summary.",
    scope: "read:analytics",
  },
  {
    key: "analyticsTracks",
    label: "Analytics Tracks",
    path: "/analytics/tracks",
    section: "Analytics",
    description: "Track-level analytics data.",
    scope: "read:analytics",
  },
  {
    key: "analyticsPlatforms",
    label: "Analytics Platforms",
    path: "/analytics/platforms",
    section: "Analytics",
    description: "Streaming analytics by music platform.",
    scope: "read:analytics",
  },
  {
    key: "analyticsTotalStreams",
    label: "Total Streams",
    path: "/analytics/platforms/total-streams",
    section: "Analytics",
    description: "Total stream counts from platform analytics.",
    scope: "read:analytics",
  },
  {
    key: "salesOverview",
    label: "Sales Overview",
    path: "/sales/overview",
    section: "Sales",
    description: "Monthly earnings overview.",
    scope: "read:sales",
  },
  {
    key: "salesTracks",
    label: "Sales by Track",
    path: "/sales/tracks",
    section: "Sales",
    description: "Track-level royalty and earnings data.",
    scope: "read:sales",
  },
  {
    key: "salesReleases",
    label: "Sales by Release",
    path: "/sales/releases",
    section: "Sales",
    description: "Release-level royalty and earnings data.",
    scope: "read:sales",
  },
  {
    key: "salesChannels",
    label: "Sales by Platform",
    path: "/sales/channels",
    section: "Sales",
    description: "Earnings by DSP/store/platform.",
    scope: "read:sales",
  },
  {
    key: "salesTerritories",
    label: "Sales by Territory",
    path: "/sales/territories",
    section: "Sales",
    description: "Aggregated earnings by country/territory.",
    scope: "read:sales",
  },
  {
    key: "lookupPlatforms",
    label: "Platforms",
    path: "/lookup/platforms",
    section: "Lookup",
    description: "Available stores and music platforms.",
  },
  {
    key: "lookupGenres",
    label: "Genres",
    path: "/lookup/genres",
    section: "Lookup",
    description: "Supported release genres.",
  },
  {
    key: "lookupLanguages",
    label: "Languages",
    path: "/lookup/languages",
    section: "Lookup",
    description: "Supported lyrics/release languages.",
  },
  {
    key: "lookupCountries",
    label: "Countries",
    path: "/lookup/countries",
    section: "Lookup",
    description: "Supported territory/country data.",
  },
  {
    key: "preferencesLabel",
    label: "Label Preferences",
    path: "/preferences/label",
    section: "Preferences",
    description: "Label preference profile data.",
  },
  {
    key: "preferencesArtists",
    label: "Artist Preferences",
    path: "/preferences/artists",
    section: "Preferences",
    description: "Artist preference profiles connected to the label.",
  },
];

function getEnvValue(key: string) {
  const value = String(import.meta.env[key] || "").trim();

  if (!value) {
    throw new Error(`Missing ${key} in your environment variables.`);
  }

  return value;
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

  // Clear stale PKCE values before starting a new OAuth attempt.
  sessionStorage.removeItem(TOOLOST_STATE_KEY);
  sessionStorage.removeItem(TOOLOST_CODE_VERIFIER_KEY);

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

  window.location.href = `${config.authorizeUrl}?${params.toString()}`;
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
    const message =
      typeof payload?.error_description === "string"
        ? payload.error_description
        : typeof payload?.message === "string"
          ? payload.message
          : typeof payload?.error === "string"
            ? payload.error
            : "Too Lost token exchange failed.";
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
  const userId = await getCurrentUserId();

  const { data, error } = await supabase
    .from("toolost_connections")
    .select("id,user_id,token_type,expires_at,scope,environment,created_at,updated_at")
    .eq("user_id", userId)
    .eq("environment", TOOLOST_ENVIRONMENT)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data as TooLostConnection | null;
}

async function getTooLostPrivateConnection() {
  const userId = await getCurrentUserId();

  const { data, error } = await supabase
    .from("toolost_connections")
    .select("id,user_id,access_token,refresh_token,token_type,expires_at,scope,environment,created_at,updated_at")
    .eq("user_id", userId)
    .eq("environment", TOOLOST_ENVIRONMENT)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data as TooLostPrivateConnection | null;
}

export async function disconnectTooLost() {
  const userId = await getCurrentUserId();

  const { error } = await supabase
    .from("toolost_connections")
    .delete()
    .eq("user_id", userId)
    .eq("environment", TOOLOST_ENVIRONMENT);

  if (error) {
    throw new Error(error.message);
  }
}

export function isTooLostTokenExpired(connection: TooLostConnection | null) {
  if (!connection?.expires_at) return false;
  return new Date(connection.expires_at).getTime() <= Date.now();
}

export function connectionHasScope(connection: TooLostConnection | null, scope: string) {
  const scopes = connection?.scope?.split(/\s+/).filter(Boolean) || [];
  return scopes.includes(scope);
}

export type TooLostRequestOptions = {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  query?: Record<string, string | number | boolean | null | undefined>;
  body?: unknown;
};

function buildTooLostPath(path: string, query?: TooLostRequestOptions["query"]) {
  const params = new URLSearchParams();

  Object.entries(query || {}).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    params.set(key, String(value));
  });

  const queryString = params.toString();
  return queryString ? `${path}?${queryString}` : path;
}

export async function callTooLostEndpoint(path: string, options: TooLostRequestOptions = {}) {
  const connection = await getTooLostPrivateConnection();

  if (!connection?.access_token) {
    throw new Error("Too Lost is not connected yet.");
  }

  if (isTooLostTokenExpired(connection)) {
    throw new Error("Your Too Lost access token is expired. Disconnect and reconnect Too Lost Sandbox.");
  }

  const config = getTooLostConfig();
  const requestPath = buildTooLostPath(path, options.query);
  const method = options.method || "GET";

  const response = await fetch(`${config.apiBaseUrl}${requestPath}`, {
    method,
    headers: {
      Authorization: `${connection.token_type || "Bearer"} ${connection.access_token}`,
      Accept: "application/json",
      ...(options.body ? { "Content-Type": "application/json" } : {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message =
      typeof payload?.message === "string"
        ? payload.message
        : typeof payload?.error_description === "string"
          ? payload.error_description
          : typeof payload?.error === "string"
            ? payload.error
            : `Too Lost request failed for ${requestPath}.`;
    throw new Error(message);
  }

  return payload;
}

export type TooLostReleaseFilters = {
  status?: string;
  type?: string;
  search?: string;
  page?: number;
  perPage?: number;
};

export type TooLostCreateReleaseDraftPayload = {
  type: string;
  title: string;
  label?: string;
  participants: Array<{
    name: string;
    artistId?: number;
    role: string[];
  }>;
};

export async function listTooLostReleases(filters: TooLostReleaseFilters = {}) {
  return callTooLostEndpoint("/releases", {
    query: {
      status: filters.status,
      type: filters.type,
      search: filters.search,
      page: filters.page || 1,
      perPage: filters.perPage || 20,
    },
  });
}

export async function getTooLostRelease(releaseId: string | number) {
  return callTooLostEndpoint(`/releases/${releaseId}`);
}

export async function getTooLostReleaseTracks(releaseId: string | number) {
  return callTooLostEndpoint(`/releases/${releaseId}/tracks`);
}

export async function createTooLostReleaseDraft(payload: TooLostCreateReleaseDraftPayload) {
  return callTooLostEndpoint("/releases", { method: "POST", body: payload });
}

export async function validateTooLostUpc(upc: string, releaseId?: string | number) {
  return callTooLostEndpoint("/releases/validate/upc", {
    method: "POST",
    body: {
      upc,
      ...(releaseId ? { releaseId: Number(releaseId) } : {}),
    },
  });
}

export async function validateTooLostIsrc(isrc: string, releaseId?: string | number) {
  return callTooLostEndpoint("/releases/validate/isrc", {
    method: "POST",
    body: {
      isrc,
      ...(releaseId ? { releaseId: Number(releaseId) } : {}),
    },
  });
}

export async function testTooLostProfile() {
  return callTooLostEndpoint("/me");
}

export async function fetchTooLostEndpoint(endpoint: TooLostEndpointDefinition) {
  return callTooLostEndpoint(endpoint.path);
}
