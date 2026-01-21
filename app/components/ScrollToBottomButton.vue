<template>
  <button
    v-show="visible"
    class="scroll-bottom-btn"
    type="button"
    aria-label="Descendre tout en bas"
    @click="scrollToBottom"
  >
    ⬇️
  </button>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from "vue";

const visible = ref(false);

function updateVisibility() {
  const doc = document.documentElement;
  const maxScroll = doc.scrollHeight - doc.clientHeight;
  const current = window.scrollY || doc.scrollTop || 0;

  // Affiche le bouton si on n'est pas déjà proche du bas (seuil 200px)
  visible.value = maxScroll - current > 200;
}

function scrollToBottom() {
  const doc = document.documentElement;
  const maxScroll = doc.scrollHeight - doc.clientHeight;
  window.scrollTo({ top: maxScroll, behavior: "smooth" });
}

onMounted(() => {
  updateVisibility();
  window.addEventListener("scroll", updateVisibility, { passive: true });
  window.addEventListener("resize", updateVisibility);
});

onBeforeUnmount(() => {
  window.removeEventListener("scroll", updateVisibility);
  window.removeEventListener("resize", updateVisibility);
});
</script>

<style scoped>
.scroll-bottom-btn {
  position: fixed;
  right: 16px;
  bottom: 16px;
  z-index: 9999;

  width: 44px;
  height: 44px;
  border-radius: 999px;
  border: 1px solid rgba(0, 0, 0, 0.12);
  background: white;
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.12);
  cursor: pointer;

  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
}
.scroll-bottom-btn:hover {
  transform: translateY(-1px);
}
</style>
