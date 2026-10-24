<template>
  <div class="app-container blog-site-config-page" v-loading="loading">
    <el-form ref="formRef" :model="form" :rules="rules" label-width="110px" class="site-config-form">
      <el-row :gutter="16">
        <el-col :xs="24" :lg="12">
          <el-card shadow="hover" class="config-card">
            <template #header>
              <div class="card-title">首页页首</div>
            </template>
            <SiteHeroFields :model-value="form.homeHero" prop-prefix="homeHero" :show-subtitle="false" :show-image="false" />
          </el-card>
        </el-col>
        <el-col :xs="24" :lg="12">
          <el-card shadow="hover" class="config-card">
            <template #header>
              <div class="card-title">留言板背景</div>
            </template>
            <el-form-item label="背景图片">
              <div class="hero-upload-field">
                <SingleImageUpload
                  v-model="form.messageBoard.backgroundUrl"
                  :data="{ usageType: 'SITE_CONFIG' }"
                  style="width: 220px; height: 124px"
                  fit="cover"
                  @success="onMessageBoardUploadSuccess"
                />
                <div class="hero-upload-meta">
                  <div class="hero-upload-tip">
                    {{ form.messageBoard.backgroundFileId ? `文件ID：${form.messageBoard.backgroundFileId}` : '前台留言板全屏背景图' }}
                  </div>
                  <el-button link type="danger" @click="clearMessageBoardImage">清空图片</el-button>
                </div>
              </div>
            </el-form-item>
          </el-card>
        </el-col>

        <el-col :xs="24" :lg="12">
          <el-card shadow="hover" class="config-card">
            <template #header>
              <div class="card-title">标签页首</div>
            </template>
            <SiteHeroFields :model-value="form.tagsHero" prop-prefix="tagsHero" />
          </el-card>
        </el-col>
        <el-col :xs="24" :lg="12">
          <el-card shadow="hover" class="config-card">
            <template #header>
              <div class="card-title">归档页首</div>
            </template>
            <SiteHeroFields :model-value="form.archivesHero" prop-prefix="archivesHero" />
          </el-card>
        </el-col>
        <el-col :xs="24" :lg="12">
          <el-card shadow="hover" class="config-card">
            <template #header>
              <div class="card-title">友链页首</div>
            </template>
            <SiteHeroFields :model-value="form.friendLinksHero" prop-prefix="friendLinksHero" />
          </el-card>
        </el-col>
        <el-col :xs="24" :lg="12">
          <el-card shadow="hover" class="config-card">
            <template #header>
              <div class="card-title">聊天室页首</div>
            </template>
            <SiteHeroFields :model-value="form.chatHero" prop-prefix="chatHero" />
          </el-card>
        </el-col>

        <el-col :xs="24" :lg="12">
          <el-card shadow="hover" class="config-card">
            <template #header>
              <div class="card-title">侧栏资料</div>
            </template>
            <el-form-item label="头像">
              <div class="hero-upload-field">
                <SingleImageUpload
                  v-model="form.sidebarProfile.avatarUrl"
                  :data="{ usageType: 'SITE_CONFIG' }"
                  style="width: 160px; height: 160px"
                  fit="cover"
                  @success="onSidebarAvatarUploadSuccess"
                />
                <div class="hero-upload-meta">
                  <div class="hero-upload-tip">
                    {{ form.sidebarProfile.avatarFileId ? `文件ID：${form.sidebarProfile.avatarFileId}` : '侧栏头像建议上传 1:1 图片' }}
                  </div>
                  <el-button link type="danger" @click="clearSidebarAvatar">清空头像</el-button>
                </div>
              </div>
            </el-form-item>
            <el-form-item label="昵称" prop="sidebarProfile.name">
              <el-input v-model="form.sidebarProfile.name" maxlength="32" />
            </el-form-item>
            <el-form-item label="简介" prop="sidebarProfile.intro">
              <el-input v-model="form.sidebarProfile.intro" type="textarea" :rows="3" maxlength="120" show-word-limit />
            </el-form-item>
          </el-card>
        </el-col>
        <el-col :xs="24" :lg="12">
          <el-card shadow="hover" class="config-card">
            <template #header>
              <div class="card-title">侧栏公告</div>
            </template>
            <el-form-item label="标题" prop="sidebarNotice.title">
              <el-input v-model="form.sidebarNotice.title" maxlength="32" />
            </el-form-item>
            <el-form-item label="内容" prop="sidebarNotice.content">
              <el-input v-model="form.sidebarNotice.content" type="textarea" :rows="4" maxlength="200" show-word-limit />
            </el-form-item>
          </el-card>
        </el-col>

        <el-col :xs="24" :lg="12">
          <el-card shadow="hover" class="config-card">
            <template #header>
              <div class="card-title">联系方式</div>
            </template>
            <el-form-item label="QQ">
              <el-input v-model="form.contact.qq" maxlength="32" />
            </el-form-item>
            <el-form-item label="微信">
              <el-input v-model="form.contact.wechat" maxlength="64" />
            </el-form-item>
            <el-form-item label="邮箱">
              <el-input v-model="form.contact.email" maxlength="120" />
            </el-form-item>
            <el-form-item label="GitHub">
              <el-input v-model="form.contact.github" maxlength="255" />
            </el-form-item>
            <el-form-item label="Gitee">
              <el-input v-model="form.contact.gitee" maxlength="255" />
            </el-form-item>
            <el-form-item label="CSDN">
              <el-input v-model="form.contact.csdn" maxlength="255" />
            </el-form-item>
            <el-form-item label="QQ群">
              <el-input v-model="form.contact.qqGroup" maxlength="64" />
            </el-form-item>
          </el-card>
        </el-col>
        <el-col :xs="24" :lg="12">
          <el-card shadow="hover" class="config-card">
            <template #header>
              <div class="card-title">侧栏关于</div>
            </template>
            <el-form-item label="标题" prop="about.title">
              <el-input v-model="form.about.title" maxlength="20" />
            </el-form-item>
            <el-form-item label="前缀文案" prop="about.repoLabel">
              <el-input v-model="form.about.repoLabel" maxlength="50" />
            </el-form-item>
            <el-form-item label="仓库名称" prop="about.repoName">
              <el-input v-model="form.about.repoName" maxlength="50" />
            </el-form-item>
            <el-form-item label="仓库链接" prop="about.repoUrl">
              <el-input v-model="form.about.repoUrl" />
            </el-form-item>
          </el-card>
        </el-col>
        <el-col :xs="24" :lg="12">
          <el-card shadow="hover" class="config-card">
            <template #header>
              <div class="card-title">页脚文案</div>
            </template>
            <el-form-item label="版权文案" prop="footer.copyrightText">
              <el-input v-model="form.footer.copyrightText" maxlength="120" />
            </el-form-item>
            <el-form-item label="主文案" prop="footer.primaryText">
              <el-input v-model="form.footer.primaryText" maxlength="120" />
            </el-form-item>
            <el-form-item label="建站时间" prop="footer.siteStartTime">
              <el-input v-model="form.footer.siteStartTime" maxlength="32" placeholder="例如：2022-01-01T00:00:00" />
            </el-form-item>
          </el-card>
        </el-col>
      </el-row>

      <div class="submit-bar">
        <el-button v-hasPerm="['blog:site-config:update']" type="primary" :loading="submitting" @click="handleSubmit">
          保存站点配置
        </el-button>
      </div>
    </el-form>
  </div>
