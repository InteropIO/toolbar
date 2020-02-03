console.time('Glue');
const gluePromise = new Promise(async (res, rej) => {
  let glue = await Glue({
    appManager: 'full',
    layouts: 'full',
    activities: 'trackAll',
    channels: false,
    metrics: false
  });

  console.timeEnd('Glue')
  window.glue = glue;
  res(glue);
});

const glueAppsObs = new rxjs.BehaviorSubject([]);
const layoutsObs = new rxjs.BehaviorSubject([]);
const notificationsCountObs = new rxjs.BehaviorSubject(null);
const themeObs = new rxjs.BehaviorSubject(null);
const boundsObs = new rxjs.BehaviorSubject(null);

if (!window.glue42gd) {
  window.glue42gd = {};
}

const glueInfo = {
  user: window.glue42gd.user,
  version: window.glue42gd.version,
  gw: window.glue42gd.gwURL,
};

gluePromise.then((glue) => {
  trackApplications();
  trackLayouts();
  trackNotificationCount();
  trackThemeChanges();
  trackWindowMove();
  trackConnection();
})

function trackApplications() {
  pushAllApps();
  glue.appManager.onAppAdded(pushAllApps)
  glue.appManager.onAppRemoved(pushAllApps)
  glue.appManager.onAppChanged(pushAllApps)
  glue.appManager.onInstanceStarted(pushAllApps);
  glue.appManager.onInstanceStopped(pushAllApps);
}

function pushAllApps() {
  glueAppsObs.next(glue.appManager.applications());
}

function trackLayouts() {
  pushAllLayouts();
  glue.layouts.onAdded(pushAllLayouts);
  glue.layouts.onRemoved(pushAllLayouts);
  glue.layouts.onChanged(pushAllLayouts);
  glue.layouts.onRenamed(pushAllLayouts);
}

function pushAllLayouts() {
  layoutsObs.next(glue.layouts.list())
}

function trackNotificationCount() {
  glue.agm.subscribe('T42.Notifications.Counter')
    .then(subscription => {
      subscription.onData(({data}) => {
        notificationsCountObs.next(data.count);
      })
    })
}

function trackThemeChanges() {
  // glue.agm.
  glue.contexts.subscribe('Connect.Themes', (themeObj) => {
    console.log(themeObj);
    themeObs.next(themeObj);
  })
}

async function trackWindowMove() {
  boundsObs.next(glue.windows.my().bounds);
  glue.windows.my().onBoundsChanged(() => {
    boundsObs.next(glue.windows.my().bounds);
  });
}

async function startApp(appName) {
  await gluePromise;
  let glueApp = glue.appManager.application(appName);
  if (glueApp){
    glueApp.start();
  } else {
    throw new Error(`Cannot find app with name "${appName}"`)
  }
}

async function getApp(appName) {
  await gluePromise;
  return glue.appManager.application(appName);
}

async function focusApp(appName) {
  await gluePromise;
  let app = glue.appManager.application(appName);
  app.instances.forEach(i => i.activate());
}

async function refreshApps() {
  await gluePromise;
  pushAllApps();
}

async function removeLayout(type, name) {
  await gluePromise;
  glue.layouts.remove(type, name);
}

async function restoreLayout(type, name) {
  await gluePromise;
  if (type === 'Global') {
    glue.layouts.restore({name});
  } else {
    glue42gd.canvas.openWorkspace(name);
  }
}

async function saveLayout(name) {
  await gluePromise;
  glue.layouts.save({name});
}

async function openNotificationPanel() {
  await gluePromise;
  glue.agm.invoke('T42.Notifications.Show');
}

async function registerHotkey() {
  await gluePromise;
  glue.hotkeys.register('Ctrl+Alt+T', () => {
    glue.windows.my().focus();
  })
}

async function shutdown() {
  await gluePromise;
  glue.appManager.exit();
}

async function resizeWindowVisibleArea(visibleAreas) {
  await gluePromise;

  window.glue.agm.invoke("T42.Wnd.Execute", {
    command: "updateVisibleAreas",
    windowId: glue.windows.my().id,
    options: {
      areas: visibleAreas
    }
  })
}

async function changeTheme(themeName) {
  glue.contexts.update('Connect.Themes', {selected: themeName})
}

async function openWindow(name, url, options) {
  await gluePromise;
  const myBounds = glue.windows.my().bounds;
  options = {
    ...options,
    top: myBounds.top + 100,
    left: myBounds.left + 100
  }
  window.glue.windows.open(name, url, options);
}

async function getWindowBounds() {
  await gluePromise;
  return glue.windows.my().bounds;
}

function trackConnection() {
  glue.connection.connected(() => {
    console.log('connected');
    q('.status-connected').classList.remove('d-none');
    q('.status-disconnected').classList.add('d-none');
  });
  glue.connection.disconnected(() => {
    console.log('disconnected');
    q('.status-connected').classList.add('d-none');
    q('.status-disconnected').classList.remove('d-none');
  });
}

function getMonitorInfo() {
  return glue42gd.monitors;
}

async function glueVersion() {
  await gluePromise;
  return glue.version;
}

export {
  gluePromise,
  glueVersion,
  glueInfo,
  glueAppsObs,
  layoutsObs,
  boundsObs,
  startApp,
  focusApp,
  getApp,
  refreshApps,
  notificationsCountObs,
  themeObs,
  changeTheme,
  openNotificationPanel,
  removeLayout,
  restoreLayout,
  saveLayout,
  registerHotkey,
  shutdown,
  resizeWindowVisibleArea,
  openWindow,
  getMonitorInfo,
  getWindowBounds
};