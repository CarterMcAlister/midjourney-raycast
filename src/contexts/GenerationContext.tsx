import { MJOptions } from "midjourney";
import { createContext, useContext } from "react";
import { useGenerationList } from "../hooks/useGenerationList";
import { client, validatePreferences } from "../lib/client";
import { Generation } from "../types";

export interface GenerationContextType {
  generations: Generation[];
  addGeneration: (newGeneration: Generation) => Generation;
  updateGeneration: (gen: Generation, genData: Partial<Generation>) => void;
  removeGeneration: (gen: Generation) => void;
  createGeneration: (
    prompt: string,
    onGenerationCreated?: ((gen: Generation) => void) | undefined
  ) => Promise<{
    success: boolean;
    error?: string;
  }>;
  createVariation: (
    gen: Generation,
    target: 1 | 2 | 3 | 4,
    onGenerationCreated: (gen: Generation) => void
  ) => Promise<Generation | null>;
  createVary: (
    gen: Generation,
    options: MJOptions,
    onGenerationCreated: (gen: Generation) => void
  ) => Promise<Generation | null>;
  createUpscale: (
    gen: Generation,
    target: 1 | 2 | 3 | 4,
    onGenerationCreated: (gen: Generation) => void
  ) => Promise<Generation | null>;
  createZoomOut: (
    gen: Generation,
    zoomStrength: number,
    options: MJOptions,
    onGenerationCreated: (gen: Generation) => void
  ) => Promise<Generation | null>;
}

const GenerationContext = createContext({} as GenerationContextType);

export function useGenerationContext() {
  return useContext(GenerationContext);
}

export function GenerationContextProvider({ children }: { children: React.ReactNode; defaultSelectedIndex?: number }) {
  const { generations, addGeneration, updateGeneration, removeGeneration } = useGenerationList();

  const createZoomOut = async (
    gen: Generation,
    zoomStrength: number,
    options: MJOptions,
    onGenerationCreated: (gen: Generation) => void
  ) => {
    if (!gen.id || !gen.hash) return null;

    const newGen = addGeneration({ ...gen, type: "image", command: "upscale" });
    onGenerationCreated(newGen);

    const zoomOut = await client.Custom({
      msgId: gen.id,
      flags: gen.flags || 0,
      content: `${gen.prompt} --zoom ${zoomStrength}`,
      customId: options.custom,
      loading: (uri: string, progress: string) => {
        updateGeneration(newGen, { uri, progress });
      },
    });
    if (zoomOut) {
      updateGeneration(newGen, zoomOut);
    }

    return newGen;
  };

  const createVariation = async (
    gen: Generation,
    target: 1 | 2 | 3 | 4,
    onGenerationCreated: (gen: Generation) => void
  ) => {
    if (!gen.id || !gen.hash) return null;

    const newGen = addGeneration({ ...gen, type: "image", command: "variation" });
    onGenerationCreated(newGen);

    const variation = await client.Variation({
      index: target,
      msgId: gen.id,
      hash: gen.hash,
      flags: gen.flags || 0,
      content: gen.content,
      loading: (uri: string, progress: string) => {
        updateGeneration(newGen, { uri, progress });
      },
    });
    if (variation) {
      updateGeneration(newGen, variation);
    }
    return newGen;
  };

  const createVary = async (gen: Generation, options: MJOptions, onGenerationCreated: (gen: Generation) => void) => {
    if (!gen.id || !gen.hash) return null;

    const newGen = addGeneration({ ...gen, type: "image", command: "vary" });
    onGenerationCreated(newGen);

    const vary = await client.Custom({
      msgId: gen.id,
      flags: gen.flags || 0,
      customId: options.custom,
      content: gen.prompt,
      loading: (uri: string, progress: string) => {
        updateGeneration(newGen, { uri, progress });
      },
    });
    if (vary) {
      updateGeneration(newGen, vary);
    }

    return newGen;
  };

  const createUpscale = async (
    gen: Generation,
    target: 1 | 2 | 3 | 4,
    onGenerationCreated: (gen: Generation) => void
  ) => {
    if (!gen.id || !gen.hash) return null;

    const newGen = addGeneration({ ...gen, type: "upscale", command: "upscale" });
    onGenerationCreated(newGen);

    await client.init();

    const upscale = await client.Upscale({
      index: target,
      msgId: gen.id,
      hash: gen.hash,
      flags: gen.flags || 0,
      content: gen.content,
      loading: (uri: string, progress: string) => {
        updateGeneration(newGen, { uri, progress });
      },
    });
    if (upscale) {
      updateGeneration(newGen, upscale);
    }

    return newGen;
  };

  const createGeneration = async (prompt: string, onGenerationCreated?: (gen: Generation) => void) => {
    if (!prompt || prompt.length === 0) return { success: false, error: "Prompt cannot be empty" };

    // Validate preferences before attempting to connect
    const validation = validatePreferences();
    if (!validation.valid) {
      return { 
        success: false, 
        error: `Configuration error:\n• ${validation.errors.join("\n• ")}\n\nPlease check your extension preferences.`
      };
    }

    const newGen = addGeneration({ prompt, type: "image", command: "imagine" });
    onGenerationCreated?.(newGen);

    try {
      // Initialize the client connection before generating
      await client.init();
      
      const msg = await client.Imagine(prompt, (uri: string, progress: string) => {
        updateGeneration(newGen, { uri, progress });
      });
      if (msg) {
        updateGeneration(newGen, msg);
        return { success: true };
      }
      return { success: false, error: "No response received from Midjourney. The bot may be overloaded or your session may have expired." };
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : String(e);
      console.error("Midjourney generation error:", errorMessage);
      updateGeneration(newGen, { progress: "Failed" });
      
      // Provide helpful error messages for common issues
      let userMessage = errorMessage;
      if (errorMessage.includes("401") || errorMessage.includes("Unauthorized") || errorMessage.includes("invalid session")) {
        userMessage = "Authentication failed. Your Discord session token is invalid or expired.\n\nTo get a new token:\n1. Open Discord in your browser (not the app)\n2. Press F12 to open Developer Tools\n3. Go to Network tab, filter by 'api'\n4. Click any request and find the 'Authorization' header\n5. Copy that value to extension preferences";
      } else if (errorMessage.includes("403") || errorMessage.includes("Forbidden")) {
        userMessage = "Access denied. Make sure:\n• You have access to the specified Discord server\n• The Midjourney bot is in that server\n• You have permission to use the channel";
      } else if (errorMessage.includes("connect") || errorMessage.includes("WebSocket") || errorMessage.includes("ECONNREFUSED")) {
        userMessage = "Could not connect to Discord. Please check:\n• Your internet connection\n• Discord is not blocked by firewall\n• Try again in a few moments";
      } else if (errorMessage.includes("timeout") || errorMessage.includes("ETIMEDOUT")) {
        userMessage = "Connection timed out. Discord may be slow or your session token may have expired.";
      } else if (errorMessage.includes("rate limit") || errorMessage.includes("429")) {
        userMessage = "Rate limited by Discord. Please wait a few minutes before trying again.";
      }
      
      return { success: false, error: userMessage };
    }
  };

  return (
    <GenerationContext.Provider
      value={{
        generations,
        addGeneration,
        updateGeneration,
        removeGeneration,
        createGeneration,
        createVariation,
        createVary,
        createUpscale,
        createZoomOut,
      }}
    >
      {children}
    </GenerationContext.Provider>
  );
}
