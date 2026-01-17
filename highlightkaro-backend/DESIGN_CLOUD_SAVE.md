# Cloud Save Feature Design

## Overview
Cloud Save allows PRO plan users to save, load, and manage highlight projects in MongoDB. This design document outlines the database schema, API structure, security, and scalability considerations.

---

## 1. Database Schema Design

### Project Model (`models/Project.js`)

```javascript
{
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true  // For fast user queries
  },
  
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  
  // Image data (base64 encoded)
  imageData: {
    type: String,  // data:image/png;base64,...
    required: true
  },
  
  // Cropped image (if crop was applied)
  croppedImageData: {
    type: String,  // data:image/png;base64,... or null
    default: null
  },
  
  // Original image dimensions
  imageDimensions: {
    width: { type: Number, required: true },
    height: { type: Number, required: true }
  },
  
  // Crop rectangle (if crop was applied)
  cropRect: {
    x: { type: Number, default: 0 },
    y: { type: Number, default: 0 },
    width: { type: Number, default: 0 },
    height: { type: Number, default: 0 }
  },
  
  // Highlights array
  highlights: [{
    x: { type: Number, required: true },
    y: { type: Number, required: true },
    width: { type: Number, required: true },
    height: { type: Number, required: true },
    color: { type: String, required: true },  // Hex color
    opacity: { type: Number, required: true }, // 0-1
    animation: { type: String, required: true } // "left-to-right", etc.
  }],
  
  // Project settings
  settings: {
    highlightColor: { type: String, default: "#ffff00" },
    highlightOpacity: { type: Number, default: 0.5 },
    animationType: { type: String, default: "left-to-right" },
    animationDuration: { type: Number, default: 2 },
    fps: { type: Number, default: 30 }
  },
  
  // Metadata
  thumbnail: {
    type: String,  // Small base64 thumbnail (optional, for faster loading)
    default: null
  },
  
  size: {
    type: Number,  // Project size in bytes (for monitoring)
    required: true
  },
  
  createdAt: {
    type: Date,
    default: Date.now,
    index: true  // For sorting by date
  },
  
  updatedAt: {
    type: Date,
    default: Date.now
  }
}
```

### Indexes

```javascript
// Compound index for user queries sorted by date
ProjectSchema.index({ userId: 1, createdAt: -1 });

// Single field indexes
ProjectSchema.index({ userId: 1 });
ProjectSchema.index({ createdAt: -1 });
```

**Indexing Strategy:**
- `userId` + `createdAt` compound index: Fast queries for user's projects sorted by date
- `userId` single index: Fast user filtering
- `createdAt` single index: Global date sorting (if needed for admin)

---

## 2. API Design

### Base Route: `/api/projects`

All routes require:
- `auth` middleware (JWT authentication)
- `plan("pro99")` middleware (PRO plan only)

### Endpoints

#### 2.1 Save Project
**POST** `/api/projects`

**Request Body:**
```json
{
  "name": "My Highlight Project",
  "imageData": "data:image/png;base64,iVBORw0KG...",
  "croppedImageData": "data:image/png;base64,..." | null,
  "imageDimensions": {
    "width": 1920,
    "height": 1080
  },
  "cropRect": {
    "x": 0,
    "y": 0,
    "width": 1920,
    "height": 1080
  },
  "highlights": [
    {
      "x": 100,
      "y": 200,
      "width": 300,
      "height": 150,
      "color": "#ffff00",
      "opacity": 0.5,
      "animation": "left-to-right"
    }
  ],
  "settings": {
    "highlightColor": "#ffff00",
    "highlightOpacity": 0.5,
    "animationType": "left-to-right",
    "animationDuration": 2,
    "fps": 30
  }
}
```

**Response:**
```json
{
  "success": true,
  "project": {
    "_id": "507f1f77bcf86cd799439011",
    "userId": "507f191e810c19729de860ea",
    "name": "My Highlight Project",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z",
    "size": 2457600
  }
}
```

**Validation:**
- `name`: Required, max 100 chars
- `imageData`: Required, valid base64 data URL
- `highlights`: Array, max 50 highlights per project
- `size`: Calculate from imageData length, enforce 5MB limit

---

#### 2.2 List Projects
**GET** `/api/projects`

**Query Parameters:**
- `page` (optional): Page number, default 1
- `limit` (optional): Items per page, default 10, max 50
- `sort` (optional): `createdAt` or `updatedAt`, default `createdAt`
- `order` (optional): `asc` or `desc`, default `desc`

**Response:**
```json
{
  "success": true,
  "projects": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "name": "My Highlight Project",
      "thumbnail": "data:image/png;base64,...",
      "highlightsCount": 3,
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "totalPages": 3
  }
}
```

**Notes:**
- Only return metadata (no full imageData)
- Include thumbnail if available
- Include highlights count for UI display

---

#### 2.3 Load Project
**GET** `/api/projects/:projectId`

