export interface ProductAnalysis {
  productType: string;
  description: string;
  colors: string[];
  mood: string;
  suggestedPrompts: string[];
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  imageUrl?: string;
  isLoading?: boolean;
}

export interface GenerationState {
  originalImage: string | null;
  originalFileName: string | null;
  generatedImages: string[];
  currentIndex: number;
  analysis: ProductAnalysis | null;
  isAnalyzing: boolean;
  isGenerating: boolean;
}
