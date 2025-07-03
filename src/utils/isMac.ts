export const isMac = (() => {
  // https://developer.mozilla.org/en-US/docs/Web/API/NavigatorID/userAgent#value
  const platformRegex = /\(.*\)/
  const [platformInfo] = platformRegex.exec(window.navigator.userAgent) || []
  const macRegex = /mac/i
  if (platformInfo === undefined) return false
  return macRegex.test(platformInfo)
})()
