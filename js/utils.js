import {shutdown, gluePromise, startApp, focusApp, themeObs, changeTheme} from './glue-related.js'

function handleThemeChange() {
  q('#change-theme').addEventListener('click', () => {
    let currentTheme = Array.prototype.slice.apply(q('html').classList)
      .find(className =>  ['dark', 'light'].indexOf(className) >= 0);
    let allThemes = themeObs.value.all.map(t => t.name);
    let currentThemeIndex = allThemes.indexOf(currentTheme);
    let newThemeIndex = currentThemeIndex >= allThemes.length - 1 ? 0 : currentThemeIndex + 1;
    changeTheme(allThemes[newThemeIndex])
  })

  themeObs.subscribe(themeObj => {
    if (themeObj) {
      themeObj.all.forEach(theme => {
        q('html').classList.remove(theme.name)
      });

      q('html').classList.add(themeObj.selected);
    }
  })
}

function handleShutdownClick() {
  q('#shutdown').addEventListener('click', () => {
    shutdown();
  })
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