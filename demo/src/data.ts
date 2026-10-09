export interface DemoKey {
  id: string;
  name: string;
  key: string;
  upstreams: string;
  created: string;
  lastUsed: string | null;
}

export const DEMO_KEYS: DemoKey[] = [
  { id: 'k1', name: 'Production gateway', key: 'sk-flw-7f3a9c1d2e8b4a6f90c1d2e3f4a5b6c7', upstreams: 'All upstreams', created: 'Sep 12, 2026', lastUsed: '2 minutes ago' },
  { id: 'k2', name: 'CI evaluation runner with a deliberately long display name that must truncate', key: 'sk-flw-1b2c3d4e5f60718293a4b5c6d7e8f901', upstreams: 'OpenAI, Anthropic', created: 'Oct 1, 2026', lastUsed: 'Yesterday' },
  { id: 'k3', name: 'Local playground', key: 'sk-flw-aa11bb22cc33dd44ee55ff66778899aa', upstreams: 'LM Studio', created: 'Oct 5, 2026', lastUsed: null },
  { id: 'k4', name: 'Retired key', key: 'sk-flw-00000000deadbeef0000000011112222', upstreams: 'None', created: 'Jan 3, 2026', lastUsed: '3 months ago' },
];

export interface DemoUpstream {
  id: string;
  name: string;
  models: number;
  enabled: boolean;
  hue: string;
}

export const DEMO_UPSTREAMS: DemoUpstream[] = [
  { id: 'u1', name: 'OpenAI', models: 42, enabled: true, hue: '#10a37f' },
  { id: 'u2', name: 'Anthropic', models: 9, enabled: true, hue: '#d97757' },
  { id: 'u3', name: 'Google Gemini', models: 17, enabled: true, hue: '#4285f4' },
  { id: 'u4', name: 'LM Studio', models: 5, enabled: false, hue: '#8764b8' },
];

export const MODEL_OPTIONS = [
  { value: 'gpt-5', label: 'gpt-5' },
  { value: 'gpt-5-mini', label: 'gpt-5-mini' },
  { value: 'claude-opus', label: 'claude-opus' },
  { value: 'claude-sonnet', label: 'claude-sonnet' },
  { value: 'gemini-pro', label: 'gemini-pro' },
  { value: 'qwen3-coder', label: 'qwen3-coder' },
];

export interface DemoRequest {
  id: string;
  method: string;
  path: string;
  status: number;
  model: string;
  latency: string;
}

export const DEMO_REQUESTS: DemoRequest[] = [
  { id: 'r1', method: 'POST', path: '/v1/chat/completions', status: 200, model: 'gpt-5', latency: '812 ms' },
  { id: 'r2', method: 'POST', path: '/v1/messages', status: 200, model: 'claude-sonnet', latency: '1.4 s' },
  { id: 'r3', method: 'GET', path: '/v1/models', status: 200, model: '-', latency: '38 ms' },
  { id: 'r4', method: 'POST', path: '/v1/responses', status: 429, model: 'gpt-5-mini', latency: '120 ms' },
  { id: 'r5', method: 'DELETE', path: '/v1/files/file-abc', status: 500, model: '-', latency: '2.1 s' },
  { id: 'r6', method: 'PUT', path: '/v1/aliases/default', status: 204, model: '-', latency: '61 ms' },
];

export const SAMPLE_JSON = JSON.stringify({
  model: 'gpt-5',
  messages: [{ role: 'user', content: 'Hello, Floway!' }],
  stream: true,
  temperature: 0.7,
  metadata: { project: 'demo', tags: ['alpha', 'beta'], retries: null },
}, null, 2);
