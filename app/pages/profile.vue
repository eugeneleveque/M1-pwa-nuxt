<template>
  <main class="page">
    <section class="card">
      <!-- ÉTAT : PAS CONNECTÉ -->
      <template v-if="!isLoggedIn">
        <h1 class="title">Connexion</h1>

        <form class="form" @submit.prevent="onLogin">
          <label class="field">
            <span class="label">Pseudo</span>
            <input
              v-model.trim="loginPseudo"
              type="text"
              name="pseudo"
              required
              minlength="2"
              class="input"
              placeholder="Votre pseudo"
            />
          </label>

          <label class="field">
            <span class="label">Photo de profil (optionnel)</span>
            <input
              ref="loginFileInput"
              type="file"
              accept="image/*"
              class="file"
              @change="onLoginFileChange"
            />
          </label>

          <div class="previewActions">
            <button type="button" class="btn" @click="camOpenLogin = true">📷 Prendre une photo</button>
            <button v-if="loginPreview" type="button" class="link-btn" @click="clearLoginPhoto">
              Retirer la photo
            </button>
          </div>

          <div v-if="loginPreview" class="previewRow">
            <img :src="loginPreview" alt="aperçu" class="avatarSmall" />
          </div>

          <button type="submit" class="btn primary btn-block" :disabled="!canLogin">
            Continuer
          </button>
        </form>
      </template>

      <!-- ÉTAT : CONNECTÉ -->
      <template v-else>
        <h1 class="title">Mon profil</h1>

        <div class="avatarRow">
          <img v-if="currentPreview" :src="currentPreview" alt="avatar" class="avatar" />
          <div v-else class="avatar placeholder">🙂</div>
        </div>

        <form class="form" @submit.prevent="onSave">
          <label class="field">
            <span class="label">Pseudo</span>
            <input
              v-model.trim="pseudo"
              type="text"
              required
              minlength="2"
              class="input"
              placeholder="Votre pseudo"
            />
          </label>

          <label class="field">
            <span class="label">Photo de profil</span>
            <input
              ref="editFileInput"
              type="file"
              accept="image/*"
              class="file"
              @change="onEditFileChange"
            />
          </label>

          <div class="previewActions">
            <button type="button" class="btn" @click="camOpenEdit = true">📷 Prendre une photo</button>
            <button type="button" class="link-btn" @click="clearEditPhoto">Retirer la photo</button>
            <button
              v-if="user.photoDataUrl && !newPhoto && !capturedDataUrl"
              type="button"
              class="link-btn"
              @click="restoreCurrentPhoto"
            >
              Restaurer la photo actuelle
            </button>
          </div>

          <div class="actions">
            <button type="button" class="btn ghost" @click="resetForm" :disabled="!isDirty">Annuler</button>
            <button type="submit" class="btn primary" :disabled="!canSave">Enregistrer</button>
          </div>
        </form>

        <hr class="sep" />

        <div class="dangerZone">
          <button type="button" class="btn danger" @click="logout">Se déconnecter</button>
        </div>
      </template>
    </section>

    <!-- MODALE CAMÉRA — Connexion -->
    <CameraCapture
      v-model:open="camOpenLogin"
      facing-default="user"
      mime-type="image/jpeg"
      :quality="0.92"
      :show-fallback="true"
      @confirm="onCameraConfirmLogin"
      @error="onCameraError"
    />

    <!-- MODALE CAMÉRA — Édition profil -->
    <CameraCapture
      v-model:open="camOpenEdit"
      facing-default="user"
      mime-type="image/jpeg"
      :quality="0.92"
      :show-fallback="true"
      @confirm="onCameraConfirmEdit"
      @error="onCameraError"
    />
  </main>
</template>

<script setup lang="ts">
import CameraCapture from '~/components/CameraCapture.vue'

const router = useRouter()

type User = { pseudo: string; photoDataUrl: string }
const state = useState<User>('user', () => {
  if (import.meta.client) {
    const saved = localStorage.getItem('user')
    if (saved) return JSON.parse(saved)
  }
  return { pseudo: '', photoDataUrl: '' }
})
const user = computed(() => state.value)
const isLoggedIn = computed(() => !!user.value.pseudo?.trim())

/* ----------- Connexion ----------- */
const loginPseudo = ref('')
const loginPhoto = ref<File | null>(null)
const loginPreview = ref<string | null>(null)
const loginFileInput = ref<HTMLInputElement>()
const loginCapturedDataUrl = ref<string | null>(null)
const camOpenLogin = ref(false)

function onLoginFileChange(e: Event) {
  const f = (e.target as HTMLInputElement).files?.[0] || null
  loginPhoto.value = f
  loginCapturedDataUrl.value = null
  loginPreview.value = f ? URL.createObjectURL(f) : null
}
function clearLoginPhoto() {
  loginPhoto.value = null
  loginCapturedDataUrl.value = null
  loginPreview.value = null
  if (loginFileInput.value) loginFileInput.value.value = ''
}
const canLogin = computed(() => !!loginPseudo.value && loginPseudo.value.length >= 2)

async function onLogin() {
  let photoDataUrl = ''
  if (loginCapturedDataUrl.value) {
    photoDataUrl = loginCapturedDataUrl.value
  } else if (loginPhoto.value) {
    photoDataUrl = await fileToDataUrl(loginPhoto.value)
  }
  state.value = { pseudo: loginPseudo.value, photoDataUrl }
  if (import.meta.client) localStorage.setItem('user', JSON.stringify(state.value))
  // reset champs login
  loginPseudo.value = ''
  clearLoginPhoto()
}

