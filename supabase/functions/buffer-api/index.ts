const BUFFER_API_URL = "https://graph.buffer.com";

const token = import.meta.env.VITE_BUFFER_ACCESS_TOKEN;

export async function bufferGraphQL<T>(
  query: string,
  variables?: Record<string, unknown>,
): Promise<T> {
  if (!token) {
    throw new Error("Missing VITE_BUFFER_ACCESS_TOKEN in your .env file.");
  }

  const response = await fetch(BUFFER_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      query,
      variables,
    }),
  });

  const json = await response.json();

  if (!response.ok || json.errors) {
    throw new Error(json.errors?.[0]?.message || "Buffer API request failed.");
  }

  return json.data;
}

export async function getBufferAccount() {
  return bufferGraphQL<{
    account: {
      id: string;
      email: string;
      name?: string;
      timezone?: string;
      organizations?: Array<{
        id: string;
        name: string;
      }>;
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
