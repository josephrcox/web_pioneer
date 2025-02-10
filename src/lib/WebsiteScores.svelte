<script lang="ts">
	import { g } from './store';
	import { getHighestScore } from './utils';

	export let compact = false; // New prop to control compact mode
</script>

<div class="w-full {compact ? 'pt-2' : 'pt-4'}">
	{#if compact}
		<div class="flex gap-2">
			{#each Object.entries($g.website.scores).sort((a, b) => b[1] - a[1]) as [score, value]}
				<div class="flex-1 min-w-0">
					<div class="flex justify-between mb-1">
						<span class="capitalize font-medium text-sm truncate mr-1"
							>{score}</span
						>
						<span class="text-[var(--color-crt)] text-sm shrink-0"
							>{Math.floor(value)}</span
						>
					</div>
					<progress
						class="progress progress-accent w-full h-2"
						value={Math.floor(value)}
						max={getHighestScore($g.website)}
					/>
				</div>
			{/each}
		</div>
	{:else}
		<div class="grid grid-cols-2 gap-3">
			{#each Object.entries($g.website.scores).sort((a, b) => b[1] - a[1]) as [score, value]}
				<div class="w-full">
					<div class="flex justify-between mb-1">
						<span class="capitalize font-medium text-md">{score}</span>
						<span class="text-[var(--color-crt)]">{Math.floor(value)}</span>
					</div>
					<progress
						class="progress progress-accent w-full"
						value={Math.floor(value)}
						max={getHighestScore($g.website)}
					/>
				</div>
			{/each}
		</div>
	{/if}
</div>

<style>
	.progress {
		transition: all 0.2s ease;
	}
</style>
