import { isGeminiConfigured, testGeminiConnection, getActiveApiKey } from './services/gemini.service.js';

async function verifyGeminiConnection() {
  console.log('===========================================================');
  console.log('🤖 Stratagem AI: Google Gemini Connection Verification');
  console.log('===========================================================');

  if (!isGeminiConfigured()) {
    console.log('Status: ⚠️  NOT CONFIGURED');
    console.log('Reason: GEMINI_API_KEY is not defined in server/.env');
    console.log('');
    console.log('👉 How to connect your Google Gemini API key:');
    console.log('1. Go to Google AI Studio: https://aistudio.google.com/app/apikey');
    console.log('2. Create and copy a free API key');
    console.log('3. Open server/.env and add:');
    console.log('   GEMINI_API_KEY=your_actual_key_here');
    console.log('4. Re-run: npm run test:gemini --workspace=server');
    console.log('===========================================================');
    return;
  }

  const maskedKey = getActiveApiKey().slice(0, 6) + '...' + getActiveApiKey().slice(-4);
  console.log(`Detected Key: ${maskedKey}`);
  console.log('Contacting Google Gemini API...');

  const result = await testGeminiConnection();

  if (result.success) {
    console.log('Status: ✅ CONNECTED & OPERATIONAL');
    console.log(`Model Handshake: ${result.model}`);
    console.log(`Test Ping Reply: "${result.sampleResponse}"`);
    console.log('Gemini Executive Brief & AI Strategic Assistant features are fully enabled!');
  } else {
    console.error('Status: ❌ CONNECTION FAILED');
    console.error(`Error details: ${result.error}`);
    console.log('');
    console.log('Troubleshooting tips:');
    console.log('- Ensure your API key is active in Google AI Studio.');
    console.log('- Verify internet connectivity to generativelanguage.googleapis.com.');
  }
  console.log('===========================================================');
}

verifyGeminiConnection();
