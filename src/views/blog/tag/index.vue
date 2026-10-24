<template>
  <div class="app-container blog-tag-manage">
    <!-- 搜索区域 -->
    <div class="search-container">
      <el-form ref="queryFormRef" :model="query" :inline="true" label-suffix=":">
        <el-form-item label="关键词" prop="keywords">
          <el-input
            v-model="query.keywords"
            placeholder="标签名称关键词"

            @keyup.enter="handleQuery()"
          />
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
          <el-button
            type="success"
            icon="plus"
            @click="openCreate()"
          >新增标签</el-button>
        </div>
      </div>

      <el-table
        ref="tableRef"
        v-loading="loading"
        :data="list"
        highlight-current-row
        class="data-table__content"
      >
        <el-table-column type="index" label="序号" width="60" />
        <el-table-column prop="name" label="标签名称" min-width="160" show-overflow-tooltip />
        <el-table-column prop="sort" label="排序" width="90" align="center" />
        <el-table-column prop="postCount" label="文章数" width="100" align="center">
          <template #default="scope">
            <span v-if="scope.row.postCount!=null">{{ scope.row.postCount }}</span>
            <span v-else class="text-disabled">-</span>
          </template>
        </el-table-column>
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
              <el-button
                type="primary"
                size="small"
                link
                icon="edit"
                @click="openEdit(scope.row)"
              >编辑</el-button>
              <el-button
                type="danger"
                size="small"
                link
                icon="delete"
                @click="handleDelete(scope.row)"
              >删除</el-button>
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

    <!-- 新增/编辑弹窗 -->
    <el-dialog
      v-model="dialog.visible"
      :title="dialog.mode === 'create' ? '新增标签' : '编辑标签'"
      width="480px"
      destroy-on-close
    >
      <el-form ref="formRef" :model="form" :rules="rules" label-width="90px" v-loading="dialog.submitting">
        <el-form-item label="名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入标签名称" clearable maxlength="40" />
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
defineOptions({ name: 'BlogTagManage', inheritAttrs: false });

import { BlogTagAPI, BlogTagPageQuery, BlogTagForm, BlogTagVO } from '@/api/blog/blog-api';
import type { FormInstance, FormRules } from 'element-plus';

const queryFormRef = ref();
const tableRef = ref();
// 将 formRef 显式声明为可空，便于 TS 判定并使用可选链
const formRef = ref<FormInstance | null>(null);

// 查询参数
const query = reactive<BlogTagPageQuery>({
  pageNum: 1,
  pageSize: 10,
  keywords: undefined,
  status: undefined,
});

// 数据与状态
const loading = ref(false);
const list = ref<BlogTagVO[]>([]);
const total = ref(0);

// 弹窗状态
const dialog = reactive({
  visible: false,
  mode: 'create' as 'create' | 'edit',
  submitting: false,
});

// 表单数据
const form = reactive<BlogTagForm>({
  name: '',
  sort: 0,
  status: 1,
  id: undefined,
});

// 校验规则
const rules = reactive<FormRules>({
  name: [{ required: true, message: '请输入标签名称', trigger: 'blur' }],
  // 使用 FormRules 正确声明，移除不必要的 required:false，并显式声明 type 为 RuleType
  sort: [{ type: 'number', message: '排序为数字', trigger: 'change' }],
});

/** 查询标签列表 */
function handleQuery(resetPage = true) {
  if (resetPage) query.pageNum = 1;
  loading.value = true;
  BlogTagAPI.getPage(query)
    .then(page => {
      list.value = page.list;
      total.value = page.total;
    })
    .finally(()=> loading.value = false);
}

/** 重置搜索 */
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
  form.sort = 0;
  form.status = 1;
  nextTick(()=> formRef.value?.clearValidate?.());
}

function openEdit(row: BlogTagVO) {
  dialog.mode = 'edit';
  dialog.visible = true;
  form.id = row.id as any;
  form.name = row.name || '';
  form.sort = row.sort ?? 0;
  form.status = row.status ?? 1;
  nextTick(()=> formRef.value?.clearValidate?.());
}

function handleSubmit() {
  // 若还未渲染表单实例则直接返回
  if (!formRef.value) return;
  formRef.value.validate?.((valid: boolean) => {
    if (!valid) return;
    dialog.submitting = true;
    const task = dialog.mode === 'create'
      ? BlogTagAPI.create(form)
      : BlogTagAPI.update(form.id!, form);
    task
      .then(()=> {
        ElMessage.success(dialog.mode === 'create' ? '新增成功' : '保存成功');
        dialog.visible = false;
        handleQuery(false);
      })
      .finally(()=> dialog.submitting = false);
  });
}

function handleDelete(row: BlogTagVO) {
  ElMessageBox.confirm(`确认删除标签【${row.name}】?`, '提示', { type: 'warning' })
    .then(()=> BlogTagAPI.delete(row.id))
    .then(()=> {
      ElMessage.success('删除成功');
      // 如果当前页只剩一个且不是第一页，翻回上一页
      if (list.value.length <= 1 && query.pageNum > 1) {
        query.pageNum -= 1;
      }
      handleQuery(false);
    })
    .catch(()=> {/* 用户取消 */});
}

onMounted(()=> {
  handleQuery();
});
</script>

<style scoped lang="scss">
.blog-tag-manage {
  .search-container { margin-bottom: 12px; }
  .data-table { margin-top: 0; }
}

.text-disabled { color: var(--el-text-color-placeholder); }
</style>
