import {
  setSettings,
  getSetting,
  getSettings,
  setSetting,
} from './settings.js';
import {
  setOrientation,
  setWindowSize,
  setWindowPosition,
  setDrawerOpenClasses,
  setDrawerOpenDirection,
} from './utils.js';

console.time('Glue');

var gluePromise = new Promise(async (res, rej) => {
  window.addEventListener('load', async () => {
    let glue = await Glue({
      appManager: 'full',
      layouts: 'full',
      activities: 'trackAll',
      channels: false,
      metrics: false,
      contexts: true,
    });

    await GlueWorkspaces(glue);

    console.timeEnd('Glue');
    if (!window.glue) {
      console.log('has Glue');
      window.glue = glue;
    }
    res(glue);
  });
});

const glueAppsObs = new rxjs.BehaviorSubject([]);
const allWorkspacesObs = new rxjs.BehaviorSubject([]);
const layoutsObs = new rxjs.BehaviorSubject([]);
const defaultLayout = new rxjs.BehaviorSubject({});
const activeLayout = new rxjs.BehaviorSubject({});
const notificationsCountObs = new rxjs.BehaviorSubject(null);
const themeObs = new rxjs.BehaviorSubject(null);
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
  trackApplications();
  trackLayouts();
  trackWorkspaces();
  trackThemeChanges();
  trackWindowMove();
  trackDisplayChange();
  trackConnection();
  trackNotificationCount();
  trackWindowZoom();
  trackNotificationPanelVisibilityChange();
});

function trackWindowZoom() {
  applyWindowZoom();
  trackWindowResize();

  glue.windows.my().onBoundsChanged(() => {
    applyWindowZoom();
  });
}

function applyWindowZoom() {
  const glueWindowHeight = glue.windows.my().bounds.height;
  const windowHeight = window.innerHeight;
  const zoomRatio = windowHeight / glueWindowHeight;

  document.documentElement.style.zoom = zoomRatio;
}

function applyWindowZoomWithDelay() {
  setTimeout(() => {
    applyWindowZoom();
  }, 1000);
}

function trackWindowResize() {
  window.addEventListener('resize', () => {
    applyWindowZoom();
    applyWindowZoomWithDelay();
  });
}

function trackApplications() {
  pushAllApps();
  glue.appManager.onAppAdded(pushAllApps);
  glue.appManager.onAppRemoved(pushAllApps);
  glue.appManager.onAppChanged(pushAllApps);
  glue.appManager.onInstanceStarted(pushAllApps);
  glue.appManager.onInstanceStopped(pushAllApps);
}

function pushAllApps() {
  glueAppsObs.next(
    glue.appManager.applications().map((a) => {
      return {
        name: a.name,
        title: a.title,
        userProperties: a.userProperties,
        instances: a.instances.map((i) => i.id),
        hidden: a.hidden,
        icon: a.icon,
        keywords: a.keywords || [],
      };
    })
  );
}

async function trackLayouts() {
  pushAllLayouts();
  glue.layouts.onAdded(pushAllLayouts);
  glue.layouts.onRemoved(pushAllLayouts);
  glue.layouts.onChanged(pushAllLayouts);
  glue.layouts.onRenamed(pushAllLayouts);
  activeLayout.next((await glue.layouts.getCurrentLayout()) || {});
  glue.layouts.onRestored((layout) => {
    activeLayout.next(layout || {});
  });
  getDefaultLayout();
}

function pushAllLayouts() {
  layoutsObs.next(glue.layouts.list());
  pushWorkspaces();
}

function trackWorkspaces() {
  pushWorkspaces();
}

async function pushWorkspaces() {
  const workspaces = glue.layouts
    .list()
    .filter(
      (layout) => layout.type === 'Swimlane' || layout.type === 'Workspace'
    )
    .map((workspace) => {
      const state = workspace.components.find(
        (component) =>
          component.type.toLowerCase() === workspace.type.toLowerCase()
      ).state;
      return {
        name: workspace.name,
        type: workspace.type.toLowerCase(),
        ...state,
      };
    });

  allWorkspacesObs.next(workspaces);
}

