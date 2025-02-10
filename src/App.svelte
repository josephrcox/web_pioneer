<script lang="ts">
	// @ts-ignore
	import {
		g,
		projectsPopupOpen,
		hiringPopupOpen,
		projectSearchPopupOpen,
		promptOpen,
		paused,
	} from './lib/store';
	import { createNewWebsite as initNewWebsite } from './lib/store';
	import Prompt from './lib/Prompt.svelte';
	import HiringPopup from './lib/HiringPopup.svelte';
	import ProjectSearch from './lib/ProjectSearch.svelte';
	import {
		type investmentOpportunity,
		JOB_TYPE,
		type project,
		PROJECT_NAME,
	} from './lib/objects/types';
	import {
		getHighestScore,
		getJobColor,
		getUserCapacity,
		numberToMoney,
		numberWithCommas,
		startProject,
		generateInvestmentFirmName,
		getInvestmentOpportunities,
		acceptInvestment,
		calculateProjectRevenue,
	} from './lib/utils';
	import EmployeeTile from './lib/EmployeeTile.svelte';
	import { onMount } from 'svelte';
	import { startGameLoop } from './lib/gameLoop';
	import {
		MONETIZATION_LIMITS,
		monetizationConfig,
	} from './lib/objects/monetization';
	import { MARKETING_LIMITS, marketingConfig } from './lib/objects/marketing';

	let activeTab = 'server';

	// Computed properties for showing/hiding tabs
	$: hasMarketingCampaigns = $g.website?.projects.some(
		(p) =>
			(p.project.name === PROJECT_NAME.NEWSPAPER_ADS ||
				p.project.name === PROJECT_NAME.RADIO_ADS ||
				p.project.name === PROJECT_NAME.COLLEGE_CAMPUS_CAMPAIGN ||
				p.project.name === PROJECT_NAME.TV_INFOMERCIAL) &&
			p.completed,
	);

	$: hasMonetization = $g.website?.projects.some(
		(p) => p.project.name === PROJECT_NAME.BANNER_ADS && p.completed,
	);

	let inGameTime = '';
	$: inGameTime = `${$g.tick + 9 < 13 ? $g.tick + 9 : $g.tick + 9 - 12}${
		$g.tick + 9 < 12 ? 'AM' : 'PM'
	}`;

	function clearLocalStorage() {
		localStorage.clear();
		window.location.reload();
	}

	function clearProjects() {
		g.update((g) => {
			if (!g.website) return g;
			return {
				...g,
				website: {
					...g.website,
					projects: [],
				},
			};
		});
	}

	function handlePromptSubmit(event: CustomEvent<string>) {
		const websiteName = event.detail;
		$promptOpen = false;
		const newGame = initNewWebsite(websiteName);
		g.set(newGame);
	}

	function openNewWebsitePrompt() {
		$promptOpen = true;
	}

	function handleHire(event: CustomEvent<any[]>) {
		// The HiringPopup component now handles the state update
	}

	function handleStartProject(event: CustomEvent<project>) {
		const chosenProject = event.detail;
		startProject(chosenProject, $g.website);
	}

	function handleAcceptInvestment(opportunity: investmentOpportunity) {
		$g.website = acceptInvestment($g.website, opportunity);
	}

	$: activeWebsite = $g.website;

	//$g.website.investment_opportunities = [];
	//$g.website.profit_changes.daily_history = [];

	onMount(() => {
		startGameLoop();

		// Add keyboard shortcut for pause
		const handleKeydown = (event: KeyboardEvent) => {
			if (
				event.key.toLowerCase() === 'p' &&
				!event.ctrlKey &&
				!event.metaKey &&
				!event.altKey
			) {
				$paused = !$paused;
			}
		};

		window.addEventListener('keydown', handleKeydown);
		return () => {
			window.removeEventListener('keydown', handleKeydown);
		};
	});
</script>

