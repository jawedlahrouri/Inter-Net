import logging
from typing import Optional
from fastapi_mail import ConnectionConfig, FastMail, MessageSchema, MessageType
from app.core.config import settings

logger = logging.getLogger(__name__)


def get_mail_config() -> ConnectionConfig:
    return ConnectionConfig(
        MAIL_USERNAME=settings.MAIL_USERNAME,
        MAIL_PASSWORD=settings.MAIL_PASSWORD,
        MAIL_FROM=settings.MAIL_FROM,
        MAIL_FROM_NAME=settings.MAIL_FROM_NAME,
        MAIL_PORT=settings.MAIL_PORT,
        MAIL_SERVER=settings.MAIL_SERVER,
        MAIL_STARTTLS=settings.MAIL_STARTTLS,
        MAIL_SSL_TLS=settings.MAIL_SSL_TLS,
        USE_CREDENTIALS=settings.MAIL_USE_CREDENTIALS,
        VALIDATE_CERTS=settings.MAIL_VALIDATE_CERTS,
        SUPPRESS_SEND=1 if settings.MAIL_SUPPRESS_SEND else 0,
    )


def generate_verification_email_html(username: str, verification_url: str) -> str:
    return f"""<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Confirmez votre compte INTER-NET</title>
  <style>
    body {{
      margin: 0;
      padding: 0;
      background-color: #090d16;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #e2e8f0;
    }}
    .wrapper {{
      width: 100%;
      table-layout: fixed;
      background-color: #090d16;
      padding-bottom: 40px;
    }}
    .main {{
      background-color: #0f172a;
      margin: 30px auto;
      width: 100%;
      max-width: 580px;
      border-radius: 12px;
      border: 1px solid rgba(255, 255, 255, 0.08);
      overflow: hidden;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5);
    }}
    .header {{
      background: linear-gradient(135deg, #1e1b4b 0%, #0f172a 100%);
      padding: 32px 30px;
      text-align: center;
      border-bottom: 1px solid rgba(99, 102, 241, 0.2);
    }}
    .badge {{
      display: inline-block;
      padding: 4px 12px;
      border-radius: 9999px;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      background: rgba(99, 102, 241, 0.15);
      color: #818cf8;
      border: 1px solid rgba(99, 102, 241, 0.3);
      margin-bottom: 12px;
    }}
    .title {{
      font-size: 24px;
      font-weight: 700;
      letter-spacing: -0.02em;
      color: #ffffff;
      margin: 0;
    }}
    .content {{
      padding: 32px 30px;
      font-size: 14px;
      line-height: 1.6;
      color: #cbd5e1;
    }}
    .btn-container {{
      text-align: center;
      padding: 24px 0 10px 0;
    }}
    .btn {{
      display: inline-block;
      background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
      color: #ffffff !important;
      text-decoration: none;
      font-weight: 600;
      font-size: 14px;
      padding: 12px 28px;
      border-radius: 8px;
      letter-spacing: 0.01em;
      box-shadow: 0 4px 14px 0 rgba(79, 70, 229, 0.4);
    }}
    .security-notice {{
      margin-top: 30px;
      padding: 14px 16px;
      background-color: rgba(255, 255, 255, 0.03);
      border-radius: 8px;
      font-size: 12px;
      color: #94a3b8;
      border: 1px solid rgba(255, 255, 255, 0.05);
    }}
    .link-fallback {{
      margin-top: 18px;
      font-size: 12px;
      word-break: break-all;
      color: #64748b;
    }}
    .link-fallback a {{
      color: #818cf8;
      text-decoration: underline;
    }}
    .footer {{
      padding: 20px 30px;
      text-align: center;
      font-size: 11px;
      color: #64748b;
      border-top: 1px solid rgba(255, 255, 255, 0.05);
    }}
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="main">
      <div class="header">
        <div class="badge">INTER-NET • Confirmation</div>
        <h1 class="title">Activez votre compte</h1>
      </div>
      <div class="content">
        <p>Bonjour <strong>{username}</strong>,</p>
        <p>Merci pour votre inscription sur <strong>INTER-NET</strong>, la plateforme de tableau de bord modulaire en temps réel.</p>
        <p>Pour des raisons de sécurité et conformément aux exigences de votre compte, vous devez valider votre adresse email avant de pouvoir vous connecter et accéder à votre dashboard :</p>
        
        <div class="btn-container">
          <a href="{verification_url}" class="btn" target="_blank">Confirmer mon compte</a>
        </div>

        <div class="security-notice">
          <strong>Important :</strong> Tant que vous n'avez pas confirmé votre compte via ce bouton, l'accès à l'application restera restreint.
        </div>

        <div class="link-fallback">
          Si le bouton ne s'affiche pas correctement, copiez et collez l'URL suivante dans votre navigateur :<br>
          <a href="{verification_url}">{verification_url}</a>
        </div>
      </div>
      <div class="footer">
        &copy; 2026 INTER-NET Dashboard • CrabeCorp. Tous droits réservés.
      </div>
    </div>
  </div>
</body>
</html>"""


class MailService:
    @staticmethod
    async def send_verification_email(email: str, username: str, token: str) -> bool:
        # Lien redirigeant vers le frontend avec le token de validation
        verification_url = f"{settings.FRONTEND_URL}/verify-email?token={token}"
        html_body = generate_verification_email_html(username, verification_url)

        message = MessageSchema(
            subject="INTER-NET — Confirmation de votre compte",
            recipients=[email],
            body=html_body,
            subtype=MessageType.html,
        )

        conf = get_mail_config()
        fm = FastMail(conf)

        try:
            await fm.send_message(message)
            logger.info(f"Verification email sent to {email}")
            return True
        except Exception as exc:
            # Fallback gracieux en cas de serveur SMTP non joignable (ex: tests hors-ligne ou dev local)
            logger.warning(
                f"[MailService] Impossible d'envoyer l'email de confirmation à {email}: {exc}. "
                f"Lien de confirmation direct : {verification_url}"
            )
            return False
