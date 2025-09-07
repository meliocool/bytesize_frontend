import axios from "axios";

export const api = axios.create({
  baseURL: "/api",
});

// call this once (or whenever the key changes)
export function setApiKeyHeader(key: string) {
  api.defaults.headers.common["X-API-Key"] = key || "";
}
