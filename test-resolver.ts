import { resolveYouTubeHandle } from './src/utils/youtubeHandleResolver';

async function testResolver() {
  console.log('Testing YouTube handle resolver...\n');
  
  const testCases = [
    '@GuikiPT',
    'GuikiPT',
    'https://www.youtube.com/@GuikiPT',
    'UC-lHJZR3Gqxm24_Vd_AJ5Yw', // Already a channel ID
  ];

  for (const testCase of testCases) {
    console.log(`Testing: ${testCase}`);
    try {
      const result = await resolveYouTubeHandle(testCase);
      if (result.channelId) {
        console.log(`✅ Success: ${result.channelId} (method: ${result.method})`);
        if (result.channelName) {
          console.log(`   Channel name: ${result.channelName}`);
        }
      } else {
        console.log(`❌ Failed: ${result.error}`);
      }
    } catch (error) {
      console.log(`❌ Error: ${error}`);
    }
    console.log('---');
  }
}

testResolver();
