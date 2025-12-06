import { db } from "ponder:api";
import schema from "ponder:schema";
import { Hono } from "hono";
import { client, graphql } from "ponder";
import { readFile } from "fs/promises";
import { join } from "path";
import { eq } from "ponder";
import { publishCast, extractAllCastData } from "./utils/neynar.js";
import {
  detectTGCIntent,
  generateTGCParameters,
  generateTGCTransactionData,
  analyzeIntent,
  generateFeyTokenParameters,
  generateFeyTokenTransactionData,
  generateFeybotResponse,
  type IntentAnalysis,
  type FeyTokenParameters,
} from "./utils/tgc-analyzer.js";
import { getMainTGCLaunchView } from "./views/main-tgc-launch.js";
import { getTGCReplyMiniappView } from "./views/tgc-reply-miniapp.js";
import { getFeyTokenDeployMiniappView } from "./views/fey-token-deploy-miniapp.js";
import { castStore } from "./utils/cast-store.js";
import { deploymentTracker, type PendingDeployment } from "./utils/deployment-tracker.js";

const app = new Hono();

// Serve static files - Feybot SVG responses
app.get("/static/icon.svg", (c) => {
  return c.html(
    `<svg width="200" height="200" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
<rect width="200" height="200" rx="40" fill="#0C6300"/>
<text x="100" y="110" font-family="Arial, sans-serif" font-size="36" font-weight="bold" text-anchor="middle" fill="white">FEY</text>
<path d="M50 130 L70 150 L150 150 L170 130" stroke="white" stroke-width="4" fill="none"/>
</svg>`,
    { headers: { "Content-Type": "image/svg+xml" } }
  );
});

app.get("/static/og-image.svg", (c) => {
  return c.html(
    `<svg width="600" height="400" viewBox="0 0 600 400" fill="none" xmlns="http://www.w3.org/2000/svg">
<rect width="600" height="400" fill="url(#gradient)"/>
<text x="300" y="150" font-family="Arial, sans-serif" font-size="48" font-weight="bold" text-anchor="middle" fill="white">Feybot TGC</text>
<text x="300" y="200" font-family="Arial, sans-serif" font-size="24" text-anchor="middle" fill="#b0bec5">Token Generation Ceremony Platform</text>
<circle cx="200" cy="300" r="40" fill="white" fill-opacity="0.2"/>
<circle cx="400" cy="300" r="40" fill="white" fill-opacity="0.2"/>
<path d="M240 300 L360 300" stroke="white" stroke-width="4" marker-end="url(#arrowhead)"/>
<defs>
    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#0C6300;stop-opacity:1" />
        <stop offset="100%" style="stop-color:#1a8a00;stop-opacity:1" />
    </linearGradient>
    <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
        <polygon points="0 0, 10 3.5, 0 7" fill="white" />
    </marker>
</defs>
</svg>`,
    { headers: { "Content-Type": "image/svg+xml" } }
  );
});

// Serve PNG image
app.get("/static/image.png", async (c) => {
  try {
    const imagePath = join(process.cwd(), "static", "image.png");
    const imageBuffer = await readFile(imagePath);
    return c.body(imageBuffer, 200, { "Content-Type": "image/png" });
  } catch (error) {
    return c.text("Image not found", 404);
  }
});

// Serve media files
app.get("/static/background.mp4", async (c) => {
  try {
    const videoPath = join(process.cwd(), "static", "background.mp4");
    const videoBuffer = await readFile(videoPath);
    return c.body(videoBuffer, 200, { "Content-Type": "video/mp4" });
  } catch (error) {
    return c.text("Video not found", 404);
  }
});

app.get("/static/background.webm", async (c) => {
  try {
    const videoPath = join(process.cwd(), "static", "background.webm");
    const videoBuffer = await readFile(videoPath);
    return c.body(videoBuffer, 200, { "Content-Type": "video/webm" });
  } catch (error) {
    return c.text("Video not found", 404);
  }
});

