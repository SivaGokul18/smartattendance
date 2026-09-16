from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import declarative_base
from app.core.config import settings

# Engine kwargs tuned dynamically for PostgreSQL / MySQL vs SQLite
engine_kwargs = {
    "echo": False,
}

if "sqlite" not in settings.DATABASE_URL:
    connect_args = {}
    # Supabase direct (5432) or Supavisor connection pooler (5432 / 6543)
    if "supabase" in settings.DATABASE_URL or "6543" in settings.DATABASE_URL or "pooler" in settings.DATABASE_URL:
        # Supavisor / PgBouncer requires disabling prepared statement cache in asyncpg
        connect_args["statement_cache_size"] = 0
        connect_args["prepared_statement_cache_size"] = 0
        # Supabase enforces SSL for all incoming connections
        connect_args["ssl"] = "require"

    engine_kwargs.update({
        "pool_pre_ping": True,
        "pool_recycle": 1800,
        "pool_size": 10,
        "max_overflow": 20,
        "connect_args": connect_args,
    })

engine = create_async_engine(
    settings.DATABASE_URL,
    **engine_kwargs
)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)

Base = declarative_base()


async def get_db_session():
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()
