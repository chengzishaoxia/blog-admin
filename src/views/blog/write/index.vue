<template>
  <div class="app-container">
    <el-page-header @back="goBack" content="写文章" class="mb-15" />

    <!-- 加载占位：编辑模式下等待详情接口返回再展示表单 -->
    <el-card v-if="!initialized" shadow="never">
      <el-skeleton :rows="10" animated />
    </el-card>

    <el-card v-else shadow="never" :body-style="{ paddingBottom: '6px' }">
      <el-form
        ref="formRef"
        :model="formData"
        :rules="rules"
        label-width="100px"
        class="blog-post-form"
        v-loading="loading || submitting"
      >
        <el-row :gutter="20">
          <el-col :span="16">
            <el-form-item label="标题" prop="title">
              <el-input v-model="formData.title" placeholder="请输入文章标题" clearable maxlength="120" />
            </el-form-item>
            <el-form-item label="摘要" prop="summary">
              <el-input
                v-model="formData.summary"
                placeholder="可填写文章摘要（选填）"
                type="textarea"
                :rows="3"
                maxlength="300"
                show-word-limit
              />
            </el-form-item>
            <el-form-item label="内容" prop="content" class="content-item">
              <WangEditor v-model="formData.content" style="min-height: 360px" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="封面图" prop="coverImageFileId">
              <SingleImageUpload
                v-model:modelValue="formData.coverImage"
                :data="{ usageType: 'BLOG_COVER' }"
                @success="onCoverUploadSuccess"
              />
              <div v-if="formData.coverImage" class="mt-5" style="font-size:12px;color:#888;">
                封面已上传，文件ID：{{ formData.coverImageFileId || '未获取' }}
              </div>
            </el-form-item>
            <el-form-item label="置顶" prop="pinned">
              <el-switch
                v-model="formData.pinned"
                :active-value="1"
                :inactive-value="0"
                inline-prompt
                active-text="是"
                inactive-text="否"
              />
            </el-form-item>
            <el-form-item label="推荐" prop="isRecommend">
              <el-switch
                v-model="formData.isRecommend"
                :active-value="1"
                :inactive-value="0"
                inline-prompt
                active-text="是"
                inactive-text="否"
              />
            </el-form-item>
            <el-form-item label="标签" prop="tagIds">
              <el-select
                v-model="formData.tagIds"
                multiple
                clearable
                filterable
                :loading="tagLoading"
                placeholder="选择标签"
                collapse-tags
                collapse-tags-tooltip
              >
                <el-option
                  v-for="t in tagList"
                  :key="t.id"
                  :label="formatTagLabel(t)"
                  :value="t.id"
                  :disabled="t.status === 0 && formData.tagIds && !formData.tagIds.includes(t.id as any)"
                />
              </el-select>
            </el-form-item>
            <el-form-item label="操作">
              <el-space>
                <el-button
                  type="primary"
                  :loading="submitting"
                  @click="handleSubmit(1)"
                >
                  发布
                </el-button>
                <el-button
                  :loading="submitting"
                  @click="handleSubmit(0)"
                >
                  保存草稿
                </el-button>
                <el-button @click="handleReset()">重置</el-button>
              </el-space>
            </el-form-item>
            <el-alert v-if="formData.id" type="info" show-icon :closable="false" class="mt-10">
              正在编辑：ID {{ formData.id }}
            </el-alert>
          </el-col>
        </el-row>
      </el-form>
    </el-card>
  </div>
</template>

<script setup lang="ts">
defineOptions({ name: 'BlogPostWrite', inheritAttrs: false });

import BlogPostAPI, { BlogPostForm, BlogPostVO, BlogTagVO, getTagList } from '@/api/blog/blog-api';
import { useRoute, useRouter } from 'vue-router';
import { useBlogPostStore } from '@/store/modules/blog-post-store';
import SingleImageUpload from '@/components/Upload/SingleImageUpload.vue';

const route = useRoute();
const router = useRouter();
const blogPostStore = useBlogPostStore();

const formRef = ref();

// 表单数据
const formData = reactive<BlogPostForm>({
  title: '',
  summary: '',
  content: '',
  status: 0,
  tagIds: [],
  coverImageFileId: undefined,
  coverImage: '',
  pinned: 0,
  isRecommend: 0,
});

// 标签列表与加载状态
const tagList = ref<BlogTagVO[]>([]);
const tagLoading = ref(false);
// 加载状态
const loading = ref(false);
const submitting = ref(false);
const initialized = ref(false); // 控制表单是否渲染

function formatTagLabel(tag: BlogTagVO) {
  return `${tag.name || ''}${tag.status === 0 ? '（停用）' : ''}`;
}

