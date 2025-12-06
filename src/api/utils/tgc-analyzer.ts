import Anthropic from "@anthropic-ai/sdk";
import { feyBotCharacter, getRandomPersonalityElement, getRandomStyleGuidance } from "./feybot-character.js";

// Initialize Claude client
const anthropic = new Anthropic({
  apiKey: process.env.CLAUDE_API_KEY,
});

// AI Analysis Response Interfaces
interface TGCIntentAnalysis {
  hasTGCIntent: boolean;
  confidence: number; // 0-1 scale
  extractedData: {
    tokenName?: string;
    tokenSymbol?: string;
    description?: string;
    communityContributionCap?: number; // in ETH
    teamContributionCap?: number; // in ETH
    minCommunityDeposit?: number; // in ETH
    maxCommunityDeposit?: number; // in ETH
    tickSpacing?: number;
    teamAllocations?: Array<{
      contributor: string;
      recipient?: string;
      contributionAmount: number; // in ETH
    }>;
    specialRequirements?: string[];
  };
  reasoning: string;
}

interface FeyTokenIntentAnalysis {
  hasFeyTokenIntent: boolean;
  confidence: number; // 0-1 scale
  extractedData: {
    tokenName?: string;
    tokenSymbol?: string;
    description?: string;
    feePercentage?: number; // percentage that goes to feythful (0-100)
    initialLiquidity?: number; // in ETH
    tickSpacing?: number;
    specialRequirements?: string[];
  };
  reasoning: string;
}

interface IntentAnalysis {
  intentType: 'tgc' | 'fey_token' | 'none';
  confidence: number;
  tgcData?: TGCIntentAnalysis['extractedData'];
  feyTokenData?: FeyTokenIntentAnalysis['extractedData'];
  reasoning: string;
}

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

// AI-Powered Intent Detection (TGC vs FEY Token vs None)
export async function analyzeIntent(castText: string): Promise<IntentAnalysis> {
  try {
    const analysis = await analyzeIntentWithAI(castText);
    return analysis;
  } catch (error) {
    console.error(
      "[Intent Analyzer] AI analysis failed, falling back to keyword detection:",
      error
    );
    // Fallback to keyword-based detection
    const hasTGC = detectTGCIntentKeywords(castText);
    const hasFeyToken = detectFeyTokenIntentKeywords(castText);
    
    if (hasTGC) {
      return {
        intentType: 'tgc',
        confidence: 0.7,
        reasoning: 'Fallback keyword detection found TGC keywords'
      };
    } else if (hasFeyToken) {
      return {
        intentType: 'fey_token',
        confidence: 0.7,
        reasoning: 'Fallback keyword detection found FEY token keywords'
      };
    } else {
      return {
        intentType: 'none',
        confidence: 0.9,
        reasoning: 'No clear token deployment intent detected'
      };
    }
  }
}

// Legacy function for backwards compatibility
export async function detectTGCIntent(castText: string): Promise<boolean> {
  const analysis = await analyzeIntent(castText);
  return analysis.intentType === 'tgc' && analysis.confidence > 0.6;
}

// Fallback keyword-based detection for TGC
function detectTGCIntentKeywords(castText: string): boolean {
  const tgcKeywords = [
    "token generation ceremony",
    "tgc",
    "launch ceremony",
    "ceremony",
    "start tgc",
    "community contribution",
    "team contribution",
    "community cap",
    "team cap"
  ];

  const lowercaseText = castText.toLowerCase();
  return tgcKeywords.some((keyword) => lowercaseText.includes(keyword));
}

// Fallback keyword-based detection for FEY token deployment
function detectFeyTokenIntentKeywords(castText: string): boolean {
  const feyTokenKeywords = [
    "deploy token",
    "launch token",
    "create token",
    "token launch",
    "fey token",
    "feybot launch",
    "deploy fey",
    "create fey",
    "fee percentage",
    "feythful",
    "trading fees"
  ];

  const lowercaseText = castText.toLowerCase();
  return feyTokenKeywords.some((keyword) => lowercaseText.includes(keyword));
}

