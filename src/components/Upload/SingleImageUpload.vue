<!-- 单图上传组件 -->
<template>
  <el-upload
    class="single-upload"
    list-type="picture-card"
    :show-file-list="false"
    :accept="props.accept"
    :before-upload="handleBeforeUpload"
    :http-request="handleUpload"
    :on-success="onSuccess"
    :on-error="onError"
  >
    <template #default>
      <template v-if="modelValue">
        <el-image
          class="single-upload__image"
          :src="modelValue"
          :preview-src-list="[modelValue]"
          :fit="props.fit"
          @click.stop="handlePreview"
        />
        <el-icon class="single-upload__delete-btn" @click.stop="handleDelete">
          <CircleCloseFilled/>
        </el-icon>
      </template>
      <template v-else>
        <el-icon>
          <Plus/>
        </el-icon>
      </template>
    </template>
  </el-upload>
</template>

<script setup lang="ts">
import {UploadRawFile, UploadRequestOptions} from "element-plus";
import FileAPI, {FileInfo} from "@/api/file-api";
import type {PropType} from 'vue';
// 新增导入
import {CircleCloseFilled, Plus} from '@element-plus/icons-vue';
import compressImage from '@/utils/compress-image';

const emit = defineEmits<{
  (e: 'success', fileInfo: FileInfo): void
  (e: 'error', error: any): void
}>();

const props = defineProps({
  /**
   * 请求携带的额外参数
   */
  data: {
    type: Object,
    default: () => {
      return {};
    },
  },
  /**
   * 上传文件的参数名
   */
  name: {type: String, default: "file"},
  /**
   * 最大文件大小（单位：M）
   */
  maxFileSize: {type: Number, default: 10},
  /**
   * 上传图片格式，默认支持所有图片(image/*)，指定格式示例：'.png,.jpg,.jpeg,.gif,.bmp'
   */
  accept: {type: String, default: "image/*"},
  /**
   * 自定义样式，用于设置组件的宽度和高度等其他样式
   */
  style: {type: Object, default: () => ({width: "150px", height: "150px"})},
  /** 图片填充模式：cover | contain | fill | none | scale-down */
  fit: {type: String as PropType<'' | 'fill' | 'cover' | 'none' | 'contain' | 'scale-down'>, default: 'cover'},
  // 新增压缩相关配置
  imageCompression: {type: Boolean, default: true},
  quality: {type: Number, default: 0.9},
  targetSizeKB: {type: Number, default: 300},
  minQuality: {type: Number, default: 0.4},
  qualityStep: {type: Number, default: 0.1},
  maxWidth: {type: Number, default: 1920},
  maxHeight: {type: Number, default: 1080},
  minCompressSizeMB: {type: Number, default: 0.3},
  convertToJPEG: {type: Boolean, default: false},
});

const modelValue = defineModel("modelValue", {
  type: String,
  default: () => "",
});

/**
 * 限制用户上传文件的格式和大小
 */
function handleBeforeUpload(file: UploadRawFile) {
  // 校验文件类型：虽然 accept 属性限制了用户在文件选择器中可选的文件类型，但仍需在上传时再次校验文件实际类型，确保符合 accept 的规则
  const acceptTypes = props.accept.split(",").map((type) => type.trim());

  // 检查文件格式是否符合 accept
  const isValidType = acceptTypes.some((type) => {
    if (type === "image/*") {
      // 如果是 image/*，检查 MIME 类型是否以 "image/" 开头
      return file.type.startsWith("image/");
    } else if (type.startsWith(".")) {
      // 如果是扩展名 (.png, .jpg)，检查文件名是否以指定扩展名结尾
      return file.name.toLowerCase().endsWith(type);
    } else {
      // 如果是具体的 MIME 类型 (image/png, image/jpeg)，检查是否完全匹配
      return file.type === type;
    }
  });

  if (!isValidType) {
    ElMessage.warning(`上传文件的格式不正确，仅支持：${props.accept}`);
    return false;
  }

  // 限制文件大小
  if (file.size > props.maxFileSize * 1024 * 1024) {
    ElMessage.warning("上传图片不能大于" + props.maxFileSize + "M");
    return false;
  }
  return true;
}

// 修改上传：加入压缩流程
function handleUpload(options: UploadRequestOptions) {
  return new Promise(async (resolve, reject) => {
    let file = options.file as File;
    if (props.imageCompression && file.type.startsWith('image/')) {
      try {
        file = await compressImage(file, {
          imageCompression: props.imageCompression,
          quality: props.quality,
          targetSizeKB: props.targetSizeKB,
          minQuality: props.minQuality,
          qualityStep: props.qualityStep,
          maxWidth: props.maxWidth,
          maxHeight: props.maxHeight,
          minCompressSizeMB: props.minCompressSizeMB,
          convertToJPEG: props.convertToJPEG,
          preserveUid: false,
        });
      } catch (err) {
        console.warn('单图压缩失败，使用原文件', err);
      }
    }
    const formData = new FormData();
    formData.append(props.name, file);
    Object.keys(props.data).forEach((key) => {
      formData.append(key, (props.data as any)[key]);
    });
    FileAPI.upload(formData)
      .then((data) => resolve(data))
      .catch((error) => reject(error));
  });
}

/**
 * 预览图片
 */
function handlePreview() {
  console.log("预览图片,停止冒泡");
}

/**
 * 删除图片
 */
function handleDelete() {
  modelValue.value = "";
}

/**
 * 上传成功回调
 *
 * @param fileInfo 上传成功后的文件信息
 */
const onSuccess = (fileInfo: FileInfo) => {
  ElMessage.success("上传成功");
  modelValue.value = fileInfo.url;
  emit('success', fileInfo);
};

/**
 * 上传失败回调
 */
const onError = (error: any) => {
  console.log("onError");
  ElMessage.error("上传失败: " + error.message);
  emit('error', error);
};
</script>

<style scoped lang="scss">
:deep(.el-upload--picture-card) {
  position: relative;
  width: v-bind("props.style.width ?? '150px'");
  height: v-bind("props.style.height ?? '150px'");
  overflow: hidden; // 防止图片溢出
  display: flex;
  align-items: center;
  justify-content: center;
}

.single-upload {
  &__image {
    width: 100%;
    height: 100%;
    display: block;
  }

  &__image :deep(img),
  &__image :deep(.el-image__inner) {
    width: 100%;
    height: 100%;
    object-fit: v-bind("props.fit");
    display: block;
  }

  &__delete-btn {
    position: absolute;
    top: 2px;
    right: 2px;
    font-size: 16px;
    color: #ff7901;
    cursor: pointer;
    background: #fff;
    border-radius: 100%;
    z-index: 2;
    box-shadow: 0 0 4px rgba(0, 0, 0, .18);
    padding: 2px;

    &:hover {
      color: #ff4500;
    }
  }
}
</style>
