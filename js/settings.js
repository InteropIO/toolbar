import { updatePrefs } from './connect-related.js';

let settings = {
  showTutorial: true,
  saveDefaultLayout: false,
  searchClients: true,
  searchInstruments: true,
  enableNotifications: true,
  enableToasts: true,
  toolbarAppRows: '8',
  showHiddenApps: false,
  vertical: true,
};
const toolbarWidth = {
  vertical: 200,
  horizontal: 540,
};
const toolbarDrawerSize = {
  vertical: 300,
  horizontal: 550,
};
const initialPosition = 20;

async function init() {
  populateSettings();
  trackSettingsChange();
}

async function populateSettings() {
  for (const setting in settings) {
    if (
      typeof settings[setting] === 'boolean' &&
      q(`#settings-content [setting='${setting}']`)
    ) {
      let checkbox = q(`#settings-content [setting='${setting}']`);

      const notificationPanel = q('#notification-panel');
      const enableNotificationsCheckbox = q('#enable-notifications');
      const enableToastsCheckbox = q('#enable-toasts');
      if (setting === "enableNotifications") {
        const enable = settings[setting];
        if (enable) {
          notificationPanel.classList.remove('d-none');
          enableNotificationsCheckbox.checked = true;
          enableToastsCheckbox.disabled = false;
        } else {
          notificationPanel.classList.add('d-none');
          enableNotificationsCheckbox.checked = false;
          enableToastsCheckbox.checked = false;
          enableToastsCheckbox.disabled = true;
        }
      }

      getSetting(setting)
        ? checkbox.setAttribute('checked', true)
        : checkbox.removeAttribute('checked');
    }
  }
}

function trackSettingsChange() {
  q('#settings-content').addEventListener('change', (e) => {
    let settingElement = e
      .composedPath()
      .find((e) => e && e.getAttribute && e.getAttribute('setting'));

    if (settingElement) {
      let setting = {};

      setting[settingElement.getAttribute('setting')] = e.srcElement.checked;

      if (
        e.target.getAttribute('setting') === 'enableNotifications' &&
        e.srcElement.checked === false
      ) {
        setting = { enableNotifications: false, enableToasts: false };
      }
      setSetting(setting);
    }
  });
}

function getSettings() {
  return settings;
}

function setSettings(prefs) {
  settings = { ...settings, ...prefs };
  init();
}

function getSetting(setting) {
  return settings[setting];
}

function setSetting(setting) {
  Object.assign(settings, setting);

  if (Object.keys(setting).includes('showHiddenApps')) {
    return;
  }

  updatePrefs(setting);
  populateSettings();
}

export {
  toolbarWidth,
  toolbarDrawerSize,
  initialPosition,
  setSettings,
  setSetting,
  getSetting,
  getSettings,
};
