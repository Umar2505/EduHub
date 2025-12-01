"""
Management command to create centers for existing admins who don't have one.
This ensures tenant isolation for all admins.
"""
from django.core.management.base import BaseCommand
from core.models import CustomUser, Center


class Command(BaseCommand):
    help = 'Create centers for admins who don\'t have one (for tenant isolation)'

    def handle(self, *args, **options):
        admins = CustomUser.objects.filter(role='admin', is_superuser=False)
        created_count = 0
        updated_count = 0

        for admin in admins:
            if not admin.center:
                # Create a center for this admin
                center_name = f"{admin.get_full_name() or admin.username}'s Center"
                center = Center.objects.create(
                    name=center_name,
                    owner=admin,
                    address=''
                )
                admin.center = center
                admin.save()
                created_count += 1
                self.stdout.write(
                    self.style.SUCCESS(
                        f'Created center "{center_name}" for admin {admin.username}'
                    )
                )
            elif admin.center and not admin.center.owner:
                # Update existing center to set owner
                admin.center.owner = admin
                admin.center.save()
                updated_count += 1
                self.stdout.write(
                    self.style.SUCCESS(
                        f'Updated center "{admin.center.name}" to set owner as {admin.username}'
                    )
                )

        self.stdout.write(
            self.style.SUCCESS(
                f'\nCompleted: Created {created_count} centers, Updated {updated_count} centers'
            )
        )

