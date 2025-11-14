"use client";

import { useState, type FormEvent } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { type TranslationCode } from "@/lib/translations";

const DEFAULT_TRANSLATION: TranslationCode = "kjv";

export default function LandingPage() {
  const router = useRouter();
  const [reference, setReference] = useState("");
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
      translation: DEFAULT_TRANSLATION,
    });

    router.push(`/editor?${params.toString()}`);
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#fdfcf8] text-[#0b0b0f]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(236,233,222,0.8),transparent_55%)]" />
      <div className="relative flex min-h-screen flex-col">
        <header className="sticky top-0 z-10 border-b border-black/5 bg-white/70 backdrop-blur-xl">
          <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-6">
            <Link href="/" className="text-sm font-semibold tracking-tight">
              MorningVine
            </Link>
            <nav className="hidden" aria-hidden="true" />
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                className="hidden md:inline-flex text-black/70"
              >
                Log in
              </Button>
              <Button asChild className="bg-black text-white hover:bg-black/90">
                <Link href="/editor">Launch editor</Link>
              </Button>
            </div>
          </div>
        </header>

        <main className="flex-1">
          <section className="px-6 py-20 md:py-28">
            <div className="mx-auto max-w-4xl space-y-10 text-center">
              <div className="space-y-6">
                <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-5xl md:text-6xl">
                  Turn God’s Word into Daily Inspiration Content.
                </h1>
                <p className="mx-auto max-w-3xl text-base text-black/70 sm:text-lg">
                  Empowering faith creators to reach millions through engaging,
                  and nicely designed content. Starting with Bible verses.
                </p>
              </div>

              <form onSubmit={handleSearch} className="mx-auto max-w-3xl">
                <div className="relative">
                  <Input
                    id="landing-reference"
                    placeholder="Search a verse · Psalm 23:1"
                    value={reference}
                    onChange={(event) => setReference(event.target.value)}
                    className="h-16 w-full rounded-[32px] border border-black/10 bg-white/90 pl-8 pr-40 text-base placeholder:text-black/30 focus-visible:border-black/60 focus-visible:ring-0"
                  />
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="absolute right-1.5 top-1.5 flex h-[52px] min-w-[140px] items-center justify-center gap-2 rounded-[26px] bg-black px-5 text-base text-white hover:bg-black/90"
                  >
                    <Search className="h-4 w-4" />
                    {isSubmitting ? "Starting…" : "Start"}
                  </Button>
                </div>

                {error && (
                  <p className="mt-3 text-sm text-red-500" role="alert">
                    {error}
                  </p>
                )}
              </form>

              <div className="mx-auto mt-10 w-full max-w-2xl">
                <Image
                  src="/hero-image.png"
                  alt="MorningVine hero"
                  width={1920}
                  height={1080}
                  className="h-auto w-full"
                  priority
                />
              </div>
            </div>
          </section>
        </main>

        <footer className="border-t border-black/5 bg-white/80 py-6 text-center text-xs text-black/50">
          <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-3 px-6 sm:flex-row">
            <p>© MorningVine {new Date().getFullYear()}</p>
            <div className="flex gap-6">
              <Link href="/about" className="hover:text-black">
                About
              </Link>
              <Link href="/privacy" className="hover:text-black">
                Privacy
              </Link>
              <Link href="/contact" className="hover:text-black">
                Contact
              </Link>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
