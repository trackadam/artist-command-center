use serde::Deserialize;
use serde_json::json;

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[derive(Debug, Deserialize)]
struct MarketingCopyRequest {
    song_title: String,
    artist: String,
    genre: String,
    mood: String,
    platform: String,
    content_type: String,
    tone: String,
    notes: String,
}

#[derive(Debug, Deserialize)]
struct LyricsHelpRequest {
    title: String,
    mood: String,
    concept: String,
    lyrics: String,
    notes: String,
    help_type: String,
    direction: String,
}

#[derive(Debug, Deserialize)]
struct VisualPromptRequest {
    song_title: String,
    artist: String,
    genre: String,
    mood: String,
    asset_type: String,
    visual_style: String,
    notes: String,
}

#[derive(Debug, Deserialize)]
struct VisualImageRequest {
    prompt: String,
    size: String,
    reference_image_data: String,
}

#[derive(Debug, Deserialize)]
struct ProductCopyRequest {
    title: String,
    product_type: String,
    price: String,
    status: String,
    description: String,
    promo_angle: String,
    launch_notes: String,
    gumroad_link: String,
    website_link: String,
    help_type: String,
    platform: String,
    tone: String,
    notes: String,
}

#[derive(Debug, Deserialize)]
struct CalendarMissionRequest {
    focus_type: String,
    time_available: String,
    energy_level: String,
    platform: String,
    notes: String,
    songs_summary: String,
    products_summary: String,
    release_roadmaps_summary: String,
    existing_tasks_summary: String,
}

#[derive(Debug, Deserialize)]
struct ReleaseRoadmapPlanRequest {
    title: String,
    song_title: String,
    artist: String,
    release_date: String,
    release_type: String,
    campaign_goal: String,
    budget_level: String,
    platform_focus: String,
    rollout_plan: String,
    checklist_notes: String,
    help_type: String,
    timeline: String,
    tone: String,
    notes: String,
}

#[derive(Debug, Deserialize)]
struct LinkPreviewRequest {
    url: String,
}

#[derive(Debug, serde::Serialize)]
struct LinkPreviewResponse {
    title: String,
    description: String,
    image_url: String,
    image: String,
    site_name: String,
    favicon_url: String,
    favicon: String,
    final_url: String,
}

#[derive(Debug, Deserialize)]
struct EpkCopyRequest {
    artist_name: String,
    producer_name: String,
    location: String,
    genre: String,
    sound_description: String,
    short_story: String,
    influences: String,
    highlights: String,
    credits: String,
    contact_email: String,
    website: String,
    social_links: String,
    booking_link: String,
    linked_song_title: String,
    linked_project_title: String,
    help_type: String,
    audience: String,
    tone: String,
    notes: String,
}

async fn call_openai(prompt: String) -> Result<String, String> {
    let api_key = std::env::var("OPENAI_API_KEY")
        .map_err(|_| "OPENAI_API_KEY is not set. Add it in PowerShell first.".to_string())?;

    let client = reqwest::Client::new();

    let body = json!({
        "model": "gpt-5.5",
        "input": prompt
    });

    let response = client
        .post("https://api.openai.com/v1/responses")
        .bearer_auth(api_key)
        .json(&body)
        .send()
        .await
        .map_err(|error| format!("OpenAI request failed: {}", error))?;

    let status = response.status();

    let value: serde_json::Value = response
        .json()
        .await
        .map_err(|error| format!("Failed to read OpenAI response: {}", error))?;

    if !status.is_success() {
        return Err(format!("OpenAI returned an error: {}", value));
    }

    if let Some(output_text) = value.get("output_text").and_then(|v| v.as_str()) {
        return Ok(output_text.to_string());
    }

    if let Some(output_array) = value.get("output").and_then(|v| v.as_array()) {
        for output_item in output_array {
            if let Some(content_array) = output_item.get("content").and_then(|v| v.as_array()) {
                for content_item in content_array {
                    if let Some(text) = content_item.get("text").and_then(|v| v.as_str()) {
                        return Ok(text.to_string());
                    }
                }
            }
        }
    }

    Err(format!(
        "OpenAI responded, but I could not find text in the response: {}",
        value
    ))
}

