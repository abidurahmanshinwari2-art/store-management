import { useEffect, useRef, useState } from 'react'
import { useUi } from '../context/UiContext.jsx'

export function BarcodeCamera({ onCode, onClose }) {
  const { t } = useUi()
  const videoRef = useRef(null)
  const onCodeRef = useRef(onCode)
  const [hint, setHint] = useState(t('pos.cameraWait'))
  onCodeRef.current = onCode

  useEffect(() => {
    let stream
    let stop = false
    let timer = 0
    const video = videoRef.current

    const run = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' } },
        })
        if (!video) return
        video.srcObject = stream
        await video.play()
        if (!('BarcodeDetector' in window)) {
          setHint(t('pos.cameraNoDetect'))
          return
        }
        const detector = new window.BarcodeDetector({
          formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'code_39', 'codabar', 'qr_code', 'itf'],
        })
        const tick = async () => {
          if (stop || !video) return
          try {
            const found = await detector.detect(video)
            const value = found.find((row) => row.rawValue)?.rawValue
            if (value) {
              onCodeRef.current(String(value).trim())
              return
            }
          } catch {
            // keep looking
          }
          timer = window.setTimeout(tick, 120)
        }
        setHint(t('pos.cameraHint'))
        tick()
      } catch {
        setHint(t('pos.cameraFail'))
      }
    }

    run()
    return () => {
      stop = true
      window.clearTimeout(timer)
      if (stream) stream.getTracks().forEach((track) => track.stop())
    }
  }, [t])

  return (
    <div className="camera-overlay" role="dialog" onClick={onClose}>
      <div className="camera-box" onClick={(e) => e.stopPropagation()}>
        <video ref={videoRef} playsInline muted />
        <p className="muted">{hint}</p>
        <button className="btn ghost" type="button" onClick={onClose}>{t('common.cancel')}</button>
      </div>
    </div>
  )
}
