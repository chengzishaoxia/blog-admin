<template>
  <div class="app-container">
    <div class="search-container">
      <el-form :model="queryParams" :inline="true">
        <el-form-item label="关键字">
          <el-input v-model="queryParams.keyword" placeholder="用户名 / 昵称 / IP / 路径" clearable />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="search" @click="handleQuery">搜索</el-button>
          <el-button icon="refresh" @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <el-row :gutter="10" class="mb-4">
      <el-col :xs="24" :sm="8">
        <el-card shadow="hover">
          <div class="text-sm text-gray-500">在线用户</div>
          <div class="mt-3 text-2xl font-bold">{{ summary.onlineUserCount }}</div>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="8">
        <el-card shadow="hover">
          <div class="text-sm text-gray-500">连接总数</div>
          <div class="mt-3 text-2xl font-bold">{{ summary.connectionCount }}</div>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="8">
        <el-card shadow="hover">
          <div class="text-sm text-gray-500">{{ currentCountLabel }}</div>
          <div class="mt-3 text-2xl font-bold">{{ currentConnectionCount }}</div>
        </el-card>
      </el-col>
    </el-row>

    <el-card shadow="hover" class="data-table">
      <el-table v-loading="loading" :data="pageData" border>
        <el-table-column label="用户" min-width="180">
          <template #default="scope">
            <div class="flex items-center gap-3">
              <el-avatar :src="scope.row.avatar" :size="32">{{ scope.row.nickname?.slice(0, 1) }}</el-avatar>
              <div>
                <div class="font-semibold">{{ scope.row.nickname || scope.row.username }}</div>
                <div class="text-xs text-gray-500">{{ scope.row.username }}</div>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="路径" prop="path" min-width="160" />
        <el-table-column v-if="mode === 'CHAT'" label="状态" width="120">
          <template #default="scope">
            <el-tag v-if="scope.row.chatBanned" type="danger">已封禁</el-tag>
            <el-tag v-else type="success">可发言</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="订阅" min-width="180">
          <template #default="scope">
            <el-tag
              v-for="item in scope.row.subscriptions || []"
              :key="item"
              size="small"
              class="mr-2 mb-1"
            >
              {{ item }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="远端地址" prop="remoteAddress" min-width="180" />
        <el-table-column label="连接时间" width="180">
          <template #default="scope">
            {{ formatTime(scope.row.connectedAt) }}
          </template>
        </el-table-column>
        <el-table-column label="最近活跃" width="180">
          <template #default="scope">
            {{ formatTime(scope.row.lastSeenAt) }}
          </template>
        </el-table-column>
        <el-table-column v-if="allowBan" label="操作" width="120" fixed="right">
          <template #default="scope">
            <el-button
              v-if="!scope.row.chatBanned"
              v-hasPerm="'sys:chat:ban'"
              type="danger"
              link
              @click="handleOpenBan(scope.row)"
            >
              封禁
            </el-button>
            <el-button
              v-else
              v-hasPerm="'sys:chat:ban'"
              type="success"
              link
              @click="handleUnban(scope.row)"
            >
              解禁
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <pagination
        v-if="total > 0"
        v-model:total="total"
        v-model:page="queryParams.pageNum"
        v-model:limit="queryParams.pageSize"
        @pagination="fetchData"
      />
    </el-card>

    <el-dialog v-model="banDialog.visible" title="封禁聊天室发言" width="520px">
      <el-form label-width="100px">
        <el-form-item label="目标用户">
          <div class="text-sm leading-6">
            <div>{{ banDialog.target?.nickname || banDialog.target?.username }}</div>
            <div class="text-gray-500">{{ banDialog.target?.connectionId }}</div>
          </div>
        </el-form-item>
        <el-form-item label="封禁原因">
          <el-input
            v-model="banDialog.reason"
            type="textarea"
            :rows="4"
            maxlength="120"
            show-word-limit
            placeholder="请输入封禁原因，聊天室内会收到说明"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="banDialog.visible = false">取消</el-button>
        <el-button type="danger" :loading="banDialog.submitting" @click="handleBanConfirm">
          确认封禁
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import RealtimeAPI, {
  type RealtimeConnectionPageQuery,
  type RealtimeConnectionPageVO,
  type RealtimeSummaryVO,
} from "@/api/system/realtime-api";

const props = defineProps<{
  mode: "ALL" | "CHAT";
  allowBan?: boolean;
}>();

const allowBan = computed(() => Boolean(props.allowBan));
const loading = ref(false);
const total = ref(0);
const pageData = ref<RealtimeConnectionPageVO[]>([]);
const summary = ref<RealtimeSummaryVO>({
  onlineUserCount: 0,
  connectionCount: 0,
  adminConnectionCount: 0,
  chatConnectionCount: 0,
});
const banDialog = reactive<{
  visible: boolean;
  submitting: boolean;
  reason: string;
  target: RealtimeConnectionPageVO | null;
}>({
  visible: false,
  submitting: false,
  reason: "",
  target: null,
});

const queryParams = reactive<RealtimeConnectionPageQuery>({
  pageNum: 1,
  pageSize: 10,
  keyword: "",
  channelType: props.mode === "ALL" ? "" : props.mode,
});

const currentCountLabel = computed(() => props.mode === "ALL" ? "全部连接" : "聊天室连接");
const currentConnectionCount = computed(() => props.mode === "ALL" ? summary.value.connectionCount : summary.value.chatConnectionCount);

function formatTime(value: number) {
  if (!value) {
    return "--";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "--";
  }
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hour = String(date.getHours()).padStart(2, "0");
  const minute = String(date.getMinutes()).padStart(2, "0");
  const second = String(date.getSeconds()).padStart(2, "0");
  return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
}

function fetchData() {
  loading.value = true;
  Promise.all([RealtimeAPI.getPage(queryParams), RealtimeAPI.getSummary()])
    .then(([page, summaryData]) => {
      pageData.value = page.list;
      total.value = page.total;
      summary.value = summaryData;
    })
    .finally(() => {
      loading.value = false;
    });
}

function handleQuery() {
  queryParams.pageNum = 1;
  fetchData();
}

function handleReset() {
  queryParams.pageNum = 1;
  queryParams.pageSize = 10;
  queryParams.keyword = "";
  queryParams.channelType = props.mode === "ALL" ? "" : props.mode;
  fetchData();
}

function handleOpenBan(row: RealtimeConnectionPageVO) {
  banDialog.visible = true;
  banDialog.target = row;
  banDialog.reason = row.chatBanReason || "";
}

function handleBanConfirm() {
  if (!banDialog.target?.connectionId) {
    return;
  }
  banDialog.submitting = true;
  RealtimeAPI.banChat(banDialog.target.connectionId, banDialog.reason)
    .then(() => {
      banDialog.visible = false;
      banDialog.reason = "";
      banDialog.target = null;
      ElMessage.success("已封禁该用户的聊天室发言权限");
      fetchData();
    })
    .finally(() => {
      banDialog.submitting = false;
    });
}

function handleUnban(row: RealtimeConnectionPageVO) {
  ElMessageBox.confirm(`确认解除用户【${row.nickname || row.username || row.userId}】的聊天室封禁?`, "提示", {
    type: "warning",
  }).then(() => {
    RealtimeAPI.unbanChat(row.connectionId).then(() => {
      ElMessage.success("已解除聊天室发言封禁");
      fetchData();
    });
  }).catch(() => undefined);
}

onMounted(() => {
  fetchData();
});
</script>