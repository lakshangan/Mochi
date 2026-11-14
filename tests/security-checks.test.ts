import { describe, it, expect, vi } from 'vitest';
import fs from 'fs';
import path from 'path';
import { SecurityValidator } from '../src/main/security/security-validator';
import { PetWindow } from '../src/main/windows/pet-window';
import { AssistantWindow } from '../src/main/windows/assistant-window';
import { AlertWindow } from '../src/main/windows/alert-window';

// Mock electron
vi.mock('electron', () => {
  let webPreferencesCaptured: any = null;
  const mockWebContents = {
    setWindowOpenHandler: vi.fn(),
    on: vi.fn(),
    once: vi.fn(),
    send: vi.fn(),
  };

  class MockBrowserWindow {
    public webPreferences: any;
    public webContents = mockWebContents;
    constructor(options: any) {
      this.webPreferences = options.webPreferences;
      webPreferencesCaptured = options.webPreferences;
    }
    setTitle = vi.fn();
    setPosition = vi.fn();
    getPosition = vi.fn().mockReturnValue([100, 100]);
    setSize = vi.fn();
    getSize = vi.fn().mockReturnValue([400, 600]);
    loadURL = vi.fn();
    loadFile = vi.fn();
    show = vi.fn();
    hide = vi.fn();
    minimize = vi.fn();
    maximize = vi.fn();
    unmaximize = vi.fn();
    isMaximized = vi.fn().mockReturnValue(false);
    focus = vi.fn();
    close = vi.fn();
    isDestroyed = vi.fn().mockReturnValue(false);
    isVisible = vi.fn().mockReturnValue(true);
    setAlwaysOnTop = vi.fn();
    setVisibleOnAllWorkspaces = vi.fn();
    setBackgroundColor = vi.fn();
    setHasShadow = vi.fn();
    setVibrancy = vi.fn();
    on = vi.fn();
  }

  return {
    app: {
      getAppPath: () => process.cwd(),
      getPath: () => process.cwd(),
      requestSingleInstanceLock: vi.fn().mockReturnValue(true),
      quit: vi.fn(),
      setLoginItemSettings: vi.fn(),
    },
    screen: {
      getAllDisplays: () => [{ workArea: { x: 0, y: 0, width: 1920, height: 1080 } }],
      getPrimaryDisplay: () => ({ workArea: { x: 0, y: 0, width: 1920, height: 1080 }, bounds: { width: 1920, height: 1080, x: 0, y: 0 } }),
      getDisplayNearestPoint: () => ({ workArea: { x: 0, y: 0, width: 1920, height: 1080 } }),
      getCursorScreenPoint: () => ({ x: 200, y: 200 }),
    },
    shell: {
      openExternal: vi.fn().mockResolvedValue(true),
    },
    BrowserWindow: MockBrowserWindow,
  };
});