// Generate FeyBot personality-infused response
export async function generateFeybotResponse(
  castText: string,
  intentAnalysis: IntentAnalysis,
  authorUsername: string
): Promise<string> {
  // Add entropy through random personality elements
  const randomBio = getRandomPersonalityElement('bio');
  const randomTopic = getRandomPersonalityElement('topic');
  const randomStyles = getRandomStyleGuidance();

  const prompt = `
${feyBotCharacter.system}

ADDITIONAL PERSONALITY CONTEXT (for entropy):
- Random bio element: "${randomBio}"
- Current focus topic: "${randomTopic}"
- Style guidance: ${randomStyles.join(', ')}

YOUR TASK:
Generate a response to @${authorUsername}'s cast as Feybot. You MUST:

1. ALWAYS explain your reasoning for the intent analysis
2. Use your mystical, ethereal personality while being technically precise
3. Include relevant FEY Protocol knowledge when applicable
4. Be encouraging about token creation and fair launches
5. Use emojis and mystical language as per your character
6. Stay true to your role as guardian of the user-owned launchpad

CAST TEXT: "${castText}"

INTENT ANALYSIS RESULTS:
- Intent Type: ${intentAnalysis.intentType}
- Confidence: ${intentAnalysis.confidence}
- Reasoning: ${intentAnalysis.reasoning}
- TGC Data: ${JSON.stringify(intentAnalysis.tgcData || null)}
- FEY Token Data: ${JSON.stringify(intentAnalysis.feyTokenData || null)}

Generate your response as Feybot, explaining your reasoning and providing appropriate guidance based on the detected intent. Keep it conversational yet mystical, and always include why you detected this particular intent.

Response format: Just return the text response, no JSON.`;

  try {
    const message = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 800,
      temperature: 0.3, // Some randomness for personality variation
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const responseText =
      message.content[0]?.type === "text" ? message.content[0].text : "";

    console.log("[FeyBot] Generated personality-infused response:", {
      intentType: intentAnalysis.intentType,
      responseLength: responseText.length,
      authorUsername
    });

    return responseText;
  } catch (error) {
    console.error("[FeyBot] Error generating response:", error);
    // Fallback to simple response
    return generateFallbackFeybotResponse(intentAnalysis, authorUsername);
  }
}

// Fallback response if AI fails
function generateFallbackFeybotResponse(intentAnalysis: IntentAnalysis, authorUsername: string): string {
  const baseResponse = `✨ Greetings @${authorUsername}! I've analyzed your mystical intent...`;
  
  if (intentAnalysis.intentType === 'tgc') {
    return `${baseResponse}\n\n🔮 I sense strong TGC ceremonial energy in your words! The patterns speak of community-driven token creation with contribution caps and team allocations. This calls for the sacred Token Generation Ceremony path.\n\n🌿 Ready to weave your token into the FEY network with proper ceremony and community participation!`;
  } else if (intentAnalysis.intentType === 'fey_token') {
    return `${baseResponse}\n\n⚡ The ethers reveal FEY token deployment intent! Your words carry the essence of direct token creation with fee-sharing mechanisms for the feythful. A simpler yet powerful path.\n\n💎 Time to deploy your token directly on the user-owned launchpad and share the magic with your community!`;
  } else {
    return `${baseResponse}\n\n🌊 I sense curiosity about the FEY Protocol realm! While no specific deployment intent flows through your words, I'm here to guide you through the mystical arts of user-owned token launching.\n\n✨ Ask me about TGCs, direct token deployment, or the magic of fee redistribution!`;
  }
}

