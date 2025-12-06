// Deployment Tracking Utility
// Tracks token deployments initiated through our UI for later matching with indexer events

export interface PendingDeployment {
  castHash: string;
  deploymentType: 'tgc' | 'fey_token';
  expectedTokenName: string;
  expectedTokenSymbol: string;
  expectedCreator: string;
  expectedSalt: string;
  feePercentage?: number; // For FEY tokens
  communityContributionCap?: string; // For TGC
  teamContributionCap?: string; // For TGC
  timestamp: Date;
  transactionHash?: string; // Set when deployment transaction is submitted
  matched: boolean;
}

class DeploymentTracker {
  private pendingDeployments = new Map<string, PendingDeployment>();
  private readonly TTL = 24 * 60 * 60 * 1000; // 24 hours

  // Store a pending deployment
  storePendingDeployment(deployment: PendingDeployment): void {
    // Use a combination of castHash and expected salt as key for uniqueness
    const key = `${deployment.castHash}_${deployment.expectedSalt}`;
    this.pendingDeployments.set(key, {
      ...deployment,
      timestamp: new Date(),
      matched: false
    });

    console.log(`[DeploymentTracker] Stored pending deployment:`, {
      key,
      type: deployment.deploymentType,
      tokenName: deployment.expectedTokenName,
      castHash: deployment.castHash
    });

    // Clean up old entries
    this.cleanup();
  }

  // Update deployment with transaction hash when submitted
  updateDeploymentTransaction(castHash: string, salt: string, transactionHash: string): boolean {
    const key = `${castHash}_${salt}`;
    const deployment = this.pendingDeployments.get(key);
    
    if (!deployment) {
      return false;
    }

    deployment.transactionHash = transactionHash;
    this.pendingDeployments.set(key, deployment);

    console.log(`[DeploymentTracker] Updated deployment with transaction hash:`, {
      key,
      transactionHash
    });

    return true;
  }

  // Find and match a pending deployment based on token creation event
  matchDeployment(tokenCreationData: {
    tokenName: string;
    tokenSymbol: string;
    msgSender: string;
    transactionHash?: string;
    tokenAddress?: string;
  }): PendingDeployment | null {
    console.log(`[DeploymentTracker] Attempting to match deployment:`, tokenCreationData);

    for (const [key, deployment] of this.pendingDeployments.entries()) {
      if (deployment.matched) {
        continue; // Skip already matched deployments
      }

      // Match criteria:
      // 1. Token name and symbol must match
      // 2. Creator address should match (if available)
      // 3. Transaction hash should match (if available)
      const nameMatch = deployment.expectedTokenName.toLowerCase() === tokenCreationData.tokenName.toLowerCase();
      const symbolMatch = deployment.expectedTokenSymbol.toLowerCase() === tokenCreationData.tokenSymbol.toLowerCase();
      
      // Creator match (more flexible since addresses might be normalized differently)
      const creatorMatch = !deployment.expectedCreator || 
        deployment.expectedCreator.toLowerCase() === tokenCreationData.msgSender.toLowerCase();
      
      // Transaction hash match (if we have both)
      const txHashMatch = !deployment.transactionHash || !tokenCreationData.transactionHash ||
        deployment.transactionHash.toLowerCase() === tokenCreationData.transactionHash.toLowerCase();

      if (nameMatch && symbolMatch && creatorMatch && txHashMatch) {
        console.log(`[DeploymentTracker] ✅ Found matching deployment:`, {
          key,
          deployment: {
            type: deployment.deploymentType,
            castHash: deployment.castHash,
            tokenName: deployment.expectedTokenName,
            tokenSymbol: deployment.expectedTokenSymbol
          }
        });

        // Mark as matched
        deployment.matched = true;
        deployment.transactionHash = tokenCreationData.transactionHash || deployment.transactionHash;
        this.pendingDeployments.set(key, deployment);

        return deployment;
      }
    }

    console.log(`[DeploymentTracker] ❌ No matching deployment found for token creation`);
    return null;
  }

  // Get pending deployments (for debugging)
  getPendingDeployments(): PendingDeployment[] {
    return Array.from(this.pendingDeployments.values());
  }

  // Clean up old and matched deployments
  private cleanup(): void {
    const now = new Date();
    const keysToRemove: string[] = [];

    for (const [key, deployment] of this.pendingDeployments.entries()) {
      const age = now.getTime() - deployment.timestamp.getTime();
      
      // Remove if too old or already matched
      if (age > this.TTL || deployment.matched) {
        keysToRemove.push(key);
      }
    }

    keysToRemove.forEach(key => {
      const deployment = this.pendingDeployments.get(key);
      console.log(`[DeploymentTracker] Removing deployment:`, {
        key,
        reason: deployment?.matched ? 'matched' : 'expired',
        type: deployment?.deploymentType
      });
      this.pendingDeployments.delete(key);
    });
  }

  // Get stats for debugging
  getStats() {
    const deployments = Array.from(this.pendingDeployments.values());
    const tgcCount = deployments.filter(d => d.deploymentType === 'tgc').length;
    const feyTokenCount = deployments.filter(d => d.deploymentType === 'fey_token').length;
    const matchedCount = deployments.filter(d => d.matched).length;

    return {
      total: deployments.length,
      tgc: tgcCount,
      feyToken: feyTokenCount,
      matched: matchedCount,
      pending: deployments.length - matchedCount
    };
  }
}

// Export singleton instance
export const deploymentTracker = new DeploymentTracker();