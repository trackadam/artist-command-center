const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type AIRequest = {
  action: string;
  payload: Record<string, unknown>;
};

function textValue(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function buildPrompt(action: string, payload: Record<string, unknown>): string {
  if (action === "marketing") {
    return `
You are the Marketing Assistant inside Track Adam OS, a private artist command center for a producer/artist.

Create strong marketing copy based on this information:

Song Title: ${textValue(payload.song_title)}
Artist: ${textValue(payload.artist)}
Genre: ${textValue(payload.genre)}
Mood: ${textValue(payload.mood)}
Platform: ${textValue(payload.platform)}
Content Type: ${textValue(payload.content_type)}
Tone: ${textValue(payload.tone)}
Notes: ${textValue(payload.notes)}

Rules:
- Make the copy useful for a real independent artist/producer.
- Keep it clean and ready to paste.
- If the platform is social media, include 3 to 5 caption options.
- If the content type is hashtags, include focused hashtags only.
- If the content type is ad copy, include short direct-response variations.
- If information is missing, still create something useful.
- Do not mention that you are an AI.
`;
  }

  if (action === "lyrics") {
    return `
You are the Lyrics Assistant inside Track Adam OS, a private artist command center for a producer/artist.

Help with the lyric idea below.

Title: ${textValue(payload.title)}
Mood: ${textValue(payload.mood)}
Concept: ${textValue(payload.concept)}
Current Lyrics:
${textValue(payload.lyrics)}

Notes:
${textValue(payload.notes)}

Requested Help Type: ${textValue(payload.help_type)}

Extra Direction:
${textValue(payload.direction)}

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
`;
  }

  if (action === "visual_prompt") {
    return `
You are the Visual Studio assistant inside Track Adam OS, a private artist command center for a producer/artist.

Create strong visual direction and an image-generation-ready prompt based on this information:

Song Title: ${textValue(payload.song_title)}
Artist: ${textValue(payload.artist)}
Genre: ${textValue(payload.genre)}
Mood: ${textValue(payload.mood)}
Asset Type: ${textValue(payload.asset_type)}
Visual Style: ${textValue(payload.visual_style)}
Notes: ${textValue(payload.notes)}

Rules:
- Write like a creative director for music branding and rollout visuals.
- The output should be useful for cover art, promo art, thumbnails, or visual campaign direction.
- Start with a short concept summary.
- Then provide a polished final image prompt that is ready to use in an image generator.
- Include strong details about mood, lighting, composition, background, styling, textures, and atmosphere.
- If information is missing, still create something useful.
- Do not mention that you are an AI.
`;
  }

  if (action === "product") {
    return `
You are the Product Vault assistant inside Track Adam OS, a private artist command center for a producer/artist.

Create product copy or a product strategy based on this information:

Product Title: ${textValue(payload.title)}
Product Type: ${textValue(payload.product_type)}
Price: ${textValue(payload.price)}
Status: ${textValue(payload.status)}
Description: ${textValue(payload.description)}
Promo Angle: ${textValue(payload.promo_angle)}
Launch Notes: ${textValue(payload.launch_notes)}
Gumroad Link: ${textValue(payload.gumroad_link)}
Website Link: ${textValue(payload.website_link)}
Requested Help Type: ${textValue(payload.help_type)}
Platform: ${textValue(payload.platform)}
Tone: ${textValue(payload.tone)}
Extra Direction: ${textValue(payload.notes)}

Rules:
- Make the output useful for selling real music products, drum kits, loops, templates, or digital assets.
- If writing sales copy, make it clean, clear, and ready to paste.
- If writing a launch plan, give practical steps an independent producer can execute.
- If writing captions, give multiple options.
- If information is missing, still create something useful.
- Do not mention that you are an AI.
`;
  }

  if (action === "calendar") {
    return `
You are the Daily Mission Planner inside Track Adam OS, a private artist command center for a producer/artist.

Create a focused daily mission plan using the information below.

Focus Type: ${textValue(payload.focus_type)}
Time Available: ${textValue(payload.time_available)}
Energy Level: ${textValue(payload.energy_level)}
Platform: ${textValue(payload.platform)}
Notes: ${textValue(payload.notes)}

Songs Summary:
${textValue(payload.songs_summary)}

Products Summary:
${textValue(payload.products_summary)}

Release Roadmaps Summary:
${textValue(payload.release_roadmaps_summary)}

Existing Tasks Summary:
${textValue(payload.existing_tasks_summary)}

Rules:
- Create a realistic mission for today.
- Start with the top 3 priorities.
- Include a simple schedule based on the available time.
- Include quick wins.
- Include what to avoid so the user does not get overwhelmed.
- Keep the plan practical for an independent artist/producer.
- Do not mention that you are an AI.
`;
  }

  if (action === "roadmap") {
    return `
You are the Release Roadmap assistant inside Track Adam OS, a private artist command center for a producer/artist.

Help plan or improve this release roadmap.

Roadmap Title: ${textValue(payload.title)}
Song Title: ${textValue(payload.song_title)}
Artist: ${textValue(payload.artist)}
Release Date: ${textValue(payload.release_date)}
Release Type: ${textValue(payload.release_type)}
Campaign Goal: ${textValue(payload.campaign_goal)}
Budget Level: ${textValue(payload.budget_level)}
Platform Focus: ${textValue(payload.platform_focus)}
Current Rollout Plan:
${textValue(payload.rollout_plan)}

Checklist Notes:
${textValue(payload.checklist_notes)}

Requested Help Type: ${textValue(payload.help_type)}
Timeline: ${textValue(payload.timeline)}
Tone: ${textValue(payload.tone)}
Extra Direction: ${textValue(payload.notes)}

Rules:
- Build a useful rollout plan for an independent artist/producer.
- Include practical actions before, during, and after release.
- Make it organized and ready to paste into a roadmap.
- If asked for a checklist, make it clear and action-based.
- If asked for platform strategy, focus on realistic execution.
- Do not mention that you are an AI.
`;
  }

  if (action === "epk") {
    return `
You are the EPK Builder assistant inside Track Adam OS, a private artist command center for a producer/artist.

Create EPK copy based on this profile:

Artist Name: ${textValue(payload.artist_name)}
Producer Name: ${textValue(payload.producer_name)}
Location: ${textValue(payload.location)}
Genre: ${textValue(payload.genre)}
Sound Description: ${textValue(payload.sound_description)}
Short Story: ${textValue(payload.short_story)}
Influences: ${textValue(payload.influences)}
Highlights: ${textValue(payload.highlights)}
Credits: ${textValue(payload.credits)}
Contact Email: ${textValue(payload.contact_email)}
Website: ${textValue(payload.website)}
Social Links: ${textValue(payload.social_links)}
Booking Link: ${textValue(payload.booking_link)}
Linked Song: ${textValue(payload.linked_song_title)}
Linked Project: ${textValue(payload.linked_project_title)}
Requested Help Type: ${textValue(payload.help_type)}
Audience: ${textValue(payload.audience)}
Tone: ${textValue(payload.tone)}
Extra Direction: ${textValue(payload.notes)}

Rules:
- Write polished EPK copy that an artist/producer could send to press, venues, curators, DJs, or partners.
- Keep it professional but not generic.
- If writing a bio, make it sound credible and useful.
- If writing a DJ one sheet, organize it clearly with the information a DJ would need.
- If writing a pitch, make it ready to send.
- Do not mention that you are an AI.
`;
  }

  return `
You are Track Adam OS, a private creative command center for a producer/artist.

Help with this request:
${JSON.stringify(payload, null, 2)}

Rules:
- Be useful, direct, and ready to paste.
- Do not mention that you are an AI.
`;
}

function extractOutputText(data: Record<string, unknown>): string {
  if (typeof data.output_text === "string") {
    return data.output_text;
  }

  const output = data.output;

  if (Array.isArray(output)) {
    for (const outputItem of output) {
      if (
        typeof outputItem === "object" &&
        outputItem !== null &&
        "content" in outputItem
      ) {
        const content = (outputItem as { content?: unknown }).content;

        if (Array.isArray(content)) {
          for (const contentItem of content) {
            if (
              typeof contentItem === "object" &&
              contentItem !== null &&
              "text" in contentItem
            ) {
              const text = (contentItem as { text?: unknown }).text;

              if (typeof text === "string") {
                return text;
              }
            }
          }
        }
      }
    }
  }

  return "";
}

function base64ToUint8Array(base64: string): Uint8Array {
  const cleaned = base64.replace(/^data:.*;base64,/, "");
  const binary = atob(cleaned);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

async function generateVisualImage(
  openAIKey: string,
  payload: Record<string, unknown>,
): Promise<{ image_base64: string }> {
  const prompt = textValue(payload.prompt);
  const size = textValue(payload.size) || "1024x1024";
  const referenceImageData = textValue(payload.reference_image_data);

  if (!prompt) {
    throw new Error("Missing prompt for visual image generation.");
  }

  if (referenceImageData) {
    const formData = new FormData();
    formData.append("model", "gpt-image-1");
    formData.append("prompt", prompt);
    formData.append("size", size);
    formData.append(
      "image",
      new Blob([base64ToUint8Array(referenceImageData)], { type: "image/png" }),
      "reference.png",
    );

    const response = await fetch("https://api.openai.com/v1/images/edits", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openAIKey}`,
      },
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(JSON.stringify(data));
    }

    const imageBase64 = data?.data?.[0]?.b64_json;
    if (typeof imageBase64 !== "string" || !imageBase64) {
      throw new Error("OpenAI did not return an edited image.");
    }

    return { image_base64: imageBase64 };
  }

  const response = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${openAIKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-image-1",
      prompt,
      size,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(JSON.stringify(data));
  }

  const imageBase64 = data?.data?.[0]?.b64_json;
  if (typeof imageBase64 !== "string" || !imageBase64) {
    throw new Error("OpenAI did not return a generated image.");
  }

  return { image_base64: imageBase64 };
}

function normalizeUrl(rawUrl: string): string {
  const trimmed = rawUrl.trim();
  if (!trimmed) return "";
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }
  return `https://${trimmed}`;
}

function absolutizeUrl(value: string, baseUrl: string): string {
  if (!value) return "";
  try {
    return new URL(value, baseUrl).toString();
  } catch {
    return value;
  }
}

function decodeHtmlEntities(value: string): string {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function findMetaContent(html: string, keys: string[]): string {
  for (const key of keys) {
    const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    const propertyFirst = new RegExp(
      `<meta[^>]+(?:property|name|itemprop)=["']${escapedKey}["'][^>]+content=["']([^"']+)["'][^>]*>`,
      "i",
    );
    const contentFirst = new RegExp(
      `<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name|itemprop)=["']${escapedKey}["'][^>]*>`,
      "i",
    );

    const propertyMatch = html.match(propertyFirst);
    if (propertyMatch?.[1]) return decodeHtmlEntities(propertyMatch[1].trim());

    const contentMatch = html.match(contentFirst);
    if (contentMatch?.[1]) return decodeHtmlEntities(contentMatch[1].trim());
  }

  return "";
}

function findTitle(html: string): string {
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  return titleMatch?.[1] ? decodeHtmlEntities(titleMatch[1].trim()) : "";
}

function findLinkHref(html: string, relValues: string[]): string {
  for (const relValue of relValues) {
    const relMatch = html.match(
      new RegExp(`<link[^>]+rel=["'][^"']*${relValue}[^"']*["'][^>]+href=["']([^"']+)["'][^>]*>`, "i"),
    );
    if (relMatch?.[1]) return decodeHtmlEntities(relMatch[1].trim());

    const hrefFirstMatch = html.match(
      new RegExp(`<link[^>]+href=["']([^"']+)["'][^>]+rel=["'][^"']*${relValue}[^"']*["'][^>]*>`, "i"),
    );
    if (hrefFirstMatch?.[1]) return decodeHtmlEntities(hrefFirstMatch[1].trim());
  }

  return "";
}

async function fetchLinkPreview(payload: Record<string, unknown>) {
  const requestedUrl = normalizeUrl(textValue(payload.url));

  if (!requestedUrl) {
    throw new Error("Missing URL for link preview.");
  }

  const response = await fetch(requestedUrl, {
    method: "GET",
    headers: {
      "User-Agent":
        "Mozilla/5.0 (compatible; TrackAdamOS/1.0; +https://trackadam.local)",
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    },
    redirect: "follow",
  });

  if (!response.ok) {
    throw new Error(`Could not fetch link preview. HTTP ${response.status}`);
  }

  const finalUrl = response.url || requestedUrl;
  const html = await response.text();

  const title =
    findMetaContent(html, ["og:title", "twitter:title"]) || findTitle(html);
  const description = findMetaContent(html, [
    "og:description",
    "twitter:description",
    "description",
  ]);
  const siteName = findMetaContent(html, ["og:site_name", "application-name"]);
  const image = absolutizeUrl(
    findMetaContent(html, [
      "og:image:secure_url",
      "og:image:url",
      "og:image",
      "twitter:image:src",
      "twitter:image",
      "image",
    ]) || findLinkHref(html, ["image_src"]),
    finalUrl,
  );
  const favicon = absolutizeUrl(
    findLinkHref(html, ["apple-touch-icon", "shortcut icon", "icon"]) ||
      "/favicon.ico",
    finalUrl,
  );

  return {
    title,
    description,
    image_url: image,
    image,
    site_name: siteName,
    favicon_url: favicon,
    favicon,
    final_url: finalUrl,
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const openAIKey = Deno.env.get("OPENAI_API_KEY");

    if (!openAIKey) {
      return new Response(
        JSON.stringify({
          error: "OPENAI_API_KEY is not set in Supabase Edge Function secrets.",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const body = (await req.json()) as AIRequest;

    if (!body.action) {
      return new Response(JSON.stringify({ error: "Missing action." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (body.action === "link_preview") {
      const result = await fetchLinkPreview(body.payload || {});
      return new Response(JSON.stringify(result), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (body.action === "visual_image") {
      const result = await generateVisualImage(openAIKey, body.payload || {});
      return new Response(JSON.stringify(result), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const prompt = buildPrompt(body.action, body.payload || {});

    const openAIResponse = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openAIKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-5.5",
        input: prompt,
      }),
    });

    const data = await openAIResponse.json();

    if (!openAIResponse.ok) {
      return new Response(JSON.stringify({ error: data }), {
        status: openAIResponse.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const text = extractOutputText(data);

    return new Response(JSON.stringify({ text }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