describe('Security Checks & Hardening Suite', () => {
  describe('1. Content Security Policy (CSP) Invariants', () => {
    it('verifies src/renderer/index.html includes a strict Content-Security-Policy meta tag', () => {
      const htmlPath = path.join(process.cwd(), 'src/renderer/index.html');
      const htmlContent = fs.readFileSync(htmlPath, 'utf-8');

      expect(htmlContent).toContain('http-equiv="Content-Security-Policy"');
      expect(htmlContent).toContain("default-src 'self'");
      expect(htmlContent).not.toContain("'unsafe-eval'");
    });

    it('validates CSP validator correctly detects insecure configurations', () => {
      // Insecure: allows unsafe-eval
      const insecureCsp = "default-src 'self'; script-src 'self' 'unsafe-eval';";
      const check1 = SecurityValidator.validateCspDirectives(insecureCsp);
      expect(check1.valid).toBe(false);
      expect(check1.errors.some((e) => e.includes('unsafe-eval'))).toBe(true);

      // Insecure: missing default-src 'self'
      const missingDefaultCsp = "script-src 'self'; style-src 'self';";
      const check2 = SecurityValidator.validateCspDirectives(missingDefaultCsp);
      expect(check2.valid).toBe(false);
      expect(check2.errors.some((e) => e.includes("default-src 'self'"))).toBe(true);

      // Secure CSP
      const secureCsp = "default-src 'self'; script-src 'self'; style-src 'self';";
      const check3 = SecurityValidator.validateCspDirectives(secureCsp);
      expect(check3.valid).toBe(true);
      expect(check3.errors.length).toBe(0);
    });
  });

  describe('2. Window Security Configuration (Electron Hardening)', () => {
    it('enforces contextIsolation: true and nodeIntegration: false on PetWindow', () => {
      const petWin = new PetWindow({ x: 100, y: 100 }, { petSize: 115 } as any);
      const winInstance = petWin.create('/dummy/preload.js', false, 'http://localhost:5173') as any;

      expect(winInstance.webPreferences.contextIsolation).toBe(true);
      expect(winInstance.webPreferences.nodeIntegration).toBe(false);
      expect(winInstance.webPreferences.webSecurity).toBe(true);
    });

    it('enforces contextIsolation: true and nodeIntegration: false on AssistantWindow', () => {
      const assistantWin = new AssistantWindow();
      assistantWin.createOrToggle({ x: 100, y: 100 }, '/dummy/preload.js', false, 'http://localhost:5173');
      const winInstance = assistantWin.getWindow() as any;

      expect(winInstance.webPreferences.contextIsolation).toBe(true);
      expect(winInstance.webPreferences.nodeIntegration).toBe(false);
      expect(winInstance.webPreferences.webSecurity).toBe(true);
    });

    it('enforces contextIsolation: true and nodeIntegration: false on AlertWindow', () => {
      const alertWin = new AlertWindow();
      alertWin.show({ type: 'water', title: 'Water', message: 'Drink', timestamp: Date.now(), dueAt: Date.now() }, '/dummy/preload.js', false, 'http://localhost:5173');
      const winInstance = alertWin.getWindow() as any;

      expect(winInstance.webPreferences.contextIsolation).toBe(true);
      expect(winInstance.webPreferences.nodeIntegration).toBe(false);
      expect(winInstance.webPreferences.webSecurity).toBe(true);
    });
  });

  describe('3. SSRF Mitigation & External Endpoint Verification', () => {
    it('blocks loopback / localhost destinations to prevent internal network scanning', () => {
      const loopback1 = SecurityValidator.validateEndpointUrl('http://localhost:8080/v1/chat');
      expect(loopback1.valid).toBe(false);

      const loopback2 = SecurityValidator.validateEndpointUrl('https://127.0.0.1:443/api');
      expect(loopback2.valid).toBe(false);

      const loopback3 = SecurityValidator.validateEndpointUrl('https://0.0.0.0/api');
      expect(loopback3.valid).toBe(false);
    });

    it('blocks Cloud metadata service IP (169.254.169.254) against instance identity theft', () => {
      const metadata = SecurityValidator.validateEndpointUrl('https://169.254.169.254/latest/meta-data/');
      expect(metadata.valid).toBe(false);
      expect(metadata.reason).toContain('Cloud metadata endpoints are blocked');
    });

    it('blocks RFC 1918 private IPv4 subnets (10.x, 192.168.x, 172.16.x-172.31.x)', () => {
      expect(SecurityValidator.validateEndpointUrl('https://10.0.0.5/api').valid).toBe(false);
      expect(SecurityValidator.validateEndpointUrl('https://192.168.1.100/admin').valid).toBe(false);
      expect(SecurityValidator.validateEndpointUrl('https://172.20.10.4/api').valid).toBe(false);
    });

    it('rejects plain HTTP endpoints and requires HTTPS encryption', () => {
      const httpEndpoint = SecurityValidator.validateEndpointUrl('http://api.openai.com/v1/chat');
      expect(httpEndpoint.valid).toBe(false);
      expect(httpEndpoint.reason).toContain('HTTPS');
    });

    it('allows verified HTTPS external endpoints', () => {
      const validEndpoint = SecurityValidator.validateEndpointUrl('https://api.openai.com/v1/chat/completions');
      expect(validEndpoint.valid).toBe(true);
    });
  });

  describe('4. Navigation & Protocol Protection', () => {
    it('strictly forbids execution and filesystem protocols like javascript: and file:', () => {
      const jsProto = SecurityValidator.validateExternalUrl('javascript:alert(document.cookie)');
      expect(jsProto.allow).toBe(false);
      expect(jsProto.reason).toContain('prohibited');

      const fileProto = SecurityValidator.validateExternalUrl('file:///etc/passwd');
      expect(fileProto.allow).toBe(false);

      const dataProto = SecurityValidator.validateExternalUrl('data:text/html,<script>alert(1)</script>');
      expect(dataProto.allow).toBe(false);

      const shellProto = SecurityValidator.validateExternalUrl('shell:start notepad');
      expect(shellProto.allow).toBe(false);
    });

    it('permits safe web protocols and delegates to external browser', () => {
      const httpsUrl = SecurityValidator.validateExternalUrl('https://github.com/mochi-desktop/mochi');
      expect(httpsUrl.allow).toBe(true);
      expect(httpsUrl.openExternally).toBe(true);

      const httpUrl = SecurityValidator.validateExternalUrl('http://example.com');
      expect(httpUrl.allow).toBe(true);
      expect(httpUrl.openExternally).toBe(true);

      const mailtoUrl = SecurityValidator.validateExternalUrl('mailto:support@mochicompanion.com');
      expect(mailtoUrl.allow).toBe(true);
      expect(mailtoUrl.openExternally).toBe(true);
    });
  });

  describe('5. Prototype Pollution Defense & Input Sanitization', () => {
    it('strips __proto__, constructor, and prototype from incoming IPC objects', () => {
      const maliciousPayload = JSON.parse('{"name": "test", "__proto__": {"polluted": true}, "constructor": {"polluted": true}}');
      const cleaned = SecurityValidator.sanitizeObject(maliciousPayload);

      expect(cleaned.name).toBe('test');
      expect(cleaned.__proto__?.polluted).toBeUndefined();
      expect(cleaned.constructor?.polluted).toBeUndefined();
      expect(({} as any).polluted).toBeUndefined();
    });

    it('validates and clamps coordinates, preventing NaN and Infinity exploits', () => {
      expect(SecurityValidator.validateCoordinate(150)).toBe(150);
      expect(SecurityValidator.validateCoordinate(NaN, 50)).toBe(50);
      expect(SecurityValidator.validateCoordinate(Infinity, 50)).toBe(50);
      expect(SecurityValidator.validateCoordinate('not a number', 100)).toBe(100);
      expect(SecurityValidator.validateCoordinate(999999, 0, -500, 500)).toBe(500);
      expect(SecurityValidator.validateCoordinate(-999999, 0, -500, 500)).toBe(-500);
    });

    it('validates and clamps timer durations safely (1s to 24h)', () => {
      expect(SecurityValidator.validateTimerSeconds(1500)).toBe(1500);
      expect(SecurityValidator.validateTimerSeconds(-100, 60)).toBe(60);
      expect(SecurityValidator.validateTimerSeconds(0, 60)).toBe(60);
      expect(SecurityValidator.validateTimerSeconds(NaN, 120)).toBe(120);
      expect(SecurityValidator.validateTimerSeconds(9999999)).toBe(86400); // Max 24 hours
    });

    it('validates and clamps reminder snooze minutes safely (1m to 1440m)', () => {
      expect(SecurityValidator.validateSnoozeMinutes(10)).toBe(10);
      expect(SecurityValidator.validateSnoozeMinutes(-5, 10)).toBe(10);
      expect(SecurityValidator.validateSnoozeMinutes(99999)).toBe(1440); // Max 24 hours
    });
  });

  describe('6. Sensitive Credential Masking', () => {
    it('masks sensitive API keys in diagnostic/log contexts', () => {
      const masked = SecurityValidator.maskSensitiveString('sk-proj-1234567890abcdef');
      expect(masked).toBe('sk-p...cdef');
      expect(masked).not.toContain('1234567890');

      expect(SecurityValidator.maskSensitiveString('short')).toBe('********');
      expect(SecurityValidator.maskSensitiveString('')).toBe('');
      expect(SecurityValidator.maskSensitiveString(undefined)).toBe('');
    });
  });
});

