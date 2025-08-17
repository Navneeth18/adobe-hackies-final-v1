#!/usr/bin/env python3
"""
Test script for the Multilingual Podcast Generator
"""

import requests
import json

# API base URL
API_BASE_URL = "http://localhost:8000/api/v1"

def test_supported_languages():
    """Test the supported languages endpoint"""
    print("🌍 Testing supported languages endpoint...")
    
    try:
        response = requests.get(f"{API_BASE_URL}/audio/supported-languages")
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Success! Found {data['total_languages']} supported languages:")
            for code, name in data['languages'].items():
                print(f"   {code}: {name}")
            return True
        else:
            print(f"❌ Error: {response.status_code} - {response.text}")
            return False
    except Exception as e:
        print(f"❌ Exception: {e}")
        return False

def test_documents_list():
    """Test the documents list endpoint"""
    print("\n📄 Testing documents list endpoint...")
    
    try:
        response = requests.get(f"{API_BASE_URL}/documents")
        if response.status_code == 200:
            data = response.json()
            documents = data.get('documents', [])
            print(f"✅ Success! Found {len(documents)} documents:")
            for doc in documents:
                print(f"   ID: {doc['_id']}")
                print(f"   Filename: {doc['filename']}")
                print(f"   Sections: {doc['total_sections']}")
                print()
            return documents
        else:
            print(f"❌ Error: {response.status_code} - {response.text}")
            return []
    except Exception as e:
        print(f"❌ Exception: {e}")
        return []

def test_multilingual_podcast_generation(document_id, language="en"):
    """Test multilingual podcast generation"""
    print(f"\n🎧 Testing multilingual podcast generation...")
    print(f"   Document ID: {document_id}")
    print(f"   Language: {language}")
    
    try:
        payload = {
            "document_id": document_id,
            "language": language,
            "summarize": True
        }
        
        response = requests.post(
            f"{API_BASE_URL}/audio/generate-multilingual-podcast",
            json=payload,
            headers={"Content-Type": "application/json"}
        )
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Success! Podcast generated:")
            print(f"   Audio ID: {data['audio_id']}")
            print(f"   Language: {data['language_name']} ({data['language']})")
            print(f"   File Size: {data['file_size']} bytes")
            print(f"   Summarized: {data['summarized']}")
            return data['audio_id']
        else:
            print(f"❌ Error: {response.status_code} - {response.text}")
            return None
    except Exception as e:
        print(f"❌ Exception: {e}")
        return None

def main():
    """Main test function"""
    print("🚀 Starting Multilingual Podcast API Tests")
    print("=" * 50)
    
    # Test 1: Supported Languages
    if not test_supported_languages():
        print("❌ Supported languages test failed. Exiting.")
        return
    
    # Test 2: Documents List
    documents = test_documents_list()
    if not documents:
        print("❌ No documents found. Please upload some PDFs first.")
        return
    
    # Test 3: Generate Multilingual Podcast
    first_doc = documents[0]
    document_id = first_doc['_id']
    
    # Test with English
    audio_id = test_multilingual_podcast_generation(document_id, "en")
    if audio_id:
        print(f"\n🎉 Multilingual podcast generated successfully!")
        print(f"   You can access it at: {API_BASE_URL}/audio/serve-multilingual/{audio_id}")
    
    print("\n" + "=" * 50)
    print("🏁 Test completed!")

if __name__ == "__main__":
    main()
