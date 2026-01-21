<script setup lang="ts">
import { useChatClient } from '#imports'
import { useRemoteApi } from '~/composables/useRemoteApi'

type User = { pseudo: string; photoDataUrl: string }
const user = useState<User>('user', () => ({ pseudo: '', photoDataUrl: '' }))

const route = useRoute()
const router = useRouter()

const { state, connect, joinRoom, sendMessage } = useChatClient()

// ✅ Empêche les mismatches SSR/CSR sur les éléments interactifs
const hydrated = ref(false)

// room courante : par défaut "general", ou ?room=xxx dans l'URL
const room = ref<string>(String(route.query.room || 'general'))

/* ---------- Rooms (dropdown) ---------- */
const rooms = ref<string[]>([])
const loadingRooms = ref(false)
const api = useRemoteApi?.()

const selectedRoom = ref<string>(room.value)

// Options dropdown : general + room courante + rooms API
const roomOptions = computed(() => {
  const set = new Set<string>(['general', room.value, ...rooms.value])
  return [...set].filter(Boolean).sort()
})

async function refreshRooms() {
  if (!api) return
  loadingRooms.value = true
  try {
    const res: any = await api.getRooms()
    rooms.value = Object.keys(res?.data || {}).sort()
  } catch (e) {
    console.warn('[rooms] getRooms failed', e)
  } finally {
    loadingRooms.value = false
  }
}

function applySelectedRoom() {
  const target = selectedRoom.value?.trim()
  if (!target) return
  room.value = target
  router.replace({ query: { ...route.query, room: room.value } })
  joinRoom(room.value, user.value.pseudo || 'Anonyme')
}

// Connexion + rejoindre la room au montage
onMounted(() => {
  hydrated.value = true

  connect()
  joinRoom(room.value, user.value.pseudo || 'Anonyme')
  selectedRoom.value = room.value

  refreshRooms()
})

/* ---------- Messages ---------- */
type Payload =
  | { type: 'text'; text: string }
  | { type: 'image'; dataUrl: string; mime?: string; name?: string }
  | { type: 'geo'; lat: number; lng: number; accuracy?: number }

function parsePayload(content: string): Payload | null {
  if (/^data:image\/(png|jpe?g|gif|webp);base64,/.test(content)) {
    return { type: 'image', dataUrl: content }
  }
  if (content?.startsWith('{') || content?.startsWith('[')) {
    try {
      const obj = JSON.parse(content)
      if (obj?.type === 'image' && typeof obj.dataUrl === 'string') return obj
      if (obj?.type === 'geo' && typeof obj.lat === 'number' && typeof obj.lng === 'number') return obj
      if (obj?.type === 'text' && typeof obj.text === 'string') return obj
    } catch {}
  }
  return null
}

/* ---------- UI messages ---------- */
const uiMessages = computed(() =>
  [...state.messages].filter(m => m.roomName === room.value).reverse()
)

// Auto-scroll en bas à chaque nouveau message
const listEl = ref<HTMLElement>()
watch(uiMessages, () =>
  nextTick(() => {
    if (listEl.value) listEl.value.scrollTop = listEl.value.scrollHeight
  })
)

/* ---------- Composer texte ---------- */
const text = ref('')
const canSend = computed(() => state.connected && text.value.length > 0)

function send() {
  if (!canSend.value) return
  sendMessage(text.value) // ✅ 1 argument
  text.value = ''
}

/* ---------- Envoi photo ---------- */
const fileInput = ref<HTMLInputElement | null>(null)
const sendingImage = ref(false)

function triggerPickPhoto() {
  if (!hydrated.value) return
  fileInput.value?.click()
}

