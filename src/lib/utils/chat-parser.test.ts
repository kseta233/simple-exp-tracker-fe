/**
 * Chat Parser Tests
 * 
 * Tests for the chat-based expense parsing algorithm.
 * These tests verify that natural language input is correctly parsed into
 * structured expense data with appropriate confidence scores.
 */

import { parseChatMessage, parseChatInput } from "@/lib/utils/chat-parser";

describe("parseChatMessage", () => {
  describe("amount parsing", () => {
    it("parses 'k' suffix amounts", () => {
      const result = parseChatMessage("Coffee 50k");
      expect(result.amount).toBe(50000);
      expect(result.amount).toBeGreaterThan(0);
    });

    it("parses numeric amounts with commas", () => {
      const result = parseChatMessage("Lunch 75,000");
      expect(result.amount).toBe(75000);
    });

    it("parses decimal amounts", () => {
      const result = parseChatMessage("Grab 34.5k");
      expect(result.amount).toBe(34500);
    });

    it("parses amounts without commas", () => {
      const result = parseChatMessage("Food 25000");
      expect(result.amount).toBe(25000);
    });

    it("returns undefined for missing amount", () => {
      const result = parseChatMessage("Coffee at Starbucks");
      expect(result.amount).toBeUndefined();
    });

    it("returns undefined for zero amount", () => {
      const result = parseChatMessage("0k");
      expect(result.amount).toBeUndefined();
    });
  });

  describe("merchant parsing", () => {
    it("extracts merchant name", () => {
      const result = parseChatMessage("Coffee 50k at Starbucks");
      expect(result.merchant).toBeDefined();
    });

    it("handles merchant without prepositions", () => {
      const result = parseChatMessage("Starbucks 50k");
      expect(result.merchant).toBeDefined();
    });

    it("handles multiple word merchants", () => {
      const result = parseChatMessage("McDonald's 45k");
      expect(result.merchant).toBeDefined();
    });

    it("returns undefined for merchant-only input", () => {
      const result = parseChatMessage("Starbucks");
      expect(result.amount).toBeUndefined();
    });
  });

  describe("category parsing", () => {
    it("detects food category", () => {
      const result = parseChatMessage("Coffee 50k food");
      expect(result.category).toBe("Food");
    });

    it("detects transport category", () => {
      const result = parseChatMessage("Grab 34.5k transport");
      expect(result.category).toBe("Transport");
    });

    it("detects shopping category", () => {
      const result = parseChatMessage("Clothes 150k shopping");
      expect(result.category).toBe("Shopping");
    });

    it("detects bills category", () => {
      const result = parseChatMessage("Electricity 200k bills");
      expect(result.category).toBe("Bills");
    });

    it("detects entertainment category", () => {
      const result = parseChatMessage("Movie 75k entertainment");
      expect(result.category).toBe("Entertainment");
    });

    it("detects food from 'lunch' keyword", () => {
      const result = parseChatMessage("Lunch 45k");
      expect(result.category).toBe("Food");
    });

    it("detects food from 'dinner' keyword", () => {
      const result = parseChatMessage("Dinner 60k");
      expect(result.category).toBe("Food");
    });

    it("detects transport from 'grab' keyword", () => {
      const result = parseChatMessage("Grab 34.5k");
      expect(result.category).toBe("Transport");
    });

    it("returns undefined for unrecognized category", () => {
      const result = parseChatMessage("Random 50k xyz");
      expect(result.category).toBeUndefined();
    });

    it("is case insensitive", () => {
      const result = parseChatMessage("random 50k FOOD");
      expect(result.category).toBe("Food");
    });
  });

  describe("confidence scoring", () => {
    it("returns confidence between 0 and 1", () => {
      const result = parseChatMessage("Coffee 50k food");
      expect(result.confidence).toBeGreaterThanOrEqual(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
    });

    it("has higher confidence with complete data", () => {
      const result = parseChatMessage("Coffee 50k food");
      expect(result.confidence).toBeGreaterThan(0.5);
    });

    it("has lower confidence with incomplete data", () => {
      const result = parseChatMessage("some random text");
      expect(result.confidence).toBeLessThan(0.5);
    });

    it("has zero confidence for empty input", () => {
      const result = parseChatMessage("");
      expect(result.confidence).toBe(0);
    });

    it("increases confidence for amount", () => {
      const withAmount = parseChatMessage("Coffee 50k");
      const withoutAmount = parseChatMessage("Coffee");
      expect(withAmount.confidence).toBeGreaterThan(withoutAmount.confidence);
    });

    it("increases confidence for category", () => {
      const withCategory = parseChatMessage("Coffee 50k food");
      const withoutCategory = parseChatMessage("Coffee 50k");
      expect(withCategory.confidence).toBeGreaterThan(withoutCategory.confidence);
    });
  });

  describe("title parsing", () => {
    it("extracts title from merchant", () => {
      const result = parseChatMessage("Coffee 50k");
      expect(result.title).toBeDefined();
      expect(result.title).not.toBe("Expense");
    });

    it("defaults to 'Expense' when no merchant found", () => {
      const result = parseChatMessage("50k");
      expect(result.title).toBe("Expense");
    });

    it("uses merchant as title", () => {
      const result = parseChatMessage("Starbucks 50k");
      expect(result.title).toBeDefined();
    });
  });

  describe("edge cases", () => {
    it("handles whitespace correctly", () => {
      const result = parseChatMessage("   Coffee   50k   food   ");
      expect(result.amount).toBe(50000);
      expect(result.category).toBe("Food");
    });

    it("handles mixed case", () => {
      const result = parseChatMessage("COFFEE 50K FOOD");
      expect(result.amount).toBe(50000);
      expect(result.category).toBe("Food");
    });

    it("handles special characters in merchant", () => {
      const result = parseChatMessage("McDonald's 45k");
      expect(result.amount).toBe(45000);
    });

    it("ignores currency symbols", () => {
      const result = parseChatMessage("$50k food");
      expect(result.amount).toBe(50000);
    });

    it("handles very large amounts", () => {
      const result = parseChatMessage("1000k");
      expect(result.amount).toBe(1000000);
    });

    it("handles decimal k amounts", () => {
      const result = parseChatMessage("0.5k");
      expect(result.amount).toBe(500);
    });
  });
});

describe("parseChatInput", () => {
  it("parses multiple lines", () => {
    const input = "Coffee 50k food\nLunch 75k\nGrab 34.5k";
    const results = parseChatInput(input);
    expect(results.length).toBe(3);
  });

  it("filters empty lines", () => {
    const input = "Coffee 50k\n\n\nLunch 75k";
    const results = parseChatInput(input);
    expect(results.length).toBe(2);
  });

  it("handles single line input", () => {
    const input = "Coffee 50k food";
    const results = parseChatInput(input);
    expect(results.length).toBe(1);
    expect(results[0].amount).toBe(50000);
  });

  it("processes each line independently", () => {
    const input = "Coffee 50k\nGrab 34.5k";
    const results = parseChatInput(input);
    
    expect(results[0].amount).toBe(50000);
    expect(results[1].amount).toBe(34500);
  });

  it("handles empty input", () => {
    const results = parseChatInput("");
    expect(results.length).toBe(0);
  });

  it("handles whitespace-only input", () => {
    const results = parseChatInput("   \n\n   ");
    expect(results.length).toBe(0);
  });

  it("returns array of parsed messages", () => {
    const input = "Coffee 50k food\nLunch 75k";
    const results = parseChatInput(input);
    
    expect(Array.isArray(results)).toBe(true);
    results.forEach((result) => {
      expect(result).toHaveProperty("confidence");
      expect(result).toHaveProperty("title");
    });
  });

  it("preserves order of entries", () => {
    const input = "First 10k\nSecond 20k\nThird 30k";
    const results = parseChatInput(input);
    
    expect(results[0].amount).toBe(10000);
    expect(results[1].amount).toBe(20000);
    expect(results[2].amount).toBe(30000);
  });
});

describe("batch processing scenarios", () => {
  it("handles real-world chat format", () => {
    const input = "Starbucks 65k morning coffee\nGrab 34.5k to office\nLunch at Pret 85k";
    const results = parseChatInput(input);
    
    expect(results.length).toBe(3);
    expect(results[0].amount).toBe(65000);
    expect(results[1].amount).toBe(34500);
    expect(results[2].amount).toBe(85000);
  });

  it("handles varied formats in same batch", () => {
    const input = "Coffee 50k\nFood 75,000\nTransport 45K";
    const results = parseChatInput(input);
    
    expect(results.length).toBe(3);
    const amounts = results.map((r) => r.amount).filter(Boolean) as number[];
    expect(amounts).toEqual([50000, 75000, 45000]);
  });

  it("handles incomplete entries gracefully", () => {
    const input = "50k\nLunch without amount\nDinner 60k food";
    const results = parseChatInput(input);
    
    expect(results.length).toBe(3);
    // First entry has amount but no merchant
    expect(results[0].amount).toBe(50000);
    // Second has no amount
    expect(results[1].amount).toBeUndefined();
    // Third is complete
    expect(results[2].amount).toBe(60000);
    expect(results[2].category).toBe("Food");
  });
});
