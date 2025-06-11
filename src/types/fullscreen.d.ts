interface Document {
  webkitFullscreenElement: Element | null;
  mozFullScreenElement: Element | null;
  msFullscreenElement: Element | null;
  webkitExitFullscreen: () => void;
  mozCancelFullScreen: () => void;
  msExitFullscreen: () => void;
}

interface HTMLDivElement {
  webkitRequestFullscreen: () => void;
  mozRequestFullScreen: () => void;
  msRequestFullscreen: () => void;
} 