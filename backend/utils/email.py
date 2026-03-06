import asyncio
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail

from database import get_settings


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


async def _send_email(to_email: str, subject: str, html_content: str):
    settings = get_settings()
    if not settings.sendgrid_api_key:
        return

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


async def send_pending_notification(to_email: str, full_name: str):
    html = _build_html(
        "Registration Received",
        f"""
        <p>Hi {full_name},</p>
        <p>Thank you for registering with the Hidden Ridge community portal.
        Your account is currently <strong>pending approval</strong> by a community administrator.</p>
        <p>You'll receive another email once your account has been approved.</p>
        <p>Welcome to the neighborhood!</p>
        """,
    )
    try:
        await _send_email(to_email, "Hidden Ridge EDH — Registration Pending", html)
    except Exception:
        pass


async def send_admin_new_user_alert(
    admin_email: str, user_name: str, user_email: str, app_url: str
):
    html = _build_html(
        "New Registration",
        f"""
        <p>A new user has registered on the Hidden Ridge community portal:</p>
        <ul>
            <li><strong>Name:</strong> {user_name}</li>
            <li><strong>Email:</strong> {user_email}</li>
        </ul>
        <p><a href="{app_url}/edh" style="color: #C9A84C;">Review in Admin Dashboard</a></p>
        """,
    )
    try:
        await _send_email(admin_email, "Hidden Ridge EDH — New Registration", html)
    except Exception:
        pass


async def send_approval_notification(to_email: str, full_name: str):
    settings = get_settings()
    html = _build_html(
        "Account Approved!",
        f"""
        <p>Hi {full_name},</p>
        <p>Great news! Your Hidden Ridge community account has been <strong>approved</strong>.</p>
        <p>You can now log in and access the forum, photo gallery, events, and member directory.</p>
        <p><a href="{settings.app_url}/login" style="color: #C9A84C;">Sign In Now</a></p>
        """,
    )
    try:
        await _send_email(to_email, "Hidden Ridge EDH — Account Approved", html)
    except Exception:
        pass


async def send_newsletter(subscribers: list[str], subject: str, html_content: str):
    settings = get_settings()
    if not settings.sendgrid_api_key:
        return 0

    sent = 0
    for email in subscribers:
        try:
            await _send_email(email, subject, html_content)
            sent += 1
        except Exception:
            continue
    return sent