#[tauri::command]
async fn generate_marketing_copy(request: MarketingCopyRequest) -> Result<String, String> {
    let prompt = format!(
        r#"
You are the marketing assistant inside Track Adam OS, a private artist command center for a producer/artist.

Create strong marketing copy based on this information:

Song Title: {song_title}
Artist: {artist}
Genre: {genre}
Mood: {mood}
Platform: {platform}
Content Type: {content_type}
Tone: {tone}
Notes: {notes}

Rules:
- Make the copy useful for a real independent artist/producer.
- Keep it clean and ready to paste.
- If the platform is social media, include 3 to 5 caption options.
- If the content type is hashtags, include focused hashtags only.
- If the content type is ad copy, include short direct-response variations.
- If information is missing, still create something useful.
- Do not mention that you are an AI.
"#,
        song_title = request.song_title,
        artist = request.artist,
        genre = request.genre,
        mood = request.mood,
        platform = request.platform,
        content_type = request.content_type,
        tone = request.tone,
        notes = request.notes,
    );

    call_openai(prompt).await
}

#[tauri::command]
async fn generate_lyrics_help(request: LyricsHelpRequest) -> Result<String, String> {
    let prompt = format!(
        r#"
You are the Lyrics Assistant inside Track Adam OS, a private artist command center for a producer/artist.

Help with the lyric idea below.

Title: {title}
Mood: {mood}
Concept: {concept}
Current Lyrics:
{lyrics}

Notes:
{notes}

Requested Help Type: {help_type}

Extra Direction:
{direction}

Rules:
- Help like a serious songwriter, producer, and creative collaborator.
- Keep the output useful, direct, and ready to paste into a writing session.
- If the user asks for hooks, give several strong hook options.
- If the user asks for verses, write in a clean song format.
- If the user asks for feedback, give clear notes and practical improvements.
- If the user asks for rewrites, preserve the main idea but improve the wording.
- If the user asks for titles, give a list of strong song title ideas.
- If the user asks for rhyme ideas, organize them clearly.
- Do not mention that you are an AI.
- Avoid copying famous lyrics or imitating a living artist too closely.
"#,
        title = request.title,
        mood = request.mood,
        concept = request.concept,
        lyrics = request.lyrics,
        notes = request.notes,
        help_type = request.help_type,
        direction = request.direction,
    );

    call_openai(prompt).await
}

#[tauri::command]
async fn generate_visual_prompt(request: VisualPromptRequest) -> Result<String, String> {
    let prompt = format!(
        r#"
You are the Visual Studio assistant inside Track Adam OS, a private artist command center for a producer/artist.

Create strong visual direction and an image-generation-ready prompt based on this information:

Song Title: {song_title}
Artist: {artist}
Genre: {genre}
Mood: {mood}
Asset Type: {asset_type}
Visual Style: {visual_style}
Notes: {notes}

Rules:
- Write like a creative director for music branding and rollout visuals.
- The output should be useful for cover art, promo art, thumbnails, or visual campaign direction.
- Start with a short concept summary.
- Then provide a polished final image prompt that is ready to use in an image generator.
- Include strong details about mood, lighting, composition, background, styling, textures, and atmosphere.
- If information is missing, still create something useful.
- Do not mention that you are an AI.
"#,
        song_title = request.song_title,
        artist = request.artist,
        genre = request.genre,
        mood = request.mood,
        asset_type = request.asset_type,
        visual_style = request.visual_style,
        notes = request.notes,
    );

    call_openai(prompt).await
}

fn find_image_base64(value: &serde_json::Value) -> Option<String> {
    if let Some(image_base64) = value.get("b64_json").and_then(|v| v.as_str()) {
        return Some(image_base64.to_string());
    }

    if let Some(image_base64) = value.get("result").and_then(|v| v.as_str()) {
        return Some(image_base64.to_string());
    }

    if let Some(object) = value.as_object() {
        for child_value in object.values() {
            if let Some(found) = find_image_base64(child_value) {
                return Some(found);
            }
        }
    }

    if let Some(array) = value.as_array() {
        for child_value in array {
            if let Some(found) = find_image_base64(child_value) {
                return Some(found);
            }
        }
    }

    None
}

