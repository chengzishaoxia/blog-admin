// 博客轮播图 API
import request from '@/utils/request';

const BLOG_CAROUSEL_BASE_URL = '/api/v1/blog/carousels';

// 分页查询参数（预留扩展，例如 status 等）
export interface BlogCarouselPageQuery extends PageQuery {}

// 轮播图 VO
export interface BlogCarouselVO {
  id: number | string;
  fileId: number | string;
  fileUrl?: string;
  createTime?: string;
  updateTime?: string;
}

// 表单
export interface BlogCarouselForm {
  fileId: number | string;
}

const BlogCarouselAPI = {
  // 分页列表
  getPage(query: BlogCarouselPageQuery) {
    return request<any, PageResult<BlogCarouselVO[]>>({
      url: `${BLOG_CAROUSEL_BASE_URL}/page`,
      method: 'post',
      data: query,
    });
  },
  // 新增
  create(form: BlogCarouselForm) {
    return request({
      url: BLOG_CAROUSEL_BASE_URL,
      method: 'post',
      data: form,
    });
  },
  // 更新
  update(id: number | string, form: BlogCarouselForm) {
    return request({
      url: `${BLOG_CAROUSEL_BASE_URL}/${id}`,
      method: 'put',
      data: form,
    });
  },
  // 删除
  delete(id: number | string) {
    return request({
      url: `${BLOG_CAROUSEL_BASE_URL}/${id}`,
      method: 'delete',
    });
  }
};

export default BlogCarouselAPI;

