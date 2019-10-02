
const gluePromise = new Promise(async (res, rej) => {
  let glue = await Glue({
    appManager: 'full',
    layouts: 'full'
  });

  window.glue = glue;
  res(glue);
});

const glueAppsObs = new rxjs.BehaviorSubject([]);
const runningAppsObs = new rxjs.BehaviorSubject([]);
const layoutsObs = new rxjs.BehaviorSubject([]);

gluePromise.then((glue) => {
  trackApplications();
  // trackApplicationInstances();
  trackLayouts();
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
  layoutsObs.next(glue.layouts.list())
}

export {
  gluePromise,
  glueAppsObs,
  runningAppsObs,
  layoutsObs
};