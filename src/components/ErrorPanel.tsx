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

4. **How to get your Discord token:**
   - Open Discord in a **web browser** (not the desktop app)
   - Press F12 to open Developer Tools
   - Go to the **Network** tab
   - Filter requests by typing "api"
   - Click on any request to Discord's API
   - Look for the **Authorization** header in the request headers
   - Copy that value (it's your session token)

5. **How to get Server/Channel IDs:**
   - Enable Developer Mode in Discord (User Settings → App Settings → Advanced → Developer Mode)
   - Right-click on the server icon → Copy Server ID
   - Right-click on the channel → Copy Channel ID

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
