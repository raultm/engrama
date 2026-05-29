const KEY = 'engrama_device_token'

export function getOrCreateDeviceToken() {
  let token = localStorage.getItem(KEY)
  if (!token) {
    const platform = /Mobi|Android/i.test(navigator.userAgent) ? 'mob' : 'web'
    token = `${platform}-${crypto.randomUUID()}`
    localStorage.setItem(KEY, token)
  }
  return token
}
