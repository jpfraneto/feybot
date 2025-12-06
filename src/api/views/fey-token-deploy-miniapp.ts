// FEY Token Deployment Miniapp View
import { getFeybotSVG, getSVGStyles } from '../components/feybot-svg.js';
import type { StoredCastData } from '../utils/cast-store.js';
import { getWalletIntegrationScript } from '../utils/wallet-integration.js';

export function getFeyTokenDeployMiniappView(castHash: string, storedCast?: StoredCastData): string {
  const feePercentage = storedCast?.feyTokenParams?.feePercentage || 49;
  
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Feybot - Deploy FEY Token</title>
        <meta name="fc:miniapp" content='{"version":"1","imageUrl":"https://fresh.anky.app/static/og-image.svg","button":{"title":"Deploy Token","action":{"type":"launch_miniapp","name":"Feybot Token Deploy","url":"${process.env.BASE_URL || 'https://fresh.anky.app'}/miniapp-fey-deploy/${castHash}","splashImageUrl":"https://fresh.anky.app/static/icon.svg","splashBackgroundColor":"#0C6300"}}}' />
        <script src="https://unpkg.com/htmx.org@1.9.10"></script>
        <script src="https://unpkg.com/hyperscript.org@0.9.12"></script>
        <script type="module" src="https://esm.sh/@farcaster/miniapp-sdk"></script>
        
        ${getSVGStyles()}
        
        <style>
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }
            
            body {
                font-family: 'Courier New', monospace;
                background: linear-gradient(135deg, #000 0%, #0C6300 100%);
                color: #4FC65F;
                min-height: 100vh;
                padding: 1rem;
            }
            
            .container {
                max-width: 800px;
                margin: 0 auto;
                background: rgba(0, 0, 0, 0.8);
                border-radius: 20px;
                padding: 2rem;
                backdrop-filter: blur(10px);
                border: 1px solid #4FC65F;
                box-shadow: 0 0 30px rgba(79, 198, 95, 0.3);
            }
            
            .header {
                text-align: center;
                margin-bottom: 2rem;
            }
            
            .header h1 {
                font-size: 2.5rem;
                font-weight: bold;
                margin-bottom: 0.5rem;
                text-shadow: 0 0 20px #4FC65F;
                background: linear-gradient(45deg, #4FC65F, #3EA34B);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                background-clip: text;
            }
            
            .header .subtitle {
                font-size: 1rem;
                opacity: 0.9;
                margin-bottom: 1rem;
            }
            
            .cast-info {
                background: rgba(79, 198, 95, 0.1);
                border: 1px solid #4FC65F;
                border-radius: 10px;
                padding: 1rem;
                margin-bottom: 1rem;
                font-size: 0.9rem;
                line-height: 1.4;
            }
            
            .token-media-section {
                background: rgba(79, 198, 95, 0.05);
                border: 1px solid #3EA34B;
                border-radius: 10px;
                padding: 1.5rem;
                margin-bottom: 2rem;
                text-align: center;
            }
            
            .token-media-section h3 {
                color: #4FC65F;
                margin-bottom: 1rem;
                font-size: 1.2rem;
            }
            
            .token-media-image {
                max-width: 300px;
                max-height: 300px;
                width: auto;
                height: auto;
                border-radius: 10px;
                border: 2px solid #4FC65F;
                box-shadow: 0 0 20px rgba(79, 198, 95, 0.3);
                display: block;
                margin: 0 auto;
            }
            
            .media-source {
                font-size: 0.8rem;
                color: #3EA34B;
                margin-top: 0.5rem;
                font-style: italic;
            }
            
            .form-section {
                margin-bottom: 2rem;
            }
            
            .form-section h3 {
                font-size: 1.3rem;
                margin-bottom: 1rem;
                color: #4FC65F;
                border-bottom: 1px solid #3EA34B;
                padding-bottom: 0.5rem;
            }
            
            .form-grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 1rem;
                margin-bottom: 1rem;
            }
            
            .form-field {
                display: flex;
                flex-direction: column;
                gap: 0.5rem;
            }
            
            .form-field.full-width {
                grid-column: 1 / -1;
            }
            
            .form-field label {
                font-size: 0.9rem;
                color: #4FC65F;
                font-weight: bold;
            }
            
            .form-field input,
            .form-field textarea,
            .form-field select {
                background: rgba(0, 0, 0, 0.5);
                border: 1px solid #3EA34B;
                border-radius: 8px;
                padding: 0.8rem;
                color: #4FC65F;
                font-family: 'Courier New', monospace;
                font-size: 0.9rem;
                transition: all 0.3s ease;
            }
            
            .form-field input:focus,
            .form-field textarea:focus,
            .form-field select:focus {
                outline: none;
                border-color: #4FC65F;
                box-shadow: 0 0 10px rgba(79, 198, 95, 0.3);
            }
            
            .form-field input[readonly] {
                background: rgba(79, 198, 95, 0.1);
                border-color: #3EA34B;
                cursor: not-allowed;
                color: #3EA34B;
            }
            
            /* Fee Slider Styles */
            .fee-slider-container {
                background: rgba(79, 198, 95, 0.05);
                border: 1px solid #3EA34B;
                border-radius: 10px;
                padding: 1.5rem;
                margin-bottom: 2rem;
            }
            
            .fee-slider-container h3 {
                color: #4FC65F;
                margin-bottom: 1rem;
                font-size: 1.2rem;
            }
            
            .slider-wrapper {
                position: relative;
                margin: 1.5rem 0;
            }
            
            .fee-slider {
                width: 100%;
                height: 8px;
                border-radius: 5px;
                background: linear-gradient(to right, 
                    #ff4444 0%, #ffaa44 25%, #44ff44 50%, #4FC65F 75%, #3EA34B 100%);
                outline: none;
                opacity: 0.7;
                transition: opacity 0.2s;
                -webkit-appearance: none;
            }
            
            .fee-slider:hover {
                opacity: 1;
            }
            
            .fee-slider::-webkit-slider-thumb {
                -webkit-appearance: none;
                appearance: none;
                width: 24px;
                height: 24px;
                border-radius: 50%;
                background: #4FC65F;
                border: 2px solid #fff;
                cursor: pointer;
                box-shadow: 0 0 10px rgba(79, 198, 95, 0.5);
            }
            
            .fee-slider::-moz-range-thumb {
                width: 24px;
                height: 24px;
                border-radius: 50%;
                background: #4FC65F;
                border: 2px solid #fff;
                cursor: pointer;
                box-shadow: 0 0 10px rgba(79, 198, 95, 0.5);
            }
            
            .fee-display {
                text-align: center;
                margin-top: 1rem;
                font-size: 1.5rem;
                font-weight: bold;
                color: #4FC65F;
                text-shadow: 0 0 10px rgba(79, 198, 95, 0.3);
            }
            
            .fee-description {
                text-align: center;
                margin-top: 0.5rem;
                font-size: 0.9rem;
                color: #3EA34B;
                line-height: 1.4;
            }
            
            .fee-markers {
                display: flex;
                justify-content: space-between;
                margin-top: 0.5rem;
                font-size: 0.8rem;
                color: #3EA34B;
            }
            
            .action-buttons {
                display: flex;
                gap: 1rem;
                justify-content: center;
                margin-top: 2rem;
            }
            
            .btn {
                padding: 1.5rem 3rem;
                border: none;
                border-radius: 15px;
                font-family: 'Courier New', monospace;
                font-weight: bold;
                cursor: pointer;
                transition: all 0.3s ease;
                text-transform: uppercase;
                letter-spacing: 2px;
                font-size: 1.1rem;
                position: relative;
                overflow: hidden;
            }
            
            .btn-primary {
                background: linear-gradient(45deg, #4FC65F, #3EA34B);
                color: #000;
                box-shadow: 0 0 30px rgba(79, 198, 95, 0.3);
                border: 2px solid transparent;
            }
            
            .btn-primary:hover {
                transform: scale(1.05);
                box-shadow: 0 0 50px rgba(79, 198, 95, 0.6);
            }
            
            .btn-primary:active {
                transform: scale(0.95);
            }
            
            .btn-primary::before {
                content: '';
                position: absolute;
                top: -50%;
                left: -50%;
                width: 200%;
                height: 200%;
                background: linear-gradient(45deg, transparent, rgba(255,255,255,0.3), transparent);
                transform: rotate(45deg);
                transition: all 0.5s;
                opacity: 0;
            }
            
            .btn-primary:hover::before {
                animation: shine 0.5s ease-out;
            }
            
            @keyframes shine {
                0% {
                    transform: translateX(-100%) translateY(-100%) rotate(45deg);
                    opacity: 0;
                }
                50% {
                    opacity: 1;
                }
                100% {
                    transform: translateX(100%) translateY(100%) rotate(45deg);
                    opacity: 0;
                }
            }
            
            .btn-secondary {
                background: transparent;
                color: #4FC65F;
                border: 2px solid #4FC65F;
            }
            
            .btn-secondary:hover {
                background: rgba(79, 198, 95, 0.1);
                transform: scale(1.02);
            }
            
            .loading {
                opacity: 0.7;
                pointer-events: none;
                position: relative;
            }
            
            .loading::after {
                content: '';
                position: absolute;
                top: 50%;
                left: 50%;
                width: 20px;
                height: 20px;
                border: 2px solid transparent;
                border-top: 2px solid #4FC65F;
                border-radius: 50%;
                animation: spin 1s linear infinite;
                transform: translate(-50%, -50%);
            }
            
            @keyframes spin {
                0% { transform: translate(-50%, -50%) rotate(0deg); }
                100% { transform: translate(-50%, -50%) rotate(360deg); }
            }
            
            .success-message,
            .error-message {
                margin: 1rem 0;
                padding: 1rem;
                border-radius: 8px;
                font-size: 0.9rem;
                display: none;
            }
            
            .success-message {
                background: rgba(79, 198, 95, 0.2);
                border: 1px solid #4FC65F;
                color: #4FC65F;
            }
            
            .error-message {
                background: rgba(255, 0, 0, 0.2);
                border: 1px solid #ff4444;
                color: #ff4444;
            }
            
            /* Wallet Connection Styles */
            .wallet-section {
                background: rgba(79, 198, 95, 0.05);
                border: 1px solid #3EA34B;
                border-radius: 10px;
                padding: 1.5rem;
                margin-bottom: 2rem;
            }
            
            .wallet-status {
                display: flex;
                align-items: center;
                justify-content: space-between;
                margin-bottom: 1rem;
            }
            
            .connect-wallet-btn {
                background: linear-gradient(45deg, #4FC65F, #3EA34B);
                color: #000;
                border: none;
                padding: 0.8rem 1.5rem;
                border-radius: 8px;
                font-family: 'Courier New', monospace;
                font-weight: bold;
                cursor: pointer;
                transition: all 0.3s ease;
            }
            
            .connect-wallet-btn:hover {
                transform: scale(1.05);
                box-shadow: 0 0 20px rgba(79, 198, 95, 0.3);
            }
            
            .fractal-corner {
                position: fixed;
                bottom: 20px;
                right: 20px;
                width: 80px;
                height: 80px;
                opacity: 0.3;
                pointer-events: none;
            }
            
            @media (max-width: 768px) {
                .form-grid {
                    grid-template-columns: 1fr;
                }
                
                .action-buttons {
                    flex-direction: column;
                    align-items: center;
                }
                
                .btn {
                    width: 100%;
                    max-width: 300px;
                }
                
                .header h1 {
                    font-size: 2rem;
                }
                
                .container {
                    margin: 0;
                    border-radius: 0;
                    min-height: 100vh;
                }
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Deploy FEY Token</h1>
                <p class="subtitle">Simple Token Deployment on Fey Protocol</p>
            </div>
            
            <div class="cast-info">
                <strong>📍 Reply to Cast:</strong> ${castHash.slice(0, 10)}...${castHash.slice(-6)}
                ${storedCast ? `
                    <br><strong>👤 Author:</strong> @${storedCast.author.username}
                    <br><strong>💬 Text:</strong> "${storedCast.text.slice(0, 100)}${storedCast.text.length > 100 ? '...' : ''}"
                ` : ''}
            </div>
            
            ${storedCast?.media.isValid && storedCast.media.mediaUrl ? `
                <div class="token-media-section">
                    <h3>🎨 Token Official Media</h3>
                    <div class="media-preview">
                        <img src="${storedCast.media.mediaUrl}" alt="Token Media" class="token-media-image" />
                        <p class="media-source">From original cast attachment</p>
                    </div>
                </div>
            ` : ''}
            
            <!-- Wallet Connection Section -->
            <div class="wallet-section">
                <h3>🔗 Wallet Connection</h3>
                <div class="wallet-status">
                    <div id="wallet-status">
                        <div style="color: #ffaa44; display: flex; align-items: center; gap: 0.5rem;">
                            <span style="width: 8px; height: 8px; background: #ffaa44; border-radius: 50%;"></span>
                            Checking Connection...
                        </div>
                    </div>
                    <button type="button" id="connect-wallet-btn" class="connect-wallet-btn" onclick="connectWallet()" style="display: none;">
                        Connect Wallet
                    </button>
                </div>
                <p style="font-size: 0.8rem; color: #3EA34B; margin-top: 0.5rem;">
                    🔮 Your Farcaster wallet will be used for token deployment on Base
                </p>
            </div>

            <div id="success-message" class="success-message"></div>
            <div id="error-message" class="error-message"></div>
            
            <form onsubmit="return false;">
                
                <input type="hidden" name="castHash" value="${castHash}">
                
                <div class="form-section">
                    <h3>🪙 Token Configuration</h3>
                    <div class="form-grid">
                        <div class="form-field">
                            <label for="tokenName">Token Name</label>
                            <input type="text" id="tokenName" name="tokenName" 
                                   placeholder="My FEY Token" 
                                   value="${storedCast?.feyTokenParams?.tokenName || ''}" required>
                        </div>
                        <div class="form-field">
                            <label for="tokenSymbol">Token Symbol</label>
                            <input type="text" id="tokenSymbol" name="tokenSymbol" 
                                   placeholder="MFT" 
                                   value="${storedCast?.feyTokenParams?.tokenSymbol || ''}" required maxlength="5">
                        </div>
                        <div class="form-field full-width">
                            <label for="tokenImage">Token Image URL ${storedCast?.media.isValid ? '🔒' : ''}</label>
                            <input type="url" id="tokenImage" name="tokenImage" 
                                   placeholder="https://example.com/token.png"
                                   value="${storedCast?.media.isValid && storedCast.media.mediaUrl ? storedCast.media.mediaUrl : ''}"
                                   ${storedCast?.media.isValid ? 'readonly' : ''}>
                            ${storedCast?.media.isValid ? `
                                <small style="color: #3EA34B; font-size: 0.8rem;">
                                    🔒 Using sacred media from your original cast - this will be your token's eternal image
                                </small>
                            ` : `
                                <small style="color: #ffaa44; font-size: 0.8rem;">
                                    💫 For best results, attach an image to your cast when mentioning @feybot
                                </small>
                            `}
                        </div>
                        <div class="form-field full-width">
                            <label for="tokenDescription">Token Description</label>
                            <textarea id="tokenDescription" name="tokenDescription" 
                                      placeholder="Describe your token..."
                                      rows="3">${storedCast?.feyTokenParams?.description || ''}</textarea>
                        </div>
                    </div>
                </div>
                
                <div class="fee-slider-container">
                    <h3>💰 Fee Configuration</h3>
                    <p style="color: #3EA34B; margin-bottom: 1rem;">
                        Set the percentage of trading fees that goes to "feythful" (token holders)
                    </p>
                    
                    <div class="slider-wrapper">
                        <input type="range" id="feeSlider" name="feePercentage" 
                               min="0" max="100" value="${feePercentage}" 
                               class="fee-slider">
                        <div class="fee-markers">
                            <span>0%</span>
                            <span>25%</span>
                            <span>50%</span>
                            <span>75%</span>
                            <span>100%</span>
                        </div>
                    </div>
                    
                    <div class="fee-display">
                        <span id="feeDisplay">${feePercentage}%</span> to Feythful
                    </div>
                    <div class="fee-description">
                        Higher percentages reward token holders more from trading activity
                    </div>
                </div>
                
                <div class="form-section">
                    <h3>🏊 Liquidity Configuration</h3>
                    <div class="form-grid">
                        <div class="form-field">
                            <label for="initialLiquidity">Initial Liquidity (ETH)</label>
                            <input type="number" id="initialLiquidity" name="initialLiquidity" 
                                   value="1" step="0.1" min="0.1" required>
                        </div>
                        <div class="form-field">
                            <label for="tickSpacing">Tick Spacing</label>
                            <select id="tickSpacing" name="tickSpacing" required>
                                <option value="200" selected>200 (0.02%)</option>
                                <option value="100">100 (0.01%)</option>
                                <option value="60">60 (0.006%)</option>
                                <option value="10">10 (0.001%)</option>
                            </select>
                        </div>
                    </div>
                </div>
                
                <div class="action-buttons">
                    <button type="button" class="btn btn-secondary" onclick="previewToken()">
                        Preview Token
                    </button>
                    <button type="button" class="btn btn-primary" id="deploy-btn" onclick="deployWithWallet()" disabled>
                        <span class="deploy-btn-text">Connect Wallet to Deploy</span>
                    </button>
                </div>
            </form>
            
            <div id="preview-section"></div>
            <div id="deployment-result"></div>
        </div>
        
        <div class="fractal-corner">
            ${getFeybotSVG(true)}
        </div>
        
        <script>
            ${getWalletIntegrationScript()}
        </script>
        
        <script>
            // Fee slider functionality
            const feeSlider = document.getElementById('feeSlider');
            const feeDisplay = document.getElementById('feeDisplay');
            
            feeSlider.addEventListener('input', function() {
                feeDisplay.textContent = this.value;
                
                // Change color based on value
                const value = parseInt(this.value);
                if (value < 25) {
                    feeDisplay.style.color = '#ff4444';
                } else if (value < 50) {
                    feeDisplay.style.color = '#ffaa44';
                } else if (value < 75) {
                    feeDisplay.style.color = '#44ff44';
                } else {
                    feeDisplay.style.color = '#4FC65F';
                }
            });
            
            // Auto-generate symbol from name
            document.getElementById('tokenName').addEventListener('input', function(e) {
                const name = e.target.value;
                const symbolField = document.getElementById('tokenSymbol');
                
                if (!symbolField.value || symbolField.dataset.autoGenerated) {
                    const words = name.split(' ').filter(word => word.length > 0);
                    let symbol = '';
                    
                    if (words.length === 1) {
                        symbol = words[0].slice(0, 5).toUpperCase();
                    } else {
                        symbol = words.map(word => word[0]).join('').slice(0, 5).toUpperCase();
                    }
                    
                    symbolField.value = symbol;
                    symbolField.dataset.autoGenerated = 'true';
                }
            });
            
            // Clear auto-generated flag when manually edited
            document.getElementById('tokenSymbol').addEventListener('input', function() {
                this.dataset.autoGenerated = 'false';
            });
            
            // Auto-generate image URL
            document.getElementById('tokenSymbol').addEventListener('input', function(e) {
                const symbol = e.target.value.toLowerCase();
                const imageField = document.getElementById('tokenImage');
                
                if (!imageField.value || imageField.dataset.autoGenerated) {
                    imageField.value = \`https://fresh.anky.app/token-image/\${symbol}.png\`;
                    imageField.dataset.autoGenerated = 'true';
                }
            });
            
            // Clear auto-generated flag when manually edited
            document.getElementById('tokenImage').addEventListener('input', function() {
                this.dataset.autoGenerated = 'false';
            });

            // Preview token functionality
            window.previewToken = function() {
                const config = window.feyWallet ? window.feyWallet.getFormData() : {};
                
                const previewSection = document.getElementById('preview-section');
                previewSection.innerHTML = \`
                    <div style="margin-top: 2rem; padding: 1rem; background: rgba(79, 198, 95, 0.1); border-radius: 8px;">
                        <h4>🔍 Token Preview</h4>
                        <div style="font-size: 0.9rem; line-height: 1.6;">
                            <p><strong>Token:</strong> \${config.tokenName} (\${config.tokenSymbol})</p>
                            <p><strong>Fee to Feythful:</strong> \${config.feePercentage}%</p>
                            <p><strong>Initial Liquidity:</strong> \${config.initialLiquidity ? (parseFloat(config.initialLiquidity) / 1e18).toFixed(2) : '1'} ETH</p>
                            <p><strong>Tick Spacing:</strong> \${config.tickSpacing}</p>
                            <p><strong>Description:</strong> \${config.tokenDescription || 'No description provided'}</p>
                        </div>
                        
                        <div style="margin-top: 1rem; padding: 1rem; background: rgba(79, 198, 95, 0.05); border-radius: 6px; font-size: 0.8rem; color: #3EA34B;">
                            <strong>💡 What this means:</strong><br>
                            • Your token will be deployed on the FEY protocol<br>
                            • \${config.feePercentage || 49}% of trading fees will go to token holders (feythful)<br>
                            • Initial liquidity pool will be created with \${config.initialLiquidity ? (parseFloat(config.initialLiquidity) / 1e18).toFixed(2) : '1'} ETH<br>
                            • Token will be immediately tradeable on Uniswap v4
                        </div>
                    </div>
                \`;
            };
        </script>
    </body>
    </html>
  `;
}