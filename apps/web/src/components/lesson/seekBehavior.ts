export function shouldAutoplaySeek(audioPaused: boolean, autoplayRequested: boolean) {
  return audioPaused && autoplayRequested
}
