# Architecture & User Flows — AI Nexus

This document contains the project architecture as importable draw.io XML. Open the file in diagrams.net and import it to view the diagram visually.

## Architecture diagram (draw.io XML)

```xml name=ai-nexus-architecture.drawio.xml
<mxfile host="app.diagrams.net" modified="2026-10-23T00:00:00.000Z" agent="Copilot" version="24.7.17">
  <diagram id="ai-nexus-architecture" name="AI Nexus Architecture">
    <mxGraphModel dx="1800" dy="1200" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="1800" pageHeight="1200" math="0" shadow="0">
      <root>
        <mxCell id="title"/>
        <mxCell id="root" parent="title"/>

        <mxCell id="titleText" value="AI Nexus Architecture" style="text;html=1;strokeColor=none;fillColor=none;align=center;verticalAlign=middle;fontSize=28;fontStyle=1;fontColor=#1F2937;" vertex="1" parent="root">
          <mxGeometry x="300" y="20" width="760" height="40" as="geometry"/>
        </mxCell>

        <!-- User -->
        <mxCell id="user" value="User\nBrowser" style="ellipse;whiteSpace=wrap;html=1;fillColor=#FFFFFF;strokeColor=#111827;strokeWidth=1.5;fontSize=16;" vertex="1" parent="root">
          <mxGeometry x="70" y="120" width="140" height="70" as="geometry"/>
        </mxCell>

        <!-- Frontend -->
        <mxCell id="frontend" value="Frontend\nReact + Vite\nAdobe Embed SDK" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#EAF3FF;strokeColor=#2F6FDB;strokeWidth=1.5;fontSize=16;" vertex="1" parent="root">
          <mxGeometry x="270" y="90" width="220" height="120" as="geometry"/>
        </mxCell>

        <!-- Backend -->
        <mxCell id="backend" value="Backend\nFastAPI\napi/v1 routes" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#EAF7EA;strokeColor=#2E7D32;strokeWidth=1.5;fontSize=16;" vertex="1" parent="root">
          <mxGeometry x="560" y="80" width="300" height="150" as="geometry"/>
        </mxCell>

        <!-- Services -->
        <mxCell id="services" value="Services\n• pdf_processor\n• llm_service\n• embeddings/vector search\n• tts_service\n• mindmap_service\n• podcast/recommendation" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#FFF4E5;strokeColor=#F2994A;strokeWidth=1.5;fontSize=15;" vertex="1" parent="root">
          <mxGeometry x="560" y="270" width="360" height="220" as="geometry"/>
        </mxCell>

        <!-- MongoDB -->
        <mxCell id="mongodb" value="MongoDB\nDocuments\nAudio files\nSessions" style="shape=cylinder3;whiteSpace=wrap;html=1;boundedLbl=1;backgroundOutline=1;fillColor=#F5EAFB;strokeColor=#9C27B0;strokeWidth=1.5;fontSize=16;" vertex="1" parent="root">
          <mxGeometry x="980" y="120" width="200" height="140" as="geometry"/>
        </mxCell>

        <!-- File storage -->
        <mxCell id="storage" value="File Storage\nUploads / audio / generated files" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#EEF2F5;strokeColor=#607D8B;strokeWidth=1.5;fontSize=16;" vertex="1" parent="root">
          <mxGeometry x="980" y="300" width="200" height="90" as="geometry"/>
        </mxCell>

        <!-- External services -->
        <mxCell id="external" value="External Services\n• Google Gemini (LLM)\n• Azure TTS\n• Adobe Embed API" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#FFF9E6;strokeColor=#F9A825;strokeWidth=1.5;fontSize=15;" vertex="1" parent="root">
          <mxGeometry x="250" y="370" width="280" height="120" as="geometry"/>
        </mxCell>

        <!-- Docker -->
        <mxCell id="docker" value="Docker Compose\nfrontend + backend + mongo" style="shape=folder;whiteSpace=wrap;html=1;fillColor=#F1F8E9;strokeColor=#7CB342;strokeWidth=1.5;fontSize=15;" vertex="1" parent="root">
          <mxGeometry x="70" y="330" width="180" height="100" as="geometry"/>
        </mxCell>

        <!-- Notes -->
        <mxCell id="note" value="Flow: User → Frontend → Backend → Document + AI services → MongoDB + File Storage" style="rounded=0;whiteSpace=wrap;html=1;fillColor=#F8FAFC;strokeColor=#CBD5E1;strokeWidth=1;align=left;verticalAlign=middle;fontSize=13;padding=10;" vertex="1" parent="root">
          <mxGeometry x="250" y="560" width="660" height="60" as="geometry"/>
        </mxCell>

        <!-- Connections -->
        <mxCell id="e1" value="" style="edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=#4B5563;strokeWidth=2;endArrow=classic;" edge="1" parent="root" source="user" target="frontend">
          <mxGeometry relative="1" as="geometry"/>
        </mxCell>

        <mxCell id="e2" value="" style="edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=#4B5563;strokeWidth=2;endArrow=classic;" edge="1" parent="root" source="frontend" target="backend">
          <mxGeometry relative="1" as="geometry"/>
        </mxCell>

        <mxCell id="e3" value="" style="edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=#4B5563;strokeWidth=2;endArrow=classic;" edge="1" parent="root" source="backend" target="services">
          <mxGeometry relative="1" as="geometry"/>
        </mxCell>

        <mxCell id="e4" value="" style="edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=#4B5563;strokeWidth=2;endArrow=classic;" edge="1" parent="root" source="services" target="mongodb">
          <mxGeometry relative="1" as="geometry"/>
        </mxCell>

        <mxCell id="e5" value="" style="edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=#4B5563;strokeWidth=2;endArrow=classic;" edge="1" parent="root" source="services" target="storage">
          <mxGeometry relative="1" as="geometry"/>
        </mxCell>

        <mxCell id="e6" value="" style="edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=#4B5563;strokeWidth=2;endArrow=classic;" edge="1" parent="root" source="services" target="external">
          <mxGeometry relative="1" as="geometry"/>
        </mxCell>

        <mxCell id="e7" value="" style="edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=#4B5563;strokeWidth=2;endArrow=classic;" edge="1" parent="root" source="docker" target="frontend">
          <mxGeometry relative="1" as="geometry"/>
        </mxCell>

        <mxCell id="e8" value="" style="edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=#4B5563;strokeWidth=2;endArrow=classic;" edge="1" parent="root" source="docker" target="backend">
          <mxGeometry relative="1" as="geometry"/>
        </mxCell>
      </root>
    </mxGraphModel>
  </diagram>
</mxfile>
```

To view it visually:
- open diagrams.net
- File → Import From → Device
- select this file or paste the XML directly

This is the actual XML used to generate the architecture diagram.

---

## Summary
- Frontend: React + Vite + Adobe Embed SDK
- Backend: FastAPI with API routes for documents, chat, TTS, mindmap, podcast
- Core services: PDF processing, embeddings, LLM orchestration, TTS, AI features
- Storage: MongoDB + file storage
- External integrations: Google Gemini, Azure TTS, Adobe Embed API
- Runtime: Docker Compose for app services
