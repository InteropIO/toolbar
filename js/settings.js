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
  favoriteApps: [],
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
      setSetting(setting);

      if (
        e.target.dataset.setting === 'enableNotifications' &&
        e.target.checked === false
      ) {
        setting = { enableNotifications: false, enableToasts: false };
      } else if (e.target.dataset.setting === 'scheduleRestart') {
        const prevSetting = getSetting('schedule');

        setting = {
          schedule: {
            shutdown: {
              enable: prevSetting.shutdown.enable,
              time: prevSetting.shutdown.time,
              period: prevSetting.shutdown.period,
              interval: prevSetting.shutdown.interval,
            },
            restart: {
              enable: e.target.checked,
              time: prevSetting.restart.time,
              period: prevSetting.restart.period,
              interval: prevSetting.restart.interval,
            },
          },
        };
      } else if (e.target.dataset.setting === 'scheduleShutdown') {
        const prevSetting = getSetting('schedule');

        setting = {
          schedule: {
            restart: {
              enable: prevSetting.restart.enable,
              time: prevSetting.restart.time,
              period: prevSetting.restart.period,
              interval: prevSetting.restart.interval,
            },
            shutdown: {
              enable: e.target.checked,
              time: prevSetting.shutdown.time,
              period: prevSetting.shutdown.period,
              interval: prevSetting.shutdown.interval,
            },
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
  setSetting,
  setSettings,
  getSetting,
  getSettings,
};
