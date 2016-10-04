export function waitsFor (m, f, t, i) {
  if (typeof m === 'function') {
    i = t
    t = f
    f = m
    m = 'something to happen'
  }

  const intervalTime = i || 10
  const timeoutDuration = t || 2000

  return new Promise((resolve, reject) => {
    const interval = setInterval(() => {
      if (f()) {
        clearTimeout(timeout)
        clearInterval(interval)
        resolve()
      }
    }, intervalTime)

    const timeout = setTimeout(() => {
      clearInterval(interval)
      reject(new Error(`Waited ${timeoutDuration}ms for ${m} but nothing happened`))
    }, timeoutDuration)
  })
}