async function trackNotificationCount() {
  await trackNotificationsEnabled();
  notificationEnabledObs
    .pipe(rxjs.operators.filter((data) => data))
    .pipe(rxjs.operators.take(1))
    .subscribe((data) => {
      glue.agm.subscribe('T42.Notifications.Counter').then((subscription) => {
        subscription.onData(({ data }) => {
          notificationsCountObs.next(data.count);
        });
      });
    });
}

async function trackThemeChanges() {
  await glue.themes.ready();
  glue.themes.onChanged(async (selected) => {
    themeObs.next({
      all: await glue.themes.list(),
      selected,
    });
  });
}

async function trackWindowMove() {
  glue.windows.my().onBoundsChanged(async () => {
    await setDrawerOpenClasses();
  });
}

async function trackDisplayChange() {
  glue.displays.onDisplayChanged(async () => {
    await setWindowSize();
  });
}

async function trackNotificationPanelVisibilityChange() {
  const notificationPanel = q('#notification-panel');
  const isPanelVisible = await glue.notifications.panel.isVisible();

  if (isPanelVisible) {
    notificationPanel.classList.add('app-active');
  }

  if (typeof glue.notifications.panel.onVisibilityChanged !== 'function') {
    return;
  }

  const unSubscribe = glue.notifications.panel.onVisibilityChanged(
    (isVisible) => {
      if (isVisible) {
        notificationPanel.classList.add('app-active');
      } else {
        notificationPanel.classList.remove('app-active');
      }
    }
  );

  return () => unSubscribe();
}

function windowCenter() {
  glue.windows.my().center();
}

async function startApp(appName, context) {
  await gluePromise;
  let glueApp = glue.appManager.application(appName);
  if (glueApp) {
    glueApp
      .start(context)
      .then(() => {})
      .catch((e) => {
        console.warn('Failed to start app');
        console.warn(e);
      });
  } else {
    throw new Error(`Cannot find app with name "${appName}"`);
  }
}

async function getApp(appName) {
  await gluePromise;
  return glue.appManager.application(appName);
}

async function focusApp(appName) {
  await gluePromise;
  let app = glue.appManager.application(appName);
  app.instances.forEach((i) => i.activate());
}

async function focusWindow(callback) {
  await gluePromise;
  glue.windows.my().onFocusChanged(callback);
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
    glue.layouts.restore({ name });
  } else if (type === 'Swimlane') {
    glue42gd.canvas.openWorkspace(name);
  } else if (type === 'Workspace') {
    glue.workspaces.restoreWorkspace(name);
  }
}

async function openWorkspace(name, type, context) {
  await gluePromise;

  if (type === 'swimlane') {
    glue42gd.canvas.openWorkspace(name, { context });
  } else if (type === 'workspace') {
    glue.workspaces.restoreWorkspace(name, { context });
  }
}

async function saveLayout(name) {
  await gluePromise;
  return glue.layouts.save({ name });
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
  let notificationMethodExists = new rxjs.BehaviorSubject(false);
  notificationMethodExists.next(
    glue.agm.methods({ name: 'T42.Notifications.Show' }).length > 0
  );
  glue.agm.methodAdded(() => {
    notificationMethodExists.next(
      glue.agm.methods({ name: 'T42.Notifications.Show' }).length > 0
    );
  });

  glue.agm.methodRemoved(() => {
    notificationMethodExists.next(
      glue.agm.methods({ name: 'T42.Notifications.Show' }).length > 0
    );
  });

  notificationMethodExists
    .pipe(rxjs.operators.distinctUntilChanged())
    .subscribe((data) => notificationEnabledObs.next(data));
}

async function checkNotificationsConfigure() {
  const glue = await gluePromise;

  return typeof glue.notifications.configure === 'function';
}

