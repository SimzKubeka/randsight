export const THEME_KEY = 'rs-theme'

// Runs in <head> before first paint: the saved choice, else the system setting. No flash of the wrong theme.
export const themeScript = `try{var t=localStorage.getItem('${THEME_KEY}');if(t!=='light'&&t!=='dark')t=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';document.documentElement.dataset.theme=t}catch(e){}`
