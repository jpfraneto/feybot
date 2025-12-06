// Wallet Integration for FEY Token Deployment
// Integrates Farcaster wallet with FEY SDK for actual token deployment

export interface WalletDeploymentConfig {
  tokenName: string;
  tokenSymbol: string;
  tokenImage: string;
  feePercentage: number;
  initialLiquidity: string; // in wei
  tickSpacing: number;
  description?: string;
  castHash: string;
  deploymentType: 'tgc' | 'fey_token';
}

export interface WalletConnectionState {
  isConnected: boolean;
  address?: string;
  error?: string;
}

// JavaScript code to inject into miniapp for wallet integration
export function getWalletIntegrationScript(): string {
  return `
    // Farcaster Wallet Integration with FEY SDK
    class FeyWalletIntegration {
      constructor() {
        this.sdk = null;
        this.account = null;
        this.isConnected = false;
        this.initializeFarcasterSDK();
      }

      async initializeFarcasterSDK() {
        try {
          // Import Farcaster miniapp SDK
          if (typeof window.farcasterSdk === 'undefined') {
            const { sdk } = await import('https://esm.sh/@farcaster/miniapp-sdk');
            window.farcasterSdk = sdk;
          }
          
          await window.farcasterSdk.actions.ready();
          console.log('[FeyWallet] Farcaster SDK initialized');
          
          // Check if wallet is connected
          await this.checkConnection();
        } catch (error) {
          console.error('[FeyWallet] Failed to initialize Farcaster SDK:', error);
        }
      }

      async checkConnection() {
        try {
          if (window.farcasterSdk) {
            // Get user context from Farcaster
            const context = await window.farcasterSdk.context;
            if (context?.user) {
              this.account = context.user;
              this.isConnected = true;
              this.updateConnectionUI(true);
              console.log('[FeyWallet] Connected user:', context.user);
            }
          }
        } catch (error) {
          console.error('[FeyWallet] Connection check failed:', error);
          this.updateConnectionUI(false, error.message);
        }
      }

      async connectWallet() {
        try {
          // For Farcaster miniapps, wallet is automatically connected through frame context
          if (!this.isConnected) {
            await this.checkConnection();
          }
          
          if (!this.isConnected) {
            throw new Error('Wallet connection not available in this context');
          }
          
          return this.account;
        } catch (error) {
          console.error('[FeyWallet] Wallet connection failed:', error);
          this.updateConnectionUI(false, error.message);
          throw error;
        }
      }

      async deployFeyToken(config) {
        try {
          console.log('[FeyWallet] Starting FEY token deployment:', config);
          
          if (!this.isConnected) {
            await this.connectWallet();
          }

          // Show loading state
          this.updateDeploymentUI('loading', 'Preparing deployment transaction...');

          // Load FEY SDK if not already loaded
          if (!window.FeySDK) {
            await this.loadFeySDK();
          }

          // Initialize FEY SDK with connected wallet
          const feySDK = new window.FeySDK({
            chainId: 8453, // Base
            rpcUrl: 'https://mainnet.base.org',
            // The SDK will use the Farcaster wallet context
          });

          // Prepare deployment parameters
          const deploymentParams = {
            tokenName: config.tokenName,
            tokenSymbol: config.tokenSymbol,
            tokenImage: config.tokenImage,
            initialLiquidity: config.initialLiquidity,
            feePercentage: config.feePercentage,
            tickSpacing: config.tickSpacing,
            description: config.description
          };

          console.log('[FeyWallet] Deployment parameters:', deploymentParams);

          this.updateDeploymentUI('loading', 'Deploying token on FEY Protocol...');

          // Deploy token using FEY SDK
          const result = await feySDK.deployToken(deploymentParams, {
            account: this.account,
            confirmations: 1
          });

          console.log('[FeyWallet] Deployment result:', result);

          // Update tracking system
          await this.updateDeploymentTracking(config.castHash, result);

          this.updateDeploymentUI('success', 'Token deployed successfully!', result);

          // Compose success cast
          await this.composeCastForDeployment(config, result);

          return result;

        } catch (error) {
          console.error('[FeyWallet] Token deployment failed:', error);
          this.updateDeploymentUI('error', error.message || 'Deployment failed');
          throw error;
        }
      }

      async loadFeySDK() {
        try {
          // Load FEY SDK from static route
          if (!window.FeySDK) {
            const script = document.createElement('script');
            script.src = '/static/fey-sdk.js';
            script.async = true;
            
            return new Promise((resolve, reject) => {
              script.onload = () => {
                console.log('[FeyWallet] FEY SDK loaded successfully');
                resolve();
              };
              script.onerror = reject;
              document.head.appendChild(script);
            });
          }
        } catch (error) {
          console.error('[FeyWallet] Failed to load FEY SDK:', error);
          throw new Error('Failed to load FEY SDK');
        }
      }

      async updateDeploymentTracking(castHash, deploymentResult) {
        try {
          // Update our backend tracking system
          const response = await fetch('/api/deployment-tracker/update', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              castHash,
              transactionHash: deploymentResult.txHash,
              tokenAddress: deploymentResult.predictedAddress,
              status: 'completed'
            })
          });
          
          if (!response.ok) {
            console.warn('[FeyWallet] Failed to update deployment tracking');
          }
        } catch (error) {
          console.warn('[FeyWallet] Deployment tracking update failed:', error);
        }
      }

      async composeCastForDeployment(config, result) {
        try {
          const castText = \`✨ Token deployed successfully on FEY Protocol!

🪙 \${config.tokenName} (\${config.tokenSymbol})
💎 Fee to Feythful: \${config.feePercentage}%
🏊 Initial Liquidity: \${parseFloat(config.initialLiquidity) / 1e18} ETH
🔮 Token Address: \${result.predictedAddress}

🌊 Trade on: https://basescan.org/address/\${result.predictedAddress}

#FeyProtocol #BaseChain #TokenLaunch\`;

          await window.farcasterSdk.actions.composeCast({
            text: castText
          });

          console.log('[FeyWallet] Success cast composed');
        } catch (error) {
          console.warn('[FeyWallet] Failed to compose success cast:', error);
        }
      }

      updateConnectionUI(connected, error = null) {
        const statusEl = document.getElementById('wallet-status');
        const connectBtn = document.getElementById('connect-wallet-btn');
        const deployBtn = document.getElementById('deploy-btn');
        
        if (statusEl) {
          if (connected) {
            statusEl.innerHTML = \`
              <div style="color: #4FC65F; display: flex; align-items: center; gap: 0.5rem;">
                <span style="width: 8px; height: 8px; background: #4FC65F; border-radius: 50%;"></span>
                Wallet Connected
              </div>\`;
          } else {
            statusEl.innerHTML = \`
              <div style="color: #ff4444; display: flex; align-items: center; gap: 0.5rem;">
                <span style="width: 8px; height: 8px; background: #ff4444; border-radius: 50%;"></span>
                \${error || 'Wallet Not Connected'}
              </div>\`;
          }
        }
        
        if (connectBtn) {
          connectBtn.style.display = connected ? 'none' : 'block';
        }
        
        if (deployBtn) {
          deployBtn.disabled = !connected;
          if (connected) {
            deployBtn.innerHTML = deployBtn.innerHTML.replace('Connect Wallet to Deploy', 'Deploy Token');
          }
        }
      }

      updateDeploymentUI(status, message, result = null) {
        const resultEl = document.getElementById('deployment-result');
        const deployBtn = document.getElementById('deploy-btn');
        
        if (deployBtn) {
          if (status === 'loading') {
            deployBtn.classList.add('loading');
            deployBtn.disabled = true;
          } else {
            deployBtn.classList.remove('loading');
            deployBtn.disabled = false;
          }
        }
        
        if (resultEl) {
          if (status === 'success') {
            resultEl.innerHTML = \`
              <div style="background: rgba(79, 198, 95, 0.2); border: 1px solid #4FC65F; border-radius: 8px; padding: 1rem; margin-top: 1rem;">
                <h4 style="color: #4FC65F; margin-bottom: 0.5rem;">✅ \${message}</h4>
                <div style="font-size: 0.9rem; color: #3EA34B;">
                  <p><strong>Token Address:</strong> \${result?.predictedAddress || 'Pending...'}</p>
                  <p><strong>Transaction:</strong> \${result?.txHash || 'Pending...'}</p>
                  <p><strong>Network:</strong> Base</p>
                </div>
                \${result?.predictedAddress ? \`
                  <div style="margin-top: 1rem;">
                    <a href="https://basescan.org/address/\${result.predictedAddress}" target="_blank" 
                       style="background: #4FC65F; color: #000; padding: 0.5rem 1rem; border-radius: 6px; text-decoration: none; font-weight: bold;">
                      View on BaseScan
                    </a>
                  </div>
                \` : ''}
              </div>\`;
          } else if (status === 'error') {
            resultEl.innerHTML = \`
              <div style="background: rgba(255, 68, 68, 0.2); border: 1px solid #ff4444; border-radius: 8px; padding: 1rem; margin-top: 1rem;">
                <h4 style="color: #ff4444; margin-bottom: 0.5rem;">❌ Deployment Failed</h4>
                <p style="color: #ff6666;">\${message}</p>
              </div>\`;
          } else if (status === 'loading') {
            resultEl.innerHTML = \`
              <div style="background: rgba(79, 198, 95, 0.1); border: 1px solid #4FC65F; border-radius: 8px; padding: 1rem; margin-top: 1rem; text-align: center;">
                <div style="color: #4FC65F; margin-bottom: 0.5rem;">
                  <div style="display: inline-block; width: 20px; height: 20px; border: 2px solid transparent; border-top: 2px solid #4FC65F; border-radius: 50%; animation: spin 1s linear infinite;"></div>
                </div>
                <p style="color: #3EA34B;">\${message}</p>
              </div>\`;
          }
        }
      }

      getFormData() {
        const form = document.querySelector('form');
        const formData = new FormData(form);
        
        return {
          tokenName: formData.get('tokenName'),
          tokenSymbol: formData.get('tokenSymbol'), 
          tokenImage: formData.get('tokenImage'),
          tokenDescription: formData.get('tokenDescription'),
          feePercentage: parseInt(formData.get('feePercentage')),
          initialLiquidity: (parseFloat(formData.get('initialLiquidity')) * 1e18).toString(),
          tickSpacing: parseInt(formData.get('tickSpacing')),
          castHash: formData.get('castHash')
        };
      }
    }

    // Initialize wallet integration
    window.feyWallet = new FeyWalletIntegration();

    // Global deployment function
    window.deployWithWallet = async function() {
      try {
        const config = window.feyWallet.getFormData();
        config.deploymentType = 'fey_token';
        
        await window.feyWallet.deployFeyToken(config);
      } catch (error) {
        console.error('Deployment failed:', error);
      }
    };

    // Global connect function
    window.connectWallet = async function() {
      try {
        await window.feyWallet.connectWallet();
      } catch (error) {
        console.error('Wallet connection failed:', error);
      }
    };

    // Auto-connect on page load
    document.addEventListener('DOMContentLoaded', () => {
      window.feyWallet.checkConnection();
    });
  `;
}