</template>

<script setup lang="ts">
defineOptions({ name: "BlogSiteConfig", inheritAttrs: false });

import { reactive, ref, defineComponent, h } from "vue";
import { ElButton, ElFormItem, ElInput, ElMessage } from "element-plus";
import type { FormInstance, FormRules } from "element-plus";
import SingleImageUpload from "@/components/Upload/SingleImageUpload.vue";
import type { FileInfo } from "@/api/file-api";
import BlogSiteConfigAPI, {
  createDefaultBlogSiteConfigForm,
  normalizeBlogSiteConfigForm,
  type BlogSiteConfigForm,
  type SiteHeroConfig,
} from "@/api/blog/site-config-api";

const formRef = ref<FormInstance>();
const loading = ref(false);
const submitting = ref(false);
const form = reactive<BlogSiteConfigForm>(createDefaultBlogSiteConfigForm());

const rules = reactive<FormRules>({
  "homeHero.eyebrow": [{ required: true, message: "请输入首页页首眉标题", trigger: "blur" }],
  "homeHero.title": [{ required: true, message: "请输入首页页首标题", trigger: "blur" }],
  "tagsHero.eyebrow": [{ required: true, message: "请输入标签页首眉标题", trigger: "blur" }],
  "tagsHero.title": [{ required: true, message: "请输入标签页首标题", trigger: "blur" }],
  "tagsHero.subtitle": [{ required: true, message: "请输入标签页首副标题", trigger: "blur" }],
  "archivesHero.eyebrow": [{ required: true, message: "请输入归档页首眉标题", trigger: "blur" }],
  "archivesHero.title": [{ required: true, message: "请输入归档页首标题", trigger: "blur" }],
  "archivesHero.subtitle": [{ required: true, message: "请输入归档页首副标题", trigger: "blur" }],
  "friendLinksHero.eyebrow": [{ required: true, message: "请输入友链页首眉标题", trigger: "blur" }],
  "friendLinksHero.title": [{ required: true, message: "请输入友链页首标题", trigger: "blur" }],
  "friendLinksHero.subtitle": [{ required: true, message: "请输入友链页首副标题", trigger: "blur" }],
  "chatHero.eyebrow": [{ required: true, message: "请输入聊天室页首眉标题", trigger: "blur" }],
  "chatHero.title": [{ required: true, message: "请输入聊天室页首标题", trigger: "blur" }],
  "chatHero.subtitle": [{ required: true, message: "请输入聊天室页首副标题", trigger: "blur" }],
  "sidebarProfile.name": [{ required: true, message: "请输入侧栏昵称", trigger: "blur" }],
  "sidebarProfile.intro": [{ required: true, message: "请输入侧栏简介", trigger: "blur" }],
  "sidebarNotice.title": [{ required: true, message: "请输入公告标题", trigger: "blur" }],
  "sidebarNotice.content": [{ required: true, message: "请输入公告内容", trigger: "blur" }],
  "about.title": [{ required: true, message: "请输入关于标题", trigger: "blur" }],
  "about.repoLabel": [{ required: true, message: "请输入关于前缀文案", trigger: "blur" }],
  "about.repoName": [{ required: true, message: "请输入仓库名称", trigger: "blur" }],
  "about.repoUrl": [{ required: true, message: "请输入仓库链接", trigger: "blur" }],
  "footer.copyrightText": [{ required: true, message: "请输入页脚版权文案", trigger: "blur" }],
  "footer.primaryText": [{ required: true, message: "请输入页脚主文案", trigger: "blur" }],
  "footer.siteStartTime": [{ required: true, message: "请输入建站时间", trigger: "blur" }],
});

