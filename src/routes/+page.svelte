<script lang="ts">
	import { fade, fly, scale } from 'svelte/transition';
	import {
		getOrbits,
		getActiveOrbitId,
		getFocusedOrbitId,
		getIsSidebarOpen,
		focusOrbit,
		COLOR_MAP
	} from '$lib/stores/galaxy.svelte';
	import GalaxySidebar from '$lib/components/GalaxySidebar.svelte';
	import OrbitPanel from '$lib/components/OrbitPanel.svelte';

	let orbits = $derived(getOrbits());
	let activeOrbitId = $derived(getActiveOrbitId());
	let focusedOrbitId = $derived(getFocusedOrbitId());
	let isSidebarOpen = $derived(getIsSidebarOpen());

	let focusedOrbit = $derived(orbits.find((o) => o.id === focusedOrbitId) ?? null);
	let otherOrbits = $derived(orbits.filter((o) => o.id !== focusedOrbitId));

	// Overall galaxy progress
	let totalTasks = $derived(orbits.reduce((acc, o) => acc + o.tasks.length, 0));
	let completedTasks = $derived(
		orbits.reduce((acc, o) => acc + o.tasks.filter((t) => t.completed).length, 0)
	);
	let galaxyProgress = $derived(totalTasks === 0 ? 0 : (completedTasks / totalTasks) * 100);
</script>

<svelte:head>
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="" />
	<link
		href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;700;800&family=Inter:wght@400;600&display=swap"
		rel="stylesheet"
	/>
	<title>{focusedOrbit ? `${focusedOrbit.name} · Monotasker` : 'Monotasker | Galaxy'}</title>
	<meta name="description" content="Manage multiple focused task lists — your personal galaxy of orbits." />
</svelte:head>

<!-- Global progress bar -->
<div class="fixed top-0 left-0 z-50 h-1 w-full bg-black/30 backdrop-blur-sm">
	<div
		class="h-full transition-all duration-1000"
		style="width: {galaxyProgress}%; background: linear-gradient(to right, #22d3ee, #6366f1); box-shadow: 0 0 12px rgba(6,182,212,0.6);"
	></div>
</div>

<!-- Sidebar -->
<GalaxySidebar />

<!-- ══════════════════════════════════════
     FOCUSED ORBIT VIEW
══════════════════════════════════════ -->
{#if focusedOrbit}
	<div
		in:fade={{ duration: 300 }}
		class="galaxy-canvas min-h-screen pb-32 pt-8 transition-all duration-350"
		class:galaxy-canvas-shifted={isSidebarOpen}
	>
		<!-- Back to Galaxy -->
		<div class="mb-6 flex items-center gap-3 px-6">
			<button
				onclick={() => focusOrbit(null)}
				class="flex items-center gap-2 rounded-xl border border-white/8 bg-white/4 px-4 py-2 text-xs font-bold uppercase tracking-widest text-white/40 backdrop-blur-sm transition-all hover:border-white/15 hover:bg-white/8 hover:text-white/70"
			>
				<svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
					<path d="M19 12H5M12 5l-7 7 7 7" />
				</svg>
				Galaxy
			</button>
			<span class="text-white/15">·</span>
			<span class="text-sm font-semibold" style="color: {COLOR_MAP[focusedOrbit.color].text};">
				{focusedOrbit.name}
			</span>
		</div>

		<!-- Focused orbit panel -->
		<div class="flex justify-center px-6" in:scale={{ duration: 350, start: 0.97 }}>
			<div class="focused-panel-wrapper w-full max-w-[560px]">
				<OrbitPanel orbit={focusedOrbit} isActive={true} focused={true} />
			</div>
		</div>

		<!-- ── Orbit switcher pills (other orbits) ── -->
		{#if otherOrbits.length > 0}
			<div class="orbit-switcher" in:fly={{ y: 20, delay: 150, duration: 300 }}>
				<span class="text-[10px] font-bold uppercase tracking-widest text-white/25">Other orbits</span>
				<div class="flex flex-wrap items-center justify-center gap-2">
					{#each otherOrbits as o}
						{@const c = COLOR_MAP[o.color]}
						{@const pending = o.tasks.filter((t) => !t.completed).length}
						<button
							onclick={() => focusOrbit(o.id)}
							class="orbit-pill flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-semibold backdrop-blur-sm transition-all"
							style="border-color: {c.border}; color: {c.text}; background: {c.glow}18;"
						>
							<span class="h-1.5 w-1.5 rounded-full" style="background: {c.text};"></span>
							{o.name}
							{#if pending > 0}
								<span class="rounded-full px-1.5 py-0.5 text-[10px] font-bold" style="background:{c.glow}; color:{c.text};">{pending}</span>
							{/if}
						</button>
					{/each}
				</div>
			</div>
		{/if}
	</div>

<!-- ══════════════════════════════════════
     GALAXY GRID VIEW
══════════════════════════════════════ -->
{:else}
	<div
		class="galaxy-canvas min-h-screen pt-6 pb-16 transition-all duration-350"
		class:galaxy-canvas-shifted={isSidebarOpen}
	>
		<!-- Page header -->
		<header class="mb-8 px-6">
			<h1 class="text-2xl font-extrabold tracking-tight text-white/90">
				<span class="glow-text">Monotasker</span>
			</h1>
			<p class="mt-0.5 text-[11px] font-bold uppercase tracking-[0.25em] text-white/30">
				{orbits.length} orbit{orbits.length !== 1 ? 's' : ''} · {completedTasks}/{totalTasks} tasks done
			</p>
		</header>

		<!-- Orbits grid -->
		<div class="orbits-grid px-6">
			{#each orbits as orbit (orbit.id)}
				<div
					class="orbit-card-clickable"
					onclick={() => focusOrbit(orbit.id)}
					role="button"
					tabindex="0"
					onkeydown={(e) => e.key === 'Enter' && focusOrbit(orbit.id)}
					aria-label="Focus orbit {orbit.name}"
				>
					<OrbitPanel {orbit} isActive={orbit.id === activeOrbitId} focused={false} />
				</div>
			{/each}
		</div>
	</div>
{/if}

<style>
	.orbit-switcher {
		position: fixed;
		bottom: 0;
		left: 0;
		right: 0;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 12px;
		padding: 20px 24px 28px;
		background: linear-gradient(to top, rgba(5, 6, 14, 0.95) 60%, transparent);
		backdrop-filter: blur(4px);
	}

	.orbit-pill {
		transition: transform 0.2s ease, box-shadow 0.2s ease;
	}

	.orbit-pill:hover {
		transform: translateY(-2px);
		box-shadow: 0 4px 16px var(--orbit-glow, transparent);
	}

	.orbit-card-clickable {
		cursor: pointer;
		border-radius: 24px;
		transition: transform 0.2s ease;
	}

	.orbit-card-clickable:hover {
		transform: translateY(-3px);
	}


</style>
