import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { SecurityValidator } from '../src/main/security/security-validator';
import { AiCompanionService } from '../src/renderer/services/ai-service';

describe('Local Ollama AI Integration & Security Defense', () => {
  beforeEach(() => {
    (global as any).window = {
      mochiApi: {
        queryAi: vi.fn(),
        getOllamaModels: vi.fn(),
      },
    };
  });

  afterEach(() => {
    delete (global as any).window;
    vi.restoreAllMocks();
  });

  describe('1. Endpoint Security & SSRF Protection', () => {
    it('permits standard local Ollama endpoints on 127.0.0.1 and localhost', () => {
      expect(SecurityValidator.validateOllamaEndpoint('http://127.0.0.1:11434').valid).toBe(true);
      expect(SecurityValidator.validateOllamaEndpoint('http://localhost:11434').valid).toBe(true);
      expect(SecurityValidator.validateOllamaEndpoint('http://127.0.0.1:11434/api/chat').valid).toBe(true);
      expect(SecurityValidator.validateOllamaEndpoint('http://127.0.0.1:8080').valid).toBe(true);
    });

    it('strictly blocks AWS/GCP/Azure link-local cloud metadata (169.254.169.254)', () => {
      const res = SecurityValidator.validateOllamaEndpoint('http://169.254.169.254/latest/meta-data/');
      expect(res.valid).toBe(false);
      expect(res.reason).toContain('Cloud metadata endpoints are blocked');
    });

    it('blocks remote private intranet scanning (192.168.x.x, 10.x.x.x, 172.16.x.x)', () => {
      expect(SecurityValidator.validateOllamaEndpoint('http://192.168.1.5:11434').valid).toBe(false);
      expect(SecurityValidator.validateOllamaEndpoint('http://10.0.0.1:11434').valid).toBe(false);
      expect(SecurityValidator.validateOllamaEndpoint('http://172.20.0.10:11434').valid).toBe(false);
    });

    it('requires HTTP or HTTPS protocols and rejects dangerous schemes', () => {
      expect(SecurityValidator.validateOllamaEndpoint('file:///etc/hosts').valid).toBe(false);
      expect(SecurityValidator.validateOllamaEndpoint('javascript:void(0)').valid).toBe(false);
      expect(SecurityValidator.validateOllamaEndpoint('ftp://127.0.0.1:11434').valid).toBe(false);
    });
  });

  describe('2. AI Query Resolution & Heuristic Fallback', () => {
    it('executes deterministic local commands without network round-trips', async () => {
      const querySpy = vi.spyOn(window.mochiApi, 'queryAi');

      const response = await AiCompanionService.generateResponse(
        'start a 25m focus timer',
        [],
        { provider: 'ollama', apiEndpoint: 'http://127.0.0.1:11434', model: 'llama3.2' }
      );

      // Local command should resolve immediately without calling external Ollama
      expect(querySpy).not.toHaveBeenCalled();
      expect(response.suggestedAction).toBeDefined();
      expect(response.suggestedAction?.type).toBe('start_timer');
    });

    it('queries local Ollama through the IPC bridge for conversational queries', async () => {
      (window.mochiApi.queryAi as any).mockResolvedValueOnce({
        text: 'Hey! I am fully running locally with Ollama. Let’s crush your goals today! ✨',
        model: 'llama3.2',
        provider: 'ollama',
      });

      const response = await AiCompanionService.generateResponse(
        'how are you doing today?',
        [],
        { provider: 'ollama', apiEndpoint: 'http://127.0.0.1:11434', model: 'llama3.2' }
      );

      expect(window.mochiApi.queryAi).toHaveBeenCalledTimes(1);
      expect(response.text).toContain('running locally with Ollama');
      expect(response.isExternalAi).toBe(true);
    });

    it('falls back gracefully to offline companion heuristic if Ollama is unreachable', async () => {
      (window.mochiApi.queryAi as any).mockResolvedValueOnce({
        text: '',
        error: 'Could not connect to Ollama at http://127.0.0.1:11434',
      });

      const response = await AiCompanionService.generateResponse(
        'tell me a productivity tip',
        [],
        { provider: 'ollama', apiEndpoint: 'http://127.0.0.1:11434', model: 'llama3.2' }
      );

      expect(response.text).toContain('Local Ollama status:');
      expect(response.suggestedAction).toBeDefined();
    });
  });
});