<main class="container mx-auto p-2 min-h-screen pt-0">
	<header class="mb-8 text-center">
		<h1
			class="title mb-4
		{$g.website ? 'text-xs fixed top-2 left-2 opacity-20' : 'text-2xl mb-4'}
		"
		>
			Web Pioneer
		</h1>
		{#if $g.website == null}
			<p class="text-xl">Year: 1995 - The Dawn of the World Wide Web</p>
		{/if}
	</header>

	<div class="relative">
		<div class="fixed bottom-4 right-4 flex gap-2">
			<button
				on:click={() => {
					g.update((g) => {
						if (!g.website) return g;
						const newOpportunity = getInvestmentOpportunities(g.website)[0];

						if (newOpportunity != null) {
							return {
								...g,
								website: {
									...g.website,
									investment_opportunities: [
										...g.website.investment_opportunities,
										newOpportunity,
									],
								},
							};
						} else {
							return g;
						}
					});
				}}
				class="bg-purple-500 hover:bg-purple-600 text-white px-3 py-1 rounded-md text-sm z-50"
			>
				Force Investment (Debug)
			</button>
			<button
				on:click={clearProjects}
				class="bg-orange-500 hover:bg-orange-600 text-white px-3 py-1 rounded-md text-sm z-50"
			>
				Clear Projects (Debug)
			</button>
			<button
				on:click={clearLocalStorage}
				class="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-md text-sm z-50"
			>
				Clear Data (Debug)
			</button>
		</div>
	</div>

	{#if !activeWebsite}
		<div class="flex flex-col items-center justify-center space-y-4">
			<div class="title text-xl mb-4">Welcome, Future Web Pioneer!</div>
			<p class="max-w-md text-center mb-4">
				The internet is young, and the world is in need of some innovation.
			</p>
			{#if !$g.website}
				<button
					on:click={openNewWebsitePrompt}
					class="btn btn-primary px-8 py-2"
				>
					Start your website
				</button>
			{/if}
		</div>
	{:else}
		<div class="flex flex-col w-full min-h-screen">
			<!-- Top Stats Bar -->
			<div class="flex flex-row gap-4 mx-12">
				<div
					class="border-2 border-[var(--color-crt)] p-4 bg-black/30 h-[225px] w-[60%]"
				>
					<div class="flex flex-col gap-6">
						<div class="flex items-center justify-between">
							<h2 class="title text-2xl">{activeWebsite.name}</h2>
							<div class="flex items-center gap-4">
								<button
									class="btn btn-sm {$paused ? 'btn-error' : 'btn-primary'}"
									on:click={() => ($paused = !$paused)}
								>
									{$paused ? 'Resume' : 'Pause'}
								</button>
								<p class="text-white opacity-50 text-xl">
									Day: {activeWebsite.day} - {inGameTime}
								</p>
							</div>
						</div>

						<div class="flex justify-center gap-24">
							<div class="stat-huge">
								<div class="stat-title text-white">Users</div>
								<div class="stat-value text-[var(--color-crt)]">
									{numberWithCommas($g.website?.users ?? 0)}
								</div>
								{#if $g.website?.user_changes}
									<div class="stat-desc">
										<span
											class={$g.website.user_changes.rolling_average >= 0
												? 'text-[var(--color-crt)]'
												: 'text-red-500'}
										>
											{$g.website.user_changes.rolling_average >= 0
												? '+'
												: ''}{numberWithCommas(
												Math.round($g.website.user_changes.rolling_average),
											)}
										</span>
										<span class="opacity-70">/day</span>
									</div>
								{/if}
							</div>
							<div class="stat-huge">
								<div class="stat-title text-white">Money</div>
								<div class="stat-value text-[var(--color-crt)]">
									{#if ($g.website?.money ?? 0) < 0}<span class="text-red-500"
											>-</span
										>{/if}
									${numberWithCommas(
										Math.abs(Math.floor($g.website?.money ?? 0)),
									)}
								</div>
								{#if $g.website?.profit_changes}
									<div class="stat-desc">
										<span
											class={$g.website.profit_changes.rolling_average >= 0
												? 'text-[var(--color-crt)]'
												: 'text-red-500'}
										>
											{$g.website.profit_changes.rolling_average >= 0
												? '+'
												: ''}{numberToMoney(
												Math.round($g.website.profit_changes.rolling_average),
											)}
										</span>
										<span class="opacity-70">/day</span>
									</div>
								{/if}
							</div>
							<div class="stat-huge">
								<div class="stat-title text-white">Retention</div>
								<div class="stat-value text-[var(--color-crt)]">
									{Math.round(($g.website?.retention ?? 0) * 100)}%
								</div>
							</div>
						</div>
					</div>
				</div>

				<!-- Investment Panel -->
				<div class="w-[40%] flex flex-col h-[225px]">
					<div
						class="border-2 border-[var(--color-crt)] p-4 bg-black/30 h-[100%] max-w-[400px]"
					>
						<div class="font-bold mb-4">Investments</div>
						<div class="overflow-x-auto">
							<div
								class="flex gap-4 pb-2 overflow-y-scroll scroll-m-0 h-min"
								style="min-width: min-content"
							>
								<!-- Investment Opportunities First -->
								{#if $g.website.investment_opportunities?.filter((o) => o.expires > $g.website.day).length > 0}
									{#each $g.website.investment_opportunities.filter((o) => o.expires > $g.website.day) as opportunity}
										<div
											class="opportunity-card border border-[var(--color-crt)] p-3 bg-black/30 min-w-[280px]"
										>
											<div class="text-lg">{opportunity.firm}</div>
											<div class="grid grid-cols-2 gap-2 text-sm">
												<div>
													Valuation: <span class="text-[var(--color-crt)]"
														>{numberToMoney(opportunity.valuation)}</span
													>
												</div>
												<div>
													Equity: <span class="text-[var(--color-crt)]"
														>{opportunity.percent}%</span
													>
												</div>
												<div>
													Investment: <span class="text-[var(--color-crt)]"
														>{numberToMoney(
															opportunity.valuation *
																(opportunity.percent / 100),
														)}</span
													>
												</div>
												<div>
													Expires: <span class="text-[var(--color-crt)]"
														>{opportunity.expires - $g.website.day} days</span
													>
												</div>
											</div>
											<div class="flex gap-2 mt-3">
												<button
													class="btn btn-sm btn-primary flex-1"
													on:click={() => handleAcceptInvestment(opportunity)}
													>Accept</button
												>
												<button
													class="btn btn-sm btn-warning flex-1"
													on:click={() => {
														g.update((g) => {
															if (!g.website) return g;
															return {
																...g,
																website: {
																	...g.website,
																	investment_opportunities:
																		g.website.investment_opportunities.filter(
																			(o) =>
																				o.valuation !== opportunity.valuation,
																		),
																},
															};
														});
													}}>Reject</button
												>
											</div>
										</div>
									{/each}
								{/if}

								<!-- Current Investors -->
								{#if $g.website.investors?.length > 0}
									{#each $g.website.investors as investor}
										<div
											class="border border-[var(--color-crt)]/50 p-3 bg-black/30 min-w-[280px]"
										>
											<div class="text-lg opacity-80">{investor.firm}</div>
											<div class="grid grid-cols-2 gap-1 text-sm">
												<div>
													Bought at: <span class="text-[var(--color-crt)]"
														>{numberToMoney(investor.valuation)}</span
													>
												</div>
												<div>
													Owns: <span class="text-[var(--color-crt)]"
														>{investor.percent_owned}%</span
													>
												</div>
											</div>
											<div class="text-xs opacity-50 mt-1">
												Invested on day {investor.day_invested}
											</div>
										</div>
									{/each}
								{/if}
							</div>
						</div>
					</div>
				</div>
			</div>

			<!-- Main Content Area -->
			<div class="flex flex-row p-4 gap-4 h-full">
				<!-- Main Panel -->
				<div class="flex-1">
					<div
						class="stats-panel border-2 border-[var(--color-crt)] p-4 h-full flex flex-col"
					>
						<!-- Job Types -->
						<div class="flex flex-row gap-2 mb-4">
							{#each Object.values(JOB_TYPE) as job}
								<div class="text-white px-2 {getJobColor(job)}">{job}</div>
							{/each}
						</div>

						<!-- Employees Grid -->
						<div class="flex flex-row flex-wrap gap-1 mb-6">
							{#each activeWebsite.employees as e}
								<EmployeeTile {e} />
							{/each}
						</div>

						<!-- Website Stats -->
						<div class="grid grid-cols-2 gap-4 flex-1">
							{#each Object.entries(activeWebsite.scores).sort((a, b) => b[1] - a[1]) as [score, value]}
								<div class="w-full">
									<div class="flex justify-between">
										<span class="capitalize font-medium text-md">{score}</span>
										<span class="text-[var(--color-crt)]"
											>{Math.floor(value)}</span
										>
									</div>
									<progress
										class="progress progress-accent w-full"
										value={Math.floor(value)}
										max={getHighestScore(activeWebsite)}
									/>
								</div>
							{/each}
						</div>
					</div>
				</div>

				<!-- Right Control Panel -->
				<div class="w-[400px] flex flex-col gap-4 h-full">
					<!-- Action Buttons -->
					<div
						class="action-panel border-2 border-[var(--color-crt)] p-4 bg-black/30"
					>
						<div class="flex flex-row gap-4">
							<button
								on:click={() => ($hiringPopupOpen = true)}
								class="btn btn-primary btn-md"
							>
								Hire Workers
							</button>
							<button
								on:click={() => ($projectSearchPopupOpen = true)}
								class="btn btn-primary btn-md"
							>
								Projects
							</button>
						</div>
					</div>

					<!-- Tabbed Control Panel -->
					<div
						class="border-2 border-[var(--color-crt)] bg-black/30 flex-1 flex flex-col"
					>
						<div class="tabs tabs-boxed bg-transparent p-2 sticky top-0">
							<button
								class="tab {activeTab === 'server' ? 'tab-active' : ''}"
								on:click={() => (activeTab = 'server')}>Server</button
							>
							{#if hasMarketingCampaigns}
								<button
									class="tab {activeTab === 'marketing' ? 'tab-active' : ''}"
									on:click={() => (activeTab = 'marketing')}>Marketing</button
								>
							{/if}
							{#if hasMonetization}
								<button
									class="tab {activeTab === 'monetization' ? 'tab-active' : ''}"
									on:click={() => (activeTab = 'monetization')}>Revenue</button
								>
							{/if}
						</div>

						<div class="p-4 overflow-y-auto flex-1 control-panel-content">
							{#if activeTab === 'server'}
								<!-- Server Costs Panel -->
								<div class="control-section">
									<div class="font-bold mb-2">Server Costs</div>
									<div class="flex items-center gap-4">
										<button
											class="btn btn-sm btn-primary"
											on:click={() => {
												g.update((g) => {
													if (!g.website) return g;
													const weekly_spend = Math.max(
														50,
														Math.floor(g.website.server_costs.weekly_spend / 2),
													);
													const userCapacity = getUserCapacity(
														g.website,
														weekly_spend,
													);
													return {
														...g,
														website: {
															...g.website,
															server_costs: {
																weekly_spend,
																user_capacity: userCapacity,
															},
														},
													};
												});
											}}
										>
											-
										</button>
										<div class="text-center flex-1">
											${$g.website?.server_costs.weekly_spend?.toLocaleString() ??
												'50'}/week
										</div>
										<button
											class="btn btn-sm btn-primary"
											on:click={() => {
												g.update((g) => {
													if (!g.website) return g;
													const weekly_spend =
														g.website.server_costs.weekly_spend * 2;
													const userCapacity = getUserCapacity(
														g.website,
														weekly_spend,
													);
													return {
														...g,
														website: {
															...g.website,
															server_costs: {
																weekly_spend,
																user_capacity: userCapacity,
															},
														},
													};
												});
											}}
										>
											+
										</button>
									</div>
									<div class="text-sm mt-2 opacity-80">
										Server Capacity: {$g.website?.server_costs.user_capacity?.toLocaleString() ??
											'1,500'} users
									</div>
								</div>
							{:else if activeTab === 'marketing' && hasMarketingCampaigns}
								<!-- Marketing Campaigns Panel -->
								<div class="space-y-3">
									{#if $g.website.projects.find((p) => p.project.name === PROJECT_NAME.NEWSPAPER_ADS && p.completed && p.enabled)}
										<div class="marketing-control">
											<div class="flex justify-between items-center mb-2">
												<div class="text-lg">Newspaper Ads</div>
												<div class="text-xs opacity-70">
													${MARKETING_LIMITS.NEWSPAPER_ADS.MIN} - ${MARKETING_LIMITS
														.NEWSPAPER_ADS.MAX}
												</div>
											</div>
											<div class="text-sm mb-2">
												Weekly Cost: <span class="text-[var(--color-crt)]"
													>${$g.website.marketing_config
														?.newspaper_ads_weekly_spend ??
														MARKETING_LIMITS.NEWSPAPER_ADS.DEFAULT}</span
												>
											</div>
											<input
												type="range"
												min={MARKETING_LIMITS.NEWSPAPER_ADS.MIN}
												max={MARKETING_LIMITS.NEWSPAPER_ADS.MAX}
												value={$g.website.marketing_config
													?.newspaper_ads_weekly_spend ??
													MARKETING_LIMITS.NEWSPAPER_ADS.DEFAULT}
												step="100"
												class="range range-primary range-sm"
												on:change={(e) => {
													const target = e.currentTarget;
													g.update((g) => {
														if (!g.website) return g;
														const currentConfig =
															g.website.marketing_config ?? marketingConfig;
														return {
															...g,
															website: {
																...g.website,
																marketing_config: {
																	...currentConfig,
																	newspaper_ads_weekly_spend: parseInt(
																		target.value,
																	),
																},
															},
														};
													});
												}}
											/>
										</div>
									{/if}

									{#if $g.website.projects.find((p) => p.project.name === PROJECT_NAME.RADIO_ADS && p.completed && p.enabled)}
										<div class="marketing-control">
											<div class="text-lg mb-2">Radio Ads</div>
											<div class="flex justify-between text-sm mb-2">
												<span
													>Weekly Cost: <span class="text-[var(--color-crt)]"
														>${$g.website.marketing_config
															?.radio_ads_weekly_spend ??
															MARKETING_LIMITS.RADIO_ADS.DEFAULT}</span
													></span
												>
												<span class="opacity-70"
													>${MARKETING_LIMITS.RADIO_ADS.MIN} - ${MARKETING_LIMITS
														.RADIO_ADS.MAX}</span
												>
											</div>
											<input
												type="range"
												min={MARKETING_LIMITS.RADIO_ADS.MIN}
												max={MARKETING_LIMITS.RADIO_ADS.MAX}
												value={$g.website.marketing_config
													?.radio_ads_weekly_spend ??
													MARKETING_LIMITS.RADIO_ADS.DEFAULT}
												step="100"
												class="range range-primary range-sm"
												on:change={(e) => {
													const target = e.currentTarget;
													g.update((g) => {
														if (!g.website) return g;
														const currentConfig =
															g.website.marketing_config ?? marketingConfig;
														return {
															...g,
															website: {
																...g.website,
																marketing_config: {
																	...currentConfig,
																	radio_ads_weekly_spend: parseInt(
																		target.value,
																	),
																},
															},
														};
													});
												}}
											/>
										</div>
									{/if}

									{#if $g.website.projects.find((p) => p.project.name === PROJECT_NAME.COLLEGE_CAMPUS_CAMPAIGN && p.completed && p.enabled)}
										<div class="marketing-control">
											<div class="text-lg mb-2">College Campus Campaign</div>
											<div class="flex justify-between text-sm mb-2">
												<span
													>Weekly Cost: <span class="text-[var(--color-crt)]"
														>${$g.website.marketing_config
															?.college_campus_weekly_spend ??
															MARKETING_LIMITS.COLLEGE_CAMPUS.DEFAULT}</span
													></span
												>
												<span class="opacity-70"
													>${MARKETING_LIMITS.COLLEGE_CAMPUS.MIN} - ${MARKETING_LIMITS
														.COLLEGE_CAMPUS.MAX}</span
												>
											</div>
											<input
												type="range"
												min={MARKETING_LIMITS.COLLEGE_CAMPUS.MIN}
												max={MARKETING_LIMITS.COLLEGE_CAMPUS.MAX}
												value={$g.website.marketing_config
													?.college_campus_weekly_spend ??
													MARKETING_LIMITS.COLLEGE_CAMPUS.DEFAULT}
												step="100"
												class="range range-primary range-sm"
												on:change={(e) => {
													const target = e.currentTarget;
													g.update((g) => {
														if (!g.website) return g;
														const currentConfig =
															g.website.marketing_config ?? marketingConfig;
														return {
															...g,
															website: {
																...g.website,
																marketing_config: {
																	...currentConfig,
																	college_campus_weekly_spend: parseInt(
																		target.value,
																	),
																},
															},
														};
													});
												}}
											/>
										</div>
									{/if}

									{#if $g.website.projects.find((p) => p.project.name === PROJECT_NAME.TV_INFOMERCIAL && p.completed && p.enabled)}
										<div class="marketing-control">
											<div class="text-lg mb-2">TV Infomercial</div>
											<div class="flex justify-between text-sm mb-2">
												<span
													>Weekly Cost: <span class="text-[var(--color-crt)]"
														>${$g.website.marketing_config
															?.tv_infomercial_weekly_spend ??
															MARKETING_LIMITS.TV_INFOMERCIAL.DEFAULT}</span
													></span
												>
												<span class="opacity-70"
													>${MARKETING_LIMITS.TV_INFOMERCIAL.MIN} - ${MARKETING_LIMITS
														.TV_INFOMERCIAL.MAX}</span
												>
											</div>
											<input
												type="range"
												min={MARKETING_LIMITS.TV_INFOMERCIAL.MIN}
												max={MARKETING_LIMITS.TV_INFOMERCIAL.MAX}
												value={$g.website.marketing_config
													?.tv_infomercial_weekly_spend ??
													MARKETING_LIMITS.TV_INFOMERCIAL.DEFAULT}
												step="100"
												class="range range-primary range-sm"
												on:change={(e) => {
													const target = e.currentTarget;
													g.update((g) => {
														if (!g.website) return g;
														const currentConfig =
															g.website.marketing_config ?? marketingConfig;
														return {
															...g,
															website: {
																...g.website,
																marketing_config: {
																	...currentConfig,
																	tv_infomercial_weekly_spend: parseInt(
																		target.value,
																	),
																},
															},
														};
													});
												}}
											/>
										</div>
									{/if}
								</div>
							{:else if activeTab === 'monetization' && hasMonetization}
								<!-- Monetization Panel -->
								<div class="space-y-3">
									{#if $g.website.projects.find((p) => p.project.name === PROJECT_NAME.BANNER_ADS && p.completed && p.enabled)}
										<div class="monetization-control">
											<div class="flex justify-between items-center mb-2">
												<div class="text-lg">Banner Ads</div>
												<div class="text-xs opacity-70">
													${MONETIZATION_LIMITS.BANNER_ADS.MIN} - ${MONETIZATION_LIMITS
														.BANNER_ADS.MAX}
												</div>
											</div>
											<div class="text-sm mb-2">
												Revenue/User: <span class="text-[var(--color-crt)]"
													>${$g.website.monetization_config
														?.banner_ad_revenue_per_user_per_week ??
														MONETIZATION_LIMITS.BANNER_ADS.DEFAULT}/week</span
												>
											</div>
											<input
												type="range"
												min={MONETIZATION_LIMITS.BANNER_ADS.MIN * 100}
												max={MONETIZATION_LIMITS.BANNER_ADS.MAX * 100}
												value={($g.website.monetization_config
													?.banner_ad_revenue_per_user_per_week ??
													MONETIZATION_LIMITS.BANNER_ADS.DEFAULT) * 100}
												step="1"
												class="range range-primary range-sm"
												on:change={(e) => {
													const target = e.currentTarget;
													g.update((g) => {
														if (!g.website) return g;
														const currentConfig =
															g.website.monetization_config ??
															monetizationConfig;
														return {
															...g,
															website: {
																...g.website,
																monetization_config: {
																	...currentConfig,
																	banner_ad_revenue_per_user_per_week:
																		parseInt(target.value) / 100,
																},
															},
														};
													});
												}}
											/>
										</div>
									{/if}

									{#if $g.website.projects.find((p) => p.project.name === PROJECT_NAME.SUPER_HEART && p.completed && p.enabled)}
										<div class="monetization-control">
											<div class="text-lg mb-2">Super Heart</div>
											<div class="flex justify-between text-sm mb-2">
												<span
													>Cost/User: <span class="text-[var(--color-crt)]"
														>${$g.website.monetization_config
															?.super_heart_revenue_per_user_per_week ??
															MONETIZATION_LIMITS.SUPER_HEART
																.DEFAULT}/week</span
													></span
												>
												<span class="opacity-70"
													>${MONETIZATION_LIMITS.SUPER_HEART.MIN} - ${MONETIZATION_LIMITS
														.SUPER_HEART.MAX}</span
												>
											</div>
											<input
												type="range"
												min={MONETIZATION_LIMITS.SUPER_HEART.MIN * 100}
												max={MONETIZATION_LIMITS.SUPER_HEART.MAX * 100}
												value={($g.website.monetization_config
													?.super_heart_revenue_per_user_per_week ??
													MONETIZATION_LIMITS.SUPER_HEART.DEFAULT) * 100}
												step="1"
												class="range range-primary range-sm"
												on:change={(e) => {
													const target = e.currentTarget;
													g.update((g) => {
														if (!g.website) return g;
														const currentConfig =
															g.website.monetization_config ??
															monetizationConfig;
														return {
															...g,
															website: {
																...g.website,
																monetization_config: {
																	...currentConfig,
																	super_heart_revenue_per_user_per_week:
																		parseInt(target.value) / 100,
																},
															},
														};
													});
												}}
											/>
										</div>
									{/if}

									{#if $g.website.projects.find((p) => p.project.name === PROJECT_NAME.AD_FREE && p.completed && p.enabled)}
										<div class="monetization-control">
											<div class="text-lg mb-2">Ad-Free Subscription</div>
											<div class="flex justify-between text-sm mb-2">
												<span
													>Cost/User: <span class="text-[var(--color-crt)]"
														>${$g.website.monetization_config
															?.ad_free_revenue_per_user_per_week ??
															MONETIZATION_LIMITS.AD_FREE.DEFAULT}/week</span
													></span
												>
												<span class="opacity-70"
													>${MONETIZATION_LIMITS.AD_FREE.MIN} - ${MONETIZATION_LIMITS
														.AD_FREE.MAX}</span
												>
											</div>
											<input
												type="range"
												min={MONETIZATION_LIMITS.AD_FREE.MIN * 100}
												max={MONETIZATION_LIMITS.AD_FREE.MAX * 100}
												value={($g.website.monetization_config
													?.ad_free_revenue_per_user_per_week ??
													MONETIZATION_LIMITS.AD_FREE.DEFAULT) * 100}
												step="1"
												class="range range-primary range-sm"
												on:change={(e) => {
													const target = e.currentTarget;
													g.update((g) => {
														if (!g.website) return g;
														const currentConfig =
															g.website.monetization_config ??
															monetizationConfig;
														return {
															...g,
															website: {
																...g.website,
																monetization_config: {
																	...currentConfig,
																	ad_free_revenue_per_user_per_week:
																		parseInt(target.value) / 100,
																},
															},
														};
													});
												}}
											/>
										</div>
									{/if}
								</div>
							{/if}
						</div>
					</div>
				</div>

				<!-- Revenue Breakdown Panel -->
				<div class="w-[300px] h-full">
					<div
						class="border-2 border-[var(--color-crt)] p-4 bg-black/30 h-full"
					>
						<div class="font-bold mb-4">Revenue Breakdown</div>

						<!-- Revenue Section -->
						<div class="mb-6">
							<div class="text-sm font-semibold mb-2 text-[var(--color-crt)]">
								Revenue Sources
							</div>
							{#if activeWebsite?.projects}
								{#each activeWebsite.projects.filter((p) => p.completed && p.enabled) as project}
									{#if project.project.name === PROJECT_NAME.BANNER_ADS}
										<div class="flex justify-between mb-1 text-sm">
											<span>Banner Ads</span>
											<span class="text-[var(--color-crt)]"
												>+${Math.round(
													calculateProjectRevenue(project, activeWebsite) / 7,
												)}/day</span
											>
										</div>
									{:else if project.project.name === PROJECT_NAME.SUPER_HEART}
										<div class="flex justify-between mb-1 text-sm">
											<span>Super Heart</span>
											<span class="text-[var(--color-crt)]"
												>+${Math.round(
													calculateProjectRevenue(project, activeWebsite) / 7,
												)}/day</span
											>
										</div>
									{:else if project.project.name === PROJECT_NAME.AD_FREE}
										<div class="flex justify-between mb-1 text-sm">
											<span>Ad-Free Subscriptions</span>
											<span class="text-[var(--color-crt)]"
												>+${Math.round(
													calculateProjectRevenue(project, activeWebsite) / 7,
												)}/day</span
											>
										</div>
									{/if}
								{/each}
							{/if}
						</div>

						<!-- Costs Section -->
						<div class="mb-6">
							<div class="text-sm font-semibold mb-2 text-red-500">
								Daily Costs
							</div>
							<!-- Server Costs -->
							<div class="flex justify-between mb-1 text-sm">
								<span>Server Costs</span>
								<span class="text-red-500"
									>-${Math.round(
										(activeWebsite?.server_costs?.weekly_spend ?? 0) / 7,
									)}/day</span
								>
							</div>

							<!-- Employee Salaries -->
							<div class="flex justify-between mb-1 text-sm">
								<span>Employee Salaries</span>
								<span class="text-red-500"
									>-${Math.round(
										(activeWebsite?.employees?.reduce(
											(sum, emp) => sum + emp.salary,
											0,
										) ?? 0) / 7,
									)}/day</span
								>
							</div>

							<!-- Marketing Costs -->
							{#if activeWebsite?.projects}
								{#each activeWebsite.projects.filter((p) => p.completed && p.enabled) as project}
									{#if project.project.name === PROJECT_NAME.NEWSPAPER_ADS}
										<div class="flex justify-between mb-1 text-sm">
											<span>Newspaper Ads</span>
											<span class="text-red-500">
												-${Math.round(
													(activeWebsite.marketing_config
														?.newspaper_ads_weekly_spend ??
														MARKETING_LIMITS.NEWSPAPER_ADS.DEFAULT) / 7,
												)}/day
											</span>
										</div>
									{:else if project.project.name === PROJECT_NAME.RADIO_ADS}
										<div class="flex justify-between mb-1 text-sm">
											<span>Radio Ads</span>
											<span class="text-red-500">
												-${Math.round(
													(activeWebsite.marketing_config
														?.radio_ads_weekly_spend ??
														MARKETING_LIMITS.RADIO_ADS.DEFAULT) / 7,
												)}/day
											</span>
										</div>
									{:else if project.project.name === PROJECT_NAME.COLLEGE_CAMPUS_CAMPAIGN}
										<div class="flex justify-between mb-1 text-sm">
											<span>Campus Campaign</span>
											<span class="text-red-500">
												-${Math.round(
													(activeWebsite.marketing_config
														?.college_campus_weekly_spend ??
														MARKETING_LIMITS.COLLEGE_CAMPUS.DEFAULT) / 7,
												)}/day
											</span>
										</div>
									{:else if project.project.name === PROJECT_NAME.TV_INFOMERCIAL}
										<div class="flex justify-between mb-1 text-sm">
											<span>TV Infomercial</span>
											<span class="text-red-500">
												-${Math.round(
													(activeWebsite.marketing_config
														?.tv_infomercial_weekly_spend ??
														MARKETING_LIMITS.TV_INFOMERCIAL.DEFAULT) / 7,
												)}/day
											</span>
										</div>
									{/if}
								{/each}
							{/if}
						</div>

						<!-- Investor Payouts -->
						{#if activeWebsite?.investors?.length > 0}
							<div class="mb-6">
								<div class="text-sm font-semibold mb-2 text-yellow-500">
									Investor Profit Share
								</div>
								{#each activeWebsite.investors as investor}
									<div class="flex justify-between mb-1 text-sm">
										<span>{investor.firm} ({investor.percent_owned}%)</span>
										<span class="text-yellow-500"
											>-${Math.round(
												activeWebsite.profit_changes?.investor_payout_today ??
													0,
											)}/day</span
										>
									</div>
								{/each}
							</div>
						{/if}

						<!-- Net Profit -->
						<div class="mt-8 pt-4 border-t-2 border-[var(--color-crt)]/30">
							<div class="flex justify-between font-bold">
								<span>Net Daily Profit</span>
								<span
									class={activeWebsite?.profit_changes?.rolling_average >= 0
										? 'text-[var(--color-crt)]'
										: 'text-red-500'}
								>
									{activeWebsite?.profit_changes?.rolling_average >= 0
										? '+'
										: ''}{numberToMoney(
										Math.round(
											activeWebsite?.profit_changes?.rolling_average ?? 0,
										),
									)}/day
								</span>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	{/if}

	<Prompt
		prompt="Enter your website name"
		placeholder="WebGenius Inc."
		isOpen={$promptOpen}
		on:submit={handlePromptSubmit}
		on:cancel={() => ($promptOpen = false)}
	/>

	<HiringPopup
		isOpen={$hiringPopupOpen}
		on:submit={handleHire}
		on:cancel={() => ($hiringPopupOpen = false)}
	/>

	<ProjectSearch
		isOpen={$projectSearchPopupOpen}
		on:submit={handleStartProject}
		on:cancel={() => ($projectSearchPopupOpen = false)}
	/>
</main>

{JSON.stringify($g.website)}

<style>
	.stats-panel,
	.action-panel {
		background: rgba(0, 0, 0, 0.3);
	}

	.monetization-control,
	.marketing-control {
		background: rgba(0, 0, 0, 0.2);
		padding: 0.75rem;
		border-radius: 0.5rem;
		border: 1px solid var(--color-crt);
	}

	.tabs-boxed {
		border-bottom: 2px solid var(--color-crt);
		background: rgba(0, 0, 0, 0.2);
		position: sticky;
		top: 0;
		z-index: 10;
	}

	.tab {
		color: rgba(255, 255, 255, 0.7);
		transition: all 0.2s ease;
	}

	.tab:hover {
		color: var(--color-crt);
		background: rgba(0, 0, 0, 0.2);
	}

	.tab-active {
		color: var(--color-crt) !important;
		background: rgba(0, 0, 0, 0.3) !important;
		border: 1px solid var(--color-crt);
	}

	.control-panel-content {
		scrollbar-width: thin;
		scrollbar-color: var(--color-crt) transparent;
	}

	.control-panel-content::-webkit-scrollbar {
		width: 6px;
	}

	.control-panel-content::-webkit-scrollbar-track {
		background: transparent;
	}

	.control-panel-content::-webkit-scrollbar-thumb {
		background-color: var(--color-crt);
		border-radius: 3px;
	}

	.control-section {
		margin-bottom: 1rem;
	}

	.range {
		margin: 0.5rem 0;
	}
</style>
