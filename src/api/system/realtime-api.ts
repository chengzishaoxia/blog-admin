import request from "@/utils/request";

const REALTIME_BASE_URL = "/api/v1/realtime/connections";

const RealtimeAPI = {
  getSummary() {
    return request<any, RealtimeSummaryVO>({
      url: `${REALTIME_BASE_URL}/summary`,
      method: "get",
    });
  },
  getPage(queryParams: RealtimeConnectionPageQuery) {
    return request<any, PageResult<RealtimeConnectionPageVO[]>>({
      url: `${REALTIME_BASE_URL}/page`,
      method: "get",
      params: queryParams,
    });
  },
  getDetail(connectionId: string) {
    return request<any, RealtimeConnectionDetailVO>({
      url: `${REALTIME_BASE_URL}/${connectionId}`,
      method: "get",
    });
  },
  disconnect(connectionId: string, reason?: string) {
    return request<any, boolean>({
      url: `${REALTIME_BASE_URL}/${connectionId}/disconnect`,
      method: "post",
      data: { reason },
    });
  },
  banChat(connectionId: string, reason?: string) {
    return request<any, boolean>({
      url: `${REALTIME_BASE_URL}/${connectionId}/chat-ban`,
      method: "post",
      data: { reason },
    });
  },
  unbanChat(connectionId: string) {
    return request<any, boolean>({
      url: `${REALTIME_BASE_URL}/${connectionId}/chat-ban`,
      method: "delete",
    });
  },
};

export default RealtimeAPI;

export interface RealtimeSummaryVO {
  onlineUserCount: number;
  connectionCount: number;
  adminConnectionCount: number;
  chatConnectionCount: number;
}

export interface RealtimeConnectionPageQuery extends PageQuery {
  keyword?: string;
  channelType?: string;
}

export interface RealtimeConnectionPageVO {
  connectionId: string;
  userId: number;
  username?: string;
  nickname?: string;
  avatar?: string;
  channelType: string;
  path?: string;
  remoteAddress?: string;
  connectedAt: number;
  lastSeenAt: number;
  subscriptions?: string[];
  chatBanned: boolean;
  chatBanReason?: string;
}

export interface RealtimeConnectionDetailVO extends RealtimeConnectionPageVO {}