#[tauri::command]
async fn generate_visual_image(request: VisualImageRequest) -> Result<String, String> {
    let api_key = std::env::var("OPENAI_API_KEY")
        .map_err(|_| "OPENAI_API_KEY is not set. Add it in PowerShell first.".to_string())?;

    let client = reqwest::Client::new();

    let image_size = if request.size.trim().is_empty() {
        "1024x1024".to_string()
    } else {
        request.size
    };

    let has_reference_image = !request.reference_image_data.trim().is_empty();

    let response = if has_reference_image {
        let reference_guided_prompt = format!(
            "Use the uploaded reference image as visual guidance. Keep the final result original, but borrow useful details like composition, mood, color palette, pose, lighting, or layout when appropriate. Requested output size: {}. Prompt: {}",
            image_size,
            request.prompt
        );

        let body = json!({
            "model": "gpt-5.5",
            "input": [
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "input_text",
                            "text": reference_guided_prompt
                        },
                        {
                            "type": "input_image",
                            "image_url": request.reference_image_data
                        }
                    ]
                }
            ],
            "tools": [
                {
                    "type": "image_generation"
                }
            ]
        });

        client
            .post("https://api.openai.com/v1/responses")
            .bearer_auth(api_key)
            .json(&body)
            .send()
            .await
            .map_err(|error| format!("OpenAI reference image request failed: {}", error))?
    } else {
        let body = json!({
            "model": "gpt-image-1",
            "prompt": request.prompt,
            "size": image_size,
            "n": 1
        });

        client
            .post("https://api.openai.com/v1/images/generations")
            .bearer_auth(api_key)
            .json(&body)
            .send()
            .await
            .map_err(|error| format!("OpenAI image request failed: {}", error))?
    };

    let status = response.status();

    let value: serde_json::Value = response
        .json()
        .await
        .map_err(|error| format!("Failed to read OpenAI image response: {}", error))?;

    if !status.is_success() {
        return Err(format!("OpenAI returned an image error: {}", value));
    }

    if let Some(image_base64) = find_image_base64(&value) {
        return Ok(image_base64);
    }

    Err(format!(
        "OpenAI responded, but no image data was found: {}",
        value
    ))
}

#[tauri::command]
async fn generate_product_copy(request: ProductCopyRequest) -> Result<String, String> {
    let prompt = format!(
        r#"
You are the Product Vault assistant inside Track Adam OS, a private artist command center for a producer/artist selling digital music products.

Create useful product copy based on this product record:

Product Title: {title}
Product Type: {product_type}
Price: {price}
Status: {status}
Current Description: {description}
Promo Angle: {promo_angle}
Launch Notes: {launch_notes}
Gumroad Link: {gumroad_link}
Website Link: {website_link}
Requested Help Type: {help_type}
Platform: {platform}
Tone: {tone}
Extra Direction: {notes}

Rules:
- Write for real producers, artists, beat makers, and creators.
- Keep it ready to paste into the requested platform.
- If creating a Gumroad description, include a strong headline, short intro, what's included, who it is for, why it helps, and a clear call to action.
- If creating captions, include multiple caption options and a few focused hashtags.
- If creating ad copy, include short direct-response variations.
- If creating a launch plan, give clear action steps.
- If creating product name ideas, give a clean list with short positioning notes.
- Do not overpromise results.
- Do not mention that you are an AI.
- If information is missing, still create something useful and professional.
"#,
        title = request.title,
        product_type = request.product_type,
        price = request.price,
        status = request.status,
        description = request.description,
        promo_angle = request.promo_angle,
        launch_notes = request.launch_notes,
        gumroad_link = request.gumroad_link,
        website_link = request.website_link,
        help_type = request.help_type,
        platform = request.platform,
        tone = request.tone,
        notes = request.notes,
    );

    call_openai(prompt).await
}

#[tauri::command]
async fn generate_calendar_mission(request: CalendarMissionRequest) -> Result<String, String> {
    let prompt = format!(
        r#"
You are the Daily Mission Planner inside Track Adam OS, a private artist command center for a producer/artist.

Build a realistic daily execution plan using the user's saved app data.

User Choices:
Focus Type: {focus_type}
Time Available: {time_available}
Energy Level: {energy_level}
Platform Focus: {platform}
Extra Direction: {notes}

Saved Songs:
{songs_summary}

Saved Products:
{products_summary}

Release Roadmaps:
{release_roadmaps_summary}

Existing Calendar Tasks:
{existing_tasks_summary}

Rules:
- Create a practical mission for one day, not a fantasy plan.
- Match the plan to the available time and energy level.
- Use the saved songs, products, roadmaps, and tasks where helpful.
- Start with a short mission statement.
- Give the top 3 priorities.
- Give a time-blocked schedule.
- Give a checklist of specific tasks.
- Include one quick win that can be done in 10 to 15 minutes.
- Include what to avoid today so the user does not get overwhelmed.
- Keep the tone disciplined, direct, and motivating.
- Do not mention that you are an AI.
"#,
        focus_type = request.focus_type,
        time_available = request.time_available,
        energy_level = request.energy_level,
        platform = request.platform,
        notes = request.notes,
        songs_summary = request.songs_summary,
        products_summary = request.products_summary,
        release_roadmaps_summary = request.release_roadmaps_summary,
        existing_tasks_summary = request.existing_tasks_summary,
    );

    call_openai(prompt).await
}

