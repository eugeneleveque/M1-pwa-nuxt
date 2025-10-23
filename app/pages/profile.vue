<template>
  <main class="page">
    <div class="card">
      <h1 class="title">Mon profil</h1>

      <div class="avatarRow">
        <img
          v-if="u.photoDataUrl"
          :src="u.photoDataUrl"
          alt="avatar"
          class="avatar"
        />
        <div v-else class="avatar placeholder">
          <span>🙂</span>
        </div>
      </div>

      <p class="line">
        <strong>Pseudo :</strong> {{ u.pseudo || '–' }}
      </p>

      <div class="actions">
        <NuxtLink to="/login" class="link">Changer</NuxtLink>
        <button class="link btn-link" @click="logout">Se déconnecter</button>
      </div>
    </div>
  </main>
</template>

<script setup lang="ts">
const router = useRouter()
const user = useState<{ pseudo: string; photoDataUrl: string }>('user', () => {
  if (import.meta.client) {
    const saved = localStorage.getItem('user')
    if (saved) return JSON.parse(saved)
  }
  return { pseudo: '', photoDataUrl: '' }
})

const u = computed(() => user.value)

function logout() {
  user.value = { pseudo: '', photoDataUrl: '' }
  if (import.meta.client) localStorage.removeItem('user')
  router.push('/login')
}
</script>

<style scoped>
/* Palette légère (modifiable) */
:root {
  --bg: #ffffff;
  --fg: #111827;
  --muted: #6b7280;
  --border: #e5e7eb;
}

/* Layout principal */
.page {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 24px;
  background: var(--bg);
  color: var(--fg);
}

/* Conteneur central */
.card {
  width: 100%;
  max-width: 384px; /* ~ max-w-sm */
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;        /* ~ space-y-4 */
  text-align: center;
}

/* Titre */
.title {
  font-size: 1.5rem;      /* ~ text-2xl */
  line-height: 1.3;
  font-weight: 600;       /* ~ font-semibold */
  margin: 0;
}

/* Avatar */
.avatarRow {
  display: flex;
  align-items: center;
  justify-content: center;
}

.avatar {
  height: 96px;           /* h-24 */
  width: 96px;            /* w-24 */
  border-radius: 9999px;  /* rounded-full */
  object-fit: cover;      /* object-cover */
  border: 1px solid var(--border);
}

.placeholder {
  display: grid;
  place-items: center;
}

/* Ligne d’info */
.line {
  font-size: 1.125rem;    /* ~ text-lg */
  margin: 0;
}

/* Actions */
.actions {
  display: flex;
  justify-content: center;
  gap: 12px;
}

/* Liens */
.link {
  text-decoration: underline;
  color: inherit;
}

.btn-link {
  background: none;
  border: none;
  padding: 0;
  font: inherit;
  cursor: pointer;
}

/* (Optionnel) mode sombre si tu ajoutes .dark sur <html> */
:global(html.dark) .page {
  --bg: #0b1020;
  --fg: #e5e7eb;
  --muted: #9ca3af;
  --border: #1f2937;
}
</style>
