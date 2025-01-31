<!-- Svelte component that uses DaisyUI components to get input from the user -->

<script lang="ts">
	import { createEventDispatcher } from 'svelte';

	export let prompt: string;
	export let isOpen = false;
	export let placeholder = 'Enter your response...';

	let inputValue = '';
	const dispatch = createEventDispatcher();

	function handleSubmit() {
		dispatch('submit', inputValue);
		inputValue = '';
		isOpen = false;
	}

	function handleCancel() {
		dispatch('cancel');
		inputValue = '';
		isOpen = false;
	}
</script>

{#if isOpen}
	<div class="modal modal-open">
		<div class="modal-box">
			<h3 class="font-bold text-lg mb-4">{prompt}</h3>
			<!-- svelte-ignore a11y-autofocus -->
			<input
				autofocus
				type="text"
				bind:value={inputValue}
				{placeholder}
				class="input input-bordered w-full mb-4"
				on:keydown={(e) => {
					if (e.key === 'Enter') {
						handleSubmit();
					}
				}}
			/>
			<div class="modal-action">
				<button class="btn btn-primary" on:click={handleSubmit}>Submit</button>
				<button class="btn" on:click={handleCancel}>Cancel</button>
			</div>
		</div>
	</div>
{/if}
