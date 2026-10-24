import { store } from "@/store";

/**
 * 博客文章相关临时状态（例如列表刷新标记）
 */
export const useBlogPostStore = defineStore("blog-post", () => {
  // 是否需要刷新文章列表（一次性标记）
  const needRefresh = ref(false);

  /** 标记列表需要刷新 */
  function markNeedRefresh() {
    needRefresh.value = true;
  }

  /**
   * 消费刷新标记：如果为 true 返回 true 并重置为 false；否则返回 false
   */
  function consumeRefreshFlag(): boolean {
    if (needRefresh.value) {
      needRefresh.value = false;
      return true;
    }
    return false;
  }

  return { needRefresh, markNeedRefresh, consumeRefreshFlag };
});

/** 组件外使用 */
export function useBlogPostStoreHook() {
  return useBlogPostStore(store);
}

