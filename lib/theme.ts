export const THEME_KEY = 'rs-theme'

// Runs in <head> before first paint, so there is no flash of the wrong theme.
// A saved choice pins the theme (data-theme-pinned); otherwise the page follows the system setting, live.
// Only the storage read can throw (blocked storage), so the theme is always set.
export const themeScript = `(function(){var d=document.documentElement,m=matchMedia('(prefers-color-scheme: dark)'),s=null;try{s=localStorage.getItem('${THEME_KEY}')}catch(e){}var sys=function(){return m.matches?'dark':'light'};if(s==='light'||s==='dark'){d.dataset.theme=s;d.dataset.themePinned=''}else d.dataset.theme=sys();m.addEventListener('change',function(){if(!('themePinned' in d.dataset))d.dataset.theme=sys()})})()`
