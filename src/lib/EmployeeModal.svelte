<script lang="ts">
	import { type employee } from './objects/types';
	import { getJobColor, numberToMoney, numberWithCommas } from './utils';

	export let e: employee;
	export let open = false;
	export let onclose: () => void;
	let closeModal = () => {
		open = false;
		onclose();
	};
</script>

<div class="modal duration-0 {open ? 'modal-open' : ''}">
	<div class="modal-box duration-150">
		<h2 class="title text-xl">{e.name}</h2>
		<p class="text-md underline opacity-70 mb-4">Employee number: {e.id}</p>
		<p>
			Job: <span class="{getJobColor(e.job)} px-1 text-white">{e.job}</span>
		</p>
		<p>Salary: {numberToMoney(e.salary)} per week</p>
		<p>XP: {numberWithCommas(e.xp)} out of 10,000</p>
	</div>
	<form method="dialog" class="modal-backdrop">
		<button on:click={closeModal}>close</button>
	</form>
</div>

<style>
	.modal-backdrop {
		background-color: rgba(0, 0, 0, 0);
		opacity: 0;
	}
</style>
