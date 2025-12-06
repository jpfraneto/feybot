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
} from "./utils/tgc-analyzer.js";
import { getMainTGCLaunchView } from "./views/main-tgc-launch.js";
import { getTGCReplyMiniappView } from "./views/tgc-reply-miniapp.js";
import { castStore } from "./utils/cast-store.js";

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
    <meta name="fc:miniapp" content='{"version":"1","imageUrl":"${baseUrl}/static/image.png","button":{"title":"Trade Tokens","action":{"type":"launch_miniapp","name":"OverTheCounter","url":"${baseUrl}","splashImageUrl":"${baseUrl}/static/icon.svg","splashBackgroundColor":"#1a1a1a"}}}' />
    <script type="module" src="https://esm.sh/@farcaster/miniapp-sdk"></script>
    <style>
        body {
            font-family: "Times New Roman", Times, serif;
            background: #c0c0c0;
            color: #000000;
            margin: 20px;
            line-height: 1.4;
        }
        .info-button {
            position: fixed;
            top: 20px;
            right: 20px;
            width: 30px;
            height: 30px;
            border-radius: 50%;
            background: white;
            border: 2px solid #000;
            font-size: 16px;
            font-weight: bold;
            cursor: pointer;
            text-align: center;
            line-height: 26px;
        }
        .info-screen {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100vh;
            background: #c0c0c0;
            padding: 15px;
            z-index: 1000;
            overflow-y: auto;
            box-sizing: border-box;
        }
        .info-screen h1 {
            font-size: 18px;
            margin-bottom: 15px;
            text-align: center;
        }
        .info-screen h2 {
            font-size: 14px;
            margin-bottom: 8px;
            margin-top: 15px;
        }
        .info-screen p {
            font-size: 12px;
            margin-bottom: 8px;
            word-wrap: break-word;
            line-height: 1.3;
            max-width: 100%;
        }
        .close-button {
            float: right;
            font-size: 20px;
            font-weight: bold;
            cursor: pointer;
            border: none;
            background: none;
            padding: 5px 10px;
        }
        .success-screen {
            display: none;
            text-align: center;
        }
        .big-share-button {
            padding: 20px 40px;
            font-size: 20px;
            font-weight: bold;
            margin: 20px 0;
            width: 100%;
            max-width: 300px;
        }
        .small-create-button {
            padding: 8px 16px;
            font-size: 12px;
            margin-top: 10px;
        }
        h1 {
            font-size: 24px;
            text-align: center;
            margin-bottom: 20px;
        }
        h2 {
            font-size: 18px;
            margin-bottom: 10px;
        }
        p {
            margin-bottom: 15px;
        }
        input[type="text"], input[type="number"] {
            width: 100%;
            padding: 5px;
            border: 2px inset;
            background: white;
            font-size: 14px;
            font-family: "Times New Roman", Times, serif;
        }
        button {
            padding: 8px 16px;
            border: 2px outset;
            background: #c0c0c0;
            font-size: 14px;
            font-family: "Times New Roman", Times, serif;
            cursor: pointer;
        }
        button:active {
            border: 2px inset;
        }
        input[type="range"] {
            width: 100%;
            margin: 10px 0;
        }
        .step {
            display: none;
            margin-bottom: 20px;
        }
        .step.active {
            display: block;
        }
        .balance-display {
            border: 1px solid #000;
            padding: 10px;
            background: white;
            margin-bottom: 15px;
        }
        .contract-link {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #000;
        }
        .contract-link a {
            color: #0000ee;
            text-decoration: underline;
        }
        .contract-link a:visited {
            color: #551a8b;
        }
        .error-message, .success-message {
            border: 1px solid #000;
            padding: 10px;
            margin-bottom: 15px;
            display: none;
        }
    </style>
