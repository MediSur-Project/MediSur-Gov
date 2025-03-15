import logging

from sqlmodel import Session

from app.core.db import engine, full_init

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def main() -> None:
    logger.info("Creating initial data")
    full_init()
    logger.info("Initial data created")


if __name__ == "__main__":
    main()
