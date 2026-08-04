// backend/src/config/groq.js
import dotenv from "dotenv";

dotenv.config();

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_API_URL = "https://api.groq.com/openai/v1";

/**
 * Groq AI Configuration and Client
 * Handles voice transcription and data extraction using Groq's APIs
 */
export const groqConfig = {
  apiKey: GROQ_API_KEY,
  baseURL: GROQ_API_URL,
  models: {
    whisper: "whisper-large-v3",
    llm: "llama3-8b-8192",
  },
  maxTokens: 256,
  temperature: 0.1,
  languages: {
    amharic: "am",
    english: "en",
  },
};

/**
 * Check if Groq API is configured
 */
export const isGroqConfigured = () => {
  return !!GROQ_API_KEY && GROQ_API_KEY !== "your-groq-api-key-here";
};

/**
 * Get Groq API headers
 */
export const getGroqHeaders = () => {
  return {
    Authorization: `Bearer ${GROQ_API_KEY}`,
    "Content-Type": "application/json",
  };
};

/**
 * Get Groq API headers for audio (multipart/form-data)
 */
export const getGroqAudioHeaders = () => {
  return {
    Authorization: `Bearer ${GROQ_API_KEY}`,
  };
};

/**
 * Build the prompt for data extraction from Amharic text
 */
export const buildExtractionPrompt = (text) => {
  return `
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
};

/**
 * Map Amharic product names to English
 */
export const mapProductName = (productName) => {
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

  const trimmed = productName.trim();
  if (productMap[trimmed]) return productMap[trimmed];

  const lowerKey = trimmed.toLowerCase();
  for (const [key, value] of Object.entries(productMap)) {
    if (key.toLowerCase() === lowerKey) return value;
  }

  // Partial match
  for (const [key, value] of Object.entries(productMap)) {
    if (
      lowerKey.includes(key.toLowerCase()) ||
      key.toLowerCase().includes(lowerKey)
    ) {
      return value;
    }
  }

  return trimmed;
};

/**
 * Default shelf life days by product name
 */
export const getDefaultShelfLife = (productName) => {
  const shelfLifeMap = {
    Tomato: 7,
    Onion: 30,
    Cabbage: 14,
    Carrot: 21,
    GreenPepper: 10,
    ChiliPepper: 14,
    Garlic: 60,
    Spinach: 5,
    Lettuce: 5,
    Cauliflower: 10,
    Banana: 7,
    Mango: 10,
    Avocado: 7,
    Pineapple: 14,
    Orange: 21,
    Lemon: 30,
    Watermelon: 10,
    Papaya: 7,
    Milk: 3,
    Butter: 14,
    Cheese: 21,
    Yogurt: 7,
    Ghee: 90,
    Beef: 3,
    Mutton: 3,
    GoatMeat: 3,
    CamelMeat: 3,
    Chicken: 3,
    Eggs: 14,
    Turkey: 3,
    Teff: 365,
    Wheat: 365,
    Barley: 365,
    Maize: 180,
    Sorghum: 180,
    Millet: 180,
    FabaBean: 180,
    Chickpea: 180,
    Lentils: 180,
    Soybean: 180,
    Peas: 180,
    Potato: 30,
    SweetPotato: 21,
    Cassava: 21,
    Yam: 30,
    Coffee: 730,
    Tea: 730,
    NigerSeed: 180,
    Sunflower: 180,
    Sesame: 180,
    Linseed: 180,
    Cumin: 365,
    Cardamom: 365,
    Pepper: 365,
    Turmeric: 365,
    Ginger: 180,
  };

  return shelfLifeMap[productName] || 7;
};

/**
 * Extract location from text (common Ethiopian locations)
 */
export const extractLocation = (text) => {
  if (!text) return null;

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

  const lowerText = text.toLowerCase();
  for (const loc of locations) {
    if (lowerText.includes(loc.toLowerCase())) {
      return loc;
    }
  }
  return null;
};

export default {
  groqConfig,
  isGroqConfigured,
  getGroqHeaders,
  getGroqAudioHeaders,
  buildExtractionPrompt,
  mapProductName,
  getDefaultShelfLife,
  extractLocation,
};
