"use client";

import { useState, useRef, useEffect, useCallback, Suspense } from "react";
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
  Sun,
  Moon,
  ChevronLeft,
  ChevronRight,
  Pencil,
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

const UNSPLASH_VISIBLE_COUNT = 3;
const UNSPLASH_CARD_WIDTH = 160;
const UNSPLASH_CARD_GAP = 12;
const UNSPLASH_VIEWPORT_WIDTH =
  UNSPLASH_VISIBLE_COUNT * UNSPLASH_CARD_WIDTH +
  (UNSPLASH_VISIBLE_COUNT - 1) * UNSPLASH_CARD_GAP;
const MOBILE_UNSPLASH_PAGE_SIZE = 4;

type PhotoAppearance = {
  photoOpacity: number;
  overlayColor: string;
  overlayOpacity: number;
  textColor: string;
};

const DEFAULT_PHOTO_APPEARANCE: PhotoAppearance = {
  photoOpacity: 1,
  overlayColor: "#000000",
  overlayOpacity: 0.35,
  textColor: "#FFFFFF",
};

const hexToRgba = (hex: string, alpha: number) => {
  const sanitized = hex.replace("#", "");
  const isShort = sanitized.length === 3;
  const fullHex = isShort
    ? sanitized
        .split("")
        .map((char) => char + char)
        .join("")
    : sanitized.padEnd(6, "0").slice(0, 6);
  const r = parseInt(fullHex.slice(0, 2), 16);
  const g = parseInt(fullHex.slice(2, 4), 16);
  const b = parseInt(fullHex.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

type PaletteSetting = {
  background: string;
  backgroundAlt?: string;
  text: string;
};

const DEFAULT_PALETTE_SETTINGS: Record<StyleType, PaletteSetting> = {
  minimal: {
    background: "#F8F7F4",
    text: "#1B4332",
  },
  gradient: {
    background: "#1B4332",
    backgroundAlt: "#2D6A4F",
    text: "#F8F7F4",
  },
  paper: {
    background: "#FFF9F0",
    text: "#1B4332",
  },
  night: {
    background: "#0F1C16",
    text: "#F8F7F4",
  },
};

function EditorPageContent() {
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
  const [photoPage, setPhotoPage] = useState(0);
  const [photoAppearance, setPhotoAppearance] = useState<PhotoAppearance>(
    DEFAULT_PHOTO_APPEARANCE
  );
  const [isPhotoAppearanceOpen, setIsPhotoAppearanceOpen] = useState(false);
  const [canScrollUnsplashLeft, setCanScrollUnsplashLeft] = useState(false);
  const [canScrollUnsplashRight, setCanScrollUnsplashRight] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [translation, setTranslation] = useState<TranslationCode>("kjv");
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [paletteSettings, setPaletteSettings] = useState<
    Record<StyleType, PaletteSetting>
  >(
    () =>
      Object.fromEntries(
        (
          Object.entries(DEFAULT_PALETTE_SETTINGS) as [
            StyleType,
            PaletteSetting
          ][]
        ).map(([key, value]) => [key, { ...value }])
      ) as Record<StyleType, PaletteSetting>
  );
  const [customizingStyle, setCustomizingStyle] = useState<StyleType | null>(
    null
  );
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const photoCarouselRef = useRef<HTMLDivElement | null>(null);
  const searchParams = useSearchParams();
  const hasHandledInitialParams = useRef(false);

  const editingPalette =
    customizingStyle != null ? paletteSettings[customizingStyle] : null;
  const palettePreviewStyle =
    customizingStyle && editingPalette
      ? {
          background:
            customizingStyle === "gradient"
              ? `linear-gradient(135deg, ${editingPalette.background}, ${
                  editingPalette.backgroundAlt ?? editingPalette.background
                })`
              : editingPalette.background,
          color: editingPalette.text,
        }
      : undefined;
  const toggleTheme = () => setIsDarkMode((prev) => !prev);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem("mv-theme");
    if (stored === "light" || stored === "dark") {
      setIsDarkMode(stored === "dark");
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem("mv-theme", isDarkMode ? "dark" : "light");
  }, [isDarkMode]);

  const theme = {
    body: isDarkMode
      ? "bg-[#0D0F12] text-slate-100"
      : "bg-[#F7F6F3] text-slate-900",
    header: isDarkMode
      ? "border-white/5 bg-[#0D0F12]/90"
      : "border-slate-200 bg-white/80",
    surface: isDarkMode
      ? "border border-white/5 bg-[#121418]"
      : "border border-slate-200 bg-white",
    shell: isDarkMode
      ? "border border-white/10 bg-[#0C0E12]"
      : "border border-slate-200 bg-white",
    accentButton: isDarkMode
      ? "border border-white/10 bg-white/10 text-white hover:bg-white/20"
      : "border border-slate-200 bg-slate-100 text-slate-900 hover:bg-white",
    mutedText: isDarkMode ? "text-slate-400" : "text-slate-500",
    labelText: isDarkMode ? "text-slate-200" : "text-slate-700",
    inputBackground: isDarkMode ? "bg-transparent" : "bg-white",
  };

  const updateUnsplashScrollState = useCallback(() => {
    const container = photoCarouselRef.current;
    if (!container) {
      setCanScrollUnsplashLeft(false);
      setCanScrollUnsplashRight(false);
      return;
    }

    const maxScrollLeft = container.scrollWidth - container.clientWidth - 8;
    setCanScrollUnsplashLeft(container.scrollLeft > 8);
    setCanScrollUnsplashRight(container.scrollLeft < maxScrollLeft);
  }, []);

  const scrollUnsplashCarousel = (direction: "prev" | "next") => {
    const container = photoCarouselRef.current;
    if (!container) return;

    const scrollAmount = container.clientWidth || UNSPLASH_VIEWPORT_WIDTH;
    container.scrollBy({
      left: direction === "next" ? scrollAmount : -scrollAmount,
      behavior: "smooth",
    });
  };

  const renderPhotoOption = (
    photo: UnsplashPhoto,
    variant: "grid" | "carousel"
  ) => (
    <button
      key={`${variant}-${photo.id}`}
      onClick={() => {
        setSelectedPhoto(photo);
        setBackgroundMode("photo");
      }}
      className={`overflow-hidden rounded-2xl border text-left transition focus-visible:outline-none focus-visible:ring-2 ${
        variant === "carousel" ? "w-40 shrink-0 snap-start" : "w-full"
      } ${
        selectedPhoto?.id === photo.id
          ? isDarkMode
            ? "border-white/80 focus-visible:ring-white/40"
            : "border-slate-900 focus-visible:ring-slate-900/40"
          : isDarkMode
          ? "border-white/10 hover:border-white/40 focus-visible:ring-white/40"
          : "border-slate-200 hover:border-slate-400 focus-visible:ring-slate-300"
      }`}
    >
      <img
        src={photo.thumb}
        alt={photo.description}
        className={`w-full object-cover ${
          variant === "carousel" ? "h-28" : "h-32"
        }`}
      />
      <div
        className={`px-3 py-2 text-xs ${
          isDarkMode ? "text-slate-200" : "text-slate-600"
        }`}
      >
        <p className="truncate">{photo.description}</p>
        <p className={isDarkMode ? "text-slate-500" : "text-slate-400"}>
          by {photo.photographer}
        </p>
      </div>
    </button>
  );

  useEffect(() => {
    const container = photoCarouselRef.current;
    if (!container) return;

    const handleScroll = () => updateUnsplashScrollState();
    handleScroll();
    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, [updateUnsplashScrollState]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleResize = () => updateUnsplashScrollState();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [updateUnsplashScrollState]);

  useEffect(() => {
    const container = photoCarouselRef.current;
    if (!container) return;
    container.scrollTo({ left: 0 });
    updateUnsplashScrollState();
    setPhotoPage(0);
  }, [photoResults, updateUnsplashScrollState]);

  useEffect(() => {
    const totalPages = Math.max(
      1,
      Math.ceil(photoResults.length / MOBILE_UNSPLASH_PAGE_SIZE)
    );
    if (photoPage > totalPages - 1) {
      setPhotoPage(totalPages - 1);
    }
  }, [photoResults.length, photoPage]);

  const updatePaletteSetting = (
    targetStyle: StyleType,
    key: keyof PaletteSetting,
    value: string
  ) => {
    setPaletteSettings((prev) => ({
      ...prev,
      [targetStyle]: {
        ...prev[targetStyle],
        [key]: value,
      },
    }));
  };

  const resetPaletteSetting = (targetStyle: StyleType) => {
    setPaletteSettings((prev) => ({
      ...prev,
      [targetStyle]: { ...DEFAULT_PALETTE_SETTINGS[targetStyle] },
    }));
  };

  const updatePhotoAppearanceSetting = <K extends keyof PhotoAppearance>(
    key: K,
    value: PhotoAppearance[K]
  ) => {
    setPhotoAppearance((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const resetPhotoAppearance = () => {
    setPhotoAppearance(DEFAULT_PHOTO_APPEARANCE);
  };

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
      const palette = paletteSettings[style];
      if (!palette) return;

      if (style === "gradient") {
        const gradient = ctx.createLinearGradient(0, 0, 0, height);
        gradient.addColorStop(0, palette.background);
        gradient.addColorStop(1, palette.backgroundAlt ?? palette.background);
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
      } else {
        ctx.fillStyle = palette.background;
        ctx.fillRect(0, 0, width, height);
        if (style === "paper") {
          ctx.fillStyle = "rgba(139, 115, 85, 0.03)";
          for (let i = 0; i < 1000; i++) {
            ctx.fillRect(Math.random() * width, Math.random() * height, 2, 2);
          }
        }
      }

      drawTextLayer(palette.text);
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
        ctx.save();
        ctx.globalAlpha = photoAppearance.photoOpacity;
        ctx.drawImage(img, dx, dy, scaledWidth, scaledHeight);
        ctx.restore();

        if (photoAppearance.overlayOpacity > 0) {
          ctx.fillStyle = hexToRgba(
            photoAppearance.overlayColor,
            photoAppearance.overlayOpacity
          );
          ctx.fillRect(0, 0, width, height);
        }

        drawTextLayer(photoAppearance.textColor);
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
  }, [
    verseText,
    reference,
    style,
    size,
    backgroundMode,
    selectedPhoto,
    paletteSettings,
    photoAppearance,
  ]);

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

  const closePaletteModal = () => setCustomizingStyle(null);

  const mobilePhotoPageCount =
    photoResults.length === 0
      ? 0
      : Math.ceil(photoResults.length / MOBILE_UNSPLASH_PAGE_SIZE);
  const mobilePhotoPageItems =
    mobilePhotoPageCount === 0
      ? []
      : photoResults.slice(
          photoPage * MOBILE_UNSPLASH_PAGE_SIZE,
          photoPage * MOBILE_UNSPLASH_PAGE_SIZE + MOBILE_UNSPLASH_PAGE_SIZE
        );

  const backgroundControls = (
    <div className="space-y-6">
      <div className="space-y-2">
        <p className={`text-sm font-medium ${theme.labelText}`}>Background</p>
        <div className="flex gap-2">
          {(["palette", "photo"] as BackgroundMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => setBackgroundMode(mode)}
              className={`flex flex-1 items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition ${
                backgroundMode === mode
                  ? isDarkMode
                    ? "border-white/80 bg-white/10 text-white"
                    : "border-slate-900 bg-slate-900/5 text-slate-900"
                  : isDarkMode
                  ? "border-white/10 text-slate-400 hover:border-white/20"
                  : "border-slate-200 text-slate-600 hover:border-slate-400"
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
        <div
          className="space-y-3 w-full mx-auto"
          style={{ maxWidth: `${UNSPLASH_VIEWPORT_WIDTH}px` }}
        >
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {(["minimal", "gradient", "paper", "night"] as StyleType[]).map(
              (s) => (
                <button
                  key={s}
                  onClick={() => setStyle(s)}
                  onDoubleClick={() => setCustomizingStyle(s)}
                  className={`group relative flex flex-col items-center gap-2 rounded-2xl border px-3 py-3 text-center transition ${
                    style === s
                      ? isDarkMode
                        ? "border-white/80 bg-white/10 text-white"
                        : "border-slate-900 bg-slate-900/5 text-slate-900"
                      : isDarkMode
                      ? "border-white/10 text-slate-300 hover:border-white/20"
                      : "border-slate-200 text-slate-600 hover:border-slate-400"
                  }`}
                >
                  <span
                    className={`h-10 w-10 rounded-2xl border shadow-inner ${
                      isDarkMode ? "border-white/10" : "border-slate-200"
                    }`}
                    style={{
                      background:
                        s === "gradient"
                          ? `linear-gradient(135deg, ${
                              paletteSettings[s].background
                            }, ${
                              paletteSettings[s].backgroundAlt ??
                              paletteSettings[s].background
                            })`
                          : paletteSettings[s].background,
                    }}
                  />
                  <span
                    className={`text-xs font-medium ${
                      isDarkMode ? "text-slate-200" : "text-slate-700"
                    }`}
                  >
                    {style === s ? "Edit colors" : s}
                  </span>
                </button>
              )
            )}
          </div>
          <Button
            type="button"
            onClick={() => setCustomizingStyle(style)}
            className={`w-full justify-center rounded-xl border px-3 py-2 text-sm font-medium ${
              isDarkMode
                ? "border-white/10 bg-transparent text-white hover:bg-white/10"
                : "border-slate-200 bg-transparent text-slate-900 hover:bg-slate-100"
            }`}
          >
            Edit colors
          </Button>
        </div>
      ) : (
        <div className="space-y-4 w-full">
          <div
            className={`flex w-full items-center gap-2 rounded-2xl px-3 py-2 ${theme.shell}`}
          >
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
              className={`flex-1 border-0 bg-transparent text-sm focus-visible:ring-0 focus-visible:border-0 shadow-none ${
                isDarkMode
                  ? "text-white placeholder:text-slate-500"
                  : "text-slate-900 placeholder:text-slate-400"
              }`}
            />
            <Button
              type="button"
              onClick={handlePhotoSearch}
              disabled={isPhotoSearching}
              className={`inline-flex h-9 w-9 items-center justify-center rounded-xl transition disabled:opacity-50 ${theme.accentButton}`}
            >
              <Search className="h-4 w-4" />
            </Button>
          </div>
          {photoError && (
            <div
              className={`w-full rounded-xl border px-4 py-3 text-sm ${
                isDarkMode
                  ? "border-red-900/40 bg-red-900/30 text-red-200"
                  : "border-red-200 bg-red-50 text-red-700"
              }`}
            >
              {photoError}
            </div>
          )}
          <div className="w-full space-y-3">
            {photoResults.length === 0 ? (
              <div
                className={`rounded-2xl border px-4 py-6 text-center text-sm ${
                  isDarkMode
                    ? "border-white/5 bg-white/5 text-slate-300"
                    : "border-slate-200 bg-slate-50 text-slate-600"
                }`}
              >
                Search Unsplash to load photos, then tap one to set it as your
                background.
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-3 sm:hidden">
                  {mobilePhotoPageItems.map((photo) =>
                    renderPhotoOption(photo, "grid")
                  )}
                </div>
                {mobilePhotoPageCount > 1 && (
                  <div className="flex items-center justify-between text-xs sm:hidden">
                    <button
                      type="button"
                      onClick={() =>
                        setPhotoPage((prev) => Math.max(0, prev - 1))
                      }
                      disabled={photoPage === 0}
                      className={`rounded-full border px-3 py-1 font-medium ${
                        isDarkMode
                          ? "border-white/10 text-white hover:bg-white/10"
                          : "border-slate-200 text-slate-900 hover:bg-slate-100"
                      } disabled:opacity-40`}
                    >
                      Previous
                    </button>
                    <span className={`font-medium ${theme.mutedText}`}>
                      Page {photoPage + 1} of {mobilePhotoPageCount}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setPhotoPage((prev) =>
                          Math.min(mobilePhotoPageCount - 1, prev + 1)
                        )
                      }
                      disabled={photoPage >= mobilePhotoPageCount - 1}
                      className={`rounded-full border px-3 py-1 font-medium ${
                        isDarkMode
                          ? "border-white/10 text-white hover:bg-white/10"
                          : "border-slate-200 text-slate-900 hover:bg-slate-100"
                      } disabled:opacity-40`}
                    >
                      Next
                    </button>
                  </div>
                )}
                <div className="hidden sm:block">
                  <div className="relative mx-auto w-full sm:max-w-[504px]">
                    <div
                      ref={photoCarouselRef}
                      className="flex w-full gap-3 overflow-x-auto pb-2 snap-x snap-mandatory scroll-smooth"
                    >
                      {photoResults.map((photo) =>
                        renderPhotoOption(photo, "carousel")
                      )}
                    </div>
                    {photoResults.length > UNSPLASH_VISIBLE_COUNT && (
                      <>
                        <button
                          type="button"
                          aria-label="View previous Unsplash photos"
                          onClick={() => scrollUnsplashCarousel("prev")}
                          disabled={!canScrollUnsplashLeft}
                          className={`absolute left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border p-1.5 shadow-lg transition ${
                            isDarkMode
                              ? "border-white/10 bg-[#0C0E12]/90 text-white hover:bg-white/10"
                              : "border-slate-200 bg-white text-slate-900 hover:bg-slate-50"
                          } disabled:pointer-events-none disabled:opacity-40`}
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          aria-label="View more Unsplash photos"
                          onClick={() => scrollUnsplashCarousel("next")}
                          disabled={!canScrollUnsplashRight}
                          className={`absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 rounded-full border p-1.5 shadow-lg transition ${
                            isDarkMode
                              ? "border-white/10 bg-[#0C0E12]/90 text-white hover:bg-white/10"
                              : "border-slate-200 bg-white text-slate-900 hover:bg-slate-50"
                          } disabled:pointer-events-none disabled:opacity-40`}
                        >
                          <ChevronRight className="h-4 w-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
          {selectedPhoto && (
            <div className="space-y-2">
              <p className={`text-xs ${theme.mutedText}`}>
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
              <Button
                type="button"
                onClick={() => setIsPhotoAppearanceOpen(true)}
                className={`w-full justify-center rounded-xl border px-3 py-2 text-sm font-medium ${
                  isDarkMode
                    ? "border-white/10 bg-transparent text-white hover:bg-white/10"
                    : "border-slate-200 bg-transparent text-slate-900 hover:bg-slate-100"
                }`}
              >
                Adjust photo styling
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );

  return (
    <div className={`min-h-screen ${theme.body}`}>
      <header className={`border-b backdrop-blur ${theme.header}`}>
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-4 sm:px-6">
          <Link
            href="/"
            className={`inline-flex items-center gap-2 transition ${
              isDarkMode
                ? "text-slate-400 hover:text-white"
                : "text-slate-500 hover:text-slate-900"
            }`}
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="text-sm font-semibold">MorningVine</span>
          </Link>
          <div className="ml-auto flex items-center gap-3">
            <span className={`text-xs ${theme.mutedText}`}>
              ⌘K search · ⌘S download
            </span>
            <button
              type="button"
              onClick={toggleTheme}
              aria-label="Toggle theme"
              className={`rounded-full p-2 transition ${theme.accentButton}`}
            >
              {isDarkMode ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
        <section className={`rounded-2xl p-4 sm:p-5 ${theme.surface}`}>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div
              className={`flex flex-1 items-center gap-2 rounded-xl px-3 py-2 ${theme.shell}`}
            >
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
                className={`flex-1 border-0 text-base placeholder:text-slate-500 focus-visible:ring-0 focus-visible:border-0 shadow-none ${
                  theme.inputBackground
                } ${isDarkMode ? "text-white" : "text-slate-900"}`}
              />
              <Button
                type="button"
                onClick={() => handleVerseSearch()}
                disabled={isSearching}
                className={`inline-flex h-9 w-9 items-center justify-center rounded-lg transition disabled:opacity-50 ${theme.accentButton}`}
                aria-label="Search verse"
              >
                <Search className="h-4 w-4" />
              </Button>
            </div>
            <div
              className={`flex items-center gap-2 rounded-xl px-3 py-2 ${theme.shell}`}
            >
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
                <SelectTrigger
                  className={`h-8 flex-1 border-0 bg-transparent p-0 text-sm focus-visible:ring-0 ${
                    isDarkMode ? "text-white" : "text-slate-900"
                  }`}
                >
                  <SelectValue placeholder="Translation" />
                </SelectTrigger>
                <SelectContent
                  className={`${
                    isDarkMode
                      ? "border border-white/10 bg-[#0F1115] text-slate-100"
                      : "border border-slate-200 bg-white text-slate-900"
                  }`}
                >
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
          <div
            className={`rounded-2xl border px-4 py-3 text-sm ${
              isDarkMode
                ? "border-red-900/40 bg-red-900/30 text-red-200"
                : "border-red-200 bg-red-50 text-red-700"
            }`}
          >
            {searchError}
          </div>
        )}

        <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="space-y-6">
            <div className={`rounded-2xl p-5 space-y-6 ${theme.surface}`}>
              <div className="space-y-2">
                <p className={`text-sm font-medium ${theme.labelText}`}>
                  Verse
                </p>
                <Textarea
                  id="verse"
                  value={verseText}
                  onChange={(e) => setVerseText(e.target.value)}
                  placeholder="Enter your verse..."
                  className={`min-h-[160px] rounded-2xl border text-base placeholder:text-slate-500 focus-visible:ring-2 ${
                    isDarkMode
                      ? "border-white/10 bg-transparent text-white focus-visible:ring-white/20"
                      : "border-slate-200 bg-white text-slate-900 focus-visible:ring-slate-200"
                  }`}
                />
              </div>

              <div className="space-y-2">
                <p className={`text-sm font-medium ${theme.labelText}`}>
                  Reference label
                </p>
                <Input
                  id="reference"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  placeholder="e.g. Psalm 46:10"
                  className={`h-12 rounded-2xl border text-base placeholder:text-slate-500 focus-visible:ring-2 ${
                    isDarkMode
                      ? "border-white/10 bg-transparent text-white focus-visible:ring-white/20"
                      : "border-slate-200 bg-white text-slate-900 focus-visible:ring-slate-200"
                  }`}
                />
              </div>

              <div className="space-y-3">
                <p className={`text-sm font-medium ${theme.labelText}`}>
                  Format
                </p>
                <div className="flex flex-wrap gap-2">
                  {(["story", "square", "wide"] as SizeType[]).map((s) => {
                    const Icon = SIZE_ICONS[s];
                    const isActive = size === s;
                    return (
                      <button
                        key={s}
                        onClick={() => setSize(s)}
                        className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium transition ${
                          isActive
                            ? isDarkMode
                              ? "border-white/80 bg-white/10 text-white"
                              : "border-slate-900 bg-slate-900/5 text-slate-900"
                            : isDarkMode
                            ? "border-white/10 text-slate-400 hover:border-white/20"
                            : "border-slate-200 text-slate-500 hover:border-slate-400"
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

            <div className={`rounded-2xl p-5 space-y-6 ${theme.surface}`}>
              {backgroundControls}
            </div>
          </div>

          <div className="space-y-6">
            <div className={`rounded-2xl p-5 space-y-4 ${theme.surface}`}>
              <p className={`text-sm font-medium ${theme.labelText}`}>
                Preview
              </p>
              <div className="relative">
                <button
                  type="button"
                  onClick={() =>
                    backgroundMode === "photo"
                      ? setIsPhotoAppearanceOpen(true)
                      : setCustomizingStyle(style)
                  }
                  className={`absolute right-4 top-4 z-10 rounded-full border p-2 ${
                    isDarkMode
                      ? "border-white/10 bg-white/5 text-white hover:bg-white/10"
                      : "border-slate-200 bg-white text-slate-900 hover:bg-slate-50"
                  }`}
                  aria-label={
                    backgroundMode === "photo"
                      ? "Open photo styling controls"
                      : "Edit palette colors"
                  }
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <div
                  className={`flex items-center justify-center rounded-2xl border p-4 ${
                    isDarkMode
                      ? "border-white/10 bg-[#0C0E12]"
                      : "border-slate-200 bg-white"
                  }`}
                >
                  <canvas
                    ref={canvasRef}
                    className="h-auto w-full rounded-[18px] bg-white"
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
              </div>
              <div
                className={`flex items-center justify-between text-xs ${theme.mutedText}`}
              >
                <p>
                  {backgroundMode === "photo"
                    ? "Photo background"
                    : `Style: ${style}`}
                </p>
                <Button
                  onClick={handleDownload}
                  size="sm"
                  className={`inline-flex h-9 items-center gap-2 rounded-lg border px-3 text-sm font-semibold transition ${
                    isDarkMode
                      ? "border-white/10 bg-transparent text-white hover:bg-white/10"
                      : "border-slate-200 bg-transparent text-slate-900 hover:bg-slate-100"
                  }`}
                >
                  <Download className="h-4 w-4" />
                  Export
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      {customizingStyle && editingPalette && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 py-8"
          onClick={closePaletteModal}
        >
          <div
            className="w-full max-w-2xl rounded-3xl border border-white/10 bg-[#0F1218] p-6 shadow-[0_35px_90px_rgba(0,0,0,0.55)] text-white"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs text-slate-500">Palette</p>
                <h3 className="text-2xl font-semibold">{customizingStyle}</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => resetPaletteSetting(customizingStyle)}
                  className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-slate-200 hover:bg-white/10"
                >
                  Reset
                </button>
                <button
                  type="button"
                  onClick={closePaletteModal}
                  className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-slate-200 hover:bg-white/10"
                >
                  Close
                </button>
              </div>
            </div>

            <div className="mt-6 grid gap-5 md:grid-cols-[1.1fr_0.9fr]">
              <div className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs text-slate-400">Preview</p>
                <div
                  className="rounded-2xl border border-white/10 p-5 text-sm font-medium leading-relaxed shadow-inner"
                  style={palettePreviewStyle}
                >
                  Be still, and know that I am God.
                </div>
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Background {editingPalette.background}</span>
                  <span>Text {editingPalette.text}</span>
                </div>
              </div>

              <div className="space-y-4">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs text-slate-400">Background</p>
                  <label className="mt-3 flex items-center gap-3 rounded-2xl border border-white/10 bg-black/30 px-3 py-3">
                    <span className="relative block h-12 w-12 rounded-xl border border-white/10 focus-within:ring-2 focus-within:ring-white/40">
                      <span
                        className="absolute inset-0 rounded-[0.75rem]"
                        style={{ backgroundColor: editingPalette.background }}
                      />
                      <input
                        type="color"
                        aria-label="Choose background color"
                        value={editingPalette.background}
                        onChange={(event) =>
                          updatePaletteSetting(
                            customizingStyle,
                            "background",
                            event.target.value
                          )
                        }
                        className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                      />
                    </span>
                    <span className="text-sm text-slate-200">
                      {editingPalette.background}
                    </span>
                  </label>
                </div>

                {customizingStyle === "gradient" && (
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-xs text-slate-400">Gradient end</p>
                    <label className="mt-3 flex items-center gap-3 rounded-2xl border border-white/10 bg-black/30 px-3 py-3">
                      <span className="relative block h-12 w-12 rounded-xl border border-white/10 focus-within:ring-2 focus-within:ring-white/40">
                        <span
                          className="absolute inset-0 rounded-[0.75rem]"
                          style={{
                            backgroundColor:
                              editingPalette.backgroundAlt ??
                              editingPalette.background,
                          }}
                        />
                        <input
                          type="color"
                          aria-label="Choose gradient end color"
                          value={
                            editingPalette.backgroundAlt ??
                            editingPalette.background
                          }
                          onChange={(event) =>
                            updatePaletteSetting(
                              customizingStyle,
                              "backgroundAlt",
                              event.target.value
                            )
                          }
                          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                        />
                      </span>
                      <span className="text-sm text-slate-200">
                        {editingPalette.backgroundAlt ??
                          editingPalette.background}
                      </span>
                    </label>
                  </div>
                )}

                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs text-slate-400">Text color</p>
                  <label className="mt-3 flex items-center gap-3 rounded-2xl border border-white/10 bg-black/30 px-3 py-3">
                    <span className="relative block h-12 w-12 rounded-xl border border-white/10 focus-within:ring-2 focus-within:ring-white/40">
                      <span
                        className="absolute inset-0 rounded-[0.75rem]"
                        style={{ backgroundColor: editingPalette.text }}
                      />
                      <input
                        type="color"
                        aria-label="Choose text color"
                        value={editingPalette.text}
                        onChange={(event) =>
                          updatePaletteSetting(
                            customizingStyle,
                            "text",
                            event.target.value
                          )
                        }
                        className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                      />
                    </span>
                    <span className="text-sm text-slate-200">
                      {editingPalette.text}
                    </span>
                  </label>
                </div>
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-slate-500">
                Changes apply instantly to the canvas.
              </p>
              <div className="flex w-full gap-2 sm:w-auto">
                <Button
                  variant="ghost"
                  className="w-full border border-white/10 bg-transparent text-white hover:bg-white/10 sm:w-auto"
                  onClick={closePaletteModal}
                >
                  Done
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isPhotoAppearanceOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 py-8"
          onClick={() => setIsPhotoAppearanceOpen(false)}
        >
          <div
            className="w-full max-w-2xl rounded-3xl border border-white/10 bg-[#0F1218] p-6 shadow-[0_35px_90px_rgba(0,0,0,0.55)] text-white"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs text-slate-500">Photo styling</p>
                <h3 className="text-2xl font-semibold">Image adjustments</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={resetPhotoAppearance}
                  className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-slate-200 hover:bg-white/10"
                >
                  Reset
                </button>
                <button
                  type="button"
                  onClick={() => setIsPhotoAppearanceOpen(false)}
                  className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-slate-200 hover:bg-white/10"
                >
                  Close
                </button>
              </div>
            </div>

            <div className="mt-6 space-y-5">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-center justify-between text-sm text-slate-200">
                  <p>Photo opacity</p>
                  <span className="text-slate-400">
                    {Math.round(photoAppearance.photoOpacity * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min={30}
                  max={100}
                  value={Math.round(photoAppearance.photoOpacity * 100)}
                  onChange={(event) =>
                    updatePhotoAppearanceSetting(
                      "photoOpacity",
                      Number(event.target.value) / 100
                    )
                  }
                  className="mt-3 h-2 w-full cursor-pointer appearance-none rounded-full bg-white/10 accent-white"
                />
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-sm text-slate-200">Overlay color</p>
                <div className="mt-3 flex items-center gap-3">
                  <span className="relative block h-12 w-12 rounded-xl border border-white/10 focus-within:ring-2 focus-within:ring-white/40">
                    <span
                      className="absolute inset-0 rounded-[0.75rem]"
                      style={{ backgroundColor: photoAppearance.overlayColor }}
                    />
                    <input
                      type="color"
                      aria-label="Choose overlay color"
                      value={photoAppearance.overlayColor}
                      onChange={(event) =>
                        updatePhotoAppearanceSetting(
                          "overlayColor",
                          event.target.value
                        )
                      }
                      className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                    />
                  </span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span>Overlay strength</span>
                      <span>
                        {Math.round(photoAppearance.overlayOpacity * 100)}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={90}
                      value={Math.round(photoAppearance.overlayOpacity * 100)}
                      onChange={(event) =>
                        updatePhotoAppearanceSetting(
                          "overlayOpacity",
                          Number(event.target.value) / 100
                        )
                      }
                      className="mt-3 h-2 w-full cursor-pointer appearance-none rounded-full bg-white/10 accent-white"
                    />
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-sm text-slate-200">Text color</p>
                <label className="mt-3 flex items-center gap-3 rounded-2xl border border-white/10 bg-black/30 px-3 py-3">
                  <span className="relative block h-12 w-12 rounded-xl border border-white/10 focus-within:ring-2 focus-within:ring-white/40">
                    <span
                      className="absolute inset-0 rounded-[0.75rem]"
                      style={{ backgroundColor: photoAppearance.textColor }}
                    />
                    <input
                      type="color"
                      aria-label="Choose text color"
                      value={photoAppearance.textColor}
                      onChange={(event) =>
                        updatePhotoAppearanceSetting(
                          "textColor",
                          event.target.value
                        )
                      }
                      className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                    />
                  </span>
                  <span className="text-sm text-slate-200">
                    {photoAppearance.textColor}
                  </span>
                </label>
              </div>

              <p className="text-xs text-slate-500">
                These adjustments only apply when a photo background is active.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function EditorPage() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-black/60">Loading editor…</div>}>
      <EditorPageContent />
    </Suspense>
  );
}
