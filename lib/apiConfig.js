const rawBackendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "";

export const BACKEND_URL = rawBackendUrl.replace(/\/+$/, "");

export function backendEndpoint(path) {
  if (!BACKEND_URL) {
    throw new Error(
      "The backend URL is not configured. Set NEXT_PUBLIC_BACKEND_URL before building the webapp.",
    );
  }

  const cleanPath = String(path || "").replace(/^\/+/, "");
  return `${BACKEND_URL}/${cleanPath}`;
}
