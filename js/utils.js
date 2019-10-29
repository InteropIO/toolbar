import {shutdown} from './glue-related.js'

function handleThemeChange() {
  q('#change-theme').addEventListener('click', () => {
    q('html').classList.toggle('dark');
    q('html').classList.toggle('light');
    closeOptionsDropdown();
  })
}

function handleShutdownClick() {
  q('#shutdown').addEventListener('click', () => {
    closeOptionsDropdown();
    shutdown();
  })
}

function openOptionsDropdown() {
  q('#menu-top').classList.add('show');
}

function closeOptionsDropdown() {
  q('#menu-top').classList.remove('show');
}

function handleTopMenuClicks() {

}


export {
  handleThemeChange,
  handleShutdownClick,
  handleTopMenuClicks
}