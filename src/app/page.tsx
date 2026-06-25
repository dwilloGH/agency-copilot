'use client';

import Image from "next/image";
import { useState } from "react";

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-black font-sans transition-colors">
      <main className="w-full max-w-lg mx-auto p-8 sm:rounded-2xl bg-white/90 dark:bg-zinc-900 shadow-lg flex flex-col items-center">
        <h1 className="text-4xl md:text-5xl font-bold text-center tracking-tight text-black dark:text-white mb-5">
          Win more agency deals.
        </h1>
        <p className="text-lg md:text-xl text-zinc-600 dark:text-zinc-300 text-center mb-10 max-w-xl">
          Generate AI-powered discovery briefs, technical recommendations and proposal outlines in minutes.
        </p>
        <form
          className="w-full flex flex-col gap-6"
          autoComplete="off"
          onSubmit={e => e.preventDefault()}
        >
          <div>
            <label
              htmlFor="company-website"
              className="block mb-2 text-sm font-medium text-zinc-800 dark:text-zinc-200"
            >
              Company website
            </label>
            <input
              type="url"
              id="company-website"
              name="company-website"
              placeholder="https://example.com"
              className="block w-full px-4 py-3 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-[2px] focus:ring-black dark:focus:ring-zinc-500 transition"
              required
            />
          </div>
          <div>
            <label
              htmlFor="additional-context"
              className="block mb-2 text-sm font-medium text-zinc-800 dark:text-zinc-200"
            >
              Additional context
            </label>
            <textarea
              id="additional-context"
              name="additional-context"
              rows={5}
              placeholder="Describe goals, challenges, or anything relevant…"
              className="block w-full px-4 py-3 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 resize-none focus:outline-none focus:ring-[2px] focus:ring-black dark:focus:ring-zinc-500 transition"
            ></textarea>
          </div>
          <button
            type="submit"
            className="mt-4 w-full py-4 text-lg font-semibold rounded-xl bg-black text-white dark:bg-white dark:text-black shadow-md hover:scale-[1.02] active:scale-100 transition-all focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
          >
            Generate Brief
          </button>
        </form>
      </main>
    </div>
  );
}