app.get("/static/ambient.mp3", async (c) => {
  try {
    const audioPath = join(process.cwd(), "static", "ambient.mp3");
    const audioBuffer = await readFile(audioPath);
    return c.body(audioBuffer, 200, { "Content-Type": "audio/mpeg" });
  } catch (error) {
    return c.text("Audio not found", 404);
  }
});

app.get("/static/ambient.ogg", async (c) => {
  try {
    const audioPath = join(process.cwd(), "static", "ambient.ogg");
    const audioBuffer = await readFile(audioPath);
    return c.body(audioBuffer, 200, { "Content-Type": "audio/ogg" });
  } catch (error) {
    return c.text("Audio not found", 404);
  }
});

// Serve FEY SDK
app.get("/static/fey-sdk.js", async (c) => {
  try {
    const sdkPath = join(process.cwd(), "static", "fey-sdk.js");
    const sdkBuffer = await readFile(sdkPath);
    return c.body(sdkBuffer, 200, { "Content-Type": "application/javascript" });
  } catch (error) {
    return c.text("FEY SDK not found", 404);
  }
});

// Farcaster miniapp manifest
app.get("/.well-known/farcaster.json", (c) => {
  const manifest = {
    accountAssociation: {
      header: process.env.MANIFEST_HEADER || "",
      payload: process.env.MANIFEST_PAYLOAD || "",
      signature: process.env.MANIFEST_SIGNATURE || "",
    },
    miniapp: {
      version: "1",
      name: "Feybot TGC",
      iconUrl: `${
        process.env.BASE_URL || "https://fresh.anky.app"
      }/static/icon.svg`,
      homeUrl: process.env.BASE_URL || "https://fresh.anky.app",
      imageUrl: `${
        process.env.BASE_URL || "https://fresh.anky.app"
      }/static/image.png`,
      buttonTitle: "Launch TGC",
      splashImageUrl: `${
        process.env.BASE_URL || "https://fresh.anky.app"
      }/static/icon.svg`,
      splashBackgroundColor: "#0C6300",
    },
  };
  return c.json(manifest);
});

// Main page - TGC Launch Interface
app.get("/", (c) => {
  return c.html(getMainTGCLaunchView());
});

