export interface PromptBlock {
  id: string;
  name: string;
  tag: string;
  content: string;
}

export interface BuilderBlock extends PromptBlock {
  instanceId: string; // Unique ID for the instance in the builder (allows duplicates)
}

export type TagStats = Record<string, number>;
