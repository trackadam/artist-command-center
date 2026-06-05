import { useEffect, useMemo, useState } from "react";
import {
  callTooLostEndpoint,
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

type DashboardTab = "Overview" | "Catalog" | "Analytics" | "Sales" | "Setup" | "Developer";

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

    const commonLists = ["items", "results", "releases", "tracks", "channels", "territories", "platforms", "genres", "languages", "countries", "artists"];
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

function getEndpointState(results: Partial<Record<TooLostEndpointKey, EndpointState>>, key: TooLostEndpointKey) {
  return results[key] || defaultEndpointState;
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

function createMetric(label: string, value: unknown, helper?: string): MetricCard {
  return {
    label,
    value: stringifyCell(value),
    helper,
  };
}

function getProfileRecord(profile: unknown) {
  const profileData = getPayloadData(profile);
  return isRecord(profileData) ? profileData : null;
}

function getOverviewMetrics(
  connection: TooLostConnection | null,
  profile: unknown,
  releases: unknown,
  analytics: unknown,
  sales: unknown,
): MetricCard[] {
  const profileRecord = getProfileRecord(profile);
  const analyticsData = getPayloadData(analytics);
  const analyticsRecord = isRecord(analyticsData) ? analyticsData : null;
  const salesData = getPayloadData(sales);
  const salesRecord = isRecord(salesData) ? salesData : null;

  return [
    createMetric(
      "Account",
      profileRecord ? `${stringifyCell(profileRecord.first_name)} ${stringifyCell(profileRecord.last_name)}` : "Not loaded",
      profileRecord?.email ? stringifyCell(profileRecord.email) : undefined,
    ),
    createMetric("Account Type", profileRecord?.type || "—", profileRecord?.confirmed === true ? "Confirmed" : "Load /me to confirm"),
    createMetric("Catalog", getCount(releases), "Releases returned"),
    createMetric("Streams", analyticsRecord ? getRecordValue(analyticsRecord, ["totalStreams", "total_streams", "streams"]) || "0" : "—", "Last 30 days if available"),
    createMetric("Sales", salesRecord ? getRecordValue(salesRecord, ["amount", "total_amount", "earnings", "total"] ) || "—" : "—", "Requires Too Lost earnings scope"),
    createMetric("Token", connection ? (isTooLostTokenExpired(connection) ? "Expired" : "Active") : "Not connected", connection ? formatDate(connection.expires_at) : "Sandbox"),
  ];
}

function getRows(value: unknown) {
  return asArray(value).filter(isRecord) as Record<string, unknown>[];
}

function getPlatformOptions(platforms: unknown) {
  const rows = getRows(platforms);
  const options = rows
    .map((row) => getRecordValue(row, ["platform", "channel", "service", "slug", "code", "name", "id"]))
    .filter((value): value is string | number => typeof value === "string" || typeof value === "number")
    .map(String);

  return Array.from(new Set(options)).slice(0, 50);
}

function DataTable({ data, emptyLabel = "No data returned yet." }: { data: unknown; emptyLabel?: string }) {
  const rows = getRows(data);

  if (!rows.length) {
    const payload = getPayloadData(data);
    if (isRecord(payload)) {
      const entries = Object.entries(payload).slice(0, 10);
      if (entries.length) {
        return (
          <div className="distribution-v5-kv-list">
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

    return <p className="distribution-empty">{emptyLabel}</p>;
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

  const allKeys = Array.from(new Set(rows.flatMap((row) => Object.keys(row))));
  const columns = [
    ...preferredColumns.filter((column) => allKeys.includes(column)),
    ...allKeys.filter((column) => !preferredColumns.includes(column)),
  ].slice(0, 7);

  return (
    <div className="distribution-v5-table-wrap">
      <table className="distribution-table distribution-v5-table">
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column}>{column.replace(/_/g, " ")}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.slice(0, 25).map((row, rowIndex) => (
            <tr key={`row-${rowIndex}`}>
              {columns.map((column) => (
                <td key={column}>{stringifyCell(row[column])}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length > 25 ? <p className="distribution-table-note">Showing first 25 rows.</p> : null}
    </div>
  );
}

function InlineError({ message }: { message?: string }) {
  if (!message) return null;
  return <div className="distribution-error-box distribution-v5-error">{message}</div>;
}

function RawJson({ data }: { data: unknown }) {
  if (!data) return null;

  return (
    <details className="distribution-json-details distribution-v5-json">
      <summary>Raw JSON</summary>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </details>
  );
}

function findEndpoint(key: TooLostEndpointKey) {
  const endpoint = TOOLOST_ENDPOINTS.find((item) => item.key === key);
  if (!endpoint) throw new Error(`Missing Too Lost endpoint config for ${key}.`);
  return endpoint;
}

export default function DistributionPage({ oauthStatus, oauthMessage }: DistributionPageProps) {
  const [connection, setConnection] = useState<TooLostConnection | null>(null);
  const [connectionLoading, setConnectionLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");
  const [endpointResults, setEndpointResults] = useState<Partial<Record<TooLostEndpointKey, EndpointState>>>({});
  const [activeTab, setActiveTab] = useState<DashboardTab>("Overview");
  const [selectedPlatform, setSelectedPlatform] = useState("");
  const [totalStreamsState, setTotalStreamsState] = useState<EndpointState>(defaultEndpointState);

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
    setTotalStreamsState(defaultEndpointState);

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

  async function loadMany(keys: TooLostEndpointKey[]) {
    setActionLoading(true);
    setError("");

    try {
      for (const key of keys) {
        // eslint-disable-next-line no-await-in-loop
        await loadEndpoint(findEndpoint(key));
      }
    } finally {
      setActionLoading(false);
    }
  }

  async function loadTotalStreams() {
    if (!selectedPlatform.trim()) {
      setTotalStreamsState({ loading: false, error: "Choose a platform first.", data: totalStreamsState.data, loadedAt: totalStreamsState.loadedAt });
      return;
    }

    setTotalStreamsState((current) => ({ ...current, loading: true, error: "" }));

    try {
      const data = await callTooLostEndpoint(`/analytics/platforms/total-streams?platform=${encodeURIComponent(selectedPlatform)}`);
      setTotalStreamsState({ loading: false, error: "", data, loadedAt: new Date().toISOString() });
    } catch (streamError) {
      setTotalStreamsState((current) => ({
        loading: false,
        error: streamError instanceof Error ? streamError.message : "Could not load total streams.",
        data: current.data,
        loadedAt: current.loadedAt,
      }));
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
  const profileResult = getEndpointState(endpointResults, "profile").data;
  const releasesResult = getEndpointState(endpointResults, "releases").data;
  const analyticsOverview = getEndpointState(endpointResults, "analyticsOverview").data;
  const analyticsTracks = getEndpointState(endpointResults, "analyticsTracks");
  const analyticsPlatforms = getEndpointState(endpointResults, "analyticsPlatforms");
  const salesOverview = getEndpointState(endpointResults, "salesOverview").data;
  const profileRecord = getProfileRecord(profileResult);
  const platformOptions = useMemo(() => getPlatformOptions(analyticsPlatforms.data), [analyticsPlatforms.data]);
  const metrics = useMemo(
    () => getOverviewMetrics(connection, profileResult, releasesResult, analyticsOverview, salesOverview),
    [connection, profileResult, releasesResult, analyticsOverview, salesOverview],
  );

  const canLoad = connected && !expired && !actionLoading;
  const tabs: DashboardTab[] = ["Overview", "Catalog", "Analytics", "Sales", "Setup", "Developer"];

  return (
    <section className="page-section distribution-page distribution-dashboard-page distribution-v5-page">
      <div className="section-header distribution-hero-header distribution-v5-hero">
        <div>
          <p className="eyebrow">Too Lost Integration</p>
          <h2>Distribution Dashboard</h2>
          <p>Clean command center for catalog, analytics, royalties, setup data, and Too Lost sandbox status.</p>
        </div>
        <div className="distribution-hero-actions">
          {!connected ? (
            <button className="primary-btn" type="button" onClick={handleConnect} disabled={actionLoading || Boolean(configError)}>
              {actionLoading ? "Opening Too Lost..." : "Connect Too Lost Sandbox"}
            </button>
          ) : (
            <>
              <button className="primary-btn" type="button" onClick={() => void loadMany(["profile", "releases", "analyticsOverview"])} disabled={!canLoad}>
                {actionLoading ? "Syncing..." : "Sync Overview"}
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

      <div className="distribution-v5-status-row">
        <article className="asset-card distribution-v5-status-card">
          <span className={connected && !expired ? "status-pill status-live" : expired ? "status-pill status-warning" : "status-pill"}>
            {connectionLoading ? "Checking..." : connected ? (expired ? "Token Expired" : "Sandbox Connected") : "Not Connected"}
          </span>
          <h3>{profileRecord ? `${stringifyCell(profileRecord.first_name)} ${stringifyCell(profileRecord.last_name)}` : "Too Lost Sandbox"}</h3>
          <p>{profileRecord?.email ? stringifyCell(profileRecord.email) : "Connect, then sync profile to show account details."}</p>
        </article>

        <article className="asset-card distribution-v5-status-card">
          <span>Current Scope</span>
          <strong>{connection?.scope || "Not connected"}</strong>
          {connection && !connectionHasScope(connection, "read:catalog") ? <p className="distribution-v5-muted-warning">Catalog is not granted on this token.</p> : null}
        </article>

        <article className="asset-card distribution-v5-status-card">
          <span>Token Expires</span>
          <strong>{connection ? formatDate(connection.expires_at) : "Not connected"}</strong>
          <p>{configPreview?.apiBaseUrl || "Missing API base URL"}</p>
        </article>
      </div>

      <div className="distribution-tabs distribution-v5-tabs" role="tablist" aria-label="Distribution sections">
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
        <div className="distribution-v5-section">
          <div className="distribution-metric-grid distribution-v5-metrics">
            {metrics.map((metric) => (
              <article className="distribution-metric-card" key={metric.label}>
                <span>{metric.label}</span>
                <strong>{metric.value}</strong>
                {metric.helper ? <p>{metric.helper}</p> : null}
              </article>
            ))}
          </div>

          <div className="distribution-v5-command-grid">
            <article className="asset-card distribution-v5-command-card">
              <h3>Catalog</h3>
              <p>Pull release list from Too Lost and review catalog data.</p>
              <button className="secondary-btn" type="button" disabled={!canLoad} onClick={() => void loadMany(["releases"])}>Open Catalog Sync</button>
            </article>
            <article className="asset-card distribution-v5-command-card">
              <h3>Analytics</h3>
              <p>Load overview, tracks, platform breakdowns, and stream checks.</p>
              <button className="secondary-btn" type="button" disabled={!canLoad} onClick={() => void loadMany(["analyticsOverview", "analyticsTracks", "analyticsPlatforms"])}>Sync Analytics</button>
            </article>
            <article className="asset-card distribution-v5-command-card">
              <h3>Sales / Royalties</h3>
              <p>Sales endpoints may need Too Lost to confirm whether your sandbox uses read:earnings or read:sales.</p>
              <button className="secondary-btn" type="button" disabled={!canLoad} onClick={() => void loadMany(["salesOverview"])}>Try Sales Sync</button>
            </article>
          </div>
        </div>
      ) : null}

      {activeTab === "Catalog" ? (
        <div className="distribution-v5-section">
          <div className="distribution-v5-section-head">
            <div>
              <h3>Catalog</h3>
              <p>Releases from Too Lost sandbox. This becomes the real release management table later.</p>
            </div>
            <button className="primary-btn" type="button" disabled={!canLoad || getEndpointState(endpointResults, "releases").loading} onClick={() => void loadMany(["releases"])}>
              {getEndpointState(endpointResults, "releases").loading ? "Loading..." : "Load Releases"}
            </button>
          </div>
          <InlineError message={getEndpointState(endpointResults, "releases").error} />
          <DataTable data={releasesResult} emptyLabel="No releases returned yet. Click Load Releases." />
        </div>
      ) : null}

      {activeTab === "Analytics" ? (
        <div className="distribution-v5-section">
          <div className="distribution-v5-section-head">
            <div>
              <h3>Analytics</h3>
              <p>Streaming overview, tracks, and platform data in one clean page.</p>
            </div>
            <button className="primary-btn" type="button" disabled={!canLoad || actionLoading} onClick={() => void loadMany(["analyticsOverview", "analyticsTracks", "analyticsPlatforms"])}>
              {actionLoading ? "Loading..." : "Load Analytics"}
            </button>
          </div>

          <div className="distribution-v5-two-col">
            <article className="asset-card distribution-v5-panel">
              <h3>Overview</h3>
              <InlineError message={getEndpointState(endpointResults, "analyticsOverview").error} />
              <DataTable data={analyticsOverview} emptyLabel="No analytics overview loaded yet." />
            </article>
            <article className="asset-card distribution-v5-panel">
              <h3>Platform Total Streams</h3>
              <p className="distribution-empty">Choose a platform before loading this endpoint.</p>
              <div className="distribution-v5-inline-form">
                <select value={selectedPlatform} onChange={(event) => setSelectedPlatform(event.target.value)}>
                  <option value="">Choose platform</option>
                  {platformOptions.map((platform) => (
                    <option key={platform} value={platform}>{platform}</option>
                  ))}
                </select>
                <button className="secondary-btn" type="button" disabled={!canLoad || totalStreamsState.loading || !selectedPlatform} onClick={loadTotalStreams}>
                  {totalStreamsState.loading ? "Loading..." : "Load"}
                </button>
              </div>
              <InlineError message={totalStreamsState.error} />
              <DataTable data={totalStreamsState.data} emptyLabel="No platform total stream data loaded yet." />
            </article>
          </div>

          <div className="distribution-v5-two-col">
            <article className="asset-card distribution-v5-panel">
              <h3>Tracks</h3>
              <InlineError message={analyticsTracks.error} />
              <DataTable data={analyticsTracks.data} emptyLabel="No track analytics returned yet." />
            </article>
            <article className="asset-card distribution-v5-panel">
              <h3>Platforms</h3>
              <InlineError message={analyticsPlatforms.error} />
              <DataTable data={analyticsPlatforms.data} emptyLabel="No platform analytics returned yet." />
            </article>
          </div>
        </div>
      ) : null}

      {activeTab === "Sales" ? (
        <div className="distribution-v5-section">
          <div className="distribution-v5-section-head">
            <div>
              <h3>Sales / Royalties</h3>
              <p>If Too Lost returns Invalid scope(s), ask them to confirm read:earnings vs read:sales for sandbox sales endpoints.</p>
            </div>
            <button className="primary-btn" type="button" disabled={!canLoad || actionLoading} onClick={() => void loadMany(["salesOverview", "salesTracks", "salesReleases", "salesChannels", "salesTerritories"])}>
              {actionLoading ? "Loading..." : "Load Sales"}
            </button>
          </div>

          <div className="distribution-v5-two-col">
            {(["salesOverview", "salesTracks", "salesReleases", "salesChannels", "salesTerritories"] as TooLostEndpointKey[]).map((key) => {
              const endpoint = findEndpoint(key);
              const state = getEndpointState(endpointResults, key);
              return (
                <article className="asset-card distribution-v5-panel" key={key}>
                  <h3>{endpoint.label}</h3>
                  <InlineError message={state.error} />
                  <DataTable data={state.data} emptyLabel={`No ${endpoint.label.toLowerCase()} loaded yet.`} />
                </article>
              );
            })}
          </div>
        </div>
      ) : null}

      {activeTab === "Setup" ? (
        <div className="distribution-v5-section">
          <div className="distribution-v5-section-head">
            <div>
              <h3>Setup Data</h3>
              <p>Lookup and preference data used later for release creation forms.</p>
            </div>
            <button className="primary-btn" type="button" disabled={!canLoad || actionLoading} onClick={() => void loadMany(["lookupPlatforms", "lookupGenres", "lookupLanguages", "lookupCountries", "preferencesLabel", "preferencesArtists"])}>
              {actionLoading ? "Loading..." : "Load Setup Data"}
            </button>
          </div>

          <div className="distribution-v5-two-col">
            {(["lookupPlatforms", "lookupGenres", "lookupLanguages", "lookupCountries", "preferencesLabel", "preferencesArtists"] as TooLostEndpointKey[]).map((key) => {
              const endpoint = findEndpoint(key);
              const state = getEndpointState(endpointResults, key);
              return (
                <article className="asset-card distribution-v5-panel" key={key}>
                  <h3>{endpoint.label}</h3>
                  <InlineError message={state.error} />
                  <DataTable data={state.data} emptyLabel={`No ${endpoint.label.toLowerCase()} loaded yet.`} />
                </article>
              );
            })}
          </div>
        </div>
      ) : null}

      {activeTab === "Developer" ? (
        <div className="distribution-v5-section">
          <div className="distribution-v5-section-head">
            <div>
              <h3>Developer Debug</h3>
              <p>Raw API responses and endpoint status. Keep this hidden during normal use.</p>
            </div>
          </div>

          <div className="distribution-v5-two-col">
            <article className="asset-card distribution-v5-panel">
              <h3>Connection</h3>
              <div className="distribution-v5-kv-list">
                <div><span>API Base</span><strong>{configPreview?.apiBaseUrl || "Missing"}</strong></div>
                <div><span>Redirect URI</span><strong>{configPreview?.redirectUri || "Missing"}</strong></div>
                <div><span>Requested Scopes</span><strong>{TOOLOST_SCOPES}</strong></div>
                <div><span>Current Scope</span><strong>{connection?.scope || "Not connected"}</strong></div>
              </div>
            </article>
            <article className="asset-card distribution-v5-panel">
              <h3>Loaded Responses</h3>
              <RawJson data={{ endpointResults, totalStreamsState }} />
            </article>
          </div>
        </div>
      ) : null}
    </section>
  );
}
