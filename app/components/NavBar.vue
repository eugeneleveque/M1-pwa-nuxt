<template>
  <header class="site-header">
    <nav class="nav">
      <NuxtLink to="/" class="brand">Nuxt PWA</NuxtLink>
          <div>
            <BatteryBadge />
            <!-- le reste -->
          </div>

      <!-- zone droite (desktop) -->
      <div class="right">
        <ul class="desktop-links">
          <li><NavItem to="/">Accueil</NavItem></li>
          <li><NavItem to="/about">À propos</NavItem></li>
          <li><NavItem to="/chat">Chat</NavItem></li>
          <li><NavItem to="/profile">Profil</NavItem></li>
        </ul>

        <!-- user (desktop) -->
        <NuxtLink v-if="hasUser" to="/profile" class="userbox" title="Voir le profil">
          <img v-if="u.photoDataUrl" :src="u.photoDataUrl" alt="avatar" class="avatar" />
          <div v-else class="avatar placeholder">🙂</div>
          <span class="username">{{ u.pseudo }}</span>
        </NuxtLink>
      </div>

      <!-- bouton mobile -->
      <button
        class="mobile-toggle"
        @click="open = !open"
        aria-label="Ouvrir le menu"
      >
        ☰
      </button>
    </nav>

    <!-- menu mobile -->
    <transition name="fade">
      <ul v-if="open" class="mobile-menu">
        <!-- user (mobile) -->
        <li v-if="hasUser" class="mobile-user">
          <NuxtLink to="/profile" @click="open=false" class="userbox">
            <img v-if="u.photoDataUrl" :src="u.photoDataUrl" alt="avatar" class="avatar" />
            <div v-else class="avatar placeholder">🙂</div>
            <span class="username">{{ u.pseudo }}</span>
          </NuxtLink>
        </li>

        <li><NavItem @click="open=false" to="/" mobile>Accueil</NavItem></li>
        <li><NavItem @click="open=false" to="/about" mobile>À propos</NavItem></li>
        <li><NavItem @click="open=false" to="/chat" mobile>Chat</NavItem></li>
        <li><NavItem @click="open=false" to="/profile" mobile>Profil</NavItem></li>
      </ul>
    </transition>
  </header>
</template>

<script setup lang="ts">
const open = ref(false)
watch(() => useRoute().fullPath, () => { open.value = false })

// état utilisateur partagé (déjà utilisé dans tes autres pages)
type User = { pseudo: string; photoDataUrl: string }
const user = useState<User>('user', () => ({ pseudo: '', photoDataUrl: '' }))
const u = computed(() => user.value)
const hasUser = computed(() => !!u.value.pseudo?.trim())

// Lien factorisé
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
.site-header {
  position: sticky;
  top: 0;
  z-index: 50;
  background: #ccd8bf;
  color: #18181b;
  box-shadow: 0 4px 12px rgba(0,0,0,0.08);
}

.nav {
  max-width: 64rem;
  margin: 0 auto;
  padding: 0 16px;
  height: 56px;
  display: grid;
  grid-template-columns: 1fr auto auto; /* brand | right | burger */
  align-items: center;
  column-gap: 12px;
}

.brand {
  font-weight: 600;
  letter-spacing: 0.025em;
  text-decoration: none;
  color: inherit;
  transition: opacity .15s ease;
}
.brand:hover { opacity: 0.8; }

/* Zone droite (liens + user) */
.right {
  display: none;
  align-items: center;
  gap: 12px;
}
@media (min-width: 768px) {
  .right { display: inline-flex; }
}

/* Liens desktop */
.desktop-links {
  display: none;
  list-style: none;
  margin: 0;
  padding: 0;
  gap: 4px;
  align-items: center;
}
@media (min-width: 768px) {
  .desktop-links { display: inline-flex; }
}

.nav-link {
  display: inline-block;
  padding: 8px 12px;
  border-radius: 8px;
  text-decoration: none;
  color: inherit;
  transition: background-color .15s ease;
}
.nav-link:hover { background: rgba(0,0,0,0.10); }
.nav-link.router-link-active {
  text-decoration: underline;
  text-underline-offset: 3px;
  text-decoration-thickness: 2px;
}
.nav-link--mobile { display: block; width: 100%; }

/* Bouton burger */
.mobile-toggle {
  justify-self: end;
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
  outline: 2px solid rgba(0,0,0,0.20);
  outline-offset: 2px;
}
@media (min-width: 768px) {
  .mobile-toggle { display: none; }
}

/* User box (avatar + pseudo) */
.userbox {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  text-decoration: none;
  color: inherit;
  padding: 4px 6px;
  border-radius: 10px;
  transition: background-color .15s ease;
}
.userbox:hover { background: rgba(0,0,0,0.08); }

.avatar {
  width: 28px;
  height: 28px;
  border-radius: 9999px;
  object-fit: cover;
  border: 1px solid rgba(0,0,0,0.12);
  background: #fff;
  display: inline-block;
}
.placeholder {
  display: grid;
  place-items: center;
  font-size: 14px;
}
.username {
  font-weight: 600;
  max-width: 14ch;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Menu mobile */
.mobile-menu {
  display: block;
  padding: 12px 16px;
  background: rgba(204,216,191,0.95);
  border-top: 1px solid rgba(0,0,0,0.10);
  list-style: none;
  margin: 0;
}
.mobile-menu > li + li { margin-top: 4px; }

/* Bloc user en mobile */
.mobile-user {
  padding-bottom: 8px;
  margin-bottom: 8px;
  border-bottom: 1px dashed rgba(0,0,0,0.15);
}

/* Transition */
.fade-enter-active, .fade-leave-active { transition: opacity .15s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
