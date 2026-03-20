<script lang="ts">
	import { onMount } from 'svelte';
	import { fade, fly, scale } from 'svelte/transition';

	interface Task {
		id: string;
		text: string;
		completed: boolean;
	}

	// Svelte 5 uses $state for reactive variables
	let tasks = $state<Task[]>([]);
	let newTaskInput = $state('');
	let isJourneyActive = $state(false);
	let currentTask = $state<Task | null>(null);

	onMount(() => {
		const saved = localStorage.getItem('monotasker_data');
		if (saved) tasks = JSON.parse(saved);
	});

	// Effect to save data
	$effect(() => {
		localStorage.setItem('monotasker_data', JSON.stringify(tasks));
	});

	// Derived state (computed values)
	let completedCount = $derived(tasks.filter((t) => t.completed).length);
	let totalTasks = $derived(tasks.length);
	let progressPercentage = $derived(totalTasks === 0 ? 0 : (completedCount / totalTasks) * 100);
	let pendingTasks = $derived(tasks.filter((t) => !t.completed));

	function addTask() {
		if (!newTaskInput.trim()) return;
		tasks = [...tasks, { id: crypto.randomUUID(), text: newTaskInput, completed: false }];
		newTaskInput = '';
	}

	function startJourney() {
		if (pendingTasks.length === 0) return;
		isJourneyActive = true;
		pickRandomTask();
	}

	function pickRandomTask() {
		const pending = tasks.filter((t) => !t.completed);
		if (pending.length === 0) {
			isJourneyActive = false;
			currentTask = null;
			return;
		}
		const randomIndex = Math.floor(Math.random() * pending.length);
		currentTask = pending[randomIndex];
	}

	function completeCurrentTask() {
		if (!currentTask) return;
		tasks = tasks.map((t) => (t.id === currentTask!.id ? { ...t, completed: true } : t));
		pickRandomTask();
	}

	function clearTasks() {
		if (confirm('Are you sure you want to clear all tasks?')) {
			tasks = [];
			localStorage.removeItem('monotasker_data');
		}
	}
</script>

<svelte:head>
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="" />
	<link
		href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;700;800&family=Inter:wght@400;600&display=swap"
		rel="stylesheet"
	/>
	<title>Monotasker | Focus Journey</title>
</svelte:head>