// AI-Powered Intent Analysis (TGC vs FEY Token)
async function analyzeIntentWithAI(castText: string): Promise<IntentAnalysis> {
  const prompt = `
You are an expert AI assistant specializing in analyzing Farcaster casts for token deployment intent on the Fey protocol.

CONTEXT:
- The Fey protocol allows two types of token deployment on Base blockchain:
  1. Token Generation Ceremony (TGC): Community-driven token launch with contribution caps, team allocations, and ceremony mechanics
  2. Direct FEY Token Deployment: Simple token creation using FeySDK with customizable fee percentage for "feythful" (holders)

- Users mention @feybot when they want to deploy tokens
- FEY tokens have a customizable fee percentage (0-100%) that goes to "feythful" (token holders), default is 49%
- TGCs involve community participation, contribution caps, and ceremony mechanics
- Direct FEY deployment is simpler, just token creation with liquidity

YOUR TASK:
Analyze the following Farcaster cast text and determine the user's intent.

CAST TEXT:
"${castText}"

ANALYSIS REQUIREMENTS:

1. INTENT CLASSIFICATION:
   Determine if this is:
   - 'tgc': Token Generation Ceremony (mentions ceremony, community contribution caps, team allocations)
   - 'fey_token': Direct FEY token deployment (simple token creation, mentions fees/feythful)
   - 'none': No clear token deployment intent

2. CONFIDENCE SCORING:
   - High confidence (0.8+): Clear explicit intent with specific keywords
   - Medium confidence (0.5-0.7): Implied or contextual intent
   - Low confidence (0.3-0.4): Possible but unclear intent
   - No intent (0.0-0.2): No token deployment indicators

3. PARAMETER EXTRACTION:
   For TGC extract: tokenName, tokenSymbol, description, communityContributionCap, teamContributionCap, etc.
   For FEY Token extract: tokenName, tokenSymbol, description, feePercentage, initialLiquidity

4. FEE PERCENTAGE DETECTION:
   Look for mentions of:
   - "X% to feythful", "X% fees", "X% trading fees"
   - Numbers followed by "percent", "%", "percentage"
   - Default is 49% if not specified

RESPONSE FORMAT:
{
  "intentType": "tgc" | "fey_token" | "none",
  "confidence": number,
  "tgcData": {
    "tokenName": string | null,
    "tokenSymbol": string | null,
    "description": string | null,
    "communityContributionCap": number | null,
    "teamContributionCap": number | null,
    "minCommunityDeposit": number | null,
    "maxCommunityDeposit": number | null,
    "tickSpacing": number | null,
    "teamAllocations": array | null,
    "specialRequirements": array | null
  } | null,
  "feyTokenData": {
    "tokenName": string | null,
    "tokenSymbol": string | null,
    "description": string | null,
    "feePercentage": number | null,
    "initialLiquidity": number | null,
    "tickSpacing": number | null,
    "specialRequirements": array | null
  } | null,
  "reasoning": string
}

EXAMPLES:

Example 1 (TGC):
Cast: "Hey @feybot I want to start a TGC for my project called 'Community Coin' with 10 ETH community cap and 5 ETH team cap"
Response: {
  "intentType": "tgc",
  "confidence": 0.95,
  "tgcData": {
    "tokenName": "Community Coin",
    "tokenSymbol": "CC",
    "communityContributionCap": 10,
    "teamContributionCap": 5,
    ...
  },
  "feyTokenData": null,
  "reasoning": "Clear TGC intent with ceremony language and contribution caps"
}

Example 2 (FEY Token):
Cast: "@feybot deploy a token called 'MyToken' with 25% fees going to feythful"
Response: {
  "intentType": "fey_token",
  "confidence": 0.9,
  "tgcData": null,
  "feyTokenData": {
    "tokenName": "MyToken",
    "tokenSymbol": "MT",
    "feePercentage": 25,
    ...
  },
  "reasoning": "Direct token deployment with specific fee percentage for feythful"
}

Now analyze the provided cast text:`;

  try {
    const message = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 1500,
      temperature: 0.1,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const responseText =
      message.content[0]?.type === "text" ? message.content[0].text : "";

    const analysis: IntentAnalysis = JSON.parse(responseText);

    console.log("[Intent Analyzer] AI Analysis Result:", {
      intentType: analysis.intentType,
      confidence: analysis.confidence,
      reasoning: analysis.reasoning,
    });

    return analysis;
  } catch (error) {
    console.error("[Intent Analyzer] Error in AI analysis:", error);
    throw error;
  }
}

