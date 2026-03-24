import os
import logging

from django.db.models.signals import post_migrate
from django.dispatch import receiver

from .bootstrap import bootstrap_from_env

logger = logging.getLogger(__name__)


def _env_flag(name: str, default: str = "") -> bool:
    value = os.getenv(name, default)
    return str(value).strip().lower() in {"1", "true", "yes", "on"}


@receiver(post_migrate)
def _bootstrap_on_migrate(sender, **kwargs):
    if getattr(sender, "name", "") != "stocks":
        return
    if not _env_flag("STOCK_BOOTSTRAP_ON_MIGRATE"):
        return

    logger.info("Running stock bootstrap after migrate")
    try:
        bootstrap_from_env()
    except Exception as exc:
        logger.exception("Stock bootstrap failed after migrate: %s", exc)
