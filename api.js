function getApiBaseUrl() {
  return (
    process.env.WNPM_API_URL?.replace(/\/$/, "") || "https://unifoliate-asynchronously-sebastian.ngrok-free.dev"
  );
}

async function checkPackages(packages) {
  const url = `${getApiBaseUrl()}/api/check/packages`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ packages }),
  });
  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error(`API ${res.status}: ${text}`);
  }
  if (!res.ok) {
    throw new Error(json.error || `API ${res.status}: ${text}`);
  }
  return json;
}

module.exports = { checkPackages, getApiBaseUrl };
