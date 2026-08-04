// backend/src/services/smsService.js
import africastalking from "africastalking";
import dotenv from "dotenv";

dotenv.config();

/**
 * SMS Service - Handles all SMS operations using Africa's Talking
 */
class SMSService {
  constructor() {
    this.client = null;
    this.sms = null;
    this.isConfigured = false;
    this.username = process.env.AFRICASTALKING_USERNAME || "sandbox";
    this.apiKey = process.env.AFRICASTALKING_API_KEY;
    this.shortCode = process.env.AFRICASTALKING_SHORT_CODE || "";
    this.initClient();
  }

  /**
   * Initialize the Africa's Talking client
   */
  initClient() {
    if (!this.apiKey || this.apiKey === "your-api-key-here") {
      console.warn(
        "⚠️ Africa's Talking API key not configured. SMS sending will fail.",
      );
      this.isConfigured = false;
      return;
    }

    try {
      this.client = africastalking({
        username: this.username,
        apiKey: this.apiKey,
      });
      this.sms = this.client.SMS;
      this.isConfigured = true;
      console.log("✅ SMS service initialized successfully");
    } catch (error) {
      console.error("❌ SMS service initialization failed:", error.message);
      this.isConfigured = false;
    }
  }

  /**
   * Check if SMS service is configured
   */
  isAvailable() {
    return this.isConfigured && this.sms !== null;
  }

  /**
   * Format Ethiopian phone number to international format
   * @param {string} phoneNumber - Raw phone number
   * @returns {string|null} Formatted phone number or null if invalid
   */
  formatPhoneNumber(phoneNumber) {
    if (!phoneNumber) return null;

    // Remove whitespace and special characters
    let cleaned = phoneNumber.replace(/\s+/g, "").replace(/[^0-9+]/g, "");

    // Check if it already has country code
    if (cleaned.startsWith("+")) {
      return cleaned;
    }

    // Ethiopian phone numbers (11 digits starting with 09 or 07)
    if (cleaned.match(/^09[0-9]{8}$/)) {
      return `+251${cleaned.substring(1)}`;
    }

    if (cleaned.match(/^07[0-9]{8}$/)) {
      return `+251${cleaned.substring(1)}`;
    }

    // If it starts with 0 and has 10 digits (without 09/07 prefix)
    if (cleaned.match(/^0[0-9]{9}$/)) {
      return `+251${cleaned.substring(1)}`;
    }

    // If it starts with 251 (without +)
    if (cleaned.match(/^251[0-9]{9}$/)) {
      return `+${cleaned}`;
    }

    // If it's a 9-digit number (assuming Ethiopian)
    if (cleaned.match(/^[0-9]{9}$/)) {
      return `+251${cleaned}`;
    }

    console.warn(`⚠️ Unable to format phone number: ${phoneNumber}`);
    return null;
  }

  /**
   * Validate if a phone number is a valid Ethiopian number
   * @param {string} phoneNumber - Phone number to validate
   * @returns {boolean} True if valid
   */
  isValidEthiopianPhone(phoneNumber) {
    if (!phoneNumber) return false;

    const formatted = this.formatPhoneNumber(phoneNumber);
    if (!formatted) return false;

    // Check Ethiopian pattern: +251 followed by 9 digits
    return /^\+251[0-9]{9}$/.test(formatted);
  }

  /**
   * Send an SMS to a single recipient
   * @param {string} phoneNumber - Recipient phone number (with or without country code)
   * @param {string} message - Message to send
   * @param {string} senderId - Optional sender ID (default: from env)
   * @returns {Promise<{ success: boolean, data: Object, error: Object }>}
   */
  async sendSMS(phoneNumber, message, senderId = null) {
    if (!this.isAvailable()) {
      return { success: false, error: new Error("SMS service not configured") };
    }

    try {
      const formattedPhone = this.formatPhoneNumber(phoneNumber);
      if (!formattedPhone) {
        return {
          success: false,
          error: new Error("Invalid phone number format"),
        };
      }

      if (!message || message.trim().length === 0) {
        return { success: false, error: new Error("Message is required") };
      }

      if (message.length > 1600) {
        return {
          success: false,
          error: new Error("Message exceeds 1600 characters"),
        };
      }

      const options = {
        to: [formattedPhone],
        message: message,
        from: senderId || this.shortCode || null,
      };

      const response = await this.sms.send(options);

      if (response && response.SMSMessageData) {
        const recipients = response.SMSMessageData.Recipients || [];
        if (recipients.length > 0) {
          const firstRecipient = recipients[0];
          if (firstRecipient.status === "Success") {
            console.log(
              `✅ SMS sent to ${formattedPhone}: ${message.substring(0, 50)}...`,
            );
            return {
              success: true,
              data: {
                phoneNumber: formattedPhone,
                messageId: firstRecipient.messageId,
                status: firstRecipient.status,
                cost: firstRecipient.cost || null,
              },
            };
          } else {
            console.error(
              `❌ SMS failed for ${formattedPhone}: ${firstRecipient.status}`,
            );
            return {
              success: false,
              error: new Error(`SMS failed: ${firstRecipient.status}`),
              data: firstRecipient,
            };
          }
        }
      }

      console.error("❌ SMS response structure unexpected:", response);
      return { success: false, error: new Error("Unexpected SMS response") };
    } catch (error) {
      console.error("❌ SMS sending error:", error.message);
      return { success: false, error };
    }
  }

