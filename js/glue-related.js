
const gluePromise = new Promise(async (res, rej) => {
  let glue = await Glue({
    appManager: 'full',
    layouts: 'full'
  });

  window.glue = glue;
  res(glue);
});

const glueAppsObs = new rxjs.BehaviorSubject([]);
const layoutsObs = new rxjs.BehaviorSubject([]);
const notificationsCountObs = new rxjs.BehaviorSubject(null);

gluePromise.then((glue) => {
  trackApplications();
  trackLayouts();
  trackNotificationCount();
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

async function startApp(appName) {
  await gluePromise;
  let glueApp = glue.appManager.application(appName);
  if (glueApp){
    glueApp.start();
  } else {
    throw new Error(`Cannot find app with name "${appName}"`)
  }
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
  glue.hotkeys.register('Ctrl+Shift+B', () => {
    glue.windows.my().focus();
  })
}

async function shutdown() {
  await gluePromise;
  glue.appManager.exit();
}

async function resizeWindowVisibleArea(width) {
  await gluePromise;
  window.glue.agm.invoke("T42.Wnd.Execute", {
    command: "updateVisibleAreas",
    windowId: glue.windows.my().id,
    options: {
      areas: [{
        top: 0,
        left: 0,
        width,
        height: window.outerHeight
      }]
    }
  })
}

export {
  gluePromise,
  glueAppsObs,
  layoutsObs,
  startApp,
  notificationsCountObs,
  openNotificationPanel,
  removeLayout,
  restoreLayout,
  saveLayout,
  registerHotkey,
  shutdown,
  resizeWindowVisibleArea
};