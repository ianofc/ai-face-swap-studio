import { supabase } from "@/integrations/supabase/client";

export async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Remove the data:...;base64, prefix
      const base64 = result.split(",")[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export async function urlToBase64(url: string): Promise<string> {
  const response = await fetch(url);
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(",")[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export async function generateComposition(
  targetImageBase64: string,
  modelImageBase64: string,
  prompt?: string
): Promise<{ imageBase64: string; mimeType: string }> {
  const { data, error } = await supabase.functions.invoke("generate-image", {
    body: {
      targetImageBase64,
      modelImageBase64,
      prompt,
      mode: "compose",
    },
  });

  if (error) throw new Error(error.message || "Failed to generate image");
  if (data.error) throw new Error(data.error);
  return data;
}

export async function refineImage(
  imageBase64: string,
  prompt: string
): Promise<{ imageBase64: string; mimeType: string }> {
  const { data, error } = await supabase.functions.invoke("generate-image", {
    body: {
      modelImageBase64: imageBase64,
      prompt,
      mode: "refine",
    },
  });

  if (error) throw new Error(error.message || "Failed to refine image");
  if (data.error) throw new Error(data.error);
  return data;
}

// Process batch with concurrency control
export async function processBatch(
  targetBase64: string,
  modelImages: { id: string; base64: string }[],
  concurrency: number,
  onProgress: (modelId: string, status: "processing" | "success" | "error", resultUrl?: string, errorMessage?: string) => void
) {
  let index = 0;

  async function processNext(): Promise<void> {
    if (index >= modelImages.length) return;
    const current = index++;
    const model = modelImages[current];

    onProgress(model.id, "processing");

    try {
      const result = await generateComposition(targetBase64, model.base64);
      const resultUrl = `data:${result.mimeType};base64,${result.imageBase64}`;
      onProgress(model.id, "success", resultUrl);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Unknown error";
      onProgress(model.id, "error", undefined, msg);
    }

    await processNext();
  }

  const workers = Array.from(
    { length: Math.min(concurrency, modelImages.length) },
    () => processNext()
  );
  await Promise.all(workers);
}