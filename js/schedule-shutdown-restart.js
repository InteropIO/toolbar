import flatpickr from '../assets/flatpickr.js';
import { getSetting, setSetting } from './settings.js';
import { populateSettingsDropdown } from './utils.js';

const daysOfTheWeek = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];
const monthsOfTheYear = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const defaultConfig = {
  enableTime: true,
  noCalendar: true,
  dateFormat: 'H:i',
  defaultDate: '00:00',
  // minuteIncrement: 1,
  clickOpens: false,
};

const periodItems = {
  all: [
    { name: 'Weekly', displayName: 'Weekly' },
    { name: 'Daily', displayName: 'Daily' },
  ],
};

const intervalItems = {
  all: [
    { name: 'Monday', displayName: 'Mon' },
    { name: 'Tuesday', displayName: 'Tue' },
    { name: 'Wednesday', displayName: 'Wed' },
    { name: 'Thursday', displayName: 'Thu' },
    { name: 'Friday', displayName: 'Fri' },
    { name: 'Saturday', displayName: 'Sat' },
    { name: 'Sunday', displayName: 'Sun' },
  ],
};

function initTimePicker(domElement, config) {
  if (!domElement || !config) {
    return;
  }

  return flatpickr(domElement, config);
}

async function createInstance(input, config = defaultConfig) {
  if (!input) {
    return;
  }

  const instance = initTimePicker(input, config);

  input.addEventListener('click', () => {
    instance.open();
  });

  instance.config.onClose.push(async (selectedDates, time) => {
    const option = input.id.split('-')[1];
    const prevSettings = getSetting('schedule');
    const obj = {
      time,
      period: prevSettings[option].period,
      interval: prevSettings[option].interval,
    };
    const parsedString = parseScheduleToString(obj);

    setSetting({
      schedule: {
        ...prevSettings,
        ...{
          [option]: {
            ...prevSettings[option],
            ...{ time },
          },
        },
      },
    });

    try {
      await setSchedule(option, parsedString);
    } catch (e) {
      console.error(e);
    }
  });

  return instance;
}

async function createDropdown(option, scheduleType, dropdownItems) {
  if (!option || !scheduleType || !dropdownItems) {
    return;
  }

  const initialSetting = getSetting('schedule')[option]?.[scheduleType];

  if (!initialSetting) {
    return;
  }

  dropdownItems.selected = {
    name: initialSetting,
    displayName: dropdownItems.all.find((el) => {
      const name = el.name;

      if (name === initialSetting) {
        return el.displayName;
      }
    }),
  };

  populateSettingsDropdown(
    document.querySelectorAll(
      `.${option}-${scheduleType}-select .select_options`
    ),
    dropdownItems,
    `${option}-${scheduleType}`
  );

  document
    .querySelector(`.${option}-${scheduleType}-select .select_options`)
    .addEventListener('click', async (e) => {
      const setting = getSetting('schedule');

      if (e.target.matches('input.select_input[type="radio"]')) {
        const selectedOption = e.target.getAttribute(
          `${option}-${scheduleType}-name`
        );

        const intervalDropdown = document.querySelector(
          `.${option}-interval-select`
        );

        if (selectedOption === 'Daily') {
          intervalDropdown.classList.add('d-none');
        } else {
          intervalDropdown.classList.remove('d-none');
        }

        const obj = {};

        switch (scheduleType) {
          case 'period':
            obj.time = setting[option].time;
            obj.period = selectedOption;
            obj.interval = setting[option].interval;
            break;

          case 'interval':
            obj.time = setting[option].time;
            obj.period = setting[option].period;
            obj.interval = selectedOption;
            break;
        }

        const parsedString = parseScheduleToString(obj);

        setSetting({
          schedule: {
            ...setting,
            ...{
              [option]: {
                ...setting[option],
                ...{ [scheduleType]: selectedOption },
              },
            },
          },
        });

        try {
          await setSchedule(option, parsedString);
        } catch (e) {
          console.error(e);
        }
      }
    });
}

