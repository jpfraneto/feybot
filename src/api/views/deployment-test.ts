// Test interface for deployment functionality

export function getDeploymentTestView(): string {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>FEY Deployment Test</title>
        <style>
            body {
                font-family: 'Courier New', monospace;
                background: #000;
                color: #4FC65F;
                padding: 2rem;
                max-width: 800px;
                margin: 0 auto;
            }
            
            .test-section {
                background: rgba(79, 198, 95, 0.1);
                border: 1px solid #4FC65F;
                border-radius: 10px;
                padding: 1.5rem;
                margin-bottom: 2rem;
            }
            
            .btn {
                background: linear-gradient(45deg, #4FC65F, #3EA34B);
                color: #000;
                border: none;
                padding: 1rem 2rem;
                border-radius: 8px;
                font-family: 'Courier New', monospace;
                font-weight: bold;
                cursor: pointer;
                margin: 0.5rem;
                transition: all 0.3s ease;
            }
            
            .btn:hover {
                transform: scale(1.05);
                box-shadow: 0 0 20px rgba(79, 198, 95, 0.3);
            }
            
            .result {
                background: rgba(0, 0, 0, 0.5);
                border: 1px solid #3EA34B;
                border-radius: 8px;
                padding: 1rem;
                margin-top: 1rem;
                white-space: pre-wrap;
                font-size: 0.8rem;
            }
        </style>
    </head>
    <body>
        <h1>🔮 FEY Protocol Deployment Test</h1>
        
        <div class="test-section">
            <h2>📊 System Status</h2>
            <button class="btn" onclick="checkHealth()">Check Health</button>
            <button class="btn" onclick="checkTracker()">Check Deployment Tracker</button>
            <div id="health-result" class="result"></div>
        </div>
        
        <div class="test-section">
            <h2>🎭 Intent Analysis Test</h2>
            <textarea id="cast-text" placeholder="Enter cast text to analyze..." 
                      style="width: 100%; height: 100px; background: rgba(0,0,0,0.5); color: #4FC65F; border: 1px solid #3EA34B; padding: 1rem; border-radius: 8px; font-family: 'Courier New', monospace;">
            @feybot I want to deploy a token called "Test Token" with 25% fees to feythful
            </textarea>
            <br>
            <button class="btn" onclick="testAnalysis()">Test Intent Analysis</button>
            <div id="analysis-result" class="result"></div>
        </div>
        
        <div class="test-section">
            <h2>🌐 Webhook Simulation</h2>
            <p>Simulate webhook processing with different scenarios:</p>
            <button class="btn" onclick="simulateWebhook('tgc')">Simulate TGC Intent</button>
            <button class="btn" onclick="simulateWebhook('fey_token')">Simulate FEY Token Intent</button>
            <button class="btn" onclick="simulateWebhook('general')">Simulate General Query</button>
            <div id="webhook-result" class="result"></div>
        </div>
        
        <script>
            async function checkHealth() {
                try {
                    const response = await fetch('/check-health');
                    const data = await response.json();
                    document.getElementById('health-result').textContent = JSON.stringify(data, null, 2);
                } catch (error) {
                    document.getElementById('health-result').textContent = 'Error: ' + error.message;
                }
            }
            
            async function checkTracker() {
                try {
                    const response = await fetch('/api/deployment-tracker/stats');
                    const data = await response.json();
                    document.getElementById('health-result').textContent = JSON.stringify(data, null, 2);
                } catch (error) {
                    document.getElementById('health-result').textContent = 'Error: ' + error.message;
                }
            }
            
            async function testAnalysis() {
                const castText = document.getElementById('cast-text').value;
                if (!castText.trim()) {
                    alert('Please enter cast text to analyze');
                    return;
                }
                
                try {
                    document.getElementById('analysis-result').textContent = 'Analyzing...';
                    
                    // This would normally be called internally, but we'll simulate it
                    document.getElementById('analysis-result').textContent = 
                        'Intent Analysis would process this text and determine:\\n' +
                        '1. Intent Type (tgc/fey_token/none)\\n' +
                        '2. Extracted parameters (token name, symbol, fee %, etc.)\\n' +
                        '3. Confidence score\\n' +
                        '4. Reasoning\\n\\n' +
                        'Cast text: ' + castText;
                } catch (error) {
                    document.getElementById('analysis-result').textContent = 'Error: ' + error.message;
                }
            }
            
            function simulateWebhook(type) {
                const webhookData = {
                    tgc: {
                        data: {
                            hash: '0x123abc',
                            text: '@feybot start a TGC for CommunityToken with 10 ETH community cap',
                            author: {
                                fid: 12345,
                                username: 'testuser',
                                display_name: 'Test User'
                            },
                            embeds: [{
                                url: 'https://example.com/token.png',
                                metadata: { content_type: 'image/png' }
                            }]
                        }
                    },
                    fey_token: {
                        data: {
                            hash: '0x456def',
                            text: '@feybot deploy a token called TestCoin with 30% fees to feythful',
                            author: {
                                fid: 67890,
                                username: 'creator',
                                display_name: 'Token Creator'
                            },
                            embeds: [{
                                url: 'https://example.com/coin.jpg',
                                metadata: { content_type: 'image/jpeg' }
                            }]
                        }
                    },
                    general: {
                        data: {
                            hash: '0x789ghi',
                            text: '@feybot what is the FEY protocol?',
                            author: {
                                fid: 11111,
                                username: 'curious',
                                display_name: 'Curious User'
                            },
                            embeds: []
                        }
                    }
                };
                
                const result = \`
Webhook Simulation Result for: \${type.toUpperCase()}

Input Data:
\${JSON.stringify(webhookData[type], null, 2)}

Expected Processing:
1. Extract cast data (text, author, media)
2. Analyze intent using AI
3. Generate appropriate response
4. Store parameters if deployment intent detected
5. Reply with miniapp embed if applicable

This would trigger the full webhook processing pipeline.
                \`;
                
                document.getElementById('webhook-result').textContent = result;
            }
        </script>
    </body>
    </html>
  `;
}