**Response:**
```json
{
  "success": true,
  "project": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "My Highlight Project",
    "imageData": "data:image/png;base64,iVBORw0KG...",
    "croppedImageData": "data:image/png;base64,...",
    "imageDimensions": {
      "width": 1920,
      "height": 1080
    },
    "cropRect": {
      "x": 0,
      "y": 0,
      "width": 1920,
      "height": 1080
    },
    "highlights": [
      {
        "x": 100,
        "y": 200,
        "width": 300,
        "height": 150,
        "color": "#ffff00",
        "opacity": 0.5,
        "animation": "left-to-right"
      }
    ],
    "settings": {
      "highlightColor": "#ffff00",
      "highlightOpacity": 0.5,
      "animationType": "left-to-right",
      "animationDuration": 2,
      "fps": 30
    },
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

**Security:**
- Verify `project.userId === req.user._id`
- Return 404 if project not found or access denied

---

#### 2.4 Update Project
**PUT** `/api/projects/:projectId`

**Request Body:** Same as Save Project

**Response:** Same as Save Project

**Security:**
- Verify ownership before update
- Update `updatedAt` timestamp

---

#### 2.5 Delete Project
**DELETE** `/api/projects/:projectId`

**Response:**
```json
{
  "success": true,
  "message": "Project deleted successfully"
}
```

**Security:**
- Verify ownership before deletion
- Soft delete option (mark as deleted, don't actually remove)

---

## 3. Security Considerations

### 3.1 Plan Enforcement

**Middleware Stack:**
```javascript
router.post("/", auth, plan("pro99"), createProject);
router.get("/", auth, plan("pro99"), listProjects);
router.get("/:id", auth, plan("pro99"), loadProject);
router.put("/:id", auth, plan("pro99"), updateProject);
router.delete("/:id", auth, plan("pro99"), deleteProject);
```

**Plan Check:**
- `plan("pro99")` middleware ensures `req.user.plan === "pro99"`
- Returns 403 if plan is insufficient
- Uses existing `plan.middleware.js`

---

### 3.2 Access Control

**User Isolation:**
- All queries filter by `userId: req.user._id`
- Project operations verify ownership:
  ```javascript
  const project = await Project.findOne({
    _id: projectId,
    userId: req.user._id
  });
  
  if (!project) {
    return res.status(404).json({ error: "Project not found" });
  }
  ```

**Data Validation:**
- Validate all input fields
- Sanitize project names (prevent XSS)
- Validate image data format (must be valid base64 data URL)
- Validate highlight coordinates (must be within image bounds)

---

### 3.3 Data Integrity

**Size Limits:**
- Max project size: 5MB (configurable)
- Max highlights per project: 50
- Max project name length: 100 characters

**Validation Rules:**
```javascript
// Image data validation
if (!imageData.startsWith('data:image/')) {
  return res.status(400).json({ error: "Invalid image format" });
}

// Size check
const projectSize = Buffer.from(imageData.split(',')[1], 'base64').length;
if (projectSize > 5 * 1024 * 1024) { // 5MB
  return res.status(400).json({ error: "Project size exceeds 5MB limit" });
}

// Highlights validation
if (highlights.length > 50) {
  return res.status(400).json({ error: "Maximum 50 highlights per project" });
}
```

---

## 4. Scalability Considerations

### 4.1 Project Size Limits

**Current Approach (MongoDB Only):**
- Store images as base64 in MongoDB
- Max document size: 16MB (MongoDB limit)
- Enforced limit: 5MB per project (safety margin)

**Future Optimization (if needed):**
- Move to S3/Cloud Storage for images
- Store only image URL in MongoDB
- Keep highlights and settings in MongoDB

---

### 4.2 Indexing Strategy

**Primary Indexes:**
```javascript
// Compound index for user queries
{ userId: 1, createdAt: -1 }

// Single indexes
{ userId: 1 }
{ createdAt: -1 }
```

**Query Performance:**
- List projects: Uses compound index, O(log n)
- Load project: Uses `_id` (primary key), O(1)
- User filtering: Uses `userId` index, O(log n)

**Index Maintenance:**
- MongoDB automatically maintains indexes
- Monitor index usage with `explain()`
- Consider TTL index for old projects (optional)

---

### 4.3 Pagination

**Implementation:**
```javascript
const page = parseInt(req.query.page) || 1;
const limit = Math.min(parseInt(req.query.limit) || 10, 50);
const skip = (page - 1) * limit;

const projects = await Project.find({ userId: req.user._id })
  .sort({ createdAt: -1 })
  .skip(skip)
  .limit(limit)
  .select('-imageData -croppedImageData') // Exclude large fields
  .lean();

