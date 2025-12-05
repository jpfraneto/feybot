import { onchainTable } from "ponder";

// Fey Protocol Tables
export const tokenCreations = onchainTable("token_creations", (t) => ({
  id: t.text().primaryKey(),
  msgSender: t.text().notNull(),
  tokenAddress: t.text().notNull(),
  tokenAdmin: t.text().notNull(),
  tokenMetadata: t.text().notNull(),
  tokenImage: t.text().notNull(),
  tokenName: t.text().notNull(),
  tokenSymbol: t.text().notNull(),
  tokenContext: t.text().notNull(),
  poolHook: t.text().notNull(),
  poolId: t.text().notNull(),
  startingTick: t.integer().notNull(),
  pairedToken: t.text().notNull(),
  locker: t.text().notNull(),
  mevModule: t.text().notNull(),
  extensionsSupply: t.bigint().notNull(),
  extensions: t.text().notNull(), // JSON array as string
  blockNumber: t.bigint().notNull(),
  transactionHash: t.text().notNull(),
  timestamp: t.bigint().notNull(),
}));

export const extensionTriggers = onchainTable("extension_triggers", (t) => ({
  id: t.text().primaryKey(),
  extension: t.text().notNull(),
  extensionSupply: t.bigint().notNull(),
  msgValue: t.bigint().notNull(),
  blockNumber: t.bigint().notNull(),
  transactionHash: t.text().notNull(),
  timestamp: t.bigint().notNull(),
}));

export const feeClaims = onchainTable("fee_claims", (t) => ({
  id: t.text().primaryKey(),
  token: t.text().notNull(),
  recipient: t.text().notNull(),
  amount: t.bigint().notNull(),
  blockNumber: t.bigint().notNull(),
  transactionHash: t.text().notNull(),
  timestamp: t.bigint().notNull(),
}));

export const hookUpdates = onchainTable("hook_updates", (t) => ({
  id: t.text().primaryKey(),
  hook: t.text().notNull(),
  enabled: t.boolean().notNull(),
  blockNumber: t.bigint().notNull(),
  transactionHash: t.text().notNull(),
  timestamp: t.bigint().notNull(),
}));

export const lockerUpdates = onchainTable("locker_updates", (t) => ({
  id: t.text().primaryKey(),
  locker: t.text().notNull(),
  hook: t.text().notNull(),
  enabled: t.boolean().notNull(),
  blockNumber: t.bigint().notNull(),
  transactionHash: t.text().notNull(),
  timestamp: t.bigint().notNull(),
}));

export const extensionUpdates = onchainTable("extension_updates", (t) => ({
  id: t.text().primaryKey(),
  extension: t.text().notNull(),
  enabled: t.boolean().notNull(),
  blockNumber: t.bigint().notNull(),
  transactionHash: t.text().notNull(),
  timestamp: t.bigint().notNull(),
}));

export const mevModuleUpdates = onchainTable("mev_module_updates", (t) => ({
  id: t.text().primaryKey(),
  mevModule: t.text().notNull(),
  enabled: t.boolean().notNull(),
  blockNumber: t.bigint().notNull(),
  transactionHash: t.text().notNull(),
  timestamp: t.bigint().notNull(),
}));

export const configUpdates = onchainTable("config_updates", (t) => ({
  id: t.text().primaryKey(),
  eventType: t.text().notNull(), // "BaseToken", "Bootstrap", "TeamFeeRecipient", "FeeLocker", "Deprecated", etc.
  oldValue: t.text(),
  newValue: t.text(),
  blockNumber: t.bigint().notNull(),
  transactionHash: t.text().notNull(),
  timestamp: t.bigint().notNull(),
}));
