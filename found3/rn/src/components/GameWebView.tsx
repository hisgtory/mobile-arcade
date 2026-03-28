import { useRef, useMemo, useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';
import { BridgeHost } from '../utils/bridge';
import type { StageCompleteData } from '../utils/bridge';

const DEV_HOST = 'http://172.30.1.63:5173/games/found3/v1';

interface GameWebViewProps {
  stageId: number;
  onReady?: () => void;
  onStageComplete?: (data: StageCompleteData) => void;
}

export function GameWebView({ stageId, onReady, onStageComplete }: GameWebViewProps) {
  const webViewRef = useRef<WebView>(null);
  const bridge = useMemo(() => new BridgeHost(webViewRef, { onStageComplete }), []);

  useEffect(() => {
    bridge.updateCallbacks({ onStageComplete });
  }, [onStageComplete]);

  return (
    <WebView
      key={stageId}
      ref={webViewRef}
      source={{ uri: `${DEV_HOST}/stage/${stageId}` }}
      style={styles.webview}
      onMessage={bridge.handleMessage}
      onLoadEnd={onReady}
      javaScriptEnabled
      domStorageEnabled
      allowsInlineMediaPlayback
      mediaPlaybackRequiresUserAction={false}
      originWhitelist={['*']}
    />
  );
}

const styles = StyleSheet.create({
  webview: { flex: 1 },
});
