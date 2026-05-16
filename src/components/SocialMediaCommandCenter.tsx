import { useMemo, useState } from "react";
import { supabase } from "../supabaseClient";
import {
  createBufferPost,
  deleteBufferPost,
  editBufferPost,
  getBufferAccount,
  getBufferChannels,
  getBufferPosts,
  type BufferChannel,
      type BufferFacebookPostType,
type BufferInstagramPostType,
  type BufferMediaKind,
  type BufferOrganization,
  type BufferPost,
  type BufferPostMode,
} from "../lib/bufferApi";

const SOCIAL_MEDIA_BUCKET = "social-media-assets";

type SocialTab = "composer" | "calendar" | "drafts" | "scheduled" | "published" | "analytics";

const styles = {
  shell: { display: "grid", gap: "22px" } as React.CSSProperties,
  hero: {
    borderRadius: "28px",
    padding: "30px",
    background:
      "radial-gradient(circle at top right, rgba(54, 111, 255, 0.34), transparent 34%), linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.025))",
    border: "1px solid rgba(255,255,255,0.12)",
    boxShadow: "0 22px 60px rgba(0,0,0,0.28)",
  } as React.CSSProperties,
  eyebrow: {
    margin: 0,
    letterSpacing: "0.18em",
    textTransform: "uppercase",
    fontSize: "12px",
    opacity: 0.7,
  } as React.CSSProperties,
  heroTitle: { margin: "12px 0 8px", fontSize: "34px", lineHeight: 1.05 } as React.CSSProperties,
  heroText: {
    margin: 0,
    maxWidth: "840px",
    opacity: 0.82,
    fontSize: "15px",
    lineHeight: 1.6,
  } as React.CSSProperties,
  tabs: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
  } as React.CSSProperties,
  tab: {
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: "999px",
    padding: "10px 14px",
    background: "rgba(255,255,255,0.04)",
    color: "inherit",
    fontWeight: 800,
    cursor: "pointer",
  } as React.CSSProperties,
  grid: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1fr) 360px",
    gap: "22px",
    alignItems: "start",
  } as React.CSSProperties,
  card: {
    borderRadius: "24px",
    padding: "22px",
    background: "linear-gradient(180deg, rgba(255,255,255,0.075), rgba(255,255,255,0.035))",
    border: "1px solid rgba(255,255,255,0.12)",
    boxShadow: "0 18px 45px rgba(0,0,0,0.18)",
  } as React.CSSProperties,
  cardTitleRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "14px",
    marginBottom: "14px",
  } as React.CSSProperties,
  title: { margin: 0, fontSize: "22px", lineHeight: 1.15 } as React.CSSProperties,
  muted: { margin: "6px 0 0", opacity: 0.72, fontSize: "14px", lineHeight: 1.5 } as React.CSSProperties,
  buttonRow: { display: "flex", gap: "10px", flexWrap: "wrap", marginTop: "16px" } as React.CSSProperties,
  primaryButton: {
    border: "0",
    borderRadius: "14px",
    padding: "11px 16px",
    background: "linear-gradient(135deg, #5b8cff, #2854d8)",
    color: "white",
    fontWeight: 800,
    cursor: "pointer",
    boxShadow: "0 12px 30px rgba(37, 99, 235, 0.32)",
  } as React.CSSProperties,
  secondaryButton: {
    border: "1px solid rgba(255,255,255,0.14)",
    borderRadius: "14px",
    padding: "11px 16px",
    background: "rgba(255,255,255,0.06)",
    color: "inherit",
    fontWeight: 750,
    cursor: "pointer",
  } as React.CSSProperties,
  ghostButton: {
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "14px",
    padding: "11px 16px",
    background: "rgba(255,255,255,0.025)",
    color: "inherit",
    fontWeight: 700,
    cursor: "pointer",
  } as React.CSSProperties,
  dangerButton: {
    border: "1px solid rgba(255,90,90,0.28)",
    borderRadius: "14px",
    padding: "11px 16px",
    background: "rgba(255,90,90,0.1)",
    color: "inherit",
    fontWeight: 700,
    cursor: "pointer",
  } as React.CSSProperties,
  disabledButton: { opacity: 0.45, cursor: "not-allowed" } as React.CSSProperties,
  statusBox: {
    marginTop: "16px",
    padding: "13px 14px",
    borderRadius: "16px",
    background: "rgba(255,255,255,0.055)",
    border: "1px solid rgba(255,255,255,0.1)",
    fontSize: "14px",
    lineHeight: 1.45,
  } as React.CSSProperties,
  successBox: {
    marginTop: "16px",
    padding: "14px 15px",
    borderRadius: "16px",
    background: "rgba(80,255,160,0.12)",
    border: "1px solid rgba(80,255,160,0.2)",
    fontSize: "14px",
    lineHeight: 1.45,
  } as React.CSSProperties,
  select: {
    width: "100%",
    marginTop: "8px",
    borderRadius: "16px",
    padding: "13px 14px",
    background: "rgba(0,0,0,0.22)",
    color: "inherit",
    border: "1px solid rgba(255,255,255,0.12)",
    outline: "none",
  } as React.CSSProperties,
  input: {
    width: "100%",
    marginTop: "8px",
    borderRadius: "16px",
    padding: "13px 14px",
    background: "rgba(0,0,0,0.22)",
    color: "inherit",
    border: "1px solid rgba(255,255,255,0.12)",
    outline: "none",
  } as React.CSSProperties,
  profileGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: "14px",
    marginTop: "16px",
  } as React.CSSProperties,
  profileCard: {
    display: "flex",
    alignItems: "center",
    gap: "13px",
    padding: "15px",
    borderRadius: "22px",
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(255,255,255,0.04)",
    cursor: "pointer",
  } as React.CSSProperties,
  avatar: {
    width: "58px",
    height: "58px",
    borderRadius: "999px",
    objectFit: "cover",
    border: "2px solid rgba(255,255,255,0.18)",
    flexShrink: 0,
  } as React.CSSProperties,
  avatarFallback: {
    width: "58px",
    height: "58px",
    borderRadius: "999px",
    background: "linear-gradient(135deg, rgba(91,140,255,0.6), rgba(255,255,255,0.1))",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    fontWeight: 900,
    fontSize: "20px",
  } as React.CSSProperties,
  check: {
    width: "24px",
    height: "24px",
    borderRadius: "8px",
    display: "grid",
    placeItems: "center",
    fontWeight: 900,
    background: "rgba(255,255,255,0.08)",
    border: "1px solid rgba(255,255,255,0.12)",
  } as React.CSSProperties,
  uploadZone: {
    marginTop: "8px",
    borderRadius: "20px",
    padding: "18px",
    background:
      "linear-gradient(135deg, rgba(91,140,255,0.12), rgba(255,255,255,0.035))",
    border: "1px dashed rgba(255,255,255,0.24)",
    cursor: "pointer",
    display: "grid",
    gap: "8px",
  } as React.CSSProperties,
  uploadIcon: {
    width: "44px",
    height: "44px",
    borderRadius: "14px",
    display: "grid",
    placeItems: "center",
    background: "rgba(91,140,255,0.22)",
    fontSize: "22px",
  } as React.CSSProperties,
  textarea: {
    width: "100%",
    marginTop: "8px",
    minHeight: "190px",
    borderRadius: "18px",
    padding: "15px",
    background: "rgba(0,0,0,0.22)",
    color: "inherit",
    border: "1px solid rgba(255,255,255,0.12)",
    outline: "none",
    resize: "vertical",
    fontSize: "15px",
    lineHeight: 1.55,
  } as React.CSSProperties,
  previewMedia: {
    width: "100%",
    borderRadius: "18px",
    border: "1px solid rgba(255,255,255,0.1)",
    background: "rgba(0,0,0,0.2)",
    minHeight: "170px",
    display: "grid",
    placeItems: "center",
    overflow: "hidden",
  } as React.CSSProperties,
  socialMockup: {
    width: "100%",
    maxWidth: "320px",
    margin: "16px auto 0",
    borderRadius: "24px",
    overflow: "hidden",
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(0,0,0,0.32)",
    boxShadow: "0 18px 46px rgba(0,0,0,0.25)",
  } as React.CSSProperties,
  socialMockupHeader: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "12px",
    background: "rgba(255,255,255,0.045)",
    borderBottom: "1px solid rgba(255,255,255,0.08)",
  } as React.CSSProperties,
  socialMockupAvatar: {
    width: "36px",
    height: "36px",
    borderRadius: "999px",
    objectFit: "cover",
    background: "rgba(255,255,255,0.1)",
  } as React.CSSProperties,
  socialMockupMedia: {
    width: "100%",
    background: "rgba(0,0,0,0.45)",
    display: "grid",
    placeItems: "center",
    overflow: "hidden",
  } as React.CSSProperties,
  socialMockupCaption: {
    padding: "12px",
    fontSize: "13px",
    lineHeight: 1.45,
    whiteSpace: "pre-wrap",
    background: "rgba(255,255,255,0.035)",
  } as React.CSSProperties,
  facebookPreviewGrid: {
    display: "grid",
    gap: "12px",
    marginTop: "16px",
  } as React.CSSProperties,
  facebookPreviewBox: {
    borderRadius: "18px",
    overflow: "hidden",
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(0,0,0,0.26)",
  } as React.CSSProperties,
  facebookPreviewHeader: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "11px",
    borderBottom: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(255,255,255,0.04)",
  } as React.CSSProperties,
  facebookPreviewMedia: {
    width: "100%",
    background: "rgba(0,0,0,0.42)",
    display: "grid",
    placeItems: "center",
    overflow: "hidden",
  } as React.CSSProperties,
  pill: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    borderRadius: "999px",
    padding: "6px 10px",
    background: "rgba(80,255,160,0.14)",
    border: "1px solid rgba(80,255,160,0.18)",
    fontSize: "12px",
    fontWeight: 800,
  } as React.CSSProperties,
  modeGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
    gap: "10px",
    marginTop: "8px",
  } as React.CSSProperties,
  modeCard: {
    padding: "12px",
    borderRadius: "16px",
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(255,255,255,0.04)",
    cursor: "pointer",
  } as React.CSSProperties,
  platformSettingsPanel: {
    marginTop: "16px",
    borderRadius: "22px",
    padding: "16px",
    background:
      "linear-gradient(135deg, rgba(91,140,255,0.12), rgba(255,255,255,0.035))",
    border: "1px solid rgba(255,255,255,0.12)",
    display: "grid",
    gap: "14px",
  } as React.CSSProperties,
  platformSettingsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "12px",
  } as React.CSSProperties,
  platformSettingCard: {
    borderRadius: "18px",
    padding: "14px",
    background: "rgba(0,0,0,0.2)",
    border: "1px solid rgba(255,255,255,0.1)",
    display: "grid",
    gap: "10px",
  } as React.CSSProperties,
  aiPanel: {
    marginTop: "16px",
    borderRadius: "24px",
    padding: "18px",
    background:
      "radial-gradient(circle at top right, rgba(91,140,255,0.26), transparent 34%), linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.035))",
    border: "1px solid rgba(255,255,255,0.14)",
    boxShadow: "0 16px 42px rgba(0,0,0,0.18)",
    display: "grid",
    gap: "14px",
  } as React.CSSProperties,
  aiOptionGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
    gap: "10px",
  } as React.CSSProperties,
  aiOptionCard: {
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: "16px",
    padding: "11px",
    background: "rgba(255,255,255,0.045)",
    color: "inherit",
    cursor: "pointer",
    textAlign: "left",
  } as React.CSSProperties,
  aiResultCard: {
    borderRadius: "18px",
    padding: "14px",
    background: "rgba(0,0,0,0.24)",
    border: "1px solid rgba(255,255,255,0.1)",
    display: "grid",
    gap: "10px",
  } as React.CSSProperties,
  postCard: {
    borderRadius: "18px",
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(255,255,255,0.04)",
    padding: "14px",
    display: "grid",
    gap: "10px",
  } as React.CSSProperties,
  statGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
    gap: "14px",
  } as React.CSSProperties,
};