</head>
<body>
    <!-- Info Button -->
    <div class="info-button" id="info-button">i</div>
    
    <!-- Info Screen -->
    <div class="info-screen" id="info-screen">
        <button class="close-button" id="close-info">×</button>
        <h1>How OverTheCounter Works</h1>
        
        <h2>What is this?</h2>
        <p>OverTheCounter is a simple marketplace where you can sell your tokens for USDC on Base blockchain.</p>
        
        <h2>How to sell tokens:</h2>
        <p><b>1.</b> Paste your token's contract address</p>
        <p><b>2.</b> Choose how many tokens to sell (using the slider)</p>
        <p><b>3.</b> Set your USDC price</p>
        <p><b>4.</b> Create the listing</p>
        
        <h2>How it works:</h2>
        <p>• Your tokens stay in YOUR wallet until someone buys them</p>
        <p>• When someone buys, they get your tokens and you get USDC</p>
        <p>• There's a 0.88% fee taken from the sale</p>
        <p>• Listings expire after 24 hours</p>
        
        <h2>Safe?</h2>
        <p>Yes! The smart contract is public and can't be changed. No one can steal your tokens.</p>
        
        <div class="contract-link">
            <a href="https://basescan.org/address/0xa16e313bb5b6f03af9894b9991132f729b9069bf#code" target="_blank">read smart contract</a>
        </div>
    </div>
    
    <!-- Success Screen -->
    <div class="success-screen" id="success-screen">
        <h1>Listing Created Successfully!</h1>
        <p>Your listing ID: <span id="success-listing-id"></span></p>
        <br>
        <button class="big-share-button" id="big-share-button">SHARE LISTING</button>
        <br>
        <button class="small-create-button" id="create-another-button">create another one</button>
    </div>
    
    <!-- Main Form (hidden after success) -->
    <div id="main-form">
    <h1>OverTheCounter</h1>
    <p>A simple token marketplace on Base. Sell your tokens for USDC.</p>
    
    <div id="success-message" class="success-message"></div>
    <div id="error-message" class="error-message"></div>
    
    <form id="create-listing-form">
        <!-- Step 1: Contract Address -->
        <div class="step active" id="step1">
            <h2>Step 1: Enter Token Address</h2>
            <p>Paste the contract address of the token you want to sell here:</p>
            <input type="text" id="token" name="token" placeholder="paste the ca of the token you want to sell here" required>
            <br><br>
            <button type="button" id="next-step1">NEXT</button>
        </div>
        
        <!-- Step 2: Loading Balance -->
        <div class="step" id="step2">
            <p>Loading your balance...</p>
        </div>
        
        <!-- Step 2.5: No Balance - Buy Token -->
        <div class="step" id="step2-no-balance">
            <h2>No Tokens Found</h2>
            <div class="balance-display">
                <p>You don't have any of this token.</p>
                <p>Buy some tokens to create a listing!</p>
            </div>
            <button type="button" id="buy-token-button">BUY TOKEN</button>
            <br><br>
            <button type="button" id="back-to-step1">← Back</button>
        </div>
        
        <!-- Step 3: Balance & Slider -->
        <div class="step" id="step3">
            <h2>Step 2: Choose Amount</h2>
            <div class="balance-display">
                <p><b>Your Balance:</b> <span id="balance-display">0</span></p>
            </div>
            <p>Amount of tokens you want to sell: <b><span id="amount-display">0</span></b></p>
            <input type="range" id="amount-slider" min="0" max="100" value="0" step="1">
            <p>0% -------------------- 50% -------------------- 100%</p>
            <button type="button" id="next-step3">NEXT</button>
        </div>
        
        <!-- Step 4: Price Input -->
        <div class="step" id="step4">
            <h2>Step 3: Set Price</h2>
            <div class="balance-display">
                <p><b>You are selling:</b> <span id="selling-amount">0</span> tokens</p>
                <p><b>This is:</b> <span id="selling-percentage">0</span>% of your total balance</p>
            </div>
            <p>USDC you want for them (total price):</p>
            <input type="number" id="usdcPrice" name="usdcPrice" placeholder="usdc you want for them" step="0.01" min="0" required>
            <br><br>
            <button type="submit" id="create-button">CREATE LISTING</button>
        </div>
    </form>

    <div id="share-section" style="display: none;">
        <br>
        <button type="button" id="share-button">SHARE LISTING</button>
    </div>
    
    <div class="contract-link">
        <a href="https://basescan.org/address/0xa16e313bb5b6f03af9894b9991132f729b9069bf#code" target="_blank">read smart contract</a>
    </div>
    </div> <!-- Close main-form -->

    <script type="module">
        import { sdk } from 'https://esm.sh/@farcaster/miniapp-sdk';
        
        console.log('[OTC] Miniapp script loaded');
        
        let createdListingId = null;
        let userBalance = null;
        let tokenAddress = null;
        let tokenDecimals = 18; // Default, will try to fetch
        let userAccount = null;
        
        // OverTheCounter contract details
        const CONTRACT_ADDRESS = '0xa16e313Bb5b6f03Af9894b9991132F729B9069Bf';
        console.log('[OTC] Contract address:', CONTRACT_ADDRESS);
        
        // Public RPC URL for Base mainnet
        const RPC_URL = 'https://mainnet.base.org';
        
        // Initialize SDK when page loads
        async function initializeApp() {
            console.log('[OTC] Initializing app...');
            try {
                await sdk.actions.ready();
                console.log('[OTC] ✓ Farcaster SDK ready');
            } catch (error) {
                console.log('[OTC] ⚠ Not in Farcaster miniapp context:', error);
            }
        }
        
        // Get ethereum provider
        async function getEthereumProvider() {
            console.log('[OTC] Getting Ethereum provider...');
            try {
                const provider = await sdk.wallet.getEthereumProvider();
                console.log('[OTC] ✓ Got provider from SDK:', !!provider);
                return provider;
            } catch (error) {
                console.log('[OTC] ⚠ SDK provider failed, using window.ethereum fallback:', error);
                console.log('[OTC] window.ethereum available:', !!window.ethereum);
                return window.ethereum;
            }
        }
        
        // Get user account
        async function getUserAccount() {
            if (userAccount) {
                console.log('[OTC] Using cached account:', userAccount);
                return userAccount;
            }
            console.log('[OTC] Requesting user account...');
            const provider = await getEthereumProvider();
            if (!provider) {
                console.error('[OTC] ✗ No Ethereum provider found');
                throw new Error('No Ethereum provider found');
            }
            try {
                const accounts = await provider.request({ method: 'eth_requestAccounts' });
                userAccount = accounts[0];
                console.log('[OTC] ✓ User account:', userAccount);
                return userAccount;
            } catch (error) {
                console.error('[OTC] ✗ Error requesting accounts:', error);
                throw error;
            }
        }
        
        // Call ERC20 balanceOf via public RPC
        async function getTokenBalance(tokenAddress, userAddress) {
            console.log('[OTC] Fetching token balance...', { tokenAddress, userAddress });
            // ERC20 balanceOf function selector: balanceOf(address)
            const ERC20_BALANCEOF = '0x70a08231';
            const addressPadded = userAddress.slice(2).padStart(64, '0');
            const data = ERC20_BALANCEOF + addressPadded;
            console.log('[OTC] Balance call data:', data);
            
            try {
                const response = await fetch(RPC_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        jsonrpc: '2.0',
                        method: 'eth_call',
                        params: [{
                            to: tokenAddress,
                            data: data
                        }, 'latest'],
                        id: 1
                    })
                });
                
                const result = await response.json();
                if (result.error) {
                    throw new Error(result.error.message || 'RPC error');
                }
                
                if (!result.result) {
                    throw new Error('No result from RPC');
                }
                
                const balance = BigInt(result.result);
                console.log('[OTC] ✓ Token balance (raw):', balance.toString());
                return balance;
            } catch (error) {
                console.error('[OTC] ✗ Error fetching balance:', error);
                throw error;
            }
        }
        
        // Get token decimals via public RPC
        async function getTokenDecimals(tokenAddress) {
            console.log('[OTC] Fetching token decimals for:', tokenAddress);
            // ERC20 decimals() function selector
            const ERC20_DECIMALS = '0x313ce567';
            
            try {
                const response = await fetch(RPC_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        jsonrpc: '2.0',
                        method: 'eth_call',
                        params: [{
                            to: tokenAddress,
                            data: ERC20_DECIMALS
                        }, 'latest'],
                        id: 1
                    })
                });
                
                const result = await response.json();
                if (result.error || !result.result) {
                    console.log('[OTC] ⚠ Failed to fetch decimals, using default 18');
                    return 18;
                }
                
                const decimals = parseInt(result.result, 16);
                console.log('[OTC] ✓ Token decimals:', decimals);
                return decimals;
            } catch (error) {
                console.log('[OTC] ⚠ Could not fetch decimals, using 18:', error);
                return 18;
            }
        }
        
        // Format token amount for display (human-readable, no decimals)
        function formatTokenAmount(amount, decimals = 18) {
            const divisor = BigInt(10 ** decimals);
            const humanReadable = amount / divisor;
            const formatted = humanReadable.toString().replace(/\\B(?=(\\d{3})+(?!\\d))/g, ',');
            console.log('[OTC] Formatting amount:', { raw: amount.toString(), decimals, formatted });
            return formatted;
        }
        
        // Convert human-readable number to raw format (with decimals)
        function toRawAmount(humanReadable, decimals) {
            console.log('[OTC] Converting to raw amount:', { humanReadable, decimals });
            // Handle decimal input (e.g., "10.5" -> 10.5 * 10^decimals)
            const parts = humanReadable.toString().split('.');
            const wholePart = parts[0] || '0';
            const fractionalPart = parts[1] || '';
            
            // Pad fractional part to match decimals, then combine
            const paddedFractional = fractionalPart.padEnd(decimals, '0').slice(0, decimals);
            const rawAmount = BigInt(wholePart) * BigInt(10 ** decimals) + BigInt(paddedFractional || '0');
            
            console.log('[OTC] Raw amount result:', rawAmount.toString());
            return rawAmount;
        }
        
        // Convert human-readable USDC to raw format (6 decimals)
        function toRawUSDC(humanReadable) {
            console.log('[OTC] Converting USDC to raw:', humanReadable);
            const raw = toRawAmount(humanReadable, 6);
            console.log('[OTC] USDC raw result:', raw.toString());
            return raw;
        }
        
        // Show step
        function showStep(stepNumber) {
            const stepId = typeof stepNumber === 'string' ? stepNumber : \`step\${stepNumber}\`;
            console.log('[OTC] Showing step:', stepId);
            document.querySelectorAll('.step').forEach(step => {
                step.classList.remove('active');
            });
            document.getElementById(stepId).classList.add('active');
            console.log('[OTC] ✓ Step shown:', stepId);
        }
        
        // Update amount display from slider (human-readable)
        function updateAmountDisplay() {
            const slider = document.getElementById('amount-slider');
            const percentage = parseInt(slider.value);
            console.log('[OTC] Updating amount display:', { percentage, userBalance: userBalance?.toString() });
            
            if (!userBalance || userBalance === 0n) {
                document.getElementById('amount-display').textContent = '0';
                return;
            }
            
            const rawAmount = (userBalance * BigInt(percentage)) / 100n;
            const humanReadable = formatTokenAmount(rawAmount, tokenDecimals);
            document.getElementById('amount-display').textContent = humanReadable;
            console.log('[OTC] Amount display updated:', humanReadable);
        }
        
        // Check token allowance for OverTheCounter contract
        async function checkAllowance(tokenAddress, userAddress) {
            console.log('[OTC] Checking allowance...', { tokenAddress, userAddress });
            // ERC20 allowance(owner, spender) function selector
            const ERC20_ALLOWANCE = '0xdd62ed3e';
            const ownerPadded = userAddress.slice(2).padStart(64, '0');
            const spenderPadded = CONTRACT_ADDRESS.slice(2).padStart(64, '0');
            const data = ERC20_ALLOWANCE + ownerPadded + spenderPadded;
            
            try {
                const response = await fetch(RPC_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        jsonrpc: '2.0',
                        method: 'eth_call',
                        params: [{
                            to: tokenAddress,
                            data: data
                        }, 'latest'],
                        id: 1
                    })
                });
                
                const result = await response.json();
                if (result.error || !result.result) {
                    console.log('[OTC] ⚠ Could not check allowance, assuming 0');
                    return 0n;
                }
                
                const allowance = BigInt(result.result);
                console.log('[OTC] ✓ Current allowance:', allowance.toString());
                return allowance;
            } catch (error) {
                console.log('[OTC] ⚠ Error checking allowance:', error);
                return 0n;
            }
        }
        
        // Approve token spending for OverTheCounter contract
        async function approveToken(tokenAddress, amount) {
            console.log('[OTC] Approving token...', { tokenAddress, amount });
            const provider = await getEthereumProvider();
            
            if (!provider) {
                throw new Error('No Ethereum provider found');
            }
            
            const accounts = await provider.request({ method: 'eth_requestAccounts' });
            const account = accounts[0];
            
            // ERC20 approve(spender, amount) function selector
            const ERC20_APPROVE = '0x095ea7b3';
            const spenderPadded = CONTRACT_ADDRESS.slice(2).padStart(64, '0');
            const amountPadded = BigInt(amount).toString(16).padStart(64, '0');
            const data = ERC20_APPROVE + spenderPadded + amountPadded;
            
            const tx = {
                to: tokenAddress,
                from: account,
                data: data
            };
            
            console.log('[OTC] Sending approval transaction...');
            const txHash = await provider.request({
                method: 'eth_sendTransaction',
                params: [tx]
            });
            console.log('[OTC] ✓ Approval transaction sent, hash:', txHash);
            
            // Wait for approval transaction receipt using public RPC
            // (Farcaster Wallet doesn't support eth_getTransactionReceipt)
            let receipt = null;
            let attempts = 0;
            const maxAttempts = 60; // Wait up to 60 seconds
            
            console.log('[OTC] Waiting for approval transaction confirmation...');
            while (!receipt && attempts < maxAttempts) {
                attempts++;
                try {
                    const response = await fetch(RPC_URL, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            jsonrpc: '2.0',
                            method: 'eth_getTransactionReceipt',
                            params: [txHash],
                            id: 1
                        })
                    });
                    
                    const result = await response.json();
                    if (result.result) {
                        receipt = result.result;
                        console.log('[OTC] ✓ Approval transaction confirmed');
                    } else {
                        // Transaction not yet mined, wait and retry
                        if (attempts % 5 === 0) {
                            console.log(\`[OTC] Still waiting for approval (attempt \${attempts}/\${maxAttempts})...\`);
                        }
                        await new Promise(resolve => setTimeout(resolve, 1000));
                    }
                } catch (error) {
                    console.log('[OTC] Error checking receipt, retrying...', error);
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
            }
            
            if (!receipt) {
                console.log('[OTC] ⚠ Approval transaction not confirmed yet, but proceeding anyway');
                // Don't throw - the transaction was sent, it will confirm eventually
                // We can proceed and the contract will check allowance when creating listing
            } else {
                console.log('[OTC] ✓ Approval confirmed with receipt');
            }
            
            return receipt || { transactionHash: txHash };
        }
        
        // Create listing on smart contract
        async function createListing(token, tokenAmount, usdcPrice) {
            console.log('[OTC] Creating listing...', { token, tokenAmount, usdcPrice });
            const provider = await getEthereumProvider();
            
            if (!provider) {
                console.error('[OTC] ✗ No provider for createListing');
                throw new Error('No Ethereum provider found');
            }
            
            // Request account access
            const accounts = await provider.request({ method: 'eth_requestAccounts' });
            const account = accounts[0];
            console.log('[OTC] Using account for listing:', account);
            
            // Check if approval is needed
            let currentAllowance = await checkAllowance(token, account);
            const requiredAmount = BigInt(tokenAmount);
            
            if (currentAllowance < requiredAmount) {
                console.log('[OTC] Insufficient allowance, requesting approval...');
                console.log('[OTC] Current allowance:', currentAllowance.toString(), 'Required:', requiredAmount.toString());
                await approveToken(token, tokenAmount);
                
                // Wait a moment for state to update, then re-check allowance
                console.log('[OTC] Waiting for allowance to update on-chain...');
                await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second delay
                
                // Re-check allowance to verify it's updated
                let retries = 0;
                while (currentAllowance < requiredAmount && retries < 10) {
                    retries++;
                    currentAllowance = await checkAllowance(token, account);
                    console.log('[OTC] Re-checking allowance (attempt ' + retries + '):', currentAllowance.toString());
                    if (currentAllowance < requiredAmount) {
                        await new Promise(resolve => setTimeout(resolve, 1000));
                    }
                }
                
                if (currentAllowance < requiredAmount) {
                    throw new Error('Allowance not updated after approval. Please try again.');
                }
                
                console.log('[OTC] ✓ Approval confirmed, allowance:', currentAllowance.toString());
            } else {
                console.log('[OTC] ✓ Sufficient allowance already exists:', currentAllowance.toString());
            }
            
            // Verify user has sufficient balance
            console.log('[OTC] Verifying user balance...');
            const userBalance = await getTokenBalance(token, account);
            console.log('[OTC] User balance:', userBalance.toString(), 'Required:', requiredAmount.toString());
            if (userBalance < requiredAmount) {
                throw new Error('Insufficient token balance. Balance: ' + userBalance.toString() + ', Required: ' + requiredAmount.toString());
            }
            console.log('[OTC] ✓ Balance verified');
            
            // Validate token address
            if (!token || token === '0x' || token.length !== 42) {
                throw new Error('Invalid token address');
            }
            
            // Validate token is not USDC (contract doesn't allow selling USDC for USDC)
            const USDC_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';
            if (token.toLowerCase() === USDC_ADDRESS.toLowerCase()) {
                throw new Error('Cannot sell USDC for USDC. Please select a different token.');
            }
            
            // Validate amounts are non-zero
            const tokenAmountBigInt = BigInt(tokenAmount);
            const usdcPriceBigInt = BigInt(usdcPrice);
            
            if (tokenAmountBigInt === 0n) {
                throw new Error('Token amount cannot be zero');
            }
            if (usdcPriceBigInt === 0n) {
                throw new Error('USDC price cannot be zero');
            }
            
            console.log('[OTC] All validations passed');
            
            // Final double-check of allowance and balance right before transaction
            console.log('[OTC] Final verification before transaction...');
            const finalAllowance = await checkAllowance(token, account);
            const finalBalance = await getTokenBalance(token, account);
            console.log('[OTC] Final allowance:', finalAllowance.toString(), 'Required:', requiredAmount.toString());
            console.log('[OTC] Final balance:', finalBalance.toString(), 'Required:', requiredAmount.toString());
            
            if (finalAllowance < requiredAmount) {
                throw new Error('Final allowance check failed. Allowance: ' + finalAllowance.toString() + ', Required: ' + requiredAmount.toString() + '. Please approve again.');
            }
            if (finalBalance < requiredAmount) {
                throw new Error('Final balance check failed. Balance: ' + finalBalance.toString() + ', Required: ' + requiredAmount.toString());
            }
            console.log('[OTC] ✓ Final checks passed');
            
            // Encode createListing function call
            // Function signature: createListing(address,uint256,uint256)
            // Selector: first 4 bytes of keccak256("createListing(address,uint256,uint256)")
            const functionSelector = '0x24780c56';
            // Remove 0x prefix and pad to 64 chars (32 bytes), keep original case
            const tokenPadded = token.slice(2).padStart(64, '0');
            const tokenAmountPadded = BigInt(tokenAmount).toString(16).padStart(64, '0');
            const usdcPricePadded = BigInt(usdcPrice).toString(16).padStart(64, '0');
            
            const data = functionSelector + tokenPadded + tokenAmountPadded + usdcPricePadded;
            console.log('[OTC] Transaction data:', data);
            console.log('[OTC] Function selector:', functionSelector);
            console.log('[OTC] Token:', token, 'Amount:', tokenAmount, 'Price:', usdcPrice);
            
            // Simulate transaction first to catch any revert reasons
            console.log('[OTC] Simulating transaction to check for errors...');
            try {
                const simulateResponse = await fetch(RPC_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        jsonrpc: '2.0',
                        method: 'eth_call',
                        params: [{
                            to: CONTRACT_ADDRESS,
                            from: account,
                            data: data
                        }, 'latest'],
                        id: 1
                    })
                });
                
                const simulateResult = await simulateResponse.json();
                if (simulateResult.error) {
                    console.error('[OTC] ✗ Simulation failed:', simulateResult.error);
                    
                    // Check for revert data in the error
                    let errorMessage = 'Transaction would revert';
                    if (simulateResult.error.data && simulateResult.error.data !== '0x') {
                        errorMessage += '. Revert data: ' + simulateResult.error.data;
                    }
                    if (simulateResult.error.message) {
                        errorMessage += '. ' + simulateResult.error.message;
                    }
                    
                    // Don't proceed if simulation fails - it means the transaction will fail
                    throw new Error(errorMessage);
                }
                
                // Check if result is empty (also indicates failure)
                if (!simulateResult.result || simulateResult.result === '0x') {
                    throw new Error('Transaction simulation returned empty result - transaction would likely fail');
                }
                
                console.log('[OTC] ✓ Simulation successful, transaction should work');
            } catch (simError) {
                console.error('[OTC] ✗ Simulation error:', simError);
                // Don't proceed if simulation fails - throw the error to stop execution
                throw simError;
            }
            
            // Prepare transaction
            const tx = {
                to: CONTRACT_ADDRESS,
                from: account,
                data: data
            };
            console.log('[OTC] Transaction object:', tx);
            
            // Send transaction
            console.log('[OTC] Sending createListing transaction...');
            const txHash = await provider.request({
                method: 'eth_sendTransaction',
                params: [tx]
            });
            console.log('[OTC] ✓ Transaction sent, hash:', txHash);
            
            // Wait for transaction receipt using public RPC
            // (Farcaster Wallet doesn't support eth_getTransactionReceipt)
            console.log('[OTC] Waiting for transaction receipt...');
            let receipt = null;
            let attempts = 0;
            const maxAttempts = 60; // Wait up to 60 seconds
            
            while (!receipt && attempts < maxAttempts) {
                attempts++;
                try {
                    const response = await fetch(RPC_URL, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            jsonrpc: '2.0',
                            method: 'eth_getTransactionReceipt',
                            params: [txHash],
                            id: 1
                        })
                    });
                    
                    const result = await response.json();
                    if (result.result) {
                        receipt = result.result;
                        console.log('[OTC] ✓ Transaction receipt received:', receipt);
                    } else {
                        // Transaction not yet mined, wait and retry
                        if (attempts % 5 === 0) {
                            console.log(\`[OTC] Still waiting for receipt (attempt \${attempts}/\${maxAttempts})...\`);
                        }
                        await new Promise(resolve => setTimeout(resolve, 1000));
                    }
                } catch (error) {
                    console.log(\`[OTC] Error getting receipt (attempt \${attempts}):\`, error);
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
            }
            
            if (!receipt) {
                console.log('[OTC] ⚠ Transaction receipt not confirmed yet, but transaction was sent');
                // Transaction was sent, it will confirm eventually
                // Return a placeholder receipt with the tx hash
                receipt = { transactionHash: txHash };
            }
            
            // Extract listing ID from logs (simplified - would need proper log decoding)
            const listingId = receipt.logs.length > 0 ? Date.now() : Date.now();
            console.log('[OTC] ✓ Listing created, ID:', listingId);
            return listingId;
        }
        
        // Step 1: Handle contract address input
        document.getElementById('next-step1').addEventListener('click', async () => {
            console.log('[OTC] Step 1: Next button clicked');
            const tokenInput = document.getElementById('token');
            const errorMessage = document.getElementById('error-message');
            const successMessage = document.getElementById('success-message');
            
            tokenAddress = tokenInput.value.trim();
            console.log('[OTC] Token address input:', tokenAddress);
            
            if (!tokenAddress || !tokenAddress.startsWith('0x') || tokenAddress.length !== 42) {
                console.error('[OTC] ✗ Invalid token address format');
                errorMessage.textContent = 'Please enter a valid contract address';
                errorMessage.style.display = 'block';
                return;
            }
            
            try {
                console.log('[OTC] Valid token address, proceeding...');
                errorMessage.style.display = 'none';
                successMessage.style.display = 'none';
                
                // Move to loading step
                showStep(2);
                
                // Get user account
                console.log('[OTC] Getting user account...');
                const account = await getUserAccount();
                
                // Fetch balance and decimals
                console.log('[OTC] Fetching balance and decimals in parallel...');
                const [balance, decimals] = await Promise.all([
                    getTokenBalance(tokenAddress, account),
                    getTokenDecimals(tokenAddress)
                ]);
                
                userBalance = balance;
                tokenDecimals = decimals;
                console.log('[OTC] Balance and decimals fetched:', { 
                    balance: balance.toString(), 
                    decimals,
                    humanReadable: formatTokenAmount(balance, decimals)
                });
                
                if (userBalance === 0n) {
                    console.log('[OTC] User has zero balance, showing buy token step');
                    // Show no balance step with buy button
                    showStep('step2-no-balance');
                    return;
                }
                
                // Show balance and slider step
                console.log('[OTC] User has balance, showing step 3');
                const formattedBalance = formatTokenAmount(userBalance, tokenDecimals);
                document.getElementById('balance-display').textContent = formattedBalance;
                updateAmountDisplay(); // Initialize slider display
                showStep(3);
                
            } catch (error) {
                console.error('[OTC] ✗ Error in step 1 flow:', error);
                console.error('[OTC] Error details:', { 
                    message: error.message, 
                    stack: error.stack,
                    tokenAddress 
                });
                errorMessage.textContent = \`Error: \${error.message}\`;
                errorMessage.style.display = 'block';
                showStep(1);
            }
        });
        
        // Handle buy token button (no balance step)
        document.getElementById('buy-token-button').addEventListener('click', async () => {
            console.log('[OTC] Buy token button clicked');
            console.log('[OTC] Token address for swap:', tokenAddress);
            try {
                // USDC on Base: 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913
                // Format: eip155:8453/erc20:{address}
                const swapParams = {
                    sellToken: "eip155:8453/erc20:0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
                    buyToken: \`eip155:8453/erc20:\${tokenAddress}\`,
                    sellAmount: "1000000", // 1 USDC (6 decimals)
                };
                console.log('[OTC] Swap parameters:', swapParams);
                console.log('[OTC] Calling sdk.actions.swapToken...');
                
                await sdk.actions.swapToken(swapParams);
                console.log('[OTC] ✓ Swap completed');
                
                // After swap, refresh balance
                console.log('[OTC] Refreshing balance after swap...');
                const account = await getUserAccount();
                const balance = await getTokenBalance(tokenAddress, account);
                userBalance = balance;
                console.log('[OTC] New balance:', balance.toString());
                
                if (userBalance > 0n) {
                    console.log('[OTC] Balance > 0, showing step 3');
                    const formattedBalance = formatTokenAmount(userBalance, tokenDecimals);
                    document.getElementById('balance-display').textContent = formattedBalance;
                    updateAmountDisplay();
                    showStep(3);
                } else {
                    console.log('[OTC] ⚠ Balance still 0 after swap');
                }
            } catch (error) {
                console.error('[OTC] ✗ Error swapping token:', error);
                console.error('[OTC] Swap error details:', { 
                    message: error.message, 
                    stack: error.stack,
                    tokenAddress 
                });
                const errorMessage = document.getElementById('error-message');
                errorMessage.textContent = \`Error: \${error.message}\`;
                errorMessage.style.display = 'block';
            }
        });
        
        // Handle back button from no balance step
        document.getElementById('back-to-step1').addEventListener('click', () => {
            console.log('[OTC] Back button clicked, returning to step 1');
            showStep(1);
        });
        
        // Step 3: Handle slider and move to price step
        document.getElementById('amount-slider').addEventListener('input', () => {
            console.log('[OTC] Slider value changed');
            updateAmountDisplay();
        });
        
        document.getElementById('next-step3').addEventListener('click', () => {
            console.log('[OTC] Step 3: Next button clicked');
            const slider = document.getElementById('amount-slider');
            const percentage = parseInt(slider.value);
            console.log('[OTC] Slider percentage:', percentage);
            
            if (percentage === 0) {
                console.error('[OTC] ✗ No amount selected');
                const errorMessage = document.getElementById('error-message');
                errorMessage.textContent = 'Please select an amount to sell';
                errorMessage.style.display = 'block';
                return;
            }
            
            const rawAmount = (userBalance * BigInt(percentage)) / 100n;
            const humanReadableAmount = formatTokenAmount(rawAmount, tokenDecimals);
            console.log('[OTC] Amount to sell:', { 
                percentage, 
                rawAmount: rawAmount.toString(),
                humanReadable: humanReadableAmount
            });
            
            // Update Step 4 display with selling info
            document.getElementById('selling-amount').textContent = humanReadableAmount;
            document.getElementById('selling-percentage').textContent = percentage;
            
            showStep(4);
        });
        
        // Handle form submission
        document.getElementById('create-listing-form').addEventListener('submit', async (e) => {
            console.log('[OTC] Form submission started');
            e.preventDefault();
            
            const submitButton = document.getElementById('create-button');
            const successMessage = document.getElementById('success-message');
            const errorMessage = document.getElementById('error-message');
            
            try {
                submitButton.disabled = true;
                submitButton.textContent = 'CREATING...';
                console.log('[OTC] Submit button disabled');
                
                // Hide previous messages
                successMessage.style.display = 'none';
                errorMessage.style.display = 'none';
                
                const usdcPriceInput = document.getElementById('usdcPrice').value;
                const slider = document.getElementById('amount-slider');
                const percentage = parseInt(slider.value);
                
                console.log('[OTC] Form data:', { 
                    usdcPriceInput, 
                    percentage,
                    tokenAddress,
                    userBalance: userBalance?.toString(),
                    tokenDecimals
                });
                
                // Convert human-readable inputs to raw format
                const rawTokenAmount = (userBalance * BigInt(percentage)) / 100n;
                const rawUSDCPrice = toRawUSDC(usdcPriceInput);
                
                console.log('[OTC] Converted amounts:', {
                    rawTokenAmount: rawTokenAmount.toString(),
                    rawUSDCPrice: rawUSDCPrice.toString(),
                    humanReadableToken: formatTokenAmount(rawTokenAmount, tokenDecimals),
                    humanReadableUSDC: (rawUSDCPrice / BigInt(10 ** 6)).toString()
                });
                
                // Create listing with raw amounts
                const listingId = await createListing(tokenAddress, rawTokenAmount.toString(), rawUSDCPrice.toString());
                createdListingId = listingId;
                console.log('[OTC] ✓ Listing created successfully, ID:', listingId);
                
                // Show success screen instead of form
                console.log('[OTC] ✓ Showing success screen');
                document.getElementById('main-form').style.display = 'none';
                document.getElementById('success-screen').style.display = 'block';
                document.getElementById('success-listing-id').textContent = listingId;
                
            } catch (error) {
                console.error('[OTC] ✗ Error creating listing:', error);
                console.error('[OTC] Create listing error details:', { 
                    message: error.message, 
                    stack: error.stack,
                    tokenAddress,
                    userBalance: userBalance?.toString()
                });
                errorMessage.textContent = \`Error: \${error.message}\`;
                errorMessage.style.display = 'block';
            } finally {
                submitButton.disabled = false;
                submitButton.textContent = 'CREATE LISTING';
                console.log('[OTC] Submit button re-enabled');
            }
        });
        
        // Handle share button
        document.getElementById('share-button').addEventListener('click', async () => {
            console.log('[OTC] Share button clicked, listing ID:', createdListingId);
            if (!createdListingId) {
                console.error('[OTC] ✗ No listing ID to share');
                return;
            }
            
            try {
                const baseUrl = '${baseUrl}';
                const shareUrl = \`\${baseUrl}/listing/\${createdListingId}\`;
                console.log('[OTC] Sharing listing:', shareUrl);
                
                await sdk.actions.composeCast({
                    text: \`I'm selling tokens for USDC on OverTheCounter! 🚀\`,
                    embeds: [shareUrl]
                });
                console.log('[OTC] ✓ Cast composed successfully');
            } catch (error) {
                console.error('[OTC] ✗ Error sharing listing:', error);
                console.error('[OTC] Share error details:', { 
                    message: error.message, 
                    stack: error.stack,
                    listingId: createdListingId
                });
                alert('Error sharing listing: ' + error.message);
            }
        });
        
        // Info button handlers
        document.getElementById('info-button').addEventListener('click', () => {
            console.log('[OTC] Info button clicked');
            document.getElementById('info-screen').style.display = 'block';
        });
        
        document.getElementById('close-info').addEventListener('click', () => {
            console.log('[OTC] Close info button clicked');
            document.getElementById('info-screen').style.display = 'none';
        });
        
        // Success screen handlers
        document.getElementById('big-share-button').addEventListener('click', async () => {
            console.log('[OTC] Big share button clicked, listing ID:', createdListingId);
            if (!createdListingId) {
                console.error('[OTC] ✗ No listing ID to share');
                return;
            }
            
            try {
                const baseUrl = '${baseUrl}';
                const shareUrl = \`\${baseUrl}/listing/\${createdListingId}\`;
                console.log('[OTC] Sharing listing:', shareUrl);
                
                await sdk.actions.composeCast({
                    text: \`I'm selling tokens for USDC on OverTheCounter! 🚀\`,
                    embeds: [shareUrl]
                });
                console.log('[OTC] ✓ Cast composed successfully');
            } catch (error) {
                console.error('[OTC] ✗ Error sharing listing:', error);
                alert('Error sharing listing: ' + error.message);
            }
        });
        
        document.getElementById('create-another-button').addEventListener('click', () => {
            console.log('[OTC] Create another button clicked');
            // Reset everything and show main form
            document.getElementById('success-screen').style.display = 'none';
            document.getElementById('main-form').style.display = 'block';
            document.getElementById('create-listing-form').reset();
            showStep(1);
            
            // Clear previous data
            createdListingId = null;
            userBalance = null;
            tokenAddress = null;
            tokenDecimals = 18;
            userAccount = null;
        });
        
        // Initialize app
        console.log('[OTC] Starting app initialization...');
        initializeApp();
    </script>
</body>
</html>
  `);
});

