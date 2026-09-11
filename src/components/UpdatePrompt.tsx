import { Download, WifiOff, X } from 'lucide-react'
import { useRegisterSW } from 'virtual:pwa-register/react'

export function UpdatePrompt() {
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW()

  if (!offlineReady && !needRefresh) return null

  return (
    <div className="update-toast" role="status">
      {needRefresh ? <Download size={19} /> : <WifiOff size={19} />}
      <span>
        <strong>{needRefresh ? '新版本已准备好' : '现在可以离线使用'}</strong>
        <small>{needRefresh ? '更新只替换程序，不会删除本机记录。' : '首次加载完成后，断网也能继续记录。'}</small>
      </span>
      {needRefresh && (
        <button className="update-button" type="button" onClick={() => void updateServiceWorker(true)}>更新</button>
      )}
      <button
        className="dismiss-update"
        type="button"
        onClick={() => {
          setOfflineReady(false)
          setNeedRefresh(false)
        }}
        aria-label="关闭提示"
      >
        <X size={17} />
      </button>
    </div>
  )
}
