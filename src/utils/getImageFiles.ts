import { unzip } from "unzipit"
import { FileList } from "../types/FileList"
import { getAllFileEntries } from "./getAllFileEntries"

const looksLikeImage = (fileName: string) => {
  if (fileName.startsWith("__MACOSX")) return false
  const lowerCaseFileName = fileName.toLowerCase()
  return (
    lowerCaseFileName.endsWith(".jpg") ||
    lowerCaseFileName.endsWith(".jpeg") ||
    lowerCaseFileName.endsWith(".png") ||
    lowerCaseFileName.endsWith(".gif") ||
    lowerCaseFileName.endsWith(".webp") ||
    lowerCaseFileName.endsWith(".bmp") ||
    lowerCaseFileName.endsWith(".ico") ||
    lowerCaseFileName.endsWith(".svg")
  )
}

const looksLikeZip = (fileName: string) => {
  if (fileName.startsWith("__MACOSX")) return false
  const lowerCaseFileName = fileName.toLowerCase()
  return lowerCaseFileName.endsWith(".zip")
}

const unzipFile = async (file: File, displayName: string) => {
  const zipFileName = file.name
  if (zipFileName.endsWith(".zip")) {
    const { entries } = await unzip(file)
    const names = Object.keys(entries).filter(
      (entry) => looksLikeZip(entry) || looksLikeImage(entry),
    )
    const blobs = await Promise.all(
      names.map((name) =>
        looksLikeImage(name)
          ? entries[name].blob("image/*")
          : entries[name].blob("application/zip"),
      ),
    )
    const files = blobs.map(
      (blob, index) =>
        new File([blob], names[index], {
          type: blob.type,
        }),
    )
    const unzippedFiles: FileList = []
    for await (const file of files) {
      if (file.name.endsWith(".zip")) {
        const newFiles = await unzipFile(file, `${displayName}/${file.name}`)
        unzippedFiles.push(...newFiles)
      } else {
        unzippedFiles.push({ file, displayName: `${displayName}/${file.name}` })
      }
    }
    return unzippedFiles
  }
  return []
}

export const getImageFiles = async (files: File[], displayNames?: string[]) => {
  if (!displayNames || displayNames.length !== files.length) {
    displayNames = files.map((file) => file.name)
  }
  const fileList = files.map((file, index) => ({
    displayName: displayNames![index],
    file,
  }))
  const filteredFileList = fileList.filter(
    (item) =>
      item.file.type.startsWith("image/") || item.file.name.endsWith(".zip"),
  )
  const unzippedFileList: FileList = []
  for await (const fileListItem of filteredFileList) {
    if (fileListItem.file.name.endsWith(".zip")) {
      const newFileList = await unzipFile(
        fileListItem.file,
        fileListItem.displayName,
      )
      unzippedFileList.push(...newFileList)
    } else {
      unzippedFileList.push(fileListItem)
    }
  }
  return unzippedFileList.sort((a, b) =>
    a.displayName.localeCompare(b.displayName),
  )
}

export const getImageFilesFromDataTransfer = async (
  items: DataTransferItemList,
) => {
  const entries = await getAllFileEntries(items)
  const fileEntries = entries.filter((entry) => entry.isFile)
  const fileList: FileList = await Promise.all(
    (fileEntries as FileSystemFileEntry[]).map(async (entry) => {
      const displayName = entry.fullPath.startsWith("/")
        ? entry.fullPath.slice(1)
        : entry.fullPath
      const file = await new Promise<File>((resolve, reject) => {
        entry.file(resolve, reject)
      })
      return { file, displayName }
    }),
  )
  const files = fileList.map((item) => item.file)
  const displayNames = fileList.map((item) => item.displayName)
  return getImageFiles(files, displayNames)
}
