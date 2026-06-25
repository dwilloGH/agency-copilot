import { NextRequest, NextResponse } from "next/server";

type GenerateBriefRequest = {
  companyWebsite?: string;
  clientRequest?: string;
  additionalContext?: string;
};

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

  const parsed = {
    companyWebsite: companyWebsite.trim(),
    clientRequest: clientRequest.trim(),
    additionalContext: additionalContext?.trim() ?? "",
  };

  console.log("Generate brief request:", parsed);

  return NextResponse.json({
    success: true,
    data: parsed,
  });
}
