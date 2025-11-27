# n8n Integration Guide

## Overview

This document explains how to set up an n8n workflow to process interview transcripts from the Chrome extension.

## Webhook Setup in n8n

### 1. Create New Workflow

1. Open n8n dashboard
2. Click "New workflow"
3. Name it: `Interview Assistant - Transcript Processor`

### 2. Add Webhook Trigger

1. Click "+" to add a node
2. Search for "Webhook"
3. Select "Webhook" node
4. Configure:

    - Method: `POST`
    - Path: `/interview-assistant` (or your preferred path)
    - Click "Execute when receiving a request"

5. Copy the full webhook URL - this is what you'll paste in the Chrome extension

### 3. Example Workflow Setup

#### Step 1: Webhook Trigger

```
GET/POST request from Chrome extension
↓
Receives: speaker, transcript, meetingId, timestamp
```

#### Step 2: Process with AI (Optional - using OpenAI)

```
IF ChatGPT node:
├─ System prompt: "You are an interview assistant. Analyze this transcript and determine what interview question was answered and what follow-up questions remain."
└─ Input: speaker, transcript
↓
Output: analyzed_content, next_questions
```

#### Step 3: Extract Questions

```
Code node or Set node:
├─ Remove/update questions that have been answered
├─ Maintain list of remaining interview questions
└─ Add notes/hints for next question
```

#### Step 4: Return Response

```
HTTP Response / Respond to Webhook:
├─ success: true
├─ updatedNotes: [remaining questions]
├─ removedQuestions: [completed question IDs]
└─ message: "Interview progress updated"
```

## Request/Response Format

### Chrome Extension → n8n (Request)

```json
{
    "meetingId": "abc-defg-hij",
    "timestamp": "2024-11-26T10:30:00.000Z",
    "speaker": "John Doe",
    "transcript": "I have 5 years of experience with React and Node.js...",
    "metadata": {
        "extensionId": "extension-id-here",
        "capturedAt": "2024-11-26T10:30:00.000Z",
        "type": "TRANSCRIPT_SUBMISSION"
    }
}
```

### n8n → Chrome Extension (Response)

```json
{
    "success": true,
    "message": "Interview progress updated",
    "updatedNotes": [
        {
            "id": "q2",
            "question": "Tell us about your experience with databases",
            "hint": "Consider mentioning SQL and NoSQL experience",
            "answered": false
        },
        {
            "id": "q3",
            "question": "What's your leadership experience?",
            "hint": "Mention projects where you led a team",
            "answered": false
        }
    ],
    "removedQuestions": ["q1"]
}
```

## n8n Nodes Reference

### Webhook Node

```javascript
// Trigger when receiving POST request
// Path: /interview-assistant
// Authentication: None (or add API key if needed)
```

### Code Node - Analyze Transcript

```javascript
// Input from Webhook: $node["Webhook"].json
const body = $input.item.json;

return {
    speaker: body.speaker,
    transcript: body.transcript,
    analyzeNeeded: body.transcript.length > 50,
};
```

### ChatGPT Node (Optional)

```
Prompt: "Analyze this interview transcript and identify:
1. Which question was answered
2. What follow-up questions are appropriate
3. Key points from the answer

Transcript: {{$node["Code"].json.transcript}}"
```

### Set Node - Format Response

```javascript
// Prepare response for Chrome extension
return {
    success: true,
    message: "Processing complete",
    updatedNotes: [
        {
            id: "q1",
            question: "Next question here",
            answered: false,
        },
    ],
    removedQuestions: ["q1"],
};
```

### HTTP Response Node

```
- Status: 200
- Body: $node["Set"].json
- Headers: Content-Type: application/json
```

## Testing Your Workflow

### Test 1: Webhook Trigger

1. Copy webhook URL from n8n
2. Paste into Chrome extension settings
3. Click "Save Webhook" in extension
4. Look for success message in extension

### Test 2: Send Test Data

Use Postman or curl:

```bash
curl -X POST https://your-n8n.com/webhook/interview-assistant \
  -H "Content-Type: application/json" \
  -d '{
    "meetingId": "test-123",
    "speaker": "Test User",
    "transcript": "This is a test transcript",
    "timestamp": "2024-11-26T10:00:00Z"
  }'
```

Expected response:

```json
{
  "success": true,
  "updatedNotes": [...],
  "removedQuestions": [...]
}
```

### Test 3: Full Integration

1. Start Google Meet
2. Open Chrome extension
3. Configure webhook in side panel
4. Let content script capture some dialog
5. Click "Submit Q&A"
6. Check n8n execution history
7. Verify response appears in side panel