#[tauri::command]
async fn generate_release_roadmap_plan(request: ReleaseRoadmapPlanRequest) -> Result<String, String> {
    let prompt = format!(
        r#"
You are the Release Roadmap Assistant inside Track Adam OS, a private artist command center for a producer/artist.

Build a practical release rollout plan based on this roadmap record.

Roadmap Title: {title}
Linked Song: {song_title}
Artist: {artist}
Release Date: {release_date}
Release Type: {release_type}
Campaign Goal: {campaign_goal}
Budget Level: {budget_level}
Platform Focus: {platform_focus}
Current Rollout Plan: {rollout_plan}
Current Checklist Notes: {checklist_notes}
Requested Help Type: {help_type}
Timeline: {timeline}
Tone: {tone}
Extra Direction: {notes}

Rules:
- Build a realistic rollout for an independent artist/producer.
- Keep the plan useful, focused, and ready to execute.
- If the request is a rollout plan, organize it by phases or days.
- If the request is a checklist, make it practical and action-based.
- If the request is a content calendar, include specific post/content ideas by platform.
- If the request is a pre-release plan, focus on setup, assets, scheduling, and awareness.
- If the request is post-release promo, focus on follow-up content, proof, engagement, and sales/streams.
- Include concrete tasks, not vague advice.
- Do not overpromise results.
- Do not mention that you are an AI.
"#,
        title = request.title,
        song_title = request.song_title,
        artist = request.artist,
        release_date = request.release_date,
        release_type = request.release_type,
        campaign_goal = request.campaign_goal,
        budget_level = request.budget_level,
        platform_focus = request.platform_focus,
        rollout_plan = request.rollout_plan,
        checklist_notes = request.checklist_notes,
        help_type = request.help_type,
        timeline = request.timeline,
        tone = request.tone,
        notes = request.notes,
    );

    call_openai(prompt).await
}

#[tauri::command]
async fn generate_epk_copy(request: EpkCopyRequest) -> Result<String, String> {
    let prompt = format!(
        r#"
You are the EPK Builder assistant inside Track Adam OS, a private artist command center for a producer/artist.

Create professional press kit copy from this profile.

Artist / Producer Name: {artist_name}
Producer Name / Alias: {producer_name}
Location: {location}
Genre / Lane: {genre}
Sound Description: {sound_description}
Short Story: {short_story}
Influences: {influences}
Career Highlights: {highlights}
Credits / Collaborations: {credits}
Contact Email: {contact_email}
Website: {website}
Social Links: {social_links}
Booking Link: {booking_link}
Linked Song: {linked_song_title}
Linked Project: {linked_project_title}
Requested Help Type: {help_type}
Audience: {audience}
Tone: {tone}
Extra Direction: {notes}

Rules:
- Write like an experienced music manager preparing press-ready materials.
- Keep the copy polished, useful, and ready to paste into an EPK, pitch email, one-sheet, or press release.
- If creating a short bio, keep it concise and professional.
- If creating a long bio, give more context, story, sound, and proof.
- If creating a DJ one sheet, include artist, release/project, genre, mood, selling points, contact, and useful DJ/curator notes.
- If creating a venue or curator pitch, keep it direct, respectful, and easy to send.
- If information is missing, still create a strong draft without making up fake achievements.
- Do not mention that you are an AI.
"#,
        artist_name = request.artist_name,
        producer_name = request.producer_name,
        location = request.location,
        genre = request.genre,
        sound_description = request.sound_description,
        short_story = request.short_story,
        influences = request.influences,
        highlights = request.highlights,
        credits = request.credits,
        contact_email = request.contact_email,
        website = request.website,
        social_links = request.social_links,
        booking_link = request.booking_link,
        linked_song_title = request.linked_song_title,
        linked_project_title = request.linked_project_title,
        help_type = request.help_type,
        audience = request.audience,
        tone = request.tone,
        notes = request.notes,
    );

    call_openai(prompt).await
}



