// TGC Intent Analysis and Parameter Extraction
export interface TGCParameters {
  creator: string;
  communityWhitelistRoot: string;
  communityContributionCap: string;
  teamContributionCap: string;
  caps: {
    minCommunityDeposit: string;
    maxCommunityDeposit: string;
  };
  launchpad: {
    id: string;
    config: string;
  };
  token: {
    salt: string;
    name: string;
    symbol: string;
    image: string;
    tickIfToken0IsCeremonyToken: number;
    tickSpacing: number;
    tickLower: number;
    tickUpper: number;
  };
  teamAllocations: Array<{
    contributor: string;
    recipient: string;
    contributionAmount: string;
  }>;
}

export function detectTGCIntent(castText: string): boolean {
  const tgcKeywords = [
    'token generation ceremony',
    'tgc',
    'launch token',
    'create token',
    'deploy token',
    'token launch',
    'ceremony',
    'launch ceremony',
    'feybot launch',
    'start tgc'
  ];
  
  const lowercaseText = castText.toLowerCase();
  return tgcKeywords.some(keyword => lowercaseText.includes(keyword));
}

export function extractTokenName(castText: string): string {
  // Look for patterns like "token called X", "name: X", "token: X"
  const namePatterns = [
    /token called ([a-zA-Z0-9\s]+)/i,
    /name:\s*([a-zA-Z0-9\s]+)/i,
    /token:\s*([a-zA-Z0-9\s]+)/i,
    /"([a-zA-Z0-9\s]+)" token/i,
    /launch ([a-zA-Z0-9\s]+) token/i
  ];
  
  for (const pattern of namePatterns) {
    const match = castText.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }
  
  return "Community Token"; // Default name
}

export function extractTokenSymbol(tokenName: string): string {
  // Generate symbol from token name
  const words = tokenName.split(' ');
  if (words.length === 1) {
    return words[0].slice(0, 5).toUpperCase();
  } else {
    return words.map(word => word[0]).join('').slice(0, 5).toUpperCase();
  }
}

export function generateTGCParameters(
  castText: string,
  authorFid: number,
  authorAddress?: string
): TGCParameters {
  const tokenName = extractTokenName(castText);
  const tokenSymbol = extractTokenSymbol(tokenName);
  
  // Default parameters - these would be customizable in a full implementation
  return {
    creator: authorAddress || "0x1234567890123456789012345678901234567890",
    communityWhitelistRoot: "0x0000000000000000000000000000000000000000000000000000000000000000", // Open to all
    communityContributionCap: "10000000000000000000", // 10 ETH
    teamContributionCap: "5000000000000000000", // 5 ETH
    caps: {
      minCommunityDeposit: "100000000000000000", // 0.1 ETH
      maxCommunityDeposit: "1000000000000000000" // 1 ETH
    },
    launchpad: {
      id: "0x46455900000000000000000000000000000000000000000000000000000000",
      config: "0x..."
    },
    token: {
      salt: `0x${authorFid.toString(16).padStart(64, '0')}`, // Use FID as salt
      name: tokenName,
      symbol: tokenSymbol,
      image: `https://feybot.orbiter.website/token-image/${tokenSymbol.toLowerCase()}.png`,
      tickIfToken0IsCeremonyToken: -887220,
      tickSpacing: 200,
      tickLower: -887200,
      tickUpper: 887200
    },
    teamAllocations: [
      {
        contributor: authorAddress || "0xAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA1",
        recipient: authorAddress || "0xBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB1",
        contributionAmount: "2500000000000000000"
      }
    ]
  };
}

export function generateTGCTransactionData(params: TGCParameters): string {
  // This would generate the actual transaction data for the Fey protocol
  // For now, return a placeholder
  return JSON.stringify(params, null, 2);
}