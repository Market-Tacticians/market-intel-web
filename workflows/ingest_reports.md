# Workflow: /ingest-reports

When the user types `/ingest-reports`, the agent must immediately execute the following skill:

- **Skill File**: [ingest_reports.md](file:///C:/Users/antho/.gemini/antigravity/scratch/market-intel-web/skills/ingest_reports.md)
- **Primary Action**: Run the bulk ingestion script for the desktop reports folder.

## Execution Steps
1.  Verify the existence of the desktop folder: `C:\Users\antho\Desktop\Intel Reports`
2.  Run the command: `npm run sync-intel -- "C:\Users\antho\Desktop\Intel Reports"`
3.  Parse the terminal output to count successful ingestions.
4.  Report the results to the user with a "System Sync Complete" message.
