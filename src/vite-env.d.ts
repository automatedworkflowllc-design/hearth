/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_HEARTH_API_BASE_URL?: string;
  readonly VITE_RESOURCE_REPORT_EMAIL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
