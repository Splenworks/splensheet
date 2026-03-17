export const getBaseName = (fileName: string) => {
  const dot = fileName.lastIndexOf(".")
  return dot > 0 ? fileName.slice(0, dot) : fileName
}
