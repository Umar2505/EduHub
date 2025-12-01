"""
Utility functions for core app.
"""
import random
import string
from django.core.mail import send_mail
from django.conf import settings
from django.utils.translation import gettext_lazy as _


def generate_username(first_name, last_name):
    """Generate a suggested username from first and last name."""
    if not first_name or not last_name:
        return None
    
    # Create base username: first letter of first name + last name (lowercase, no spaces)
    base = (first_name[0] + last_name).lower().replace(' ', '')
    # Remove special characters, keep only alphanumeric
    base = ''.join(c for c in base if c.isalnum())
    
    # Add random 3-digit number to ensure uniqueness
    random_suffix = ''.join(random.choices(string.digits, k=3))
    return f"{base}{random_suffix}"


def generate_random_password(length=12):
    """Generate a random password."""
    characters = string.ascii_letters + string.digits + string.punctuation
    # Ensure at least one of each type
    password = [
        random.choice(string.ascii_lowercase),
        random.choice(string.ascii_uppercase),
        random.choice(string.digits),
        random.choice(string.punctuation),
    ]
    # Fill the rest randomly
    password.extend(random.choices(characters, k=length - 4))
    # Shuffle to avoid predictable pattern
    random.shuffle(password)
    return ''.join(password)


def send_user_credentials_email(user, password, email_from=None):
    """Send email with user credentials."""
    if not user.email:
        return False
    
    email_from = email_from or getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@eduhub.com')
    
    subject = _('Your EduHub Account Credentials')
    message = _("""
Hello {full_name},

Your account has been created on EduHub platform.

Your login credentials:
Username: {username}
Password: {password}

Please log in and change your password as soon as possible.

Best regards,
EduHub Team
""").format(
        full_name=user.get_full_name() or user.username,
        username=user.username,
        password=password
    )
    
    try:
        send_mail(
            subject=subject,
            message=message,
            from_email=email_from,
            recipient_list=[user.email],
            fail_silently=True,  # Changed to True to prevent user creation failure if email fails
        )
        return True
    except Exception as e:
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Failed to send email to {user.email}: {e}")
        return False

