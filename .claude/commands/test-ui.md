# UI Testing Command

Autonomous UI testing using Chrome browser automation. Runs a complete test suite without user interaction.

## Chrome Automation Tools Reference

### Navigation & Context
| Tool | Purpose |
|------|---------|
| `mcp__claude-in-chrome__tabs_context_mcp` | Get available tabs, create tab group if needed |
| `mcp__claude-in-chrome__tabs_create_mcp` | Create a new tab in the MCP group |
| `mcp__claude-in-chrome__navigate` | Navigate to URL or go back/forward |
| `mcp__claude-in-chrome__resize_window` | Resize browser window |

### Reading Page Content
| Tool | Purpose |
|------|---------|
| `mcp__claude-in-chrome__computer` (action: screenshot) | Capture screenshot of current page |
| `mcp__claude-in-chrome__read_page` | Get accessibility tree of page elements |
| `mcp__claude-in-chrome__find` | Find elements by natural language query |
| `mcp__claude-in-chrome__get_page_text` | Extract text content from page |

### Interactions
| Tool | Purpose |
|------|---------|
| `mcp__claude-in-chrome__computer` (action: left_click) | Click at coordinates |
| `mcp__claude-in-chrome__computer` (action: type) | Type text |
| `mcp__claude-in-chrome__computer` (action: key) | Press keyboard keys |
| `mcp__claude-in-chrome__computer` (action: scroll) | Scroll page |
| `mcp__claude-in-chrome__computer` (action: wait) | Wait for specified seconds |
| `mcp__claude-in-chrome__form_input` | Set form input values by element ref |

### Debugging
| Tool | Purpose |
|------|---------|
| `mcp__claude-in-chrome__read_console_messages` | Read browser console logs |
| `mcp__claude-in-chrome__read_network_requests` | Read network requests |
| `mcp__claude-in-chrome__javascript_tool` | Execute JavaScript in page context |

---

## Task: Autonomous UI Test Suite

You are an autonomous testing agent. Execute all tests WITHOUT asking the user any questions. Report results at the end.

### Pre-flight Checks

1. **Get browser context**
   ```
   mcp__claude-in-chrome__tabs_context_mcp (createIfEmpty: true)
   ```

2. **Create new tab for testing**
   ```
   mcp__claude-in-chrome__tabs_create_mcp
   ```

### Test Suite

Execute ALL of the following tests. Do NOT stop to ask questions. If a test fails, record the failure and continue.

#### Test 1: Frontend Loads
- Navigate to `https://localhost:3000`
- Wait 3 seconds for page load
- Take screenshot
- **PASS if**: Page title contains "StackBTC" or page renders without error
- **FAIL if**: Blank page, error message, or connection refused

#### Test 2: Homepage Content
- Verify homepage has key elements:
  - Logo/brand name visible
  - Navigation menu (Home, Vaults, Docs)
  - "Connect Wallet" button
  - Hero section with call-to-action
- Take screenshot
- **PASS if**: All elements present
- **FAIL if**: Missing key UI elements

#### Test 3: Navigation to Vaults
- Click on "Vaults" in navigation
- Wait 2 seconds
- Take screenshot
- **PASS if**: Vaults page loads with deposit interface
- **FAIL if**: Navigation fails or page doesn't load

#### Test 4: Vault Page Content
- Verify vault page has:
  - TVL display (should show "0 BTC" for fresh vault or a number)
  - Deposit/Withdraw tabs
  - Amount input field
  - "Stake BTC" button
  - APY breakdown section
- **PASS if**: All elements present
- **FAIL if**: Missing deposit interface elements

#### Test 5: Console Errors Check
- Read console messages with error filter
- **PASS if**: No JavaScript errors in console
- **FAIL if**: Console contains errors (warnings are OK)

#### Test 6: Contract Data Display
- Check if TVL shows real data (number, not "loading" or "error")
- Check if share price displays correctly
- **PASS if**: Data is displayed (even if 0)
- **FAIL if**: Shows "loading" forever, "error", or NaN

#### Test 7: Connect Wallet Button
- Locate "Connect Wallet" button
- Click it
- Wait 2 seconds
- Take screenshot
- **PASS if**: Wallet modal/dropdown appears
- **FAIL if**: Nothing happens or error occurs

#### Test 8: Close Wallet Modal (if opened)
- Press Escape key or click outside modal
- Wait 1 second
- **PASS if**: Modal closes
- **FAIL if**: Modal stuck open

### Output Format

After running ALL tests, output a summary table:

```
## UI Test Results

| Test | Status | Notes |
|------|--------|-------|
| 1. Frontend Loads | PASS/FAIL | [details] |
| 2. Homepage Content | PASS/FAIL | [details] |
| 3. Navigation to Vaults | PASS/FAIL | [details] |
| 4. Vault Page Content | PASS/FAIL | [details] |
| 5. Console Errors | PASS/FAIL | [details] |
| 6. Contract Data Display | PASS/FAIL | [details] |
| 7. Connect Wallet Button | PASS/FAIL | [details] |
| 8. Close Wallet Modal | PASS/FAIL | [details] |

**Overall: X/8 tests passed**

### Issues Found
- [List any issues discovered]

### Screenshots
- [Reference screenshot IDs captured during testing]
```

### Important Rules

1. **DO NOT** ask the user any questions during testing
2. **DO NOT** stop if a test fails - continue to the next test
3. **DO** take screenshots at key points for evidence
4. **DO** record all failures with specific details
5. **DO** complete ALL 8 tests before reporting results
6. If Chrome extension disconnects, report that as a blocker and stop
7. If frontend is not running, report that and suggest: `cd apps/web && bun run dev`
