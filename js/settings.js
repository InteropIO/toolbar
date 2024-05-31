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

function populateSettings() {
  const settingsContainer = document.querySelector('#settings-content');
  const notificationPanel = document.querySelector('#notification-panel');
  const enableNotificationsCheckbox = document.querySelector(
    '#enable-notifications'
  );
  const enableToastsCheckbox = document.querySelector('#enable-toasts');

  for (const setting in settings) {
    const settingElement = settingsContainer.querySelector(
      `[data-setting='${setting}']`
    );

    if (!settingElement) {
      continue;
    }

    if (setting === 'enableNotifications') {
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

    if (typeof settings[setting] === 'boolean') {
      getSetting(setting)
        ? settingElement.setAttribute('checked', true)
        : settingElement.removeAttribute('checked');
    }
  }
}

function trackSettingsChange() {
  const settingsContainer = document.querySelector('#settings-content');

  settingsContainer.addEventListener('change', (e) => {
    const settingDropdown =
      e.target.getAttribute('name') === 'theme' ||
      e.target.getAttribute('name') === 'length';

    if (settingDropdown) {
      return;
    }

    let settingElement = e.composedPath().find((el) => el?.dataset.setting);

    if (settingElement) {
      let setting = {};

      setting[settingElement.dataset.setting] = e.target.checked;
      setSetting(setting);

      if (
        e.target.dataset.setting === 'enableNotifications' &&
        e.target.checked === false
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
