import crypto from "node:crypto";
import path from "node:path";
import { NextResponse } from "next/server";
import { getConnectionConfig } from "../../../lib/server/connectionConfig";
import { publishJudgmentUploaded } from "../../../lib/server/kafka";
import { uploadJudgmentPdf } from "../../../lib/server/s3";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_FILE_SIZE = 50 * 1024 * 1024;

function errorResponse(message, status) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get("judgment");
    if (!file || typeof file.arrayBuffer !== "function") {
      return errorResponse("A PDF file is required in the judgment field.", 400);
    }
    if (!file.name || !/\.pdf$/i.test(file.name)) {
      return errorResponse("Only PDF judgments are accepted.", 415);
    }
    if (file.size < 1 || file.size > MAX_FILE_SIZE) {
      return errorResponse("The PDF must be between 1 byte and 50 MB.", 413);
    }

    const pdf = Buffer.from(await file.arrayBuffer());
    if (pdf.subarray(0, 5).toString("ascii") !== "%PDF-") {
      return errorResponse("The uploaded file does not contain a valid PDF header.", 415);
    }

    const config = getConnectionConfig();
    const documentId = crypto.createHash("sha256").update(pdf).digest("hex");
    const eventId = crypto.randomUUID();
    const occurredAt = new Date().toISOString();
    const storage = await uploadJudgmentPdf({
      body: pdf,
      documentId,
      originalFilename: file.name,
    });

    const event = {
      schemaVersion: "1.0",
      eventType: "judgment.uploaded",
      eventId,
      occurredAt,
      pipelineVersion: config.pipelineVersion,
      document: {
        documentId,
        originalFilename: file.name,
        contentType: "application/pdf",
        sizeBytes: file.size,
      },
      storage,
    };
    await publishJudgmentUploaded(event);

    return NextResponse.json(
      {
        id: documentId,
        jobId: eventId,
        name: path.basename(file.name, path.extname(file.name)),
        filename: file.name,
        size: file.size,
        status: "queued",
        addedAt: occurredAt,
        pages: null,
        storage: { key: storage.key },
      },
      { status: 202 },
    );
  } catch (error) {
    console.error("Judgment upload failed", error);
    return errorResponse(
      "The judgment could not be stored or queued. Check the server connection configuration and retry.",
      502,
    );
  }
}
