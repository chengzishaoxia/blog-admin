<template>
  <div class="app-container">
    <div class="search-container">
      <el-form ref="queryFormRef" :model="queryParams" :inline="true">
        <el-form-item prop="ipAddress" label="IP 地址">
          <el-input
            v-model="queryParams.ipAddress"
            placeholder="访客 IP"
            clearable
            @keyup.enter="handleQuery"
          />
        </el-form-item>

        <el-form-item prop="visitDateRange" label="访问日期">
          <el-date-picker
            v-model="queryParams.visitDateRange"
            :editable="false"
            type="daterange"
            range-separator="~"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
            style="width: 240px"
          />
        </el-form-item>

        <el-form-item class="search-buttons">
          <el-button type="primary" icon="search" @click="handleQuery">搜索</el-button>
          <el-button icon="refresh" @click="handleResetQuery">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <el-card shadow="hover" class="data-table">
      <el-table
        v-loading="loading"
        :data="pageData"
        highlight-current-row
        border
        class="data-table__content"
      >
        <el-table-column label="IP 地址" prop="ipAddress" width="180" align="center" />
        <el-table-column label="访问日期" prop="visitDate" width="150" align="center" />
        <el-table-column label="详细记录时间" prop="createTime" min-width="180" align="center" />
        
        <el-table-column label="操作" width="100" align="center" fixed="right">
          <!-- <template #default="scope">
            <el-button type="danger" link icon="delete" @click="handleDelete(scope.row)">
              删除
            </el-button>
          </template> -->
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
  </div>
</template>

<script setup lang="ts">
import { ElMessageBox, ElMessage } from "element-plus";
// 修改 4：导入对应的 VisitLogAPI 及其类型
import VisitLogAPI, { VisitLogVO, VisitLogPageQuery } from "@/api/system/log-api-ip";

defineOptions({
  name: "VisitLog",
  inheritAttrs: false,
});

const queryFormRef = ref();
const loading = ref(false);
const total = ref(0);

// 修改 5：初始查询参数与 VisitLogPageQuery 保持一致
const queryParams = reactive<VisitLogPageQuery>({
  pageNum: 1,
  pageSize: 10,
  ipAddress: "",
  visitDateRange: undefined,
});

// 表格数据列表
const pageData = ref<VisitLogVO[]>();

/** 获取数据 */
function fetchData() {
  loading.value = true;
  VisitLogAPI.getPage(queryParams)
    .then((data) => {
      pageData.value = data.list;
      total.value = data.total;
    })
    .finally(() => {
      loading.value = false;
    });
}

/** 查询 */
function handleQuery() {
  queryParams.pageNum = 1;
  fetchData();
}

/** 重置查询 */
function handleResetQuery() {
  queryFormRef.value.resetFields();
  queryParams.pageNum = 1;
  queryParams.visitDateRange = undefined;
  fetchData();
}

/** 删除单条记录 */
function handleDelete(row: VisitLogVO) {
  ElMessageBox.confirm(`确认删除 IP 为 ${row.ipAddress} 的访问记录吗？`, "警告", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning",
  }).then(() => {
    VisitLogAPI.delete(row.id).then(() => {
      ElMessage.success("删除成功");
      fetchData();
    });
  });
}

onMounted(() => {
  handleQuery();
});
</script>