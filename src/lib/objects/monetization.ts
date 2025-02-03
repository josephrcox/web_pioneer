import type { MonetizationConfig } from './types';

// Revenue rates that can be dynamically adjusted
export const monetizationConfig: MonetizationConfig = {
	banner_ad_revenue_per_user_per_week: 0.003, // Basic 1995 banner ad revenue
	super_heart_revenue_per_user_per_week: 1.0, // Premium feature
	ad_free_revenue_per_user_per_week: 2.0, // Premium feature
};
