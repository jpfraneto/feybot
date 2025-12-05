# Feybot - Token Generation Ceremony Platform

A comprehensive platform for the Fey protocol featuring blockchain indexing, intelligent bot interactions, and magical Token Generation Ceremony (TGC) interfaces on Base.

## 🚀 TLDR - Quick Start

This is a **Ponder app**. Copy `.env.example` and rename it to `.env.local`. Fill every variable. Then:

```bash
bun install
bun run dev
```

**Docs**: [ponder.sh/docs](https://ponder.sh/docs)

**Frontend**: Farcaster miniapp served as HTMX with raw HTML and inline scripts. The codebase is structured to be understandable with minimal prior knowledge.

**Recommended**: Use **Claude 3.5 Sonnet** API for cast analysis and TGC parameter extraction - excellent at intent detection and structured data extraction.

---

## 🎯 Features

### 🤖 **Intelligent Feybot**
- **Natural Language Processing**: Detects TGC intent from cast mentions
- **Auto-Reply System**: Responds to tags with contextual information
- **Token Lookup**: Queries Fey protocol database for existing tokens
- **Smart Embeds**: Includes miniapp links when TGC intent detected

### 🚀 **Token Generation Ceremony Interface**
- **Magical Main Interface**: Animated fractal backgrounds with video/audio
- **Interactive Splashes**: 3D fractal effects on background clicks
- **TGC Configuration**: Complete parameter setup for token ceremonies
- **Transaction Generation**: Builds complete TGC deployment data

### 📊 **Blockchain Indexing** 
- **Fey Protocol Events**: Indexes all TokenCreated, ExtensionTriggered, and configuration events
- **Real-time Processing**: Processes events as they happen on Base
- **GraphQL API**: Query indexed data with flexible GraphQL interface
- **Database Storage**: Persistent storage of all protocol activity

### 🎨 **Immersive User Experience**
- **Animated SVG Fractals**: Multi-layer rotating fractals with glow effects
- **Background Video**: Auto-playing ambient video from feybot.lat
- **Ambient Audio**: Background music for magical experience  
- **Mobile Responsive**: Works perfectly on all devices
- **HTMX Integration**: Smooth, modern interactions without full page reloads

## 🌐 Routes

### **Main Interface**
- `/` - **TGC Launch Interface** with magical fractal background and "START TGC" button
- `/miniapp-on-reply-to/{cast-hash}` - **TGC Configuration Interface** for specific cast replies

### **Legacy OTC Interface** (Backwards Compatibility)
- `/otc` - Original OverTheCounter token marketplace interface
- `/listing/:id` - View and buy from specific OTC listings

### **API Endpoints**
- `/webhooks/neynar/feybot-tagged` - **Webhook endpoint** for Neynar bot mentions
- `/api/tgc/start-interface` - TGC initialization endpoint
- `/api/tgc/generate-transaction` - Generate TGC transaction data
- `/api/tgc/preview-parameters` - Preview TGC configuration
- `/health` - Health check endpoint

### **Data APIs**
- `/graphql` - GraphQL endpoint for indexed Fey protocol data
- `/sql/*` - Direct SQL queries for database access
- `/.well-known/farcaster.json` - Farcaster miniapp manifest

## 🚀 Quick Setup

### 1. **Install Dependencies**
```bash
bun install
```

### 2. **Environment Configuration**
```bash
cp .env.example .env
```

### 3. **Required Environment Variables**
```bash
# Fey Protocol Contract (Base Mainnet)
CONTRACT_ADDRESS="0x8EEF0dC80ADf57908bB1be0236c2a72a7e379C2d"
START_BLOCK="0"          # Block to start indexing from
PONDER_RPC_URL_8453="https://mainnet.base.org"

# Production Domain
BASE_URL="https://feybot.lat"

# Neynar Configuration (for bot functionality)
NEYNAR_WEBHOOK_ID="your_webhook_id"
NEYNAR_WEBHOOK_SECRET="your_webhook_secret"  
NEYNAR_API_KEY="your_api_key"
NEYNAR_FEYBOT_SIGNER_UUID="your_signer_uuid"

# Farcaster Miniapp Manifest (generate at farcaster.xyz/developers)
MANIFEST_HEADER="your_manifest_header"
MANIFEST_PAYLOAD="your_manifest_payload"
MANIFEST_SIGNATURE="your_manifest_signature"

# Database (optional - Ponder uses SQLite by default)
# DATABASE_URL="postgresql://user:pass@localhost/feybot"

# Backend Integration (optional)
BACKEND_API_BASE_URL="https://poiesis.anky.app"
INDEXER_API_KEY="your_backend_api_key"
```

### 4. **Start Development Server**
```bash
bun run dev
```

## 🎭 Feybot Workflow

### **1. User Mentions Bot**
User mentions @feybot in a cast with phrases like:
- "start tgc"
- "launch token" 
- "token generation ceremony"
- "create [token name] token"

### **2. Intent Detection & Response**
```typescript
// Bot detects TGC intent
const hasTGCIntent = detectTGCIntent(castText);

// Extracts parameters
const tgcParams = generateTGCParameters(castText, authorFid);

// Publishes reply with embed
await publishCast({
  text: "🚀 TGC Intent Detected! Ready to launch your ceremony!",
  parent_hash: castHash,
  embeds: [{ url: `https://feybot.lat/miniapp-on-reply-to/${castHash}` }]
});
```

### **3. TGC Configuration**
User clicks embedded link to configure:
- **Token Details**: Name, symbol, image
- **Contribution Caps**: Community and team caps in ETH
- **Liquidity Parameters**: Tick spacing, ranges
- **Deposit Limits**: Min/max community deposits

### **4. Transaction Generation**
System generates complete TGC transaction data:
```javascript
{
  "creator": "0x...",
  "token": {
    "name": "My Token",
    "symbol": "MTK", 
    "image": "https://feybot.lat/token-image/mtk.png"
  },
  "communityContributionCap": "10000000000000000000", // 10 ETH
  "teamContributionCap": "5000000000000000000",      // 5 ETH
  "caps": {
    "minCommunityDeposit": "100000000000000000",      // 0.1 ETH
    "maxCommunityDeposit": "1000000000000000000"      // 1 ETH
  }
}
```

## 🏗️ Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Farcaster     │    │      Feybot      │    │  Fey Protocol   │
│   Integration   │────│   Intelligence   │────│  Smart Contract │
│                 │    │                  │    │                 │
│ • Neynar API    │    │ • Intent Detect  │    │ • TokenCreated  │
│ • Cast Replies  │    │ • NLP Processing │    │ • Extensions    │
│ • Embeds        │    │ • Auto Responses │    │ • Hooks/Lockers │
└─────────────────┘    └──────────────────┘    └─────────────────┘
           │                       │                       │
           │            ┌──────────────────┐              │
           └────────────│     Miniapp      │──────────────┘
                        │   Experience     │
                        │                  │
                        │ • Fractal UI     │
                        │ • TGC Config     │
                        │ • HTMX Magic     │
                        └──────────────────┘
```

