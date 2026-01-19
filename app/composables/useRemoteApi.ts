export function useRemoteApi() {
  const { public: cfg } = useRuntimeConfig()
  const base = cfg.apiBase // https://api.tools.gavago.fr/socketio/api

  const getRooms = () => $fetch(`${base}/rooms`)
  const getImage = (id: string | number) => $fetch(`${base}/images/${id}`)
  const saveImage = (id: string, image_data: string) =>
    $fetch(`${base}/images/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: { id, image_data },
    })

  return { getRooms, getImage, saveImage }
}
