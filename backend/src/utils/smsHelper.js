// backend/src/utils/smsHelper.js
import { sms, africasTalking } from "../config/africasTalking.js";
import { SMS_TEMPLATES } from "../config/constants.js";

/**
 * SMS Helper - Handles all SMS operations
 */
export const SmsHelper = {
  /**
   * Send an SMS message to a single recipient
   * @param {string} phoneNumber - Recipient phone number (with country code)
   * @param {string} message - The message to send
   * @param {string} senderId - Optional sender ID (default: from env)
   * @returns {Promise<{ success: boolean, data: Object, error: Object }>}
   */
  async sendMessage(phoneNumber, message, senderId = null) {
    try {
      // Validate phone number
      if (!phoneNumber) {
        return { success: false, error: new Error("Phone number is required") };
      }

      // Format phone number to international format if needed
      const formattedPhone = this.formatPhoneNumber(phoneNumber);

      if (!formattedPhone) {
        return {
          success: false,
          error: new Error("Invalid phone number format"),
        };
      }

      // Validate message
      if (!message || message.trim().length === 0) {
        return { success: false, error: new Error("Message is required") };
      }

      if (message.length > 1600) {
        return {
          success: false,
          error: new Error("Message exceeds 1600 characters"),
        };
      }

      // Send SMS via Africa's Talking
      const options = {
        to: [formattedPhone],
        message: message,
        from: senderId || process.env.AFRICASTALKING_SHORT_CODE || null,
      };

      const response = await sms.send(options);

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
      return { success: false, error: error };
    }
  },

  /**
   * Send an SMS to multiple recipients
   * @param {string[]} phoneNumbers - Array of recipient phone numbers
   * @param {string} message - The message to send
   * @param {string} senderId - Optional sender ID
   * @returns {Promise<{ success: boolean, results: Array, errors: Array }>}
   */
  async sendBulkMessage(phoneNumbers, message, senderId = null) {
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

      // Format all phone numbers
      const formattedNumbers = phoneNumbers
        .map((num) => this.formatPhoneNumber(num))
        .filter((num) => num !== null);

      if (formattedNumbers.length === 0) {
        return {
          success: false,
          error: new Error("No valid phone numbers provided"),
        };
      }

      // Send SMS via Africa's Talking
      const options = {
        to: formattedNumbers,
        message: message,
        from: senderId || process.env.AFRICASTALKING_SHORT_CODE || null,
      };

      const response = await sms.send(options);

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
      return { success: false, error: error };
    }
  },

  /**
   * Send an offer notification to a farmer/manager
   * @param {Object} options - { phoneNumber, buyerName, productName, quantity, price, listingId }
   * @returns {Promise<{ success: boolean, data: Object, error: Object }>}
   */
  async sendOfferNotification(options) {
    const { phoneNumber, buyerName, productName, quantity, price, listingId } =
      options;

    if (!phoneNumber) {
      return { success: false, error: new Error("Phone number is required") };
    }

    const message = this.formatOfferMessage({
      buyerName,
      productName,
      quantity,
      price,
      listingId,
    });

    return this.sendMessage(phoneNumber, message);
  },

  /**
   * Send an offer accepted notification
   * @param {Object} options - { phoneNumber, buyerName, productName, quantity, price }
   * @returns {Promise<{ success: boolean, data: Object, error: Object }>}
   */
  async sendOfferAcceptedNotification(options) {
    const { phoneNumber, buyerName, productName, quantity, price } = options;

    if (!phoneNumber) {
      return { success: false, error: new Error("Phone number is required") };
    }

    const message = `✅ OFFER ACCEPTED: ${buyerName} has accepted your offer of ${quantity} quintals of ${productName} at ${price} Birr per quintal. Please contact the buyer to arrange delivery.`;

    return this.sendMessage(phoneNumber, message);
  },

  /**
   * Send an expiry warning notification
   * @param {Object} options - { phoneNumber, productName, quantity, expiryDate, daysRemaining }
   * @returns {Promise<{ success: boolean, data: Object, error: Object }>}
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

    return this.sendMessage(phoneNumber, message);
  },

  /**
   * Send a fire sale notification (critical expiry)
   * @param {Object} options - { phoneNumbers, productName, quantity, price, location }
   * @returns {Promise<{ success: boolean, data: Object, error: Object }>}
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

    return this.sendBulkMessage(phoneNumbers, message);
  },

  /**
   * Format a phone number to international format
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
  },

  /**
   * Format an offer message
   * @param {Object} options - { buyerName, productName, quantity, price, listingId }
   * @returns {string} Formatted message
   */
  formatOfferMessage(options) {
    const { buyerName, productName, quantity, price, listingId } = options;

    let message = `📩 NEW OFFER: ${buyerName} wants to buy ${quantity} quintals of ${productName} at ${price} Birr per quintal.`;

    if (listingId) {
      message += `\nReference: ${listingId}`;
    }

    message += "\nCall your manager to accept or counter this offer.";

    return message;
  },

  /**
   * Format an expiry alert message
   * @param {Object} options - { productName, quantity, expiryDate, daysRemaining }
   * @returns {string} Formatted message
   */
  formatExpiryMessage(options) {
    const { productName, quantity, expiryDate, daysRemaining } = options;

    let urgency = "";
    let action = "";

    if (daysRemaining <= 1) {
      urgency = "⚠️ URGENT";
      action = "Reduce price immediately and contact all buyers.";
    } else if (daysRemaining <= 3) {
      urgency = "🔴 WARNING";
      action = "Consider offering a discount to sell before expiry.";
    } else {
      urgency = "📢 REMINDER";
      action = "Plan to sell before expiry date.";
    }

    return `${urgency}: ${quantity} quintals of ${productName} expire in ${daysRemaining} day(s) (${expiryDate}). ${action}`;
  },

  /**
   * Check SMS balance (if available)
   * @returns {Promise<{ success: boolean, balance: number, error: Object }>}
   */
  async checkBalance() {
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
      return { success: false, error: error };
    }
  },
};

export default SmsHelper;
