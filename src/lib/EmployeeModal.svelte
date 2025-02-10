<script lang="ts">
	import { onMount } from 'svelte';
	import { type employee } from './objects/types';
	import { g, paused } from './store';
	import {
		fireEmployee,
		getAvailableEmployees,
		getEmployeeContributionScore,
		getJobColor,
		makeEmployeeHappy,
		numberToMoney,
		numberWithCommas,
	} from './utils';

	export let e: employee;
	export let open = false;
	export let onclose: () => void;
	let closeModal = () => {
		open = false;
		onclose();
	};

	let isIdle = false;
	let costToMakeHappy = 0;

	$: if (open) {
		isIdle = getAvailableEmployees($g.website).includes(e);
		costToMakeHappy = (100 - e.happiness) * 2 * (e.salary / 15);
	}
</script>

<div class="modal duration-0 {open ? 'modal-open' : ''}">
	<div class="modal-box duration-150">
		<h2 class="title text-xl">{e.name}</h2>
		<p
			class="text-xl underline text-red-600 top-4 right-4 cursor-default absolute animate-pulse"
		>
			{isIdle ? 'Idle' : 'Busy'}
		</p>
		<p class="text-md underline opacity-70 mb-4">Employee number: {e.id}</p>
		<p>
			Job: <span class={getJobColor(e.job)}>{e.job}</span>
		</p>
		<p>Salary: {numberToMoney(e.salary)} per week</p>
		<p>XP: {numberWithCommas(e.xp)} out of 10,000</p>
		<p>Happiness: {e.happiness}%</p>
		<p>Hourly contribution: {getEmployeeContributionScore(e).toFixed(2)}</p>
		<button
			class="mt-4 btn btn-warning"
			on:click={() => {
				fireEmployee(e, $g.website);
				closeModal();
			}}>Fire</button
		>
		<button
			class="mt-4 btn btn-success
				{costToMakeHappy > $g.website.money || e.happiness > 75
				? 'text-green-500 border-green-500 btn-disabled '
				: ''}
			"
			on:click={() => {
				e = makeEmployeeHappy(e, $g.website, costToMakeHappy);
			}}
		>
			{e.happiness > 75
				? 'Employee is happy'
				: costToMakeHappy > $g.website.money
					? 'Not enough money'
					: 'Make Happy for ' + numberToMoney(costToMakeHappy)}
		</button>
	</div>
	<form method="dialog" class="modal-backdrop">
		<button on:click={closeModal}>close</button>
	</form>
</div>

<style>
</style>
