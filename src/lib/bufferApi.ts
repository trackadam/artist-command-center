import { supabase } from "../supabaseClient";

export type BufferOrganization = {
  id: string;
  name: string;
};

export type BufferChannel = {
  id: string;
  name: string;
  service?: string;
  type?: string;
  avatar?: string;
  displayName?: string;
  descriptor?: string;
  isDisconnected?: boolean;
  isLocked?: boolean;
  isQueuePaused?: boolean;
};

export type BufferMediaKind = "image" | "video";
export type BufferInstagramPostType = "post" | "reel" | "story";
export type BufferFacebookPostType = "post" | "reel" | "story";
export type BufferPostMode = "draft" | "queue" | "schedule" | "publish";

export type BufferPostStatus = "draft" | "scheduled" | "sent" | "error";

export type BufferPost = {
  id: string;
  text?: string;
  status?: string;
  dueAt?: string | null;
  channelId?: string;
  assets?: Array<{
    id?: string;
    mimeType?: string;
    source?: string;
  }>;
};

export type BufferPostActionResult = {
  __typename?: string;
  post?: BufferPost;
  message?: string;
};

export type BufferPostsPage = {
  posts: {
    edges: Array<{
      node: BufferPost;
    }>;
    pageInfo?: {
      hasNextPage?: boolean;
      endCursor?: string | null;
    };
  };
};

export async function bufferGraphQL<T>(
  query: string,
  variables?: Record<string, unknown>,
): Promise<T> {
  const { data, error } = await supabase.functions.invoke("buffer-api", {
    body: {
      query,
      variables,
    },
  });

  if (error) {
    throw new Error(error.message || "Buffer API function failed.");
  }

  if (!data) {
    throw new Error("No response came back from the Buffer API function.");
  }

  const response = data as {
    data?: T;
    errors?: Array<{ message?: string }>;
    error?: string;
  };

  if (response.error) {
    throw new Error(`${response.error} ${JSON.stringify(response)}`);
  }

  if (response.errors?.length) {
    throw new Error(response.errors[0]?.message || "Buffer API returned an error.");
  }

  if (!response.data) {
    throw new Error("Buffer API returned no data.");
  }

  return response.data;
}

export async function getBufferAccount() {
  return bufferGraphQL<{
    account: {
      id: string;
      email: string;
      name?: string;
      timezone?: string;
      organizations?: BufferOrganization[];
    };
  }>(`
    query Account {
      account {
        id
        email
        name
        timezone
        organizations {
          id
          name
        }
      }
    }
  `);
}

export async function getBufferChannels(organizationId: string) {
  return bufferGraphQL<{
    channels: BufferChannel[];
  }>(
    `
      query Channels($organizationId: OrganizationId!) {
        channels(input: { organizationId: $organizationId }) {
          id
          name
          service
          type
          avatar
          displayName
          descriptor
          isDisconnected
          isLocked
          isQueuePaused
        }
      }
    `,
    {
      organizationId,
    },
  );
}

export async function getBufferPosts(
  organizationId: string,
  channelIds: string[],
  statuses: BufferPostStatus[],
  after?: string | null,
) {
  return bufferGraphQL<BufferPostsPage>(
    `
      query Posts(
        $organizationId: OrganizationId!,
        $channelIds: [ChannelId!],
        $statuses: [PostStatus!],
        $after: String
      ) {
        posts(
          first: 50,
          after: $after,
          input: {
            organizationId: $organizationId,
            filter: {
              channelIds: $channelIds,
              status: $statuses
            }
          }
        ) {
          edges {
            node {
              id
              text
              status
              dueAt
              channelId
              assets {
                id
                mimeType
                source
              }
            }
          }
          pageInfo {
            hasNextPage
            endCursor
          }
        }
      }
    `,
    {
      organizationId,
      channelIds,
      statuses,
      after: after || null,
    },
  );
}

