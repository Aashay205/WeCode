const backendUrl =
  import.meta.env.VITE_API_URL ??
  `${window.location.protocol}//${window.location.hostname}:3000`;

export const API_BASE_URL = backendUrl.replace(/\/+$/, "");
export const SOCKET_URL = API_BASE_URL;
