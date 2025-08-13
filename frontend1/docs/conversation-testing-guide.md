# Conversation Storage Testing Guide

This guide helps you test the enhanced conversation storage functionality to ensure everything works correctly.

## 🧪 Test Scenarios

### Test 1: Basic Conversation Creation and Retrieval
1. **Start a new chat**
   - Select a security scan from the dropdown
   - Send a message: "What are the critical vulnerabilities found?"
   - Verify: New session appears in chat history with smart title

2. **Load previous conversation**
   - Close the current chat (start new chat or refresh page)
   - Open chat history sidebar
   - Click on the previous conversation
   - Verify: All previous messages are restored and displayed

### Test 2: Multiple Conversations
1. **Create multiple chats**
   - Start 3-4 different conversations with different scans
   - Use different types of questions:
     - "Analyze SQL injection vulnerabilities"
     - "Show me XSS issues"
     - "What remediation steps do you recommend?"
     - "Generate a security report"

2. **Verify smart titles**
   - Check that titles are automatically generated:
     - "SQL Injection Analysis"
     - "XSS Analysis"  
     - "Remediation Guide"
     - "Security Report"

3. **Switch between conversations**
   - Click different conversations in history
   - Verify each loads with complete message history
   - Verify no message mixing between conversations

### Test 3: User-Specific Storage
1. **Test with authentication**
   - Login as User A
   - Create some conversations
   - Note conversation count in debug panel

2. **Switch users**
   - Logout and login as User B
   - Verify: User B sees empty conversation history
   - Create conversations as User B

3. **Switch back**
   - Logout and login as User A
   - Verify: User A's original conversations are still there
   - Verify: User B's conversations are not visible

### Test 4: Debug Panel Features
1. **Access debug panel**
   - Open chat history sidebar
   - Click settings (gear) icon
   - Verify debug panel opens with statistics

2. **Test export functionality**
   - Click "Export" button
   - Verify: JSON file downloads with conversation data
   - Open file and verify structure is correct

3. **Test import functionality**
   - Delete all conversations (or create new user)
   - Click "Import" button
   - Select the previously exported JSON file
   - Verify: All conversations are restored correctly

4. **Test search functionality**
   - Type search terms in the search box
   - Verify: Conversations are filtered correctly
   - Test searching by title, URL, and message content

### Test 5: Storage Persistence
1. **Browser refresh test**
   - Create several conversations
   - Refresh the browser page
   - Verify: All conversations persist after refresh

2. **Browser restart test**
   - Create conversations
   - Close browser completely
   - Reopen browser and navigate to the app
   - Verify: Conversations are still there

3. **Logout/login persistence**
   - Create conversations while logged in
   - Logout and login again
   - Verify: Conversations are preserved

### Test 6: Error Handling
1. **Storage limit test** (Advanced)
   - Create many conversations (or import large dataset)
   - Monitor browser console for storage warnings
   - Verify: System handles storage limits gracefully

2. **Corrupted data test** (Advanced)
   - Using browser dev tools, corrupt localStorage data
   - Reload page
   - Verify: System handles corrupted data without crashing

## 🎯 Expected Results

### ✅ Success Indicators
- All conversations are preserved across browser sessions
- Clicking on chat history loads complete conversation
- Smart titles are generated automatically
- User-specific storage works correctly
- Export/import functionality works
- Search functionality works
- No message duplication or loss
- No mixing of conversations between users
- Graceful error handling

### ❌ Failure Indicators
- Conversations disappear after refresh
- Clicking chat history shows empty or incomplete conversation
- Generic titles instead of smart titles
- Users see each other's conversations
- Export/import doesn't work
- Search doesn't find relevant conversations
- Duplicate messages appear
- App crashes or shows errors

## 🔧 Troubleshooting

### Common Issues

1. **Conversations not loading**
   - Check browser console for errors
   - Verify localStorage permissions
   - Try clearing browser cache and starting fresh

2. **User mixing conversations**
   - Verify user authentication is working
   - Check if user ID is properly set
   - Look for authentication context issues

3. **Storage quota issues**
   - Check browser storage usage
   - Use debug panel to see storage statistics
   - Clear old conversations if needed

4. **Export/import issues**
   - Verify file format is correct JSON
   - Check file permissions
   - Ensure browser allows file downloads/uploads

### Debug Information
Use the debug panel to get detailed information:
- Total sessions and messages
- Storage usage statistics
- Session details and metadata
- Error logs and warnings

## 📝 Test Checklist

Mark off each test as completed:

- [ ] Basic conversation creation works
- [ ] Previous conversations load completely
- [ ] Multiple conversations don't interfere
- [ ] Smart titles are generated correctly
- [ ] User-specific storage works
- [ ] Debug panel opens and shows statistics
- [ ] Export downloads correct JSON file
- [ ] Import restores conversations correctly
- [ ] Search filters conversations properly
- [ ] Conversations persist after browser refresh
- [ ] Conversations persist after browser restart
- [ ] Conversations persist after logout/login
- [ ] Error handling works gracefully
- [ ] No console errors during normal operation
- [ ] All expected UI elements are present

## 🚀 Performance Testing

### Recommended Test Data
- Create 10-20 conversations
- Each conversation should have 5-10 messages
- Use various message lengths and content types
- Test with different scan types and URLs

### Performance Expectations
- Chat history should load in < 100ms
- Conversation switching should be instant
- Search results should appear immediately
- Export should complete in < 2 seconds
- No UI lag during normal operation

## 📊 Reporting Issues

If you find issues during testing, please report:
1. Exact steps to reproduce
2. Expected vs actual behavior
3. Browser console errors (if any)
4. Browser type and version
5. User account details (if relevant)
6. Screenshot or video if helpful

Remember to test across different browsers (Chrome, Firefox, Safari, Edge) to ensure compatibility.
