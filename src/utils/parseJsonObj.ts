export const parseJsonObj = (
  jsonString: string | null,
): { [key: string]: unknown } => {
  if (!jsonString) return {}
  try {
    const ret = JSON.parse(jsonString)
    if (typeof ret === "object") return ret
    return {}
  } catch (error) {
    console.error(error)
    return {}
  }
}