export async function createBufferPost(
  channelId: string,
  text: string,
  options: {
    mediaUrl?: string;
    mediaKind?: BufferMediaKind;
    instagramPostType?: BufferInstagramPostType;
    facebookPostType?: BufferFacebookPostType;
    youtubeTitle?: string;
    youtubeCategoryId?: string;
    youtubeCategoryTitle?: string;
    postMode?: BufferPostMode;
    scheduledAtIso?: string;
  },
) {
  const asset =
    options.mediaUrl && options.mediaKind === "video"
      ? { video: { url: options.mediaUrl } }
      : options.mediaUrl
        ? { image: { url: options.mediaUrl } }
        : undefined;

  const instagramMetadata = options.instagramPostType
    ? {
        instagram: {
          type: options.instagramPostType,
          shouldShareToFeed: options.instagramPostType !== "story",
        },
      }
    : {};

  const facebookMetadata = options.facebookPostType
    ? {
        facebook: {
          type: options.facebookPostType,
        },
      }
    : {};

  const youtubeMetadata = options.youtubeTitle
    ? {
        youtube: {
          title: options.youtubeTitle,
          categoryId: options.youtubeCategoryId || "10",
          privacy: "public",
          notifySubscribers: true,
          embeddable: true,
          madeForKids: false,
        },
      }
    : {};

  const metadata = {
    ...instagramMetadata,
    ...facebookMetadata,
    ...youtubeMetadata,
  };

  const hasMetadata = Object.keys(metadata).length > 0;

  const selectedMode = options.postMode || "draft";
  const saveToDraft = selectedMode === "draft";

  const shareMode =
    selectedMode === "publish"
      ? "shareNow"
      : selectedMode === "schedule"
        ? "customScheduled"
        : "addToQueue";

  const dueAt =
    selectedMode === "schedule" && options.scheduledAtIso
      ? options.scheduledAtIso
      : undefined;

  return bufferGraphQL<{
    createPost: BufferPostActionResult;
  }>(
    `
      mutation CreatePost($input: CreatePostInput!) {
        createPost(input: $input) {
          ... on PostActionSuccess {
            __typename
            post {
              id
              text
              status
              dueAt
            }
          }
          ... on MutationError {
            __typename
            message
          }
        }
      }
    `,
    {
      input: {
        channelId,
        text,
        schedulingType: "automatic",
        mode: shareMode,
        saveToDraft,
        source: "track-adam-os",
        ...(asset ? { assets: [asset] } : {}),
        ...(dueAt ? { dueAt } : {}),
        ...(hasMetadata ? { metadata } : {}),
      },
    },
  );
}


export async function editBufferPost(
  postId: string,
  options: {
    text?: string;
    scheduledAtIso?: string;
    mediaUrl?: string;
    mediaKind?: BufferMediaKind;
    instagramPostType?: BufferInstagramPostType;
    facebookPostType?: BufferFacebookPostType;
    youtubeTitle?: string;
    youtubeCategoryId?: string;
    youtubeCategoryTitle?: string;
  },
) {
  const asset =
    options.mediaUrl && options.mediaKind === "video"
      ? { video: { url: options.mediaUrl } }
      : options.mediaUrl
        ? { image: { url: options.mediaUrl } }
        : undefined;

  const instagramMetadata = options.instagramPostType
    ? {
        instagram: {
          type: options.instagramPostType,
          shouldShareToFeed: options.instagramPostType !== "story",
        },
      }
    : {};

  const facebookMetadata = options.facebookPostType
    ? {
        facebook: {
          type: options.facebookPostType,
        },
      }
    : {};

  const youtubeMetadata = options.youtubeTitle
    ? {
        youtube: {
          title: options.youtubeTitle,
          categoryId: options.youtubeCategoryId || "10",
          privacy: "public",
          notifySubscribers: true,
          embeddable: true,
          madeForKids: false,
        },
      }
    : {};

  const metadata = {
    ...instagramMetadata,
    ...facebookMetadata,
    ...youtubeMetadata,
  };

  const hasMetadata = Object.keys(metadata).length > 0;

  return bufferGraphQL<{
    editPost: BufferPostActionResult;
  }>(
    `
      mutation EditPost($input: EditPostInput!) {
        editPost(input: $input) {
          ... on PostActionSuccess {
            __typename
            post {
              id
              text
              status
              dueAt
            }
          }
          ... on MutationError {
            __typename
            message
          }
        }
      }
    `,
    {
      input: {
        id: postId,
        schedulingType: "automatic",
        mode: options.scheduledAtIso ? "customScheduled" : "addToQueue",
        ...(options.text !== undefined ? { text: options.text } : {}),
        ...(options.scheduledAtIso ? { dueAt: options.scheduledAtIso } : {}),
        ...(asset ? { assets: [asset] } : {}),
        ...(hasMetadata ? { metadata } : {}),
      },
    },
  );
}

export async function deleteBufferPost(postId: string) {
  return bufferGraphQL<{
    deletePost: {
      __typename?: string;
      id?: string;
      message?: string;
    };
  }>(
    `
      mutation DeletePost($input: DeletePostInput!) {
        deletePost(input: $input) {
          ... on DeletePostSuccess {
            __typename
            id
          }
          ... on VoidMutationError {
            __typename
            message
          }
        }
      }
    `,
    {
      input: {
        id: postId,
      },
    },
  );
}

export const createBufferDraftPost = createBufferPost;
