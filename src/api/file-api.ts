import request from "@/utils/request";

const FILE_BASE_URL = "/api/v1/files";

const FileAPI = {
  /** 上传文件 （传入 FormData，上传进度回调） */
  upload(formData: FormData, onProgress?: (percent: number) => void, usageType?: string) {
    // 若外部未附加 usageType 也可以在这里补充
    if (usageType && !formData.has('usageType')) {
      formData.append('usageType', usageType);
    }
    return request<any, FileInfo>({
      url: FILE_BASE_URL,
      method: "post",
      data: formData,
      headers: { "Content-Type": "multipart/form-data" },
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total) {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress?.(percent);
        }
      },
    });
  },

  /** 上传文件（传入 File） */
  uploadFile(file: File, usageType?: string) {
    const formData = new FormData();
    formData.append("file", file);
    if (usageType) formData.append('usageType', usageType);
    return request<any, FileInfo>({
      url: FILE_BASE_URL,
      method: "post",
      data: formData,
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  /** 旧接口兼容: 通过 filePath 删除（不删除数据库记录，仅物理文件） */
  delete(filePath?: string) {
    return request({
      url: FILE_BASE_URL,
      method: "delete",
      params: { filePath },
    });
  },
  // 新接口: 删除记录通过路径（保持与 deleteByPath 一致）
  deleteByPath(filePath?: string) {
    return request({
      url: FILE_BASE_URL,
      method: "delete",
      params: { filePath },
    });
  },
  /** 分页查询文件信息 */
  getPage(query: FilePageQuery) {
    return request<any, PageResult<FilePageVO[]>>({
      url: `${FILE_BASE_URL}/page`,
      method: "post",
      data: query,
    });
  },
  /** 获取文件详情 */
  getDetail(id: number | string) {
    return request<any, FilePageVO>({
      url: `${FILE_BASE_URL}/${id}`,
      method: "get",
    });
  },
  /** 更新文件信息 */
  update(id: number | string, form: FileUpdateForm) {
    return request({
      url: `${FILE_BASE_URL}/${id}`,
      method: "put",
      data: form,
    });
  },
  /** 删除单个文件记录 */
  deleteById(id: number | string) {
    return request({
      url: `${FILE_BASE_URL}/${id}`,
      method: "delete",
    });
  },
  /** 批量删除文件记录 */
  deleteBatch(ids: Array<number | string>) {
    return request({
      url: `${FILE_BASE_URL}/batch`,
      method: "delete",
      data: ids,
    });
  },
  /** 下载文件 (记录下载日志: POST /download { fileName }) */
  download(url: string, fileName?: string) {
    const inferredName = fileName || url.split('/').pop()?.split('?')[0];
    if (inferredName) {
      // 新后端接口: POST /api/v1/files/download  body:{ fileName }
      request({
        url: `${FILE_BASE_URL}/download`,
        method: 'post',
        data: { fileName: inferredName },
      }).catch(() => { /* 忽略日志记录失败 */ });
    }

    return request({
      url,
      method: "get",
      responseType: "blob",
    }).then((res) => {
      const blob = new Blob([res.data]);
      const a = document.createElement("a");
      const urlObject = window.URL.createObjectURL(blob);
      a.href = urlObject;
      a.download = inferredName || "下载文件";
      a.click();
      window.URL.revokeObjectURL(urlObject);
    });
  },
};

export default FileAPI;

export interface FileInfo {
  /** 文件ID */
  id?: number | string;
  /** 原始文件名称 */
  name: string;
  /** 文件访问 URL */
  url: string;
  /** 文件用途类型 */
  usageType?: string;
  /** 文件大小（字节） */
  size?: number;
  /** 内容类型(Content-Type) */
  contentType?: string;
  /** 上传者用户ID */
  uploaderUserId?: number | string;
}

/** 文件分页查询参数 */
export interface FilePageQuery extends PageQuery {
  keywords?: string; // 名称模糊匹配
  usageType?: string; // 用途类型
  uploaderUserId?: number | string; // 上传者ID
  startTime?: string; // 创建时间开始 (yyyy-MM-dd HH:mm:ss)
  endTime?: string; // 创建时间结束
  onlyImages?: boolean; // 是否仅图片
}

/** 文件分页 VO */
export interface FilePageVO {
  id: number | string;
  name: string;
  url: string;
  usageType?: string;
  size?: number;
  contentType?: string;
  uploaderUserId?: number | string;
  uploaderUsername?: string; // 新增: 上传者用户名
  createTime?: string;
  updateTime?: string;
}

/** 文件更新表单 */
export interface FileUpdateForm {
  name?: string;
  usageType?: string;
}

/** 文件用途类型枚举前端列表 */
export const FILE_USAGE_TYPES: string[] = [
  "AVATAR",
  "EMOJI",
  "BLOG_COVER",
  "CAROUSEL",
  "SITE_CONFIG",
  "OTHER",
];
