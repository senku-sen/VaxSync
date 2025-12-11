"use server";

/**
 * Catch-all for the bare /api path to prevent exposing any index or raw data.
 * All methods return 404 with no body.
 */

const notFound = new Response(null, { status: 404 });

export async function GET() {
  return notFound;
}

export async function HEAD() {
  return notFound;
}

export async function POST() {
  return notFound;
}

export async function PUT() {
  return notFound;
}

export async function DELETE() {
  return notFound;
}

export async function PATCH() {
  return notFound;
}