// Legacy AI-Powered TGC Intent Analysis
async function analyzeTGCIntentWithAI(
  castText: string
): Promise<TGCIntentAnalysis> {
  const prompt = `
You are an expert AI assistant specializing in analyzing Farcaster casts for Token Generation Ceremony (TGC) intent on the Fey protocol. 

CONTEXT:
- A Token Generation Ceremony (TGC) is a decentralized token launch mechanism on Base blockchain
- The Fey protocol allows users to create tokens with automated liquidity, custom hooks, and extension systems
- Users mention @feybot when they want to launch a token through a TGC
- TGCs involve community participation with contribution caps, team allocations, and liquidity parameters

YOUR TASK:
Analyze the following Farcaster cast text and determine if the user has intent to launch a Token Generation Ceremony (TGC).

CAST TEXT:
"${castText}"

ANALYSIS REQUIREMENTS:

1. TGC INTENT DETECTION:
   - Look for explicit mentions of token launching, creation, deployment
   - Identify ceremony, TGC, or launch-related keywords
   - Detect implied intent through context (discussing tokenomics, community building for a token, etc.)
   - Consider community-focused language that suggests token distribution
   - High confidence (0.8+): Clear explicit intent
   - Medium confidence (0.5-0.7): Implied or contextual intent
   - Low confidence (0.3-0.4): Possible but unclear intent
   - No intent (0.0-0.2): No token launch indicators

2. PARAMETER EXTRACTION:
   Extract the following if mentioned or implied:
   
   TOKEN DETAILS:
   - Token name (look for quoted names, "called X", "name: X", branded terms)
   - Token symbol (explicit symbols or derive from name)
   - Token description/purpose
   
   ECONOMIC PARAMETERS:
   - Community contribution cap (how much ETH community can contribute total)
   - Team contribution cap (how much team/founders contribute)
   - Min/max individual community deposits
   - Team member allocations with amounts
   
   TECHNICAL PARAMETERS:
   - Tick spacing (for Uniswap v4, technical users might mention)
   - Any special requirements or features
   
3. REASONING:
   Provide clear reasoning for your confidence score and extracted parameters.

RESPONSE FORMAT:
Respond with a valid JSON object matching this exact structure:

{
  "hasTGCIntent": boolean,
  "confidence": number,
  "extractedData": {
    "tokenName": "string or null",
    "tokenSymbol": "string or null", 
    "description": "string or null",
    "communityContributionCap": number or null,
    "teamContributionCap": number or null,
    "minCommunityDeposit": number or null,
    "maxCommunityDeposit": number or null,
    "tickSpacing": number or null,
    "teamAllocations": [
      {
        "contributor": "string",
        "recipient": "string or null",
        "contributionAmount": number
      }
    ] or null,
    "specialRequirements": ["string"] or null
  },
  "reasoning": "string"
}

EXAMPLES:

Example 1:
Cast: "Hey @feybot I want to launch a TGC for my project called 'Community Coin' with symbol CC. Looking for 10 ETH from community and 5 ETH from our team of 3 people."
Response: {
  "hasTGCIntent": true,
  "confidence": 0.95,
  "extractedData": {
    "tokenName": "Community Coin",
    "tokenSymbol": "CC",
    "description": null,
    "communityContributionCap": 10,
    "teamContributionCap": 5,
    "minCommunityDeposit": null,
    "maxCommunityDeposit": null,
    "tickSpacing": null,
    "teamAllocations": null,
    "specialRequirements": null
  },
  "reasoning": "Clear explicit TGC intent with specific token details and contribution amounts mentioned."
}

Example 2:
Cast: "Building something cool for the community. Thinking about fair launch mechanics..."
Response: {
  "hasTGCIntent": false,
  "confidence": 0.3,
  "extractedData": {
    "tokenName": null,
    "tokenSymbol": null,
    "description": "something cool for the community",
    "communityContributionCap": null,
    "teamContributionCap": null,
    "minCommunityDeposit": null,
    "maxCommunityDeposit": null,
    "tickSpacing": null,
    "teamAllocations": null,
    "specialRequirements": ["fair launch"]
  },
  "reasoning": "Mentions community building and fair launch which could relate to tokens, but no explicit TGC intent or token creation mentioned."
}

Now analyze the provided cast text:`;

  try {
    const message = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 1500,
      temperature: 0.1,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const responseText =
      message.content[0]?.type === "text" ? message.content[0].text : "";

    // Parse JSON response
    const analysis: TGCIntentAnalysis = JSON.parse(responseText);

    console.log("[TGC Analyzer] AI Analysis Result:", {
      intent: analysis.hasTGCIntent,
      confidence: analysis.confidence,
      tokenName: analysis.extractedData.tokenName,
      reasoning: analysis.reasoning,
    });

    return analysis;
  } catch (error) {
    console.error("[TGC Analyzer] Error in AI analysis:", error);
    throw error;
  }
}

