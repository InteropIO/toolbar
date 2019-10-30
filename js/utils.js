import {shutdown, gluePromise, startApp, focusApp} from './glue-related.js'

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
  document.addEventListener('click', (e) => {
    if (e.target.matches('[menu-button-id], [menu-button-id] *')) {
      //open selected drawer (apps, layouts)
      let topElement = e.path.find(e => e.getAttribute('menu-button-id'))
      let menuId = topElement.getAttribute('menu-button-id')
      qa(`:not([menu-id="${menuId}"])`).forEach(menu => {
        menu.classList.add('hide');
      });

      q(`[menu-id="${menuId}"]`).classList.toggle('hide');
    } else if (e.target.matches('#fav-apps .nav-item, #fav-apps .nav-item *')) {
      //start or focus an app from the favorites list
      let topElement = e.path.find(e => e.classList && e.classList.contains('nav-item'));
      let appName = topElement.getAttribute('app-name');
      let isActive =  topElement.classList.contains('app-active');

      if (isActive) {
        focusApp(appName)
      } else {
        startApp(appName);
      }
    }
  })
}

function handleDropDownClicks() {
  document.addEventListener('click', (e) => {
    if (e.target.matches('[dropdown-button-id], [dropdown-button-id] *')) {
      //dropdown button click  - toggle dropdown
      let btnElement = e.path.find(e => e.getAttribute('dropdown-button-id'));
      let menuId = btnElement.getAttribute('dropdown-button-id');
      let menu = q(`[dropdown-id="${menuId}"]`);
      menu.classList.toggle('show');
    } else {
      //click is not on dropdown button - close opened dropdowns
      qa(`[dropdown-id].show`).forEach(e => e.classList.remove('show'));
    }
  })
}

async function handleMouseHover() {
  // await gluePromise;
  q('.app').addEventListener('mouseenter', (e) => {
    q('.view-port').classList.add('expand');
  })

  q('.app').addEventListener('mouseleave', (e) => {
    // let {offsetWidth: viewPortWidth, offsetHeight: viewPortHeight} = q('.view-port')
    // if (e.x < viewPortWidth && e.x > 0 && e.y < viewPortHeight && e.y > 0) {
    //   return;
    // }

    if (!qa('.toggle-content:not(.hide)').length > 0) {
      q('.view-port').classList.remove('expand');
      qa('.toggle-content').forEach(e => e.classList.add('hide'));
      qa('[dropdown-id].show').forEach(e => e.classList.remove('show'));
    }
  })
}


export {
  handleThemeChange,
  handleShutdownClick,
  handleTopMenuClicks,
  handleDropDownClicks,
  handleMouseHover
}