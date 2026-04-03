function getApiBaseUrl() {
  return (
    "https://wnpm-server-production.up.railway.app"
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
