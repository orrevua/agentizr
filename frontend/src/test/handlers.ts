import { http, HttpResponse } from 'msw';
import {
  HANDOFF_CONDITIONS_FIXTURE,
  MCP_FIXTURE,
  MODELS_FIXTURE,
  PRESETS_FIXTURE,
  PREVIEW_FIXTURE,
  TOOLS_FIXTURE,
} from './fixtures/catalogs';

const BASE = 'http://localhost:8000/api/v1';

export const handlers = [
  http.get(`${BASE}/catalog/tools`, () => HttpResponse.json(TOOLS_FIXTURE)),
  http.get(`${BASE}/catalog/models`, () => HttpResponse.json(MODELS_FIXTURE)),
  http.get(`${BASE}/catalog/mcp-servers`, () => HttpResponse.json(MCP_FIXTURE)),
  http.get(`${BASE}/catalog/presets`, () => HttpResponse.json(PRESETS_FIXTURE)),
  http.get(`${BASE}/catalog/handoff-conditions`, () =>
    HttpResponse.json(HANDOFF_CONDITIONS_FIXTURE),
  ),
  http.post(`${BASE}/preview`, () => HttpResponse.json(PREVIEW_FIXTURE)),
  http.post(`${BASE}/generate`, () =>
    HttpResponse.arrayBuffer(new ArrayBuffer(8), {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': 'attachment; filename="agentizr-test.zip"',
      },
    }),
  ),
];