  /**
   * Send an SMS to multiple recipients
   * @param {string[]} phoneNumbers - Array of recipient phone numbers
   * @param {string} message - Message to send
   * @param {string} senderId - Optional sender ID
   * @returns {Promise<{ success: boolean, results: Array, errors: Array }>}
   */
  async sendBulkSMS(phoneNumbers, message, senderId = null) {
    if (!this.isAvailable()) {
      return { success: false, error: new Error("SMS service not configured") };
    }

    try {
      if (!phoneNumbers || phoneNumbers.length === 0) {
        return {
          success: false,
          error: new Error("At least one phone number is required"),
        };
      }

      if (phoneNumbers.length > 100) {
        return {
          success: false,
          error: new Error("Cannot send to more than 100 numbers at once"),
        };
      }

      const formattedNumbers = phoneNumbers
        .map((num) => this.formatPhoneNumber(num))
        .filter((num) => num !== null);

      if (formattedNumbers.length === 0) {
        return {
          success: false,
          error: new Error("No valid phone numbers provided"),
        };
      }

      if (!message || message.trim().length === 0) {
        return { success: false, error: new Error("Message is required") };
      }

      const options = {
        to: formattedNumbers,
        message: message,
        from: senderId || this.shortCode || null,
      };

      const response = await this.sms.send(options);

      if (response && response.SMSMessageData) {
        const recipients = response.SMSMessageData.Recipients || [];
        const results = [];
        const errors = [];

        for (const recipient of recipients) {
          if (recipient.status === "Success") {
            results.push({
              phoneNumber: recipient.number,
              messageId: recipient.messageId,
              status: recipient.status,
              cost: recipient.cost || null,
            });
          } else {
            errors.push({
              phoneNumber: recipient.number,
              status: recipient.status,
              error: recipient.status,
            });
          }
        }

        console.log(
          `✅ Bulk SMS sent: ${results.length} successful, ${errors.length} failed`,
        );
        return { success: true, results, errors };
      }

      return { success: false, error: new Error("Unexpected SMS response") };
    } catch (error) {
      console.error("❌ Bulk SMS error:", error.message);
      return { success: false, error };
    }
  }

  /**
   * Send an offer notification to a farmer/manager
   * @param {Object} options - { phoneNumber, buyerName, productName, quantity, price, listingId }
   * @returns {Promise<{ success: boolean }>}
   */
  async sendOfferNotification(options) {
    const { phoneNumber, buyerName, productName, quantity, price, listingId } =
      options;

    if (!phoneNumber) {
      return { success: false, error: new Error("Phone number is required") };
    }

    const message = this.buildOfferMessage({
      buyerName,
      productName,
      quantity,
      price,
      listingId,
    });
    return this.sendSMS(phoneNumber, message);
  }

  /**
   * Send an offer accepted notification
   * @param {Object} options - { phoneNumber, buyerName, productName, quantity, price }
   * @returns {Promise<{ success: boolean }>}
   */
  async sendOfferAcceptedNotification(options) {
    const { phoneNumber, buyerName, productName, quantity, price } = options;

    if (!phoneNumber) {
      return { success: false, error: new Error("Phone number is required") };
    }

    const message = `✅ OFFER ACCEPTED: ${buyerName} has accepted your offer of ${quantity} quintals of ${productName} at ${price} Birr per quintal. Please contact the buyer to arrange delivery.`;
    return this.sendSMS(phoneNumber, message);
  }

