import type { MarketingConfig } from './types';

export const MARKETING_LIMITS = {
	NEWSPAPER_ADS: {
		MIN: 100,
		MAX: 10000,
		DEFAULT: 500,
		VIRALITY_MULTIPLIER: 1.0, // Base multiplier
	},

	RADIO_ADS: {
		MIN: 500,
		MAX: 25000,
		DEFAULT: 2500,
		VIRALITY_MULTIPLIER: 1.5, // Medium reach and cost
	},
	COLLEGE_CAMPUS: {
		MIN: 250,
		MAX: 15000,
		DEFAULT: 1000,
		VIRALITY_MULTIPLIER: 2.0, // Good reach for younger demographic
	},
	TV_INFOMERCIAL: {
		MIN: 1000,
		MAX: 50000,
		DEFAULT: 5000,
		VIRALITY_MULTIPLIER: 2.5, // Higher reach but more expensive
	},
} as const;

// Default marketing spend rates
export const marketingConfig: MarketingConfig = {
	newspaper_ads_weekly_spend: MARKETING_LIMITS.NEWSPAPER_ADS.DEFAULT,
	tv_infomercial_weekly_spend: MARKETING_LIMITS.TV_INFOMERCIAL.DEFAULT,
	radio_ads_weekly_spend: MARKETING_LIMITS.RADIO_ADS.DEFAULT,
	college_campus_weekly_spend: MARKETING_LIMITS.COLLEGE_CAMPUS.DEFAULT,
};
