<template>
  <div class="battery-badge" role="status" aria-live="polite">
    <template v-if="loading">
      🔋 Batterie : …
    </template>

    <template v-else-if="!supported">
      🔋 Batterie : indisponible
    </template>

    <template v-else>
      🔋 {{ level ?? "—" }}%
      <span class="muted">
        · {{ charging ? "en charge" : "sur batterie" }}
      </span>
    </template>
  </div>
</template>

<script setup lang="ts">
import { useBattery } from "@/composables/useBattery";

const { supported, loading, level, charging } = useBattery();
</script>

<style scoped>
.battery-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border-radius: 12px;
  border: 1px solid rgba(0,0,0,.12);
  background: rgba(255,255,255,.9);
  backdrop-filter: blur(8px);
  font-size: 14px;
}
.muted {
  opacity: 0.7;
  font-size: 12px;
}
</style>
