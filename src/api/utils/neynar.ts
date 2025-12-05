// Neynar API utilities
export interface CastData {
  text: string;
  parent_hash?: string;
  parent_url?: string;
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
    throw new Error('Missing Neynar credentials');
  }

  console.log('[Neynar] Publishing cast:', castData);
  
  const response = await fetch('https://api.neynar.com/v2/farcaster/cast', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api_key': NEYNAR_API_KEY
    },
    body: JSON.stringify({
      signer_uuid: NEYNAR_FEYBOT_SIGNER_UUID,
      ...castData
    })
  });

  if (!response.ok) {
    const errorData = await response.text();
    console.error('[Neynar] Failed to publish cast:', response.status, errorData);
    throw new Error(`Failed to publish cast: ${response.status} ${errorData}`);
  }

  const result = await response.json();
  console.log('[Neynar] Cast published successfully:', result);
  return result;
}

export function extractCastHash(webhookData: any): string {
  return webhookData?.data?.hash || webhookData?.data?.parent_hash || '';
}

export function extractCastText(webhookData: any): string {
  return webhookData?.data?.text || '';
}

export function extractAuthorInfo(webhookData: any) {
  const author = webhookData?.data?.author;
  return {
    fid: author?.fid,
    username: author?.username,
    displayName: author?.display_name,
    pfpUrl: author?.pfp_url
  };
}

export function extractCastMedia(webhookData: any): { isValid: boolean; mediaUrl?: string; error?: string } {
  const embeds = webhookData?.data?.embeds || [];
  
  // Filter for image/media embeds (not cast embeds)
  const mediaEmbeds = embeds.filter((embed: any) => 
    embed.url && !embed.cast_id && (
      embed.url.match(/\.(jpg|jpeg|png|gif|webp|mp4|mov|avi)$/i) ||
      embed.metadata?.content_type?.startsWith('image/') ||
      embed.metadata?.content_type?.startsWith('video/')
    )
  );
  
  if (mediaEmbeds.length === 0) {
    return { isValid: false, error: 'No media attached to cast' };
  }
  
  if (mediaEmbeds.length > 1) {
    return { isValid: false, error: 'Multiple media files attached - only one is allowed for TGC' };
  }
  
  return { 
    isValid: true, 
    mediaUrl: mediaEmbeds[0].url 
  };
}

export function extractAllCastData(webhookData: any) {
  return {
    hash: extractCastHash(webhookData),
    text: extractCastText(webhookData),
    author: extractAuthorInfo(webhookData),
    media: extractCastMedia(webhookData),
    timestamp: webhookData?.data?.timestamp,
    embeds: webhookData?.data?.embeds || []
  };
}