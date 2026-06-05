/* Distribution v22 four-tier Release Creator - simplified Track Adam OS wizard */
import { useEffect, useMemo, useRef, useState } from "react";
import {
  callTooLostEndpoint,
  createTooLostReleaseDraft,
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
type ReleaseBuilderStepKey = "start" | "select" | "artwork" | "info" | "tracks" | "delivery" | "validation" | "review";
type ReleaseTierStepKey = Extract<ReleaseBuilderStepKey, "start" | "artwork" | "info" | "tracks">;

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
const releaseSetupLookupKeys: TooLostEndpointKey[] = ["lookupGenres", "lookupLanguages", "lookupPlatforms", "lookupCountries"];

const fallbackGenreOptions: SelectOption[] = [
  "R&B/Soul",
  "Hip-Hop/Rap",
  "Pop",
  "Alternative/Gothic",
  "Alternative/Grunge",
  "Singer/Songwriter",
  "Electronic",
  "Rock",
].map((genre) => ({ value: genre, label: genre }));

const fallbackLanguageOptions: SelectOption[] = [
  { value: "en", label: "English" },
  { value: "es", label: "Spanish" },
  { value: "fr", label: "French" },
  { value: "zxx", label: "Instrumental / No linguistic content" },
];

const fallbackDeliveryPlatformOptions: SelectOption[] = [
  "Spotify",
  "Apple Music",
  "Amazon Music",
  "YouTube Music",
  "TikTok",
  "Instagram/Facebook",
  "Pandora",
  "Deezer",
  "Tidal",
  "SoundCloud",
].map((platform) => ({ value: platform, label: platform }));

const fallbackTerritoryOptions: SelectOption[] = [
  { value: "US", label: "United States" },
  { value: "CA", label: "Canada" },
  { value: "GB", label: "United Kingdom" },
  { value: "AU", label: "Australia" },
  { value: "DE", label: "Germany" },
  { value: "FR", label: "France" },
  { value: "JP", label: "Japan" },
  { value: "BR", label: "Brazil" },
];

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
  const items = asArray(platforms);
  const options = items
    .map((item) => {
      if (typeof item === "string" || typeof item === "number") return String(item);
      if (!isRecord(item)) return "";
      const value = getRecordValue(item, ["platform", "channel", "service", "slug", "code", "name", "id"]);
      return typeof value === "string" || typeof value === "number" ? String(value) : "";
    })
    .filter(Boolean);

  return Array.from(new Set(options)).slice(0, 50);
}

function dedupeOptions(options: SelectOption[]) {
  const seen = new Set<string>();
  return options.filter((option) => {
    if (!option.value || seen.has(option.value)) return false;
    seen.add(option.value);
    return true;
  }).slice(0, 300);
}

function getLookupOptions(value: unknown, valueKeys: string[], labelKeys: string[] = valueKeys): SelectOption[] {
  const items = asArray(value);
  const options = items
    .map((item) => {
      if (typeof item === "string" || typeof item === "number") {
        return {
          value: String(item),
          label: String(item),
        };
      }

      if (!isRecord(item)) return null;

      const value = getRecordValue(item, valueKeys);
      const label = getRecordValue(item, labelKeys) || value;

      if (typeof value !== "string" && typeof value !== "number") return null;

      return {
        value: String(value),
        label: stringifyCell(label),
      };
    })
    .filter((option): option is SelectOption => Boolean(option));

  return dedupeOptions(options);
}

function withFallbackOptions(options: SelectOption[], fallback: SelectOption[]) {
  return options.length ? options : fallback;
}

