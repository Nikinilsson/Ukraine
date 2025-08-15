import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import type { SummaryData, Source, Highlight } from '../types';
import { NEWS_OUTLETS } from '../constants';

// Access the API key from environment variables.
const API_KEY = process.env.API_KEY;

let ai: GoogleGenAI | null = null;

// Initialize the client only if the API key is present.
if (API_KEY) {
  ai = new GoogleGenAI({ apiKey: API_KEY });
}

/**
 * A helper function to get the initialized AI client.
 * Throws a user-friendly error if the client is not available.
 */
const getAiClient = (): GoogleGenAI => {
  if (!ai) {
    throw new Error(
      "The Google Gemini API client is not initialized. Please ensure the API key is configured correctly."
    );
  }
  return ai;
};


const buildPrompt = (topic: string): string => {
  const leftLeaningSources = NEWS_OUTLETS['Left-Leaning'].join(', ');
  const rightLeaningSources = NEWS_OUTLETS['Right-Leaning'].join(', ');
  const centerSources = NEWS_OUTLETS['Center'].join(', ');

  return `
    You are an expert, unbiased news analyst. Your task is to synthesize information from various news sources to provide a neutral, balanced summary, and also provide analysis on how different media leanings cover specific points.

    Here is a list of news outlets and their general political leanings:
    - Left-Leaning: ${leftLeaningSources}
    - Right-Leaning: ${rightLeaningSources}
    - Centrist: ${centerSources}

    Topic to Summarize: "${topic}"

    Instructions for your output:
    Your output MUST be in a specific structure with three parts separated by unique separators.

    PART 1: THE SUMMARY
    1. Search for recent news articles (last 7 days) on the topic.
    2. Write a concise, factual, and unbiased summary of 3-4 paragraphs.

    PART 2: THE PULL QUOTE & IMAGE PROMPT
    1. After the summary, insert the separator: '|||---PULL_QUOTE---|||'.
    2. After this separator, write the single most impactful sentence from your summary as a "pull quote".
    3. After the pull quote, insert the separator: '|||---IMAGE_PROMPT---|||'.
    4. After this separator, write a short, neutral prompt for an image generation AI that visually represents the summary's key theme.

    PART 3: PERSPECTIVES JSON
    1. After the image prompt, insert the final separator: '|||---PERSPECTIVES_JSON---|||'.
    2. After this final separator, you MUST provide a JSON object. This JSON object should be an array of "highlights".
    3. For 2-4 key phrases or sentences in your summary that are likely to be framed differently by various media, create a highlight object.
    4. Each highlight object in the JSON array must have two keys:
       - "textToHighlight": The exact string from your summary to be highlighted.
       - "perspectives": An object with three keys: "left", "center", and "right". The value for each key should be a brief (1-2 sentences) explanation of how that media leaning (Left, Center, Right) typically frames or reports on the "textToHighlight".

    Example of the complete output structure:
    [Your 3-4 paragraph summary is here...]
    |||---PULL_QUOTE---|||
    [The single most important sentence from the summary]
    |||---IMAGE_PROMPT---|||
    [Your image generation prompt here]
    |||---PERSPECTIVES_JSON---|||
    [
      {
        "textToHighlight": "the recent delivery of F-16 fighter jets",
        "perspectives": {
          "left": "Reporting often emphasizes the defensive nature of the jets and the international coalition's role in supporting Ukrainian sovereignty.",
          "center": "Focuses on the technical capabilities of the aircraft, the training timeline for pilots, and the potential impact on battlefield dynamics.",
          "right": "Coverage may question the slow pace of delivery and argue for more aggressive military aid to achieve a decisive outcome."
        }
      },
      {
        "textToHighlight": "the economic impact of the war on global grain supplies",
        "perspectives": {
          "left": "Highlights the humanitarian crisis and food insecurity in developing nations, often linking it to geopolitical power plays.",
          "center": "Reports on market fluctuations, shipping lane security, and diplomatic efforts to keep ports open, citing economic data.",
          "right": "Frames the issue around national security interests and the economic consequences for domestic consumers and farmers."
        }
      }
    ]
    `;
};

