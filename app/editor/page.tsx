"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Link from "next/link";
import {
  ArrowLeft,
  Download,
  Search,
  Palette,
  Image as ImageIcon,
  Languages,
  Square,
  RectangleHorizontal,
  RectangleVertical,
} from "lucide-react";
import { useSearchParams } from "next/navigation";
import { TRANSLATIONS, type TranslationCode } from "@/lib/translations";

type StyleType = "minimal" | "gradient" | "paper" | "night";
type SizeType = "story" | "square" | "wide";
type BackgroundMode = "palette" | "photo";

type UnsplashPhoto = {
  id: string;
  description: string;
  photographer: string;
  link: string;
  thumb: string;
  full: string;
};

const SIZE_DIMENSIONS = {
  story: { width: 1080, height: 1920 },
  square: { width: 1080, height: 1080 },
  wide: { width: 1920, height: 1080 },
};

const STYLE_SHORTCUTS: Record<string, StyleType> = {
  "1": "minimal",
  "2": "gradient",
  "3": "paper",
  "4": "night",
};

const STYLE_SWATCHES: Record<StyleType, string> = {
  minimal: "bg-gradient-to-br from-[#E7E0D2] to-[#CFC6B7]",
  gradient: "bg-gradient-to-br from-[#0B5A34] to-[#1F8A57]",
  paper: "bg-[#F5E9DA]",
  night: "bg-[#0F1C16]",
};

const SIZE_ICONS: Record<SizeType, typeof Square> = {
  story: RectangleVertical,
  square: Square,
  wide: RectangleHorizontal,
};

const PREVIEW_BOUNDS: Record<
  SizeType,
  { maxWidth: number; maxHeight: number }
> = {
  story: { maxWidth: 320, maxHeight: 520 },
  square: { maxWidth: 360, maxHeight: 360 },
  wide: { maxWidth: 420, maxHeight: 260 },
};

