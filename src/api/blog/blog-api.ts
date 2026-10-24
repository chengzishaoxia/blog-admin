import request from "@/utils/request";

const CONFIG_BASE_URL = "/api/v1/blog";

// 博客文章基础路径
const BLOG_POST_BASE_URL = `${CONFIG_BASE_URL}/posts`;

// 博客文章分页查询参数
export interface BlogPostPageQuery extends PageQuery {
  /** 关键字(标题) */
  keywords?: string;
  /** 状态 0-草稿 1-已发布 */
  status?: number;
  /** 标签ID */
  tagId?: number | string;
}

// 标签VO (简化)
export interface BlogTagVO {
  /** 标签ID */
  id: number | string; // 以前是可选，改为必填以避免在模板中出现 undefined 类型导致 :value 报错
  /** 标签名称 */
  name?: string;
  /** 排序 */
  sort?: number;
  /** 状态 1-启用 0-停用 */
  status?: number;
  /** 关联文章数量 */
  postCount?: number;
  /** 创建时间 */
  createTime?: string;
}

// 新增：标签分页查询参数
export interface BlogTagPageQuery extends PageQuery {
  /** 关键字(标签名称) */
  keywords?: string;
  /** 状态 1-启用 0-停用 */
  status?: number;
}

// 新增：标签表单
export interface BlogTagForm {
  id?: number | string;
  /** 标签名称 */
  name: string;
  /** 排序 */
  sort?: number;
  /** 状态 1-启用 0-停用 */
  status?: number;
}

export interface BlogFriendLinkVO {
  id?: number | string;
  name?: string;
  url?: string;
  avatar?: string;
  description?: string;
  sort?: number;
  status?: number;
  createTime?: string;
  updateTime?: string;
}

export interface BlogFriendLinkPageQuery extends PageQuery {
  keywords?: string;
  status?: number;
}

export interface BlogFriendLinkForm {
  id?: number | string;
  name: string;
  url: string;
  avatar?: string;
  description?: string;
  sort?: number;
  status?: number;
}

export interface BlogMessageVO {
  id?: number | string;
  userId?: number | string;
  nickname?: string;
  submitIp?: string;
  ipRegion?: string;
  avatar?: string;
  content?: string;
  auditStatus?: number;
  auditBy?: number | string;
  auditByName?: string;
  auditRemark?: string;
  auditTime?: string;
  createTime?: string;
}

export interface BlogMessagePageQuery extends PageQuery {
  keywords?: string;
  auditStatus?: number;
}

export interface BlogMessageAuditForm {
  auditStatus: number;
  auditRemark?: string;
}

// 博客文章分页VO
export interface BlogPostPageVO {
  /** 文章ID */
  id?: number | string;
  /** 标题 */
  title?: string;
  /** 摘要 */
  summary?: string;
  /** 内容 */
  content?: string;
  /** 封面图 URL（后端仍返回该字段） */
  coverImage?: string;
  /** 封面图文件ID（新提交字段） */
  coverImageFileId?: number | string;
  /** 作者ID */
  authorId?: number | string;
  /** 浏览量 */
  viewCount?: number;
  /** 置顶 0-否 1-是 */
  pinned?: number; // 新增字段
  /** 推荐 0-否 1-是 */
  isRecommend?: number;
  /** 状态 0-草稿 1-已发布 */
  status?: number;
  /** 创建时间 */
  createTime?: string;
  /** 更新时间 */
  updateTime?: string;
  /** 标签集合 */
  tags?: BlogTagVO[];
}

/** 博客文章表单 */
export interface BlogPostForm {
  id?: number | string;
  title: string;
  summary?: string;
  content: string;
  /** 提交使用的文件ID */
  coverImageFileId?: number | string;
  /** 前端仅用于回显，不要传给后端（提交时自动剔除） */
  coverImage?: string;
  /** 置顶 0-否 1-是 */
  pinned?: number; // 新增字段
  /** 推荐 0-否 1-是 */
  isRecommend?: number;
  status: number; // 0 草稿 1 已发布
  tagIds?: Array<number | string>;
}

// 博客文章VO
export interface BlogPostVO extends BlogPostPageVO {
  /** 文章ID */
  id?: number | string;
  /** 标题 */
  title?: string;
  /** 摘要 */
  summary?: string;
  /** 内容 */
  content?: string;
  /** 封面图 URL（后端仍返回该字段） */
  coverImage?: string;
  /** 封面图文件ID（新提交字段） */
  coverImageFileId?: number | string;
  /** 作者ID */
  authorId?: number | string;
  /** 浏览量 */
  viewCount?: number;
  /** 置顶 0-否 1-是 */
  pinned?: number; // 新增字段
  /** 推荐 0-否 1-是 */
  isRecommend?: number;
  /** 状态 0-草稿 1-已发布 */
  status?: number;
  /** 创建时间 */
  createTime?: string;
  /** 更新时间 */
  updateTime?: string;
  /** 标签集合 */
  tags?: BlogTagVO[];
}

