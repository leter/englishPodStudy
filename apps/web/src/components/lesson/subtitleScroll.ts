type ScrollContainer = {
  scrollTop: number
  clientHeight: number
  getBoundingClientRect: () => { top: number }
}

type ScrollTarget = {
  clientHeight: number
  getBoundingClientRect: () => { top: number }
}

export function getCenteredScrollTop(
  container: ScrollContainer,
  target: ScrollTarget,
) {
  const containerTop = container.getBoundingClientRect().top
  const targetTop = target.getBoundingClientRect().top

  return (
    container.scrollTop +
    targetTop -
    containerTop -
    container.clientHeight / 2 +
    target.clientHeight / 2
  )
}