function hasLookupData(state: EndpointState) {
  return Boolean(state.data) && !state.error;
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

function getCreatedReleaseId(value: unknown): string {
  const seen = new Set<unknown>();

  const scan = (candidate: unknown): string => {
    if (!candidate || typeof candidate !== "object" || seen.has(candidate)) return "";
    seen.add(candidate);

    if (Array.isArray(candidate)) {
      for (const item of candidate) {
        const found = scan(item);
        if (found) return found;
      }
      return "";
    }

    if (!isRecord(candidate)) return "";

    const directId = getRecordValue(candidate, ["id", "releaseId", "release_id"]);
    if (directId !== null) return String(directId);

    for (const key of ["data", "release", "draft", "result", "item"]) {
      const found = scan(candidate[key]);
      if (found) return found;
    }

    return "";
  };

  return scan(getPayloadData(value)) || scan(value);
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
  const releaseSetupAutoLoadedRef = useRef(false);

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
      const createdReleaseId = getCreatedReleaseId(data);

      setCreateReleaseState({ loading: false, error: "", data, loadedAt: new Date().toISOString() });
      setReleaseDraftForm(emptyReleaseDraftForm);

      // Keep the live release flow moving forward without showing a separate selector/list.
      if (createdReleaseId) {
        await loadReleaseDetails(createdReleaseId);
      }

      // The four-tier flow should move Basic Information → Artwork → Release Information.
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
  const genreOptions = useMemo(
    () => withFallbackOptions(getLookupOptions(lookupGenres.data, ["name", "genre", "value", "label", "id"], ["name", "label", "genre", "value"]), fallbackGenreOptions),
    [lookupGenres.data],
  );
  const languageOptions = useMemo(
    () => withFallbackOptions(getLookupOptions(lookupLanguages.data, ["code", "value", "id", "name"], ["name", "label", "code", "value"]), fallbackLanguageOptions),
    [lookupLanguages.data],
  );
  const deliveryPlatformOptions = useMemo(
    () => withFallbackOptions(getLookupOptions(lookupPlatforms.data, ["name", "platform", "value", "code", "id"], ["name", "label", "platform", "value"]), fallbackDeliveryPlatformOptions),
    [lookupPlatforms.data],
  );
  const territoryOptions = useMemo(
    () => withFallbackOptions(getLookupOptions(lookupCountries.data, ["code", "value", "id", "name"], ["name", "label", "code", "value"]), fallbackTerritoryOptions),
    [lookupCountries.data],
  );
  const metrics = useMemo(
    () => getOverviewMetrics(connection, profileResult, releasesResult, analyticsOverview, salesOverview),
    [connection, profileResult, releasesResult, analyticsOverview, salesOverview],
  );

  const canLoad = connected && !expired && !actionLoading;
  const setupDataLoaded =
    hasLookupData(lookupGenres) &&
    hasLookupData(lookupLanguages) &&
    hasLookupData(lookupPlatforms) &&
    hasLookupData(lookupCountries);
  const setupDataLoading = lookupGenres.loading || lookupLanguages.loading || lookupPlatforms.loading || lookupCountries.loading;
  const setupDataHasErrors = Boolean(lookupGenres.error || lookupLanguages.error || lookupPlatforms.error || lookupCountries.error);
  const setupDataNeedsLoad = !setupDataLoaded && !setupDataLoading;

  useEffect(() => {
    if (activeTab !== "Release Builder") return;
    if (!canLoad || actionLoading || !setupDataNeedsLoad || releaseSetupAutoLoadedRef.current) return;

    releaseSetupAutoLoadedRef.current = true;
    void loadMany(releaseSetupLookupKeys);
  }, [activeTab, canLoad, actionLoading, setupDataNeedsLoad]);

  const releaseDraftReady = Boolean(createReleaseState.data);
  const selectedReleaseReady = Boolean(selectedReleaseId && releaseDetailState.data);
  const metadataSaved = Boolean(metadataUpdateState.data);
  const tracksReady = Boolean(putTracksState.data) || Boolean(releaseTracksState.data);
  const upcValidated = Boolean(upcValidationState.data);
  const deliveryConfirmed = Boolean(deliveryUpdateState.data);

  const tabs: DashboardTab[] = ["Overview", "Catalog", "Release Builder", "Analytics", "Sales", "Setup", "Developer"];
  const releaseWizardSteps: Array<{
    key: ReleaseTierStepKey;
    number: string;
    label: string;
    icon: string;
    complete: boolean;
    helper: string;
  }> = [
    {
      key: "start",
      number: "01",
      label: "Basic Information",
      icon: "◆",
      complete: releaseDraftReady || selectedReleaseReady,
      helper: "Type, title, artist, label, and working draft.",
    },
    {
      key: "artwork",
      number: "02",
      label: "Artwork",
      icon: "▧",
      complete: Boolean(releaseMetadataForm.coverUrl || artworkPreviewUrl),
      helper: "Cover image, preview, and store-ready artwork checks.",
    },
    {
      key: "info",
      number: "03",
      label: "Release Information",
      icon: "☷",
      complete: metadataSaved && deliveryConfirmed,
      helper: "Metadata, dates, genre, copyright, delivery, and territories.",
    },
    {
      key: "tracks",
      number: "04",
      label: "Tracks & Publish",
      icon: "↑",
      complete: Boolean(submitState.data),
      helper: "Track uploads, validation, rights confirmation, and submit.",
    },
  ];
  const activeTierKey: ReleaseTierStepKey =
    activeReleaseStep === "artwork" ? "artwork" :
    activeReleaseStep === "info" || activeReleaseStep === "delivery" ? "info" :
    activeReleaseStep === "tracks" || activeReleaseStep === "validation" || activeReleaseStep === "review" ? "tracks" :
    "start";
  const activeWizardStep = releaseWizardSteps.find((step) => step.key === activeTierKey) ?? releaseWizardSteps[0];
  const issueCount = [
    !(releaseDraftReady || selectedReleaseReady),
    !Boolean(releaseMetadataForm.coverUrl || artworkPreviewUrl),
    !(releaseMetadataForm.cLine.trim() && releaseMetadataForm.pLine.trim()),
  ].filter(Boolean).length;
  const releaseWizardHelp: Record<ReleaseTierStepKey, { title: string; step: string; body: string; tips: string[]; articles: string[] }> = {
    start: {
      title: "Basic Information",
      step: "Tier 1 of 4",
      body: "Create the release shell, choose the release type, and attach the primary artist. After the shell is created, Track Adam OS moves into Artwork next, then Release Information.",
      tips: ["Keep title capitalization exactly how it should appear", "Use the same artist spelling across stores", "Create the shell once, then continue forward through the four tiers"],
      articles: ["Release shell checklist", "Artist and label setup"],
    },
    artwork: {
      title: "Artwork",
      step: "Tier 2 of 4",
      body: "Upload the cover art, preview it, and make sure the image meets store-ready requirements before release review.",
      tips: ["Use square 3000×3000 artwork when possible", "Avoid blurry images and extra URLs", "Artwork text should match release title and artist"],
      articles: ["Artwork readiness", "Cover upload troubleshooting"],
    },
    info: {
      title: "Release Information",
      step: "Tier 3 of 4",
      body: "Finish the store metadata, release date, copyright lines, UPC, delivery platforms, territories, and additional service options.",
      tips: ["Schedule ahead when possible", "C and P lines should match the rights owner", "Save metadata before final publish"],
      articles: ["Metadata checklist", "Delivery and territories"],
    },
    tracks: {
      title: "Tracks & Publish",
      step: "Tier 4 of 4",
      body: "Upload audio, complete track credits, validate identifiers, confirm rights, and submit the finished release.",
      tips: ["Use FLAC for the current upload pipeline", "Validate UPC and ISRC before submit", "Confirm rights only when everything is accurate"],
      articles: ["Track upload flow", "Final publish checklist"],
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
          <header className="ta-wizard-topbar">
            <div className="ta-wizard-brand-lockup">
              <span className="ta-wizard-logo">TA</span>
              <button className="ta-wizard-exit" type="button" onClick={() => setActiveTab("Overview")}>← Exit</button>
            </div>
            <div className="ta-wizard-top-actions">
              <button className="ta-wizard-icon-btn" type="button" aria-label="Refresh release data" disabled={!canLoad || actionLoading} onClick={() => void loadReleasesWithFilters()}>↻</button>
              <span className={connected && !expired ? "ta-wizard-avatar ta-wizard-avatar-live" : "ta-wizard-avatar"}>{profileRecord ? "✓" : "SWU"}</span>
            </div>
          </header>

          <div className="ta-wizard-grid">
            <aside className="ta-wizard-left-rail">
              <p className="ta-wizard-rail-title">Steps</p>
              <nav className="ta-wizard-step-list" aria-label="Release creator steps">
                {releaseWizardSteps.map((step) => (
                  <button
                    key={step.key}
                    type="button"
                    className={`ta-wizard-step ${activeTierKey === step.key ? "ta-wizard-step-active" : ""}`}
                    onClick={() => setActiveReleaseStep(step.key)}
                  >
                    <span className="ta-wizard-step-icon">{step.icon}</span>
                    <span>{step.label}</span>
                    {step.complete ? <span className="ta-wizard-step-check">✓</span> : null}
                  </button>
                ))}
              </nav>

              <div className="ta-wizard-rail-bottom">
                <div className={issueCount ? "ta-wizard-issues-card" : "ta-wizard-issues-card ta-wizard-issues-card-clean"}>
                  <button type="button" className="ta-wizard-issues-head">
                    <span>⚠ {issueCount} issues</span>
                    <span>⌄</span>
                  </button>
                  <div className="ta-wizard-issue-list">
                    <button type="button" onClick={() => setActiveReleaseStep("tracks")}>
                      <strong>Release Format</strong>
                      <small>{trackForms.length ? "Track count in progress" : "Add more tracks or confirm format"}</small>
                    </button>
                    <button type="button" onClick={() => setActiveReleaseStep("artwork")}>
                      <strong>Artwork</strong>
                      <small>{releaseMetadataForm.coverUrl || artworkPreviewUrl ? "Artwork attached" : "Upload valid artwork"}</small>
                    </button>
                    <button type="button" onClick={() => setActiveReleaseStep("info")}>
                      <strong>C & P Line</strong>
                      <small>{releaseMetadataForm.cLine && releaseMetadataForm.pLine ? "Copyright lines started" : "Invalid copyright line(s)"}</small>
                    </button>
                  </div>
                </div>

                <button className="ta-wizard-rail-action ta-wizard-preview-action" type="button" onClick={() => setActiveReleaseStep("tracks")}>
                  <span className="ta-wizard-mini-cover">▧</span>
                  Preview Release
                  <span>◉</span>
                </button>
                <button className="ta-wizard-rail-action" type="button" disabled={!selectedReleaseId || metadataUpdateState.loading} onClick={() => void saveReleaseMetadata()}>▣ Save Changes</button>
                <button className="ta-wizard-publish-btn" type="button" onClick={() => setActiveReleaseStep("tracks")}>↑ Publish ›</button>
              </div>
            </aside>

            <main className="ta-wizard-main">
          <div className="ta-release-stage-header">
            <div>
              <span className="asset-type-pill">Release Creator v22</span>
              <h3>{activeWizardStep.label}</h3>
              <p>{activeWizardStep.helper}</p>
            </div>
            <button className="secondary-btn" type="button" disabled={!canLoad || actionLoading} onClick={() => void loadMany(releaseSetupLookupKeys)}>
              {actionLoading || setupDataLoading ? "Syncing..." : setupDataLoaded ? "Setup Ready" : "Sync Setup"}
            </button>
          </div>

          <div className="ta-release-tier-strip" aria-label="Release Creator four-tier workflow">
            {releaseWizardSteps.map((step) => (
              <button
                key={step.key}
                type="button"
                className={`ta-release-tier ${activeTierKey === step.key ? "ta-release-tier-active" : ""} ${step.complete ? "ta-release-tier-complete" : ""}`}
                onClick={() => setActiveReleaseStep(step.key)}
              >
                <span>{step.number}</span>
                <strong>{step.label}</strong>
                <small>{step.complete ? "Complete" : step.helper}</small>
              </button>
            ))}
          </div>

          {activeReleaseStep === "start" ? (
            <div className="release-builder-step-panel release-builder-draft-panel">
              <article id="release-start-section" className="asset-card distribution-v5-panel distribution-roadmap-form-card release-builder-workflow-card">
                <div className="distribution-v11-panel-heading">
                  <div>
                    <span className="asset-type-pill">Step 1</span>
                    <h3>Create Draft Release</h3>
                    <p>Select a release type, name it, and set the primary artist to create the draft shell.</p>
                  </div>
                </div>

                {/* Release type cards */}
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

                <div className="distribution-form-grid">
                  <label className="distribution-form-wide">
                    <span>Release Title</span>
                    <input value={releaseDraftForm.title} onChange={(event) => setReleaseDraftForm((current) => ({ ...current, title: event.target.value }))} placeholder="Better Late" />
                  </label>
                  <label>
                    <span>Primary Artist</span>
                    <input value={releaseDraftForm.artistName} onChange={(event) => setReleaseDraftForm((current) => ({ ...current, artistName: event.target.value }))} placeholder="Natasha Storm" />
                  </label>
                  <label>
                    <span>Distributor Artist ID optional</span>
                    <input value={releaseDraftForm.artistId} onChange={(event) => setReleaseDraftForm((current) => ({ ...current, artistId: event.target.value }))} placeholder="123" inputMode="numeric" />
                  </label>
                  <label className="distribution-form-wide">
                    <span>Label optional</span>
                    <input value={releaseDraftForm.label} onChange={(event) => setReleaseDraftForm((current) => ({ ...current, label: event.target.value }))} placeholder="Track Adam / SWU" />
                  </label>
                </div>

                <InlineError message={createReleaseState.error} />
                {createReleaseState.data ? (
                  <div className="ta-release-flow-note">
                    Release shell created. Track Adam OS is carrying this draft forward into Artwork.
                  </div>
                ) : null}
                <div className="ta-wizard-bottom-actions">
                  <button className="primary-btn" type="button" disabled={!canLoad || createReleaseState.loading} onClick={createReleaseDraft}>
                    {createReleaseState.loading ? "Creating Draft..." : "Create Draft Release"}
                  </button>
                  <button className="secondary-btn" type="button" onClick={() => setActiveReleaseStep("artwork")}>Continue to Artwork →</button>
                </div>
              </article>

            </div>
          ) : null}

          {activeReleaseStep === "artwork" ? (
            <div className="release-builder-step-panel release-builder-artwork-panel">
              <article id="release-artwork-section" className="asset-card distribution-v5-panel release-builder-workflow-card ta-wizard-artwork-card">
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

                <div className="ta-artwork-guidelines-card">
                  <h4>Artwork Guidelines</h4>
                  <div className="ta-artwork-guidelines-grid">
                    <span>▣ Recommended 3000px, maximum 5000px</span>
                    <span>⬚ Must be a perfect square</span>
                    <span>↥ File size under 36MB</span>
                    <span>◐ No blurriness or uneven borders</span>
                    <span>⌘ RGB color mode required</span>
                    <span>⌕ Artwork is manually reviewed before publishing</span>
                  </div>
                </div>

                <div className="artwork-upload-section">
                  <h4>Cover Artwork</h4>
                  <p className="distribution-empty">Upload the release cover or paste an existing artwork URL. The preview updates immediately and the Cloudinary URL saves into the release metadata form.</p>
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
                          placeholder="https://..."
                        />
                      </label>
                      <label>
                        <span>Compressed Artwork optional</span>
                        <input
                          value={releaseMetadataForm.compressedArtwork}
                          onChange={(e) => setReleaseMetadataForm((prev) => ({ ...prev, compressedArtwork: e.target.value }))}
                          placeholder="Optional compressed artwork URL"
                        />
                      </label>
                      <InlineError message={artworkUploadError} />
                    </div>
                  </div>
                </div>

                <div className="ta-motion-art-card">
                  <div>
                    <h4>🍎 Apple Motion Art</h4>
                    <p>Upload animated artwork in ProRes format. This is separate from your cover artwork and only displays on Apple Music.</p>
                  </div>
                  <button className="secondary-btn" type="button">☁ Upload Motion Art</button>
                </div>

                <div className="ta-wizard-bottom-actions">
                  <button className="secondary-btn" type="button" onClick={() => setActiveReleaseStep("start")}>← Previous</button>
                  <button className="primary-btn" type="button" onClick={() => setActiveReleaseStep("info")}>Continue →</button>
                </div>
              </article>
            </div>
          ) : null}

          {activeReleaseStep === "info" ? (
            <div className="release-builder-step-panel release-builder-metadata-panel">
              <article id="release-info-section" className="asset-card distribution-v5-panel release-builder-metadata-card release-builder-workflow-card">
                <div className="distribution-v11-panel-heading distribution-v11-inline-heading">
                  <div>
                    <span className="asset-type-pill">Release Info</span>
                    <h3>Release Metadata</h3>
                    <p>Complete release-level metadata using store-ready field names. Start Release fields are not repeated here.</p>
                  </div>
                  {selectedReleaseId ? <span className="status-pill">Release ID {selectedReleaseId}</span> : null}
                </div>

                {!setupDataLoaded || setupDataHasErrors ? (
                  <div className="distribution-v5-muted-warning release-info-setup-warning">
                    {setupDataLoading
                      ? "Syncing setup data from the distributor..."
                      : setupDataHasErrors
                        ? "Some setup data did not load. Starter options are available so the release flow can keep moving."
                        : "Using starter options while Track Adam OS syncs distributor genres, languages, stores, and territories."}
                    <button className="secondary-btn" type="button" disabled={!canLoad || actionLoading || setupDataLoading} onClick={() => void loadMany(releaseSetupLookupKeys)}>
                      {setupDataLoading ? "Loading..." : "Sync Setup Data"}
                    </button>
                  </div>
                ) : null}

                <InlineError message={lookupGenres.error} />
                <InlineError message={lookupLanguages.error} />
                <InlineError message={releaseDetailState.error} />
                <div className="distribution-form-grid release-metadata-grid">
                  <label>
                    <span>Version</span>
                    <input value={releaseMetadataForm.version} onChange={(event) => setReleaseMetadataForm((current) => ({ ...current, version: event.target.value }))} placeholder="Deluxe, Radio Edit, etc." />
                  </label>
                  <label>
                    <span>Remix Title</span>
                    <input value={releaseMetadataForm.remixTitle} onChange={(event) => setReleaseMetadataForm((current) => ({ ...current, remixTitle: event.target.value }))} placeholder="Nova Waves Remix" />
                  </label>
                  <label>
                    <span>Label</span>
                    <input 
                      value={releaseMetadataForm.label} 
                      onChange={(event) => setReleaseMetadataForm((current) => ({ ...current, label: event.target.value }))} 
                      placeholder="Track Adam / SWU" 
                    />
                  </label>
                  <label>
                    <span>Primary Genre</span>
                    <select value={releaseMetadataForm.primaryGenre} onChange={(event) => setReleaseMetadataForm((current) => ({ ...current, primaryGenre: event.target.value }))}>
                      <option value="">{lookupGenres.loading ? "Loading genres..." : "Choose genre"}</option>
                      {genreOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                    </select>
                  </label>
                  <label>
                    <span>Secondary Genre</span>
                    <select value={releaseMetadataForm.secondaryGenre} onChange={(event) => setReleaseMetadataForm((current) => ({ ...current, secondaryGenre: event.target.value }))}>
                      <option value="">{lookupGenres.loading ? "Loading genres..." : "Choose genre"}</option>
                      {genreOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                    </select>
                  </label>
                  <label>
                    <span>Language</span>
                    <select value={releaseMetadataForm.language} onChange={(event) => setReleaseMetadataForm((current) => ({ ...current, language: event.target.value }))}>
                      <option value="">{lookupLanguages.loading ? "Loading languages..." : "Choose language"}</option>
                      {languageOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                    </select>
                  </label>
                  <label>
                    <span>Release Date</span>
                    <input type="date" value={releaseMetadataForm.releaseDate} onChange={(event) => setReleaseMetadataForm((current) => ({ ...current, releaseDate: event.target.value }))} />
                  </label>
                  <label>
                    <span>Original Release Date</span>
                    <input type="date" value={releaseMetadataForm.originalReleaseDate} onChange={(event) => setReleaseMetadataForm((current) => ({ ...current, originalReleaseDate: event.target.value }))} />
                  </label>
                  <label>
                    <span>Apple Preorder</span>
                    <select value={releaseMetadataForm.applePreorder} onChange={(event) => setReleaseMetadataForm((current) => ({ ...current, applePreorder: event.target.value }))}>
                      <option value="">Keep current / not set</option>
                      <option value="false">No</option>
                      <option value="true">Yes</option>
                    </select>
                  </label>
                  <label>
                    <span>Apple Preorder Date</span>
                    <input type="date" value={releaseMetadataForm.applePreorderDate} onChange={(event) => setReleaseMetadataForm((current) => ({ ...current, applePreorderDate: event.target.value }))} />
                  </label>
                  <label>
                    <span>License Type</span>
                    <select value={releaseMetadataForm.licenseType} onChange={(event) => setReleaseMetadataForm((current) => ({ ...current, licenseType: event.target.value }))}>
                      <option value="">Keep current / not set</option>
                      {licenseTypeOptions.map((type) => <option key={type} value={type}>{type}</option>)}
                    </select>
                  </label>
                  <label className="distribution-form-wide">
                    <span>License Info</span>
                    <input value={releaseMetadataForm.licenseInfo} onChange={(event) => setReleaseMetadataForm((current) => ({ ...current, licenseInfo: event.target.value }))} placeholder="Owned by artist and label." />
                  </label>
                  <label>
                    <span>C Year</span>
                    <input value={releaseMetadataForm.cYear} onChange={(event) => setReleaseMetadataForm((current) => ({ ...current, cYear: event.target.value }))} placeholder="2026" inputMode="numeric" />
                  </label>
                  <label>
                    <span>C Line</span>
                    <input value={releaseMetadataForm.cLine} onChange={(event) => setReleaseMetadataForm((current) => ({ ...current, cLine: event.target.value }))} placeholder="2026 Track Adam" />
                  </label>
                  <label>
                    <span>P Year</span>
                    <input value={releaseMetadataForm.pYear} onChange={(event) => setReleaseMetadataForm((current) => ({ ...current, pYear: event.target.value }))} placeholder="2026" inputMode="numeric" />
                  </label>
                  <label>
                    <span>P Line</span>
                    <input value={releaseMetadataForm.pLine} onChange={(event) => setReleaseMetadataForm((current) => ({ ...current, pLine: event.target.value }))} placeholder="2026 Track Adam" />
                  </label>
                  <label>
                    <span>UPC</span>
                    <input value={releaseMetadataForm.upc} onChange={(event) => setReleaseMetadataForm((current) => ({ ...current, upc: event.target.value }))} placeholder="123456789012" inputMode="numeric" />
                  </label>
                  <label>
                    <span>AI Generated Artwork</span>
                    <select value={releaseMetadataForm.isAiGenerated} onChange={(event) => setReleaseMetadataForm((current) => ({ ...current, isAiGenerated: event.target.value }))}>
                      <option value="">Keep current / not set</option>
                      <option value="false">No</option>
                      <option value="true">Yes</option>
                    </select>
                  </label>
                </div>

                {/* Artwork upload section */}
                <div className="artwork-upload-section">
                  <h4>Cover Artwork</h4>
                  <p className="distribution-empty">3000×3000px minimum, square format, JPG/PNG/TIFF. Uploaded to Cloudinary, URL saved to the release metadata.</p>

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
                        <span>Compressed Artwork URL</span>
                        <input
                          value={releaseMetadataForm.compressedArtwork}
                          onChange={(e) => setReleaseMetadataForm((prev) => ({ ...prev, compressedArtwork: e.target.value }))}
                          placeholder="Optional smaller version URL"
                        />
                      </label>
                      {artworkUploadError ? <p className="distribution-v5-error">{artworkUploadError}</p> : null}
                    </div>
                  </div>
                </div>

                <div className="distribution-form-grid release-metadata-grid">
                  <label>
                    <span>Release Time</span>
                    <input value={releaseMetadataForm.releaseTime} onChange={(event) => setReleaseMetadataForm((current) => ({ ...current, releaseTime: event.target.value }))} placeholder="05:55" />
                  </label>
                  <label>
                    <span>Time Zone</span>
                    <input value={releaseMetadataForm.timeZone} onChange={(event) => setReleaseMetadataForm((current) => ({ ...current, timeZone: event.target.value }))} placeholder="Pacific/Niue" />
                  </label>
                </div>

                <InlineError message={metadataUpdateState.error} />
                {metadataUpdateState.data ? <DataTable data={metadataUpdateState.data} emptyLabel="No metadata response yet." /> : null}

                <button className="primary-btn distribution-full-width-btn" type="button" disabled={!canLoad || metadataUpdateState.loading || !selectedReleaseId} onClick={saveReleaseMetadata}>
                  {metadataUpdateState.loading ? "Saving Release Info..." : "Save Release Info to Sandbox"}
                </button>
              </article>

              <article className="asset-card distribution-v5-panel release-builder-side-card">
                <span className="asset-type-pill">Current Release</span>
                <h3>Loaded Details</h3>
                <p>Use this as a reference while editing. If the form is blank, create the release shell first so Track Adam OS can load the active draft.</p>
                <DataTable data={releaseDetailState.data} emptyLabel="No release details loaded yet." />
                <button className="secondary-btn distribution-full-width-btn" type="button" disabled={!selectedReleaseId} onClick={() => setActiveReleaseStep("tracks")}>
                  Continue to Tracks & Publish
                </button>
              </article>
            </div>
          ) : null}

          {activeReleaseStep === "tracks" ? (
            <div className="release-builder-step-panel release-builder-details-panel">
              <article id="release-tracks-section" className="asset-card distribution-v5-panel release-builder-workflow-card">
                <div className="distribution-v11-panel-heading distribution-v11-inline-heading">
                  <div>
                    <span className="asset-type-pill">Tracks & Publish</span>
                    <h3>Tracklist</h3>
                    <p>Upload FLAC audio files, complete credits, validate identifiers, confirm rights, and submit from this final tier.</p>
                  </div>
                  {putTracksState.data
                    ? <span className="status-pill status-live">Tracklist Saved</span>
                    : <span className="status-pill status-warning">Unsaved</span>}
                </div>

                {/* Existing tracks from API */}
                {releaseTracksState.data && Array.isArray((releaseTracksState.data as { data?: unknown[] }).data) && (releaseTracksState.data as { data?: unknown[] }).data!.length > 0 ? (
                  <div className="track-existing-list">
                    <h4>Existing Tracks on Release</h4>
                    <DataTable data={releaseTracksState.data} emptyLabel="No tracks yet." />
                  </div>
                ) : null}

                {/* Track form list */}
                <div className="track-form-list">
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
                            <label>
                              <span>Track Title *</span>
                              <input value={track.title} onChange={(e) => updateTrackField(idx, "title", e.target.value)} placeholder="Track title" />
                            </label>
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
                            <label>
                              <span>ISRC (optional)</span>
                              <input value={track.isrc ?? ""} onChange={(e) => updateTrackField(idx, "isrc", e.target.value)} placeholder="USABC1234567" />
                            </label>
                            <label>
                              <span>Version (optional)</span>
                              <input value={track.version ?? ""} onChange={(e) => updateTrackField(idx, "version", e.target.value)} placeholder="Extended Mix" />
                            </label>
                            <label>
                              <span>TikTok Start Time</span>
                              <input value={track.tiktokStartTime ?? ""} onChange={(e) => updateTrackField(idx, "tiktokStartTime", e.target.value)} placeholder="00:30" />
                            </label>
                            <label>
                              <span>Liner Note</span>
                              <input value={track.linerNote ?? ""} onChange={(e) => updateTrackField(idx, "linerNote", e.target.value)} placeholder="Recorded in..." />
                            </label>
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

                <button className="secondary-btn" type="button" onClick={addBlankTrack}>
                  + Add Track
                </button>

                <InlineError message={putTracksState.error} />

                {putTracksState.data ? (
                  <div className="distribution-v5-kv-list release-delivery-summary">
                    <div><span>Tracks saved</span><strong>{trackForms.filter(t => t.audioFileKey).length}</strong></div>
                    <div><span>Saved at</span><strong>{putTracksState.loadedAt ? new Date(putTracksState.loadedAt).toLocaleTimeString() : "—"}</strong></div>
                  </div>
                ) : null}

                <button
                  className="primary-btn distribution-full-width-btn"
                  type="button"
                  disabled={putTracksState.loading || trackForms.filter(t => t.title && t.audioFileKey).length === 0}
                  onClick={() => void saveTracklist()}
                >
                  {putTracksState.loading ? "Saving Tracklist..." : "Save Tracklist"}
                </button>

                <button className="secondary-btn distribution-full-width-btn release-builder-next-btn" type="button" onClick={() => setActiveReleaseStep("tracks")}>
                  Delivery / validation below
                </button>
              </article>

              <article className="asset-card distribution-v5-panel release-builder-side-card">
                <span className="asset-type-pill">Upload Guide</span>
                <h3>Track Upload Flow</h3>
                <p>Each track goes through a 3-step pipeline: get a pre-signed S3 URL, upload the FLAC directly to S3, then save the full tracklist to the release.</p>
                <div className="release-builder-mini-checklist">
                  <label><input type="checkbox" checked={trackForms.length > 0} readOnly /> At least one track added</label>
                  <label><input type="checkbox" checked={trackForms.some(t => Boolean(t.audioFileKey))} readOnly /> Audio uploaded to S3</label>
                  <label><input type="checkbox" checked={trackForms.every(t => Boolean(t.title))} readOnly /> All tracks titled</label>
                  <label><input type="checkbox" checked={Boolean(putTracksState.data)} readOnly /> Tracklist saved to release</label>
                </div>
                <button className="secondary-btn distribution-full-width-btn" type="button" onClick={() => setActiveReleaseStep("tracks")}>
                  Delivery / validation below
                </button>
              </article>
            </div>
          ) : null}

          {activeReleaseStep === "info" ? (
            <article id="release-delivery-section" className="asset-card distribution-v5-panel release-builder-review-card release-builder-delivery-card">
              <div className="distribution-v11-panel-heading distribution-v11-inline-heading">
                <div>
                  <span className="asset-type-pill">Delivery</span>
                  <h3>Platforms & Territories</h3>
                  <p>Choose where this release will be delivered. Requires platform and territory lookup data from Setup.</p>
                </div>
                {deliveryConfirmed
                  ? <span className="status-pill status-live">Delivery Saved</span>
                  : <span className="status-pill status-warning">Not Saved</span>}
              </div>

              {(!hasLookupData(lookupPlatforms) || !hasLookupData(lookupCountries) || lookupPlatforms.error || lookupCountries.error) ? (
                <div className="distribution-v5-muted-warning release-info-setup-warning">
                  {lookupPlatforms.loading || lookupCountries.loading
                    ? "Syncing platform and territory data from the distributor..."
                    : lookupPlatforms.error || lookupCountries.error
                      ? "Some delivery setup data did not load. Starter platform and territory options are available until the sync succeeds."
                      : "Using starter platform and territory options while Track Adam OS syncs distributor setup data."}
                  <button className="secondary-btn" type="button" disabled={!canLoad || actionLoading || lookupPlatforms.loading || lookupCountries.loading} onClick={() => void loadMany(["lookupPlatforms", "lookupCountries"])}>
                    {lookupPlatforms.loading || lookupCountries.loading ? "Loading..." : "Sync Platform / Country Data"}
                  </button>
                </div>
              ) : null}

              <InlineError message={lookupPlatforms.error} />
              <InlineError message={lookupCountries.error} />

              <div className="release-delivery-preview-grid">
                <div>
                  <h4>Platforms</h4>
                  <p className="distribution-empty">Select every store this release should reach.</p>
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
                  <p className="distribution-empty">Select every country/territory for distribution.</p>
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
                  <input
                    type="checkbox"
                    checked={deliveryYoutube}
                    onChange={(e) => setDeliveryYoutube(e.target.checked)}
                  />
                  Enable YouTube Content ID
                </label>
              </div>

              {deliveryUpdateState.data ? (
                <div className="distribution-v5-kv-list release-delivery-summary">
                  <div><span>Platforms saved</span><strong>{selectedDeliveryPlatforms.length}</strong></div>
                  <div><span>Territories saved</span><strong>{selectedTerritories.length}</strong></div>
                  <div><span>YouTube</span><strong>{deliveryYoutube ? "Enabled" : "Disabled"}</strong></div>
                  <div><span>Saved at</span><strong>{deliveryUpdateState.loadedAt ? new Date(deliveryUpdateState.loadedAt).toLocaleTimeString() : "—"}</strong></div>
                </div>
              ) : null}

              <InlineError message={deliveryUpdateState.error} />

              <div className="distribution-v5-inline-form">
                <button
                  className="primary-btn distribution-full-width-btn"
                  type="button"
                  disabled={!canLoad || deliveryUpdateState.loading || !selectedReleaseId || selectedDeliveryPlatforms.length === 0 || selectedTerritories.length === 0}
                  onClick={() => void saveDelivery()}
                >
                  {deliveryUpdateState.loading ? "Saving..." : "Save Delivery Settings"}
                </button>
              </div>

              <button className="secondary-btn distribution-full-width-btn release-builder-next-btn" type="button" onClick={() => setActiveReleaseStep("tracks")}>
                Continue to Tracks & Publish
              </button>
            </article>
          ) : null}

          {activeReleaseStep === "tracks" ? (
            <article id="release-validation-section" className="asset-card distribution-v5-panel distribution-upc-tool-card release-builder-workflow-card">
              <div className="distribution-v11-panel-heading distribution-v11-inline-heading">
                <div>
                  <span className="asset-type-pill">Identifier Validation</span>
                  <h3>UPC & ISRC Checks</h3>
                  <p>Validate release and track identifiers before moving toward final review.</p>
                </div>
                {selectedReleaseId ? <span className="status-pill">Release ID {selectedReleaseId}</span> : null}
              </div>

              <div className="release-validation-grid">
                <div>
                  <h4>UPC Check</h4>
                  <p className="distribution-empty">A UPC is usually 12 or 13 digits.</p>
                  <div className="distribution-v5-inline-form distribution-upc-inline-form">
                    <input value={upcToValidate} onChange={(event) => setUpcToValidate(event.target.value)} placeholder="123456789012" inputMode="numeric" />
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
                    <input value={isrcToValidate} onChange={(event) => setIsrcToValidate(event.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))} placeholder="USABC1234567" maxLength={12} />
                    <button className="secondary-btn" type="button" disabled={!canLoad || isrcValidationState.loading || !isrcToValidate.trim()} onClick={validateIsrc}>
                      {isrcValidationState.loading ? "Checking..." : "Validate ISRC"}
                    </button>
                  </div>
                  <InlineError message={isrcValidationState.error} />
                  <DataTable data={isrcValidationState.data} emptyLabel="No ISRC validation result yet." />
                </div>
              </div>

              <button className="secondary-btn distribution-full-width-btn release-builder-next-btn" type="button" onClick={() => setActiveReleaseStep("tracks")}>
                Review checklist below
              </button>
            </article>
          ) : null}

          {activeReleaseStep === "tracks" ? (
            <article id="release-review-section" className="asset-card distribution-v5-panel release-builder-review-card">
              <div className="distribution-v11-panel-heading distribution-v11-inline-heading">
                <div>
                  <span className="asset-type-pill">Review & Submit</span>
                  <h3>Final Review</h3>
                  <p>All steps must be complete and both confirmations checked before submission unlocks.</p>
                </div>
                {submitState.data
                  ? <span className="status-pill status-live">Submitted</span>
                  : <span className="status-pill status-warning">Pending</span>}
              </div>

              <div className="release-builder-review-grid">
                <label><input type="checkbox" checked={releaseDraftReady || selectedReleaseReady} readOnly /> Release shell created</label>
                <label><input type="checkbox" checked={selectedReleaseReady} readOnly /> Active release loaded</label>
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
                <div className="distribution-v5-kv-list release-delivery-summary">
                  <div><span>Status</span><strong>Submitted for review</strong></div>
                  <div><span>Release ID</span><strong>{selectedReleaseId}</strong></div>
                  <div><span>Submitted at</span><strong>{submitState.loadedAt ? new Date(submitState.loadedAt).toLocaleTimeString() : "—"}</strong></div>
                </div>
              ) : null}

              <InlineError message={submitState.error} />

              <button
                className="primary-btn distribution-full-width-btn"
                type="button"
                disabled={
                  submitState.loading ||
                  Boolean(submitState.data) ||
                  !(releaseDraftReady || selectedReleaseReady) ||
                  !selectedReleaseReady ||
                  !metadataSaved ||
                  !tracksReady ||
                  !deliveryConfirmed ||
                  !upcValidated ||
                  !rightsConfirmed ||
                  !acceptTerms
                }
                onClick={() => void submitRelease()}
              >
                {submitState.loading
                  ? "Submitting..."
                  : submitState.data
                    ? "Release Submitted"
                    : "Submit Release for Review"}
              </button>
            </article>
          ) : null}
            </main>

            <aside className="ta-wizard-help-panel">
              <div className="ta-wizard-help-tabs">
                <button className="ta-wizard-help-tab-active" type="button">▮ Help</button>
                <button type="button">☊ Ask Command Center</button>
              </div>
              <div className="ta-wizard-help-body">
                <div className="ta-wizard-help-title-row">
                  <span className="ta-wizard-help-icon">{activeWizardStep.icon}</span>
                  <div>
                    <h3>{currentHelp.title}</h3>
                    <p>{currentHelp.step}</p>
                  </div>
                </div>
                <p className="ta-wizard-help-copy">{currentHelp.body}</p>
                <div className="ta-wizard-help-tips">
                  {currentHelp.tips.map((tip) => (
                    <div key={tip}><span>✹</span>{tip}</div>
                  ))}
                </div>
                <div className="ta-wizard-formats">
                  <span>Accepted formats</span>
                  <div>
                    {["WAV", "MP3", "M4A", "AIFF", "FLAC"].map((format) => <small key={format}>{format}</small>)}
                  </div>
                </div>
                <div className="ta-wizard-help-articles">
                  <span>Help Articles</span>
                  {currentHelp.articles.map((article) => (
                    <button key={article} type="button"><span>▣</span><strong>{article}</strong><small>Guide ↗</small></button>
                  ))}
                </div>
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
