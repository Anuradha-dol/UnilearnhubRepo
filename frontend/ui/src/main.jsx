import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

const extensionNoiseMarkers = ['ma_payload.js', 'ma_injtd.js', 'chrome-extension://']

const includesExtensionNoise = (value) => {
    const text = String(value || '')
    return extensionNoiseMarkers.some((marker) => text.includes(marker))
}

const shouldSuppressExtensionNoise = ({ message = '', stack = '', source = '' }) => {
    return (
        includesExtensionNoise(message) ||
        includesExtensionNoise(stack) ||
        includesExtensionNoise(source)
    )
}

window.addEventListener('error', (event) => {
    const message = event?.message || ''
    const stack = event?.error?.stack || ''
    const source = event?.filename || event?.target?.src || ''

    if (shouldSuppressExtensionNoise({ message, stack, source })) {
        event.preventDefault()
        event.stopImmediatePropagation()
    }
}, true)

window.addEventListener('unhandledrejection', (event) => {
    const reason = event?.reason
    const message = typeof reason?.message === 'string' ? reason.message : String(reason || '')
    const stack = typeof reason?.stack === 'string' ? reason.stack : ''
    const source = typeof reason?.fileName === 'string' ? reason.fileName : ''

    if (shouldSuppressExtensionNoise({ message, stack, source })) {
        event.preventDefault()
        event.stopImmediatePropagation()
    }
}, true)

createRoot(document.getElementById('root')).render(
    <App />,
)