function getButtonStyle(base: React.CSSProperties, disabled: boolean) {
  return disabled ? { ...base, ...styles.disabledButton } : base;
}

function getActionLabel(postMode: BufferPostMode) {
  if (postMode === "publish") return "Publish Now";
  if (postMode === "queue") return "Add To Queue";
  if (postMode === "schedule") return "Schedule Post";
  return "Save Draft";
}

function getChannelService(channel?: BufferChannel) {
  return (channel?.service || "").toLowerCase();
}

function isInstagramChannel(channel?: BufferChannel) {
  return getChannelService(channel).includes("instagram");
}

function isFacebookChannel(channel?: BufferChannel) {
  const service = getChannelService(channel);
  const type = (channel?.type || "").toLowerCase();
  const name = `${channel?.name || ""} ${channel?.displayName || ""} ${channel?.descriptor || ""}`.toLowerCase();

  return (
    service.includes("facebook") ||
    service.includes("meta") ||
    type.includes("facebook") ||
    type.includes("page") ||
    name.includes("facebook")
  );
}

function isYouTubeChannel(channel?: BufferChannel) {
  return getChannelService(channel).includes("youtube");
}

function getSelectedPlatformSummary(channels: BufferChannel[]) {
  const services = Array.from(
    new Set(
      channels.map((channel) => channel.service || "Unknown").filter(Boolean),
    ),
  );

  if (services.length === 0) return "No platform selected";
  return services.join(" + ");
}

function getModeDescription(mode: BufferPostMode) {
  if (mode === "draft") return "Safe review";
  if (mode === "queue") return "Next Buffer slot";
  if (mode === "schedule") return "Pick exact time";
  return "Send immediately";
}

function formatSchedulePreview(value: string) {
  if (!value) return "No time selected";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Invalid date";
  return date.toLocaleString([], { dateStyle: "medium", timeStyle: "short" });
}

function formatPostDate(value?: string | null) {
  if (!value) return "No date";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Invalid date";
  return date.toLocaleString([], { dateStyle: "medium", timeStyle: "short" });
}

function toDateTimeLocalValue(value?: string | null) {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const offsetMs = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
}


function groupPostsByDate(posts: BufferPost[]) {
  return posts.reduce<Record<string, BufferPost[]>>((groups, post) => {
    const key = post.dueAt
      ? new Date(post.dueAt).toLocaleDateString([], {
          weekday: "short",
          month: "short",
          day: "numeric",
        })
      : "Unscheduled";

    groups[key] = groups[key] || [];
    groups[key].push(post);
    return groups;
  }, {});
}

