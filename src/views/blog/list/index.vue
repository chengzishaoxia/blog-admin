<template>
  <div class="app-container">
    <!-- 搜索区域 -->
    <div class="search-container">
      <el-form ref="queryFormRef" :model="queryParams" :inline="true" label-suffix=":">
        <el-form-item label="关键词" prop="keywords">
          <el-input
            v-model="queryParams.keywords"
            placeholder="标题关键词"
            clearable
            @keyup.enter="handleQuery()"
          />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-select v-model="queryParams.status" placeholder="全部" clearable style="width: 120px">
            <el-option :value="0" label="草稿" />
            <el-option :value="1" label="已发布" />
          </el-select>
        </el-form-item>
        <!-- 预留标签过滤 (后端提供标签下拉后开启)
        <el-form-item label="标签" prop="tagId">
          <el-select v-model="queryParams.tagId" placeholder="全部" clearable style="width: 150px">
            <el-option
              v-for="item in tagOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        -->
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
            @click="handleCreate()"
          >新增文章</el-button>
        </div>
      </div>

      <el-table
        ref="dataTableRef"
        v-loading="loading"
        :data="pageData"
        highlight-current-row
        class="data-table__content"
        @row-dblclick="handleRowDblClick"
      >
        <el-table-column type="index" label="序号" width="60" />
        <el-table-column label="置顶" prop="pinned" width="70" align="center">
          <template #default="scope">
            <el-tag v-if="scope.row.pinned === 1" type="warning" effect="dark">是</el-tag>
            <el-tag v-else-if="scope.row.pinned === 0" type="warning" effect="dark">否</el-tag>
            <span v-else class="text-disabled">-</span>
          </template>
        </el-table-column>
        <el-table-column label="推荐" prop="isRecommend" width="70" align="center">
          <template #default="scope">
            <el-tag v-if="scope.row.isRecommend === 1" type="danger" effect="dark">是</el-tag>
            <el-tag v-else-if="scope.row.isRecommend === 0" type="info">否</el-tag>
            <span v-else class="text-disabled">-</span>
          </template>
        </el-table-column>
        <el-table-column label="标题" prop="title" min-width="220" show-overflow-tooltip />
        <el-table-column label="状态" prop="status" width="100" align="center">
          <template #default="scope">
            <el-tag v-if="scope.row.status === 0" type="info">草稿</el-tag>
            <el-tag v-else-if="scope.row.status === 1" type="success">已发布</el-tag>
            <el-tag v-else type="warning">未知</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="浏览量" prop="viewCount" width="100" align="center" />
        <el-table-column label="标签" min-width="160">
          <template #default="scope">
            <template v-if="scope.row.tags && scope.row.tags.length">
              <el-space wrap>
                <el-tag
                  v-for="tag in scope.row.tags"
                  :key="tag.id"
                  type="primary"
                  size="small"
                  effect="plain"
                >
                  {{ tag.name }}
                </el-tag>
              </el-space>
            </template>
            <span v-else class="text-disabled">-</span>
          </template>
        </el-table-column>
        <el-table-column label="创建时间" prop="createTime" width="170" />
        <el-table-column label="更新时间" prop="updateTime" width="170" />
        <el-table-column label="操作" width="120" fixed="right" align="center">
          <template #default="scope">
           <div style="display: flex; justify-content: center; gap: 10px;">
            <el-button
              type="primary"
              size="small"
              link
              icon="edit"
              @click="handleEdit(scope.row)"
            >
              编辑
            </el-button>

            <el-button
              type="danger"
              size="small"
              link
              icon="delete"
              @click="handleDelete(scope.row)"
            >
              删除
            </el-button>
          </div>
          </template>
        </el-table-column>
      </el-table>

      <pagination
        v-if="total > 0"
        v-model:total="total"
        v-model:page="queryParams.pageNum"
        v-model:limit="queryParams.pageSize"
        @pagination="handleQuery(false)"
      />
    </el-card>
  </div>
</template>

<script setup lang="ts">
defineOptions({ name: "BlogPostList", inheritAttrs: false });

import BlogPostAPI, { BlogPostPageQuery, BlogPostPageVO } from "@/api/blog/blog-api";
import { useRouter } from 'vue-router';
import { onActivated, onMounted } from 'vue';
import { useBlogPostStore } from '@/store/modules/blog-post-store';
import { ElMessage, ElMessageBox } from 'element-plus';

const router = useRouter();
const blogPostStore = useBlogPostStore();

const queryFormRef = ref();
const dataTableRef = ref();

const loading = ref(false);
const total = ref(0);

// 查询参数
const queryParams = reactive<BlogPostPageQuery>({
  pageNum: 1,
  pageSize: 10,
});

// 文章表格数据
const pageData = ref<BlogPostPageVO[]>([]);

// 标签下拉选项(后端接口准备好后填充)
const tagOptions = ref<OptionType[]>([]);

/** 查询文章列表 */
function handleQuery(resetPage = true) {
  loading.value = true;
  if (resetPage) {
    queryParams.pageNum = 1; // 新条件搜索回到第一页
  }
  BlogPostAPI.getPage(queryParams)
    .then((data) => {
      pageData.value = data.list;
      total.value = data.total;
    })
    .finally(() => (loading.value = false));
}

/** 重置搜索 */
function handleResetQuery() {
  queryFormRef.value?.resetFields?.();
  queryParams.pageNum = 1;
  queryParams.pageSize = 10;
  handleQuery();
}

function handleEdit(row: BlogPostPageVO) {
  router.push({
    path: '/blog/write', // 确保路由已配置到写文章组件
    query: { id: row.id }
  });
}

const handleDelete = (row: BlogPostPageVO) => {
  // 1. 弹出二次确认框
  ElMessageBox.confirm(
    `确定要删除标题为《${row.title}》的文章吗？此操作不可撤销！`, // 提示文字
    '警告', // 标题
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning', // 警告图标
    }
  )
    .then(async () => {
      // 2. 用户点击“确定”后执行的代码
      try {
        if (!row.id) {
          ElMessage.error("数据异常，缺少 ID");
          return;
        }
        await BlogPostAPI.delete(row.id);
        ElMessage.success("删除成功");
        handleQuery(); // 刷新列表
      } catch (error) {
        console.error("删除失败:", error);
      }
    })
    .catch(() => {
      // 3. 用户点击“取消”或关闭弹窗
      console.log("已取消删除");
    });
};

function handleCreate() {
  router.push({ path: '/blog/write' });
}

function handleRowDblClick(row: BlogPostPageVO) {
  handleEdit(row);
}

// 返回后(keep-alive 场景)自动刷新
onActivated(() => {
  if (blogPostStore.consumeRefreshFlag()) {
    handleQuery(false);
  }
});

onMounted(() => {
  handleQuery();
});
</script>

<style scoped lang="scss">
.text-disabled {
  color: var(--el-text-color-placeholder);
}
</style>
