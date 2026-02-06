import { LaunchProps } from "@raycast/api";
import { useEffect, useState } from "react";
import { ErrorPanel } from "./components/ErrorPanel";
import { GenerationDetails } from "./components/GenerationDetails";
import { GenerationContextProvider, useGenerationContext } from "./contexts/GenerationContext";
import { SelectedGenerationContextProvider } from "./contexts/SelectedGenerationContext";

export default function Imagine(props: LaunchProps<{ arguments: { prompt: string } }>) {
  const { prompt } = props.arguments;
  return (
    <GenerationContextProvider>
      <ImagineContent prompt={prompt} />
    </GenerationContextProvider>
  );
}

function ImagineContent({ prompt }: { prompt: string }) {
  const [generationId, setGenerationId] = useState<string | undefined>();
  const { createGeneration } = useGenerationContext();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    createGeneration(prompt, (gen) => {
      setGenerationId(gen.guid);
    }).then((result) => {
      if (!result.success) {
        setError(result.error || "Unknown error occurred");
      }
    });
  }, []);

  if (error) {
    return <ErrorPanel error={error} />;
  }

  if (!generationId) return null;
  return (
    <SelectedGenerationContextProvider selectedId={generationId}>
      <GenerationDetails />
    </SelectedGenerationContextProvider>
  );
}
