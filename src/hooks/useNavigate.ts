import { useState } from 'react';

export function useNavigate() {
  const [, setCurrentPath] = useState(window.location.pathname);

  return (path: string) => {
    window.history.pushState({}, '', path);
    setCurrentPath(path);
    window.dispatchEvent(new PopStateEvent('popstate'));
  };
}

export function useCurrentPath() {
  const [currentPath, setCurrentPath] = useState(window.location.pathname);

  window.addEventListener('popstate', () => {
    setCurrentPath(window.location.pathname);
  });

  return currentPath;
}