## 📊 Database Schema

### **Fey Protocol Tables**
- **`token_creations`**: Complete token deployment data with metadata
- **`extension_triggers`**: Extension usage tracking  
- **`fee_claims`**: Fee distribution events
- **`hook_updates`**: Hook enable/disable events
- **`locker_updates`**: Locker configuration changes
- **`extension_updates`**: Extension configuration changes
- **`mev_module_updates`**: MEV protection updates
- **`config_updates`**: Protocol-level configuration changes

### **Legacy OTC Tables** (Backwards Compatibility)
- **`listings`**: OverTheCounter marketplace listings
- **`listing_executions`**: Completed OTC purchases
- **`listing_cancellations`**: Cancelled OTC listings

## 🎨 Visual Features

### **Animated Fractal System**
```typescript
// Multi-layer rotating fractals
<path className="fractal-outer">  // 30s rotation
<path className="fractal-middle"> // 20s reverse rotation  
<path className="fractal-inner">  // 15s rotation + glow pulse
```

### **Interactive Effects**
- **Background Clicks**: Generate fractal splash animations
- **Hover Effects**: Glowing buttons and SVG transformations
- **Mobile Responsive**: Adapts beautifully to all screen sizes
- **Video Background**: Ambient video with audio for immersion

## 🔧 Development Scripts

```bash
bun run dev        # Start development server with hot reload
bun run start      # Start production server  
bun run build      # Build for production
bun run db         # Database management commands
bun run codegen    # Generate TypeScript types from schema
bun run lint       # ESLint code checking
bun run typecheck  # TypeScript type checking
```

## 🌍 Deployment

### **Production Setup**
- **Domain**: `https://feybot.lat`
- **Network**: Base Mainnet
- **Contract**: `0x8EEF0dC80ADf57908bB1be0236c2a72a7e379C2d`

### **Neynar Webhook Configuration**
1. Create webhook at [Neynar Dashboard](https://neynar.com/dashboard)
2. Point to: `https://feybot.lat/webhooks/neynar/feybot-tagged`
3. Configure for bot mentions and direct casts
4. Add webhook ID, secret, and API key to environment

### **Farcaster Miniapp Manifest**
Generate manifest for `feybot.lat` at [Farcaster Developers](https://farcaster.xyz/developers):
```json
{
  "accountAssociation": {
    "header": "...",
    "payload": "...", 
    "signature": "..."
  },
  "miniapp": {
    "name": "Feybot TGC",
    "iconUrl": "https://feybot.lat/static/icon.svg",
    "homeUrl": "https://feybot.lat"
  }
}
```

## 🤖 Smart Contract Integration

**Fey Protocol Contract**: `0x8EEF0dC80ADf57908bB1be0236c2a72a7e379C2d` (Base)  
**BaseScan**: [View Contract](https://basescan.org/address/0x8EEF0dC80ADf57908bB1be0236c2a72a7e379C2d)

### **Key Features**
- **Token Generation Ceremonies**: Advanced token launches with community participation
- **Uniswap v4 Integration**: Automated liquidity provision with custom hooks
- **Extension System**: Modular token functionality via extensions
- **MEV Protection**: Built-in protection against MEV attacks
- **Hook Architecture**: Custom logic execution during swaps and mints

### **Indexed Events**
- `TokenCreated`: Full token deployment with all metadata
- `ExtensionTriggered`: Extension activation and usage
- `ClaimFees`: Fee distribution tracking
- `SetHook/SetLocker/SetExtension/SetMevModule`: Configuration updates

## 🎯 Contributing

This platform combines blockchain infrastructure, AI-powered bot interactions, and magical user experiences to make Token Generation Ceremonies accessible and delightful for everyone in the Farcaster ecosystem.

### **Tech Stack**
- **Backend**: Ponder (TypeScript indexing framework)
- **Frontend**: HTMX + Hyperscript for reactive interactions
- **Database**: SQLite (default) or PostgreSQL  
- **Blockchain**: Base (Ethereum L2)
- **Bot**: Neynar API integration
- **Design**: Custom CSS with fractal animations

---

**Built with 🤖 by Feybot for the Fey Protocol community** ✨