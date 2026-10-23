# VJ Hostel Management System - Architecture & User Flow Diagrams

This file contains the system architecture and user flow diagrams for the hostel management application.

---

## 1. High-Level Architecture Diagram

```mermaid
flowchart TB
    subgraph ClientLayer[Client Layer]
        S[Student Portal\nReact 19 + Bootstrap 5]
        A[Admin Portal\nReact 19 + Bootstrap 5]
    end

    subgraph AppLayer[Application Layer]
        FE[Frontend\nVite + React Router\nShared Components]
        API[Backend\nNode.js + Express]
        AUTH[JWT Authentication\nProtected Routes]
        SOCKET[Socket.IO\nReal-time Chat]
    end

    subgraph BusinessLayer[Business Logic & Services]
        R1[Student Routes]
        R2[Admin Routes]
        R3[Message Routes]
        R4[Food Routes]
        ROOM[Room Allocation\nComplaint Handling\nOutpass Approval]
    end

    subgraph DataLayer[Data Layer]
        DB[(MongoDB)]
        IMG[Cloudinary\nImage Storage]
    end

    S --> FE
    A --> FE
    FE --> API
    API --> AUTH
    API --> SOCKET
    API --> R1
    API --> R2
    API --> R3
    API --> R4
    R1 --> ROOM
    R2 --> ROOM
    R3 --> ROOM
    R4 --> ROOM

    ROOM --> DB
    FE --> IMG
    API --> IMG
    SOCKET --> DB
```

### High-Level Summary
- Student and admin users interact with a unified React frontend.
- All app requests are handled by a single Node.js + Express backend.
- JWT-based authentication protects student/admin routes.
- Real-time messaging is handled through Socket.IO.
- MongoDB stores hostel data, and Cloudinary stores uploaded media.

---

## 2. Low-Level Architecture Diagram

```mermaid
flowchart LR
    subgraph Frontend[Frontend Layer]
        Entry[main.jsx\nRouter + Context Providers]
        App[App.jsx\nRoute Mapping]
        StudentLayout[StudentLayout\nStudent Pages]
        AdminLayout[AdminLayout\nAdmin Pages]
        Shared[ProtectedRoute\nAPI Service\nSocket.IO Client\nForm Validation]
    end

    subgraph Backend[Backend Layer]
        Server[server.js\nExpress App + CORS + MongoDB + Socket.IO]
        StudentAPI[student-api\nLogin / Complaints / Outpass / Profile]
        AdminAPI[admin-api\nUsers / Rooms / Announcements / Complaints / Dashboard]
        MessageAPI[message-api\nChat and community messaging]
        FoodAPI[food-api\nFood management]
        MW[Middleware\nverifyStudent / verifyAdmin / Upload / Error Handling]
        Models[Mongoose Models\nStudent / Admin / Room / Complaint / Outpass / Message / Food / Review]
    end

    subgraph Database[Database & Storage]
        Mongo[(MongoDB)]
        Cloud[Cloudinary\nProfile Photos / Complaint Images / Post Images]
    end

    Entry --> App
    App --> StudentLayout
    App --> AdminLayout
    StudentLayout --> Shared
    AdminLayout --> Shared

    Shared --> Server
    Server --> StudentAPI
    Server --> AdminAPI
    Server --> MessageAPI
    Server --> FoodAPI

    StudentAPI --> MW
    AdminAPI --> MW
    MessageAPI --> MW
    FoodAPI --> MW

    MW --> Models
    Models --> Mongo

    StudentAPI --> Cloud
    AdminAPI --> Cloud
    MessageAPI --> Mongo
    FoodAPI --> Mongo
```

### Low-Level Components
- Frontend route structure:
  - `/login` for unified login
  - `/home/*` for student pages
  - `/dashboard/*` for admin pages
- Backend API modules:
  - `/student-api` for student features
  - `/admin-api` for admin operations
  - `/message-api` for chat services
  - `/food-api` for food planning and listing
- Database models include students, rooms, outpasses, complaints, announcements, community posts, messages, food items, and reviews.
- File uploads are managed through Multer and Cloudinary.

---

## 3. User Flow Diagram

```mermaid
flowchart TD
    A[Open Portal\nlocalhost:5173] --> B[Unified Login Page]
    B --> C{Select Portal}

    C -->|Student| D[Enter Roll Number + Password]
    C -->|Admin| E[Enter Username + Password]

    D --> F[POST /student-api/login]
    E --> G[POST /admin-api/login]

    F --> H{Credentials Valid?}
    G --> I{Credentials Valid?}

    H -->|No| J[Show Error + Retry]
    I -->|No| K[Show Error + Retry]

    H -->|Yes| L[Generate JWT Token]
    I -->|Yes| M[Generate JWT Token]

    L --> N[Store Token in localStorage\nSet User Context]
    M --> O[Store Token in localStorage\nSet Admin Context]

    N --> P[Redirect to /home]
    O --> Q[Redirect to /dashboard]

    P --> R[Student Dashboard\nHome / Announcements / Community / Complaints / Outpass / Food / Profile]
    Q --> S[Admin Dashboard\nStudents / Rooms / Announcements / Complaints / Outpasses / Community / Food]
```

### Main User Tasks Covered by the Flow
- Student login and authentication
- Admin login and authentication
- Redirecting to role-specific dashboards
- Access to all major hostel system modules

---

## 4. Common Feature Flow (Student & Admin)

```mermaid
flowchart LR
    U[User] --> UI[React Frontend]
    UI --> API[Express API]
    API --> JWT[JWT Validation]
    API --> MDL[Mongoose Models]
    MDL --> DB[(MongoDB)]

    UI --> FILE[Cloudinary Uploads]
    FILE --> API

    UI --> SOCKET[Socket.IO Chat]
    SOCKET --> API
    API --> DB
```

This flow represents the generic interaction model used across hostel management functionalities such as complaints, room operations, outpasses, announcements, and community chat.

---

## 5. Summary

- Frontend: React 19 + Vite + Bootstrap 5 + React Router
- Backend: Node.js + Express.js + Socket.IO
- Authentication: JWT + Protected routes + Middleware
- Database: MongoDB with Mongoose models
- Storage: Cloudinary for uploaded images
- Core modules: Student management, admin management, complaint handling, room allocation, outpass approval, announcements, community chat, and food service

These diagrams can be used in documentation, presentations, or screenshots for the project architecture overview.