export default function SocialMediaCommandCenter() {
  const [activeTab, setActiveTab] = useState<SocialTab>("composer");
  const [dashboardOpen, setDashboardOpen] = useState(false);
  const [bufferStatus, setBufferStatus] = useState("");
  const [composerStatus, setComposerStatus] = useState("");
  const [isTestingBuffer, setIsTestingBuffer] = useState(false);
  const [bufferEmail, setBufferEmail] = useState("");

  const [organizations, setOrganizations] = useState<BufferOrganization[]>([]);
  const [selectedOrganizationId, setSelectedOrganizationId] = useState("");

  const [channels, setChannels] = useState<BufferChannel[]>([]);
  const [selectedChannelIds, setSelectedChannelIds] = useState<string[]>([]);
  const [loadingChannels, setLoadingChannels] = useState(false);

  const [draftPostText, setDraftPostText] = useState("");
  const [captionBrief, setCaptionBrief] = useState("");
  const [captionTone, setCaptionTone] = useState("artist-promo");
  const [generatedCaptions, setGeneratedCaptions] = useState<string[]>([]);
  const [generatingCaption, setGeneratingCaption] = useState(false);
  const [captionAssistantStatus, setCaptionAssistantStatus] = useState("");
  const [youtubeTitle, setYoutubeTitle] = useState("");
  const [youtubeCategoryId, setYoutubeCategoryId] = useState("10");
  const [youtubeCategoryTitle, setYoutubeCategoryTitle] = useState("Music");
  const [postMode, setPostMode] = useState<BufferPostMode>("draft");
  const [scheduledAtLocal, setScheduledAtLocal] = useState("");
  const [instagramPostType, setInstagramPostType] =
    useState<BufferInstagramPostType>("post");
  const [facebookPostType, setFacebookPostType] =
    useState<BufferFacebookPostType>("post");

  const [selectedMediaFile, setSelectedMediaFile] = useState<File | null>(null);
  const [uploadedMediaUrl, setUploadedMediaUrl] = useState("");
  const [uploadedMediaKind, setUploadedMediaKind] =
    useState<BufferMediaKind>("image");

  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [creatingDraftPost, setCreatingDraftPost] = useState(false);
  const [lastCreatedPostIds, setLastCreatedPostIds] = useState<string[]>([]);

  const [draftPosts, setDraftPosts] = useState<BufferPost[]>([]);
  const [scheduledPosts, setScheduledPosts] = useState<BufferPost[]>([]);
  const [publishedPosts, setPublishedPosts] = useState<BufferPost[]>([]);
  const [errorPosts, setErrorPosts] = useState<BufferPost[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [postsStatus, setPostsStatus] = useState("");
  const [editingPostId, setEditingPostId] = useState("");
  const [editingText, setEditingText] = useState("");
  const [editingScheduledAt, setEditingScheduledAt] = useState("");
  const [updatingPostId, setUpdatingPostId] = useState("");
  const [deletingPostId, setDeletingPostId] = useState("");
  const [postActionMessages, setPostActionMessages] = useState<Record<string, { type: "success" | "error" | "info"; message: string }>>({});
  const [openMessagePostId, setOpenMessagePostId] = useState("");

  const selectedChannels = channels.filter((channel) =>
    selectedChannelIds.includes(channel.id),
  );

  const hasInstagramSelected = selectedChannels.some(isInstagramChannel);
  const hasFacebookSelected = selectedChannels.some(isFacebookChannel);
  const hasYouTubeSelected = selectedChannels.some(isYouTubeChannel);
  const selectedPlatformSummary = getSelectedPlatformSummary(selectedChannels);
  const mediaRequired = hasInstagramSelected || hasYouTubeSelected;
  const videoRequired = hasYouTubeSelected;

  const dashboardChannelIds = selectedChannelIds.length > 0
    ? selectedChannelIds
    : channels.map((channel) => channel.id);

  const isBusy =
    isTestingBuffer ||
    loadingChannels ||
    uploadingMedia ||
    creatingDraftPost ||
    loadingPosts ||
    Boolean(updatingPostId) ||
    Boolean(deletingPostId);

  const calendarGroups = useMemo(
    () => groupPostsByDate(scheduledPosts),
    [scheduledPosts],
  );

  async function testBufferConnection() {
    try {
      setIsTestingBuffer(true);
      setBufferStatus("Connecting to Buffer...");

      const data = await getBufferAccount();
      const accountOrganizations = data.account.organizations || [];

      setBufferEmail(data.account.email);
      setOrganizations(accountOrganizations);

      if (accountOrganizations.length > 0) {
        setSelectedOrganizationId(accountOrganizations[0].id);
      }

      setBufferStatus(`Buffer connected: ${data.account.email}`);
    } catch (error) {
      console.error(error);
      setBufferStatus(error instanceof Error ? error.message : "Buffer connection failed.");
    } finally {
      setIsTestingBuffer(false);
    }
  }

  async function loadConnectedChannels() {
    if (!selectedOrganizationId) {
      setBufferStatus("Connect Buffer first so we can load your organization.");
      return;
    }

    try {
      setLoadingChannels(true);
      setBufferStatus("Refreshing connected profiles...");

      const data = await getBufferChannels(selectedOrganizationId);
      const loadedChannels = data.channels || [];

      setChannels(loadedChannels);
      setSelectedChannelIds((currentSelectedIds) =>
        currentSelectedIds.filter((channelId) =>
          loadedChannels.some((channel) => channel.id === channelId),
        ),
      );

      setBufferStatus(`Loaded ${loadedChannels.length} connected profile${loadedChannels.length === 1 ? "" : "s"}.`);
    } catch (error) {
      console.error(error);
      setBufferStatus(error instanceof Error ? error.message : "Could not load connected profiles.");
    } finally {
      setLoadingChannels(false);
    }
  }

  async function loadPostDashboard() {
    if (!selectedOrganizationId) {
      setPostsStatus("Connect Buffer first.");
      return;
    }

    if (dashboardChannelIds.length === 0) {
      setPostsStatus("Refresh profiles first so we know which channels to load.");
      return;
    }

    try {
      setLoadingPosts(true);
      setDashboardOpen(true);
      setPostsStatus("Loading Buffer posts...");

      const [draftData, scheduledData, publishedData, errorData] = await Promise.all([
        getBufferPosts(selectedOrganizationId, dashboardChannelIds, ["draft"]),
        getBufferPosts(selectedOrganizationId, dashboardChannelIds, ["scheduled"]),
        getBufferPosts(selectedOrganizationId, dashboardChannelIds, ["sent"]),
        getBufferPosts(selectedOrganizationId, dashboardChannelIds, ["error"]),
      ]);

      setDraftPosts(draftData.posts.edges.map((edge) => edge.node));
      setScheduledPosts(scheduledData.posts.edges.map((edge) => edge.node));
      setPublishedPosts(publishedData.posts.edges.map((edge) => edge.node));
      setErrorPosts(errorData.posts.edges.map((edge) => edge.node));

      setPostsStatus("Post dashboard refreshed.");
    } catch (error) {
      console.error(error);
      setPostsStatus(
        error instanceof Error
          ? error.message
          : "Could not load Buffer posts.",
      );
    } finally {
      setLoadingPosts(false);
    }
  }

  function toggleSelectedChannel(channelId: string) {
    setSelectedChannelIds((currentSelectedIds) =>
      currentSelectedIds.includes(channelId)
        ? currentSelectedIds.filter((id) => id !== channelId)
        : [...currentSelectedIds, channelId],
    );
  }

  function handleMediaFileChange(file: File | null) {
    setSelectedMediaFile(file);
    setUploadedMediaUrl("");
    setLastCreatedPostIds([]);
    setComposerStatus("");

    if (!file) return;

    if (file.type.startsWith("video/")) {
      setUploadedMediaKind("video");
      if (instagramPostType === "post") setInstagramPostType("reel");
      return;
    }

    setUploadedMediaKind("image");
    if (instagramPostType === "reel") setInstagramPostType("post");
  }

  async function uploadMediaToSupabase() {
    if (!selectedMediaFile) {
      setComposerStatus("Choose an image or video file first.");
      return "";
    }

    try {
      setUploadingMedia(true);
      setComposerStatus("Uploading media to Track Adam OS cloud storage...");

      const safeFileName = selectedMediaFile.name
        .replace(/[^a-zA-Z0-9._-]/g, "-")
        .toLowerCase();

      const filePath = `${Date.now()}-${crypto.randomUUID()}-${safeFileName}`;

      const { error: uploadError } = await supabase.storage
        .from(SOCIAL_MEDIA_BUCKET)
        .upload(filePath, selectedMediaFile, {
          cacheControl: "3600",
          upsert: false,
          contentType: selectedMediaFile.type,
        });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from(SOCIAL_MEDIA_BUCKET)
        .getPublicUrl(filePath);

      if (!data.publicUrl) {
        throw new Error("Supabase did not return a public media URL.");
      }

      setUploadedMediaUrl(data.publicUrl);
      setComposerStatus("Media uploaded successfully.");
      return data.publicUrl;
    } catch (error) {
      console.error(error);
      setComposerStatus(error instanceof Error ? error.message : "Could not upload media.");
      return "";
    } finally {
      setUploadingMedia(false);
    }
  }

  async function createDraftPost() {
    if (selectedChannelIds.length === 0) {
      setComposerStatus("Select at least one connected profile first.");
      return;
    }

    if (!draftPostText.trim()) {
      setComposerStatus("Write your caption before creating a post.");
      return;
    }

    if (postMode === "schedule" && !scheduledAtLocal) {
      setComposerStatus("Choose a date and time before scheduling.");
      return;
    }

    const scheduledAtIso =
      postMode === "schedule"
        ? new Date(scheduledAtLocal).toISOString()
        : undefined;

    if (postMode === "schedule" && scheduledAtIso && new Date(scheduledAtIso).getTime() <= Date.now()) {
      setComposerStatus("Schedule time must be in the future.");
      return;
    }

    if (mediaRequired && !selectedMediaFile && !uploadedMediaUrl) {
      setComposerStatus(
        hasYouTubeSelected
          ? "YouTube Shorts requires a video file."
          : "Instagram requires an image or video file.",
      );
      return;
    }

    if (videoRequired && uploadedMediaKind !== "video") {
      setComposerStatus("YouTube Shorts requires a video file, not an image.");
      return;
    }

    if (hasFacebookSelected && facebookPostType !== "post" && !selectedMediaFile && !uploadedMediaUrl) {
      setComposerStatus("Facebook Stories and Reels require media.");
      return;
    }

    if (hasFacebookSelected && facebookPostType === "reel" && uploadedMediaKind !== "video") {
      setComposerStatus("Facebook Reels require a video file.");
      return;
    }

    if (hasYouTubeSelected && !youtubeTitle.trim()) {
      setComposerStatus("YouTube Shorts requires a title.");
      return;
    }

    if (hasYouTubeSelected && !youtubeCategoryId.trim()) {
      setComposerStatus("YouTube Shorts requires a category.");
      return;
    }

    const mediaUrl =
      selectedMediaFile || uploadedMediaUrl
        ? uploadedMediaUrl || (await uploadMediaToSupabase())
        : "";

    if (mediaRequired && !mediaUrl) {
      setComposerStatus("Upload media before creating this post.");
      return;
    }

    try {
      setCreatingDraftPost(true);
      setLastCreatedPostIds([]);
      setComposerStatus(`${getActionLabel(postMode)} in Buffer...`);

      const createdPostIds: string[] = [];

      for (const channelId of selectedChannelIds) {
        const channel = channels.find((item) => item.id === channelId);
        const isInstagram = isInstagramChannel(channel);

        const data = await createBufferPost(channelId, draftPostText.trim(), {
          mediaUrl: mediaUrl || undefined,
          mediaKind: mediaUrl ? uploadedMediaKind : undefined,
          instagramPostType: isInstagram ? instagramPostType : undefined,
          facebookPostType: isFacebookChannel(channel) ? facebookPostType : undefined,
          youtubeTitle: isYouTubeChannel(channel) ? youtubeTitle.trim() : undefined,
          youtubeCategoryId: isYouTubeChannel(channel) ? youtubeCategoryId : undefined,
          youtubeCategoryTitle: isYouTubeChannel(channel) ? youtubeCategoryTitle : undefined,
          postMode,
          scheduledAtIso,
        });

        const result = data.createPost;

        if (result?.message) throw new Error(result.message);
        if (result?.post?.id) createdPostIds.push(result.post.id);
      }

      setLastCreatedPostIds(createdPostIds);

      const extra =
        postMode === "schedule"
          ? ` for ${formatSchedulePreview(scheduledAtLocal)}`
          : "";

      setComposerStatus(`${getActionLabel(postMode)} completed for ${createdPostIds.length} post${createdPostIds.length === 1 ? "" : "s"}${extra}.`);

      await loadPostDashboard();
    } catch (error) {
      console.error(error);
      setComposerStatus(error instanceof Error ? error.message : "Could not complete Buffer action.");
    } finally {
      setCreatingDraftPost(false);
    }
  }

  function clearComposer() {
    setDraftPostText("");
    setSelectedMediaFile(null);
    setUploadedMediaUrl("");
    setLastCreatedPostIds([]);
    setComposerStatus("");
  }

  function setCardMessage(
    postId: string,
    type: "success" | "error" | "info",
    message: string,
  ) {
    setPostActionMessages((current) => ({
      ...current,
      [postId]: { type, message },
    }));
    setOpenMessagePostId(postId);
  }

  function startEditingPost(post: BufferPost) {
    setEditingPostId(post.id);
    setEditingText(post.text || "");
    setEditingScheduledAt(toDateTimeLocalValue(post.dueAt));
    setOpenMessagePostId(post.id);
  }

  function cancelEditingPost() {
    setEditingPostId("");
    setEditingText("");
    setEditingScheduledAt("");
  }

  async function savePostEdits(post: BufferPost) {
    if (!editingText.trim()) {
      setCardMessage(post.id, "error", "Caption cannot be empty.");
      return;
    }

    const scheduledAtIso = editingScheduledAt
      ? new Date(editingScheduledAt).toISOString()
      : undefined;

    if (scheduledAtIso && new Date(scheduledAtIso).getTime() <= Date.now()) {
      setCardMessage(post.id, "error", "Schedule time must be in the future.");
      return;
    }

    const media = getPostMedia(post);
    const channel = channels.find((item) => item.id === post.channelId);
    const isInstagram = (channel?.service || "").toLowerCase() === "instagram";

    if (isInstagram && !media?.source) {
      setCardMessage(
        post.id,
        "error",
        "This Instagram post does not have a media URL returned from Buffer, so it cannot be edited safely. Delete and recreate it instead.",
      );
      return;
    }

    try {
      setUpdatingPostId(post.id);
      setCardMessage(post.id, "info", "Saving post changes...");

      const data = await editBufferPost(post.id, {
        text: editingText.trim(),
        scheduledAtIso,
        mediaUrl: media?.source,
        mediaKind: media?.isVideo ? "video" : "image",
        instagramPostType: isInstagram ? "post" : undefined,
      });

      const result = data.editPost;

      if (result?.message) {
        throw new Error(result.message);
      }

      setCardMessage(post.id, "success", "Post updated successfully.");
      cancelEditingPost();
      await loadPostDashboard();
    } catch (error) {
      console.error(error);
      setCardMessage(
        post.id,
        "error",
        error instanceof Error ? error.message : "Could not update post.",
      );
    } finally {
      setUpdatingPostId("");
    }
  }

  async function deleteScheduledPost(post: BufferPost) {
    const confirmed = window.confirm(
      "Delete this Buffer post? This cannot be undone.",
    );

    if (!confirmed) return;

    try {
      setDeletingPostId(post.id);
      setCardMessage(post.id, "info", "Deleting post...");

      const data = await deleteBufferPost(post.id);

      if (data.deletePost?.message) {
        throw new Error(data.deletePost.message);
      }

      setCardMessage(post.id, "success", "Post deleted successfully.");
      if (editingPostId === post.id) {
        cancelEditingPost();
      }
      await loadPostDashboard();
    } catch (error) {
      console.error(error);
      setCardMessage(
        post.id,
        "error",
        error instanceof Error ? error.message : "Could not delete post.",
      );
    } finally {
      setDeletingPostId("");
    }
  }

  function getPostMedia(post: BufferPost) {
    const asset = post.assets?.find((item) => item.source);
    const source = asset?.source || "";

    if (!source || !source.startsWith("http")) {
      return null;
    }

    const mimeType = asset?.mimeType || "";

    return {
      source,
      mimeType,
      isVideo: mimeType.startsWith("video"),
      isImage:
        mimeType.startsWith("image") ||
        /\.(jpg|jpeg|png|webp|gif)$/i.test(source),
    };
  }

  function renderPostCard(post: BufferPost) {
    const media = getPostMedia(post);
    const channel = channels.find((item) => item.id === post.channelId);
    const channelName = channel?.displayName || channel?.name || "Unknown profile";
    const channelDescriptor = channel?.descriptor || channel?.name || "@profile";
    const postText = post.text || "No caption text.";
    const isEditing = editingPostId === post.id;
    const isWorking = updatingPostId === post.id || deletingPostId === post.id;
    const canManage = post.status !== "sent";
    const cardMessage = postActionMessages[post.id];
    const isMessageOpen = openMessagePostId === post.id && cardMessage;

    return (
      <div
        key={post.id}
        style={{
          ...styles.postCard,
          maxWidth: "380px",
          width: "100%",
          minHeight: isEditing ? "840px" : "690px",
          height: "100%",
          justifySelf: "center",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            width: "100%",
            borderRadius: "22px",
            overflow: "hidden",
            border: "1px solid rgba(255,255,255,0.12)",
            background: "rgba(0,0,0,0.32)",
            boxShadow: "0 14px 36px rgba(0,0,0,0.2)",
            display: "flex",
            flexDirection: "column",
            flex: 1,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              padding: "11px",
              background: "rgba(255,255,255,0.045)",
              borderBottom: "1px solid rgba(255,255,255,0.08)",
              minHeight: "58px",
              flexShrink: 0,
            }}
          >
            {channel?.avatar ? (
              <img
                src={channel.avatar}
                alt={channelName}
                style={{
                  width: "34px",
                  height: "34px",
                  borderRadius: "999px",
                  objectFit: "cover",
                }}
              />
            ) : (
              <div
                style={{
                  width: "34px",
                  height: "34px",
                  borderRadius: "999px",
                  display: "grid",
                  placeItems: "center",
                  background: "rgba(255,255,255,0.1)",
                  fontWeight: 900,
                }}
              >
                {channelName.charAt(0).toUpperCase()}
              </div>
            )}

            <div style={{ minWidth: 0 }}>
              <strong style={{ display: "block", fontSize: "13px" }}>
                {channelName}
              </strong>
              <small style={{ opacity: 0.65 }}>{channelDescriptor}</small>
            </div>

            <span style={{ marginLeft: "auto", opacity: 0.65 }}>•••</span>
          </div>

          <div
            style={{
              width: "100%",
              aspectRatio: "4 / 5",
              background: "rgba(0,0,0,0.45)",
              display: "grid",
              placeItems: "center",
              overflow: "hidden",
              flexShrink: 0,
            }}
          >
            {media && media.isVideo ? (
              <video
                src={media.source}
                controls
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
              />
            ) : media ? (
              <img
                src={media.source}
                alt="Post media"
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
              />
            ) : (
              <span style={{ opacity: 0.58, fontSize: "13px" }}>
                No media preview returned
              </span>
            )}
          </div>

          {!isEditing ? (
            <div
              style={{
                padding: "12px",
                fontSize: "13px",
                lineHeight: 1.45,
                whiteSpace: "pre-wrap",
                background: "rgba(255,255,255,0.035)",
                minHeight: "150px",
                maxHeight: "150px",
                overflow: "hidden",
                flexShrink: 0,
              }}
              title={postText}
            >
              <strong>{channelName}</strong> {postText}
            </div>
          ) : (
            <div
              style={{
                padding: "12px",
                background: "rgba(255,255,255,0.035)",
                display: "grid",
                gap: "10px",
              }}
            >
              <label>
                Caption
                <textarea
                  value={editingText}
                  onChange={(event) => setEditingText(event.target.value)}
                  rows={5}
                  style={{
                    ...styles.textarea,
                    minHeight: "120px",
                    marginTop: "6px",
                  }}
                />
              </label>

              <label>
                Schedule Time
                <input
                  type="datetime-local"
                  value={editingScheduledAt}
                  onChange={(event) => setEditingScheduledAt(event.target.value)}
                  style={styles.input}
                />
              </label>
            </div>
          )}
        </div>

        <div
          style={{
            display: "grid",
            gap: "8px",
            marginTop: "10px",
            minHeight: isEditing ? "140px" : "84px",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", gap: "10px" }}>
            <span style={styles.pill}>{post.status || "unknown"}</span>
            <small style={{ opacity: 0.7 }}>{formatPostDate(post.dueAt)}</small>
          </div>

          {media ? (
            <small>
              <a href={media.source} target="_blank" rel="noreferrer">
                Open media
              </a>
            </small>
          ) : (
            <small style={{ opacity: 0.42 }}>No media link</small>
          )}

          {canManage && (
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              {!isEditing ? (
                <button
                  type="button"
                  onClick={() => startEditingPost(post)}
                  disabled={isWorking}
                  style={{
                    ...getButtonStyle(styles.secondaryButton, isWorking),
                    padding: "8px 10px",
                    fontSize: "12px",
                  }}
                >
                  Edit
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => savePostEdits(post)}
                    disabled={isWorking}
                    style={{
                      ...getButtonStyle(styles.primaryButton, isWorking),
                      padding: "8px 10px",
                      fontSize: "12px",
                    }}
                  >
                    {updatingPostId === post.id ? "Saving..." : "Save"}
                  </button>

                  <button
                    type="button"
                    onClick={cancelEditingPost}
                    disabled={isWorking}
                    style={{
                      ...getButtonStyle(styles.ghostButton, isWorking),
                      padding: "8px 10px",
                      fontSize: "12px",
                    }}
                  >
                    Cancel
                  </button>
                </>
              )}

              <button
                type="button"
                onClick={() => deleteScheduledPost(post)}
                disabled={isWorking}
                style={{
                  ...getButtonStyle(styles.dangerButton, isWorking),
                  padding: "8px 10px",
                  fontSize: "12px",
                }}
              >
                {deletingPostId === post.id ? "Deleting..." : "Delete"}
              </button>
            </div>
          )}

          {isMessageOpen && (
            <div
              style={{
                padding: "10px 12px",
                borderRadius: "14px",
                background:
                  cardMessage.type === "success"
                    ? "rgba(80,255,160,0.14)"
                    : cardMessage.type === "error"
                      ? "rgba(255,90,90,0.14)"
                      : "rgba(91,140,255,0.14)",
                border:
                  cardMessage.type === "success"
                    ? "1px solid rgba(80,255,160,0.24)"
                    : cardMessage.type === "error"
                      ? "1px solid rgba(255,90,90,0.24)"
                      : "1px solid rgba(91,140,255,0.24)",
                fontSize: "12px",
                lineHeight: 1.4,
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: "10px",
                  alignItems: "start",
                }}
              >
                <span>{cardMessage.message}</span>
                <button
                  type="button"
                  onClick={() => setOpenMessagePostId("")}
                  style={{
                    border: 0,
                    background: "transparent",
                    color: "inherit",
                    cursor: "pointer",
                    opacity: 0.75,
                    fontWeight: 900,
                  }}
                >
                  ×
                </button>
              </div>
            </div>
          )}

          <small style={{ opacity: 0.42 }}>ID: {post.id}</small>
        </div>
      </div>
    );
  }

  function renderPostsList(title: string, description: string, posts: BufferPost[]) {
    return (
      <section style={styles.card}>
        <div style={styles.cardTitleRow}>
          <div>
            <h2 style={styles.title}>{title}</h2>
            <p style={styles.muted}>{description}</p>
          </div>
          <button
            type="button"
            onClick={loadPostDashboard}
            disabled={loadingPosts}
            style={getButtonStyle(styles.secondaryButton, loadingPosts)}
          >
            {loadingPosts ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        {postsStatus && <div style={styles.statusBox}>{postsStatus}</div>}

        <div
          style={{
            display: "grid",
            gridTemplateColumns: posts.length > 0 ? "repeat(auto-fit, minmax(300px, 1fr))" : "1fr",
            gap: "18px",
            alignItems: "stretch",
            marginTop: "16px",
          }}
        >
          {posts.length === 0 ? (
            <div style={styles.statusBox}>No posts found here yet.</div>
          ) : (
            posts.map(renderPostCard)
          )}
        </div>
      </section>
    );
  }

  function renderCalendar() {
    return (
      <section style={styles.card}>
        <div style={styles.cardTitleRow}>
          <div>
            <h2 style={styles.title}>Content Calendar</h2>
            <p style={styles.muted}>Scheduled and queued posts grouped by day.</p>
          </div>
          <button
            type="button"
            onClick={loadPostDashboard}
            disabled={loadingPosts}
            style={getButtonStyle(styles.secondaryButton, loadingPosts)}
          >
            {loadingPosts ? "Refreshing..." : "Refresh Calendar"}
          </button>
        </div>

        {postsStatus && <div style={styles.statusBox}>{postsStatus}</div>}

        <div style={{ display: "grid", gap: "16px", marginTop: "16px" }}>
          {Object.keys(calendarGroups).length === 0 ? (
            <div style={styles.statusBox}>No scheduled posts loaded yet.</div>
          ) : (
            Object.entries(calendarGroups).map(([date, posts]) => (
              <div key={date} style={styles.postCard}>
                <h3 style={{ margin: 0 }}>{date}</h3>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
                    gap: "18px",
                    alignItems: "stretch",
                  }}
                >
                  {posts.map(renderPostCard)}
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    );
  }

  function renderAnalytics() {
    const totalLoaded =
      draftPosts.length + scheduledPosts.length + publishedPosts.length + errorPosts.length;

    return (
      <section style={styles.card}>
        <div style={styles.cardTitleRow}>
          <div>
            <h2 style={styles.title}>Analytics Snapshot</h2>
            <p style={styles.muted}>
              This is the first dashboard layer. Deeper platform metrics can be added as Buffer exposes/permits them.
            </p>
          </div>
          <button
            type="button"
            onClick={loadPostDashboard}
            disabled={loadingPosts}
            style={getButtonStyle(styles.secondaryButton, loadingPosts)}
          >
            {loadingPosts ? "Refreshing..." : "Refresh Data"}
          </button>
        </div>

        {postsStatus && <div style={styles.statusBox}>{postsStatus}</div>}

        <div style={{ ...styles.statGrid, marginTop: "16px" }}>
          {[
            ["Loaded Posts", totalLoaded],
            ["Drafts", draftPosts.length],
            ["Scheduled / Queue", scheduledPosts.length],
            ["Published", publishedPosts.length],
            ["Errors", errorPosts.length],
          ].map(([label, value]) => (
            <div key={String(label)} style={styles.postCard}>
              <small style={{ opacity: 0.65 }}>{label}</small>
              <strong style={{ fontSize: "28px" }}>{value}</strong>
            </div>
          ))}
        </div>
      </section>
    );
  }

  function getPrimarySelectedChannel() {
    return selectedChannels[0] || channels[0];
  }

  function getPreviewAspectRatio() {
    if (instagramPostType === "story" || instagramPostType === "reel") {
      return "9 / 16";
    }

    return "4 / 5";
  }

  function renderSocialPreview() {
    const previewChannel = getPrimarySelectedChannel();
    const previewName =
      previewChannel?.displayName || previewChannel?.name || "Your Profile";
    const previewDescriptor =
      previewChannel?.descriptor || previewChannel?.name || "@profile";

    return (
      <div style={styles.socialMockup}>
        <div style={styles.socialMockupHeader}>
          {previewChannel?.avatar ? (
            <img
              src={previewChannel.avatar}
              alt={previewName}
              style={styles.socialMockupAvatar}
            />
          ) : (
            <div
              style={{
                ...styles.socialMockupAvatar,
                display: "grid",
                placeItems: "center",
                fontWeight: 900,
              }}
            >
              {previewName.charAt(0).toUpperCase()}
            </div>
          )}

          <div style={{ minWidth: 0 }}>
            <strong style={{ display: "block", fontSize: "13px" }}>
              {previewName}
            </strong>
            <small style={{ opacity: 0.65 }}>{previewDescriptor}</small>
          </div>

          <span style={{ marginLeft: "auto", opacity: 0.65 }}>•••</span>
        </div>

        <div
          style={{
            ...styles.socialMockupMedia,
            aspectRatio: getPreviewAspectRatio(),
          }}
        >
          {uploadedMediaUrl && uploadedMediaKind === "image" ? (
            <img
              src={uploadedMediaUrl}
              alt="Uploaded media preview"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
              }}
            />
          ) : uploadedMediaUrl && uploadedMediaKind === "video" ? (
            <video
              src={uploadedMediaUrl}
              controls
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
              }}
            />
          ) : selectedMediaFile ? (
            <span style={{ padding: "20px", textAlign: "center", opacity: 0.72 }}>
              {selectedMediaFile.name}
            </span>
          ) : (
            <span style={{ opacity: 0.62 }}>No media selected</span>
          )}
        </div>

        <div style={styles.socialMockupCaption}>
          <strong>{previewName}</strong>{" "}
          {draftPostText || "Caption preview will appear here."}
        </div>
      </div>
    );
  }

  function renderFacebookPreview() {
    if (!hasFacebookSelected) return null;

    const previewChannel =
      selectedChannels.find(isFacebookChannel) || getPrimarySelectedChannel();
    const previewName =
      previewChannel?.displayName || previewChannel?.name || "Facebook Page";
    const previewDescriptor =
      previewChannel?.descriptor || previewChannel?.name || "Facebook";

    function renderMediaPreview(aspectRatio: string, label: string) {
      return (
        <div style={styles.facebookPreviewBox}>
          <div style={styles.facebookPreviewHeader}>
            {previewChannel?.avatar ? (
              <img
                src={previewChannel.avatar}
                alt={previewName}
                style={styles.socialMockupAvatar}
              />
            ) : (
              <div
                style={{
                  ...styles.socialMockupAvatar,
                  display: "grid",
                  placeItems: "center",
                  fontWeight: 900,
                }}
              >
                {previewName.charAt(0).toUpperCase()}
              </div>
            )}

            <div style={{ minWidth: 0 }}>
              <strong style={{ display: "block", fontSize: "13px" }}>
                {previewName}
              </strong>
              <small style={{ opacity: 0.65 }}>{previewDescriptor}</small>
            </div>

            <span
              style={{
                marginLeft: "auto",
                opacity: 0.72,
                fontSize: "12px",
                fontWeight: 800,
              }}
            >
              {label}
            </span>
          </div>

          <div
            style={{
              ...styles.facebookPreviewMedia,
              aspectRatio,
            }}
          >
            {uploadedMediaUrl && uploadedMediaKind === "image" ? (
              <img
                src={uploadedMediaUrl}
                alt={`${label} preview`}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "contain",
                  background: "rgba(0,0,0,0.48)",
                }}
              />
            ) : uploadedMediaUrl && uploadedMediaKind === "video" ? (
              <video
                src={uploadedMediaUrl}
                controls
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "contain",
                  background: "rgba(0,0,0,0.48)",
                }}
              />
            ) : selectedMediaFile ? (
              <span style={{ padding: "18px", textAlign: "center", opacity: 0.72 }}>
                {selectedMediaFile.name}
              </span>
            ) : (
              <span style={{ opacity: 0.62 }}>No media selected</span>
            )}
          </div>

          <div
            style={{
              padding: "10px 12px",
              fontSize: "12px",
              lineHeight: 1.4,
              whiteSpace: "pre-wrap",
              background: "rgba(255,255,255,0.035)",
              maxHeight: "92px",
              overflow: "hidden",
            }}
          >
            <strong>{previewName}</strong>{" "}
            {draftPostText || "Caption preview will appear here."}
          </div>
        </div>
      );
    }

    return (
      <div style={styles.facebookPreviewGrid}>
        <div style={styles.statusBox}>
          <strong>Facebook Preview Check</strong>
          <br />
          <small style={{ opacity: 0.75 }}>
            These boxes adjust based on your Facebook Type selection. Media is contained instead of cropped so you can catch black bars, feed sizing issues, or non-Reel dimensions before posting.
          </small>
        </div>

        {facebookPostType === "post" && renderMediaPreview("16 / 9", "Feed 16:9")}
        {facebookPostType === "post" && renderMediaPreview("1 / 1", "Square 1:1")}
        {facebookPostType !== "post" && renderMediaPreview("9 / 16", facebookPostType === "reel" ? "Reel 9:16" : "Story 9:16")}
        {facebookPostType === "post" && renderMediaPreview("9 / 16", "Vertical Check")}
      </div>
    );
  }

  function getCaptionToneLabel() {
    if (captionTone === "artist-promo") return "Artist Promo";
    if (captionTone === "clean-professional") return "Clean Professional";
    if (captionTone === "viral-short") return "Short Viral";
    if (captionTone === "label-announcement") return "Label Announcement";
    if (captionTone === "fan-engagement") return "Fan Engagement";
    if (captionTone === "street-hype") return "Street Hype";
    if (captionTone === "storytelling") return "Storytelling";
    return "Promo Caption";
  }

  function buildCaptionPrompt() {
    const platforms = selectedPlatformSummary;
    const instagramPart = hasInstagramSelected
      ? `Instagram format: ${instagramPostType}.`
      : "";
    const facebookPart = hasFacebookSelected
      ? `Facebook format: ${facebookPostType}.`
      : "";
    const youtubePart = hasYouTubeSelected
      ? `YouTube Shorts title: ${youtubeTitle || "not set yet"}. Category: ${youtubeCategoryTitle}.`
      : "";

    return `
You are writing social media captions for Track Adam OS, a music/label command center.

Create 3 strong caption options for a social post. It may be for an artist, label, song, release, beat pack, merch item, product, event, or campaign.

Context:
- Selected platforms: ${platforms}
- Tone: ${getCaptionToneLabel()}
- User brief: ${captionBrief || "General music promotion post."}
- Caption currently written: ${draftPostText || "None yet."}
- ${instagramPart}
- ${facebookPart}
- ${youtubePart}
- Media type: ${uploadedMediaKind}
- Selected profiles: ${
      selectedChannels.length > 0
        ? selectedChannels
            .map((channel) => channel.displayName || channel.name)
            .join(", ")
        : "No profile selected yet"
    }

Rules:
- Write in a polished modern music marketing tone.
- Do not sound robotic.
- Keep the captions practical and ready to post.
- Include tasteful hashtags only if useful.
- Avoid overusing emojis.
- Match the genre, artist, product, release, and campaign details provided by the user.
- Do not assume the music is R&B, hip-hop, pop, gospel, trap, rock, or any other genre unless the user says so.
- Return only the 3 captions.
- Separate each caption with this exact divider: ---CAPTION---
`;
  }

  function parseGeneratedCaptions(text: string) {
    return text
      .split("---CAPTION---")
      .map((caption) => caption.trim())
      .filter(Boolean)
      .slice(0, 3);
  }

  async function generateCaptionsWithAI() {
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;

    if (!apiKey) {
      setCaptionAssistantStatus(
        "Missing VITE_OPENAI_API_KEY in your environment file.",
      );
      return;
    }

    try {
      setGeneratingCaption(true);
      setCaptionAssistantStatus("Generating caption options...");
      setGeneratedCaptions([]);

      const response = await fetch("https://api.openai.com/v1/responses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4.1-mini",
          input: buildCaptionPrompt(),
          temperature: 0.85,
        }),
      });

      const json = await response.json();

      if (!response.ok) {
        throw new Error(
          json.error?.message || "OpenAI caption request failed.",
        );
      }

      const outputText =
        json.output_text ||
        json.output?.[0]?.content?.[0]?.text ||
        "";

      const captions = parseGeneratedCaptions(outputText);

      if (captions.length === 0) {
        throw new Error("The AI response did not include usable captions.");
      }

      setGeneratedCaptions(captions);
      setCaptionAssistantStatus("Caption options ready.");
    } catch (error) {
      console.error(error);
      setCaptionAssistantStatus(
        error instanceof Error
          ? error.message
          : "Could not generate captions.",
      );
    } finally {
      setGeneratingCaption(false);
    }
  }

  function useGeneratedCaption(caption: string) {
    setDraftPostText(caption);
    setCaptionAssistantStatus("Caption loaded into composer.");
  }

  function appendGeneratedCaption(caption: string) {
    setDraftPostText((current) =>
      current.trim() ? `${current.trim()}\n\n${caption}` : caption,
    );
    setCaptionAssistantStatus("Caption added to composer.");
  }

  function renderCaptionAssistant() {
    return (
      <div style={styles.aiPanel}>
        <div>
          <p style={styles.eyebrow}>AI Assistant</p>
          <h3 style={{ margin: "6px 0 0" }}>Caption Assistant</h3>
          <p style={styles.muted}>
            Generate platform-aware captions for Instagram, Facebook, and YouTube Shorts without leaving the composer.
          </p>
        </div>

        <label>
          Caption Direction
          <input
            value={captionBrief}
            onChange={(event) => setCaptionBrief(event.target.value)}
            placeholder="Example: Promote a new single, album, beat pack, artist post, product launch, or label campaign"
            style={styles.input}
          />
        </label>

        <div>
          <label>Tone</label>
          <div style={styles.aiOptionGrid}>
            {[
              ["artist-promo", "Artist Promo", "Release-ready caption"],
              ["clean-professional", "Professional", "Clean label voice"],
              ["viral-short", "Short Viral", "Punchy and scroll-stopping"],
              ["label-announcement", "Label News", "Official announcement"],
              ["fan-engagement", "Fan Engagement", "Comments and saves"],
              ["street-hype", "Street Hype", "Bold and energetic"],
              ["storytelling", "Storytelling", "Personal and meaningful"],
            ].map(([value, label, description]) => {
              const selected = captionTone === value;

              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => setCaptionTone(value)}
                  style={{
                    ...styles.aiOptionCard,
                    border: selected
                      ? "1px solid rgba(91,140,255,0.85)"
                      : styles.aiOptionCard.border,
                    background: selected
                      ? "linear-gradient(135deg, rgba(91,140,255,0.2), rgba(255,255,255,0.045))"
                      : styles.aiOptionCard.background,
                  }}
                >
                  <strong>{label}</strong>
                  <br />
                  <small style={{ opacity: 0.7 }}>{description}</small>
                </button>
              );
            })}
          </div>
        </div>

        <div style={styles.buttonRow}>
          <button
            type="button"
            onClick={generateCaptionsWithAI}
            disabled={generatingCaption}
            style={getButtonStyle(styles.primaryButton, generatingCaption)}
          >
            {generatingCaption ? "Generating..." : "Generate Captions"}
          </button>

          <button
            type="button"
            onClick={() => {
              setGeneratedCaptions([]);
              setCaptionAssistantStatus("");
              setCaptionBrief("");
            }}
            disabled={generatingCaption}
            style={getButtonStyle(styles.ghostButton, generatingCaption)}
          >
            Clear AI
          </button>
        </div>

        {captionAssistantStatus && (
          <div style={styles.statusBox}>{captionAssistantStatus}</div>
        )}

        {generatedCaptions.length > 0 && (
          <div style={{ display: "grid", gap: "12px" }}>
            {generatedCaptions.map((caption, index) => (
              <div key={`${caption}-${index}`} style={styles.aiResultCard}>
                <strong>Option {index + 1}</strong>
                <p style={{ margin: 0, whiteSpace: "pre-wrap", lineHeight: 1.5 }}>
                  {caption}
                </p>

                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  <button
                    type="button"
                    onClick={() => useGeneratedCaption(caption)}
                    style={{
                      ...styles.primaryButton,
                      padding: "8px 10px",
                      fontSize: "12px",
                    }}
                  >
                    Use Caption
                  </button>

                  <button
                    type="button"
                    onClick={() => appendGeneratedCaption(caption)}
                    style={{
                      ...styles.secondaryButton,
                      padding: "8px 10px",
                      fontSize: "12px",
                    }}
                  >
                    Append
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  function renderPlatformSettings() {
    const selectedFacebookProfiles = selectedChannels.filter(isFacebookChannel);

    return (
      <div style={styles.platformSettingsPanel}>
        <div>
          <h3 style={{ margin: 0 }}>Platform Settings</h3>
          <p style={styles.muted}>
            Controls change automatically based on the connected profiles you select.
          </p>
        </div>

        <div style={styles.platformSettingsGrid}>
          {hasInstagramSelected && (
            <div style={styles.platformSettingCard}>
              <div>
                <strong>Instagram</strong>
                <p style={styles.muted}>
                  Choose whether this goes out as a feed post, reel, or story.
                </p>
              </div>

              <label>
                Instagram Type
                <select
                  value={instagramPostType}
                  onChange={(event) =>
                    setInstagramPostType(event.target.value as BufferInstagramPostType)
                  }
                  style={styles.select}
                >
                  <option value="post">Post</option>
                  <option value="reel">Reel</option>
                  <option value="story">Story</option>
                </select>
              </label>

              <small style={{ opacity: 0.72 }}>
                Instagram requires an image or video. Stories are not shared to the feed.
              </small>
            </div>
          )}

          {hasFacebookSelected && (
            <div style={styles.platformSettingCard}>
              <div>
                <strong>Facebook</strong>
                <p style={styles.muted}>
                  Choose whether this goes out as a page post, reel, or story.
                </p>
              </div>

              <label>
                Facebook Type
                <select
                  value={facebookPostType}
                  onChange={(event) =>
                    setFacebookPostType(event.target.value as BufferFacebookPostType)
                  }
                  style={styles.select}
                >
                  <option value="post">Post</option>
                  <option value="reel">Reel</option>
                  <option value="story">Story</option>
                </select>
              </label>

              <div style={styles.statusBox}>
                Selected Facebook profile{selectedFacebookProfiles.length === 1 ? "" : "s"}:{" "}
                <strong>
                  {selectedFacebookProfiles.length > 0
                    ? selectedFacebookProfiles
                        .map((channel) => channel.displayName || channel.name)
                        .join(", ")
                    : "None"}
                </strong>
              </div>

              <small style={{ opacity: 0.72 }}>
                Facebook posts can be text-only. Facebook reels require video. Stories require media.
              </small>
            </div>
          )}

          {hasYouTubeSelected && (
            <div style={styles.platformSettingCard}>
              <div>
                <strong>YouTube Shorts</strong>
                <p style={styles.muted}>
                  YouTube posting through Buffer is Shorts-focused and requires a video, title, and category.
                </p>
              </div>

              <label>
                YouTube Shorts Title
                <input
                  value={youtubeTitle}
                  onChange={(event) => setYoutubeTitle(event.target.value)}
                  placeholder="Enter a short title"
                  style={styles.input}
                />
              </label>

              <label>
                YouTube Category
                <select
                  value={youtubeCategoryId}
                  onChange={(event) => {
                    setYoutubeCategoryId(event.target.value);
                    setYoutubeCategoryTitle(
                      event.target.options[event.target.selectedIndex].text,
                    );
                  }}
                  style={styles.select}
                >
                  <option value="10">Music</option>
                  <option value="24">Entertainment</option>
                  <option value="22">People & Blogs</option>
                  <option value="26">Howto & Style</option>
                  <option value="1">Film & Animation</option>
                </select>
              </label>

              <small style={{ opacity: 0.72 }}>
                Video is required. Use a vertical 9:16 asset for the cleanest Shorts result.
              </small>
            </div>
          )}

          {!hasInstagramSelected && !hasFacebookSelected && !hasYouTubeSelected && (
            <div style={styles.platformSettingCard}>
              <strong>No platform selected</strong>
              <p style={styles.muted}>
                Select an Instagram, Facebook, or YouTube profile above and the correct posting controls will appear here.
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  function renderComposer() {
    return (
      <>
        <section style={styles.card}>
          <div style={styles.cardTitleRow}>
            <div>
              <h2 style={styles.title}>Connected Profiles</h2>
              <p style={styles.muted}>Select where this post should go.</p>
            </div>
            <span style={styles.pill}>{selectedChannelIds.length} selected</span>
          </div>

          {channels.length === 0 ? (
            <div style={styles.statusBox}>
              No profiles loaded yet. Connect Buffer, then refresh profiles.
            </div>
          ) : (
            <div style={styles.profileGrid}>
              {channels.map((channel) => {
                const isSelected = selectedChannelIds.includes(channel.id);
                const statusLabel = channel.isDisconnected
                  ? "Disconnected"
                  : channel.isLocked
                    ? "Locked"
                    : channel.isQueuePaused
                      ? "Queue Paused"
                      : "Connected";

                return (
                  <label
                    key={channel.id}
                    style={{
                      ...styles.profileCard,
                      border: isSelected
                        ? "1px solid rgba(91, 140, 255, 0.85)"
                        : styles.profileCard.border,
                      background: isSelected
                        ? "linear-gradient(135deg, rgba(91,140,255,0.18), rgba(255,255,255,0.045))"
                        : styles.profileCard.background,
                    }}
                  >
                    <div
                      style={{
                        ...styles.check,
                        background: isSelected ? "#3b82f6" : styles.check.background,
                      }}
                    >
                      {isSelected ? "✓" : ""}
                    </div>

                    {channel.avatar ? (
                      <img src={channel.avatar} alt={channel.name} style={styles.avatar} />
                    ) : (
                      <div style={styles.avatarFallback}>
                        {(channel.displayName || channel.name || "?").charAt(0).toUpperCase()}
                      </div>
                    )}

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <strong>{channel.displayName || channel.name}</strong>
                      <br />
                      <small style={{ opacity: 0.76 }}>{channel.descriptor || channel.name}</small>
                      <br />
                      <small style={{ opacity: 0.62 }}>
                        {channel.service || "Unknown service"} • {channel.type || "Channel"}
                      </small>
                    </div>

                    <span style={styles.pill}>{statusLabel}</span>

                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelectedChannel(channel.id)}
                      style={{ display: "none" }}
                    />
                  </label>
                );
              })}
            </div>
          )}
        </section>

        <section style={styles.grid}>
          <div style={styles.card}>
            <h2 style={styles.title}>Create Social Post</h2>
            <p style={styles.muted}>
              Select your platform profiles, choose media if needed, write the caption, then send it to Buffer.
            </p>

            <div style={styles.statusBox}>
              <strong>Selected Platforms:</strong> {selectedPlatformSummary}
              <br />
              <small style={{ opacity: 0.75 }}>
                {hasInstagramSelected && "Instagram: media required. "}
                {hasFacebookSelected && "Facebook: text, image, or video ready. "}
                {hasYouTubeSelected && "YouTube Shorts: vertical video required. "}
                {!hasInstagramSelected && !hasFacebookSelected && !hasYouTubeSelected
                  ? "Select a connected profile to see platform rules."
                  : ""}
              </small>
            </div>

            {renderPlatformSettings()}

            <div style={{ marginTop: "14px" }}>
              <label>Posting Mode</label>

              <div style={styles.modeGrid}>
                {(["draft", "queue", "schedule", "publish"] as BufferPostMode[]).map((mode) => {
                  const selected = postMode === mode;

                  return (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setPostMode(mode)}
                      style={{
                        ...styles.modeCard,
                        border: selected
                          ? "1px solid rgba(91,140,255,0.85)"
                          : styles.modeCard.border,
                        background: selected
                          ? "linear-gradient(135deg, rgba(91,140,255,0.2), rgba(255,255,255,0.045))"
                          : styles.modeCard.background,
                        color: "inherit",
                        textAlign: "left",
                      }}
                    >
                      <strong>{getActionLabel(mode)}</strong>
                      <br />
                      <small style={{ opacity: 0.68 }}>
                        {getModeDescription(mode)}
                      </small>
                    </button>
                  );
                })}
              </div>
            </div>

            {postMode === "schedule" && (
              <label style={{ display: "block", marginTop: "14px" }}>
                Schedule Date & Time
                <input
                  type="datetime-local"
                  value={scheduledAtLocal}
                  onChange={(event) => setScheduledAtLocal(event.target.value)}
                  style={styles.input}
                />
                <small style={{ display: "block", marginTop: "8px", opacity: 0.72 }}>
                  Selected time: {formatSchedulePreview(scheduledAtLocal)}
                </small>
              </label>
            )}

            <label style={{ display: "block", marginTop: "14px" }}>
              Media File
              <input
                id="social-media-file-input"
                type="file"
                accept="image/*,video/*"
                onChange={(event) =>
                  handleMediaFileChange(event.target.files ? event.target.files[0] : null)
                }
                style={{ display: "none" }}
              />

              <label htmlFor="social-media-file-input" style={styles.uploadZone}>
                <div style={styles.uploadIcon}>
                  {selectedMediaFile ? "✓" : "↑"}
                </div>

                <strong>
                  {selectedMediaFile ? selectedMediaFile.name : "Choose image or video"}
                </strong>

                <small style={{ opacity: 0.72 }}>
                  {selectedMediaFile
                    ? `${uploadedMediaKind.toUpperCase()} selected. Upload happens automatically when you create the post.`
                    : hasYouTubeSelected
                      ? "Upload a vertical video for YouTube Shorts."
                      : hasFacebookSelected && !hasInstagramSelected
                        ? "Optional: add an image or video for Facebook."
                        : "Upload cover art, promo graphics, reels, or short video assets."}
                </small>
              </label>
            </label>

            {renderCaptionAssistant()}

            <label style={{ display: "block", marginTop: "14px" }}>
              Caption
              <textarea
                value={draftPostText}
                onChange={(event) => setDraftPostText(event.target.value)}
                placeholder="Write your caption here..."
                rows={7}
                style={styles.textarea}
              />
            </label>

            <div style={styles.buttonRow}>
              <button
                type="button"
                onClick={createDraftPost}
                disabled={isBusy}
                style={getButtonStyle(styles.primaryButton, isBusy)}
              >
                {creatingDraftPost
                  ? "Working..."
                  : uploadingMedia
                    ? "Uploading Media..."
                    : getActionLabel(postMode)}
              </button>

              <button
                type="button"
                onClick={uploadMediaToSupabase}
                disabled={uploadingMedia || !selectedMediaFile}
                style={getButtonStyle(styles.secondaryButton, uploadingMedia || !selectedMediaFile)}
              >
                {uploadingMedia ? "Uploading..." : "Upload Only"}
              </button>

              <button
                type="button"
                onClick={clearComposer}
                disabled={isBusy}
                style={getButtonStyle(styles.ghostButton, isBusy)}
              >
                Clear
              </button>
            </div>

            {composerStatus && (
              <div style={lastCreatedPostIds.length > 0 ? styles.successBox : styles.statusBox}>
                {composerStatus}
              </div>
            )}
          </div>

          <aside style={styles.card}>
            <h2 style={styles.title}>Post Preview</h2>
            <p style={styles.muted}>
              Confirm your media, mode, profile, and caption before sending.
            </p>

            {renderSocialPreview()}

            {renderFacebookPreview()}

            {uploadedMediaUrl && (
              <p style={{ marginTop: "10px", textAlign: "center" }}>
                <a href={uploadedMediaUrl} target="_blank" rel="noreferrer">
                  Open uploaded media
                </a>
              </p>
            )}

            <div style={{ display: "grid", gap: "10px", marginTop: "14px" }}>
              <div style={styles.statusBox}>
                Mode: <strong>{getActionLabel(postMode)}</strong>
              </div>

              {postMode === "schedule" && (
                <div style={styles.statusBox}>
                  Scheduled for: <strong>{formatSchedulePreview(scheduledAtLocal)}</strong>
                </div>
              )}

              <div style={styles.statusBox}>
                Platform: <strong>{selectedPlatformSummary}</strong>
                {hasInstagramSelected && (
                  <>
                    <br />
                    Instagram Format: <strong>{instagramPostType}</strong>
                  </>
                )}
                {hasFacebookSelected && (
                  <>
                    <br />
                    Facebook Type: <strong>{facebookPostType}</strong>
                  </>
                )}
                {hasYouTubeSelected && (
                  <>
                    <br />
                    YouTube Title: <strong>{youtubeTitle || "Not set"}</strong>
                    <br />
                    Category: <strong>{youtubeCategoryTitle}</strong>
                  </>
                )}
              </div>

              <div style={styles.statusBox}>
                Profiles:{" "}
                <strong>
                  {selectedChannels.length > 0
                    ? selectedChannels
                        .map((channel) => channel.displayName || channel.name)
                        .join(", ")
                    : "None selected"}
                </strong>
              </div>

              <div style={{ ...styles.statusBox, whiteSpace: "pre-wrap", minHeight: "100px" }}>
                {draftPostText || "Caption preview will appear here."}
              </div>
            </div>

            {lastCreatedPostIds.length > 0 && (
              <div style={{ marginTop: "14px" }}>
                <p style={styles.muted}>Buffer post IDs:</p>
                <ul>
                  {lastCreatedPostIds.map((postId) => (
                    <li key={postId}>{postId}</li>
                  ))}
                </ul>
              </div>
            )}
          </aside>
        </section>
      </>
    );
  }

  return (
    <div style={styles.shell}>
      <section style={styles.hero}>
        <p style={styles.eyebrow}>Social Media</p>
        <h1 style={styles.heroTitle}>Social Media Command Center</h1>
        <p style={styles.heroText}>
          Create, schedule, queue, publish, and review Instagram, Facebook, and future YouTube Shorts content from Track Adam OS.
        </p>
      </section>

      <section style={styles.card}>
        <div style={styles.cardTitleRow}>
          <div>
            <h2 style={styles.title}>Publishing Status</h2>
            <p style={styles.muted}>
              Buffer account: <strong>{bufferEmail || "Not connected yet"}</strong>
            </p>
          </div>

          {bufferEmail && <span style={styles.pill}>● Connected</span>}
        </div>

        <div style={styles.buttonRow}>
          <button
            type="button"
            onClick={testBufferConnection}
            disabled={isTestingBuffer}
            style={getButtonStyle(styles.primaryButton, isTestingBuffer)}
          >
            {isTestingBuffer ? "Connecting..." : "Connect Buffer"}
          </button>

          <button
            type="button"
            onClick={loadConnectedChannels}
            disabled={loadingChannels || !selectedOrganizationId}
            style={getButtonStyle(styles.secondaryButton, loadingChannels || !selectedOrganizationId)}
          >
            {loadingChannels ? "Refreshing..." : "Refresh Profiles"}
          </button>

          <button
            type="button"
            onClick={loadPostDashboard}
            disabled={loadingPosts || !selectedOrganizationId}
            style={getButtonStyle(styles.secondaryButton, loadingPosts || !selectedOrganizationId)}
          >
            {loadingPosts ? "Loading Dashboard..." : dashboardOpen ? "Refresh Dashboard" : "Open Dashboard"}
          </button>

          {dashboardOpen && (
            <button
              type="button"
              onClick={() => setDashboardOpen(false)}
              style={styles.ghostButton}
            >
              Collapse Dashboard
            </button>
          )}
        </div>

        {organizations.length > 0 && (
          <label style={{ display: "block", marginTop: "16px" }}>
            Buffer Organization
            <select
              value={selectedOrganizationId}
              onChange={(event) => setSelectedOrganizationId(event.target.value)}
              style={styles.select}
            >
              {organizations.map((organization) => (
                <option key={organization.id} value={organization.id}>
                  {organization.name}
                </option>
              ))}
            </select>
          </label>
        )}

        {bufferStatus && <div style={styles.statusBox}>{bufferStatus}</div>}
      </section>

      {dashboardOpen ? (
        <>
          <nav style={styles.tabs}>
            {[
              ["composer", "Composer"],
              ["calendar", "Calendar"],
              ["drafts", "Drafts"],
              ["scheduled", "Scheduled"],
              ["published", "Published"],
              ["analytics", "Analytics"],
            ].map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setActiveTab(key as SocialTab)}
                style={{
                  ...styles.tab,
                  background: activeTab === key
                    ? "linear-gradient(135deg, rgba(91,140,255,0.35), rgba(255,255,255,0.07))"
                    : styles.tab.background,
                  border: activeTab === key
                    ? "1px solid rgba(91,140,255,0.65)"
                    : styles.tab.border,
                }}
              >
                {label}
              </button>
            ))}
          </nav>

          {activeTab === "composer" && renderComposer()}
          {activeTab === "calendar" && renderCalendar()}
          {activeTab === "drafts" && renderPostsList("Drafts", "Posts saved for review inside Buffer.", draftPosts)}
          {activeTab === "scheduled" && renderPostsList("Scheduled / Queue", "Posts waiting for their dueAt time or next Buffer queue slot.", scheduledPosts)}
          {activeTab === "published" && renderPostsList("Published", "Posts that Buffer reports as sent.", publishedPosts)}
          {activeTab === "analytics" && renderAnalytics()}
        </>
      ) : (
        renderComposer()
      )}
    </div>
  );
}
