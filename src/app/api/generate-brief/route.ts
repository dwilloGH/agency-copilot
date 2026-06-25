import Anthropic, { APIError } from "@anthropic-ai/sdk";
import { readFile } from "fs/promises";
import { join } from "path";
import { NextRequest, NextResponse } from "next/server";

type GenerateBriefRequest = {
  companyWebsite?: string;
  clientRequest?: string;
  additionalContext?: string;
};

type Recommendation = "pursue" | "pursue_with_caution" | "decline";

type DeliveryComplexity = "Low" | "Medium" | "High" | "Very High";

export type OpportunityEvaluation = {
  recommendation: Recommendation;
  recommendationLabel: string;
  confidence: number;
  estimatedProjectValue: string;
  deliveryComplexity: DeliveryComplexity;
  summary: string;
  whyWorthIt: string[];
  mainConcerns: string[];
  budgetTimelineCheck: string[];
  assumptionsToValidate: string[];
  discoveryQuestions: string[];
  recommendedNextSteps: string[];
};

const MODEL = "claude-sonnet-4-6";

const RECOMMENDATIONS = new Set<Recommendation>([
  "pursue",
  "pursue_with_caution",
  "decline",
]);

const DELIVERY_COMPLEXITIES = new Set<DeliveryComplexity>([
  "Low",
  "Medium",
  "High",
  "Very High",
]);

const ARRAY_FIELDS = [
  "whyWorthIt",
  "mainConcerns",
  "budgetTimelineCheck",
  "assumptionsToValidate",
  "discoveryQuestions",
  "recommendedNextSteps",
] as const;

const STRING_FIELDS = [
  "recommendationLabel",
  "estimatedProjectValue",
  "summary",
] as const;

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

function extractJsonText(text: string): string {
  const trimmed = text.trim();

  if (trimmed.startsWith("{")) {
    return trimmed;
  }

  const fenceStart = trimmed.indexOf("```");
  if (fenceStart !== -1) {
    const contentStart = trimmed.indexOf("\n", fenceStart);
    const fenceEnd = trimmed.lastIndexOf("```");
    if (contentStart !== -1 && fenceEnd > contentStart) {
      return trimmed.slice(contentStart + 1, fenceEnd).trim();
    }
  }

  const objectStart = trimmed.indexOf("{");
  const objectEnd = trimmed.lastIndexOf("}");
  if (objectStart !== -1 && objectEnd > objectStart) {
    return trimmed.slice(objectStart, objectEnd + 1);
  }

  return trimmed;
}

function isStringArray(value: unknown): value is string[] {
  return (
    Array.isArray(value) && value.every((item) => typeof item === "string")
  );
}

function validateEvaluation(value: unknown): OpportunityEvaluation | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const record = value as Record<string, unknown>;

  if (
    typeof record.recommendation !== "string" ||
    !RECOMMENDATIONS.has(record.recommendation as Recommendation)
  ) {
    return null;
  }

  if (typeof record.confidence !== "number" || Number.isNaN(record.confidence)) {
    return null;
  }

  if (
    typeof record.deliveryComplexity !== "string" ||
    !DELIVERY_COMPLEXITIES.has(record.deliveryComplexity as DeliveryComplexity)
  ) {
    return null;
  }

  for (const field of STRING_FIELDS) {
    if (typeof record[field] !== "string" || !record[field].trim()) {
      return null;
    }
  }

  for (const field of ARRAY_FIELDS) {
    if (!isStringArray(record[field])) {
      return null;
    }
  }

  const recommendationLabel = record.recommendationLabel as string;
  const estimatedProjectValue = record.estimatedProjectValue as string;
  const summary = record.summary as string;

  return {
    recommendation: record.recommendation as Recommendation,
    recommendationLabel: recommendationLabel.trim(),
    confidence: record.confidence as number,
    estimatedProjectValue: estimatedProjectValue.trim(),
    deliveryComplexity: record.deliveryComplexity as DeliveryComplexity,
    summary: summary.trim(),
    whyWorthIt: record.whyWorthIt as string[],
    mainConcerns: record.mainConcerns as string[],
    budgetTimelineCheck: record.budgetTimelineCheck as string[],
    assumptionsToValidate: record.assumptionsToValidate as string[],
    discoveryQuestions: record.discoveryQuestions as string[],
    recommendedNextSteps: record.recommendedNextSteps as string[],
  };
}

function parseEvaluation(text: string): OpportunityEvaluation | null {
  try {
    const parsed = JSON.parse(extractJsonText(text));
    return validateEvaluation(parsed);
  } catch {
    return null;
  }
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

    const responseText = message.content
      .filter((block) => block.type === "text")
      .map((block) => block.text)
      .join("\n")
      .trim();

    if (!responseText) {
      return NextResponse.json(
        { success: false, error: "Claude returned an empty response" },
        { status: 502 },
      );
    }

    const evaluation = parseEvaluation(responseText);
    if (!evaluation) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Claude returned an invalid evaluation format. Please try again.",
        },
        { status: 502 },
      );
    }

    return NextResponse.json({
      success: true,
      evaluation,
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
