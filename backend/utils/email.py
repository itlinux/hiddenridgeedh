import asyncio
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

from database import get_settings

logger = logging.getLogger(__name__)


def _build_html(title: str, body: str) -> str:
    settings = get_settings()
    logo_url = f"{settings.app_url}/images/logo.png"
    return f"""
    <div style="font-family: 'Georgia', serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #1B2E1F; padding: 24px; text-align: center;">
            <img src="{logo_url}" alt="Hidden Ridge EDH" width="80" height="80" style="margin-bottom: 12px;" />
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

    # Port 587 = STARTTLS (connect plain, then upgrade)
    # Port 465 = implicit TLS (connect with SSL from the start)
    use_tls = settings.smtp_port == 465
    start_tls = settings.smtp_use_tls and not use_tls

    await aiosmtplib.send(
        msg,
        hostname=settings.smtp_host,
        port=settings.smtp_port,
        username=settings.smtp_user or None,
        password=settings.smtp_password or None,
        use_tls=use_tls,
        start_tls=start_tls,
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


async def send_alert_email(
    to_email: str,
    author_name: str,
    message: str,
    category: str,
    source: str = "web",
):
    """Send an email notification when a new neighborhood alert is posted."""
    settings = get_settings()
    source_label = "via SMS" if source == "sms" else "on the web"
    category_display = category.replace("-", " ").title()
    html = _build_html(
        "Neighborhood Alert",
        f"""
        <p style="background-color: #FEF2F2; border: 1px solid #FECACA; padding: 16px; border-radius: 4px;">
            <strong style="color: #991B1B;">{category_display}</strong>
        </p>
        <p style="font-size: 16px; margin: 16px 0;">{message}</p>
        <p style="color: #666; font-size: 13px;">
            Posted by <strong>{author_name}</strong> {source_label}
        </p>
        <p style="text-align: center; margin: 24px 0;">
            <a href="{settings.app_url}/safety" style="background-color: #C9A84C; color: #1B2E1F; padding: 12px 32px; text-decoration: none; font-weight: bold; display: inline-block;">
                View All Alerts
            </a>
        </p>
        <p style="color: #999; font-size: 11px;">
            You're receiving this because you opted in to email alerts.
            To stop, update your notification settings on your
            <a href="{settings.app_url}/profile" style="color: #C9A84C;">profile page</a>.
        </p>
        """,
    )
    try:
        await _send_email(to_email, f"Hidden Ridge Alert — {category_display}", html)
    except Exception as e:
        logger.error(f"Failed to send alert email to {to_email}: {e}")


async def send_alert_emails_to_opted_in(
    author_id: str,
    author_name: str,
    message: str,
    category: str,
    source: str = "web",
):
    """Query all users with email_opt_in=True and send them the alert (excluding author)."""
    from database import get_db

    db = get_db()
    cursor = db.users.find({
        "is_active": True,
        "is_approved": True,
        "email_opt_in": True,
    })
    async for user in cursor:
        if str(user["_id"]) == author_id:
            continue  # Don't email the author about their own alert
        email = user.get("email")
        if email:
            await send_alert_email(email, author_name, message, category, source)


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