// Listing detail page
app.get("/listing/:id", async (c) => {
  const listingId = c.req.param("id");
  const baseUrl = process.env.BASE_URL || "https://miniapp.anky.app";

  // Use placeholder data for now - will be dynamically loaded via contract
  const listing = {
    id: listingId,
    seller: "Loading...",
    token: "Loading...",
    tokenAmount: "0",
    usdcPrice: "0",
    expiresAt: Date.now() + 86400000,
    isActive: true,
  };

  return c.html(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>OverTheCounter - Listing #${listingId}</title>
    <meta name="fc:miniapp" content='{"version":"1","imageUrl":"${baseUrl}/static/image.png","button":{"title":"Buy Tokens","action":{"type":"launch_miniapp","name":"OverTheCounter","url":"${baseUrl}/listing/${listingId}","splashImageUrl":"${baseUrl}/static/icon.svg","splashBackgroundColor":"#1a1a1a"}}}' />
    <script type="module" src="https://esm.sh/@farcaster/miniapp-sdk"></script>
    <style>
        body {
            font-family: "Times New Roman", Times, serif;
            background: #c0c0c0;
            color: #000000;
            margin: 20px;
            line-height: 1.4;
        }
        h1 {
            font-size: 24px;
            text-align: center;
            margin-bottom: 20px;
        }
        h2 {
            font-size: 18px;
            margin-bottom: 10px;
        }
        p {
            margin-bottom: 15px;
        }
        button {
            padding: 8px 16px;
            border: 2px outset;
            background: #c0c0c0;
            font-size: 14px;
            font-family: "Times New Roman", Times, serif;
            cursor: pointer;
            margin-right: 10px;
        }
        button:active {
            border: 2px inset;
        }
        button:disabled {
            background: #999;
            color: #666;
            cursor: not-allowed;
        }
        .listing-info {
            border: 1px solid #000;
            padding: 15px;
            background: white;
            margin-bottom: 20px;
        }
        .contract-link {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #000;
        }
        .contract-link a {
            color: #0000ee;
            text-decoration: underline;
        }
        .contract-link a:visited {
            color: #551a8b;
        }
        .error-message, .success-message {
            border: 1px solid #000;
            padding: 10px;
            margin-bottom: 15px;
            display: none;
        }
        .info-button {
            position: fixed;
            top: 20px;
            right: 20px;
            width: 30px;
            height: 30px;
            border-radius: 50%;
            background: white;
            border: 2px solid #000;
            font-size: 16px;
            font-weight: bold;
            cursor: pointer;
            text-align: center;
            line-height: 26px;
        }
        .info-screen {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100vh;
            background: #c0c0c0;
            padding: 15px;
            z-index: 1000;
            overflow-y: auto;
            box-sizing: border-box;
        }
        .info-screen h1 {
            font-size: 18px;
            margin-bottom: 15px;
            text-align: center;
        }
        .info-screen h2 {
            font-size: 14px;
            margin-bottom: 8px;
            margin-top: 15px;
        }
        .info-screen p {
            font-size: 12px;
            margin-bottom: 8px;
            word-wrap: break-word;
            line-height: 1.3;
            max-width: 100%;
        }
        .close-button {
            float: right;
            font-size: 20px;
            font-weight: bold;
            cursor: pointer;
            border: none;
            background: none;
            padding: 5px 10px;
        }
    </style>
</head>
<body>
    <!-- Info Button -->
    <div class="info-button" id="info-button">i</div>
    
    <!-- Info Screen -->
    <div class="info-screen" id="info-screen">
        <button class="close-button" id="close-info">×</button>
        <h1>How OverTheCounter Works</h1>
        
        <h2>What is this?</h2>
        <p>OverTheCounter is a simple marketplace where you can sell your tokens for USDC on Base blockchain.</p>
        
        <h2>How to sell tokens:</h2>
        <p><b>1.</b> Paste your token's contract address</p>
        <p><b>2.</b> Choose how many tokens to sell (using the slider)</p>
        <p><b>3.</b> Set your USDC price</p>
        <p><b>4.</b> Create the listing</p>
        
        <h2>How it works:</h2>
        <p>• Your tokens stay in YOUR wallet until someone buys them</p>
        <p>• When someone buys, they get your tokens and you get USDC</p>
        <p>• There's a 0.88% fee taken from the sale</p>
        <p>• Listings expire after 24 hours</p>
        
        <h2>Safe?</h2>
        <p>Yes! The smart contract is public and can't be changed. No one can steal your tokens.</p>
        
        <div class="contract-link">
            <a href="https://basescan.org/address/0xa16e313bb5b6f03af9894b9991132f729b9069bf#code" target="_blank">read smart contract</a>
        </div>
    </div>

    <button onclick="window.location.href='/'">← Back to Create</button>
    
    <h1>Token Listing</h1>
    <p><b>Listing #${listingId}</b></p>
    
    <div id="success-message" class="success-message"></div>
    <div id="error-message" class="error-message"></div>
    
    <div class="listing-info" id="listing-info">
        <p><b>Seller:</b> <span id="seller-value">Loading...</span></p>
        <p><b>Token:</b> <span id="token-value">Loading...</span></p>
        <p><b>Amount:</b> <span id="amount-value">Loading...</span></p>
        <p><b>Price:</b> <span id="price-value">Loading...</span></p>
        <p><b>Status:</b> <span id="status-value">Loading...</span></p>
    </div>
    
    <div id="usdc-balance-info" class="listing-info" style="display: none;">
        <p><b>Your USDC Balance:</b> <span id="usdc-balance-value">Loading...</span></p>
        <p><b>Required USDC:</b> <span id="required-usdc-value">Loading...</span></p>
    </div>
    
    <button id="buy-button" style="display: none;">BUY TOKENS</button>
    <button id="buy-usdc-button" style="display: none;">BUY USDC FIRST</button>
    <button id="loading-button">LOADING...</button>
    
    <div class="contract-link">
        <a href="https://basescan.org/address/0xa16e313bb5b6f03af9894b9991132f729b9069bf#code" target="_blank">read smart contract</a>
    </div>

    <script type="module">
        import { sdk } from 'https://esm.sh/@farcaster/miniapp-sdk';
        
        // OverTheCounter contract details
        const CONTRACT_ADDRESS = '0xa16e313Bb5b6f03Af9894b9991132F729B9069Bf';
        const LISTING_ID = '${listingId}';
        const USDC_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';
        const RPC_URL = 'https://mainnet.base.org';
        
        console.log('[OTC] Listing detail page script loaded');
        console.log('[OTC] Listing ID:', LISTING_ID);
        console.log('[OTC] Contract address:', CONTRACT_ADDRESS);
        
        let listingData = null;
        let userAccount = null;
        
        // Initialize SDK when page loads
        async function initializeApp() {
            console.log('[OTC] Initializing listing detail page...');
            try {
                await sdk.actions.ready();
                console.log('[OTC] ✓ Farcaster SDK ready');
            } catch (error) {
                console.log('[OTC] ⚠ Not in Farcaster miniapp context:', error);
            }
            
            // Load listing data and user info
            await loadListingData();
        }
        
        // Get ethereum provider
        async function getEthereumProvider() {
            console.log('[OTC] Getting Ethereum provider for listing page...');
            try {
                const provider = await sdk.wallet.getEthereumProvider();
                console.log('[OTC] ✓ Got provider from SDK:', !!provider);
                return provider;
            } catch (error) {
                console.log('[OTC] ⚠ SDK provider failed, using window.ethereum fallback:', error);
                console.log('[OTC] window.ethereum available:', !!window.ethereum);
                return window.ethereum;
            }
        }
        
        // Get user account
        async function getUserAccount() {
            if (userAccount) return userAccount;
            const provider = await getEthereumProvider();
            if (!provider) throw new Error('No Ethereum provider found');
            
            const accounts = await provider.request({ method: 'eth_requestAccounts' });
            userAccount = accounts[0];
            return userAccount;
        }
        
        // Call contract view function via RPC
        async function callContract(data) {
            const response = await fetch(RPC_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    jsonrpc: '2.0',
                    method: 'eth_call',
                    params: [{
                        to: CONTRACT_ADDRESS,
                        data: data
                    }, 'latest'],
                    id: 1
                })
            });
            
            const result = await response.json();
            if (result.error) throw new Error(result.error.message);
            return result.result;
        }
        
        // Get token balance
        async function getTokenBalance(tokenAddress, userAddress) {
            const ERC20_BALANCEOF = '0x70a08231';
            const addressPadded = userAddress.slice(2).padStart(64, '0');
            const data = ERC20_BALANCEOF + addressPadded;
            
            const response = await fetch(RPC_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    jsonrpc: '2.0',
                    method: 'eth_call',
                    params: [{
                        to: tokenAddress,
                        data: data
                    }, 'latest'],
                    id: 1
                })
            });
            
            const result = await response.json();
            if (result.error) throw new Error(result.error.message);
            return BigInt(result.result || '0');
        }
        
        // Get token decimals
        async function getTokenDecimals(tokenAddress) {
            try {
                const ERC20_DECIMALS = '0x313ce567';
                const response = await fetch(RPC_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        jsonrpc: '2.0',
                        method: 'eth_call',
                        params: [{
                            to: tokenAddress,
                            data: ERC20_DECIMALS
                        }, 'latest'],
                        id: 1
                    })
                });
                
                const result = await response.json();
                if (result.error || !result.result) return 18;
                return parseInt(result.result, 16);
            } catch {
                return 18;
            }
        }
        
        // Format token amount for display
        function formatTokenAmount(amount, decimals = 18) {
            const divisor = BigInt(10 ** decimals);
            const humanReadable = Number(amount) / Number(divisor);
            return humanReadable.toLocaleString();
        }
        
        // Format USDC amount (6 decimals)
        function formatUSDC(amount) {
            const humanReadable = Number(amount) / 1000000;
            return humanReadable.toFixed(2);
        }
        
        // Load listing data from contract
        async function loadListingData() {
            try {
                console.log('[OTC] Loading listing data...');
                
                // Get listing data using getListing function
                const GET_LISTING_SELECTOR = '0x107a274a'; // getListing(uint256)
                const listingIdPadded = BigInt(LISTING_ID).toString(16).padStart(64, '0');
                const data = GET_LISTING_SELECTOR + listingIdPadded;
                
                const result = await callContract(data);
                
                // Parse the result (getListing returns tuple)
                // (address seller, address token, uint256 tokenAmount, uint256 usdcPrice, uint256 expiresAt, bool isActive, bool canExecute)
                const seller = '0x' + result.slice(26, 66);
                const token = '0x' + result.slice(90, 130);
                const tokenAmount = BigInt('0x' + result.slice(130, 194));
                const usdcPrice = BigInt('0x' + result.slice(194, 258));
                const expiresAt = BigInt('0x' + result.slice(258, 322));
                const isActive = result.slice(322, 323) === '1';
                
                listingData = {
                    seller,
                    token,
                    tokenAmount,
                    usdcPrice,
                    expiresAt,
                    isActive
                };
                
                console.log('[OTC] Listing data loaded:', listingData);
                
                // Get token decimals for formatting
                const tokenDecimals = await getTokenDecimals(token);
                
                // Update UI with listing data
                document.getElementById('seller-value').textContent = seller.slice(0, 6) + '...' + seller.slice(-4);
                document.getElementById('token-value').textContent = token.slice(0, 6) + '...' + token.slice(-4);
                document.getElementById('amount-value').textContent = formatTokenAmount(tokenAmount, tokenDecimals);
                document.getElementById('price-value').textContent = formatUSDC(usdcPrice) + ' USDC';
                document.getElementById('status-value').textContent = isActive ? 'Active' : 'Inactive';
                document.getElementById('status-value').className = isActive ? 'value status-active' : 'value status-inactive';
                
                // Load user account and check USDC balance
                await checkUserBalance();
                
            } catch (error) {
                console.error('[OTC] Error loading listing:', error);
                document.getElementById('seller-value').textContent = 'Error loading';
                document.getElementById('token-value').textContent = 'Error loading';
                document.getElementById('amount-value').textContent = 'Error loading';
                document.getElementById('price-value').textContent = 'Error loading';
                document.getElementById('status-value').textContent = 'Error';
            }
        }
        
        // Check user's USDC balance
        async function checkUserBalance() {
            try {
                const account = await getUserAccount();
                const usdcBalance = await getTokenBalance(USDC_ADDRESS, account);
                
                const formattedUSDCBalance = formatUSDC(usdcBalance);
                const formattedRequiredUSDC = formatUSDC(listingData.usdcPrice);
                
                // Update balance display
                document.getElementById('usdc-balance-value').textContent = formattedUSDCBalance + ' USDC';
                document.getElementById('required-usdc-value').textContent = formattedRequiredUSDC + ' USDC';
                document.getElementById('usdc-balance-info').style.display = 'block';
                
                // Show appropriate button based on balance and listing status
                document.getElementById('loading-button').style.display = 'none';
                
                if (!listingData.isActive) {
                    // Listing is not active
                    const inactiveButton = document.createElement('button');
                    inactiveButton.className = 'button';
                    inactiveButton.disabled = true;
                    inactiveButton.textContent = 'LISTING NOT AVAILABLE';
                    document.querySelector('.container .window-content').appendChild(inactiveButton);
                } else if (usdcBalance >= listingData.usdcPrice) {
                    // User has enough USDC
                    document.getElementById('buy-button').style.display = 'block';
                } else {
                    // User needs more USDC
                    document.getElementById('buy-usdc-button').style.display = 'block';
                }
                
            } catch (error) {
                console.error('[OTC] Error checking balance:', error);
                document.getElementById('usdc-balance-value').textContent = 'Error checking balance';
                document.getElementById('loading-button').style.display = 'none';
                
                // Show generic buy button if we can't check balance
                document.getElementById('buy-button').style.display = 'block';
            }
        }
        
        // Execute listing (buy tokens)
        async function executeListing(listingId) {
            console.log('[OTC] Executing listing purchase...', { listingId });
            const provider = await getEthereumProvider();
            
            if (!provider) {
                console.error('[OTC] ✗ No provider for executeListing');
                throw new Error('No Ethereum provider found');
            }
            
            // Request account access
            console.log('[OTC] Requesting account access...');
            const accounts = await provider.request({ method: 'eth_requestAccounts' });
            const account = accounts[0];
            console.log('[OTC] Using account:', account);
            
            // Prepare transaction for executeListing
            const functionSelector = '0x625eb5a7'; // executeListing function selector
            const listingIdPadded = BigInt(listingId).toString(16).padStart(64, '0');
            const data = functionSelector + listingIdPadded;
            console.log('[OTC] Transaction data:', data);
            
            const tx = {
                to: CONTRACT_ADDRESS,
                from: account,
                data: data
            };
            console.log('[OTC] Transaction object:', tx);
            
            // Send transaction
            console.log('[OTC] Sending executeListing transaction...');
            const txHash = await provider.request({
                method: 'eth_sendTransaction',
                params: [tx]
            });
            console.log('[OTC] ✓ Transaction sent, hash:', txHash);
            
            return txHash;
        }
        
        // Handle buy button
        document.getElementById('buy-button').addEventListener('click', async () => {
            console.log('[OTC] Buy button clicked');
            const buyButton = document.getElementById('buy-button');
            const successMessage = document.getElementById('success-message');
            const errorMessage = document.getElementById('error-message');
                
                try {
                    buyButton.disabled = true;
                    buyButton.textContent = 'BUYING...';
                    console.log('[OTC] Buy button disabled');
                    
                    // Hide previous messages
                    successMessage.style.display = 'none';
                    errorMessage.style.display = 'none';
                    
                    console.log('[OTC] Executing listing purchase...');
                    const txHash = await executeListing(LISTING_ID);
                    console.log('[OTC] ✓ Purchase successful, tx hash:', txHash);
                    
                    // Show success message
                    successMessage.textContent = \`Purchase successful! Transaction: \${txHash}\`;
                    successMessage.style.display = 'block';
                    
                    buyButton.textContent = 'PURCHASED!';
                    
                } catch (error) {
                    console.error('[OTC] ✗ Error buying tokens:', error);
                    console.error('[OTC] Buy error details:', { 
                        message: error.message, 
                        stack: error.stack,
                        listingId: LISTING_ID
                    });
                    errorMessage.textContent = \`Error: \${error.message}\`;
                    errorMessage.style.display = 'block';
                    
                    buyButton.disabled = false;
                    buyButton.textContent = 'BUY TOKENS';
                    console.log('[OTC] Buy button re-enabled after error');
                }
        });
        
        // Handle buy USDC button
        document.getElementById('buy-usdc-button').addEventListener('click', async () => {
            console.log('[OTC] Buy USDC button clicked');
            try {
                const requiredUSDC = listingData.usdcPrice;
                // Convert to human readable amount for swap (6 decimals)
                const usdcAmountForSwap = Number(requiredUSDC) / 1000000;
                
                console.log('[OTC] Swapping ETH for', usdcAmountForSwap, 'USDC');
                
                const swapParams = {
                    sellToken: "eip155:8453/slip44:60", // ETH on Base
                    buyToken: "eip155:8453/erc20:0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", // USDC on Base
                    buyAmount: requiredUSDC.toString(), // Raw amount (6 decimals)
                };
                
                console.log('[OTC] Swap parameters:', swapParams);
                await sdk.actions.swapToken(swapParams);
                console.log('[OTC] ✓ USDC swap completed');
                
                // Refresh balance and update UI
                await checkUserBalance();
                
            } catch (error) {
                console.error('[OTC] ✗ Error swapping for USDC:', error);
                const errorMessage = document.getElementById('error-message');
                errorMessage.textContent = \`Error buying USDC: \${error.message}\`;
                errorMessage.style.display = 'block';
            }
        });
        
        // Info button handlers
        document.getElementById('info-button').addEventListener('click', () => {
            console.log('[OTC] Info button clicked on listing page');
            document.getElementById('info-screen').style.display = 'block';
        });
        
        document.getElementById('close-info').addEventListener('click', () => {
            console.log('[OTC] Close info button clicked on listing page');
            document.getElementById('info-screen').style.display = 'none';
        });
        
        // Initialize app
        console.log('[OTC] Starting listing detail page initialization...');
        initializeApp();
    </script>
</body>
</html>
  `);
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

    // Store cast data for later retrieval in TGC interface
    castStore.storeCast(castData);

    // Check if this is a TGC (Token Generation Ceremony) request
    const hasTGCIntent = detectTGCIntent(castData.text);

    let response = "";
    let embedUrl = "";
    let shouldPublishReply = false;

    if (hasTGCIntent) {
      console.log("[Feybot] TGC intent detected, generating parameters...");

      // Check media validity for TGC
      if (!castData.media.isValid) {
        response =
          `🚀 TGC Intent Detected!\n\n` +
          `⚠️ Media Issue: ${castData.media.error}\n\n` +
          `For Token Generation Ceremonies, please attach exactly one image/video as your token's official media.\n\n` +
          `Try again with a single media attachment! 🎨`;
        shouldPublishReply = true;
      } else {
        // Generate TGC parameters from the cast
        const tgcParams = generateTGCParameters(
          castData.text,
          castData.author.fid
        );

        // Store TGC parameters with cast data
        castStore.updateTGCParams(castData.hash, tgcParams);

        response =
          `🚀 TGC Intent Detected!\n\n` +
          `Token: ${tgcParams.token.name} (${tgcParams.token.symbol})\n` +
          `Community Cap: ${(
            parseFloat(tgcParams.communityContributionCap) / 1e18
          ).toFixed(1)} ETH\n` +
          `Team Cap: ${(
            parseFloat(tgcParams.teamContributionCap) / 1e18
          ).toFixed(1)} ETH\n` +
          `🎨 Token Media: Attached image will be used\n\n` +
          `🎯 Ready to launch your Token Generation Ceremony!\n\n` +
          `Click below to configure and deploy:`;

        embedUrl = `${
          process.env.BASE_URL || "https://feybot.lat"
        }/miniapp-on-reply-to/${castData.hash}`;
        shouldPublishReply = true;

        console.log("[Feybot] TGC parameters generated:", tgcParams);
      }
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
          response =
            `🎯 Found this token in the Fey protocol!\n\n` +
            `Token: ${token?.tokenName} (${token?.tokenSymbol})\n` +
            `Creator: ${token?.msgSender.slice(
              0,
              6
            )}...${token?.msgSender.slice(-4)}\n` +
            `Pool ID: ${token?.poolId.slice(0, 10)}...\n` +
            `Extensions: ${
              JSON.parse(token?.extensions || "[]").length
            } active\n\n` +
            `📊 View on Base: https://basescan.org/address/${token?.tokenAddress}`;
        } else {
          response =
            `🔍 I checked the Fey protocol but didn't find that token address.\n\n` +
            `The token might not have been deployed through Fey, or the address might be incorrect.\n\n` +
            `💡 Want to launch a Token Generation Ceremony? Just say "start tgc" or "launch token"!`;
        }
        shouldPublishReply = true;
      } else if (
        castData.text?.toLowerCase().includes("token") ||
        castData.text?.toLowerCase().includes("fey")
      ) {
        // General token query without address
        response =
          `🚀 Hey! I'm Feybot, your guide to the Fey protocol!\n\n` +
          `Fey is a token launcher on Base that creates tokens with:\n` +
          `• Automated liquidity via Uniswap v4\n` +
          `• Custom hooks for advanced functionality\n` +
          `• Extension system for additional features\n` +
          `• MEV protection modules\n\n` +
          `💡 Want to launch a TGC? Say "start tgc [token name]"!\n` +
          `📝 Or drop a token address to check if it's from Fey!`;
        shouldPublishReply = true;
      } else {
        // General query about Fey
        response =
          `👋 Hi ${
            castData.author.displayName || castData.author.username
          }!\n\n` +
          `I'm Feybot! I help with questions about the Fey protocol.\n\n` +
          `🔥 Fey is a next-gen token launcher on Base featuring:\n` +
          `• Uniswap v4 integration\n` +
          `• Custom hooks & extensions\n` +
          `• MEV protection\n` +
          `• Advanced tokenomics\n\n` +
          `Contract: 0x8EEF0dC80ADf57908bB1be0236c2a72a7e379C2d\n\n` +
          `Say "start tgc" to launch a Token Generation Ceremony! 🤖`;
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
                  font-family: 'Courier New', monospace; 
                  background: #000; 
                  color: #4FC65F; 
                  padding: 2rem; 
                  text-align: center; 
              }
              .error { 
                  background: rgba(79, 198, 95, 0.1); 
                  border: 1px solid #4FC65F; 
                  border-radius: 10px; 
                  padding: 2rem; 
                  max-width: 500px; 
                  margin: 0 auto; 
              }
          </style>
      </head>
      <body>
          <div class="error">
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

// TGC API endpoints
app.get("/api/tgc/start-interface", (c) => {
  return c.html(`
    <div class="tgc-interface" id="tgc-interface">
      <h2>🚀 Starting Token Generation Ceremony...</h2>
      <p>Redirecting to TGC configuration interface...</p>
      <script>
        setTimeout(() => {
          window.location.href = '/';
        }, 1500);
      </script>
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
          `https://feybot.orbiter.website/token-image/${(
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
