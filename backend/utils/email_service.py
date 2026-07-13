import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import logging

logger = logging.getLogger(__name__)

def send_verification_email(recipient_email, recipient_name, verification_code):
    """
    Sends an HTML verification email with the OTP code and direct verification link.
    Requires MAIL_USERNAME and MAIL_PASSWORD inside .env for real SMTP sending.
    """
    mail_server = os.getenv("MAIL_SERVER", "smtp.gmail.com")
    mail_port = int(os.getenv("MAIL_PORT", 587))
    mail_username = os.getenv("MAIL_USERNAME") or os.getenv("GMAIL_USERNAME") or os.getenv("ADMIN_EMAIL")
    mail_password = os.getenv("MAIL_PASSWORD") or os.getenv("GMAIL_PASSWORD")
    
    if mail_password:
        # Strip any accidental spaces copied into Gmail App Password (e.g. 'tqwi clpe uktk tgsn' -> 'tqwiclpeuktktgsn')
        mail_password = mail_password.replace(" ", "")
        
    mail_sender = os.getenv("MAIL_DEFAULT_SENDER", mail_username or "noreply@fintrack.app")
    
    frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173").split(",")[0].strip()
    verification_link = f"{frontend_url}/verify-email?email={recipient_email}&code={verification_code}"

    if not mail_username or not mail_password:
        logger.warning(
            f"⚠️ MAIL_USERNAME/GMAIL_USERNAME or MAIL_PASSWORD not configured in .env. Skipping real SMTP email to {recipient_email}. OTP Code: {verification_code}"
        )
        return False

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = f"{verification_code} is your FinTrack verification code"
        msg["From"] = f"FinTrack Security <{mail_sender}>"
        msg["To"] = recipient_email

        name_display = recipient_name or "Valued User"

        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Verify your FinTrack Account</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc; color: #1e293b;">
            <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; padding: 40px 10px;">
                <tr>
                    <td align="center">
                        <table width="100%" max-width="500px" border="0" cellspacing="0" cellpadding="0" style="max-width: 500px; background-color: #ffffff; border-radius: 20px; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.05); overflow: hidden; border: 1px solid #e2e8f0;">
                            <!-- Header -->
                            <tr>
                                <td style="background: linear-gradient(135deg, #3b82f6, #1d4ed8); padding: 32px 30px; text-align: center;">
                                    <h1 style="margin: 0; color: #ffffff; font-size: 26px; font-weight: 800; letter-spacing: -0.5px;">FinTrack</h1>
                                    <p style="margin: 4px 0 0; color: #bfdbfe; font-size: 14px;">Personal Finance & Expenditure Tracker</p>
                                </td>
                            </tr>
                            
                            <!-- Body -->
                            <tr>
                                <td style="padding: 36px 32px;">
                                    <h2 style="margin: 0 0 16px; font-size: 20px; font-weight: 700; color: #0f172a;">Verify Your Email Address</h2>
                                    <p style="margin: 0 0 24px; font-size: 15px; line-height: 1.6; color: #475569;">
                                        Hello <strong>{name_display}</strong>,<br><br>
                                        Thank you for creating an account with FinTrack! Please use the following 6-digit verification code to complete your registration and activate your dashboard:
                                    </p>
                                    
                                    <!-- Code Box -->
                                    <div style="background-color: #f1f5f9; border: 2px dashed #cbd5e1; border-radius: 16px; padding: 24px; text-align: center; margin: 28px 0;">
                                        <span style="font-size: 34px; font-weight: 800; letter-spacing: 8px; color: #2563eb; font-family: monospace;">{verification_code}</span>
                                    </div>

                                    <p style="margin: 0 0 28px; font-size: 14px; text-align: center; color: #64748b;">
                                        Or click the button below to verify automatically:
                                    </p>
                                    
                                    <!-- Button -->
                                    <div style="text-align: center; margin-bottom: 32px;">
                                        <a href="{verification_link}" style="background-color: #3b82f6; color: #ffffff; padding: 15px 32px; border-radius: 14px; text-decoration: none; font-weight: 700; font-size: 15px; display: inline-block; box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);">
                                            Verify & Continue
                                        </a>
                                    </div>
                                    
                                    <p style="margin: 0; font-size: 13px; line-height: 1.5; color: #94a3b8; border-top: 1px solid #f1f5f9; padding-top: 20px;">
                                        ⚠️ <strong>Security Note:</strong> This verification code expires in <strong>15 minutes</strong>. If you did not request this verification, you can safely ignore this email.
                                    </p>
                                </td>
                            </tr>
                            
                            <!-- Footer -->
                            <tr>
                                <td style="background-color: #f8fafc; padding: 20px 32px; text-align: center; border-top: 1px solid #e2e8f0;">
                                    <p style="margin: 0; font-size: 12px; color: #64748b;">
                                        &copy; 2026 FinTrack Inc. All rights reserved.
                                    </p>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
            </table>
        </body>
        </html>
        """

        text_content = f"""
Hello {name_display},

Thank you for registering with FinTrack!

Your verification code is: {verification_code}

Or verify directly via this link:
{verification_link}

