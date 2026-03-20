<script>
	import '../app.css';
	let { children } = $props();
</script>

<div class="cosmic-void"></div>

<main class="relative z-10 size-full min-h-screen">
	{@render children()}
</main>
