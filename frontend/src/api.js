export const kes = (n) => `KES ${Number(n).toLocaleString('en-KE')}`;

export async function api(path, { method = 'GET', body, key } = {}) {
  const res = await fetch(`/api${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...(key ? { 'x-admin-key': key } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Something went wrong. Try again.');
  return data;
}
