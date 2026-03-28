import { useRef, useMemo, useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';
import { BridgeHost } from '../utils/bridge';
import { getGameUrl } from '../utils/config';
import type { StageCompleteData } from '../utils/bridge';

interface GameWebViewProps {
  gameId: string;
  webPath: string;
  stageId?: number;
  onReady?: () => void;
  onStageComplete?: (data: StageCompleteData) => void;
}

export function GameWebView({
  gameId,
  webPath,
  stageId,
  onReady,
  onStageComplete,
}: GameWebViewProps) {
  const webViewRef = useRef<WebView>(null);
  const bridge = useMemo(
    () => new BridgeHost(webViewRef, gameId, { onStageComplete }),
    [gameId],
  );

  useEffect(() => {
    bridge.updateCallbacks({ onStageComplete });
  }, [onStageComplete]);

  const uri = getGameUrl(webPath, stageId);

  return (
    <WebView
      key={`${gameId}-${stageId}`}
      ref={webViewRef}
      source={{ uri }}
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
