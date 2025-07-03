// Drop handler function to get all files
export async function getAllFileEntries(
  dataTransferItemList: DataTransferItemList,
) {
  const fileEntries: FileSystemEntry[] = []
  // Use BFS to traverse entire directory/file structure
  const queue: FileSystemEntry[] = []
  // Unfortunately dataTransferItemList is not iterable i.e. no forEach
  for (let i = 0; i < dataTransferItemList.length; i++) {
    // Note webkitGetAsEntry a non-standard feature and may change
    // Usage is necessary for handling directories
    const entry = dataTransferItemList[i].webkitGetAsEntry()
    if (entry) {
      queue.push(entry)
    }
  }
  while (queue.length > 0) {
    const entry = queue.shift()
    if (entry?.isFile) {
      fileEntries.push(entry)
    } else if (entry?.isDirectory) {
      const reader = (entry as FileSystemDirectoryEntry).createReader()
      queue.push(...(await readAllDirectoryEntries(reader)))
    }
  }
  return fileEntries
}

// Get all the entries (files or sub-directories) in a directory by calling readEntries until it returns empty array
async function readAllDirectoryEntries(
  directoryReader: FileSystemDirectoryReader,
) {
  const entries: FileSystemEntry[] = []
  let readEntries = await readEntriesPromise(directoryReader)
  while (readEntries.length > 0) {
    entries.push(...readEntries)
    readEntries = await readEntriesPromise(directoryReader)
  }
  return entries
}

// Wrap readEntries in a promise to make working with readEntries easier
async function readEntriesPromise(directoryReader: FileSystemDirectoryReader) {
  try {
    return await new Promise<FileSystemEntry[]>((resolve, reject) => {
      directoryReader.readEntries(resolve, reject)
    })
  } catch (err) {
    console.error(err)
    return []
  }
}