## Example Workflows

### Workflow 1: Simple Question Tracking

No AI processing - just mark questions as answered.

```
Webhook Trigger
    ↓
JavaScript Code (Process)
    ↓
HTTP Response (Return updated list)
```

### Workflow 2: AI-Powered Analysis

Use OpenAI to analyze answers and suggest follow-ups.

```
Webhook Trigger
    ↓
Code (Prepare prompt)
    ↓
ChatGPT (Analyze transcript)
    ↓
Code (Parse AI response)
    ↓
Set (Format for extension)
    ↓
HTTP Response (Return to extension)
```

### Workflow 3: With Database Storage

Save interview data and track progress over time.

```
Webhook Trigger
    ↓
Database (Save transcript)
    ↓
Code (Query remaining questions)
    ↓
ChatGPT (Analyze)
    ↓
Database (Update progress)
    ↓
Set (Format response)
    ↓
HTTP Response
```

## Error Handling

### Chrome Extension Expects:

-   HTTP 200 status
-   JSON response with `success` field
-   If error: `{ success: false, error: "message" }`

### n8n Error Response Example:

```json
{
    "success": false,
    "error": "Failed to process transcript",
    "message": "OpenAI API error"
}
```

## Sample JavaScript Code Node

```javascript
// Extract current question from extension data
const { transcript, speaker } = $input.item.json;

// Determine if answer is complete
const isCompleteAnswer = transcript.length > 50 && transcript.includes(speaker);

// Prepare next questions list
const questions = [
    {
        id: "q1",
        question: "Tell us about your experience",
        answered: isCompleteAnswer,
    },
    { id: "q2", question: "What was your biggest challenge?", answered: false },
    { id: "q3", question: "How do you handle feedback?", answered: false },
];

// Format response for Chrome extension
return {
    success: true,
    message: "Interview progress recorded",
    updatedNotes: questions.filter((q) => !q.answered),
    removedQuestions: questions.filter((q) => q.answered).map((q) => q.id),
};
```

## Webhook URL Configuration

### In Chrome Extension:

1. Click settings icon (⚙️) in side panel
2. Enter full webhook URL:
    ```
    https://your-n8n-instance.com/webhook/interview-assistant
    ```
3. Click "Save Webhook"
4. You should see "Webhook configured successfully"

### Debug Tips:

-   Enable n8n workflow execution history to see incoming requests
-   Check Chrome DevTools Console for any send errors
-   Verify webhook is active in n8n node settings

## Rate Limiting & Performance

If using AI (ChatGPT), consider:

-   n8n rate limit: typically 120 req/min per plan
-   Set delays between submissions if needed
-   Cache responses to reduce API calls
-   Monitor n8n usage dashboard

## Security Considerations

### Recommended Setup:

1. **API Key Protection**: Consider adding API key header requirement
2. **CORS**: n8n handles CORS automatically
3. **HTTPS Only**: Always use HTTPS for webhook
4. **Sensitive Data**: Don't log personal interview information

### Add Authentication (Optional):

```javascript
// In n8n Webhook node
// Add header: Authorization: Bearer YOUR_KEY

// In Chrome extension service-worker.js:
const headers = {
    "Content-Type": "application/json",
    Authorization: "Bearer YOUR_KEY",
};
```

## Troubleshooting

### Webhook Not Receiving Requests

1. Check webhook URL is correct in extension
2. Verify n8n workflow is active (green toggle)
3. Check n8n execution history for incoming requests
4. Ensure HTTPS is working properly

### Wrong Response Format

Chrome extension expects:

```json
{
  "success": true/false,
  "updatedNotes": [],
  "removedQuestions": []
}
```

Don't include extra fields that might break the extension.

### High Latency

-   Keep n8n workflow simple for interviews
-   Reduce AI processing time
-   Use caching where possible
-   Consider using webhooks with async processing

## Advanced Features

### Multi-Turn Interview

Track multiple candidates in single workflow:

```
Webhook → Database lookup → Different prompt per candidate → Response
```

### Real-time Notifications

Send updates back to interviewer's email/Slack:

```
Webhook → Process → Email notification → Response to extension
```

### Interview Scoring

Auto-calculate score based on answer quality:

```
Webhook → AI analysis → Calculate score → Update UI → Response
```

## Next Steps

1. Create and test basic n8n workflow
2. Configure webhook URL in Chrome extension
3. Run test submission from extension
4. Monitor n8n execution history
5. Iterate on workflow based on requirements
