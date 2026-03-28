import { useEffect, useRef } from 'react';
import { BridgeClient } from '@arcade/lib-found3';

let instance: BridgeClient | null = null;

function getBridge(): BridgeClient {
  if (!instance) {
    instance = new BridgeClient({ debug: true });
  }
  return instance;
}

/**
 * Hook to manage the BridgeClient singleton lifecycle.
 * Creates once, destroys on unmount.
 */
export function useBridge(): BridgeClient {
  const bridgeRef = useRef(getBridge());

  useEffect(() => {
    return () => {
      bridgeRef.current.destroy();
      instance = null;
    };
  }, []);

  return bridgeRef.current;
}
