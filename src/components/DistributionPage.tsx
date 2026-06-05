import { useEffect, useMemo, useState } from "react";
import {
  callTooLostEndpoint,
  createTooLostReleaseDraft,
  getTooLostRelease,
  getTooLostReleaseTracks,
  listTooLostReleases,
  updateTooLostReleaseMetadata,
  validateTooLostUpc,
  validateTooLostIsrc,
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

type DashboardTab = "Overview" | "Release Builder" | "Analytics" | "Sales" | "Setup" | "Developer";
type ReleaseBuilderStepKey = "draft" | "catalog" | "metadata" | "tracks" | "validation" | "review";

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

type ReleaseDraftForm = {
  title: string;
  type: string;
  label: string;
  artistName: string;
  artistId: string;
};

type ReleaseFilterForm = {
  status: string;
  type: string;
  search: string;
};

type ReleaseMetadataForm = {
  title: string;
  type: string;
  label: string;
  releaseDate: string;
  upc: string;
  genre: string;
  language: string;
  explicit: string;
  copyright: string;
  phonographicCopyright: string;
};

const defaultEndpointState: EndpointState = {
  loading: false,
  error: "",
  data: null,
};

const emptyReleaseDraftForm: ReleaseDraftForm = {
  title: "",
  type: "Single",
  label: "",
  artistName: "",
  artistId: "",
};

const emptyReleaseFilterForm: ReleaseFilterForm = {
  status: "",
  type: "",
  search: "",
};

const emptyReleaseMetadataForm: ReleaseMetadataForm = {
  title: "",
  type: "",
  label: "",
  releaseDate: "",
  upc: "",
  genre: "",
  language: "",
  explicit: "",
  copyright: "",
  phonographicCopyright: "",
};

const releaseStatusOptions = ["draft", "in_review", "live", "takedown_pending", "takedown_complete"];
const releaseTypeOptions = ["Single", "EP", "Album", "Compilation", "MusicVideo", "Music Video"];

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

function getStringValueFromPayload(value: unknown, keys: string[]) {
  const payload = getPayloadData(value);
  if (!isRecord(payload)) return "";

  const found = getRecordValue(payload, keys);
  if (found === null || found === undefined) return "";

  if (typeof found === "string" || typeof found === "number" || typeof found === "boolean") {
    return String(found);
  }

  return "";
}

function getExplicitMetadataValue(value: unknown) {
  const raw = getStringValueFromPayload(value, ["explicit", "is_explicit", "explicit_content", "parental_advisory"]);
  if (!raw) return "";

  const normalized = raw.toLowerCase();
  if (["true", "1", "yes", "explicit"].includes(normalized)) return "explicit";
  if (["false", "0", "no", "clean"].includes(normalized)) return "clean";

  return raw;
}

function extractReleaseMetadataForm(release: unknown): ReleaseMetadataForm {
  return {
    title: getStringValueFromPayload(release, ["title", "release_title", "name"]),
    type: getStringValueFromPayload(release, ["type", "release_type"]),
    label: getStringValueFromPayload(release, ["label", "label_name"]),
    releaseDate: getStringValueFromPayload(release, ["releaseDate", "release_date", "date"]),
    upc: getStringValueFromPayload(release, ["upc", "barcode"]),
    genre: getStringValueFromPayload(release, ["genre", "primary_genre", "genre_id"]),
    language: getStringValueFromPayload(release, ["language", "language_code"]),
    explicit: getExplicitMetadataValue(release),
    copyright: getStringValueFromPayload(release, ["copyright", "c_line", "copyright_text"]),
    phonographicCopyright: getStringValueFromPayload(release, ["phonographicCopyright", "p_line", "phonographic_copyright"]),
  };
}

function buildReleaseMetadataPayload(form: ReleaseMetadataForm) {
  const payload: Record<string, unknown> = {};

  const add = (key: string, value: string) => {
    const trimmed = value.trim();
    if (trimmed) payload[key] = trimmed;
  };

  add("title", form.title);
  add("type", form.type);
  add("label", form.label);
  add("releaseDate", form.releaseDate);
  add("upc", form.upc);
  add("genre", form.genre);
  add("language", form.language);
  add("copyright", form.copyright);
  add("phonographicCopyright", form.phonographicCopyright);

  if (form.explicit === "explicit") payload.explicit = true;
  if (form.explicit === "clean") payload.explicit = false;

  return payload;
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
    "id",
    "title",
    "name",
    "release_title",
    "artist",
    "label",
    "type",
    "status",
    "upc",
    "catalogNumber",
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


function getReleaseId(row: Record<string, unknown>) {
  const id = getRecordValue(row, ["id", "releaseId", "release_id"]);
  return id === null ? "" : String(id);
}

function ReleaseTable({
  data,
  selectedReleaseId,
  onSelect,
}: {
  data: unknown;
  selectedReleaseId: string;
  onSelect: (releaseId: string) => void;
}) {
  const rows = getRows(data);

  if (!rows.length) {
    return <p className="distribution-empty">No releases returned yet. Load Release Builder to pull draft and catalog data.</p>;
  }

  return (
    <div className="distribution-v5-table-wrap distribution-roadmap-table-wrap">
      <table className="distribution-table distribution-v5-table distribution-roadmap-table">
        <thead>
          <tr>
            <th>Title</th>
            <th>Type</th>
            <th>Status</th>
            <th>UPC</th>
            <th>Release Date</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {rows.slice(0, 30).map((row, rowIndex) => {
            const releaseId = getReleaseId(row);
            const active = releaseId && releaseId === selectedReleaseId;
            return (
              <tr key={releaseId || `release-${rowIndex}`} className={active ? "distribution-selected-row" : undefined}>
                <td>{stringifyCell(getRecordValue(row, ["title", "name", "release_title"]))}</td>
                <td>{stringifyCell(getRecordValue(row, ["type", "releaseType"]))}</td>
                <td>{stringifyCell(getRecordValue(row, ["status"]))}</td>
                <td>{stringifyCell(getRecordValue(row, ["upc"]))}</td>
                <td>{stringifyCell(getRecordValue(row, ["releaseDate", "release_date", "originalReleaseDate"]))}</td>
                <td>
                  <button className="mini-action-btn" type="button" disabled={!releaseId} onClick={() => releaseId && onSelect(releaseId)}>
                    Details
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
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
  const [activeReleaseStep, setActiveReleaseStep] = useState<ReleaseBuilderStepKey>("draft");
  const [selectedPlatform, setSelectedPlatform] = useState("");
  const [totalStreamsState, setTotalStreamsState] = useState<EndpointState>(defaultEndpointState);
  const [releaseFilters, setReleaseFilters] = useState<ReleaseFilterForm>(emptyReleaseFilterForm);
  const [selectedReleaseId, setSelectedReleaseId] = useState("");
  const [releaseDetailState, setReleaseDetailState] = useState<EndpointState>(defaultEndpointState);
  const [releaseTracksState, setReleaseTracksState] = useState<EndpointState>(defaultEndpointState);
  const [releaseDraftForm, setReleaseDraftForm] = useState<ReleaseDraftForm>(emptyReleaseDraftForm);
  const [releaseMetadataForm, setReleaseMetadataForm] = useState<ReleaseMetadataForm>(emptyReleaseMetadataForm);
  const [metadataUpdateState, setMetadataUpdateState] = useState<EndpointState>(defaultEndpointState);
  const [createReleaseState, setCreateReleaseState] = useState<EndpointState>(defaultEndpointState);
  const [upcToValidate, setUpcToValidate] = useState("");
  const [upcValidationState, setUpcValidationState] = useState<EndpointState>(defaultEndpointState);
  const [isrcToValidate, setIsrcToValidate] = useState("");
  const [isrcValidationState, setIsrcValidationState] = useState<EndpointState>(defaultEndpointState);

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
    setSelectedReleaseId("");
    setReleaseDetailState(defaultEndpointState);
    setReleaseTracksState(defaultEndpointState);
    setReleaseMetadataForm(emptyReleaseMetadataForm);
    setMetadataUpdateState(defaultEndpointState);
    setCreateReleaseState(defaultEndpointState);
    setUpcValidationState(defaultEndpointState);
    setIsrcValidationState(defaultEndpointState);

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


  async function loadReleasesWithFilters() {
    setEndpointResults((current) => ({
      ...current,
      releases: { ...getEndpointState(current, "releases"), loading: true, error: "" },
    }));

    try {
      const data = await listTooLostReleases({
        status: releaseFilters.status,
        type: releaseFilters.type,
        search: releaseFilters.search,
        page: 1,
        perPage: 25,
      });

      setEndpointResults((current) => ({
        ...current,
        releases: {
          loading: false,
          error: "",
          data,
          loadedAt: new Date().toISOString(),
        },
      }));
    } catch (releaseError) {
      setEndpointResults((current) => ({
        ...current,
        releases: {
          loading: false,
          error: releaseError instanceof Error ? releaseError.message : "Could not load releases.",
          data: getEndpointState(current, "releases").data,
          loadedAt: getEndpointState(current, "releases").loadedAt,
        },
      }));
    }
  }

  async function loadReleaseDetails(releaseId: string) {
    setSelectedReleaseId(releaseId);
    setReleaseDetailState((current) => ({ ...current, loading: true, error: "" }));
    setReleaseTracksState((current) => ({ ...current, loading: true, error: "" }));

    try {
      const [release, tracks] = await Promise.all([
        getTooLostRelease(releaseId),
        getTooLostReleaseTracks(releaseId),
      ]);

      setReleaseDetailState({ loading: false, error: "", data: release, loadedAt: new Date().toISOString() });
      setReleaseMetadataForm(extractReleaseMetadataForm(release));
      setReleaseTracksState({ loading: false, error: "", data: tracks, loadedAt: new Date().toISOString() });
    } catch (detailError) {
      const message = detailError instanceof Error ? detailError.message : "Could not load release details.";
      setReleaseDetailState((current) => ({ loading: false, error: message, data: current.data, loadedAt: current.loadedAt }));
      setReleaseTracksState((current) => ({ loading: false, error: message, data: current.data, loadedAt: current.loadedAt }));
    }
  }

  async function createReleaseDraft() {
    setCreateReleaseState({ loading: true, error: "", data: createReleaseState.data, loadedAt: createReleaseState.loadedAt });

    try {
      if (!releaseDraftForm.title.trim()) throw new Error("Release title is required.");
      if (!releaseDraftForm.artistName.trim()) throw new Error("Primary artist name is required.");

      const artistId = releaseDraftForm.artistId.trim() ? Number(releaseDraftForm.artistId) : undefined;
      if (releaseDraftForm.artistId.trim() && Number.isNaN(artistId)) throw new Error("Artist ID must be a number.");

      const payload = {
        type: releaseDraftForm.type,
        title: releaseDraftForm.title.trim(),
        label: releaseDraftForm.label.trim() || undefined,
        participants: [
          {
            name: releaseDraftForm.artistName.trim(),
            ...(artistId ? { artistId } : {}),
            role: ["primary"],
          },
        ],
      };

      const data = await createTooLostReleaseDraft(payload);
      setCreateReleaseState({ loading: false, error: "", data, loadedAt: new Date().toISOString() });
      setReleaseDraftForm(emptyReleaseDraftForm);
      await loadReleasesWithFilters();
    } catch (draftError) {
      setCreateReleaseState((current) => ({
        loading: false,
        error: draftError instanceof Error ? draftError.message : "Could not create release draft.",
        data: current.data,
        loadedAt: current.loadedAt,
      }));
    }
  }

  async function saveReleaseMetadata() {
    setMetadataUpdateState({ loading: true, error: "", data: metadataUpdateState.data, loadedAt: metadataUpdateState.loadedAt });

    try {
      if (!selectedReleaseId) throw new Error("Select a release before saving metadata.");
      const payload = buildReleaseMetadataPayload(releaseMetadataForm);
      if (!Object.keys(payload).length) throw new Error("Enter at least one metadata value to save.");

      const data = await updateTooLostReleaseMetadata(selectedReleaseId, payload);
      setMetadataUpdateState({ loading: false, error: "", data, loadedAt: new Date().toISOString() });
      await loadReleaseDetails(selectedReleaseId);
    } catch (metadataError) {
      setMetadataUpdateState((current) => ({
        loading: false,
        error: metadataError instanceof Error ? metadataError.message : "Could not update release metadata.",
        data: current.data,
        loadedAt: current.loadedAt,
      }));
    }
  }

  async function validateUpc() {
    setUpcValidationState({ loading: true, error: "", data: upcValidationState.data, loadedAt: upcValidationState.loadedAt });

    try {
      if (!upcToValidate.trim()) throw new Error("Enter a UPC first.");
      const data = await validateTooLostUpc(upcToValidate.trim(), selectedReleaseId || undefined);
      setUpcValidationState({ loading: false, error: "", data, loadedAt: new Date().toISOString() });
    } catch (upcError) {
      setUpcValidationState((current) => ({
        loading: false,
        error: upcError instanceof Error ? upcError.message : "Could not validate UPC.",
        data: current.data,
        loadedAt: current.loadedAt,
      }));
    }
  }

  async function validateIsrc() {
    setIsrcValidationState({ loading: true, error: "", data: isrcValidationState.data, loadedAt: isrcValidationState.loadedAt });

    try {
      if (!isrcToValidate.trim()) throw new Error("Enter an ISRC first.");
      const data = await validateTooLostIsrc(isrcToValidate.trim(), selectedReleaseId || undefined);
      setIsrcValidationState({ loading: false, error: "", data, loadedAt: new Date().toISOString() });
    } catch (isrcError) {
      setIsrcValidationState((current) => ({
        loading: false,
        error: isrcError instanceof Error ? isrcError.message : "Could not validate ISRC.",
        data: current.data,
        loadedAt: current.loadedAt,
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
  const releaseDraftReady = Boolean(createReleaseState.data);
  const releasesReady = Boolean(releasesResult);
  const selectedReleaseReady = Boolean(selectedReleaseId && releaseDetailState.data);
  const metadataSaved = Boolean(metadataUpdateState.data);
  const tracksReady = Boolean(releaseTracksState.data);
  const upcValidated = Boolean(upcValidationState.data);

  const releaseWorkflowSteps: Array<{
    key: ReleaseBuilderStepKey;
    number: string;
    label: string;
    helper: string;
    complete: boolean;
    locked?: boolean;
  }> = [
    {
      key: "draft",
      number: "01",
      label: "Draft",
      helper: "Create or load a sandbox release draft.",
      complete: releaseDraftReady || releasesReady,
    },
    {
      key: "catalog",
      number: "02",
      label: "Catalog",
      helper: "Find the right release record.",
      complete: releasesReady,
    },
    {
      key: "metadata",
      number: "03",
      label: "Metadata",
      helper: "Edit selected release metadata.",
      complete: selectedReleaseReady && metadataSaved,
    },
    {
      key: "tracks",
      number: "04",
      label: "Tracks",
      helper: "Inspect track list and locked track tools.",
      complete: tracksReady,
    },
    {
      key: "validation",
      number: "05",
      label: "Validation",
      helper: "Run UPC and ISRC checks before submission.",
      complete: upcValidated || Boolean(isrcValidationState.data),
    },
    {
      key: "review",
      number: "06",
      label: "Review",
      helper: "Final review and submit tools stay locked for now.",
      complete: false,
      locked: true,
    },
  ];
  const tabs: DashboardTab[] = ["Overview", "Release Builder", "Analytics", "Sales", "Setup", "Developer"];

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
              <h3>Release Builder</h3>
              <p>Create sandbox release drafts, pull release lists, review tracks, and validate UPCs before moving toward submit tools.</p>
              <button className="secondary-btn" type="button" disabled={!canLoad} onClick={() => setActiveTab("Release Builder")}>Open Release Builder</button>
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

      {activeTab === "Release Builder" ? (
        <div className="distribution-v5-section distribution-roadmaps-section release-builder-workspace">
          <div className="distribution-v5-section-head">
            <div>
              <h3>Release Builder</h3>
              <p>Guided sandbox workflow for creating drafts, finding releases, editing metadata, inspecting tracks, validating identifiers, and preparing a final review.</p>
            </div>
            <button className="primary-btn" type="button" disabled={!canLoad || getEndpointState(endpointResults, "releases").loading} onClick={loadReleasesWithFilters}>
              {getEndpointState(endpointResults, "releases").loading ? "Loading..." : "Load Releases"}
            </button>
          </div>

          <div className="release-builder-stepper release-builder-stepper-compact" aria-label="Release Builder workflow">
            {releaseWorkflowSteps.map((step) => (
              <button
                key={step.key}
                type="button"
                className={`release-builder-step ${activeReleaseStep === step.key ? "release-builder-step-active" : ""} ${step.complete ? "release-builder-step-complete" : ""} ${step.locked ? "release-builder-step-locked" : ""}`}
                onClick={() => setActiveReleaseStep(step.key)}
              >
                <span>{step.number}</span>
                <strong>{step.label}</strong>
                <small>{step.helper}</small>
              </button>
            ))}
          </div>

          {activeReleaseStep === "draft" ? (
            <div className="release-builder-step-panel release-builder-draft-panel">
              <article id="release-draft-section" className="asset-card distribution-v5-panel distribution-roadmap-form-card release-builder-workflow-card">
                <div className="distribution-v11-panel-heading">
                  <div>
                    <span className="asset-type-pill">Sandbox Draft</span>
                    <h3>Create Release Draft</h3>
                    <p>Start with the minimum required Too Lost draft data. Once the draft exists, use the catalog step to pull the release and continue safely.</p>
                  </div>
                </div>
                <div className="distribution-form-grid">
                  <label>
                    <span>Release Title</span>
                    <input value={releaseDraftForm.title} onChange={(event) => setReleaseDraftForm((current) => ({ ...current, title: event.target.value }))} placeholder="Better Late" />
                  </label>
                  <label>
                    <span>Release Type</span>
                    <select value={releaseDraftForm.type} onChange={(event) => setReleaseDraftForm((current) => ({ ...current, type: event.target.value }))}>
                      {releaseTypeOptions.map((type) => <option key={type} value={type}>{type}</option>)}
                    </select>
                  </label>
                  <label>
                    <span>Label</span>
                    <input value={releaseDraftForm.label} onChange={(event) => setReleaseDraftForm((current) => ({ ...current, label: event.target.value }))} placeholder="Track Adam / SWU" />
                  </label>
                  <label>
                    <span>Primary Artist</span>
                    <input value={releaseDraftForm.artistName} onChange={(event) => setReleaseDraftForm((current) => ({ ...current, artistName: event.target.value }))} placeholder="Artist name" />
                  </label>
                  <label>
                    <span>Too Lost Artist ID optional</span>
                    <input value={releaseDraftForm.artistId} onChange={(event) => setReleaseDraftForm((current) => ({ ...current, artistId: event.target.value }))} placeholder="123" inputMode="numeric" />
                  </label>
                </div>
                <InlineError message={createReleaseState.error} />
                {createReleaseState.data ? <DataTable data={createReleaseState.data} emptyLabel="Draft created." /> : null}
                <button className="primary-btn distribution-full-width-btn" type="button" disabled={!canLoad || createReleaseState.loading} onClick={createReleaseDraft}>
                  {createReleaseState.loading ? "Creating Draft..." : "Create Draft Release"}
                </button>
              </article>

              <article className="asset-card distribution-v5-panel release-builder-side-card">
                <span className="asset-type-pill">Next Steps</span>
                <h3>Draft Workflow</h3>
                <p>Create the draft first, then move to Catalog to pull the Too Lost release list and select the release you want to edit.</p>
                <div className="release-builder-mini-checklist">
                  <label><input type="checkbox" checked={Boolean(createReleaseState.data)} readOnly /> Draft response received</label>
                  <label><input type="checkbox" checked={releasesReady} readOnly /> Release catalog loaded</label>
                  <label><input type="checkbox" checked={selectedReleaseReady} readOnly /> Release selected</label>
                </div>
                <button className="secondary-btn distribution-full-width-btn" type="button" onClick={() => setActiveReleaseStep("catalog")}>
                  Continue to Catalog
                </button>
              </article>
            </div>
          ) : null}

          {activeReleaseStep === "catalog" ? (
            <div className="release-builder-step-panel release-builder-catalog-panel">
              <article id="release-catalog-section" className="asset-card distribution-v5-panel distribution-roadmap-filter-card release-builder-workflow-card">
                <div className="distribution-v11-panel-heading">
                  <div>
                    <span className="asset-type-pill">Catalog Filter</span>
                    <h3>Find Releases</h3>
                    <p>Search and filter Too Lost release records so you can select the exact draft or catalog item you want to edit.</p>
                  </div>
                </div>
                <div className="distribution-form-grid">
                  <label>
                    <span>Status</span>
                    <select value={releaseFilters.status} onChange={(event) => setReleaseFilters((current) => ({ ...current, status: event.target.value }))}>
                      <option value="">Any status</option>
                      {releaseStatusOptions.map((status) => <option key={status} value={status}>{status}</option>)}
                    </select>
                  </label>
                  <label>
                    <span>Type</span>
                    <select value={releaseFilters.type} onChange={(event) => setReleaseFilters((current) => ({ ...current, type: event.target.value }))}>
                      <option value="">Any type</option>
                      {releaseTypeOptions.map((type) => <option key={type} value={type}>{type}</option>)}
                    </select>
                  </label>
                  <label className="distribution-form-wide">
                    <span>Search</span>
                    <input value={releaseFilters.search} onChange={(event) => setReleaseFilters((current) => ({ ...current, search: event.target.value }))} placeholder="Search release title" />
                  </label>
                </div>
                <InlineError message={getEndpointState(endpointResults, "releases").error} />
                <button className="secondary-btn distribution-full-width-btn" type="button" disabled={!canLoad || getEndpointState(endpointResults, "releases").loading} onClick={loadReleasesWithFilters}>
                  {getEndpointState(endpointResults, "releases").loading ? "Loading..." : "Apply Filters"}
                </button>
              </article>

              <article className="asset-card distribution-v5-panel distribution-roadmap-list-card release-builder-workflow-card">
                <h3>Release List</h3>
                <p className="distribution-empty">Select a release to load its details and prep the metadata editor.</p>
                <ReleaseTable data={releasesResult} selectedReleaseId={selectedReleaseId} onSelect={(releaseId) => void loadReleaseDetails(releaseId)} />
                <button className="secondary-btn distribution-full-width-btn" type="button" disabled={!selectedReleaseId} onClick={() => setActiveReleaseStep("metadata")}>
                  Continue to Metadata
                </button>
              </article>
            </div>
          ) : null}

          {activeReleaseStep === "metadata" ? (
            <div className="release-builder-step-panel release-builder-metadata-panel">
              <article id="release-metadata-section" className="asset-card distribution-v5-panel release-builder-metadata-card release-builder-workflow-card">
                <div className="distribution-v11-panel-heading distribution-v11-inline-heading">
                  <div>
                    <span className="asset-type-pill">Metadata Editor</span>
                    <h3>Release Metadata</h3>
                    <p>Edit selected release metadata in the Too Lost sandbox. This does not submit the release.</p>
                  </div>
                  {selectedReleaseId ? <span className="status-pill">Release ID {selectedReleaseId}</span> : null}
                </div>

                <InlineError message={releaseDetailState.error} />
                <div className="distribution-form-grid release-metadata-grid">
                  <label>
                    <span>Title</span>
                    <input value={releaseMetadataForm.title} onChange={(event) => setReleaseMetadataForm((current) => ({ ...current, title: event.target.value }))} placeholder="Release title" />
                  </label>
                  <label>
                    <span>Type</span>
                    <select value={releaseMetadataForm.type} onChange={(event) => setReleaseMetadataForm((current) => ({ ...current, type: event.target.value }))}>
                      <option value="">Keep current / not set</option>
                      {releaseTypeOptions.map((type) => <option key={type} value={type}>{type}</option>)}
                    </select>
                  </label>
                  <label>
                    <span>Label</span>
                    <input value={releaseMetadataForm.label} onChange={(event) => setReleaseMetadataForm((current) => ({ ...current, label: event.target.value }))} placeholder="Label" />
                  </label>
                  <label>
                    <span>Release Date</span>
                    <input type="date" value={releaseMetadataForm.releaseDate} onChange={(event) => setReleaseMetadataForm((current) => ({ ...current, releaseDate: event.target.value }))} />
                  </label>
                  <label>
                    <span>UPC</span>
                    <input value={releaseMetadataForm.upc} onChange={(event) => setReleaseMetadataForm((current) => ({ ...current, upc: event.target.value }))} placeholder="UPC" inputMode="numeric" />
                  </label>
                  <label>
                    <span>Explicit</span>
                    <select value={releaseMetadataForm.explicit} onChange={(event) => setReleaseMetadataForm((current) => ({ ...current, explicit: event.target.value }))}>
                      <option value="">Keep current / not set</option>
                      <option value="clean">Clean</option>
                      <option value="explicit">Explicit</option>
                    </select>
                  </label>
                  <label>
                    <span>Genre</span>
                    <input value={releaseMetadataForm.genre} onChange={(event) => setReleaseMetadataForm((current) => ({ ...current, genre: event.target.value }))} placeholder="Genre or genre ID" />
                  </label>
                  <label>
                    <span>Language</span>
                    <input value={releaseMetadataForm.language} onChange={(event) => setReleaseMetadataForm((current) => ({ ...current, language: event.target.value }))} placeholder="Language code" />
                  </label>
                  <label>
                    <span>Copyright</span>
                    <input value={releaseMetadataForm.copyright} onChange={(event) => setReleaseMetadataForm((current) => ({ ...current, copyright: event.target.value }))} placeholder="© 2026 Track Adam" />
                  </label>
                  <label>
                    <span>Phonographic Copyright</span>
                    <input value={releaseMetadataForm.phonographicCopyright} onChange={(event) => setReleaseMetadataForm((current) => ({ ...current, phonographicCopyright: event.target.value }))} placeholder="℗ 2026 Track Adam" />
                  </label>
                </div>

                <InlineError message={metadataUpdateState.error} />
                {metadataUpdateState.data ? <DataTable data={metadataUpdateState.data} emptyLabel="No metadata response yet." /> : null}

                <button className="primary-btn distribution-full-width-btn" type="button" disabled={!canLoad || metadataUpdateState.loading || !selectedReleaseId} onClick={saveReleaseMetadata}>
                  {metadataUpdateState.loading ? "Saving Metadata..." : "Save Metadata to Sandbox"}
                </button>
              </article>

              <article className="asset-card distribution-v5-panel release-builder-side-card">
                <span className="asset-type-pill">Current Release</span>
                <h3>Loaded Details</h3>
                <p>Use this as a reference while editing. If the form is blank, go back to Catalog, select a release, and load its details first.</p>
                <DataTable data={releaseDetailState.data} emptyLabel="No release details loaded yet." />
                <button className="secondary-btn distribution-full-width-btn" type="button" disabled={!selectedReleaseId} onClick={() => setActiveReleaseStep("tracks")}>
                  Continue to Tracks
                </button>
              </article>
            </div>
          ) : null}

          {activeReleaseStep === "tracks" ? (
            <div className="release-builder-step-panel release-builder-details-panel">
              <article id="release-detail-section" className="asset-card distribution-v5-panel distribution-roadmap-detail-card release-builder-workflow-card">
                <div className="distribution-v11-panel-heading">
                  <div>
                    <span className="asset-type-pill">Track Tools</span>
                    <h3>Tracks</h3>
                    <p>Review the selected release track list and prep locked track-level actions.</p>
                  </div>
                </div>

                <InlineError message={releaseTracksState.error} />
                <DataTable data={releaseTracksState.data} emptyLabel="No tracks loaded for this release yet." />

                <div className="release-track-locked-actions">
                  <button className="secondary-btn" type="button" disabled>Add Track Locked</button>
                  <button className="secondary-btn" type="button" disabled>Audio Upload Locked</button>
                  <button className="secondary-btn" type="button" disabled>Edit Track Metadata Locked</button>
                </div>
              </article>

              <article className="asset-card distribution-v5-panel release-builder-side-card">
                <span className="asset-type-pill">Track Prep</span>
                <h3>What We Confirm Next</h3>
                <p>The next implementation will use Too Lost's track payload schema for add/edit/upload actions. For now, this panel keeps write actions locked and safe.</p>
                <button className="secondary-btn distribution-full-width-btn" type="button" onClick={() => setActiveReleaseStep("validation")}>
                  Continue to Validation
                </button>
              </article>
            </div>
          ) : null}

          {activeReleaseStep === "validation" ? (
            <article id="release-validation-section" className="asset-card distribution-v5-panel distribution-upc-tool-card release-builder-workflow-card">
              <div className="distribution-v11-panel-heading distribution-v11-inline-heading">
                <div>
                  <span className="asset-type-pill">Identifier Validation</span>
                  <h3>UPC & ISRC Checks</h3>
                  <p>Validate release and track identifiers against Too Lost sandbox before moving toward delivery and submit tools.</p>
                </div>
                {selectedReleaseId ? <span className="status-pill">Release ID {selectedReleaseId}</span> : null}
              </div>

              <div className="release-validation-grid">
                <div>
                  <h4>UPC Check</h4>
                  <p className="distribution-empty">Use for release UPC format and uniqueness.</p>
                  <div className="distribution-v5-inline-form distribution-upc-inline-form">
                    <input value={upcToValidate} onChange={(event) => setUpcToValidate(event.target.value)} placeholder="Enter UPC" inputMode="numeric" />
                    <button className="secondary-btn" type="button" disabled={!canLoad || upcValidationState.loading || !upcToValidate.trim()} onClick={validateUpc}>
                      {upcValidationState.loading ? "Checking..." : "Validate UPC"}
                    </button>
                  </div>
                  <InlineError message={upcValidationState.error} />
                  <DataTable data={upcValidationState.data} emptyLabel="No UPC validation result yet." />
                </div>

                <div>
                  <h4>ISRC Check</h4>
                  <p className="distribution-empty">Use for track ISRC format and uniqueness.</p>
                  <div className="distribution-v5-inline-form distribution-upc-inline-form">
                    <input value={isrcToValidate} onChange={(event) => setIsrcToValidate(event.target.value)} placeholder="Enter ISRC" />
                    <button className="secondary-btn" type="button" disabled={!canLoad || isrcValidationState.loading || !isrcToValidate.trim()} onClick={validateIsrc}>
                      {isrcValidationState.loading ? "Checking..." : "Validate ISRC"}
                    </button>
                  </div>
                  <InlineError message={isrcValidationState.error} />
                  <DataTable data={isrcValidationState.data} emptyLabel="No ISRC validation result yet." />
                </div>
              </div>

              <button className="secondary-btn distribution-full-width-btn release-builder-next-btn" type="button" onClick={() => setActiveReleaseStep("review")}>
                Continue to Review
              </button>
            </article>
          ) : null}

          {activeReleaseStep === "review" ? (
            <article id="release-review-section" className="asset-card distribution-v5-panel release-builder-review-card">
              <div className="distribution-v11-panel-heading distribution-v11-inline-heading">
                <div>
                  <span className="asset-type-pill">Locked Safety Step</span>
                  <h3>Review & Submit</h3>
                  <p>Submission stays locked until draft creation, release details, metadata, tracks, validation, and delivery are all proven in sandbox.</p>
                </div>
                <span className="status-pill status-warning">Submit Locked</span>
              </div>

              <div className="release-builder-review-grid">
                <label><input type="checkbox" checked={releaseDraftReady || releasesReady} readOnly /> Draft or release list loaded</label>
                <label><input type="checkbox" checked={selectedReleaseReady} readOnly /> Release details selected</label>
                <label><input type="checkbox" checked={metadataSaved} readOnly /> Metadata edit workflow confirmed</label>
                <label><input type="checkbox" checked={tracksReady} readOnly /> Tracks inspected</label>
                <label><input type="checkbox" checked={upcValidated} readOnly /> UPC validation checked</label>
                <label><input type="checkbox" checked={Boolean(isrcValidationState.data)} readOnly /> ISRC validation checked</label>
                <label><input type="checkbox" checked={false} readOnly /> Delivery settings confirmed</label>
              </div>

              <button className="secondary-btn distribution-full-width-btn" type="button" disabled>
                Submit Release Locked Until Full Sandbox Review
              </button>
            </article>
          ) : null}
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
