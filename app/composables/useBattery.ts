import { ref, onMounted, onBeforeUnmount } from "vue";

type BatteryManager = {
  level: number; // 0..1
  charging: boolean;
  chargingTime: number; // seconds
  dischargingTime: number; // seconds
  addEventListener: (evt: string, cb: () => void) => void;
  removeEventListener: (evt: string, cb: () => void) => void;
};

type NavigatorWithBattery = Navigator & {
  getBattery?: () => Promise<BatteryManager>;
};

export function useBattery() {
  const supported = ref(false);
  const loading = ref(true);

  const level = ref<number | null>(null); // 0..100
  const charging = ref<boolean | null>(null);
  const chargingTime = ref<number | null>(null);
  const dischargingTime = ref<number | null>(null);

  const battery = ref<BatteryManager | null>(null);

  const update = () => {
    const b = battery.value;
    if (!b) return;

    level.value = Math.round(b.level * 100);
    charging.value = b.charging;
    chargingTime.value = Number.isFinite(b.chargingTime) ? b.chargingTime : null;
    dischargingTime.value = Number.isFinite(b.dischargingTime) ? b.dischargingTime : null;
  };

  const onChange = () => update();

  onMounted(async () => {
    loading.value = true;

    const nav = navigator as NavigatorWithBattery;
    supported.value = typeof nav.getBattery === "function";

    if (!supported.value) {
      loading.value = false;
      return;
    }

    try {
      battery.value = await nav.getBattery!();
      update();

      battery.value.addEventListener("levelchange", onChange);
      battery.value.addEventListener("chargingchange", onChange);
      battery.value.addEventListener("chargingtimechange", onChange);
      battery.value.addEventListener("dischargingtimechange", onChange);
    } finally {
      loading.value = false;
    }
  });

  onBeforeUnmount(() => {
    const b = battery.value;
    if (!b) return;

    b.removeEventListener("levelchange", onChange);
    b.removeEventListener("chargingchange", onChange);
    b.removeEventListener("chargingtimechange", onChange);
    b.removeEventListener("dischargingtimechange", onChange);
  });

  return { supported, loading, level, charging, chargingTime, dischargingTime };
}
