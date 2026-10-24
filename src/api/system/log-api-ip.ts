import request from "@/utils/request";

// 建议后端对应的 Controller 路径为 /api/v1/visit-logs
const VISIT_LOG_BASE_URL = "/api/v1/visit-logs";

const VisitLogAPI = {
  /** * 获取访问日志分页列表 
   * 对应数据库表 blog_visit_log
   */
  getPage(queryParams: VisitLogPageQuery) {
    return request<any, PageResult<VisitLogVO[]>>({
      url: `${VISIT_LOG_BASE_URL}/page`,
      method: "get",
      params: queryParams,
    });
  },

  /** * 根据 ID 删除访问记录
   */
  delete(id: string | number) {
    return request({
      url: `${VISIT_LOG_BASE_URL}/${id}`,
      method: "delete",
    });
  },

  /** * 清空所有访问日志 (可选)
   */
  clear() {
    return request({
      url: `${VISIT_LOG_BASE_URL}/clear`,
      method: "delete",
    });
  }
};

export default VisitLogAPI;

/** 访问日志分页查询参数 */
export interface VisitLogPageQuery extends PageQuery {
  /** 访客 IP 地址 */
  ipAddress?: string;
  /** 访问日期范围 [开始日期, 结束日期] */
  visitDateRange?: [string, string];
}

/** 访问日志视图对象 (对应数据库 blog_visit_log 字段) */
export interface VisitLogVO {
  /** 主键 ID */
  id: string;
  /** 访客 IP 地址 */
  ipAddress: string;
  /** 访问日期 (yyyy-MM-dd) */
  visitDate: string;
  /** 记录创建时间 */
  createTime: string;
}