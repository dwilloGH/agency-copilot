'use client';

import { useState, type SubmitEvent } from "react";

type GenerateBriefResponse =
  | { success: true; markdown: string }
  | { success: false; error: string };

function normalizeWebsiteUrl(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return trimmed;

  const lower = trimmed.toLowerCase();
  if (lower.startsWith("http://") || lower.startsWith("https://")) {
    return trimmed;
  }

  return `https://${trimmed}`;
}

function getWebsiteError(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return "Company website is required";

  const invalidMessage =
    "Please enter a valid company website (e.g. bbc.com).";

  try {
    const url = new URL(normalizeWebsiteUrl(trimmed));
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return invalidMessage;
    }
    if (!url.hostname.includes(".")) {
      return invalidMessage;
    }
    return null;
  } catch {
    return invalidMessage;
  }
}

function getClientRequestError(value: string): string | null {
  if (!value.trim()) return "Please describe what the client wants";
  return null;
}

export default function Home() {
  const [companyWebsite, setCompanyWebsite] = useState("");
  const [clientRequest, setClientRequest] = useState("");
  const [additionalContext, setAdditionalContext] = useState("");
  const [websiteTouched, setWebsiteTouched] = useState(false);
  const [clientRequestTouched, setClientRequestTouched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [markdown, setMarkdown] = useState<string | null>(null);

  const websiteError = getWebsiteError(companyWebsite);
  const clientRequestError = getClientRequestError(clientRequest);
  const isFormValid = websiteError === null && clientRequestError === null;

  function handleWebsiteBlur() {
    setWebsiteTouched(true);
    if (companyWebsite.trim()) {
      setCompanyWebsite(normalizeWebsiteUrl(companyWebsite));
    }
  }

  async function handleSubmit(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    setWebsiteTouched(true);
    setClientRequestTouched(true);

    if (!isFormValid) return;

    setLoading(true);
    setError(null);
    setMarkdown(null);

    const payload = {
      companyWebsite: normalizeWebsiteUrl(companyWebsite),
      clientRequest: clientRequest.trim(),
      additionalContext: additionalContext.trim(),
    };

    try {
      const res = await fetch("/api/generate-brief", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data: GenerateBriefResponse = await res.json();

      if (!data.success) {
        setError(data.error ?? "Something went wrong. Please try again.");
        return;
      }

      setMarkdown(data.markdown);
    } catch {
      setError("Failed to connect to the server. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-black font-sans transition-colors py-12 px-4">
      <main className="w-full max-w-lg mx-auto p-8 sm:rounded-2xl bg-white/90 dark:bg-zinc-900 shadow-lg flex flex-col items-center">
        <h1 className="text-4xl md:text-5xl font-bold text-center tracking-tight text-black dark:text-white mb-5">
          Win more client work.
        </h1>
        <p className="text-lg md:text-xl text-zinc-600 dark:text-zinc-300 text-center mb-10 max-w-xl">
          Evaluate new opportunities, prepare better discovery meetings, and generate technical proposals with AI.
        </p>
        <form
          className="w-full flex flex-col gap-6"
          autoComplete="off"
          noValidate
          onSubmit={handleSubmit}
        >
          <div>
            <label
              htmlFor="companyWebsite"
              className="block mb-2 text-sm font-medium text-zinc-800 dark:text-zinc-200"
            >
              Company website
            </label>
            <input
              type="text"
              id="companyWebsite"
              name="companyWebsite"
              value={companyWebsite}
              onChange={(e) => setCompanyWebsite(e.target.value)}
              onBlur={handleWebsiteBlur}
              placeholder="example.com"
              disabled={loading}
              aria-invalid={websiteTouched && websiteError !== null}
              aria-describedby={
                websiteTouched && websiteError ? "companyWebsite-error" : undefined
              }
              className={`block w-full px-4 py-3 rounded-lg border bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-[2px] transition disabled:opacity-60 disabled:cursor-not-allowed ${
                websiteTouched && websiteError
                  ? "border-red-300 dark:border-red-800 focus:ring-red-500 dark:focus:ring-red-700"
                  : "border-zinc-200 dark:border-zinc-700 focus:ring-black dark:focus:ring-zinc-500"
              }`}
            />
            {websiteTouched && websiteError && (
              <p
                id="companyWebsite-error"
                className="mt-2 text-sm text-red-600 dark:text-red-400"
              >
                {websiteError}
              </p>
            )}
          </div>
          <div>
            <label
              htmlFor="clientRequest"
              className="block mb-2 text-sm font-medium text-zinc-800 dark:text-zinc-200"
            >
              What does the client want?
            </label>
            <textarea
              id="clientRequest"
              name="clientRequest"
              value={clientRequest}
              onChange={(e) => setClientRequest(e.target.value)}
              onBlur={() => setClientRequestTouched(true)}
              rows={4}
              placeholder="Describe the project, goals, or deliverables the client is asking for…"
              disabled={loading}
              aria-invalid={clientRequestTouched && clientRequestError !== null}
              aria-describedby={
                clientRequestTouched && clientRequestError
                  ? "clientRequest-error"
                  : undefined
              }
              className={`block w-full px-4 py-3 rounded-lg border bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 resize-none focus:outline-none focus:ring-[2px] transition disabled:opacity-60 disabled:cursor-not-allowed ${
                clientRequestTouched && clientRequestError
                  ? "border-red-300 dark:border-red-800 focus:ring-red-500 dark:focus:ring-red-700"
                  : "border-zinc-200 dark:border-zinc-700 focus:ring-black dark:focus:ring-zinc-500"
              }`}
            ></textarea>
            {clientRequestTouched && clientRequestError && (
              <p
                id="clientRequest-error"
                className="mt-2 text-sm text-red-600 dark:text-red-400"
              >
                {clientRequestError}
              </p>
            )}
          </div>
          <div>
            <label
              htmlFor="additionalContext"
              className="block mb-2 text-sm font-medium text-zinc-800 dark:text-zinc-200"
            >
              Additional notes
            </label>
            <textarea
              id="additionalContext"
              name="additionalContext"
              value={additionalContext}
              onChange={(e) => setAdditionalContext(e.target.value)}
              rows={4}
              placeholder="Budget, timeline, stakeholders, or anything else worth noting…"
              disabled={loading}
              className="block w-full px-4 py-3 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 resize-none focus:outline-none focus:ring-[2px] focus:ring-black dark:focus:ring-zinc-500 transition disabled:opacity-60 disabled:cursor-not-allowed"
            ></textarea>
          </div>
          <button
            type="submit"
            disabled={loading || !isFormValid}
            className="mt-4 w-full py-4 text-lg font-semibold rounded-xl bg-black text-white dark:bg-white dark:text-black shadow-md hover:scale-[1.02] active:scale-100 transition-all focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            {loading ? "Evaluating opportunity..." : "Generate Client Brief"}
          </button>
          {loading && (
            <div
              role="status"
              className="flex items-center justify-center gap-2 text-sm text-zinc-600 dark:text-zinc-400 animate-pulse"
            >
              <span
                className="inline-block h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-zinc-300 dark:border-zinc-600 border-t-zinc-800 dark:border-t-zinc-200"
                aria-hidden="true"
              />
              <span>Analysing the opportunity and generating your brief...</span>
            </div>
          )}
        </form>

        {error && (
          <div
            role="alert"
            className="w-full mt-6 px-4 py-3 rounded-lg border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-300 text-sm"
          >
            {error}
          </div>
        )}

        {markdown && (
          <div className="w-full mt-6 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 overflow-hidden">
            <div className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-700">
              <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
                Discovery Brief
              </p>
            </div>
            <div className="p-4 text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed whitespace-pre-wrap">
              {markdown}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
