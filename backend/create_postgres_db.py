"""Create the PostgreSQL database if it does not exist.

Reads connection info from backend/.env.
"""

from pathlib import Path
import os
import sys

from dotenv import load_dotenv
import psycopg
from psycopg import sql


BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR / ".env")


def main() -> int:
    db_name = os.environ.get("POSTGRES_DB", "stocks")
    db_user = os.environ.get("POSTGRES_USER", "postgres")
    db_password = os.environ.get("POSTGRES_PASSWORD", "")
    db_host = os.environ.get("POSTGRES_HOST", "localhost")
    db_port = os.environ.get("POSTGRES_PORT", "5432")
    admin_db = os.environ.get("POSTGRES_ADMIN_DB", "postgres")
    admin_user = os.environ.get("POSTGRES_ADMIN_USER", db_user)
    admin_password = os.environ.get("POSTGRES_ADMIN_PASSWORD", db_password)

    try:
        conn = psycopg.connect(
            dbname=admin_db,
            user=admin_user,
            password=admin_password,
            host=db_host,
            port=db_port,
        )
    except Exception as exc:
        print(f"Failed to connect to admin database '{admin_db}': {exc}")
        return 1

    conn.autocommit = True
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT 1 FROM pg_database WHERE datname = %s", (db_name,))
            exists = cur.fetchone() is not None

            if not exists:
                cur.execute(
                    sql.SQL("CREATE DATABASE {} OWNER {}")
                    .format(sql.Identifier(db_name), sql.Identifier(db_user))
                )
                print(f"Database '{db_name}' created.")
            else:
                print(f"Database '{db_name}' already exists.")
    finally:
        conn.close()

    try:
        target_conn = psycopg.connect(
            dbname=db_name,
            user=admin_user,
            password=admin_password,
            host=db_host,
            port=db_port,
        )
    except Exception as exc:
        print(f"Failed to connect to target database '{db_name}': {exc}")
        return 1

    target_conn.autocommit = True
    try:
        with target_conn.cursor() as cur:
            cur.execute(
                sql.SQL("ALTER SCHEMA public OWNER TO {}")
                .format(sql.Identifier(db_user))
            )
            cur.execute(
                sql.SQL("GRANT ALL ON SCHEMA public TO {}")
                .format(sql.Identifier(db_user))
            )
            cur.execute(
                sql.SQL(
                    "ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO {}"
                ).format(sql.Identifier(db_user))
            )
            cur.execute(
                sql.SQL(
                    "ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO {}"
                ).format(sql.Identifier(db_user))
            )
            cur.execute(
                sql.SQL(
                    "ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO {}"
                ).format(sql.Identifier(db_user))
            )
            print(f"Granted privileges on schema public to '{db_user}'.")
            return 0
    finally:
        target_conn.close()


if __name__ == "__main__":
    raise SystemExit(main())
