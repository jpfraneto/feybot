import { detectTGCIntent, generateTGCParameters } from './src/api/utils/tgc-analyzer.ts';

// Simple test script to demonstrate AI-powered TGC analysis
async function testAIAnalyzer() {
  console.log('🤖 Testing AI-Powered TGC Intent Analysis\n');

  const testCasts = [
    {
      text: "@feybot I want to launch a TGC for my project called 'DeFi Hunters' with symbol DFH. Looking for 15 ETH from community and 8 ETH from our team.",
      description: "Explicit TGC intent with specific parameters"
    },
    {
      text: "Hey @feybot, starting a token generation ceremony for 'Community Gold' (CGOLD). Community cap: 20 ETH, team: 10 ETH, min deposit: 0.05 ETH",
      description: "Detailed TGC request with all parameters"
    },
    {
      text: "Building something cool for the community. Thinking about fair launch mechanics...",
      description: "Vague community-building language"
    },
    {
      text: "@feybot create a token please",
      description: "Simple token creation request"
    },
    {
      text: "GM! Just talking about the weather today 🌞",
      description: "Non-TGC related content"
    }
  ];

  for (let i = 0; i < testCasts.length; i++) {
    const { text, description } = testCasts[i];
    console.log(`📝 Test ${i + 1}: ${description}`);
    console.log(`Cast: "${text}"`);
    
    try {
      // Test intent detection
      const hasIntent = await detectTGCIntent(text);
      console.log(`🎯 TGC Intent Detected: ${hasIntent ? '✅ YES' : '❌ NO'}`);
      
      if (hasIntent) {
        // Test parameter generation
        const params = await generateTGCParameters(text, 12345);
        console.log(`🔧 Generated Parameters:`);
        console.log(`   Token: ${params.token.name} (${params.token.symbol})`);
        console.log(`   Community Cap: ${(parseInt(params.communityContributionCap) / 1e18).toFixed(1)} ETH`);
        console.log(`   Team Cap: ${(parseInt(params.teamContributionCap) / 1e18).toFixed(1)} ETH`);
      }
      
    } catch (error) {
      console.error(`❌ Error: ${error.message}`);
    }
    
    console.log('---\n');
  }
}

// Only run if CLAUDE_API_KEY is set
if (process.env.CLAUDE_API_KEY) {
  testAIAnalyzer().then(() => {
    console.log('✅ AI Analysis Test Complete');
    process.exit(0);
  }).catch((error) => {
    console.error('❌ Test Failed:', error);
    process.exit(1);
  });
} else {
  console.log('⚠️  CLAUDE_API_KEY not set - skipping AI analysis test');
  console.log('Set your Claude API key to test the AI functionality');
  process.exit(0);
}