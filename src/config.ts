import type {
    ExpressiveCodeConfig,
	GitHubEditConfig,   // 【新增】
	ImageFallbackConfig,// 【新增】
	LicenseConfig,
	NavBarConfig,
	ProfileConfig,
	SiteConfig,
	UmamiConfig,        // 【新增】
} from "./types/config";
import { LinkPreset } from "./types/config";

export const siteConfig: SiteConfig = {
	title: "Moeku's Blog",
	subtitle: "技术分享与实践",
	description: "分享网络技术",
	keywords: [],
	lang: "zh_CN",
	themeColor: {
		hue: 361,
		fixed: false,
	},
	banner: {
		enable: false,
		src: "/xinghui.avif",
		position: "center",
		credit: {
			enable: true,
			text: "Pixiv @chokei",
			url: "https://www.pixiv.net/artworks/122782209",
		},
	},
	background: {
		enable: true,
		src: "https://eopfapi.2b2x.cn/pic?img=ua",
		position: "center",
		size: "cover",
		repeat: "no-repeat",
		attachment: "fixed",
		opacity: 0.5,
	},
	toc: {
		enable: true,
		depth: 2,
	},
	favicon: [
		{
			src: "https://q2.qlogo.cn/headimg_dl?dst_uin=719571357&spec=0",
		},
	],
};

export const navBarConfig: NavBarConfig = {
	links: [
		LinkPreset.Home,
		LinkPreset.Archive,
		LinkPreset.About,
		{
			name: "友链",
			url: "/friends/",
			external: false,
		},
		{
			name: "赞助",
			url: "/sponsors/",
			external: false,
		},
		{
			name: "统计",
			url: "https://cloud.umami.is/share/2g9iwbTAZ1Q9f4J1",
			external: true,
		},
		{
			name: "状态",
			url: "https://stats.uptimerobot.com/9zzwJBVvvL",
			external: true,
		},
	],
};

export const profileConfig: ProfileConfig = {
	avatar: "https://q2.qlogo.cn/headimg_dl?dst_uin=719571357&spec=0",
	name: "卡介菌",
	bio: "时光流转，愿你与珍爱之人再度重逢。",
	links: [
		{
			name: "Bilibli",
			icon: "fa6-brands:bilibili",
			url: "https://space.bilibili.com/439704151",
		},
		{
			name: "GitHub",
			icon: "fa6-brands:github",
			url: "https://github.com/Kajiekazz",
		},
	],
};

export const licenseConfig: LicenseConfig = {
	enable: true,
	name: "CC BY-NC-SA 4.0",
	url: "https://creativecommons.org/licenses/by-nc-sa/4.0/",
};

export const expressiveCodeConfig: ExpressiveCodeConfig = {
	theme: "github-dark",
};

export const statsConfig = {
	viewsText: "浏览",
	visitsText: "访客",
	loadingText: "统计加载中...",
	unavailableText: "统计不可用。请检查是否屏蔽了Umami域名，如AdGuard和AdBlock等插件",
	getStatsText: (pageViews: number, visits: number) => `${statsConfig.viewsText} ${pageViews} · ${statsConfig.visitsText} ${visits}`,
};

// =========== 以下是为您补全的缺失配置 ===========

// 【新增】Umami 统计配置
// 注意：shareId 填的是您的 Website ID (UUID)，用于 API 调用
export const umamiConfig: UmamiConfig = {
	enable: true,
	baseUrl: "https://cloud.umami.is",
	shareId: "310b95a5-41a7-4032-9118-54960f6bb57b", // 从您之前的代码中提取的 ID
	timezone: "Asia/Shanghai",
};

// 【新增】GitHub 编辑按钮配置
export const gitHubEditConfig: GitHubEditConfig = {
	enable: true,
	baseUrl: "https://github.com/Kajiekazz/fuwari--/blob/main/src/content/posts",
};

// 【新增】图片回源配置 (防止类型错误，默认禁用)
export const imageFallbackConfig: ImageFallbackConfig = {
	enable: false,
	originalDomain: "",
	fallbackDomain: "",
};