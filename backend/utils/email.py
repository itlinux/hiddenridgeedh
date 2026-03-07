import asyncio
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

from database import get_settings

logger = logging.getLogger(__name__)


def _build_html(title: str, body: str) -> str:
    return f"""
    <div style="font-family: 'Georgia', serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #1B2E1F; padding: 24px; text-align: center;">
            <h1 style="color: #C9A84C; margin: 0; font-size: 24px;">Hidden Ridge EDH</h1>
        </div>
        <div style="padding: 32px 24px; background-color: #F5F0E8;">
            <h2 style="color: #1B2E1F; margin-top: 0;">{title}</h2>
            <div style="color: #333; line-height: 1.6;">{body}</div>
        </div>
        <div style="background-color: #1B2E1F; padding: 16px; text-align: center;">
            <p style="color: #8B7355; margin: 0; font-size: 12px;">
                Hidden Ridge &middot; El Dorado Hills, CA
            </p>
        </div>
    </div>
    """


async def _send_via_sendgrid(to_email: str, subject: str, html_content: str):
    from sendgrid import SendGridAPIClient
    from sendgrid.helpers.mail import Mail

    settings = get_settings()
    message = Mail(
        from_email=(settings.from_email, settings.from_name),
        to_emails=to_email,
        subject=subject,
        html_content=html_content,
    )

    def _send():
        sg = SendGridAPIClient(settings.sendgrid_api_key)
        sg.send(message)

    await asyncio.to_thread(_send)


async def _send_via_smtp(to_email: str, subject: str, html_content: str):
    import aiosmtplib

    settings = get_settings()
    msg = MIMEMultipart("alternative")
    msg["From"] = f"{settings.from_name} <{settings.from_email}>"
    msg["To"] = to_email
    msg["Subject"] = subject
    msg.attach(MIMEText(html_content, "html"))

    await aiosmtplib.send(
        msg,
        hostname=settings.smtp_host,
        port=settings.smtp_port,
        username=settings.smtp_user or None,
        password=settings.smtp_password or None,
        start_tls=settings.smtp_use_tls,
    )


async def _send_email(to_email: str, subject: str, html_content: str):
    settings = get_settings()
    provider = settings.email_provider.lower()

    if provider == "smtp":
        if not settings.smtp_host:
            return
        await _send_via_smtp(to_email, subject, html_content)
    else:
        if not settings.sendgrid_api_key:
            return
        await _send_via_sendgrid(to_email, subject, html_content)


async def send_pending_notification(to_email: str, full_name: str):
    html = _build_html(
        "Registration Received",
        f"""
        <p>Hi {full_name},</p>
        <p>Thank you for registering with Hidden Ridge EDH.
        Your account is currently <strong>pending approval</strong> by a neighborhood administrator.</p>
        <p>You'll receive another email once your account has been approved.</p>
        <p>Welcome to the neighborhood!</p>
        """,
    )
    try:
        await _send_email(to_email, "Hidden Ridge EDH — Registration Pending", html)
    except Exception as e:
        logger.error(f"Failed to send email to {to_email}: {e}")


async def send_admin_new_user_alert(
    admin_email: str, user_name: str, user_email: str, app_url: str
):
    html = _build_html(
        "New Registration",
        f"""
        <p>A new user has registered on Hidden Ridge EDH:</p>
        <ul>
            <li><strong>Name:</strong> {user_name}</li>
            <li><strong>Email:</strong> {user_email}</li>
        </ul>
        <p><a href="{app_url}/edh" style="color: #C9A84C;">Review in Admin Dashboard</a></p>
        """,
    )
    try:
        await _send_email(admin_email, "Hidden Ridge EDH — New Registration", html)
    except Exception as e:
        logger.error(f"Failed to send email to {to_email}: {e}")


async def send_approval_notification(to_email: str, full_name: str):
    settings = get_settings()
    html = _build_html(
        "Account Approved!",
        f"""
        <p>Hi {full_name},</p>
        <p>Great news! Your Hidden Ridge EDH account has been <strong>approved</strong>.</p>
        <p>You can now log in and access the forum, photo gallery, events, and member directory.</p>
        <p><a href="{settings.app_url}/login" style="color: #C9A84C;">Sign In Now</a></p>
        """,
    )
    try:
        await _send_email(to_email, "Hidden Ridge EDH — Account Approved", html)
    except Exception as e:
        logger.error(f"Failed to send email to {to_email}: {e}")


async def send_newsletter_confirm_email(to_email: str, confirm_token: str):
    settings = get_settings()
    confirm_url = f"{settings.app_url}/api/newsletter/confirm?token={confirm_token}"
    html = _build_html(
        "Confirm Your Subscription",
        f"""
        <p>Thank you for subscribing to the <strong>Hidden Ridge EDH</strong> neighborhood newsletter!</p>
        <p>Please click the button below to confirm your subscription:</p>
        <p style="text-align: center; margin: 24px 0;">
            <a href="{confirm_url}" style="background-color: #C9A84C; color: #1B2E1F; padding: 12px 32px; text-decoration: none; font-weight: bold; display: inline-block;">
                Confirm Subscription
            </a>
        </p>
        <p style="color: #666; font-size: 13px;">If you didn't request this, you can safely ignore this email.</p>
        """,
    )
    try:
        await _send_email(to_email, "Hidden Ridge EDH — Confirm Your Subscription", html)
    except Exception as e:
        logger.error(f"Failed to send email to {to_email}: {e}")


async def send_newsletter_unsubscribe_confirmation(to_email: str):
    html = _build_html(
        "You've Been Unsubscribed",
        """
        <p>You've been unsubscribed from the <strong>Hidden Ridge EDH</strong> newsletter.</p>
        <p>You will no longer receive neighborhood newsletter emails.</p>
        <p>If this was a mistake, you can re-subscribe anytime on our website.</p>
        """,
    )
    try:
        await _send_email(to_email, "Hidden Ridge EDH — Unsubscribed", html)
    except Exception as e:
        logger.error(f"Failed to send email to {to_email}: {e}")


async def send_newsletter(subscribers: list[str], subject: str, html_content: str):
    settings = get_settings()
    provider = settings.email_provider.lower()

    if provider == "smtp" and not settings.smtp_host:
        return 0
    if provider != "smtp" and not settings.sendgrid_api_key:
        return 0

    sent = 0
    for email in subscribers:
        try:
            await _send_email(email, subject, html_content)
            sent += 1
        except Exception:
            continue
    return sent
