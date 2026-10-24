import request from "@/utils/request";

const BLOG_SITE_CONFIG_BASE_URL = "/api/v1/blog/site-config";

export interface SiteHeroConfig {
  eyebrow?: string;
  title?: string;
  subtitle?: string;
  imageFileId?: number | string;
  imageUrl?: string;
}

export interface SiteSidebarProfileConfig {
  avatarFileId?: number | string;
  avatarUrl?: string;
  name?: string;
  intro?: string;
}

export interface SiteSidebarNoticeConfig {
  title?: string;
  content?: string;
}

export interface SiteContactConfig {
  qq?: string;
  github?: string;
  gitee?: string;
  email?: string;
  wechat?: string;
  csdn?: string;
  qqGroup?: string;
}

export interface SiteAboutConfig {
  title?: string;
  repoLabel?: string;
  repoName?: string;
  repoUrl?: string;
}

export interface SiteFooterConfig {
  copyrightText?: string;
  primaryText?: string;
  siteStartTime?: string;
}

export interface BlogSiteConfigForm {
  homeHero: SiteHeroConfig;
  tagsHero: SiteHeroConfig;
  archivesHero: SiteHeroConfig;
  friendLinksHero: SiteHeroConfig;
  chatHero: SiteHeroConfig;
  messageBoard: SiteMessageBoardConfig;
  about: SiteAboutConfig;
  sidebarProfile: SiteSidebarProfileConfig;
  sidebarNotice: SiteSidebarNoticeConfig;
  contact: SiteContactConfig;
  footer: SiteFooterConfig;
}

export function createDefaultBlogSiteConfigForm(): BlogSiteConfigForm {
  return {
    homeHero: {
      eyebrow: "HOME",
      title: "KLEE BLOG",
      subtitle: "就算一次也好，我想在这颗星球上尽情奔跑。",
      imageFileId: undefined,
      imageUrl: "",
    },
    tagsHero: {
      eyebrow: "TAGS",
      title: "标签",
      subtitle: "把站内主题拆成更易浏览的入口，保留一些轻量的标签墙氛围。",
      imageFileId: undefined,
      imageUrl: "",
    },
    archivesHero: {
      eyebrow: "ARCHIVES",
      title: "归档",
      subtitle: "把最近三年的文章按照年份和月份整理在一起，保留一点旧博客的仪式感。",
      imageFileId: undefined,
      imageUrl: "",
    },
    friendLinksHero: {
      eyebrow: "LINKS",
      title: "友链",
      subtitle: "把常逛的站点独立整理成一页，作为博客外延阅读的入口。",
      imageFileId: undefined,
      imageUrl: "",
    },
    chatHero: {
      eyebrow: "CHAT",
      title: "聊天室",
      subtitle: "保留站点统一的波浪页首，下面进入实时聊天和在线状态。",
      imageFileId: undefined,
      imageUrl: "",
    },
    messageBoard: {
      backgroundFileId: undefined,
      backgroundUrl: "",
    },
    about: {
      title: "关于",
      repoLabel: "项目开源地址：",
      repoName: "KLEE - BLOG",
      repoUrl: "https://gitee.com/variable-wing-core/klee-blog",
    },
    sidebarProfile: {
      avatarFileId: undefined,
      avatarUrl: "",
      name: "可变羽翼核心",
      intro: "欢迎来到可变羽翼核心。",
    },
    sidebarNotice: {
      title: "公告",
      content: "关注塔菲喵！关注永雏塔菲谢谢喵！！",
    },
    contact: {
      qq: "",
      github: "https://github.com/variable-wing-core/klee-blog",
      gitee: "https://gitee.com/variable-wing-core/klee-blog",
      email: "admin@example.com",
      wechat: "",
      csdn: "",
      qqGroup: "",
    },
    footer: {
      copyrightText: "© 可变羽翼核心 2022",
      primaryText: "本站内容仅作学习交流与个人记录使用",
      siteStartTime: "2022-01-01T00:00:00",
    },
  };
}