// Process Feybot tag webhook function
async function processFeybotWasTaggedOnACastWebhook(webhookData: any) {
  console.log("[Feybot] Processing webhook for feybot tag:", webhookData);

  try {
    // Extract all cast data including media
    const castData = extractAllCastData(webhookData);

    console.log("[Feybot] Cast details:", {
      hash: castData.hash,
      text: castData.text,
      author: castData.author,
      media: castData.media,
    });

    // Store cast data for later retrieval
    castStore.storeCast(castData);

    // Analyze intent (TGC vs FEY Token vs None)
    const intentAnalysis = await analyzeIntent(castData.text);
    castStore.updateIntentType(castData.hash, intentAnalysis.intentType);

    let response = "";
    let embedUrl = "";
    let shouldPublishReply = false;

    if (intentAnalysis.intentType === 'tgc') {
      console.log("[Feybot] TGC intent detected, generating parameters...");

      // Check media validity for TGC
      if (!castData.media.isValid) {
        // Generate personality-infused response about media issue
        response = await generateFeybotResponse(
          castData.text + "\n\n[CONTEXT: Media validation failed - " + castData.media.error + "]",
          intentAnalysis,
          castData.author.username
        );
        response += `\n\n💫 For Token Generation Ceremonies, the mystical energies require exactly one image/video as your token's sacred media. Try again with a single media attachment! 🎨`;
        shouldPublishReply = true;
      } else {
        // Generate TGC parameters from the cast
        const tgcParams = await generateTGCParameters(
          castData.text,
          castData.author.fid
        );

        // Store TGC parameters with cast data
        castStore.updateTGCParams(castData.hash, tgcParams);

        // Generate personality-infused response
        response = await generateFeybotResponse(
          castData.text,
          intentAnalysis,
          castData.author.username
        );

        response += `\n\n✨ **Ceremonial Configuration Detected:**\n` +
          `🏛️ Token: ${tgcParams.token.name} (${tgcParams.token.symbol})\n` +
          `💰 Community Cap: ${(
            parseFloat(tgcParams.communityContributionCap) / 1e18
          ).toFixed(1)} ETH\n` +
          `🏢 Team Cap: ${(
            parseFloat(tgcParams.teamContributionCap) / 1e18
          ).toFixed(1)} ETH\n` +
          `🎨 Sacred Media: Attached for eternal preservation\n\n` +
          `🔮 Click the mystical portal below to complete your ceremony:`;

        embedUrl = `${
          process.env.BASE_URL || "https://fresh.anky.app"
        }/miniapp-on-reply-to/${castData.hash}`;
        shouldPublishReply = true;

        console.log("[Feybot] TGC parameters generated:", tgcParams);
      }
    } else if (intentAnalysis.intentType === 'fey_token') {
      console.log("[Feybot] FEY Token deployment intent detected, generating parameters...");

      // Generate FEY token parameters from the cast
      const feyTokenParams = await generateFeyTokenParameters(
        castData.text,
        castData.author.fid
      );

      // Use cast image if available, otherwise use generated placeholder
      if (castData.media.isValid && castData.media.mediaUrl) {
        feyTokenParams.tokenImage = castData.media.mediaUrl;
        console.log("[Feybot] Using cast image for token:", castData.media.mediaUrl);
      }

      // Store FEY token parameters with cast data
      castStore.updateFeyTokenParams(castData.hash, feyTokenParams);

      // Generate personality-infused response
      response = await generateFeybotResponse(
        castData.text,
        intentAnalysis,
        castData.author.username
      );

      response += `\n\n⚡ **Deployment Essence Channeled:**\n` +
        `🪙 Token: ${feyTokenParams.tokenName} (${feyTokenParams.tokenSymbol})\n` +
        `💎 Feythful Share: ${feyTokenParams.feePercentage}%\n` +
        `🌊 Initial Liquidity: ${(parseFloat(feyTokenParams.initialLiquidity) / 1e18).toFixed(1)} ETH\n` +
        `${castData.media.isValid ? `🎨 Sacred Media: ${castData.media.mediaUrl}\n` : `💫 Media: Auto-generated placeholder\n`}\n` +
        `${!castData.media.isValid ? `\n🌟 *Pro tip: Attach an image to your cast next time for a custom token image!*\n` : ``}\n` +
        `🔮 Step through the portal to manifest your token:`;

      embedUrl = `${
        process.env.BASE_URL || "https://fresh.anky.app"
      }/miniapp-fey-deploy/${castData.hash}`;
      shouldPublishReply = true;

      console.log("[Feybot] FEY token parameters generated:", feyTokenParams);
    } else {
      // Check if this is a token lookup query
      const addressMatch = castData.text?.match(/0x[a-fA-F0-9]{40}/);

      if (addressMatch) {
        const contractAddress = addressMatch[0];

        // Query our database for tokens created with this address
        const tokenData = await db
          .select()
          .from(schema.tokenCreations)
          .where(
            eq(
              schema.tokenCreations.tokenAddress,
              contractAddress.toLowerCase()
            )
          )
          .limit(1);

        if (tokenData.length > 0) {
          const token = tokenData[0];
          // Generate personality-infused response for token lookup
          response = await generateFeybotResponse(
            castData.text + `\n\n[CONTEXT: Found token in FEY protocol database - ${token?.tokenName} (${token?.tokenSymbol})]`,
            intentAnalysis,
            castData.author.username
          );

          response += `\n\n🔮 **Token Divination Results:**\n` +
            `✨ Token: ${token?.tokenName} (${token?.tokenSymbol})\n` +
            `🧙‍♂️ Creator: ${token?.msgSender.slice(0, 6)}...${token?.msgSender.slice(-4)}\n` +
            `🏊 Pool ID: ${token?.poolId.slice(0, 10)}...\n` +
            `⚡ Extensions: ${JSON.parse(token?.extensions || "[]").length} active\n` +
            `${token?.createdViaUI === 'feybot' ? `💫 Summoned via Feybot UI\n` : ``}\n` +
            `📊 Explore on Base: https://basescan.org/address/${token?.tokenAddress}`;
        } else {
          // Generate personality-infused response for token not found
          response = await generateFeybotResponse(
            castData.text + "\n\n[CONTEXT: Token address provided but not found in FEY protocol database]",
            intentAnalysis,
            castData.author.username
          );
          
          response += `\n\n🌊 The mystical energies show no trace of this address in our sacred protocol records. Perhaps it dwells in another realm, or the address carries ancient typos?\n\n💫 Ready to manifest your own token through the FEY Protocol? The portals await!`;
        }
        shouldPublishReply = true;
      } else if (
        castData.text?.toLowerCase().includes("token") ||
        castData.text?.toLowerCase().includes("fey")
      ) {
        // Generate personality-infused response for general token inquiry
        response = await generateFeybotResponse(
          castData.text + "\n\n[CONTEXT: General inquiry about FEY Protocol or tokens]",
          intentAnalysis,
          castData.author.username
        );

        response += `\n\n✨ **The FEY Protocol Mysteries:**\n` +
          `🌿 User-owned launchpad infrastructure on Base\n` +
          `⚡ Uniswap v4 integration with MEV protection\n` +
          `🔮 Custom hooks and extension system\n` +
          `💎 100% fee redistribution to stakers\n` +
          `🏛️ Factory Contract: 0x8EEF0dC80ADf57908bB1be0236c2a72a7e379C2d\n\n` +
          `🌊 Ready to begin your token ceremony? The ethers await your command!`;
        shouldPublishReply = true;
      } else {
        // Generate personality-infused response for general query
        response = await generateFeybotResponse(
          castData.text + "\n\n[CONTEXT: General greeting or inquiry about Feybot]",
          intentAnalysis,
          castData.author.username
        );

        response += `\n\n🔮 I am the mystical guardian of the FEY Protocol realm, here to guide you through:\n` +
          `✨ Token Generation Ceremonies (TGCs)\n` +
          `⚡ Direct FEY token deployment\n` +
          `💎 User-owned launchpad magic\n` +
          `🌊 Fee redistribution mysteries\n\n` +
          `🌟 Whisper "start tgc" to begin a ceremony, or ask me anything about the sacred protocol!`;
        shouldPublishReply = true;
      }
    }

    console.log("[Feybot] Generated response:", response);
    console.log("[Feybot] Embed URL:", embedUrl);
    console.log("[Feybot] Should publish reply:", shouldPublishReply);

    // Publish the reply cast if needed
    if (shouldPublishReply) {
      try {
        const publishCastData = {
          text: response,
          parent_hash: castData.hash,
          embeds: embedUrl ? [{ url: embedUrl }] : undefined,
        };

        const publishResult = await publishCast(publishCastData);
        console.log("[Feybot] Reply cast published:", publishResult);

        return {
          success: true,
          response: response,
          castHash: castData.hash,
          author: castData.author,
          published: true,
          publishResult: publishResult,
          embedUrl: embedUrl,
        };
      } catch (publishError) {
        console.error("[Feybot] Error publishing reply cast:", publishError);

        return {
          success: true,
          response: response,
          castHash: castData.hash,
          author: castData.author,
          published: false,
          error: (publishError as Error).message,
          embedUrl: embedUrl,
        };
      }
    }

    // Return response without publishing
    return {
      success: true,
      response: response,
      castHash: castData.hash,
      author: castData.author,
      published: false,
      embedUrl: embedUrl,
    };
  } catch (error) {
    console.error("[Feybot] Error processing webhook:", error);

    // Return a fallback response
    return {
      success: false,
      response:
        `🤖 Sorry, I'm having trouble processing that right now. Please try again later!\n\n` +
        `For more info about Fey protocol, check: https://basescan.org/address/0x8EEF0dC80ADf57908bB1be0236c2a72a7e379C2d`,
      error: (error as Error).message,
    };
  }
}

