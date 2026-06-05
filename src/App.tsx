import { useEffect, useState, type Dispatch, type FormEvent, type MouseEvent, type SetStateAction } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "./supabaseClient";
import {
  createCloudCalendarTask,
  createCloudNotebook,
  createCloudNote,
  createCloudEpkProfile,
  createCloudLyricIdea,
  createCloudMarketingAsset,
  createCloudProductAsset,
  createCloudProject,
  createCloudReleaseRoadmap,
  createCloudSong,
  createCloudVisualAsset,
  createCloudWebTool,
  addCloudSongToProject,
  deleteCloudCalendarTask,
  deleteCloudNotebook,
  deleteCloudNote,
  deleteCloudEpkProfile,
  deleteCloudLyricIdea,
  deleteCloudMarketingAsset,
  deleteCloudProductAsset,
  deleteCloudProject,
  deleteCloudReleaseRoadmap,
  deleteCloudSong,
  deleteCloudVisualAsset,
  deleteCloudWebTool,
  listCloudCalendarTasks,
  listCloudNotebooks,
  listCloudNotes,
  listCloudEpkProfiles,
  listCloudLyricIdeas,
  listCloudMarketingAssets,
  listCloudProductAssets,
  listCloudProjectSongs,
  listCloudProjects,
  listCloudReleaseRoadmaps,
  listCloudSongs,
  listCloudSongFiles,
  listCloudVisualAssets,
  listCloudWebTools,
  updateCloudCalendarTask,
  updateCloudNotebook,
  updateCloudNote,
  updateCloudEpkProfile,
  updateCloudEpkProfileSection,
  updateCloudLyricIdea,
  updateCloudMarketingAsset,
  updateCloudProductAsset,
  updateCloudProductLaunchNotes,
  updateCloudProject,
  updateCloudReleaseRoadmap,
  updateCloudReleaseRoadmapRolloutPlan,
  updateCloudSong,
  updateCloudSongLyricIdea,
  createCloudSongFile,
  deleteCloudSongFile,
  uploadCloudSongFile,
  updateCloudVisualAsset,
  updateCloudWebTool,
  removeCloudSongFromProject,
} from "./lib/cloudData";
import "./App.css";
import SocialMediaCommandCenter from "./components/SocialMediaCommandCenter";
import DistributionPage from "./components/DistributionPage";
import { exchangeTooLostCode, saveTooLostConnection } from "./lib/tooLostApi";

type Song = {
  id: number | string;
  title: string;
  artist?: string;
  featured_artist?: string;
  producer?: string;
  writers?: string;
  bpm?: string;
  song_key?: string;
  genre?: string;
  mood?: string;
  status?: string;
  notes?: string;
  release_date?: string;
  distributor?: string;
  isrc?: string;
  upc?: string;
  label?: string;
  copyright_year?: string;
  copyright_owner?: string;
  publishing_admin?: string;
  pro?: string;
  soundexchange_status?: string;
  youtube_content_id?: string;
  mechanical_royalties?: string;
  split_sheet_status?: string;
  sample_clearance?: string;
  cover_art_data?: string;
  lyric_idea_id?: number | string;
};


type SongFile = {
  id: number | string;
  song_id: number | string;
  file_type?: string;
  file_label?: string;
  file_name?: string;
  file_size?: string;
  mime_type?: string;
  storage_path?: string;
  public_url?: string;
  external_url?: string;
  notes?: string;
  created_at?: string;
};

type SongFileForm = {
  file_type: string;
  file_label: string;
  external_url: string;
  notes: string;
};

const emptySongFileForm: SongFileForm = {
  file_type: "Master",
  file_label: "",
  external_url: "",
  notes: "",
};

type LyricIdea = {
  id: number | string;
  title: string;
  mood?: string;
  concept?: string;
  lyrics?: string;
  notes?: string;
  created_at?: string;
};

type MarketingAsset = {
  id: number | string;
  song_id?: number | string;
  title: string;
  platform?: string;
  content_type?: string;
  tone?: string;
  copy?: string;
  notes?: string;
  created_at?: string;
};

type VisualAsset = {
  id: number | string;
  song_id?: number | string;
  title: string;
  asset_type?: string;
  visual_style?: string;
  prompt?: string;
  notes?: string;
  reference_image_data?: string;
  reference_image_name?: string;
  created_at?: string;
};

type ProductAsset = {
  id: number | string;
  title: string;
  product_type?: string;
  price?: string;
  status?: string;
  description?: string;
  promo_angle?: string;
  launch_notes?: string;
  product_image_data?: string;
  zip_file_name?: string;
  zip_file_size?: string;
  google_drive_link?: string;
  onedrive_link?: string;
  dropbox_link?: string;
  gumroad_link?: string;
  website_link?: string;
  created_at?: string;
};

type ReleaseRoadmap = {
  id: number | string;
  song_id?: number | string;
  title: string;
  release_date?: string;
  release_type?: string;
  campaign_goal?: string;
  budget_level?: string;
  platform_focus?: string;
  rollout_plan?: string;
  checklist_notes?: string;
  created_at?: string;
};

type CalendarTask = {
  id: number | string;
  song_id?: number | string;
  product_id?: number | string;
  title: string;
  task_date?: string;
  platform?: string;
  task_type?: string;
  status?: string;
  notes?: string;
  created_at?: string;
};


type PlannerTab = "Tasks" | "Quick Capture" | "Notebooks";

type Notebook = {
  id: number | string;
  name: string;
  description?: string;
  color?: string;
  created_at?: string;
  updated_at?: string;
};

type PlannerNote = {
  id: number | string;
  notebook_id?: number | string;
  title?: string;
  body?: string;
  note_type?: string;
  tags?: string[];
  links?: string[];
  handles?: string[];
  phone_numbers?: string[];
  emails?: string[];
  pinned?: boolean;
  archived?: boolean;
  created_at?: string;
  updated_at?: string;
};

type Project = {
  id: number | string;
  title: string;
  project_type?: string;
  artist?: string;
  status?: string;
  release_date?: string;
  distributor?: string;
  upc?: string;
  label?: string;
  cover_art_data?: string;
  notes?: string;
  created_at?: string;
};

type ProjectSong = {
  id: number | string;
  project_id: number | string;
  song_id: number | string;
  created_at?: string;
};

type EpkProfile = {
  id: number | string;
  artist_name: string;
  producer_name?: string;
  location?: string;
  genre?: string;
  sound_description?: string;
  short_story?: string;
  influences?: string;
  highlights?: string;
  credits?: string;
  contact_email?: string;
  website?: string;
  social_links?: string;
  booking_link?: string;
  linked_song_id?: number | string;
  linked_project_id?: number | string;
  press_photo_data?: string;
  logo_data?: string;
  saved_bio?: string;
  saved_one_sheet?: string;
  saved_pitch?: string;
  saved_press_release?: string;
  notes?: string;
  created_at?: string;
};

type WebTool = {
  id: number | string;
  title: string;
  url: string;
  category?: string;
  description?: string;
  login_notes?: string;
  priority?: string;
  is_favorite?: number;
  preview_title?: string;
  preview_description?: string;
  preview_image_url?: string;
  preview_site_name?: string;
  preview_favicon_url?: string;
  created_at?: string;
};

type LinkPreviewResult = {
  title?: string;
  description?: string;
  image?: string;
  image_url?: string;
  site_name?: string;
  favicon?: string;
  favicon_url?: string;
  final_url?: string;
};

type DetailTab =
  | "Overview"
  | "Metadata"
  | "Rights"
  | "Lyrics"
  | "Marketing"
  | "Files";

type AppPage =
  | "Dashboard"
  | "Songs"
  | "Projects"
  | "Lyrics"
  | "Releases"
  | "Visuals"
  | "Marketing"
  | "Products"
  | "EPK Builder"
  | "Web Tools"
  | "Social Media"
  | "Distribution"
  | "Planner";

type DistributionSubPage = "overview" | "catalog" | "releases" | "analytics" | "sales" | "setup" | "developer";

type AppNotice = {
  type: "success" | "error" | "info";
  message: string;
};

type SongForm = {
  project_id: string;
  title: string;
  artist: string;
  featured_artist: string;
  producer: string;
  writers: string;
  bpm: string;
  song_key: string;
  genre: string;
  mood: string;
  status: string;
  notes: string;
  release_date: string;
  distributor: string;
  isrc: string;
  upc: string;
  label: string;
  copyright_year: string;
  copyright_owner: string;
  publishing_admin: string;
  pro: string;
  soundexchange_status: string;
  youtube_content_id: string;
  mechanical_royalties: string;
  split_sheet_status: string;
  sample_clearance: string;
  cover_art_data: string;
};

type LyricIdeaForm = {
  title: string;
  mood: string;
  concept: string;
  lyrics: string;
  notes: string;
};

type LyricsAIForm = {
  help_type: string;
  direction: string;
};

type MarketingAssetForm = {
  song_id: string;
  title: string;
  platform: string;
  content_type: string;
  tone: string;
  copy: string;
  notes: string;
};

type MarketingAIForm = {
  song_id: string;
  platform: string;
  content_type: string;
  tone: string;
  notes: string;
};

type VisualAssetForm = {
  song_id: string;
  title: string;
  asset_type: string;
  visual_style: string;
  prompt: string;
  notes: string;
  reference_image_data: string;
  reference_image_name: string;
};

type VisualAIForm = {
  song_id: string;
  asset_type: string;
  visual_style: string;
  size: string;
  notes: string;
};

type ProductAssetForm = {
  title: string;
  product_type: string;
  price: string;
  status: string;
  description: string;
  promo_angle: string;
  launch_notes: string;
  product_image_data: string;
  zip_file_name: string;
  zip_file_size: string;
  google_drive_link: string;
  onedrive_link: string;
  dropbox_link: string;
  gumroad_link: string;
  website_link: string;
};

type ProjectForm = {
  title: string;
  project_type: string;
  artist: string;
  status: string;
  release_date: string;
  distributor: string;
  upc: string;
  label: string;
  cover_art_data: string;
  notes: string;
};

type ProductAIForm = {
  help_type: string;
  platform: string;
  tone: string;
  notes: string;
};

type RoadmapAIForm = {
  help_type: string;
  timeline: string;
  tone: string;
  notes: string;
};

type ReleaseRoadmapForm = {
  song_id: string;
  title: string;
  release_date: string;
  release_type: string;
  campaign_goal: string;
  budget_level: string;
  platform_focus: string;
  rollout_plan: string;
  checklist_notes: string;
};

type CalendarTaskForm = {
  song_id: string;
  product_id: string;
  title: string;
  task_date: string;
  platform: string;
  task_type: string;
  status: string;
  notes: string;
};


type NotebookForm = {
  name: string;
  description: string;
  color: string;
};

type PlannerNoteForm = {
  notebook_id: string;
  title: string;
  body: string;
  note_type: string;
  tags: string;
  links: string;
  handles: string;
  phone_numbers: string;
  emails: string;
  pinned: string;
  archived: string;
};

type CalendarAIForm = {
  focus_type: string;
  time_available: string;
  energy_level: string;
  platform: string;
  notes: string;
};

type EpkProfileForm = {
  artist_name: string;
  producer_name: string;
  location: string;
  genre: string;
  sound_description: string;
  short_story: string;
  influences: string;
  highlights: string;
  credits: string;
  contact_email: string;
  website: string;
  social_links: string;
  booking_link: string;
  linked_song_id: string;
  linked_project_id: string;
  press_photo_data: string;
  logo_data: string;
  saved_bio: string;
  saved_one_sheet: string;
  saved_pitch: string;
  saved_press_release: string;
  notes: string;
};

type EpkAIForm = {
  help_type: string;
  audience: string;
  tone: string;
  notes: string;
};

type WebToolForm = {
  title: string;
  url: string;
  category: string;
  description: string;
  login_notes: string;
  priority: string;
  is_favorite: string;
  preview_title: string;
  preview_description: string;
  preview_image_url: string;
  preview_site_name: string;
  preview_favicon_url: string;
};

const emptyWebToolForm: WebToolForm = {
  title: "",
  url: "",
  category: "Business",
  description: "",
  login_notes: "",
  priority: "Normal",
  is_favorite: "0",
  preview_title: "",
  preview_description: "",
  preview_image_url: "",
  preview_site_name: "",
  preview_favicon_url: "",
};

const emptySongForm: SongForm = {
  project_id: "",
  title: "",
  artist: "",
  featured_artist: "",
  producer: "",
  writers: "",
  bpm: "",
  song_key: "",
  genre: "",
  mood: "",
  status: "Idea",
  notes: "",
  release_date: "",
  distributor: "",
  isrc: "",
  upc: "",
  label: "",
  copyright_year: "",
  copyright_owner: "",
  publishing_admin: "",
  pro: "",
  soundexchange_status: "",
  youtube_content_id: "",
  mechanical_royalties: "",
  split_sheet_status: "",
  sample_clearance: "",
  cover_art_data: "",
};

const emptyLyricIdeaForm: LyricIdeaForm = {
  title: "",
  mood: "",
  concept: "",
  lyrics: "",
  notes: "",
};

const emptyLyricsAIForm: LyricsAIForm = {
  help_type: "Hook Ideas",
  direction: "",
};

const emptyMarketingAssetForm: MarketingAssetForm = {
  song_id: "",
  title: "",
  platform: "",
  content_type: "",
  tone: "",
  copy: "",
  notes: "",
};

const emptyMarketingAIForm: MarketingAIForm = {
  song_id: "",
  platform: "Instagram",
  content_type: "Caption",
  tone: "Hype",
  notes: "",
};

const emptyVisualAssetForm: VisualAssetForm = {
  song_id: "",
  title: "",
  asset_type: "",
  visual_style: "",
  prompt: "",
  notes: "",
  reference_image_data: "",
  reference_image_name: "",
};

const emptyVisualAIForm: VisualAIForm = {
  song_id: "",
  asset_type: "Album Cover",
  visual_style: "Cinematic",
  size: "1024x1024",
  notes: "",
};

const emptyProductAssetForm: ProductAssetForm = {
  title: "",
  product_type: "",
  price: "",
  status: "Idea",
  description: "",
  promo_angle: "",
  launch_notes: "",
  product_image_data: "",
  zip_file_name: "",
  zip_file_size: "",
  google_drive_link: "",
  onedrive_link: "",
  dropbox_link: "",
  gumroad_link: "",
  website_link: "",
};

const emptyProjectForm: ProjectForm = {
  title: "",
  project_type: "Album",
  artist: "",
  status: "Idea",
  release_date: "",
  distributor: "",
  upc: "",
  label: "",
  cover_art_data: "",
  notes: "",
};

const emptyProductAIForm: ProductAIForm = {
  help_type: "Gumroad Description",
  platform: "Gumroad",
  tone: "Premium",
  notes: "",
};

const emptyRoadmapAIForm: RoadmapAIForm = {
  help_type: "Full Rollout Plan",
  timeline: "14 Days",
  tone: "Focused",
  notes: "",
};

const emptyReleaseRoadmapForm: ReleaseRoadmapForm = {
  song_id: "",
  title: "",
  release_date: "",
  release_type: "",
  campaign_goal: "",
  budget_level: "",
  platform_focus: "",
  rollout_plan: "",
  checklist_notes: "",
};

const emptyCalendarTaskForm: CalendarTaskForm = {
  song_id: "",
  product_id: "",
  title: "",
  task_date: "",
  platform: "",
  task_type: "",
  status: "Planned",
  notes: "",
};


const emptyNotebookForm: NotebookForm = {
  name: "",
  description: "",
  color: "#2f7cff",
};

const emptyPlannerNoteForm: PlannerNoteForm = {
  notebook_id: "",
  title: "",
  body: "",
  note_type: "Brain Dump",
  tags: "",
  links: "",
  handles: "",
  phone_numbers: "",
  emails: "",
  pinned: "0",
  archived: "0",
};

const emptyCalendarAIForm: CalendarAIForm = {
  focus_type: "All",
  time_available: "2 hours",
  energy_level: "Normal",
  platform: "General",
  notes: "",
};

const emptyEpkProfileForm: EpkProfileForm = {
  artist_name: "",
  producer_name: "",
  location: "",
  genre: "",
  sound_description: "",
  short_story: "",
  influences: "",
  highlights: "",
  credits: "",
  contact_email: "",
  website: "",
  social_links: "",
  booking_link: "",
  linked_song_id: "",
  linked_project_id: "",
  press_photo_data: "",
  logo_data: "",
  saved_bio: "",
  saved_one_sheet: "",
  saved_pitch: "",
  saved_press_release: "",
  notes: "",
};

const emptyEpkAIForm: EpkAIForm = {
  help_type: "Short Bio",
  audience: "Press / Media",
  tone: "Professional",
  notes: "",
};

