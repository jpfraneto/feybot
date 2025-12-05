// TGC Reply Miniapp View
import { getFeybotSVG, getSVGStyles } from '../components/feybot-svg.js';
import type { StoredCastData } from '../utils/cast-store.js';

export function getTGCReplyMiniappView(castHash: string, storedCast?: StoredCastData): string {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Feybot - Configure TGC</title>
        <meta name="fc:miniapp" content='{"version":"1","imageUrl":"https://feybot.orbiter.website/og-image.png","button":{"title":"Configure TGC","action":{"type":"launch_miniapp","name":"Feybot TGC Config","url":"${process.env.BASE_URL || 'https://feybot.orbiter.website'}/miniapp-on-reply-to/${castHash}","splashImageUrl":"https://feybot.orbiter.website/splash.png","splashBackgroundColor":"#0C6300"}}}' />
        <script src="https://unpkg.com/htmx.org@1.9.10"></script>
        <script src="https://unpkg.com/hyperscript.org@0.9.12"></script>
        
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
            
            .media-preview {
                position: relative;
                display: inline-block;
                max-width: 100%;
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
            
            .media-error {
                background: rgba(255, 0, 0, 0.1);
                border: 1px solid #ff4444;
                border-radius: 10px;
                padding: 1.5rem;
                margin-bottom: 2rem;
                text-align: center;
            }
            
            .media-error h3 {
                color: #ff4444;
                margin-bottom: 1rem;
            }
            
            .media-error p {
                color: #ff6666;
                font-size: 0.9rem;
                margin-bottom: 0.5rem;
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
            
            .form-field input[readonly]:focus {
                box-shadow: none;
                border-color: #3EA34B;
            }
            
            .form-field textarea {
                min-height: 100px;
                resize: vertical;
            }
            
            .action-buttons {
                display: flex;
                gap: 1rem;
                justify-content: center;
                margin-top: 2rem;
            }
            
            .btn {
                padding: 1rem 2rem;
                border: none;
                border-radius: 10px;
                font-family: 'Courier New', monospace;
                font-weight: bold;
                cursor: pointer;
                transition: all 0.3s ease;
                text-transform: uppercase;
                letter-spacing: 1px;
                font-size: 0.9rem;
            }
            
            .btn-primary {
                background: linear-gradient(45deg, #4FC65F, #3EA34B);
                color: #000;
                box-shadow: 0 0 20px rgba(79, 198, 95, 0.3);
            }
            
            .btn-primary:hover {
                transform: scale(1.05);
                box-shadow: 0 0 30px rgba(79, 198, 95, 0.5);
            }
            
            .btn-secondary {
                background: transparent;
                color: #4FC65F;
                border: 1px solid #4FC65F;
            }
            
            .btn-secondary:hover {
                background: rgba(79, 198, 95, 0.1);
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
            
            .fractal-corner {
                position: fixed;
                bottom: 20px;
                right: 20px;
                width: 80px;
                height: 80px;
                opacity: 0.3;
                pointer-events: none;
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
            
            @media (max-width: 768px) {
                .form-grid {
                    grid-template-columns: 1fr;
                }
                
                .action-buttons {
                    flex-direction: column;
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
                <h1>Configure TGC</h1>
                <p class="subtitle">Token Generation Ceremony Setup</p>
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
            ` : storedCast?.media.error ? `
                <div class="media-error">
                    <h3>⚠️ Media Issue</h3>
                    <p>${storedCast.media.error}</p>
                    <p>Please try again with exactly one image or video attached to your cast.</p>
                </div>
            ` : ''}
            
            <div id="success-message" class="success-message"></div>
            <div id="error-message" class="error-message"></div>
            
            <form hx-post="/api/tgc/generate-transaction"
                  hx-target="#transaction-result"
                  hx-swap="innerHTML"
                  hx-on::before-request="this.querySelector('.btn-primary').classList.add('loading')"
                  hx-on::after-request="this.querySelector('.btn-primary').classList.remove('loading')">
                
                <input type="hidden" name="castHash" value="${castHash}">
                
                <div class="form-section">
                    <h3>🪙 Token Configuration</h3>
                    <div class="form-grid">
                        <div class="form-field">
                            <label for="tokenName">Token Name</label>
                            <input type="text" id="tokenName" name="tokenName" 
                                   placeholder="My Awesome Token" 
                                   value="${storedCast?.tgcParams?.token.name || ''}" required>
                        </div>
                        <div class="form-field">
                            <label for="tokenSymbol">Token Symbol</label>
                            <input type="text" id="tokenSymbol" name="tokenSymbol" 
                                   placeholder="MAT" 
                                   value="${storedCast?.tgcParams?.token.symbol || ''}" required maxlength="5">
                        </div>
                        <div class="form-field full-width">
                            <label for="tokenImage">Token Image URL ${storedCast?.media.isValid ? '🔒' : ''}</label>
                            <input type="url" id="tokenImage" name="tokenImage" 
                                   placeholder="https://example.com/token.png"
                                   value="${storedCast?.media.isValid ? storedCast.media.mediaUrl : ''}"
                                   ${storedCast?.media.isValid ? 'readonly' : ''}>
                            ${storedCast?.media.isValid ? `
                                <small style="color: #3EA34B; font-size: 0.8rem;">
                                    🔒 Using media from original cast - cannot be changed
                                </small>
                            ` : ''}
                        </div>
                    </div>
                </div>
                
                <div class="form-section">
                    <h3>💰 Contribution Caps</h3>
                    <div class="form-grid">
                        <div class="form-field">
                            <label for="communityContributionCap">Community Cap (ETH)</label>
                            <input type="number" id="communityContributionCap" name="communityContributionCap" 
                                   value="10" step="0.1" min="0" required>
                        </div>
                        <div class="form-field">
                            <label for="teamContributionCap">Team Cap (ETH)</label>
                            <input type="number" id="teamContributionCap" name="teamContributionCap" 
                                   value="5" step="0.1" min="0" required>
                        </div>
                        <div class="form-field">
                            <label for="minCommunityDeposit">Min Deposit (ETH)</label>
                            <input type="number" id="minCommunityDeposit" name="minCommunityDeposit" 
                                   value="0.1" step="0.01" min="0" required>
                        </div>
                        <div class="form-field">
                            <label for="maxCommunityDeposit">Max Deposit (ETH)</label>
                            <input type="number" id="maxCommunityDeposit" name="maxCommunityDeposit" 
                                   value="1" step="0.1" min="0" required>
                        </div>
                    </div>
                </div>
                
                <div class="form-section">
                    <h3>🎯 Liquidity Configuration</h3>
                    <div class="form-grid">
                        <div class="form-field">
                            <label for="tickSpacing">Tick Spacing</label>
                            <select id="tickSpacing" name="tickSpacing" required>
                                <option value="200" selected>200 (0.02%)</option>
                                <option value="100">100 (0.01%)</option>
                                <option value="60">60 (0.006%)</option>
                                <option value="10">10 (0.001%)</option>
                            </select>
                        </div>
                        <div class="form-field">
                            <label for="tickLower">Tick Lower</label>
                            <input type="number" id="tickLower" name="tickLower" value="-887200" required>
                        </div>
                        <div class="form-field">
                            <label for="tickUpper">Tick Upper</label>
                            <input type="number" id="tickUpper" name="tickUpper" value="887200" required>
                        </div>
                    </div>
                </div>
                
                <div class="action-buttons">
                    <button type="button" class="btn btn-secondary" 
                            hx-get="/api/tgc/preview-parameters"
                            hx-include="this"
                            hx-target="#preview-section">
                        Preview Parameters
                    </button>
                    <button type="submit" class="btn btn-primary">
                        Generate Transaction
                    </button>
                </div>
            </form>
            
            <div id="preview-section"></div>
            <div id="transaction-result"></div>
        </div>
        
        <div class="fractal-corner">
            ${getFeybotSVG(true)}
        </div>
        
        <script>
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
                    imageField.value = \`https://feybot.orbiter.website/token-image/\${symbol}.png\`;
                    imageField.dataset.autoGenerated = 'true';
                }
            });
            
            // Clear auto-generated flag when manually edited
            document.getElementById('tokenImage').addEventListener('input', function() {
                this.dataset.autoGenerated = 'false';
            });
        </script>
    </body>
    </html>
  `;
}