<template>
  <div class="app-container blog-message-manage">
    <div class="search-container">
      <el-form ref="queryFormRef" :model="query" :inline="true" label-suffix=":">
        <el-form-item label="关键词" prop="keywords">
          <el-input v-model="query.keywords" placeholder="留言内容关键词" @keyup.enter="handleQuery()" />
        </el-form-item>
        <el-form-item label="审核状态" prop="auditStatus">
          <el-select v-model="query.auditStatus" placeholder="全部" clearable style="width: 140px">
            <el-option :value="0" label="待审核" />
            <el-option :value="1" label="已通过" />
            <el-option :value="2" label="已驳回" />
          </el-select>
        </el-form-item>
        <el-form-item class="search-buttons">
          <el-button type="primary" icon="search" @click="handleQuery()">搜索</el-button>
          <el-button icon="refresh" @click="handleResetQuery()">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <el-card shadow="hover" class="data-table">
      <el-table v-loading="loading" :data="list" highlight-current-row>
        <el-table-column type="index" label="序号" width="60" />
        <el-table-column label="留言人" min-width="220">
          <template #default="scope">
            <div class="user-cell">
              <el-avatar v-if="scope.row.avatar" :src="scope.row.avatar" :size="30" />
              <el-avatar v-else :size="30">{{ (scope.row.nickname || '匿').slice(0, 1) }}</el-avatar>
              <div class="user-meta">
                <div class="user-row">
                  <span class="user-name">{{ scope.row.nickname || `用户${scope.row.userId}` }}</span>
                  <el-tag size="small" :type="scope.row.userId ? 'success' : 'info'">
                    {{ scope.row.userId ? '账号' : '游客' }}
                  </el-tag>
                </div>
                <div class="user-extra">IP：{{ scope.row.submitIp || '-' }} · {{ scope.row.ipRegion || '未知地区' }}</div>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="content" label="留言内容" min-width="300" show-overflow-tooltip />
        <el-table-column prop="auditStatus" label="审核状态" width="110" align="center">
          <template #default="scope">
            <el-tag v-if="scope.row.auditStatus === 1" type="success">已通过</el-tag>
            <el-tag v-else-if="scope.row.auditStatus === 2" type="danger">已驳回</el-tag>
            <el-tag v-else type="warning">待审核</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="auditByName" label="审核人" width="130" align="center">
          <template #default="scope">
            {{ scope.row.auditByName || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="auditRemark" label="审核备注" min-width="180" show-overflow-tooltip>
          <template #default="scope">
            {{ scope.row.auditRemark || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="提交时间" width="170" />
        <el-table-column prop="auditTime" label="审核时间" width="170">
          <template #default="scope">
            {{ scope.row.auditTime || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="220" fixed="right" align="center">
          <template #default="scope">
            <el-space>
              <el-button
                v-if="scope.row.auditStatus !== 1"
                v-hasPerm="['blog:message:audit']"
                type="success"
                size="small"
                link
                @click="handleAudit(scope.row, 1)"
              >
                通过
              </el-button>
              <el-button
                v-if="scope.row.auditStatus !== 2"
                v-hasPerm="['blog:message:audit']"
                type="warning"
                size="small"
                link
                @click="handleAudit(scope.row, 2)"
              >
                驳回
              </el-button>
              <el-button
                v-hasPerm="['blog:message:delete']"
                type="danger"
                size="small"
                link
                @click="handleDelete(scope.row)"
              >
                删除
              </el-button>
            </el-space>
          </template>
        </el-table-column>
      </el-table>

      <pagination
        v-if="total > 0"
        v-model:total="total"
        v-model:page="query.pageNum"
        v-model:limit="query.pageSize"
        @pagination="handleQuery(false)"
      />
    </el-card>
  </div>
</template>

<script setup lang="ts">
defineOptions({ name: "BlogMessageManage", inheritAttrs: false });

import { BlogMessageAPI, type BlogMessagePageQuery, type BlogMessageVO } from "@/api/blog/blog-api";

const queryFormRef = ref();

const query = reactive<BlogMessagePageQuery>({
  pageNum: 1,
  pageSize: 10,
  keywords: undefined,
  auditStatus: undefined,
});

const loading = ref(false);
const list = ref<BlogMessageVO[]>([]);
const total = ref(0);

function handleQuery(resetPage = true) {
  if (resetPage) query.pageNum = 1;
  loading.value = true;
  BlogMessageAPI.getPage(query)
    .then((page) => {
      list.value = page.list;
      total.value = page.total;
    })
    .finally(() => (loading.value = false));
}

function handleResetQuery() {
  queryFormRef.value?.resetFields?.();
  query.pageNum = 1;
  query.pageSize = 10;
  handleQuery();
}

function handleAudit(row: BlogMessageVO, auditStatus: number) {
  const actionText = auditStatus === 1 ? "通过" : "驳回";
  ElMessageBox.prompt(`请输入${actionText}备注（可选）`, `${actionText}留言`, {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    inputValue: "",
  })
    .then(({ value }) => BlogMessageAPI.audit(row.id!, { auditStatus, auditRemark: value || "" }))
    .then(() => {
      ElMessage.success(`已${actionText}`);
      handleQuery(false);
    })
    .catch(() => {});
}

function handleDelete(row: BlogMessageVO) {
  ElMessageBox.confirm("确认删除该条留言吗？", "提示", { type: "warning" })
    .then(() => BlogMessageAPI.delete(row.id!))
    .then(() => {
      ElMessage.success("删除成功");
      if (list.value.length <= 1 && query.pageNum > 1) {
        query.pageNum -= 1;
      }
      handleQuery(false);
    })
    .catch(() => {});
}

onMounted(() => {
  handleQuery();
});
</script>

<style scoped lang="scss">
.blog-message-manage {
  .search-container {
    margin-bottom: 12px;
  }
}

.user-cell {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.user-meta {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.user-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.user-name {
  color: var(--el-text-color-primary);
}

.user-extra {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
</style>
