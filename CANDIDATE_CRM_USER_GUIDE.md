# 🎯 Candidate CRM & Pipeline - User Guide

## 🌐 Access the System
**URL**: http://localhost:5173/pipeline-crm

## 📋 Overview
The Candidate CRM system allows you to manage candidates through a visual pipeline with drag-and-drop functionality, notes, tags, and complete engagement tracking.

---

## 🚀 Getting Started

### Step 1: Access the Pipeline CRM
1. Open your browser
2. Navigate to: `http://localhost:5173/pipeline-crm`
3. You should see 6 pipeline stages:
   - **Applied** (Blue)
   - **Screening** (Yellow)
   - **Interview** (Cyan)
   - **Offer** (Green)
   - **Hired** (Purple)
   - **Rejected** (Red)

---

## 👤 Managing Candidates

### Creating a New Candidate

#### Method 1: Using the "Add Candidate" Button
1. **Click "Add Candidate"** button (usually at the top of the page)
2. **Fill in the form**:
   - **Candidate Name**: Enter full name
   - **Email**: Enter email address
   - **Current Stage**: Select initial stage (usually "Applied")
   - **Priority Level**: Choose from Low, Medium, High, Urgent
   - **Assigned Recruiter**: Enter recruiter name
3. **Click "Create Candidate"**
4. **Verify**: Candidate appears in the selected stage column

#### Method 2: Programmatic Creation (for testing)
```bash
curl -X POST http://localhost:8809/api/candidate-pipelines \
  -H "Content-Type: application/json" \
  -d '{
    "candidate_id": "john_doe_001",
    "current_stage": "applied",
    "assigned_recruiter": "Sarah Johnson",
    "priority_level": "high",
    "last_activity_date": "2024-01-15T10:00:00Z"
  }'
```

---

## 🔄 Moving Candidates Through the Pipeline

### Drag-and-Drop Method (Recommended)
1. **Locate the candidate** in their current stage column
2. **Click and hold** on the candidate card
3. **Drag** the card to the target stage column
4. **Release** to drop the candidate
5. **Verify**: Candidate moves to new stage and transition is logged

### Dropdown Method (Alternative)
1. **Click on the candidate card**
2. **Click "Move to..." dropdown**
3. **Select the target stage**
4. **Confirm the transition**

### API Method (for automation)
```bash
curl -X POST http://localhost:8809/api/candidate-pipelines/john_doe_001/transition \
  -H "Content-Type: application/json" \
  -d '{
    "candidate_id": "john_doe_001",
    "from_stage": "applied",
    "to_stage": "screening",
    "transition_reason": "Passed initial review",
    "recruiter_id": "sarah_johnson"
  }'
```

---

## 📝 Adding Notes to Candidates

### Through the UI
1. **Click on a candidate card** to open details
2. **Navigate to the "Notes" tab**
3. **Click "Add Note"**
4. **Fill in the note form**:
   - **Content**: Enter your note text
   - **Note Type**: Select from General, Interview, Feedback, Follow-up
   - **Private**: Check if note should be private
5. **Click "Save Note"**
6. **Verify**: Note appears in the notes list

### Through API
```bash
curl -X POST http://localhost:8809/api/candidate-pipelines/john_doe_001/notes \
  -H "Content-Type: application/json" \
  -d '{
    "recruiter_id": "sarah_johnson",
    "content": "Strong technical background. Passed coding interview with flying colors.",
    "note_type": "interview",
    "is_private": false
  }'
```

---

## 🏷️ Managing Candidate Tags

### Adding Tags
1. **Click on a candidate card** to open details
2. **Navigate to the "Tags" tab**
3. **Click "Add Tag"**
4. **Fill in the tag form**:
   - **Tag Name**: Enter tag name (e.g., "Technical Expert")
   - **Tag Color**: Choose a color (e.g., "#28a745" for green)
5. **Click "Save Tag"**
6. **Verify**: Tag appears on the candidate card and in tags list

