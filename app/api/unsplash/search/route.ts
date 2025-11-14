import { NextResponse } from "next/server";

const UNSPLASH_SEARCH_ENDPOINT = "https://api.unsplash.com/search/photos";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("query");
  const page = searchParams.get("page") ?? "1";
  const perPage = searchParams.get("perPage") ?? "8";

  if (!query) {
    return NextResponse.json(
      { error: "Missing required `query` parameter." },
      { status: 400 }
    );
  }

  const accessKey = process.env.UNSPLASH_ACCESS_KEY;

  if (!accessKey) {
    return NextResponse.json(
      { error: "Unsplash access key not configured." },
      { status: 500 }
    );
  }

  try {
    const response = await fetch(
      `${UNSPLASH_SEARCH_ENDPOINT}?query=${encodeURIComponent(
        query
      )}&page=${page}&per_page=${perPage}&orientation=landscape&content_filter=high`,
      {
        headers: {
          Authorization: `Client-ID ${accessKey}`,
          "Accept-Version": "v1",
        },
        next: { revalidate: 0 },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        {
          error: "Failed to search Unsplash.",
          details: errorText,
        },
        { status: response.status }
      );
    }

    const data = await response.json();

    const simplified =
      Array.isArray(data?.results) &&
      data.results.map((photo: any) => ({
        id: photo.id,
        description: photo.description ?? photo.alt_description ?? "Untitled",
        photographer: photo.user?.name ?? "Unknown",
        link: photo.links?.html ?? "",
        thumb: photo.urls?.small ?? "",
        full: photo.urls?.regular ?? "",
      }));

    return NextResponse.json({ results: simplified ?? [] });
  } catch (error) {
    console.error("Unsplash search failed:", error);
    return NextResponse.json(
      { error: "Unexpected error while reaching Unsplash." },
      { status: 500 }
    );
  }
}
