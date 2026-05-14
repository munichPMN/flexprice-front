// src/config/authTemplates.ts

export enum AUTH_TEMPLATE {
	TEMPLATE_1 = 'template_1',
	TEMPLATE_2 = 'template_2',
}

// Moved from branding.ts — re-exported from there for backward compat
export enum LandingTheme {
	Light = 'light',
	Dark = 'dark',
}

export enum LandingContentAlign {
	Left = 'left',
	Center = 'center',
}

export interface Template1Config {
	tagline: string | null;
	supportEmail: string;
	loginBgImage: string | null;
	slackCommunityUrl: string | null;
	showTestimonials: boolean;
	landingTheme: LandingTheme;
	landingContentAlign: LandingContentAlign;
	showLogoOnLanding: boolean;
}

export interface Template2Config {
	tagline: string | null;
	supportEmail: string;
	loginBgImage: string | null;
	landingBgColor: string | null;
	showLogoOnLanding: boolean;
}

// Discriminated union — TypeScript narrows config type from template field, no casts needed
export type AuthPageConfig =
	| { template: AUTH_TEMPLATE.TEMPLATE_1; config: Template1Config }
	| { template: AUTH_TEMPLATE.TEMPLATE_2; config: Template2Config };

export interface RegionOption {
	key: string; // e.g. "india", "us", "sa"
	label: string; // e.g. "India", "United States"
	url: string; // full dashboard URL
	countryCode: string; // ISO 3166-1 alpha-2, e.g. "IN", "US"
}

export interface RegionsConfig {
	enabled: boolean;
	regions: RegionOption[];
}
