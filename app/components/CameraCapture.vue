<template>
  <div v-if="open" class="modal" @click.self="onClose()">
    <div class="modalCard">
      <div class="videoWrap">
        <video ref="videoEl" autoplay playsinline muted class="video"></video>
        <canvas ref="canvasEl" class="canvas" :class="{ visible: hasSnapshot }" aria-hidden="true"></canvas>
      </div>

      <div class="controls">
        <button type="button" class="btn" @click="switchFacing()">🔄 Caméra</button>

        <button v-if="!hasSnapshot" type="button" class="btn primary" @click="takeSnapshot()">
          📸 Capturer
        </button>
        <template v-else>
          <button type="button" class="btn" @click="retake()">↩️ Reprendre</button>
          <button type="button" class="btn primary" @click="confirm()">✅ Utiliser</button>
        </template>

        <button type="button" class="btn danger" @click="onClose()">✖ Fermer</button>
      </div>

      <p class="hint">
        Autorise l’accès à la caméra (HTTPS requis hors localhost). Sur desktop, la caméra frontale peut ne pas être disponible.
      </p>

      <!-- Fallback (optionnel) -->
      <div v-if="showFallback" class="fallback">
        <input type="file" accept="image/*" capture="user" @change="onFileChange" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * CameraCapture.vue
 * Props:
 *  - open (boolean, v-model) : ouvre/ferme la modale
 *  - facingDefault ('user' | 'environment') : caméra par défaut
 *  - mimeType (string) : 'image/jpeg' ou 'image/png'
 *  - quality (number) : 0..1, qualité JPEG/PNG
 *  - showFallback (boolean) : affiche un input file en secours
 *
 * Emits:
 *  - update:open (boolean)
 *  - confirm (dataUrl: string)
 *  - cancel ()
 *  - error (err: unknown)
 */

const props = withDefaults(defineProps<{
  open: boolean
  facingDefault?: 'user' | 'environment'
  mimeType?: string
  quality?: number
  showFallback?: boolean
}>(), {
  facingDefault: 'user',
  mimeType: 'image/jpeg',
  quality: 0.92,
  showFallback: true
})

const emit = defineEmits<{
  (e: 'update:open', v: boolean): void
  (e: 'confirm', dataUrl: string): void
  (e: 'cancel'): void
  (e: 'error', err: unknown): void
}>()

const videoEl = ref<HTMLVideoElement>()
const canvasEl = ref<HTMLCanvasElement>()
const hasSnapshot = ref(false)
const facingMode = ref<'user' | 'environment'>(props.facingDefault)
let stream: MediaStream | null = null

// ouvrir/fermer => démarrer/arrêter le flux
watch(() => props.open, async (isOpen) => {
  if (isOpen) await start()
  else stop()
}, { immediate: true })

async function start() {
  if (!navigator.mediaDevices?.getUserMedia) {
    emit('error', new Error('getUserMedia non supporté')) ; return
  }
  try {
    stop()
    stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: facingMode.value }, audio: false })
    if (videoEl.value) {
      videoEl.value.srcObject = stream
      await videoEl.value.play()
    }
    hasSnapshot.value = false
  } catch (e) {
    emit('error', e)
  }
}

function stop() {
  hasSnapshot.value = false
  if (stream) {
    stream.getTracks().forEach(t => t.stop())
    stream = null
  }
}

async function switchFacing() {
  facingMode.value = facingMode.value === 'user' ? 'environment' : 'user'
  await start()
}

function takeSnapshot() {
  if (!videoEl.value || !canvasEl.value) return
  const video = videoEl.value
  const canvas = canvasEl.value
  const w = video.videoWidth || 640
  const h = video.videoHeight || 480
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  ctx.drawImage(video, 0, 0, w, h)
  hasSnapshot.value = true
}

function retake() {
  hasSnapshot.value = false
}

function confirm() {
  if (!canvasEl.value) return
  const dataUrl = canvasEl.value.toDataURL(props.mimeType, props.quality)
  emit('confirm', dataUrl)
  onClose(false) // ne pas émettre cancel dans ce cas
}

function onClose(emitCancel = true) {
  stop()
  emit('update:open', false)
  if (emitCancel) emit('cancel')
}

// Fallback file input
function onFileChange(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = () => {
    emit('confirm', String(reader.result || ''))
    onClose(false)
  }
  reader.onerror = (err) => emit('error', err)
  reader.readAsDataURL(file)
}

onBeforeUnmount(stop)
</script>

<style scoped>
.modal {
  position: fixed; inset: 0;
  background: rgba(0,0,0,0.45);
  display: grid; place-items: center;
  padding: 16px; z-index: 1000;
}
.modalCard {
  width: 100%;
  max-width: 520px;
  background: #0b0f17;
  color: #e5e7eb;
  border-radius: 12px;
  padding: 16px;
  border: 1px solid rgba(255,255,255,0.08);
}
.videoWrap {
  position: relative;
  width: 100%;
  background: #000;
  border-radius: 10px;
  overflow: hidden;
}
.video, .canvas {
  display: block; width: 100%; height: auto;
}
.canvas {
  position: absolute; inset: 0;
  width: 100%; height: 100%;
  object-fit: contain;
  opacity: 0; transition: opacity .15s ease;
}
.canvas.visible { opacity: 1; }

.controls {
  margin-top: 12px;
  display: flex; gap: 8px; flex-wrap: wrap; justify-content: center;
}
.hint {
  margin-top: 8px; font-size: 12px; opacity: .8; text-align: center;
}
.fallback { margin-top: 12px; text-align: center; }

.btn {
  display: inline-flex; align-items: center; justify-content: center;
  gap: 8px; padding: 10px 14px; border-radius: 10px;
  font-weight: 600; border: 1px solid transparent;
  cursor: pointer; text-decoration: none;
  background: #1f2937; color: #fff; border-color: #1f2937;
}
.btn.primary { background: #111827; border-color: #111827; }
.btn.danger { background: #b91c1c; border-color: #b91c1c; }
</style>
