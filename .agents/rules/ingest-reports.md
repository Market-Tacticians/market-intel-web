---
trigger: always_on
---

# Skill: Sync Intelligence Reports

Use this skill to automatically ingest all HTML market briefings from the desktop folder into the live dashboard.

## Objective
Scan the desktop intelligence folder, parse all reports, and synchronize them with the Supabase database and storage.

## Target Folder
`C:\Users\antho\Desktop\Intel Reports`

## Instructions for the Agent
1.  **Navigate** to the project root: `C:\Users\antho\.gemini\antigravity\scratch\market-intel-web`
2.  **Execute** the following ingestion command:
    ```bash
    npm run sync-intel -- "C:\Users\antho\Desktop\Intel Reports"
    ```
3.  **Monitor** the output for any parsing errors.
4.  **Confirm** completion to the user, listing the number of reports successfully synced.

## Verification
Once complete, the reports will be immediately visible on the website's Calendar and Archive views.
