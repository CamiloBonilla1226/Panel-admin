import { useEffect, useState } from 'react'

// Instalar el panel en el inicio del celular o como app en el PC.
// - Android / Chrome / Edge: el navegador dispara "beforeinstallprompt"; se guarda
//   y se lanza cuando el usuario toca "Instalar".
// - iPhone / iPad (Safari): no existe ese evento; solo se puede con
//   Compartir → "Agregar a inicio", así que se muestran los pasos.
// - Si ya se abrió como app instalada, no se ofrece nada.
function yaInstalada() {
  return window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone === true
}

function esIOS() {
  const ua = window.navigator.userAgent
  return /iphone|ipad|ipod/i.test(ua) || (ua.includes('Macintosh') && navigator.maxTouchPoints > 1)
}

export function useInstalar() {
  const [evento, setEvento] = useState(null)
  const [instalada, setInstalada] = useState(yaInstalada)

  useEffect(() => {
    const alOfrecer = (e) => { e.preventDefault(); setEvento(e) }
    const alInstalar = () => { setInstalada(true); setEvento(null) }
    window.addEventListener('beforeinstallprompt', alOfrecer)
    window.addEventListener('appinstalled', alInstalar)
    return () => {
      window.removeEventListener('beforeinstallprompt', alOfrecer)
      window.removeEventListener('appinstalled', alInstalar)
    }
  }, [])

  // El evento solo se puede usar una vez. Como el botón existe en la barra lateral
  // y en la del celular, si ya se usó desde el otro, prompt() falla: se ignora.
  async function instalar() {
    if (!evento) return false
    try {
      evento.prompt()
      const { outcome } = await evento.userChoice
      return outcome === 'accepted'
    } catch {
      return false
    } finally {
      setEvento(null)
    }
  }

  const ios = !instalada && esIOS()
  return {
    disponible: !instalada && (!!evento || ios),
    ios,
    instalar,
  }
}
