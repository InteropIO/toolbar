import { updatePrefs } from './connect-related.js';
import { scheduleShutdownRestartSaveLayout } from './schedule-shutdown-restart.js';

let settings = {
  showTutorial: true,
  saveDefaultLayout: false,
  searchClients: true,
  searchInstruments: true,
  enableNotifications: true,
  enableToasts: true,
  showNotificationBadge: true,
  toolbarAppRows: '8',
  showHiddenApps: false,
  vertical: true,
  favoriteApps: [],
  favoriteLayouts: [],
  schedule: {
    restart: {
      enable: false,
      time: '00:00',
      period: 'Weekly',
      interval: 'Monday',
    },
    shutdown: {
      enable: false,
      time: '00:00',
      period: 'Weekly',
      interval: 'Monday',
    },
  },
};
const toolbarWidth = {
  vertical: 60,
  horizontal: 650,
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
  const enableNotificationsToggle = document.querySelector(
    '#enable-notifications'
  );
  const enableToastsToggle = document.querySelector('#enable-toasts');

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
        enableNotificationsToggle.checked = true;
        enableToastsToggle.disabled = false;
      } else {
        notificationPanel.classList.add('d-none');
        enableNotificationsToggle.checked = false;
        enableToastsToggle.checked = false;
        enableToastsToggle.disabled = true;
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
      e.target.getAttribute('name') === 'length' ||
      e.target.getAttribute('name') === 'restart-time' ||
      e.target.getAttribute('name') === 'shutdown-time' ||
      e.target.getAttribute('name') === 'restart-period' ||
      e.target.getAttribute('name') === 'restart-interval' ||
      e.target.getAttribute('name') === 'shutdown-period' ||
      e.target.getAttribute('name') === 'shutdown-interval';

    if (settingDropdown) {
      return;
    }

    let settingElement = e.composedPath().find((el) => el?.dataset.setting);

    if (settingElement) {
      let setting = {};

      setting[settingElement.dataset.setting] = e.target.checked;

      if (e.target.dataset.setting === 'saveDefaultLayout') {
        scheduleShutdownRestartSaveLayout(e.target.checked);
      } else if (
        e.target.dataset.setting === 'enableNotifications' &&
        e.target.checked === false
      ) {
        setting = { enableNotifications: false, enableToasts: false };
      } else if (e.target.dataset.setting === 'scheduleRestart') {
        const prevSetting = getSetting('schedule');

        setting = {
          schedule: {
            shutdown: { ...prevSetting.shutdown },
            restart: {
              ...prevSetting.restart,
              enable: e.target.checked,
            },
          },
        };
      } else if (e.target.dataset.setting === 'scheduleShutdown') {
        const prevSetting = getSetting('schedule');

        setting = {
          schedule: {
            shutdown: {
              ...prevSetting.shutdown,
              enable: e.target.checked,
            },
            restart: { ...prevSetting.restart },
          },
        };
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

  populateSettings();

  if (
    Object.keys(setting).includes('showHiddenApps') ||
    Object.keys(setting).includes('enableNotifications') ||
    Object.keys(setting).includes('enableToasts')
  ) {
    return;
  }

  updatePrefs(setting);
}

export {
  toolbarWidth,
  toolbarDrawerSize,
  initialPosition,
  setSetting,
  setSettings,
  getSetting,
  getSettings,
};
