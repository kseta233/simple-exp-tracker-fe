/**
 * Chat parsing engine - converts natural language chat input into structured expense form data
 * Examples:
 *   "I spent 50k at starbucks" -> { merchant: "starbucks", amount: 50000, category: "Food" }
 *   "Lunch 75000 Food" -> { merchant: "Lunch", amount: 75000, category: "Food" }
 *   "Grab 34.5k transport" -> { merchant: "Grab", amount: 34500, category: "Transport" }
 */

export interface ParsedChatMessage {
  merchant?: string;
  title?: string;
  amount?: number;
  category?: string;
  confidence: number;
}

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  food: ["food", "lunch", "dinner", "breakfast", "cafe", "coffee", "restaurant", "warung", "makan", "minum"],
  transport: ["transport", "grab", "gojek", "taxi", "bus", "train", "fuel", "bensin", "parkir", "parking"],
  shopping: ["shopping", "mall", "store", "toko", "belanja", "beli", "purchase", "clothes", "fashion"],
  bills: ["bills", "tagihan", "listrik", "air", "internet", "phone", "rent", "sewa"],
  entertainment: ["entertainment", "cinema", "movie", "games", "gaming", "spotify", "netflix"]
};

const AMOUNT_PATTERNS = [
  /(\d+(?:[.,]\d{3})*(?:[.,]\d{1,2})?)\s*[kK]?/,  // 50k, 50.5k, 50,000, 50.000
  /(\d+(?:[.,]\d{3})*(?:[.,]\d{1,2})?)/           // 50000, 50.000
];

/**
 * Parse a chat message into expense form data
 * @param message The chat message text
 * @returns Parsed expense data with confidence score
 */
export function parseChatMessage(message: string): ParsedChatMessage {
  if (!message.trim()) {
    return { confidence: 0 };
  }

  const lowerMessage = message.toLowerCase().trim();
  const words = lowerMessage.split(/[\s,\-:]+/).filter(Boolean);

  // Extract amount
  let amount: number | undefined;
  let amountIndex = -1;

  for (const pattern of AMOUNT_PATTERNS) {
    const match = lowerMessage.match(pattern);
    if (match) {
      const rawAmount = match[1];
      // Normalize to number
      let normalized = rawAmount.replace(/[.,]/g, "");
      
      // Check if it ends with 'k' (thousands)
      const hasK = /[kK]$/.test(match[0]);
      if (hasK) {
        const numericPart = parseFloat(rawAmount.replace(/[kK].*$/i, "").replace(/[.,]/g, ""));
        amount = Math.round(numericPart * 1000);
      } else {
        amount = parseInt(normalized, 10);
      }
      
      if (amount > 0) {
        const firstWordIndex = lowerMessage.indexOf(match[1]);
        amountIndex = firstWordIndex;
        break;
      }
    }
  }

  // Extract category
  let category: string | undefined;
  let categoryConfidence = 0;

  for (const [categoryName, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    for (const keyword of keywords) {
      if (lowerMessage.includes(keyword)) {
        category = categoryName.charAt(0).toUpperCase() + categoryName.slice(1);
        categoryConfidence = 0.8;
        break;
      }
    }
    if (category) break;
  }

  // Extract merchant and title from words not containing amount or category keywords
  const relevantWords = words.filter((word) => {
    // Exclude amount numbers and 'k' suffix
    if (/^\d+[kK]?$/.test(word)) return false;
    
    // Exclude category keywords
    for (const keywords of Object.values(CATEGORY_KEYWORDS)) {
      if (keywords.includes(word)) return false;
    }
    
    // Exclude common stop words
    if (["at", "in", "on", "the", "a", "an", "i", "spent", "cost", "buy"].includes(word)) return false;
    
    return true;
  });

  let merchant = relevantWords.slice(0, 2).join(" ").trim();
  let title = merchant || "Expense";

  // Calculate confidence
  let confidence = 0;
  if (amount !== undefined && amount > 0) confidence += 0.5;
  if (category) confidence += 0.3;
  if (merchant) confidence += 0.2;

  return {
    merchant: merchant || undefined,
    title,
    amount,
    category,
    confidence: Math.min(confidence, 1)
  };
}

/**
 * Parse multiple chat messages (multi-line input)
 * @param input Multi-line chat text
 * @returns Array of parsed messages
 */
export function parseChatInput(input: string): ParsedChatMessage[] {
  return input
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => parseChatMessage(line));
}