// Neynar webhook endpoint for feybot tags
app.post("/webhooks/neynar/feybot-tagged", async (c) => {
  console.log("[Webhook] Received Neynar webhook for feybot tag");

  try {
    // Get the webhook payload
    const webhookData = await c.req.json();
    console.log(
      "[Webhook] Payload received:",
      JSON.stringify(webhookData, null, 2)
    );

    // Verify webhook authenticity (optional - add Neynar signature verification here)
    const neynarSignature = c.req.header("X-Neynar-Signature");
    console.log("[Webhook] Neynar signature:", neynarSignature);

    // Process the webhook
    const result = await processFeybotWasTaggedOnACastWebhook(webhookData);

    console.log("[Webhook] Processing result:", result);

    // Return the response that should be posted as a reply
    return c.json({
      success: result.success,
      message: result.response,
      metadata: {
        castHash: result.castHash,
        author: result.author,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("[Webhook] Error handling webhook:", error);

    return c.json(
      {
        success: false,
        error: "Failed to process webhook",
        message: "🤖 Sorry, I encountered an error. Please try again later!",
      },
      500
    );
  }
});

// Miniapp reply route for TGC configuration
app.get("/miniapp-on-reply-to/:castHash", (c) => {
  const castHash = c.req.param("castHash");

  // Retrieve stored cast data
  const storedCast = castStore.getCast(castHash);

  if (!storedCast) {
    return c.html(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Feybot - Cast Not Found</title>
          <style>
              body {
                  font-family: Arial, sans-serif;
                  background: #0C6300;
                  color: white;
                  text-align: center;
                  padding: 2rem;
                  margin: 0;
              }
              .error-container {
                  max-width: 400px;
                  margin: 0 auto;
                  background: rgba(255, 255, 255, 0.1);
                  padding: 2rem;
                  border-radius: 12px;
              }
          </style>
      </head>
      <body>
          <div class="error-container">
              <h1>🤖 Cast Not Found</h1>
              <p>The original cast data has expired or was not found.</p>
              <p>Cast Hash: ${castHash.slice(0, 10)}...${castHash.slice(-6)}</p>
              <p>Please try mentioning @feybot again with your TGC request.</p>
          </div>
      </body>
      </html>
    `);
  }

  return c.html(getTGCReplyMiniappView(castHash, storedCast));
});

// Miniapp route for FEY token deployment
app.get("/miniapp-fey-deploy/:castHash", (c) => {
  const castHash = c.req.param("castHash");

  // Retrieve stored cast data
  const storedCast = castStore.getCast(castHash);

  if (!storedCast) {
    return c.html(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Feybot - Cast Not Found</title>
          <style>
              body {
                  font-family: Arial, sans-serif;
                  background: #0C6300;
                  color: white;
                  text-align: center;
                  padding: 2rem;
                  margin: 0;
              }
              .error-container {
                  max-width: 400px;
                  margin: 0 auto;
                  background: rgba(255, 255, 255, 0.1);
                  padding: 2rem;
                  border-radius: 12px;
              }
          </style>
      </head>
      <body>
          <div class="error-container">
              <h1>🤖 Cast Not Found</h1>
              <p>The original cast data has expired or was not found.</p>
              <p>Cast Hash: ${castHash.slice(0, 10)}...${castHash.slice(-6)}</p>
              <p>Please try mentioning @feybot again with your FEY token deployment request.</p>
          </div>
      </body>
      </html>
    `);
  }

  return c.html(getFeyTokenDeployMiniappView(castHash, storedCast));
});

// TGC API endpoints
app.get("/api/tgc/start-interface", (c) => {
  return c.html(`
    <div class="tgc-interface" id="tgc-interface">
      <h2>🚀 Starting Token Generation Ceremony...</h2>
      <p>Loading TGC configuration interface...</p>
      <div class="loading-spinner">
        <div style="animation: spin 1s linear infinite; display: inline-block;">⟳</div>
      </div>
    </div>
  `);
});

app.post("/api/tgc/generate-transaction", async (c) => {
  try {
    const formData = await c.req.parseBody();
    const castHash = formData.castHash as string;

    // Build TGC parameters from form data
    const tgcParams = {
      creator: "0x1234567890123456789012345678901234567890", // This would come from user's wallet
      communityWhitelistRoot:
        "0x0000000000000000000000000000000000000000000000000000000000000000",
      communityContributionCap: (
        parseFloat(formData.communityContributionCap as string) * 1e18
      ).toString(),
      teamContributionCap: (
        parseFloat(formData.teamContributionCap as string) * 1e18
      ).toString(),
      caps: {
        minCommunityDeposit: (
          parseFloat(formData.minCommunityDeposit as string) * 1e18
        ).toString(),
        maxCommunityDeposit: (
          parseFloat(formData.maxCommunityDeposit as string) * 1e18
        ).toString(),
      },
      launchpad: {
        id: "0x46455900000000000000000000000000000000000000000000000000000000",
        config: "0x...",
      },
      token: {
        salt: `0x${Date.now().toString(16).padStart(64, "0")}`,
        name: formData.tokenName as string,
        symbol: formData.tokenSymbol as string,
        image:
          (formData.tokenImage as string) ||
          `https://fresh.anky.app/token-image/${(
            formData.tokenSymbol as string
          ).toLowerCase()}.png`,
        tickIfToken0IsCeremonyToken: -887220,
        tickSpacing: parseInt(formData.tickSpacing as string),
        tickLower: parseInt(formData.tickLower as string),
        tickUpper: parseInt(formData.tickUpper as string),
      },
      teamAllocations: [],
    };

    const transactionData = generateTGCTransactionData(tgcParams);

    // Store pending deployment for tracking
    const pendingDeployment: PendingDeployment = {
      castHash,
      deploymentType: 'tgc',
      expectedTokenName: tgcParams.token.name,
      expectedTokenSymbol: tgcParams.token.symbol,
      expectedCreator: tgcParams.creator,
      expectedSalt: tgcParams.token.salt,
      communityContributionCap: tgcParams.communityContributionCap,
      teamContributionCap: tgcParams.teamContributionCap,
      timestamp: new Date(),
      matched: false
    };
    
    deploymentTracker.storePendingDeployment(pendingDeployment);
    console.log(`[TGC] Stored pending deployment for tracking:`, pendingDeployment);

    return c.html(`
      <div class="transaction-result">
        <h3>✅ Transaction Generated Successfully!</h3>
        <div class="transaction-details">
          <h4>TGC Parameters:</h4>
          <pre style="background: rgba(0,0,0,0.5); padding: 1rem; border-radius: 8px; overflow-x: auto; font-size: 0.8rem;">${transactionData}</pre>
        </div>
        <div class="action-buttons" style="margin-top: 1rem;">
          <button class="btn btn-primary" onclick="executeTransaction()">
            Execute Transaction
          </button>
          <button class="btn btn-secondary" onclick="copyTransactionData()">
            Copy Data
          </button>
        </div>
        <script>
          function executeTransaction() {
            alert('Transaction execution would happen here via wallet integration');
          }
          
          function copyTransactionData() {
            navigator.clipboard.writeText(\`${transactionData}\`);
            alert('Transaction data copied to clipboard!');
          }
        </script>
      </div>
    `);
  } catch (error) {
    console.error("[TGC] Error generating transaction:", error);
    return c.html(`
      <div class="error-message" style="display: block;">
        ❌ Error generating transaction: ${(error as Error).message}
      </div>
    `);
  }
});

app.get("/api/tgc/preview-parameters", async (c) => {
  const query = c.req.query();

  return c.html(`
    <div class="preview-section" style="margin-top: 2rem; padding: 1rem; background: rgba(79, 198, 95, 0.1); border-radius: 8px;">
      <h4>📋 Parameter Preview</h4>
      <div style="font-size: 0.9rem; line-height: 1.6;">
        <p><strong>Token:</strong> ${query.tokenName} (${query.tokenSymbol})</p>
        <p><strong>Community Cap:</strong> ${query.communityContributionCap} ETH</p>
        <p><strong>Team Cap:</strong> ${query.teamContributionCap} ETH</p>
        <p><strong>Deposit Range:</strong> ${query.minCommunityDeposit} - ${query.maxCommunityDeposit} ETH</p>
        <p><strong>Tick Spacing:</strong> ${query.tickSpacing}</p>
      </div>
    </div>
  `);
});

// FEY Token API endpoints
app.post("/api/fey-token/deploy", async (c) => {
  try {
    const formData = await c.req.parseBody();
    const castHash = formData.castHash as string;

    // Build FEY token parameters from form data
    const feyTokenParams: FeyTokenParameters = {
      tokenName: formData.tokenName as string,
      tokenSymbol: formData.tokenSymbol as string,
      tokenImage: formData.tokenImage as string || `https://fresh.anky.app/token-image/${(formData.tokenSymbol as string).toLowerCase()}.png`,
      description: formData.tokenDescription as string || `${formData.tokenName} - A token on the Fey protocol`,
      initialLiquidity: ((parseFloat(formData.initialLiquidity as string) || 1) * 1e18).toString(),
      feePercentage: parseInt(formData.feePercentage as string) || 49,
      tickSpacing: parseInt(formData.tickSpacing as string) || 200,
      creator: "0x1234567890123456789012345678901234567890", // This would come from user's wallet
      salt: `0x${Date.now().toString(16).padStart(64, "0")}`,
    };

    const transactionData = generateFeyTokenTransactionData(feyTokenParams);

    // Store the parameters with the cast for tracking
    castStore.updateFeyTokenParams(castHash, feyTokenParams);

    // Store pending deployment for tracking
    const pendingDeployment: PendingDeployment = {
      castHash,
      deploymentType: 'fey_token',
      expectedTokenName: feyTokenParams.tokenName,
      expectedTokenSymbol: feyTokenParams.tokenSymbol,
      expectedCreator: feyTokenParams.creator,
      expectedSalt: feyTokenParams.salt,
      feePercentage: feyTokenParams.feePercentage,
      timestamp: new Date(),
      matched: false
    };
    
    deploymentTracker.storePendingDeployment(pendingDeployment);
    console.log(`[FEY Token] Stored pending deployment for tracking:`, pendingDeployment);

    return c.html(`
      <div class="transaction-result">
        <h3>✅ FEY Token Deployment Ready!</h3>
        <div class="transaction-details">
          <h4>Deployment Configuration:</h4>
          <pre style="background: rgba(0,0,0,0.5); padding: 1rem; border-radius: 8px; overflow-x: auto; font-size: 0.8rem;">${transactionData}</pre>
          
          <div style="margin-top: 1.5rem; padding: 1rem; background: rgba(79, 198, 95, 0.1); border-radius: 8px;">
            <h5 style="color: #4FC65F; margin-bottom: 0.5rem;">🎯 Deployment Summary:</h5>
            <p style="margin: 0.25rem 0;"><strong>Token:</strong> ${feyTokenParams.tokenName} (${feyTokenParams.tokenSymbol})</p>
            <p style="margin: 0.25rem 0;"><strong>Fee to Feythful:</strong> ${feyTokenParams.feePercentage}%</p>
            <p style="margin: 0.25rem 0;"><strong>Initial Liquidity:</strong> ${(parseFloat(feyTokenParams.initialLiquidity) / 1e18).toFixed(1)} ETH</p>
          </div>
        </div>
        <div class="action-buttons" style="margin-top: 1.5rem;">
          <button class="btn btn-primary" onclick="executeDeployment()">
            Deploy with FeySDK
          </button>
          <button class="btn btn-secondary" onclick="copyDeploymentData()">
            Copy Config
          </button>
        </div>
        <script>
          function executeDeployment() {
            // This would integrate with FeySDK
            if (typeof window.FeySDK !== 'undefined') {
              // Actual FeySDK deployment would happen here
              console.log('Deploying with FeySDK:', ${JSON.stringify(feyTokenParams)});
              alert('FeySDK deployment initiated! Check console for details.');
            } else {
              alert('FeySDK not loaded. In production, this would deploy your token.');
            }
          }
          
          function copyDeploymentData() {
            navigator.clipboard.writeText(\`${transactionData}\`);
            alert('Deployment configuration copied to clipboard!');
          }
        </script>
      </div>
    `);
  } catch (error) {
    console.error("[FEY Token] Error generating deployment config:", error);
    return c.html(`
      <div class="error-message" style="display: block;">
        ❌ Error preparing deployment: ${(error as Error).message}
      </div>
    `);
  }
});

app.get("/api/fey-token/preview", async (c) => {
  const query = c.req.query();

  return c.html(`
    <div class="preview-section" style="margin-top: 2rem; padding: 1rem; background: rgba(79, 198, 95, 0.1); border-radius: 8px;">
      <h4>🔍 Token Preview</h4>
      <div style="font-size: 0.9rem; line-height: 1.6;">
        <p><strong>Token:</strong> ${query.tokenName} (${query.tokenSymbol})</p>
        <p><strong>Fee to Feythful:</strong> ${query.feePercentage}%</p>
        <p><strong>Initial Liquidity:</strong> ${query.initialLiquidity} ETH</p>
        <p><strong>Tick Spacing:</strong> ${query.tickSpacing}</p>
        <p><strong>Description:</strong> ${query.tokenDescription || 'No description provided'}</p>
      </div>
      
      <div style="margin-top: 1rem; padding: 1rem; background: rgba(79, 198, 95, 0.05); border-radius: 6px; font-size: 0.8rem; color: #3EA34B;">
        <strong>💡 What this means:</strong><br>
        • Your token will be deployed on the Fey protocol<br>
        • ${query.feePercentage}% of trading fees will go to token holders (feythful)<br>
        • Initial liquidity pool will be created with ${query.initialLiquidity} ETH<br>
        • Token will be immediately tradeable on Uniswap v4
      </div>
    </div>
  `);
});

// Deployment tracking update endpoint
app.post("/api/deployment-tracker/update", async (c) => {
  try {
    const body = await c.req.json();
    const { castHash, transactionHash, tokenAddress, status } = body;

    console.log(`[DeploymentTracker] Update request:`, { castHash, transactionHash, status });

    // Update the deployment tracker with transaction hash
    if (transactionHash && castHash) {
      // Find the deployment by cast hash and update it
      const pendingDeployments = deploymentTracker.getPendingDeployments();
      const deployment = pendingDeployments.find(d => d.castHash === castHash);
      
      if (deployment) {
        deploymentTracker.updateDeploymentTransaction(castHash, deployment.expectedSalt, transactionHash);
        console.log(`[DeploymentTracker] Updated deployment transaction:`, { castHash, transactionHash });
      }
    }

    return c.json({ success: true, message: "Deployment updated successfully" });
  } catch (error) {
    console.error("[DeploymentTracker] Update failed:", error);
    return c.json({ success: false, error: "Failed to update deployment" }, 500);
  }
});

// Deployment tracking status endpoint
app.get("/api/deployment-tracker/stats", (c) => {
  const stats = deploymentTracker.getStats();
  const pendingDeployments = deploymentTracker.getPendingDeployments();
  
  return c.json({
    stats,
    pendingDeployments: pendingDeployments.map(d => ({
      castHash: d.castHash,
      deploymentType: d.deploymentType,
      tokenName: d.expectedTokenName,
      tokenSymbol: d.expectedTokenSymbol,
      matched: d.matched,
      timestamp: d.timestamp,
      transactionHash: d.transactionHash
    })),
    timestamp: new Date().toISOString()
  });
});

// Health check endpoint
app.get("/check-health", (c) => {
  return c.json({
    status: "healthy",
    service: "feybot-indexer",
    timestamp: new Date().toISOString(),
  });
});

// Ponder API routes
app.use("/sql/*", client({ db, schema }));
app.use("/graphql", graphql({ db, schema }));

export default app;