fn normalize_url_for_preview(raw_url: &str) -> String {
    let trimmed = raw_url.trim();

    if trimmed.starts_with("http://") || trimmed.starts_with("https://") {
        trimmed.to_string()
    } else {
        format!("https://{}", trimmed)
    }
}

fn get_origin(url: &str) -> String {
    if let Some(protocol_end) = url.find("://") {
        let start = protocol_end + 3;
        if let Some(path_start) = url[start..].find('/') {
            return url[..start + path_start].to_string();
        }
    }

    url.trim_end_matches('/').to_string()
}

fn resolve_url(base_url: &str, value: &str) -> String {
    let trimmed = value.trim();

    if trimmed.is_empty() {
        return String::new();
    }

    if trimmed.starts_with("http://")
        || trimmed.starts_with("https://")
        || trimmed.starts_with("data:")
    {
        return trimmed.to_string();
    }

    if trimmed.starts_with("//") {
        if base_url.starts_with("https://") {
            return format!("https:{}", trimmed);
        }
        return format!("http:{}", trimmed);
    }

    let origin = get_origin(base_url);

    if trimmed.starts_with('/') {
        return format!("{}{}", origin, trimmed);
    }

    // Resolve simple relative paths against the current page directory.
    let mut base_path = base_url.to_string();
    if let Some(query_start) = base_path.find('?') {
        base_path = base_path[..query_start].to_string();
    }
    if let Some(hash_start) = base_path.find('#') {
        base_path = base_path[..hash_start].to_string();
    }

    let base_directory = if base_path.ends_with('/') {
        base_path
    } else if let Some(last_slash) = base_path.rfind('/') {
        base_path[..last_slash + 1].to_string()
    } else {
        format!("{}/", origin)
    };

    let combined = format!("{}{}", base_directory, trimmed);
    normalize_relative_segments(&combined)
}

fn normalize_relative_segments(url: &str) -> String {
    if !url.contains("/./") && !url.contains("/../") {
        return url.to_string();
    }

    let protocol_split = if let Some(position) = url.find("://") {
        position + 3
    } else {
        0
    };

    let prefix = &url[..protocol_split];
    let rest = &url[protocol_split..];
    let mut parts = rest.split('/');
    let host = parts.next().unwrap_or_default();
    let mut stack: Vec<&str> = Vec::new();

    for part in parts {
        if part.is_empty() || part == "." {
            continue;
        }
        if part == ".." {
            stack.pop();
        } else {
            stack.push(part);
        }
    }

    if stack.is_empty() {
        format!("{}{}", prefix, host)
    } else {
        format!("{}{}/{}", prefix, host, stack.join("/"))
    }
}

fn decode_html_entities(value: &str) -> String {
    value
        .replace("&amp;", "&")
        .replace("&quot;", "\"")
        .replace("&#39;", "'")
        .replace("&lt;", "<")
        .replace("&gt;", ">")
        .trim()
        .to_string()
}

fn find_attr(tag: &str, attr: &str) -> Option<String> {
    let lower_tag = tag.to_lowercase();
    let lower_attr = attr.to_lowercase();

    for quote in ['\"', '\''] {
        let pattern = format!("{}={}", lower_attr, quote);
        if let Some(start) = lower_tag.find(&pattern) {
            let value_start = start + pattern.len();
            if let Some(end) = tag[value_start..].find(quote) {
                return Some(decode_html_entities(&tag[value_start..value_start + end]));
            }
        }
    }

    None
}

fn find_meta_content(html: &str, key_attr: &str, key_value: &str) -> String {
    let lower_html = html.to_lowercase();
    let mut search_start = 0;

    while let Some(relative_start) = lower_html[search_start..].find("<meta") {
        let tag_start = search_start + relative_start;
        if let Some(relative_end) = lower_html[tag_start..].find('>') {
            let tag_end = tag_start + relative_end + 1;
            let tag = &html[tag_start..tag_end];
            let attr_value = find_attr(tag, key_attr).unwrap_or_default().to_lowercase();

            if attr_value == key_value.to_lowercase() {
                return find_attr(tag, "content").unwrap_or_default();
            }

            search_start = tag_end;
        } else {
            break;
        }
    }

    String::new()
}
fn find_first_meta_content(html: &str, candidates: &[(&str, &str)]) -> String {
    for (key_attr, key_value) in candidates {
        let value = find_meta_content(html, key_attr, key_value);
        if !value.trim().is_empty() {
            return value;
        }
    }

    String::new()
}

