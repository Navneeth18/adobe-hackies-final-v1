#!/usr/bin/env python3
"""
Test the enhanced multilingual podcast functionality
"""

import sys
import os
import asyncio
sys.path.append('backend')

from services.enhanced_podcast_service import enhanced_podcast_service

async def test_enhanced_podcast():
    # Test with a sample PDF
    pdf_path = "backend/pdf_storage/8dff625a-6bbb-406a-88ef-0d205c93956b.pdf"
    
    if not os.path.exists(pdf_path):
        print(f"❌ PDF not found: {pdf_path}")
        return
    
    print("🎧 Testing enhanced multilingual podcast generation...")
    print(f"📄 PDF: {pdf_path}")
    
    # Test supported languages
    languages = enhanced_podcast_service.get_supported_languages()
    print(f"🌍 Supported languages: {len(languages)}")
    for code, name in list(languages.items())[:5]:
        print(f"   {code}: {name}")
    print("   ...")
    
    # Generate podcast in English
    print("\n🔄 Generating English podcast...")
    result = await enhanced_podcast_service.generate_multilingual_podcast_from_pdf(
        pdf_path=pdf_path,
        language="en",
        summarize=True
    )
    
    if result["success"]:
        print(f"✅ Success! Audio file: {result['file_path']}")
        print(f"   Audio ID: {result['audio_id']}")
        print(f"   Language: {result['language_name']}")
        print(f"   File size: {result['file_size']} bytes")
        
        # Check if file exists
        if os.path.exists(result['file_path']):
            print(f"   ✅ File verified: {result['file_path']}")
        else:
            print(f"   ❌ File not found: {result['file_path']}")
    else:
        print(f"❌ Failed: {result['error']}")

if __name__ == "__main__":
    asyncio.run(test_enhanced_podcast())
