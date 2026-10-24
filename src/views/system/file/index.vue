<template>
  <div class="app-container">
    <!-- 搜索区域 -->
    <div class="search-container">
      <el-form ref="queryFormRef" :model="queryParams" :inline="true">
        <el-form-item label="关键字" prop="keywords">
          <el-input
            v-model="queryParams.keywords"
            placeholder="文件名称"
            clearable
            @keyup.enter="handleQuery"
          />
        </el-form-item>
        <el-form-item label="用途类型" prop="usageType">
          <el-select v-model="queryParams.usageType" clearable placeholder="请选择用途类型" style="width:140px">
            <el-option v-for="item in FILE_USAGE_TYPES" :key="item" :label="item" :value="item" />
          </el-select>
        </el-form-item>
        <el-form-item label="仅图片" prop="onlyImages">
          <el-switch v-model="queryParams.onlyImages" />
        </el-form-item>
        <el-form-item label="创建时间" prop="createTime">
          <el-date-picker
            v-model="queryParams.createTime"
            type="datetimerange"
            range-separator="~"
            start-placeholder="开始"
            end-placeholder="结束"
            value-format="YYYY-MM-DD HH:mm:ss"
            style="width:340px"
          />
        </el-form-item>
        <el-form-item class="search-buttons">
          <el-button type="primary" icon="search" @click="handleQuery">搜索</el-button>
          <el-button icon="refresh" @click="handleResetQuery">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <el-card shadow="hover" class="data-table">
      <div class="data-table__toolbar">
        <div class="data-table__toolbar--actions">
          <el-button type="success" icon="plus" @click="handleUploadClick">上传文件</el-button>
          <el-button
            type="danger"
            icon="delete"
            :disabled="selectedIds.length === 0"
            @click="handleBatchDelete"
          >
            批量删除
          </el-button>
        </div>
      </div>

      <el-table
        v-loading="loading"
        highlight-current-row
        :data="tableData"
        border
        class="data-table__content"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" align="center" />
        <el-table-column label="预览" width="90">
          <template #default="{ row }">
            <!-- 预览层 teleport 到 body 防止被遮挡 -->
            <el-image
              v-if="row.contentType?.startsWith('image/')"
              :src="row.url"
              fit="cover"
              style="width:60px;height:60px;border-radius:4px"
              :preview-src-list="[row.url]"
              hide-on-click-modal
              :preview-teleported="true"
            />
            <el-icon v-else><Document /></el-icon>
          </template>
        </el-table-column>
        <el-table-column label="文件名称" prop="name" min-width="160" />
        <el-table-column label="用途类型" prop="usageType" width="120" />
        <el-table-column label="大小" prop="size" width="110">
          <template #default="{ row }">{{ formatSize(row.size) }}</template>
        </el-table-column>
        <el-table-column label="Content-Type" prop="contentType" width="160" />
        <el-table-column label="上传者" width="160">
          <template #default="{ row }">
            <span>{{ row.uploaderUsername || row.uploaderUserId || '-' }}</span>
            <span v-if="row.uploaderUsername && row.uploaderUserId" style="color:#999;margin-left:4px">(#{{ row.uploaderUserId }})</span>
          </template>
        </el-table-column>
        <el-table-column label="创建时间" prop="createTime" width="180" />
        <el-table-column label="更新时间" prop="updateTime" width="180" />
        <el-table-column fixed="right" label="操作" width="220" align="center">
          <template #default="{ row }">
            <el-button type="primary" link size="small" icon="download" @click="handleDownload(row)">下载</el-button>
            <el-button type="primary" link size="small" icon="edit" @click="handleEdit(row)">编辑</el-button>
            <el-button type="danger" link size="small" icon="delete" @click="handleDelete(row)">删除</el-button>
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

    <!-- 上传弹窗 -->
    <el-dialog v-model="uploadDialog.visible" title="上传文件" width="600px" @close="handleUploadDialogClose">
      <FileUpload v-model:modelValue="uploadedFiles" :limit="10" />
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="handleUploadDialogClose">关 闭</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 编辑弹窗 -->
    <el-dialog v-model="editDialog.visible" :title="editDialog.title" width="500px" @close="handleEditDialogClose">
      <el-form ref="editFormRef" :model="editForm" :rules="editRules" label-width="90px">
        <el-form-item label="文件名称" prop="name">
          <el-input v-model="editForm.name" placeholder="请输入文件名称" />
        </el-form-item>
        <el-form-item label="用途类型" prop="usageType">
          <el-select v-model="editForm.usageType" placeholder="请选择用途类型" clearable>
            <el-option v-for="item in FILE_USAGE_TYPES" :key="item" :label="item" :value="item" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="handleEditSubmit">保 存</el-button>
          <el-button @click="handleEditDialogClose">取 消</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
defineOptions({ name: 'File', inheritAttrs: false });
import FileAPI, { FILE_USAGE_TYPES, FilePageQuery, FilePageVO, FileUpdateForm } from '@/api/file-api';
import FileUpload from '@/components/Upload/FileUpload.vue';

const queryFormRef = ref();
const editFormRef = ref();

const loading = ref(false);
const total = ref(0);
const selectedIds = ref<Array<number | string>>([]); // 修复括号

// 查询参数
const queryParams = reactive<FilePageQuery & { createTime?: [string, string] | undefined }>({
  pageNum: 1,
  pageSize: 10,
  keywords: '',
  usageType: undefined,
  onlyImages: false,
  createTime: undefined,
});

// 表格数据
const tableData = ref<FilePageVO[]>([]);

// 上传弹窗
const uploadDialog = reactive({ visible: false });
const uploadedFiles = ref([]); // 已上传文件列表(仅用于展示)

// 编辑弹窗
const editDialog = reactive({ visible: false, title: '编辑文件' });
const editForm = reactive<FileUpdateForm & { id?: number | string }>({});

const editRules = {
  name: [{ required: true, message: '请输入文件名称', trigger: 'blur' }],
};

// 获取列表数据
function fetchData() {
  loading.value = true;
  const requestQuery: any = { ...queryParams };
  if (queryParams.createTime && queryParams.createTime.length === 2) {
    requestQuery.startTime = queryParams.createTime[0];
    requestQuery.endTime = queryParams.createTime[1];
  } else {
    requestQuery.startTime = undefined;
    requestQuery.endTime = undefined;
  }
  // 移除多余字段
  delete requestQuery.createTime;

  FileAPI.getPage(requestQuery as FilePageQuery)
    .then((data) => {
      tableData.value = data.list || [];
      total.value = data.total || 0;
    })
    .finally(() => (loading.value = false));
}

function handleQuery() {
  queryParams.pageNum = 1;
  fetchData();
}

function handleResetQuery() {
  queryFormRef.value?.resetFields?.();
  queryParams.pageNum = 1;
  queryParams.createTime = undefined;
  fetchData();
}

function handleSelectionChange(selection: any[]) {
  selectedIds.value = selection.map((item) => item.id);
}

function handleUploadClick() {
  uploadDialog.visible = true;
}

function handleUploadDialogClose() {
  uploadDialog.visible = false;
  uploadedFiles.value = [];
  fetchData(); // 关闭后刷新
}

function handleEdit(row: FilePageVO) {
  editDialog.visible = true;
  editDialog.title = '编辑文件';
  Object.assign(editForm, { id: row.id, name: row.name, usageType: row.usageType });
}

function handleEditDialogClose() {
  editDialog.visible = false;
  Object.assign(editForm, { id: undefined, name: undefined, usageType: undefined });
}

function handleEditSubmit() {
  editFormRef.value?.validate?.((valid: boolean) => {
    if (!valid) return;
    if (!editForm.id) return;
    loading.value = true;
    FileAPI.update(editForm.id, { name: editForm.name, usageType: editForm.usageType })
      .then(() => {
        ElMessage.success('保存成功');
        handleEditDialogClose();
        fetchData();
      })
      .finally(() => (loading.value = false));
  });
}

function handleDelete(row: FilePageVO) {
  ElMessageBox.confirm('确认删除该文件记录? 将不可恢复', '警告', { type: 'warning' }).then(() => {
    FileAPI.deleteById(row.id).then(() => {
      ElMessage.success('删除成功');
      fetchData();
    });
  });
}

function handleBatchDelete() {
  if (selectedIds.value.length === 0) {
    ElMessage.warning('请勾选删除项');
    return;
  }
  ElMessageBox.confirm('确认删除选中文件记录? 将不可恢复', '警告', { type: 'warning' }).then(() => {
    FileAPI.deleteBatch(selectedIds.value).then(() => {
      ElMessage.success('删除成功');
      selectedIds.value = [];
      fetchData();
    });
  });
}

function handleDownload(row: FilePageVO) {
  if (row.url) {
    FileAPI.download(row.url, row.name);
  }
}

function formatSize(size?: number) {
  if (!size && size !== 0) return '--';
  const units = ['B', 'KB', 'MB', 'GB'];
  let idx = 0;
  let val = size;
  while (val >= 1024 && idx < units.length - 1) {
    val /= 1024;
    idx++;
  }
  return `${val.toFixed(2)} ${units[idx]}`;
}

onMounted(() => {
  fetchData();
});
</script>

<style scoped>
.data-table__toolbar--actions {
  display: flex;
  gap: 8px;
}
</style>
