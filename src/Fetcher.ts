import { JSDOM } from "jsdom";
import TurndownService from "turndown";
import { RequestPayload } from "./types.js";

export class Fetcher {
  private static isPrivateIP(ip: string): boolean {
    // IPv4 private ranges
    const ipv4Regex = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
    const match = ip.match(ipv4Regex);
    
    if (match) {
      const [, a, b, c, d] = match.map(Number);
      
      // Check if it's a valid IPv4 address
      if (a > 255 || b > 255 || c > 255 || d > 255) return false;
      
      // Private IPv4 ranges:
      // 10.0.0.0/8 (10.0.0.0 to 10.255.255.255)
      if (a === 10) return true;
      
      // 172.16.0.0/12 (172.16.0.0 to 172.31.255.255)
      if (a === 172 && b >= 16 && b <= 31) return true;
      
      // 192.168.0.0/16 (192.168.0.0 to 192.168.255.255)
      if (a === 192 && b === 168) return true;
      
      // Loopback (127.0.0.0/8)
      if (a === 127) return true;
      
      // Link-local (169.254.0.0/16)
      if (a === 169 && b === 254) return true;
      
      return false;
    }
    
    // IPv6 private ranges (simplified check)
    if (ip.includes(':')) {
      const lowerIP = ip.toLowerCase();
      // Loopback
      if (lowerIP === '::1') return true;
      // Link-local (fe80::/10)
      if (lowerIP.startsWith('fe80:')) return true;
      // Unique local (fc00::/7)
      if (lowerIP.startsWith('fc') || lowerIP.startsWith('fd')) return true;
      // Private use (::1/128)
      if (lowerIP.startsWith('::1')) return true;
    }
    
    return false;
  }

  private static async isPrivateUrl(url: string): Promise<boolean> {
    try {
      const urlObj = new URL(url);
      const hostname = urlObj.hostname;
      
      // Check if hostname is already an IP
      if (this.isPrivateIP(hostname)) {
        return true;
      }
      
      // Check for localhost variants
      if (hostname === 'localhost' || hostname.endsWith('.localhost')) {
        return true;
      }
      
      // Resolve hostname to IP (using Node.js dns module would be better, but this is simpler)
      // For now, we'll just check common private hostnames
      const privateHostnames = [
        'localhost',
        '127.0.0.1',
        '::1',
        'local',
        'internal'
      ];
      
      if (privateHostnames.some(ph => hostname.includes(ph))) {
        return true;
      }
      
      return false;
    } catch {
      // If URL parsing fails, be conservative and block it
      return true;
    }
  }

  private static applyLengthLimits(text: string, maxLength: number, startIndex: number): string {
    if (startIndex >= text.length) {
      return "";
    }
    
    const end = Math.min(startIndex + maxLength, text.length);
    return text.substring(startIndex, end);
  }
  private static async _fetch({
    url,
    headers,
  }: RequestPayload): Promise<Response> {
    try {
      if (await this.isPrivateUrl(url)) {
        throw new Error(
          `Fetcher blocked an attempt to fetch a private IP ${url}. This is to prevent a security vulnerability where a local MCP could fetch privileged local IPs and exfiltrate data.`,
        );
      }
      const response = await fetch(url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          ...headers,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`);
      }
      return response;
    } catch (e: unknown) {
      if (e instanceof Error) {
        throw new Error(`Failed to fetch ${url}: ${e.message}`);
      } else {
        throw new Error(`Failed to fetch ${url}: Unknown error`);
      }
    }
  }

  static async html(requestPayload: RequestPayload) {
    try {
      const response = await this._fetch(requestPayload);
      let html = await response.text();
      
      // Apply length limits
      html = this.applyLengthLimits(
        html, 
        requestPayload.max_length ?? 5000, 
        requestPayload.start_index ?? 0
      );
      
      return { content: [{ type: "text", text: html }], isError: false };
    } catch (error) {
      return {
        content: [{ type: "text", text: (error as Error).message }],
        isError: true,
      };
    }
  }

  static async json(requestPayload: RequestPayload) {
    try {
      const response = await this._fetch(requestPayload);
      const json = await response.json();
      let jsonString = JSON.stringify(json);
      
      // Apply length limits
      jsonString = this.applyLengthLimits(
        jsonString,
        requestPayload.max_length ?? 5000,
        requestPayload.start_index ?? 0
      );
      
      return {
        content: [{ type: "text", text: jsonString }],
        isError: false,
      };
    } catch (error) {
      return {
        content: [{ type: "text", text: (error as Error).message }],
        isError: true,
      };
    }
  }

  static async txt(requestPayload: RequestPayload) {
    try {
      const response = await this._fetch(requestPayload);
      const html = await response.text();

      const dom = new JSDOM(html);
      const document = dom.window.document;

      const scripts = document.getElementsByTagName("script");
      const styles = document.getElementsByTagName("style");
      Array.from(scripts).forEach((script) => script.remove());
      Array.from(styles).forEach((style) => style.remove());

      const text = document.body.textContent || "";
      let normalizedText = text.replace(/\s+/g, " ").trim();
      
      // Apply length limits
      normalizedText = this.applyLengthLimits(
        normalizedText,
        requestPayload.max_length ?? 5000,
        requestPayload.start_index ?? 0
      );

      return {
        content: [{ type: "text", text: normalizedText }],
        isError: false,
      };
    } catch (error) {
      return {
        content: [{ type: "text", text: (error as Error).message }],
        isError: true,
      };
    }
  }

  static async markdown(requestPayload: RequestPayload) {
    try {
      const response = await this._fetch(requestPayload);
      const html = await response.text();
      const turndownService = new TurndownService();
      let markdown = turndownService.turndown(html);
      
      // Apply length limits
      markdown = this.applyLengthLimits(
        markdown,
        requestPayload.max_length ?? 5000,
        requestPayload.start_index ?? 0
      );
      
      return { content: [{ type: "text", text: markdown }], isError: false };
    } catch (error) {
      return {
        content: [{ type: "text", text: (error as Error).message }],
        isError: true,
      };
    }
  }
}
