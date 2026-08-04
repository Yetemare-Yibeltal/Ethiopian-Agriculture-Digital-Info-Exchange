// backend/src/services/aiService.js
import {
  isGroqConfigured,
  getGroqHeaders,
  getGroqAudioHeaders,
  buildExtractionPrompt,
  mapProductName,
  getDefaultShelfLife,
  extractLocation,
  groqConfig,
} from "../config/groq.js";

const GROQ_API_URL = groqConfig.baseURL;

/**
 * AI Service - Handles voice transcription and data extraction
 */
export const aiService = {
  /**
   * Transcribe audio using Groq's Whisper API
   * @param {Buffer|string} audioFile - Audio file buffer or base64 string
   * @param {string} language - Language code (default: 'am' for Amharic)
   * @returns {Promise<{ success: boolean, text: string, error: Object }>}
   */
  async transcribeAudio(audioFile, language = "am") {
    try {
      if (!isGroqConfigured()) {
        console.warn(
          "⚠️ GROQ_API_KEY not configured. AI features unavailable.",
        );
        return {
          success: false,
          error: new Error("GROQ_API_KEY is not configured"),
        };
      }

      if (!audioFile) {
        return { success: false, error: new Error("Audio file is required") };
      }

      // Prepare the audio for the API
      let audioData;
      let contentType;

      if (typeof audioFile === "string") {
        if (audioFile.startsWith("data:audio")) {
          const matches = audioFile.match(/^data:audio\/(\w+);base64,(.+)$/);
          if (matches) {
            contentType = `audio/${matches[1]}`;
            audioData = Buffer.from(matches[2], "base64");
          } else {
            audioData = Buffer.from(audioFile, "base64");
            contentType = "audio/mpeg";
          }
        } else {
          return {
            success: false,
            error: new Error(
              "File path not supported. Please provide audio buffer or base64.",
            ),
          };
        }
      } else if (Buffer.isBuffer(audioFile)) {
        audioData = audioFile;
        contentType = "audio/mpeg";
      } else {
        return { success: false, error: new Error("Unsupported audio format") };
      }

      // Create form data
      const formData = new FormData();
      const blob = new Blob([audioData], { type: contentType });
      formData.append("file", blob, "audio.mp3");
      formData.append("model", groqConfig.models.whisper);
      formData.append("language", language);
      formData.append("response_format", "json");
      formData.append("temperature", "0.0");

      const response = await fetch(`${GROQ_API_URL}/audio/transcriptions`, {
        method: "POST",
        headers: getGroqAudioHeaders(),
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ Groq API error:", response.status, errorText);
        return {
          success: false,
          error: new Error(`Groq API error: ${response.status} - ${errorText}`),
        };
      }

      const data = await response.json();
      const transcribedText = data.text || "";

      console.log(
        `✅ Audio transcribed successfully: "${transcribedText.substring(0, 50)}..."`,
      );

      return {
        success: true,
        text: transcribedText,
        data,
      };
    } catch (error) {
      console.error("❌ Transcription error:", error.message);
      return { success: false, error };
    }
  },

  /**
   * Extract product listing data from transcribed text using Groq's LLM
   * @param {string} text - The transcribed text
   * @returns {Promise<{ success: boolean, data: Object, error: Object }>}
   */
  async extractListingData(text) {
    try {
      if (!isGroqConfigured()) {
        console.warn(
          "⚠️ GROQ_API_KEY not configured. AI features unavailable.",
        );
        return {
          success: false,
          error: new Error("GROQ_API_KEY is not configured"),
        };
      }

      if (!text || text.trim().length === 0) {
        return {
          success: false,
          error: new Error("Text is required for extraction"),
        };
      }

      const prompt = buildExtractionPrompt(text);

      const response = await fetch(`${GROQ_API_URL}/chat/completions`, {
        method: "POST",
        headers: getGroqHeaders(),
        body: JSON.stringify({
          model: groqConfig.models.llm,
          messages: [
            {
              role: "system",
              content:
                "You are a data extraction assistant. Extract structured data from Amharic agricultural listings. Return ONLY valid JSON.",
            },
            {
              role: "user",
              content: prompt,
            },
          ],
          temperature: groqConfig.temperature,
          max_tokens: groqConfig.maxTokens,
          response_format: { type: "json_object" },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ Groq API error:", response.status, errorText);
        return {
          success: false,
          error: new Error(`Groq API error: ${response.status} - ${errorText}`),
        };
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || "{}";

      let extractedData = {};
      try {
        extractedData = JSON.parse(content);
      } catch (e) {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          extractedData = JSON.parse(jsonMatch[0]);
        } else {
          return {
            success: false,
            error: new Error("Failed to parse AI response"),
          };
        }
      }

      // Map product name to English
      if (extractedData.product_name) {
        extractedData.product_name = mapProductName(extractedData.product_name);
      }

      // Get default shelf life
      if (extractedData.product_name) {
        extractedData.shelf_life_days = getDefaultShelfLife(
          extractedData.product_name,
        );
      }

      // Extract location if not already extracted
      if (!extractedData.location) {
        extractedData.location = extractLocation(text);
      }

      console.log(`✅ Data extracted:`, extractedData);

      return {
        success: true,
        data: {
          product_name: extractedData.product_name || null,
          quantity_quintals: parseInt(extractedData.quantity_quintals) || null,
          unit_price: parseFloat(extractedData.unit_price) || null,
          location: extractedData.location || null,
          harvest_date: extractedData.harvest_date || null,
          shelf_life_days: extractedData.shelf_life_days || 7,
        },
        raw: extractedData,
      };
    } catch (error) {
      console.error("❌ Extraction error:", error.message);
      return { success: false, error };
    }
  },

  /**
   * Full pipeline: transcribe audio and extract listing data
   * @param {Buffer|string} audioFile - Audio file buffer or base64 string
   * @param {string} language - Language code (default: 'am')
   * @returns {Promise<{ success: boolean, transcription: string, data: Object, error: Object }>}
   */
  async processVoiceListing(audioFile, language = "am") {
    try {
      // Step 1: Transcribe
      const transcriptionResult = await this.transcribeAudio(
        audioFile,
        language,
      );
      if (!transcriptionResult.success) {
        return {
          success: false,
          error: transcriptionResult.error,
        };
      }

      const transcribedText = transcriptionResult.text;

      // Step 2: Extract data
      const extractionResult = await this.extractListingData(transcribedText);

      return {
        success: extractionResult.success,
        transcription: transcribedText,
        data: extractionResult.success ? extractionResult.data : null,
        raw: extractionResult.raw || null,
        error: extractionResult.error || null,
      };
    } catch (error) {
      console.error("❌ Voice listing processing error:", error.message);
      return { success: false, error };
    }
  },

  /**
   * Check if the AI service is available
   * @returns {Promise<{ available: boolean, message: string }>}
   */
  async checkAvailability() {
    if (!isGroqConfigured()) {
      return {
        available: false,
        message: "GROQ_API_KEY is not configured in environment variables",
      };
    }

    try {
      const response = await fetch(`${GROQ_API_URL}/models`, {
        method: "GET",
        headers: getGroqHeaders(),
      });

      if (response.ok) {
        return { available: true, message: "AI service is available" };
      } else {
        return {
          available: false,
          message: `AI service returned status ${response.status}`,
        };
      }
    } catch (error) {
      return {
        available: false,
        message: `AI service error: ${error.message}`,
      };
    }
  },

  /**
   * Generate a structured listing object from text (without AI)
   * Used as fallback when AI is unavailable
   * @param {string} text - The input text
   * @returns {Object} Structured listing data
   */
  extractListingDataFallback(text) {
    const result = {
      product_name: null,
      quantity_quintals: null,
      unit_price: null,
      location: null,
      harvest_date: null,
      shelf_life_days: 7,
    };

    if (!text) return result;

    const words = text.split(/\s+/);

    // Try to find numbers (quantity and price)
    const numbers = text.match(/\d+/g);
    if (numbers) {
      const parsed = numbers.map(Number);
      // First number is often quantity, second is price
      if (parsed.length >= 2) {
        result.quantity_quintals = parsed[0];
        result.unit_price = parsed[1];
      } else if (parsed.length === 1) {
        result.quantity_quintals = parsed[0];
      }
    }

    // Look for product names by checking against known products
    const knownProducts = [
      "Teff",
      "Wheat",
      "Barley",
      "Maize",
      "Sorghum",
      "Millet",
      "Onion",
      "Tomato",
      "Cabbage",
      "Carrot",
      "Green Pepper",
      "Chili Pepper",
      "Garlic",
      "Spinach",
      "Lettuce",
      "Cauliflower",
      "Banana",
      "Mango",
      "Avocado",
      "Pineapple",
      "Orange",
      "Lemon",
      "Watermelon",
      "Papaya",
      "Potato",
      "Sweet Potato",
      "Coffee",
      "Tea",
    ];

    for (const product of knownProducts) {
      if (text.toLowerCase().includes(product.toLowerCase())) {
        result.product_name = product;
        break;
      }
    }

    // Extract location
    result.location = extractLocation(text);

    // Try to find a date pattern (YYYY-MM-DD)
    const dateMatch = text.match(/\d{4}-\d{2}-\d{2}/);
    if (dateMatch) {
      result.harvest_date = dateMatch[0];
    }

    return result;
  },
};

export default aiService;