export default function EditorPage() {
  const [verseText, setVerseText] = useState(
    "Be still, and know that I am God."
  );
  const [reference, setReference] = useState("Psalm 46:10");
  const [style, setStyle] = useState<StyleType>("minimal");
  const [size, setSize] = useState<SizeType>("square");
  const [backgroundMode, setBackgroundMode] =
    useState<BackgroundMode>("palette");
  const [selectedPhoto, setSelectedPhoto] = useState<UnsplashPhoto | null>(
    null
  );
  const [photoSearchTerm, setPhotoSearchTerm] = useState("");
  const [photoResults, setPhotoResults] = useState<UnsplashPhoto[]>([]);
  const [isPhotoSearching, setIsPhotoSearching] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [translation, setTranslation] = useState<TranslationCode>("kjv");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const searchParams = useSearchParams();
  const hasHandledInitialParams = useRef(false);

  // Generate the verse image
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { width, height } = SIZE_DIMENSIONS[size];
    canvas.width = width;
    canvas.height = height;

    const drawTextLayer = (textColor: string) => {
      ctx.fillStyle = textColor;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      const fontSize = size === "story" ? 72 : size === "wide" ? 64 : 68;
      ctx.font = `${fontSize}px "Playfair Display", serif`;

      const maxWidth = width * 0.8;
      const words = verseText.split(" ");
      const lines: string[] = [];
      let currentLine = "";

      words.forEach((word) => {
        const testLine = currentLine + word + " ";
        const metrics = ctx.measureText(testLine);
        if (metrics.width > maxWidth && currentLine !== "") {
          lines.push(currentLine.trim());
          currentLine = word + " ";
        } else {
          currentLine = testLine;
        }
      });
      lines.push(currentLine.trim());

      const lineHeight = fontSize * 1.5;
      const totalHeight = lines.length * lineHeight;
      const startY = (height - totalHeight) / 2;

      lines.forEach((line, index) => {
        ctx.fillText(line, width / 2, startY + (index + 0.5) * lineHeight);
      });

      if (reference) {
        const refFontSize = size === "story" ? 36 : size === "wide" ? 32 : 34;
        ctx.font = `${refFontSize}px "Inter", sans-serif`;
        ctx.fillStyle = textColor + "CC";
        ctx.fillText(reference, width / 2, startY + totalHeight + 80);
      }
    };

    const drawPaletteBackground = () => {
      if (style === "minimal") {
        ctx.fillStyle = "#F8F7F4";
        ctx.fillRect(0, 0, width, height);
      } else if (style === "gradient") {
        const gradient = ctx.createLinearGradient(0, 0, 0, height);
        gradient.addColorStop(0, "#1B4332");
        gradient.addColorStop(1, "#2D6A4F");
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
      } else if (style === "paper") {
        ctx.fillStyle = "#FFF9F0";
        ctx.fillRect(0, 0, width, height);
        ctx.fillStyle = "rgba(139, 115, 85, 0.03)";
        for (let i = 0; i < 1000; i++) {
          ctx.fillRect(Math.random() * width, Math.random() * height, 2, 2);
        }
      } else if (style === "night") {
        ctx.fillStyle = "#0F1C16";
        ctx.fillRect(0, 0, width, height);
      }

      const textColor =
        style === "minimal" || style === "paper" ? "#1B4332" : "#F8F7F4";
      drawTextLayer(textColor);
    };

    let isCancelled = false;

    if (backgroundMode === "photo" && selectedPhoto) {
      const separator = selectedPhoto.full.includes("?") ? "&" : "?";
      const photoUrl = `${selectedPhoto.full}${separator}auto=format&fit=crop&w=${width}&h=${height}`;
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = photoUrl;
      img.onload = () => {
        if (isCancelled) return;
        const scale = Math.max(width / img.width, height / img.height);
        const scaledWidth = img.width * scale;
        const scaledHeight = img.height * scale;
        const dx = (width - scaledWidth) / 2;
        const dy = (height - scaledHeight) / 2;
        ctx.drawImage(img, dx, dy, scaledWidth, scaledHeight);
        drawTextLayer("#FFFFFF");
      };
      img.onerror = () => {
        if (isCancelled) return;
        drawPaletteBackground();
      };

      return () => {
        isCancelled = true;
      };
    }

    drawPaletteBackground();

    return () => {
      isCancelled = true;
    };
  }, [verseText, reference, style, size, backgroundMode, selectedPhoto]);

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const link = document.createElement("a");
    link.download = `stillverse-${
      reference.replace(/\s+/g, "-").toLowerCase() || "verse"
    }.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  const handleVerseSearch = useCallback(
    async (
      query?: string,
      selectedTranslation: TranslationCode = translation
    ) => {
      const trimmedQuery = (query ?? searchQuery).trim();
      if (!trimmedQuery) {
        setSearchError("Enter a book and verse reference to search.");
        return;
      }

      setIsSearching(true);
      setSearchError(null);

      try {
        const translationConfig = TRANSLATIONS.find(
          (item) => item.code === selectedTranslation
        );

        if (!translationConfig) {
          throw new Error("Unknown translation selected.");
        }

        if (translationConfig.source === "esv-api") {
          const response = await fetch(
            `/api/esv?${new URLSearchParams({ reference: trimmedQuery })}`
          );

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(
              errorData.error ??
                "Unable to fetch ESV passage. Check the reference and try again."
            );
          }

          const data = await response.json();

          if (!data?.text) {
            throw new Error(
              "ESV passage text was not returned for that reference."
            );
          }

          setVerseText(data.text);
          setReference(
            `${data.reference ?? trimmedQuery} (${translationConfig.label})`
          );
          setSearchQuery(data.reference ?? trimmedQuery);
        } else {
          const response = await fetch(
            `https://bible-api.com/${encodeURIComponent(
              trimmedQuery
            )}?translation=${encodeURIComponent(selectedTranslation)}`
          );

          if (!response.ok) {
            throw new Error(
              "Unable to find that verse. Check the reference and try again."
            );
          }

          const data = await response.json();

          if (!data?.text) {
            throw new Error("Verse text not available for that reference.");
          }

          const normalizedReference = data.reference ?? trimmedQuery;
          const combinedText =
            Array.isArray(data.verses) && data.verses.length > 0
              ? data.verses
                  .map((v: { text: string }) => v.text.trim())
                  .join(" ")
                  .trim()
              : typeof data.text === "string"
              ? data.text.trim()
              : "";

          setVerseText(combinedText);
          setReference(`${normalizedReference} (${translationConfig.label})`);
          setSearchQuery(normalizedReference);
        }
      } catch (error) {
        console.error("Bible search error:", error);
        setSearchError(
          error instanceof Error
            ? error.message
            : "Something went wrong looking up that verse."
        );
      } finally {
        setIsSearching(false);
      }
    },
    [searchQuery, translation]
  );

  useEffect(() => {
    if (!searchParams || hasHandledInitialParams.current) {
      return;
    }

    const referenceParam = searchParams.get("reference");
    if (!referenceParam) {
      return;
    }

    const translationParam = searchParams.get("translation");
    const matchingTranslation = TRANSLATIONS.find(
      (item) => item.code === translationParam
    );
    const translationToUse = matchingTranslation
      ? (matchingTranslation.code as TranslationCode)
      : translation;

    if (matchingTranslation) {
      setTranslation(matchingTranslation.code as TranslationCode);
    }

    setSearchQuery(referenceParam);
    hasHandledInitialParams.current = true;
    handleVerseSearch(referenceParam, translationToUse);
  }, [handleVerseSearch, searchParams, translation]);

  const handlePhotoSearch = async () => {
    if (!photoSearchTerm.trim()) {
      setPhotoError("Enter a keyword to search Unsplash.");
      return;
    }

    setIsPhotoSearching(true);
    setPhotoError(null);

    try {
      const response = await fetch(
        `/api/unsplash/search?query=${encodeURIComponent(
          photoSearchTerm.trim()
        )}`
      );

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data?.error ?? "Unable to fetch photos right now.");
      }

      const data = await response.json();
      setPhotoResults(data.results ?? []);
      if ((data.results ?? []).length === 0) {
        setPhotoError("No photos found for that keyword. Try another search.");
      }
    } catch (error) {
      console.error("Unsplash search error:", error);
      setPhotoError(
        error instanceof Error
          ? error.message
          : "Something went wrong while searching Unsplash."
      );
    } finally {
      setIsPhotoSearching(false);
    }
  };

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        const input = document.getElementById("reference-search");
        input?.focus();
      }
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        handleDownload();
      }
      if ((event.metaKey || event.ctrlKey) && STYLE_SHORTCUTS[event.key]) {
        event.preventDefault();
        setStyle(STYLE_SHORTCUTS[event.key]);
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [handleDownload]);

  const backgroundControls = (
    <div className="space-y-6">
      <div className="space-y-2">
        <p className="text-sm font-medium text-slate-300">Background Source</p>
        <div className="flex gap-2">
          {(["palette", "photo"] as BackgroundMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => setBackgroundMode(mode)}
              className={`flex flex-1 items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition ${
                backgroundMode === mode
                  ? "border-white/80 bg-white/10 text-white"
                  : "border-white/10 text-slate-400 hover:border-white/20"
              }`}
            >
              {mode === "palette" ? (
                <Palette className="h-3.5 w-3.5" />
              ) : (
                <ImageIcon className="h-3.5 w-3.5" />
              )}
              {mode}
            </button>
          ))}
        </div>
      </div>

      {backgroundMode === "palette" ? (
        <div className="space-y-3">
          <p className="text-sm font-medium text-slate-300">Palette Styles</p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {(["minimal", "gradient", "paper", "night"] as StyleType[]).map(
              (s) => (
                <button
                  key={s}
                  onClick={() => setStyle(s)}
                  className={`group flex flex-col items-center gap-2 rounded-2xl border px-3 py-3 text-center transition ${
                    style === s
                      ? "border-white/80 bg-white/10 text-white"
                      : "border-white/10 text-slate-300 hover:border-white/20"
                  }`}
                >
                  <span
                    className={`h-10 w-10 rounded-2xl border border-white/10 shadow-inner ${STYLE_SWATCHES[s]}`}
                  />
                  <span className="text-xs font-medium text-slate-200">
                    {s}
                  </span>
                </button>
              )
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-[#0D0F12] px-3 py-2">
            <Input
              value={photoSearchTerm}
              onChange={(e) => setPhotoSearchTerm(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handlePhotoSearch();
                }
              }}
              placeholder="Unsplash keyword…"
              className="flex-1 border-0 bg-transparent text-sm text-white placeholder:text-slate-500 focus-visible:ring-0 focus-visible:border-0"
            />
            <Button
              type="button"
              onClick={handlePhotoSearch}
              disabled={isPhotoSearching}
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/10 text-white transition hover:bg-white/20 disabled:opacity-50"
            >
              <Search className="h-4 w-4" />
            </Button>
          </div>
          {photoError && (
            <div className="rounded-xl border border-red-900/40 bg-red-900/30 px-4 py-3 text-sm text-red-200">
              {photoError}
            </div>
          )}
          <div className="flex gap-3 overflow-x-auto pb-1 snap-x">
            {photoResults.map((photo) => (
              <button
                key={photo.id}
                onClick={() => {
                  setSelectedPhoto(photo);
                  setBackgroundMode("photo");
                }}
                className={`w-40 shrink-0 snap-start overflow-hidden rounded-2xl border transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 ${
                  selectedPhoto?.id === photo.id
                    ? "border-white/80"
                    : "border-white/10 hover:border-white/40"
                }`}
              >
                <img
                  src={photo.thumb}
                  alt={photo.description}
                  className="h-28 w-full object-cover"
                />
                <div className="px-3 py-2 text-left text-xs text-slate-200">
                  <p className="truncate">{photo.description}</p>
                  <p className="text-slate-500">by {photo.photographer}</p>
                </div>
              </button>
            ))}
          </div>
          {selectedPhoto && (
            <p className="text-xs text-slate-400">
              Photo by{" "}
              <a
                href={selectedPhoto.link}
                target="_blank"
                rel="noreferrer"
                className="underline"
              >
                {selectedPhoto.photographer}
              </a>{" "}
              on Unsplash
            </p>
          )}
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0D0F12] text-slate-100">
      <header className="border-b border-white/5 bg-[#0D0F12]/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-4 sm:px-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-slate-400 transition hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="text-xs font-semibold uppercase tracking-[0.35em]">
              MorningVine
            </span>
          </Link>
          <span className="ml-auto text-[10px] uppercase tracking-[0.35em] text-slate-500">
            ⌘K search · ⌘S download
          </span>
        </div>
      </header>

      <main className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
        <section className="rounded-2xl border border-white/5 bg-[#121418] p-4 sm:p-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="flex flex-1 items-center gap-2 rounded-xl border border-white/10 bg-[#0C0E12] px-3 py-2">
              <Input
                id="reference-search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleVerseSearch();
                  }
                }}
                placeholder="Search a verse or passage (e.g. John 15:5)"
                className="flex-1 border-0 bg-transparent text-base text-white placeholder:text-slate-500 focus-visible:ring-0 focus-visible:border-0"
              />
              <Button
                type="button"
                onClick={() => handleVerseSearch()}
                disabled={isSearching}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/10 text-white transition hover:bg-white/20 disabled:opacity-50"
                aria-label="Search verse"
              >
                <Search className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-[#0C0E12] px-3 py-2">
              <Languages className="h-4 w-4 text-slate-500" />
              <Select
                value={translation}
                onValueChange={(nextTranslation) => {
                  const typedTranslation = nextTranslation as TranslationCode;
                  setTranslation(typedTranslation);
                  const referenceWithoutTranslation =
                    searchQuery.trim() ||
                    reference.replace(/\s+\([^)]+\)\s*$/, "");
                  if (referenceWithoutTranslation) {
                    handleVerseSearch(
                      referenceWithoutTranslation,
                      typedTranslation
                    );
                  }
                }}
              >
                <SelectTrigger className="h-8 flex-1 border-0 bg-transparent p-0 text-sm text-white focus-visible:ring-0">
                  <SelectValue placeholder="Translation" />
                </SelectTrigger>
                <SelectContent className="border border-white/10 bg-[#0F1115] text-slate-100">
                  {TRANSLATIONS.map((option) => (
                    <SelectItem key={option.code} value={option.code}>
                      {option.label} · {option.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </section>

        {searchError && (
          <div className="rounded-2xl border border-red-900/40 bg-red-900/30 px-4 py-3 text-sm text-red-200">
            {searchError}
          </div>
        )}

        <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="space-y-6">
            <div className="rounded-2xl border border-white/5 bg-[#121418] p-5 space-y-6">
              <div className="space-y-2">
                <p className="text-sm font-medium text-slate-200">Verse text</p>
                <Textarea
                  id="verse"
                  value={verseText}
                  onChange={(e) => setVerseText(e.target.value)}
                  placeholder="Enter your verse..."
                  className="min-h-[160px] rounded-2xl border border-white/10 bg-transparent text-base text-white placeholder:text-slate-500 focus-visible:ring-white/20"
                />
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium text-slate-200">
                  Reference label
                </p>
                <Input
                  id="reference"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  placeholder="e.g. Psalm 46:10"
                  className="h-12 rounded-2xl border border-white/10 bg-transparent text-base text-white placeholder:text-slate-500 focus-visible:ring-white/20"
                />
              </div>

              <div className="space-y-3">
                <p className="text-sm font-medium text-slate-200">
                  Output size
                </p>
                <div className="flex flex-wrap gap-2">
                  {(["story", "square", "wide"] as SizeType[]).map((s) => {
                    const Icon = SIZE_ICONS[s];
                    return (
                      <button
                        key={s}
                        onClick={() => setSize(s)}
                        className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium transition ${
                          size === s
                            ? "border-white/80 bg-white/10 text-white"
                            : "border-white/10 text-slate-400 hover:border-white/20"
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                        {s}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-white/5 bg-[#121418] p-5 space-y-6">
              {backgroundControls}
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-2xl border border-white/5 bg-[#121418] p-5 space-y-4">
              <p className="text-sm font-medium text-slate-300">Preview</p>
              <div className="flex items-center justify-center rounded-2xl border border-white/10 bg-[#0C0E12] p-4">
                <canvas
                  ref={canvasRef}
                  className="h-auto w-full rounded-[18px] bg-white shadow-[0_35px_90px_rgba(0,0,0,0.55)]"
                  style={{
                    aspectRatio:
                      size === "story"
                        ? "9/16"
                        : size === "wide"
                        ? "16/9"
                        : "1/1",
                    maxWidth: PREVIEW_BOUNDS[size].maxWidth,
                    maxHeight: PREVIEW_BOUNDS[size].maxHeight,
                  }}
                />
              </div>
              <div className="flex items-center justify-between text-xs text-slate-400">
                <p>
                  {backgroundMode === "photo" && selectedPhoto
                    ? `Photo by ${selectedPhoto.photographer}`
                    : `Style: ${style}`}
                </p>
                <Button
                  onClick={handleDownload}
                  size="sm"
                  className="inline-flex h-9 items-center gap-2 rounded-lg border border-white/10 bg-white/10 px-3 text-xs font-semibold uppercase tracking-wide text-white hover:bg-white/20"
                >
                  <Download className="h-4 w-4" />
                  Export
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
