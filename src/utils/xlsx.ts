export const getCellType = (value: unknown): "n" | "s" | "b" | "d" => {
  if (typeof value === "number") return "n"
  if (typeof value === "string") return "s"
  if (typeof value === "boolean") return "b"
  if (value instanceof Date) return "d"
  return "s"
}
