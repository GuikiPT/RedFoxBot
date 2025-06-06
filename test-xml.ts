import { XMLTubeInfoFetcher } from './src/utils/xmlTubeInfoFetcher';

// Test with a popular YouTube channel (replace with actual channel ID for testing)
async function test() {
  try {
    console.log('Testing XMLTubeInfoFetcher...');
    // Using PewDiePie's channel as an example (you can replace with any channel ID)
    const result = await XMLTubeInfoFetcher('UC-lHJZR3Gqxm24_Vd_AJ5Yw');
    if (result) {
      console.log('Success! Channel:', result.author.name);
      console.log('Videos found:', result.videos.length);
      if (result.videos.length > 0) {
        console.log('Latest video:', result.videos[0].title);
      }
    } else {
      console.log('No data returned');
    }
  } catch (error) {
    console.error('Test failed:', error);
  }
}

test();
