# Skill: Sync JSON Intelligence

Use this skill to automatically ingest all structured JSON briefings from the desktop folder into the dynamic report template.

## Objective
Scan the desktop intelligence folder for JSON files, parse the structured data, and synchronize it with the `json_reports` table in Supabase.

## Target Folder
`C:\Users\antho\Desktop\Intel Reports`

## Instructions for the Agent
1.  **Navigate** to: `C:\Users\antho\.gemini\antigravity\scratch\market-intel-web`
2.  **Execute** the following ingestion command:
    ```bash
    npm run sync-json -- "C:\Users\antho\Desktop\Intel Reports"
    ```
3.  **Confirm** completion, listing the specific dates that were synchronized.

## Verification
Once complete, the data will be immediately available for the "Template Mock Up" page on the dashboard.
