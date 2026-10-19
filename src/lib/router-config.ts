import routerConfigJson from "../../config/routers.json";

export type RouterId =
  | "R1"
  | "R2"
  | "R3"
  | "R4"
  | "R5"
  | "R6"
  | "R7"
  | "R8"
  | "R9";

export interface RouterConfig {
  name: string;
  model: string | null;
  promptVersion: string | null;
  timeoutMs: number;
  maxRetries: number;
}

export function getRouterConfig(routerId: RouterId): RouterConfig {
  const baseConfig = routerConfigJson.routers[routerId];
  if (!baseConfig) {
    throw new Error(`Konfigurasi untuk router ${routerId} tidak ditemukan`);
  }

  // Allow environment variable override: e.g. R1_MODEL, R9_MODEL
  const envModel = process.env[`${routerId}_MODEL`];

  return {
    ...baseConfig,
    model: envModel || baseConfig.model,
  };
}

export function getGlobalConfig() {
  return routerConfigJson.globalSettings;
}