async function createScheduleDropdowns() {
  await createDropdown('restart', 'period', periodItems);
  await createDropdown('restart', 'interval', intervalItems);
  await createDropdown('shutdown', 'period', periodItems);
  await createDropdown('shutdown', 'interval', intervalItems);
}

async function createScheduleInputs() {
  const options = ['shutdown', 'restart'];

  options.forEach(async (option) => {
    await createInstance(document.querySelector(`#schedule-${option}-time`), {
      ...defaultConfig,
      ...{ defaultDate: getSetting('schedule')[option]['time'] ?? '00:00' },
    });
  });
}

async function getSchedule(option) {
  const io = window.io;

  try {
    const schedule = await io.interop.invoke('T42.GD.Execute', {
      command: `get-schedule-${option}`,
    });

    if (!schedule) {
      return;
    }

    return schedule.returned.cronTime;
  } catch ({ method, called_with, executed_by, message, status, returned }) {
    if (Object.keys(returned).length === 0) {
      document.querySelector('.settings-system').classList.add('d-none');
    }
  }
}

async function setSchedule(option, scheduleString) {
  if (!option || !scheduleString) {
    return;
  }

  const io = window.io;

  if (!io) {
    return;
  }

  try {
    await io.interop.invoke('T42.GD.Execute', {
      command: `schedule-${option}`,
      args: {
        cronTime: scheduleString,
        discardUnsavedLayoutChanges: !getSetting('saveDefaultLayout'),
      },
    });
  } catch (e) {
    console.error(e);
  }
}

async function cancelSchedule(option) {
  const io = window.io;
  const schedule = await getSchedule(option);

  if (!io || !schedule) {
    return;
  }

  try {
    await io.interop.invoke('T42.GD.Execute', {
      command: `cancel-${option}`,
    });
  } catch (e) {
    console.error(e);
  }
}

function parseScheduleToObj(scheduleString) {
  if (!scheduleString) {
    return;
  }

  const schedule = scheduleString.split(' ');

  const scheduleObj = {
    minute: schedule[0] === '0' ? '00' : schedule[0],
    hour: schedule[1] === '0' ? '00' : schedule[1],
    day: schedule[2],
    month: schedule[3] === '*' ? '*' : monthsOfTheYear[schedule[3]],
    dayOfWeek: schedule[4] === '*' ? '*' : daysOfTheWeek[schedule[4]],
  };

  return scheduleObj;
}

function parseScheduleToString(obj) {
  const minute = obj.time.split(':')[1];
  const hour = obj.time.split(':')[0];
  const day = '*';
  const month = '*';
  const indexOfDay =
    obj.period === 'Weekly' ? daysOfTheWeek.indexOf(obj.interval) : '*';
  const dayOfWeek = obj.interval === '*' ? '*' : indexOfDay;

  return `${minute} ${hour} ${day} ${month} ${dayOfWeek}`;
}

async function getInitialSettings(options) {
  const currentSettings = getSetting('schedule');

  const settings = options.map(async (option) => {
    const schedule = await getSchedule(option);

    if (schedule) {
      const setting = {};
      const { minute, hour, day, month, dayOfWeek } =
        parseScheduleToObj(schedule);

      if (daysOfTheWeek != '*' && day === '*' && month === '*') {
        setting.period = 'Weekly';
        setting.interval = dayOfWeek;
      }

      if (day === '*' && month === '*' && dayOfWeek === '*') {
        setting.period = 'Daily';
      }

      setting.time = `${hour}:${minute}`;

      return {
        [option]: {
          ...currentSettings[option],
          ...{
            enable: true,
            ...setting,
          },
        },
      };
    } else {
      return {
        [option]: {
          ...currentSettings[option],
          ...{
            enable: false,
            interval: currentSettings[option].interval,
            period: currentSettings[option].period,
            time: currentSettings[option].time,
          },
        },
      };
    }
  });

  const settingsObj = await Promise.all(settings)
    .then((res) => {
      return res.reduce((acc, val) => {
        return { ...acc, ...val };
      }, {});
    })
    .catch(console.error);

  setSetting({
    schedule: {
      ...currentSettings,
      ...settingsObj,
    },
  });
}

