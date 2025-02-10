import type { MonetizationConfig } from './types';

export const MONETIZATION_LIMITS = {
	BANNER_ADS: {
		MIN: 0.02,
		MAX: 0.25,
		DEFAULT: 0.05,
	},
	SUPER_HEART: {
		MIN: 0.25,
		MAX: 3.0,
		DEFAULT: 0.25,
	},
	AD_FREE: {
		MIN: 0.5,
		MAX: 5.0,
		DEFAULT: 0.5,
	},
} as const;

// Revenue rates that can be dynamically adjusted
export const monetizationConfig: MonetizationConfig = {
	banner_ad_revenue_per_user_per_week: MONETIZATION_LIMITS.BANNER_ADS.DEFAULT,
	super_heart_revenue_per_user_per_week:
		MONETIZATION_LIMITS.SUPER_HEART.DEFAULT,
	ad_free_revenue_per_user_per_week: MONETIZATION_LIMITS.AD_FREE.DEFAULT,
};
