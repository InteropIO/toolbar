import {
  updatePrefs,
  checkNotificationsConfigure,
  configureNotifications,
} from './glue-related.js';
import { setToolbarSize, setToolbarPosition } from './utils.js';

let settings = {
  showTutorial: true,
  saveDefaultLayout: false,
  searchClients: true,
  searchInstruments: true,
  enableNotifications: true,
  enableToasts: true,
  toolbarAppRows: '10',
  showHiddenApps: false,
  vertical: true,
  openDrawerDirection: 'right',
};
const toolbarWidth = {
  vertical: 200,
  horizontal: 834,
};
const toolbarPadding = {
  vertical: 300,
  horizontal: 550,
};
const initialPosition = {
  top: 20,
  left: 20,
};

function init() {
  populateSettings();
  trackSettingsChange();
}

async function populateSettings() {
  const methodExists = await checkNotificationsConfigure();

  if (methodExists) {
    configureNotifications({
      enable: settings.enableNotifications,
      enableToasts: settings.enableToasts,
    });
  } else {
    q('.settings-notifications').classList.add('d-none');
  }

  setToolbarSize();
  setToolbarPosition();

  for (const setting in settings) {
    if (
      typeof settings[setting] === 'boolean' &&
      q(`#settings-content [setting='${setting}']`)
    ) {
      let checkbox = q(`#settings-content [setting='${setting}']`);

      getSetting(setting)
        ? checkbox.setAttribute('checked', true)
        : checkbox.removeAttribute('checked');
    }
  }
}

function trackSettingsChange() {
  q('#settings-content').addEventListener('change', (e) => {
    let settingElement = e.path.find(
      (e) => e && e.getAttribute && e.getAttribute('setting')
    );

    if (settingElement) {
      const setting = {};

      setting[settingElement.getAttribute('setting')] = e.srcElement.checked;
      updateSetting(setting);

      if (
        e.target.getAttribute('setting') === 'enableNotifications' &&
        e.srcElement.checked === false
      ) {
        updateSetting({ enableNotifications: false, enableToasts: false });
      }
    }
  });
}

function setSettings(prefs) {
  updateSettings(prefs);
  init();
}

function updateSetting(setting) {
  updatePrefs(setting);
}

function updateSettings(prefs) {
  settings = { ...settings, ...prefs };
  populateSettings();
}

function getSetting(setting) {
  return settings[setting];
}

function getSettings() {
  return settings;
}

export {
  toolbarWidth,
  toolbarPadding,
  initialPosition,
  setSettings,
  updateSetting,
  updateSettings,
  getSetting,
  getSettings,
};
