import {shutdown} from './glue-related.js'

function handleThemeChange() {
  q('#change-theme').addEventListener('click', () => {
    q('html').classList.toggle('dark');
    q('html').classList.toggle('light');
  })
}

function handleShutdownClick() {
  q('#shutdown').addEventListener('click', () => {
    shutdown();
  })
}


export {
  handleThemeChange,
  handleShutdownClick
}