### Common Tag Examples
- **Technical Expert** (#28a745 - Green)
- **Senior Level** (#007bff - Blue)
- **Fast Track** (#ffc107 - Yellow)
- **High Priority** (#dc3545 - Red)
- **Remote OK** (#17a2b8 - Cyan)

### Through API
```bash
curl -X POST http://localhost:8809/api/candidate-pipelines/john_doe_001/tags \
  -H "Content-Type: application/json" \
  -d '{
    "tag_name": "Technical Expert",
    "tag_color": "#28a745",
    "created_by": "sarah_johnson"
  }'
```

---

## 📊 Viewing Pipeline Analytics

### Accessing Analytics
1. **Look for the "Analytics" tab** in the Pipeline CRM interface
2. **Click on it** to view pipeline statistics
3. **View key metrics**:
   - Total candidates in pipeline
   - Candidates per stage
   - Total notes added
   - Total tags created
   - Stage distribution

### API Access
```bash
curl http://localhost:8809/api/pipeline-analytics
```

---

## 🔍 Searching and Filtering

### Search Functionality
1. **Use the search bar** at the top of the page
2. **Enter search terms** (candidate name, email, recruiter)
3. **View filtered results**

### Filter by Stage
1. **Click on stage headers** to filter
2. **View candidates in specific stages**

### Filter by Priority
1. **Use priority filters** if available
2. **View high-priority candidates first**

---

## 📈 Tracking Engagement History

### Viewing Interaction History
1. **Click on a candidate card**
2. **Navigate to "History" or "Activity" tab**
3. **View chronological list** of all interactions:
   - Pipeline creation
   - Stage transitions
   - Note additions
   - Tag additions
   - All with timestamps

### API Access to History
```bash
curl http://localhost:8809/api/candidate-pipelines/john_doe_001
```

---

## 🎨 Understanding the Interface

### Pipeline Stages
- **Applied**: New candidates who have applied
- **Screening**: Initial screening phase
- **Interview**: Interview process
- **Offer**: Offer extended
- **Hired**: Successfully hired
- **Rejected**: Not selected

### Priority Levels
- **Low**: Standard priority
- **Medium**: Normal priority
- **High**: Important candidates
- **Urgent**: Critical hires

### Note Types
- **General**: General notes
- **Interview**: Interview feedback
- **Feedback**: Performance feedback
- **Follow-up**: Follow-up actions

---

## 🔧 Troubleshooting

### Common Issues

#### White Screen
- **Solution**: Hard refresh (Ctrl+F5 or Cmd+Shift+R)
- **Check**: Browser console for errors (F12)

#### Drag-and-Drop Not Working
- **Solution**: Try the dropdown method instead
- **Check**: Browser compatibility

#### Data Not Saving
- **Solution**: Check network tab in browser console
- **Verify**: Backend is running at http://localhost:8809

#### Can't See Candidates
- **Solution**: Refresh the page
- **Check**: Backend health at http://localhost:8809/health

### Backend Status Check
```bash
curl http://localhost:8809/health
```

---

## 📱 Mobile/Responsive Usage

### Touch Devices
1. **Tap and hold** candidate cards for drag-and-drop
2. **Use dropdown menus** for stage transitions
3. **Swipe** to navigate between sections

### Small Screens
1. **Use horizontal scroll** for pipeline stages
2. **Tap candidate cards** for details
3. **Use collapsible sections** for better navigation

---

## 🚀 Advanced Features

### Bulk Operations
- **Select multiple candidates** (if implemented)
- **Bulk stage transitions**
- **Bulk tagging**

### Export/Import
- **Export candidate data** to CSV
- **Import candidate lists**
- **Backup pipeline data**

### Integration
- **Connect with ATS systems**
- **Email notifications**
- **Calendar integration**

---

## 📞 Support

### Getting Help
1. **Check browser console** (F12) for errors
2. **Verify backend status**: http://localhost:8809/health
3. **Review API documentation**: http://localhost:8809/docs
4. **Check network requests** in browser dev tools

### API Documentation
Visit: http://localhost:8809/docs for complete API reference

---

## 🎯 Best Practices

### Candidate Management
1. **Keep notes updated** after each interaction
2. **Use consistent tagging** for easy filtering
3. **Move candidates promptly** through stages
4. **Add transition reasons** for audit trail

### Pipeline Hygiene
1. **Regularly review** candidates in each stage
2. **Clean up old candidates** (move to Hired/Rejected)
3. **Use priority levels** effectively
4. **Maintain consistent data** entry

### Team Collaboration
1. **Use descriptive notes** for team members
2. **Tag candidates** with relevant skills/attributes
3. **Update recruiters** on candidate status
4. **Document decisions** in notes

---

## 🎉 Success Metrics

Track these KPIs:
- **Time in each stage**
- **Conversion rates** between stages
- **Notes per candidate**
- **Pipeline velocity**
- **Recruiter productivity**

**Happy recruiting! 🚀**
