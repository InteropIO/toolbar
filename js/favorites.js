import { getSetting, setSetting } from "./settings.js";

const favoriteApps = new rxjs.BehaviorSubject([]);
const favoriteLayouts = new rxjs.BehaviorSubject([]);

function init() {
  const savedFavApps = getSetting('favoriteApps');
  const savedFavLayouts = getSetting('favoriteLayouts');

  favoriteApps.next(savedFavApps);
  favoriteLayouts.next(savedFavLayouts);
}

function updateFavoriteLayouts() {
  let currentFavoriteLayouts = favoriteLayouts.value;

  document.querySelectorAll('[layout-name]').forEach((layoutElement) => {
    let layoutName = layoutElement.getAttribute('layout-name');

    if (currentFavoriteLayouts.includes(layoutName)) {
      layoutElement.classList.add('fav-layout');
    } else {
      layoutElement.classList.remove('fav-layout');
    }
  });
}

function updateFavoriteApps() {
  let currentFavoriteApps = favoriteApps.value;

  document.querySelectorAll('[app-name]').forEach((appElement) => {
    let appName = appElement.getAttribute('app-name');

    if (currentFavoriteApps.includes(appName)) {
      appElement.classList.add('fav-app');
    } else {
      appElement.classList.remove('fav-app');
    }
  });
}

function addFavoriteApp(appName) {
  console.log(`adding ${appName} to favorites`);

  let newApps = favoriteApps.value.slice();

  newApps.push(appName);
  favoriteApps.next(newApps);
  setSetting({ favoriteApps: newApps });
  updateFavoriteApps();
}

function addFavoriteLayout(layoutName) {
  console.log(`adding layout named: "${layoutName}" to favorites`);

  let newLayouts = favoriteLayouts.value.slice();

  newLayouts.push(layoutName);
  favoriteLayouts.next(newLayouts);
  setSetting({ favoriteLayouts: newLayouts });
  updateFavoriteLayouts();
}

function removeFavoriteLayout(layoutNameToDelete) {
  console.log('removing favorite layout');

  let currentLayouts = favoriteLayouts.value.slice();

  currentLayouts = currentLayouts.filter(
    (layoutName) => layoutName !== layoutNameToDelete
  );
  favoriteLayouts.next(currentLayouts);
  setSetting({ favoriteLayouts: currentLayouts });
  updateFavoriteLayouts();
}

function removeFavoriteApp(appName) {
  console.log('removing favorite app');

  let currentApps = favoriteApps.value.slice();

  currentApps = currentApps.filter(
    (checkedAppName) => checkedAppName !== appName
  );
  favoriteApps.next(currentApps);
  setSetting({ favoriteApps: currentApps });
  updateFavoriteApps();
}

export {
  init,
  favoriteApps,
  favoriteLayouts,
  addFavoriteApp,
  addFavoriteLayout,
  removeFavoriteApp,
  removeFavoriteLayout,
  updateFavoriteApps
};
