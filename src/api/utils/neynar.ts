// Neynar API utilities
export interface CastData {
  text: string;
  parent_hash?: string;
  parent?: string;
  parent_url?: string;
  replyTo?: string; // Deprecated: use parent_hash instead
  embeds?: Array<{
    url?: string;
    cast_id?: {
      hash: string;
      fid: number;
    };
  }>;
  channel_id?: string;
}

export async function publishCast(castData: CastData): Promise<any> {
  const NEYNAR_API_KEY = process.env.NEYNAR_API_KEY;
  const NEYNAR_FEYBOT_SIGNER_UUID = process.env.NEYNAR_FEYBOT_SIGNER_UUID;

  if (!NEYNAR_API_KEY || !NEYNAR_FEYBOT_SIGNER_UUID) {
    throw new Error("Missing Neynar credentials");
  }

  console.log("[Neynar] Publishing cast:", castData);

  // Build the request body, using parent if parent_hash or parent is provided
  const requestBody: any = {
    signer_uuid: NEYNAR_FEYBOT_SIGNER_UUID,
    text: castData.text,
  };

  // If parent is explicitly provided, use it (highest priority)
  if (castData.parent) {
    requestBody.parent = castData.parent;
  }
  // Otherwise, if parent_hash is provided, use it as parent for the Neynar API (parent parameter specifies which cast to reply to)
  else if (castData.parent_hash) {
    requestBody.parent = castData.parent_hash;
  }
  // For backward compatibility, check replyTo
  else if (castData.replyTo) {
    requestBody.parent = castData.replyTo;
  }

  // Add other optional fields
  if (castData.parent_url) {
    requestBody.parent_url = castData.parent_url;
  }
  if (castData.embeds) {
    requestBody.embeds = castData.embeds;
  }
  if (castData.channel_id) {
    requestBody.channel_id = castData.channel_id;
  }

  const response = await fetch("https://api.neynar.com/v2/farcaster/cast", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      api_key: NEYNAR_API_KEY,
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorData = await response.text();
    console.error(
      "[Neynar] Failed to publish cast:",
      response.status,
      errorData
    );
    throw new Error(`Failed to publish cast: ${response.status} ${errorData}`);
  }

  const result = await response.json();
  console.log("[Neynar] Cast published successfully:", result);
  return result;
}

export function extractCastHash(webhookData: any): string {
  // When a bot is tagged on a cast, the hash of that cast should be in webhookData.data.hash
  // This is the cast we want to reply to
  return webhookData?.data?.hash || "";
}

export function extractCastText(webhookData: any): string {
  return webhookData?.data?.text || "";
}

export function extractAuthorInfo(webhookData: any) {
  const author = webhookData?.data?.author;
  return {
    fid: author?.fid,
    username: author?.username,
    displayName: author?.display_name,
    pfpUrl: author?.pfp_url,
  };
}

export function extractCastMedia(webhookData: any): {
  isValid: boolean;
  mediaUrl?: string;
  error?: string;
} {
  const embeds = webhookData?.data?.embeds || [];

  // Filter for image/media embeds (not cast embeds)
  const mediaEmbeds = embeds.filter(
    (embed: any) =>
      embed.url &&
      !embed.cast_id &&
      (embed.url.match(/\.(jpg|jpeg|png|gif|webp|mp4|mov|avi)$/i) ||
        embed.metadata?.content_type?.startsWith("image/") ||
        embed.metadata?.content_type?.startsWith("video/"))
  );

  if (mediaEmbeds.length === 0) {
    return { isValid: false, error: "No media attached to cast" };
  }

  if (mediaEmbeds.length > 1) {
    return {
      isValid: false,
      error: "Multiple media files attached - only one is allowed for TGC",
    };
  }

  return {
    isValid: true,
    mediaUrl: mediaEmbeds[0].url,
  };
}

export function extractAllCastData(webhookData: any) {
  return {
    hash: extractCastHash(webhookData),
    text: extractCastText(webhookData),
    author: extractAuthorInfo(webhookData),
    media: extractCastMedia(webhookData),
    timestamp: webhookData?.data?.timestamp,
    embeds: webhookData?.data?.embeds || [],
  };
}
