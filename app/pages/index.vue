<template>
  <main class="home">
    <section class="hero">
      <h1 class="title">Projet Progressive Web App avec Nuxt + Vite</h1>
      <p class="subtitle">
        Cette application démontre la création d’une <strong>Progressive Web App (PWA)</strong>
        moderne avec <strong>Nuxt 4</strong> (rendu hybride/SSR) et <strong>Vite</strong> (bundler ultra rapide).
      </p>
      <div class="ctaRow">
        <NuxtLink class="btn" to="/about">En savoir plus</NuxtLink>
        <NuxtLink class="btn ghost" to="/profile">Se connecter</NuxtLink>
      </div>
    </section>

    <section class="grid">
      <article class="card">
        <h2 class="cardTitle">Pourquoi une PWA ?</h2>
        <ul class="list">
          <li>📱 Installation sur l’écran d’accueil (Add To Home Screen)</li>
          <li>⚡ Temps de chargement rapides grâce au precache et au runtime caching</li>
          <li>🛰️ Résilience réseau (fonctionnement dégradé hors-ligne)</li>
          <li>🔔 Possibilité de notifications et synchronisation en arrière-plan</li>
        </ul>
      </article>

      <article class="card">
        <h2 class="cardTitle">Pile technique</h2>
        <ul class="kv">
          <li><span>Framework</span><strong>Nuxt 4</strong></li>
          <li><span>Bundler</span><strong>Vite</strong></li>
          <li><span>PWA</span><strong>@vite-pwa/nuxt</strong></li>
          <li><span>Langage</span><strong>TypeScript</strong></li>
        </ul>
      </article>

      <article class="card">
        <h2 class="cardTitle">Fonctionnalités clés</h2>
        <ul class="list">
          <li>👤 Authentification démo (pseudo + avatar local)</li>
          <li>🧭 Navigation responsive avec menu mobile</li>
          <li>🗂️ Mise en cache d’assets et stratégies Workbox adaptées</li>
          <li>🔧 Structure prête pour pages, composants et API</li>
        </ul>
      </article>
    </section>

    <section class="nextSteps">
      <h2 class="cardTitle">Aller plus loin</h2>
      <ol class="steps">
        <li>Ouvre la page <code>/about</code> pour la documentation projet.</li>
        <li>Teste la connexion sur <code>/profile</code>, puis consulte ton profil sur <code>/profile</code>.</li>
        <li>Construit en production : <code>npm run build</code> puis <code>npm run preview</code>.</li>
        <li>Active l’installation PWA depuis la barre d’URL (icône d’installation) ou via le menu navigateur.</li>
      </ol>
    </section>
  </main>
</template>

<script setup lang="ts">
// Pas de logique spécifique pour la page d’accueil
</script>

<style scoped>
.home {
  max-width: 64rem;     /* ~ 1024px */
  margin: 0 auto;
  padding: 24px 16px;
  color: #111827;
}

.hero {
  text-align: center;
  margin-bottom: 28px;
}

.title {
  font-size: clamp(1.75rem, 3vw, 2.25rem);
  line-height: 1.2;
  margin: 0 0 8px 0;
  font-weight: 700;
}

.subtitle {
  margin: 0 auto;
  max-width: 52ch;
  color: #374151;
}

.ctaRow {
  display: flex;
  gap: 12px;
  justify-content: center;
  margin-top: 16px;
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 10px 14px;
  border-radius: 10px;
  border: 1px solid #111827;
  background: #111827;
  color: #fff;
  text-decoration: none;
  font-weight: 600;
  transition: filter .15s ease, transform .02s ease;
}
.btn:active { transform: translateY(1px); }
.btn:hover { filter: brightness(0.95); }

.btn.ghost {
  background: transparent;
  color: #111827;
}

.grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
  margin-top: 12px;
}
@media (min-width: 768px) {
  .grid { grid-template-columns: repeat(3, 1fr); }
}

.card {
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 4px 14px rgba(0,0,0,0.03);
}

.cardTitle {
  margin: 0 0 8px 0;
  font-size: 1.125rem;
  font-weight: 700;
}

.list {
  margin: 0;
  padding-left: 18px;
  display: grid;
  row-gap: 6px;
}

.kv {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  row-gap: 8px;
}
.kv li {
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: center;
  border-bottom: 1px dashed #e5e7eb;
  padding-bottom: 6px;
}
.kv li:last-child { border-bottom: 0; }
.kv span { color: #6b7280; }

.nextSteps {
  margin-top: 24px;
}
.steps {
  margin: 0;
  padding-left: 18px;
  display: grid;
  row-gap: 6px;
}

/* Mode sombre si tu utilises html.dark */
:global(html.dark) .home {
  color: #e5e7eb;
}
:global(html.dark) .card {
  background: #0f172a;
  border-color: #1f2937;
}
:global(html.dark) .subtitle { color: #9ca3af; }
:global(html.dark) .btn { border-color: #e5e7eb; }
</style>
