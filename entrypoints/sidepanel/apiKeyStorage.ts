// Utility functions for storing and retrieving the OpenAI API key

export const saveApiKey = async (apiKey: string): Promise<void> => {
  await chrome.storage.sync.set({ openaiApiKey: apiKey });
};

export const getApiKey = async (): Promise<string> => {
  const result = await chrome.storage.sync.get("openaiApiKey");
  return result.openaiApiKey || "";
};

export const hasApiKey = async (): Promise<boolean> => {
  const apiKey = await getApiKey();
  return apiKey.length > 0;
};