function App() {
  const [authLoading, setAuthLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [authMode, setAuthMode] = useState<"sign-in" | "sign-up">("sign-in");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [authMessage, setAuthMessage] = useState("");
  const [authActionLoading, setAuthActionLoading] = useState(false);
  const [appNotice, setAppNotice] = useState<AppNotice | null>(null);
  const [appBusyMessage, setAppBusyMessage] = useState("");
  const [, setCloudDataLoading] = useState(false);
  const [cloudDataLoaded, setCloudDataLoaded] = useState(false);

  function showNotice(message: string, type: AppNotice["type"] = "info") {
    setAppNotice({ message, type });
    window.setTimeout(() => {
      setAppNotice(null);
    }, 3200);
  }

  function startAppBusy(message: string) {
    setAppBusyMessage(message);
  }

  function stopAppBusy() {
    setAppBusyMessage("");
  }

  const [songs, setSongs] = useState<Song[]>([]);
  const [songFiles, setSongFiles] = useState<SongFile[]>([]);
  const [songFileForm, setSongFileForm] = useState<SongFileForm>(emptySongFileForm);
  const [songFileUpload, setSongFileUpload] = useState<File | null>(null);
  const [songFilesLoading, setSongFilesLoading] = useState(false);
  const [songFileSaving, setSongFileSaving] = useState(false);
  const [lyricIdeas, setLyricIdeas] = useState<LyricIdea[]>([]);
  const [marketingAssets, setMarketingAssets] = useState<MarketingAsset[]>([]);
  const [visualAssets, setVisualAssets] = useState<VisualAsset[]>([]);
  const [productAssets, setProductAssets] = useState<ProductAsset[]>([]);
  const [releaseRoadmaps, setReleaseRoadmaps] = useState<ReleaseRoadmap[]>([]);
  const [calendarTasks, setCalendarTasks] = useState<CalendarTask[]>([]);
  const [notebooks, setNotebooks] = useState<Notebook[]>([]);
  const [plannerNotes, setPlannerNotes] = useState<PlannerNote[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectSongLinks, setProjectSongLinks] = useState<ProjectSong[]>([]);
  const [epkProfiles, setEpkProfiles] = useState<EpkProfile[]>([]);
  const [webTools, setWebTools] = useState<WebTool[]>([]);

  const [selectedLyricIdea, setSelectedLyricIdea] = useState<LyricIdea | null>(
    null,
  );
  const [selectedMarketingAsset, setSelectedMarketingAsset] =
    useState<MarketingAsset | null>(null);
  const [selectedVisualAsset, setSelectedVisualAsset] =
    useState<VisualAsset | null>(null);
  const [selectedProductAsset, setSelectedProductAsset] =
    useState<ProductAsset | null>(null);
  const [selectedReleaseRoadmap, setSelectedReleaseRoadmap] =
    useState<ReleaseRoadmap | null>(null);
  const [selectedCalendarTask, setSelectedCalendarTask] =
    useState<CalendarTask | null>(null);
  const [selectedPlannerNote, setSelectedPlannerNote] =
    useState<PlannerNote | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [selectedEpkProfile, setSelectedEpkProfile] =
    useState<EpkProfile | null>(null);
  const [selectedWebTool, setSelectedWebTool] =
    useState<WebTool | null>(null);

  const [activePage, setActivePage] = useState<AppPage>("Dashboard");
  const [tooLostOauthStatus, setTooLostOauthStatus] = useState<"success" | "error" | null>(null);
  const [tooLostOauthMessage, setTooLostOauthMessage] = useState("");
  const [tooLostOauthProcessed, setTooLostOauthProcessed] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [distributionSubPage, setDistributionSubPage] = useState<DistributionSubPage>("overview");
  const [plannerTab, setPlannerTab] = useState<PlannerTab>("Tasks");
  const [selectedNotebookId, setSelectedNotebookId] = useState("all");

  const [showNewSong, setShowNewSong] = useState(false);
  const [showNewProject, setShowNewProject] = useState(false);
  const [showNewLyricIdea, setShowNewLyricIdea] = useState(false);
  const [showNewMarketingAsset, setShowNewMarketingAsset] = useState(false);
  const [showNewVisualAsset, setShowNewVisualAsset] = useState(false);
  const [showNewProductAsset, setShowNewProductAsset] = useState(false);
  const [showNewEpkProfile, setShowNewEpkProfile] = useState(false);
  const [showNewWebTool, setShowNewWebTool] = useState(false);
  const [showNewReleaseRoadmap, setShowNewReleaseRoadmap] = useState(false);
  const [showNewCalendarTask, setShowNewCalendarTask] = useState(false);
  const [showNewNotebook, setShowNewNotebook] = useState(false);
  const [showEditNotebook, setShowEditNotebook] = useState(false);
  const [selectedNotebookForEdit, setSelectedNotebookForEdit] = useState<Notebook | null>(null);
  const [showNewPlannerNote, setShowNewPlannerNote] = useState(false);

  const [selectedSong, setSelectedSong] = useState<Song | null>(null);
  const [activeDetailTab, setActiveDetailTab] = useState<DetailTab>("Overview");

  const [newSong, setNewSong] = useState<SongForm>(emptySongForm);
  const [newProject, setNewProject] = useState<ProjectForm>(emptyProjectForm);
  const [projectSongToAdd, setProjectSongToAdd] = useState("");
  const [newLyricIdea, setNewLyricIdea] =
    useState<LyricIdeaForm>(emptyLyricIdeaForm);
  const [lyricsAIForm, setLyricsAIForm] =
    useState<LyricsAIForm>(emptyLyricsAIForm);
  const [lyricsAIOutput, setLyricsAIOutput] = useState("");
  const [lyricsAILoading, setLyricsAILoading] = useState(false);
  const [lyricsAIError, setLyricsAIError] = useState("");
  const [newMarketingAsset, setNewMarketingAsset] =
    useState<MarketingAssetForm>(emptyMarketingAssetForm);
  const [marketingAIForm, setMarketingAIForm] =
    useState<MarketingAIForm>(emptyMarketingAIForm);
  const [marketingAIOutput, setMarketingAIOutput] = useState("");
  const [marketingAILoading, setMarketingAILoading] = useState(false);
  const [marketingAIError, setMarketingAIError] = useState("");
  const [newVisualAsset, setNewVisualAsset] =
    useState<VisualAssetForm>(emptyVisualAssetForm);
  const [visualAIForm, setVisualAIForm] =
    useState<VisualAIForm>(emptyVisualAIForm);
  const [visualAIOutput, setVisualAIOutput] = useState("");
  const [visualAILoading, setVisualAILoading] = useState(false);
  const [visualAIError, setVisualAIError] = useState("");
  const [visualAIImage, setVisualAIImage] = useState("");
  const [visualAIImageLoading, setVisualAIImageLoading] = useState(false);
  const [visualAIImageError, setVisualAIImageError] = useState("");
  const [visualAIReferenceImage, setVisualAIReferenceImage] = useState("");
  const [visualAIReferenceImageName, setVisualAIReferenceImageName] = useState("");
  const [newProductAsset, setNewProductAsset] = useState<ProductAssetForm>(
    emptyProductAssetForm,
  );
  const [productAIForm, setProductAIForm] =
    useState<ProductAIForm>(emptyProductAIForm);
  const [productAIOutput, setProductAIOutput] = useState("");
  const [productAILoading, setProductAILoading] = useState(false);
  const [productAIError, setProductAIError] = useState("");
  const [newEpkProfile, setNewEpkProfile] =
    useState<EpkProfileForm>(emptyEpkProfileForm);
  const [newWebTool, setNewWebTool] = useState<WebToolForm>(emptyWebToolForm);
  const [webToolPreviewLoading, setWebToolPreviewLoading] = useState(false);
  const [webToolPreviewError, setWebToolPreviewError] = useState("");
  const [epkAIForm, setEpkAIForm] = useState<EpkAIForm>(emptyEpkAIForm);
  const [epkAIOutput, setEpkAIOutput] = useState("");
  const [epkAILoading, setEpkAILoading] = useState(false);
  const [epkAIError, setEpkAIError] = useState("");
  const [newReleaseRoadmap, setNewReleaseRoadmap] =
    useState<ReleaseRoadmapForm>(emptyReleaseRoadmapForm);
  const [roadmapAIForm, setRoadmapAIForm] =
    useState<RoadmapAIForm>(emptyRoadmapAIForm);
  const [roadmapAIOutput, setRoadmapAIOutput] = useState("");
  const [roadmapAILoading, setRoadmapAILoading] = useState(false);
  const [roadmapAIError, setRoadmapAIError] = useState("");
  const [newCalendarTask, setNewCalendarTask] = useState<CalendarTaskForm>(
    emptyCalendarTaskForm,
  );
  const [newNotebook, setNewNotebook] = useState<NotebookForm>(emptyNotebookForm);
  const [editNotebook, setEditNotebook] = useState<NotebookForm>(emptyNotebookForm);
  const [newPlannerNote, setNewPlannerNote] = useState<PlannerNoteForm>(
    emptyPlannerNoteForm,
  );
  const [quickCaptureNote, setQuickCaptureNote] = useState<PlannerNoteForm>(
    emptyPlannerNoteForm,
  );
  const [calendarAIForm, setCalendarAIForm] =
    useState<CalendarAIForm>(emptyCalendarAIForm);
  const [calendarAIOutput, setCalendarAIOutput] = useState("");
  const [calendarAILoading, setCalendarAILoading] = useState(false);
  const [calendarAIError, setCalendarAIError] = useState("");

  const [showEditSong, setShowEditSong] = useState(false);
  const [editSong, setEditSong] = useState<SongForm>(emptySongForm);

  const [showEditProject, setShowEditProject] = useState(false);
  const [editProject, setEditProject] = useState<ProjectForm>(emptyProjectForm);
  const [showEditLyricIdea, setShowEditLyricIdea] = useState(false);
  const [editLyricIdea, setEditLyricIdea] =
    useState<LyricIdeaForm>(emptyLyricIdeaForm);
  const [showEditMarketingAsset, setShowEditMarketingAsset] = useState(false);
  const [editMarketingAsset, setEditMarketingAsset] =
    useState<MarketingAssetForm>(emptyMarketingAssetForm);
  const [showEditVisualAsset, setShowEditVisualAsset] = useState(false);
  const [editVisualAsset, setEditVisualAsset] =
    useState<VisualAssetForm>(emptyVisualAssetForm);
  const [showEditProductAsset, setShowEditProductAsset] = useState(false);
  const [editProductAsset, setEditProductAsset] =
    useState<ProductAssetForm>(emptyProductAssetForm);
  const [showEditReleaseRoadmap, setShowEditReleaseRoadmap] = useState(false);
  const [editReleaseRoadmap, setEditReleaseRoadmap] =
    useState<ReleaseRoadmapForm>(emptyReleaseRoadmapForm);
  const [showEditCalendarTask, setShowEditCalendarTask] = useState(false);
  const [editCalendarTask, setEditCalendarTask] =
    useState<CalendarTaskForm>(emptyCalendarTaskForm);
  const [showEditPlannerNote, setShowEditPlannerNote] = useState(false);
  const [editPlannerNote, setEditPlannerNote] = useState<PlannerNoteForm>(
    emptyPlannerNoteForm,
  );
  const [showEditEpkProfile, setShowEditEpkProfile] = useState(false);
  const [editEpkProfile, setEditEpkProfile] =
    useState<EpkProfileForm>(emptyEpkProfileForm);
  const [showEditWebTool, setShowEditWebTool] = useState(false);
  const [editWebTool, setEditWebTool] = useState<WebToolForm>(emptyWebToolForm);
  const [editWebToolPreviewLoading, setEditWebToolPreviewLoading] = useState(false);
  const [editWebToolPreviewError, setEditWebToolPreviewError] = useState("");

  useEffect(() => {
    const nativeAlert = window.alert;

    window.alert = (message?: unknown) => {
      const text = String(message ?? "");
      const isError = /could not|did not|error|required|must|missing|invalid|failed|fail|not ready|sign in|select|choose|unable/i.test(text);

      setAppBusyMessage("");
      setAppNotice({
        type: isError ? "error" : "success",
        message: text || (isError ? "Something needs attention." : "Done."),
      });

      window.setTimeout(() => {
        setAppNotice(null);
      }, isError ? 5200 : 3200);
    };

    return () => {
      window.alert = nativeAlert;
    };
  }, []);

  function startActionFeedback(message: string) {
    setAppBusyMessage(message);
    window.setTimeout(() => {
      setAppBusyMessage((currentMessage) =>
        currentMessage === message ? "" : currentMessage,
      );
    }, 6500);
  }

  function handleGlobalActionFeedback(event: MouseEvent<HTMLDivElement>) {
    const target = event.target as HTMLElement | null;
    const button = target?.closest("button");

    if (!button || button.disabled) return;

    const rawLabel = (button.textContent || "").replace(/\s+/g, " ").trim();
    const label = rawLabel.toLowerCase();

    if (!label || label === "×" || button.classList.contains("sidebar-collapse-btn")) {
      return;
    }

    if (label.includes("sign out") || label.includes("open link")) {
      return;
    }

    if (label.includes("saving") || label.includes("generating") || label.includes("loading")) {
      return;
    }

    if (label.includes("save")) {
      startActionFeedback("Saving changes...");
      return;
    }

    if (label.includes("update") || label.includes("edit")) {
      startActionFeedback("Updating record...");
      return;
    }

    if (label.includes("delete")) {
      startActionFeedback("Deleting record...");
      return;
    }

    if (label.includes("add") || label.includes("create")) {
      startActionFeedback("Preparing record...");
      return;
    }

    if (label.includes("link") || label.includes("connect") || label.includes("unlink")) {
      startActionFeedback("Updating connection...");
      return;
    }
  }


  async function callTrackAdamAI(
    action: string,
    payload: Record<string, unknown>,
  ): Promise<string> {
    const { data, error } = await supabase.functions.invoke<{ text: string }>(
      "track-adam-ai",
      {
        body: {
          action,
          payload,
        },
      },
    );

    if (error) {
      throw new Error(error.message);
    }

    if (!data?.text) {
      throw new Error("The AI function responded, but no text was returned.");
    }

    return data.text;
  }

  useEffect(() => {
    let isMounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!isMounted) return;
      setSession(data.session);
      setAuthLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setAuthLoading(false);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (authLoading || !session || tooLostOauthProcessed) return;

    const url = new URL(window.location.href);
    const isTooLostCallback =
      window.location.pathname === "/api/auth/callback/toolost" ||
      url.searchParams.get("toolost_callback") === "1";

    if (!isTooLostCallback) return;

    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");
    const error = url.searchParams.get("error");
    const errorDescription = url.searchParams.get("error_description");

    setTooLostOauthProcessed(true);
    setActivePage("Distribution");

    async function finishTooLostOAuth() {
      if (error) {
        setTooLostOauthStatus("error");
        setTooLostOauthMessage(errorDescription || error);
        window.history.replaceState({}, document.title, "/?toolost=error");
        return;
      }

      try {
        const tokenResponse = await exchangeTooLostCode(code || "", state);
        await saveTooLostConnection(tokenResponse);
        setTooLostOauthStatus("success");
        setTooLostOauthMessage("Too Lost Sandbox connected successfully. Run the /me test next.");
        window.history.replaceState({}, document.title, "/?toolost=success");
      } catch (oauthError) {
        setTooLostOauthStatus("error");
        setTooLostOauthMessage(oauthError instanceof Error ? oauthError.message : "Too Lost connection failed.");
        window.history.replaceState({}, document.title, "/?toolost=error");
      }
    }

    void finishTooLostOAuth();
  }, [authLoading, session, tooLostOauthProcessed]);

  async function handleAuthSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAuthError("");
    setAuthMessage("");

    if (!authEmail.trim() || !authPassword.trim()) {
      setAuthError("Enter your email and password.");
      return;
    }

    try {
      setAuthActionLoading(true);

      const result =
        authMode === "sign-up"
          ? await supabase.auth.signUp({
              email: authEmail.trim(),
              password: authPassword,
            })
          : await supabase.auth.signInWithPassword({
              email: authEmail.trim(),
              password: authPassword,
            });

      if (result.error) {
        setAuthError(result.error.message);
        return;
      }

      if (authMode === "sign-up") {
        setAuthMessage(
          "Account created. If email confirmation is enabled, check your inbox before signing in.",
        );
      }
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : String(error));
    } finally {
      setAuthActionLoading(false);
    }
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    setActivePage("Dashboard");
  }

  useEffect(() => {
    let isMounted = true;

    async function loadCloudWorkspace() {
      if (!session) {
        setCloudDataLoading(false);
        setCloudDataLoaded(false);
        setSongs([]);
        setSelectedSong(null);
        setSongFiles([]);
        setProjects([]);
        setSelectedProject(null);
        setProjectSongLinks([]);
        setWebTools([]);
        setSelectedWebTool(null);
        setEpkProfiles([]);
        setSelectedEpkProfile(null);
        setCalendarTasks([]);
        setSelectedCalendarTask(null);
        setNotebooks([]);
        setPlannerNotes([]);
        setSelectedPlannerNote(null);
        setLyricIdeas([]);
        setSelectedLyricIdea(null);
        setMarketingAssets([]);
        setSelectedMarketingAsset(null);
        setVisualAssets([]);
        setSelectedVisualAsset(null);
        setProductAssets([]);
        setSelectedProductAsset(null);
        setReleaseRoadmaps([]);
        setSelectedReleaseRoadmap(null);
        return;
      }

      setCloudDataLoaded(false);
      setCloudDataLoading(true);

      try {
        await Promise.all([
          refreshSongs(),
          refreshProjects(),
          refreshWebTools(),
          refreshEpkProfiles(),
          refreshCalendarTasks(),
          refreshNotebooks(),
          refreshPlannerNotes(),
          refreshLyricIdeas(),
          refreshMarketingAssets(),
          refreshVisualAssets(),
          refreshProductAssets(),
          refreshReleaseRoadmaps(),
        ]);
      } finally {
        if (isMounted) {
          setCloudDataLoading(false);
          setCloudDataLoaded(true);
        }
      }
    }

    loadCloudWorkspace();

    return () => {
      isMounted = false;
    };
  }, [session]);

  function songToForm(song: Song): SongForm {
    const firstProjectLink = projectSongLinks.find(
      (link) => String(link.song_id) === String(song.id),
    );

    return {
      project_id: firstProjectLink ? String(firstProjectLink.project_id) : "",
      title: song.title || "",
      artist: song.artist || "",
      featured_artist: song.featured_artist || "",
      producer: song.producer || "",
      writers: song.writers || "",
      bpm: song.bpm || "",
      song_key: song.song_key || "",
      genre: song.genre || "",
      mood: song.mood || "",
      status: song.status || "Idea",
      notes: song.notes || "",
      release_date: song.release_date || "",
      distributor: song.distributor || "",
      isrc: song.isrc || "",
      upc: song.upc || "",
      label: song.label || "",
      copyright_year: song.copyright_year || "",
      copyright_owner: song.copyright_owner || "",
      publishing_admin: song.publishing_admin || "",
      pro: song.pro || "",
      soundexchange_status: song.soundexchange_status || "",
      youtube_content_id: song.youtube_content_id || "",
      mechanical_royalties: song.mechanical_royalties || "",
      split_sheet_status: song.split_sheet_status || "",
      sample_clearance: song.sample_clearance || "",
      cover_art_data: song.cover_art_data || "",
    };
  }

  function projectToForm(project: Project): ProjectForm {
    return {
      title: project.title || "",
      project_type: project.project_type || "",
      artist: project.artist || "",
      status: project.status || "Idea",
      release_date: project.release_date || "",
      distributor: project.distributor || "",
      upc: project.upc || "",
      label: project.label || "",
      cover_art_data: project.cover_art_data || "",
      notes: project.notes || "",
    };
  }

  function lyricIdeaToForm(idea: LyricIdea): LyricIdeaForm {
    return {
      title: idea.title || "",
      mood: idea.mood || "",
      concept: idea.concept || "",
      lyrics: idea.lyrics || "",
      notes: idea.notes || "",
    };
  }

  function marketingAssetToForm(asset: MarketingAsset): MarketingAssetForm {
    return {
      song_id: asset.song_id ? String(asset.song_id) : "",
      title: asset.title || "",
      platform: asset.platform || "",
      content_type: asset.content_type || "",
      tone: asset.tone || "",
      copy: asset.copy || "",
      notes: asset.notes || "",
    };
  }

  function visualAssetToForm(asset: VisualAsset): VisualAssetForm {
    return {
      song_id: asset.song_id ? String(asset.song_id) : "",
      title: asset.title || "",
      asset_type: asset.asset_type || "",
      visual_style: asset.visual_style || "",
      prompt: asset.prompt || "",
      notes: asset.notes || "",
      reference_image_data: asset.reference_image_data || "",
      reference_image_name: asset.reference_image_name || "",
    };
  }

  function productAssetToForm(asset: ProductAsset): ProductAssetForm {
    return {
      title: asset.title || "",
      product_type: asset.product_type || "",
      price: asset.price || "",
      status: asset.status || "Idea",
      description: asset.description || "",
      promo_angle: asset.promo_angle || "",
      launch_notes: asset.launch_notes || "",
      product_image_data: asset.product_image_data || "",
      zip_file_name: asset.zip_file_name || "",
      zip_file_size: asset.zip_file_size || "",
      google_drive_link: asset.google_drive_link || "",
      onedrive_link: asset.onedrive_link || "",
      dropbox_link: asset.dropbox_link || "",
      gumroad_link: asset.gumroad_link || "",
      website_link: asset.website_link || "",
    };
  }

  function releaseRoadmapToForm(roadmap: ReleaseRoadmap): ReleaseRoadmapForm {
    return {
      song_id: roadmap.song_id ? String(roadmap.song_id) : "",
      title: roadmap.title || "",
      release_date: roadmap.release_date || "",
      release_type: roadmap.release_type || "",
      campaign_goal: roadmap.campaign_goal || "",
      budget_level: roadmap.budget_level || "",
      platform_focus: roadmap.platform_focus || "",
      rollout_plan: roadmap.rollout_plan || "",
      checklist_notes: roadmap.checklist_notes || "",
    };
  }

  function calendarTaskToForm(task: CalendarTask): CalendarTaskForm {
    return {
      song_id: task.song_id ? String(task.song_id) : "",
      product_id: task.product_id ? String(task.product_id) : "",
      title: task.title || "",
      task_date: task.task_date || "",
      platform: task.platform || "",
      task_type: task.task_type || "",
      status: task.status || "Planned",
      notes: task.notes || "",
    };
  }


  function notebookToForm(notebook: Notebook): NotebookForm {
    return {
      name: notebook.name || "",
      description: notebook.description || "",
      color: notebook.color || "#2f7cff",
    };
  }


  function plannerNoteToForm(note: PlannerNote): PlannerNoteForm {
    return {
      notebook_id: note.notebook_id ? String(note.notebook_id) : "",
      title: note.title || "",
      body: note.body || "",
      note_type: note.note_type || "Brain Dump",
      tags: (note.tags || []).join(", "),
      links: (note.links || []).join("\n"),
      handles: (note.handles || []).join(", "),
      phone_numbers: (note.phone_numbers || []).join(", "),
      emails: (note.emails || []).join(", "),
      pinned: note.pinned ? "1" : "0",
      archived: note.archived ? "1" : "0",
    };
  }

  function epkProfileToForm(profile: EpkProfile): EpkProfileForm {
    return {
      artist_name: profile.artist_name || "",
      producer_name: profile.producer_name || "",
      location: profile.location || "",
      genre: profile.genre || "",
      sound_description: profile.sound_description || "",
      short_story: profile.short_story || "",
      influences: profile.influences || "",
      highlights: profile.highlights || "",
      credits: profile.credits || "",
      contact_email: profile.contact_email || "",
      website: profile.website || "",
      social_links: profile.social_links || "",
      booking_link: profile.booking_link || "",
      linked_song_id: profile.linked_song_id ? String(profile.linked_song_id) : "",
      linked_project_id: profile.linked_project_id ? String(profile.linked_project_id) : "",
      press_photo_data: profile.press_photo_data || "",
      logo_data: profile.logo_data || "",
      saved_bio: profile.saved_bio || "",
      saved_one_sheet: profile.saved_one_sheet || "",
      saved_pitch: profile.saved_pitch || "",
      saved_press_release: profile.saved_press_release || "",
      notes: profile.notes || "",
    };
  }

  function webToolToForm(tool: WebTool): WebToolForm {
    return {
      title: tool.title || "",
      url: tool.url || "",
      category: tool.category || "Business",
      description: tool.description || "",
      login_notes: tool.login_notes || "",
      priority: tool.priority || "Normal",
      is_favorite: tool.is_favorite ? "1" : "0",
      preview_title: tool.preview_title || "",
      preview_description: tool.preview_description || "",
      preview_image_url: tool.preview_image_url || "",
      preview_site_name: tool.preview_site_name || "",
      preview_favicon_url: tool.preview_favicon_url || "",
    };
  }

  function handleCoverArtUpload(
    file: File | null,
    setForm: Dispatch<SetStateAction<SongForm>>,
  ) {
    if (!file) return;

    const reader = new FileReader();

    reader.onload = () => {
      setForm((previousSong) => ({
        ...previousSong,
        cover_art_data: reader.result as string,
      }));
    };

    reader.readAsDataURL(file);
  }

  function handleProjectCoverArtUpload(file: File | null) {
    if (!file) return;

    const reader = new FileReader();

    reader.onload = () => {
      setNewProject((previousProject) => ({
        ...previousProject,
        cover_art_data: reader.result as string,
      }));
    };

    reader.readAsDataURL(file);
  }

  function handleEpkPhotoUpload(file: File | null) {
    if (!file) return;

    const reader = new FileReader();

    reader.onload = () => {
      setNewEpkProfile((previousProfile) => ({
        ...previousProfile,
        press_photo_data: reader.result as string,
      }));
    };

    reader.readAsDataURL(file);
  }

  function handleEpkLogoUpload(file: File | null) {
    if (!file) return;

    const reader = new FileReader();

    reader.onload = () => {
      setNewEpkProfile((previousProfile) => ({
        ...previousProfile,
        logo_data: reader.result as string,
      }));
    };

    reader.readAsDataURL(file);
  }

  function handleProductImageUpload(file: File | null) {
    if (!file) return;

    const reader = new FileReader();

    reader.onload = () => {
      setNewProductAsset((previousProduct) => ({
        ...previousProduct,
        product_image_data: reader.result as string,
      }));
    };

    reader.readAsDataURL(file);
  }

  function handleProductZipUpload(file: File | null) {
    if (!file) return;

    const fileSizeInMb = `${(file.size / (1024 * 1024)).toFixed(2)} MB`;

    setNewProductAsset((previousProduct) => ({
      ...previousProduct,
      zip_file_name: file.name,
      zip_file_size: fileSizeInMb,
    }));
  }

  function handleNewVisualAssetReferenceImageUpload(file: File | null) {
    if (!file) return;

    const reader = new FileReader();

    reader.onload = () => {
      setNewVisualAsset((previousAsset) => ({
        ...previousAsset,
        reference_image_data: reader.result as string,
        reference_image_name: file.name,
      }));
    };

    reader.readAsDataURL(file);
  }

  function clearNewVisualAssetReferenceImage() {
    setNewVisualAsset((previousAsset) => ({
      ...previousAsset,
      reference_image_data: "",
      reference_image_name: "",
    }));
  }

  function clearVisualReferenceImage() {
    setVisualAIReferenceImage("");
    setVisualAIReferenceImageName("");
    setVisualAIImageError("");
  }

  function handleEditProjectCoverArtUpload(file: File | null) {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setEditProject((previousProject) => ({
        ...previousProject,
        cover_art_data: reader.result as string,
      }));
    };
    reader.readAsDataURL(file);
  }

  function handleEditVisualReferenceImageUpload(file: File | null) {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setEditVisualAsset((previousAsset) => ({
        ...previousAsset,
        reference_image_data: reader.result as string,
        reference_image_name: file.name,
      }));
    };
    reader.readAsDataURL(file);
  }

  function clearEditVisualReferenceImage() {
    setEditVisualAsset((previousAsset) => ({
      ...previousAsset,
      reference_image_data: "",
      reference_image_name: "",
    }));
  }

  function handleEditProductImageUpload(file: File | null) {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setEditProductAsset((previousProduct) => ({
        ...previousProduct,
        product_image_data: reader.result as string,
      }));
    };
    reader.readAsDataURL(file);
  }

  function handleEditProductZipUpload(file: File | null) {
    if (!file) return;

    const fileSizeInMb = `${(file.size / (1024 * 1024)).toFixed(2)} MB`;
    setEditProductAsset((previousProduct) => ({
      ...previousProduct,
      zip_file_name: file.name,
      zip_file_size: fileSizeInMb,
    }));
  }

  function handleEditEpkPhotoUpload(file: File | null) {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setEditEpkProfile((previousProfile) => ({
        ...previousProfile,
        press_photo_data: reader.result as string,
      }));
    };
    reader.readAsDataURL(file);
  }

  function handleEditEpkLogoUpload(file: File | null) {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setEditEpkProfile((previousProfile) => ({
        ...previousProfile,
        logo_data: reader.result as string,
      }));
    };
    reader.readAsDataURL(file);
  }

  async function refreshSongs() {
    if (!session) {
      setSongs([]);
      return;
    }

    try {
      const updatedSongs = await listCloudSongs();
      setSongs(updatedSongs as Song[]);
    } catch (error) {
      console.error("Cloud songs load error:", error);
      alert(error instanceof Error ? error.message : String(error));
    }
  }


  async function refreshSongFiles(songId?: number | string) {
    const targetSongId = songId || selectedSong?.id;

    if (!session || !targetSongId) {
      setSongFiles([]);
      return;
    }

    try {
      setSongFilesLoading(true);
      const updatedFiles = await listCloudSongFiles(String(targetSongId));
      setSongFiles(updatedFiles as SongFile[]);
    } catch (error) {
      console.error("Cloud song files load error:", error);
      alert(error instanceof Error ? error.message : String(error));
    } finally {
      setSongFilesLoading(false);
    }
  }

  async function saveSongFile() {
    if (!session) {
      alert("Sign in before saving song files.");
      return;
    }

    if (!selectedSong?.id) {
      alert("Open a song before adding files.");
      return;
    }

    if (!songFileUpload && !songFileForm.external_url.trim()) {
      alert("Upload a file or paste a cloud link first.");
      return;
    }

    try {
      setSongFileSaving(true);

      const uploadedFile = songFileUpload
        ? await uploadCloudSongFile(songFileUpload, String(selectedSong.id), songFileForm.file_type)
        : null;

      await createCloudSongFile({
        song_id: String(selectedSong.id),
        file_type: songFileForm.file_type,
        file_label: songFileForm.file_label || uploadedFile?.file_name || "Song file",
        file_name: uploadedFile?.file_name || "",
        file_size: uploadedFile?.file_size || "",
        mime_type: uploadedFile?.mime_type || "",
        storage_path: uploadedFile?.storage_path || "",
        public_url: uploadedFile?.public_url || "",
        external_url: songFileForm.external_url.trim(),
        notes: songFileForm.notes,
      });

      setSongFileForm(emptySongFileForm);
      setSongFileUpload(null);
      await refreshSongFiles(selectedSong.id);
      alert("Song file saved.");
    } catch (error) {
      console.error("Save song file error:", error);
      alert(error instanceof Error ? error.message : String(error));
    } finally {
      setSongFileSaving(false);
    }
  }

  async function removeSongFile(fileId: number | string) {
    if (!session) {
      alert("Sign in before deleting song files.");
      return;
    }

    const confirmed = confirm("Delete this file/link from the song record?");

    if (!confirmed) return;

    try {
      await deleteCloudSongFile(String(fileId));
      await refreshSongFiles(selectedSong?.id);
      alert("Song file removed.");
    } catch (error) {
      console.error("Delete song file error:", error);
      alert(error instanceof Error ? error.message : String(error));
    }
  }

  function formatSongFileTypeLabel(file: SongFile) {
    const parts = [file.file_type, file.file_label].filter(Boolean);
    return parts.length > 0 ? parts.join(" • ") : "Song File";
  }

  function getSongFileLink(file: SongFile) {
    return file.public_url || file.external_url || "";
  }

  async function refreshProjects() {
    if (!session) {
      setProjects([]);
      setProjectSongLinks([]);
      return;
    }

    try {
      const [updatedProjects, updatedProjectSongLinks] = await Promise.all([
        listCloudProjects(),
        listCloudProjectSongs(),
      ]);

      setProjects(updatedProjects as Project[]);
      setProjectSongLinks(updatedProjectSongLinks as ProjectSong[]);
    } catch (error) {
      console.error("Cloud projects load error:", error);
      alert(error instanceof Error ? error.message : String(error));
    }
  }

  async function refreshEpkProfiles() {
    if (!session) {
      setEpkProfiles([]);
      return;
    }

    try {
      const updatedProfiles = await listCloudEpkProfiles();
      setEpkProfiles(updatedProfiles as EpkProfile[]);
    } catch (error) {
      console.error("Load cloud EPK profiles error:", error);
      alert(error instanceof Error ? error.message : String(error));
    }
  }

  async function refreshWebTools() {
    if (!session) {
      setWebTools([]);
      return;
    }

    try {
      const updatedTools = await listCloudWebTools();
      setWebTools(updatedTools as WebTool[]);
    } catch (error) {
      console.error("Load cloud web tools error:", error);
      alert(error instanceof Error ? error.message : String(error));
    }
  }


  async function refreshLyricIdeas() {
    if (!session) {
      setLyricIdeas([]);
      return;
    }

    try {
      const updatedIdeas = await listCloudLyricIdeas();
      setLyricIdeas(updatedIdeas as LyricIdea[]);
    } catch (error) {
      console.error("Cloud lyric ideas load error:", error);
      alert(error instanceof Error ? error.message : String(error));
    }
  }

  async function refreshMarketingAssets() {
    if (!session) {
      setMarketingAssets([]);
      return;
    }

    try {
      const updatedAssets = await listCloudMarketingAssets();
      setMarketingAssets(updatedAssets as MarketingAsset[]);
    } catch (error) {
      console.error("Cloud marketing assets load error:", error);
      alert(error instanceof Error ? error.message : String(error));
    }
  }

  async function refreshVisualAssets() {
    if (!session) {
      setVisualAssets([]);
      return;
    }

    try {
      const updatedAssets = await listCloudVisualAssets();
      setVisualAssets(updatedAssets as VisualAsset[]);
    } catch (error) {
      console.error("Cloud visual assets load error:", error);
      alert(error instanceof Error ? error.message : String(error));
    }
  }

  async function refreshProductAssets() {
    if (!session) {
      setProductAssets([]);
      return;
    }

    try {
      const updatedAssets = await listCloudProductAssets();
      setProductAssets(updatedAssets as ProductAsset[]);
    } catch (error) {
      console.error("Cloud product assets load error:", error);
      alert(error instanceof Error ? error.message : String(error));
    }
  }

  async function refreshReleaseRoadmaps() {
    if (!session) {
      setReleaseRoadmaps([]);
      return;
    }

    try {
      const updatedRoadmaps = await listCloudReleaseRoadmaps();
      setReleaseRoadmaps(updatedRoadmaps as ReleaseRoadmap[]);
    } catch (error) {
      console.error("Cloud release roadmaps load error:", error);
      alert(error instanceof Error ? error.message : String(error));
    }
  }

  async function refreshCalendarTasks() {
    if (!session) return;

    try {
      const updatedTasks = await listCloudCalendarTasks();
      setCalendarTasks(updatedTasks as CalendarTask[]);
    } catch (error) {
      console.error("Cloud calendar tasks load error:", error);
      alert(error instanceof Error ? error.message : String(error));
    }
  }


  async function refreshNotebooks() {
    if (!session) {
      setNotebooks([]);
      return;
    }

    try {
      const updatedNotebooks = await listCloudNotebooks();
      setNotebooks(updatedNotebooks as Notebook[]);
    } catch (error) {
      console.error("Cloud notebooks load error:", error);
      showNotice(error instanceof Error ? error.message : String(error), "error");
    }
  }

  async function refreshPlannerNotes() {
    if (!session) {
      setPlannerNotes([]);
      return;
    }

    try {
      const updatedNotes = await listCloudNotes();
      setPlannerNotes(updatedNotes as PlannerNote[]);
    } catch (error) {
      console.error("Cloud planner notes load error:", error);
      showNotice(error instanceof Error ? error.message : String(error), "error");
    }
  }

  async function saveSong() {
    if (!session) {
      alert("Sign in before saving a song.");
      return;
    }

    if (!newSong.title.trim()) {
      alert("Song title is required.");
      return;
    }

    try {
      const createdSong = await createCloudSong(newSong);

      if (newSong.project_id && createdSong.id) {
        await addCloudSongToProject(String(newSong.project_id), String(createdSong.id));
      }

      await refreshSongs();
      await refreshProjects();
      setNewSong(emptySongForm);
      setShowNewSong(false);
    } catch (error) {
      console.error("Save cloud song error:", error);
      alert(error instanceof Error ? error.message : String(error));
    }
  }

  async function saveProject() {
    if (!session) {
      alert("Sign in before saving a project.");
      return;
    }

    if (!newProject.title.trim()) {
      alert("Project title is required.");
      return;
    }

    try {
      await createCloudProject(newProject);
      await refreshProjects();
      setNewProject(emptyProjectForm);
      setShowNewProject(false);
    } catch (error) {
      console.error("Save cloud project error:", error);
      alert(error instanceof Error ? error.message : String(error));
    }
  }

  async function deleteProject(projectId: number | string) {
    if (!session) {
      alert("Sign in before deleting a project.");
      return;
    }

    const confirmed = confirm(
      "Are you sure you want to delete this project? This cannot be undone.",
    );

    if (!confirmed) return;

    try {
      await deleteCloudProject(String(projectId));
      await refreshProjects();

      if (String(selectedProject?.id) === String(projectId)) {
        setSelectedProject(null);
      }
    } catch (error) {
      console.error("Delete cloud project error:", error);
      alert(error instanceof Error ? error.message : String(error));
    }
  }

  function startNewSongForProject(project: Project) {
    setNewSong({
      ...emptySongForm,
      project_id: String(project.id),
      artist: project.artist || "",
      status: "Idea",
      release_date: project.release_date || "",
      distributor: project.distributor || "",
      upc: project.upc || "",
      label: project.label || "",
    });
    setShowNewSong(true);
  }

  async function addSongToProject() {
    if (!session || !selectedProject) {
      alert("Select a project first.");
      return;
    }

    if (!projectSongToAdd) {
      alert("Choose a song to add.");
      return;
    }

    try {
      await addCloudSongToProject(String(selectedProject.id), String(projectSongToAdd));
      await refreshProjects();
      setProjectSongToAdd("");
    } catch (error) {
      console.error("Add cloud song to project error:", error);
      alert(error instanceof Error ? error.message : String(error));
    }
  }

  async function removeSongFromProject(songId: number | string) {
    if (!session || !selectedProject) return;

    try {
      await removeCloudSongFromProject(String(selectedProject.id), String(songId));
      await refreshProjects();
    } catch (error) {
      console.error("Remove cloud song from project error:", error);
      alert(error instanceof Error ? error.message : String(error));
    }
  }

  async function saveLyricIdea() {
    if (!session) {
      alert("Sign in before saving a lyric idea.");
      return;
    }

    if (!newLyricIdea.title.trim()) {
      alert("Idea title is required.");
      return;
    }

    try {
      await createCloudLyricIdea(newLyricIdea);
      await refreshLyricIdeas();
      setNewLyricIdea(emptyLyricIdeaForm);
      setShowNewLyricIdea(false);
    } catch (error) {
      console.error("Save cloud lyric idea error:", error);
      alert(error instanceof Error ? error.message : String(error));
    }
  }

  async function generateLyricsHelpWithAI() {
    setLyricsAIError("");
    setLyricsAIOutput("");

    if (!selectedLyricIdea) {
      alert("Select a lyric idea first.");
      return;
    }

    try {
      setLyricsAILoading(true);

      const result = await callTrackAdamAI("lyrics", {
        title: selectedLyricIdea.title || "",
        mood: selectedLyricIdea.mood || "",
        concept: selectedLyricIdea.concept || "",
        lyrics: selectedLyricIdea.lyrics || "",
        notes: selectedLyricIdea.notes || "",
        help_type: lyricsAIForm.help_type,
        direction: lyricsAIForm.direction,
      });

      setLyricsAIOutput(result);
    } catch (error) {
      console.error("Generate lyrics help error:", error);
      setLyricsAIError(error instanceof Error ? error.message : String(error));
    } finally {
      setLyricsAILoading(false);
    }
  }

  function clearLyricsAIOutput() {
    setLyricsAIOutput("");
    setLyricsAIError("");
  }

  async function saveAIOutputAsLyricIdea() {
    if (!session) {
      alert("Sign in before saving generated lyrics.");
      return;
    }

    if (!selectedLyricIdea) {
      alert("Select a lyric idea first.");
      return;
    }

    if (!lyricsAIOutput.trim()) {
      alert("Generate lyric help first.");
      return;
    }

    try {
      const generatedTitle = `AI ${lyricsAIForm.help_type || "Lyrics Help"} - ${
        selectedLyricIdea.title
      }`;

      await createCloudLyricIdea({
        title: generatedTitle,
        mood: selectedLyricIdea.mood || "",
        concept: selectedLyricIdea.concept || "",
        lyrics: lyricsAIOutput,
        notes: `Generated from lyric idea: ${selectedLyricIdea.title}. Help type: ${lyricsAIForm.help_type}. Direction: ${lyricsAIForm.direction}`,
      });

      await refreshLyricIdeas();
      alert("Generated lyrics saved as a new Lyric Idea.");
    } catch (error) {
      console.error("Save generated cloud lyric idea error:", error);
      alert(error instanceof Error ? error.message : String(error));
    }
  }

  async function saveMarketingAsset() {
    if (!session) {
      alert("You must be signed in before saving marketing assets.");
      return;
    }

    if (!newMarketingAsset.title.trim()) {
      alert("Marketing title is required.");
      return;
    }

    try {
      await createCloudMarketingAsset(newMarketingAsset);
      await refreshMarketingAssets();
      setNewMarketingAsset(emptyMarketingAssetForm);
      setShowNewMarketingAsset(false);
    } catch (error) {
      console.error("Save cloud marketing asset error:", error);
      alert(error instanceof Error ? error.message : String(error));
    }
  }

  async function generateMarketingCopyWithAI() {
    setMarketingAIError("");
    setMarketingAIOutput("");

    try {
      setMarketingAILoading(true);

      const linkedSong = marketingAIForm.song_id
        ? songs.find((song) => String(song.id) === String(marketingAIForm.song_id))
        : undefined;

      const { data, error } = await supabase.functions.invoke<{ text: string }>(
        "track-adam-ai",
        {
          body: {
            action: "marketing",
            payload: {
              song_title: linkedSong?.title || "",
              artist: linkedSong?.artist || "",
              genre: linkedSong?.genre || "",
              mood: linkedSong?.mood || "",
              platform: marketingAIForm.platform,
              content_type: marketingAIForm.content_type,
              tone: marketingAIForm.tone,
              notes: marketingAIForm.notes,
            },
          },
        },
      );

      if (error) {
        throw new Error(error.message);
      }

      if (!data?.text) {
        throw new Error("The AI function responded, but no marketing copy was returned.");
      }

      setMarketingAIOutput(data.text);
    } catch (error) {
      console.error("Generate marketing copy error:", error);
      setMarketingAIError(
        error instanceof Error ? error.message : String(error),
      );
    } finally {
      setMarketingAILoading(false);
    }
  }

  async function saveAIOutputAsMarketingAsset() {
    if (!session) {
      alert("You must be signed in before saving marketing assets.");
      return;
    }

    if (!marketingAIOutput.trim()) {
      alert("Generate marketing copy first.");
      return;
    }

    try {
      const linkedSong = marketingAIForm.song_id
        ? songs.find((song) => String(song.id) === String(marketingAIForm.song_id))
        : undefined;

      const generatedTitle = `AI ${marketingAIForm.content_type || "Marketing Copy"}${
        linkedSong ? ` - ${linkedSong.title}` : ""
      }`;

      await createCloudMarketingAsset({
        song_id: marketingAIForm.song_id,
        title: generatedTitle,
        platform: marketingAIForm.platform,
        content_type: marketingAIForm.content_type,
        tone: marketingAIForm.tone,
        copy: marketingAIOutput,
        notes: marketingAIForm.notes,
      });

      await refreshMarketingAssets();
      alert("Generated marketing copy saved as a Marketing Asset.");
    } catch (error) {
      console.error("Save generated cloud marketing asset error:", error);
      alert(error instanceof Error ? error.message : String(error));
    }
  }

  async function saveVisualAsset() {
    if (!session) {
      alert("Sign in before saving visual assets.");
      return;
    }

    if (!newVisualAsset.title.trim()) {
      alert("Visual title is required.");
      return;
    }

    try {
      await createCloudVisualAsset(newVisualAsset);
      await refreshVisualAssets();
      setNewVisualAsset(emptyVisualAssetForm);
      setShowNewVisualAsset(false);
    } catch (error) {
      console.error("Save cloud visual asset error:", error);
      alert(error instanceof Error ? error.message : String(error));
    }
  }


  async function generateVisualPromptWithAI() {
    if (!selectedVisualAsset) {
      setVisualAIError("Select a visual asset first.");
      return;
    }

    setVisualAIError("");
    setVisualAIOutput("");
    setVisualAIImage("");
    setVisualAIImageError("");

    try {
      setVisualAILoading(true);

      const linkedSong = visualAIForm.song_id
        ? songs.find((song) => String(song.id) === String(visualAIForm.song_id))
        : undefined;

      const result = await callTrackAdamAI("visual_prompt", {
        song_title: linkedSong?.title || "",
        artist: linkedSong?.artist || "",
        genre: linkedSong?.genre || "",
        mood: linkedSong?.mood || "",
        asset_type: visualAIForm.asset_type,
        visual_style: visualAIForm.visual_style,
        notes: visualAIForm.notes,
      });

      setVisualAIOutput(result);
    } catch (error) {
      console.error("Generate visual prompt error:", error);
      setVisualAIError(error instanceof Error ? error.message : String(error));
    } finally {
      setVisualAILoading(false);
    }
  }

  function clearVisualAIOutput() {
    setVisualAIOutput("");
    setVisualAIError("");
    setVisualAIImage("");
    setVisualAIImageError("");
  }

  function clearVisualAIImage() {
    setVisualAIImage("");
    setVisualAIImageError("");
  }

  async function generateVisualImageWithAI() {
    if (!visualAIOutput.trim()) {
      setVisualAIImageError("Generate visual direction first, then create the image.");
      return;
    }

    try {
      setVisualAIImageLoading(true);
      setVisualAIImageError("");
      setVisualAIImage("");

      const { data, error } = await supabase.functions.invoke<{ image_base64: string }>(
        "track-adam-ai",
        {
          body: {
            action: "visual_image",
            payload: {
              prompt: visualAIOutput,
              size: visualAIForm.size || "1024x1024",
              reference_image_data: visualAIReferenceImage || "",
            },
          },
        },
      );

      if (error) {
        throw error;
      }

      if (!data?.image_base64) {
        throw new Error("No image was returned from the Edge Function.");
      }

      setVisualAIImage(data.image_base64);
    } catch (error) {
      console.error("Generate visual image error:", error);
      setVisualAIImageError(error instanceof Error ? error.message : String(error));
    } finally {
      setVisualAIImageLoading(false);
    }
  }

  async function saveAIOutputAsVisualAsset() {
    if (!session) {
      alert("Sign in before saving visual assets.");
      return;
    }

    if (!selectedVisualAsset) {
      alert("Select a visual asset first.");
      return;
    }

    if (!visualAIOutput.trim()) {
      alert("Generate a visual prompt first.");
      return;
    }

    try {
      const updatedAsset = await updateCloudVisualAsset(String(selectedVisualAsset.id), {
        song_id: selectedVisualAsset.song_id ? String(selectedVisualAsset.song_id) : "",
        title: selectedVisualAsset.title,
        asset_type: selectedVisualAsset.asset_type || visualAIForm.asset_type,
        visual_style: selectedVisualAsset.visual_style || visualAIForm.visual_style,
        prompt: visualAIOutput,
        notes: selectedVisualAsset.notes || visualAIForm.notes,
        reference_image_data: visualAIReferenceImage,
        reference_image_name: visualAIReferenceImageName,
      });

      await refreshVisualAssets();
      selectVisualAssetForAI(updatedAsset as VisualAsset);
      alert("Generated prompt saved to the selected visual asset.");
    } catch (error) {
      console.error("Save generated cloud visual asset error:", error);
      alert(error instanceof Error ? error.message : String(error));
    }
  }

  async function saveProductAsset() {
    if (!session) {
      alert("Sign in before saving a product asset.");
      return;
    }

    if (!newProductAsset.title.trim()) {
      alert("Product title is required.");
      return;
    }

    try {
      await createCloudProductAsset(newProductAsset);
      await refreshProductAssets();
      setNewProductAsset(emptyProductAssetForm);
      setShowNewProductAsset(false);
    } catch (error) {
      console.error("Save cloud product asset error:", error);
      alert(error instanceof Error ? error.message : String(error));
    }
  }

  function selectProductAssetForAI(product: ProductAsset) {
    setSelectedProductAsset(product);
    setProductAIOutput("");
    setProductAIError("");
    setProductAIForm({
      ...emptyProductAIForm,
      notes: product.promo_angle || product.launch_notes || product.description || "",
    });
  }

  function clearSelectedProductAsset() {
    setSelectedProductAsset(null);
    setProductAIForm(emptyProductAIForm);
    setProductAIOutput("");
    setProductAIError("");
  }

  function clearProductAIOutput() {
    setProductAIOutput("");
    setProductAIError("");
  }

  async function generateProductCopyWithAI() {
    setProductAIError("");
    setProductAIOutput("");

    if (!selectedProductAsset) {
      setProductAIError("Select a product first.");
      return;
    }

    try {
      setProductAILoading(true);

      const result = await callTrackAdamAI("product", {
        title: selectedProductAsset.title || "",
        product_type: selectedProductAsset.product_type || "",
        price: selectedProductAsset.price || "",
        status: selectedProductAsset.status || "",
        description: selectedProductAsset.description || "",
        promo_angle: selectedProductAsset.promo_angle || "",
        launch_notes: selectedProductAsset.launch_notes || "",
        gumroad_link: selectedProductAsset.gumroad_link || "",
        website_link: selectedProductAsset.website_link || "",
        help_type: productAIForm.help_type,
        platform: productAIForm.platform,
        tone: productAIForm.tone,
        notes: productAIForm.notes,
      });

      setProductAIOutput(result);
    } catch (error) {
      console.error("Generate product copy error:", error);
      setProductAIError(error instanceof Error ? error.message : String(error));
    } finally {
      setProductAILoading(false);
    }
  }

  async function saveProductAIOutputToLaunchNotes() {
    if (!session) {
      alert("Sign in before saving product AI copy.");
      return;
    }

    if (!selectedProductAsset) {
      alert("Select a product first.");
      return;
    }

    if (!productAIOutput.trim()) {
      alert("Generate product copy first.");
      return;
    }

    try {
      const existingNotes = selectedProductAsset.launch_notes || "";
      const divider = existingNotes.trim()
        ? "\n\n--- AI PRODUCT COPY ---\n"
        : "AI PRODUCT COPY:\n";
      const updatedLaunchNotes = `${existingNotes}${divider}${productAIOutput}`;

      const updatedProduct = await updateCloudProductLaunchNotes(
        String(selectedProductAsset.id),
        updatedLaunchNotes,
      );

      await refreshProductAssets();
      setSelectedProductAsset(updatedProduct as ProductAsset);
      alert("AI product copy saved to this product's launch notes.");
    } catch (error) {
      console.error("Save cloud product AI output error:", error);
      alert(error instanceof Error ? error.message : String(error));
    }
  }


  async function saveEpkProfile() {
    if (!session) {
      alert("Sign in before saving an EPK profile.");
      return;
    }

    if (!newEpkProfile.artist_name.trim()) {
      alert("Artist or producer name is required.");
      return;
    }

    try {
      await createCloudEpkProfile(newEpkProfile);
      await refreshEpkProfiles();
      setNewEpkProfile(emptyEpkProfileForm);
      setShowNewEpkProfile(false);
    } catch (error) {
      console.error("Save cloud EPK profile error:", error);
      alert(error instanceof Error ? error.message : String(error));
    }
  }

  async function deleteEpkProfile(profileId: number | string) {
    if (!session) {
      alert("Sign in before deleting an EPK profile.");
      return;
    }

    const confirmed = confirm(
      "Are you sure you want to delete this EPK profile? This cannot be undone.",
    );

    if (!confirmed) return;

    try {
      await deleteCloudEpkProfile(String(profileId));
      await refreshEpkProfiles();

      if (selectedEpkProfile?.id === profileId) {
        setSelectedEpkProfile(null);
      }
    } catch (error) {
      console.error("Delete cloud EPK profile error:", error);
      alert(error instanceof Error ? error.message : String(error));
    }
  }

  function closeEpkProfile() {
    setSelectedEpkProfile(null);
    setEpkAIForm(emptyEpkAIForm);
    setEpkAIOutput("");
    setEpkAIError("");
  }

  function normalizeWebToolUrl(url: string) {
    const trimmedUrl = url.trim();

    if (!trimmedUrl) return "";

    if (trimmedUrl.startsWith("http://") || trimmedUrl.startsWith("https://")) {
      return trimmedUrl;
    }

    return `https://${trimmedUrl}`;
  }

  function openWebTool(tool: WebTool) {
    const safeUrl = normalizeWebToolUrl(tool.url);

    if (!safeUrl) {
      alert("This web tool does not have a valid URL yet.");
      return;
    }

    try {
      window.open(safeUrl, "_blank", "noopener,noreferrer");
    } catch (error) {
      console.error("Open web tool error:", error);
      alert("The link could not be opened. Copy and paste the URL into your browser.");
    }
  }

  function getWebToolDisplayTitle(tool: WebTool) {
    return tool.preview_title || tool.title;
  }

  function getWebToolDisplayDescription(tool: WebTool) {
    return tool.preview_description || tool.description || tool.url;
  }

  async function fetchPreviewForNewWebTool() {
    setWebToolPreviewError("");

    if (!newWebTool.url.trim()) {
      setWebToolPreviewError("Add a URL first, then fetch the preview.");
      return;
    }

    try {
      setWebToolPreviewLoading(true);

      const { data: preview, error } = await supabase.functions.invoke<LinkPreviewResult>(
        "track-adam-ai",
        {
          body: {
            action: "link_preview",
            payload: {
              url: normalizeWebToolUrl(newWebTool.url),
            },
          },
        },
      );

      if (error) {
        throw error;
      }

      if (!preview) {
        throw new Error("No link preview was returned.");
      }

      setNewWebTool((previousTool) => ({
        ...previousTool,
        url: preview.final_url || normalizeWebToolUrl(previousTool.url),
        title: previousTool.title || preview.title || "",
        description: previousTool.description || preview.description || "",
        preview_title: preview.title || "",
        preview_description: preview.description || "",
        preview_image_url: preview.image_url || preview.image || "",
        preview_site_name: preview.site_name || "",
        preview_favicon_url: preview.favicon_url || preview.favicon || "",
      }));
    } catch (error) {
      console.error("Fetch link preview error:", error);
      setWebToolPreviewError(error instanceof Error ? error.message : String(error));
    } finally {
      setWebToolPreviewLoading(false);
    }
  }

  function clearNewWebToolPreview() {
    setNewWebTool((previousTool) => ({
      ...previousTool,
      preview_title: "",
      preview_description: "",
      preview_image_url: "",
      preview_site_name: "",
      preview_favicon_url: "",
    }));
    setWebToolPreviewError("");
  }


  async function fetchPreviewForEditWebTool() {
    setEditWebToolPreviewError("");

    if (!editWebTool.url.trim()) {
      setEditWebToolPreviewError("Add a URL first, then fetch the preview.");
      return;
    }

    try {
      setEditWebToolPreviewLoading(true);

      const { data: preview, error } = await supabase.functions.invoke<LinkPreviewResult>(
        "track-adam-ai",
        {
          body: {
            action: "link_preview",
            payload: {
              url: normalizeWebToolUrl(editWebTool.url),
            },
          },
        },
      );

      if (error) {
        throw error;
      }

      if (!preview) {
        throw new Error("No link preview was returned.");
      }

      setEditWebTool((previousTool) => ({
        ...previousTool,
        url: preview.final_url || normalizeWebToolUrl(previousTool.url),
        title: previousTool.title || preview.title || "",
        description: previousTool.description || preview.description || "",
        preview_title: preview.title || "",
        preview_description: preview.description || "",
        preview_image_url: preview.image_url || preview.image || "",
        preview_site_name: preview.site_name || "",
        preview_favicon_url: preview.favicon_url || preview.favicon || "",
      }));
    } catch (error) {
      console.error("Fetch edit link preview error:", error);
      setEditWebToolPreviewError(error instanceof Error ? error.message : String(error));
    } finally {
      setEditWebToolPreviewLoading(false);
    }
  }

  function clearEditWebToolPreview() {
    setEditWebTool((previousTool) => ({
      ...previousTool,
      preview_title: "",
      preview_description: "",
      preview_image_url: "",
      preview_site_name: "",
      preview_favicon_url: "",
    }));
    setEditWebToolPreviewError("");
  }

  async function saveWebTool() {
    if (!session) {
      alert("You must be signed in to save Web Tools to Supabase.");
      return;
    }

    if (!newWebTool.title.trim()) {
      alert("Tool title is required.");
      return;
    }

    if (!newWebTool.url.trim()) {
      alert("Tool URL is required.");
      return;
    }

    try {
      await createCloudWebTool({
        ...newWebTool,
        url: normalizeWebToolUrl(newWebTool.url),
      });

      await refreshWebTools();
      setNewWebTool(emptyWebToolForm);
      setWebToolPreviewError("");
      setShowNewWebTool(false);
    } catch (error) {
      console.error("Save cloud web tool error:", error);
      alert(error instanceof Error ? error.message : String(error));
    }
  }

  async function deleteWebTool(toolId: number | string) {
    if (!session) {
      alert("You must be signed in to delete Web Tools from Supabase.");
      return;
    }

    const confirmed = confirm(
      "Are you sure you want to delete this web tool? This cannot be undone.",
    );

    if (!confirmed) return;

    try {
      await deleteCloudWebTool(String(toolId));

      await refreshWebTools();

      if (selectedWebTool?.id === toolId) {
        setSelectedWebTool(null);
      }
    } catch (error) {
      console.error("Delete cloud web tool error:", error);
      alert(error instanceof Error ? error.message : String(error));
    }
  }

  async function generateEpkCopyWithAI() {
    setEpkAIError("");
    setEpkAIOutput("");

    if (!selectedEpkProfile) {
      setEpkAIError("Select an EPK profile first.");
      return;
    }

    try {
      setEpkAILoading(true);

      const linkedSong = selectedEpkProfile.linked_song_id
        ? songs.find((song) => String(song.id) === String(selectedEpkProfile.linked_song_id))
        : undefined;

      const linkedProject = selectedEpkProfile.linked_project_id
        ? projects.find((project) => String(project.id) === String(selectedEpkProfile.linked_project_id))
        : undefined;

      const result = await callTrackAdamAI("epk", {
        artist_name: selectedEpkProfile.artist_name || "",
        producer_name: selectedEpkProfile.producer_name || "",
        location: selectedEpkProfile.location || "",
        genre: selectedEpkProfile.genre || "",
        sound_description: selectedEpkProfile.sound_description || "",
        short_story: selectedEpkProfile.short_story || "",
        influences: selectedEpkProfile.influences || "",
        highlights: selectedEpkProfile.highlights || "",
        credits: selectedEpkProfile.credits || "",
        contact_email: selectedEpkProfile.contact_email || "",
        website: selectedEpkProfile.website || "",
        social_links: selectedEpkProfile.social_links || "",
        booking_link: selectedEpkProfile.booking_link || "",
        linked_song_title: linkedSong?.title || "",
        linked_project_title: linkedProject?.title || "",
        help_type: epkAIForm.help_type,
        audience: epkAIForm.audience,
        tone: epkAIForm.tone,
        notes: epkAIForm.notes,
      });

      setEpkAIOutput(result);
    } catch (error) {
      console.error("Generate EPK copy error:", error);
      setEpkAIError(error instanceof Error ? error.message : String(error));
    } finally {
      setEpkAILoading(false);
    }
  }

  function clearEpkAIOutput() {
    setEpkAIOutput("");
    setEpkAIError("");
  }

  async function saveEpkAIOutput() {
    if (!session) {
      alert("Sign in before saving generated EPK copy.");
      return;
    }

    if (!selectedEpkProfile) {
      alert("Select an EPK profile first.");
      return;
    }

    if (!epkAIOutput.trim()) {
      alert("Generate EPK copy first.");
      return;
    }

    const helpType = epkAIForm.help_type;
    const columnName = helpType.includes("One Sheet")
      ? "saved_one_sheet"
      : helpType.includes("Press Release")
        ? "saved_press_release"
        : helpType.includes("Pitch")
          ? "saved_pitch"
          : "saved_bio";

    try {
      const updatedProfile = await updateCloudEpkProfileSection(
        String(selectedEpkProfile.id),
        columnName,
        epkAIOutput,
      );

      await refreshEpkProfiles();
      setSelectedEpkProfile(updatedProfile as EpkProfile);
      setEpkAIOutput("");
      setEpkAIError("");
      alert("Generated EPK copy saved.");
    } catch (error) {
      console.error("Save generated cloud EPK copy error:", error);
      alert(error instanceof Error ? error.message : String(error));
    }
  }

  async function saveReleaseRoadmap() {
    if (!session) {
      alert("Sign in before saving a roadmap.");
      return;
    }

    if (!newReleaseRoadmap.title.trim()) {
      alert("Release title is required.");
      return;
    }

    try {
      const createdRoadmap = await createCloudReleaseRoadmap(newReleaseRoadmap);
      await refreshReleaseRoadmaps();
      setSelectedReleaseRoadmap(createdRoadmap as ReleaseRoadmap);
      setNewReleaseRoadmap(emptyReleaseRoadmapForm);
      setShowNewReleaseRoadmap(false);
      alert("Release roadmap saved.");
    } catch (error) {
      console.error("Save cloud release roadmap error:", error);
      alert(error instanceof Error ? error.message : String(error));
    }
  }

  async function generateRoadmapPlanWithAI() {
    setRoadmapAIError("");
    setRoadmapAIOutput("");

    if (!selectedReleaseRoadmap) {
      setRoadmapAIError("Select a roadmap first.");
      return;
    }

    try {
      setRoadmapAILoading(true);

      const linkedSong = selectedReleaseRoadmap.song_id
        ? songs.find((song) => String(song.id) === String(selectedReleaseRoadmap.song_id))
        : undefined;

      const result = await callTrackAdamAI("roadmap", {
        title: selectedReleaseRoadmap.title || "",
        song_title: linkedSong?.title || "",
        artist: linkedSong?.artist || "",
        release_date: selectedReleaseRoadmap.release_date || "",
        release_type: selectedReleaseRoadmap.release_type || "",
        campaign_goal: selectedReleaseRoadmap.campaign_goal || "",
        budget_level: selectedReleaseRoadmap.budget_level || "",
        platform_focus: selectedReleaseRoadmap.platform_focus || "",
        rollout_plan: selectedReleaseRoadmap.rollout_plan || "",
        checklist_notes: selectedReleaseRoadmap.checklist_notes || "",
        help_type: roadmapAIForm.help_type,
        timeline: roadmapAIForm.timeline,
        tone: roadmapAIForm.tone,
        notes: roadmapAIForm.notes,
      });

      setRoadmapAIOutput(result);
    } catch (error) {
      console.error("Generate roadmap plan error:", error);
      setRoadmapAIError(error instanceof Error ? error.message : String(error));
    } finally {
      setRoadmapAILoading(false);
    }
  }

  function clearRoadmapAIOutput() {
    setRoadmapAIOutput("");
    setRoadmapAIError("");
  }

  function closeSelectedRoadmap() {
    setSelectedReleaseRoadmap(null);
    setRoadmapAIOutput("");
    setRoadmapAIError("");
    setRoadmapAIForm(emptyRoadmapAIForm);
  }

  async function saveRoadmapAIOutputToRolloutPlan() {
    if (!session) {
      alert("Sign in before updating the roadmap.");
      return;
    }

    if (!selectedReleaseRoadmap) {
      alert("Select a roadmap first.");
      return;
    }

    if (!roadmapAIOutput.trim()) {
      alert("Generate a roadmap plan first.");
      return;
    }

    try {
      const updatedRoadmap = await updateCloudReleaseRoadmapRolloutPlan(
        String(selectedReleaseRoadmap.id),
        roadmapAIOutput,
      );

      await refreshReleaseRoadmaps();
      setSelectedReleaseRoadmap(updatedRoadmap as ReleaseRoadmap);
      setRoadmapAIOutput("");
      setRoadmapAIError("");
      alert("Generated roadmap saved to the rollout plan.");
    } catch (error) {
      console.error("Save cloud roadmap AI output error:", error);
      alert(error instanceof Error ? error.message : String(error));
    }
  }

  function summarizeRoadmapsForAI() {
    return releaseRoadmaps
      .slice(0, 8)
      .map(
        (roadmap) =>
          `${roadmap.title} | release date: ${roadmap.release_date || "not added"} | type: ${roadmap.release_type || "not added"} | goal: ${roadmap.campaign_goal || "not added"}`,
      )
      .join("\n");
  }

  function summarizeCalendarTasksForAI() {
    return calendarTasks
      .slice(0, 10)
      .map(
        (task) =>
          `${task.title} | date: ${task.task_date || "not added"} | type: ${task.task_type || "not added"} | platform: ${task.platform || "not added"} | status: ${task.status || "not added"}`,
      )
      .join("\n");
  }

  function summarizeSongsForAI() {
    return songs
      .slice(0, 10)
      .map(
        (song) =>
          `${song.title} | artist: ${song.artist || "not added"} | genre: ${song.genre || "not added"} | mood: ${song.mood || "not added"} | status: ${song.status || "not added"}`,
      )
      .join("\n");
  }

  function summarizeProductsForAI() {
    return productAssets
      .slice(0, 10)
      .map(
        (product) =>
          `${product.title} | type: ${product.product_type || "not added"} | price: ${product.price || "not added"} | status: ${product.status || "not added"}`,
      )
      .join("\n");
  }

  function clearCalendarAIOutput() {
    setCalendarAIOutput("");
    setCalendarAIError("");
  }

  async function saveCalendarTask() {
    if (!session) {
      showNotice("Sign in before saving calendar tasks.", "error");
      return;
    }

    if (!newCalendarTask.title.trim()) {
      showNotice("Calendar task title is required.", "error");
      return;
    }

    try {
      startAppBusy("Saving calendar task...");

      await createCloudCalendarTask({
        song_id: newCalendarTask.song_id,
        product_id: newCalendarTask.product_id,
        title: newCalendarTask.title,
        task_date: newCalendarTask.task_date,
        task_type: newCalendarTask.task_type,
        platform: newCalendarTask.platform,
        status: newCalendarTask.status,
        notes: newCalendarTask.notes,
      });

      setNewCalendarTask(emptyCalendarTaskForm);
      setShowNewCalendarTask(false);
      await refreshCalendarTasks();
      showNotice("Calendar task saved.", "success");
    } catch (error) {
      console.error("Save calendar task error:", error);
      showNotice(error instanceof Error ? error.message : String(error), "error");
    } finally {
      stopAppBusy();
    }
  }


  function extractUrlsFromText(value: string) {
    return value.match(/https?:\/\/[^\s]+/gi) || [];
  }

  function extractHandlesFromText(value: string) {
    return value.match(/@[a-z0-9._]{2,}/gi) || [];
  }

  function extractEmailsFromText(value: string) {
    return value.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi) || [];
  }

  function extractPhonesFromText(value: string) {
    return value.match(/(?:\+?1[\s.-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/g) || [];
  }

  function mergeManualAndDetected(manual: string, detected: string[]) {
    const manualItems = manual
      .split(/[\n,]+/)
      .map((item) => item.trim())
      .filter(Boolean);

    return Array.from(new Set([...manualItems, ...detected])).join("\n");
  }

  function preparePlannerNoteForSave(form: PlannerNoteForm): PlannerNoteForm {
    const textToScan = `${form.title}\n${form.body}`;

    return {
      ...form,
      links: mergeManualAndDetected(form.links, extractUrlsFromText(textToScan)),
      handles: mergeManualAndDetected(form.handles, extractHandlesFromText(textToScan)),
      emails: mergeManualAndDetected(form.emails, extractEmailsFromText(textToScan)),
      phone_numbers: mergeManualAndDetected(form.phone_numbers, extractPhonesFromText(textToScan)),
    };
  }

  async function saveNotebook() {
    if (!session) {
      showNotice("Sign in before saving notebooks.", "error");
      return;
    }

    if (!newNotebook.name.trim()) {
      showNotice("Notebook name is required.", "error");
      return;
    }

    try {
      startAppBusy("Saving notebook...");
      const savedNotebook = await createCloudNotebook(newNotebook);
      setNewNotebook(emptyNotebookForm);
      setShowNewNotebook(false);
      await refreshNotebooks();
      setSelectedNotebookId(String(savedNotebook.id));
      setPlannerTab("Notebooks");
      showNotice("Notebook saved.", "success");
    } catch (error) {
      console.error("Save notebook error:", error);
      showNotice(error instanceof Error ? error.message : String(error), "error");
    } finally {
      stopAppBusy();
    }
  }

  function startEditingNotebook(notebook: Notebook) {
    setSelectedNotebookForEdit(notebook);
    setEditNotebook(notebookToForm(notebook));
    setShowEditNotebook(true);
  }

  async function updateNotebook() {
    if (!session || !selectedNotebookForEdit) {
      showNotice("Select a notebook first.", "error");
      return;
    }

    if (!editNotebook.name.trim()) {
      showNotice("Notebook name is required.", "error");
      return;
    }

    try {
      startAppBusy("Updating notebook...");
      const updatedNotebook = await updateCloudNotebook(
        String(selectedNotebookForEdit.id),
        editNotebook,
      );
      await refreshNotebooks();
      setSelectedNotebookId(String(updatedNotebook.id));
      setSelectedNotebookForEdit(null);
      setEditNotebook(emptyNotebookForm);
      setShowEditNotebook(false);
      setPlannerTab("Notebooks");
      showNotice("Notebook updated.", "success");
    } catch (error) {
      console.error("Update notebook error:", error);
      showNotice(error instanceof Error ? error.message : String(error), "error");
    } finally {
      stopAppBusy();
    }
  }

  async function removeNotebook(notebook: Notebook) {
    if (!session) {
      showNotice("Sign in before deleting notebooks.", "error");
      return;
    }

    const noteCount = plannerNotes.filter(
      (note) => !note.archived && String(note.notebook_id || "") === String(notebook.id),
    ).length;
    const confirmed = window.confirm(
      `Delete "${notebook.name}"? ${noteCount} note${noteCount === 1 ? "" : "s"} will move to Inbox / Brain Dump, not be deleted.`,
    );

    if (!confirmed) return;

    try {
      startAppBusy("Deleting notebook...");
      await deleteCloudNotebook(String(notebook.id));
      await refreshNotebooks();
      await refreshPlannerNotes();

      if (selectedNotebookId === String(notebook.id)) {
        setSelectedNotebookId("all");
      }

      if (selectedNotebookForEdit && String(selectedNotebookForEdit.id) === String(notebook.id)) {
        setSelectedNotebookForEdit(null);
        setEditNotebook(emptyNotebookForm);
        setShowEditNotebook(false);
      }

      showNotice("Notebook deleted. Its notes were moved to Inbox / Brain Dump.", "success");
    } catch (error) {
      console.error("Delete notebook error:", error);
      showNotice(error instanceof Error ? error.message : String(error), "error");
    } finally {
      stopAppBusy();
    }
  }

  async function savePlannerNote(form = newPlannerNote, closeModal = true) {
    if (!session) {
      showNotice("Sign in before saving notes.", "error");
      return;
    }

    if (!form.title.trim() && !form.body.trim()) {
      showNotice("Add a title or note before saving.", "error");
      return;
    }

    try {
      startAppBusy("Saving note...");
      const savedNote = await createCloudNote(preparePlannerNoteForSave(form));
      await refreshPlannerNotes();
      setSelectedPlannerNote(savedNote as PlannerNote);
      setPlannerTab("Notebooks");
      setSelectedNotebookId(form.notebook_id || "all");

      if (closeModal) {
        setNewPlannerNote(emptyPlannerNoteForm);
        setShowNewPlannerNote(false);
      }

      showNotice("Note saved.", "success");
    } catch (error) {
      console.error("Save planner note error:", error);
      showNotice(error instanceof Error ? error.message : String(error), "error");
    } finally {
      stopAppBusy();
    }
  }

  async function saveQuickCaptureNote() {
    await savePlannerNote(quickCaptureNote, false);
    setQuickCaptureNote(emptyPlannerNoteForm);
  }

  function startEditingPlannerNote(note: PlannerNote) {
    setEditPlannerNote(plannerNoteToForm(note));
    setSelectedPlannerNote(note);
    setShowEditPlannerNote(true);
  }

  async function updatePlannerNote() {
    if (!session || !selectedPlannerNote) {
      showNotice("Select a note first.", "error");
      return;
    }

    if (!editPlannerNote.title.trim() && !editPlannerNote.body.trim()) {
      showNotice("Add a title or note before saving.", "error");
      return;
    }

    try {
      startAppBusy("Updating note...");
      const updatedNote = await updateCloudNote(
        String(selectedPlannerNote.id),
        preparePlannerNoteForSave(editPlannerNote),
      );
      await refreshPlannerNotes();
      setSelectedPlannerNote(updatedNote as PlannerNote);
      setShowEditPlannerNote(false);
      showNotice("Note updated.", "success");
    } catch (error) {
      console.error("Update planner note error:", error);
      showNotice(error instanceof Error ? error.message : String(error), "error");
    } finally {
      stopAppBusy();
    }
  }

  async function togglePlannerNotePin(note: PlannerNote) {
    try {
      const form = plannerNoteToForm(note);
      const updatedNote = await updateCloudNote(String(note.id), {
        ...form,
        pinned: note.pinned ? "0" : "1",
      });
      await refreshPlannerNotes();
      setSelectedPlannerNote(updatedNote as PlannerNote);
    } catch (error) {
      console.error("Toggle planner note pin error:", error);
      showNotice(error instanceof Error ? error.message : String(error), "error");
    }
  }

  async function archivePlannerNote(note: PlannerNote) {
    try {
      const updatedNote = await updateCloudNote(String(note.id), {
        ...plannerNoteToForm(note),
        archived: "1",
      });
      await refreshPlannerNotes();

      if (String(selectedPlannerNote?.id) === String(note.id)) {
        setSelectedPlannerNote(updatedNote as PlannerNote);
      }

      showNotice("Note archived.", "success");
    } catch (error) {
      console.error("Archive planner note error:", error);
      showNotice(error instanceof Error ? error.message : String(error), "error");
    }
  }

  async function deletePlannerNote(noteId: number | string) {
    if (!session) {
      showNotice("Sign in before deleting notes.", "error");
      return;
    }

    const shouldDelete = window.confirm(
      "Are you sure you want to delete this note? This cannot be undone.",
    );

    if (!shouldDelete) return;

    try {
      await deleteCloudNote(String(noteId));
      await refreshPlannerNotes();

      if (String(selectedPlannerNote?.id) === String(noteId)) {
        setSelectedPlannerNote(null);
      }

      showNotice("Note deleted.", "success");
    } catch (error) {
      console.error("Delete planner note error:", error);
      showNotice(error instanceof Error ? error.message : String(error), "error");
    }
  }

  function convertPlannerNoteToTask(note: PlannerNote, withTodayDate = false) {
    setNewCalendarTask({
      ...emptyCalendarTaskForm,
      title: note.title || note.note_type || "Captured Note",
      task_date: withTodayDate ? new Date().toISOString().slice(0, 10) : "",
      task_type: note.note_type || "Captured Note",
      status: "Planned",
      notes: [
        note.body || "",
        note.links?.length ? `Links:\n${note.links.join("\n")}` : "",
        note.handles?.length ? `Handles: ${note.handles.join(", ")}` : "",
        note.phone_numbers?.length ? `Phone: ${note.phone_numbers.join(", ")}` : "",
        note.emails?.length ? `Email: ${note.emails.join(", ")}` : "",
      ]
        .filter(Boolean)
        .join("\n\n"),
    });
    setShowNewCalendarTask(true);
  }

  async function generateCalendarMissionWithAI() {
    setCalendarAIError("");
    setCalendarAIOutput("");

    try {
      setCalendarAILoading(true);

      const result = await callTrackAdamAI("calendar", {
        focus_type: calendarAIForm.focus_type,
        time_available: calendarAIForm.time_available,
        energy_level: calendarAIForm.energy_level,
        platform: calendarAIForm.platform,
        notes: calendarAIForm.notes,
        songs_summary: summarizeSongsForAI(),
        products_summary: summarizeProductsForAI(),
        release_roadmaps_summary: summarizeRoadmapsForAI(),
        existing_tasks_summary: summarizeCalendarTasksForAI(),
      });

      setCalendarAIOutput(result);
    } catch (error) {
      console.error("Generate calendar mission error:", error);
      setCalendarAIError(error instanceof Error ? error.message : String(error));
    } finally {
      setCalendarAILoading(false);
    }
  }

  async function saveCalendarAIOutputAsTask() {
    if (!session) {
      alert("Sign in before saving calendar tasks.");
      return;
    }

    if (!calendarAIOutput.trim()) {
      alert("Generate a daily mission first.");
      return;
    }

    try {
      const today = new Date().toISOString().slice(0, 10);

      await createCloudCalendarTask({
        song_id: "",
        product_id: "",
        title: `AI Daily Mission - ${today}`,
        task_date: today,
        platform: calendarAIForm.platform,
        task_type: `Daily Mission - ${calendarAIForm.focus_type}`,
        status: "Planned",
        notes: calendarAIOutput,
      });

      await refreshCalendarTasks();
      setCalendarAIOutput("");
      setCalendarAIError("");
      alert("AI Daily Mission saved as a calendar task.");
    } catch (error) {
      console.error("Save AI daily mission error:", error);
      alert(error instanceof Error ? error.message : String(error));
    }
  }

  function startEditingSong(song: Song) {
    setEditSong(songToForm(song));
    setShowEditSong(true);
  }

  function startEditingProject(project: Project) {
    setEditProject(projectToForm(project));
    setShowEditProject(true);
  }

  function startEditingLyricIdea(idea: LyricIdea) {
    setEditLyricIdea(lyricIdeaToForm(idea));
    setShowEditLyricIdea(true);
  }

  function startEditingMarketingAsset(asset: MarketingAsset) {
    setEditMarketingAsset(marketingAssetToForm(asset));
    setShowEditMarketingAsset(true);
  }

  function startEditingVisualAsset(asset: VisualAsset) {
    setEditVisualAsset(visualAssetToForm(asset));
    setShowEditVisualAsset(true);
  }

  function startEditingProductAsset(asset: ProductAsset) {
    setEditProductAsset(productAssetToForm(asset));
    setShowEditProductAsset(true);
  }

  function startEditingReleaseRoadmap(roadmap: ReleaseRoadmap) {
    setEditReleaseRoadmap(releaseRoadmapToForm(roadmap));
    setShowEditReleaseRoadmap(true);
  }

  function startEditingCalendarTask(task: CalendarTask) {
    setEditCalendarTask(calendarTaskToForm(task));
    setShowEditCalendarTask(true);
  }

  function startEditingEpkProfile(profile: EpkProfile) {
    setEditEpkProfile(epkProfileToForm(profile));
    setShowEditEpkProfile(true);
  }

  function startEditingWebTool(tool: WebTool) {
    setEditWebTool(webToolToForm(tool));
    setEditWebToolPreviewError("");
    setShowEditWebTool(true);
  }

  async function updateSong() {
    if (!session || !selectedSong) {
      alert("Sign in and select a song first.");
      return;
    }

    if (!editSong.title.trim()) {
      alert("Song title is required.");
      return;
    }

    try {
      const updatedSong = await updateCloudSong(String(selectedSong.id), editSong);

      if (editSong.project_id) {
        await addCloudSongToProject(String(editSong.project_id), String(selectedSong.id));
      }

      await refreshSongs();
      await refreshProjects();
      setSelectedSong(updatedSong as Song);
      setShowEditSong(false);
    } catch (error) {
      console.error("Update cloud song error:", error);
      alert(error instanceof Error ? error.message : String(error));
    }
  }

  async function updateProject() {
    if (!session || !selectedProject) {
      alert("Sign in and select a project first.");
      return;
    }

    if (!editProject.title.trim()) {
      alert("Project title is required.");
      return;
    }

    try {
      const updatedProject = await updateCloudProject(String(selectedProject.id), editProject);
      await refreshProjects();
      setSelectedProject(updatedProject as Project);
      setShowEditProject(false);
    } catch (error) {
      console.error("Update cloud project error:", error);
      alert(error instanceof Error ? error.message : String(error));
    }
  }

  async function updateLyricIdea() {
    if (!session || !selectedLyricIdea) {
      alert("Sign in and select a lyric idea first.");
      return;
    }

    if (!editLyricIdea.title.trim()) {
      alert("Idea title is required.");
      return;
    }

    try {
      const updatedIdea = await updateCloudLyricIdea(String(selectedLyricIdea.id), editLyricIdea);
      await refreshLyricIdeas();
      setSelectedLyricIdea(updatedIdea as LyricIdea);
      setShowEditLyricIdea(false);
    } catch (error) {
      console.error("Update cloud lyric idea error:", error);
      alert(error instanceof Error ? error.message : String(error));
    }
  }

  async function updateMarketingAsset() {
    if (!session || !selectedMarketingAsset) {
      alert("You must be signed in and have a marketing asset selected.");
      return;
    }

    if (!editMarketingAsset.title.trim()) {
      alert("Marketing title is required.");
      return;
    }

    try {
      const updatedAsset = await updateCloudMarketingAsset(
        String(selectedMarketingAsset.id),
        editMarketingAsset,
      );
      await refreshMarketingAssets();
      setSelectedMarketingAsset(updatedAsset as MarketingAsset);
      setShowEditMarketingAsset(false);
    } catch (error) {
      console.error("Update cloud marketing asset error:", error);
      alert(error instanceof Error ? error.message : String(error));
    }
  }

  async function updateVisualAsset() {
    if (!session || !selectedVisualAsset) {
      alert("Sign in and select a visual asset first.");
      return;
    }

    if (!editVisualAsset.title.trim()) {
      alert("Visual title is required.");
      return;
    }

    try {
      const updatedAsset = await updateCloudVisualAsset(
        String(selectedVisualAsset.id),
        editVisualAsset,
      );

      await refreshVisualAssets();
      selectVisualAssetForAI(updatedAsset as VisualAsset);
      setShowEditVisualAsset(false);
    } catch (error) {
      console.error("Update cloud visual asset error:", error);
      alert(error instanceof Error ? error.message : String(error));
    }
  }

  async function updateProductAsset() {
    if (!session || !selectedProductAsset) {
      alert("Sign in and select a product before updating.");
      return;
    }

    if (!editProductAsset.title.trim()) {
      alert("Product title is required.");
      return;
    }

    try {
      const updatedAsset = await updateCloudProductAsset(
        String(selectedProductAsset.id),
        editProductAsset,
      );

      await refreshProductAssets();
      setSelectedProductAsset(updatedAsset as ProductAsset);
      setShowEditProductAsset(false);
    } catch (error) {
      console.error("Update cloud product asset error:", error);
      alert(error instanceof Error ? error.message : String(error));
    }
  }

  async function updateReleaseRoadmap() {
    if (!session || !selectedReleaseRoadmap) {
      alert("Select a roadmap first.");
      return;
    }

    if (!editReleaseRoadmap.title.trim()) {
      alert("Roadmap title is required.");
      return;
    }

    try {
      const updatedRoadmap = await updateCloudReleaseRoadmap(
        String(selectedReleaseRoadmap.id),
        editReleaseRoadmap,
      );

      await refreshReleaseRoadmaps();
      setSelectedReleaseRoadmap(updatedRoadmap as ReleaseRoadmap);
      setShowEditReleaseRoadmap(false);
      alert("Roadmap updated.");
    } catch (error) {
      console.error("Update cloud release roadmap error:", error);
      alert(error instanceof Error ? error.message : String(error));
    }
  }

  async function updateCalendarTask() {
    if (!session || !selectedCalendarTask) {
      alert("Select a calendar task first.");
      return;
    }

    if (!editCalendarTask.title.trim()) {
      alert("Task title is required.");
      return;
    }

    try {
      const updatedTask = await updateCloudCalendarTask(
        String(selectedCalendarTask.id),
        editCalendarTask,
      );

      await refreshCalendarTasks();
      setSelectedCalendarTask(updatedTask as CalendarTask);
      setShowEditCalendarTask(false);
    } catch (error) {
      console.error("Update calendar task error:", error);
      alert(error instanceof Error ? error.message : String(error));
    }
  }

  async function updateEpkProfile() {
    if (!session || !selectedEpkProfile) {
      alert("Sign in and select an EPK profile before updating.");
      return;
    }

    if (!editEpkProfile.artist_name.trim()) {
      alert("Artist name is required.");
      return;
    }

    try {
      const updatedProfile = await updateCloudEpkProfile(
        String(selectedEpkProfile.id),
        editEpkProfile,
      );

      await refreshEpkProfiles();
      setSelectedEpkProfile(updatedProfile as EpkProfile);
      setShowEditEpkProfile(false);
    } catch (error) {
      console.error("Update cloud EPK profile error:", error);
      alert(error instanceof Error ? error.message : String(error));
    }
  }

  async function updateWebTool() {
    if (!session || !selectedWebTool) {
      alert("You must be signed in and have a selected web tool.");
      return;
    }

    if (!editWebTool.title.trim() || !editWebTool.url.trim()) {
      alert("Title and URL are required.");
      return;
    }

    try {
      const updatedTool = await updateCloudWebTool(String(selectedWebTool.id), {
        ...editWebTool,
        url: normalizeWebToolUrl(editWebTool.url),
      });

      await refreshWebTools();
      setSelectedWebTool(updatedTool as WebTool);
      setShowEditWebTool(false);
    } catch (error) {
      console.error("Update cloud web tool error:", error);
      alert(error instanceof Error ? error.message : String(error));
    }
  }

  async function deleteSong(songId: number | string) {
    if (!session) {
      alert("Sign in before deleting a song.");
      return;
    }

    const confirmed = confirm(
      "Are you sure you want to delete this song? This cannot be undone.",
    );

    if (!confirmed) return;

    try {
      await deleteCloudSong(String(songId));
      await refreshSongs();
      await refreshProjects();
      setSelectedSong(null);
    } catch (error) {
      console.error("Delete cloud song error:", error);
      alert(error instanceof Error ? error.message : String(error));
    }
  }

  async function deleteLyricIdea(ideaId: number | string) {
    if (!session) {
      alert("Sign in before deleting a lyric idea.");
      return;
    }

    const confirmed = confirm(
      "Are you sure you want to delete this lyric idea? This cannot be undone.",
    );

    if (!confirmed) return;

    try {
      await deleteCloudLyricIdea(String(ideaId));
      await refreshLyricIdeas();

      if (String(selectedLyricIdea?.id) === String(ideaId)) {
        setSelectedLyricIdea(null);
      }
    } catch (error) {
      console.error("Delete cloud lyric idea error:", error);
      alert(error instanceof Error ? error.message : String(error));
    }
  }

  async function deleteMarketingAsset(assetId: number | string) {
    if (!session) {
      alert("You must be signed in before deleting marketing assets.");
      return;
    }

    const confirmed = confirm(
      "Are you sure you want to delete this marketing asset? This cannot be undone.",
    );

    if (!confirmed) return;

    try {
      await deleteCloudMarketingAsset(String(assetId));
      await refreshMarketingAssets();

      if (selectedMarketingAsset?.id === assetId) {
        setSelectedMarketingAsset(null);
      }
    } catch (error) {
      console.error("Delete cloud marketing asset error:", error);
      alert(error instanceof Error ? error.message : String(error));
    }
  }

  function selectVisualAssetForAI(asset: VisualAsset) {
    setSelectedVisualAsset(asset);
    setVisualAIForm({
      song_id: asset.song_id ? String(asset.song_id) : "",
      asset_type: asset.asset_type || "Album Cover",
      visual_style: asset.visual_style || "Cinematic",
      size: visualAIForm.size || "1024x1024",
      notes: asset.notes || asset.prompt || "",
    });
    setVisualAIOutput(asset.prompt || "");
    setVisualAIError("");
    setVisualAIImage("");
    setVisualAIImageError("");
    setVisualAIReferenceImage(asset.reference_image_data || "");
    setVisualAIReferenceImageName(
      asset.reference_image_name || (asset.reference_image_data ? "Saved reference image" : ""),
    );
  }

  function clearSelectedVisualAsset() {
    setSelectedVisualAsset(null);
    setVisualAIForm(emptyVisualAIForm);
    setVisualAIOutput("");
    setVisualAIError("");
    setVisualAIImage("");
    setVisualAIImageError("");
    setVisualAIReferenceImage("");
    setVisualAIReferenceImageName("");
  }

  async function deleteVisualAsset(assetId: number | string) {
    if (!session) {
      alert("Sign in before deleting visual assets.");
      return;
    }

    const confirmed = confirm(
      "Are you sure you want to delete this visual asset? This cannot be undone.",
    );

    if (!confirmed) return;

    try {
      await deleteCloudVisualAsset(String(assetId));
      await refreshVisualAssets();

      if (String(selectedVisualAsset?.id) === String(assetId)) {
        setSelectedVisualAsset(null);
      }
    } catch (error) {
      console.error("Delete cloud visual asset error:", error);
      alert(error instanceof Error ? error.message : String(error));
    }
  }

  async function deleteProductAsset(assetId: number | string) {
    if (!session) {
      alert("Sign in before deleting a product.");
      return;
    }

    const confirmed = confirm(
      "Are you sure you want to delete this product? This cannot be undone.",
    );

    if (!confirmed) return;

    try {
      await deleteCloudProductAsset(String(assetId));
      await refreshProductAssets();

      if (String(selectedProductAsset?.id) === String(assetId)) {
        setSelectedProductAsset(null);
      }
    } catch (error) {
      console.error("Delete cloud product asset error:", error);
      alert(error instanceof Error ? error.message : String(error));
    }
  }

  async function deleteReleaseRoadmap(roadmapId: number | string) {
    if (!session) {
      alert("Sign in before deleting a roadmap.");
      return;
    }

    const confirmed = confirm(
      "Are you sure you want to delete this release roadmap? This cannot be undone.",
    );

    if (!confirmed) return;

    try {
      await deleteCloudReleaseRoadmap(String(roadmapId));
      await refreshReleaseRoadmaps();

      if (String(selectedReleaseRoadmap?.id) === String(roadmapId)) {
        setSelectedReleaseRoadmap(null);
      }

      alert("Roadmap deleted.");
    } catch (error) {
      console.error("Delete cloud release roadmap error:", error);
      alert(error instanceof Error ? error.message : String(error));
    }
  }

  async function deleteCalendarTask(taskId: number | string) {
    if (!session) {
      alert("Sign in before deleting calendar tasks.");
      return;
    }

    const shouldDelete = window.confirm(
      "Are you sure you want to delete this calendar task? This cannot be undone.",
    );

    if (!shouldDelete) return;

    try {
      await deleteCloudCalendarTask(String(taskId));
      await refreshCalendarTasks();

      if (String(selectedCalendarTask?.id) === String(taskId)) {
        setSelectedCalendarTask(null);
      }
    } catch (error) {
      console.error("Delete calendar task error:", error);
      alert(error instanceof Error ? error.message : String(error));
    }
  }

  function displayValue(value?: string) {
    return value && value.trim() ? value : "Not added";
  }


  function displayListValue(values?: string[]) {
    return values && values.length ? values.join(", ") : "Not added";
  }

  function getNotebookName(notebookId?: number | string) {
    if (!notebookId) return "Inbox / Brain Dump";

    const linkedNotebook = notebooks.find(
      (notebook) => String(notebook.id) === String(notebookId),
    );

    return linkedNotebook ? linkedNotebook.name : "Notebook not found";
  }

  function getFilteredPlannerNotes() {
    const activeNotes = plannerNotes.filter((note) => !note.archived);

    if (selectedNotebookId === "all") return activeNotes;
    if (selectedNotebookId === "pinned") return activeNotes.filter((note) => note.pinned);
    if (selectedNotebookId === "inbox") return activeNotes.filter((note) => !note.notebook_id);

    return activeNotes.filter(
      (note) => String(note.notebook_id || "") === String(selectedNotebookId),
    );
  }


  function renderAIProgress(isLoading: boolean, label: string) {
    if (!isLoading) return null;

    return (
      <div className="ai-progress-panel" role="status" aria-live="polite">
        <div className="ai-progress-header">
          <span>{label}</span>
          <span>Working</span>
        </div>
        <div className="ai-progress-track">
          <div className="ai-progress-fill" />
        </div>
      </div>
    );
  }

  function getSongTitle(songId?: number | string) {
    if (!songId) return "No song linked";

    const linkedSong = songs.find((song) => String(song.id) === String(songId));

    return linkedSong ? linkedSong.title : "Song not found";
  }

  function getProductTitle(productId?: number | string) {
    if (!productId) return "No product linked";

    const linkedProduct = productAssets.find(
      (product) => String(product.id) === String(productId),
    );

    return linkedProduct ? linkedProduct.title : "Product not found";
  }

  function getProjectTitle(projectId?: number | string) {
    if (!projectId) return "No project linked";

    const linkedProject = projects.find((project) => String(project.id) === String(projectId));

    return linkedProject ? linkedProject.title : "Project not found";
  }

  function getLinkedLyricIdea(song?: Song | null) {
    if (!song?.lyric_idea_id) return null;

    return lyricIdeas.find((idea) => String(idea.id) === String(song.lyric_idea_id)) || null;
  }

  async function linkLyricIdeaToSelectedSong(lyricIdeaId: string) {
    if (!session || !selectedSong) {
      alert("Sign in and select a song first.");
      return;
    }

    try {
      const updatedSong = await updateCloudSongLyricIdea(
        String(selectedSong.id),
        lyricIdeaId || "",
      );

      await refreshSongs();
      setSelectedSong(updatedSong as Song);
    } catch (error) {
      console.error("Link cloud lyric idea error:", error);
      alert(
        `The lyric asset could not be linked. Error: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  function openLinkedLyricIdea(idea: LyricIdea) {
    setSelectedLyricIdea(idea);
    setSelectedSong(null);
    setActivePage("Lyrics");
  }

  function getProjectSongs(projectId?: number | string) {
    if (!projectId) return [];

    const linkedSongIds = projectSongLinks
      .filter((link) => String(link.project_id) === String(projectId))
      .map((link) => String(link.song_id));

    return songs.filter((song) => linkedSongIds.includes(String(song.id)));
  }

  function getAvailableSongsForProject(projectId?: number | string) {
    if (!projectId) return songs;

    const linkedSongIds = projectSongLinks
      .filter((link) => String(link.project_id) === String(projectId))
      .map((link) => String(link.song_id));

    return songs.filter((song) => !linkedSongIds.includes(String(song.id)));
  }

  function buildSongReadiness(song: Song) {
    const checks = [
      { label: "Artist", complete: Boolean(song.artist?.trim()) },
      { label: "Cover art", complete: Boolean(song.cover_art_data) },
      { label: "Release date", complete: Boolean(song.release_date?.trim()) },
      { label: "ISRC", complete: Boolean(song.isrc?.trim()) },
      { label: "UPC", complete: Boolean(song.upc?.trim()) },
      { label: "Copyright owner", complete: Boolean(song.copyright_owner?.trim()) },
      { label: "Split sheet", complete: song.split_sheet_status === "Completed" },
      { label: "Linked lyric", complete: Boolean(song.lyric_idea_id) },
      { label: "Visual asset", complete: visualAssets.some((asset) => String(asset.song_id) === String(song.id)) },
      { label: "Marketing asset", complete: marketingAssets.some((asset) => String(asset.song_id) === String(song.id)) },
      { label: "Release roadmap", complete: releaseRoadmaps.some((roadmap) => String(roadmap.song_id) === String(song.id)) },
    ];

    const completed = checks.filter((check) => check.complete).length;
    const percent = Math.round((completed / checks.length) * 100);
    const missing = checks.filter((check) => !check.complete).map((check) => check.label);

    return { percent, missing, completed, total: checks.length };
  }

  function buildProjectReadiness(project: Project) {
    const linkedSongs = getProjectSongs(project.id);
    const songsReady = linkedSongs.length > 0 && linkedSongs.every((song) => buildSongReadiness(song).percent >= 70);
    const hasRoadmap = linkedSongs.some((song) =>
      releaseRoadmaps.some((roadmap) => String(roadmap.song_id) === String(song.id)),
    );
    const hasVisual = linkedSongs.some((song) =>
      visualAssets.some((asset) => String(asset.song_id) === String(song.id)),
    ) || Boolean(project.cover_art_data);
    const hasMarketing = linkedSongs.some((song) =>
      marketingAssets.some((asset) => String(asset.song_id) === String(song.id)),
    );
    const hasTasks = linkedSongs.some((song) =>
      calendarTasks.some((task) => String(task.song_id) === String(song.id)),
    );

    const checks = [
      { label: "Project type", complete: Boolean(project.project_type?.trim()) },
      { label: "Artist", complete: Boolean(project.artist?.trim()) },
      { label: "Cover art", complete: Boolean(project.cover_art_data) },
      { label: "Release date", complete: Boolean(project.release_date?.trim()) },
      { label: "UPC", complete: Boolean(project.upc?.trim()) },
      { label: "Linked songs", complete: linkedSongs.length > 0 },
      { label: "Songs at 70%+ readiness", complete: songsReady },
      { label: "Release roadmap", complete: hasRoadmap },
      { label: "Visuals", complete: hasVisual },
      { label: "Marketing", complete: hasMarketing },
      { label: "Calendar tasks", complete: hasTasks },
    ];

    const completed = checks.filter((check) => check.complete).length;
    const percent = Math.round((completed / checks.length) * 100);
    const missing = checks.filter((check) => !check.complete).map((check) => check.label);

    return { percent, missing, completed, total: checks.length, linkedSongs };
  }

  function openSongProfile(song: Song) {
    setSelectedSong(song);
    setActiveDetailTab("Overview");
    setSongFileForm(emptySongFileForm);
    setSongFileUpload(null);
    void refreshSongFiles(song.id);
  }

  useEffect(() => {
    if (selectedSong?.id && activeDetailTab === "Files") {
      void refreshSongFiles(selectedSong.id);
    }
  }, [selectedSong?.id, activeDetailTab]);

  function renderSongCard(song: Song) {
    return (
      <button
        className="song-card song-card-with-art clickable-song-card"
        key={song.id}
        onClick={() => openSongProfile(song)}
      >
        <div className="song-art-thumb">
          {song.cover_art_data ? (
            <img src={song.cover_art_data} alt={`${song.title} cover`} />
          ) : (
            <span>♪</span>
          )}
        </div>

        <div>
          <h4>{song.title}</h4>
          <p>
            {song.artist || "No artist added"} • {song.status || "Idea"} •{" "}
            {song.isrc ? `ISRC: ${song.isrc}` : "No ISRC yet"}
          </p>
        </div>
      </button>
    );
  }

  function renderSongForm(
    form: SongForm,
    setForm: Dispatch<SetStateAction<SongForm>>,
  ) {
    return (
      <>
        <div className="form-section">
          <h4>Basic Song Info</h4>

          <div className="form-grid">
            <input
              placeholder="Song title *"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />

            <input
              placeholder="Artist"
              value={form.artist}
              onChange={(e) => setForm({ ...form, artist: e.target.value })}
            />

            <input
              placeholder="Featured artist"
              value={form.featured_artist}
              onChange={(e) =>
                setForm({ ...form, featured_artist: e.target.value })
              }
            />

            <input
              placeholder="Producer"
              value={form.producer}
              onChange={(e) => setForm({ ...form, producer: e.target.value })}
            />

            <input
              placeholder="Writers"
              value={form.writers}
              onChange={(e) => setForm({ ...form, writers: e.target.value })}
            />

            <input
              placeholder="BPM"
              value={form.bpm}
              onChange={(e) => setForm({ ...form, bpm: e.target.value })}
            />

            <input
              placeholder="Key"
              value={form.song_key}
              onChange={(e) => setForm({ ...form, song_key: e.target.value })}
            />

            <input
              placeholder="Genre"
              value={form.genre}
              onChange={(e) => setForm({ ...form, genre: e.target.value })}
            />

            <input
              placeholder="Mood"
              value={form.mood}
              onChange={(e) => setForm({ ...form, mood: e.target.value })}
            />

            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
            >
              <option>Idea</option>
              <option>Writing</option>
              <option>Demo Recorded</option>
              <option>Recording Complete</option>
              <option>Mixing</option>
              <option>Mastering</option>
              <option>Ready for Release</option>
              <option>Scheduled</option>
              <option>Released</option>
            </select>

            <select
              value={form.project_id}
              onChange={(e) => setForm({ ...form, project_id: e.target.value })}
            >
              <option value="">Project / album optional</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.title}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-section">
          <h4>Cover Art</h4>

          <div className="cover-art-row">
            <div className="cover-preview">
              {form.cover_art_data ? (
                <img src={form.cover_art_data} alt="Cover art preview" />
              ) : (
                <span>No cover art selected</span>
              )}
            </div>

            <div className="cover-actions">
              <p>
                Add cover artwork for this song record. This can be changed
                later.
              </p>

              <label className="upload-btn">
                Choose Image
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) =>
                    handleCoverArtUpload(
                      e.target.files ? e.target.files[0] : null,
                      setForm,
                    )
                  }
                />
              </label>
            </div>
          </div>
        </div>

        <div className="form-section">
          <h4>Release Metadata</h4>

          <div className="form-grid">
            <input
              placeholder="Release date"
              value={form.release_date}
              onChange={(e) =>
                setForm({ ...form, release_date: e.target.value })
              }
            />

            <input
              placeholder="Distributor"
              value={form.distributor}
              onChange={(e) =>
                setForm({ ...form, distributor: e.target.value })
              }
            />

            <input
              placeholder="ISRC"
              value={form.isrc}
              onChange={(e) => setForm({ ...form, isrc: e.target.value })}
            />

            <input
              placeholder="UPC"
              value={form.upc}
              onChange={(e) => setForm({ ...form, upc: e.target.value })}
            />

            <input
              placeholder="Label"
              value={form.label}
              onChange={(e) => setForm({ ...form, label: e.target.value })}
            />

            <input
              placeholder="Copyright year"
              value={form.copyright_year}
              onChange={(e) =>
                setForm({ ...form, copyright_year: e.target.value })
              }
            />

            <input
              placeholder="Copyright owner"
              value={form.copyright_owner}
              onChange={(e) =>
                setForm({ ...form, copyright_owner: e.target.value })
              }
            />

            <input
              placeholder="Publishing administrator"
              value={form.publishing_admin}
              onChange={(e) =>
                setForm({ ...form, publishing_admin: e.target.value })
              }
            />
          </div>
        </div>

        <div className="form-section">
          <h4>Royalties and Rights</h4>

          <div className="form-grid">
            <input
              placeholder="Performance rights organization"
              value={form.pro}
              onChange={(e) => setForm({ ...form, pro: e.target.value })}
            />

            <select
              value={form.soundexchange_status}
              onChange={(e) =>
                setForm({ ...form, soundexchange_status: e.target.value })
              }
            >
              <option value="">SoundExchange status</option>
              <option>Not Started</option>
              <option>Registered</option>
              <option>Not Needed</option>
            </select>

            <select
              value={form.youtube_content_id}
              onChange={(e) =>
                setForm({ ...form, youtube_content_id: e.target.value })
              }
            >
              <option value="">YouTube Content ID</option>
              <option>Not Started</option>
              <option>Enabled</option>
              <option>Not Needed</option>
            </select>

            <select
              value={form.mechanical_royalties}
              onChange={(e) =>
                setForm({ ...form, mechanical_royalties: e.target.value })
              }
            >
              <option value="">Mechanical royalties</option>
              <option>Not Started</option>
              <option>Registered</option>
              <option>Not Needed</option>
            </select>

            <select
              value={form.split_sheet_status}
              onChange={(e) =>
                setForm({ ...form, split_sheet_status: e.target.value })
              }
            >
              <option value="">Split sheet status</option>
              <option>Not Started</option>
              <option>Completed</option>
              <option>Not Needed</option>
            </select>

            <select
              value={form.sample_clearance}
              onChange={(e) =>
                setForm({ ...form, sample_clearance: e.target.value })
              }
            >
              <option value="">Sample clearance</option>
              <option>No Samples Used</option>
              <option>Needs Clearance</option>
              <option>Cleared</option>
            </select>
          </div>
        </div>

        <div className="form-section">
          <h4>Notes</h4>

          <div className="form-grid">
            <textarea
              placeholder="Song notes, release notes, business notes, or reminders"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </div>
        </div>
      </>
    );
  }

  function renderDetailContent() {
    if (!selectedSong) return null;

    if (activeDetailTab === "Overview") {
      return (
        <div className="detail-grid">
          <div className="detail-section">
            <h4>Basic Info</h4>
            <p>
              <span>Artist:</span> {displayValue(selectedSong.artist)}
            </p>
            <p>
              <span>Featured Artist:</span>{" "}
              {displayValue(selectedSong.featured_artist)}
            </p>
            <p>
              <span>Producer:</span> {displayValue(selectedSong.producer)}
            </p>
            <p>
              <span>Writers:</span> {displayValue(selectedSong.writers)}
            </p>
            <p>
              <span>BPM:</span> {displayValue(selectedSong.bpm)}
            </p>
            <p>
              <span>Key:</span> {displayValue(selectedSong.song_key)}
            </p>
            <p>
              <span>Genre:</span> {displayValue(selectedSong.genre)}
            </p>
            <p>
              <span>Mood:</span> {displayValue(selectedSong.mood)}
            </p>
          </div>

          <div className="detail-section">
            <h4>Notes</h4>
            <p>{displayValue(selectedSong.notes)}</p>
          </div>
        </div>
      );
    }

    if (activeDetailTab === "Metadata") {
      return (
        <div className="detail-grid">
          <div className="detail-section">
            <h4>Release Metadata</h4>
            <p>
              <span>Release Date:</span>{" "}
              {displayValue(selectedSong.release_date)}
            </p>
            <p>
              <span>Distributor:</span> {displayValue(selectedSong.distributor)}
            </p>
            <p>
              <span>ISRC:</span> {displayValue(selectedSong.isrc)}
            </p>
            <p>
              <span>UPC:</span> {displayValue(selectedSong.upc)}
            </p>
            <p>
              <span>Label:</span> {displayValue(selectedSong.label)}
            </p>
          </div>

          <div className="detail-section">
            <h4>Copyright</h4>
            <p>
              <span>Copyright Year:</span>{" "}
              {displayValue(selectedSong.copyright_year)}
            </p>
            <p>
              <span>Copyright Owner:</span>{" "}
              {displayValue(selectedSong.copyright_owner)}
            </p>
            <p>
              <span>Publishing Admin:</span>{" "}
              {displayValue(selectedSong.publishing_admin)}
            </p>
          </div>
        </div>
      );
    }

    if (activeDetailTab === "Rights") {
      return (
        <div className="detail-grid">
          <div className="detail-section">
            <h4>Rights and Royalties</h4>
            <p>
              <span>PRO:</span> {displayValue(selectedSong.pro)}
            </p>
            <p>
              <span>SoundExchange:</span>{" "}
              {displayValue(selectedSong.soundexchange_status)}
            </p>
            <p>
              <span>YouTube Content ID:</span>{" "}
              {displayValue(selectedSong.youtube_content_id)}
            </p>
            <p>
              <span>Mechanical Royalties:</span>{" "}
              {displayValue(selectedSong.mechanical_royalties)}
            </p>
            <p>
              <span>Split Sheet:</span>{" "}
              {displayValue(selectedSong.split_sheet_status)}
            </p>
            <p>
              <span>Sample Clearance:</span>{" "}
              {displayValue(selectedSong.sample_clearance)}
            </p>
          </div>

          <div className="detail-section">
            <h4>Next Rights Tasks</h4>
            <p>
              <span>Split Sheet:</span> Confirm all writers, artists, and
              producers.
            </p>
            <p>
              <span>Publishing:</span> Confirm songwriter and publisher shares.
            </p>
            <p>
              <span>Copyright:</span> Track composition and master recording
              ownership.
            </p>
          </div>
        </div>
      );
    }

    if (activeDetailTab === "Lyrics") {
      const linkedLyricIdea = getLinkedLyricIdea(selectedSong);

      return (
        <div className="detail-grid">
          <div className="detail-section lyric-wide-section">
            <h4>Connect Lyrics Studio Asset</h4>
            <p>
              Choose a saved lyric idea from Lyrics Studio and attach it to this
              official song record.
            </p>

            <div className="form-grid ai-form-grid">
              <select
                value={selectedSong.lyric_idea_id ? String(selectedSong.lyric_idea_id) : ""}
                onChange={(e) => linkLyricIdeaToSelectedSong(e.target.value)}
              >
                <option value="">No lyric asset linked</option>
                {lyricIdeas.map((idea) => (
                  <option key={idea.id} value={idea.id}>
                    {idea.title}
                  </option>
                ))}
              </select>
            </div>

            {lyricIdeas.length === 0 && (
              <p>
                <span>Tip:</span> Create lyric ideas in Lyrics Studio first, then
                come back here to connect them to official songs.
              </p>
            )}
          </div>

          {linkedLyricIdea ? (
            <>
              <div className="detail-section">
                <h4>Linked Lyric Asset</h4>
                <p>{linkedLyricIdea.title}</p>
              </div>

              <div className="detail-section">
                <h4>Mood</h4>
                <p>{displayValue(linkedLyricIdea.mood)}</p>
              </div>

              <div className="detail-section lyric-wide-section">
                <h4>Concept</h4>
                <p>{displayValue(linkedLyricIdea.concept)}</p>
              </div>

              <div className="detail-section lyric-wide-section">
                <h4>Lyrics</h4>
                <pre>{displayValue(linkedLyricIdea.lyrics)}</pre>
              </div>

              <div className="detail-section lyric-wide-section">
                <h4>Notes</h4>
                <p>{displayValue(linkedLyricIdea.notes)}</p>
              </div>

              <div className="detail-section lyric-wide-section">
                <h4>Actions</h4>
                <div className="asset-header-actions">
                  <button
                    className="secondary-btn"
                    onClick={() => openLinkedLyricIdea(linkedLyricIdea)}
                  >
                    Open in Lyrics Studio
                  </button>

                  <button
                    className="secondary-btn"
                    onClick={() => linkLyricIdeaToSelectedSong("")}
                  >
                    Unlink Lyrics
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="detail-section lyric-wide-section">
              <h4>No Lyrics Linked Yet</h4>
              <p>
                This song is not connected to a Lyrics Studio asset yet. Select
                one above so your lyrics, concept, and writing notes live inside
                the official song profile.
              </p>
            </div>
          )}
        </div>
      );
    }

    if (activeDetailTab === "Marketing") {
      return (
        <div className="detail-grid">
          <div className="detail-section">
            <h4>Marketing Workspace</h4>
            <p>
              Captions, ads, rollout plans, and content ideas will attach to
              this song here.
            </p>
          </div>

          <div className="detail-section">
            <h4>Planned Tools</h4>
            <p>
              <span>Captions:</span> Instagram, TikTok, Facebook, YouTube, and
              X.
            </p>
            <p>
              <span>Ads:</span> short promo copy and call-to-action variations.
            </p>
            <p>
              <span>Roadmap:</span> release rollout schedule and daily content
              plan.
            </p>
          </div>
        </div>
      );
    }

    if (activeDetailTab === "Files") {
      const currentSongFiles = selectedSong
        ? songFiles.filter((file) => String(file.song_id) === String(selectedSong.id))
        : [];

      return (
        <div className="detail-grid">
          <div className="detail-section lyric-wide-section">
            <h4>Files & Cloud Links</h4>
            <p>
              Upload masters, mixes, stems, cover art, split sheets, or paste links
              from Google Drive, Dropbox, OneDrive, and other cloud services.
            </p>

            <div
              className="form-grid"
              style={{
                marginTop: "16px",
                padding: "16px",
                borderRadius: "18px",
                border: "1px solid rgba(255,255,255,0.12)",
                background: "rgba(255,255,255,0.04)",
              }}
            >
              <select
                value={songFileForm.file_type}
                onChange={(e) =>
                  setSongFileForm({ ...songFileForm, file_type: e.target.value })
                }
              >
                <option>Master</option>
                <option>Final WAV</option>
                <option>Final MP3</option>
                <option>Clean Version</option>
                <option>Instrumental</option>
                <option>Acapella</option>
                <option>Stems ZIP</option>
                <option>Cover Art</option>
                <option>Split Sheet</option>
                <option>Contract</option>
                <option>Marketing Asset</option>
                <option>Other</option>
              </select>

              <input
                placeholder="File label, example: Final master v2"
                value={songFileForm.file_label}
                onChange={(e) =>
                  setSongFileForm({ ...songFileForm, file_label: e.target.value })
                }
              />

              <div
                style={{
                  display: "grid",
                  gap: "10px",
                  padding: "16px",
                  borderRadius: "18px",
                  border: "1px dashed rgba(255,255,255,0.18)",
                  background:
                    "linear-gradient(135deg, rgba(91,140,255,0.10), rgba(255,255,255,0.03))",
                }}
              >
                <strong>Upload file</strong>
                <small style={{ opacity: 0.72 }}>
                  Audio, ZIP stems, artwork, PDFs, contracts, and other release assets.
                </small>

                <input
                  id="song-file-upload-input"
                  type="file"
                  onChange={(e) =>
                    setSongFileUpload(e.target.files ? e.target.files[0] : null)
                  }
                  style={{ display: "none" }}
                />

                <label
                  htmlFor="song-file-upload-input"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    padding: "14px",
                    borderRadius: "16px",
                    border: "1px solid rgba(255,255,255,0.12)",
                    background: "rgba(255,255,255,0.055)",
                    cursor: "pointer",
                  }}
                >
                  <span
                    style={{
                      width: "42px",
                      height: "42px",
                      borderRadius: "14px",
                      display: "grid",
                      placeItems: "center",
                      flex: "0 0 auto",
                      fontWeight: 900,
                      color: "#fff",
                      background: "linear-gradient(135deg, #5b8cff, #c9a94f)",
                      boxShadow: "0 12px 28px rgba(91,140,255,0.24)",
                    }}
                  >
                    {songFileUpload ? "✓" : "↑"}
                  </span>

                  <span style={{ display: "grid", gap: "3px", minWidth: 0 }}>
                    <strong>
                      {songFileUpload ? songFileUpload.name : "Choose file"}
                    </strong>
                    <small style={{ opacity: 0.7 }}>
                      {songFileUpload
                        ? `${(songFileUpload.size / (1024 * 1024)).toFixed(2)} MB selected`
                        : "Click to upload audio, artwork, stems, documents, or ZIP files"}
                    </small>
                  </span>
                </label>
              </div>

              <input
                placeholder="Or paste Google Drive / Dropbox / OneDrive link"
                value={songFileForm.external_url}
                onChange={(e) =>
                  setSongFileForm({ ...songFileForm, external_url: e.target.value })
                }
              />

              <textarea
                placeholder="File notes, version notes, mix notes, usage notes"
                value={songFileForm.notes}
                onChange={(e) =>
                  setSongFileForm({ ...songFileForm, notes: e.target.value })
                }
              />

              <div
                style={{
                  gridColumn: "1 / -1",
                  display: "flex",
                  justifyContent: "flex-end",
                  alignItems: "center",
                  gap: "12px",
                  marginTop: "2px",
                  paddingTop: "16px",
                  borderTop: "1px solid rgba(255,255,255,0.08)",
                }}
              >
                <button
                  className="save-btn"
                  onClick={saveSongFile}
                  disabled={songFileSaving}
                  style={{ minWidth: "160px" }}
                >
                  {songFileSaving ? "Saving File..." : "Save File / Link"}
                </button>

                <button
                  className="secondary-btn"
                  onClick={() => {
                    setSongFileForm(emptySongFileForm);
                    setSongFileUpload(null);
                  }}
                  disabled={songFileSaving}
                  style={{ minWidth: "96px" }}
                >
                  Clear
                </button>
              </div>
            </div>
          </div>

          <div className="detail-section lyric-wide-section">
            <h4>Attached Files</h4>

            {songFilesLoading ? (
              <p>Loading files...</p>
            ) : currentSongFiles.length === 0 ? (
              <p>No files or cloud links saved for this song yet.</p>
            ) : (
              <div
                style={{
                  display: "grid",
                  gap: "12px",
                  marginTop: "14px",
                }}
              >
                {currentSongFiles.map((file) => {
                  const link = getSongFileLink(file);

                  return (
                    <div
                      key={file.id}
                      style={{
                        padding: "14px",
                        borderRadius: "18px",
                        border: "1px solid rgba(255,255,255,0.12)",
                        background:
                          "linear-gradient(135deg, rgba(91,140,255,0.12), rgba(255,255,255,0.035))",
                        display: "grid",
                        gap: "8px",
                      }}
                    >
                      <div>
                        <h4 style={{ margin: 0 }}>{formatSongFileTypeLabel(file)}</h4>
                        <p style={{ margin: "6px 0 0" }}>
                          {file.file_name || file.external_url || "Saved asset"}
                        </p>
                      </div>

                      <p>
                        <span>Size:</span> {displayValue(file.file_size)}
                      </p>

                      <p>
                        <span>Notes:</span> {displayValue(file.notes)}
                      </p>

                      <div className="asset-header-actions">
                        {link ? (
                          <a
                            className="secondary-btn"
                            href={link}
                            target="_blank"
                            rel="noreferrer"
                          >
                            Open File
                          </a>
                        ) : null}

                        <button
                          className="danger-btn"
                          onClick={() => removeSongFile(file.id)}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      );
    }

    return null;
  }

  function renderDashboard() {
    const recentSongs = songs.slice(0, 4);

    return (
      <>
        <header className="topbar">
          <div>
            <p className="eyebrow">Private Artist Operating System</p>
            <h2>Build, organize, release, and promote your music.</h2>
          </div>

          <button className="primary-btn" onClick={() => setShowNewSong(true)}>
            + New Song
          </button>
        </header>

        <section className="hero-card">
          <div>
            <p className="eyebrow">Today’s Mission</p>
            <h3>Turn your ideas into finished releases.</h3>
            <p>
              Manage lyrics, songs, rollout plans, visuals, products, and
              promotion from one focused workspace.
            </p>
          </div>

          <div className="welcome-command-card">
            <p className="eyebrow">Welcome Back</p>
            <h4>Track Adam, lock in and move one thing forward today.</h4>
            <p>
              Start with one priority, build with intention, and leave the session
              with something saved, scheduled, written, or ready to release.
            </p>
            <div className="welcome-focus-list">
              <span>Pick the mission</span>
              <span>Create the asset</span>
              <span>Save the progress</span>
            </div>
          </div>
        </section>

        <section className="stats-grid">
          <div className="stat-card">
            <span>Official Songs</span>
            <strong>{songs.length}</strong>
          </div>

          <div className="stat-card">
            <span>Projects / Albums</span>
            <strong>{projects.length}</strong>
          </div>

          <div className="stat-card">
            <span>Lyric Ideas</span>
            <strong>{lyricIdeas.length}</strong>
          </div>

          <div className="stat-card">
            <span>Marketing Assets</span>
            <strong>{marketingAssets.length}</strong>
          </div>

          <div className="stat-card">
            <span>Visual Assets</span>
            <strong>{visualAssets.length}</strong>
          </div>

          <div className="stat-card">
            <span>Release Roadmaps</span>
            <strong>{releaseRoadmaps.length}</strong>
          </div>

          <div className="stat-card">
            <span>Calendar Tasks</span>
            <strong>{calendarTasks.length}</strong>
          </div>

          <div className="stat-card">
            <span>Products</span>
            <strong>{productAssets.length}</strong>
          </div>
        </section>

        <section className="recent-songs">
          <div className="section-heading">
            <h3>Recent Songs</h3>
            <p>Your latest official catalog records.</p>
          </div>

          <div className="song-list">
            {recentSongs.length === 0 && session && !cloudDataLoaded ? (
              <div className="empty-card">
                Loading your cloud catalog...
              </div>
            ) : recentSongs.length === 0 ? (
              <div className="empty-card">
                No official songs yet. Create your first song record.
              </div>
            ) : (
              recentSongs.map((song) => renderSongCard(song))
            )}
          </div>
        </section>

        <section>
          <div className="section-heading">
            <h3>Command Modules</h3>
            <p>Choose what you want to build today.</p>
          </div>

          <div className="module-grid">
            {modules.map((module) => (
              <button
                className="module-card"
                key={module.title}
                onClick={() => setActivePage(module.page)}
              >
                <h4>{module.title}</h4>
                <p>{module.desc}</p>
              </button>
            ))}
          </div>
        </section>
      </>
    );
  }

  function renderSongsPage() {
    return (
      <section className="page-panel">
        <div className="page-header">
          <div>
            <p className="eyebrow">Catalog</p>
            <h2>Song Catalog</h2>
            <p>
              Every official song record, release, master, and metadata entry.
            </p>
          </div>

          <button className="primary-btn" onClick={() => setShowNewSong(true)}>
            + New Song
          </button>
        </div>

        <div className="song-list full-song-list">
          {songs.length === 0 && session && !cloudDataLoaded ? (
            <div className="empty-card">
              Loading songs from your cloud workspace...
            </div>
          ) : songs.length === 0 ? (
            <div className="empty-card">
              No songs saved yet. Add your first official song record.
            </div>
          ) : (
            songs.map((song) => renderSongCard(song))
          )}
        </div>
      </section>
    );
  }

  function renderProjectsPage() {
    const selectedProjectSongs = selectedProject ? getProjectSongs(selectedProject.id) : [];
    const availableSongs = selectedProject ? getAvailableSongsForProject(selectedProject.id) : [];
    const readiness = selectedProject ? buildProjectReadiness(selectedProject) : null;

    return (
      <section className="page-panel projects-page">
        <div className="page-header">
          <div>
            <p className="eyebrow">Albums / Projects</p>
            <h2>Projects Command Center</h2>
            <p>
              Group songs into albums, EPs, beat tapes, campaigns, and release projects.
              Track what is ready and what still needs work.
            </p>
          </div>

          <button className="primary-btn" onClick={() => setShowNewProject(true)}>
            + New Project
          </button>
        </div>

        <section className="projects-section">
          <div className="section-heading">
            <h3>Projects</h3>
            <p>Albums, EPs, mixtapes, beat tapes, and single campaigns.</p>
          </div>

          <div className="project-card-grid">
            {projects.length === 0 ? (
              <div className="empty-card">
                No projects yet. Create your first album, EP, beat tape, or campaign.
              </div>
            ) : (
              projects.map((project) => {
                const projectReadiness = buildProjectReadiness(project);

                return (
                  <button
                    className={
                      selectedProject?.id === project.id
                        ? "project-card project-card-active"
                        : "project-card"
                    }
                    key={project.id}
                    onClick={() => setSelectedProject(project)}
                  >
                    <div className="project-card-art">
                      {project.cover_art_data ? (
                        <img src={project.cover_art_data} alt={`${project.title} cover`} />
                      ) : (
                        <span>◆</span>
                      )}
                    </div>

                    <div>
                      <h4>{project.title}</h4>
                      <p>
                        {project.project_type || "Project"} • {project.status || "Idea"} • {projectReadiness.percent}% ready
                      </p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </section>

        {selectedProject && readiness ? (
          <section className="project-detail-section">
            <div className="lyric-detail-header">
              <div>
                <p className="eyebrow">Selected Project</p>
                <h3>{selectedProject.title}</h3>
              </div>

              <div className="asset-header-actions">
                <button className="secondary-btn" onClick={() => startEditingProject(selectedProject)}>
                  Edit Project
                </button>

                <button className="secondary-btn" onClick={() => setSelectedProject(null)}>
                  Close Project
                </button>

                <button className="danger-btn" onClick={() => deleteProject(selectedProject.id)}>
                  Delete Project
                </button>
              </div>
            </div>

            <div className="project-hero-card">
              <div className="project-hero-art">
                {selectedProject.cover_art_data ? (
                  <img src={selectedProject.cover_art_data} alt={`${selectedProject.title} cover`} />
                ) : (
                  <span>◆</span>
                )}
              </div>

              <div>
                <p className="song-profile-status">{selectedProject.status || "Idea"}</p>
                <h2>{selectedProject.title}</h2>
                <p>
                  {selectedProject.project_type || "Project"} • {selectedProject.artist || "No artist added"} • {selectedProject.release_date || "No release date"}
                </p>
              </div>
            </div>

            <div className="project-readiness-card">
              <div>
                <p className="eyebrow">Project Health</p>
                <h3>{readiness.percent}% Ready</h3>
                <p>
                  {readiness.completed} of {readiness.total} readiness checks complete.
                </p>
              </div>

              <div className="readiness-bar-shell">
                <div
                  className="readiness-bar-fill"
                  style={{ width: `${readiness.percent}%` }}
                />
              </div>

              <div className="readiness-missing-list">
                {readiness.missing.length === 0 ? (
                  <span>Everything looks ready.</span>
                ) : (
                  readiness.missing.slice(0, 8).map((item) => <span key={item}>{item}</span>)
                )}
              </div>
            </div>

            <div className="lyric-detail-grid">
              <div className="detail-section">
                <h4>Project Type</h4>
                <p>{displayValue(selectedProject.project_type)}</p>
              </div>

              <div className="detail-section">
                <h4>Release Date</h4>
                <p>{displayValue(selectedProject.release_date)}</p>
              </div>

              <div className="detail-section">
                <h4>UPC</h4>
                <p>{displayValue(selectedProject.upc)}</p>
              </div>

              <div className="detail-section">
                <h4>Distributor</h4>
                <p>{displayValue(selectedProject.distributor)}</p>
              </div>

              <div className="detail-section lyric-wide-section">
                <h4>Notes</h4>
                <p>{displayValue(selectedProject.notes)}</p>
              </div>
            </div>

            <div className="project-song-manager">
              <div className="section-heading">
                <h3>Project Songs</h3>
                <p>Add existing songs from your catalog or create a new song directly inside this project.</p>
              </div>

              <div className="project-add-song-row">
                <select
                  value={projectSongToAdd}
                  onChange={(e) => setProjectSongToAdd(e.target.value)}
                >
                  <option value="">Choose a song to add</option>
                  {availableSongs.map((song) => (
                    <option key={song.id} value={song.id}>
                      {song.title}
                    </option>
                  ))}
                </select>

                <button className="save-btn" onClick={addSongToProject}>
                  Add Existing Song
                </button>

                <button
                  className="secondary-btn"
                  onClick={() => startNewSongForProject(selectedProject)}
                >
                  + New Song for Project
                </button>
              </div>

              <div className="project-song-grid">
                {selectedProjectSongs.length === 0 ? (
                  <div className="empty-card">
                    No songs linked yet. Add existing songs or create a new song directly for this project.
                  </div>
                ) : (
                  selectedProjectSongs.map((song) => {
                    const songReadiness = buildSongReadiness(song);

                    return (
                      <div className="project-song-card" key={song.id}>
                        <div className="song-art-thumb project-song-thumb">
                          {song.cover_art_data ? (
                            <img src={song.cover_art_data} alt={`${song.title} cover`} />
                          ) : (
                            <span>♪</span>
                          )}
                        </div>

                        <div>
                          <h4>{song.title}</h4>
                          <p>
                            {song.artist || "No artist"} • {songReadiness.percent}% ready
                          </p>
                          <div className="mini-readiness-bar">
                            <div style={{ width: `${songReadiness.percent}%` }} />
                          </div>
                        </div>

                        <button
                          className="secondary-btn"
                          onClick={() => openSongProfile(song)}
                        >
                          Open
                        </button>

                        <button
                          className="danger-btn"
                          onClick={() => removeSongFromProject(song.id)}
                        >
                          Remove
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </section>
        ) : null}
      </section>
    );
  }

  function renderLyricsPage() {
    return (
      <section className="page-panel">
        <div className="page-header">
          <div>
            <p className="eyebrow">Creative Workspace</p>
            <h2>Lyrics Studio</h2>
            <p>
              Write hooks, verses, concepts, rough ideas, and song drafts before
              turning them into official song records.
            </p>
          </div>

          <button
            className="primary-btn"
            onClick={() => setShowNewLyricIdea(true)}
          >
            + New Lyric Idea
          </button>
        </div>

        <div className="lyrics-layout">
          <div className="lyric-idea-list">
            <div className="section-heading">
              <h3>Song Ideas</h3>
              <p>Creative drafts that are not official song records yet.</p>
            </div>

            {lyricIdeas.length === 0 ? (
              <div className="empty-card">
                No lyric ideas yet. Start with a hook, title, or rough concept.
              </div>
            ) : (
              lyricIdeas.map((idea) => (
                <button
                  className={
                    selectedLyricIdea?.id === idea.id
                      ? "lyric-card lyric-card-active"
                      : "lyric-card"
                  }
                  key={idea.id}
                  onClick={() => setSelectedLyricIdea(idea)}
                >
                  <h4>{idea.title}</h4>
                  <p>{idea.mood || "No mood added"}</p>
                </button>
              ))
            )}
          </div>

          <div className="lyric-editor-panel">
            {selectedLyricIdea ? (
              <>
                <div className="lyric-detail-header">
                  <div>
                    <p className="eyebrow">Selected Idea</p>
                    <h3>{selectedLyricIdea.title}</h3>
                  </div>

                  <div className="asset-header-actions">
                    <button
                      className="secondary-btn"
                      onClick={() => startEditingLyricIdea(selectedLyricIdea)}
                    >
                      Edit Idea
                    </button>

                    <button
                      className="secondary-btn"
                      onClick={() => setSelectedLyricIdea(null)}
                    >
                      Close Idea
                    </button>

                    <button
                      className="danger-btn"
                      onClick={() => deleteLyricIdea(selectedLyricIdea.id)}
                    >
                      Delete Idea
                    </button>
                  </div>
                </div>

                <div className="lyric-detail-grid">
                  <div className="detail-section">
                    <h4>Mood</h4>
                    <p>{displayValue(selectedLyricIdea.mood)}</p>
                  </div>

                  <div className="detail-section">
                    <h4>Concept</h4>
                    <p>{displayValue(selectedLyricIdea.concept)}</p>
                  </div>

                  <div className="detail-section lyric-wide-section">
                    <h4>Lyrics</h4>
                    <pre>{displayValue(selectedLyricIdea.lyrics)}</pre>
                  </div>

                  <div className="detail-section lyric-wide-section">
                    <h4>Notes</h4>
                    <p>{displayValue(selectedLyricIdea.notes)}</p>
                  </div>
                </div>
              </>
            ) : (
              <div className="empty-card tall-empty-card">
                Select a lyric idea to view it. The AI Lyrics Assistant is ready below.
              </div>
            )}

            <div className="assistant-placeholder lyrics-ai-panel">
              <p className="eyebrow">AI Lyrics Assistant</p>
              <h4>Generate lyric help</h4>
              <p>
                Select a lyric idea on the left, choose the help type, then generate
                hooks, verses, title ideas, rewrites, feedback, or rhyme support.
              </p>

              <div className="form-grid ai-form-grid">
                <select
                  value={lyricsAIForm.help_type}
                  onChange={(e) =>
                    setLyricsAIForm({
                      ...lyricsAIForm,
                      help_type: e.target.value,
                    })
                  }
                >
                  <option>Hook Ideas</option>
                  <option>Verse Ideas</option>
                  <option>Bridge Ideas</option>
                  <option>Title Ideas</option>
                  <option>Rhyme Ideas</option>
                  <option>Lyric Feedback</option>
                  <option>Rewrite Lines</option>
                  <option>Improve Emotion</option>
                  <option>Cadence Suggestions</option>
                </select>

                <textarea
                  placeholder="Extra direction for the lyrics assistant"
                  value={lyricsAIForm.direction}
                  onChange={(e) =>
                    setLyricsAIForm({
                      ...lyricsAIForm,
                      direction: e.target.value,
                    })
                  }
                />
              </div>

              <div className="ai-action-row">
                <button
                  className="save-btn"
                  onClick={generateLyricsHelpWithAI}
                  disabled={lyricsAILoading || !selectedLyricIdea}
                >
                  {lyricsAILoading
                    ? "Generating..."
                    : selectedLyricIdea
                      ? "Generate with AI"
                      : "Select a Lyric Idea First"}
                </button>

                {lyricsAIOutput.trim() && (
                  <>
                    <button
                      className="secondary-btn"
                      onClick={saveAIOutputAsLyricIdea}
                    >
                      Save as New Lyric Idea
                    </button>

                    <button
                      className="secondary-btn"
                      onClick={clearLyricsAIOutput}
                    >
                      Clear Generated Text
                    </button>
                  </>
                )}
              </div>

              {renderAIProgress(lyricsAILoading, "Writing lyric ideas...")}

              {lyricsAIError && (
                <div className="detail-section ai-error-box">
                  <h4>Generation Error</h4>
                  <p>{lyricsAIError}</p>
                </div>
              )}

              {lyricsAIOutput && (
                <div className="detail-section ai-output-box">
                  <h4>Generated Lyrics Help</h4>
                  <pre>{lyricsAIOutput}</pre>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    );
  }

  function renderMarketingPage() {
    return (
      <section className="page-panel">
        <div className="page-header">
          <div>
            <p className="eyebrow">Promotion</p>
            <h2>Marketing Generator</h2>
            <p>
              Create captions, ad copy, hooks, rollout copy, and promotional
              ideas for songs, products, and campaigns.
            </p>
          </div>

          <button
            className="primary-btn"
            onClick={() => setShowNewMarketingAsset(true)}
          >
            + New Marketing Asset
          </button>
        </div>

        <div className="marketing-layout">
          <div className="marketing-list">
            <div className="section-heading">
              <h3>Marketing Assets</h3>
              <p>Saved captions, hooks, ads, and campaign copy.</p>
            </div>

            {marketingAssets.length === 0 ? (
              <div className="empty-card">
                No marketing assets yet. Create a caption, hook, ad, or promo
                idea.
              </div>
            ) : (
              marketingAssets.map((asset) => (
                <button
                  className={
                    selectedMarketingAsset?.id === asset.id
                      ? "marketing-card marketing-card-active"
                      : "marketing-card"
                  }
                  key={asset.id}
                  onClick={() => setSelectedMarketingAsset(asset)}
                >
                  <h4>{asset.title}</h4>
                  <p>
                    {asset.platform || "No platform"} •{" "}
                    {asset.content_type || "No type"}
                  </p>
                </button>
              ))
            )}
          </div>

          <div className="marketing-detail-panel">
            {selectedMarketingAsset ? (
              <>
                <div className="lyric-detail-header">
                  <div>
                    <p className="eyebrow">Selected Marketing Asset</p>
                    <h3>{selectedMarketingAsset.title}</h3>
                  </div>

                  <div className="asset-header-actions">
                    <button
                      className="secondary-btn"
                      onClick={() => startEditingMarketingAsset(selectedMarketingAsset)}
                    >
                      Edit Asset
                    </button>

                    <button
                      className="secondary-btn"
                      onClick={() => setSelectedMarketingAsset(null)}
                    >
                      Close Asset
                    </button>

                    <button
                      className="danger-btn"
                      onClick={() =>
                        deleteMarketingAsset(selectedMarketingAsset.id)
                      }
                    >
                      Delete Asset
                    </button>
                  </div>
                </div>

                <div className="lyric-detail-grid">
                  <div className="detail-section">
                    <h4>Platform</h4>
                    <p>{displayValue(selectedMarketingAsset.platform)}</p>
                  </div>

                  <div className="detail-section">
                    <h4>Content Type</h4>
                    <p>{displayValue(selectedMarketingAsset.content_type)}</p>
                  </div>

                  <div className="detail-section">
                    <h4>Tone</h4>
                    <p>{displayValue(selectedMarketingAsset.tone)}</p>
                  </div>

                  <div className="detail-section">
                    <h4>Linked Song</h4>
                    <p>{getSongTitle(selectedMarketingAsset.song_id)}</p>
                  </div>

                  <div className="detail-section lyric-wide-section">
                    <h4>Copy</h4>
                    <pre>{displayValue(selectedMarketingAsset.copy)}</pre>
                  </div>

                  <div className="detail-section lyric-wide-section">
                    <h4>Notes</h4>
                    <p>{displayValue(selectedMarketingAsset.notes)}</p>
                  </div>
                </div>
              </>
            ) : (
              <div className="empty-card">
                Select a marketing asset to view it, or use the AI generator
                below.
              </div>
            )}

            <div className="assistant-placeholder">
              <p className="eyebrow">OpenAI Marketing Assistant</p>
              <h4>Generate marketing copy</h4>
              <p>
                Choose a song, platform, content type, and tone. The result can
                be saved directly into your Marketing Assets.
              </p>

              <div className="form-grid ai-form-grid">
                <select
                  value={marketingAIForm.song_id}
                  onChange={(e) =>
                    setMarketingAIForm({
                      ...marketingAIForm,
                      song_id: e.target.value,
                    })
                  }
                >
                  <option value="">Link to song optional</option>
                  {songs.map((song) => (
                    <option key={song.id} value={song.id}>
                      {song.title}
                    </option>
                  ))}
                </select>

                <select
                  value={marketingAIForm.platform}
                  onChange={(e) =>
                    setMarketingAIForm({
                      ...marketingAIForm,
                      platform: e.target.value,
                    })
                  }
                >
                  <option>Instagram</option>
                  <option>TikTok</option>
                  <option>YouTube</option>
                  <option>Facebook</option>
                  <option>X</option>
                  <option>Email</option>
                  <option>Website</option>
                  <option>General</option>
                </select>

                <select
                  value={marketingAIForm.content_type}
                  onChange={(e) =>
                    setMarketingAIForm({
                      ...marketingAIForm,
                      content_type: e.target.value,
                    })
                  }
                >
                  <option>Caption</option>
                  <option>Ad Copy</option>
                  <option>Hook</option>
                  <option>Hashtags</option>
                  <option>Release Announcement</option>
                  <option>Product Promo</option>
                  <option>Email Promo</option>
                  <option>Short Video Script</option>
                </select>

                <select
                  value={marketingAIForm.tone}
                  onChange={(e) =>
                    setMarketingAIForm({
                      ...marketingAIForm,
                      tone: e.target.value,
                    })
                  }
                >
                  <option>Hype</option>
                  <option>Professional</option>
                  <option>Emotional</option>
                  <option>Luxury</option>
                  <option>Street</option>
                  <option>Mysterious</option>
                  <option>Inspirational</option>
                  <option>Direct Sales</option>
                </select>

                <textarea
                  placeholder="Extra direction for the AI. Example: Make it feel premium, mention that the kit is for trap producers, keep it short."
                  value={marketingAIForm.notes}
                  onChange={(e) =>
                    setMarketingAIForm({
                      ...marketingAIForm,
                      notes: e.target.value,
                    })
                  }
                />
              </div>

              <div className="ai-action-row">
                <button
                  className="save-btn"
                  onClick={generateMarketingCopyWithAI}
                  disabled={marketingAILoading}
                >
                  {marketingAILoading ? "Generating..." : "Generate with AI"}
                </button>

                {marketingAIOutput.trim() && (
                  <button
                    className="secondary-btn"
                    onClick={saveAIOutputAsMarketingAsset}
                    disabled={marketingAILoading}
                  >
                    Save Generated Copy
                  </button>
                )}
              </div>

              {renderAIProgress(marketingAILoading, "Generating marketing copy...")}

              {marketingAIError && (
                <div className="detail-section ai-error-box">
                  <h4>AI Error</h4>
                  <p>{marketingAIError}</p>
                </div>
              )}

              {marketingAIOutput && (
                <div className="detail-section ai-output-box">
                  <h4>Generated Copy</h4>
                  <pre>{marketingAIOutput}</pre>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    );
  }

  function renderVisualsPage() {
    const selectedVisualSong = selectedVisualAsset?.song_id
      ? songs.find((song) => String(song.id) === String(selectedVisualAsset.song_id))
      : null;

    return (
      <section className="page-panel">
        <div className="page-header">
          <div>
            <p className="eyebrow">Visual Direction</p>
            <h2>Visual Studio</h2>
            <p>
              Create visual assets once, then click an asset to load it into the
              AI workspace for prompt and image generation.
            </p>
          </div>

          <button
            className="primary-btn"
            onClick={() => setShowNewVisualAsset(true)}
          >
            + New Visual Asset
          </button>
        </div>

        <div className="marketing-layout">
          <div className="marketing-list">
            <div className="section-heading">
              <h3>Visual Assets</h3>
              <p>
                Create the asset details once. Then click an asset to generate from it.
              </p>
            </div>

            {visualAssets.length === 0 ? (
              <div className="empty-card">
                No visual assets yet. Create a visual asset to start building cover art,
                thumbnails, promo images, and campaign visuals.
              </div>
            ) : (
              visualAssets.map((asset) => (
                <button
                  className={
                    selectedVisualAsset?.id === asset.id
                      ? "marketing-card marketing-card-active"
                      : "marketing-card"
                  }
                  key={asset.id}
                  onClick={() => selectVisualAssetForAI(asset)}
                >
                  <h4>{asset.title}</h4>
                  <p>
                    {asset.asset_type || "No type"} • {asset.visual_style || "No style"}
                  </p>
                </button>
              ))
            )}
          </div>

          <div className="marketing-detail-panel">
            {selectedVisualAsset ? (
              <>
                <div className="lyric-detail-header">
                  <div>
                    <p className="eyebrow">Selected Visual Asset</p>
                    <h3>{selectedVisualAsset.title}</h3>
                  </div>

                  <div className="asset-header-actions">
                    <button
                      className="secondary-btn"
                      onClick={() => startEditingVisualAsset(selectedVisualAsset)}
                    >
                      Edit Asset
                    </button>

                    <button
                      className="secondary-btn"
                      onClick={clearSelectedVisualAsset}
                    >
                      Back to Visual List
                    </button>

                    <button
                      className="danger-btn"
                      onClick={() => deleteVisualAsset(selectedVisualAsset.id)}
                    >
                      Delete Asset
                    </button>
                  </div>
                </div>

                <div className="lyric-detail-grid">
                  <div className="detail-section">
                    <h4>Asset Type</h4>
                    <p>{displayValue(selectedVisualAsset.asset_type)}</p>
                  </div>

                  <div className="detail-section">
                    <h4>Visual Style</h4>
                    <p>{displayValue(selectedVisualAsset.visual_style)}</p>
                  </div>

                  <div className="detail-section">
                    <h4>Linked Song</h4>
                    <p>{selectedVisualSong ? selectedVisualSong.title : "No song linked"}</p>
                  </div>

                  <div className="detail-section">
                    <h4>Status</h4>
                    <p>{selectedVisualAsset.prompt ? "Prompt saved" : "Ready to generate"}</p>
                  </div>

                  <div className="detail-section lyric-wide-section">
                    <h4>Prompt / Direction</h4>
                    <pre>{displayValue(selectedVisualAsset.prompt)}</pre>
                  </div>

                  <div className="detail-section lyric-wide-section">
                    <h4>Notes</h4>
                    <p>{displayValue(selectedVisualAsset.notes)}</p>
                  </div>

                  {selectedVisualAsset.reference_image_data && (
                    <div className="detail-section lyric-wide-section">
                      <h4>Saved Reference Image</h4>
                      <img
                        className="generated-image-preview"
                        src={selectedVisualAsset.reference_image_data}
                        alt="Saved visual reference"
                      />
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="empty-card">
                Select a visual asset from the left to load it into the AI workspace.
              </div>
            )}

            <div className="assistant-placeholder visual-ai-panel">
              <p className="eyebrow">OpenAI Visual Assistant</p>
              <h4>Generate from the selected visual asset</h4>
              <p>
                The selected visual asset fills the AI workspace automatically. Generate a
                polished prompt, then generate the image from that prompt.
              </p>

              {selectedVisualAsset ? (
                <div className="lyric-detail-grid">
                  <div className="detail-section">
                    <h4>Using Asset</h4>
                    <p>{selectedVisualAsset.title}</p>
                  </div>

                  <div className="detail-section">
                    <h4>Asset Type</h4>
                    <p>{displayValue(visualAIForm.asset_type)}</p>
                  </div>

                  <div className="detail-section">
                    <h4>Visual Style</h4>
                    <p>{displayValue(visualAIForm.visual_style)}</p>
                  </div>

                  <div className="detail-section">
                    <h4>Linked Song</h4>
                    <p>{selectedVisualSong ? selectedVisualSong.title : "No song linked"}</p>
                  </div>
                </div>
              ) : (
                <div className="empty-card">
                  Select a visual asset first. The AI panel will auto-load the saved info.
                </div>
              )}

              <div className="form-grid ai-form-grid">
                <select
                  value={visualAIForm.size}
                  onChange={(e) =>
                    setVisualAIForm({
                      ...visualAIForm,
                      size: e.target.value,
                    })
                  }
                >
                  <option value="1024x1024">Square - 1024 x 1024</option>
                  <option value="1024x1536">Portrait - 1024 x 1536</option>
                  <option value="1536x1024">Landscape - 1536 x 1024</option>
                </select>
              </div>

              <div className="visual-reference-upload">
                <div className="section-heading compact-heading">
                  <h3>Reference Image</h3>
                  <p>
                    This comes from the selected visual asset. You can still clear it if you want
                    to generate without a reference.
                  </p>
                </div>

                <div className="visual-reference-row">
                  <div className="visual-reference-preview">
                    {visualAIReferenceImage ? (
                      <img src={visualAIReferenceImage} alt="Visual reference preview" />
                    ) : (
                      <span>No reference image saved for this asset</span>
                    )}
                  </div>

                  <div className="visual-reference-actions">
                    {visualAIReferenceImage && (
                      <button
                        className="secondary-btn"
                        onClick={clearVisualReferenceImage}
                      >
                        Clear Reference Image
                      </button>
                    )}

                    <p className="zip-file-info">
                      {visualAIReferenceImageName
                        ? `Using reference: ${visualAIReferenceImageName}`
                        : "This asset will generate from text only unless a reference image is saved on it."}
                    </p>
                  </div>
                </div>
              </div>

              <div className="ai-action-row">
                <button
                  className="save-btn"
                  onClick={generateVisualPromptWithAI}
                  disabled={visualAILoading || !selectedVisualAsset}
                >
                  {visualAILoading ? "Generating..." : selectedVisualAsset ? "Generate with AI" : "Select a Visual Asset First"}
                </button>

                {visualAIOutput.trim() && selectedVisualAsset && (
                  <>
                    <button
                      className="secondary-btn"
                      onClick={saveAIOutputAsVisualAsset}
                      disabled={visualAILoading || visualAIImageLoading}
                    >
                      Save Prompt to Selected Asset
                    </button>

                    <button
                      className="secondary-btn"
                      onClick={generateVisualImageWithAI}
                      disabled={visualAIImageLoading}
                    >
                      {visualAIImageLoading ? "Generating Image..." : "Generate Image"}
                    </button>

                    <button
                      className="secondary-btn"
                      onClick={clearVisualAIOutput}
                    >
                      Clear Generated Text
                    </button>
                  </>
                )}
              </div>

              {renderAIProgress(visualAILoading, "Building visual direction...")}
              {renderAIProgress(visualAIImageLoading, "Generating image preview...")}

              {visualAIError && (
                <div className="detail-section ai-error-box">
                  <h4>Generation Error</h4>
                  <p>{visualAIError}</p>
                </div>
              )}

              {visualAIOutput && (
                <div className="detail-section ai-output-box">
                  <h4>Generated Visual Direction</h4>
                  <pre>{visualAIOutput}</pre>
                </div>
              )}

              {visualAIImageError && (
                <div className="detail-section ai-error-box">
                  <h4>Image Generation Error</h4>
                  <p>{visualAIImageError}</p>
                </div>
              )}

              {visualAIImage && (
                <div className="detail-section ai-output-box">
                  <div className="lyric-detail-header">
                    <div>
                      <h4>Generated Image Preview</h4>
                      <p>Preview only. Later we can save this to a local app folder.</p>
                    </div>

                    <button
                      className="secondary-btn"
                      onClick={clearVisualAIImage}
                    >
                      Clear Generated Image
                    </button>
                  </div>

                  <img
                    className="generated-image-preview"
                    src={`data:image/png;base64,${visualAIImage}`}
                    alt="Generated visual preview"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    );
  }

  function renderReleasesPage() {
    const selectedRoadmapSong = selectedReleaseRoadmap?.song_id
      ? songs.find((song) => String(song.id) === String(selectedReleaseRoadmap.song_id))
      : null;

    return (
      <section className="page-panel">
        <div className="page-header">
          <div>
            <p className="eyebrow">Release System</p>
            <h2>Release Roadmaps</h2>
            <p>
              Plan release dates, campaign goals, platform focus, rollout notes,
              and checklist items for songs and projects.
            </p>
          </div>

          <button
            className="primary-btn"
            onClick={() => setShowNewReleaseRoadmap(true)}
          >
            + New Roadmap
          </button>
        </div>

        <div className="marketing-layout">
          <div className="marketing-list">
            <div className="section-heading">
              <h3>Roadmaps</h3>
              <p>Saved release plans, rollout notes, and checklist ideas.</p>
            </div>

            {releaseRoadmaps.length === 0 ? (
              <div className="empty-card">
                No release roadmaps yet. Create a rollout plan for your next
                song or product.
              </div>
            ) : (
              releaseRoadmaps.map((roadmap) => (
                <button
                  className={
                    selectedReleaseRoadmap?.id === roadmap.id
                      ? "marketing-card marketing-card-active"
                      : "marketing-card"
                  }
                  key={roadmap.id}
                  onClick={() => {
                    setSelectedReleaseRoadmap(roadmap);
                    setRoadmapAIOutput("");
                    setRoadmapAIError("");
                  }}
                >
                  <h4>{roadmap.title}</h4>
                  <p>
                    {roadmap.release_date || "No date"} • {roadmap.release_type || "No type"}
                  </p>
                </button>
              ))
            )}
          </div>

          <div className="marketing-detail-panel">
            {selectedReleaseRoadmap ? (
              <>
                <div className="lyric-detail-header">
                  <div>
                    <p className="eyebrow">Selected Roadmap</p>
                    <h3>{selectedReleaseRoadmap.title}</h3>
                  </div>

                  <div className="asset-header-actions">
                    <button
                      className="secondary-btn"
                      onClick={() => startEditingReleaseRoadmap(selectedReleaseRoadmap)}
                    >
                      Edit Roadmap
                    </button>

                    <button
                      className="secondary-btn"
                      onClick={closeSelectedRoadmap}
                    >
                      Close Roadmap
                    </button>

                    <button
                      className="danger-btn"
                      onClick={() => deleteReleaseRoadmap(selectedReleaseRoadmap.id)}
                    >
                      Delete Roadmap
                    </button>
                  </div>
                </div>

                <div className="lyric-detail-grid">
                  <div className="detail-section">
                    <h4>Linked Song</h4>
                    <p>{selectedRoadmapSong ? selectedRoadmapSong.title : "No song linked"}</p>
                  </div>

                  <div className="detail-section">
                    <h4>Release Date</h4>
                    <p>{displayValue(selectedReleaseRoadmap.release_date)}</p>
                  </div>

                  <div className="detail-section">
                    <h4>Release Type</h4>
                    <p>{displayValue(selectedReleaseRoadmap.release_type)}</p>
                  </div>

                  <div className="detail-section">
                    <h4>Budget Level</h4>
                    <p>{displayValue(selectedReleaseRoadmap.budget_level)}</p>
                  </div>

                  <div className="detail-section lyric-wide-section">
                    <h4>Campaign Goal</h4>
                    <p>{displayValue(selectedReleaseRoadmap.campaign_goal)}</p>
                  </div>

                  <div className="detail-section lyric-wide-section">
                    <h4>Platform Focus</h4>
                    <p>{displayValue(selectedReleaseRoadmap.platform_focus)}</p>
                  </div>

                  <div className="detail-section lyric-wide-section">
                    <h4>Rollout Plan</h4>
                    <pre>{displayValue(selectedReleaseRoadmap.rollout_plan)}</pre>
                  </div>

                  <div className="detail-section lyric-wide-section">
                    <h4>Checklist Notes</h4>
                    <pre>{displayValue(selectedReleaseRoadmap.checklist_notes)}</pre>
                  </div>
                </div>
              </>
            ) : (
              <div className="empty-card tall-empty-card">
                Select a roadmap to view it, or create a new one. The AI Roadmap Assistant is ready below.
              </div>
            )}

            <div className="assistant-placeholder roadmap-ai-panel">
              <p className="eyebrow">OpenAI Roadmap Assistant</p>
              <h4>Generate a release rollout plan</h4>
              <p>
                Select a roadmap first. The assistant will use the selected roadmap’s song,
                release date, campaign goal, budget, platform focus, and existing notes.
              </p>

              {selectedReleaseRoadmap ? (
                <div className="lyric-detail-grid">
                  <div className="detail-section">
                    <h4>Using Roadmap</h4>
                    <p>{selectedReleaseRoadmap.title}</p>
                  </div>

                  <div className="detail-section">
                    <h4>Linked Song</h4>
                    <p>{selectedRoadmapSong ? selectedRoadmapSong.title : "No song linked"}</p>
                  </div>

                  <div className="detail-section">
                    <h4>Release Date</h4>
                    <p>{displayValue(selectedReleaseRoadmap.release_date)}</p>
                  </div>

                  <div className="detail-section">
                    <h4>Platform Focus</h4>
                    <p>{displayValue(selectedReleaseRoadmap.platform_focus)}</p>
                  </div>
                </div>
              ) : (
                <div className="empty-card">
                  No roadmap selected yet. Click a roadmap card to activate AI.
                </div>
              )}

              <div className="form-grid ai-form-grid">
                <select
                  value={roadmapAIForm.help_type}
                  onChange={(e) =>
                    setRoadmapAIForm({
                      ...roadmapAIForm,
                      help_type: e.target.value,
                    })
                  }
                >
                  <option>Full Rollout Plan</option>
                  <option>Pre-Release Plan</option>
                  <option>Post-Release Promo Plan</option>
                  <option>Content Calendar</option>
                  <option>Release Checklist</option>
                  <option>Platform Strategy</option>
                  <option>Budget-Friendly Promo Plan</option>
                  <option>Launch Day Plan</option>
                </select>

                <select
                  value={roadmapAIForm.timeline}
                  onChange={(e) =>
                    setRoadmapAIForm({
                      ...roadmapAIForm,
                      timeline: e.target.value,
                    })
                  }
                >
                  <option>7 Days</option>
                  <option>14 Days</option>
                  <option>30 Days</option>
                  <option>60 Days</option>
                  <option>Release Week</option>
                  <option>Launch Day Only</option>
                </select>

                <select
                  value={roadmapAIForm.tone}
                  onChange={(e) =>
                    setRoadmapAIForm({
                      ...roadmapAIForm,
                      tone: e.target.value,
                    })
                  }
                >
                  <option>Focused</option>
                  <option>Professional</option>
                  <option>Hype</option>
                  <option>Street</option>
                  <option>Premium</option>
                  <option>Disciplined</option>
                  <option>Simple and Practical</option>
                </select>

                <textarea
                  placeholder="Extra direction. Example: Make this realistic for a solo artist with limited time and a small budget."
                  value={roadmapAIForm.notes}
                  onChange={(e) =>
                    setRoadmapAIForm({
                      ...roadmapAIForm,
                      notes: e.target.value,
                    })
                  }
                />
              </div>

              <div className="ai-action-row">
                <button
                  className="save-btn"
                  onClick={generateRoadmapPlanWithAI}
                  disabled={roadmapAILoading || !selectedReleaseRoadmap}
                >
                  {roadmapAILoading
                    ? "Generating..."
                    : selectedReleaseRoadmap
                      ? "Generate with AI"
                      : "Select a Roadmap First"}
                </button>

                {roadmapAIOutput.trim() && selectedReleaseRoadmap && (
                  <>
                    <button
                      className="secondary-btn"
                      onClick={saveRoadmapAIOutputToRolloutPlan}
                      disabled={roadmapAILoading}
                    >
                      Save to Rollout Plan
                    </button>

                    <button
                      className="secondary-btn"
                      onClick={clearRoadmapAIOutput}
                    >
                      Clear Generated Text
                    </button>
                  </>
                )}
              </div>

              {renderAIProgress(roadmapAILoading, "Building release roadmap...")}

              {roadmapAIError && (
                <div className="detail-section ai-error-box">
                  <h4>Generation Error</h4>
                  <p>{roadmapAIError}</p>
                </div>
              )}

              {roadmapAIOutput && (
                <div className="detail-section ai-output-box">
                  <h4>Generated Roadmap Plan</h4>
                  <pre>{roadmapAIOutput}</pre>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    );
  }

  function renderProductsPage() {
    return (
      <section className="page-panel product-vault-page">
        <div className="page-header">
          <div>
            <p className="eyebrow">Product System</p>
            <h2>Product Vault</h2>
            <p>
              Track drum kits, sample packs, beat packs, templates, services,
              and digital offers. Select a product to generate sales copy from it.
            </p>
          </div>

          <button
            className="primary-btn"
            onClick={() => setShowNewProductAsset(true)}
          >
            + New Product
          </button>
        </div>

        <section className="product-vault-section">
          <div className="section-heading">
            <h3>Products</h3>
            <p>Saved offers, beat packs, kits, templates, and launch notes.</p>
          </div>

          {productAssets.length === 0 ? (
            <div className="empty-card">
              No products yet. Create your first kit, beat pack, template, or
              digital offer.
            </div>
          ) : (
            <div className="product-card-grid">
              {productAssets.map((product) => (
                <button
                  className={
                    selectedProductAsset?.id === product.id
                      ? "product-vault-card product-vault-card-active"
                      : "product-vault-card"
                  }
                  key={product.id}
                  onClick={() => selectProductAssetForAI(product)}
                >
                  <div className="product-vault-thumb">
                    {product.product_image_data ? (
                      <img
                        src={product.product_image_data}
                        alt={`${product.title} product`}
                      />
                    ) : (
                      <span>PK</span>
                    )}
                  </div>

                  <div>
                    <h4>{product.title}</h4>
                    <p>
                      {product.product_type || "No type"} • {product.status || "No status"}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </section>

        {selectedProductAsset ? (
          <section className="product-selected-section">
            <div className="lyric-detail-header">
              <div>
                <p className="eyebrow">Selected Product</p>
                <h3>{selectedProductAsset.title}</h3>
              </div>

              <div className="asset-header-actions">
                <button
                  className="secondary-btn"
                  onClick={() => startEditingProductAsset(selectedProductAsset)}
                >
                  Edit Product
                </button>

                <button
                  className="secondary-btn"
                  onClick={clearSelectedProductAsset}
                >
                  Back to Product List
                </button>

                <button
                  className="danger-btn"
                  onClick={() => deleteProductAsset(selectedProductAsset.id)}
                >
                  Delete Product
                </button>
              </div>
            </div>

            <div className="product-profile-header">
              <div className="cover-preview product-detail-image">
                {selectedProductAsset.product_image_data ? (
                  <img
                    src={selectedProductAsset.product_image_data}
                    alt={`${selectedProductAsset.title} product`}
                  />
                ) : (
                  <span>No product image</span>
                )}
              </div>

              <div>
                <p className="song-profile-status">
                  {displayValue(selectedProductAsset.status)}
                </p>
                <h2>{selectedProductAsset.title}</h2>
                <p>
                  {displayValue(selectedProductAsset.product_type)} • {displayValue(selectedProductAsset.price)}
                </p>
              </div>
            </div>

            <div className="lyric-detail-grid">
              <div className="detail-section">
                <h4>Product Type</h4>
                <p>{displayValue(selectedProductAsset.product_type)}</p>
              </div>

              <div className="detail-section">
                <h4>Price</h4>
                <p>{displayValue(selectedProductAsset.price)}</p>
              </div>

              <div className="detail-section">
                <h4>Status</h4>
                <p>{displayValue(selectedProductAsset.status)}</p>
              </div>

              <div className="detail-section">
                <h4>ZIP File</h4>
                <p>{selectedProductAsset.zip_file_name || "No ZIP selected"}</p>
                <p>{selectedProductAsset.zip_file_size || "No file size"}</p>
              </div>

              <div className="detail-section lyric-wide-section">
                <h4>Cloud and Store Links</h4>
                <p><span>Google Drive:</span> {displayValue(selectedProductAsset.google_drive_link)}</p>
                <p><span>OneDrive:</span> {displayValue(selectedProductAsset.onedrive_link)}</p>
                <p><span>Dropbox:</span> {displayValue(selectedProductAsset.dropbox_link)}</p>
                <p><span>Gumroad:</span> {displayValue(selectedProductAsset.gumroad_link)}</p>
                <p><span>Website:</span> {displayValue(selectedProductAsset.website_link)}</p>
              </div>

              <div className="detail-section lyric-wide-section">
                <h4>Description</h4>
                <p>{displayValue(selectedProductAsset.description)}</p>
              </div>

              <div className="detail-section lyric-wide-section">
                <h4>Promo Angle</h4>
                <p>{displayValue(selectedProductAsset.promo_angle)}</p>
              </div>

              <div className="detail-section lyric-wide-section">
                <h4>Launch Notes</h4>
                <p>{displayValue(selectedProductAsset.launch_notes)}</p>
              </div>
            </div>
          </section>
        ) : (
          <div className="empty-card product-selection-card">
            Select a product above to load it into the Product Assistant.
          </div>
        )}

        <section className="assistant-placeholder product-ai-panel">
          <p className="eyebrow">OpenAI Product Assistant</p>
          <h4>Generate product sales copy</h4>
          <p>
            Select a product first. The assistant will use that product’s title,
            type, price, description, promo angle, and launch notes as context.
          </p>

          {selectedProductAsset ? (
            <div className="lyric-detail-grid">
              <div className="detail-section">
                <h4>Using Product</h4>
                <p>{selectedProductAsset.title}</p>
              </div>

              <div className="detail-section">
                <h4>Product Type</h4>
                <p>{displayValue(selectedProductAsset.product_type)}</p>
              </div>

              <div className="detail-section">
                <h4>Price</h4>
                <p>{displayValue(selectedProductAsset.price)}</p>
              </div>

              <div className="detail-section">
                <h4>Promo Angle</h4>
                <p>{displayValue(selectedProductAsset.promo_angle)}</p>
              </div>
            </div>
          ) : (
            <div className="empty-card">
              No product selected yet. Click a product card above to activate AI.
            </div>
          )}

          <div className="form-grid ai-form-grid">
            <select
              value={productAIForm.help_type}
              onChange={(e) =>
                setProductAIForm({
                  ...productAIForm,
                  help_type: e.target.value,
                })
              }
            >
              <option>Gumroad Description</option>
              <option>Short Product Description</option>
              <option>Long Sales Page</option>
              <option>Instagram Caption</option>
              <option>TikTok Caption</option>
              <option>Email Promo</option>
              <option>Ad Copy</option>
              <option>Launch Plan</option>
              <option>Product Name Ideas</option>
              <option>Offer Stack</option>
            </select>

            <select
              value={productAIForm.platform}
              onChange={(e) =>
                setProductAIForm({
                  ...productAIForm,
                  platform: e.target.value,
                })
              }
            >
              <option>Gumroad</option>
              <option>Website</option>
              <option>Instagram</option>
              <option>TikTok</option>
              <option>YouTube</option>
              <option>Email</option>
              <option>Facebook</option>
              <option>X</option>
              <option>General</option>
            </select>

            <select
              value={productAIForm.tone}
              onChange={(e) =>
                setProductAIForm({
                  ...productAIForm,
                  tone: e.target.value,
                })
              }
            >
              <option>Premium</option>
              <option>Hype</option>
              <option>Professional</option>
              <option>Street</option>
              <option>Luxury</option>
              <option>Direct Sales</option>
              <option>Producer Focused</option>
              <option>Clean and Simple</option>
            </select>

            <textarea
              placeholder="Extra direction for this product copy. Example: Push this toward producers using Logic, FL Studio, Ableton, and Studio One. Make it sound premium but not corny."
              value={productAIForm.notes}
              onChange={(e) =>
                setProductAIForm({
                  ...productAIForm,
                  notes: e.target.value,
                })
              }
            />
          </div>

          <div className="ai-action-row">
            <button
              className="save-btn"
              onClick={generateProductCopyWithAI}
              disabled={productAILoading || !selectedProductAsset}
            >
              {productAILoading
                ? "Generating..."
                : selectedProductAsset
                  ? "Generate with AI"
                  : "Select a Product First"}
            </button>

            {productAIOutput.trim() && selectedProductAsset && (
              <>
                <button
                  className="secondary-btn"
                  onClick={saveProductAIOutputToLaunchNotes}
                  disabled={productAILoading}
                >
                  Save to Launch Notes
                </button>

                <button
                  className="secondary-btn"
                  onClick={clearProductAIOutput}
                >
                  Clear Generated Text
                </button>
              </>
            )}
          </div>

          {renderAIProgress(productAILoading, "Generating product sales copy...")}

          {productAIError && (
            <div className="detail-section ai-error-box">
              <h4>Generation Error</h4>
              <p>{productAIError}</p>
            </div>
          )}

          {productAIOutput && (
            <div className="detail-section ai-output-box">
              <h4>Generated Product Copy</h4>
              <pre>{productAIOutput}</pre>
            </div>
          )}
        </section>
      </section>
    );
  }


  function renderEpkBuilderPage() {
    return (
      <section className="page-panel epk-builder-page">
        <div className="page-header">
          <div>
            <p className="eyebrow">Press Kit</p>
            <h2>EPK Builder</h2>
            <p>
              Your press kit should always be ready before the opportunity shows up.
              Build bios, one-sheets, pitches, and press copy from one place.
            </p>
          </div>

          <button
            className="primary-btn"
            onClick={() => setShowNewEpkProfile(true)}
          >
            + New EPK Profile
          </button>
        </div>

        <section className="epk-section">
          <div className="section-heading">
            <h3>EPK Profiles</h3>
            <p>Artist, producer, and project-ready press profiles.</p>
          </div>

          <div className="epk-card-grid">
            {epkProfiles.length === 0 ? (
              <div className="empty-card">
                No EPK profiles yet. Create one so your bio and one-sheet are always ready.
              </div>
            ) : (
              epkProfiles.map((profile) => (
                <button
                  key={profile.id}
                  className={
                    selectedEpkProfile?.id === profile.id
                      ? "epk-card epk-card-active"
                      : "epk-card"
                  }
                  onClick={() => {
                    setSelectedEpkProfile(profile);
                    setEpkAIOutput("");
                    setEpkAIError("");
                  }}
                >
                  <div className="epk-card-photo">
                    {profile.press_photo_data ? (
                      <img src={profile.press_photo_data} alt={`${profile.artist_name} press`} />
                    ) : (
                      <span>EPK</span>
                    )}
                  </div>

                  <div>
                    <h4>{profile.artist_name}</h4>
                    <p>{profile.genre || "No genre added"}</p>
                    <p>{profile.location || "No location added"}</p>
                  </div>
                </button>
              ))
            )}
          </div>
        </section>

        {selectedEpkProfile ? (
          <section className="epk-selected-section">
            <div className="lyric-detail-header">
              <div>
                <p className="eyebrow">Selected EPK</p>
                <h3>{selectedEpkProfile.artist_name}</h3>
              </div>

              <div className="asset-header-actions">
                <button className="secondary-btn" onClick={() => startEditingEpkProfile(selectedEpkProfile)}>
                  Edit EPK
                </button>

                <button className="secondary-btn" onClick={closeEpkProfile}>
                  Close EPK
                </button>

                <button
                  className="danger-btn"
                  onClick={() => deleteEpkProfile(selectedEpkProfile.id)}
                >
                  Delete EPK
                </button>
              </div>
            </div>

            <div className="epk-profile-header">
              <div className="epk-photo-frame">
                {selectedEpkProfile.press_photo_data ? (
                  <img src={selectedEpkProfile.press_photo_data} alt="Press profile" />
                ) : (
                  <span>No press photo</span>
                )}
              </div>

              <div className="epk-logo-frame">
                {selectedEpkProfile.logo_data ? (
                  <img src={selectedEpkProfile.logo_data} alt="EPK logo" />
                ) : (
                  <span>No logo</span>
                )}
              </div>

              <div>
                <p className="song-profile-status">{displayValue(selectedEpkProfile.genre)}</p>
                <h2>{selectedEpkProfile.artist_name}</h2>
                <p>
                  {displayValue(selectedEpkProfile.location)} • {displayValue(selectedEpkProfile.sound_description)}
                </p>
              </div>
            </div>

            <div className="lyric-detail-grid">
              <div className="detail-section">
                <h4>Producer Name</h4>
                <p>{displayValue(selectedEpkProfile.producer_name)}</p>
              </div>

              <div className="detail-section">
                <h4>Linked Song</h4>
                <p>{getSongTitle(selectedEpkProfile.linked_song_id)}</p>
              </div>

              <div className="detail-section">
                <h4>Linked Project</h4>
                <p>{getProjectTitle(selectedEpkProfile.linked_project_id)}</p>
              </div>

              <div className="detail-section">
                <h4>Contact</h4>
                <p>{displayValue(selectedEpkProfile.contact_email)}</p>
              </div>

              <div className="detail-section lyric-wide-section">
                <h4>Story</h4>
                <p>{displayValue(selectedEpkProfile.short_story)}</p>
              </div>

              <div className="detail-section lyric-wide-section">
                <h4>Highlights / Credits</h4>
                <p>{displayValue(selectedEpkProfile.highlights)}</p>
                <p>{displayValue(selectedEpkProfile.credits)}</p>
              </div>

              {selectedEpkProfile.saved_bio && (
                <div className="detail-section lyric-wide-section">
                  <h4>Saved Bio</h4>
                  <pre>{selectedEpkProfile.saved_bio}</pre>
                </div>
              )}

              {selectedEpkProfile.saved_one_sheet && (
                <div className="detail-section lyric-wide-section">
                  <h4>Saved DJ One Sheet</h4>
                  <pre>{selectedEpkProfile.saved_one_sheet}</pre>
                </div>
              )}

              {selectedEpkProfile.saved_pitch && (
                <div className="detail-section lyric-wide-section">
                  <h4>Saved Pitch</h4>
                  <pre>{selectedEpkProfile.saved_pitch}</pre>
                </div>
              )}

              {selectedEpkProfile.saved_press_release && (
                <div className="detail-section lyric-wide-section">
                  <h4>Saved Press Release</h4>
                  <pre>{selectedEpkProfile.saved_press_release}</pre>
                </div>
              )}
            </div>
          </section>
        ) : (
          <section className="epk-selected-section">
            <div className="empty-card">
              Select an EPK profile above to view it and activate the assistant.
            </div>
          </section>
        )}

        <section className="assistant-placeholder epk-ai-panel">
          <p className="eyebrow">OpenAI EPK Assistant</p>
          <h4>Your Press Kit — Always Current, Always Ready</h4>
          <p>
            Generate bios, DJ one-sheets, press releases, venue pitches, and curator-ready copy
            from the selected EPK profile.
          </p>

          {!selectedEpkProfile && (
            <div className="empty-card">
              Select an EPK profile first. The assistant will use that profile’s story,
              highlights, credits, links, and selected release/project.
            </div>
          )}

          <div className="form-grid ai-form-grid">
            <select
              value={epkAIForm.help_type}
              onChange={(e) =>
                setEpkAIForm({
                  ...epkAIForm,
                  help_type: e.target.value,
                })
              }
            >
              <option>Short Bio</option>
              <option>Long Bio</option>
              <option>Producer Bio</option>
              <option>DJ One Sheet</option>
              <option>Venue Pitch</option>
              <option>Curator Pitch</option>
              <option>Press Release</option>
              <option>Email Pitch</option>
            </select>

            <select
              value={epkAIForm.audience}
              onChange={(e) =>
                setEpkAIForm({
                  ...epkAIForm,
                  audience: e.target.value,
                })
              }
            >
              <option>Press / Media</option>
              <option>Venue Booker</option>
              <option>Playlist Curator</option>
              <option>DJ</option>
              <option>Label / A&R</option>
              <option>Brand Partner</option>
              <option>General</option>
            </select>

            <select
              value={epkAIForm.tone}
              onChange={(e) =>
                setEpkAIForm({
                  ...epkAIForm,
                  tone: e.target.value,
                })
              }
            >
              <option>Professional</option>
              <option>Confident</option>
              <option>Luxury</option>
              <option>Street but polished</option>
              <option>Inspirational</option>
              <option>Direct</option>
            </select>

            <textarea
              placeholder="Extra direction. Example: Make it sound polished but not corny. Emphasize my producer identity and independent grind."
              value={epkAIForm.notes}
              onChange={(e) =>
                setEpkAIForm({
                  ...epkAIForm,
                  notes: e.target.value,
                })
              }
            />
          </div>

          <div className="ai-action-row">
            <button
              className="save-btn"
              onClick={generateEpkCopyWithAI}
              disabled={epkAILoading || !selectedEpkProfile}
            >
              {epkAILoading ? "Generating..." : selectedEpkProfile ? "Generate with AI" : "Select an EPK First"}
            </button>

            {epkAIOutput.trim() && (
              <>
                <button className="secondary-btn" onClick={saveEpkAIOutput}>
                  Save Generated Copy
                </button>

                <button className="secondary-btn" onClick={clearEpkAIOutput}>
                  Clear Generated Text
                </button>
              </>
            )}
          </div>

          {epkAILoading && (
            <div className="ai-progress-track">
              <div className="ai-progress-bar" />
            </div>
          )}

          {epkAIError && (
            <div className="detail-section ai-error-box">
              <h4>Generation Error</h4>
              <p>{epkAIError}</p>
            </div>
          )}

          {epkAIOutput && (
            <div className="detail-section ai-output-box">
              <h4>Generated EPK Copy</h4>
              <pre>{epkAIOutput}</pre>
            </div>
          )}
        </section>
      </section>
    );
  }

  function renderWebToolsPage() {
    const favoriteTools = webTools.filter((tool) => Number(tool.is_favorite) === 1);
    const standardTools = webTools.filter((tool) => Number(tool.is_favorite) !== 1);

    return (
      <section className="page-panel web-tools-page">
        <div className="page-header">
          <div>
            <p className="eyebrow">Resource Vault</p>
            <h2>Web Tools</h2>
            <p>
              Save the online dashboards, resources, accounts, and creative tools you use to run your music business.
            </p>
          </div>

          <button className="primary-btn" onClick={() => setShowNewWebTool(true)}>
            + New Web Tool
          </button>
        </div>

        <section className="web-tools-hero hero-card">
          <div>
            <p className="eyebrow">Quick Access</p>
            <h3>Your most important music-business links in one place.</h3>
            <p>
              Keep distribution dashboards, royalty portals, design tools, marketing resources,
              file storage, and favorite learning links organized without hunting through bookmarks.
            </p>
          </div>
        </section>

        {favoriteTools.length > 0 && (
          <section className="web-tools-section">
            <div className="section-heading">
              <h3>Pinned Tools</h3>
              <p>Your highest priority links.</p>
            </div>

            <div className="web-tool-grid">
              {favoriteTools.map((tool) => (
                <button
                  className={
                    selectedWebTool?.id === tool.id
                      ? "web-tool-card web-tool-card-active"
                      : "web-tool-card"
                  }
                  key={tool.id}
                  onClick={() => setSelectedWebTool(tool)}
                >
                  {tool.preview_image_url && (
                    <div className="web-tool-preview-image">
                      <img
                        src={tool.preview_image_url}
                        alt={`${tool.title} preview`}
                        onError={(event) => {
                          event.currentTarget.style.display = "none";
                        }}
                      />
                    </div>
                  )}
                  <span className="web-tool-badge">Pinned</span>
                  <h4>{getWebToolDisplayTitle(tool)}</h4>
                  <p>{tool.category || "General"}</p>
                  <small className="web-tool-url-line">{getWebToolDisplayDescription(tool)}</small>
                </button>
              ))}
            </div>
          </section>
        )}

        <section className="web-tools-section">
          <div className="section-heading">
            <h3>All Web Tools</h3>
            <p>Bookmarks, platforms, portals, dashboards, and resources.</p>
          </div>

          {webTools.length === 0 ? (
            <div className="empty-card">
              No web tools saved yet. Add your first dashboard, resource, or favorite online tool.
            </div>
          ) : (
            <div className="web-tool-grid">
              {(favoriteTools.length > 0 ? standardTools : webTools).map((tool) => (
                <button
                  className={
                    selectedWebTool?.id === tool.id
                      ? "web-tool-card web-tool-card-active"
                      : "web-tool-card"
                  }
                  key={tool.id}
                  onClick={() => setSelectedWebTool(tool)}
                >
                  {tool.preview_image_url && (
                    <div className="web-tool-preview-image">
                      <img
                        src={tool.preview_image_url}
                        alt={`${tool.title} preview`}
                        onError={(event) => {
                          event.currentTarget.style.display = "none";
                        }}
                      />
                    </div>
                  )}
                  <span className="web-tool-badge">{tool.category || "General"}</span>
                  <h4>{getWebToolDisplayTitle(tool)}</h4>
                  <p>{tool.priority || "Normal"}</p>
                  <small className="web-tool-url-line">{getWebToolDisplayDescription(tool)}</small>
                </button>
              ))}
            </div>
          )}
        </section>

        {selectedWebTool && (
          <section className="product-selected-section web-tool-selected-section">
            <div className="lyric-detail-header">
              <div>
                <p className="eyebrow">Selected Web Tool</p>
                <h3>{selectedWebTool.title}</h3>
              </div>

              <div className="asset-header-actions">
                <button className="secondary-btn" onClick={() => startEditingWebTool(selectedWebTool)}>
                  Edit Tool
                </button>

                <button className="secondary-btn" onClick={() => setSelectedWebTool(null)}>
                  Close Tool
                </button>

                <button className="save-btn" onClick={() => openWebTool(selectedWebTool)}>
                  Open Link
                </button>

                <button
                  className="danger-btn"
                  onClick={() => deleteWebTool(selectedWebTool.id)}
                >
                  Delete Tool
                </button>
              </div>
            </div>

            {(selectedWebTool.preview_image_url || selectedWebTool.preview_description || selectedWebTool.preview_site_name) && (
              <div className="web-tool-selected-preview">
                {selectedWebTool.preview_image_url && (
                  <img
                    src={selectedWebTool.preview_image_url}
                    alt={`${selectedWebTool.title} preview`}
                    onError={(event) => {
                      event.currentTarget.style.display = "none";
                    }}
                  />
                )}

                <div>
                  <p className="eyebrow">
                    {selectedWebTool.preview_site_name || selectedWebTool.category || "Link Preview"}
                  </p>
                  <h4>{getWebToolDisplayTitle(selectedWebTool)}</h4>
                  <p>{getWebToolDisplayDescription(selectedWebTool)}</p>
                </div>
              </div>
            )}

            <div className="lyric-detail-grid">
              <div className="detail-section">
                <h4>Category</h4>
                <p>{displayValue(selectedWebTool.category)}</p>
              </div>

              <div className="detail-section">
                <h4>Priority</h4>
                <p>{displayValue(selectedWebTool.priority)}</p>
              </div>

              <div className="detail-section">
                <h4>Pinned</h4>
                <p>{Number(selectedWebTool.is_favorite) === 1 ? "Yes" : "No"}</p>
              </div>

              <div className="detail-section lyric-wide-section">
                <h4>URL</h4>
                <p>{displayValue(selectedWebTool.url)}</p>
              </div>

              <div className="detail-section lyric-wide-section">
                <h4>Description</h4>
                <p>{displayValue(selectedWebTool.description)}</p>
              </div>

              <div className="detail-section lyric-wide-section">
                <h4>Login / Usage Notes</h4>
                <pre>{displayValue(selectedWebTool.login_notes)}</pre>
              </div>
            </div>
          </section>
        )}
      </section>
    );
  }

  function renderPlannerNoteForm(
    form: PlannerNoteForm,
    setForm: Dispatch<SetStateAction<PlannerNoteForm>>,
  ) {
    return (
      <div className="form-grid notebook-form-grid">
        <select
          value={form.notebook_id}
          onChange={(e) => setForm({ ...form, notebook_id: e.target.value })}
        >
          <option value="">Inbox / Brain Dump</option>
          {notebooks.map((notebook) => (
            <option key={notebook.id} value={notebook.id}>
              {notebook.name}
            </option>
          ))}
        </select>

        <select
          value={form.note_type}
          onChange={(e) => setForm({ ...form, note_type: e.target.value })}
        >
          <option>Brain Dump</option>
          <option>Playlist Lead</option>
          <option>Contact</option>
          <option>Content Idea</option>
          <option>Song Idea</option>
          <option>Business Idea</option>
          <option>Product Idea</option>
          <option>Link</option>
          <option>Venting</option>
          <option>Random</option>
        </select>

        <input
          placeholder="Title optional"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
        />

        <select
          value={form.pinned}
          onChange={(e) => setForm({ ...form, pinned: e.target.value })}
        >
          <option value="0">Not pinned</option>
          <option value="1">Pinned</option>
        </select>

        <textarea
          className="quick-capture-body"
          placeholder="Drop anything here: playlist links, IG handles, numbers, emails, lyrics, rough thoughts, plans, or something you just need to vent about."
          value={form.body}
          onChange={(e) => setForm({ ...form, body: e.target.value })}
        />

        <input
          placeholder="Tags: R&B, playlists, Natasha Storm"
          value={form.tags}
          onChange={(e) => setForm({ ...form, tags: e.target.value })}
        />

        <textarea
          placeholder="Links, one per line. Links in the note body are auto-detected too."
          value={form.links}
          onChange={(e) => setForm({ ...form, links: e.target.value })}
        />

        <textarea
          placeholder="Handles, one per line or comma-separated. Handles in the note body are auto-detected too."
          value={form.handles}
          onChange={(e) => setForm({ ...form, handles: e.target.value })}
        />

        <input
          placeholder="Phone numbers"
          value={form.phone_numbers}
          onChange={(e) => setForm({ ...form, phone_numbers: e.target.value })}
        />

        <input
          placeholder="Emails"
          value={form.emails}
          onChange={(e) => setForm({ ...form, emails: e.target.value })}
        />
      </div>
    );
  }

  function renderQuickCapturePanel() {
    return (
      <div className="quick-capture-shell">
        <div className="assistant-placeholder quick-capture-panel">
          <p className="eyebrow">Quick Capture</p>
          <h4>Save anything without making it a task</h4>
          <p>
            This is your Notion-style dump zone for links, playlist leads, IG handles,
            phone numbers, ideas, lyrics, business thoughts, or anything that does not
            need a date or completion checkbox yet.
          </p>

          {renderPlannerNoteForm(quickCaptureNote, setQuickCaptureNote)}

          <div className="ai-action-row">
            <button className="save-btn" onClick={saveQuickCaptureNote}>
              Save Quick Note
            </button>
            <button
              className="secondary-btn"
              onClick={() => setQuickCaptureNote(emptyPlannerNoteForm)}
            >
              Clear
            </button>
          </div>
        </div>

        <div className="capture-side-panel">
          <div className="detail-section">
            <h4>Good for</h4>
            <p>Playlist URLs, curator handles, phone numbers, emails, brain dumps, hook ideas, promo angles, and random thoughts.</p>
          </div>
          <div className="detail-section">
            <h4>Later you can</h4>
            <p>Pin it, move it to a notebook, convert it to a task, or add it to today’s calendar mission.</p>
          </div>
        </div>
      </div>
    );
  }

  function renderNotebookLibrary() {
    const inboxCount = plannerNotes.filter((note) => !note.archived && !note.notebook_id).length;
    const pinnedCount = plannerNotes.filter((note) => !note.archived && note.pinned).length;

    return (
      <div className="notebook-library">
        <button
          className={selectedNotebookId === "all" ? "notebook-card notebook-card-active" : "notebook-card"}
          onClick={() => setSelectedNotebookId("all")}
        >
          <span className="notebook-dot" />
          <strong>All Notes</strong>
          <small>{plannerNotes.filter((note) => !note.archived).length} saved</small>
        </button>

        <button
          className={selectedNotebookId === "pinned" ? "notebook-card notebook-card-active" : "notebook-card"}
          onClick={() => setSelectedNotebookId("pinned")}
        >
          <span className="notebook-dot notebook-dot-gold" />
          <strong>Pinned</strong>
          <small>{pinnedCount} priority</small>
        </button>

        <button
          className={selectedNotebookId === "inbox" ? "notebook-card notebook-card-active" : "notebook-card"}
          onClick={() => setSelectedNotebookId("inbox")}
        >
          <span className="notebook-dot notebook-dot-muted" />
          <strong>Inbox / Brain Dump</strong>
          <small>{inboxCount} uncategorized</small>
        </button>

        {notebooks.map((notebook) => {
          const noteCount = plannerNotes.filter(
            (note) => !note.archived && String(note.notebook_id || "") === String(notebook.id),
          ).length;

          return (
            <div
              key={notebook.id}
              className={
                selectedNotebookId === String(notebook.id)
                  ? "notebook-card notebook-card-active"
                  : "notebook-card"
              }
              role="button"
              tabIndex={0}
              onClick={() => setSelectedNotebookId(String(notebook.id))}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  setSelectedNotebookId(String(notebook.id));
                }
              }}
            >
              <div className="notebook-card-main">
                <span
                  className="notebook-dot"
                  style={{ background: notebook.color || "#2f7cff" }}
                />
                <strong>{notebook.name}</strong>
                <small>{noteCount} notes</small>
                {notebook.description ? <p>{notebook.description}</p> : null}
              </div>
              <div className="notebook-card-actions">
                <button
                  type="button"
                  className="mini-action-btn"
                  onClick={(event) => {
                    event.stopPropagation();
                    startEditingNotebook(notebook);
                  }}
                >
                  Edit
                </button>
                <button
                  type="button"
                  className="mini-action-btn mini-action-btn-danger"
                  onClick={(event) => {
                    event.stopPropagation();
                    removeNotebook(notebook);
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  function renderSelectedNotebookControls() {
    const selectedNotebook = notebooks.find(
      (notebook) => String(notebook.id) === String(selectedNotebookId),
    );

    if (!selectedNotebook) return null;

    const noteCount = plannerNotes.filter(
      (note) => !note.archived && String(note.notebook_id || "") === String(selectedNotebook.id),
    ).length;

    return (
      <div className="calendar-selected-section selected-notebook-toolbar">
        <div>
          <p className="eyebrow">Selected Notebook</p>
          <h3>{selectedNotebook.name}</h3>
          <p>
            {noteCount} note{noteCount === 1 ? "" : "s"}
            {selectedNotebook.description ? ` • ${selectedNotebook.description}` : ""}
          </p>
        </div>

        <div className="asset-header-actions">
          <button
            className="secondary-btn"
            type="button"
            onClick={() => startEditingNotebook(selectedNotebook)}
          >
            Edit Notebook
          </button>
          <button
            className="danger-btn"
            type="button"
            onClick={() => removeNotebook(selectedNotebook)}
          >
            Delete Notebook
          </button>
        </div>
      </div>
    );
  }

  function renderPlannerNoteCards() {
    const notesToShow = getFilteredPlannerNotes();

    return (
      <div className="planner-note-grid">
        {notesToShow.length === 0 ? (
          <div className="empty-card">
            No notes here yet. Use Quick Capture or create a notebook note.
          </div>
        ) : (
          notesToShow.map((note) => (
            <button
              key={note.id}
              className={
                selectedPlannerNote?.id === note.id
                  ? "planner-note-card planner-note-card-active"
                  : "planner-note-card"
              }
              onClick={() => setSelectedPlannerNote(note)}
            >
              <div className="planner-note-card-top">
                <span>{note.note_type || "Note"}</span>
                {note.pinned ? <strong>PINNED</strong> : null}
              </div>
              <h4>{note.title || "Untitled Note"}</h4>
              <p>{note.body || "No note body added."}</p>
              <small>{getNotebookName(note.notebook_id)}</small>
            </button>
          ))
        )}
      </div>
    );
  }

  function renderSelectedPlannerNote() {
    if (!selectedPlannerNote) return null;

    return (
      <div className="calendar-selected-section planner-note-detail">
        <div className="lyric-detail-header">
          <div>
            <p className="eyebrow">Selected Note</p>
            <h3>{selectedPlannerNote.title || "Untitled Note"}</h3>
            <p>{getNotebookName(selectedPlannerNote.notebook_id)} • {selectedPlannerNote.note_type || "Brain Dump"}</p>
          </div>

          <div className="asset-header-actions">
            <button
              className="secondary-btn"
              onClick={() => togglePlannerNotePin(selectedPlannerNote)}
            >
              {selectedPlannerNote.pinned ? "Unpin" : "Pin"}
            </button>
            <button
              className="secondary-btn"
              onClick={() => startEditingPlannerNote(selectedPlannerNote)}
            >
              Edit Note
            </button>
            <button
              className="secondary-btn"
              onClick={() => convertPlannerNoteToTask(selectedPlannerNote, false)}
            >
              Convert to Task
            </button>
            <button
              className="secondary-btn"
              onClick={() => convertPlannerNoteToTask(selectedPlannerNote, true)}
            >
              Add to Today
            </button>
            <button
              className="secondary-btn"
              onClick={() => archivePlannerNote(selectedPlannerNote)}
            >
              Archive
            </button>
            <button
              className="danger-btn"
              onClick={() => deletePlannerNote(selectedPlannerNote.id)}
            >
              Delete
            </button>
          </div>
        </div>

        <div className="lyric-detail-grid">
          <div className="detail-section lyric-wide-section">
            <h4>Note</h4>
            <pre>{displayValue(selectedPlannerNote.body)}</pre>
          </div>

          <div className="detail-section">
            <h4>Tags</h4>
            <p>{displayListValue(selectedPlannerNote.tags)}</p>
          </div>

          <div className="detail-section">
            <h4>Handles</h4>
            <p>{displayListValue(selectedPlannerNote.handles)}</p>
          </div>

          <div className="detail-section">
            <h4>Phone Numbers</h4>
            <p>{displayListValue(selectedPlannerNote.phone_numbers)}</p>
          </div>

          <div className="detail-section">
            <h4>Emails</h4>
            <p>{displayListValue(selectedPlannerNote.emails)}</p>
          </div>

          <div className="detail-section lyric-wide-section">
            <h4>Links</h4>
            {selectedPlannerNote.links && selectedPlannerNote.links.length ? (
              <div className="note-link-list">
                {selectedPlannerNote.links.map((link) => (
                  <a key={link} href={link} target="_blank" rel="noreferrer">
                    {link}
                  </a>
                ))}
              </div>
            ) : (
              <p>Not added</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  function renderNotebooksPanel() {
    return (
      <div className="notebooks-shell">
        <div className="section-heading notebook-heading-row">
          <div>
            <h3>Notebooks</h3>
            <p>Store the things that do not belong on the calendar yet.</p>
          </div>
          <div className="asset-header-actions">
            <button className="secondary-btn" onClick={() => setShowNewNotebook(true)}>
              + New Notebook
            </button>
            <button className="save-btn" onClick={() => setShowNewPlannerNote(true)}>
              + New Note
            </button>
          </div>
        </div>

        {renderNotebookLibrary()}
        {renderSelectedNotebookControls()}
        {renderPlannerNoteCards()}
        {renderSelectedPlannerNote()}
      </div>
    );
  }

  function renderCalendarTasksPanel() {
    return (
      <>
        <div className="assistant-placeholder calendar-ai-panel">
          <p className="eyebrow">OpenAI Daily Mission Planner</p>
          <h4>Generate today’s execution plan</h4>
          <p>
            Choose your focus, time, and energy level. The planner uses your saved songs,
            products, roadmaps, and tasks to build a realistic daily mission.
          </p>

          <div className="form-grid ai-form-grid">
            <select
              value={calendarAIForm.focus_type}
              onChange={(e) =>
                setCalendarAIForm({
                  ...calendarAIForm,
                  focus_type: e.target.value,
                })
              }
            >
              <option>All</option>
              <option>Music</option>
              <option>Marketing</option>
              <option>Product</option>
              <option>Release</option>
              <option>Content</option>
              <option>Admin</option>
            </select>

            <select
              value={calendarAIForm.time_available}
              onChange={(e) =>
                setCalendarAIForm({
                  ...calendarAIForm,
                  time_available: e.target.value,
                })
              }
            >
              <option>30 minutes</option>
              <option>1 hour</option>
              <option>2 hours</option>
              <option>4 hours</option>
              <option>All day</option>
            </select>

            <select
              value={calendarAIForm.energy_level}
              onChange={(e) =>
                setCalendarAIForm({
                  ...calendarAIForm,
                  energy_level: e.target.value,
                })
              }
            >
              <option>Light</option>
              <option>Normal</option>
              <option>Heavy</option>
            </select>

            <select
              value={calendarAIForm.platform}
              onChange={(e) =>
                setCalendarAIForm({
                  ...calendarAIForm,
                  platform: e.target.value,
                })
              }
            >
              <option>General</option>
              <option>Instagram</option>
              <option>TikTok</option>
              <option>YouTube</option>
              <option>Facebook</option>
              <option>X</option>
              <option>Gumroad</option>
              <option>Website</option>
              <option>Email</option>
            </select>

            <textarea
              placeholder="Extra direction. Example: I only have 2 hours today and need to promote my drum kit without getting overwhelmed."
              value={calendarAIForm.notes}
              onChange={(e) =>
                setCalendarAIForm({
                  ...calendarAIForm,
                  notes: e.target.value,
                })
              }
            />
          </div>

          <div className="ai-action-row">
            <button
              className="save-btn"
              onClick={generateCalendarMissionWithAI}
              disabled={calendarAILoading}
            >
              {calendarAILoading ? "Building Mission..." : "Generate Daily Mission"}
            </button>

            {calendarAIOutput.trim() && (
              <>
                <button
                  className="secondary-btn"
                  onClick={saveCalendarAIOutputAsTask}
                  disabled={calendarAILoading}
                >
                  Save Mission as Task
                </button>

                <button
                  className="secondary-btn"
                  onClick={clearCalendarAIOutput}
                >
                  Clear Generated Mission
                </button>
              </>
            )}
          </div>

          {renderAIProgress(calendarAILoading, "Building today’s mission...")}

          {calendarAIError && (
            <div className="detail-section ai-error-box">
              <h4>Generation Error</h4>
              <p>{calendarAIError}</p>
            </div>
          )}

          {calendarAIOutput && (
            <div className="detail-section ai-output-box">
              <h4>Generated Daily Mission</h4>
              <pre>{calendarAIOutput}</pre>
            </div>
          )}
        </div>

        <div className="calendar-task-section">
          <div className="section-heading">
            <h3>Saved Tasks</h3>
            <p>Daily missions, content tasks, release prep, and product actions.</p>
          </div>

          <div className="calendar-task-grid">
            {calendarTasks.length === 0 ? (
              <div className="empty-card">
                No calendar tasks yet. Generate a daily mission or add your first task.
              </div>
            ) : (
              calendarTasks.map((task) => (
                <button
                  className={
                    selectedCalendarTask?.id === task.id
                      ? "marketing-card marketing-card-active"
                      : "marketing-card"
                  }
                  key={task.id}
                  onClick={() => setSelectedCalendarTask(task)}
                >
                  <h4>{task.title}</h4>
                  <p>
                    {task.task_date || "No date"} • {task.platform || "No platform"} • {task.status || "Planned"}
                  </p>
                </button>
              ))
            )}
          </div>
        </div>

        {selectedCalendarTask ? (
          <div className="calendar-selected-section">
            <div className="lyric-detail-header">
              <div>
                <p className="eyebrow">Selected Calendar Task</p>
                <h3>{selectedCalendarTask.title}</h3>
              </div>

              <div className="asset-header-actions">
                <button
                  className="secondary-btn"
                  onClick={() => startEditingCalendarTask(selectedCalendarTask)}
                >
                  Edit Task
                </button>

                <button
                  className="secondary-btn"
                  onClick={() => setSelectedCalendarTask(null)}
                >
                  Close Task
                </button>

                <button
                  className="danger-btn"
                  onClick={() => deleteCalendarTask(selectedCalendarTask.id)}
                >
                  Delete Task
                </button>
              </div>
            </div>

            <div className="lyric-detail-grid">
              <div className="detail-section">
                <h4>Date</h4>
                <p>{displayValue(selectedCalendarTask.task_date)}</p>
              </div>

              <div className="detail-section">
                <h4>Status</h4>
                <p>{displayValue(selectedCalendarTask.status)}</p>
              </div>

              <div className="detail-section">
                <h4>Platform</h4>
                <p>{displayValue(selectedCalendarTask.platform)}</p>
              </div>

              <div className="detail-section">
                <h4>Task Type</h4>
                <p>{displayValue(selectedCalendarTask.task_type)}</p>
              </div>

              <div className="detail-section">
                <h4>Linked Song</h4>
                <p>{getSongTitle(selectedCalendarTask.song_id)}</p>
              </div>

              <div className="detail-section">
                <h4>Linked Product</h4>
                <p>{getProductTitle(selectedCalendarTask.product_id)}</p>
              </div>

              <div className="detail-section lyric-wide-section">
                <h4>Notes</h4>
                <pre>{displayValue(selectedCalendarTask.notes)}</pre>
              </div>
            </div>
          </div>
        ) : null}
      </>
    );
  }

  function renderCalendarPage() {
    return (
      <section className="page-panel calendar-page">
        <div className="page-header planner-page-header">
          <div>
            <p className="eyebrow">Planning</p>
            <h2>Planner Command Center</h2>
            <p>
              Calendar tasks handle execution. Notebooks handle links, handles,
              numbers, ideas, and brain dumps that do not need dates yet.
            </p>
          </div>

          <div className="asset-header-actions planner-action-buttons">
            <button
              className="secondary-btn planner-action-btn"
              onClick={() => setPlannerTab("Quick Capture")}
            >
              Quick Capture
            </button>
            <button
              className="secondary-btn planner-action-btn"
              onClick={() => setShowNewNotebook(true)}
            >
              + New Notebook
            </button>
            <button
              className="primary-btn planner-action-btn"
              onClick={() => setShowNewCalendarTask(true)}
            >
              + New Calendar Task
            </button>
          </div>
        </div>

        <div className="planner-tabs" role="tablist" aria-label="Planner sections">
          {(["Tasks", "Quick Capture", "Notebooks"] as PlannerTab[]).map((tab) => (
            <button
              key={tab}
              className={plannerTab === tab ? "planner-tab planner-tab-active" : "planner-tab"}
              onClick={() => setPlannerTab(tab)}
              type="button"
            >
              {tab}
            </button>
          ))}
        </div>

        {plannerTab === "Tasks" ? renderCalendarTasksPanel() : null}
        {plannerTab === "Quick Capture" ? renderQuickCapturePanel() : null}
        {plannerTab === "Notebooks" ? renderNotebooksPanel() : null}
      </section>
    );
  }

  function renderActivePage() {
    if (activePage === "Dashboard") return renderDashboard();

    if (activePage === "Songs") return renderSongsPage();

    if (activePage === "Projects") return renderProjectsPage();

    if (activePage === "Lyrics") return renderLyricsPage();

    if (activePage === "Marketing") return renderMarketingPage();

    if (activePage === "Releases") return renderReleasesPage();

    if (activePage === "Visuals") return renderVisualsPage();

    if (activePage === "Products") return renderProductsPage();

    if (activePage === "EPK Builder") return renderEpkBuilderPage();

    if (activePage === "Web Tools") return renderWebToolsPage();

    if (activePage === "Social Media") return <SocialMediaCommandCenter />;

    if (activePage === "Distribution") {
      return (
        <DistributionPage
          oauthStatus={tooLostOauthStatus}
          oauthMessage={tooLostOauthMessage}
          activeTab={distributionSubPage}
          onTabChange={setDistributionSubPage}
        />
      );
    }

    if (activePage === "Planner") return renderCalendarPage();

    return renderDashboard();
  }

  const detailTabs: DetailTab[] = [
    "Overview",
    "Metadata",
    "Rights",
    "Lyrics",
    "Marketing",
    "Files",
  ];

  const modules: { title: string; desc: string; page: AppPage }[] = [
    {
      title: "Song Catalog",
      desc: "Track every official song, release, and master.",
      page: "Songs",
    },
    {
      title: "Projects / Albums",
      desc: "Group songs into albums, EPs, beat tapes, and campaigns.",
      page: "Projects",
    },
    {
      title: "Lyrics Studio",
      desc: "Write lyrics, hooks, verses, and song ideas.",
      page: "Lyrics",
    },
    {
      title: "Release Roadmaps",
      desc: "Plan rollouts, checklists, and launch tasks.",
      page: "Releases",
    },
    {
      title: "Visual Studio",
      desc: "Create cover art prompts and visual directions.",
      page: "Visuals",
    },
    {
      title: "Marketing Generator",
      desc: "Captions, ads, hooks, emails, and promo copy.",
      page: "Marketing",
    },
    {
      title: "Product Vault",
      desc: "Manage drum kits, beat packs, templates, and offers.",
      page: "Products",
    },
    {
      title: "EPK Builder",
      desc: "Build bios, one-sheets, press releases, and venue-ready pitches.",
      page: "EPK Builder",
    },
    {
      title: "Web Tools",
      desc: "Save dashboards, resources, portals, and favorite music-business links.",
      page: "Web Tools",
    },
    {
      title: "Social Media",
      desc: "Connect Buffer, plan posts, and manage social publishing.",
      page: "Social Media",
    },
    {
      title: "Distribution",
      desc: "Connect Too Lost, then pull catalog, analytics, earnings, and release data.",
      page: "Distribution",
    },
  ];

  const sidebarPages: AppPage[] = [
    "Dashboard",
    "Distribution",
    "Songs",
    "Projects",
    "Lyrics",
    "Releases",
    "Visuals",
    "Marketing",
    "Products",
    "EPK Builder",
    "Web Tools",
    "Social Media",
    "Planner",
  ];

  function getSidebarPageLabel(page: AppPage) {
    if (page === "Dashboard") return "Command Hub";
    if (page === "Releases") return "Roadmaps";
    return page;
  }

  function renderSidebarIcon(page: AppPage) {
    const iconProps = {
      width: 21,
      height: 21,
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: 2,
      strokeLinecap: "round" as const,
      strokeLinejoin: "round" as const,
      "aria-hidden": true,
    };

    switch (page) {
      case "Dashboard":
        return (
          <svg {...iconProps}>
            <rect x="3" y="3" width="7" height="7" rx="1.5" />
            <rect x="14" y="3" width="7" height="7" rx="1.5" />
            <rect x="14" y="14" width="7" height="7" rx="1.5" />
            <rect x="3" y="14" width="7" height="7" rx="1.5" />
          </svg>
        );
      case "Songs":
        return (
          <svg {...iconProps}>
            <path d="M9 18V5l12-2v13" />
            <circle cx="6" cy="18" r="3" />
            <circle cx="18" cy="16" r="3" />
          </svg>
        );
      case "Projects":
        return (
          <svg {...iconProps}>
            <path d="M4 6.5A2.5 2.5 0 0 1 6.5 4H10l2 2h5.5A2.5 2.5 0 0 1 20 8.5v9A2.5 2.5 0 0 1 17.5 20h-11A2.5 2.5 0 0 1 4 17.5v-11Z" />
            <path d="M8 12h8" />
            <path d="M8 15h5" />
          </svg>
        );
      case "Lyrics":
        return (
          <svg {...iconProps}>
            <path d="M14 3l7 7" />
            <path d="M12 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7" />
            <path d="M14 3v7h7" />
            <path d="M8 15h8" />
            <path d="M8 18h5" />
          </svg>
        );
      case "Releases":
        return (
          <svg {...iconProps}>
            <path d="M14 18.5 9 16l-5 2.5V5.5L9 3l5 2.5 6-3v13L14 18.5Z" />
            <path d="M9 3v13" />
            <path d="M14 5.5v13" />
          </svg>
        );
      case "Visuals":
        return (
          <svg {...iconProps}>
            <rect x="3" y="5" width="18" height="14" rx="2" />
            <circle cx="8.5" cy="10" r="1.5" />
            <path d="M21 16l-5-5L5 19" />
          </svg>
        );
      case "Marketing":
        return (
          <svg {...iconProps}>
            <path d="M3 11v3a2 2 0 0 0 2 2h3l8 4V5L8 9H5a2 2 0 0 0-2 2z" />
            <path d="M19 8c1.2 1 2 2.4 2 4s-.8 3-2 4" />
          </svg>
        );
      case "Products":
        return (
          <svg {...iconProps}>
            <path d="M21 8l-9-5-9 5 9 5 9-5z" />
            <path d="M3 8v8l9 5 9-5V8" />
            <path d="M12 13v8" />
          </svg>
        );
      case "EPK Builder":
        return (
          <svg {...iconProps}>
            <rect x="4" y="3" width="16" height="18" rx="2" />
            <path d="M8 8h8" />
            <path d="M8 12h8" />
            <path d="M8 16h5" />
            <circle cx="17" cy="17" r="3" />
            <path d="M17 15.8v2.4" />
            <path d="M15.8 17h2.4" />
          </svg>
        );
      case "Web Tools":
        return (
          <svg {...iconProps}>
            <path d="M10 13a5 5 0 0 0 7.1 0l2.2-2.2a5 5 0 0 0-7.1-7.1L11 4.9" />
            <path d="M14 11a5 5 0 0 0-7.1 0l-2.2 2.2a5 5 0 0 0 7.1 7.1L13 19.1" />
          </svg>
        );
      case "Social Media":
        return (
          <svg {...iconProps}>
            <path d="M4 12h4l8-5v10l-8-5H4z" />
            <path d="M18 9c1.3 1.1 2 2.1 2 3s-.7 1.9-2 3" />
            <path d="M8 12v5a2 2 0 0 0 2 2h1" />
          </svg>
        );
      case "Distribution":
        return (
          <svg {...iconProps}>
            <circle cx="12" cy="12" r="9" />
            <circle cx="12" cy="12" r="3.2" />
            <circle cx="12" cy="12" r="1.1" fill="currentColor" stroke="none" />
            <path d="M7.2 6.9c1.2-.9 2.7-1.4 4.3-1.4" />
            <path d="M16.8 17.1c-1.2.9-2.7 1.4-4.3 1.4" />
            <path d="M15.2 8.3l2.5-2.5" />
            <path d="M6.3 17.7l2.5-2.5" />
          </svg>
        );
      case "Planner":
        return (
          <svg {...iconProps}>
            <rect x="3" y="4" width="18" height="17" rx="2" />
            <path d="M16 2v4" />
            <path d="M8 2v4" />
            <path d="M3 10h18" />
            <path d="M8 15l2 2 5-5" />
          </svg>
        );
      default:
        return null;
    }
  }

  if (authLoading) {
    return (
      <div className="auth-shell">
        <div className="auth-card">
          <div className="brand auth-brand">
            <div className="brand-mark">TA</div>
            <div className="brand-copy">
              <h1>Track Adam OS</h1>
              <p>Private Creator Command Center</p>
            </div>
          </div>
          <div className="ai-loading-bar">
            <span />
          </div>
          <p className="auth-muted">Loading your private workspace...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="auth-shell">
        <form className="auth-card" onSubmit={handleAuthSubmit}>
          <div className="brand auth-brand">
            <div className="brand-mark">TA</div>
            <div className="brand-copy">
              <h1>Track Adam OS</h1>
              <p>Private Creator Command Center</p>
            </div>
          </div>

          <div className="auth-copy">
            <p className="eyebrow">Supabase Cloud Mode</p>
            <h2>{authMode === "sign-in" ? "Welcome back" : "Create your private login"}</h2>
            <p>
              Sign in to start connecting Track Adam OS to your private cloud-backed workspace.
            </p>
          </div>

          <div className="form-grid auth-form-grid">
            <input
              type="email"
              placeholder="Email address"
              value={authEmail}
              onChange={(event) => setAuthEmail(event.target.value)}
              autoComplete="email"
            />

            <input
              type="password"
              placeholder="Password"
              value={authPassword}
              onChange={(event) => setAuthPassword(event.target.value)}
              autoComplete={authMode === "sign-in" ? "current-password" : "new-password"}
            />
          </div>

          {authError && (
            <div className="detail-section ai-error-box auth-alert">
              <p>{authError}</p>
            </div>
          )}

          {authMessage && (
            <div className="detail-section ai-output-box auth-alert">
              <p>{authMessage}</p>
            </div>
          )}

          <button className="save-btn auth-submit-btn" type="submit" disabled={authActionLoading}>
            {authActionLoading
              ? "Working..."
              : authMode === "sign-in"
                ? "Sign In"
                : "Create Account"}
          </button>

          <button
            className="secondary-btn auth-switch-btn"
            type="button"
            onClick={() => {
              setAuthMode(authMode === "sign-in" ? "sign-up" : "sign-in");
              setAuthError("");
              setAuthMessage("");
            }}
          >
            {authMode === "sign-in"
              ? "Need an account? Create one"
              : "Already have an account? Sign in"}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div
      className={sidebarCollapsed ? "app-shell sidebar-collapsed" : "app-shell"}
      onClickCapture={handleGlobalActionFeedback}
    >
      <aside className="sidebar">
        <button
          className="sidebar-collapse-btn"
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          title={sidebarCollapsed ? "Expand navigation" : "Collapse navigation"}
        >
          {sidebarCollapsed ? "›" : "‹"}
        </button>

        <div className="brand">
          <div className="brand-mark">TA</div>
          <div className="brand-copy">
            <h1>Track Adam OS</h1>
            <p>Creator Command Center</p>
          </div>
        </div>

        <nav className="nav">
          {sidebarPages.map((page) => {
            if (page === "Distribution") {
              const distSubPages: { key: DistributionSubPage; label: string }[] = [
                { key: "overview", label: "Overview" },
                { key: "releases", label: "Release Builder" },
                { key: "catalog", label: "Catalog" },
                { key: "analytics", label: "Analytics" },
                { key: "sales", label: "Sales" },
                { key: "setup", label: "Setup" },
                { key: "developer", label: "Developer" },
              ];
              return (
                <div key="Distribution" className="nav-group">
                  <button
                    className={activePage === "Distribution" ? "nav-active" : ""}
                    onClick={() => setActivePage("Distribution")}
                    title="Distribution"
                  >
                    <span className="nav-icon">{renderSidebarIcon("Distribution")}</span>
                    <span className="nav-label">Distribution</span>
                  </button>
                  {activePage === "Distribution" && !sidebarCollapsed && (
                    <div className="nav-sub">
                      {distSubPages.map(({ key, label }) => (
                        <button
                          key={key}
                          className={`nav-sub-item${distributionSubPage === key ? " nav-sub-active" : ""}`}
                          onClick={() => setDistributionSubPage(key)}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            }
            return (
              <button
                key={page}
                className={activePage === page ? "nav-active" : ""}
                onClick={() => setActivePage(page)}
                title={getSidebarPageLabel(page)}
              >
                <span className="nav-icon">{renderSidebarIcon(page)}</span>
                <span className="nav-label">{getSidebarPageLabel(page)}</span>
              </button>
            );
          })}
        </nav>

        <div className="sidebar-account">
          <span className="sidebar-account-email" title={session.user.email || "Signed in"}>
            {session.user.email || "Signed in"}
          </span>
          <button className="secondary-btn sidebar-signout-btn" onClick={handleSignOut}>
            Sign Out
          </button>
        </div>
      </aside>

      <main className="main">{renderActivePage()}</main>

      {appBusyMessage && (
        <div className="app-action-feedback" role="status" aria-live="polite">
          <div className="app-action-feedback-label">
            <span>{appBusyMessage}</span>
          </div>
          <div className="app-action-progress-track">
            <div className="app-action-progress-bar" />
          </div>
        </div>
      )}

      {appNotice && (
        <div className={`app-toast app-toast-${appNotice.type}`} role="status" aria-live="polite">
          <strong>
            {appNotice.type === "error"
              ? "Needs attention"
              : appNotice.type === "success"
                ? "Success"
                : "Track Adam OS"}
          </strong>
          <span>{appNotice.message}</span>
          <button
            type="button"
            onClick={() => setAppNotice(null)}
            aria-label="Dismiss notification"
          >
            ×
          </button>
        </div>
      )}

      {showNewSong && (
        <div className="modal-backdrop">
          <div className="modal large-modal">
            <div className="modal-header">
              <div>
                <p className="eyebrow">New Song</p>
                <h3>Create an official song record</h3>
              </div>

              <button
                className="close-btn"
                onClick={() => setShowNewSong(false)}
              >
                ×
              </button>
            </div>

            {renderSongForm(newSong, setNewSong)}

            <button className="save-btn" onClick={saveSong}>
              Save Song Record
            </button>
          </div>
        </div>
      )}

      {showNewProject && (
        <div className="modal-backdrop">
          <div className="modal large-modal">
            <div className="modal-header">
              <div>
                <p className="eyebrow">New Project / Album</p>
                <h3>Create project</h3>
              </div>

              <button
                className="close-btn"
                onClick={() => setShowNewProject(false)}
              >
                ×
              </button>
            </div>

            <div className="form-section">
              <h4>Project Details</h4>

              <div className="form-grid">
                <input
                  placeholder="Project title *"
                  value={newProject.title}
                  onChange={(e) =>
                    setNewProject({ ...newProject, title: e.target.value })
                  }
                />

                <select
                  value={newProject.project_type}
                  onChange={(e) =>
                    setNewProject({ ...newProject, project_type: e.target.value })
                  }
                >
                  <option>Album</option>
                  <option>EP</option>
                  <option>Mixtape</option>
                  <option>Beat Tape</option>
                  <option>Single Campaign</option>
                  <option>Compilation</option>
                  <option>Product Launch Campaign</option>
                </select>

                <input
                  placeholder="Artist"
                  value={newProject.artist}
                  onChange={(e) =>
                    setNewProject({ ...newProject, artist: e.target.value })
                  }
                />

                <select
                  value={newProject.status}
                  onChange={(e) =>
                    setNewProject({ ...newProject, status: e.target.value })
                  }
                >
                  <option>Idea</option>
                  <option>Planning</option>
                  <option>Recording</option>
                  <option>Mixing</option>
                  <option>Mastering</option>
                  <option>Ready for Release</option>
                  <option>Scheduled</option>
                  <option>Released</option>
                </select>

                <input
                  placeholder="Release date"
                  value={newProject.release_date}
                  onChange={(e) =>
                    setNewProject({ ...newProject, release_date: e.target.value })
                  }
                />

                <input
                  placeholder="Distributor"
                  value={newProject.distributor}
                  onChange={(e) =>
                    setNewProject({ ...newProject, distributor: e.target.value })
                  }
                />

                <input
                  placeholder="Project UPC"
                  value={newProject.upc}
                  onChange={(e) =>
                    setNewProject({ ...newProject, upc: e.target.value })
                  }
                />

                <input
                  placeholder="Label"
                  value={newProject.label}
                  onChange={(e) =>
                    setNewProject({ ...newProject, label: e.target.value })
                  }
                />

                <textarea
                  placeholder="Project notes, rollout direction, tracklist ideas, or business notes"
                  value={newProject.notes}
                  onChange={(e) =>
                    setNewProject({ ...newProject, notes: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="form-section">
              <h4>Project Cover Art</h4>

              <div className="cover-art-row">
                <div className="cover-preview">
                  {newProject.cover_art_data ? (
                    <img src={newProject.cover_art_data} alt="Project cover preview" />
                  ) : (
                    <span>No cover art selected</span>
                  )}
                </div>

                <div className="cover-actions">
                  <p>
                    Add cover artwork for the album, EP, beat tape, or campaign.
                  </p>

                  <label className="upload-btn">
                    Choose Image
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) =>
                        handleProjectCoverArtUpload(
                          e.target.files ? e.target.files[0] : null,
                        )
                      }
                    />
                  </label>
                </div>
              </div>
            </div>

            <button className="save-btn" onClick={saveProject}>
              Save Project
            </button>
          </div>
        </div>
      )}

      {showNewLyricIdea && (
        <div className="modal-backdrop">
          <div className="modal large-modal">
            <div className="modal-header">
              <div>
                <p className="eyebrow">New Lyric Idea</p>
                <h3>Capture a creative draft</h3>
              </div>

              <button
                className="close-btn"
                onClick={() => setShowNewLyricIdea(false)}
              >
                ×
              </button>
            </div>

            <div className="form-section">
              <h4>Idea Details</h4>

              <div className="form-grid">
                <input
                  placeholder="Idea title *"
                  value={newLyricIdea.title}
                  onChange={(e) =>
                    setNewLyricIdea({ ...newLyricIdea, title: e.target.value })
                  }
                />

                <input
                  placeholder="Mood"
                  value={newLyricIdea.mood}
                  onChange={(e) =>
                    setNewLyricIdea({ ...newLyricIdea, mood: e.target.value })
                  }
                />

                <textarea
                  placeholder="Concept or direction"
                  value={newLyricIdea.concept}
                  onChange={(e) =>
                    setNewLyricIdea({
                      ...newLyricIdea,
                      concept: e.target.value,
                    })
                  }
                />

                <textarea
                  placeholder="Lyrics, hooks, verses, rough lines"
                  value={newLyricIdea.lyrics}
                  onChange={(e) =>
                    setNewLyricIdea({ ...newLyricIdea, lyrics: e.target.value })
                  }
                />

                <textarea
                  placeholder="Notes"
                  value={newLyricIdea.notes}
                  onChange={(e) =>
                    setNewLyricIdea({ ...newLyricIdea, notes: e.target.value })
                  }
                />
              </div>
            </div>

            <button className="save-btn" onClick={saveLyricIdea}>
              Save Lyric Idea
            </button>
          </div>
        </div>
      )}

      {showNewMarketingAsset && (
        <div className="modal-backdrop">
          <div className="modal large-modal">
            <div className="modal-header">
              <div>
                <p className="eyebrow">New Marketing Asset</p>
                <h3>Create promotional copy</h3>
              </div>

              <button
                className="close-btn"
                onClick={() => setShowNewMarketingAsset(false)}
              >
                ×
              </button>
            </div>

            <div className="form-section">
              <h4>Marketing Details</h4>

              <div className="form-grid">
                <input
                  placeholder="Marketing title *"
                  value={newMarketingAsset.title}
                  onChange={(e) =>
                    setNewMarketingAsset({
                      ...newMarketingAsset,
                      title: e.target.value,
                    })
                  }
                />

                <select
                  value={newMarketingAsset.song_id}
                  onChange={(e) =>
                    setNewMarketingAsset({
                      ...newMarketingAsset,
                      song_id: e.target.value,
                    })
                  }
                >
                  <option value="">Link to song optional</option>
                  {songs.map((song) => (
                    <option key={song.id} value={song.id}>
                      {song.title}
                    </option>
                  ))}
                </select>

                <select
                  value={newMarketingAsset.platform}
                  onChange={(e) =>
                    setNewMarketingAsset({
                      ...newMarketingAsset,
                      platform: e.target.value,
                    })
                  }
                >
                  <option value="">Platform</option>
                  <option>Instagram</option>
                  <option>TikTok</option>
                  <option>YouTube</option>
                  <option>Facebook</option>
                  <option>X</option>
                  <option>Email</option>
                  <option>Website</option>
                  <option>General</option>
                </select>

                <select
                  value={newMarketingAsset.content_type}
                  onChange={(e) =>
                    setNewMarketingAsset({
                      ...newMarketingAsset,
                      content_type: e.target.value,
                    })
                  }
                >
                  <option value="">Content type</option>
                  <option>Caption</option>
                  <option>Ad Copy</option>
                  <option>Hook</option>
                  <option>Hashtags</option>
                  <option>Release Announcement</option>
                  <option>Product Promo</option>
                  <option>Email Promo</option>
                  <option>Short Video Script</option>
                </select>

                <select
                  value={newMarketingAsset.tone}
                  onChange={(e) =>
                    setNewMarketingAsset({
                      ...newMarketingAsset,
                      tone: e.target.value,
                    })
                  }
                >
                  <option value="">Tone</option>
                  <option>Hype</option>
                  <option>Professional</option>
                  <option>Emotional</option>
                  <option>Luxury</option>
                  <option>Street</option>
                  <option>Mysterious</option>
                  <option>Inspirational</option>
                  <option>Direct Sales</option>
                </select>

                <textarea
                  placeholder="Marketing copy, caption, hook, ad, or script"
                  value={newMarketingAsset.copy}
                  onChange={(e) =>
                    setNewMarketingAsset({
                      ...newMarketingAsset,
                      copy: e.target.value,
                    })
                  }
                />

                <textarea
                  placeholder="Notes"
                  value={newMarketingAsset.notes}
                  onChange={(e) =>
                    setNewMarketingAsset({
                      ...newMarketingAsset,
                      notes: e.target.value,
                    })
                  }
                />
              </div>
            </div>

            <button className="save-btn" onClick={saveMarketingAsset}>
              Save Marketing Asset
            </button>
          </div>
        </div>
      )}

      {showNewVisualAsset && (
        <div className="modal-backdrop">
          <div className="modal large-modal">
            <div className="modal-header">
              <div>
                <p className="eyebrow">New Visual Asset</p>
                <h3>Create visual direction</h3>
              </div>

              <button
                className="close-btn"
                onClick={() => setShowNewVisualAsset(false)}
              >
                ×
              </button>
            </div>

            <div className="form-section">
              <h4>Visual Details</h4>

              <div className="form-grid">
                <input
                  placeholder="Visual title *"
                  value={newVisualAsset.title}
                  onChange={(e) =>
                    setNewVisualAsset({
                      ...newVisualAsset,
                      title: e.target.value,
                    })
                  }
                />

                <select
                  value={newVisualAsset.song_id}
                  onChange={(e) =>
                    setNewVisualAsset({
                      ...newVisualAsset,
                      song_id: e.target.value,
                    })
                  }
                >
                  <option value="">Link to song optional</option>
                  {songs.map((song) => (
                    <option key={song.id} value={song.id}>
                      {song.title}
                    </option>
                  ))}
                </select>

                <select
                  value={newVisualAsset.asset_type}
                  onChange={(e) =>
                    setNewVisualAsset({
                      ...newVisualAsset,
                      asset_type: e.target.value,
                    })
                  }
                >
                  <option value="">Asset type</option>
                  <option>Album Cover</option>
                  <option>Single Cover</option>
                  <option>YouTube Thumbnail</option>
                  <option>Social Post</option>
                  <option>Promo Image</option>
                  <option>Music Video Concept</option>
                  <option>Mood Board</option>
                  <option>General Image Prompt</option>
                </select>

                <select
                  value={newVisualAsset.visual_style}
                  onChange={(e) =>
                    setNewVisualAsset({
                      ...newVisualAsset,
                      visual_style: e.target.value,
                    })
                  }
                >
                  <option value="">Visual style</option>
                  <option>Cinematic</option>
                  <option>Dark Luxury</option>
                  <option>Street</option>
                  <option>Retro</option>
                  <option>Futuristic</option>
                  <option>Minimal</option>
                  <option>Gritty Documentary</option>
                  <option>Old School Label Style</option>
                  <option>Comic Book</option>
                  <option>Professional Studio</option>
                </select>

                <textarea
                  placeholder="Prompt or visual direction"
                  value={newVisualAsset.prompt}
                  onChange={(e) =>
                    setNewVisualAsset({
                      ...newVisualAsset,
                      prompt: e.target.value,
                    })
                  }
                />

                <textarea
                  placeholder="Notes"
                  value={newVisualAsset.notes}
                  onChange={(e) =>
                    setNewVisualAsset({
                      ...newVisualAsset,
                      notes: e.target.value,
                    })
                  }
                />
              </div>
            </div>

            <div className="form-section">
              <h4>Optional Reference Image</h4>

              <div className="visual-reference-row">
                <div className="visual-reference-preview">
                  {newVisualAsset.reference_image_data ? (
                    <img src={newVisualAsset.reference_image_data} alt="New visual reference preview" />
                  ) : (
                    <span>No reference image selected</span>
                  )}
                </div>

                <div className="visual-reference-actions">
                  <label className="upload-btn">
                    Choose Reference Image
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) =>
                        handleNewVisualAssetReferenceImageUpload(
                          e.target.files ? e.target.files[0] : null,
                        )
                      }
                    />
                  </label>

                  {newVisualAsset.reference_image_data && (
                    <button
                      className="secondary-btn"
                      onClick={clearNewVisualAssetReferenceImage}
                    >
                      Clear Reference Image
                    </button>
                  )}

                  <p className="zip-file-info">
                    {newVisualAsset.reference_image_name
                      ? `Using reference: ${newVisualAsset.reference_image_name}`
                      : "Reference images are optional but helpful for mood, pose, layout, or branding guidance."}
                  </p>
                </div>
              </div>
            </div>

            <button className="save-btn" onClick={saveVisualAsset}>
              Save Visual Asset
            </button>
          </div>
        </div>
      )}


      {showNewEpkProfile && (
        <div className="modal-backdrop">
          <div className="modal large-modal">
            <div className="modal-header">
              <div>
                <p className="eyebrow">New EPK Profile</p>
                <h3>Build your press kit foundation</h3>
              </div>

              <button
                className="close-btn"
                onClick={() => setShowNewEpkProfile(false)}
              >
                ×
              </button>
            </div>

            <div className="form-section">
              <h4>Core Identity</h4>

              <div className="form-grid">
                <input
                  placeholder="Artist / producer name *"
                  value={newEpkProfile.artist_name}
                  onChange={(e) =>
                    setNewEpkProfile({
                      ...newEpkProfile,
                      artist_name: e.target.value,
                    })
                  }
                />

                <input
                  placeholder="Producer name / alias"
                  value={newEpkProfile.producer_name}
                  onChange={(e) =>
                    setNewEpkProfile({
                      ...newEpkProfile,
                      producer_name: e.target.value,
                    })
                  }
                />

                <input
                  placeholder="Location"
                  value={newEpkProfile.location}
                  onChange={(e) =>
                    setNewEpkProfile({
                      ...newEpkProfile,
                      location: e.target.value,
                    })
                  }
                />

                <input
                  placeholder="Genre / lane"
                  value={newEpkProfile.genre}
                  onChange={(e) =>
                    setNewEpkProfile({
                      ...newEpkProfile,
                      genre: e.target.value,
                    })
                  }
                />

                <select
                  value={newEpkProfile.linked_project_id}
                  onChange={(e) =>
                    setNewEpkProfile({
                      ...newEpkProfile,
                      linked_project_id: e.target.value,
                    })
                  }
                >
                  <option value="">Link project optional</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.title}
                    </option>
                  ))}
                </select>

                <select
                  value={newEpkProfile.linked_song_id}
                  onChange={(e) =>
                    setNewEpkProfile({
                      ...newEpkProfile,
                      linked_song_id: e.target.value,
                    })
                  }
                >
                  <option value="">Link song optional</option>
                  {songs.map((song) => (
                    <option key={song.id} value={song.id}>
                      {song.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-section">
              <h4>Story and Proof</h4>

              <div className="form-grid">
                <textarea
                  placeholder="Describe your sound"
                  value={newEpkProfile.sound_description}
                  onChange={(e) =>
                    setNewEpkProfile({
                      ...newEpkProfile,
                      sound_description: e.target.value,
                    })
                  }
                />

                <textarea
                  placeholder="Short artist story"
                  value={newEpkProfile.short_story}
                  onChange={(e) =>
                    setNewEpkProfile({
                      ...newEpkProfile,
                      short_story: e.target.value,
                    })
                  }
                />

                <textarea
                  placeholder="Influences"
                  value={newEpkProfile.influences}
                  onChange={(e) =>
                    setNewEpkProfile({
                      ...newEpkProfile,
                      influences: e.target.value,
                    })
                  }
                />

                <textarea
                  placeholder="Career highlights"
                  value={newEpkProfile.highlights}
                  onChange={(e) =>
                    setNewEpkProfile({
                      ...newEpkProfile,
                      highlights: e.target.value,
                    })
                  }
                />

                <textarea
                  placeholder="Credits / placements / collaborations"
                  value={newEpkProfile.credits}
                  onChange={(e) =>
                    setNewEpkProfile({
                      ...newEpkProfile,
                      credits: e.target.value,
                    })
                  }
                />

                <textarea
                  placeholder="Internal notes"
                  value={newEpkProfile.notes}
                  onChange={(e) =>
                    setNewEpkProfile({
                      ...newEpkProfile,
                      notes: e.target.value,
                    })
                  }
                />
              </div>
            </div>

            <div className="form-section">
              <h4>Links and Contact</h4>

              <div className="form-grid">
                <input
                  placeholder="Contact email"
                  value={newEpkProfile.contact_email}
                  onChange={(e) =>
                    setNewEpkProfile({
                      ...newEpkProfile,
                      contact_email: e.target.value,
                    })
                  }
                />

                <input
                  placeholder="Website"
                  value={newEpkProfile.website}
                  onChange={(e) =>
                    setNewEpkProfile({
                      ...newEpkProfile,
                      website: e.target.value,
                    })
                  }
                />

                <input
                  placeholder="Social links"
                  value={newEpkProfile.social_links}
                  onChange={(e) =>
                    setNewEpkProfile({
                      ...newEpkProfile,
                      social_links: e.target.value,
                    })
                  }
                />

                <input
                  placeholder="Booking link"
                  value={newEpkProfile.booking_link}
                  onChange={(e) =>
                    setNewEpkProfile({
                      ...newEpkProfile,
                      booking_link: e.target.value,
                    })
                  }
                />
              </div>
            </div>

            <div className="form-section">
              <h4>Media Assets</h4>

              <div className="epk-upload-grid">
                <div className="cover-art-row">
                  <div className="cover-preview">
                    {newEpkProfile.press_photo_data ? (
                      <img src={newEpkProfile.press_photo_data} alt="Press photo preview" />
                    ) : (
                      <span>No press photo selected</span>
                    )}
                  </div>

                  <div className="cover-actions">
                    <p>Add a press photo for bios, one-sheets, and pitch materials.</p>
                    <label className="upload-btn">
                      Choose Press Photo
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) =>
                          handleEpkPhotoUpload(e.target.files ? e.target.files[0] : null)
                        }
                      />
                    </label>
                  </div>
                </div>

                <div className="cover-art-row">
                  <div className="cover-preview">
                    {newEpkProfile.logo_data ? (
                      <img src={newEpkProfile.logo_data} alt="Logo preview" />
                    ) : (
                      <span>No logo selected</span>
                    )}
                  </div>

                  <div className="cover-actions">
                    <p>Add a logo or mark if you have one.</p>
                    <label className="upload-btn">
                      Choose Logo
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) =>
                          handleEpkLogoUpload(e.target.files ? e.target.files[0] : null)
                        }
                      />
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <button className="save-btn" onClick={saveEpkProfile}>
              Save EPK Profile
            </button>
          </div>
        </div>
      )}

      {showNewProductAsset && (
        <div className="modal-backdrop">
          <div className="modal large-modal">
            <div className="modal-header">
              <div>
                <p className="eyebrow">New Product</p>
                <h3>Create product record</h3>
              </div>

              <button
                className="close-btn"
                onClick={() => setShowNewProductAsset(false)}
              >
                ×
              </button>
            </div>

            <div className="form-section">
              <h4>Product Details</h4>

              <div className="form-grid">
                <input
                  placeholder="Product title *"
                  value={newProductAsset.title}
                  onChange={(e) =>
                    setNewProductAsset({
                      ...newProductAsset,
                      title: e.target.value,
                    })
                  }
                />

                <select
                  value={newProductAsset.product_type}
                  onChange={(e) =>
                    setNewProductAsset({
                      ...newProductAsset,
                      product_type: e.target.value,
                    })
                  }
                >
                  <option value="">Product type</option>
                  <option>Drum Kit</option>
                  <option>Sample Pack</option>
                  <option>Beat Pack</option>
                  <option>Loop Kit</option>
                  <option>Preset Pack</option>
                  <option>Template</option>
                  <option>Service</option>
                  <option>Digital Offer</option>
                </select>

                <input
                  placeholder="Price"
                  value={newProductAsset.price}
                  onChange={(e) =>
                    setNewProductAsset({
                      ...newProductAsset,
                      price: e.target.value,
                    })
                  }
                />

                <select
                  value={newProductAsset.status}
                  onChange={(e) =>
                    setNewProductAsset({
                      ...newProductAsset,
                      status: e.target.value,
                    })
                  }
                >
                  <option>Idea</option>
                  <option>In Progress</option>
                  <option>Ready</option>
                  <option>Launched</option>
                  <option>Needs Update</option>
                  <option>Retired</option>
                </select>

                <textarea
                  placeholder="Product description"
                  value={newProductAsset.description}
                  onChange={(e) =>
                    setNewProductAsset({
                      ...newProductAsset,
                      description: e.target.value,
                    })
                  }
                />

                <textarea
                  placeholder="Promo angle or sales hook"
                  value={newProductAsset.promo_angle}
                  onChange={(e) =>
                    setNewProductAsset({
                      ...newProductAsset,
                      promo_angle: e.target.value,
                    })
                  }
                />

                <textarea
                  placeholder="Launch notes"
                  value={newProductAsset.launch_notes}
                  onChange={(e) =>
                    setNewProductAsset({
                      ...newProductAsset,
                      launch_notes: e.target.value,
                    })
                  }
                />
              </div>
            </div>

            <div className="form-section">
              <h4>Product Image</h4>

              <div className="cover-art-row">
                <div className="cover-preview">
                  {newProductAsset.product_image_data ? (
                    <img
                      src={newProductAsset.product_image_data}
                      alt="Product preview"
                    />
                  ) : (
                    <span>No product image selected</span>
                  )}
                </div>

                <div className="cover-actions">
                  <p>
                    Add a product cover, mockup, or promo image. This matches
                    your other image upload sections.
                  </p>

                  <label className="upload-btn">
                    Choose Image
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) =>
                        handleProductImageUpload(
                          e.target.files ? e.target.files[0] : null,
                        )
                      }
                    />
                  </label>
                </div>
              </div>
            </div>

            <div className="form-section">
              <h4>Files and Delivery</h4>

              <div className="cover-art-row">
                <div className="cover-preview zip-preview-box">
                  <span>
                    {newProductAsset.zip_file_name
                      ? `${newProductAsset.zip_file_name} (${newProductAsset.zip_file_size})`
                      : "No ZIP selected"}
                  </span>
                </div>

                <div className="cover-actions">
                  <p>
                    Select a ZIP file for the product. For now, the app saves
                    the ZIP file name and size so your database stays
                    lightweight.
                  </p>

                  <label className="upload-btn">
                    Choose ZIP
                    <input
                      type="file"
                      accept=".zip,application/zip,application/x-zip-compressed"
                      onChange={(e) =>
                        handleProductZipUpload(
                          e.target.files ? e.target.files[0] : null,
                        )
                      }
                    />
                  </label>
                </div>
              </div>

              <div className="form-grid product-links-grid">
                <input
                  placeholder="Google Drive link"
                  value={newProductAsset.google_drive_link}
                  onChange={(e) =>
                    setNewProductAsset({
                      ...newProductAsset,
                      google_drive_link: e.target.value,
                    })
                  }
                />

                <input
                  placeholder="OneDrive link"
                  value={newProductAsset.onedrive_link}
                  onChange={(e) =>
                    setNewProductAsset({
                      ...newProductAsset,
                      onedrive_link: e.target.value,
                    })
                  }
                />

                <input
                  placeholder="Dropbox link"
                  value={newProductAsset.dropbox_link}
                  onChange={(e) =>
                    setNewProductAsset({
                      ...newProductAsset,
                      dropbox_link: e.target.value,
                    })
                  }
                />

                <input
                  placeholder="Gumroad or store link"
                  value={newProductAsset.gumroad_link}
                  onChange={(e) =>
                    setNewProductAsset({
                      ...newProductAsset,
                      gumroad_link: e.target.value,
                    })
                  }
                />

                <input
                  placeholder="Website product page link"
                  value={newProductAsset.website_link}
                  onChange={(e) =>
                    setNewProductAsset({
                      ...newProductAsset,
                      website_link: e.target.value,
                    })
                  }
                />
              </div>
            </div>

            <button className="save-btn" onClick={saveProductAsset}>
              Save Product
            </button>
          </div>
        </div>
      )}

      {showNewReleaseRoadmap && (
        <div className="modal-backdrop">
          <div className="modal large-modal">
            <div className="modal-header">
              <div>
                <p className="eyebrow">New Release Roadmap</p>
                <h3>Plan a rollout</h3>
              </div>

              <button
                className="close-btn"
                onClick={() => setShowNewReleaseRoadmap(false)}
              >
                ×
              </button>
            </div>

            <div className="form-section">
              <h4>Roadmap Details</h4>

              <div className="form-grid">
                <input
                  placeholder="Release title *"
                  value={newReleaseRoadmap.title}
                  onChange={(e) =>
                    setNewReleaseRoadmap({
                      ...newReleaseRoadmap,
                      title: e.target.value,
                    })
                  }
                />

                <select
                  value={newReleaseRoadmap.song_id}
                  onChange={(e) =>
                    setNewReleaseRoadmap({
                      ...newReleaseRoadmap,
                      song_id: e.target.value,
                    })
                  }
                >
                  <option value="">Link to song optional</option>
                  {songs.map((song) => (
                    <option key={song.id} value={song.id}>
                      {song.title}
                    </option>
                  ))}
                </select>

                <input
                  placeholder="Release date"
                  value={newReleaseRoadmap.release_date}
                  onChange={(e) =>
                    setNewReleaseRoadmap({
                      ...newReleaseRoadmap,
                      release_date: e.target.value,
                    })
                  }
                />

                <select
                  value={newReleaseRoadmap.release_type}
                  onChange={(e) =>
                    setNewReleaseRoadmap({
                      ...newReleaseRoadmap,
                      release_type: e.target.value,
                    })
                  }
                >
                  <option value="">Release type</option>
                  <option>Single</option>
                  <option>EP</option>
                  <option>Album</option>
                  <option>Beat Tape</option>
                  <option>Music Video</option>
                  <option>Product Launch</option>
                  <option>Content Campaign</option>
                </select>

                <select
                  value={newReleaseRoadmap.budget_level}
                  onChange={(e) =>
                    setNewReleaseRoadmap({
                      ...newReleaseRoadmap,
                      budget_level: e.target.value,
                    })
                  }
                >
                  <option value="">Budget level</option>
                  <option>No Budget</option>
                  <option>Low Budget</option>
                  <option>Moderate Budget</option>
                  <option>Paid Ads</option>
                  <option>Influencer Push</option>
                  <option>Full Campaign</option>
                </select>

                <input
                  placeholder="Platform focus"
                  value={newReleaseRoadmap.platform_focus}
                  onChange={(e) =>
                    setNewReleaseRoadmap({
                      ...newReleaseRoadmap,
                      platform_focus: e.target.value,
                    })
                  }
                />

                <textarea
                  placeholder="Campaign goal"
                  value={newReleaseRoadmap.campaign_goal}
                  onChange={(e) =>
                    setNewReleaseRoadmap({
                      ...newReleaseRoadmap,
                      campaign_goal: e.target.value,
                    })
                  }
                />

                <textarea
                  placeholder="Rollout plan"
                  value={newReleaseRoadmap.rollout_plan}
                  onChange={(e) =>
                    setNewReleaseRoadmap({
                      ...newReleaseRoadmap,
                      rollout_plan: e.target.value,
                    })
                  }
                />

                <textarea
                  placeholder="Checklist notes"
                  value={newReleaseRoadmap.checklist_notes}
                  onChange={(e) =>
                    setNewReleaseRoadmap({
                      ...newReleaseRoadmap,
                      checklist_notes: e.target.value,
                    })
                  }
                />
              </div>
            </div>

            <button className="save-btn" onClick={saveReleaseRoadmap}>
              Save Roadmap
            </button>
          </div>
        </div>
      )}

      {showNewWebTool && (
        <div className="modal-backdrop">
          <div className="modal large-modal">
            <div className="modal-header">
              <div>
                <p className="eyebrow">New Web Tool</p>
                <h3>Save a favorite resource</h3>
              </div>

              <button
                className="close-btn"
                onClick={() => setShowNewWebTool(false)}
              >
                ×
              </button>
            </div>

            <div className="form-section">
              <h4>Tool Details</h4>

              <div className="form-grid">
                <input
                  placeholder="Tool title *"
                  value={newWebTool.title}
                  onChange={(e) =>
                    setNewWebTool({
                      ...newWebTool,
                      title: e.target.value,
                    })
                  }
                />

                <input
                  placeholder="URL *"
                  value={newWebTool.url}
                  onChange={(e) =>
                    setNewWebTool({
                      ...newWebTool,
                      url: e.target.value,
                    })
                  }
                />

                <button
                  type="button"
                  className="secondary-btn"
                  onClick={fetchPreviewForNewWebTool}
                  disabled={webToolPreviewLoading}
                >
                  {webToolPreviewLoading ? "Fetching Preview..." : "Fetch Link Preview"}
                </button>

                <select
                  value={newWebTool.category}
                  onChange={(e) =>
                    setNewWebTool({
                      ...newWebTool,
                      category: e.target.value,
                    })
                  }
                >
                  <option>Distribution</option>
                  <option>Royalties</option>
                  <option>Marketing</option>
                  <option>Design</option>
                  <option>Social Media</option>
                  <option>Samples</option>
                  <option>Plugins</option>
                  <option>Business</option>
                  <option>AI Tools</option>
                  <option>Education</option>
                  <option>Storage</option>
                  <option>General</option>
                </select>

                <select
                  value={newWebTool.priority}
                  onChange={(e) =>
                    setNewWebTool({
                      ...newWebTool,
                      priority: e.target.value,
                    })
                  }
                >
                  <option>Low</option>
                  <option>Normal</option>
                  <option>High</option>
                  <option>Daily Use</option>
                </select>

                <select
                  value={newWebTool.is_favorite}
                  onChange={(e) =>
                    setNewWebTool({
                      ...newWebTool,
                      is_favorite: e.target.value,
                    })
                  }
                >
                  <option value="0">Not pinned</option>
                  <option value="1">Pin this tool</option>
                </select>

                <textarea
                  placeholder="Description"
                  value={newWebTool.description}
                  onChange={(e) =>
                    setNewWebTool({
                      ...newWebTool,
                      description: e.target.value,
                    })
                  }
                />

                <textarea
                  placeholder="Login notes, usage notes, reminders, or why you use this tool"
                  value={newWebTool.login_notes}
                  onChange={(e) =>
                    setNewWebTool({
                      ...newWebTool,
                      login_notes: e.target.value,
                    })
                  }
                />
              </div>
            </div>

            {(newWebTool.preview_image_url || newWebTool.preview_title || webToolPreviewError) && (
              <div className="form-section">
                <h4>Link Preview</h4>

                {webToolPreviewError && (
                  <div className="detail-section ai-error-box">
                    <p>{webToolPreviewError}</p>
                  </div>
                )}

                {(newWebTool.preview_image_url || newWebTool.preview_title) && (
                  <div className="web-tool-selected-preview">
                    {newWebTool.preview_image_url && (
                      <img
                        src={newWebTool.preview_image_url}
                        alt="Web tool preview"
                        onError={(event) => {
                          event.currentTarget.style.display = "none";
                        }}
                      />
                    )}

                    <div>
                      <p className="eyebrow">
                        {newWebTool.preview_site_name || newWebTool.category || "Link Preview"}
                      </p>
                      <h4>{newWebTool.preview_title || newWebTool.title}</h4>
                      <p>{newWebTool.preview_description || newWebTool.description}</p>
                    </div>

                    <button
                      type="button"
                      className="secondary-btn"
                      onClick={clearNewWebToolPreview}
                    >
                      Clear Preview
                    </button>
                  </div>
                )}
              </div>
            )}

            <button className="save-btn" onClick={saveWebTool}>
              Save Web Tool
            </button>
          </div>
        </div>
      )}

      {showNewNotebook && (
        <div className="modal-backdrop">
          <div className="modal">
            <div className="modal-header">
              <div>
                <p className="eyebrow">New Notebook</p>
                <h3>Create a place for loose ideas</h3>
              </div>
              <button className="close-btn" onClick={() => setShowNewNotebook(false)}>
                ×
              </button>
            </div>

            <div className="form-section">
              <h4>Notebook Details</h4>
              <div className="form-grid">
                <input
                  placeholder="Notebook name *"
                  value={newNotebook.name}
                  onChange={(e) => setNewNotebook({ ...newNotebook, name: e.target.value })}
                />
                <input
                  placeholder="Accent color, example #2f7cff"
                  value={newNotebook.color}
                  onChange={(e) => setNewNotebook({ ...newNotebook, color: e.target.value })}
                />
                <textarea
                  placeholder="Description optional"
                  value={newNotebook.description}
                  onChange={(e) => setNewNotebook({ ...newNotebook, description: e.target.value })}
                />
              </div>
            </div>

            <div className="ai-action-row">
              <button className="save-btn" onClick={saveNotebook}>Save Notebook</button>
              <button className="secondary-btn" onClick={() => setShowNewNotebook(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {showEditNotebook && selectedNotebookForEdit && (
        <div className="modal-backdrop">
          <div className="modal">
            <div className="modal-header">
              <div>
                <p className="eyebrow">Edit Notebook</p>
                <h3>Update notebook details</h3>
              </div>
              <button className="close-btn" onClick={() => setShowEditNotebook(false)}>
                ×
              </button>
            </div>

            <div className="form-section">
              <h4>Notebook Details</h4>
              <div className="form-grid">
                <input
                  placeholder="Notebook name *"
                  value={editNotebook.name}
                  onChange={(e) => setEditNotebook({ ...editNotebook, name: e.target.value })}
                />
                <input
                  placeholder="Accent color, example #2f7cff"
                  value={editNotebook.color}
                  onChange={(e) => setEditNotebook({ ...editNotebook, color: e.target.value })}
                />
                <textarea
                  placeholder="Description optional"
                  value={editNotebook.description}
                  onChange={(e) => setEditNotebook({ ...editNotebook, description: e.target.value })}
                />
              </div>
            </div>

            <div className="ai-action-row">
              <button className="save-btn" onClick={updateNotebook}>Update Notebook</button>
              <button className="secondary-btn" onClick={() => setShowEditNotebook(false)}>Cancel</button>
              <button
                className="danger-btn"
                onClick={() => {
                  setShowEditNotebook(false);
                  removeNotebook(selectedNotebookForEdit);
                }}
              >
                Delete Notebook
              </button>
            </div>
          </div>
        </div>
      )}

      {showNewPlannerNote && (
        <div className="modal-backdrop">
          <div className="modal large-modal">
            <div className="modal-header">
              <div>
                <p className="eyebrow">New Notebook Note</p>
                <h3>Save a thought, lead, link, or contact</h3>
              </div>
              <button className="close-btn" onClick={() => setShowNewPlannerNote(false)}>
                ×
              </button>
            </div>

            {renderPlannerNoteForm(newPlannerNote, setNewPlannerNote)}

            <div className="ai-action-row">
              <button className="save-btn" onClick={() => savePlannerNote(newPlannerNote, true)}>
                Save Note
              </button>
              <button className="secondary-btn" onClick={() => setShowNewPlannerNote(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showEditPlannerNote && selectedPlannerNote && (
        <div className="modal-backdrop edit-modal-backdrop">
          <div className="modal large-modal">
            <div className="modal-header">
              <div>
                <p className="eyebrow">Edit Notebook Note</p>
                <h3>Update captured info</h3>
              </div>
              <button className="close-btn" onClick={() => setShowEditPlannerNote(false)}>
                ×
              </button>
            </div>

            {renderPlannerNoteForm(editPlannerNote, setEditPlannerNote)}

            <div className="ai-action-row">
              <button className="save-btn" onClick={updatePlannerNote}>Save Changes</button>
              <button className="secondary-btn" onClick={() => setShowEditPlannerNote(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {showNewCalendarTask && (
        <div className="modal-backdrop">
          <div className="modal large-modal">
            <div className="modal-header">
              <div>
                <p className="eyebrow">New Calendar Task</p>
                <h3>Plan a daily mission</h3>
              </div>

              <button
                className="close-btn"
                onClick={() => setShowNewCalendarTask(false)}
              >
                ×
              </button>
            </div>

            <div className="form-section">
              <h4>Task Details</h4>

              <div className="form-grid">
                <input
                  placeholder="Task title *"
                  value={newCalendarTask.title}
                  onChange={(e) =>
                    setNewCalendarTask({
                      ...newCalendarTask,
                      title: e.target.value,
                    })
                  }
                />

                <input
                  placeholder="Task date"
                  value={newCalendarTask.task_date}
                  onChange={(e) =>
                    setNewCalendarTask({
                      ...newCalendarTask,
                      task_date: e.target.value,
                    })
                  }
                />

                <select
                  value={newCalendarTask.song_id}
                  onChange={(e) =>
                    setNewCalendarTask({
                      ...newCalendarTask,
                      song_id: e.target.value,
                    })
                  }
                >
                  <option value="">Link to song optional</option>
                  {songs.map((song) => (
                    <option key={song.id} value={song.id}>
                      {song.title}
                    </option>
                  ))}
                </select>

                <select
                  value={newCalendarTask.product_id}
                  onChange={(e) =>
                    setNewCalendarTask({
                      ...newCalendarTask,
                      product_id: e.target.value,
                    })
                  }
                >
                  <option value="">Link to product optional</option>
                  {productAssets.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.title}
                    </option>
                  ))}
                </select>

                <select
                  value={newCalendarTask.platform}
                  onChange={(e) =>
                    setNewCalendarTask({
                      ...newCalendarTask,
                      platform: e.target.value,
                    })
                  }
                >
                  <option value="">Platform</option>
                  <option>Instagram</option>
                  <option>TikTok</option>
                  <option>YouTube</option>
                  <option>Facebook</option>
                  <option>X</option>
                  <option>Email</option>
                  <option>Website</option>
                  <option>Gumroad</option>
                  <option>BeatStars</option>
                  <option>General</option>
                </select>

                <select
                  value={newCalendarTask.task_type}
                  onChange={(e) =>
                    setNewCalendarTask({
                      ...newCalendarTask,
                      task_type: e.target.value,
                    })
                  }
                >
                  <option value="">Task type</option>
                  <option>Content Post</option>
                  <option>Short Video</option>
                  <option>Beat Upload</option>
                  <option>Email</option>
                  <option>Product Promo</option>
                  <option>Release Prep</option>
                  <option>Marketing Push</option>
                  <option>Admin Task</option>
                  <option>Daily Mission</option>
                </select>

                <select
                  value={newCalendarTask.status}
                  onChange={(e) =>
                    setNewCalendarTask({
                      ...newCalendarTask,
                      status: e.target.value,
                    })
                  }
                >
                  <option>Planned</option>
                  <option>In Progress</option>
                  <option>Done</option>
                  <option>Skipped</option>
                  <option>Needs Update</option>
                </select>

                <textarea
                  placeholder="Notes, instructions, caption idea, reminder, or daily mission details"
                  value={newCalendarTask.notes}
                  onChange={(e) =>
                    setNewCalendarTask({
                      ...newCalendarTask,
                      notes: e.target.value,
                    })
                  }
                />
              </div>
            </div>

            <button className="save-btn" onClick={saveCalendarTask}>
              Save Calendar Task
            </button>
          </div>
        </div>
      )}

      {selectedSong && (
        <div className="modal-backdrop">
          <div className="modal detail-modal">
            <div className="modal-header">
              <div>
                <p className="eyebrow">Song Profile</p>
                <h3>{selectedSong.title}</h3>
              </div>

              <div className="profile-actions">
                <button
                  className="secondary-btn"
                  onClick={() => startEditingSong(selectedSong)}
                >
                  Edit Song
                </button>

                <button
                  className="danger-btn"
                  onClick={() => deleteSong(selectedSong.id)}
                >
                  Delete Song
                </button>

                <button
                  className="close-btn"
                  onClick={() => setSelectedSong(null)}
                >
                  ×
                </button>
              </div>
            </div>

            <div className="song-profile-header">
              <div className="song-profile-art">
                {selectedSong.cover_art_data ? (
                  <img
                    src={selectedSong.cover_art_data}
                    alt={`${selectedSong.title} cover`}
                  />
                ) : (
                  <span>♪</span>
                )}
              </div>

              <div>
                <p className="song-profile-status">
                  {displayValue(selectedSong.status)}
                </p>
                <h2>{selectedSong.title}</h2>
                <p>
                  {displayValue(selectedSong.artist)} •{" "}
                  {displayValue(selectedSong.genre)} •{" "}
                  {displayValue(selectedSong.mood)}
                </p>
              </div>
            </div>

            <div className="detail-tabs">
              {detailTabs.map((tab) => (
                <button
                  key={tab}
                  className={activeDetailTab === tab ? "detail-tab-active" : ""}
                  onClick={() => setActiveDetailTab(tab)}
                >
                  {tab}
                </button>
              ))}
            </div>

            {renderDetailContent()}
          </div>
        </div>
      )}

      {showEditSong && selectedSong && (
        <div className="modal-backdrop edit-modal-backdrop">
          <div className="modal large-modal">
            <div className="modal-header">
              <div>
                <p className="eyebrow">Edit Song</p>
                <h3>Update song record</h3>
              </div>

              <button
                className="close-btn"
                onClick={() => setShowEditSong(false)}
              >
                ×
              </button>
            </div>

            {renderSongForm(editSong, setEditSong)}

            <button className="save-btn" onClick={updateSong}>
              Save Changes
            </button>
          </div>
        </div>
      )}

      {showEditProject && selectedProject && (
        <div className="modal-backdrop edit-modal-backdrop">
          <div className="modal large-modal">
            <div className="modal-header">
              <div>
                <p className="eyebrow">Edit Project</p>
                <h3>Update project / album</h3>
              </div>

              <button className="close-btn" onClick={() => setShowEditProject(false)}>
                ×
              </button>
            </div>

            <div className="form-section">
              <h4>Project Details</h4>
              <div className="form-grid">
                <input
                  placeholder="Project title *"
                  value={editProject.title}
                  onChange={(e) => setEditProject({ ...editProject, title: e.target.value })}
                />
                <select
                  value={editProject.project_type}
                  onChange={(e) => setEditProject({ ...editProject, project_type: e.target.value })}
                >
                  <option value="">Project type</option>
                  <option>Album</option>
                  <option>EP</option>
                  <option>Mixtape</option>
                  <option>Beat Tape</option>
                  <option>Single Campaign</option>
                  <option>Product Launch</option>
                  <option>Compilation</option>
                </select>
                <input
                  placeholder="Artist"
                  value={editProject.artist}
                  onChange={(e) => setEditProject({ ...editProject, artist: e.target.value })}
                />
                <select
                  value={editProject.status}
                  onChange={(e) => setEditProject({ ...editProject, status: e.target.value })}
                >
                  <option>Idea</option>
                  <option>In Progress</option>
                  <option>Recording</option>
                  <option>Mixing</option>
                  <option>Mastering</option>
                  <option>Ready</option>
                  <option>Scheduled</option>
                  <option>Released</option>
                </select>
                <input
                  placeholder="Release date"
                  value={editProject.release_date}
                  onChange={(e) => setEditProject({ ...editProject, release_date: e.target.value })}
                />
                <input
                  placeholder="Distributor"
                  value={editProject.distributor}
                  onChange={(e) => setEditProject({ ...editProject, distributor: e.target.value })}
                />
                <input
                  placeholder="UPC"
                  value={editProject.upc}
                  onChange={(e) => setEditProject({ ...editProject, upc: e.target.value })}
                />
                <input
                  placeholder="Label"
                  value={editProject.label}
                  onChange={(e) => setEditProject({ ...editProject, label: e.target.value })}
                />
                <textarea
                  placeholder="Project notes"
                  value={editProject.notes}
                  onChange={(e) => setEditProject({ ...editProject, notes: e.target.value })}
                />
              </div>
            </div>

            <div className="form-section">
              <h4>Project Cover Art</h4>
              <div className="cover-art-row">
                <div className="cover-preview">
                  {editProject.cover_art_data ? (
                    <img src={editProject.cover_art_data} alt="Project cover preview" />
                  ) : (
                    <span>No cover selected</span>
                  )}
                </div>
                <div className="cover-actions">
                  <p>Update the cover art for this project.</p>
                  <label className="upload-btn">
                    Choose Image
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) =>
                        handleEditProjectCoverArtUpload(
                          e.target.files ? e.target.files[0] : null,
                        )
                      }
                    />
                  </label>
                </div>
              </div>
            </div>

            <div className="ai-action-row">
              <button className="save-btn" onClick={updateProject}>Save Changes</button>
              <button className="secondary-btn" onClick={() => setShowEditProject(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {showEditLyricIdea && selectedLyricIdea && (
        <div className="modal-backdrop edit-modal-backdrop">
          <div className="modal large-modal">
            <div className="modal-header">
              <div>
                <p className="eyebrow">Edit Lyric Idea</p>
                <h3>Update lyric draft</h3>
              </div>
              <button className="close-btn" onClick={() => setShowEditLyricIdea(false)}>×</button>
            </div>
            <div className="form-grid">
              <input
                placeholder="Idea title *"
                value={editLyricIdea.title}
                onChange={(e) => setEditLyricIdea({ ...editLyricIdea, title: e.target.value })}
              />
              <input
                placeholder="Mood"
                value={editLyricIdea.mood}
                onChange={(e) => setEditLyricIdea({ ...editLyricIdea, mood: e.target.value })}
              />
              <textarea
                placeholder="Concept"
                value={editLyricIdea.concept}
                onChange={(e) => setEditLyricIdea({ ...editLyricIdea, concept: e.target.value })}
              />
              <textarea
                placeholder="Lyrics"
                value={editLyricIdea.lyrics}
                onChange={(e) => setEditLyricIdea({ ...editLyricIdea, lyrics: e.target.value })}
              />
              <textarea
                placeholder="Notes"
                value={editLyricIdea.notes}
                onChange={(e) => setEditLyricIdea({ ...editLyricIdea, notes: e.target.value })}
              />
            </div>
            <div className="ai-action-row">
              <button className="save-btn" onClick={updateLyricIdea}>Save Changes</button>
              <button className="secondary-btn" onClick={() => setShowEditLyricIdea(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {showEditMarketingAsset && selectedMarketingAsset && (
        <div className="modal-backdrop edit-modal-backdrop">
          <div className="modal large-modal">
            <div className="modal-header">
              <div>
                <p className="eyebrow">Edit Marketing Asset</p>
                <h3>Update saved copy</h3>
              </div>
              <button className="close-btn" onClick={() => setShowEditMarketingAsset(false)}>×</button>
            </div>
            <div className="form-grid">
              <select
                value={editMarketingAsset.song_id}
                onChange={(e) => setEditMarketingAsset({ ...editMarketingAsset, song_id: e.target.value })}
              >
                <option value="">Link to song optional</option>
                {songs.map((song) => (
                  <option key={song.id} value={song.id}>{song.title}</option>
                ))}
              </select>
              <input
                placeholder="Marketing title *"
                value={editMarketingAsset.title}
                onChange={(e) => setEditMarketingAsset({ ...editMarketingAsset, title: e.target.value })}
              />
              <input
                placeholder="Platform"
                value={editMarketingAsset.platform}
                onChange={(e) => setEditMarketingAsset({ ...editMarketingAsset, platform: e.target.value })}
              />
              <input
                placeholder="Content type"
                value={editMarketingAsset.content_type}
                onChange={(e) => setEditMarketingAsset({ ...editMarketingAsset, content_type: e.target.value })}
              />
              <input
                placeholder="Tone"
                value={editMarketingAsset.tone}
                onChange={(e) => setEditMarketingAsset({ ...editMarketingAsset, tone: e.target.value })}
              />
              <textarea
                placeholder="Copy"
                value={editMarketingAsset.copy}
                onChange={(e) => setEditMarketingAsset({ ...editMarketingAsset, copy: e.target.value })}
              />
              <textarea
                placeholder="Notes"
                value={editMarketingAsset.notes}
                onChange={(e) => setEditMarketingAsset({ ...editMarketingAsset, notes: e.target.value })}
              />
            </div>
            <div className="ai-action-row">
              <button className="save-btn" onClick={updateMarketingAsset}>Save Changes</button>
              <button className="secondary-btn" onClick={() => setShowEditMarketingAsset(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {showEditVisualAsset && selectedVisualAsset && (
        <div className="modal-backdrop edit-modal-backdrop">
          <div className="modal large-modal">
            <div className="modal-header">
              <div>
                <p className="eyebrow">Edit Visual Asset</p>
                <h3>Update visual direction</h3>
              </div>
              <button className="close-btn" onClick={() => setShowEditVisualAsset(false)}>×</button>
            </div>
            <div className="form-grid">
              <select
                value={editVisualAsset.song_id}
                onChange={(e) => setEditVisualAsset({ ...editVisualAsset, song_id: e.target.value })}
              >
                <option value="">Link to song optional</option>
                {songs.map((song) => (
                  <option key={song.id} value={song.id}>{song.title}</option>
                ))}
              </select>
              <input
                placeholder="Visual title *"
                value={editVisualAsset.title}
                onChange={(e) => setEditVisualAsset({ ...editVisualAsset, title: e.target.value })}
              />
              <input
                placeholder="Asset type"
                value={editVisualAsset.asset_type}
                onChange={(e) => setEditVisualAsset({ ...editVisualAsset, asset_type: e.target.value })}
              />
              <input
                placeholder="Visual style"
                value={editVisualAsset.visual_style}
                onChange={(e) => setEditVisualAsset({ ...editVisualAsset, visual_style: e.target.value })}
              />
              <textarea
                placeholder="Prompt / direction"
                value={editVisualAsset.prompt}
                onChange={(e) => setEditVisualAsset({ ...editVisualAsset, prompt: e.target.value })}
              />
              <textarea
                placeholder="Notes"
                value={editVisualAsset.notes}
                onChange={(e) => setEditVisualAsset({ ...editVisualAsset, notes: e.target.value })}
              />
            </div>
            <div className="form-section">
              <h4>Reference Image</h4>
              <div className="visual-reference-row">
                <div className="visual-reference-preview">
                  {editVisualAsset.reference_image_data ? (
                    <img src={editVisualAsset.reference_image_data} alt="Visual reference preview" />
                  ) : (
                    <span>No reference image selected</span>
                  )}
                </div>
                <div className="visual-reference-actions">
                  <label className="upload-btn">
                    Choose Reference Image
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) =>
                        handleEditVisualReferenceImageUpload(
                          e.target.files ? e.target.files[0] : null,
                        )
                      }
                    />
                  </label>
                  {editVisualAsset.reference_image_data && (
                    <button className="secondary-btn" onClick={clearEditVisualReferenceImage}>
                      Clear Reference Image
                    </button>
                  )}
                  <p className="zip-file-info">
                    {editVisualAsset.reference_image_name
                      ? `Using reference: ${editVisualAsset.reference_image_name}`
                      : "Reference images are optional."}
                  </p>
                </div>
              </div>
            </div>
            <div className="ai-action-row">
              <button className="save-btn" onClick={updateVisualAsset}>Save Changes</button>
              <button className="secondary-btn" onClick={() => setShowEditVisualAsset(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {showEditProductAsset && selectedProductAsset && (
        <div className="modal-backdrop edit-modal-backdrop">
          <div className="modal large-modal">
            <div className="modal-header">
              <div>
                <p className="eyebrow">Edit Product</p>
                <h3>Update product asset</h3>
              </div>
              <button className="close-btn" onClick={() => setShowEditProductAsset(false)}>×</button>
            </div>
            <div className="form-grid">
              <input placeholder="Product title *" value={editProductAsset.title} onChange={(e) => setEditProductAsset({ ...editProductAsset, title: e.target.value })} />
              <input placeholder="Product type" value={editProductAsset.product_type} onChange={(e) => setEditProductAsset({ ...editProductAsset, product_type: e.target.value })} />
              <input placeholder="Price" value={editProductAsset.price} onChange={(e) => setEditProductAsset({ ...editProductAsset, price: e.target.value })} />
              <select value={editProductAsset.status} onChange={(e) => setEditProductAsset({ ...editProductAsset, status: e.target.value })}>
                <option>Idea</option>
                <option>Building</option>
                <option>Ready</option>
                <option>Launched</option>
                <option>Paused</option>
              </select>
              <textarea placeholder="Description" value={editProductAsset.description} onChange={(e) => setEditProductAsset({ ...editProductAsset, description: e.target.value })} />
              <textarea placeholder="Promo angle" value={editProductAsset.promo_angle} onChange={(e) => setEditProductAsset({ ...editProductAsset, promo_angle: e.target.value })} />
              <textarea placeholder="Launch notes" value={editProductAsset.launch_notes} onChange={(e) => setEditProductAsset({ ...editProductAsset, launch_notes: e.target.value })} />
              <input placeholder="Google Drive link" value={editProductAsset.google_drive_link} onChange={(e) => setEditProductAsset({ ...editProductAsset, google_drive_link: e.target.value })} />
              <input placeholder="OneDrive link" value={editProductAsset.onedrive_link} onChange={(e) => setEditProductAsset({ ...editProductAsset, onedrive_link: e.target.value })} />
              <input placeholder="Dropbox link" value={editProductAsset.dropbox_link} onChange={(e) => setEditProductAsset({ ...editProductAsset, dropbox_link: e.target.value })} />
              <input placeholder="Gumroad link" value={editProductAsset.gumroad_link} onChange={(e) => setEditProductAsset({ ...editProductAsset, gumroad_link: e.target.value })} />
              <input placeholder="Website link" value={editProductAsset.website_link} onChange={(e) => setEditProductAsset({ ...editProductAsset, website_link: e.target.value })} />
            </div>
            <div className="form-section">
              <h4>Product Files</h4>
              <div className="visual-reference-row">
                <div className="visual-reference-preview">
                  {editProductAsset.product_image_data ? (
                    <img src={editProductAsset.product_image_data} alt="Product preview" />
                  ) : (
                    <span>No product image</span>
                  )}
                </div>
                <div className="visual-reference-actions">
                  <label className="upload-btn">
                    Choose Product Image
                    <input type="file" accept="image/*" onChange={(e) => handleEditProductImageUpload(e.target.files ? e.target.files[0] : null)} />
                  </label>
                  <label className="upload-btn">
                    Choose ZIP File
                    <input type="file" accept=".zip" onChange={(e) => handleEditProductZipUpload(e.target.files ? e.target.files[0] : null)} />
                  </label>
                  <p className="zip-file-info">
                    {editProductAsset.zip_file_name
                      ? `ZIP: ${editProductAsset.zip_file_name} (${editProductAsset.zip_file_size})`
                      : "No ZIP selected."}
                  </p>
                </div>
              </div>
            </div>
            <div className="ai-action-row">
              <button className="save-btn" onClick={updateProductAsset}>Save Changes</button>
              <button className="secondary-btn" onClick={() => setShowEditProductAsset(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {showEditReleaseRoadmap && selectedReleaseRoadmap && (
        <div className="modal-backdrop edit-modal-backdrop">
          <div className="modal large-modal">
            <div className="modal-header">
              <div>
                <p className="eyebrow">Edit Roadmap</p>
                <h3>Update release plan</h3>
              </div>
              <button className="close-btn" onClick={() => setShowEditReleaseRoadmap(false)}>×</button>
            </div>
            <div className="form-grid">
              <select value={editReleaseRoadmap.song_id} onChange={(e) => setEditReleaseRoadmap({ ...editReleaseRoadmap, song_id: e.target.value })}>
                <option value="">Link to song optional</option>
                {songs.map((song) => <option key={song.id} value={song.id}>{song.title}</option>)}
              </select>
              <input placeholder="Roadmap title *" value={editReleaseRoadmap.title} onChange={(e) => setEditReleaseRoadmap({ ...editReleaseRoadmap, title: e.target.value })} />
              <input placeholder="Release date" value={editReleaseRoadmap.release_date} onChange={(e) => setEditReleaseRoadmap({ ...editReleaseRoadmap, release_date: e.target.value })} />
              <input placeholder="Release type" value={editReleaseRoadmap.release_type} onChange={(e) => setEditReleaseRoadmap({ ...editReleaseRoadmap, release_type: e.target.value })} />
              <input placeholder="Campaign goal" value={editReleaseRoadmap.campaign_goal} onChange={(e) => setEditReleaseRoadmap({ ...editReleaseRoadmap, campaign_goal: e.target.value })} />
              <input placeholder="Budget level" value={editReleaseRoadmap.budget_level} onChange={(e) => setEditReleaseRoadmap({ ...editReleaseRoadmap, budget_level: e.target.value })} />
              <input placeholder="Platform focus" value={editReleaseRoadmap.platform_focus} onChange={(e) => setEditReleaseRoadmap({ ...editReleaseRoadmap, platform_focus: e.target.value })} />
              <textarea placeholder="Rollout plan" value={editReleaseRoadmap.rollout_plan} onChange={(e) => setEditReleaseRoadmap({ ...editReleaseRoadmap, rollout_plan: e.target.value })} />
              <textarea placeholder="Checklist notes" value={editReleaseRoadmap.checklist_notes} onChange={(e) => setEditReleaseRoadmap({ ...editReleaseRoadmap, checklist_notes: e.target.value })} />
            </div>
            <div className="ai-action-row">
              <button className="save-btn" onClick={updateReleaseRoadmap}>Save Changes</button>
              <button className="secondary-btn" onClick={() => setShowEditReleaseRoadmap(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {showEditCalendarTask && selectedCalendarTask && (
        <div className="modal-backdrop edit-modal-backdrop">
          <div className="modal large-modal">
            <div className="modal-header">
              <div>
                <p className="eyebrow">Edit Calendar Task</p>
                <h3>Update task</h3>
              </div>
              <button className="close-btn" onClick={() => setShowEditCalendarTask(false)}>×</button>
            </div>
            <div className="form-grid">
              <select value={editCalendarTask.song_id} onChange={(e) => setEditCalendarTask({ ...editCalendarTask, song_id: e.target.value })}>
                <option value="">Link to song optional</option>
                {songs.map((song) => <option key={song.id} value={song.id}>{song.title}</option>)}
              </select>
              <select value={editCalendarTask.product_id} onChange={(e) => setEditCalendarTask({ ...editCalendarTask, product_id: e.target.value })}>
                <option value="">Link to product optional</option>
                {productAssets.map((product) => <option key={product.id} value={product.id}>{product.title}</option>)}
              </select>
              <input placeholder="Task title *" value={editCalendarTask.title} onChange={(e) => setEditCalendarTask({ ...editCalendarTask, title: e.target.value })} />
              <input placeholder="Task date" value={editCalendarTask.task_date} onChange={(e) => setEditCalendarTask({ ...editCalendarTask, task_date: e.target.value })} />
              <input placeholder="Platform" value={editCalendarTask.platform} onChange={(e) => setEditCalendarTask({ ...editCalendarTask, platform: e.target.value })} />
              <input placeholder="Task type" value={editCalendarTask.task_type} onChange={(e) => setEditCalendarTask({ ...editCalendarTask, task_type: e.target.value })} />
              <select value={editCalendarTask.status} onChange={(e) => setEditCalendarTask({ ...editCalendarTask, status: e.target.value })}>
                <option>Planned</option>
                <option>In Progress</option>
                <option>Done</option>
                <option>Skipped</option>
              </select>
              <textarea placeholder="Notes" value={editCalendarTask.notes} onChange={(e) => setEditCalendarTask({ ...editCalendarTask, notes: e.target.value })} />
            </div>
            <div className="ai-action-row">
              <button className="save-btn" onClick={updateCalendarTask}>Save Changes</button>
              <button className="secondary-btn" onClick={() => setShowEditCalendarTask(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {showEditEpkProfile && selectedEpkProfile && (
        <div className="modal-backdrop edit-modal-backdrop">
          <div className="modal large-modal">
            <div className="modal-header">
              <div>
                <p className="eyebrow">Edit EPK Profile</p>
                <h3>Update press kit profile</h3>
              </div>
              <button className="close-btn" onClick={() => setShowEditEpkProfile(false)}>×</button>
            </div>
            <div className="form-grid">
              <input placeholder="Artist / producer name *" value={editEpkProfile.artist_name} onChange={(e) => setEditEpkProfile({ ...editEpkProfile, artist_name: e.target.value })} />
              <input placeholder="Producer name" value={editEpkProfile.producer_name} onChange={(e) => setEditEpkProfile({ ...editEpkProfile, producer_name: e.target.value })} />
              <input placeholder="Location" value={editEpkProfile.location} onChange={(e) => setEditEpkProfile({ ...editEpkProfile, location: e.target.value })} />
              <input placeholder="Genre" value={editEpkProfile.genre} onChange={(e) => setEditEpkProfile({ ...editEpkProfile, genre: e.target.value })} />
              <select value={editEpkProfile.linked_song_id} onChange={(e) => setEditEpkProfile({ ...editEpkProfile, linked_song_id: e.target.value })}>
                <option value="">Linked song optional</option>
                {songs.map((song) => <option key={song.id} value={song.id}>{song.title}</option>)}
              </select>
              <select value={editEpkProfile.linked_project_id} onChange={(e) => setEditEpkProfile({ ...editEpkProfile, linked_project_id: e.target.value })}>
                <option value="">Linked project optional</option>
                {projects.map((project) => <option key={project.id} value={project.id}>{project.title}</option>)}
              </select>
              <input placeholder="Contact email" value={editEpkProfile.contact_email} onChange={(e) => setEditEpkProfile({ ...editEpkProfile, contact_email: e.target.value })} />
              <input placeholder="Website" value={editEpkProfile.website} onChange={(e) => setEditEpkProfile({ ...editEpkProfile, website: e.target.value })} />
              <input placeholder="Booking link" value={editEpkProfile.booking_link} onChange={(e) => setEditEpkProfile({ ...editEpkProfile, booking_link: e.target.value })} />
              <textarea placeholder="Sound description" value={editEpkProfile.sound_description} onChange={(e) => setEditEpkProfile({ ...editEpkProfile, sound_description: e.target.value })} />
              <textarea placeholder="Short story" value={editEpkProfile.short_story} onChange={(e) => setEditEpkProfile({ ...editEpkProfile, short_story: e.target.value })} />
              <textarea placeholder="Influences" value={editEpkProfile.influences} onChange={(e) => setEditEpkProfile({ ...editEpkProfile, influences: e.target.value })} />
              <textarea placeholder="Highlights" value={editEpkProfile.highlights} onChange={(e) => setEditEpkProfile({ ...editEpkProfile, highlights: e.target.value })} />
              <textarea placeholder="Credits" value={editEpkProfile.credits} onChange={(e) => setEditEpkProfile({ ...editEpkProfile, credits: e.target.value })} />
              <textarea placeholder="Social links" value={editEpkProfile.social_links} onChange={(e) => setEditEpkProfile({ ...editEpkProfile, social_links: e.target.value })} />
              <textarea placeholder="Saved bio" value={editEpkProfile.saved_bio} onChange={(e) => setEditEpkProfile({ ...editEpkProfile, saved_bio: e.target.value })} />
              <textarea placeholder="Saved one sheet" value={editEpkProfile.saved_one_sheet} onChange={(e) => setEditEpkProfile({ ...editEpkProfile, saved_one_sheet: e.target.value })} />
              <textarea placeholder="Saved pitch" value={editEpkProfile.saved_pitch} onChange={(e) => setEditEpkProfile({ ...editEpkProfile, saved_pitch: e.target.value })} />
              <textarea placeholder="Saved press release" value={editEpkProfile.saved_press_release} onChange={(e) => setEditEpkProfile({ ...editEpkProfile, saved_press_release: e.target.value })} />
              <textarea placeholder="Notes" value={editEpkProfile.notes} onChange={(e) => setEditEpkProfile({ ...editEpkProfile, notes: e.target.value })} />
            </div>
            <div className="form-section">
              <h4>Media Assets</h4>
              <div className="visual-reference-row">
                <div className="visual-reference-preview">
                  {editEpkProfile.press_photo_data ? <img src={editEpkProfile.press_photo_data} alt="Press photo" /> : <span>No press photo</span>}
                </div>
                <div className="visual-reference-actions">
                  <label className="upload-btn">
                    Choose Press Photo
                    <input type="file" accept="image/*" onChange={(e) => handleEditEpkPhotoUpload(e.target.files ? e.target.files[0] : null)} />
                  </label>
                </div>
              </div>
              <div className="visual-reference-row" style={{ marginTop: "18px" }}>
                <div className="visual-reference-preview">
                  {editEpkProfile.logo_data ? <img src={editEpkProfile.logo_data} alt="Logo" /> : <span>No logo</span>}
                </div>
                <div className="visual-reference-actions">
                  <label className="upload-btn">
                    Choose Logo
                    <input type="file" accept="image/*" onChange={(e) => handleEditEpkLogoUpload(e.target.files ? e.target.files[0] : null)} />
                  </label>
                </div>
              </div>
            </div>
            <div className="ai-action-row">
              <button className="save-btn" onClick={updateEpkProfile}>Save Changes</button>
              <button className="secondary-btn" onClick={() => setShowEditEpkProfile(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {showEditWebTool && selectedWebTool && (
        <div className="modal-backdrop edit-modal-backdrop">
          <div className="modal large-modal">
            <div className="modal-header">
              <div>
                <p className="eyebrow">Edit Web Tool</p>
                <h3>Update saved resource</h3>
              </div>
              <button className="close-btn" onClick={() => setShowEditWebTool(false)}>×</button>
            </div>
            <div className="form-grid">
              <input placeholder="Tool title *" value={editWebTool.title} onChange={(e) => setEditWebTool({ ...editWebTool, title: e.target.value })} />
              <input placeholder="URL *" value={editWebTool.url} onChange={(e) => setEditWebTool({ ...editWebTool, url: e.target.value })} />
              <select value={editWebTool.category} onChange={(e) => setEditWebTool({ ...editWebTool, category: e.target.value })}>
                <option>Distribution</option>
                <option>Royalties</option>
                <option>Marketing</option>
                <option>Design</option>
                <option>Social Media</option>
                <option>Samples</option>
                <option>Plugins</option>
                <option>Business</option>
                <option>AI Tools</option>
                <option>Education</option>
                <option>Other</option>
              </select>
              <select value={editWebTool.priority} onChange={(e) => setEditWebTool({ ...editWebTool, priority: e.target.value })}>
                <option>Low</option>
                <option>Normal</option>
                <option>High</option>
                <option>Daily Use</option>
              </select>
              <select value={editWebTool.is_favorite} onChange={(e) => setEditWebTool({ ...editWebTool, is_favorite: e.target.value })}>
                <option value="0">Not pinned</option>
                <option value="1">Pinned</option>
              </select>
              <textarea placeholder="Description" value={editWebTool.description} onChange={(e) => setEditWebTool({ ...editWebTool, description: e.target.value })} />
              <textarea placeholder="Login / usage notes" value={editWebTool.login_notes} onChange={(e) => setEditWebTool({ ...editWebTool, login_notes: e.target.value })} />
            </div>

            <div className="ai-action-row">
              <button className="secondary-btn" onClick={fetchPreviewForEditWebTool} disabled={editWebToolPreviewLoading}>
                {editWebToolPreviewLoading ? "Fetching Preview..." : "Fetch Link Preview"}
              </button>
              <button className="secondary-btn" onClick={clearEditWebToolPreview}>Clear Preview</button>
            </div>

            {editWebToolPreviewError && (
              <div className="detail-section ai-error-box">
                <p>{editWebToolPreviewError}</p>
              </div>
            )}

            {(editWebTool.preview_title || editWebTool.preview_image_url) && (
              <div className="detail-section ai-output-box">
                <h4>Preview</h4>
                {editWebTool.preview_image_url && (
                  <img className="generated-image-preview" src={editWebTool.preview_image_url} alt="Link preview" />
                )}
                <p>{editWebTool.preview_title || editWebTool.title}</p>
                <p>{editWebTool.preview_description || editWebTool.description}</p>
              </div>
            )}

            <div className="ai-action-row">
              <button className="save-btn" onClick={updateWebTool}>Save Changes</button>
              <button className="secondary-btn" onClick={() => setShowEditWebTool(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
