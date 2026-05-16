import { supabase } from "../supabaseClient";

export type WebToolFormForCloud = {
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

export type WebToolForApp = {
  id: string;
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

type WebToolRow = {
  id: string;
  title: string;
  url: string;
  category: string | null;
  description: string | null;
  login_notes: string | null;
  priority: string | null;
  pinned: boolean | null;
  preview_title: string | null;
  preview_description: string | null;
  preview_image: string | null;
  site_name: string | null;
  favicon_url: string | null;
  final_url: string | null;
  created_at: string | null;
};

function rowToWebTool(row: WebToolRow): WebToolForApp {
  return {
    id: row.id,
    title: row.title,
    url: row.final_url || row.url,
    category: row.category || "",
    description: row.description || "",
    login_notes: row.login_notes || "",
    priority: row.priority || "Normal",
    is_favorite: row.pinned ? 1 : 0,
    preview_title: row.preview_title || "",
    preview_description: row.preview_description || "",
    preview_image_url: row.preview_image || "",
    preview_site_name: row.site_name || "",
    preview_favicon_url: row.favicon_url || "",
    created_at: row.created_at || "",
  };
}

function formToPayload(form: WebToolFormForCloud, userId: string) {
  return {
    user_id: userId,
    title: form.title.trim(),
    url: form.url.trim(),
    final_url: form.url.trim(),
    category: form.category || null,
    description: form.description || null,
    login_notes: form.login_notes || null,
    priority: form.priority || "Normal",
    pinned: form.is_favorite === "1",
    preview_title: form.preview_title || null,
    preview_description: form.preview_description || null,
    preview_image: form.preview_image_url || null,
    site_name: form.preview_site_name || null,
    favicon_url: form.preview_favicon_url || null,
  };
}

async function getCurrentUserId(): Promise<string> {
  const { data, error } = await supabase.auth.getUser();

  if (error) {
    throw new Error(error.message);
  }

  if (!data.user) {
    throw new Error("You must be signed in before using cloud Web Tools.");
  }

  return data.user.id;
}

export async function listCloudWebTools(): Promise<WebToolForApp[]> {
  await getCurrentUserId();

  const { data, error } = await supabase
    .from("web_tools")
    .select("*")
    .order("pinned", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return ((data || []) as WebToolRow[]).map(rowToWebTool);
}

export async function createCloudWebTool(form: WebToolFormForCloud): Promise<WebToolForApp> {
  const userId = await getCurrentUserId();

  const { data, error } = await supabase
    .from("web_tools")
    .insert(formToPayload(form, userId))
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return rowToWebTool(data as WebToolRow);
}

export async function updateCloudWebTool(
  toolId: string,
  form: WebToolFormForCloud,
): Promise<WebToolForApp> {
  const userId = await getCurrentUserId();

  const { data, error } = await supabase
    .from("web_tools")
    .update(formToPayload(form, userId))
    .eq("id", toolId)
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return rowToWebTool(data as WebToolRow);
}

export async function deleteCloudWebTool(toolId: string): Promise<void> {
  await getCurrentUserId();

  const { error } = await supabase.from("web_tools").delete().eq("id", toolId);

  if (error) {
    throw new Error(error.message);
  }
}


export type EpkProfileFormForCloud = {
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

export type EpkProfileForApp = {
  id: string;
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

type EpkProfileRow = {
  id: string;
  artist_name: string;
  producer_name: string | null;
  location: string | null;
  genre: string | null;
  sound_description: string | null;
  story: string | null;
  influences: string | null;
  highlights: string | null;
  credits: string | null;
  contact_email: string | null;
  website: string | null;
  social_links: string | null;
  booking_link: string | null;
  linked_song_id: string | null;
  linked_project_id: string | null;
  press_photo_url: string | null;
  logo_url: string | null;
  saved_bio: string | null;
  saved_one_sheet: string | null;
  saved_press_release: string | null;
  saved_pitch: string | null;
  notes: string | null;
  created_at: string | null;
};

function rowToEpkProfile(row: EpkProfileRow): EpkProfileForApp {
  return {
    id: row.id,
    artist_name: row.artist_name,
    producer_name: row.producer_name || "",
    location: row.location || "",
    genre: row.genre || "",
    sound_description: row.sound_description || "",
    short_story: row.story || "",
    influences: row.influences || "",
    highlights: row.highlights || "",
    credits: row.credits || "",
    contact_email: row.contact_email || "",
    website: row.website || "",
    social_links: row.social_links || "",
    booking_link: row.booking_link || "",
    linked_song_id: row.linked_song_id || undefined,
    linked_project_id: row.linked_project_id || undefined,
    press_photo_data: row.press_photo_url || "",
    logo_data: row.logo_url || "",
    saved_bio: row.saved_bio || "",
    saved_one_sheet: row.saved_one_sheet || "",
    saved_pitch: row.saved_pitch || "",
    saved_press_release: row.saved_press_release || "",
    notes: row.notes || "",
    created_at: row.created_at || "",
  };
}

function epkFormToPayload(form: EpkProfileFormForCloud, userId: string) {
  return {
    user_id: userId,
    artist_name: form.artist_name.trim(),
    producer_name: form.producer_name || null,
    location: form.location || null,
    genre: form.genre || null,
    sound_description: form.sound_description || null,
    story: form.short_story || null,
    influences: form.influences || null,
    highlights: form.highlights || null,
    credits: form.credits || null,
    contact_email: form.contact_email || null,
    website: form.website || null,
    social_links: form.social_links || null,
    booking_link: form.booking_link || null,
    // Songs and Projects are still local in this phase, so do not send local numeric ids to cloud UUID fields yet.
    linked_song_id: null,
    linked_project_id: null,
    press_photo_url: form.press_photo_data || null,
    logo_url: form.logo_data || null,
    saved_bio: form.saved_bio || null,
    saved_one_sheet: form.saved_one_sheet || null,
    saved_pitch: form.saved_pitch || null,
    saved_press_release: form.saved_press_release || null,
    notes: form.notes || null,
  };
}

export async function listCloudEpkProfiles(): Promise<EpkProfileForApp[]> {
  await getCurrentUserId();

  const { data, error } = await supabase
    .from("epk_profiles")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return ((data || []) as EpkProfileRow[]).map(rowToEpkProfile);
}

export async function createCloudEpkProfile(
  form: EpkProfileFormForCloud,
): Promise<EpkProfileForApp> {
  const userId = await getCurrentUserId();

  const { data, error } = await supabase
    .from("epk_profiles")
    .insert(epkFormToPayload(form, userId))
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return rowToEpkProfile(data as EpkProfileRow);
}

export async function updateCloudEpkProfile(
  profileId: string,
  form: EpkProfileFormForCloud,
): Promise<EpkProfileForApp> {
  const userId = await getCurrentUserId();

  const { data, error } = await supabase
    .from("epk_profiles")
    .update(epkFormToPayload(form, userId))
    .eq("id", profileId)
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return rowToEpkProfile(data as EpkProfileRow);
}

export async function updateCloudEpkProfileSection(
  profileId: string,
  field:
    | "saved_bio"
    | "saved_one_sheet"
    | "saved_pitch"
    | "saved_press_release",
  value: string,
): Promise<EpkProfileForApp> {
  await getCurrentUserId();

  const { data, error } = await supabase
    .from("epk_profiles")
    .update({ [field]: value })
    .eq("id", profileId)
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return rowToEpkProfile(data as EpkProfileRow);
}

export async function deleteCloudEpkProfile(profileId: string): Promise<void> {
  await getCurrentUserId();

  const { error } = await supabase.from("epk_profiles").delete().eq("id", profileId);

  if (error) {
    throw new Error(error.message);
  }
}


export type CalendarTaskFormForCloud = {
  song_id: string;
  product_id: string;
  title: string;
  task_date: string;
  platform: string;
  task_type: string;
  status: string;
  notes: string;
};

export type CalendarTaskForApp = {
  id: string;
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

type CalendarTaskRow = {
  id: string;
  song_id: string | null;
  product_id: string | null;
  title: string;
  task_date: string | null;
  platform: string | null;
  task_type: string | null;
  status: string | null;
  notes: string | null;
  created_at: string | null;
};

function rowToCalendarTask(row: CalendarTaskRow): CalendarTaskForApp {
  return {
    id: row.id,
    song_id: undefined,
    product_id: undefined,
    title: row.title,
    task_date: row.task_date || "",
    platform: row.platform || "",
    task_type: row.task_type || "",
    status: row.status || "",
    notes: row.notes || "",
    created_at: row.created_at || "",
  };
}

function calendarTaskFormToPayload(form: CalendarTaskFormForCloud, userId: string) {
  return {
    user_id: userId,
    song_id: null,
    product_id: null,
    title: form.title.trim(),
    task_date: form.task_date || null,
    platform: form.platform || null,
    task_type: form.task_type || null,
    status: form.status || "Planned",
    notes: form.notes || null,
  };
}

export async function listCloudCalendarTasks(): Promise<CalendarTaskForApp[]> {
  await getCurrentUserId();

  const { data, error } = await supabase
    .from("calendar_tasks")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return ((data || []) as CalendarTaskRow[]).map(rowToCalendarTask);
}

export async function createCloudCalendarTask(
  form: CalendarTaskFormForCloud,
): Promise<CalendarTaskForApp> {
  const userId = await getCurrentUserId();

  const { data, error } = await supabase
    .from("calendar_tasks")
    .insert(calendarTaskFormToPayload(form, userId))
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return rowToCalendarTask(data as CalendarTaskRow);
}

export async function updateCloudCalendarTask(
  taskId: string,
  form: CalendarTaskFormForCloud,
): Promise<CalendarTaskForApp> {
  const userId = await getCurrentUserId();

  const { data, error } = await supabase
    .from("calendar_tasks")
    .update(calendarTaskFormToPayload(form, userId))
    .eq("id", taskId)
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return rowToCalendarTask(data as CalendarTaskRow);
}

export async function deleteCloudCalendarTask(taskId: string): Promise<void> {
  await getCurrentUserId();

  const { error } = await supabase.from("calendar_tasks").delete().eq("id", taskId);

  if (error) {
    throw new Error(error.message);
  }
}


export type LyricIdeaFormForCloud = {
  title: string;
  mood: string;
  concept: string;
  lyrics: string;
  notes: string;
};

export type LyricIdeaForApp = {
  id: string;
  title: string;
  mood?: string;
  concept?: string;
  lyrics?: string;
  notes?: string;
  created_at?: string;
};

type LyricIdeaRow = {
  id: string;
  title: string;
  mood: string | null;
  concept: string | null;
  lyrics: string | null;
  notes: string | null;
  created_at: string | null;
};

function rowToLyricIdea(row: LyricIdeaRow): LyricIdeaForApp {
  return {
    id: row.id,
    title: row.title,
    mood: row.mood || "",
    concept: row.concept || "",
    lyrics: row.lyrics || "",
    notes: row.notes || "",
    created_at: row.created_at || "",
  };
}

function lyricIdeaFormToPayload(form: LyricIdeaFormForCloud, userId: string) {
  return {
    user_id: userId,
    title: form.title.trim(),
    mood: form.mood || null,
    concept: form.concept || null,
    lyrics: form.lyrics || null,
    notes: form.notes || null,
  };
}

export async function listCloudLyricIdeas(): Promise<LyricIdeaForApp[]> {
  await getCurrentUserId();

  const { data, error } = await supabase
    .from("lyric_ideas")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return ((data || []) as LyricIdeaRow[]).map(rowToLyricIdea);
}

export async function createCloudLyricIdea(
  form: LyricIdeaFormForCloud,
): Promise<LyricIdeaForApp> {
  const userId = await getCurrentUserId();

  const { data, error } = await supabase
    .from("lyric_ideas")
    .insert(lyricIdeaFormToPayload(form, userId))
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return rowToLyricIdea(data as LyricIdeaRow);
}

export async function updateCloudLyricIdea(
  ideaId: string,
  form: LyricIdeaFormForCloud,
): Promise<LyricIdeaForApp> {
  const userId = await getCurrentUserId();

  const { data, error } = await supabase
    .from("lyric_ideas")
    .update(lyricIdeaFormToPayload(form, userId))
    .eq("id", ideaId)
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return rowToLyricIdea(data as LyricIdeaRow);
}

export async function deleteCloudLyricIdea(ideaId: string): Promise<void> {
  await getCurrentUserId();

  const { error } = await supabase.from("lyric_ideas").delete().eq("id", ideaId);

  if (error) {
    throw new Error(error.message);
  }
}


export type MarketingAssetFormForCloud = {
  song_id: string;
  title: string;
  platform: string;
  content_type: string;
  tone: string;
  copy: string;
  notes: string;
};

export type MarketingAssetForApp = {
  id: string;
  song_id?: number | string;
  title: string;
  platform?: string;
  content_type?: string;
  tone?: string;
  copy?: string;
  notes?: string;
  created_at?: string;
};

type MarketingAssetRow = {
  id: string;
  song_id: string | null;
  title: string;
  platform: string | null;
  content_type: string | null;
  tone: string | null;
  copy: string | null;
  notes: string | null;
  created_at: string | null;
};

function rowToMarketingAsset(row: MarketingAssetRow): MarketingAssetForApp {
  return {
    id: row.id,
    // Songs are still local in this phase, so cloud marketing assets do not link back to local numeric ids yet.
    song_id: undefined,
    title: row.title,
    platform: row.platform || "",
    content_type: row.content_type || "",
    tone: row.tone || "",
    copy: row.copy || "",
    notes: row.notes || "",
    created_at: row.created_at || "",
  };
}

function marketingAssetFormToPayload(form: MarketingAssetFormForCloud, userId: string) {
  return {
    user_id: userId,
    // Songs are still local in this phase, so do not send local numeric ids to cloud UUID fields yet.
    song_id: null,
    title: form.title.trim(),
    platform: form.platform || null,
    content_type: form.content_type || null,
    tone: form.tone || null,
    copy: form.copy || null,
    notes: form.notes || null,
  };
}

export async function listCloudMarketingAssets(): Promise<MarketingAssetForApp[]> {
  await getCurrentUserId();

  const { data, error } = await supabase
    .from("marketing_assets")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return ((data || []) as MarketingAssetRow[]).map(rowToMarketingAsset);
}

export async function createCloudMarketingAsset(
  form: MarketingAssetFormForCloud,
): Promise<MarketingAssetForApp> {
  const userId = await getCurrentUserId();

  const { data, error } = await supabase
    .from("marketing_assets")
    .insert(marketingAssetFormToPayload(form, userId))
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return rowToMarketingAsset(data as MarketingAssetRow);
}

export async function updateCloudMarketingAsset(
  assetId: string,
  form: MarketingAssetFormForCloud,
): Promise<MarketingAssetForApp> {
  const userId = await getCurrentUserId();

  const { data, error } = await supabase
    .from("marketing_assets")
    .update(marketingAssetFormToPayload(form, userId))
    .eq("id", assetId)
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return rowToMarketingAsset(data as MarketingAssetRow);
}

export async function deleteCloudMarketingAsset(assetId: string): Promise<void> {
  await getCurrentUserId();

  const { error } = await supabase.from("marketing_assets").delete().eq("id", assetId);

  if (error) {
    throw new Error(error.message);
  }
}


export type VisualAssetFormForCloud = {
  song_id: string;
  title: string;
  asset_type: string;
  visual_style: string;
  prompt: string;
  notes: string;
  reference_image_data: string;
  reference_image_name: string;
};

export type VisualAssetForApp = {
  id: string;
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

type VisualAssetRow = {
  id: string;
  song_id: string | null;
  title: string;
  asset_type: string | null;
  visual_style: string | null;
  prompt: string | null;
  notes: string | null;
  reference_image_url: string | null;
  reference_image_path: string | null;
  generated_image_url: string | null;
  generated_image_path: string | null;
  created_at: string | null;
};

function rowToVisualAsset(row: VisualAssetRow): VisualAssetForApp {
  return {
    id: row.id,
    // Songs are still local in this phase, so cloud visual assets do not link back to local numeric ids yet.
    song_id: undefined,
    title: row.title,
    asset_type: row.asset_type || "",
    visual_style: row.visual_style || "",
    prompt: row.prompt || "",
    notes: row.notes || "",
    reference_image_data: row.reference_image_url || "",
    reference_image_name: row.reference_image_path || "",
    created_at: row.created_at || "",
  };
}

function visualAssetFormToPayload(form: VisualAssetFormForCloud, userId: string) {
  return {
    user_id: userId,
    // Songs are still local in this phase, so do not send local numeric ids to cloud UUID fields yet.
    song_id: null,
    title: form.title.trim(),
    asset_type: form.asset_type || null,
    visual_style: form.visual_style || null,
    prompt: form.prompt || null,
    notes: form.notes || null,
    reference_image_url: form.reference_image_data || null,
    reference_image_path: form.reference_image_name || null,
  };
}

export async function listCloudVisualAssets(): Promise<VisualAssetForApp[]> {
  await getCurrentUserId();

  const { data, error } = await supabase
    .from("visual_assets")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return ((data || []) as VisualAssetRow[]).map(rowToVisualAsset);
}

export async function createCloudVisualAsset(
  form: VisualAssetFormForCloud,
): Promise<VisualAssetForApp> {
  const userId = await getCurrentUserId();

  const { data, error } = await supabase
    .from("visual_assets")
    .insert(visualAssetFormToPayload(form, userId))
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return rowToVisualAsset(data as VisualAssetRow);
}

export async function updateCloudVisualAsset(
  assetId: string,
  form: VisualAssetFormForCloud,
): Promise<VisualAssetForApp> {
  const userId = await getCurrentUserId();

  const { data, error } = await supabase
    .from("visual_assets")
    .update(visualAssetFormToPayload(form, userId))
    .eq("id", assetId)
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return rowToVisualAsset(data as VisualAssetRow);
}

export async function deleteCloudVisualAsset(assetId: string): Promise<void> {
  await getCurrentUserId();

  const { error } = await supabase.from("visual_assets").delete().eq("id", assetId);

  if (error) {
    throw new Error(error.message);
  }
}


export type ProductAssetFormForCloud = {
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

export type ProductAssetForApp = {
  id: string;
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

type ProductAssetRow = {
  id: string;
  title: string;
  product_type: string | null;
  price: string | null;
  status: string | null;
  description: string | null;
  promo_angle: string | null;
  launch_notes: string | null;
  product_image_url: string | null;
  product_image_path: string | null;
  zip_file_url: string | null;
  zip_file_path: string | null;
  zip_file_name: string | null;
  zip_file_size: string | null;
  google_drive_link: string | null;
  onedrive_link: string | null;
  dropbox_link: string | null;
  gumroad_link: string | null;
  website_link: string | null;
  created_at: string | null;
};

function rowToProductAsset(row: ProductAssetRow): ProductAssetForApp {
  return {
    id: row.id,
    title: row.title,
    product_type: row.product_type || "",
    price: row.price || "",
    status: row.status || "",
    description: row.description || "",
    promo_angle: row.promo_angle || "",
    launch_notes: row.launch_notes || "",
    product_image_data: row.product_image_url || row.product_image_path || "",
    zip_file_name: row.zip_file_name || "",
    zip_file_size: row.zip_file_size || "",
    google_drive_link: row.google_drive_link || "",
    onedrive_link: row.onedrive_link || "",
    dropbox_link: row.dropbox_link || "",
    gumroad_link: row.gumroad_link || "",
    website_link: row.website_link || "",
    created_at: row.created_at || "",
  };
}

function productAssetFormToPayload(form: ProductAssetFormForCloud, userId: string) {
  return {
    user_id: userId,
    title: form.title.trim(),
    product_type: form.product_type || null,
    price: form.price || null,
    status: form.status || null,
    description: form.description || null,
    promo_angle: form.promo_angle || null,
    launch_notes: form.launch_notes || null,
    product_image_url: form.product_image_data || null,
    product_image_path: form.product_image_data ? "inline-preview" : null,
    zip_file_name: form.zip_file_name || null,
    zip_file_size: form.zip_file_size || null,
    google_drive_link: form.google_drive_link || null,
    onedrive_link: form.onedrive_link || null,
    dropbox_link: form.dropbox_link || null,
    gumroad_link: form.gumroad_link || null,
    website_link: form.website_link || null,
  };
}

export async function listCloudProductAssets(): Promise<ProductAssetForApp[]> {
  await getCurrentUserId();

  const { data, error } = await supabase
    .from("product_assets")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return ((data || []) as ProductAssetRow[]).map(rowToProductAsset);
}

export async function createCloudProductAsset(
  form: ProductAssetFormForCloud,
): Promise<ProductAssetForApp> {
  const userId = await getCurrentUserId();

  const { data, error } = await supabase
    .from("product_assets")
    .insert(productAssetFormToPayload(form, userId))
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return rowToProductAsset(data as ProductAssetRow);
}

export async function updateCloudProductAsset(
  assetId: string,
  form: ProductAssetFormForCloud,
): Promise<ProductAssetForApp> {
  const userId = await getCurrentUserId();

  const { data, error } = await supabase
    .from("product_assets")
    .update(productAssetFormToPayload(form, userId))
    .eq("id", assetId)
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return rowToProductAsset(data as ProductAssetRow);
}

export async function updateCloudProductLaunchNotes(
  assetId: string,
  launchNotes: string,
): Promise<ProductAssetForApp> {
  await getCurrentUserId();

  const { data, error } = await supabase
    .from("product_assets")
    .update({ launch_notes: launchNotes })
    .eq("id", assetId)
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return rowToProductAsset(data as ProductAssetRow);
}

export async function deleteCloudProductAsset(assetId: string): Promise<void> {
  await getCurrentUserId();

  const { error } = await supabase.from("product_assets").delete().eq("id", assetId);

  if (error) {
    throw new Error(error.message);
  }
}


export type SongFormForCloud = {
  project_id?: string;
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

export type SongForApp = Omit<SongFormForCloud, "project_id"> & {
  id: string;
  lyric_idea_id?: string;
  created_at?: string;
};

type SongRow = {
  id: string;
  title: string;
  artist: string | null;
  featured_artist: string | null;
  producer: string | null;
  writers: string | null;
  bpm: string | null;
  song_key: string | null;
  genre: string | null;
  mood: string | null;
  status: string | null;
  notes: string | null;
  release_date: string | null;
  distributor: string | null;
  isrc: string | null;
  upc: string | null;
  label: string | null;
  copyright_year: string | null;
  copyright_owner: string | null;
  publishing_admin: string | null;
  pro: string | null;
  soundexchange_status: string | null;
  youtube_content_id: string | null;
  mechanical_royalties: string | null;
  split_sheet_status: string | null;
  sample_clearance: string | null;
  cover_art_url: string | null;
  lyric_idea_id: string | null;
  created_at: string | null;
};

function rowToSong(row: SongRow): SongForApp {
  return {
    id: row.id,
    title: row.title,
    artist: row.artist || "",
    featured_artist: row.featured_artist || "",
    producer: row.producer || "",
    writers: row.writers || "",
    bpm: row.bpm || "",
    song_key: row.song_key || "",
    genre: row.genre || "",
    mood: row.mood || "",
    status: row.status || "Idea",
    notes: row.notes || "",
    release_date: row.release_date || "",
    distributor: row.distributor || "",
    isrc: row.isrc || "",
    upc: row.upc || "",
    label: row.label || "",
    copyright_year: row.copyright_year || "",
    copyright_owner: row.copyright_owner || "",
    publishing_admin: row.publishing_admin || "",
    pro: row.pro || "",
    soundexchange_status: row.soundexchange_status || "",
    youtube_content_id: row.youtube_content_id || "",
    mechanical_royalties: row.mechanical_royalties || "",
    split_sheet_status: row.split_sheet_status || "",
    sample_clearance: row.sample_clearance || "",
    cover_art_data: row.cover_art_url || "",
    lyric_idea_id: row.lyric_idea_id || "",
    created_at: row.created_at || "",
  };
}

function songFormToPayload(form: SongFormForCloud, userId: string) {
  return {
    user_id: userId,
    title: form.title.trim(),
    artist: form.artist || null,
    featured_artist: form.featured_artist || null,
    producer: form.producer || null,
    writers: form.writers || null,
    bpm: form.bpm || null,
    song_key: form.song_key || null,
    genre: form.genre || null,
    mood: form.mood || null,
    status: form.status || "Idea",
    notes: form.notes || null,
    release_date: form.release_date || null,
    distributor: form.distributor || null,
    isrc: form.isrc || null,
    upc: form.upc || null,
    label: form.label || null,
    copyright_year: form.copyright_year || null,
    copyright_owner: form.copyright_owner || null,
    publishing_admin: form.publishing_admin || null,
    pro: form.pro || null,
    soundexchange_status: form.soundexchange_status || null,
    youtube_content_id: form.youtube_content_id || null,
    mechanical_royalties: form.mechanical_royalties || null,
    split_sheet_status: form.split_sheet_status || null,
    sample_clearance: form.sample_clearance || null,
    cover_art_url: form.cover_art_data || null,
  };
}

export async function listCloudSongs(): Promise<SongForApp[]> {
  await getCurrentUserId();

  const { data, error } = await supabase
    .from("songs")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);

  return ((data || []) as SongRow[]).map(rowToSong);
}

export async function createCloudSong(form: SongFormForCloud): Promise<SongForApp> {
  const userId = await getCurrentUserId();

  const { data, error } = await supabase
    .from("songs")
    .insert(songFormToPayload(form, userId))
    .select("*")
    .single();

  if (error) throw new Error(error.message);

  return rowToSong(data as SongRow);
}

export async function updateCloudSong(songId: string, form: SongFormForCloud): Promise<SongForApp> {
  const userId = await getCurrentUserId();

  const { data, error } = await supabase
    .from("songs")
    .update(songFormToPayload(form, userId))
    .eq("id", songId)
    .select("*")
    .single();

  if (error) throw new Error(error.message);

  return rowToSong(data as SongRow);
}

export async function updateCloudSongLyricIdea(songId: string, lyricIdeaId: string): Promise<SongForApp> {
  await getCurrentUserId();

  const { data, error } = await supabase
    .from("songs")
    .update({ lyric_idea_id: lyricIdeaId || null })
    .eq("id", songId)
    .select("*")
    .single();

  if (error) throw new Error(error.message);

  return rowToSong(data as SongRow);
}

export async function deleteCloudSong(songId: string): Promise<void> {
  await getCurrentUserId();

  const { error } = await supabase.from("songs").delete().eq("id", songId);

  if (error) throw new Error(error.message);
}


export type SongFileFormForCloud = {
  song_id: string;
  file_type: string;
  file_label: string;
  file_name: string;
  file_size: string;
  mime_type: string;
  storage_path: string;
  public_url: string;
  external_url: string;
  notes: string;
};

export type SongFileForApp = SongFileFormForCloud & {
  id: string;
  created_at?: string;
};

type SongFileRow = {
  id: string;
  song_id: string;
  file_type: string | null;
  file_label: string | null;
  file_name: string | null;
  file_size: string | null;
  mime_type: string | null;
  storage_path: string | null;
  public_url: string | null;
  external_url: string | null;
  notes: string | null;
  created_at: string | null;
};

function rowToSongFile(row: SongFileRow): SongFileForApp {
  return {
    id: row.id,
    song_id: row.song_id,
    file_type: row.file_type || "",
    file_label: row.file_label || "",
    file_name: row.file_name || "",
    file_size: row.file_size || "",
    mime_type: row.mime_type || "",
    storage_path: row.storage_path || "",
    public_url: row.public_url || "",
    external_url: row.external_url || "",
    notes: row.notes || "",
    created_at: row.created_at || "",
  };
}

function songFileFormToPayload(form: SongFileFormForCloud, userId: string) {
  return {
    user_id: userId,
    song_id: form.song_id,
    file_type: form.file_type || null,
    file_label: form.file_label || null,
    file_name: form.file_name || null,
    file_size: form.file_size || null,
    mime_type: form.mime_type || null,
    storage_path: form.storage_path || null,
    public_url: form.public_url || null,
    external_url: form.external_url || null,
    notes: form.notes || null,
  };
}

export async function listCloudSongFiles(songId: string): Promise<SongFileForApp[]> {
  await getCurrentUserId();

  const { data, error } = await supabase
    .from("song_files")
    .select("*")
    .eq("song_id", songId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);

  return ((data || []) as SongFileRow[]).map(rowToSongFile);
}

export async function createCloudSongFile(
  form: SongFileFormForCloud,
): Promise<SongFileForApp> {
  const userId = await getCurrentUserId();

  const { data, error } = await supabase
    .from("song_files")
    .insert(songFileFormToPayload(form, userId))
    .select("*")
    .single();

  if (error) throw new Error(error.message);

  return rowToSongFile(data as SongFileRow);
}

export async function deleteCloudSongFile(fileId: string): Promise<void> {
  await getCurrentUserId();

  const { error } = await supabase.from("song_files").delete().eq("id", fileId);

  if (error) throw new Error(error.message);
}

export async function uploadCloudSongFile(
  file: File,
  songId: string,
  fileType: string,
): Promise<{
  file_name: string;
  file_size: string;
  mime_type: string;
  storage_path: string;
  public_url: string;
}> {
  await getCurrentUserId();

  const safeFileName = file.name
    .replace(/[^a-zA-Z0-9._-]/g, "-")
    .toLowerCase();

  const safeFileType = fileType
    .replace(/[^a-zA-Z0-9._-]/g, "-")
    .toLowerCase();

  const storagePath = `${songId}/${safeFileType}/${Date.now()}-${safeFileName}`;

  const { error: uploadError } = await supabase.storage
    .from("song-assets")
    .upload(storagePath, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type || "application/octet-stream",
    });

  if (uploadError) throw new Error(uploadError.message);

  const { data } = supabase.storage.from("song-assets").getPublicUrl(storagePath);

  return {
    file_name: file.name,
    file_size: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
    mime_type: file.type || "",
    storage_path: storagePath,
    public_url: data.publicUrl || "",
  };
}


export type ProjectFormForCloud = {
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

export type ProjectForApp = ProjectFormForCloud & {
  id: string;
  created_at?: string;
};

type ProjectRow = {
  id: string;
  title: string;
  project_type: string | null;
  artist: string | null;
  status: string | null;
  release_date: string | null;
  distributor?: string | null;
  upc: string | null;
  label: string | null;
  cover_art_url: string | null;
  notes: string | null;
  created_at: string | null;
};

function rowToProject(row: ProjectRow): ProjectForApp {
  return {
    id: row.id,
    title: row.title,
    project_type: row.project_type || "Album",
    artist: row.artist || "",
    status: row.status || "Idea",
    release_date: row.release_date || "",
    distributor: row.distributor || "",
    upc: row.upc || "",
    label: row.label || "",
    cover_art_data: row.cover_art_url || "",
    notes: row.notes || "",
    created_at: row.created_at || "",
  };
}

function projectFormToPayload(form: ProjectFormForCloud, userId: string) {
  return {
    user_id: userId,
    title: form.title.trim(),
    project_type: form.project_type || null,
    artist: form.artist || null,
    status: form.status || null,
    release_date: form.release_date || null,
    upc: form.upc || null,
    label: form.label || null,
    cover_art_url: form.cover_art_data || null,
    notes: form.notes || null,
  };
}

export async function listCloudProjects(): Promise<ProjectForApp[]> {
  await getCurrentUserId();

  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);

  return ((data || []) as ProjectRow[]).map(rowToProject);
}

export async function createCloudProject(form: ProjectFormForCloud): Promise<ProjectForApp> {
  const userId = await getCurrentUserId();

  const { data, error } = await supabase
    .from("projects")
    .insert(projectFormToPayload(form, userId))
    .select("*")
    .single();

  if (error) throw new Error(error.message);

  return rowToProject(data as ProjectRow);
}

export async function updateCloudProject(projectId: string, form: ProjectFormForCloud): Promise<ProjectForApp> {
  const userId = await getCurrentUserId();

  const { data, error } = await supabase
    .from("projects")
    .update(projectFormToPayload(form, userId))
    .eq("id", projectId)
    .select("*")
    .single();

  if (error) throw new Error(error.message);

  return rowToProject(data as ProjectRow);
}

export async function deleteCloudProject(projectId: string): Promise<void> {
  await getCurrentUserId();

  const { error } = await supabase.from("projects").delete().eq("id", projectId);

  if (error) throw new Error(error.message);
}

export type ProjectSongForApp = {
  id: string;
  project_id: string;
  song_id: string;
  created_at?: string;
};

type ProjectSongRow = {
  id: string;
  project_id: string;
  song_id: string;
  created_at: string | null;
};

function rowToProjectSong(row: ProjectSongRow): ProjectSongForApp {
  return {
    id: row.id,
    project_id: row.project_id,
    song_id: row.song_id,
    created_at: row.created_at || "",
  };
}

export async function listCloudProjectSongs(): Promise<ProjectSongForApp[]> {
  await getCurrentUserId();

  const { data, error } = await supabase
    .from("project_songs")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);

  return ((data || []) as ProjectSongRow[]).map(rowToProjectSong);
}

export async function addCloudSongToProject(projectId: string, songId: string): Promise<ProjectSongForApp> {
  const userId = await getCurrentUserId();

  const { data, error } = await supabase
    .from("project_songs")
    .upsert(
      {
        user_id: userId,
        project_id: projectId,
        song_id: songId,
      },
      { onConflict: "project_id,song_id" },
    )
    .select("*")
    .single();

  if (error) throw new Error(error.message);

  return rowToProjectSong(data as ProjectSongRow);
}

export async function removeCloudSongFromProject(projectId: string, songId: string): Promise<void> {
  await getCurrentUserId();

  const { error } = await supabase
    .from("project_songs")
    .delete()
    .eq("project_id", projectId)
    .eq("song_id", songId);

  if (error) throw new Error(error.message);
}

export type ReleaseRoadmapFormForCloud = {
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

export type ReleaseRoadmapForApp = {
  id: string;
  song_id?: string;
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

type ReleaseRoadmapRow = {
  id: string;
  song_id: string | null;
  project_id: string | null;
  title: string;
  release_date: string | null;
  release_type: string | null;
  campaign_goal: string | null;
  budget_level: string | null;
  platform_focus: string | null;
  rollout_plan: string | null;
  checklist_notes: string | null;
  created_at: string | null;
};

function rowToReleaseRoadmap(row: ReleaseRoadmapRow): ReleaseRoadmapForApp {
  return {
    id: row.id,
    song_id: row.song_id || "",
    title: row.title,
    release_date: row.release_date || "",
    release_type: row.release_type || "",
    campaign_goal: row.campaign_goal || "",
    budget_level: row.budget_level || "",
    platform_focus: row.platform_focus || "",
    rollout_plan: row.rollout_plan || "",
    checklist_notes: row.checklist_notes || "",
    created_at: row.created_at || "",
  };
}

function releaseRoadmapFormToPayload(form: ReleaseRoadmapFormForCloud, userId: string) {
  return {
    user_id: userId,
    song_id: form.song_id || null,
    title: form.title.trim(),
    release_date: form.release_date || null,
    release_type: form.release_type || null,
    campaign_goal: form.campaign_goal || null,
    budget_level: form.budget_level || null,
    platform_focus: form.platform_focus || null,
    rollout_plan: form.rollout_plan || null,
    checklist_notes: form.checklist_notes || null,
  };
}

export async function listCloudReleaseRoadmaps(): Promise<ReleaseRoadmapForApp[]> {
  await getCurrentUserId();

  const { data, error } = await supabase
    .from("release_roadmaps")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);

  return ((data || []) as ReleaseRoadmapRow[]).map(rowToReleaseRoadmap);
}

export async function createCloudReleaseRoadmap(
  form: ReleaseRoadmapFormForCloud,
): Promise<ReleaseRoadmapForApp> {
  const userId = await getCurrentUserId();

  const { data, error } = await supabase
    .from("release_roadmaps")
    .insert(releaseRoadmapFormToPayload(form, userId))
    .select("*")
    .single();

  if (error) throw new Error(error.message);

  return rowToReleaseRoadmap(data as ReleaseRoadmapRow);
}

export async function updateCloudReleaseRoadmap(
  roadmapId: string,
  form: ReleaseRoadmapFormForCloud,
): Promise<ReleaseRoadmapForApp> {
  const userId = await getCurrentUserId();

  const { data, error } = await supabase
    .from("release_roadmaps")
    .update(releaseRoadmapFormToPayload(form, userId))
    .eq("id", roadmapId)
    .select("*")
    .single();

  if (error) throw new Error(error.message);

  return rowToReleaseRoadmap(data as ReleaseRoadmapRow);
}

export async function updateCloudReleaseRoadmapRolloutPlan(
  roadmapId: string,
  rolloutPlan: string,
): Promise<ReleaseRoadmapForApp> {
  await getCurrentUserId();

  const { data, error } = await supabase
    .from("release_roadmaps")
    .update({ rollout_plan: rolloutPlan })
    .eq("id", roadmapId)
    .select("*")
    .single();

  if (error) throw new Error(error.message);

  return rowToReleaseRoadmap(data as ReleaseRoadmapRow);
}

export async function deleteCloudReleaseRoadmap(roadmapId: string): Promise<void> {
  await getCurrentUserId();

  const { error } = await supabase
    .from("release_roadmaps")
    .delete()
    .eq("id", roadmapId);

  if (error) throw new Error(error.message);
}
