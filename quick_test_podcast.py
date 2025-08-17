#!/usr/bin/env python3
"""
Quick test for multilingual podcast generation
"""

import sys
import os
sys.path.append('backend')

from services.enhanced_podcast_service import enhanced_podcast_service

async def test_podcast():
    # Test with a sample PDF
    pdf_path = "backend/pdf_storage/8dff625a-6bbb-406a-88ef-0d205c93956b.pdf"

    if not os.path.exists(pdf_path):
        print(f"❌ PDF not found: {pdf_path}")
        return

    print("🎧 Testing multilingual podcast generation...")
    print(f"📄 PDF: {pdf_path}")

    # Generate podcast
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
    else:
        print(f"❌ Failed: {result['error']}")

if __name__ == "__main__":
    import asyncio
    asyncio.run(test_podcast())
