import nodemailer from 'nodemailer';

// Create transporter with better error handling
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT),
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    },
    connectionTimeout: 30000, // 30 seconds
    greetingTimeout: 30000,
    socketTimeout: 30000,
    logger: process.env.NODE_ENV === 'development',
    debug: process.env.NODE_ENV === 'development'
  });
};

// Verify connection (call this once on server startup)
export const verifyEmailConnection = async () => {
  try {
    const transporter = createTransporter();
    await transporter.verify();
    console.log('✅ Email server connection verified');
    return true;
  } catch (error) {
    console.error('❌ Email connection failed:', error.message);
    return false;
  }
};

// ---------------------- UPDATED FUNCTIONS ----------------------

// Send verification email
export async function sendVerificationEmail(email, token) {
  try {
    const transporter = createTransporter();
    
    // FIX: Ensure URL has no line breaks
    const verificationUrl = `${process.env.CLIENT_URL}/verify-email/${token}`;
    
    console.log('Generated verification URL:', verificationUrl);

    const mailOptions = {
      from: {
        name: process.env.EMAIL_FROM_NAME,
        address: process.env.EMAIL_FROM_ADDRESS
      },
      to: email,
      subject: "Verify Your Email Address - St. Michael's Church",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #FF7E45;">Welcome to St. Michael's Church!</h2>
          <p>Thank you for registering. Please verify your email address to complete your account setup.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}" 
               style="background-color: #FF7E45; color: white; padding: 12px 24px; 
                      text-decoration: none; border-radius: 5px; display: inline-block;">
              Verify Email Address
            </a>
          </div>
          <p>Or copy and paste this link in your browser:</p>
          <p style="word-break: break-all; color: #667; font-family: monospace; font-size: 12px;">
            ${verificationUrl}
          </p>
          <p>If you didn't create this account, please ignore this email.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="color: #999; font-size: 12px;">
            St. Michael's Church & All Angels | Ifite-Awka
          </p>
        </div>
      `,
      // FIX: Remove line break in text version
      text: `Welcome to St. Michael's Church! Please verify your email by visiting: ${verificationUrl}\n\nIf you didn't create this account, please ignore this email.`
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('✅ Verification email sent to:', email);
    return result;
  } catch (error) {
    console.error('❌ Failed to send verification email:', error);
    throw new Error('Failed to send verification email');
  }
}

// Send password reset email
export async function sendPasswordResetEmail(email, token) {
  try {
    const transporter = createTransporter();
    const resetUrl = `${process.env.CLIENT_URL}/reset-password/${token}`;

    const mailOptions = {
      from: {
        name: process.env.EMAIL_FROM_NAME,
        address: process.env.EMAIL_FROM_ADDRESS
      },
      to: email,
      subject: "Password Reset Request - St. Michael's Church",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #FF7E45;">Password Reset Request</h2>
          <p>You requested to reset your password. Click the button below to proceed:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" 
               style="background-color: #FF7EAC; color: white; padding: 12px 24px; 
                      text-decoration: none; border-radius: 5px; display: inline-block;">
              Reset Password
            </a>
          </div>
          <p>Or use this token: <strong>${token}</strong></p>
          <p>This link will expire in 1 hour.</p>
          <p>If you didn't request this reset, please ignore this email.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="color: #999; font-size: 12px;">
            St. Michael's Church & All Angels | Ifite-Awka
          </p>
        </div>
      `,
      text: `You requested a password reset. Reset here: ${resetUrl}\n\nThis link will expire in 1 hour.\nIf you didn't request this reset, please ignore this email.`
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('✅ Password reset email sent to:', email);
    return result;
  } catch (error) {
    console.error('❌ Failed to send password reset email:', error);
    throw new Error('Failed to send password reset email');
  }
}

// ---------------------- FIXED UNCHANGED FUNCTIONS ----------------------

// Send password change email
export async function sendPasswordChangeEmail(email) {
  try {
    const transporter = createTransporter();
    const changeUrl = `${process.env.CLIENT_URL}/change-password`;

    const mailOptions = {
      from: {
        name: process.env.EMAIL_FROM_NAME,
        address: process.env.EMAIL_FROM_ADDRESS
      },
      to: email,
      subject: 'Password Change Notification - St. Michael\'s Church',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #FF7E45;">Password Change Notification</h2>
          <p>Your password has been changed successfully.</p>
          <div style="text-align: center; margin: 20px 0;">
            <a href="${changeUrl}" 
               style="background-color: #FF7E45; color: white; padding: 12px 24px; 
                      text-decoration: none; border-radius: 5px; display: inline-block;">
              Manage Your Account
            </a>
          </div>
          <p>If you did not initiate this change, please contact support immediately.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="color: #999; font-size: 12px;">
            St. Michael's Church & All Angels | Ifite-Awka
          </p>
        </div>
      `,
      text: `Your password has been changed successfully. If you did not initiate this change, please contact support immediately.\n\nManage your account: ${changeUrl}`
    };

    await transporter.sendMail(mailOptions);
    console.log('✅ Password change notification sent to:', email);
  } catch (error) {
    console.error('❌ Failed to send password change email:', error);
    throw new Error('Failed to send password change notification');
  }
}

// Send admin code email
export async function sendAdminCodeEmail(email, code, description) {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: {
        name: process.env.EMAIL_FROM_NAME,
        address: process.env.EMAIL_FROM_ADDRESS
      },
      to: email,
      subject: 'Admin Registration Code - St. Michael\'s Church',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #FF7E45;">Admin Registration Code</h2>
          <p>Your admin registration code: <strong style="font-size: 18px;">${code}</strong></p>
          <p>Description: ${description}</p>
          <p>Use this code during registration to gain admin privileges.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="color: #999; font-size: 12px;">
            St. Michael's Church & All Angels | Ifite-Awka
          </p>
        </div>
      `,
      text: `Your admin registration code: ${code}\nDescription: ${description}\nUse this code during registration to gain admin privileges.`
    };

    await transporter.sendMail(mailOptions);
    console.log('✅ Admin code email sent to:', email);
  } catch (error) {
    console.error('❌ Failed to send admin code email:', error);
    throw new Error('Failed to send admin code email');
  }
}

