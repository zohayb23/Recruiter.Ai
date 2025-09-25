# 🧪 Pipeline CRM Frontend Testing Guide

## 🎯 Testing Overview
This guide will help you test the Pipeline CRM functionality in your frontend application with the production backend.

## 🌐 Access Information
- **Frontend URL**: http://localhost:5173
- **Production Backend**: http://34.121.146.153:8809
- **Pipeline CRM Page**: http://localhost:5173/pipeline-crm

## 📋 Testing Checklist

### 1. 🔍 **Initial Page Load**
- [ ] Navigate to http://localhost:5173/pipeline-crm
- [ ] Verify the page loads without errors
- [ ] Check that pipeline stages are displayed (Applied, Screening, Interview, Offer, Hired, Rejected)
- [ ] Verify the page shows "No candidates found" initially

### 2. 👤 **Create Test Candidates**
- [ ] Click "Add Candidate" or similar button
- [ ] Create a test candidate with:
  - **Name**: "John Doe"
  - **Email**: "john.doe@example.com"
  - **Current Stage**: "Applied"
  - **Priority**: "High"
  - **Assigned Recruiter**: "Test Recruiter"
- [ ] Verify the candidate appears in the "Applied" stage column

### 3. 🔄 **Test Drag-and-Drop Functionality**
- [ ] Drag the test candidate from "Applied" to "Screening"
- [ ] Verify the candidate moves to the new stage
- [ ] Check that the transition is logged
- [ ] Try dragging to other stages (Interview, Offer, etc.)

### 4. 📝 **Test Notes Functionality**
- [ ] Click on a candidate card
- [ ] Add a note: "Initial screening completed. Strong technical background."
- [ ] Verify the note appears in the candidate details
- [ ] Add multiple notes and verify they're all saved

### 5. 🏷️ **Test Tagging System**
- [ ] Add a tag: "Technical Expert" with color #28a745
- [ ] Add another tag: "Senior Level" with color #007bff
- [ ] Verify tags appear on the candidate card
- [ ] Check that tags are displayed in candidate details

### 6. 📊 **Test Analytics Dashboard**
- [ ] Navigate to the Analytics tab (if available)
- [ ] Verify pipeline statistics are displayed:
  - Total candidates
  - Candidates per stage
  - Notes count
  - Tags count

### 7. 🔍 **Test Search and Filtering**
- [ ] Use the search functionality to find candidates
- [ ] Test filtering by stage, priority, or recruiter
- [ ] Verify search results are accurate

### 8. 📱 **Test Responsive Design**
- [ ] Resize browser window to mobile size
- [ ] Verify drag-and-drop works on touch devices
- [ ] Check that all UI elements are accessible

### 9. ⚡ **Test Performance**
- [ ] Create multiple candidates (5-10)
- [ ] Verify page performance remains good
- [ ] Test with different browsers (Chrome, Firefox, Safari)

### 10. 🚨 **Test Error Handling**
- [ ] Try to create a candidate with invalid data
- [ ] Test network disconnection scenarios
- [ ] Verify error messages are user-friendly

## 🐛 Common Issues to Check

### Connection Issues
- **Problem**: "Failed to fetch" errors
- **Solution**: Check if backend is running at http://34.121.146.153:8809
- **Test**: Visit http://34.121.146.153:8809/health

### CORS Issues
- **Problem**: CORS errors in browser console
- **Solution**: Backend should have CORS enabled (already configured)

### Data Persistence
- **Problem**: Data not saving
- **Solution**: Check browser network tab for API call failures

## 📊 Expected Results

### Successful Test Results:
- ✅ All pipeline stages load correctly
- ✅ Candidates can be created and moved between stages
- ✅ Drag-and-drop works smoothly
- ✅ Notes and tags are saved and displayed
- ✅ Analytics show correct data
- ✅ No console errors
- ✅ Responsive design works

### Performance Benchmarks:
- Page load time: < 2 seconds
- Drag-and-drop response: < 100ms
- API calls: < 500ms
- No memory leaks during extended use

## 🔧 Troubleshooting Commands

### Check Backend Status:
```bash
curl http://34.121.146.153:8809/health
```

### Check Frontend Console:
1. Open browser Developer Tools (F12)
2. Go to Console tab
3. Look for any error messages

### Check Network Requests:
1. Open browser Developer Tools (F12)
2. Go to Network tab
3. Monitor API calls to http://34.121.146.153:8809

## 📝 Test Results Template

```
Date: ___________
Tester: ___________
Browser: ___________

✅ PASS / ❌ FAIL - Initial Page Load
✅ PASS / ❌ FAIL - Create Candidates
✅ PASS / ❌ FAIL - Drag-and-Drop
✅ PASS / ❌ FAIL - Notes Functionality
✅ PASS / ❌ FAIL - Tagging System
✅ PASS / ❌ FAIL - Analytics Dashboard
✅ PASS / ❌ FAIL - Search and Filtering
✅ PASS / ❌ FAIL - Responsive Design
✅ PASS / ❌ FAIL - Performance
✅ PASS / ❌ FAIL - Error Handling

Issues Found:
- 

Overall Result: ✅ PASS / ❌ FAIL
```

## 🎉 Success Criteria
The Pipeline CRM frontend test is considered successful when:
- All core functionality works as expected
- No critical errors in browser console
- Performance meets benchmarks
- User experience is smooth and intuitive
- Data persists correctly between sessions