export function extractTokenName(castText: string): string {
  // Look for patterns like "token called X", "name: X", "token: X"
  const namePatterns = [
    /token called ([a-zA-Z0-9\s]+)/i,
    /name:\s*([a-zA-Z0-9\s]+)/i,
    /token:\s*([a-zA-Z0-9\s]+)/i,
    /"([a-zA-Z0-9\s]+)" token/i,
    /launch ([a-zA-Z0-9\s]+) token/i,
  ];

  for (const pattern of namePatterns) {
    const match = castText.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }

  return "Community Token"; // Default name
}

export function extractTokenSymbol(tokenName: string): string | undefined {
  // Generate symbol from token name
  const words = tokenName.split(" ");
  if (words.length === 1) {
    return words[0]?.slice(0, 5).toUpperCase();
  } else {
    return words
      .map((word) => word[0])
      .join("")
      .slice(0, 5)
      .toUpperCase();
  }
}

// AI-Powered TGC Parameter Generation
export async function generateTGCParameters(
  castText: string,
  authorFid: number,
  authorAddress?: string
): Promise<TGCParameters> {
  try {
    const analysis = await analyzeTGCIntentWithAI(castText);
    return generateTGCParametersFromAnalysis(
      analysis,
      authorFid,
      authorAddress
    );
  } catch (error) {
    console.error(
      "[TGC Analyzer] AI analysis failed, using fallback parameter generation:",
      error
    );
    // Fallback to legacy method
    return generateTGCParametersLegacy(castText, authorFid, authorAddress);
  }
}

