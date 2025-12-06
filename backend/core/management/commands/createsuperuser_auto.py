"""
Management command to automatically create a superuser from environment variables.
This is useful for deployments where shell access is not available.
"""
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
import os

User = get_user_model()


class Command(BaseCommand):
    help = 'Creates a superuser from environment variables (ADMIN_USERNAME, ADMIN_EMAIL, ADMIN_PASSWORD)'

    def handle(self, *args, **options):
        username = os.getenv('ADMIN_USERNAME')
        email = os.getenv('ADMIN_EMAIL', '')
        password = os.getenv('ADMIN_PASSWORD')

        if not username or not password:
            self.stdout.write(
                self.style.WARNING(
                    'ADMIN_USERNAME and ADMIN_PASSWORD environment variables not set. '
                    'Skipping superuser creation.'
                )
            )
            return

        # Check if user already exists
        if User.objects.filter(username=username).exists():
            self.stdout.write(
                self.style.WARNING(f'User "{username}" already exists. Skipping creation.')
            )
            # Update password if user exists
            user = User.objects.get(username=username)
            user.set_password(password)
            if email:
                user.email = email
            user.is_superuser = True
            user.is_staff = True
            user.save()
            self.stdout.write(
                self.style.SUCCESS(f'Updated password and permissions for user "{username}"')
            )
            return

        # Create new superuser
        try:
            User.objects.create_superuser(
                username=username,
                email=email,
                password=password
            )
            self.stdout.write(
                self.style.SUCCESS(f'Successfully created superuser "{username}"')
            )
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'Error creating superuser: {str(e)}')
            )

