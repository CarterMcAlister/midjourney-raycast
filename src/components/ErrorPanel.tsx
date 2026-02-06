import { Action, ActionPanel, Detail, openExtensionPreferences } from "@raycast/api";

interface ErrorPanelProps {
  error?: string;
}

export function ErrorPanel({ error }: ErrorPanelProps) {
  const defaultMessage = "Could not connect to Discord. Please check your extension settings and try again.";
  const errorMessage = error || defaultMessage;
  
  const markdown = `## Something went wrong

**Error:** ${errorMessage}

---

### Troubleshooting Steps

1. **Check your Discord session token** - This token expires periodically. Get a fresh one from Discord's developer tools.

2. **Verify Server ID and Channel ID** - Make sure you're using the correct IDs for a server where Midjourney bot is present.

3. **Ensure Midjourney access** - You need an active Midjourney subscription and access to use the bot.

4. **Try regenerating your session token** - Open Discord in a browser, press F12 → Network tab → filter by "api" → look for Authorization header in any request.

[Setup instructions](https://github.com/CarterMcAlister/midjourney-raycast#how-to-use)`;

  return (
    <Detail
      markdown={markdown}
      actions={
        <ActionPanel>
          <Action title="Open Extension Preferences" onAction={openExtensionPreferences} />
          <Action.OpenInBrowser
            url="https://github.com/CarterMcAlister/midjourney-raycast#how-to-use"
            title="View Setup Instructions"
          />
        </ActionPanel>
      }
    />
  );
}
