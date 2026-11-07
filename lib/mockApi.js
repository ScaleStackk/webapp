import { backendEndpoint } from "./apiConfig";

const PDF_CONTENT_TYPE = "application/pdf";

async function readJsonResponse(response) {
  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) return {};
  return response.json();
}

async function backendRequest(path, options = {}) {
  let response;
  try {
    response = await fetch(backendEndpoint(path), {
      ...options,
      cache: "no-store",
      headers: {
        Accept: "application/json",
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        ...options.headers,
      },
    });
  } catch {
    throw new Error("The EC2 backend could not be reached.");
  }

  const payload = await readJsonResponse(response);
  if (!response.ok) {
    throw new Error(payload.error || payload.message || `Backend request failed (${response.status}).`);
  }
  return payload;
}

function uploadPdfToS3({ file, uploadUrl, uploadHeaders = {}, onProgress }) {
  return new Promise((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open("PUT", uploadUrl);

    Object.entries(uploadHeaders).forEach(([name, value]) => {
      if (value !== undefined && value !== null) {
        request.setRequestHeader(name, String(value));
      }
    });

    if (!Object.keys(uploadHeaders).some((name) => name.toLowerCase() === "content-type")) {
      request.setRequestHeader("Content-Type", PDF_CONTENT_TYPE);
    }

    request.upload.addEventListener("progress", (event) => {
      if (event.lengthComputable) {
        const s3Progress = Math.round((event.loaded / event.total) * 85);
        onProgress(Math.min(90, 5 + s3Progress));
      }
    });
    request.addEventListener("load", () => {
      if (request.status >= 200 && request.status < 300) {
        resolve({ etag: request.getResponseHeader("ETag")?.replaceAll('"', "") || null });
        return;
      }
      reject(new Error(`S3 rejected the upload (${request.status}).`));
    });
    request.addEventListener("error", () => {
      reject(new Error("The direct S3 upload failed. Check the bucket CORS configuration."));
    });
    request.addEventListener("abort", () => reject(new Error("Upload cancelled.")));
    request.send(file);
  });
}

export async function uploadJudgment(file, onProgress = () => {}) {
  onProgress(1);
  const authorization = await backendRequest("uploads/presign", {
    method: "POST",
    body: JSON.stringify({
      contentType: PDF_CONTENT_TYPE,
      filename: file.name,
      sizeBytes: file.size,
    }),
  });

  if (!authorization.uploadUrl || !authorization.documentId) {
    throw new Error("The backend returned an invalid S3 upload authorization.");
  }

  const uploaded = await uploadPdfToS3({
    file,
    uploadUrl: authorization.uploadUrl,
    uploadHeaders: authorization.uploadHeaders,
    onProgress,
  });

  onProgress(94);
  const judgment = await backendRequest("judgments", {
    method: "POST",
    body: JSON.stringify({
      documentId: authorization.documentId,
      etag: uploaded.etag,
      filename: file.name,
      sizeBytes: file.size,
      storage: authorization.storage,
    }),
  });

  onProgress(100);
  return {
    id: judgment.id || authorization.documentId,
    jobId: judgment.jobId || null,
    name: judgment.name || file.name.replace(/\.pdf$/i, ""),
    filename: file.name,
    size: file.size,
    status: judgment.status || "queued",
    addedAt: judgment.addedAt || new Date().toISOString(),
    pages: judgment.pages || null,
    storage: judgment.storage || authorization.storage || null,
  };
}

export async function askJudgments({ question, judgmentIds }) {
  const response = await backendRequest("query", {
    method: "POST",
    body: JSON.stringify({ question, judgmentIds }),
  });

  return {
    id: response.id || `message-${Date.now()}`,
    role: "assistant",
    content: response.answer || response.content || "The backend returned an empty answer.",
    sources: Array.isArray(response.sources) ? response.sources : [],
  };
}