function assignForm(data: BlogSiteConfigForm) {
  const normalized = normalizeBlogSiteConfigForm(data);
  Object.assign(form.homeHero, normalized.homeHero);
  Object.assign(form.tagsHero, normalized.tagsHero);
  Object.assign(form.archivesHero, normalized.archivesHero);
  Object.assign(form.friendLinksHero, normalized.friendLinksHero);
  Object.assign(form.chatHero, normalized.chatHero);
  Object.assign(form.messageBoard, normalized.messageBoard);
  Object.assign(form.sidebarProfile, normalized.sidebarProfile);
  Object.assign(form.sidebarNotice, normalized.sidebarNotice);
  Object.assign(form.contact, normalized.contact);
  Object.assign(form.about, normalized.about);
  Object.assign(form.footer, normalized.footer);
}

function onMessageBoardUploadSuccess(fileInfo: FileInfo) {
  form.messageBoard.backgroundFileId = fileInfo.id;
  form.messageBoard.backgroundUrl = fileInfo.url;
}

function clearMessageBoardImage() {
  form.messageBoard.backgroundFileId = undefined;
  form.messageBoard.backgroundUrl = "";
}

function onSidebarAvatarUploadSuccess(fileInfo: FileInfo) {
  form.sidebarProfile.avatarFileId = fileInfo.id;
  form.sidebarProfile.avatarUrl = fileInfo.url;
}