async function onPickPhoto(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = '' // re-sélection même fichier
  if (!file) return
  if (!file.type.startsWith('image/')) return

  try {
    sendingImage.value = true
    const dataUrl = await fileToDataUrl(file)
    const compressed = await compressImageDataUrl(dataUrl, 1280, 0.82)

    sendMessage(
      JSON.stringify({
        type: 'image',
        dataUrl: compressed,
        mime: 'image/jpeg',
        name: file.name,
      })
    )
  } catch (err) {
    console.warn('[image] send failed', err)
  } finally {
    sendingImage.value = false
  }
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

function compressImageDataUrl(dataUrl: string, maxWidth = 1280, quality = 0.82): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const ratio = img.width > maxWidth ? maxWidth / img.width : 1
      const w = Math.round(img.width * ratio)
      const h = Math.round(img.height * ratio)

      const canvas = document.createElement('canvas')
      canvas.width = w
      canvas.height = h
      const ctx = canvas.getContext('2d')
      if (!ctx) return reject(new Error('Canvas 2D context not available'))
      ctx.drawImage(img, 0, 0, w, h)
      resolve(canvas.toDataURL('image/jpeg', quality))
    }
    img.onerror = reject
    img.src = dataUrl
  })
}

/* ---------- Envoi géoloc ---------- */
const sendingGeo = ref(false)

async function sendGeo() {
  if (!hydrated.value || !state.connected) return
  if (!('geolocation' in navigator)) {
    console.warn('[geo] not supported')
    return
  }

  try {
    sendingGeo.value = true
    const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      })
    })

    sendMessage(
      JSON.stringify({
        type: 'geo',
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        accuracy: pos.coords.accuracy,
      })
    )
  } catch (err) {
    console.warn('[geo] failed', err)
  } finally {
    sendingGeo.value = false
  }
}

// Format utils
function formatTime(iso?: string) {
  if (!iso) return ''
  try {
    return new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit' }).format(new Date(iso))
  } catch {
    return ''
  }
}
</script>

<template>
  <main class="chat">
    <header class="chatHeader">
      <h1 class="title">Chat temps réel</h1>
      <div class="status" :data-connected="state.connected">
        <span class="dot"></span>
        <span>
          {{ state.connected ? 'Connecté' : (state.connecting ? 'Connexion…' : 'Hors ligne') }}
        </span>
      </div>
    </header>

    <section class="roomBar">
      <label class="roomLabel">
        Salon :
        <select v-model="selectedRoom" class="roomSelect" :disabled="!hydrated" @change="applySelectedRoom">
          <option value="" disabled>{{ hydrated ? 'Choisir un salon…' : 'Chargement…' }}</option>
          <option v-for="r in roomOptions" :key="r" :value="r">#{{ r }}</option>
        </select>
      </label>
        <ScrollToBottomButton />

      <button class="btn" :disabled="!hydrated || !selectedRoom" @click="applySelectedRoom">Rejoindre</button>

      <button class="btn small" @click="refreshRooms" :disabled="!hydrated || loadingRooms">
        {{ loadingRooms ? 'Chargement…' : 'Actualiser les salons' }}
      </button>
    </section>

    <section ref="listEl" class="messages" aria-live="polite">
      <div v-if="uiMessages.length === 0" class="empty">
        Aucun message pour l’instant dans <strong>#{{ room }}</strong>.
      </div>

      <article v-for="m in uiMessages" :key="m.localId" class="msg">
        <div class="meta">
          <strong class="from">{{ m.author || m.pseudo || 'Anonyme' }}</strong>
          <span class="time">· {{ formatTime(m.dateEmis) }}</span>
          <span v-if="m.roomName" class="roomTag">#{{ m.roomName }}</span>
        </div>

        <!-- ✅ Image -->
        <template v-if="parsePayload(m.content)?.type === 'image'">
          <div class="imgWrap">
            <img class="img" :src="(parsePayload(m.content) as any).dataUrl" alt="Image envoyée" loading="lazy" />
          </div>
        </template>

        <!-- ✅ Géoloc -->
        <template v-else-if="parsePayload(m.content)?.type === 'geo'">
          <p class="text">
            📍 Position :
            <strong>{{ (parsePayload(m.content) as any).lat.toFixed(6) }}</strong>,
            <strong>{{ (parsePayload(m.content) as any).lng.toFixed(6) }}</strong>
            <span v-if="(parsePayload(m.content) as any).accuracy"> (± {{ Math.round((parsePayload(m.content) as any).accuracy) }} m)</span>
          </p>
        </template>

        <!-- ✅ Texte -->
        <template v-else>
          <p class="text">{{ m.content }}</p>
        </template>
      </article>
    </section>

    <!-- ✅ BOUTONS EN BAS : Photo + Géoloc + Envoyer -->
    <form class="composer" @submit.prevent="send">
      <input
        v-model.trim="text"
        type="text"
        class="input"
        :placeholder="state.connected ? 'Votre message…' : 'Connexion au serveur…'"
        :disabled="!state.connected"
        @keydown.enter.exact.prevent="send"
      />

      <!-- input file caché -->
      <input
        ref="fileInput"
        class="fileHidden"
        type="file"
        accept="image/*"
        :disabled="!hydrated || !state.connected || sendingImage"
        @change="onPickPhoto"
      />

      <button class="btn" type="button" :disabled="!hydrated || !state.connected || sendingImage" @click="triggerPickPhoto">
        {{ sendingImage ? 'Envoi…' : 'Photo' }}
      </button>

      <button class="btn" type="button" :disabled="!hydrated || !state.connected || sendingGeo" @click="sendGeo">
        {{ sendingGeo ? 'Localisation…' : 'Géoloc' }}
      </button>

      <button class="btn primary" type="submit" :disabled="!canSend">Envoyer</button>
    </form>
  </main>
