from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail, Email, To, Content, HtmlContent
from database import get_settings
from typing import List, Optional
import logging

logger = logging.getLogger(__name__)


def get_sg_client():
    settings = get_settings()
    return SendGridAPIClient(settings.sendgrid_api_key), settings


async def send_email(to_email: str, to_name: str, subject: str, html_content: str):
    sg, settings = get_sg_client()
    message = Mail(
        from_email=(settings.from_email, settings.from_name),
        to_emails=To(to_email, to_name),
        subject=subject,
        html_content=html_content
    )
    try:
        sg.send(message)
        logger.info(f"Email sent to {to_email}: {subject}")
    except Exception as e:
        logger.error(f"Failed to send email to {to_email}: {e}")
        raise


async def send_bulk_email(recipients: List[dict], subject: str, html_content: str):
    """Send newsletter to multiple recipients"""
    sg, settings = get_sg_client()
    errors = []
    for r in recipients:
        try:
            message = Mail(
                from_email=(settings.from_email, settings.from_name),
                to_emails=To(r["email"], r.get("name", "")),
                subject=subject,
                html_content=html_content
            )
            sg.send(message)
        except Exception as e:
            errors.append({"email": r["email"], "error": str(e)})
    return errors


async def send_approval_notification(user_email: str, user_name: str):
    settings = get_settings()
    html = f"""
    <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 40px; background: #FAFAF7;">
      <div style="text-align: center; margin-bottom: 32px;">
        <h1 style="color: #1B2E1F; font-size: 28px; margin: 0;">Hidden Ridge EDH</h1>
        <p style="color: #8B7355; font-size: 14px; letter-spacing: 2px; text-transform: uppercase;">Community Portal</p>
      </div>
      <div style="background: white; padding: 32px; border-radius: 8px; border-left: 4px solid #C9A84C;">
        <h2 style="color: #1B2E1F;">Welcome to the community, {user_name}!</h2>
        <p style="color: #4A5568; line-height: 1.7;">
          Your registration has been approved. You now have full access to the Hidden Ridge EDH community portal — blogs, the photo gallery, events, and our neighborhood forum.
        </p>
        <div style="text-align: center; margin-top: 32px;">
          <a href="{settings.app_url}/login" style="background: #1B2E1F; color: #C9A84C; padding: 14px 32px; text-decoration: none; border-radius: 4px; font-family: Georgia, serif; letter-spacing: 1px;">
            Sign In Now
          </a>
        </div>
      </div>
      <p style="color: #9CA3AF; font-size: 12px; text-align: center; margin-top: 24px;">
        Hidden Ridge EDH · El Dorado Hills, CA
      </p>
    </div>
    """
    await send_email(user_email, user_name, "Welcome to Hidden Ridge EDH — You're Approved!", html)


async def send_pending_notification(user_email: str, user_name: str):
    html = f"""
    <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 40px; background: #FAFAF7;">
      <div style="text-align: center; margin-bottom: 32px;">
        <h1 style="color: #1B2E1F; font-size: 28px; margin: 0;">Hidden Ridge EDH</h1>
        <p style="color: #8B7355; font-size: 14px; letter-spacing: 2px; text-transform: uppercase;">Community Portal</p>
      </div>
      <div style="background: white; padding: 32px; border-radius: 8px; border-left: 4px solid #C9A84C;">
        <h2 style="color: #1B2E1F;">Registration Received</h2>
        <p style="color: #4A5568; line-height: 1.7;">
          Thank you for registering, {user_name}. Your account is pending approval by a community administrator. You'll receive an email as soon as your account is approved — typically within 24–48 hours.
        </p>
      </div>
      <p style="color: #9CA3AF; font-size: 12px; text-align: center; margin-top: 24px;">
        Hidden Ridge EDH · El Dorado Hills, CA
      </p>
    </div>
    """
    await send_email(user_email, user_name, "Hidden Ridge EDH — Registration Pending Approval", html)


async def send_admin_new_user_alert(admin_email: str, new_user_name: str, new_user_email: str, app_url: str):
    html = f"""
    <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 40px; background: #FAFAF7;">
      <div style="background: white; padding: 32px; border-radius: 8px; border-left: 4px solid #C9A84C;">
        <h2 style="color: #1B2E1F;">New Member Registration</h2>
        <p style="color: #4A5568;"><strong>{new_user_name}</strong> ({new_user_email}) has registered and is awaiting approval.</p>
        <div style="text-align: center; margin-top: 24px;">
          <a href="{app_url}/admin/members" style="background: #1B2E1F; color: #C9A84C; padding: 12px 28px; text-decoration: none; border-radius: 4px;">
            Review in Admin Portal
          </a>
        </div>
      </div>
    </div>
    """
    await send_email(admin_email, "Admin", f"New Registration: {new_user_name}", html)
