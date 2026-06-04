import { useEffect, useMemo, useState } from "react";
import {
  connectionHasScope,
  disconnectTooLost,
  fetchTooLostEndpoint,
  getTooLostConfig,
  getTooLostConnection,
  isTooLostTokenExpired,
  startTooLostOAuth,
  TOOLOST_ENDPOINTS,
  TOOLOST_SCOPES,
  type TooLostConnection,
  type TooLostEndpointDefinition,
  type TooLostEndpointKey,
} from "../lib/tooLostApi";

type DistributionPageProps = {
  oauthStatus?: "success" | "error" | null;
  oauthMessage?: string;
};

type DashboardTab = "Overview" | "Releases" | "Analytics" | "Sales" | "Lookups" | "Preferences" | "Debug";

type EndpointState = {
  loading: boolean;
  error: string;
  data: unknown;
  loadedAt?: string;
};

type MetricCard = {
  label: string;
  value: string;
  helper?: string;
};

const defaultEndpointState: EndpointState = {
  loading: false,
  error: "",
  data: null,
};

function formatDate(value?: string | null) {
  if (!value) return "Not available";

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getPayloadData(value: unknown) {
  if (isRecord(value) && "data" in value) return value.data;
  return value;
}

function asArray(value: unknown): unknown[] {
  const data = getPayloadData(value);
  if (Array.isArray(data)) return data;

  if (isRecord(data)) {
    const nestedData = data.data;
    if (Array.isArray(nestedData)) return nestedData;

    const commonLists = ["items", "results", "releases", "tracks", "channels", "territories", "platforms"];
    for (const key of commonLists) {
      const possibleArray = data[key];
      if (Array.isArray(possibleArray)) return possibleArray;
    }
  }

  return [];
}

function getRecordValue(record: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    if (record[key] !== undefined && record[key] !== null && record[key] !== "") return record[key];
  }
  return null;
}

function stringifyCell(value: unknown) {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return String(value);
  return JSON.stringify(value);
}

function getCount(value: unknown) {
  const rows = asArray(value);
  if (rows.length) return rows.length;

  const data = getPayloadData(value);
  if (isRecord(data)) {
    const total = getRecordValue(data, ["total", "count", "total_count", "streams", "total_streams", "amount", "total_amount"]);
    if (total !== null) return total;
  }

  return "—";
}

function getEndpointState(results: Partial<Record<TooLostEndpointKey, EndpointState>>, key: TooLostEndpointKey) {
  return results[key] || defaultEndpointState;
}

function createMetric(label: string, value: unknown, helper?: string): MetricCard {
  return {
    label,
    value: stringifyCell(value),
    helper,
  };
}

function makeOverviewMetrics(
  connection: TooLostConnection | null,
  profile: unknown,
  releases: unknown,
  analytics: unknown,
  sales: unknown,
): MetricCard[] {
  const profileData = getPayloadData(profile);
  const profileRecord = isRecord(profileData) ? profileData : null;

  return [
    createMetric(
      "Account",
      profileRecord ? `${stringifyCell(profileRecord.first_name)} ${stringifyCell(profileRecord.last_name)}` : "Not loaded",
      profileRecord?.email ? stringifyCell(profileRecord.email) : undefined,
    ),
    createMetric("Type", profileRecord?.type || "—", profileRecord?.confirmed === true ? "Confirmed account" : "Profile not confirmed or not loaded"),
    createMetric("Catalog Items", getCount(releases), "From GET /releases"),
    createMetric("Analytics", getCount(analytics), "From GET /analytics/overview"),
    createMetric("Sales", getCount(sales), "From GET /sales/overview"),
    createMetric("Token Expires", connection ? formatDate(connection.expires_at) : "Not connected", connection?.environment || "Sandbox"),
  ];
}

function EndpointDebug({ data }: { data: unknown }) {
  if (!data) return null;

  return (
    <details className="distribution-json-details">
      <summary>View raw JSON</summary>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </details>
  );
}

