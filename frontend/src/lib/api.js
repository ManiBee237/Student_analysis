const API = import.meta.env.VITE_API_URL || "http://localhost:5050";

export async function postJSON(path, body) {
  const res = await fetch(`${API}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  if (!res.ok) {
    const text = await res.text().catch(()=> "");
    throw new Error(`HTTP ${res.status} ${text || ""}`.trim());
  }
  return res.json();
}
