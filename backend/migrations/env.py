from alembic import context

from app.config import Settings
from app.db.models import Base
from app.db.session import create_database_engine

config = context.config
target_metadata = Base.metadata


def run_migrations(connection):
    context.configure(connection=connection, target_metadata=target_metadata, render_as_batch=True)
    with context.begin_transaction():
        context.run_migrations()


connection = config.attributes.get("connection")
if connection is not None:
    run_migrations(connection)
else:
    engine = create_database_engine(Settings())
    try:
        with engine.begin() as connection:
            run_migrations(connection)
    finally:
        engine.dispose()
