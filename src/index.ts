import { ponder } from "ponder:registry";
import { eq } from "ponder";
import {
  tokenCreations,
  extensionTriggers,
  feeClaims,
  hookUpdates,
  lockerUpdates,
  extensionUpdates,
  mevModuleUpdates,
  configUpdates,
} from "../ponder.schema";
import { deploymentTracker } from "./api/utils/deployment-tracker.js";

const sendTokenToBackend = async (tokenData: any) => {
  try {
    const apiKey = process.env.INDEXER_API_KEY;
    const baseUrl =
      process.env.BACKEND_API_BASE_URL || "https://poiesis.anky.app";
    if (!apiKey) {
      console.error("INDEXER_API_KEY not set - skipping token submission");
      return;
    }

    const response = await fetch(`${baseUrl}/fey/tokens`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        "X-Indexer-Source": "ponder-fey-indexer",
      },
      body: JSON.stringify(tokenData),
    });

    if (!response.ok) {
      console.error(
        "Failed to send token to backend:",
        response.status,
        response.statusText
      );
    } else {
      console.log("Token successfully sent to backend");
    }
  } catch (error) {
    console.error("Error sending token to backend:", error);
  }
};

ponder.on("Fey:TokenCreated", async ({ event, context }) => {
  const { 
    msgSender, 
    tokenAddress, 
    tokenAdmin, 
    tokenMetadata, 
    tokenImage, 
    tokenName, 
    tokenSymbol, 
    tokenContext, 
    poolHook, 
    poolId, 
    startingTick, 
    pairedToken, 
    locker, 
    mevModule, 
    extensionsSupply, 
    extensions 
  } = event.args;
  const { block, transaction } = event;

  const tokenId = `${transaction.hash}-${event.log.logIndex}`;

  // Check for matching deployment from our UI
  const matchedDeployment = deploymentTracker.matchDeployment({
    tokenName,
    tokenSymbol,
    msgSender: msgSender.toLowerCase(),
    transactionHash: transaction.hash,
    tokenAddress: tokenAddress.toLowerCase()
  });

  // Determine UI tracking values
  let createdViaUI: string | null = null;
  let uiCastHash: string | null = null;
  let deploymentType: string | null = null;

  if (matchedDeployment) {
    createdViaUI = 'feybot';
    uiCastHash = matchedDeployment.castHash;
    deploymentType = matchedDeployment.deploymentType;
    
    console.log(`[TokenCreated] ✅ Token matched to UI deployment:`, {
      tokenName,
      tokenSymbol,
      deploymentType: matchedDeployment.deploymentType,
      castHash: matchedDeployment.castHash
    });
  } else {
    createdViaUI = 'external';
    deploymentType = 'external';
    
    console.log(`[TokenCreated] ℹ️ Token created externally:`, {
      tokenName,
      tokenSymbol,
      msgSender: msgSender.toLowerCase()
    });
  }

  await context.db.insert(tokenCreations).values({
    id: tokenId,
    msgSender: msgSender.toLowerCase(),
    tokenAddress: tokenAddress.toLowerCase(),
    tokenAdmin: tokenAdmin.toLowerCase(),
    tokenMetadata,
    tokenImage,
    tokenName,
    tokenSymbol,
    tokenContext,
    poolHook: poolHook.toLowerCase(),
    poolId,
    startingTick,
    pairedToken: pairedToken.toLowerCase(),
    locker: locker.toLowerCase(),
    mevModule: mevModule.toLowerCase(),
    extensionsSupply,
    extensions: JSON.stringify(extensions.map((addr: string) => addr.toLowerCase())),
    blockNumber: block.number,
    transactionHash: transaction.hash,
    timestamp: block.timestamp,
    createdViaUI,
    uiCastHash,
    deploymentType,
  });

  const tokenData = {
    id: tokenId,
    msgSender: msgSender.toLowerCase(),
    tokenAddress: tokenAddress.toLowerCase(),
    tokenAdmin: tokenAdmin.toLowerCase(),
    tokenMetadata,
    tokenImage,
    tokenName,
    tokenSymbol,
    tokenContext,
    poolHook: poolHook.toLowerCase(),
    poolId,
    startingTick,
    pairedToken: pairedToken.toLowerCase(),
    locker: locker.toLowerCase(),
    mevModule: mevModule.toLowerCase(),
    extensionsSupply: extensionsSupply.toString(),
    extensions: extensions.map((addr: string) => addr.toLowerCase()),
    blockNumber: block.number.toString(),
    transactionHash: transaction.hash,
    timestamp: block.timestamp.toString(),
    createdViaUI,
    uiCastHash,
    deploymentType,
    // Include additional tracking data if matched
    ...(matchedDeployment && {
      feyBotDeploymentData: {
        castHash: matchedDeployment.castHash,
        deploymentType: matchedDeployment.deploymentType,
        feePercentage: matchedDeployment.feePercentage,
        communityContributionCap: matchedDeployment.communityContributionCap,
        teamContributionCap: matchedDeployment.teamContributionCap
      }
    })
  };

  await sendTokenToBackend(tokenData);
});

