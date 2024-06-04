import flatpickr from '../assets/flatpickr.js';

const config = {
  enableTime: true,
  noCalendar: true,
  dateFormat: 'H:i',
  defaultDate: '00:00',
};

function initTimePicker(domElement, config) {
  return flatpickr(domElement, config);
}

function createScheduleShutdownInput() {
  const input = '#schedule-shutdown-time';

  initTimePicker(input, config);
}

function createScheduleRestartInput() {
  const input = '#schedule-restart-time';

  initTimePicker(input, config);
}

export { createScheduleShutdownInput, createScheduleRestartInput };
