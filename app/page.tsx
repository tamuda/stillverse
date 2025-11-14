"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TRANSLATIONS, type TranslationCode } from "@/lib/translations";

export default function LandingPage() {
  const router = useRouter();
  const [reference, setReference] = useState("");
  const [translation, setTranslation] = useState<TranslationCode>("kjv");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedReference = reference.trim();

    if (!trimmedReference) {
      setError("Enter a book and verse reference to search.");
      return;
    }

    setError(null);
    setIsSubmitting(true);

    const params = new URLSearchParams({
      reference: trimmedReference,
      translation,
    });

    router.push(`/editor?${params.toString()}`);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#050505] text-white">
      <main className="flex-1 flex items-center justify-center px-6 py-24">
        <div className="w-full max-w-3xl space-y-10 text-center">
          <p className="text-xs uppercase tracking-[0.35em] text-white/50">
            MorningVine
          </p>
          <h1 className="font-serif text-4xl md:text-5xl text-balance">
            A single verse, distilled into quiet visuals.
          </h1>
          <p className="text-white/60 text-base md:text-lg max-w-2xl mx-auto">
            Type a reference, pick your translation, and jump straight into the
            editor with the verse ready to style.
          </p>

          <form
            onSubmit={handleSearch}
            className="space-y-4 rounded-3xl border border-white/10 bg-white/5 p-6 text-left shadow-2xl shadow-black/40"
          >
            <div className="flex flex-col gap-4 md:flex-row">
              <div className="flex-1 space-y-2">
                <label
                  htmlFor="landing-reference"
                  className="text-xs uppercase tracking-[0.3em] text-white/60"
                >
                  Search a verse
                </label>
                <Input
                  id="landing-reference"
                  placeholder="e.g. Psalm 23:1"
                  value={reference}
                  onChange={(event) => setReference(event.target.value)}
                  className="h-14 rounded-2xl border-white/10 bg-black/30 text-base placeholder:text-white/40 focus-visible:border-white focus-visible:ring-white"
                />
              </div>

              <div className="md:w-48 space-y-2">
                <label className="text-xs uppercase tracking-[0.3em] text-white/60">
                  Translation
                </label>
                <Select
                  value={translation}
                  onValueChange={(value) =>
                    setTranslation(value as TranslationCode)
                  }
                >
                  <SelectTrigger className="h-14 rounded-2xl border-white/10 bg-black/30 text-base">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#0d0d0d] text-white border border-white/10">
                    {TRANSLATIONS.map((option) => (
                      <SelectItem key={option.code} value={option.code}>
                        {option.label} · {option.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {error && (
              <p className="text-sm text-red-300" role="alert">
                {error}
              </p>
            )}

            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-white text-black hover:bg-white/90"
            >
              <Search className="h-4 w-4" />
              {isSubmitting ? "Searching…" : "Search verse"}
            </Button>
          </form>

          <div className="text-sm text-white/50">
            Press ⌘K anytime in the editor to search again.
          </div>
        </div>
      </main>

      <footer className="border-t border-white/10 py-6 text-center text-xs text-white/40">
        <div className="mx-auto flex max-w-4xl flex-col items-center justify-between gap-3 sm:flex-row">
          <p>© MorningVine {new Date().getFullYear()}</p>
          <div className="flex gap-6">
            <Link href="/about" className="hover:text-white transition-colors">
              About
            </Link>
            <Link
              href="/privacy"
              className="hover:text-white transition-colors"
            >
              Privacy
            </Link>
            <Link
              href="/contact"
              className="hover:text-white transition-colors"
            >
              Contact
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
