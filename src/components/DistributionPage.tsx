/* Distribution v21.2 build fix - metadata helpers restored and Catalog open points to Release Info */
/* Distribution v21.1 schema-correct flow: Start Release / Choose Release / Release Info */
import { useEffect, useMemo, useState } from "react";
import {
  callTooLostEndpoint,
  createTooLostReleaseDraft,
  deleteTooLostRelease,
  getTooLostRelease,
  getTooLostReleaseTracks,
  listTooLostReleases,
  updateTooLostReleaseMetadata,
  updateTooLostReleaseDelivery,
  submitTooLostRelease,
  createTooLostTrackUploadUrl,
  uploadFlacToS3,
  putTooLostReleaseTracks,
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
  type TooLostTrackPayload,
} from "../lib/tooLostApi";

type DistributionPageProps = {
  oauthStatus?: "success" | "error" | null;
  oauthMessage?: string;
  activeTab?: "overview" | "catalog" | "releases" | "analytics" | "sales" | "setup" | "developer";
  onTabChange?: (tab: "overview" | "catalog" | "releases" | "analytics" | "sales" | "setup" | "developer") => void;
};

type DashboardTab = "Overview" | "Catalog" | "Release Builder" | "Analytics" | "Sales" | "Setup" | "Developer";
type ReleaseBuilderStepKey = "start" | "artwork" | "info" | "tracks" | "delivery" | "validation" | "review";

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
  version: string;
  remixTitle: string;
  primaryGenre: string;
  secondaryGenre: string;
  language: string;
  releaseDate: string;
  originalReleaseDate: string;
  applePreorder: string;
  applePreorderDate: string;
  licenseType: string;
  licenseInfo: string;
  cYear: string;
  cLine: string;
  pYear: string;
  pLine: string;
  upc: string;
  coverUrl: string;
  compressedArtwork: string;
  isAiGenerated: string;
  releaseTime: string;
  timeZone: string;
  label: string; // Added to match TooLost metadata schema
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
  version: "",
  remixTitle: "",
  primaryGenre: "",
  secondaryGenre: "",
  language: "",
  releaseDate: "",
  originalReleaseDate: "",
  applePreorder: "",
  applePreorderDate: "",
  licenseType: "",
  licenseInfo: "",
  cYear: "",
  cLine: "",
  pYear: "",
  pLine: "",
  upc: "",
  coverUrl: "",
  compressedArtwork: "",
  isAiGenerated: "",
  releaseTime: "",
  timeZone: "",
  label: "", // Added to match TooLost metadata schema
};

const releaseStatusOptions = ["draft", "in_review", "live", "takedown_pending", "takedown_complete"];
const releaseTypeOptions = ["Single", "EP", "Album", "Compilation", "MusicVideo", "Music Video"];
const licenseTypeOptions = ["Copyright", "Public Domain", "Creative Commons"];