// 校验规则修正：content 只验证内容，tagIds 单独规则
const rules = reactive({
  title: [{ required: true, message: '请输入标题', trigger: 'blur' }],
  content: [
    {
      required: true,
      message: '请输入内容',
      trigger: 'blur',
      validator: (rule: any, value: string, callback: any) => {
        if (!value || !value.replace(/<[^>]+>/g, '').trim()) {
          callback(new Error('请输入内容'));
        } else {
          callback();
        }
      },
    },
  ],
  coverImageFileId: [
    {
      validator: (rule: any, value: any, callback: any) => {
        // 发布状态必须有封面（可根据需求调整）
        if (formData.status === 1 && !formData.coverImageFileId) {
          callback(new Error('发布需要上传封面图'));
        } else {
          callback();
        }
      },
      trigger: 'change'
    }
  ],
  tagIds: [
    {
      validator: (rule: any, value: any[], callback: any) => {
        const hasTags = tagList.value.length > 0;
        if (formData.status === 1 && hasTags && (!value || value.length === 0)) {
          callback(new Error('发布需要至少选择一个标签'));
        } else {
          callback();
        }
      },
      trigger: 'change'
    }
  ],
});

watch(() => formData.status, () => { nextTick(()=> { formRef.value?.validateField?.('tagIds'); formRef.value?.validateField?.('coverImageFileId'); }); });

// 进入编辑模式（根据路由参数 id）
async function initForm() {
  const id = route.params.id || route.query.id;
  const tasks: Promise<any>[] = [loadTags()];
  if (id) {
    loading.value = true;
    tasks.push(
      BlogPostAPI.getDetail(id as string)
        .then((data: BlogPostVO) => {
          formData.id = data.id;
          formData.title = data.title || '';
          formData.summary = data.summary || '';
          formData.content = data.content || '';
          formData.coverImageFileId = data.coverImageFileId as any;
          formData.coverImage = data.coverImage || '';
          formData.status = data.status ?? 0;
          formData.pinned = data.pinned ?? 0;
          formData.isRecommend = data.isRecommend ?? 0;
          const ids = data.tags?.map(t => t.id!) || [];
          formData.tagIds = ids;
          ids.forEach(idVal => {
            if (!tagList.value.some(t => t.id === idVal)) {
              tagList.value.push({ id: idVal, name: `(已失效标签 ${idVal})`, status: 0 });
            }
          });
        })
        .catch(()=> ElMessage.error('文章加载失败'))
        .finally(()=> { loading.value = false; })
    );
  }
  await Promise.all(tasks);
  initialized.value = true;
}

function handleSubmit(targetStatus: number) {
  formData.status = targetStatus;
  formRef.value.validate((valid: boolean) => {
    if (!valid) return;
    submitting.value = true;
    BlogPostAPI.upsert(formData)
      .then(() => {
        ElMessage.success(formData.id ? '保存成功' : targetStatus === 1 ? '发布成功' : '草稿已保存');
        blogPostStore.markNeedRefresh();
        router.back();
      })
      .finally(() => (submitting.value = false));
  });
}

function handleReset() {
  formRef.value.resetFields();
  formData.status = 0;
  formData.tagIds = [];
  formData.pinned = 0;
  formData.isRecommend = 0;
}

function goBack() {
  router.back();
}

async function loadTags() {
  tagLoading.value = true;
  try {
    const data = await getTagList();
    // 排序：启用优先 -> sort 升序 -> name
    tagList.value = (data || []).slice().sort((a,b)=> {
      if ((a.status??1)!==(b.status??1)) return (b.status??1)-(a.status??1); // 启用(1)在前
      if ((a.sort??9999)!==(b.sort??9999)) return (a.sort??9999)-(b.sort??9999);
      return (a.name||'').localeCompare(b.name||'');
    });
    // 如果编辑模式在详情加载之前先拿到标签，详情再回填 tagIds；如果详情先到，这里合并可能缺失的标签
    if (formData.tagIds && formData.tagIds.length) {
      const missing = formData.tagIds.filter(id => !tagList.value.some(t=> t.id === id));
      if (missing.length) {
        tagList.value.push(...missing.map(id=> ({ id, name: `(已失效标签 ${id})`, status: 0 })) as any);
      }
    }
  } finally {
    tagLoading.value = false;
  }
}

function onCoverUploadSuccess(fileInfo: any) {
  formData.coverImageFileId = fileInfo?.id;
  if (fileInfo?.url) formData.coverImage = fileInfo.url;
}

onActivated(() => {
  initForm();
});
</script>

<style scoped lang="scss">
.blog-post-form {
  .content-item :deep(.w-e-text-container) {
    min-height: 320px;
  }
}
</style>
