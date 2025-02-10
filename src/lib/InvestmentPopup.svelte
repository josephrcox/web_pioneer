<!-- Svelte component that uses DaisyUI components to get input from the user -->

<script lang="ts">
	import { createEventDispatcher, onDestroy, onMount } from 'svelte';
	import type { investmentOpportunity } from './objects/types';
	// @ts-ignore
	import { g, paused } from './store';
	import {
		acceptInvestment,
		getInvestmentOpportunities,
		numberToMoney,
	} from './utils';

	export let isOpen = false;
	let isLoading = false;
	let searchTimeout: ReturnType<typeof setTimeout>;
	let opportunities: investmentOpportunity[] = [];

	const dispatch = createEventDispatcher();

	function handleCancel() {
		if (isLoading) {
			clearTimeout(searchTimeout);
			isLoading = false;
		}
		dispatch('cancel');
		$paused = false;
		isOpen = false;
	}

	function handleAcceptInvestment(opportunity: investmentOpportunity) {
		$g.website = acceptInvestment($g.website, opportunity);

		// Close the modal
		handleCancel();
	}

	async function refreshOpportunities() {
		if (isLoading) return;

		isLoading = true;

		// Random delay between 1-3 seconds
		const delay = Math.floor(Math.random() * 2000) + 1000;

		try {
			searchTimeout = setTimeout(() => {
				// Get new opportunities
				opportunities = getInvestmentOpportunities($g.website);
				isLoading = false;
			}, delay);
		} catch (error) {
			console.error('Error generating opportunities:', error);
			isLoading = false;
		}
	}

	onMount(() => {
		if (isOpen) {
			$paused = true;
			refreshOpportunities();
		}
	});

	onDestroy(() => {
		$paused = false;
		if (searchTimeout) {
			clearTimeout(searchTimeout);
		}
	});

	$: if (isOpen && opportunities.length === 0 && !isLoading) {
		refreshOpportunities();
	}
</script>

{#if isOpen}
	<div class="modal modal-open">
		<div class="modal-box min-w-[70%]">
			<h3 class="title text-xl mb-8">Investment Opportunities</h3>
			<p class="text-md opacity-75 mb-4">
				Investment firms are interested in your website. Each offer expires in 7
				days.
			</p>
			<div class="opportunities-container w-full overflow-x-auto">
				<div class="opportunities-list grid grid-cols-2 gap-4 pb-4">
					{#if isLoading}
						<div
							class="flex flex-col items-center justify-center py-8 w-full col-span-2"
						>
							<div
								class="loading loading-dots loading-lg text-[var(--color-crt)]"
							></div>
							<p class="mt-4">Finding interested investors...</p>
							<p class="text-sm opacity-75">This will take a few seconds</p>
						</div>
					{:else if opportunities.length === 0}
						<div class="text-center py-8 w-full col-span-2">
							<p>No investment opportunities available.</p>
							<p class="text-sm opacity-75 mt-2">
								Click "Find More Investors" to search
							</p>
						</div>
					{:else}
						{#each opportunities as opportunity}
							<div
								class="opportunity-card border-2 border-[var(--color-crt)] p-3 flex flex-col justify-between"
							>
								<div class="grid grid-cols-2 gap-2 mb-3">
									<div class="col-span-2 text-2xl">{opportunity.firm}</div>
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
												opportunity.valuation * (opportunity.percent / 100),
											)}</span
										>
									</div>
									<div>
										Expires: <span class="text-[var(--color-crt)]"
											>Day {opportunity.expires}</span
										>
									</div>
								</div>
								<button
									class="btn btn-sm w-full btn-primary"
									on:click={() => handleAcceptInvestment(opportunity)}
								>
									Accept Investment
								</button>
							</div>
						{/each}
					{/if}
				</div>
			</div>
			<div class="modal-action">
				<button
					class="btn btn-primary"
					on:click={refreshOpportunities}
					disabled={isLoading}
				>
					{isLoading ? 'Searching...' : 'Find More Investors'}
				</button>
				<button class="btn" on:click={handleCancel}>Close</button>
			</div>
		</div>
		<form method="dialog" class="modal-backdrop">
			<button on:click={handleCancel}>close</button>
		</form>
	</div>
{/if}

<style>
	.opportunities-container {
		max-height: 24rem;
		scrollbar-width: thin;
		scrollbar-color: var(--color-crt) var(--color-terminal);
	}

	.opportunities-container::-webkit-scrollbar {
		height: 8px;
		width: 8px;
	}

	.opportunities-container::-webkit-scrollbar-track {
		background: var(--color-terminal);
	}

	.opportunities-container::-webkit-scrollbar-thumb {
		background-color: var(--color-crt);
		border: 2px solid var(--color-terminal);
		border-radius: 4px;
	}

	.opportunity-card {
		background: rgba(0, 0, 0, 0.3);
		flex-shrink: 0;
	}

	:global(.loading-dots) {
		--loading-color: var(--color-crt);
	}
</style>
