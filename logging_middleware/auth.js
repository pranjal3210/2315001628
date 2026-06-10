const API_BASE_URL = process.env.EVALUATION_API_BASE_URL || "http://4.224.186.213/evaluation-service";

async function getAccessToken(credentials = {}) {
  const body = {
    email: credentials.email || process.env.EVALUATION_EMAIL,
    name: credentials.name || process.env.EVALUATION_NAME,
    rollNo: credentials.rollNo || process.env.EVALUATION_ROLL_NO,
    accessCode: credentials.accessCode || process.env.EVALUATION_ACCESS_CODE,
    clientID: credentials.clientID || process.env.EVALUATION_CLIENT_ID,
    clientSecret: credentials.clientSecret || process.env.EVALUATION_CLIENT_SECRET,
  };

  for (const [key, value] of Object.entries(body)) {
    if (!value) throw new Error(`Missing credential: ${key}`);
  }

  const response = await fetch(`${API_BASE_URL}/auth`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(`Auth API failed with ${response.status}: ${JSON.stringify(payload)}`);
  }

  return payload.access_token;
}

module.exports = { getAccessToken };
