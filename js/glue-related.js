console.time('Glue')
var gluePromise = new Promise(async (res, rej) => {
  window.addEventListener('load', async () => {
    let glue = await Glue({
      appManager: 'full',
      layouts: 'full',
      activities: 'trackAll',
      channels: false,
      metrics: false
    });

    console.timeEnd('Glue')
    if (!window.glue) {
      window.glue = glue;
    }
    res(glue);
  })
});

const glueAppsObs = new rxjs.BehaviorSubject([]);
const allWorkspacesObs = new rxjs.BehaviorSubject([]);
const layoutsObs = new rxjs.BehaviorSubject([]);
const defaultLayout = new rxjs.BehaviorSubject({});
const activeLayout = new rxjs.BehaviorSubject({});
const notificationsCountObs = new rxjs.BehaviorSubject(null);
const themeObs = new rxjs.BehaviorSubject(null);
const boundsObs = new rxjs.BehaviorSubject(null);
let notificationEnabledObs = new rxjs.BehaviorSubject(false);

if (!window.glue42gd) {
  window.glue42gd = {};
}

const glueInfo = {
  user: window.glue42gd.user,
  version: window.glue42gd.version,
  gw: window.glue42gd.gwURL,
};

gluePromise.then((glue) => {
  checkWindowSize();
  trackApplications();
  trackLayouts();
  trackWorkspaces();
  trackThemeChanges();
  trackWindowMove();
  trackConnection();
  trackNotificationCount();
})

async function checkWindowSize() {
  await gluePromise;
  let currentBounds = glue.windows.my().bounds;
  if (currentBounds.width !== 940 || currentBounds.height !== 800) {
    console.debug('Start bounds are wrong, correcting to 940x800')
    glue.windows.my().moveResize({width: 940, height: 800});
  }

}

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

async function trackLayouts() {
  pushAllLayouts();
  glue.layouts.onAdded(pushAllLayouts);
  glue.layouts.onRemoved(pushAllLayouts);
  glue.layouts.onChanged(pushAllLayouts);
  glue.layouts.onRenamed(pushAllLayouts);
  activeLayout.next((await glue.layouts.getCurrentLayout()) || {});
  glue.layouts.onRestored(layout => {
    activeLayout.next(layout || {})
  })
  getDefaultLayout();
}

function pushAllLayouts() {
  layoutsObs.next(glue.layouts.list())
}

function trackWorkspaces() {
  pushWorkspaces();
  glue42gd.canvas.subscribeLayoutEvents(pushWorkspaces);
}

async function pushWorkspaces() {
  allWorkspacesObs.next(await glue42gd.canvas.exportLayouts());
}

async function trackNotificationCount() {
  await trackNotificationsEnabled();
  notificationEnabledObs
  .pipe(rxjs.operators.filter(data => data))
  .pipe(rxjs.operators.take(1))
  .subscribe((data) => {
    glue.agm.subscribe('T42.Notifications.Counter')
    .then(subscription => {
      subscription.onData(({data}) => {
        notificationsCountObs.next(data.count);
      })
    })
  })
}

function trackThemeChanges() {
  glue.contexts.subscribe('Connect.Themes', (themeObj) => {
    themeObs.next(themeObj);
  })
}

async function trackWindowMove() {
  boundsObs.next(glue.windows.my().bounds);
  glue.windows.my().onBoundsChanged(() => {
    boundsObs.next(glue.windows.my().bounds);
  });
}

async function startApp(appName, context) {
  await gluePromise;
  let glueApp = glue.appManager.application(appName);
  if (glueApp){
    glueApp.start(context);
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

async function openWorkspace(name, context) {
  await gluePromise;
  glue42gd.canvas.openWorkspace(name, {context})
}

async function saveLayout(name) {
  await gluePromise;
  glue.layouts.save({name});
}

async function getDefaultLayout() {
  await gluePromise;
  defaultLayout.next(await glue.layouts.getDefaultGlobal());
}

async function setDefaultGlobal(name) {
  await gluePromise;
  await glue.layouts.setDefaultGlobal(name);
  getDefaultLayout();
}

async function clearDefaultLayout() {
  await gluePromise;
  await glue.layouts.clearDefaultGlobal();
  getDefaultLayout();
}

async function trackNotificationsEnabled() {
  await gluePromise;
  let notificationMethoExists = new rxjs.BehaviorSubject(false)
  notificationMethoExists.next(glue.agm.methods({name:'T42.Notifications.Show'}).length > 0);
  glue.agm.methodAdded(() => {
    notificationMethoExists.next(glue.agm.methods({name:'T42.Notifications.Show'}).length > 0);
  });

  glue.agm.methodRemoved(() => {
    notificationMethoExists.next(glue.agm.methods({name:'T42.Notifications.Show'}).length > 0);
  });

  notificationMethoExists.pipe(rxjs.operators.distinctUntilChanged())
    .subscribe((data) => notificationEnabledObs.next(data))
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

async function moveMyWindow(bounds) {
  await gluePromise;
  return glue.windows.my().moveResize(bounds);
}

async function minimize() {
  await gluePromise;
  glue.windows.my().minimize();
}

async function isMinimizeAllowed() {
  await gluePromise;
  return glue.windows.my().windowStyleAttributes.allowMinimize;
}

async function raiseNotification(options) {
  await gluePromise;
  if (glue.agm.methods().find(m => m.name === 'T42.GNS.Publish.RaiseNotification')) {
    options.source = options.source || '';
    glue.agm.invoke('T42.GNS.Publish.RaiseNotification', {notification: options});
  }
}

function trackConnection() {
  glue.connection.connected(() => {
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
  notificationEnabledObs,
  allWorkspacesObs,
  openNotificationPanel,
  removeLayout,
  restoreLayout,
  saveLayout,
  clearDefaultLayout,
  setDefaultGlobal,
  defaultLayout,
  activeLayout,
  openWorkspace,
  registerHotkey,
  shutdown,
  resizeWindowVisibleArea,
  openWindow,
  moveMyWindow,
  minimize,
  isMinimizeAllowed,
  raiseNotification,
  getMonitorInfo,
  getWindowBounds
};