<template>
  <main class="page">
    <form class="panel" @submit.prevent="onSubmit">
      <h1 class="title">Connexion</h1>

      <label class="field">
        <span class="label">Pseudo</span>
        <input
          v-model.trim="pseudo"
          type="text"
          name="pseudo"
          required
          minlength="2"
          class="input"
          placeholder="Votre pseudo"
        />
      </label>

      <label class="field">
        <span class="label">Photo de profil</span>
        <input
          ref="fileInput"
          type="file"
          accept="image/*"
          @change="onFileChange"
          class="file"
        />
      </label>

      <div v-if="preview" class="previewRow">
        <img :src="preview" alt="aperçu" class="avatarSmall" />
        <button type="button" class="link-btn" @click="clearPhoto">
          Retirer la photo
        </button>
      </div>

      <button
        type="submit"
        class="btn btn-primary btn-block"
        :disabled="!pseudo"
      >
        Continuer
      </button>
    </form>
  </main>
</template>

<script setup lang="ts">
const router = useRouter()
const pseudo = ref('')
const photo = ref<File | null>(null)
const preview = ref<string | null>(null)
const fileInput = ref<HTMLInputElement>()

function onFileChange(e: Event) {
  const f = (e.target as HTMLInputElement).files?.[0] || null
  photo.value = f || null
  if (f) {
    const url = URL.createObjectURL(f)
    preview.value = url
  } else {
    preview.value = null
  }
}

function clearPhoto() {
  photo.value = null
  preview.value = null
  if (fileInput.value) fileInput.value.value = ''
}

// Demo sans backend : on stocke l'utilisateur en mémoire + localStorage
const user = useState('user', () => ({ pseudo: '', photoDataUrl: '' }))

async function onSubmit() {
  let photoDataUrl = ''
  if (photo.value) {
    photoDataUrl = await fileToDataUrl(photo.value)
  }
  user.value = { pseudo: pseudo.value, photoDataUrl }
  localStorage.setItem('user', JSON.stringify(user.value))
  router.push('/profile')
}

function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}
</script>

<style scoped>
:root {
  --bg: #ffffff;
  --fg: #111827;
  --muted: #6b7280;
  --border: #e5e7eb;
  --input-bg: #ffffff;
  --focus: #3b82f6;
}

.page {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 24px;
  background: var(--bg);
  color: var(--fg);
}

.panel {
  width: 100%;
  max-width: 384px; /* ~ max-w-sm */
  display: flex;
  flex-direction: column;
  gap: 16px;        /* ~ space-y-4 */
}

.title {
  margin: 0;
  font-size: 1.5rem;   /* ~ text-2xl */
  line-height: 1.3;
  font-weight: 600;    /* ~ font-semibold */
}

.field {
  display: block;
}

.label {
  display: block;
  margin-bottom: 8px;  /* ~ mb-2 */
}

.input {
  width: 100%;
  padding: 8px 12px;     /* ~ px-3 py-2 */
  font-size: 16px;
  background: var(--input-bg);
  border: 1px solid var(--border);
  border-radius: 8px;
  outline: none;
  transition: box-shadow .15s ease, border-color .15s ease;
}
.input:focus {
  border-color: var(--focus);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--focus) 25%, transparent);
}

.file {
  width: 100%;
}

.previewRow {
  display: flex;
  align-items: center;
  gap: 12px;
}

.avatarSmall {
  width: 64px;          /* w-16 */
  height: 64px;         /* h-16 */
  border-radius: 9999px;
  object-fit: cover;
  border: 1px solid var(--border);
}

.link-btn {
  background: none;
  border: none;
  padding: 0;
  font: inherit;
  text-decoration: underline;
  color: inherit;
  cursor: pointer;
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px 12px;   /* ~ px-3 py-2 */
  border: none;
  border-radius: 8px;
  font-weight: 600;
  transition: filter .15s ease, transform .02s ease;
  cursor: pointer;
}
.btn:active { transform: translateY(1px); }

.btn-primary {
  background: #000000;
  color: #ffffff;
}
.btn:hover:not(:disabled) { filter: brightness(0.95); }
.btn:disabled {
  opacity: 0.5;           /* ~ disabled:opacity-50 */
  cursor: not-allowed;
}

.btn-block {
  width: 100%;
}

/* Mode sombre si tu utilises .dark sur <html> */
:global(html.dark) .page {
  --bg: #0b1020;
  --fg: #e5e7eb;
  --muted: #9ca3af;
  --border: #1f2937;
  --input-bg: #0f172a;
  --focus: #60a5fa;
}
</style>
