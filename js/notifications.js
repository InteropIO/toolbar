import {
  notificationEnabledObs,
  configureNotifications,
  checkNotificationsConfigure,
  openNotificationPanel,
} from './connect-related.js';
import { getSetting } from './settings.js';

async function handleNotificationClick() {
  const enableNotifications = getSetting('enableNotifications');
  const notificationPanel = document.querySelector('#notification-panel');

  if (enableNotifications) {
    notificationEnabledObs.subscribe((data) => {
      notificationPanel.classList[data ? 'remove' : 'add']('d-none');
    });
  }

  notificationPanel.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();
    openNotificationPanel();
  });
}

async function handleEnableNotifications() {
  const methodExists = await checkNotificationsConfigure();

  if (methodExists) {
    handleEnableNotificationsClick();
    handleEnableToastsClick();
  }
}

function handleEnableNotificationsClick() {
  const enableNotifications = document.querySelector('#enable-notifications');

  enableNotifications.addEventListener('click', (e) => {
    if (e.target.checked) {
      configureNotifications({ enable: true, enableToasts: false });
    } else {
      configureNotifications({ enable: false, enableToasts: false });
    }
  });
}

function handleEnableToastsClick() {
  const enableToasts = document.querySelector('#enable-toasts');

  enableToasts.addEventListener('click', (e) => {
    if (e.target.checked) {
      configureNotifications({ enableToasts: true });
    } else {
      configureNotifications({ enableToasts: false });
    }
  });
}

export { handleNotificationClick, handleEnableNotifications };
