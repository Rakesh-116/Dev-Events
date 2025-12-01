import { Event } from "@/database";
import connectDB from "@/lib/mongodb";
import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/events/[slug]
 * Fetches a single event by its slug
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    // Await params (required in Next.js 15+)
    const { slug } = await params;
    
    if (!slug || typeof slug !== "string") {
      return NextResponse.json(
        {
          message: "Invalid slug parameter",
          error: "Slug must be a non-empty string"
        },
        { status: 400 }
      );
    }

    // Validate slug format (alphanumeric and hyphens only)
    const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
    if (!slugRegex.test(slug)) {
      return NextResponse.json(
        {
          message: "Invalid slug format",
          error: "Slug must contain only lowercase letters, numbers, and hyphens"
        },
        { status: 400 }
      );
    }

    // Connect to database
    await connectDB();

    // Query event by slug
    const event = await Event.findOne({ slug }).lean();

    // Handle event not found
    if (!event) {
      return NextResponse.json(
        {
          message: "Event not found",
          error: `No event exists with slug: ${slug}`
        },
        { status: 404 }
      );
    }

    // Return the event data
    return NextResponse.json(
      {
        message: "Event retrieved successfully",
        event
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching event:", error);
    
    // Handle different error types
    if (error instanceof Error) {
      return NextResponse.json(
        {
          message: "Failed to fetch event",
          error: error.message
        },
        { status: 500 }
      );
    }

    // Fallback for unknown errors
    return NextResponse.json(
      {
        message: "An unexpected error occurred",
        error: "Internal server error"
      },
      { status: 500 }
    );
  }
}