async function configureNotifications(config) {
  const methodExists = await checkNotificationsConfigure();

  if (methodExists) {
    glue.notifications.configure(config);
  }
}

async function checkNotificationsConfiguration() {
  const glue = await gluePromise;

  return typeof glue.notifications.getConfiguration === 'function';
}

async function getNotificationsConfiguration() {
  const glue = await gluePromise;
  const methodExists = await checkNotificationsConfiguration();

  if (methodExists) {
    const { enable, enableToasts } =
      await glue.notifications.getConfiguration();
    const setting = {
      enableNotifications: enable,
      enableToasts,
    };

    setSetting(setting);
  }
}

async function checkNotificationsOnConfigurationChanged() {
  const glue = await gluePromise;

  return typeof glue.notifications.onConfigurationChanged === 'function';
}

async function trackNotificationsConfigurationChange() {
  const glue = await gluePromise;
  const methodExists = await checkNotificationsOnConfigurationChanged();

  if (methodExists) {
    await glue.notifications.onConfigurationChanged((config) => {
      const { enable, enableToasts } = config;
      const setting = {
        enableNotifications: enable,
        enableToasts,
      };

      setSetting(setting);
    });
  }
}

async function openNotificationPanel() {
  const glue = await gluePromise;
  const panelApp = glue.windows.find(
    'io-connect-notifications-panel-application'
  );

  await glue.notifications.panel.show();
  await panelApp.focus();
}

async function openFeedbackForm() {
  await gluePromise;
  glue.feedback && glue.feedback();
}

async function registerHotkey() {
  await gluePromise;
  glue.hotkeys.register(
    {
      hotkey: 'Ctrl+Alt+T',
      description: 'Bring app to front for seamless workflow.',
    },
    () => {
      glue.windows.my().focus();
    }
  );
}

async function shutdown() {
  await gluePromise;
  glue.appManager.exit({
    autoSave: getSetting('saveDefaultLayout'),
  });
}

async function changeTheme(themeName) {
  glue.themes.select(themeName);
}

async function openWindow(name, url, options) {
  await gluePromise;
  const myBounds = glue.windows.my().bounds;
  options = {
    ...options,
    top: myBounds.top + 100,
    left: myBounds.left + 100,
  };
  window.glue.windows.open(name, url, options);
}

async function getPrimaryScaleFactor() {
  let scaleFactor = 1;
  const monitors = await getMonitorInfo();

  monitors.forEach((monitor) => {
    monitor.isPrimary ? (scaleFactor = monitor.scaleFactor) : scaleFactor;
  });

  return scaleFactor;
}

async function getScaleFactor() {
  const currentMonitor = await glue.windows.my().getDisplay();

  return currentMonitor.scaleFactor;
}

async function getWindowWorkArea() {
  await gluePromise;
  const currentMonitor = await glue.windows.my().getDisplay();
  const primaryScaleFactor = await getPrimaryScaleFactor();
  const scaleFactor = currentMonitor.scaleFactor;

  return {
    left: currentMonitor.workArea.left / primaryScaleFactor,
    top: currentMonitor.workArea.top / primaryScaleFactor,
    right:
      currentMonitor.workArea.left / primaryScaleFactor +
      currentMonitor.workArea.width / scaleFactor,
    bottom:
      currentMonitor.workArea.top / primaryScaleFactor +
      currentMonitor.workArea.height / scaleFactor,
    width: currentMonitor.workArea.width / scaleFactor,
    height: currentMonitor.workArea.height / scaleFactor,
  };
}

async function getPhysicalWindowBounds() {
  await gluePromise;
  const bounds = glue.windows.my().bounds;
  const primaryScaleFactor = await getPrimaryScaleFactor();
  const scaleFactor = await getScaleFactor();

  return {
    left: bounds.left / primaryScaleFactor,
    top: bounds.top / primaryScaleFactor,
    right: bounds.left / primaryScaleFactor + bounds.width / scaleFactor,
    bottom: bounds.top / primaryScaleFactor + bounds.height / scaleFactor,
    width: bounds.width / scaleFactor,
    height: bounds.height / scaleFactor,
  };
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
  return glue.windows.my().settings.allowMinimize;
}

