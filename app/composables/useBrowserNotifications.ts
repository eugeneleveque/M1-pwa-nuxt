import { onMounted } from "vue";

type NotifyPayload = {
  title: string;
  body?: string;
  tag?: string;
  icon?: string;
};

export function useBrowserNotifications() {
  const enabled = useState<boolean>("notifEnabled", () => false);
  const permission = useState<NotificationPermission>("notifPermission", () => "default");

  onMounted(() => {
    if (process.client && "Notification" in window) {
      permission.value = Notification.permission;
      enabled.value = localStorage.getItem("notifEnabled") === "1" && permission.value === "granted";
    }
  });

  async function requestPermission() {
    if (!process.client || !("Notification" in window)) return false;
    const res = await Notification.requestPermission();
    permission.value = res;

    const ok = res === "granted";
    enabled.value = ok;
    localStorage.setItem("notifEnabled", ok ? "1" : "0");
    return ok;
  }

  async function notify({ title, body, tag, icon }: NotifyPayload) {
    if (!process.client) return;
    if (!("Notification" in window)) return;
    if (!enabled.value || Notification.permission !== "granted") return;

    const opts: NotificationOptions = {
      body,
      tag,
      icon: icon || "/icons/pwa-192x192.png",
    };

    // ✅ Sur Chrome/Edge/Android, showNotification via Service Worker donne un vrai “toast OS”
    if ("serviceWorker" in navigator) {
      try {
        const reg = await navigator.serviceWorker.ready;
        await reg.showNotification(title, opts);
        return;
      } catch {
        // fallback
      }
    }

    // Fallback (fonctionne aussi sur desktop Chrome)
    new Notification(title, opts);
  }

  return { enabled, permission, requestPermission, notify };
}
