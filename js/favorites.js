const favoriteApps = new rxjs.BehaviorSubject([]);

init();

function init() {
  let storageData = localStorage.getItem('favorite-apps');

  if (storageData === null) {
    localStorage.setItem('favorite-apps', '[]');
  }

  let savedFavApps = JSON.parse(localStorage.getItem('favorite-apps'));

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
  // favoriteApps.subscribe(([favApps, allApps]) => {
  //   document.querySelectorAll('#search-results>li').forEach((appElement) => {
  //     // console.log(appElement);
  //     // let appName = appElement.getAttribute('app-name');
  //   });
  // });
}

function addFavoriteApp(appName) {
  console.log('adding app to favorite ', appName);

  let newApps = favoriteApps.value.slice();

  newApps.push(appName);
  favoriteApps.next(newApps);
  localStorage.setItem('favorite-apps', JSON.stringify(newApps));
  updateFavoriteApps();
}

function removeFavoriteApp(appName) {
  console.log('removing favorite app');

  let currentApps = favoriteApps.value.slice();
  currentApps = currentApps.filter(
    (checkedAppName) => checkedAppName !== appName
  );
  favoriteApps.next(currentApps);
  localStorage.setItem('favorite-apps', JSON.stringify(currentApps));
  updateFavoriteApps();
}

export { favoriteApps, addFavoriteApp, removeFavoriteApp, updateFavoriteApps };