// Send donation receipt
export async function sendDonationReceipt(email, donation) {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: {
        name: process.env.EMAIL_FROM_NAME,
        address: process.env.EMAIL_FROM_ADDRESS
      },
      to: email,
      subject: 'Donation Receipt - St. Michael\'s Church',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #FF7E45;">Thank You for Your Donation</h2>
          <p>We appreciate your generous support of our ministry.</p>
          <h3>Donation Details:</h3>
          <ul style="list-style: none; padding: 0;">
            <li><strong>Amount:</strong> $${donation.amount}</li>
            <li><strong>Date:</strong> ${donation.createdAt.toDateString()}</li>
            <li><strong>Payment Method:</strong> ${donation.paymentMethod}</li>
            <li><strong>Donation ID:</strong> ${donation._id}</li>
          </ul>
          <p>This email serves as your official receipt for tax purposes.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="color: #999; font-size: 12px;">
            St. Michael's Church & All Angels | Ifite-Awka
          </p>
        </div>
      `,
      text: `Thank you for your donation of $${donation.amount} on ${donation.createdAt.toDateString()}.\nPayment Method: ${donation.paymentMethod}\nDonation ID: ${donation._id}\n\nThis email serves as your official receipt for tax purposes.`
    };

    await transporter.sendMail(mailOptions);
    console.log('✅ Donation receipt sent to:', email);
  } catch (error) {
    console.error('❌ Failed to send donation receipt:', error);
    throw new Error('Failed to send donation receipt');
  }
}

// Send volunteer application confirmation
export async function sendVolunteerConfirmation(email, ministryName) {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: {
        name: process.env.EMAIL_FROM_NAME,
        address: process.env.EMAIL_FROM_ADDRESS
      },
      to: email,
      subject: 'Volunteer Application Received - St. Michael\'s Church',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #FF7E45;">Volunteer Application Received</h2>
          <p>Thank you for applying to volunteer for <strong>${ministryName}</strong>.</p>
          <p>Our team will review your application and contact you soon.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="color: #999; font-size: 12px;">
            St. Michael's Church & All Angels | Ifite-Awka
          </p>
        </div>
      `,
      text: `Thank you for applying to volunteer for ${ministryName}. Our team will review your application and contact you soon.`
    };

    await transporter.sendMail(mailOptions);
    console.log('✅ Volunteer confirmation sent to:', email);
  } catch (error) {
    console.error('❌ Failed to send volunteer confirmation:', error);
    throw new Error('Failed to send volunteer confirmation');
  }
}

// Send volunteer status update
export async function sendVolunteerStatusUpdate(email, ministryName, status) {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: {
        name: process.env.EMAIL_FROM_NAME,
        address: process.env.EMAIL_FROM_ADDRESS
      },
      to: email,
      subject: `Volunteer Application Update - St. Michael's Church`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #FF7E45;">Volunteer Application Update</h2>
          <p>Your application to volunteer for <strong>${ministryName}</strong> has been <strong>${status}</strong>.</p>
          <p>${status === 'approved' ? 'We will contact you soon with next steps.' : 'Thank you for your interest in serving.'}</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="color: #999; font-size: 12px;">
            St. Michael's Church & All Angels | Ifite-Awka
          </p>
        </div>
      `,
      text: `Your application to volunteer for ${ministryName} has been ${status}.\n${status === 'approved' ? 'We will contact you soon with next steps.' : 'Thank you for your interest in serving.'}`
    };

    await transporter.sendMail(mailOptions);
    console.log('✅ Volunteer status update sent to:', email);
  } catch (error) {
    console.error('❌ Failed to send volunteer status update:', error);
    throw new Error('Failed to send volunteer status update');
  }
}

export default {
  verifyEmailConnection,
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendPasswordChangeEmail,
  sendAdminCodeEmail,
  sendDonationReceipt,
  sendVolunteerConfirmation,
  sendVolunteerStatusUpdate
};