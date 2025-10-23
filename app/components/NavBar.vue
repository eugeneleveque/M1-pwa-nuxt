<template>
  <header class="site-header">
    <nav class="nav">
      <NuxtLink to="/" class="brand">
        Nuxt PWA
      </NuxtLink>

      <!-- bouton mobile -->
      <button
        class="mobile-toggle"
        @click="open = !open"
        aria-label="Ouvrir le menu"
      >
        ☰
      </button>

      <!-- liens desktop -->
      <ul class="desktop-links">
        <li><NavItem to="/">Accueil</NavItem></li>
        <li><NavItem to="/about">À propos</NavItem></li>
        <li><NavItem to="/login">Connexion</NavItem></li>
        <li><NavItem to="/profile">Profil</NavItem></li>
      </ul>
    </nav>

    <!-- menu mobile -->
    <transition name="fade">
      <ul v-if="open" class="mobile-menu">
        <li><NavItem @click="open=false" to="/" mobile>Accueil</NavItem></li>
        <li><NavItem @click="open=false" to="/about" mobile>À propos</NavItem></li>
        <li><NavItem @click="open=false" to="/login" mobile>Connexion</NavItem></li>
        <li><NavItem @click="open=false" to="/profile" mobile>Profil</NavItem></li>
      </ul>
    </transition>
  </header>
</template>

<script setup lang="ts">
const open = ref(false)
watch(() => useRoute().fullPath, () => { open.value = false })

// Lien factorisé sans Tailwind
const NavItem = defineComponent({
  props: { to: { type: String, required: true }, mobile: { type: Boolean, default: false } },
  setup(props, { slots }) {
    return () => h(
      resolveComponent('NuxtLink'),
      {
        to: props.to,
        class: ['nav-link', props.mobile ? 'nav-link--mobile' : '']
      },
      { default: () => slots.default?.() }
    )
  }
})
</script>

<style scoped>
/* Header fixe en haut avec ombre légère */
.site-header {
  position: sticky;
  top: 0;
  z-index: 50;
  background: #ccd8bf;           /* équiv. bg-[#ccd8bf] */
  color: #18181b;                 /* équiv. text-zinc-900 */
  box-shadow: 0 4px 12px rgba(0,0,0,0.08);
}

/* Barre de navigation centrée */
.nav {
  max-width: 64rem;               /* équiv. max-w-5xl */
  margin: 0 auto;
  padding: 0 16px;                /* équiv. px-4 */
  height: 56px;                   /* équiv. h-14 */
  display: flex;
  align-items: center;
  justify-content: space-between;
}

/* Marque */
.brand {
  font-weight: 600;               /* font-semibold */
  letter-spacing: 0.025em;        /* tracking-wide */
  text-decoration: none;
  color: inherit;
  transition: opacity .15s ease;
}
.brand:hover { opacity: 0.8; }

/* Bouton burger (mobile uniquement) */
.mobile-toggle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 8px;
  border-radius: 8px;
  background: transparent;
  border: none;
  cursor: pointer;
  transition: background-color .15s ease;
}
.mobile-toggle:hover { background: rgba(0,0,0,0.10); }
.mobile-toggle:focus {
  outline: 2px solid rgba(0,0,0,0.20);   /* équiv. focus:ring */
  outline-offset: 2px;
}

/* Liste desktop (cachée par défaut, visible ≥768px) */
.desktop-links {
  display: none;
  list-style: none;
  margin: 0;
  padding: 0;
  gap: 4px;                        /* équiv. gap-1 */
  align-items: center;
}
@media (min-width: 768px) {
  .desktop-links { display: flex; }
  .mobile-toggle { display: none; }
}

/* Liens de nav (desktop + mobile) */
.nav-link {
  display: inline-block;
  padding: 8px 12px;              /* équiv. px-3 py-2 */
  border-radius: 8px;
  text-decoration: none;
  color: inherit;
  transition: background-color .15s ease, opacity .15s ease;
}
.nav-link:hover { background: rgba(0,0,0,0.10); }

/* Style du lien actif Nuxt */
.nav-link.router-link-active {
  text-decoration: underline;
  text-underline-offset: 3px;
  text-decoration-thickness: 2px;
}

/* Variante mobile (plein largeur + plus d'espace cliquable) */
.nav-link--mobile {
  display: block;
  width: 100%;
}

/* Menu mobile (visible <768px) */
.mobile-menu {
  display: block;
  padding: 12px 16px;
  background: rgba(204,216,191,0.95);    /* équiv. bg-[#ccd8bf]/95 */
  border-top: 1px solid rgba(0,0,0,0.10);
  list-style: none;
  margin: 0;
}
.mobile-menu > li + li { margin-top: 4px; }

/* Transition fondu */
.fade-enter-active, .fade-leave-active { transition: opacity .15s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
