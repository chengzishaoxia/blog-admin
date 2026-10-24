/**
 * 通用图片压缩工具
 * 提供按目标大小迭代降低质量的压缩策略，支持限制最大宽高与可选转换为 JPEG。
 */
export interface ImageCompressOptions {
  imageCompression?: boolean;          // 是否开启压缩
  quality?: number;                    // 初始质量 0-1
  targetSizeKB?: number;               // 目标大小(KB) 超过则尝试降质
  minQuality?: number;                 // 最低质量
  qualityStep?: number;                // 每次递减步长
  maxWidth?: number;                   // 最大宽度 (超过按比例缩放)
  maxHeight?: number;                  // 最大高度 (超过按比例缩放)
  minCompressSizeMB?: number;          // 原文件体积小于该值(MB)且也不超过目标大小时跳过压缩
  convertToJPEG?: boolean;             // 是否强制转 JPEG (会丢透明度)
  skipGif?: boolean;                   // 是否跳过 GIF (防止动图丢帧)
  preserveUid?: boolean;               // 是否保留 element-plus 内部的 uid 属性
}

const DEFAULT_OPTS: Required<Omit<ImageCompressOptions, 'preserveUid'>> = {
  imageCompression: true,
  quality: 0.9,
  targetSizeKB: 300,
  minQuality: 0.4,
  qualityStep: 0.1,
  maxWidth: 1920,
  maxHeight: 1080,
  minCompressSizeMB: 0.3,
  convertToJPEG: false,
  skipGif: true,
};

/**
 * 压缩图片文件（仅在压缩后更小才返回新文件）。
 * 可能出现情况：非 jpeg/webp（如 png）质量参数影响有限；若无法达到目标只要变小仍会返回。
 */
export function compressImage(originalFile: File, options?: ImageCompressOptions): Promise<File> {
  const opts = { ...DEFAULT_OPTS, ...(options || {}) };
  return new Promise((resolve, reject) => {
    // 跳过条件
    const targetBytes = opts.targetSizeKB * 1024;
    if (!opts.imageCompression) return resolve(originalFile);
    if (opts.skipGif && originalFile.type === 'image/gif') return resolve(originalFile);
    if (!originalFile.type.startsWith('image/')) return resolve(originalFile);
    if (originalFile.size < opts.minCompressSizeMB * 1024 * 1024 && originalFile.size <= targetBytes) {
      return resolve(originalFile);
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let w = img.naturalWidth;
        let h = img.naturalHeight;
        // 限制尺寸
        if (w > opts.maxWidth) {
          const r = opts.maxWidth / w; w = opts.maxWidth; h = Math.round(h * r);
        }
        if (h > opts.maxHeight) {
          const r = opts.maxHeight / h; h = opts.maxHeight; w = Math.round(w * r);
        }
        try {
          const canvas = document.createElement('canvas');
          canvas.width = w; canvas.height = h;
          const ctx = canvas.getContext('2d');
          if (!ctx) return resolve(originalFile);
          ctx.drawImage(img, 0, 0, w, h);
          const mime = opts.convertToJPEG ? 'image/jpeg' : originalFile.type;
          let quality = opts.quality;

          const toBlob = (q: number): Promise<Blob | null> => new Promise(res => canvas.toBlob(b => res(b), mime, q));

            (async () => {
              let blob = await toBlob(quality);
              if (!blob) return resolve(originalFile);
              // 满足目标 & 更小直接返回
              if (blob.size < originalFile.size && blob.size <= targetBytes) {
                return resolve(finalize(blob));
              }
              const canIterate = mime === 'image/jpeg' || mime === 'image/webp';
              while (canIterate && blob.size > targetBytes && quality > opts.minQuality) {
                const prevSize = blob.size;
                quality = parseFloat((quality - opts.qualityStep).toFixed(2));
                if (quality < opts.minQuality) quality = opts.minQuality;
                const nextBlob = await toBlob(quality);
                if (!nextBlob) break;
                // 若缩减不明显 (<1KB) 则终止
                if (prevSize - nextBlob.size < 1024) { blob = nextBlob; break; }
                blob = nextBlob;
              }
              // 若压缩后更小则返回压缩版，否则返回原始文件
              if (blob.size < originalFile.size) {
                return resolve(finalize(blob));
              }
              resolve(originalFile);
            })().catch(err => {
              console.warn('compressImage iterate error', err);
              resolve(originalFile);
            });
        } catch (err) {
          console.warn('compressImage canvas error', err);
          resolve(originalFile);
        }
      };
      img.onerror = () => reject(new Error('图片加载失败'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('文件读取失败'));
    reader.readAsDataURL(originalFile);

    function finalize(blob: Blob): File {
      const compressed = new File([blob], originalFile.name, { type: opts.convertToJPEG ? 'image/jpeg' : originalFile.type });
      if (opts.preserveUid && (originalFile as any).uid) {
        (compressed as any).uid = (originalFile as any).uid;
      }
      return compressed;
    }
  });
}

export default compressImage;

