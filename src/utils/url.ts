const IMAGE_EXT_RE = /\.(png|jpe?g|gif|webp|svg)$/i

export const isImageUrl = (val: string): boolean => {
  try {
    const u = new URL(val)
    return IMAGE_EXT_RE.test(u.pathname)
  } catch {
    return false
  }
}

export const isHttpUrl = (val: string): boolean => {
  try {
    const u = new URL(val)
    return u.protocol === "http:" || u.protocol === "https:"
  } catch {
    return false
  }
}
