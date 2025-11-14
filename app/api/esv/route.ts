import { NextResponse } from "next/server";

const ESV_API_ENDPOINT = "https://api.esv.org/v3/passage/text/";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const reference = searchParams.get("reference");

  if (!reference) {
    return NextResponse.json(
      { error: "Missing required `reference` query parameter." },
      { status: 400 }
    );
  }

  const apiKey = process.env.ESV_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      {
        error:
          "ESV API key not configured. Set the `ESV_API_KEY` environment variable.",
      },
      { status: 500 }
    );
  }

  const params = new URLSearchParams({
    q: reference,
    include_headings: "false",
    include_subheadings: "false",
    include_audio_link: "false",
    include_footnotes: "false",
    include_passage_references: "true",
    include_verse_numbers: "true",
    include_short_copyright: "false",
    include_copyright: "false",
  });

  try {
    const response = await fetch(`${ESV_API_ENDPOINT}?${params.toString()}`, {
      headers: {
        Authorization: `Token ${apiKey}`,
        Accept: "application/json",
      },
      next: { revalidate: 0 },
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        {
          error:
            "Failed to fetch passage from ESV API. Verify the reference and API key permissions.",
          details: errorText,
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    const passage = Array.isArray(data.passages)
      ? data.passages.join("\n").trim()
      : "";
    const canonical = data.canonical ?? reference;

    if (!passage) {
      return NextResponse.json(
        { error: "No passage text returned for the provided reference." },
        { status: 404 }
      );
    }

    const cleaned = passage
      .replace(/\s*\[\d+\]\s*/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    const withoutReference = cleaned.replace(
      /^\s*(?:[1-3]?\s?[A-Za-z]+(?:\s[A-Za-z]+)*)\s\d+:\d+\s*/,
      ""
    );

    return NextResponse.json({
      reference: canonical,
      text: withoutReference.trim(),
    });
  } catch (error) {
    console.error("ESV API fetch failed:", error);
    return NextResponse.json(
      { error: "Unexpected error reaching the ESV API." },
      { status: 500 }
    );
  }
}
