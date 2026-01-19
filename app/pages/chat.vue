<script setup lang="ts">
import { useChatClient } from '#imports'

// (optionnel) pour lister les rooms depuis l'API
// Si tu n'utilises pas cette partie, tu peux commenter la ligne suivante et le bloc "rooms".
import { useRemoteApi } from '~/composables/useRemoteApi'

type User = { pseudo: string; photoDataUrl: string }
const user = useState<User>('user', () => ({ pseudo: '', photoDataUrl: '' }))

const route = useRoute()
const router = useRouter()

const { state, connect, joinRoom, sendMessage } = useChatClient()

// room courante : par défaut "general", ou ?room=xxx dans l'URL
const room = ref<string>(String(route.query.room || 'general'))
const roomDraft = ref<string>(room.value)

// Connexion + rejoindre la room au montage
onMounted(() => {
  connect()
  joinRoom(room.value, user.value.pseudo || 'Anonyme')
})

// Quand on change manuellement de room (input + bouton)
function applyRoom() {
  const target = roomDraft.value.trim()
  if (!target) return
  room.value = target
  // mettre à jour l'URL (?room=target) sans recharger
  router.replace({ query: { ...route.query, room: room.value } })
  // rejoindre côté socket
  joinRoom(room.value, user.value.pseudo || 'Anonyme')
}

// Messages filtrés par room courante (on n’affiche que ceux de la room en cours)
const uiMessages = computed(() =>
  [...state.messages].filter(m => m.roomName === room.value).reverse()
)

// Auto-scroll en bas à chaque nouveau message
const listEl = ref<HTMLElement>()
watch(uiMessages, () => nextTick(() => {
  if (listEl.value) listEl.value.scrollTop = listEl.value.scrollHeight
}))

// Composer
const text = ref('')
const canSend = computed(() => state.connected && text.value.length > 0)
function send() {
  if (!canSend.value) return
  sendMessage(text.value) // le serveur renverra un 'chat-msg' avec roomName=state.roomName
  text.value = ''
}

// Format utils
function formatTime(iso?: string) {
  if (!iso) return ''
  try { return new Intl.DateTimeFormat(undefined, { hour:'2-digit', minute:'2-digit' }).format(new Date(iso)) }
  catch { return '' }
}

/* ---------- (Optionnel) Lister les rooms depuis l’API distante ---------- */
const rooms = ref<string[]>([])
const loadingRooms = ref(false)
const api = useRemoteApi?.()

async function refreshRooms() {
  if (!api) return
  loadingRooms.value = true
  try {
    const res: any = await api.getRooms()
    // d’après la doc, res.data est un objet { roomName: { clients: {...} } }
    rooms.value = Object.keys(res?.data || {}).sort()
  } catch (e) {
    console.warn('[rooms] getRooms failed', e)
  } finally {
    loadingRooms.value = false
  }
}

// Rejoindre une room en cliquant dans la liste
function quickJoin(name: string) {
  roomDraft.value = name
  applyRoom()
}

// Charger une première fois la liste des rooms (optionnel)
onMounted(() => {
  refreshRooms()
})
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
        <input
          v-model.trim="roomDraft"
          type="text"
          class="roomInput"
          :placeholder="`ex: general (actuel: ${room})`"
          @keydown.enter.prevent="applyRoom"
        />
      </label>
      <button class="btn" @click="applyRoom" :disabled="!roomDraft">Rejoindre</button>

      <!-- (Optionnel) Liste des rooms distantes -->
      <div class="roomsWrap">
        <button class="btn small" @click="refreshRooms" :disabled="loadingRooms">
          {{ loadingRooms ? 'Chargement…' : 'Actualiser les salons' }}
        </button>
        <ul class="rooms" v-if="rooms.length">
          <li v-for="r in rooms" :key="r">
            <button class="link" :data-active="r===room" @click="quickJoin(r)">
              #{{ r }}
            </button>
          </li>
        </ul>
      </div>
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
        <p class="text">{{ m.content }}</p>
      </article>
    </section>

    <form class="composer" @submit.prevent="send">
      <input
        v-model.trim="text"
        type="text"
        class="input"
        :placeholder="state.connected ? 'Votre message…' : 'Connexion au serveur…'"
        :disabled="!state.connected"
        @keydown.enter.exact.prevent="send"
      />
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
  display: flex; align-items: center; justify-content: space-between;
}
.title { margin: 0; font-weight: 700; font-size: 1.25rem; }
.status {
  display: inline-flex; align-items: center; gap: 6px;
  font-size: 0.9rem; padding: 4px 8px; border-radius: 999px;
  border: 1px solid #e5e7eb; background: #fff;
}
.status .dot { width: 8px; height: 8px; border-radius: 999px; background: #ef4444; }
.status[data-connected="true"] .dot { background: #10b981; }

.roomBar { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }
.roomLabel { display: inline-flex; align-items: center; gap: 8px; }
.roomInput {
  width: 220px; padding: 8px 10px; border: 1px solid #e5e7eb; border-radius: 8px; outline: none;
}
.roomInput:focus { border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59,130,246,.2); }

.roomsWrap { display: inline-flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.rooms { display: inline-flex; gap: 6px; list-style: none; padding: 0; margin: 0; }
.link {
  background: none; border: 1px dashed #cbd5e1; border-radius: 8px; padding: 6px 10px; cursor: pointer;
}
.link[data-active="true"] { border-style: solid; border-color: #3b82f6; }

.messages {
  border: 1px solid #e5e7eb; border-radius: 12px; background: #fff;
  padding: 10px; overflow: auto;
}
.empty { opacity: .7; font-style: italic; text-align: center; padding: 12px 0; }
.msg { padding: 8px 10px; }
.msg + .msg { border-top: 1px dashed #e5e7eb; }
.meta { font-size: .85rem; color: #6b7280; display: flex; align-items: baseline; gap: 6px; flex-wrap: wrap; }
.from { color: #111827; }
.roomTag {
  background: #eef2ff; color: #3730a3; border: 1px solid #c7d2fe;
  border-radius: 6px; padding: 0 6px; font-size: .75rem;
}
.text { margin: 4px 0 0 0; white-space: pre-wrap; word-break: break-word; }

.composer {
  display: grid; grid-template-columns: 1fr auto; gap: 8px;
}
.input {
  width: 100%; padding: 10px 12px; border: 1px solid #e5e7eb; border-radius: 10px; outline: none;
}
.input:focus { border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59,130,246,.2); }

.btn {
  display: inline-flex; align-items: center; justify-content: center; padding: 10px 14px;
  border-radius: 10px; font-weight: 600; border: 1px solid #111827; background: #fff; color: #111827;
  cursor: pointer;
}
.btn.small { padding: 7px 10px; font-weight: 500; }
.btn:disabled { opacity: .5; cursor: not-allowed; }
.btn.primary { background: #111827; color: #fff; }

@media (prefers-color-scheme: dark) {
  .status { border-color: #374151; background: #0f172a; }
  .roomInput, .messages, .input { background: #0f172a; border-color: #1f2937; color: #e5e7eb; }
  .roomTag { background: #1e293b; color: #93c5fd; border-color: #334155; }
  .btn { border-color: #e5e7eb; color: #e5e7eb; background: transparent; }
  .btn.primary { border-color: #e5e7eb; }
}
</style>