type SelectOption = {
  value: string;
  label: string;
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
    createMetric("Sales", salesRecord ? getRecordValue(salesRecord, ["amount", "total_amount", "earnings", "total"] ) || "—" : "—", "Requires distributor earnings scope"),
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

function getLookupOptions(value: unknown, valueKeys: string[], labelKeys: string[] = valueKeys): SelectOption[] {
  const rows = getRows(value);
  const options = rows
    .map((row) => {
      const value = getRecordValue(row, valueKeys);
      const label = getRecordValue(row, labelKeys) || value;

      if (typeof value !== "string" && typeof value !== "number") return null;

      return {
        value: String(value),
        label: stringifyCell(label),
      };
    })
    .filter((option): option is SelectOption => Boolean(option));

  const seen = new Set<string>();
  return options.filter((option) => {
    if (seen.has(option.value)) return false;
    seen.add(option.value);
    return true;
  }).slice(0, 300);
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

function getBooleanSelectValue(value: unknown, keys: string[]) {
  const raw = getStringValueFromPayload(value, keys);
  if (!raw) return "";

  const normalized = raw.toLowerCase();
  if (["true", "1", "yes"].includes(normalized)) return "true";
  if (["false", "0", "no"].includes(normalized)) return "false";

  return "";
}

function extractReleaseMetadataForm(release: unknown): ReleaseMetadataForm {
  return {
    version: getStringValueFromPayload(release, ["version"]),
    remixTitle: getStringValueFromPayload(release, ["remixTitle", "remix_title"]),
    primaryGenre: getStringValueFromPayload(release, ["primaryGenre", "primary_genre"]),
    secondaryGenre: getStringValueFromPayload(release, ["secondaryGenre", "secondary_genre"]),
    language: getStringValueFromPayload(release, ["language", "language_code"]),
    releaseDate: getStringValueFromPayload(release, ["releaseDate", "release_date"]),
    originalReleaseDate: getStringValueFromPayload(release, ["originalReleaseDate", "original_release_date"]),
    applePreorder: getBooleanSelectValue(release, ["applePreorder", "apple_preorder"]),
    applePreorderDate: getStringValueFromPayload(release, ["applePreorderDate", "apple_preorder_date"]),
    licenseType: getStringValueFromPayload(release, ["licenseType", "license_type"]),
    licenseInfo: getStringValueFromPayload(release, ["licenseInfo", "license_info"]),
    cYear: getStringValueFromPayload(release, ["cYear", "c_year"]),
    cLine: getStringValueFromPayload(release, ["cLine", "c_line"]),
    pYear: getStringValueFromPayload(release, ["pYear", "p_year"]),
    pLine: getStringValueFromPayload(release, ["pLine", "p_line"]),
    upc: getStringValueFromPayload(release, ["upc", "barcode"]),
    coverUrl: getStringValueFromPayload(release, ["coverUrl", "cover_url"]),
    compressedArtwork: getStringValueFromPayload(release, ["compressedArtwork", "compressed_artwork"]),
    isAiGenerated: getBooleanSelectValue(release, ["isAiGenerated", "isAiGeneratedArtwork", "is_ai_generated"]),
    releaseTime: getStringValueFromPayload(release, ["releaseTime", "release_time", "time"]),
    timeZone: getStringValueFromPayload(release, ["timeZone", "time_zone"]),
    label: getStringValueFromPayload(release, ["label"]),
  };
}

function buildReleaseMetadataPayload(form: ReleaseMetadataForm) {
  const payload: Record<string, unknown> = {};

  const addString = (key: string, value: string) => {
    const trimmed = value.trim();
    if (trimmed) payload[key] = trimmed;
  };

  const addYear = (key: string, value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return;

    const year = Number(trimmed);
    // TooLost expects year between 1900-2100
    if (Number.isInteger(year) && year >= 1900 && year <= 2100) {
      payload[key] = year;
    }
  };

  const addBoolean = (key: string, value: string) => {
    if (value === "true") payload[key] = true;
    if (value === "false") payload[key] = false;
  };

  // Core fields aligned with TooLost PATCH /releases/{releaseId}/metadata schema
  addString("label", form.label);
  addString("version", form.version);
  addString("remixTitle", form.remixTitle);
  addString("primaryGenre", form.primaryGenre);
  addString("secondaryGenre", form.secondaryGenre);
  addString("language", form.language);

  addString("releaseDate", form.releaseDate);
  addString("originalReleaseDate", form.originalReleaseDate);

  addBoolean("applePreorder", form.applePreorder);
  addString("applePreorderDate", form.applePreorderDate);

  addString("licenseType", form.licenseType);
  addString("licenseInfo", form.licenseInfo);
  addYear("cYear", form.cYear);
  addString("cLine", form.cLine);
  addYear("pYear", form.pYear);
  addString("pLine", form.pLine);

  addString("upc", form.upc);
  addString("coverUrl", form.coverUrl);
  addString("compressedArtwork", form.compressedArtwork);

  addBoolean("isAiGenerated", form.isAiGenerated);
  addString("releaseTime", form.releaseTime);
  addString("timeZone", form.timeZone);

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
    return <p className="distribution-empty">No releases returned yet. Load Release Creator to pull draft and catalog data.</p>;
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
  if (!endpoint) throw new Error(`Missing distributor endpoint config for ${key}.`);
  return endpoint;
}

export default function DistributionPage({ oauthStatus, oauthMessage, activeTab: externalTab, onTabChange }: DistributionPageProps) {

  const subPageToTab: Record<string, DashboardTab> = {
    overview: "Overview",
    catalog: "Catalog",
    releases: "Release Builder",
    analytics: "Analytics",
    sales: "Sales",
    setup: "Setup",
    developer: "Developer",
  };

  const tabToSubPage: Record<DashboardTab, string> = {
    "Overview": "overview",
    "Catalog": "catalog",
    "Release Builder": "releases",
    "Analytics": "analytics",
    "Sales": "sales",
    "Setup": "setup",
    "Developer": "developer",
  };

  const [internalTab, setInternalTabState] = useState<DashboardTab>("Overview");
  const activeTab: DashboardTab = externalTab ? (subPageToTab[externalTab] ?? "Overview") : internalTab;

  function setActiveTab(tab: DashboardTab) {
    setInternalTabState(tab);
    onTabChange?.(tabToSubPage[tab] as "overview" | "catalog" | "releases" | "analytics" | "sales" | "setup" | "developer");
  }
  const [connection, setConnection] = useState<TooLostConnection | null>(null);
  const [connectionLoading, setConnectionLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");
  const [endpointResults, setEndpointResults] = useState<Partial<Record<TooLostEndpointKey, EndpointState>>>({});
  const [activeReleaseStep, setActiveReleaseStep] = useState<ReleaseBuilderStepKey>("start");
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
  const [selectedDeliveryPlatforms, setSelectedDeliveryPlatforms] = useState<string[]>([]);
  const [selectedTerritories, setSelectedTerritories] = useState<string[]>([]);
  const [deliveryYoutube, setDeliveryYoutube] = useState(false);
  const [deliveryUpdateState, setDeliveryUpdateState] = useState<EndpointState>(defaultEndpointState);
  const [rightsConfirmed, setRightsConfirmed] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [submitState, setSubmitState] = useState<EndpointState>(defaultEndpointState);

  // Track management
  const [trackForms, setTrackForms] = useState<TooLostTrackPayload[]>([]);
  const [activeTrackIndex, setActiveTrackIndex] = useState<number | null>(null);
  const [trackUploadFile, setTrackUploadFile] = useState<File | null>(null);
  const [trackUploadKind, setTrackUploadKind] = useState<"audio" | "instrumental" | "dolby">("audio");
  const [trackUploadProgress, setTrackUploadProgress] = useState(0);
  const [trackUploadPhase, setTrackUploadPhase] = useState<"idle" | "url" | "s3" | "done" | "error">("idle");
  const [trackUploadError, setTrackUploadError] = useState("");
  const [putTracksState, setPutTracksState] = useState<EndpointState>(defaultEndpointState);

  // Artwork
  const [artworkPreviewUrl, setArtworkPreviewUrl] = useState("");
  const [artworkUploading, setArtworkUploading] = useState(false);
  const [artworkUploadError, setArtworkUploadError] = useState("");

  async function loadConnection() {
    setConnectionLoading(true);
    setError("");

    try {
      const currentConnection = await getTooLostConnection();
      setConnection(currentConnection);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Could not load distribution connection.");
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
      setError(connectError instanceof Error ? connectError.message : "Could not start distributor OAuth.");
    }
  }

  async function handleDisconnect() {
    const confirmed = window.confirm("Disconnect the distribution sandbox from Track Adam OS?");
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
    setSelectedDeliveryPlatforms([]);
    setSelectedTerritories([]);
    setDeliveryYoutube(false);
    setDeliveryUpdateState(defaultEndpointState);
    setRightsConfirmed(false);
    setAcceptTerms(false);
    setSubmitState(defaultEndpointState);
    setTrackForms([]);
    setActiveTrackIndex(null);
    setTrackUploadFile(null);
    setTrackUploadProgress(0);
    setTrackUploadPhase("idle");
    setTrackUploadError("");
    setPutTracksState(defaultEndpointState);
    setArtworkPreviewUrl("");
    setArtworkUploading(false);
    setArtworkUploadError("");

    try {
      await disconnectTooLost();
      setConnection(null);
    } catch (disconnectError) {
      setError(disconnectError instanceof Error ? disconnectError.message : "Could not disconnect the distributor.");
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
      const metaForm = extractReleaseMetadataForm(release);
      setReleaseMetadataForm(metaForm);
      if (metaForm.coverUrl) setArtworkPreviewUrl(metaForm.coverUrl);
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

      // Auto-select the new release so downstream steps have a selectedReleaseId
      const newReleaseId = (data as { id?: string | number })?.id
        ?? ((data as { data?: { id?: string | number } })?.data?.id);
      if (newReleaseId) {
        await loadReleaseDetails(String(newReleaseId));
      } else {
        await loadReleasesWithFilters();
      }

      // Advance to Artwork — matching Too Lost's native flow
      setActiveReleaseStep("artwork");
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

  async function saveDelivery() {
    setDeliveryUpdateState((current) => ({ ...current, loading: true, error: "" }));

    try {
      if (!selectedReleaseId) throw new Error("Select a release before saving delivery settings.");
      if (selectedDeliveryPlatforms.length === 0) throw new Error("Select at least one platform.");
      if (selectedTerritories.length === 0) throw new Error("Select at least one territory.");

      const data = await updateTooLostReleaseDelivery(selectedReleaseId, {
        platforms: selectedDeliveryPlatforms,
        territories: selectedTerritories,
        additional: { youtube: deliveryYoutube },
      });

      setDeliveryUpdateState({ loading: false, error: "", data, loadedAt: new Date().toISOString() });
    } catch (deliveryError) {
      setDeliveryUpdateState((current) => ({
        loading: false,
        error: deliveryError instanceof Error ? deliveryError.message : "Could not save delivery settings.",
        data: current.data,
        loadedAt: current.loadedAt,
      }));
    }
  }

  async function uploadArtworkToCloudinary(file: File): Promise<string> {
    const cloudName = (import.meta as { env: Record<string, string> }).env.VITE_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = (import.meta as { env: Record<string, string> }).env.VITE_CLOUDINARY_UPLOAD_PRESET;

    if (!cloudName || !uploadPreset) {
      throw new Error("Cloudinary is not configured. Add VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_UPLOAD_PRESET to your .env file.");
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", uploadPreset);

    const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) throw new Error(`Cloudinary upload failed: ${response.statusText}`);
    const data = await response.json() as { secure_url: string };
    return data.secure_url;
  }

  async function handleArtworkFileSelect(file: File | null) {
    if (!file) return;
    setArtworkUploadError("");

    // Show local preview immediately
    const localUrl = URL.createObjectURL(file);
    setArtworkPreviewUrl(localUrl);

    // Upload to Cloudinary
    setArtworkUploading(true);
    try {
      const cloudUrl = await uploadArtworkToCloudinary(file);
      setArtworkPreviewUrl(cloudUrl);
      setReleaseMetadataForm((prev) => ({ ...prev, coverUrl: cloudUrl }));
    } catch (err) {
      setArtworkUploadError(err instanceof Error ? err.message : "Artwork upload failed.");
    } finally {
      setArtworkUploading(false);
    }
  }

  async function deleteReleaseDraft(releaseId: string | number) {
    if (!window.confirm("Delete this draft release? This cannot be undone.")) return;

    try {
      await deleteTooLostRelease(releaseId);
      setSelectedReleaseId("");
      setReleaseDetailState(defaultEndpointState);
      setReleaseTracksState(defaultEndpointState);
      setReleaseMetadataForm(emptyReleaseMetadataForm);
      setArtworkPreviewUrl("");
      await loadReleasesWithFilters();
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "Could not delete release.");
    }
  }

  async function uploadTrackFile() {
    if (!selectedReleaseId || !trackUploadFile) return;

    setTrackUploadPhase("url");
    setTrackUploadError("");
    setTrackUploadProgress(0);

    try {
      // Step 1 — get presigned URL
      const urlData = await createTooLostTrackUploadUrl(selectedReleaseId, {
        fileName: trackUploadFile.name.replace(/[^a-zA-Z0-9._-]/g, "_").replace(/\.[^.]+$/, ".flac"),
        contentType: "audio/flac",
        kind: trackUploadKind,
      });

      // Step 2 — PUT raw binary to S3
      setTrackUploadPhase("s3");
      await uploadFlacToS3(urlData.uploadUrl, trackUploadFile, urlData.headers ?? {}, setTrackUploadProgress);

      // Step 3 — store fileKey into the active track form
      setTrackUploadPhase("done");
      setTrackForms((prev) => {
        const updated = [...prev];
        const idx = activeTrackIndex ?? prev.length - 1;
        if (updated[idx]) {
          updated[idx] = {
            ...updated[idx],
            ...(trackUploadKind === "audio" ? { audioFileKey: urlData.fileKey } : {}),
            ...(trackUploadKind === "instrumental" ? { instrumentalFileKey: urlData.fileKey } : {}),
            ...(trackUploadKind === "dolby" ? { dolbyFileKey: urlData.fileKey } : {}),
          };
        }
        return updated;
      });
      setTrackUploadFile(null);
    } catch (err) {
      setTrackUploadPhase("error");
      setTrackUploadError(err instanceof Error ? err.message : "Upload failed.");
    }
  }

  function addBlankTrack() {
    const newTrack: TooLostTrackPayload = {
      title: "",
      language: "en",
      audioFileKey: "",
      artists: [{ name: "", role: ["primary"] }],
      writers: [{ name: "", role: ["composer"] }],
    };
    setTrackForms((prev) => [...prev, newTrack]);
    setActiveTrackIndex(trackForms.length);
    setTrackUploadPhase("idle");
    setTrackUploadFile(null);
    setTrackUploadProgress(0);
    setTrackUploadError("");
  }

  function removeTrack(index: number) {
    setTrackForms((prev) => prev.filter((_, i) => i !== index));
    setActiveTrackIndex(null);
  }

  function updateTrackField(index: number, field: keyof TooLostTrackPayload, value: unknown) {
    setTrackForms((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  }

  function updateTrackArtist(trackIdx: number, artistIdx: number, field: "name" | "role", value: string) {
    setTrackForms((prev) => {
      const updated = [...prev];
      const artists = [...(updated[trackIdx].artists ?? [])];
      artists[artistIdx] = { ...artists[artistIdx], [field]: field === "role" ? [value] : value };
      updated[trackIdx] = { ...updated[trackIdx], artists };
      return updated;
    });
  }

  function updateTrackWriter(trackIdx: number, writerIdx: number, field: "name" | "role", value: string) {
    setTrackForms((prev) => {
      const updated = [...prev];
      const writers = [...(updated[trackIdx].writers ?? [])];
      writers[writerIdx] = { ...writers[writerIdx], [field]: field === "role" ? [value] : value };
      updated[trackIdx] = { ...updated[trackIdx], writers };
      return updated;
    });
  }

  async function saveTracklist() {
    if (!selectedReleaseId) return;
    const validTracks = trackForms.filter((t) => t.title.trim() && t.audioFileKey);
    if (validTracks.length === 0) {
      setPutTracksState((prev) => ({ ...prev, error: "Add at least one track with a title and uploaded audio file." }));
      return;
    }

    setPutTracksState((prev) => ({ ...prev, loading: true, error: "" }));
    try {
      const data = await putTooLostReleaseTracks(selectedReleaseId, validTracks);
      setPutTracksState({ loading: false, error: "", data, loadedAt: new Date().toISOString() });
    } catch (err) {
      setPutTracksState((prev) => ({
        ...prev,
        loading: false,
        error: err instanceof Error ? err.message : "Could not save tracklist.",
      }));
    }
  }

  async function submitRelease() {
    setSubmitState((current) => ({ ...current, loading: true, error: "" }));

    try {
      if (!selectedReleaseId) throw new Error("No release selected.");
      if (!acceptTerms) throw new Error("You must accept the distribution terms.");
      if (!rightsConfirmed) throw new Error("You must confirm you own or control the rights.");

      const idempotencyKey = `rel-submit-${selectedReleaseId}-${Date.now()}`;

      const data = await submitTooLostRelease(selectedReleaseId, {
        acceptTerms: true,
        confirmRights: true,
        confirmYoutubeRights: deliveryYoutube ? true : null,
        idempotencyKey,
      });

      setSubmitState({ loading: false, error: "", data, loadedAt: new Date().toISOString() });
    } catch (submitError) {
      setSubmitState((current) => ({
        loading: false,
        error: submitError instanceof Error ? submitError.message : "Could not submit release.",
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
    configError = configLoadError instanceof Error ? configLoadError.message : "Distribution environment variables are missing.";
  }

  const connected = Boolean(connection);
  const expired = isTooLostTokenExpired(connection);
  const profileResult = getEndpointState(endpointResults, "profile").data;
  const releasesResult = getEndpointState(endpointResults, "releases").data;
  const analyticsOverview = getEndpointState(endpointResults, "analyticsOverview").data;
  const analyticsTracks = getEndpointState(endpointResults, "analyticsTracks");
  const analyticsPlatforms = getEndpointState(endpointResults, "analyticsPlatforms");
  const lookupGenres = getEndpointState(endpointResults, "lookupGenres");
  const lookupLanguages = getEndpointState(endpointResults, "lookupLanguages");
  const lookupPlatforms = getEndpointState(endpointResults, "lookupPlatforms");
  const lookupCountries = getEndpointState(endpointResults, "lookupCountries");
  const salesOverview = getEndpointState(endpointResults, "salesOverview").data;
  const profileRecord = getProfileRecord(profileResult);
  const platformOptions = useMemo(() => getPlatformOptions(analyticsPlatforms.data), [analyticsPlatforms.data]);
  const genreOptions = useMemo(() => getLookupOptions(lookupGenres.data, ["name", "genre", "value", "label", "id"], ["name", "label", "genre", "value"]), [lookupGenres.data]);
  const languageOptions = useMemo(() => getLookupOptions(lookupLanguages.data, ["code", "value", "id", "name"], ["name", "label", "code", "value"]), [lookupLanguages.data]);
  const deliveryPlatformOptions = useMemo(() => getLookupOptions(lookupPlatforms.data, ["name", "platform", "value", "code", "id"], ["name", "label", "platform", "value"]), [lookupPlatforms.data]);
  const territoryOptions = useMemo(() => getLookupOptions(lookupCountries.data, ["code", "value", "id", "name"], ["name", "label", "code", "value"]), [lookupCountries.data]);
  const metrics = useMemo(
    () => getOverviewMetrics(connection, profileResult, releasesResult, analyticsOverview, salesOverview),
    [connection, profileResult, releasesResult, analyticsOverview, salesOverview],
  );

  const canLoad = connected && !expired && !actionLoading;
  const releaseDraftReady = Boolean(createReleaseState.data);
  const releasesReady = Boolean(releasesResult);
  const selectedReleaseReady = Boolean(selectedReleaseId && releaseDetailState.data);
  const metadataSaved = Boolean(metadataUpdateState.data);
  const tracksReady = Boolean(putTracksState.data) || Boolean(releaseTracksState.data);
  const upcValidated = Boolean(upcValidationState.data);
  const deliveryConfirmed = Boolean(deliveryUpdateState.data);

  const releaseWorkflowSteps: Array<{
    key: ReleaseBuilderStepKey;
    number: string;
    label: string;
    helper: string;
    complete: boolean;
    locked?: boolean;
  }> = [
    {
      key: "start",
      number: "01",
      label: "Start Release",
      helper: "Create the draft shell or resume an existing one.",
      complete: releaseDraftReady || selectedReleaseReady,
    },
    {
      key: "artwork",
      number: "02",
      label: "Artwork",
      helper: "Upload and preview the cover art.",
      complete: Boolean(releaseMetadataForm.coverUrl || artworkPreviewUrl),
    },
    {
      key: "info",
      number: "03",
      label: "Release Info",
      helper: "Complete store-ready metadata fields.",
      complete: selectedReleaseReady && metadataSaved,
    },
    {
      key: "tracks",
      number: "04",
      label: "Tracks",
      helper: "Upload FLAC audio and set track metadata.",
      complete: Boolean(putTracksState.data),
    },
    {
      key: "delivery",
      number: "05",
      label: "Delivery",
      helper: "Set platforms, territories, and YouTube.",
      complete: deliveryConfirmed,
    },
    {
      key: "validation",
      number: "06",
      label: "Validation",
      helper: "Run UPC and ISRC checks.",
      complete: upcValidated || Boolean(isrcValidationState.data),
    },
    {
      key: "review",
      number: "07",
      label: "Review",
      helper: "Final review and submit.",
      complete: false,
      locked: true,
    },
  ];
  const tabs: DashboardTab[] = ["Overview", "Catalog", "Release Builder", "Analytics", "Sales", "Setup", "Developer"];
  const releaseWizardSteps = [
    { key: "start" as const, label: "Basic Information", icon: "◆", complete: releaseDraftReady || selectedReleaseReady },
    { key: "artwork" as const, label: "Artwork", icon: "▧", complete: Boolean(releaseMetadataForm.coverUrl || artworkPreviewUrl) },
    { key: "info" as const, label: "Release Information", icon: "☷", complete: metadataSaved },
    { key: "tracks" as const, label: "Manage Tracks", icon: "♪", complete: Boolean(putTracksState.data) },
    { key: "delivery" as const, label: "Delivery", icon: "↗", complete: deliveryConfirmed },
    { key: "validation" as const, label: "Validation", icon: "✓", complete: upcValidated || Boolean(isrcValidationState.data) },
    { key: "review" as const, label: "Review & Publish", icon: "↑", complete: Boolean(submitState.data) },
  ];
  const activeWizardStep = releaseWizardSteps.find((step) => step.key === activeReleaseStep) ?? releaseWizardSteps[0];
  const issueCount = [
    !(releaseDraftReady || selectedReleaseReady),
    !Boolean(releaseMetadataForm.coverUrl || artworkPreviewUrl),
    !(releaseMetadataForm.cLine.trim() && releaseMetadataForm.pLine.trim()),
  ].filter(Boolean).length;
  const releaseWizardHelp: Record<ReleaseBuilderStepKey, { title: string; step: string; body: string; tips: string[]; articles: string[] }> = {
    start: {
      title: "Basic Information",
      step: "Step 1",
      body: "Select the release type, name the release, and add the primary artist exactly as it should appear on stores. Already have a draft? Expand 'Resume an Existing Draft' to pick it up where you left off.",
      tips: ["Use the same capitalization you want on platforms", "Pick the correct release format before creating", "Add the primary artist before creating the draft"],
      articles: ["Naming your release", "Understanding release types"],
    },
    artwork: {
      title: "Cover Artwork",
      step: "Step 2",
      body: "Upload or paste cover artwork for the release. Square artwork at 3000×3000 pixels is the safest store-ready format.",
      tips: ["Minimum 3000×3000 pixels, square format", "Avoid blurry or pixelated artwork", "Text on artwork should match the release title and artist"],
      articles: ["Artwork content guidelines", "Artwork size and format"],
    },
    info: {
      title: "Release Information",
      step: "Step 3",
      body: "Complete the metadata fields stores need: date, genre, language, label, copyright lines, UPC, pricing, and optional details.",
      tips: ["Schedule at least 7 days in advance", "Pre-save campaigns work best with 2–4 weeks lead time", "C and P lines usually match your label or rights owner"],
      articles: ["Choosing release metadata", "Copyright line examples"],
    },
    tracks: {
      title: "Manage Tracks",
      step: "Step 4",
      body: "Upload audio files and manage track details. Make sure each track is titled properly and has complete credits.",
      tips: ["WAV or FLAC files are best quality", "Track titles should match your intended release", "Add songwriter and producer credits"],
      articles: ["Audio file requirements", "Adding track credits"],
    },
    delivery: {
      title: "Delivery",
      step: "Step 5",
      body: "Choose platforms, territories, and additional monetization services before submitting.",
      tips: ["Load setup data to use real store and country options", "Select all territories unless you have a restriction", "Only enable services you control rights for"],
      articles: ["Store delivery options", "Territory selection"],
    },
    validation: {
      title: "Validation",
      step: "Step 6",
      body: "Check identifiers before review so UPC and ISRC issues do not hold up the release.",
      tips: ["UPC is usually 12 digits", "ISRC uses 12 uppercase letters/numbers", "Validate identifiers before final review"],
      articles: ["UPC validation", "ISRC formatting"],
    },
    review: {
      title: "Review & Publish",
      step: "Step 7",
      body: "Review every section, confirm you own the rights, accept the terms, then submit the release when ready.",
      tips: ["Do one final title and artist spelling check", "Confirm rights before submission", "Save changes before publishing"],
      articles: ["Final release checklist", "Submission review"],
    },
  };
  const currentHelp = releaseWizardHelp[activeWizardStep.key];

  return (
    <section className={`page-section distribution-page distribution-dashboard-page distribution-v5-page ${activeTab === "Release Builder" ? "distribution-release-wizard-mode" : ""}`}>
      <div className="section-header distribution-hero-header distribution-v5-hero">
        <div>
          <p className="eyebrow">Distribution Command Center</p>
          <h2>Distribution Dashboard</h2>
          <p>Clean command center for catalog, analytics, royalties, setup data, and connected distributor status.</p>
        </div>
        <div className="distribution-hero-actions">
          {!connected ? (
            <button className="primary-btn" type="button" onClick={handleConnect} disabled={actionLoading || Boolean(configError)}>
              {actionLoading ? "Opening connection..." : "Connect Distribution Sandbox"}
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
          <h3>{profileRecord ? `${stringifyCell(profileRecord.first_name)} ${stringifyCell(profileRecord.last_name)}` : "Distribution Sandbox"}</h3>
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

      {!onTabChange && (
        <div className="distribution-tabs distribution-v5-tabs" role="tablist" aria-label="Distribution sections">
          {tabs.map((tab) => (
            <button
              key={tab}
              className={activeTab === tab ? "distribution-tab distribution-tab-active" : "distribution-tab"}
              type="button"
              onClick={() => setActiveTab(tab)}
            >
              {tab === "Release Builder" ? "Release Creator" : tab}
            </button>
          ))}
        </div>
      )}

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
              <p>View the releases and songs already in your connected distributor account, separate from the release-building workflow.</p>
              <button className="secondary-btn" type="button" disabled={!canLoad} onClick={() => setActiveTab("Catalog")}>Open Catalog</button>
            </article>
            <article className="asset-card distribution-v5-command-card">
              <h3>Release Creator</h3>
              <p>Create or continue sandbox drafts, edit metadata, inspect tracks, and validate identifiers before delivery tools.</p>
              <button className="secondary-btn" type="button" disabled={!canLoad} onClick={() => setActiveTab("Release Builder")}>Open Release Creator</button>
            </article>
            <article className="asset-card distribution-v5-command-card">
              <h3>Analytics</h3>
              <p>Load overview, tracks, platform breakdowns, and stream checks.</p>
              <button className="secondary-btn" type="button" disabled={!canLoad} onClick={() => void loadMany(["analyticsOverview", "analyticsTracks", "analyticsPlatforms"])}>Sync Analytics</button>
            </article>
            <article className="asset-card distribution-v5-command-card">
              <h3>Sales / Royalties</h3>
              <p>Sales endpoints may need your distributor to confirm whether the sandbox uses read:earnings or read:sales.</p>
              <button className="secondary-btn" type="button" disabled={!canLoad} onClick={() => void loadMany(["salesOverview"])}>Try Sales Sync</button>
            </article>
          </div>
        </div>
      ) : null}

      {activeTab === "Catalog" ? (
        <div className="distribution-v5-section distribution-catalog-section">
          <div className="distribution-v5-section-head">
            <div>
              <h3>Catalog</h3>
              <p>View releases and songs already in your connected distributor account. This section is separate from Release Creator drafts and submission prep.</p>
            </div>
            <button className="primary-btn" type="button" disabled={!canLoad || getEndpointState(endpointResults, "releases").loading} onClick={loadReleasesWithFilters}>
              {getEndpointState(endpointResults, "releases").loading ? "Loading..." : "Load Catalog"}
            </button>
          </div>

          <div className="release-builder-step-panel distribution-catalog-workspace">
            <article className="asset-card distribution-v5-panel distribution-roadmap-filter-card">
              <div className="distribution-v11-panel-heading">
                <div>
                  <span className="asset-type-pill">Catalog Filter</span>
                  <h3>Find Catalog Items</h3>
                  <p>Filter releases from your connected account without mixing them into the release-building steps.</p>
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
                {getEndpointState(endpointResults, "releases").loading ? "Loading..." : "Apply Catalog Filters"}
              </button>
            </article>

            <article className="asset-card distribution-v5-panel distribution-roadmap-list-card">
              <h3>Catalog List</h3>
              <p className="distribution-empty">These are release records from your connected account. Select one only when you want to inspect or continue editing it in Release Creator.</p>
              <ReleaseTable data={releasesResult} selectedReleaseId={selectedReleaseId} onSelect={(releaseId) => void loadReleaseDetails(releaseId)} />
              <button className="secondary-btn distribution-full-width-btn" type="button" disabled={!selectedReleaseId} onClick={() => { setActiveTab("Release Builder"); setActiveReleaseStep("info"); }}>
                Open Selected in Release Creator
              </button>
            </article>
          </div>
        </div>
      ) : null}

      {activeTab === "Release Builder" ? (
        <div className="ta-wizard-shell">
          {/* ── Top bar ── */}
          <header className="ta-wizard-topbar">
            <div className="ta-wizard-brand-lockup">
              <span className="ta-wizard-logo">TA</span>
              <button className="ta-wizard-exit" type="button" onClick={() => setActiveTab("Overview")}>← Exit</button>
            </div>
            <div className="ta-wizard-top-actions">
              <span className={connected && !expired ? "ta-wizard-avatar ta-wizard-avatar-live" : "ta-wizard-avatar"}>{profileRecord ? "✓" : "SWU"}</span>
            </div>
          </header>

          {/* ── Wizard grid: left rail + main ── */}
          <div className="ta-wizard-grid">

            {/* ── Left rail: step list ── */}
            <aside className="ta-wizard-left-rail">
              <p className="ta-wizard-rail-title">Steps</p>
              <nav className="ta-wizard-step-list" aria-label="Release creator steps">
                {releaseWizardSteps.map((step) => (
                  <button
                    key={step.key}
                    type="button"
                    className={`ta-wizard-step ${activeReleaseStep === step.key ? "ta-wizard-step-active" : ""} ${step.complete ? "ta-wizard-step-done" : ""}`}
                    onClick={() => setActiveReleaseStep(step.key)}
                  >
                    <span className="ta-wizard-step-icon">{step.icon}</span>
                    <span className="ta-wizard-step-label">{step.label}</span>
                    {step.complete ? <span className="ta-wizard-step-check">✓</span> : null}
                  </button>
                ))}
              </nav>

              <div className="ta-wizard-rail-bottom">
                {issueCount > 0 ? (
                  <div className="ta-wizard-issues-card">
                    <p className="ta-wizard-issues-head">⚠ {issueCount} issue{issueCount !== 1 ? "s" : ""}</p>
                    <div className="ta-wizard-issue-list">
                      {!Boolean(releaseMetadataForm.coverUrl || artworkPreviewUrl) && (
                        <button type="button" onClick={() => setActiveReleaseStep("artwork")}>
                          <strong>Artwork</strong><small>Upload valid artwork</small>
                        </button>
                      )}
                      {!(releaseMetadataForm.cLine.trim() && releaseMetadataForm.pLine.trim()) && (
                        <button type="button" onClick={() => setActiveReleaseStep("info")}>
                          <strong>C &amp; P Line</strong><small>Invalid copyright line(s)</small>
                        </button>
                      )}
                      {!(releaseDraftReady || selectedReleaseReady) && (
                        <button type="button" onClick={() => setActiveReleaseStep("start")}>
                          <strong>Draft</strong><small>No release draft created yet</small>
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="ta-wizard-issues-card ta-wizard-issues-card-clean">
                    <p className="ta-wizard-issues-head">✓ Looking good</p>
                  </div>
                )}
                <button
                  className="ta-wizard-publish-btn"
                  type="button"
                  disabled={!selectedReleaseId}
                  onClick={() => setActiveReleaseStep("review")}
                >
                  ↑ Publish ›
                </button>
              </div>
            </aside>

            {/* ── Main content ── */}
            <main className="ta-wizard-main">

              {/* ══ STEP 1: Basic Info ══ */}
              {activeReleaseStep === "start" ? (
                <div className="ta-wizard-step-content">
                  <div className="ta-wizard-step-header">
                    <span className="asset-type-pill">Step 1 of 7</span>
                    <h2>Basic Information</h2>
                    <p>Select the release type, name it, and set the primary artist. This creates the draft shell in the distributor.</p>
                  </div>

                  {/* Release type */}
                  <div className="ta-wizard-field-group">
                    <label className="ta-wizard-field-label">Release Type</label>
                    <div className="release-type-grid">
                      {[
                        { type: "Single", desc: "1–3 tracks", icon: "♪" },
                        { type: "EP", desc: "4–6 tracks", icon: "◈" },
                        { type: "Album", desc: "7+ tracks", icon: "◉" },
                        { type: "Compilation", desc: "Various artists", icon: "◫" },
                      ].map(({ type, desc, icon }) => (
                        <button
                          key={type}
                          type="button"
                          className={`release-type-card${releaseDraftForm.type === type ? " release-type-card-active" : ""}`}
                          onClick={() => setReleaseDraftForm((prev) => ({ ...prev, type }))}
                        >
                          <span className="release-type-icon">{icon}</span>
                          <strong>{type}</strong>
                          <small>{desc}</small>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Release title */}
                  <div className="ta-wizard-field-group">
                    <label className="ta-wizard-field-label">Release Title</label>
                    <input
                      className="ta-wizard-input"
                      value={releaseDraftForm.title}
                      onChange={(e) => setReleaseDraftForm((prev) => ({ ...prev, title: e.target.value }))}
                      placeholder="Better Late"
                    />
                  </div>

                  {/* Primary artist */}
                  <div className="ta-wizard-field-row">
                    <div className="ta-wizard-field-group">
                      <label className="ta-wizard-field-label">Primary Artist</label>
                      <input
                        className="ta-wizard-input"
                        value={releaseDraftForm.artistName}
                        onChange={(e) => setReleaseDraftForm((prev) => ({ ...prev, artistName: e.target.value }))}
                        placeholder="Natasha Storm"
                      />
                    </div>
                    <div className="ta-wizard-field-group">
                      <label className="ta-wizard-field-label">Artist ID <small style={{ opacity: 0.6 }}>optional</small></label>
                      <input
                        className="ta-wizard-input"
                        value={releaseDraftForm.artistId}
                        onChange={(e) => setReleaseDraftForm((prev) => ({ ...prev, artistId: e.target.value }))}
                        placeholder="123"
                        inputMode="numeric"
                      />
                    </div>
                  </div>

                  {/* Label */}
                  <div className="ta-wizard-field-group">
                    <label className="ta-wizard-field-label">Label <small style={{ opacity: 0.6 }}>optional</small></label>
                    <input
                      className="ta-wizard-input"
                      value={releaseDraftForm.label}
                      onChange={(e) => setReleaseDraftForm((prev) => ({ ...prev, label: e.target.value }))}
                      placeholder="Track Adam / SWU"
                    />
                  </div>

                  <InlineError message={createReleaseState.error} />

                  {createReleaseState.data ? (
                    <div className="ta-wizard-success-banner">
                      ✓ Draft created — {releaseDraftForm.type || "release"} is ready to build
                    </div>
                  ) : null}

                  <div className="ta-wizard-nav-row">
                    <span />
                    <div className="ta-wizard-nav-right">
                      {/* Resume existing draft — collapsed */}
                      <details className="resume-draft-details">
                        <summary className="resume-draft-summary">Resume existing draft instead</summary>
                        <div className="resume-draft-body">
                          <div className="distribution-form-grid">
                            <label>
                              <span>Status</span>
                              <select value={releaseFilters.status} onChange={(e) => setReleaseFilters((prev) => ({ ...prev, status: e.target.value }))}>
                                <option value="">Any status</option>
                                {releaseStatusOptions.map((s) => <option key={s} value={s}>{s}</option>)}
                              </select>
                            </label>
                            <label>
                              <span>Type</span>
                              <select value={releaseFilters.type} onChange={(e) => setReleaseFilters((prev) => ({ ...prev, type: e.target.value }))}>
                                <option value="">Any type</option>
                                {releaseTypeOptions.map((t) => <option key={t} value={t}>{t}</option>)}
                              </select>
                            </label>
                            <label className="distribution-form-wide">
                              <span>Search title</span>
                              <input value={releaseFilters.search} onChange={(e) => setReleaseFilters((prev) => ({ ...prev, search: e.target.value }))} placeholder="Better Late" />
                            </label>
                          </div>
                          <InlineError message={getEndpointState(endpointResults, "releases").error} />
                          <button className="secondary-btn distribution-full-width-btn" type="button" disabled={!canLoad || getEndpointState(endpointResults, "releases").loading} onClick={loadReleasesWithFilters}>
                            {getEndpointState(endpointResults, "releases").loading ? "Loading..." : "Load Drafts"}
                          </button>
                          {releasesResult ? (
                            <>
                              <ReleaseTable data={releasesResult} selectedReleaseId={selectedReleaseId} onSelect={(id) => void loadReleaseDetails(id)} />
                              <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
                                <button className="primary-btn" type="button" disabled={!selectedReleaseId} onClick={() => setActiveReleaseStep("artwork")}>
                                  Resume → Continue to Artwork
                                </button>
                                {selectedReleaseId ? (
                                  <button className="danger-btn" type="button" onClick={() => void deleteReleaseDraft(selectedReleaseId)}>
                                    Delete Draft
                                  </button>
                                ) : null}
                              </div>
                            </>
                          ) : null}
                        </div>
                      </details>

                      <button
                        className="primary-btn ta-wizard-cta"
                        type="button"
                        disabled={!canLoad || createReleaseState.loading || !releaseDraftForm.title.trim() || !releaseDraftForm.artistName.trim()}
                        onClick={createReleaseDraft}
                      >
                        {createReleaseState.loading ? "Creating..." : "Create Draft → Continue to Artwork"}
                      </button>
                    </div>
                  </div>
                </div>
              ) : null}

              {/* ══ STEP 2: Artwork ══ */}
              {activeReleaseStep === "artwork" ? (
                <div className="ta-wizard-step-content">
                  <div className="ta-wizard-step-header">
                    <span className="asset-type-pill">Step 2 of 7</span>
                    <h2>Cover Artwork</h2>
                    <p>Upload your cover art. This is the first thing listeners see — make it count. Minimum 3000×3000px square, JPG/PNG/TIFF.</p>
                  </div>

                  {/* Upload sources */}
                  <div className="ta-artwork-source-grid">
                    <label className="ta-artwork-source-card ta-artwork-upload-source">
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/tiff,image/webp"
                        onChange={(e) => void handleArtworkFileSelect(e.target.files?.[0] ?? null)}
                      />
                      <span>☁</span>
                      <strong>Upload Artwork</strong>
                      <small>JPG, PNG, or TIFF</small>
                    </label>
                    <button className="ta-artwork-source-card" type="button">
                      <span>✦</span>
                      <strong>Gemini</strong>
                      <small>Generate with Google</small>
                    </button>
                    <button className="ta-artwork-source-card" type="button">
                      <span>●</span>
                      <strong>DALL-E</strong>
                      <small>Generate with OpenAI</small>
                    </button>
                  </div>

                  {/* Guidelines */}
                  <div className="ta-artwork-guidelines-card">
                    <strong>Artwork Guidelines</strong>
                    <div className="ta-artwork-guidelines-grid">
                      <span>✕ Recommended 3000px, max 5000px</span>
                      <span>⊞ Must be a perfect square</span>
                      <span>⊡ File size under 36MB</span>
                      <span>◎ No blurriness or uneven borders</span>
                      <span>⊛ RGB color mode required</span>
                      <span>◉ Artwork is manually reviewed</span>
                    </div>
                  </div>

                  {/* Upload area + URL fields */}
                  <div className="artwork-upload-layout">
                    <label className={`artwork-drop-zone${artworkUploading ? " artwork-uploading" : ""}${artworkPreviewUrl ? " artwork-has-preview" : ""}`}>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/tiff,image/webp"
                        onChange={(e) => void handleArtworkFileSelect(e.target.files?.[0] ?? null)}
                      />
                      {artworkPreviewUrl ? (
                        <img src={artworkPreviewUrl} alt="Cover artwork preview" className="artwork-preview-img" />
                      ) : (
                        <div className="artwork-drop-placeholder">
                          <span className="artwork-drop-icon">🖼</span>
                          <strong>{artworkUploading ? "Uploading..." : "Drop artwork or click to browse"}</strong>
                          <small>JPG · PNG · TIFF</small>
                        </div>
                      )}
                      {artworkUploading ? <div className="artwork-uploading-overlay"><span>Uploading...</span></div> : null}
                    </label>

                    <div className="artwork-url-fields">
                      <label>
                        <span>Cover URL</span>
                        <input
                          value={releaseMetadataForm.coverUrl}
                          onChange={(e) => {
                            setReleaseMetadataForm((prev) => ({ ...prev, coverUrl: e.target.value }));
                            if (e.target.value) setArtworkPreviewUrl(e.target.value);
                          }}
                          placeholder="Auto-filled after upload, or paste URL"
                        />
                      </label>
                      <label>
                        <span>Compressed Artwork URL <small style={{ opacity: 0.6 }}>optional</small></span>
                        <input
                          value={releaseMetadataForm.compressedArtwork}
                          onChange={(e) => setReleaseMetadataForm((prev) => ({ ...prev, compressedArtwork: e.target.value }))}
                          placeholder="Optional smaller version"
                        />
                      </label>
                      <InlineError message={artworkUploadError} />
                    </div>
                  </div>

                  {/* Apple Motion Art */}
                  <div className="ta-wizard-field-group" style={{ marginTop: "24px", padding: "16px", borderRadius: "14px", border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.03)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <strong>Apple Motion Art</strong>
                        <p style={{ opacity: 0.6, margin: "4px 0 0", fontSize: "13px" }}>Animated album artwork for Apple Music. ProRes format, separate from cover art.</p>
                      </div>
                      <button className="secondary-btn" type="button">Upload Motion Art</button>
                    </div>
                  </div>

                  <div className="ta-wizard-nav-row">
                    <button className="secondary-btn" type="button" onClick={() => setActiveReleaseStep("start")}>← Previous</button>
                    <button className="primary-btn ta-wizard-cta" type="button" onClick={() => setActiveReleaseStep("info")}>Continue →</button>
                  </div>
                </div>
              ) : null}

              {/* ══ STEP 3: Release Information ══ */}
              {activeReleaseStep === "info" ? (
                <div className="ta-wizard-step-content">
                  <div className="ta-wizard-step-header">
                    <span className="asset-type-pill">Step 3 of 7</span>
                    <h2>Release Information</h2>
                    <p>Complete store-ready metadata. Genre and language dropdowns populate from Setup data.</p>
                    {selectedReleaseId ? <span className="status-pill" style={{ marginTop: "8px", display: "inline-block" }}>Release ID {selectedReleaseId}</span> : (
                      <div className="distribution-v5-muted-warning" style={{ marginTop: "10px" }}>No release selected — go back to Step 1 and create or resume a draft first.</div>
                    )}
                  </div>

                  {(genreOptions.length === 0 || languageOptions.length === 0) ? (
                    <div className="distribution-v5-muted-warning release-info-setup-warning">
                      Load Setup Data so genre and language dropdowns use real distributor options.
                      <button className="secondary-btn" type="button" disabled={!canLoad || actionLoading} onClick={() => void loadMany(["lookupGenres", "lookupLanguages", "lookupPlatforms", "lookupCountries"])}>
                        Load Setup Data
                      </button>
                    </div>
                  ) : null}

                  {/* Release Date */}
                  <div className="ta-wizard-section-block">
                    <h4 className="ta-wizard-section-title">Release Date</h4>
                    <div className="ta-wizard-field-row">
                      <div className="ta-wizard-field-group">
                        <label className="ta-wizard-field-label">Release Date</label>
                        <input type="date" className="ta-wizard-input" value={releaseMetadataForm.releaseDate} onChange={(e) => setReleaseMetadataForm((prev) => ({ ...prev, releaseDate: e.target.value }))} />
                      </div>
                      <div className="ta-wizard-field-group">
                        <label className="ta-wizard-field-label">Original Release Date <small style={{ opacity: 0.6 }}>optional</small></label>
                        <input type="date" className="ta-wizard-input" value={releaseMetadataForm.originalReleaseDate} onChange={(e) => setReleaseMetadataForm((prev) => ({ ...prev, originalReleaseDate: e.target.value }))} />
                      </div>
                    </div>
                    <div className="ta-wizard-field-row">
                      <div className="ta-wizard-field-group">
                        <label className="ta-wizard-field-label">Release Time <small style={{ opacity: 0.6 }}>optional</small></label>
                        <input className="ta-wizard-input" value={releaseMetadataForm.releaseTime} onChange={(e) => setReleaseMetadataForm((prev) => ({ ...prev, releaseTime: e.target.value }))} placeholder="05:55" />
                      </div>
                      <div className="ta-wizard-field-group">
                        <label className="ta-wizard-field-label">Time Zone <small style={{ opacity: 0.6 }}>optional</small></label>
                        <input className="ta-wizard-input" value={releaseMetadataForm.timeZone} onChange={(e) => setReleaseMetadataForm((prev) => ({ ...prev, timeZone: e.target.value }))} placeholder="Pacific/Niue" />
                      </div>
                    </div>
                    <div className="ta-wizard-toggle-row">
                      <label className="ta-wizard-toggle-label">
                        <input type="checkbox" checked={releaseMetadataForm.applePreorder === "true"} onChange={(e) => setReleaseMetadataForm((prev) => ({ ...prev, applePreorder: e.target.checked ? "true" : "false" }))} />
                        Apple Pre-order
                      </label>
                      {releaseMetadataForm.applePreorder === "true" && (
                        <div className="ta-wizard-field-group" style={{ marginTop: "10px" }}>
                          <label className="ta-wizard-field-label">Pre-order Date</label>
                          <input type="date" className="ta-wizard-input" value={releaseMetadataForm.applePreorderDate} onChange={(e) => setReleaseMetadataForm((prev) => ({ ...prev, applePreorderDate: e.target.value }))} />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Genre & Language */}
                  <div className="ta-wizard-section-block">
                    <h4 className="ta-wizard-section-title">Genre &amp; Language</h4>
                    <div className="ta-wizard-field-row">
                      <div className="ta-wizard-field-group">
                        <label className="ta-wizard-field-label">Primary Genre</label>
                        <select className="ta-wizard-input" value={releaseMetadataForm.primaryGenre} onChange={(e) => setReleaseMetadataForm((prev) => ({ ...prev, primaryGenre: e.target.value }))}>
                          <option value="">Choose genre</option>
                          {genreOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                        </select>
                      </div>
                      <div className="ta-wizard-field-group">
                        <label className="ta-wizard-field-label">Secondary Genre <small style={{ opacity: 0.6 }}>optional</small></label>
                        <select className="ta-wizard-input" value={releaseMetadataForm.secondaryGenre} onChange={(e) => setReleaseMetadataForm((prev) => ({ ...prev, secondaryGenre: e.target.value }))}>
                          <option value="">Choose genre</option>
                          {genreOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                        </select>
                      </div>
                    </div>
                    <div className="ta-wizard-field-row">
                      <div className="ta-wizard-field-group">
                        <label className="ta-wizard-field-label">Language</label>
                        <select className="ta-wizard-input" value={releaseMetadataForm.language} onChange={(e) => setReleaseMetadataForm((prev) => ({ ...prev, language: e.target.value }))}>
                          <option value="">Choose language</option>
                          {languageOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                        </select>
                      </div>
                      <div className="ta-wizard-field-group">
                        <label className="ta-wizard-field-label">Label</label>
                        <input className="ta-wizard-input" value={releaseMetadataForm.label} onChange={(e) => setReleaseMetadataForm((prev) => ({ ...prev, label: e.target.value }))} placeholder="Shock WAV Union" />
                      </div>
                    </div>
                  </div>

                  {/* Copyright */}
                  <div className="ta-wizard-section-block">
                    <h4 className="ta-wizard-section-title">Copyright Line</h4>
                    <p style={{ opacity: 0.6, fontSize: "13px", marginBottom: "12px" }}>The owner of publishing and sound recording rights. Typically your name, label, or publisher.</p>
                    <div className="ta-wizard-field-row">
                      <div className="ta-wizard-field-group">
                        <label className="ta-wizard-field-label">C Year</label>
                        <input className="ta-wizard-input" value={releaseMetadataForm.cYear} onChange={(e) => setReleaseMetadataForm((prev) => ({ ...prev, cYear: e.target.value }))} placeholder="2026" inputMode="numeric" />
                      </div>
                      <div className="ta-wizard-field-group">
                        <label className="ta-wizard-field-label">C Line</label>
                        <input className="ta-wizard-input" value={releaseMetadataForm.cLine} onChange={(e) => setReleaseMetadataForm((prev) => ({ ...prev, cLine: e.target.value }))} placeholder="2026 Track Adam" />
                      </div>
                    </div>
                    <div className="ta-wizard-field-row">
                      <div className="ta-wizard-field-group">
                        <label className="ta-wizard-field-label">P Year</label>
                        <input className="ta-wizard-input" value={releaseMetadataForm.pYear} onChange={(e) => setReleaseMetadataForm((prev) => ({ ...prev, pYear: e.target.value }))} placeholder="2026" inputMode="numeric" />
                      </div>
                      <div className="ta-wizard-field-group">
                        <label className="ta-wizard-field-label">P Line</label>
                        <input className="ta-wizard-input" value={releaseMetadataForm.pLine} onChange={(e) => setReleaseMetadataForm((prev) => ({ ...prev, pLine: e.target.value }))} placeholder="2026 Track Adam" />
                      </div>
                    </div>
                  </div>

                  {/* Optional metadata */}
                  <details className="ta-wizard-optional-block">
                    <summary>Optional Information</summary>
                    <div className="ta-wizard-optional-body">
                      <div className="ta-wizard-field-row">
                        <div className="ta-wizard-field-group">
                          <label className="ta-wizard-field-label">Version</label>
                          <input className="ta-wizard-input" value={releaseMetadataForm.version} onChange={(e) => setReleaseMetadataForm((prev) => ({ ...prev, version: e.target.value }))} placeholder="Deluxe, Radio Edit, etc." />
                        </div>
                        <div className="ta-wizard-field-group">
                          <label className="ta-wizard-field-label">Remix Title</label>
                          <input className="ta-wizard-input" value={releaseMetadataForm.remixTitle} onChange={(e) => setReleaseMetadataForm((prev) => ({ ...prev, remixTitle: e.target.value }))} placeholder="Nova Waves Remix" />
                        </div>
                      </div>
                      <div className="ta-wizard-field-row">
                        <div className="ta-wizard-field-group">
                          <label className="ta-wizard-field-label">License Type</label>
                          <select className="ta-wizard-input" value={releaseMetadataForm.licenseType} onChange={(e) => setReleaseMetadataForm((prev) => ({ ...prev, licenseType: e.target.value }))}>
                            <option value="">Keep current / not set</option>
                            {licenseTypeOptions.map((t) => <option key={t} value={t}>{t}</option>)}
                          </select>
                        </div>
                        <div className="ta-wizard-field-group">
                          <label className="ta-wizard-field-label">License Info</label>
                          <input className="ta-wizard-input" value={releaseMetadataForm.licenseInfo} onChange={(e) => setReleaseMetadataForm((prev) => ({ ...prev, licenseInfo: e.target.value }))} placeholder="Owned by artist and label." />
                        </div>
                      </div>
                      <div className="ta-wizard-field-row">
                        <div className="ta-wizard-field-group">
                          <label className="ta-wizard-field-label">UPC <small style={{ opacity: 0.6 }}>optional</small></label>
                          <input className="ta-wizard-input" value={releaseMetadataForm.upc} onChange={(e) => setReleaseMetadataForm((prev) => ({ ...prev, upc: e.target.value }))} placeholder="123456789012" inputMode="numeric" />
                        </div>
                        <div className="ta-wizard-field-group">
                          <label className="ta-wizard-field-label">AI Generated Artwork</label>
                          <select className="ta-wizard-input" value={releaseMetadataForm.isAiGenerated} onChange={(e) => setReleaseMetadataForm((prev) => ({ ...prev, isAiGenerated: e.target.value }))}>
                            <option value="">Keep current / not set</option>
                            <option value="false">No</option>
                            <option value="true">Yes</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </details>

                  <InlineError message={metadataUpdateState.error} />
                  {metadataUpdateState.data ? (
                    <div className="ta-wizard-success-banner">✓ Release info saved</div>
                  ) : null}

                  <div className="ta-wizard-nav-row">
                    <button className="secondary-btn" type="button" onClick={() => setActiveReleaseStep("artwork")}>← Previous</button>
                    <div className="ta-wizard-nav-right">
                      <button className="secondary-btn" type="button" disabled={!canLoad || metadataUpdateState.loading || !selectedReleaseId} onClick={saveReleaseMetadata}>
                        {metadataUpdateState.loading ? "Saving..." : "Save Release Info"}
                      </button>
                      <button className="primary-btn ta-wizard-cta" type="button" onClick={() => setActiveReleaseStep("tracks")}>Continue →</button>
                    </div>
                  </div>
                </div>
              ) : null}

              {/* ══ STEP 4: Manage Tracks ══ */}
              {activeReleaseStep === "tracks" ? (
                <div className="ta-wizard-step-content">
                  <div className="ta-wizard-step-header">
                    <span className="asset-type-pill">Step 4 of 7</span>
                    <h2>Manage Tracks</h2>
                    <p>Upload FLAC audio files and set track metadata. WAV files are recommended for best quality. All tracks save together in one call.</p>
                    {putTracksState.data
                      ? <span className="status-pill status-live" style={{ marginTop: "8px", display: "inline-block" }}>Tracklist Saved</span>
                      : <span className="status-pill status-warning" style={{ marginTop: "8px", display: "inline-block" }}>Unsaved</span>}
                  </div>

                  {/* Existing tracks */}
                  {releaseTracksState.data && Array.isArray((releaseTracksState.data as { data?: unknown[] }).data) && (releaseTracksState.data as { data?: unknown[] }).data!.length > 0 ? (
                    <div className="track-existing-list">
                      <h4>Existing Tracks on Release</h4>
                      <DataTable data={releaseTracksState.data} emptyLabel="No tracks yet." />
                    </div>
                  ) : null}

                  {/* Upload zone */}
                  <div className="ta-wizard-upload-zone">
                    <div className="ta-wizard-upload-icon">↑</div>
                    <strong>Upload tracks</strong>
                    <p>Click to browse audio files from your device</p>
                    <label className="secondary-btn" style={{ cursor: "pointer", marginTop: "8px" }}>
                      Browse Files
                      <input
                        type="file"
                        accept=".flac,audio/flac"
                        style={{ display: "none" }}
                        onChange={(e) => {
                          setTrackUploadFile(e.target.files?.[0] ?? null);
                          setTrackUploadPhase("idle");
                          setTrackUploadError("");
                          if (trackForms.length === 0) addBlankTrack();
                          setActiveTrackIndex(0);
                        }}
                      />
                    </label>
                    <p style={{ opacity: 0.5, fontSize: "12px", marginTop: "6px" }}>or select from existing tracks</p>
                  </div>

                  {/* Track form list */}
                  <div className="track-form-list" style={{ marginTop: "16px" }}>
                    {trackForms.map((track, idx) => (
                      <div key={idx} className={`track-form-card${activeTrackIndex === idx ? " track-form-card-active" : ""}`}>
                        <div className="track-form-card-header">
                          <button className="track-form-card-toggle" type="button" onClick={() => setActiveTrackIndex(activeTrackIndex === idx ? null : idx)}>
                            <strong>{track.title || `Track ${idx + 1}`}</strong>
                            <span>{track.audioFileKey ? "Audio ready" : "No audio"}</span>
                          </button>
                          <button className="mini-action-btn mini-action-btn-danger" type="button" onClick={() => removeTrack(idx)}>Remove</button>
                        </div>

                        {activeTrackIndex === idx ? (
                          <div className="track-form-fields">
                            <div className="distribution-form-grid">
                              <label><span>Track Title *</span><input value={track.title} onChange={(e) => updateTrackField(idx, "title", e.target.value)} placeholder="Track title" /></label>
                              <label>
                                <span>Language</span>
                                <select value={track.language ?? "en"} onChange={(e) => updateTrackField(idx, "language", e.target.value)}>
                                  <option value="en">English</option>
                                  <option value="es">Spanish</option>
                                  <option value="fr">French</option>
                                  <option value="de">German</option>
                                  <option value="pt">Portuguese</option>
                                  <option value="ja">Japanese</option>
                                  <option value="ko">Korean</option>
                                  <option value="zh">Chinese</option>
                                  <option value="zxx">No lyrics / Instrumental</option>
                                </select>
                              </label>
                              <label><span>ISRC optional</span><input value={track.isrc ?? ""} onChange={(e) => updateTrackField(idx, "isrc", e.target.value)} placeholder="USABC1234567" /></label>
                              <label><span>Version optional</span><input value={track.version ?? ""} onChange={(e) => updateTrackField(idx, "version", e.target.value)} placeholder="Extended Mix" /></label>
                              <label><span>TikTok Start Time</span><input value={track.tiktokStartTime ?? ""} onChange={(e) => updateTrackField(idx, "tiktokStartTime", e.target.value)} placeholder="00:30" /></label>
                              <label><span>Liner Note</span><input value={track.linerNote ?? ""} onChange={(e) => updateTrackField(idx, "linerNote", e.target.value)} placeholder="Recorded in..." /></label>
                            </div>

                            <div className="track-credits-grid">
                              <div>
                                <h4>Artists</h4>
                                {(track.artists ?? []).map((artist, ai) => (
                                  <div key={ai} className="track-credit-row">
                                    <input value={artist.name} onChange={(e) => updateTrackArtist(idx, ai, "name", e.target.value)} placeholder="Artist name" />
                                    <select value={artist.role[0] ?? "primary"} onChange={(e) => updateTrackArtist(idx, ai, "role", e.target.value)}>
                                      <option value="primary">Primary</option>
                                      <option value="featured">Featured</option>
                                      <option value="remixer">Remixer</option>
                                      <option value="conductor">Conductor</option>
                                      <option value="orchestra">Orchestra</option>
                                    </select>
                                    <button className="mini-action-btn mini-action-btn-danger" type="button" onClick={() => {
                                      const artists = (track.artists ?? []).filter((_, i) => i !== ai);
                                      updateTrackField(idx, "artists", artists);
                                    }}>×</button>
                                  </div>
                                ))}
                                <button className="mini-action-btn" type="button" onClick={() => updateTrackField(idx, "artists", [...(track.artists ?? []), { name: "", role: ["primary"] }])}>+ Artist</button>
                              </div>
                              <div>
                                <h4>Writers</h4>
                                {(track.writers ?? []).map((writer, wi) => (
                                  <div key={wi} className="track-credit-row">
                                    <input value={writer.name} onChange={(e) => updateTrackWriter(idx, wi, "name", e.target.value)} placeholder="Writer name" />
                                    <select value={writer.role[0] ?? "composer"} onChange={(e) => updateTrackWriter(idx, wi, "role", e.target.value)}>
                                      <option value="composer">Composer</option>
                                      <option value="lyricist">Lyricist</option>
                                      <option value="composer_lyricist">Composer & Lyricist</option>
                                      <option value="arranger">Arranger</option>
                                      <option value="translator">Translator</option>
                                    </select>
                                    <button className="mini-action-btn mini-action-btn-danger" type="button" onClick={() => {
                                      const writers = (track.writers ?? []).filter((_, i) => i !== wi);
                                      updateTrackField(idx, "writers", writers);
                                    }}>×</button>
                                  </div>
                                ))}
                                <button className="mini-action-btn" type="button" onClick={() => updateTrackField(idx, "writers", [...(track.writers ?? []), { name: "", role: ["composer"] }])}>+ Writer</button>
                              </div>
                            </div>

                            {/* File upload for this track */}
                            <div className="track-upload-section">
                              <h4>Audio File</h4>
                              {track.audioFileKey ? (
                                <div className="track-upload-done">
                                  <span className="status-pill status-live">Audio Uploaded</span>
                                  <small>{track.audioFileKey.split("/").pop()}</small>
                                </div>
                              ) : null}
                              <div className="track-upload-controls">
                                <select value={trackUploadKind} onChange={(e) => setTrackUploadKind(e.target.value as "audio" | "instrumental" | "dolby")}>
                                  <option value="audio">Audio (Main)</option>
                                  <option value="instrumental">Instrumental</option>
                                  <option value="dolby">Dolby Atmos</option>
                                </select>
                                <label className="track-file-picker">
                                  <input
                                    type="file"
                                    accept=".flac,audio/flac"
                                    onChange={(e) => {
                                      setTrackUploadFile(e.target.files?.[0] ?? null);
                                      setTrackUploadPhase("idle");
                                      setTrackUploadError("");
                                      setActiveTrackIndex(idx);
                                    }}
                                  />
                                  {trackUploadFile && activeTrackIndex === idx ? trackUploadFile.name : "Choose FLAC file"}
                                </label>
                                {trackUploadFile && activeTrackIndex === idx ? (
                                  <button
                                    className="secondary-btn"
                                    type="button"
                                    disabled={trackUploadPhase === "url" || trackUploadPhase === "s3"}
                                    onClick={() => void uploadTrackFile()}
                                  >
                                    {trackUploadPhase === "url" ? "Getting URL..." :
                                     trackUploadPhase === "s3" ? `Uploading ${trackUploadProgress}%...` :
                                     trackUploadPhase === "done" ? "Uploaded ✓" : "Upload to S3"}
                                  </button>
                                ) : null}
                              </div>
                              {trackUploadPhase === "s3" && activeTrackIndex === idx ? (
                                <div className="track-upload-progress">
                                  <div className="track-upload-progress-bar" style={{ width: `${trackUploadProgress}%` }} />
                                </div>
                              ) : null}
                              {trackUploadError && activeTrackIndex === idx ? (
                                <p className="distribution-v5-error">{trackUploadError}</p>
                              ) : null}
                            </div>
                          </div>
                        ) : null}
                      </div>
                    ))}
                  </div>

                  <button className="secondary-btn" type="button" style={{ marginTop: "12px" }} onClick={addBlankTrack}>+ Add Track</button>

                  <InlineError message={putTracksState.error} />

                  <div className="ta-wizard-nav-row" style={{ marginTop: "24px" }}>
                    <button className="secondary-btn" type="button" onClick={() => setActiveReleaseStep("info")}>← Previous</button>
                    <div className="ta-wizard-nav-right">
                      <button
                        className="secondary-btn"
                        type="button"
                        disabled={putTracksState.loading || trackForms.filter((t) => t.title && t.audioFileKey).length === 0}
                        onClick={() => void saveTracklist()}
                      >
                        {putTracksState.loading ? "Saving Tracklist..." : "Save Tracklist"}
                      </button>
                      <button className="primary-btn ta-wizard-cta" type="button" onClick={() => setActiveReleaseStep("delivery")}>Continue →</button>
                    </div>
                  </div>
                </div>
              ) : null}

              {/* ══ STEP 5: Delivery ══ */}
              {activeReleaseStep === "delivery" ? (
                <div className="ta-wizard-step-content">
                  <div className="ta-wizard-step-header">
                    <span className="asset-type-pill">Step 5 of 7</span>
                    <h2>Platforms &amp; Territories</h2>
                    <p>Choose where this release will be delivered. Load setup data first to see real platform and territory options.</p>
                    {deliveryConfirmed
                      ? <span className="status-pill status-live" style={{ marginTop: "8px", display: "inline-block" }}>Delivery Saved</span>
                      : <span className="status-pill status-warning" style={{ marginTop: "8px", display: "inline-block" }}>Not Saved</span>}
                  </div>

                  {(deliveryPlatformOptions.length === 0 || territoryOptions.length === 0) ? (
                    <div className="distribution-v5-muted-warning release-info-setup-warning">
                      Load platform and territory data from Setup first.
                      <button className="secondary-btn" type="button" disabled={!canLoad || actionLoading} onClick={() => void loadMany(["lookupPlatforms", "lookupCountries"])}>
                        Load Platform / Country Data
                      </button>
                    </div>
                  ) : null}

                  <div className="release-delivery-preview-grid">
                    <div>
                      <h4>Platforms</h4>
                      <div className="release-delivery-select-actions">
                        <button className="mini-action-btn" type="button" onClick={() => setSelectedDeliveryPlatforms(deliveryPlatformOptions.map((o) => o.value))}>All</button>
                        <button className="mini-action-btn" type="button" onClick={() => setSelectedDeliveryPlatforms([])}>None</button>
                      </div>
                      <div className="release-option-chip-grid release-delivery-checkbox-grid">
                        {deliveryPlatformOptions.map((option) => (
                          <label key={option.value} className="release-delivery-checkbox-label">
                            <input
                              type="checkbox"
                              checked={selectedDeliveryPlatforms.includes(option.value)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedDeliveryPlatforms((prev) => [...prev, option.value]);
                                } else {
                                  setSelectedDeliveryPlatforms((prev) => prev.filter((p) => p !== option.value));
                                }
                              }}
                            />
                            {option.label}
                          </label>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h4>Territories</h4>
                      <div className="release-delivery-select-actions">
                        <button className="mini-action-btn" type="button" onClick={() => setSelectedTerritories(territoryOptions.map((o) => o.value))}>All</button>
                        <button className="mini-action-btn" type="button" onClick={() => setSelectedTerritories([])}>None</button>
                      </div>
                      <div className="release-option-chip-grid release-delivery-checkbox-grid">
                        {territoryOptions.map((option) => (
                          <label key={option.value} className="release-delivery-checkbox-label">
                            <input
                              type="checkbox"
                              checked={selectedTerritories.includes(option.value)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedTerritories((prev) => [...prev, option.value]);
                                } else {
                                  setSelectedTerritories((prev) => prev.filter((t) => t !== option.value));
                                }
                              }}
                            />
                            {option.label}
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="release-delivery-additional">
                    <h4>Additional Options</h4>
                    <label className="release-delivery-checkbox-label">
                      <input type="checkbox" checked={deliveryYoutube} onChange={(e) => setDeliveryYoutube(e.target.checked)} />
                      Enable YouTube Content ID
                    </label>
                  </div>

                  {deliveryUpdateState.data ? (
                    <div className="ta-wizard-success-banner">
                      ✓ Saved — {selectedDeliveryPlatforms.length} platforms, {selectedTerritories.length} territories
                    </div>
                  ) : null}
                  <InlineError message={deliveryUpdateState.error} />

                  <div className="ta-wizard-nav-row">
                    <button className="secondary-btn" type="button" onClick={() => setActiveReleaseStep("tracks")}>← Previous</button>
                    <div className="ta-wizard-nav-right">
                      <button
                        className="secondary-btn"
                        type="button"
                        disabled={!canLoad || deliveryUpdateState.loading || !selectedReleaseId || selectedDeliveryPlatforms.length === 0 || selectedTerritories.length === 0}
                        onClick={() => void saveDelivery()}
                      >
                        {deliveryUpdateState.loading ? "Saving..." : "Save Delivery Settings"}
                      </button>
                      <button className="primary-btn ta-wizard-cta" type="button" onClick={() => setActiveReleaseStep("validation")}>Continue →</button>
                    </div>
                  </div>
                </div>
              ) : null}

              {/* ══ STEP 6: Validation ══ */}
              {activeReleaseStep === "validation" ? (
                <div className="ta-wizard-step-content">
                  <div className="ta-wizard-step-header">
                    <span className="asset-type-pill">Step 6 of 7</span>
                    <h2>UPC &amp; ISRC Checks</h2>
                    <p>Validate release and track identifiers before final review. Catch issues before they hold up the release.</p>
                    {selectedReleaseId ? <span className="status-pill" style={{ marginTop: "8px", display: "inline-block" }}>Release ID {selectedReleaseId}</span> : null}
                  </div>

                  <div className="release-validation-grid">
                    <div>
                      <h4>UPC Check</h4>
                      <p className="distribution-empty">A UPC is usually 12 or 13 digits.</p>
                      <div className="distribution-v5-inline-form distribution-upc-inline-form">
                        <input value={upcToValidate} onChange={(e) => setUpcToValidate(e.target.value)} placeholder="123456789012" inputMode="numeric" />
                        <button className="secondary-btn" type="button" disabled={!canLoad || upcValidationState.loading || !upcToValidate.trim()} onClick={validateUpc}>
                          {upcValidationState.loading ? "Checking..." : "Validate UPC"}
                        </button>
                      </div>
                      <InlineError message={upcValidationState.error} />
                      <DataTable data={upcValidationState.data} emptyLabel="No UPC validation result yet." />
                    </div>
                    <div>
                      <h4>ISRC Check</h4>
                      <p className="distribution-empty">An ISRC uses 12 uppercase letters/numbers with no hyphens.</p>
                      <div className="distribution-v5-inline-form distribution-upc-inline-form">
                        <input value={isrcToValidate} onChange={(e) => setIsrcToValidate(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))} placeholder="USABC1234567" maxLength={12} />
                        <button className="secondary-btn" type="button" disabled={!canLoad || isrcValidationState.loading || !isrcToValidate.trim()} onClick={validateIsrc}>
                          {isrcValidationState.loading ? "Checking..." : "Validate ISRC"}
                        </button>
                      </div>
                      <InlineError message={isrcValidationState.error} />
                      <DataTable data={isrcValidationState.data} emptyLabel="No ISRC validation result yet." />
                    </div>
                  </div>

                  <div className="ta-wizard-nav-row">
                    <button className="secondary-btn" type="button" onClick={() => setActiveReleaseStep("delivery")}>← Previous</button>
                    <button className="primary-btn ta-wizard-cta" type="button" onClick={() => setActiveReleaseStep("review")}>Continue →</button>
                  </div>
                </div>
              ) : null}

              {/* ══ STEP 7: Review & Publish ══ */}
              {activeReleaseStep === "review" ? (
                <div className="ta-wizard-step-content">
                  <div className="ta-wizard-step-header">
                    <span className="asset-type-pill">Step 7 of 7</span>
                    <h2>Review &amp; Publish</h2>
                    <p>All steps must be complete and both confirmations checked before submission unlocks.</p>
                    {submitState.data
                      ? <span className="status-pill status-live" style={{ marginTop: "8px", display: "inline-block" }}>Submitted</span>
                      : <span className="status-pill status-warning" style={{ marginTop: "8px", display: "inline-block" }}>Pending</span>}
                  </div>

                  <div className="release-builder-review-grid">
                    <label><input type="checkbox" checked={releaseDraftReady || selectedReleaseReady} readOnly /> Draft or release loaded</label>
                    <label><input type="checkbox" checked={Boolean(releaseMetadataForm.coverUrl || artworkPreviewUrl)} readOnly /> Artwork attached</label>
                    <label><input type="checkbox" checked={metadataSaved} readOnly /> Release info saved</label>
                    <label><input type="checkbox" checked={tracksReady} readOnly /> Tracks inspected</label>
                    <label><input type="checkbox" checked={deliveryConfirmed} readOnly /> Delivery settings saved</label>
                    <label><input type="checkbox" checked={upcValidated} readOnly /> UPC validation checked</label>
                    <label><input type="checkbox" checked={Boolean(isrcValidationState.data)} readOnly /> ISRC validation checked</label>
                  </div>

                  <div className="release-review-confirmations">
                    <h4>Confirmations</h4>
                    <label className="release-delivery-checkbox-label release-review-rights-label">
                      <input type="checkbox" checked={rightsConfirmed} onChange={(e) => setRightsConfirmed(e.target.checked)} />
                      I own or control all rights to this release
                    </label>
                    <label className="release-delivery-checkbox-label release-review-rights-label">
                      <input type="checkbox" checked={acceptTerms} onChange={(e) => setAcceptTerms(e.target.checked)} />
                      I accept the distribution terms
                    </label>
                  </div>

                  {submitState.data ? (
                    <div className="ta-wizard-success-banner">
                      ✓ Submitted for review — Release ID {selectedReleaseId}
                    </div>
                  ) : null}
                  <InlineError message={submitState.error} />

                  <div className="ta-wizard-nav-row">
                    <button className="secondary-btn" type="button" onClick={() => setActiveReleaseStep("validation")}>← Previous</button>
                    <button
                      className="primary-btn ta-wizard-cta"
                      type="button"
                      disabled={
                        submitState.loading ||
                        Boolean(submitState.data) ||
                        !(releaseDraftReady || selectedReleaseReady) ||
                        !metadataSaved ||
                        !deliveryConfirmed ||
                        !upcValidated ||
                        !rightsConfirmed ||
                        !acceptTerms
                      }
                      onClick={() => void submitRelease()}
                    >
                      {submitState.loading ? "Submitting..." : submitState.data ? "Release Submitted" : "↑ Submit Release for Review"}
                    </button>
                  </div>
                </div>
              ) : null}

            </main>

            {/* ── Right help panel ── */}
            <aside className="ta-wizard-help-panel">
              <div className="ta-wizard-help-tabs">
                <button className="ta-wizard-help-tab-active" type="button">▮ Help</button>
              </div>
              <div className="ta-wizard-help-body">
                <div className="ta-wizard-help-title-row">
                  <span className="ta-wizard-help-icon">{activeWizardStep.icon}</span>
                  <div>
                    <h3>{currentHelp.title}</h3>
                    <span className="asset-type-pill">{currentHelp.step}</span>
                  </div>
                </div>
                <p>{currentHelp.body}</p>
                {currentHelp.tips.length > 0 && (
                  <ul className="ta-wizard-help-tips">
                    {currentHelp.tips.map((tip) => <li key={tip}>💡 {tip}</li>)}
                  </ul>
                )}
                {currentHelp.articles.length > 0 && (
                  <div className="ta-wizard-help-articles">
                    <p className="ta-wizard-help-articles-label">HELP ARTICLES</p>
                    {currentHelp.articles.map((article) => (
                      <div key={article} className="ta-wizard-help-article-link">{article}</div>
                    ))}
                  </div>
                )}
              </div>
              <button className="ta-wizard-close-help" type="button">× Close</button>
            </aside>
          </div>
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
              <p>If the distributor returns Invalid scope(s), confirm read:earnings vs read:sales for sandbox sales endpoints.</p>
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
