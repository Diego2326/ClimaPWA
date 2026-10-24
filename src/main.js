import { mount } from 'svelte'
import './app.css'
import App from './App.svelte'

if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js').catch((error) => {
      console.warn('No se pudo activar el modo sin conexión:', error)
    })
  })
}

const app = mount(App, {
  target: document.getElementById('app'),
})

export default app
