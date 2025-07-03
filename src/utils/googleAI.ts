import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '../config/config';
import { detectLanguage } from './languageDetector';

let genAI: GoogleGenerativeAI | null = null;

export interface EnhancedReminderResult {
  title: string;
  description: string;
  extractedTime: string | null;
  shouldNotifyInChannel: boolean;
  channelMention: string | null;
  detectedLanguage: string;
}

export function initializeGoogleAI(): boolean {
  if (!config.GOOGLE_AI_API_KEY) {
    console.warn('⚠️ Google AI API key not found. Reminder enhancement will be disabled.');
    return false;
  }
  
  try {
    genAI = new GoogleGenerativeAI(config.GOOGLE_AI_API_KEY);
    console.log('✅ Google AI initialized successfully (using Gemini 1.5 Flash - free model)');
    return true;
  } catch (error) {
    console.error('❌ Failed to initialize Google AI:', error);
    return false;
  }
}

export async function enhanceReminderMessage(originalMessage: string): Promise<EnhancedReminderResult | null> {
  if (!genAI) {
    console.warn('Google AI not initialized. Returning null.');
    return null;
  }

  // Detect the expected language locally
  const expectedLanguage = detectLanguage(originalMessage);

  try {
    // Use Gemini Flash 1.5 which is free and fast
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-1.5-flash',
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 500, // Limit tokens to reduce costs
      }
    });
    
    const prompt = `
CRITICAL INSTRUCTION: You MUST respond in the EXACT SAME LANGUAGE as the user's input message. The input language is detected as: ${expectedLanguage.toUpperCase()}

If the input is in English, respond ONLY in English. If the input is in Portuguese, respond ONLY in Portuguese. If the input is in Spanish, respond ONLY in Spanish.

Parse the following reminder message and provide a JSON response with these fields:

1. "title": A short, clear title for the reminder (max 50 characters) - MUST BE IN ${expectedLanguage.toUpperCase()}
2. "description": A detailed, actionable, and descriptive reminder message. Make it more engaging and specific than the original. Add context, motivation, or helpful details when appropriate. Be encouraging and clear about what needs to be done. (max 300 characters) - MUST BE IN ${expectedLanguage.toUpperCase()}
3. "extractedTime": Extract any time/date information from the message. Convert to standard format like "in 30 minutes", "in 1 hour", "tomorrow at 2pm", "in 1 week", etc. For Portuguese: "em 30 minutos", "em 1 hora", "amanhã às 14h", "na próxima semana". If no time is found, return null.
4. "shouldNotifyInChannel": true ONLY if the user explicitly asks to be notified in a channel (phrases like "notify me here"/"me notifique aqui", "remind me in this channel"/"me lembre neste canal", "post here"/"poste aqui", "notify in channel"/"notificar no canal", "in these channel", "in this channel"). Default is false for DM notification.
5. "channelMention": If shouldNotifyInChannel is true and a specific channel is mentioned, extract it (e.g., "#general"). Otherwise null.
6. "detectedLanguage": MUST BE "${expectedLanguage}"

Original message: "${originalMessage}"

LANGUAGE DETECTION RULES:
- If the message contains English words like "remind", "testing", "minute", "now", "these", "channel" → detectedLanguage = "en"
- If the message contains Portuguese words like "lembrar", "minuto", "agora", "canal" → detectedLanguage = "pt"  
- If the message contains Spanish words like "recordar", "minuto", "ahora", "canal" → detectedLanguage = "es"

RESPONSE LANGUAGE RULES:
- English input → English title and description
- Portuguese input → Portuguese title and description  
- Spanish input → Spanish title and description

Examples of CORRECT language matching:
English input: "remind me to test in 1 minute" 
→ English output: {"title": "Test Reminder", "description": "Time to run your test! Make sure everything is working properly and check the results.", "detectedLanguage": "en"}

Portuguese input: "me lembre de testar em 1 minuto"
→ Portuguese output: {"title": "Lembrete de Teste", "description": "Hora de executar seu teste! Certifique-se de que tudo está funcionando corretamente e verifique os resultados.", "detectedLanguage": "pt"}

Respond ONLY with valid JSON in this exact format:
{
  "title": "string",
  "description": "string", 
  "extractedTime": "string or null",
  "shouldNotifyInChannel": boolean,
  "channelMention": "string or null",
  "detectedLanguage": "string"
}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let responseText = response.text().trim();
    
    // Remove markdown code block formatting if present
    if (responseText.startsWith('```json')) {
      responseText = responseText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (responseText.startsWith('```')) {
      responseText = responseText.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }
    
    try {
      // Try to parse the JSON response
      const parsed = JSON.parse(responseText) as EnhancedReminderResult;
      
      // Validate the response structure
      if (typeof parsed.title === 'string' && 
          typeof parsed.description === 'string' && 
          typeof parsed.shouldNotifyInChannel === 'boolean' &&
          typeof parsed.detectedLanguage === 'string') {
        
        // Validate that the AI responded in the correct language
        const responseLanguage = detectLanguage(parsed.title + ' ' + parsed.description);
        if (responseLanguage !== expectedLanguage) {
          console.warn(`AI responded in wrong language. Expected: ${expectedLanguage}, Got: ${responseLanguage}. Falling back to original message.`);
          return null; // This will cause the system to use the original message
        }
        
        // Force the detected language to match our expectation
        parsed.detectedLanguage = expectedLanguage;
        
        return parsed;
      } else {
        console.warn('Google AI returned invalid JSON structure');
        return null;
      }
    } catch (parseError) {
      console.warn('Failed to parse Google AI JSON response:', responseText);
      return null;
    }
  } catch (error) {
    console.error('Error enhancing reminder message:', error);
    return null;
  }
}

export function isGoogleAIAvailable(): boolean {
  return genAI !== null;
}
