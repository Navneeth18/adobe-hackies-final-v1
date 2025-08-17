# Document Insight Engine Frontend

## Features

### Document Library
- **View Uploaded Documents**: The document library section now displays all previously uploaded PDF documents from the database
- **Document Selection**: Click on any document in the library to view its extracted sections and content
- **Document Information**: View detailed information about selected documents including filename, cluster ID, and number of sections
- **Auto-refresh**: The library automatically refreshes after new uploads and includes a manual refresh button

### Document Viewing
- **Section Display**: When a document is selected from the library, all its extracted sections are displayed in a readable format
- **Content Preview**: View the actual text content of each section with titles and page numbers
- **Responsive Layout**: The document viewer adapts to show either uploaded files or library documents

### Upload Integration
- **Seamless Workflow**: After uploading new documents, the library automatically updates to include them
- **Session Management**: Current upload session files are managed separately from the persistent document library

## API Endpoints Used

### Backend Endpoints
- `GET /api/v1/documents` - Retrieve all uploaded documents
- `GET /api/v1/documents/{cluster_id}` - Retrieve documents by cluster ID
- `GET /api/v1/documents/sections/{document_id}` - Retrieve sections for a specific document
- `POST /api/v1/documents/upload_cluster` - Upload multiple PDFs as a cluster

### Frontend API Service Methods
- `apiService.getDocuments()` - Fetch all documents
- `apiService.getDocumentsByCluster(clusterId)` - Fetch documents by cluster
- `apiService.getDocumentSections(documentId)` - Fetch document sections
- `apiService.uploadCluster(files)` - Upload new documents

## Usage

1. **Upload Documents**: Use the file upload section to add new PDFs to the system
2. **View Library**: The document library will show all previously uploaded documents
3. **Select Document**: Click on any document in the library to view its content
4. **View Sections**: The center area will display all extracted sections from the selected document
5. **Refresh**: Use the refresh button to manually update the document library

## Technical Implementation

- **State Management**: Uses React hooks to manage document library state
- **Error Handling**: Comprehensive error handling for API calls and data loading
- **Loading States**: Visual feedback during data fetching operations
- **Responsive Design**: Tailwind CSS for modern, responsive UI
