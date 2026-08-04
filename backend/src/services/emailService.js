// backend/src/services/emailService.js
import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

const EMAIL_HOST = process.env.EMAIL_HOST || "smtp.gmail.com";
const EMAIL_PORT = parseInt(process.env.EMAIL_PORT) || 587;
const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

/**
 * Email Service - Handles all email operations
 */
export const emailService = {
  /**
   * Create a nodemailer transporter
   * @returns {Object} Nodemailer transporter
   */
  createTransporter() {
    if (!EMAIL_USER || !EMAIL_PASS) {
      console.warn(
        "⚠️ Email credentials not configured. Email sending will fail.",
      );
      return null;
    }

    return nodemailer.createTransport({
      host: EMAIL_HOST,
      port: EMAIL_PORT,
      secure: EMAIL_PORT === 465,
      auth: {
        user: EMAIL_USER,
        pass: EMAIL_PASS,
      },
    });
  },

  /**
   * Check if email is configured
   * @returns {boolean}
   */
  isConfigured() {
    return !!(EMAIL_USER && EMAIL_PASS);
  },

  /**
   * Send an email
   * @param {Object} options - { to, subject, html, text, from, attachments, replyTo }
   * @returns {Promise<{ success: boolean, data: Object, error: Object }>}
   */
  async sendEmail(options) {
    try {
      const { to, subject, html, text, from, attachments, replyTo } = options;

      if (!to) {
        return {
          success: false,
          error: new Error("Recipient email is required"),
        };
      }

      if (!subject) {
        return { success: false, error: new Error("Subject is required") };
      }

      if (!html && !text) {
        return {
          success: false,
          error: new Error("Email body (html or text) is required"),
        };
      }

      if (!this.isConfigured()) {
        console.warn("⚠️ Email not configured. Skipping email send.");
        return {
          success: false,
          error: new Error("Email service not configured"),
        };
      }

      const transporter = this.createTransporter();
      if (!transporter) {
        return {
          success: false,
          error: new Error("Failed to create email transporter"),
        };
      }

      const mailOptions = {
        from: from || EMAIL_USER || "noreply@eade-platform.com",
        to: to,
        subject: subject,
        text: text || null,
        html: html || null,
        attachments: attachments || [],
        replyTo: replyTo || null,
      };

      const info = await transporter.sendMail(mailOptions);
      console.log(`✅ Email sent to ${to}: ${subject}`);
      return {
        success: true,
        data: {
          messageId: info.messageId,
          accepted: info.accepted,
          rejected: info.rejected,
        },
      };
    } catch (error) {
      console.error("❌ Email sending error:", error.message);
      return { success: false, error };
    }
  },

  /**
   * Send a welcome email to a new user
   * @param {Object} options - { to, name, role }
   * @returns {Promise<{ success: boolean, data: Object, error: Object }>}
   */
  async sendWelcomeEmail(options) {
    const { to, name, role } = options;

    if (!to) {
      return {
        success: false,
        error: new Error("Recipient email is required"),
      };
    }

    const subject = "Welcome to Ethiopian Agricultural Digital Exchange";
    const roleDisplay = role || "User";

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb; border-radius: 10px;">
        <div style="text-align: center; padding: 20px; background-color: #15803d; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0;">🌾 EADE</h1>
          <p style="color: #d1fae5; margin: 0;">Ethiopian Agricultural Digital Exchange</p>
        </div>
        <div style="padding: 30px; background-color: white; border-radius: 0 0 10px 10px;">
          <h2 style="color: #15803d;">Welcome, ${name || "User"}!</h2>
          <p>Thank you for registering with EADE. You are now part of a platform connecting farmers, managers, and buyers across Ethiopia.</p>
          <p style="margin-top: 20px;"><strong>Your Role:</strong> ${roleDisplay}</p>
          <p>Here's what you can do:</p>
          <ul style="color: #374151; line-height: 1.8;">
            ${
              role === "manager"
                ? `
              <li>📦 Register farmers under your cooperative</li>
              <li>📝 Create product listings for your farmers</li>
              <li>📊 Track your listings and offers</li>
            `
                : role === "buyer"
                  ? `
              <li>🔍 Search for farmers near your location</li>
              <li>📩 Make offers on available products</li>
              <li>📊 Track your orders and purchases</li>
            `
                  : `
              <li>🔍 Explore available products</li>
              <li>📊 Track market trends</li>
            `
            }
          </ul>
          <p style="margin-top: 30px; padding: 15px; background-color: #f0fdf4; border-left: 4px solid #15803d; border-radius: 4px;">
            <strong>Need help?</strong> Contact us at support@eade-platform.com
          </p>
          <p style="margin-top: 20px; color: #6b7280; font-size: 14px;">Thank you for joining EADE!</p>
        </div>
      </div>
    `;

    const text = `Welcome to EADE, ${name || "User"}! You are registered as a ${roleDisplay}. Please visit ${FRONTEND_URL} to get started.`;

    return this.sendEmail({ to, subject, html, text });
  },

  /**
   * Send a verification email
   * @param {Object} options - { to, name, verificationCode, verifyLink }
   * @returns {Promise<{ success: boolean, data: Object, error: Object }>}
   */
  async sendVerificationEmail(options) {
    const { to, name, verificationCode, verifyLink } = options;

    if (!to) {
      return {
        success: false,
        error: new Error("Recipient email is required"),
      };
    }

    const subject = "Verify Your EADE Account";

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb; border-radius: 10px;">
        <div style="text-align: center; padding: 20px; background-color: #15803d; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0;">🌾 EADE</h1>
          <p style="color: #d1fae5; margin: 0;">Email Verification</p>
        </div>
        <div style="padding: 30px; background-color: white; border-radius: 0 0 10px 10px;">
          <h2 style="color: #15803d;">Verify Your Email</h2>
          <p>Hello ${name || "User"},</p>
          <p>Please verify your email address to complete your registration.</p>
          ${
            verificationCode
              ? `
            <div style="text-align: center; padding: 20px; margin: 20px 0; background-color: #f3f4f6; border-radius: 8px; font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #15803d;">
              ${verificationCode}
            </div>
          `
              : ""
          }
          ${
            verifyLink
              ? `
            <p style="text-align: center;">
              <a href="${verifyLink}" style="display: inline-block; padding: 12px 30px; background-color: #15803d; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">
                Verify Email
              </a>
            </p>
          `
              : ""
          }
          <p style="margin-top: 20px; color: #6b7280; font-size: 14px;">This link will expire in 24 hours.</p>
        </div>
      </div>
    `;

    const text = `Verify your EADE account. Your verification code is: ${verificationCode}. Or click this link: ${verifyLink}`;

    return this.sendEmail({ to, subject, html, text });
  },

  /**
   * Send a password reset email
   * @param {Object} options - { to, name, resetLink, resetCode }
   * @returns {Promise<{ success: boolean, data: Object, error: Object }>}
   */
  async sendPasswordResetEmail(options) {
    const { to, name, resetLink, resetCode } = options;

    if (!to) {
      return {
        success: false,
        error: new Error("Recipient email is required"),
      };
    }

    const subject = "Reset Your EADE Password";

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb; border-radius: 10px;">
        <div style="text-align: center; padding: 20px; background-color: #15803d; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0;">🌾 EADE</h1>
          <p style="color: #d1fae5; margin: 0;">Password Reset</p>
        </div>
        <div style="padding: 30px; background-color: white; border-radius: 0 0 10px 10px;">
          <h2 style="color: #15803d;">Reset Your Password</h2>
          <p>Hello ${name || "User"},</p>
          <p>We received a request to reset your password.</p>
          ${
            resetCode
              ? `
            <div style="text-align: center; padding: 20px; margin: 20px 0; background-color: #f3f4f6; border-radius: 8px; font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #15803d;">
              ${resetCode}
            </div>
          `
              : ""
          }
          ${
            resetLink
              ? `
            <p style="text-align: center;">
              <a href="${resetLink}" style="display: inline-block; padding: 12px 30px; background-color: #15803d; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">
                Reset Password
              </a>
            </p>
          `
              : ""
          }
          <p style="margin-top: 20px; color: #6b7280; font-size: 14px;">This link will expire in 1 hour.</p>
          <p style="margin-top: 10px; color: #6b7280; font-size: 14px;">If you did not request this, please ignore this email.</p>
        </div>
      </div>
    `;

    const text = `Reset your EADE password. Your code is: ${resetCode}. Or click this link: ${resetLink}`;

    return this.sendEmail({ to, subject, html, text });
  },

  /**
   * Send an offer notification email to a manager
   * @param {Object} options - { to, buyerName, productName, quantity, price, listingLink }
   * @returns {Promise<{ success: boolean, data: Object, error: Object }>}
   */
  async sendOfferNotificationEmail(options) {
    const { to, buyerName, productName, quantity, price, listingLink } =
      options;

    if (!to) {
      return {
        success: false,
        error: new Error("Recipient email is required"),
      };
    }

    const subject = `📩 New Offer on ${productName}`;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb; border-radius: 10px;">
        <div style="text-align: center; padding: 20px; background-color: #15803d; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0;">🌾 EADE</h1>
          <p style="color: #d1fae5; margin: 0;">New Offer Received</p>
        </div>
        <div style="padding: 30px; background-color: white; border-radius: 0 0 10px 10px;">
          <h2 style="color: #15803d;">New Offer!</h2>
          <p><strong>Buyer:</strong> ${buyerName}</p>
          <p><strong>Product:</strong> ${productName}</p>
          <p><strong>Quantity:</strong> ${quantity} quintals</p>
          <p><strong>Price:</strong> ${price} Birr/quintal</p>
          ${
            listingLink
              ? `
            <p style="text-align: center; margin-top: 20px;">
              <a href="${listingLink}" style="display: inline-block; padding: 12px 30px; background-color: #15803d; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">
                View Offer
              </a>
            </p>
          `
              : ""
          }
          <p style="margin-top: 20px; color: #6b7280; font-size: 14px;">Log in to accept or counter this offer.</p>
        </div>
      </div>
    `;

    const text = `New offer from ${buyerName} for ${quantity} quintals of ${productName} at ${price} Birr/quintal.`;

    return this.sendEmail({ to, subject, html, text });
  },

  /**
   * Send an offer accepted notification email to a buyer
   * @param {Object} options - { to, buyerName, productName, quantity, price, managerName }
   * @returns {Promise<{ success: boolean, data: Object, error: Object }>}
   */
  async sendOfferAcceptedEmail(options) {
    const { to, buyerName, productName, quantity, price, managerName } =
      options;

    if (!to) {
      return {
        success: false,
        error: new Error("Recipient email is required"),
      };
    }

    const subject = `✅ Offer Accepted: ${productName}`;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb; border-radius: 10px;">
        <div style="text-align: center; padding: 20px; background-color: #15803d; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0;">🌾 EADE</h1>
          <p style="color: #d1fae5; margin: 0;">Offer Accepted</p>
        </div>
        <div style="padding: 30px; background-color: white; border-radius: 0 0 10px 10px;">
          <h2 style="color: #15803d;">Offer Accepted!</h2>
          <p><strong>Product:</strong> ${productName}</p>
          <p><strong>Quantity:</strong> ${quantity} quintals</p>
          <p><strong>Price:</strong> ${price} Birr/quintal</p>
          <p><strong>Manager:</strong> ${managerName || "The manager"}</p>
          <div style="margin-top: 20px; padding: 15px; background-color: #f0fdf4; border-left: 4px solid #15803d; border-radius: 4px;">
            <p><strong>What to do next:</strong> Contact the manager to arrange collection/delivery details.</p>
          </div>
        </div>
      </div>
    `;

    const text = `Your offer for ${quantity} quintals of ${productName} has been accepted. Please contact the manager to arrange delivery.`;

    return this.sendEmail({ to, subject, html, text });
  },

  /**
   * Send an expiry alert email to a manager
   * @param {Object} options - { to, productName, quantity, expiryDate, daysRemaining }
   * @returns {Promise<{ success: boolean, data: Object, error: Object }>}
   */
  async sendExpiryAlertEmail(options) {
    const { to, productName, quantity, expiryDate, daysRemaining } = options;

    if (!to) {
      return {
        success: false,
        error: new Error("Recipient email is required"),
      };
    }

    const urgency =
      daysRemaining <= 1
        ? "URGENT"
        : daysRemaining <= 3
          ? "WARNING"
          : "REMINDER";
    const subject = `🔴 ${urgency}: ${productName} Expiring Soon`;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb; border-radius: 10px;">
        <div style="text-align: center; padding: 20px; ${daysRemaining <= 1 ? "background-color: #dc2626;" : "background-color: #f59e0b;"} border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0;">🌾 EADE</h1>
          <p style="color: ${daysRemaining <= 1 ? "#fca5a5" : "#fef3c7"}; margin: 0;">Expiry Alert</p>
        </div>
        <div style="padding: 30px; background-color: white; border-radius: 0 0 10px 10px;">
          <h2 style="color: ${daysRemaining <= 1 ? "#dc2626" : "#f59e0b"};">${urgency}: ${productName}</h2>
          <p><strong>Quantity:</strong> ${quantity} quintals</p>
          <p><strong>Expiry Date:</strong> ${expiryDate}</p>
          <p><strong>Days Remaining:</strong> ${daysRemaining}</p>
          ${
            daysRemaining <= 1
              ? `
            <div style="margin-top: 20px; padding: 15px; background-color: #fef2f2; border: 1px solid #fca5a5; border-radius: 4px;">
              <p style="color: #dc2626; font-weight: bold;">⚠️ CRITICAL: This product expires today. Take immediate action!</p>
            </div>
          `
              : ""
          }
          <p style="margin-top: 20px; color: #6b7280; font-size: 14px;">Log in to manage your listings or reduce the price.</p>
        </div>
      </div>
    `;

    const text = `${urgency}: ${quantity} quintals of ${productName} expire in ${daysRemaining} day(s) on ${expiryDate}.`;

    return this.sendEmail({ to, subject, html, text });
  },

  /**
   * Send a new listing notification email to buyers
   * @param {Object} options - { to, productName, quantity, price, location, listingLink }
   * @returns {Promise<{ success: boolean, data: Object, error: Object }>}
   */
  async sendNewListingEmail(options) {
    const { to, productName, quantity, price, location, listingLink } = options;

    if (!to) {
      return {
        success: false,
        error: new Error("Recipient email is required"),
      };
    }

    const subject = `📦 New Listing: ${productName}`;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb; border-radius: 10px;">
        <div style="text-align: center; padding: 20px; background-color: #15803d; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0;">🌾 EADE</h1>
          <p style="color: #d1fae5; margin: 0;">New Listing Available</p>
        </div>
        <div style="padding: 30px; background-color: white; border-radius: 0 0 10px 10px;">
          <h2 style="color: #15803d;">${productName}</h2>
          <p><strong>Quantity:</strong> ${quantity} quintals</p>
          <p><strong>Price:</strong> ${price} Birr/quintal</p>
          ${location ? `<p><strong>Location:</strong> ${location}</p>` : ""}
          ${
            listingLink
              ? `
            <p style="text-align: center; margin-top: 20px;">
              <a href="${listingLink}" style="display: inline-block; padding: 12px 30px; background-color: #15803d; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">
                View Listing
              </a>
            </p>
          `
              : ""
          }
        </div>
      </div>
    `;

    const text = `New listing available: ${quantity} quintals of ${productName} at ${price} Birr/quintal.`;

    return this.sendEmail({ to, subject, html, text });
  },
};

export default emailService;
