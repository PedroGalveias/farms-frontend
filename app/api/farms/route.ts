import { NextResponse } from "next/server";
import { FarmsApiError, createFarm, getFarms } from "@/lib/farms-service";
import type { CreateFarmInput } from "@/types/farm";

export const dynamic = "force-dynamic";

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof FarmsApiError) {
    return error.message;
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}

function getErrorStatus(error: unknown) {
  if (error instanceof FarmsApiError) {
    return error.status;
  }

  return 500;
}

function isCreateFarmInput(value: unknown): value is CreateFarmInput {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<CreateFarmInput>;

  return (
    typeof candidate.name === "string" &&
    typeof candidate.address === "string" &&
    typeof candidate.canton === "string" &&
    typeof candidate.coordinates === "string" &&
    Array.isArray(candidate.categories) &&
    candidate.categories.every((item) => typeof item === "string")
  );
}

export async function GET() {
  try {
    const farms = await getFarms();
    return NextResponse.json(farms);
  } catch (error) {
    return NextResponse.json(
      { error: getErrorMessage(error, "Unable to load the farm data.") },
      { status: getErrorStatus(error) },
    );
  }
}

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!isCreateFarmInput(body)) {
    return NextResponse.json(
      { error: "Invalid farm payload." },
      { status: 400 },
    );
  }

  try {
    await createFarm({
      ...body,
      idempotency_key: crypto.randomUUID(),
    });

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: getErrorMessage(error, "Unable to create new farm.") },
      { status: getErrorStatus(error) },
    );
  }
}
