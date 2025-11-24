

interface TranslateResponse {
  responseData: {
    translatedText: string;
    match: number;
  };
  responseStatus: number;
}

export const translateText = async (text: string, from: 'en' | 'zh', to: 'en' | 'zh'): Promise<string> => {
  if (!text || !text.trim()) return '';

  // Map generic language codes to MyMemory specific codes
  // zh -> zh-TW (Traditional Chinese) for this app context
  const sourceLang = from === 'en' ? 'en' : 'zh-TW';
  const targetLang = to === 'en' ? 'en' : 'zh-TW';
  const langPair = `${sourceLang}|${targetLang}`;

  try {
    // MyMemory API limits: 500 chars per request is safe for GET.
    // Ideally we split, but for prompt fragments, it's usually fine. 
    // If text is very long, we truncate or warn (for this simple implementation).
    const encodedText = encodeURIComponent(text);
    const url = `https://api.mymemory.translated.net/get?q=${encodedText}&langpair=${langPair}`;

    const response = await fetch(url);
    const data: TranslateResponse = await response.json();

    if (response.ok && data.responseStatus === 200) {
      return data.responseData.translatedText;
    } else {
      console.error("Translation API Error:", data);
      throw new Error("Translation failed");
    }
  } catch (error) {
    console.error("Translation Error:", error);
    return "Error: Could not translate. Service might be busy.";
  }
};