  /**
   * Send an expiry warning notification
   * @param {Object} options - { phoneNumber, productName, quantity, expiryDate, daysRemaining }
   * @returns {Promise<{ success: boolean }>}
   */
  async sendExpiryWarning(options) {
    const { phoneNumber, productName, quantity, expiryDate, daysRemaining } =
      options;

    if (!phoneNumber) {
      return { success: false, error: new Error("Phone number is required") };
    }

    let urgency = "";
    if (daysRemaining <= 1) {
      urgency = "⚠️ URGENT: Your";
    } else if (daysRemaining <= 3) {
      urgency = "🔴 Expiring soon:";
    } else {
      urgency = "📢 Reminder:";
    }

    const message = `${urgency} ${quantity} quintals of ${productName} will expire on ${expiryDate}. Only ${daysRemaining} day(s) remaining. Consider reducing price or contacting buyers urgently.`;
    return this.sendSMS(phoneNumber, message);
  }

  /**
   * Send a fire sale notification (critical expiry)
   * @param {Object} options - { phoneNumbers, productName, quantity, price, location }
   * @returns {Promise<{ success: boolean }>}
   */
  async sendFireSale(phoneNumbers, options) {
    const { productName, quantity, price, location } = options;

    if (!phoneNumbers || phoneNumbers.length === 0) {
      return {
        success: false,
        error: new Error("At least one phone number is required"),
      };
    }

    const message = `🔥 FIRE SALE: ${quantity} quintals of ${productName} at ${price} Birr per quintal in ${location}. Must sell TODAY. Call manager immediately.`;
    return this.sendBulkSMS(phoneNumbers, message);
  }

  /**
   * Send a welcome SMS to a new farmer
   * @param {Object} options - { phoneNumber, name, managerName }
   * @returns {Promise<{ success: boolean }>}
   */
  async sendWelcomeSMS(options) {
    const { phoneNumber, name, managerName } = options;

    if (!phoneNumber) {
      return { success: false, error: new Error("Phone number is required") };
    }

    const message = `📢 Welcome to EADE, ${name || "farmer"}! Your manager ${managerName || ""} has registered you on the Ethiopian Agricultural Digital Exchange platform. You will receive SMS alerts when buyers make offers on your products.`;
    return this.sendSMS(phoneNumber, message);
  }

  /**
   * Send a listing created notification to buyers
   * @param {Object} options - { phoneNumber, productName, quantity, price, location }
   * @returns {Promise<{ success: boolean }>}
   */
  async sendNewListingSMS(options) {
    const { phoneNumber, productName, quantity, price, location } = options;

    if (!phoneNumber) {
      return { success: false, error: new Error("Phone number is required") };
    }

    const message = `📦 New listing: ${quantity} quintals of ${productName} at ${price} Birr/quintal${location ? ` in ${location}` : ""}. Check EADE now!`;
    return this.sendSMS(phoneNumber, message);
  }

  /**
   * Build an offer message
   * @param {Object} options - { buyerName, productName, quantity, price, listingId }
   * @returns {string} Formatted message
   */
  buildOfferMessage(options) {
    const { buyerName, productName, quantity, price, listingId } = options;

    let message = `📩 NEW OFFER: ${buyerName} wants to buy ${quantity} quintals of ${productName} at ${price} Birr per quintal.`;

    if (listingId) {
      message += `\nReference: ${listingId}`;
    }

    message += "\nCall your manager to accept or counter this offer.";
    return message;
  }

  /**
   * Check SMS balance
   * @returns {Promise<{ success: boolean, balance: number, error: Object }>}
   */
  async checkBalance() {
    if (!this.isAvailable()) {
      return { success: false, error: new Error("SMS service not configured") };
    }

    try {
      // Africa's Talking may not expose balance via SMS API
      // This is a placeholder for future implementation
      return {
        success: true,
        balance: 0,
        message: "Balance check not implemented in this version",
      };
    } catch (error) {
      console.error("❌ Balance check error:", error.message);
      return { success: false, error };
    }
  }

  /**
   * Retry sending an SMS with exponential backoff
   * @param {string} phoneNumber - Recipient phone number
   * @param {string} message - Message to send
   * @param {number} maxRetries - Maximum retry attempts
   * @param {number} initialDelay - Initial delay in milliseconds
   * @returns {Promise<{ success: boolean, data: Object }>}
   */
  async sendSMSWithRetry(
    phoneNumber,
    message,
    maxRetries = 3,
    initialDelay = 1000,
  ) {
    let lastError = null;
    let delay = initialDelay;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      const result = await this.sendSMS(phoneNumber, message);

      if (result.success) {
        return result;
      }

      lastError = result.error;
      console.warn(
        `SMS attempt ${attempt} failed for ${phoneNumber}. Retrying in ${delay}ms...`,
      );

      if (attempt < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, delay));
        delay *= 2; // Exponential backoff
      }
    }

    return { success: false, error: lastError };
  }
}

// Singleton instance
export const smsService = new SMSService();

export default smsService;