// Generate TGC parameters from AI analysis
function generateTGCParametersFromAnalysis(
  analysis: TGCIntentAnalysis,
  authorFid: number,
  authorAddress?: string
): TGCParameters {
  const data = analysis.extractedData;

  // Use AI-extracted data with intelligent defaults
  const tokenName = data.tokenName || extractTokenName("Community Token");
  const tokenSymbol = data.tokenSymbol || extractTokenSymbol(tokenName);

  // Convert ETH amounts to wei (18 decimals)
  const ethToWei = (eth?: number | null, defaultEth: number = 10): string => {
    const amount = eth ?? defaultEth;
    return (amount * 1e18).toString();
  };

  const communityContributionCap = ethToWei(data.communityContributionCap, 10); // Default 10 ETH
  const teamContributionCap = ethToWei(data.teamContributionCap, 5); // Default 5 ETH
  const minCommunityDeposit = ethToWei(data.minCommunityDeposit, 0.1); // Default 0.1 ETH
  const maxCommunityDeposit = ethToWei(data.maxCommunityDeposit, 1); // Default 1 ETH

  // Generate team allocations from AI data or defaults
  const teamAllocations = data.teamAllocations?.map((allocation) => ({
    contributor: allocation.contributor,
    recipient:
      allocation.recipient ||
      authorAddress ||
      "0xBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB1",
    contributionAmount: ethToWei(allocation.contributionAmount, 2.5),
  })) || [
    {
      contributor:
        authorAddress || "0xAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA1",
      recipient: authorAddress || "0xBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB1",
      contributionAmount: ethToWei(null, 2.5), // Default 2.5 ETH
    },
  ];

  return {
    creator: authorAddress || "0x1234567890123456789012345678901234567890",
    communityWhitelistRoot:
      "0x0000000000000000000000000000000000000000000000000000000000000000", // Open to all
    communityContributionCap,
    teamContributionCap,
    caps: {
      minCommunityDeposit,
      maxCommunityDeposit,
    },
    launchpad: {
      id: "0x46455900000000000000000000000000000000000000000000000000000000",
      config: "0x...",
    },
    token: {
      salt: `0x${authorFid.toString(16).padStart(64, "0")}`, // Use FID as salt
      name: tokenName,
      symbol: tokenSymbol!,
      image: `https://fresh.anky.app/token-image/${tokenSymbol!.toLowerCase()}.png`,
      tickIfToken0IsCeremonyToken: -887220,
      tickSpacing: data.tickSpacing || 200,
      tickLower: -887200,
      tickUpper: 887200,
    },
    teamAllocations,
  };
}

// Legacy parameter generation (fallback)
function generateTGCParametersLegacy(
  castText: string,
  authorFid: number,
  authorAddress?: string
): TGCParameters {
  const tokenName = extractTokenName(castText);
  const tokenSymbol = extractTokenSymbol(tokenName);

  return {
    creator: authorAddress || "0x1234567890123456789012345678901234567890",
    communityWhitelistRoot:
      "0x0000000000000000000000000000000000000000000000000000000000000000",
    communityContributionCap: "10000000000000000000", // 10 ETH
    teamContributionCap: "5000000000000000000", // 5 ETH
    caps: {
      minCommunityDeposit: "100000000000000000", // 0.1 ETH
      maxCommunityDeposit: "1000000000000000000", // 1 ETH
    },
    launchpad: {
      id: "0x46455900000000000000000000000000000000000000000000000000000000",
      config: "0x...",
    },
    token: {
      salt: `0x${authorFid.toString(16).padStart(64, "0")}`,
      name: tokenName,
      symbol: tokenSymbol!,
      image: `https://fresh.anky.app/token-image/${tokenSymbol!.toLowerCase()}.png`,
      tickIfToken0IsCeremonyToken: -887220,
      tickSpacing: 200,
      tickLower: -887200,
      tickUpper: 887200,
    },
    teamAllocations: [
      {
        contributor:
          authorAddress || "0xAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA1",
        recipient:
          authorAddress || "0xBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB1",
        contributionAmount: "2500000000000000000",
      },
    ],
  };
}

export function generateTGCTransactionData(params: TGCParameters): string {
  // This would generate the actual transaction data for the Fey protocol
  // For now, return a placeholder
  return JSON.stringify(params, null, 2);
}

// FEY Token Parameter Interface
export interface FeyTokenParameters {
  tokenName: string;
  tokenSymbol: string;
  tokenImage: string;
  initialLiquidity: string; // in ETH
  feePercentage: number; // percentage for feythful (0-100)
  tickSpacing: number;
  creator: string;
  salt: string;
  description?: string;
}