function GenericDataTable({ data, fallbackTitle }: { data: unknown; fallbackTitle: string }) {
  const rows = asArray(data);

  if (!rows.length) {
    const payload = getPayloadData(data);

    if (isRecord(payload)) {
      const entries = Object.entries(payload).slice(0, 12);
      if (entries.length) {
        return (
          <div className="distribution-kv-grid">
            {entries.map(([key, value]) => (
              <div key={key}>
                <span>{key.replace(/_/g, " ")}</span>
                <strong>{stringifyCell(value)}</strong>
              </div>
            ))}
          </div>
        );
      }
    }

    return <p className="distribution-empty">No {fallbackTitle.toLowerCase()} data returned yet.</p>;
  }

  const recordRows = rows.filter(isRecord) as Record<string, unknown>[];
  if (!recordRows.length) {
    return (
      <div className="distribution-simple-list">
        {rows.slice(0, 20).map((row, index) => (
          <div key={`${fallbackTitle}-${index}`}>{stringifyCell(row)}</div>
        ))}
      </div>
    );
  }

  const preferredColumns = [
    "title",
    "name",
    "release_title",
    "artist",
    "type",
    "status",
    "upc",
    "isrc",
    "release_date",
    "created_at",
    "streams",
    "total_streams",
    "amount",
    "earnings",
    "channel",
    "territory",
    "code",
  ];

  const allKeys = Array.from(new Set(recordRows.flatMap((row) => Object.keys(row))));
  const columns = [
    ...preferredColumns.filter((column) => allKeys.includes(column)),
    ...allKeys.filter((column) => !preferredColumns.includes(column)),
  ].slice(0, 6);

  return (
    <div className="distribution-table-wrap">
      <table className="distribution-table">
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column}>{column.replace(/_/g, " ")}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {recordRows.slice(0, 20).map((row, rowIndex) => (
            <tr key={`${fallbackTitle}-${rowIndex}`}>
              {columns.map((column) => (
                <td key={column}>{stringifyCell(row[column])}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {recordRows.length > 20 ? <p className="distribution-table-note">Showing first 20 rows.</p> : null}
    </div>
  );
}

function EndpointCard({
  endpoint,
  state,
  connection,
  onLoad,
}: {
  endpoint: TooLostEndpointDefinition;
  state: EndpointState;
  connection: TooLostConnection | null;
  onLoad: (endpoint: TooLostEndpointDefinition) => void;
}) {
  const missingScope = endpoint.scope ? !connectionHasScope(connection, endpoint.scope) : false;

  return (
    <article className="distribution-panel-card">
      <div className="asset-card-header distribution-mini-header">
        <div>
          <span className="asset-type-pill">{endpoint.path}</span>
          <h3>{endpoint.label}</h3>
          <p>{endpoint.description}</p>
        </div>
        <button className="mini-action-btn" type="button" onClick={() => onLoad(endpoint)} disabled={state.loading || !connection}>
          {state.loading ? "Loading..." : state.data ? "Refresh" : "Load"}
        </button>
      </div>

      {missingScope ? (
        <div className="distribution-warning-box">
          This connection may not include <strong>{endpoint.scope}</strong>. Disconnect and reconnect Too Lost if this endpoint returns a 403 scope error.
        </div>
      ) : null}

      {state.error ? <div className="distribution-error-box">{state.error}</div> : null}

      {state.data ? (
        <>
          <GenericDataTable data={state.data} fallbackTitle={endpoint.label} />
          <EndpointDebug data={state.data} />
          {state.loadedAt ? <p className="distribution-loaded-at">Loaded {formatDate(state.loadedAt)}</p> : null}
        </>
      ) : (
        <p className="distribution-empty">Click Load to pull this from Too Lost sandbox.</p>
      )}
    </article>
  );
}

export default function DistributionPage({ oauthStatus, oauthMessage }: DistributionPageProps) {
  const [connection, setConnection] = useState<TooLostConnection | null>(null);
  const [connectionLoading, setConnectionLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");
  const [endpointResults, setEndpointResults] = useState<Partial<Record<TooLostEndpointKey, EndpointState>>>({});
  const [activeTab, setActiveTab] = useState<DashboardTab>("Overview");

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
    void loadConnection();
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

  async function handleDisconnect() {
    const confirmed = window.confirm("Disconnect Too Lost Sandbox from Track Adam OS?");
    if (!confirmed) return;

    setActionLoading(true);
    setError("");
    setEndpointResults({});

    try {
      await disconnectTooLost();
      setConnection(null);
    } catch (disconnectError) {
      setError(disconnectError instanceof Error ? disconnectError.message : "Could not disconnect Too Lost.");
    } finally {
      setActionLoading(false);
    }
  }

  async function loadEndpoint(endpoint: TooLostEndpointDefinition) {
    setEndpointResults((current) => ({
      ...current,
      [endpoint.key]: { ...getEndpointState(current, endpoint.key), loading: true, error: "" },
    }));

    try {
      const data = await fetchTooLostEndpoint(endpoint);
      setEndpointResults((current) => ({
        ...current,
        [endpoint.key]: {
          loading: false,
          error: "",
          data,
          loadedAt: new Date().toISOString(),
        },
      }));
    } catch (endpointError) {
      setEndpointResults((current) => ({
        ...current,
        [endpoint.key]: {
          loading: false,
          error: endpointError instanceof Error ? endpointError.message : `Could not load ${endpoint.label}.`,
          data: getEndpointState(current, endpoint.key).data,
          loadedAt: getEndpointState(current, endpoint.key).loadedAt,
        },
      }));
    }
  }

  async function loadDashboardBasics() {
    setActionLoading(true);
    setError("");

    const starterKeys: TooLostEndpointKey[] = ["profile", "releases", "analyticsOverview", "salesOverview"];

    try {
      for (const key of starterKeys) {
        const endpoint = TOOLOST_ENDPOINTS.find((item) => item.key === key);
        if (endpoint) {
          // eslint-disable-next-line no-await-in-loop
          await loadEndpoint(endpoint);
        }
      }
    } finally {
      setActionLoading(false);
    }
  }

  async function testProfile() {
    const endpoint = TOOLOST_ENDPOINTS.find((item) => item.key === "profile");
    if (endpoint) await loadEndpoint(endpoint);
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
  const profileResult = getEndpointState(endpointResults, "profile").data;
  const releasesResult = getEndpointState(endpointResults, "releases").data;
  const analyticsOverview = getEndpointState(endpointResults, "analyticsOverview").data;
  const salesOverview = getEndpointState(endpointResults, "salesOverview").data;
  const metrics = useMemo(
    () => makeOverviewMetrics(connection, profileResult, releasesResult, analyticsOverview, salesOverview),
    [connection, profileResult, releasesResult, analyticsOverview, salesOverview],
  );

  const tabs: DashboardTab[] = ["Overview", "Releases", "Analytics", "Sales", "Lookups", "Preferences", "Debug"];
  const endpointsByTab: Record<Exclude<DashboardTab, "Overview" | "Debug">, TooLostEndpointDefinition[]> = {
    Releases: TOOLOST_ENDPOINTS.filter((endpoint) => endpoint.section === "Catalog"),
    Analytics: TOOLOST_ENDPOINTS.filter((endpoint) => endpoint.section === "Analytics"),
    Sales: TOOLOST_ENDPOINTS.filter((endpoint) => endpoint.section === "Sales"),
    Lookups: TOOLOST_ENDPOINTS.filter((endpoint) => endpoint.section === "Lookup"),
    Preferences: TOOLOST_ENDPOINTS.filter((endpoint) => endpoint.section === "Preferences"),
  };

  const needsReconnectForSales = connected && !connectionHasScope(connection, "read:sales");

  return (
    <section className="page-section distribution-page distribution-dashboard-page">
      <div className="section-header distribution-hero-header">
        <div>
          <p className="eyebrow">Too Lost Integration</p>
          <h2>Distribution Dashboard</h2>
          <p>
            Manage Too Lost sandbox connection, catalog pulls, analytics snapshots, sales/royalty checks, and lookup data from inside Track Adam OS.
          </p>
        </div>
        <div className="distribution-hero-actions">
          {!connected ? (
            <button className="primary-btn" type="button" onClick={handleConnect} disabled={actionLoading || Boolean(configError)}>
              {actionLoading ? "Opening Too Lost..." : "Connect Too Lost Sandbox"}
            </button>
          ) : (
            <>
              <button className="primary-btn" type="button" onClick={loadDashboardBasics} disabled={actionLoading || expired}>
                {actionLoading ? "Loading..." : "Load Dashboard"}
              </button>
              <button className="secondary-btn" type="button" onClick={handleDisconnect} disabled={actionLoading}>
                Disconnect
              </button>
            </>
          )}
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

      {needsReconnectForSales ? (
        <div className="detail-section distribution-warning-box distribution-wide-warning">
          <strong>Reconnect recommended:</strong> The first OAuth token may have been created before we added <code>read:sales</code>. If Sales endpoints show a scope error, disconnect and reconnect Too Lost Sandbox once.
        </div>
      ) : null}

      <div className="distribution-top-grid">
        <article className="asset-card distribution-card distribution-connection-card">
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
              <span>Scopes Requested</span>
              <strong>{TOOLOST_SCOPES}</strong>
            </div>
            <div>
              <span>Current Token Scope</span>
              <strong>{connection?.scope || "Not connected"}</strong>
            </div>
            <div>
              <span>Expires</span>
              <strong>{connection ? formatDate(connection.expires_at) : "Not connected"}</strong>
            </div>
            <div>
              <span>Environment</span>
              <strong>{connection?.environment || "Sandbox setup"}</strong>
            </div>
          </div>

          <div className="asset-actions distribution-actions">
            {!connected ? (
              <button className="primary-btn" type="button" onClick={handleConnect} disabled={actionLoading || Boolean(configError)}>
                {actionLoading ? "Opening Too Lost..." : "Connect Too Lost Sandbox"}
              </button>
            ) : (
              <>
                <button className="primary-btn" type="button" onClick={testProfile} disabled={actionLoading || expired}>
                  Test /me
                </button>
                <button className="secondary-btn" type="button" onClick={loadDashboardBasics} disabled={actionLoading || expired}>
                  Load Dashboard
                </button>
              </>
            )}
          </div>
        </article>

        <article className="asset-card distribution-card distribution-roadmap-card">
          <div className="asset-card-header">
            <div>
              <span className="asset-type-pill">Build Status</span>
              <h3>Distribution Command Center</h3>
              <p>Phase 2 adds read-only data panels. Release creation comes later after every endpoint shape is confirmed.</p>
            </div>
          </div>

          <div className="checklist-list">
            <label><input type="checkbox" checked readOnly /> Add Distribution page</label>
            <label><input type="checkbox" checked readOnly /> Connect Too Lost with PKCE</label>
            <label><input type="checkbox" checked={connected} readOnly /> Store sandbox connection</label>
            <label><input type="checkbox" checked={Boolean(profileResult)} readOnly /> Confirm profile API</label>
            <label><input type="checkbox" checked={Boolean(releasesResult)} readOnly /> Pull releases catalog</label>
            <label><input type="checkbox" checked={Boolean(analyticsOverview)} readOnly /> Pull analytics overview</label>
            <label><input type="checkbox" checked={Boolean(salesOverview)} readOnly /> Pull sales overview</label>
          </div>
        </article>
      </div>

      <div className="distribution-tabs" role="tablist" aria-label="Distribution sections">
        {tabs.map((tab) => (
          <button
            key={tab}
            className={activeTab === tab ? "distribution-tab distribution-tab-active" : "distribution-tab"}
            type="button"
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === "Overview" ? (
        <div className="distribution-overview-panel">
          <div className="distribution-metric-grid">
            {metrics.map((metric) => (
              <article className="distribution-metric-card" key={metric.label}>
                <span>{metric.label}</span>
                <strong>{metric.value}</strong>
                {metric.helper ? <p>{metric.helper}</p> : null}
              </article>
            ))}
          </div>

          <div className="distribution-panel-grid">
            {TOOLOST_ENDPOINTS.filter((endpoint) => ["profile", "releases", "analyticsOverview", "salesOverview"].includes(endpoint.key)).map((endpoint) => (
              <EndpointCard
                key={endpoint.key}
                endpoint={endpoint}
                state={getEndpointState(endpointResults, endpoint.key)}
                connection={connection}
                onLoad={loadEndpoint}
              />
            ))}
          </div>
        </div>
      ) : null}

      {activeTab !== "Overview" && activeTab !== "Debug" ? (
        <div className="distribution-panel-grid">
          {endpointsByTab[activeTab as Exclude<DashboardTab, "Overview" | "Debug">].map((endpoint) => (
            <EndpointCard
              key={endpoint.key}
              endpoint={endpoint}
              state={getEndpointState(endpointResults, endpoint.key)}
              connection={connection}
              onLoad={loadEndpoint}
            />
          ))}
        </div>
      ) : null}

      {activeTab === "Debug" ? (
        <div className="detail-section ai-output-box distribution-debug-card">
          <div className="asset-card-header">
            <div>
              <span className="asset-type-pill">Debug</span>
              <h3>Too Lost API Responses</h3>
              <p>Tokens are never shown here. This only shows endpoint responses that you loaded in this session.</p>
            </div>
          </div>
          <pre>{JSON.stringify(endpointResults, null, 2)}</pre>
        </div>
      ) : null}
    </section>
  );
}
