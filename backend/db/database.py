# backend/db/database.py
from motor.motor_asyncio import AsyncIOMotorClient
from core.config import settings

class MongoDB:
    def __init__(self):
        self.client: AsyncIOMotorClient | None = None
        self.db = None

    async def connect(self):
        print("Connecting to MongoDB...")
        self.client = AsyncIOMotorClient(settings.MONGO_CONNECTION_STRING)
        self.db = self.client[settings.MONGO_DATABASE_NAME]
        print(f"Successfully connected to MongoDB: '{settings.MONGO_DATABASE_NAME}'")

    async def disconnect(self):
        if self.client:
            self.client.close()
            print("MongoDB connection closed.")

mongo_db = MongoDB()