// backend/src/utils/aiHelper.js
import dotenv from "dotenv";
import { SHELF_LIFE_DAYS } from "../config/constants.js";

dotenv.config();

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_API_URL = "https://api.groq.com/openai/v1";

/**
 * AI Helper - Handles all AI operations (voice transcription, data extraction)
 */
export const AiHelper = {
  /**
   * Transcribe audio using Groq's Whisper API
   * @param {Buffer|string} audioFile - Audio file buffer or base64 string
   * @param {string} language - Language code (default: 'am' for Amharic)
   * @returns {Promise<{ success: boolean, text: string, error: Object }>}
   */
  async transcribeAudio(audioFile, language = "am") {
    try {
      if (!GROQ_API_KEY) {
        console.warn("⚠️ GROQ_API_KEY not found. AI features will not work.");
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
        // If base64 string, convert to buffer
        if (audioFile.startsWith("data:audio")) {
          // Extract base64 data from data URL
          const matches = audioFile.match(/^data:audio\/(\w+);base64,(.+)$/);
          if (matches) {
            contentType = `audio/${matches[1]}`;
            audioData = Buffer.from(matches[2], "base64");
          } else {
            // Assume raw base64
            audioData = Buffer.from(audioFile, "base64");
            contentType = "audio/mpeg";
          }
        } else {
          // Assume it's a file path or URL
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

      // Create form data for the API request
      const formData = new FormData();
      const blob = new Blob([audioData], { type: contentType });
      formData.append("file", blob, "audio.mp3");
      formData.append("model", "whisper-large-v3");
      formData.append("language", language);
      formData.append("response_format", "json");
      formData.append("temperature", "0.0");

      // Send request to Groq API
      const response = await fetch(`${GROQ_API_URL}/audio/transcriptions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${GROQ_API_KEY}`,
        },
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
        data: data,
      };
    } catch (error) {
      console.error("❌ Transcription error:", error.message);
      return { success: false, error: error };
    }
  },

  /**
   * Extract product listing data from Amharic text using Groq's LLM
   * @param {string} text - The transcribed Amharic text
   * @returns {Promise<{ success: boolean, data: Object, error: Object }>}
   */
  async extractListingData(text) {
    try {
      if (!GROQ_API_KEY) {
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

      // Build the prompt for Groq
      const prompt = `
        You are a data extraction assistant for an Ethiopian agricultural platform.
        Extract the following information from the Amharic text below:
        - product_name: The name of the agricultural product (in English)
        - quantity_quintals: The quantity in quintals (as a number)
        - unit_price: The price per quintal in Birr (as a number)
        - location: The location or district mentioned (in English)
        - harvest_date: The harvest date if mentioned (in YYYY-MM-DD format, otherwise null)
        
        Return ONLY a valid JSON object with these fields.
        If a field is not mentioned, set it to null.
        
        Text: "${text}"
      `;

      // Send request to Groq API
      const response = await fetch(`${GROQ_API_URL}/chat/completions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${GROQ_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "llama3-8b-8192",
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
          temperature: 0.1,
          max_tokens: 256,
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

      // Parse the JSON response
      let extractedData = {};
      try {
        extractedData = JSON.parse(content);
      } catch (e) {
        // Try to extract JSON from the response if it's wrapped in text
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

      // Map product name to English if needed
      if (extractedData.product_name) {
        extractedData.product_name = this.mapProductName(
          extractedData.product_name,
        );
      }

      // Get default shelf life based on product
      if (extractedData.product_name) {
        const shelfLife =
          SHELF_LIFE_DAYS[extractedData.product_name] ||
          SHELF_LIFE_DAYS.default ||
          7;
        extractedData.shelf_life_days = shelfLife;
      }

      console.log(`✅ Data extracted successfully:`, extractedData);

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
      return { success: false, error: error };
    }
  },

  /**
   * Map Amharic product names to English
   * @param {string} productName - The product name in any language
   * @returns {string} Mapped product name in English
   */
  mapProductName(productName) {
    if (!productName) return null;

    const productMap = {
      // Grains
      ጤፍ: "Teff",
      ስንዴ: "Wheat",
      ገብስ: "Barley",
      በቆሎ: "Maize",
      ማሽላ: "Sorghum",
      ጅብር: "Millet",

      // Vegetables
      ሽንኩርት: "Onion",
      ቲማቲም: "Tomato",
      ጎመን: "Cabbage",
      ካሮት: "Carrot",
      ቃሪያ: "Green Pepper",
      "ቃሪያ ቀይ": "Chili Pepper",
      "ነጭ ሽንኩርት": "Garlic",
      ስፒናች: "Spinach",
      ሰላጣ: "Lettuce",

      // Fruits
      ሙዝ: "Banana",
      ማንጎ: "Mango",
      አቮካዶ: "Avocado",
      አናናስ: "Pineapple",
      ብርቱካን: "Orange",
      ሎሚ: "Lemon",
      ሐብሐብ: "Watermelon",
      ፓፓያ: "Papaya",

      // Legumes
      ባቄላ: "Faba Bean",
      ሽምብራ: "Chickpea",
      ምስር: "Lentils",
      አተር: "Peas",
      ሶያ: "Soybean",

      // Roots & Tubers
      ድንች: "Potato",
      "ስኳር ድንች": "Sweet Potato",
      ካሳቫ: "Cassava",
      ያም: "Yam",

      // Beverages
      ቡና: "Coffee",
      ሻይ: "Tea",
      ጫት: "Khat",

      // Spices
      ኩም: "Cumin",
      ከርዶሞም: "Cardamom",
      በርበሬ: "Pepper",
      እርድ: "Turmeric",
      ዝንጅብል: "Ginger",

      // Dairy
      ወተት: "Milk",
      ቅቤ: "Butter",
      አይብ: "Cheese",
      እርጎ: "Yogurt",
      ጊ: "Ghee",

      // Meat
      "በሬ ሥጋ": "Beef",
      "በግ ሥጋ": "Mutton",
      "ፍየል ሥጋ": "Goat Meat",
      "ግመል ሥጋ": "Camel Meat",

      // Poultry
      ዶሮ: "Chicken",
      እንቁላል: "Eggs",
    };

    // Check exact match
    const trimmed = productName.trim();
    if (productMap[trimmed]) {
      return productMap[trimmed];
    }

    // Check case-insensitive match
    const lowerKey = trimmed.toLowerCase();
    for (const [key, value] of Object.entries(productMap)) {
      if (key.toLowerCase() === lowerKey) {
        return value;
      }
    }

    // Check partial match (contains)
    for (const [key, value] of Object.entries(productMap)) {
      if (
        lowerKey.includes(key.toLowerCase()) ||
        key.toLowerCase().includes(lowerKey)
      ) {
        return value;
      }
    }

    // Return as-is if no match
    return trimmed;
  },

  /**
   * Extract location from Amharic text
   * @param {string} text - The transcribed text
   * @returns {string} Extracted location or null
   */
  extractLocation(text) {
    if (!text) return null;

    // Common Ethiopian locations
    const locations = [
      "Addis Ababa",
      "Adama",
      "Bahir Dar",
      "Gondar",
      "Dessie",
      "Diredawa",
      "Debre Zeit",
      "Debre Birhan",
      "Debre Markos",
      "Harar",
      "Jimma",
      "Mekelle",
      "Bishoftu",
      "Hawassa",
      "Arba Minch",
      "Wolaita Sodo",
      "Shashemene",
      "Ambo",
      "Hossana",
      "Wolkite",
      "Assela",
      "Asosa",
      "Gambella",
      "Gode",
      "Kebri Dehar",
      "Jijiga",
      "Werder",
      "Asmara",
    ];

    for (const loc of locations) {
      if (text.toLowerCase().includes(loc.toLowerCase())) {
        return loc;
      }
    }

    return null;
  },

  /**
   * Check if the AI service is available
   * @returns {Promise<{ available: boolean, message: string }>}
   */
  async checkAvailability() {
    if (!GROQ_API_KEY) {
      return {
        available: false,
        message: "GROQ_API_KEY is not configured in environment variables",
      };
    }

    try {
      const response = await fetch(`${GROQ_API_URL}/models`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${GROQ_API_KEY}`,
        },
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
};

export default AiHelper;
