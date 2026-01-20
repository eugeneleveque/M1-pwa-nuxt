// app/composables/useChatClient.ts
import { reactive, readonly, watch, onMounted } from 'vue'
import type { Socket } from 'socket.io-client'

export type MessageCategory = 'MESSAGE' | 'INFO' | 'NEW_IMAGE' | 'NEW_GEO'

export type ServerChatMessage = {
  content: string
  dateEmis: string
  roomName: string
  categorie: MessageCategory
  serverId: string
  pseudo?: string
}

export type ChatMessage = ServerChatMessage & {
  localId: string
  receivedAt: Date
  author?: string
}

type ChatState = {
  connected: boolean
  connecting: boolean
  error: string | null
  roomName: string
  messages: ChatMessage[]
  clients: Record<string, any>
}

const uid = () =>
  typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`

/* -------------------- LocalStorage persistence -------------------- */
const STORAGE_KEY = 'chat:messages:v1'
const MAX_MESSAGES = 300

function canUseLocalStorage() {
  return process.client && typeof window !== 'undefined' && !!window.localStorage
}

function loadFromStorage(): ChatMessage[] {
  if (!canUseLocalStorage()) return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.map((m: any) => ({
      ...m,
      receivedAt: m?.receivedAt ? new Date(m.receivedAt) : new Date(),
    }))
  } catch {
    return []
  }
}

function sendGeolocation(position: { lat: number; lng: number; accuracy?: number }) {
  const s = getSocket()
  const payload = {
    type: 'geo',
    lat: position.lat,
    lng: position.lng,
    accuracy: position.accuracy ?? null,
    ts: new Date().toISOString(),
  }

  // ✅ on garde content en string pour compatibilité serveur
  s.emit('chat-msg', {
    roomName: state.roomName,
    categorie: 'NEW_GEO',
    content: JSON.stringify(payload),
  })
}


function saveToStorage(messages: ChatMessage[]) {
  if (!canUseLocalStorage()) return
  try {
    const trimmed = messages.slice(0, MAX_MESSAGES).map(m => ({
      ...m,
      receivedAt: m.receivedAt?.toISOString?.() ?? new Date().toISOString(),
    }))
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed))
  } catch {
    // ignore quota / JSON errors
  }
}

function clampMessages(messages: ChatMessage[]) {
  if (messages.length > MAX_MESSAGES) messages.length = MAX_MESSAGES
}
/* ------------------------------------------------------------------ */

const state = reactive<ChatState>({
  connected: false,
  connecting: false,
  error: null,
  roomName: 'general',
  messages: [],
  clients: {},
})

let socket: Socket | null = null

// Persistance: initialisée une seule fois (mais hook/watch doivent être créés dans setup())
let persistenceInit = false
let storageHydrated = false
let saveTimer: number | null = null

function initPersistenceOnce() {
  if (!process.client) return
  if (persistenceInit) return
  persistenceInit = true

  // Charge APRES mount pour éviter mismatch SSR/hydration
  onMounted(() => {
    state.messages = loadFromStorage()
    clampMessages(state.messages)
    storageHydrated = true
  })

  // Sauvegarde (throttle) après hydratation
  watch(
    () => state.messages,
    (msgs) => {
      if (!storageHydrated) return
      if (saveTimer) window.clearTimeout(saveTimer)
      saveTimer = window.setTimeout(() => saveToStorage(msgs), 200)
    },
    { deep: true }
  )
}

function getSocket() {
  if (socket) return socket
  const { $socket } = useNuxtApp()
  socket = $socket

  socket.on('connect', () => {
    state.connected = true
    state.connecting = false
    state.error = null

    const u = useState<{ pseudo: string }>('user').value
    socket!.emit('chat-join-room', { roomName: state.roomName, pseudo: u?.pseudo || 'Anonyme' })
  })

  socket.on('disconnect', () => { state.connected = false })

  socket.on('connect_error', (err: any) => {
    state.error = err?.message || 'connect_error'
    state.connecting = false
  })

  socket.on('error', (msg: string) => { state.error = msg || 'server error' })

  socket.on('chat-joined-room', (payload: { clients: Record<string, any>; roomName: string }) => {
    state.clients = payload?.clients || {}
    state.roomName = payload?.roomName || state.roomName
  })

  socket.on('chat-disconnected', (payload: { id: string; pseudo: string; roomName: string }) => {
    if (payload?.id && state.clients[payload.id]) {
      const next = { ...state.clients }
      delete next[payload.id]
      state.clients = next
    }

    state.messages.unshift({
      content: `${payload.pseudo} s'est déconnecté`,
      dateEmis: new Date().toISOString(),
      roomName: payload.roomName,
      categorie: 'INFO',
      serverId: 'server',
      localId: uid(),
      receivedAt: new Date(),
      author: payload.pseudo,
    })
    clampMessages(state.messages)
  })

  socket.on('chat-msg', (msg: ServerChatMessage & { pseudo?: string }) => {
    state.messages.unshift({
      ...msg,
      localId: uid(),
      receivedAt: new Date(),
      author: msg.pseudo,
    })
    clampMessages(state.messages)
  })

  return socket
}

function connect() {
  const s = getSocket()
  if (!state.connected && !state.connecting) {
    state.connecting = true
    s.connect()
  }
}

function joinRoom(roomName: string, pseudo: string) {
  const s = getSocket()
  state.roomName = roomName
  s.emit('chat-join-room', { roomName, pseudo })
}

function sendMessage(content: string) {
  const text = content.trim()
  if (!text) return
  const s = getSocket()
  s.emit('chat-msg', { content: text, roomName: state.roomName })
}

function disconnect() {
  if (!socket) return
  socket.disconnect()
  socket.removeAllListeners()
  socket = null
  state.connected = false
  state.connecting = false
}

export function useChatClient() {
  // ✅ important : on initialise la persistance ICI (dans setup d’un composant)
  initPersistenceOnce()

  return {
    state: readonly(state),
    connect,
    joinRoom,
    sendMessage,
    sendGeolocation,
    disconnect,
  }
}
