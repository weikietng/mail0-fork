// The brain.ts file in /actions should replace this file once ready.
'use server';

import { generateEmailContent } from "@/lib/ai";
import { JSONContent } from "novel";

interface UserContext {
  name?: string;
  email?: string;
}

interface AIEmailResponse {
  content: string;
  jsonContent: JSONContent;
  type: 'email' | 'question' | 'system';
}

export async function generateAIEmailContent({
  prompt,
  currentContent,
  to,
  isEdit = false,
  conversationId,
  userContext,
}: {
  prompt: string;
  currentContent?: string;
  to?: string[];
  isEdit?: boolean;
  conversationId?: string;
  userContext?: UserContext;
}): Promise<AIEmailResponse> {
  try {
    const responses = await generateEmailContent(prompt, currentContent, to, conversationId, userContext);
    
    const questionResponse = responses.find(r => r.type === 'question');
    if (questionResponse) {
      return {
        content: questionResponse.content,
        jsonContent: createJsonContent([questionResponse.content]),
        type: 'question'
      };
    }
    
    const emailResponses = responses.filter(r => r.type === 'email');
    let cleanedContent = emailResponses.map(r => r.content).join("\n\n").trim();
    
    const paragraphs = cleanedContent.split(/\n\s*\n/).map(p => p.trim()).filter(Boolean);
    
    const jsonContent = createJsonContent(paragraphs);
    
    return {
      content: cleanedContent,
      jsonContent,
      type: 'email'
    };
  } catch (error) {
    console.error("Error generating AI email content:", error);
    
    return {
      content: "Sorry, I encountered an error while generating content. Please try again with a different prompt.",
      jsonContent: createJsonContent(["Sorry, I encountered an error while generating content. Please try again with a different prompt."]),
      type: 'system'
    };
  }
}

function createJsonContent(paragraphs: string[]): JSONContent {
  if (paragraphs.length === 0) {
    paragraphs = ["Failed to generate content. Please try again with a different prompt."];
  }
  
  return {
    type: "doc",
    content: paragraphs.map(paragraph => ({
      type: "paragraph",
      content: [{ type: "text", text: paragraph }]
    }))
  };
} 