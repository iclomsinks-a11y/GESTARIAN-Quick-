/**
 * Smoothly scrolls the viewport or container so that the given element
 * is centered in the viewer occupying the top 60% of the screen.
 * The center of the 60% top viewer is at 30% of window.innerHeight.
 * This reserves the bottom 40% of the screen for the default mobile device keyboard.
 */
export function centerInTop60Viewer(el: HTMLElement | null) {
  if (!el) return;
  setTimeout(() => {
    let scrollContainer: HTMLElement | Window = window;
    let parent = el.parentElement;
    while (parent) {
      const style = window.getComputedStyle(parent);
      if (
        (style.overflowY === 'auto' || style.overflowY === 'scroll') &&
        parent.scrollHeight > parent.clientHeight
      ) {
        scrollContainer = parent;
        break;
      }
      parent = parent.parentElement;
    }

    const elRect = el.getBoundingClientRect();
    const elCenterY = elRect.top + elRect.height / 2;

    // The top 60% viewer has its vertical midpoint at 30% of window.innerHeight
    const targetCenterY = window.innerHeight * 0.30;
    const deltaY = elCenterY - targetCenterY;

    if (Math.abs(deltaY) > 3) {
      if (scrollContainer === window) {
        window.scrollBy({ top: deltaY, behavior: 'smooth' });
      } else {
        (scrollContainer as HTMLElement).scrollBy({ top: deltaY, behavior: 'smooth' });
      }
    }
  }, 40);
}
