// app/composables/useChatClient.ts
import { reactive, readonly } from 'vue'
import type { Socket } from 'socket.io-client'

export type MessageCategory = 'MESSAGE' | 'INFO' | 'NEW_IMAGE'

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

const state = reactive<ChatState>({
  connected: false,
  connecting: false,
  error: null,
  roomName: 'general',
  messages: [],
  clients: {},
})

let socket: Socket | null = null

function getSocket() {
  if (socket) return socket
  const { $socket } = useNuxtApp()
  socket = $socket

  socket.on('connect', () => {
    state.connected = true
    state.connecting = false
    state.error = null
    // rejoindre la room courante avec pseudo si dispo
    // const u = useState<{ pseudo: string }>('user').value
    // socket!.emit('chat-join-room', { roomName: state.roomName, pseudo: u?.pseudo || 'Anonyme' })
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
  })

  socket.on('chat-msg', (msg: ServerChatMessage & { pseudo?: string }) => {
    state.messages.unshift({
      ...msg,
      localId: uid(),
      receivedAt: new Date(),
      author: msg.pseudo,
    })
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
  s.emit('chat-join-room', { roomName, pseudo })   // ← ICI (pas dans l’URL)
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
  return {
    state: readonly(state),
    connect,
    joinRoom,
    sendMessage,
    disconnect,
  }
}