/** 博客文章 API */
const BlogPostAPI = {
  /** 获取文章分页数据 */
  getPage(queryParams: BlogPostPageQuery) {
    return request<any, PageResult<BlogPostPageVO[]>>({
      url: `${BLOG_POST_BASE_URL}/manage/page`,
      method: "post",
      data: queryParams,
    });
  },
  /** 获取文章表单数据（编辑使用） */
  getFormData(id: number | string) {
    return request<any, BlogPostForm>({
      url: `${BLOG_POST_BASE_URL}/${id}/form`,
      method: "get",
    });
  },
  /** 新增文章 */
  create(data: BlogPostForm) {
    const { coverImage, ...payload } = data; // 移除不需要的字段
    return request({
      url: `${BLOG_POST_BASE_URL}`,
      method: "post",
      data: payload,
    });
  },
  /** 更新文章 */
  update(id: number | string, data: BlogPostForm) {
    const { coverImage, ...payload } = data; // 移除不需要的字段
    return request({
      url: `${BLOG_POST_BASE_URL}/${id}`,
      method: "put",
      data: payload,
    });
  },
  /** 获取文章详情(不增加访问量) */
  getDetail(id: number | string) {
    return request<any, BlogPostVO>({
      url: `${BLOG_POST_BASE_URL}/${id}/detail`,
      method: "get",
    });
  },
  /** 新增/更新文章（合并接口） */
  upsert(data: BlogPostForm) {
    const { coverImage, ...payload } = data; // 移除不需要的字段
    return request({
      url: `${BLOG_POST_BASE_URL}/upsert`,
      method: 'post',
      data: payload,
    });
  },
  /** 删除文章 */
  delete(id: number | string) {
    return request({
      url: `${BLOG_POST_BASE_URL}/${id}`,
      method: "delete"
    });
  },
};

// 新增：博客标签 API (分页 + CRUD)
const BLOG_TAG_BASE_URL = `${CONFIG_BASE_URL}/tags`;
export const BlogTagAPI = {
  /** 标签分页列表 */
  getPage(query: BlogTagPageQuery) {
    return request<any, PageResult<BlogTagVO[]>>({
      url: `${BLOG_TAG_BASE_URL}/manage/page`,
      method: 'post',
      data: query
    });
  },
  /** 新增标签 */
  create(data: BlogTagForm) {
    return request({ url: `${BLOG_TAG_BASE_URL}` , method: 'post', data });
  },
  /** 修改标签 */
  update(id: number | string, data: BlogTagForm) {
    return request({ url: `${BLOG_TAG_BASE_URL}/${id}` , method: 'put', data });
  },
  /** 删除标签 */
  delete(id: number | string) {
    return request({ url: `${BLOG_TAG_BASE_URL}/${id}` , method: 'delete' });
  }
};

const BLOG_FRIEND_LINK_BASE_URL = `${CONFIG_BASE_URL}/friend-links`;
export const BlogFriendLinkAPI = {
  getPage(query: BlogFriendLinkPageQuery) {
    return request<any, PageResult<BlogFriendLinkVO[]>>({
      url: `${BLOG_FRIEND_LINK_BASE_URL}/page`,
      method: 'post',
      data: query
    });
  },
  create(data: BlogFriendLinkForm) {
    return request({ url: `${BLOG_FRIEND_LINK_BASE_URL}`, method: 'post', data });
  },
  update(id: number | string, data: BlogFriendLinkForm) {
    return request({ url: `${BLOG_FRIEND_LINK_BASE_URL}/${id}`, method: 'put', data });
  },
  delete(id: number | string) {
    return request({ url: `${BLOG_FRIEND_LINK_BASE_URL}/${id}`, method: 'delete' });
  }
};

const BLOG_MESSAGE_BASE_URL = `${CONFIG_BASE_URL}/messages`;
export const BlogMessageAPI = {
  getPage(query: BlogMessagePageQuery) {
    return request<any, PageResult<BlogMessageVO[]>>({
      url: `${BLOG_MESSAGE_BASE_URL}/page`,
      method: "post",
      data: query,
    });
  },
  audit(id: number | string, data: BlogMessageAuditForm) {
    return request({
      url: `${BLOG_MESSAGE_BASE_URL}/${id}/audit`,
      method: "patch",
      data,
    });
  },
  delete(id: number | string) {
    return request({
      url: `${BLOG_MESSAGE_BASE_URL}/${id}`,
      method: "delete",
    });
  },
};

// 博客标签列表（用于写文章页选择） -> 适配分页接口，一次性拉取启用标签
export async function getTagList() {
  const page = await BlogTagAPI.getPage({ pageNum: 1, pageSize: 1000, status: 1 });
  return page.list || [];
}


export default BlogPostAPI;