/* Camera — login */
function onCameraConfirmLogin(dataUrl: string) {
  loginCapturedDataUrl.value = dataUrl
  loginPhoto.value = null
  loginPreview.value = dataUrl
}
function onCameraError(e: unknown) {
  if (e instanceof Error) console.error('camera error:', e.message, e)
  else console.error('camera error:', e)
}

/* ----------- Édition profil ----------- */
const pseudo = ref(user.value.pseudo)
const newPhoto = ref<File | null>(null)                // photo via input
const capturedDataUrl = ref<string | null>(null)       // photo via caméra
const currentPreview = ref<string | null>(user.value.photoDataUrl || null)
const editFileInput = ref<HTMLInputElement>()
const camOpenEdit = ref(false)

watch(user, (u) => {
  if (!isLoggedIn.value) return
  pseudo.value = u.pseudo
  if (!newPhoto.value && !capturedDataUrl.value) currentPreview.value = u.photoDataUrl || null
})

function onEditFileChange(e: Event) {
  const f = (e.target as HTMLInputElement).files?.[0] || null
  newPhoto.value = f
  capturedDataUrl.value = null
  currentPreview.value = f ? URL.createObjectURL(f) : (user.value.photoDataUrl || null)
}
function clearEditPhoto() {
  newPhoto.value = null
  capturedDataUrl.value = null
  currentPreview.value = null
  if (editFileInput.value) editFileInput.value.value = ''
}
function restoreCurrentPhoto() {
  newPhoto.value = null
  capturedDataUrl.value = null
  currentPreview.value = user.value.photoDataUrl || null
  if (editFileInput.value) editFileInput.value.value = ''
}
function resetForm() {
  pseudo.value = user.value.pseudo
  newPhoto.value = null
  capturedDataUrl.value = null
  currentPreview.value = user.value.photoDataUrl || null
  if (editFileInput.value) editFileInput.value.value = ''
}

/* Camera — édition profil */
function onCameraConfirmEdit(dataUrl: string) {
  capturedDataUrl.value = dataUrl
  newPhoto.value = null
  currentPreview.value = dataUrl
}

/* ---- Dirty / Save ---- */
const isDirty = computed(() => {
  const nameChanged = pseudo.value !== user.value.pseudo
  const photoRemoved = currentPreview.value === null && !!user.value.photoDataUrl
  const photoFromFile = !!newPhoto.value
  const photoFromCamera = !!capturedDataUrl.value
  return nameChanged || photoRemoved || photoFromFile || photoFromCamera
})
const canSave = computed(() => !!pseudo.value && pseudo.value.length >= 2 && isDirty.value)

async function onSave() {
  let photoDataUrl = user.value.photoDataUrl || ''

  if (capturedDataUrl.value) {
    photoDataUrl = capturedDataUrl.value
  } else if (newPhoto.value) {
    photoDataUrl = await fileToDataUrl(newPhoto.value)
  } else if (currentPreview.value === null) {
    photoDataUrl = '' // suppression volontaire
  }

  state.value = { pseudo: pseudo.value, photoDataUrl }
  if (import.meta.client) localStorage.setItem('user', JSON.stringify(state.value))

  // reset états liés à la nouvelle photo
  newPhoto.value = null
  capturedDataUrl.value = null
}

/* ----------- Utilitaire commun ----------- */
function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

function logout() {
  state.value = { pseudo: '', photoDataUrl: '' }
  if (import.meta.client) localStorage.removeItem('user')
  resetForm()
}
</script>

<style scoped>
.page {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 24px;
}

.card {
  width: 100%;
  max-width: 460px;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 18px;
  box-shadow: 0 4px 14px rgba(0,0,0,0.03);
}

.title {
  margin: 0 0 12px 0;
  font-size: 1.5rem;
  font-weight: 700;
  text-align: center;
}

.form { display: grid; gap: 14px; }
.field { display: block; }
.label { display: block; margin-bottom: 8px; }

.input {
  width: 100%;
  padding: 8px 12px;
  font-size: 16px;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  outline: none;
  transition: box-shadow .15s ease, border-color .15s ease;
}
.input:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59,130,246,.25);
}

.file { width: 100%; }

.previewRow {
  display: flex;
  align-items: center;
  gap: 12px;
}
.avatarSmall {
  width: 64px;
  height: 64px;
  border-radius: 9999px;
  object-fit: cover;
  border: 1px solid #e5e7eb;
}

.avatarRow {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 8px;
}
.avatar {
  width: 96px;
  height: 96px;
  border-radius: 9999px;
  border: 1px solid #e5e7eb;
  object-fit: cover;
  background: #fff;
}
.placeholder {
  display: grid;
  place-items: center;
  width: 96px;
  height: 96px;
  border-radius: 9999px;
  border: 1px solid #e5e7eb;
  background: #fff;
}

.previewActions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  align-items: center;
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

.actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 4px;
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px 14px;
  border-radius: 10px;
  font-weight: 600;
  border: 1px solid transparent;
  cursor: pointer;
  text-decoration: none;
}
.btn.primary { background: #111827; color: #fff; border-color: #111827; }
.btn.ghost { background: transparent; color: #111827; border: 1px solid #111827; }
.btn-block { width: 100%; }

.sep {
  margin: 16px 0;
  border: none;
  border-top: 1px dashed #e5e7eb;
}

.dangerZone { display: flex; justify-content: flex-end; }
.btn.danger {
  background: #b91c1c;
  border-color: #b91c1c;
  color: #fff;
}

@media (prefers-color-scheme: dark) {
  .card { background: #0f172a; border-color: #1f2937; }
  .input { background: #0f172a; border-color: #1f2937; color: #e5e7eb; }
  .btn.ghost { color: #e5e7eb; border-color: #e5e7eb; }
}
</style>
