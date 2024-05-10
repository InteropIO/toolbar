import { getSetting, setSetting } from "./settings.js";

const favoriteApps = new rxjs.BehaviorSubject([]);

function init() {
  const savedFavApps = getSetting('favoriteApps');
  favoriteApps.next(savedFavApps);
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

export { init, favoriteApps, addFavoriteApp, removeFavoriteApp, updateFavoriteApps };