export const generateLeaningFocusSummary = async (leaning: 'Left-Leaning' | 'Right-Leaning' | 'Center'): Promise<string> => {
    const outlets = NEWS_OUTLETS[leaning].join(', ');
    const prompt = `
      You are an expert, unbiased news analyst.
      Your task is to analyze the recent coverage of the war in Ukraine from a specific group of media outlets and summarize their primary focus.

      Media Group to Analyze: ${leaning}
      Outlets in this group: ${outlets}

      Instructions:
      1. Using Google Search, analyze news articles published in the last 7 days from the outlets listed above.
      2. Identify the main narratives, recurring themes, and key points of emphasis in their coverage of the war in Ukraine.
      3. Synthesize your findings into a concise, objective summary of 2-3 paragraphs. Do not inject your own opinions. The summary should strictly reflect the focus of the specified media group.
      4. Your response should ONLY be the summary text.
    `;

    try {
      const client = getAiClient();
      const response: GenerateContentResponse = await client.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
        },
      });

      const summaryText = response.text;
      if (!summaryText) {
        throw new Error(`The AI returned an empty summary for ${leaning} focus.`);
      }
      return summaryText.trim();
    } catch (error) {
      console.error(`Error generating focus summary for ${leaning}:`, error);
      if (error instanceof Error && error.message.includes('SAFETY')) {
          throw new Error('The request was blocked due to safety settings.');
      }
      // Re-throw the original error to be caught by the UI
      throw error;
    }
};

export const generateNewsSummary = async (topic: string): Promise<SummaryData> => {
  try {
    const client = getAiClient();
    const prompt = buildPrompt(topic);
    
    const textResponse: GenerateContentResponse = await client.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            tools: [{ googleSearch: {} }],
        },
    });

    const combinedText = textResponse.text;
    if (!combinedText) {
        throw new Error('The AI returned an empty summary. This might be due to content restrictions or lack of recent news.');
    }
    
    const pullQuoteSeparator = '|||---PULL_QUOTE---|||';
    const imagePromptSeparator = '|||---IMAGE_PROMPT---|||';
    const perspectivesJsonSeparator = '|||---PERSPECTIVES_JSON---|||';

    // Split for perspectives JSON
    const mainParts = combinedText.split(perspectivesJsonSeparator);
    const textPart = mainParts[0];
    const jsonPart = mainParts[1];

    let summaryText = textPart;
    let pullQuote: string | undefined;
    let imagePrompt: string | null = null;
    let highlights: Highlight[] = [];
    let imageUrl: string | undefined;
    let imageCredit: string | undefined;

    if (textPart.includes(imagePromptSeparator) && textPart.includes(pullQuoteSeparator)) {
        const summaryAndQuotePart = textPart.split(imagePromptSeparator)[0];
        imagePrompt = textPart.split(imagePromptSeparator)[1]?.trim();
        
        summaryText = summaryAndQuotePart.split(pullQuoteSeparator)[0]?.trim();
        pullQuote = summaryAndQuotePart.split(pullQuoteSeparator)[1]?.trim();
    } else {
        console.warn(`Separators not found for topic: "${topic}". Proceeding without pull quote or image.`);
        summaryText = textPart.trim();
    }

    if (jsonPart) {
        try {
            highlights = JSON.parse(jsonPart.trim());
        } catch (e) {
            console.error(`Failed to parse perspectives JSON for topic "${topic}":`, e);
            // Proceed without highlights if JSON is malformed
        }
    }

    if (imagePrompt) {
        try {
            const imageResponse = await client.models.generateImages({
                model: 'imagen-3.0-generate-002',
                prompt: `${imagePrompt}, photorealistic news style, high detail`,
                config: {
                    numberOfImages: 1,
                    outputMimeType: 'image/jpeg',
                    aspectRatio: '16:9',
                },
            });

            if (imageResponse.generatedImages && imageResponse.generatedImages.length > 0) {
                const base64ImageBytes = imageResponse.generatedImages[0].image.imageBytes;
                imageUrl = `data:image/jpeg;base64,${base64ImageBytes}`;
                imageCredit = "AI-generated artistic representation of the news.";
            }
        } catch (imgError) {
            console.error(`Failed to generate image for topic "${topic}":`, imgError);
        }
    }

    const groundingMetadata = textResponse.candidates?.[0]?.groundingMetadata;
    const sources: Source[] = (groundingMetadata?.groundingChunks || [])
        .map((chunk: any) => ({
            uri: chunk.web?.uri || '',
            title: chunk.web?.title || 'Untitled Source',
        }))
        .filter(source => source.uri)
        .filter((source, index, self) => index === self.findIndex(s => s.uri === source.uri));

    return {
      topic,
      summary: summaryText,
      sources,
      timestamp: new Date().toLocaleString(),
      imageUrl,
      imageCredit,
      pullQuote,
      highlights,
    };
  } catch (error) {
    console.error('Error fetching from Gemini API:', error);
    if (error instanceof Error && error.message.includes('SAFETY')) {
        throw new Error('The request was blocked due to safety settings. Please try a different topic.');
    }
    // Re-throw the original error to be caught by the UI
    throw error;
  }
};