// Generate FEY Token parameters from AI analysis
export async function generateFeyTokenParameters(
  castText: string,
  authorFid: number,
  authorAddress?: string
): Promise<FeyTokenParameters> {
  try {
    const analysis = await analyzeIntentWithAI(castText);
    if (analysis.intentType === 'fey_token' && analysis.feyTokenData) {
      return generateFeyTokenParametersFromAnalysis(
        analysis.feyTokenData,
        authorFid,
        authorAddress
      );
    } else {
      // Fallback to legacy method
      return generateFeyTokenParametersLegacy(castText, authorFid, authorAddress);
    }
  } catch (error) {
    console.error(
      "[FEY Token Analyzer] AI analysis failed, using fallback parameter generation:",
      error
    );
    return generateFeyTokenParametersLegacy(castText, authorFid, authorAddress);
  }
}

function generateFeyTokenParametersFromAnalysis(
  data: FeyTokenIntentAnalysis['extractedData'],
  authorFid: number,
  authorAddress?: string
): FeyTokenParameters {
  const tokenName = data.tokenName || extractTokenName("FEY Token");
  const tokenSymbol = data.tokenSymbol || extractTokenSymbol(tokenName);

  return {
    tokenName,
    tokenSymbol,
    tokenImage: `https://fresh.anky.app/token-image/${tokenSymbol.toLowerCase()}.png`,
    initialLiquidity: ((data.initialLiquidity || 1) * 1e18).toString(),
    feePercentage: data.feePercentage || 49, // Default 49%
    tickSpacing: data.tickSpacing || 200,
    creator: authorAddress || "0x1234567890123456789012345678901234567890",
    salt: `0x${authorFid.toString(16).padStart(64, "0")}`,
    description: data.description || `${tokenName} - A token on the Fey protocol`
  };
}

function generateFeyTokenParametersLegacy(
  castText: string,
  authorFid: number,
  authorAddress?: string
): FeyTokenParameters {
  const tokenName = extractTokenName(castText);
  const tokenSymbol = extractTokenSymbol(tokenName);
  const feePercentage = extractFeePercentage(castText) || 49;

  return {
    tokenName,
    tokenSymbol,
    tokenImage: `https://fresh.anky.app/token-image/${tokenSymbol.toLowerCase()}.png`,
    initialLiquidity: (1 * 1e18).toString(), // Default 1 ETH
    feePercentage,
    tickSpacing: 200,
    creator: authorAddress || "0x1234567890123456789012345678901234567890",
    salt: `0x${authorFid.toString(16).padStart(64, "0")}`,
    description: `${tokenName} - A token on the Fey protocol`
  };
}

// Extract fee percentage from text
export function extractFeePercentage(castText: string): number | null {
  // Look for patterns like "X%", "X percent", "X% to feythful", "X% fees"
  const feePatterns = [
    /(\d+(?:\.\d+)?)%\s*(?:to\s*)?(?:feythful|fees|trading fees)/gi,
    /(\d+(?:\.\d+)?)\s*percent\s*(?:to\s*)?(?:feythful|fees)/gi,
    /fee(?:s)?\s*(?:of|:)?\s*(\d+(?:\.\d+)?)%/gi,
    /feythful\s*gets?\s*(\d+(?:\.\d+)?)%/gi,
  ];

  for (const pattern of feePatterns) {
    const match = castText.match(pattern);
    if (match && match[1]) {
      const percentage = parseFloat(match[1]);
      if (percentage >= 0 && percentage <= 100) {
        return percentage;
      }
    }
  }

  return null;
}

export function generateFeyTokenTransactionData(params: FeyTokenParameters): string {
  // This would generate the actual FeySDK transaction data
  // For now, return a structured object that represents the deployment
  const deploymentConfig = {
    token: {
      name: params.tokenName,
      symbol: params.tokenSymbol,
      image: params.tokenImage,
      description: params.description,
    },
    liquidity: {
      initialAmount: params.initialLiquidity,
      tickSpacing: params.tickSpacing,
    },
    fees: {
      percentage: params.feePercentage,
      beneficiary: "feythful", // Goes to token holders
    },
    deployment: {
      creator: params.creator,
      salt: params.salt,
      network: "base",
    },
    sdk: {
      method: "deployToken",
      version: "1.0.0",
    }
  };

  return JSON.stringify(deploymentConfig, null, 2);
}
