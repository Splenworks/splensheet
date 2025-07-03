export const getDarkmode = () => {
  return document.documentElement.classList.contains("dark")
}

export const toggleDarkmode = () => {
  document.documentElement.classList.toggle("dark")
  localStorage.setItem(
    "theme",
    document.documentElement.classList.contains("dark") ? "dark" : "light",
  )
}