This code expires in 15 minutes.
        """

        msg.attach(MIMEText(text_content, "plain"))
        msg.attach(MIMEText(html_content, "html"))

        if mail_port == 465:
            with smtplib.SMTP_SSL(mail_server, mail_port) as server:
                server.login(mail_username, mail_password)
                server.send_message(msg)
        else:
            with smtplib.SMTP(mail_server, mail_port) as server:
                server.starttls()
                server.login(mail_username, mail_password)
                server.send_message(msg)

        logger.info(f"✅ Verification email sent successfully via SMTP to {recipient_email}")
        return True

    except Exception as e:
        logger.exception(f"❌ Failed to send SMTP verification email to {recipient_email}: {e}")
        return False

def send_password_reset_email(recipient_email: str, recipient_name: str, reset_code: str) -> bool:
    """
    Sends an SMTP email with a 6-digit verification code and reset password link.
    """
    mail_username = os.getenv("GMAIL_USERNAME") or os.getenv("MAIL_USERNAME")
    mail_password = os.getenv("GMAIL_PASSWORD") or os.getenv("MAIL_PASSWORD")
    mail_server = os.getenv("MAIL_SERVER", "smtp.gmail.com")
    mail_port = int(os.getenv("MAIL_PORT", 587))
    
    if mail_password:
        mail_password = mail_password.replace(" ", "")
        
    mail_sender = os.getenv("MAIL_DEFAULT_SENDER", mail_username or "noreply@fintrack.app")
    
    frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173").split(",")[0].strip()
    reset_link = f"{frontend_url}/reset-password?email={recipient_email}&code={reset_code}"

    if not mail_username or not mail_password:
        logger.warning(
            f"⚠️ MAIL_USERNAME/GMAIL_USERNAME or MAIL_PASSWORD not configured in .env. Skipping real SMTP reset email to {recipient_email}. OTP Code: {reset_code}"
        )
        return False

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = f"{reset_code} is your FinTrack Password Reset Code"
        msg["From"] = f"FinTrack Security <{mail_sender}>"
        msg["To"] = recipient_email

        name_display = recipient_name or "Valued User"

        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Reset your FinTrack Password</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc; color: #1e293b;">
            <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; padding: 40px 10px;">
                <tr>
                    <td align="center">
                        <table width="100%" max-width="500px" border="0" cellspacing="0" cellpadding="0" style="max-width: 500px; background-color: #ffffff; border-radius: 20px; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.05); overflow: hidden; border: 1px solid #e2e8f0;">
                            <tr>
                                <td style="background: linear-gradient(135deg, #3b82f6, #1d4ed8); padding: 32px 30px; text-align: center;">
                                    <h1 style="margin: 0; color: #ffffff; font-size: 26px; font-weight: 800; letter-spacing: -0.5px;">FinTrack</h1>
                                    <p style="margin: 4px 0 0; color: #bfdbfe; font-size: 14px;">Personal Finance & Expenditure Tracker</p>
                                </td>
                            </tr>
                            <tr>
                                <td style="padding: 36px 30px; text-align: center;">
                                    <h2 style="margin: 0 0 12px; color: #0f172a; font-size: 20px; font-weight: 700;">Password Reset Request</h2>
                                    <p style="margin: 0 0 24px; color: #475569; font-size: 15px; line-height: 1.6;">
                                        Hi <strong>{name_display}</strong>,<br>
                                        We received a request to change or reset the password for your FinTrack account. Enter the 6-digit code below or click the button to set a new password.
                                    </p>
                                    <div style="background-color: #f1f5f9; border: 2px dashed #cbd5e1; border-radius: 16px; padding: 20px; margin: 0 0 28px; letter-spacing: 6px; font-size: 32px; font-weight: 800; color: #2563eb;">
                                        {reset_code}
                                    </div>
                                    <table border="0" cellspacing="0" cellpadding="0" style="margin: 0 auto 28px;">
                                        <tr>
                                            <td align="center" style="border-radius: 12px; background: #3b82f6;">
                                                <a href="{reset_link}" target="_blank" style="font-size: 15px; font-weight: 700; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 12px; display: inline-block;">
                                                    Reset Password Now
                                                </a>
                                            </td>
                                        </tr>
                                    </table>
                                    <p style="margin: 0; color: #64748b; font-size: 13px; line-height: 1.5;">
                                        If the button doesn't work, copy and paste this URL into your browser:<br>
                                        <a href="{reset_link}" style="color: #3b82f6; word-break: break-all;">{reset_link}</a>
                                    </p>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
            </table>
        </body>
        </html>
        """

        text_content = f"""
        FinTrack Password Reset Request
        
        Hi {name_display},
        Your 6-digit password reset code is: {reset_code}
        
        Or visit this link to reset your password:
        {reset_link}
        """

        msg.attach(MIMEText(text_content, "plain"))
        msg.attach(MIMEText(html_content, "html"))

        if mail_port == 465:
            with smtplib.SMTP_SSL(mail_server, mail_port) as server:
                server.login(mail_username, mail_password)
                server.send_message(msg)
        else:
            with smtplib.SMTP(mail_server, mail_port) as server:
                server.starttls()
                server.login(mail_username, mail_password)
                server.send_message(msg)

        logger.info(f"✅ Password reset email sent successfully via SMTP to {recipient_email}")
        return True

    except Exception as e:
        logger.exception(f"❌ Failed to send SMTP password reset email to {recipient_email}: {e}")
        return False