<div class="relative flex min-h-screen flex-col items-center px-4 pt-16 pb-12">
	<!-- Top Glow Progress Bar Overlay -->
	<div class="fixed top-0 left-0 z-50 h-1.5 w-full bg-black/30 backdrop-blur-sm">
		<div
			class="h-full bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-600 shadow-[0_0_15px_rgba(6,182,212,0.8)] transition-all duration-1000"
			style="width: {progressPercentage}%"
		></div>
	</div>

	{#if !isJourneyActive}
		<div
			in:fade={{ duration: 600 }}
			class="glass-panel animate-in fade-in slide-in-from-top-4 z-10 w-full max-w-[450px] p-8 duration-700"
		>
			<header class="mb-10 text-center">
				<h1 class="glow-text mb-2 text-4xl font-extrabold tracking-tight text-white">Monotasker</h1>
				<p class="text-xs font-medium tracking-[0.2em] text-white/40 uppercase">
					One Task. Total Focus.
				</p>
			</header>

			<form onsubmit={addTask} class="group relative mb-8">
				<input
					type="text"
					bind:value={newTaskInput}
					placeholder="Add something to your orbit..."
					class="glass-input w-full rounded-2xl px-6 py-4 text-white placeholder:text-white/20 focus:outline-none"
				/>
				<button
					type="submit"
					aria-label="Add task"
					class="absolute top-2 right-2 flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 text-white shadow-lg transition-transform hover:scale-105 active:scale-95"
				>
					<span class="text-xl">+</span>
				</button>
			</form>

			<div class="custom-scrollbar mb-8 max-h-[300px] space-y-3 overflow-y-auto pr-2">
				{#each pendingTasks as task (task.id)}
					<div
						transition:fly={{ y: 15, duration: 400 }}
						class="group flex items-center justify-between rounded-2xl border border-white/5 bg-white/5 px-5 py-4 transition-all hover:border-white/10 hover:bg-white/10"
					>
						<span class="text-[0.95rem] font-medium text-white/80">{task.text}</span>
						<button
							onclick={() => (tasks = tasks.filter((t) => t.id !== task.id))}
							aria-label="Delete task"
							class="text-white/20 opacity-0 transition-colors group-hover:opacity-100 hover:text-red-400"
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								class="h-4 w-4"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M6 18L18 6M6 6l12 12"
								/>
							</svg>
						</button>
					</div>
				{:else}
					<div
						class="p-8 text-center text-white/20 italic border-2 border-dashed border-white/5 rounded-2xl"
					>
						The void is empty. Add a task to start.
					</div>
				{/each}
			</div>

			<div class="space-y-4">
				<button
					onclick={startJourney}
					disabled={pendingTasks.length === 0}
					class="cosmic-button w-full rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 py-4 text-[1rem] font-bold text-white shadow-xl disabled:opacity-30 disabled:grayscale"
				>
					Enter Flow State
				</button>

				{#if tasks.length > 0}
					<button
						onclick={clearTasks}
						class="w-full text-xs font-bold tracking-widest text-white/30 uppercase transition-colors hover:text-white/60"
					>
						Reset Orbit
					</button>
				{/if}
			</div>

			<div
				class="mt-8 flex justify-between text-[11px] font-bold tracking-[0.1em] text-white/40 uppercase"
			>
				<div class="flex items-center gap-1.5">
					<span class="size-1 rounded-full bg-cyan-400"></span>
					{totalTasks} Total
				</div>
				<div class="flex items-center gap-1.5">
					<span class="size-1 rounded-full bg-emerald-400"></span>
					{completedCount} Done
				</div>
			</div>
		</div>
	{:else}
		<div
			in:scale={{ duration: 700, start: 0.95 }}
			class="relative flex w-full max-w-4xl flex-1 flex-col items-center justify-center px-6 text-center"
		>
			<div class="mb-16">
				<div
					in:fly={{ y: -20, delay: 300 }}
					class="mb-8 inline-flex items-center gap-3 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-6 py-2 backdrop-blur-md"
				>
					<span class="relative flex h-2 w-2">
						<span
							class="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-75"
						></span>
						<span class="relative inline-flex h-2 w-2 rounded-full bg-cyan-500"></span>
					</span>
					<span class="text-[10px] font-black tracking-[0.5em] text-cyan-400 uppercase"
						>Hyperspace Focus</span
					>
				</div>

				{#if currentTask}
					<div class="group relative">
						<div
							class="absolute -inset-4 rounded-3xl bg-gradient-to-r from-cyan-500/20 to-indigo-500/20 opacity-0 blur-2xl transition duration-1000 group-hover:opacity-100"
						></div>
						<h1
							in:fly={{ y: 30, duration: 800 }}
							class="relative text-6xl leading-tight font-black text-white md:text-8xl"
						>
							{currentTask.text}
						</h1>
					</div>
				{/if}
			</div>

			<div class="group relative">
				<div
					class="absolute inset-0 scale-150 rounded-full bg-white/20 opacity-20 blur-3xl transition-transform group-hover:scale-[1.7]"
				></div>
				<button
					onclick={completeCurrentTask}
					class="cosmic-button cosmic-pulse relative h-48 w-48 flex-col rounded-full border border-white/10 bg-white/5 text-white backdrop-blur-md hover:border-white/20 hover:bg-white/10"
				>
					<div
						class="mb-1 text-xs font-medium tracking-[0.3em] opacity-40 transition-opacity group-hover:opacity-100"
					>
						DONE
					</div>
					<div class="text-3xl font-bold tracking-tighter">FINISH</div>
				</button>
			</div>

			<div class="absolute bottom-12 flex flex-col items-center gap-4">
				<button
					onclick={() => (isJourneyActive = false)}
					class="text-xs font-bold text-white/30 uppercase transition-all hover:tracking-widest hover:text-white/60"
				>
					Abort Journey
				</button>

				<form
					onsubmit={addTask}
					class="opacity-30 transition-opacity focus-within:opacity-100 hover:opacity-100"
				>
					<input
						type="text"
						bind:value={newTaskInput}
						placeholder="New task in queue..."
						class="w-[240px] border-b border-white/10 bg-transparent px-4 py-2 text-center text-sm text-white/60 transition-all focus:border-cyan-400 focus:text-white focus:outline-none"
					/>
				</form>
			</div>
		</div>
	{/if}
</div>
