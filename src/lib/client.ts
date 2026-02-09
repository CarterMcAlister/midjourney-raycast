import "./fetch";

import { getPreferenceValues } from "@raycast/api";
import { Midjourney } from "midjourney";

const preferences = getPreferenceValues<ExtensionPreferences>();

// Validate preferences before creating client
export function validatePreferences(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!preferences.sessionToken || preferences.sessionToken.trim().length === 0) {
    errors.push("Discord session token is missing");
  } else if (preferences.sessionToken.length < 50) {
    errors.push("Discord session token appears too short - make sure you copied the full token");
  }
  
  if (!preferences.serverId || preferences.serverId.trim().length === 0) {
    errors.push("Server ID is missing");
  } else if (!/^\d{17,19}$/.test(preferences.serverId.trim())) {
    errors.push("Server ID should be a 17-19 digit number");
  }
  
  if (!preferences.channelId || preferences.channelId.trim().length === 0) {
    errors.push("Channel ID is missing");
  } else if (!/^\d{17,19}$/.test(preferences.channelId.trim())) {
    errors.push("Channel ID should be a 17-19 digit number");
  }
  
  return { valid: errors.length === 0, errors };
}

export const client = new Midjourney({
  ServerId: preferences.serverId?.trim() || "",
  ChannelId: preferences.channelId?.trim() || "",
  SalaiToken: preferences.sessionToken?.trim() || "",
  Debug: process.env.NODE_ENV === "development",
  Ws: true,
});