fn find_link_href_candidates(html: &str, rel_candidates: &[&str], base_url: &str) -> String {
    for rel in rel_candidates {
        let value = find_link_href(html, rel, base_url);
        if !value.trim().is_empty() {
            return value;
        }
    }

    String::new()
}


fn find_title_tag(html: &str) -> String {
    let lower_html = html.to_lowercase();

    if let Some(start) = lower_html.find("<title") {
        if let Some(open_end) = lower_html[start..].find('>') {
            let content_start = start + open_end + 1;
            if let Some(close_start) = lower_html[content_start..].find("</title>") {
                return decode_html_entities(&html[content_start..content_start + close_start]);
            }
        }
    }

    String::new()
}

fn find_link_href(html: &str, rel_contains: &str, base_url: &str) -> String {
    let lower_html = html.to_lowercase();
    let mut search_start = 0;

    while let Some(relative_start) = lower_html[search_start..].find("<link") {
        let tag_start = search_start + relative_start;
        if let Some(relative_end) = lower_html[tag_start..].find('>') {
            let tag_end = tag_start + relative_end + 1;
            let tag = &html[tag_start..tag_end];
            let rel_value = find_attr(tag, "rel").unwrap_or_default().to_lowercase();

            if rel_value.contains(&rel_contains.to_lowercase()) {
                let href = find_attr(tag, "href").unwrap_or_default();
                return resolve_url(base_url, &href);
            }

            search_start = tag_end;
        } else {
            break;
        }
    }

    String::new()
}

#[tauri::command]
async fn fetch_link_preview(request: LinkPreviewRequest) -> Result<LinkPreviewResponse, String> {
    let safe_url = normalize_url_for_preview(&request.url);
    let client = reqwest::Client::builder()
        .user_agent("TrackAdamOS/1.0 link-preview")
        .redirect(reqwest::redirect::Policy::limited(8))
        .build()
        .map_err(|error| format!("Could not build link preview client: {}", error))?;

    let response = client
        .get(&safe_url)
        .send()
        .await
        .map_err(|error| format!("Could not fetch link preview: {}", error))?;

    let final_url = response.url().to_string();
    let status = response.status();

    if !status.is_success() {
        return Err(format!("The website returned an error while fetching preview: {}", status));
    }

    let html = response
        .text()
        .await
        .map_err(|error| format!("Could not read link preview page: {}", error))?;

    let title = {
        let og_title = find_meta_content(&html, "property", "og:title");
        if !og_title.is_empty() {
            og_title
        } else {
            let twitter_title = find_meta_content(&html, "name", "twitter:title");
            if !twitter_title.is_empty() {
                twitter_title
            } else {
                find_title_tag(&html)
            }
        }
    };

    let description = {
        let og_description = find_meta_content(&html, "property", "og:description");
        if !og_description.is_empty() {
            og_description
        } else {
            let twitter_description = find_meta_content(&html, "name", "twitter:description");
            if !twitter_description.is_empty() {
                twitter_description
            } else {
                find_meta_content(&html, "name", "description")
            }
        }
    };

    let image_raw = find_first_meta_content(
        &html,
        &[
            ("property", "og:image"),
            ("property", "og:image:url"),
            ("property", "og:image:secure_url"),
            ("name", "twitter:image"),
            ("name", "twitter:image:src"),
            ("itemprop", "image"),
        ],
    );

    let site_name = {
        let og_site_name = find_meta_content(&html, "property", "og:site_name");
        if !og_site_name.is_empty() {
            og_site_name
        } else {
            find_meta_content(&html, "name", "application-name")
        }
    };

    let favicon = {
        let icon = find_link_href_candidates(
            &html,
            &["apple-touch-icon", "shortcut icon", "icon", "mask-icon"],
            &final_url,
        );
        if !icon.is_empty() {
            icon
        } else {
            format!("{}/favicon.ico", get_origin(&final_url))
        }
    };

    let resolved_image = resolve_url(&final_url, &image_raw);

    Ok(LinkPreviewResponse {
        title,
        description,
        image_url: resolved_image.clone(),
        image: resolved_image,
        site_name,
        favicon_url: favicon.clone(),
        favicon,
        final_url,
    })
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_sql::Builder::new().build())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            greet,
            generate_marketing_copy,
            generate_lyrics_help,
            generate_visual_prompt,
            generate_visual_image,
            generate_product_copy,
            generate_calendar_mission,
            generate_release_roadmap_plan,
            generate_epk_copy,
            fetch_link_preview
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