function clearSidebarAvatar() {
  form.sidebarProfile.avatarFileId = undefined;
  form.sidebarProfile.avatarUrl = "";
}

function loadData() {
  loading.value = true;
  BlogSiteConfigAPI.getDetail()
    .then((data) => {
      assignForm(data);
    })
    .finally(() => {
      loading.value = false;
    });
}

function handleSubmit() {
  formRef.value?.validate((valid) => {
    if (!valid) return;
    submitting.value = true;
    BlogSiteConfigAPI.update(form)
      .then(() => {
        ElMessage.success("保存成功");
        loadData();
      })
      .finally(() => {
        submitting.value = false;
      });
  });
}

const SiteHeroFields = defineComponent({
  name: "SiteHeroFields",
  props: {
    modelValue: {
      type: Object as () => SiteHeroConfig,
      required: true,
    },
    propPrefix: {
      type: String,
      required: true,
    },
    showSubtitle: {
      type: Boolean,
      default: true,
    },
    showImage: {
      type: Boolean,
      default: true,
    },
  },
  setup(props) {
    const hero = props.modelValue;

    function onUploadSuccess(fileInfo: FileInfo) {
      hero.imageFileId = fileInfo.id;
      hero.imageUrl = fileInfo.url;
    }

    function clearImage() {
      hero.imageFileId = undefined;
      hero.imageUrl = "";
    }

    return () => {
      const items = [
        h(ElFormItem, { label: "眉标题", prop: `${props.propPrefix}.eyebrow` }, () => h(ElInput, {
        modelValue: hero.eyebrow,
        maxlength: 30,
        onInput: (value: string) => { hero.eyebrow = value; },
      })),
      h(ElFormItem, { label: "标题", prop: `${props.propPrefix}.title` }, () => h(ElInput, {
        modelValue: hero.title,
        maxlength: 30,
        onInput: (value: string) => { hero.title = value; },
      })),
      ];

      if (props.showSubtitle) {
        items.push(h(ElFormItem, { label: "副标题", prop: `${props.propPrefix}.subtitle` }, () => h(ElInput, {
          modelValue: hero.subtitle,
          type: "textarea",
          rows: 3,
          maxlength: 120,
          showWordLimit: true,
          onInput: (value: string) => { hero.subtitle = value; },
        })));
      }

      if (props.showImage) {
        items.push(h(ElFormItem, { label: "页首图片" }, () => h("div", { class: "hero-upload-field" }, [
          h(SingleImageUpload, {
            modelValue: hero.imageUrl,
            "onUpdate:modelValue": (value: string) => { hero.imageUrl = value; },
            data: { usageType: "SITE_CONFIG" },
            style: { width: "220px", height: "124px" },
            fit: "cover",
            onSuccess: onUploadSuccess,
          }),
          h("div", { class: "hero-upload-meta" }, [
            h("div", { class: "hero-upload-tip" }, hero.imageFileId ? `文件ID：${hero.imageFileId}` : "建议上传 16:9 横图"),
            h(ElButton, { link: true, type: "danger", onClick: clearImage }, () => "清空图片"),
          ]),
        ])));
      }

      return items;
    };
  },
});

loadData();
</script>

<style scoped lang="scss">
.blog-site-config-page {
  padding: 12px;
}

.site-config-form {
  .config-card {
    margin-bottom: 16px;
  }
}

.card-title {
  font-size: 15px;
  font-weight: 600;
}

.submit-bar {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 8px;
}

:deep(.hero-upload-field) {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

:deep(.hero-upload-meta) {
  display: flex;
  flex-direction: column;
  gap: 8px;
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

:deep(.hero-upload-tip) {
  line-height: 1.5;
}

@media (max-width: 768px) {
  :deep(.hero-upload-field) {
    flex-direction: column;
  }

  .submit-bar {
    justify-content: stretch;
  }
}
</style>