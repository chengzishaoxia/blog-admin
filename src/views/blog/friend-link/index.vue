<template>
  <div class="app-container blog-friend-link-manage">
    <div class="search-container">
      <el-form ref="queryFormRef" :model="query" :inline="true" label-suffix=":">
        <el-form-item label="关键词" prop="keywords">
          <el-input v-model="query.keywords" placeholder="站点名称/描述关键词" @keyup.enter="handleQuery()" />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-select v-model="query.status" placeholder="全部" clearable style="width: 120px">
            <el-option :value="1" label="启用" />
            <el-option :value="0" label="停用" />
          </el-select>
        </el-form-item>
        <el-form-item class="search-buttons">
          <el-button type="primary" icon="search" @click="handleQuery()">搜索</el-button>
          <el-button icon="refresh" @click="handleResetQuery()">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <el-card shadow="hover" class="data-table">
      <div class="data-table__toolbar">
        <div class="data-table__toolbar--actions">
          <el-button type="success" icon="plus" @click="openCreate()">新增友链</el-button>
        </div>
      </div>

      <el-table v-loading="loading" :data="list" highlight-current-row class="data-table__content">
        <el-table-column type="index" label="序号" width="60" />
        <el-table-column label="头像" width="90" align="center">
          <template #default="scope">
            <el-image
              v-if="scope.row.avatar"
              :src="scope.row.avatar"
              fit="cover"
              class="friend-avatar"
              :preview-src-list="[scope.row.avatar]"
              preview-teleported
            />
            <span v-else class="text-disabled">-</span>
          </template>
        </el-table-column>
        <el-table-column prop="name" label="站点名称" min-width="160" show-overflow-tooltip />
        <el-table-column prop="url" label="站点地址" min-width="220" show-overflow-tooltip>
          <template #default="scope">
            <el-link :href="scope.row.url" type="primary" target="_blank">{{ scope.row.url }}</el-link>
          </template>
        </el-table-column>
        <el-table-column prop="description" label="站点描述" min-width="220" show-overflow-tooltip />
        <el-table-column prop="sort" label="排序" width="90" align="center" />
        <el-table-column prop="status" label="状态" width="100" align="center">
          <template #default="scope">
            <el-tag v-if="scope.row.status === 1" type="success">启用</el-tag>
            <el-tag v-else-if="scope.row.status === 0" type="info">停用</el-tag>
            <el-tag v-else type="warning">未知</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" width="170" />
        <el-table-column label="操作" width="160" fixed="right" align="center">
          <template #default="scope">
            <el-space>
              <el-button type="primary" size="small" link icon="edit" @click="openEdit(scope.row)">编辑</el-button>
              <el-button type="danger" size="small" link icon="delete" @click="handleDelete(scope.row)">删除</el-button>
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

    <el-dialog
      v-model="dialog.visible"
      :title="dialog.mode === 'create' ? '新增友链' : '编辑友链'"
      width="560px"
      destroy-on-close
    >
      <el-form ref="formRef" :model="form" :rules="rules" label-width="90px" v-loading="dialog.submitting">
        <el-form-item label="名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入站点名称" clearable maxlength="60" />
        </el-form-item>
        <el-form-item label="链接" prop="url">
          <el-input v-model="form.url" placeholder="请输入站点地址" clearable />
        </el-form-item>
        <el-form-item label="头像" prop="avatar">
          <el-input v-model="form.avatar" placeholder="请输入头像地址" clearable />
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input v-model="form.description" type="textarea" :rows="3" placeholder="请输入站点描述" maxlength="120" show-word-limit />
        </el-form-item>
        <el-form-item label="排序" prop="sort">
          <el-input-number v-model="form.sort" :min="0" :max="9999" :step="1" controls-position="right" />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-switch
            v-model="form.status"
            :active-value="1"
            :inactive-value="0"
            inline-prompt
            active-text="启用"
            inactive-text="停用"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-space>
          <el-button @click="dialog.visible = false">取消</el-button>
          <el-button type="primary" :loading="dialog.submitting" @click="handleSubmit()">
            {{ dialog.mode === 'create' ? '新增' : '保存' }}
          </el-button>
        </el-space>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
defineOptions({ name: 'BlogFriendLinkManage', inheritAttrs: false });

import { nextTick, onMounted, reactive, ref } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import type { FormInstance, FormRules } from 'element-plus';
import { BlogFriendLinkAPI, type BlogFriendLinkForm, type BlogFriendLinkPageQuery, type BlogFriendLinkVO } from '@/api/blog/blog-api';

const queryFormRef = ref();
const formRef = ref<FormInstance | null>(null);

const query = reactive<BlogFriendLinkPageQuery>({
  pageNum: 1,
  pageSize: 10,
  keywords: undefined,
  status: undefined,
});

const loading = ref(false);
const list = ref<BlogFriendLinkVO[]>([]);
const total = ref(0);

const dialog = reactive({
  visible: false,
  mode: 'create' as 'create' | 'edit',
  submitting: false,
});

const form = reactive<BlogFriendLinkForm>({
  id: undefined,
  name: '',
  url: '',
  avatar: '',
  description: '',
  sort: 0,
  status: 1,
});

const rules = reactive<FormRules>({
  name: [{ required: true, message: '请输入站点名称', trigger: 'blur' }],
  url: [{ required: true, message: '请输入站点地址', trigger: 'blur' }],
});

function handleQuery(resetPage = true) {
  if (resetPage) query.pageNum = 1;
  loading.value = true;
  BlogFriendLinkAPI.getPage(query)
    .then((page: PageResult<BlogFriendLinkVO[]>) => {
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

function openCreate() {
  dialog.mode = 'create';
  dialog.visible = true;
  form.id = undefined;
  form.name = '';
  form.url = '';
  form.avatar = '';
  form.description = '';
  form.sort = 0;
  form.status = 1;
  nextTick(() => formRef.value?.clearValidate?.());
}

function openEdit(row: BlogFriendLinkVO) {
  dialog.mode = 'edit';
  dialog.visible = true;
  form.id = row.id as any;
  form.name = row.name || '';
  form.url = row.url || '';
  form.avatar = row.avatar || '';
  form.description = row.description || '';
  form.sort = row.sort ?? 0;
  form.status = row.status ?? 1;
  nextTick(() => formRef.value?.clearValidate?.());
}

function handleSubmit() {
  if (!formRef.value) return;
  formRef.value.validate?.((valid: boolean) => {
    if (!valid) return;
    dialog.submitting = true;
    const task = dialog.mode === 'create'
      ? BlogFriendLinkAPI.create(form)
      : BlogFriendLinkAPI.update(form.id!, form);
    task
      .then(() => {
        ElMessage.success(dialog.mode === 'create' ? '新增成功' : '保存成功');
        dialog.visible = false;
        handleQuery(false);
      })
      .finally(() => (dialog.submitting = false));
  });
}

function handleDelete(row: BlogFriendLinkVO) {
  ElMessageBox.confirm(`确认删除友链【${row.name}】?`, '提示', { type: 'warning' })
    .then(() => BlogFriendLinkAPI.delete(row.id!))
    .then(() => {
      ElMessage.success('删除成功');
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
.blog-friend-link-manage {
  .search-container {
    margin-bottom: 12px;
  }

  .data-table {
    margin-top: 0;
  }
}

.friend-avatar {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  display: inline-block;
}

.text-disabled {
  color: var(--el-text-color-placeholder);
}
</style>