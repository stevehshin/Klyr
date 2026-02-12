import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";

const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { contentForSummary, periodLabel = "today", openaiApiKey: clientApiKey } = body;

    if (!contentForSummary || typeof contentForSummary !== "string") {
      return NextResponse.json(
        { error: "contentForSummary is required" },
        { status: 400 }
      );
    }

    // Use client-provided key (from Settings) if present and non-empty, else server env
    const apiKey =
      typeof clientApiKey === "string" && clientApiKey.trim()
        ? clientApiKey.trim()
        : process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        {
          error:
            "AI summary needs an OpenAI API key. Add one in Settings (API keys) or set OPENAI_API_KEY on the server.",
        },
        { status: 503 }
      );
    }

    const systemPrompt = `You are a helpful assistant that summarizes workspace content. Given raw content from a grid (notes, messages, tasks, links), produce a clear, concise daily summary. Focus on what's new, notable, or actionable. Use bullet points. Keep it under 300 words. If the content is empty or very short, say so briefly.`;

    const userPrompt = `Summarize the following grid content for ${periodLabel}. Focus on recent activity and key updates.\n\n---\n${contentForSummary.slice(0, 30000)}\n---`;

    const res = await fetch(OPENAI_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        max_tokens: 500,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("OpenAI API error:", res.status, err);
      return NextResponse.json(
        { error: "Failed to generate summary" },
        { status: 502 }
      );
    }

    const data = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const summary =
      data.choices?.[0]?.message?.content?.trim() ?? "No summary generated.";

    return NextResponse.json({ summary });
  } catch (error) {
    console.error("Summary generation failed:", error);
    return NextResponse.json(
      { error: "Failed to generate summary" },
      { status: 500 }
    );
  }
}
