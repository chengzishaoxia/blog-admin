import axios, { type InternalAxiosRequestConfig, type AxiosResponse } from "axios";
import qs from "qs";
import { useUserStoreHook } from "@/store/modules/user-store";
import { ApiCodeEnum } from "@/enums/api/code-enum";
import router from "@/router";

/**
 * 创建 HTTP 请求实例
 */
const httpRequest = axios.create({
  // baseURL 使用空串，原因：各 API 模块的 url 已包含完整前缀 /api/v1/xxx，避免 baseURL=/api 与 url=/api/v1 重复形成 /api/api/v1
  baseURL: "",
  timeout: 50000,
  headers: { "Content-Type": "application/json;charset=utf-8" },
  paramsSerializer: (params) => qs.stringify(params),
});

/**
 * 请求拦截器 - 设置通用头（Cookie 自动携带 Sa-Token）
 */
httpRequest.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    config.headers.systemType = "admin";
    if (config.headers.Authorization) delete config.headers.Authorization; // 彻底移除
    return config;
  },
  (error) => Promise.reject(error)
);

/**
 * 响应拦截器 - 统一处理响应和错误
 */
httpRequest.interceptors.response.use(
  (response: AxiosResponse<ApiResponse>) => {
    // 如果响应是二进制流，则直接返回（用于文件下载、Excel 导出等）
    if (response.config.responseType === "blob") {
      return response;
    }

    const { code, data, msg } = response.data;

    // 请求成功
    if (code === ApiCodeEnum.SUCCESS) {
      return data;
    }

    // 业务错误
    ElMessage.error(msg || "系统出错");
    return Promise.reject(new Error(msg || "Business Error"));
  },
  async (error) => {
    console.error("Response interceptor error:", error);

    const { config, response } = error;

    // 网络错误或服务器无响应
    if (!response) {
      ElMessage.error("网络连接失败，请检查网络设置");
      return Promise.reject(error);
    }

    const { code, msg } = response.data as ApiResponse;

    switch (code) {
      case ApiCodeEnum.ACCESS_TOKEN_INVALID:
        // Access Token 过期，尝试刷新
        return refreshTokenAndRetry(config);

      case ApiCodeEnum.REFRESH_TOKEN_INVALID:
        // Refresh Token 过期，跳转登录页
        await redirectToLogin("登录已过期，请重新登录");
        return Promise.reject(new Error(msg || "Refresh Token Invalid"));

      default:
        ElMessage.error(msg || "请求失败");
        return Promise.reject(new Error(msg || "Request Error"));
    }
  }
);

/**
 * 重试请求的回调函数类型
 */
type RetryCallback = () => void;

// Token 刷新相关状态
let isRefreshingToken = false;
const pendingRequests: RetryCallback[] = [];

/**
 * 刷新 Token 并重试请求
 */
async function refreshTokenAndRetry(config: InternalAxiosRequestConfig): Promise<any> {
  return new Promise((resolve, reject) => {
    // 封装需要重试的请求
    const retryRequest = () => {
      // 不再设置 Authorization 头，直接重试（cookie 已更新）
      httpRequest(config).then(resolve).catch(reject);
    };

    // 将请求加入等待队列
    pendingRequests.push(retryRequest);

    // 如果没有正在刷新，则开始刷新流程
    if (!isRefreshingToken) {
      isRefreshingToken = true;

      useUserStoreHook()
        .refreshToken()
        .then(() => {
          // 刷新成功，重试所有等待的请求
          pendingRequests.splice(0).forEach((cb) => cb());
        })
        .catch(async () => {
          // 刷新失败，清空队列并跳转登录页
          pendingRequests.length = 0;
          await redirectToLogin("登录状态已失效，请重新登录");
          // 拒绝所有等待的请求
          reject(new Error("Token refresh failed"));
        })
        .finally(() => {
          isRefreshingToken = false;
        });
    }
  });
}

/**
 * 重定向到登录页面
 */
async function redirectToLogin(message: string = "请重新登录"): Promise<void> {
  try {
    ElNotification({
      title: "提示",
      message,
      type: "warning",
      duration: 3000,
    });

    await useUserStoreHook().resetAllState();

    // 跳转到登录页，保留当前路由用于登录后跳转
    const currentPath = router.currentRoute.value.fullPath;
    await router.push(`/login?redirect=${encodeURIComponent(currentPath)}`);
  } catch (error) {
    console.error("Redirect to login error:", error);
  }
}

export default httpRequest;
