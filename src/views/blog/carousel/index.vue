<template>
  <div class="app-container">
    <el-card shadow="hover" class="mb-15">
      <el-form :inline="true" label-width="80px">
        <el-form-item>
          <el-button type="primary" icon="refresh" @click="handleQuery()">刷新列表</el-button>
        </el-form-item>
        <el-form-item>
          <el-button type="success" icon="plus" @click="openSelectDialog()">选择轮播图</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card shadow="never">
      <el-table :data="list" v-loading="loading" style="width:100%">
        <el-table-column type="index" label="#" width="60"/>
        <el-table-column label="预览" width="200">
          <template #default="scope">
            <div class="preview-box">
              <img :src="scope.row.fileUrl" alt="预览"/>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="fileId" label="文件ID" width="140"/>
        <el-table-column prop="createTime" label="创建时间" width="170"/>
        <el-table-column prop="updateTime" label="更新时间" width="170"/>
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="scope">
            <el-button type="danger" size="small" icon="delete" @click="handleRemove(scope.row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 选择轮播图对话框（默认加载前10个 usageType=CAROUSEL 图片） -->
    <el-dialog v-model="selectDialogVisible" title="选择轮播图文件" width="640px" :close-on-click-modal="false">
      <div class="select-hint">默认显示前 10 张用途为 CAROUSEL 的图片</div>
      <el-select
        v-model="selectedIds"
        multiple
        filterable
        placeholder="选择图片"
        class="carousel-select"
        popper-class="carousel-select-popper"
        :disabled="selectLoading"
      >
        <el-option
          v-for="item in selectOptions"
          :key="item.id"
          :label="formatOptionLabel(item)"
          :value="item.id"
          :disabled="isAlreadyInCarousel(item.id)"
        >
          <div class="option-row">
            <div class="option-thumb-box">
              <img :src="item.url" alt="" class="option-thumb-img"/>
            </div>
            <span class="option-name">{{ item.name }}</span>
            <span v-if="isAlreadyInCarousel(item.id)" class="exists-tag">已存在</span>
          </div>
        </el-option>
        <el-option v-if="!selectOptions.length && !selectLoading" disabled :value="'__empty__'" label="暂无数据"/>
        <el-option v-if="selectLoading" disabled :value="'__loading__'" label="加载中..."/>
      </el-select>
      <div class="select-footer-hint">
        <span v-if="selectedIds.length">已选择 {{ selectedIds.length }} 张图片</span>
        <span v-else class="text-muted">尚未选择图片</span>
      </div>
      <template #footer>
        <el-button @click="selectDialogVisible=false">取消</el-button>
        <el-button type="primary" :disabled="!selectedIds.length" :loading="saving" @click="submitSelected">保存
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>
<script setup lang="ts">
import {ref, reactive, onMounted} from 'vue';
import {ElMessage, ElMessageBox} from 'element-plus';
import BlogCarouselAPI, {BlogCarouselPageQuery, BlogCarouselVO} from '@/api/blog/blog-carousel-api';
import FileAPI, {FilePageQuery, FilePageVO} from '@/api/file-api';

defineOptions({name: 'BlogCarouselManage', inheritAttrs: false});

// 列表展示：轮播图记录（专用表）仅取前10项（简单模式）
const loading = ref(false);
const list = ref<BlogCarouselVO[]>([]);
const queryParams = reactive<BlogCarouselPageQuery>({pageNum: 1, pageSize: 10});

function handleQuery() {
  loading.value = true;
  BlogCarouselAPI.getPage(queryParams)
    .then(data => {
      list.value = data.list;
    })
    .finally(() => loading.value = false);
}

// 选择弹层简化：一次拉取前10张 CAROUSEL 图片
const selectDialogVisible = ref(false);
const selectLoading = ref(false);
const selectOptions = ref<FilePageVO[]>([]);
const selectedIds = ref<Array<number | string>>([]);
const saving = ref(false);

function openSelectDialog() {
  selectDialogVisible.value = true;
  selectedIds.value = [];
  loadSelectOptions();
}

function loadSelectOptions() {
  selectLoading.value = true;
  const params: FilePageQuery = {pageNum: 1, pageSize: 10, usageType: 'CAROUSEL', onlyImages: true} as any;
  FileAPI.getPage(params)
    .then(data => {
      selectOptions.value = data.list || [];
    })
    .finally(() => selectLoading.value = false);
}

function isAlreadyInCarousel(fileId: number | string) {
  return list.value.some(item => item.fileId === fileId);
}

function formatOptionLabel(item: FilePageVO) {
  return isAlreadyInCarousel(item.id) ? `${item.name} (已存在)` : item.name;
}

function submitSelected() {
  if (!selectedIds.value.length) return;
  saving.value = true;
  const existingIds = new Set(list.value.map(c => c.fileId));
  const newFileIds = selectedIds.value.filter(fid => !existingIds.has(fid));
  if (!newFileIds.length) {
    ElMessage.info('选择的图片均已存在');
    saving.value = false;
    return;
  }
  Promise.all(newFileIds.map(fid => BlogCarouselAPI.create({fileId: fid})))
    .then(() => {
      ElMessage.success(`新增 ${newFileIds.length} 张，跳过 ${selectedIds.value.length - newFileIds.length} 张重复`);
      selectDialogVisible.value = false;
      handleQuery();
    })
    .catch(() => ElMessage.error('添加失败'))
    .finally(() => saving.value = false);
}

function handleRemove(row: BlogCarouselVO) {
  ElMessageBox.confirm('确认删除该轮播图?', '提示', {type: 'warning'})
    .then(() => {
      loading.value = true;
      BlogCarouselAPI.delete(row.id)
        .then(() => ElMessage.success('删除成功'))
        .finally(() => {
          loading.value = false;
          handleQuery();
        });
    });
}

onMounted(() => handleQuery());
</script>
<style scoped>
.app-container {
  padding: 12px;
}

.preview-box {
  width: 180px;
  aspect-ratio: 16/9;
  overflow: hidden;
  border-radius: 8px;
  background: #111;
  display: flex;
}

.preview-box img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

@media (max-width: 1400px) {
  .preview-box {
    width: 160px;
  }
}

@media (max-width: 1200px) {
  .preview-box {
    width: 140px;
  }
}

@media (max-width: 992px) {
  .preview-box {
    width: 120px;
  }
}

.carousel-select {
  width: 100%;
  margin-top: 6px;
}

.option-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 4px 0;
}

.option-thumb-box {
  width: 90px;
  aspect-ratio: 16/9;
  overflow: hidden;
  border-radius: 4px;
  background: #222;
  flex-shrink: 0;
}

.option-thumb-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.option-name {
  flex: 1;
  min-width: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 13px;
}

.exists-tag {
  font-size: 12px;
  color: #f56c6c;
}

.select-hint {
  font-size: 12px;
  color: #666;
  margin-bottom: 8px;
}

.select-footer-hint {
  margin-top: 10px;
  font-size: 12px;
  color: #666;
}

.text-muted {
  color: #999;
}
</style>
