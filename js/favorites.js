const favoriteApps = new rxjs.BehaviorSubject([]);

init();
function init() {
  let storageData = localStorage.getItem('favorite-apps');

  if(storageData === null) {
    localStorage.setItem('favorite-apps', '[]')
  }

  let savedFavApps = JSON.parse(localStorage.getItem('favorite-apps'));
  favoriteApps.next(savedFavApps);
}

function updateFavoriteApps() {
  let currentFavoriteApps = favoriteApps.value;
  document.querySelectorAll('#applications>li').forEach(appElement => {
    let appName = appElement.getAttribute('app-name');
    if (currentFavoriteApps.includes(appName)) {
      // console.log(appElement,appName);
      appElement.classList.add('fav-app');
    } else {
      appElement.classList.remove('fav-app');
      // console.warn(appElement, appName);
    }
  })
  // favoriteApps
  // .subscribe(([favApps, allApps]) => {
  //   document.querySelectorAll('#applications>li').forEach(appElement => {
  //     // console.log(appElement);
  //     // let appName = appElement.getAttribute('app-name');
  //   })
  // })
}

function addFavoriteApp(appName) {
  console.log('adding app to favorite ', appName);

  let newApps = favoriteApps.value.slice();
  newApps.push(appName);
  favoriteApps.next(newApps);
  localStorage.setItem('favorite-apps', JSON.stringify(newApps));
  // q(`#applications [app-name="${appName}"]`)
}

function removeFavoriteApp(appName) {
  console.log('removing favorite app');

  let currentApps = favoriteApps.value.slice();
  currentApps = currentApps.filter(checkedAppName => checkedAppName !== appName);
  favoriteApps.next(currentApps);
  localStorage.setItem('favorite-apps', JSON.stringify(currentApps));
  // q(`#applications [app-name="${appName}"]`)
}

export {
  favoriteApps,
  addFavoriteApp,
  removeFavoriteApp,
  updateFavoriteApps
}