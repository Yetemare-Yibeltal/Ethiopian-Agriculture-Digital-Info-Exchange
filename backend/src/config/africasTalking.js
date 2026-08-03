// backend/src/config/africasTalking.js
import africastalking from "africastalking";
import dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

const username = process.env.AFRICASTALKING_USERNAME || "sandbox";
const apiKey = process.env.AFRICASTALKING_API_KEY;

// Validate that required environment variables are set
if (!apiKey) {
  console.warn(
    "⚠️ Africa's Talking API key not found. SMS features will not work.",
  );
  console.warn("   Set AFRICASTALKING_API_KEY in your .env file.");
}

// Initialize Africa's Talking SDK
const africasTalkingConfig = {
  username: username,
  apiKey: apiKey || "dummy-key-for-development",
};

// Create the Africa's Talking client
export const africasTalking = africastalking(africasTalkingConfig);

// Export the SMS service for easy access
export const sms = africasTalking.SMS;

// Export the USSD service for future use
export const ussd = africasTalking.USSD;

// Export the Airtime service for future use
export const airtime = africasTalking.AIRTIME;

// Short code for sending messages
export const SHORT_CODE = process.env.AFRICASTALKING_SHORT_CODE || "";

console.log("✅ Africa's Talking SDK initialized successfully");
