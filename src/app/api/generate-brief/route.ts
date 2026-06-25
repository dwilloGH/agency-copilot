import Anthropic, { APIError } from "@anthropic-ai/sdk";
import { readFile } from "fs/promises";
import { join } from "path";
import { NextRequest, NextResponse } from "next/server";

type GenerateBriefRequest = {
  companyWebsite?: string;
  clientRequest?: string;
  additionalContext?: string;
};

const MODEL = "claude-sonnet-4-6";

let cachedSystemPrompt: string | null = null;

async function getSystemPrompt(): Promise<string> {
  if (!cachedSystemPrompt) {
    cachedSystemPrompt = await readFile(
      join(process.cwd(), "prompts/opportunity-evaluator.md"),
      "utf-8",
    );
  }
  return cachedSystemPrompt;
}

function buildUserMessage(parsed: {
  companyWebsite: string;
  clientRequest: string;
  additionalContext: string;
}): string {
  let message = `Company website: ${parsed.companyWebsite}

What the client has requested:
${parsed.clientRequest}`;

  if (parsed.additionalContext) {
    message += `

Additional context:
${parsed.additionalContext}`;
  }

  return message;
}

export async function POST(request: NextRequest) {
  let body: GenerateBriefRequest;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid JSON in request body" },
      { status: 400 },
    );
  }

  const { companyWebsite, clientRequest, additionalContext } = body;

  if (!companyWebsite?.trim()) {
    return NextResponse.json(
      { success: false, error: "companyWebsite is required" },
      { status: 400 },
    );
  }

  if (!clientRequest?.trim()) {
    return NextResponse.json(
      { success: false, error: "clientRequest is required" },
      { status: 400 },
    );
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { success: false, error: "Anthropic API key is not configured" },
      { status: 500 },
    );
  }

  const parsed = {
    companyWebsite: companyWebsite.trim(),
    clientRequest: clientRequest.trim(),
    additionalContext: additionalContext?.trim() ?? "",
  };

  try {
    const anthropic = new Anthropic({ apiKey });
    const systemPrompt = await getSystemPrompt();

    const message = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 4096,
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: buildUserMessage(parsed),
        },
      ],
    });

    const markdown = message.content
      .filter((block) => block.type === "text")
      .map((block) => block.text)
      .join("\n")
      .trim();

    if (!markdown) {
      return NextResponse.json(
        { success: false, error: "Claude returned an empty response" },
        { status: 502 },
      );
    }

    return NextResponse.json({
      success: true,
      markdown,
    });
  } catch (err) {
    if (err instanceof APIError) {
      console.error("Anthropic API error:", err.status, err.message);

      if (err.status === 401) {
        return NextResponse.json(
          { success: false, error: "Invalid Anthropic API key" },
          { status: 502 },
        );
      }

      if (err.status === 429) {
        return NextResponse.json(
          { success: false, error: "Rate limit exceeded. Please try again later." },
          { status: 429 },
        );
      }

      return NextResponse.json(
        { success: false, error: "Failed to generate brief. Please try again." },
        { status: err.status ?? 502 },
      );
    }

    console.error("Generate brief error:", err);
    return NextResponse.json(
      { success: false, error: "Failed to generate brief. Please try again." },
      { status: 500 },
    );
  }
}