</template>

<style scoped>
.chat {
  max-width: 980px;
  margin: 0 auto;
  min-height: 100vh;
  display: grid;
  grid-template-rows: auto auto 1fr auto;
  gap: 12px;
  padding: 16px;
}
.chatHeader {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.title {
  margin: 0;
  font-weight: 700;
  font-size: 1.25rem;
}
.status {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.9rem;
  padding: 4px 8px;
  border-radius: 999px;
  border: 1px solid #e5e7eb;
  background: #fff;
}
.status .dot {
  width: 8px;
  height: 8px;
  border-radius: 999px;
  background: #ef4444;
}
.status[data-connected='true'] .dot {
  background: #10b981;
}

.roomBar {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}
.roomLabel {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.roomSelect {
  min-width: 240px;
  padding: 8px 10px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  outline: none;
  background: #fff;
}
.roomSelect:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
}

.messages {
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  background: #fff;
  padding: 10px;
  overflow: auto;
}
.empty {
  opacity: 0.7;
  font-style: italic;
  text-align: center;
  padding: 12px 0;
}
.msg {
  padding: 8px 10px;
}
.msg + .msg {
  border-top: 1px dashed #e5e7eb;
}
.meta {
  font-size: 0.85rem;
  color: #6b7280;
  display: flex;
  align-items: baseline;
  gap: 6px;
  flex-wrap: wrap;
}
.from {
  color: #111827;
}
.roomTag {
  background: #eef2ff;
  color: #3730a3;
  border: 1px solid #c7d2fe;
  border-radius: 6px;
  padding: 0 6px;
  font-size: 0.75rem;
}
.text {
  margin: 4px 0 0 0;
  white-space: pre-wrap;
  word-break: break-word;
}

/* Images */
.imgWrap {
  margin-top: 6px;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  overflow: hidden;
  max-width: 520px;
}
.img {
  display: block;
  width: 100%;
  height: auto;
}

/* ✅ Composer en bas : input + Photo + Geoloc + Envoyer */
.composer {
  display: grid;
  grid-template-columns: 1fr auto auto auto;
  gap: 8px;
}
.input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  outline: none;
}
.input:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
}

.fileHidden {
  display: none;
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 10px 14px;
  border-radius: 10px;
  font-weight: 600;
  border: 1px solid #111827;
  background: #fff;
  color: #111827;
  cursor: pointer;
}
.btn.small {
  padding: 7px 10px;
  font-weight: 500;
}
.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.btn.primary {
  background: #111827;
  color: #fff;
}

@media (prefers-color-scheme: dark) {
  .status {
    border-color: #374151;
    background: #0f172a;
  }
  .roomSelect,
  .messages,
  .input {
    background: #0f172a;
    border-color: #1f2937;
    color: #e5e7eb;
  }
  .roomTag {
    background: #1e293b;
    color: #93c5fd;
    border-color: #334155;
  }
  .imgWrap {
    border-color: #1f2937;
  }
  .btn {
    border-color: #e5e7eb;
    color: #e5e7eb;
    background: transparent;
  }
  .btn.primary {
    border-color: #e5e7eb;
  }
}
</style>
