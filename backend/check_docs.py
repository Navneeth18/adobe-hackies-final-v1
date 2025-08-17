# check_docs.py
from db.database import mongo_db
import asyncio

async def main():
    await mongo_db.connect()
    print('Connecting to MongoDB...')
    
    # Get all documents
    docs = await mongo_db.db['documents'].find({}).to_list(length=None)
    print('\nDocuments:')
    for doc in docs:
        print(f'_id: {doc["_id"]}, type: {type(doc["_id"])}, filename: {doc["filename"]}')
    
    # Check PDF storage directory
    import os
    print('\nPDF Storage Directory:')
    if os.path.exists('pdf_storage'):
        files = os.listdir('pdf_storage')
        for file in files:
            print(f'File: {file}')
    else:
        print('pdf_storage directory does not exist')
    
    await mongo_db.disconnect()

if __name__ == '__main__':
    asyncio.run(main())