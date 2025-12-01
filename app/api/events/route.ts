import { Event } from "@/database";
import connectDB from "@/lib/mongodb";
import { NextRequest, NextResponse } from "next/server";
import {v2 as cloudinary} from "cloudinary";

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

export async function POST(req: NextRequest){
  try {
    await connectDB();

    const formData = await req.formData();

    let event: any;

    try {
      event = Object.fromEntries(formData.entries());
      
      // Parse agenda if it's a string
      if (typeof event.agenda === "string") {
        try {
          event.agenda = JSON.parse(event.agenda);
        } catch {
          event.agenda = event.agenda.split("\n").filter((item: string) => item.trim());
        }
      }
      
      // Parse tags if it's a string
      if (typeof event.tags === "string") {
        try {
          event.tags = JSON.parse(event.tags);
        } catch {
          event.tags = event.tags.split(",").map((tag: string) => tag.trim());
        }
      }
    } catch (error) {
      return NextResponse.json({
        message: "Invalid Form Data",
        error: error instanceof Error ? error.message : String(error)
      }, { status: 400 });
    }

    const file = formData.get("image") as File;

    if(!file){
      return NextResponse.json({
        message: "Image File is required"
      }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const uploadResult = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream({
        resource_type: "image",
        folder: "dev-events"
      }, (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }).end(buffer);
    });

    event.image = (uploadResult as { secure_url: string }).secure_url;

    const createdEvent = await Event.create(event);

    return NextResponse.json({
      message: "Event Created Successfully",
      event: createdEvent
    }, { status: 201 });
  } catch (error){
    console.error("Error creating event:", error);
    return NextResponse.json({
      message: "Event Creation Failed",
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

export async function GET(){
  try {
    await connectDB();

    const events = await Event.find().sort({ createdAt: -1 });

    return NextResponse.json({
      message: "Events fetched successfully",
      events
    }, { status: 200 });
  } catch (error) {
    return NextResponse.json({
      message: "Failed to fetch events",
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}