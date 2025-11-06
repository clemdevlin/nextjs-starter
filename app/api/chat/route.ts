import { google } from "@ai-sdk/google";
import { streamText } from "ai";
import { getJson } from "serpapi";

interface OrganicResult {
  title: string;
  link: string;
  snippet: string;
}

export async function POST(req: Request) {
  const { messages } = await req.json();

  const result = streamText({
    model: google("gemini-2.5-flash"),
    messages,
    tools: {
      web_search_preview: {
        description: "Searches the web",
        parameters: {
          type: "object",
          properties: {
            q: { type: "string" },
          },
          required: ["q"],
        },
        execute: async ({ q }) => {
          try {
            const searchResults = await getJson({
              engine: "google",
              q: q,
              api_key: process.env.SERPAPI_API_KEY,
            });
            const results =
              searchResults.organic_results
                ?.slice(0, 5)
                .map((result: OrganicResult) => ({
                  title: result.title,
                  link: result.link,
                  snippet: result.snippet,
                })) || [];
            return { results };
          } catch (error) {
            console.error("Web search error:", error);
            return { results: [] };
          }
        },
      },
    },
  });

  return result.toDataStreamResponse();
}
