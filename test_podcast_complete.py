#!/usr/bin/env python3
"""
Complete test for multilingual podcast functionality
"""

import requests
import json
import time
import os

# API base URL
API_BASE_URL = "http://localhost:8000/api/v1"

def test_api_connection():
    """Test basic API connection"""
    print("🔗 Testing API connection...")
    try:
        response = requests.get(f"{API_BASE_URL}/audio/supported-languages", timeout=10)
        if response.status_code == 200:
            data = response.json()
            print(f"✅ API connected! Found {data['total_languages']} supported languages")
            return True
        else:
            print(f"❌ API connection failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ API connection error: {e}")
        return False

def test_documents_available():
    """Test if documents are available"""
    print("\n📄 Testing document availability...")
    try:
        response = requests.get(f"{API_BASE_URL}/documents", timeout=10)
        if response.status_code == 200:
            data = response.json()
            documents = data.get('documents', [])
            if documents:
                print(f"✅ Found {len(documents)} documents:")
                for doc in documents[:3]:  # Show first 3
                    print(f"   - {doc['filename']} (ID: {doc['_id']})")
                return documents[0]['_id']  # Return first document ID
            else:
                print("❌ No documents found")
                return None
        else:
            print(f"❌ Documents request failed: {response.status_code}")
            return None
    except Exception as e:
        print(f"❌ Documents error: {e}")
        return None

def test_multilingual_podcast_generation(document_id):
    """Test multilingual podcast generation"""
    print(f"\n🎧 Testing multilingual podcast generation...")
    print(f"Document ID: {document_id}")
    
    try:
        payload = {
            "document_id": document_id,
            "language": "en",
            "summarize": True
        }
        
        print("📤 Sending request...")
        response = requests.post(
            f"{API_BASE_URL}/audio/generate-multilingual-podcast",
            json=payload,
            headers={"Content-Type": "application/json"},
            timeout=120  # 2 minutes timeout
        )
        
        print(f"📥 Response status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Success! Podcast generated:")
            print(f"   Audio ID: {data.get('audio_id')}")
            print(f"   Language: {data.get('language_name')} ({data.get('language')})")
            print(f"   File Size: {data.get('file_size')} bytes")
            print(f"   Summarized: {data.get('summarized')}")
            return data.get('audio_id')
        else:
            print(f"❌ Error: {response.status_code}")
            try:
                error_data = response.json()
                print(f"   Error details: {error_data}")
            except:
                print(f"   Raw response: {response.text}")
            return None
            
    except requests.exceptions.Timeout:
        print("❌ Request timed out (this is normal for large documents)")
        return None
    except Exception as e:
        print(f"❌ Exception: {e}")
        return None

def test_audio_serving(audio_id):
    """Test if generated audio can be served"""
    if not audio_id:
        print("\n⏭️ Skipping audio serving test (no audio ID)")
        return False
        
    print(f"\n🔊 Testing audio serving...")
    try:
        response = requests.head(f"{API_BASE_URL}/audio/serve-multilingual/{audio_id}", timeout=10)
        if response.status_code == 200:
            print(f"✅ Audio file is accessible")
            print(f"   URL: {API_BASE_URL}/audio/serve-multilingual/{audio_id}")
            return True
        else:
            print(f"❌ Audio serving failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Audio serving error: {e}")
        return False

def main():
    """Main test function"""
    print("🚀 Starting Complete Multilingual Podcast Test")
    print("=" * 60)
    
    # Test 1: API Connection
    if not test_api_connection():
        print("\n❌ API connection failed. Make sure backend is running on port 8000.")
        return
    
    # Test 2: Document Availability
    document_id = test_documents_available()
    if not document_id:
        print("\n❌ No documents available. Please upload some PDFs first.")
        return
    
    # Test 3: Multilingual Podcast Generation
    audio_id = test_multilingual_podcast_generation(document_id)
    
    # Test 4: Audio Serving
    test_audio_serving(audio_id)
    
    print("\n" + "=" * 60)
    if audio_id:
        print("🎉 All tests completed successfully!")
        print(f"🎧 Generated podcast URL: {API_BASE_URL}/audio/serve-multilingual/{audio_id}")
        print("\n💡 You can now test in the frontend:")
        print("   1. Go to http://localhost:5173/")
        print("   2. Select a document")
        print("   3. Click on 🎙️ Audio tab")
        print("   4. Try the 🌍 Multilingual PDF Podcast section")
    else:
        print("❌ Some tests failed. Check the backend logs for details.")

if __name__ == "__main__":
    main()