function setInitialToggleStates() {
  const scheduleSettings = getSetting('schedule');

  document.querySelector('#schedule-restart').checked =
    scheduleSettings.restart.enable;
  document.querySelector('#schedule-shutdown').checked =
    scheduleSettings.shutdown.enable;
}

function setInitialInputStates() {
  const scheduleSettings = getSetting('schedule');
  const options = ['shutdown', 'restart'];

  options.forEach((option) => {
    if (!scheduleSettings[option].enable) {
      document.querySelector(`#schedule-${option}-time`).disabled = true;
      document
        .querySelector(`.settings-system-schedule-${option}`)
        .classList.add('d-none');
    }
  });
}

function setInitialDropdownStates() {
  const scheduleSettings = getSetting('schedule');
  const options = ['shutdown', 'restart'];

  options.forEach((option) => {
    const periodDropdown = document.querySelector(`.${option}-period-select`);
    const intervalDropdown = document.querySelector(
      `.${option}-interval-select`
    );

    if (!scheduleSettings[option].enable) {
      periodDropdown.classList.add('disabled');
      intervalDropdown.classList.add('disabled');
    }

    if (scheduleSettings[option].period === 'Daily') {
      intervalDropdown.classList.add('d-none');
    }
  });
}

async function setInputStatesOnChange(option, checked) {
  if (!option || checked === undefined) {
    return;
  }

  const input = document.querySelector(`#schedule-${option}-time`);
  const periodDropdown = document.querySelector(`.${option}-period-select`);
  const intervalDropdown = document.querySelector(`.${option}-interval-select`);
  const container = document.querySelector(
    `.settings-system-schedule-${option}`
  );

  if (checked) {
    input.disabled = false;
    periodDropdown.classList.remove('disabled');
    intervalDropdown.classList.remove('disabled');
    container.classList.remove('d-none');
  } else {
    input.disabled = true;
    periodDropdown.classList.add('disabled');
    intervalDropdown.classList.add('disabled');
    container.classList.add('d-none');
    try {
      await cancelSchedule(option);
    } catch (e) {
      console.error(e);
    }
  }
}

async function handleScheduleToggleClick() {
  const options = ['shutdown', 'restart'];

  options.forEach(async (option) => {
    document
      .querySelector(`#schedule-${option}`)
      .addEventListener('click', async (e) => {
        const prevSettings = getSetting('schedule');

        if (e.target.matches('input[type="checkbox"]')) {
          const checked = e.target.checked;

          try {
            await setInputStatesOnChange(option, checked);
          } catch (e) {
            console.error(e);
          }

          setSetting({
            schedule: {
              ...prevSettings,
              ...{
                [option]: {
                  ...prevSettings[option],
                  ...{ enable: checked },
                },
              },
            },
          });

          if (checked) {
            const parsedString = parseScheduleToString({
              time: prevSettings[option].time,
              period: prevSettings[option].period,
              interval: prevSettings[option].interval,
            });
            try {
              await setSchedule(option, parsedString);
            } catch (e) {
              console.error(e);
            }
          } else {
            try {
              await cancelSchedule(option);
            } catch (e) {
              console.error(e);
            }
          }
        }
      });
  });
}

async function handleScheduledShutdownRestart() {
  const options = ['shutdown', 'restart'];

  await getInitialSettings(options)
    .then(async () => {
      await createScheduleInputs();
      await createScheduleDropdowns();
      setInitialToggleStates();
      setInitialInputStates();
      setInitialDropdownStates();
      await handleScheduleToggleClick();
    })
    .catch(console.error);
}

export default handleScheduledShutdownRestart;
