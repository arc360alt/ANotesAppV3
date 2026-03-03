// api.js - Server communication helpers

export function getAuthHeaders(token) {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

export async function apiRegister(serverUrl, username, password) {
  const res = await fetch(`${serverUrl}/api/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  return res.json();
}

export async function apiLogin(serverUrl, username, password) {
  const res = await fetch(`${serverUrl}/api/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  return res.json();
}

export async function apiLogout(serverUrl, token) {
  const res = await fetch(`${serverUrl}/api/logout`, {
    method: "POST",
    headers: getAuthHeaders(token),
  });
  return res.json();
}

export async function apiSyncUpload(serverUrl, token, data) {
  const res = await fetch(`${serverUrl}/api/sync/upload`, {
    method: "POST",
    headers: getAuthHeaders(token),
    body: JSON.stringify({ data }),
  });
  return res.json();
}

export async function apiSyncDownload(serverUrl, token) {
  const res = await fetch(`${serverUrl}/api/sync/download`, {
    headers: getAuthHeaders(token),
  });
  return res.json();
}

export async function apiUserInfo(serverUrl, token) {
  const res = await fetch(`${serverUrl}/api/user/info`, {
    headers: getAuthHeaders(token),
  });
  return res.json();
}
