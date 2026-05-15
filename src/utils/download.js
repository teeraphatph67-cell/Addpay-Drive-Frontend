export function generateFileUrl(BASE_URL, file_path) {
  if (!file_path) return null;
  if (file_path.startsWith("http")) return file_path;
  if (BASE_URL) {
    const cleanBase = BASE_URL.replace(/\/$/, "");
    const cleanPath = file_path.startsWith("/") ? file_path : `/${file_path}`;
    return `${cleanBase}${cleanPath}`;
  }
  return null;
}

export function generateDirectFileUrl(BASE_URL, file_path) {
  const baseUrl = generateFileUrl(BASE_URL, file_path);
  if (!baseUrl) return null;
  return `${baseUrl}?download=1`;
}

export async function downloadItem(item, { API_BASE, token } = {}) {
  if (!item || !item.permission_id) throw new Error('Missing permission_id');
  const permissionId = item.permission_id;
  const endpoint = item.isFolder
    ? `${API_BASE}/shared/folder/${permissionId}/download-zip`
    : `${API_BASE}/shared/file/${permissionId}/download`;

  const res = await fetch(endpoint, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/octet-stream',
    },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => null);
    throw new Error(text || `HTTP ${res.status}`);
  }

  let filename = item.name || `download_${Date.now()}`;
  const disposition = res.headers.get('Content-Disposition');
  if (disposition) {
    const match = disposition.match(/filename="?(.+)"?/i);
    if (match) filename = match[1];
  }

  if (item.isFolder && !filename.endsWith('.zip')) filename += '.zip';

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();

  setTimeout(() => {
    URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }, 150);

  return { filename };
}

export async function downloadMultiple(itemsForApi, { API_BASE, token } = {}) {
  const res = await fetch(`${API_BASE}/shared/download-multiple`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Accept: 'application/octet-stream',
    },
    body: JSON.stringify({ items: itemsForApi }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => null);
    throw new Error(text || `HTTP ${res.status}`);
  }

  let filename = `shared_download_${Date.now()}.zip`;
  const disposition = res.headers.get('Content-Disposition');
  if (disposition) {
    const match = disposition.match(/filename="?(.+)"?/i);
    if (match) filename = match[1];
  }

  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();

  setTimeout(() => {
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }, 150);

  return { filename };
}

export function viewInNewTab(item, { BASE_URL } = {}) {
  if (!item) return false;
  if (item.direct_url) {
    window.open(item.direct_url, '_blank', 'noopener,noreferrer');
    return true;
  }
  if (item.direct_download_url) {
    const url = item.direct_download_url.replace('?download=1', '');
    window.open(url, '_blank', 'noopener,noreferrer');
    return true;
  }
  // fallback: try to build from file_path if BASE_URL provided
  if (BASE_URL && item.file_path) {
    const base = generateFileUrl(BASE_URL, item.file_path);
    if (base) {
      window.open(base, '_blank', 'noopener,noreferrer');
      return true;
    }
  }
  return false;
}