const total = await Project.countDocuments({ userId: req.user._id });
```

**Benefits:**
- Reduces memory usage
- Faster response times
- Better UX with pagination controls

---

### 4.4 Thumbnail Generation

**Optional Optimization:**
- Generate small thumbnail (200x200px) on save
- Store thumbnail in separate field
- Use thumbnail in list view (faster loading)
- Load full image only when project is opened

**Implementation:**
```javascript
// Generate thumbnail using sharp or canvas
const thumbnail = await generateThumbnail(imageData, 200, 200);
project.thumbnail = thumbnail;
```

---

### 4.5 Rate Limiting

**Considerations:**
- Limit save operations: 10 saves per minute per user
- Prevent abuse of storage
- Use existing rate limiting middleware (if available)

---

## 5. Data Flow

### 5.1 Save Project Flow

```
Frontend (HighlightKaro.jsx)
  ↓
1. User clicks "Save Project"
  ↓
2. Collect current state:
   - image (convert to base64)
   - croppedImage (if exists)
   - highlights array
   - settings
   - imageDimensions
   ↓
3. POST /api/projects
   Headers: { Authorization: "Bearer <token>" }
   Body: { name, imageData, highlights, settings, ... }
  ↓
Backend (projectController.js)
  ↓
4. auth middleware → Verify JWT, attach req.user
  ↓
5. plan("pro99") middleware → Verify plan
  ↓
6. Validate input (size, format, limits)
  ↓
7. Calculate project size
  ↓
8. Create Project document in MongoDB
  ↓
9. Return project ID and metadata
  ↓
Frontend
  ↓
10. Show success message
11. Optionally refresh project list
```

---

### 5.2 Load Project Flow

```
Frontend
  ↓
1. User clicks "Load Project" from list
  ↓
2. GET /api/projects/:projectId
   Headers: { Authorization: "Bearer <token>" }
  ↓
Backend
  ↓
3. auth middleware → Verify JWT
  ↓
4. plan("pro99") middleware → Verify plan
  ↓
5. Find project by ID + userId
  ↓
6. Verify ownership (project.userId === req.user._id)
  ↓
7. Return full project data
  ↓
Frontend
  ↓
8. Restore state:
   - setImage(imageData)
   - setCroppedImage(croppedImageData)
   - setHighlights(highlights)
   - setHighlightColor(settings.highlightColor)
   - setAnimationType(settings.animationType)
   - ... (all settings)
  ↓
9. User can continue editing
```

---

### 5.3 List Projects Flow

```
Frontend
  ↓
1. User navigates to "My Projects"
  ↓
2. GET /api/projects?page=1&limit=10
   Headers: { Authorization: "Bearer <token>" }
  ↓
Backend
  ↓
3. auth + plan middleware
  ↓
4. Query: Project.find({ userId: req.user._id })
   .sort({ createdAt: -1 })
   .skip((page - 1) * limit)
   .limit(limit)
   .select('-imageData -croppedImageData') // Exclude large fields
  ↓
5. Return metadata only (name, thumbnail, dates, highlightsCount)
  ↓
Frontend
  ↓
6. Display project cards with thumbnails
7. User clicks project → Load full project
```

---

## 6. Error Handling

### Error Responses

**401 Unauthorized:**
```json
{
  "error": "Authentication required"
}
```

**403 Forbidden:**
```json
{
  "error": "Cloud Save is only available for PRO plan users"
}
```

**400 Bad Request:**
```json
{
  "error": "Project size exceeds 5MB limit"
}
```

**404 Not Found:**
```json
{
  "error": "Project not found"
}
```

**500 Internal Server Error:**
```json
{
  "error": "Failed to save project. Please try again."
}
```

---

## 7. Future Enhancements

### Phase 2 (Optional)
- **S3 Integration**: Move images to S3, store URLs in MongoDB
- **Project Sharing**: Generate shareable links (read-only)
- **Project Templates**: Save and reuse common highlight patterns
- **Auto-save**: Automatically save drafts every 30 seconds
- **Project Folders**: Organize projects into folders/categories
- **Search**: Full-text search on project names
- **Export History**: Link saved projects to export history

---

## 8. Implementation Checklist

### Backend
- [ ] Create `models/Project.js` schema
- [ ] Create `controllers/projectController.js`
- [ ] Create `routes/project.routes.js`
- [ ] Wire routes in `app.js`
- [ ] Add validation middleware
- [ ] Add size limit checks
- [ ] Test with Postman/Thunder Client

### Frontend
- [ ] Add "Save Project" button (PRO only)
- [ ] Add "My Projects" page/component
- [ ] Add "Load Project" functionality
- [ ] Add project list UI
- [ ] Integrate with existing state management
- [ ] Add loading states and error handling

### Testing
- [ ] Test save/load with various project sizes
- [ ] Test plan enforcement (free/basic users)
- [ ] Test access control (user isolation)
- [ ] Test pagination
- [ ] Test error scenarios

---

## Summary

This design provides a complete Cloud Save feature for PRO users with:
- ✅ MongoDB-only storage (simple, no S3 needed)
- ✅ Secure plan-based access control
- ✅ Scalable indexing strategy
- ✅ Size limits and validation
- ✅ Clean API design
- ✅ Future-proof architecture

The design is production-ready and can be implemented incrementally without breaking existing functionality.
