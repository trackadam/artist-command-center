import { useEffect, useState } from "react";
import {
  disconnectTooLost,
  getTooLostConfig,
  getTooLostConnection,
  isTooLostTokenExpired,
  startTooLostOAuth,
  testTooLostProfile,
  TOOLOST_SCOPES,
  type TooLostConnection,
} from "../lib/tooLostApi";

type DistributionPageProps = {
  oauthStatus?: "success" | "error" | null;
  oauthMessage?: string;
};

function formatDate(value?: string | null) {
  if (!value) return "Not available";

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default function DistributionPage({ oauthStatus, oauthMessage }: DistributionPageProps) {
  const [connection, setConnection] = useState<TooLostConnection | null>(null);
  const [connectionLoading, setConnectionLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");
  const [profileResult, setProfileResult] = useState<unknown>(null);

  async function loadConnection() {
    setConnectionLoading(true);
    setError("");

    try {
      const currentConnection = await getTooLostConnection();
      setConnection(currentConnection);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Could not load Too Lost connection.");
    } finally {
      setConnectionLoading(false);
    }
  }

  useEffect(() => {
    loadConnection();
  }, []);

  useEffect(() => {
    if (oauthStatus === "success") {
      void loadConnection();
    }
  }, [oauthStatus, oauthMessage]);

  async function handleConnect() {
    setActionLoading(true);
    setError("");

    try {
      await startTooLostOAuth();
    } catch (connectError) {
      setActionLoading(false);
      setError(connectError instanceof Error ? connectError.message : "Could not start Too Lost OAuth.");
    }
  }

  async function handleTestConnection() {
    setActionLoading(true);
    setError("");
    setProfileResult(null);

    try {
      const profile = await testTooLostProfile();
      setProfileResult(profile);
    } catch (testError) {
      setError(testError instanceof Error ? testError.message : "Too Lost test failed.");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleDisconnect() {
    const confirmed = window.confirm("Disconnect Too Lost Sandbox from Track Adam OS?");
    if (!confirmed) return;

    setActionLoading(true);
    setError("");
    setProfileResult(null);

    try {
      await disconnectTooLost();
      setConnection(null);
    } catch (disconnectError) {
      setError(disconnectError instanceof Error ? disconnectError.message : "Could not disconnect Too Lost.");
    } finally {
      setActionLoading(false);
    }
  }

  let configPreview: ReturnType<typeof getTooLostConfig> | null = null;
  let configError = "";

  try {
    configPreview = getTooLostConfig();
  } catch (configLoadError) {
    configError = configLoadError instanceof Error ? configLoadError.message : "Too Lost environment variables are missing.";
  }

  const connected = Boolean(connection);
  const expired = isTooLostTokenExpired(connection);

  return (
    <section className="page-section distribution-page">
      <div className="section-header">
        <div>
          <p className="eyebrow">Too Lost Integration</p>
          <h2>Distribution</h2>
          <p>
            Connect Track Adam OS to the Too Lost sandbox API first. Once this works, the full catalog,
            releases, analytics, earnings, and audience tabs can be added on top.
          </p>
        </div>
      </div>

      {oauthStatus ? (
        <div className={oauthStatus === "success" ? "detail-section ai-output-box" : "detail-section ai-error-box"}>
          <p>{oauthMessage}</p>
        </div>
      ) : null}

      {error || configError ? (
        <div className="detail-section ai-error-box">
          <p>{error || configError}</p>
        </div>
      ) : null}

      <div className="asset-grid distribution-grid">
        <article className="asset-card distribution-card">
          <div className="asset-card-header">
            <div>
              <span className="asset-type-pill">Sandbox</span>
              <h3>Too Lost</h3>
              <p>OAuth 2.0 Authorization Code Flow with PKCE</p>
            </div>
            <span className={connected && !expired ? "status-pill status-live" : expired ? "status-pill status-warning" : "status-pill"}>
              {connectionLoading ? "Checking..." : connected ? (expired ? "Token Expired" : "Sandbox Connected") : "Not Connected"}
            </span>
          </div>

          <div className="detail-grid distribution-detail-grid">
            <div>
              <span>API Base</span>
              <strong>{configPreview?.apiBaseUrl || "Missing"}</strong>
            </div>
            <div>
              <span>Redirect URI</span>
              <strong>{configPreview?.redirectUri || "Missing"}</strong>
            </div>
            <div>
              <span>Scopes</span>
              <strong>{TOOLOST_SCOPES}</strong>
            </div>
            <div>
              <span>Expires</span>
              <strong>{connection ? formatDate(connection.expires_at) : "Not connected"}</strong>
            </div>
          </div>

          <div className="asset-actions distribution-actions">
            {!connected ? (
              <button className="primary-btn" type="button" onClick={handleConnect} disabled={actionLoading || Boolean(configError)}>
                {actionLoading ? "Opening Too Lost..." : "Connect Too Lost Sandbox"}
              </button>
            ) : (
              <>
                <button className="primary-btn" type="button" onClick={handleTestConnection} disabled={actionLoading || expired}>
                  {actionLoading ? "Testing..." : "Test /me Connection"}
                </button>
                <button className="secondary-btn" type="button" onClick={handleDisconnect} disabled={actionLoading}>
                  Disconnect
                </button>
              </>
            )}
          </div>
        </article>

        <article className="asset-card distribution-card">
          <div className="asset-card-header">
            <div>
              <span className="asset-type-pill">Phase 1</span>
              <h3>Build Order</h3>
              <p>Do not build release creation until the OAuth connection and profile test are confirmed.</p>
            </div>
          </div>

          <div className="checklist-list">
            <label><input type="checkbox" checked readOnly /> Add Distribution section</label>
            <label><input type="checkbox" checked readOnly /> Connect with PKCE</label>
            <label><input type="checkbox" checked={connected} readOnly /> Store sandbox connection</label>
            <label><input type="checkbox" checked={Boolean(profileResult)} readOnly /> Confirm GET /me works</label>
          </div>
        </article>
      </div>

      {profileResult ? (
        <div className="detail-section ai-output-box distribution-debug-card">
          <div className="asset-card-header">
            <div>
              <span className="asset-type-pill">Debug</span>
              <h3>Too Lost /me Response</h3>
              <p>This is safe profile/debug data only. Tokens are not shown here.</p>
            </div>
          </div>
          <pre>{JSON.stringify(profileResult, null, 2)}</pre>
        </div>
      ) : null}
    </section>
  );
}