function normalizeHero(hero?: SiteHeroConfig): SiteHeroConfig {
  return {
    eyebrow: hero?.eyebrow || "",
    title: hero?.title || "",
    subtitle: hero?.subtitle || "",
    imageFileId: hero?.imageFileId,
    imageUrl: hero?.imageUrl || "",
  };
}

export function normalizeBlogSiteConfigForm(data?: Partial<BlogSiteConfigForm>): BlogSiteConfigForm {
  const defaults = createDefaultBlogSiteConfigForm();
  return {
    homeHero: {...defaults.homeHero, ...normalizeHero(data?.homeHero)},
    tagsHero: {...defaults.tagsHero, ...normalizeHero(data?.tagsHero)},
    archivesHero: {...defaults.archivesHero, ...normalizeHero(data?.archivesHero)},
    friendLinksHero: {...defaults.friendLinksHero, ...normalizeHero(data?.friendLinksHero)},
    chatHero: {...defaults.chatHero, ...normalizeHero(data?.chatHero)},
    messageBoard: {...defaults.messageBoard, ...(data?.messageBoard || {})},
    about: {...defaults.about, ...(data?.about || {})},
    sidebarProfile: {...defaults.sidebarProfile, ...(data?.sidebarProfile || {})},
    sidebarNotice: {...defaults.sidebarNotice, ...(data?.sidebarNotice || {})},
    contact: {...defaults.contact, ...(data?.contact || {})},
    footer: {...defaults.footer, ...(data?.footer || {})},
  };
}

function buildSubmitPayload(form: BlogSiteConfigForm) {
  return {
    homeHero: {
      eyebrow: form.homeHero.eyebrow,
      title: form.homeHero.title,
      subtitle: form.homeHero.subtitle,
      imageFileId: form.homeHero.imageFileId,
    },
    tagsHero: {
      eyebrow: form.tagsHero.eyebrow,
      title: form.tagsHero.title,
      subtitle: form.tagsHero.subtitle,
      imageFileId: form.tagsHero.imageFileId,
    },
    archivesHero: {
      eyebrow: form.archivesHero.eyebrow,
      title: form.archivesHero.title,
      subtitle: form.archivesHero.subtitle,
      imageFileId: form.archivesHero.imageFileId,
    },
    friendLinksHero: {
      eyebrow: form.friendLinksHero.eyebrow,
      title: form.friendLinksHero.title,
      subtitle: form.friendLinksHero.subtitle,
      imageFileId: form.friendLinksHero.imageFileId,
    },
    chatHero: {
      eyebrow: form.chatHero.eyebrow,
      title: form.chatHero.title,
      subtitle: form.chatHero.subtitle,
      imageFileId: form.chatHero.imageFileId,
    },
    messageBoard: {
      backgroundFileId: form.messageBoard.backgroundFileId,
    },
    sidebarProfile: {
      avatarFileId: form.sidebarProfile.avatarFileId,
      name: form.sidebarProfile.name,
      intro: form.sidebarProfile.intro,
    },
    sidebarNotice: {
      title: form.sidebarNotice.title,
      content: form.sidebarNotice.content,
    },
    contact: {...form.contact},
    about: {...form.about},
    footer: {
      copyrightText: form.footer.copyrightText,
      primaryText: form.footer.primaryText,
      siteStartTime: form.footer.siteStartTime,
    },
  };
}

const BlogSiteConfigAPI = {
  getDetail() {
    return request<any, BlogSiteConfigForm>({
      url: `${BLOG_SITE_CONFIG_BASE_URL}/detail`,
      method: "get",
    });
  },
  update(data: BlogSiteConfigForm) {
    return request({
      url: BLOG_SITE_CONFIG_BASE_URL,
      method: "put",
      data: buildSubmitPayload(data),
    });
  },
};

export default BlogSiteConfigAPI;