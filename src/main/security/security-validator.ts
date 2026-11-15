/**
 * Mochi Desktop Companion — Security Validator & Sanitization Engine
 * 
 * Enforces strict input validation, prototype pollution defense,
 * SSRF mitigation for external API endpoints, and safe protocol verification.
 */

export class SecurityValidator {
  /**
   * Deeply sanitizes an object against prototype pollution attacks
   * by removing __proto__, constructor, and prototype properties.
   */
  public static sanitizeObject<T = any>(input: any): T {
    if (!input || typeof input !== 'object') {
      return input;
    }

    if (Array.isArray(input)) {
      return input.map((item) => this.sanitizeObject(item)) as unknown as T;
    }

    const clean: Record<string, any> = {};
    for (const key of Object.keys(input)) {
      if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
        continue;
      }
      clean[key] = this.sanitizeObject(input[key]);
    }
    return clean as T;
  }

  /**
   * Validates and clamps a coordinate to finite safe bounds.
   */
  public static validateCoordinate(val: any, fallback = 0, min = -10000, max = 10000): number {
    if (typeof val !== 'number' || !Number.isFinite(val)) {
      return fallback;
    }
    return Math.max(min, Math.min(max, Math.round(val)));
  }

  /**
   * Validates and clamps timer duration in seconds (1 sec to 24 hours).
   */
  public static validateTimerSeconds(seconds: any, fallback = 1500): number {
    const num = Number(seconds);
    if (!Number.isFinite(num) || num <= 0) {
      return fallback;
    }
    return Math.max(1, Math.min(86400, Math.floor(num)));
  }

  /**
   * Validates and clamps snooze minutes (1 min to 1440 min / 24 hours).
   */
  public static validateSnoozeMinutes(minutes: any, fallback = 10): number {
    const num = Number(minutes);
    if (!Number.isFinite(num) || num <= 0) {
      return fallback;
    }
    return Math.max(1, Math.min(1440, Math.floor(num)));
  }

  /**
   * Validates an external API endpoint to prevent Server-Side Request Forgery (SSRF).
   * - Must use HTTPS
   * - Must not target localhost, 127.0.0.1, private RFC-1918 subnets, or cloud metadata services.
   */
  public static validateEndpointUrl(urlStr: string): { valid: boolean; reason?: string } {
    if (!urlStr || typeof urlStr !== 'string') {
      return { valid: false, reason: 'Endpoint URL must be a non-empty string' };
    }

    try {
      const parsed = new URL(urlStr);
      if (parsed.protocol !== 'https:') {
        return { valid: false, reason: 'Security violation: API endpoint must use HTTPS' };
      }

      const host = parsed.hostname.toLowerCase();

      // Check loopback / localhost
      if (host === 'localhost' || host === '127.0.0.1' || host === '::1' || host === '0.0.0.0') {
        return { valid: false, reason: 'Security violation: Localhost / loopback endpoints are blocked' };
      }

      // Check Cloud metadata IP (AWS/GCP/Azure link-local: 169.254.169.254)
      if (host === '169.254.169.254' || host.startsWith('169.254.')) {
        return { valid: false, reason: 'Security violation: Cloud metadata endpoints are blocked' };
      }

      // Check RFC 1918 private IPv4 ranges (10.x.x.x, 192.168.x.x, 172.16.x.x - 172.31.x.x)
      if (host.startsWith('10.') || host.startsWith('192.168.')) {
        return { valid: false, reason: 'Security violation: Private network endpoints are blocked' };
      }

      if (host.startsWith('172.')) {
        const parts = host.split('.');
        const secondOctet = parseInt(parts[1], 10);
        if (secondOctet >= 16 && secondOctet <= 31) {
          return { valid: false, reason: 'Security violation: Private network endpoints are blocked' };
        }
      }

      return { valid: true };
    } catch {
      return { valid: false, reason: 'Malformed URL' };
    }
  }

  /**
   * Validates a local Ollama API endpoint.
   * Explicitly allows local loopback (localhost, 127.0.0.1, ::1) over HTTP or HTTPS.
   * Blocks cloud metadata services (169.254.x.x) and remote private subnets.
   */
  public static validateOllamaEndpoint(urlStr: string): { valid: boolean; reason?: string } {
    if (!urlStr || typeof urlStr !== 'string') {
      return { valid: false, reason: 'Endpoint URL must be a non-empty string' };
    }

    try {
      const parsed = new URL(urlStr);
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        return { valid: false, reason: 'Security violation: Ollama endpoint must use HTTP or HTTPS' };
      }

      const host = parsed.hostname.toLowerCase();

      // Check Cloud metadata IP (AWS/GCP/Azure link-local: 169.254.169.254)
      if (host === '169.254.169.254' || host.startsWith('169.254.')) {
        return { valid: false, reason: 'Security violation: Cloud metadata endpoints are blocked' };
      }

      // Explicitly allow local loopback
      if (host === 'localhost' || host === '127.0.0.1' || host === '::1') {
        return { valid: true };
      }

      // Block RFC 1918 remote private IPv4 ranges to prevent intranet scanning
      if (host.startsWith('10.') || host.startsWith('192.168.')) {
        return { valid: false, reason: 'Security violation: Remote private network endpoints are blocked' };
      }

      if (host.startsWith('172.')) {
        const parts = host.split('.');
        const secondOctet = parseInt(parts[1], 10);
        if (secondOctet >= 16 && secondOctet <= 31) {
          return { valid: false, reason: 'Security violation: Remote private network endpoints are blocked' };
        }
      }

      return { valid: true };
    } catch {
      return { valid: false, reason: 'Malformed URL' };
    }
  }

  /**
   * Validates an external URL for navigation or shell opening.
   * Only allows safe web protocols (https:, http:, mailto:).
   * Blocks dangerous protocols (javascript:, file:, data:, vbscript:, shell:, etc.)
   */
  public static validateExternalUrl(urlStr: string): { allow: boolean; openExternally: boolean; reason?: string } {
    if (!urlStr || typeof urlStr !== 'string') {
      return { allow: false, openExternally: false, reason: 'Invalid URL string' };
    }

    try {
      const parsed = new URL(urlStr);
      const protocol = parsed.protocol.toLowerCase();

      // Block dangerous execution or filesystem protocols
      const dangerousProtocols = ['javascript:', 'file:', 'data:', 'vbscript:', 'shell:', 'powershell:'];
      if (dangerousProtocols.includes(protocol)) {
        return {
          allow: false,
          openExternally: false,
          reason: `Security violation: Protocol "${protocol}" is strictly prohibited`,
        };
      }

      if (['https:', 'http:', 'mailto:'].includes(protocol)) {
        return { allow: true, openExternally: true };
      }

      return { allow: false, openExternally: false, reason: `Protocol "${protocol}" not permitted` };
    } catch {
      return { allow: false, openExternally: false, reason: 'Malformed URL' };
    }
  }

  /**
   * Validates Content Security Policy directives to ensure compliance with Electron security guidelines.
   */
  public static validateCspDirectives(cspString: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    if (!cspString || typeof cspString !== 'string') {
      return { valid: false, errors: ['CSP string is missing or empty'] };
    }

    if (!cspString.includes("default-src 'self'")) {
      errors.push("CSP must contain \"default-src 'self'\"");
    }

    if (cspString.includes("'unsafe-eval'")) {
      errors.push("CSP must not contain \"'unsafe-eval'\" (prevents code injection / eval)");
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Safely masks an API key for logs or diagnostics without leaking cleartext credentials.
   */
  public static maskSensitiveString(str?: string): string {
    if (!str || typeof str !== 'string') return '';
    if (str.length <= 8) return '********';
    return `${str.slice(0, 4)}...${str.slice(-4)}`;
  }
}