async function raiseNotification(options) {
  await gluePromise;
  if (
    glue.agm
      .methods()
      .find((m) => m.name === 'T42.GNS.Publish.RaiseNotification')
  ) {
    options.source = options.source || '';
    glue.agm.invoke('T42.GNS.Publish.RaiseNotification', {
      notification: options,
    });
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

async function getMonitorInfo() {
  await gluePromise;
  return (await glue.displays.all()).map((display) => ({
    left: display.bounds.left,
    top: display.bounds.top,
    width: display.bounds.width,
    height: display.bounds.height,
    isPrimary: display.isPrimary,
    scaleFactor: display.scaleFactor,
    workingAreaWidth: display.workArea.width,
    workingAreaHeight: display.workArea.height,
    workingAreaLeft: display.workArea.left,
    workingAreaTop: display.workArea.top,
  }));
}

async function glueVersion() {
  await gluePromise;
  return glue.version;
}

async function restart() {
  await gluePromise;
  glue.appManager.restart({
    autoSave: getSetting('saveDefaultLayout'),
  });
}

function getGWURL() {
  return glue42gd.gwURL;
}

function getSID() {
  return glue42gd.sid;
}

function getEnvData() {
  return glue42gd.env;
}

function getGDVersion() {
  return glue42gd.version;
}

async function getUserProperties() {
  await gluePromise;
  return glue.appManager.myInstance.application.userProperties;
}

async function getPrefs() {
  await gluePromise;
  const prefs = await glue.prefs.get();
  const settings = getSettings();

  // if we don't have any prefs, get the default settings and update prefs
  if (
    typeof prefs.data === 'undefined' ||
    Object.keys(prefs.data).length === 0
  ) {
    await updatePrefs({
      showTutorial: settings.showTutorial,
      saveDefaultLayout: settings.saveDefaultLayout,
      searchClients: settings.searchClients,
      searchInstruments: settings.searchInstruments,
      toolbarAppRows: settings.toolbarAppRows,
      vertical: settings.vertical,
      favoriteApps: settings.favoriteApps,
      schedule: settings.schedule,
    });
    setSettings();
  } else {
    setSettings(prefs.data);
  }

  setOrientation();

  if (glue.windows.my().state === 'minimized') {
    const un = glue.windows.my().onNormal(async () => {
      un();
      await setWindowSize();
    });
  }

  await setWindowSize();
  setDrawerOpenDirection();
  await setDrawerOpenClasses();
  await setWindowPosition();

  glue.prefs.subscribe((prefs) => {
    setOrientation();
  });
}

async function updatePrefs(setting) {
  try {
    await glue.prefs.update({ ...setting });
  } catch (error) {
    console.error('Failed to update preferences.', error);
  }
}

async function getServerInfo() {
  const configs = await glue42gd.getConfigs();
  return configs.server;
}

export {
  gluePromise,
  glueVersion,
  glueInfo,
  glueAppsObs,
  layoutsObs,
  startApp,
  focusApp,
  focusWindow,
  getApp,
  refreshApps,
  notificationsCountObs,
  themeObs,
  changeTheme,
  notificationEnabledObs,
  configureNotifications,
  checkNotificationsConfigure,
  allWorkspacesObs,
  openNotificationPanel,
  openFeedbackForm,
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
  openWindow,
  moveMyWindow,
  minimize,
  isMinimizeAllowed,
  raiseNotification,
  getMonitorInfo,
  getPhysicalWindowBounds,
  getSID,
  getEnvData,
  getGDVersion,
  restart,
  getGWURL,
  getUserProperties,
  getServerInfo,
  getPrefs,
  updatePrefs,
  getWindowWorkArea,
  getPrimaryScaleFactor,
  getScaleFactor,
  windowCenter,
  getNotificationsConfiguration,
  trackNotificationsConfigurationChange,
};
