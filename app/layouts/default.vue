<template>
  <div class="app">
    <NavBar />
    <main class="content">
      <slot />
    </main>
    <footer class="site-footer">
      © {{ new Date().getFullYear() }} — My PWA App
    </footer>
  </div>
</template>

<script setup lang="ts">
// pas de logique nécessaire ici
</script>

<style scoped>
/* Palette (équivalents de violet-50 / violet-900 / violet-100) */
:root {
  --violet-50: #f5f3ff;
  --violet-900: #4c1d95;
  --violet-100: #ede9fe;
}

/* Conteneur global (min-h-dvh + flex-col) */
.app {
  min-height: 100dvh;   /* équiv. min-h-dvh */
  display: flex;
  flex-direction: column;
  background: var(--violet-50);
}

/* Zone centrale qui prend l'espace (flex-1) */
.content {
  flex: 1 1 auto;
}

/* Pied de page (bg, text, center, padding, text-sm) */
.site-footer {
  background: var(--violet-900);
  color: var(--violet-100);
  text-align: center;
  padding: 16px 12px;   /* ~ py-4 */
  font-size: 0.875rem;  /* ~ text-sm */
}

/* (Optionnel) mode sombre si tu utilises .dark sur <html> */
:global(html.dark) .app {
  --violet-50: #0b1020; /* fond global plus sombre */
}
</style>
