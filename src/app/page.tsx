'use client';

import { useEffect, useRef, useState, type SubmitEvent } from "react";

type Recommendation = "pursue" | "pursue_with_caution" | "decline";

type DeliveryComplexity = "Low" | "Medium" | "High" | "Very High";

type OpportunityEvaluation = {
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

type GenerateBriefResponse =
  | { success: true; evaluation: OpportunityEvaluation }
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

function getRecommendationStyles(recommendation: Recommendation) {
  switch (recommendation) {
    case "pursue":
      return "bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900";
    case "pursue_with_caution":
      return "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900";
    case "decline":
      return "bg-red-50 text-red-800 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-900";
  }
}

function getRecommendationEmoji(recommendation: Recommendation) {
  switch (recommendation) {
    case "pursue":
      return "🟢";
    case "pursue_with_caution":
      return "🟡";
    case "decline":
      return "🔴";
  }
}

function MetricCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 px-4 py-3">
      <p className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
        {value}
      </p>
    </div>
  );
}

function EvaluationSection({
  title,
  items,
  variant = "default",
}: {
  title: string;
  items: string[];
  variant?: "default" | "concerns" | "steps";
}) {
  if (items.length === 0) return null;

  const listClass =
    variant === "concerns"
      ? "text-red-700 dark:text-red-300"
      : variant === "steps"
        ? "text-zinc-900 dark:text-zinc-100"
        : "text-zinc-700 dark:text-zinc-300";

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900/50 p-5">
      <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-3">
        {title}
      </h3>
      <ul className={`space-y-2 text-sm leading-relaxed ${listClass}`}>
        {items.map((item, index) => (
          <li key={index} className="flex gap-2">
            <span className="text-zinc-400 dark:text-zinc-500 shrink-0">•</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function EvaluationDashboard({
  evaluation,
}: {
  evaluation: OpportunityEvaluation;
}) {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <span
          className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold ${getRecommendationStyles(evaluation.recommendation)}`}
        >
          <span aria-hidden="true">{getRecommendationEmoji(evaluation.recommendation)}</span>
          {evaluation.recommendationLabel}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <MetricCard label="Confidence" value={`${evaluation.confidence}%`} />
        <MetricCard
          label="Estimated value"
          value={evaluation.estimatedProjectValue}
        />
        <MetricCard
          label="Delivery complexity"
          value={evaluation.deliveryComplexity}
        />
      </div>

      <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 p-5">
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
          Summary
        </h3>
        <p className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
          {evaluation.summary}
        </p>
      </div>

      <div className="grid gap-4">
        <EvaluationSection
          title="Why this may be worth it"
          items={evaluation.whyWorthIt}
        />
        <EvaluationSection
          title="Main concerns"
          items={evaluation.mainConcerns}
          variant="concerns"
        />
        <EvaluationSection
          title="Budget & timeline check"
          items={evaluation.budgetTimelineCheck}
        />
        <EvaluationSection
          title="Assumptions to validate"
          items={evaluation.assumptionsToValidate}
        />
        <EvaluationSection
          title="Discovery questions"
          items={evaluation.discoveryQuestions}
        />
        <EvaluationSection
          title="Recommended next steps"
          items={evaluation.recommendedNextSteps}
          variant="steps"
        />
      </div>
    </div>
  );
}

export default function Home() {
  const [companyWebsite, setCompanyWebsite] = useState("");
  const [clientRequest, setClientRequest] = useState("");
  const [additionalContext, setAdditionalContext] = useState("");
  const [websiteTouched, setWebsiteTouched] = useState(false);
  const [clientRequestTouched, setClientRequestTouched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [evaluation, setEvaluation] = useState<OpportunityEvaluation | null>(
    null,
  );
  const resultsRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (evaluation && resultsRef.current) {
      resultsRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [evaluation]);

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
    setEvaluation(null);

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

      setEvaluation(data.evaluation);
    } catch {
      setError("Failed to connect to the server. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-black font-sans transition-colors py-12 px-4">
      <div className="w-full max-w-2xl mx-auto flex flex-col gap-10">
        <main className="w-full p-8 sm:rounded-2xl bg-white/90 dark:bg-zinc-900 shadow-lg flex flex-col items-center">
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
              {loading ? "Evaluating Opportunity..." : "Evaluate Opportunity"}
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
                <span>Analysing the opportunity...</span>
              </div>
            )}
          </form>
        </main>

        {error && (
          <div
            role="alert"
            className="w-full px-4 py-3 rounded-lg border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-300 text-sm"
          >
            {error}
          </div>
        )}

        {evaluation && (
          <section
            ref={resultsRef}
            className="w-full scroll-mt-8 p-8 sm:rounded-2xl bg-white/90 dark:bg-zinc-900 shadow-lg border border-zinc-200 dark:border-zinc-800"
          >
            <div className="pb-4 mb-6 border-b border-zinc-200 dark:border-zinc-700">
              <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
                Opportunity Evaluation
              </p>
            </div>
            <EvaluationDashboard evaluation={evaluation} />
          </section>
        )}
      </div>
    </div>
  );
}