ponder.on("Fey:ExtensionTriggered", async ({ event, context }) => {
  const { extension, extensionSupply, msgValue } = event.args;
  const { block, transaction } = event;

  const triggerId = `${transaction.hash}-${event.log.logIndex}`;

  await context.db.insert(extensionTriggers).values({
    id: triggerId,
    extension: extension.toLowerCase(),
    extensionSupply,
    msgValue,
    blockNumber: block.number,
    transactionHash: transaction.hash,
    timestamp: block.timestamp,
  });
});

ponder.on("Fey:ClaimFees", async ({ event, context }) => {
  const { token, recipient, amount } = event.args;
  const { block, transaction } = event;

  const claimId = `${transaction.hash}-${event.log.logIndex}`;

  await context.db.insert(feeClaims).values({
    id: claimId,
    token: token.toLowerCase(),
    recipient: recipient.toLowerCase(),
    amount,
    blockNumber: block.number,
    transactionHash: transaction.hash,
    timestamp: block.timestamp,
  });
});

ponder.on("Fey:SetHook", async ({ event, context }) => {
  const { hook, enabled } = event.args;
  const { block, transaction } = event;

  const updateId = `${transaction.hash}-${event.log.logIndex}`;

  await context.db.insert(hookUpdates).values({
    id: updateId,
    hook: hook.toLowerCase(),
    enabled,
    blockNumber: block.number,
    transactionHash: transaction.hash,
    timestamp: block.timestamp,
  });
});

ponder.on("Fey:SetLocker", async ({ event, context }) => {
  const { locker, hook, enabled } = event.args;
  const { block, transaction } = event;

  const updateId = `${transaction.hash}-${event.log.logIndex}`;

  await context.db.insert(lockerUpdates).values({
    id: updateId,
    locker: locker.toLowerCase(),
    hook: hook.toLowerCase(),
    enabled,
    blockNumber: block.number,
    transactionHash: transaction.hash,
    timestamp: block.timestamp,
  });
});

ponder.on("Fey:SetExtension", async ({ event, context }) => {
  const { extension, enabled } = event.args;
  const { block, transaction } = event;

  const updateId = `${transaction.hash}-${event.log.logIndex}`;

  await context.db.insert(extensionUpdates).values({
    id: updateId,
    extension: extension.toLowerCase(),
    enabled,
    blockNumber: block.number,
    transactionHash: transaction.hash,
    timestamp: block.timestamp,
  });
});

ponder.on("Fey:SetMevModule", async ({ event, context }) => {
  const { mevModule, enabled } = event.args;
  const { block, transaction } = event;

  const updateId = `${transaction.hash}-${event.log.logIndex}`;

  await context.db.insert(mevModuleUpdates).values({
    id: updateId,
    mevModule: mevModule.toLowerCase(),
    enabled,
    blockNumber: block.number,
    transactionHash: transaction.hash,
    timestamp: block.timestamp,
  });
});

ponder.on("Fey:SetBaseToken", async ({ event, context }) => {
  const { oldBaseToken, newBaseToken } = event.args;
  const { block, transaction } = event;

  const updateId = `${transaction.hash}-${event.log.logIndex}`;

  await context.db.insert(configUpdates).values({
    id: updateId,
    eventType: "BaseToken",
    oldValue: oldBaseToken.toLowerCase(),
    newValue: newBaseToken.toLowerCase(),
    blockNumber: block.number,
    transactionHash: transaction.hash,
    timestamp: block.timestamp,
  });
});

ponder.on("Fey:SetBootstrap", async ({ event, context }) => {
  const { bootstrap } = event.args;
  const { block, transaction } = event;

  const updateId = `${transaction.hash}-${event.log.logIndex}`;

  await context.db.insert(configUpdates).values({
    id: updateId,
    eventType: "Bootstrap",
    oldValue: null,
    newValue: bootstrap.toLowerCase(),
    blockNumber: block.number,
    transactionHash: transaction.hash,
    timestamp: block.timestamp,
  });
});

ponder.on("Fey:SetTeamFeeRecipient", async ({ event, context }) => {
  const { oldTeamFeeRecipient, newTeamFeeRecipient } = event.args;
  const { block, transaction } = event;

  const updateId = `${transaction.hash}-${event.log.logIndex}`;

  await context.db.insert(configUpdates).values({
    id: updateId,
    eventType: "TeamFeeRecipient",
    oldValue: oldTeamFeeRecipient.toLowerCase(),
    newValue: newTeamFeeRecipient.toLowerCase(),
    blockNumber: block.number,
    transactionHash: transaction.hash,
    timestamp: block.timestamp,
  });
});

ponder.on("Fey:SetDeprecated", async ({ event, context }) => {
  const { deprecated } = event.args;
  const { block, transaction } = event;

  const updateId = `${transaction.hash}-${event.log.logIndex}`;

  await context.db.insert(configUpdates).values({
    id: updateId,
    eventType: "Deprecated",
    oldValue: null,
    newValue: deprecated.toString(),
    blockNumber: block.number,
    transactionHash: transaction.hash,
    timestamp: block.timestamp,
  });
});
