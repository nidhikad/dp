/** Extract a readable message from FastAPI / Starlette error responses. */
export async function parseApiError(response: Response): Promise<string> {
  const text = await response.text();
  if (!text) return `Request failed (${response.status})`;
  try {
    const data = JSON.parse(text) as { detail?: unknown };
    const d = data.detail;
    if (typeof d === "string") return d;
    if (Array.isArray(d)) {
      return d
        .map((item: { msg?: string; loc?: unknown }) => item.msg || JSON.stringify(item))
        .join("; ");
    }
    if (d && typeof d === "object") return JSON.stringify(d);
  } catch {
    /* not JSON */
  }
  return text.slice(0, 500);
}
