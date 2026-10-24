import { Storage } from "./storage";
import { AUTH_KEYS } from "@/constants";

// 简单的 cookie 读取工具（仅当前运行环境是浏览器时可用）
function getCookie(name: string): string {
  if (typeof document === "undefined") return "";
  const prefix = name + "=";
  const parts = document.cookie.split(";");
  for (const raw of parts) {
    const c = raw.trim();
    if (c.startsWith(prefix)) {
      return decodeURIComponent(c.substring(prefix.length));
    }
  }
  return "";
}

// 新增：删除 Cookie（尝试多种 domain/path 以最大概率覆盖后端写入方式）
function deleteCookie(name: string) {
  if (typeof document === "undefined") return;
  const expires = "Thu, 01 Jan 1970 00:00:00 GMT";
  const base = `${name}=; expires=${expires}; path=/`;
  // 基础删除
  document.cookie = base;
  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    if (host) {
      // 精确域名
      document.cookie = `${base}; domain=${host}`;
      // 顶级域（适用于后端可能设置 .example.com）
      const parts = host.split('.');
      if (parts.length > 2) {
        const topDomain = parts.slice(-2).join('.');
        document.cookie = `${base}; domain=.${topDomain}`;
      } else if (parts.length === 2) {
        document.cookie = `${base}; domain=.${host}`;
      }
    }
  }
}

// 负责本地凭证与偏好的读写
export const AuthStorage = {
  // 改为优先从 Sa-Token 写入的 cookie 中获取（satoken），无需再从本地存储拼接 Bearer
  getAccessToken(): string {
    const name = import.meta.env.VITE_APP_TOKEN_COOKIE_NAME || "satoken";
    const cookieToken = getCookie(name);
    if (cookieToken) return cookieToken;
    // 兼容旧逻辑（如果后端还同时返回并写入本地）
    const isRememberMe = Storage.get<boolean>(AUTH_KEYS.REMEMBER_ME, false);
    return isRememberMe
      ? Storage.get(AUTH_KEYS.ACCESS_TOKEN, "")
      : Storage.sessionGet(AUTH_KEYS.ACCESS_TOKEN, "");
  },

  getRefreshToken(): string {
    // RefreshToken 仍按原逻辑（如果后端依旧返回）
    const isRememberMe = Storage.get<boolean>(AUTH_KEYS.REMEMBER_ME, false);
    return isRememberMe
      ? Storage.get(AUTH_KEYS.REFRESH_TOKEN, "")
      : Storage.sessionGet(AUTH_KEYS.REFRESH_TOKEN, "");
  },

  setTokens(accessToken: string, refreshToken: string, rememberMe: boolean): void {
    // Sa-Token 的访问 token 已由后端通过 Set-Cookie 写入，这里仅维护 refreshToken & rememberMe
    Storage.set(AUTH_KEYS.REMEMBER_ME, rememberMe);
    if (rememberMe) {
      Storage.set(AUTH_KEYS.REFRESH_TOKEN, refreshToken);
    } else {
      Storage.sessionSet(AUTH_KEYS.REFRESH_TOKEN, refreshToken);
      Storage.remove(AUTH_KEYS.REFRESH_TOKEN); // 保证只存在 session 版本
    }
    // 旧的 accessToken 本地存储清理（防止残留）
    Storage.remove(AUTH_KEYS.ACCESS_TOKEN);
    Storage.sessionRemove(AUTH_KEYS.ACCESS_TOKEN);
  },

  clearAuth(): void {
    const name = import.meta.env.VITE_APP_TOKEN_COOKIE_NAME || "satoken";
    deleteCookie(name);
    Storage.remove(AUTH_KEYS.ACCESS_TOKEN);
    Storage.remove(AUTH_KEYS.REFRESH_TOKEN);
    Storage.sessionRemove(AUTH_KEYS.ACCESS_TOKEN);
    Storage.sessionRemove(AUTH_KEYS.REFRESH_TOKEN);
  },

  getRememberMe(): boolean {
    return Storage.get<boolean>(AUTH_KEYS.REMEMBER_ME, false);
  },
};
