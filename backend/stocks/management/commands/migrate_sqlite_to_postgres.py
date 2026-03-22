"""
Management command to copy data from an existing SQLite database
into the active PostgreSQL database (with pgvector enabled).

Usage examples:
    python manage.py migrate_sqlite_to_postgres --sqlite-path ../db.sqlite3
    python manage.py migrate_sqlite_to_postgres --force

Notes:
- By default, the command aborts if the PostgreSQL database is not empty.
- Use --force to flush the target database before importing.
"""
from pathlib import Path
import io
import tempfile

from django.apps import apps
from django.conf import settings
from django.core.management import BaseCommand, CommandError, call_command
from django.db import connections, transaction


class Command(BaseCommand):
    help = 'Copy all data from an existing SQLite DB into the configured PostgreSQL database.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--sqlite-path',
            default=str(Path(settings.BASE_DIR).parent / 'db.sqlite3'),
            help='Path to the source SQLite database file (default: project root db.sqlite3)',
        )
        parser.add_argument(
            '--force',
            action='store_true',
            help='Flush the PostgreSQL database before importing data.',
        )

    def handle(self, *args, **options):
        sqlite_path = Path(options['sqlite_path']).expanduser().resolve()
        force = options['force']

        if not sqlite_path.exists():
            raise CommandError(f"SQLite file not found at {sqlite_path}")

        # Ensure default DB looks like Postgres
        default_engine = settings.DATABASES['default']['ENGINE']
        if 'postgresql' not in default_engine:
            raise CommandError(
                'The default database is not PostgreSQL. '
                'Update DJANGO_DB_ENGINE/POSTGRES_* settings and run migrations first.'
            )

        # Register a temporary SQLite connection under the alias 'sqlite_legacy'
        connections.databases['sqlite_legacy'] = {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': str(sqlite_path),
            # Provide TIME_ZONE to satisfy Django's connection settings expectations
            'TIME_ZONE': settings.TIME_ZONE,
        }

        pg_conn = connections['default']

        # Safety check: stop if Postgres already has data unless --force
        if not force and self._default_db_has_data():
            raise CommandError(
                'PostgreSQL already has data. Re-run with --force to flush and re-import.'
            )

        if force:
            self.stdout.write(self.style.WARNING('Flushing PostgreSQL database...'))
            call_command('flush', database='default', interactive=False)

        self.stdout.write(f'Exporting data from SQLite at {sqlite_path}...')
        with tempfile.NamedTemporaryFile(mode='w+', suffix='.json', delete=False) as tmp:
            call_command(
                'dumpdata',
                database='sqlite_legacy',
                output=tmp.name,
                natural_foreign=True,
                natural_primary=True,
                indent=2,
            )
            tmp_path = tmp.name

        self.stdout.write('Importing data into PostgreSQL...')
        with transaction.atomic(using='default'):
            call_command('loaddata', tmp_path, database='default')
            self._reset_sequences(pg_conn)

        self.stdout.write(self.style.SUCCESS('Migration from SQLite to PostgreSQL completed.'))

    def _default_db_has_data(self) -> bool:
        """Return True if any managed model has rows in the default DB."""
        for model in apps.get_models():
            if not model._meta.managed:
                continue
            if model.objects.using('default').exists():
                return True
        return False

    def _reset_sequences(self, connection):
        """
        Run sqlsequencereset for all apps so Postgres sequences align with imported PKs.
        """
        app_labels = sorted({model._meta.app_label for model in apps.get_models()})
        buffer = io.StringIO()
        call_command('sqlsequencereset', *app_labels, database='default', stdout=buffer)
        sql = buffer.getvalue()
        statements = [stmt.strip() for stmt in sql.split(';') if stmt.strip()]
        if not statements:
            return

        with connection.cursor() as cursor:
            for statement in statements:
                cursor.execute(statement + ';')
