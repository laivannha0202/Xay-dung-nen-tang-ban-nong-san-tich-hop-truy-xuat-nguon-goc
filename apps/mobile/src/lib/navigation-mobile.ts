import type { Href } from 'expo-router';

type RouterDieuHuong = {
  back: () => void;
  canGoBack: () => boolean;
  navigate: (href: Href) => void;
  replace: (href: Href) => void;
};

export function quayLaiHoacVe(
  router: RouterDieuHuong,
  fallback: Href,
): void {
  if (router.canGoBack()) {
    router.back();
    return;
  }

  router.replace(fallback);
}

export function moTabChinh(
  router: RouterDieuHuong,
  href:
    | '/'
    | '/kham-pha'
    | '/quet-qr'
    | '/don-hang'
    | '/tai-khoan',
): void {
  router.navigate(href);
}
