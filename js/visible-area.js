let topMenuVisibleObs = new rxjs.BehaviorSubject(false);
let layoutDropDownVisibleObs = new rxjs.BehaviorSubject(false);

function handleDropDownClicks() {
  document.addEventListener('click', (e) => {
    if (e.target.matches('[dropdown-button-id], [dropdown-button-id] *')) {
      let btnElement = e.path.find((e) => e.getAttribute('dropdown-button-id'));
      let menuId = btnElement.getAttribute('dropdown-button-id');
      let menu = q(`[dropdown-id="${menuId}"]`);

      menu.classList.toggle('show');
      topMenuVisibleObs.next(menu.classList.contains('show'));
    } else {
      qa(`[dropdown-id].show`).forEach((e) => e.classList.remove('show'));
      topMenuVisibleObs.next(false);
    }
  });
}

function getMonitor(bounds, displays) {
  const monitorsSortedByOverlap = displays
    .map((m) => {
      const {
        left,
        top,
        workingAreaWidth: width,
        workingAreaHeight: height,
      } = m;
      const overlap = calculateTotalOverlap(
        { left, top, width, height },
        bounds
      );

      return {
        monitor: m,
        totalOverlap: overlap,
      };
    })
    .sort((a, b) => b.totalOverlap - a.totalOverlap);

  if (!monitorsSortedByOverlap.find((m) => m.totalOverlap > 0)) {
    return false;
  }

  return monitorsSortedByOverlap[0].monitor;
}

function calculateTotalOverlap(r1, r2) {
  const r1x = r1.left;
  const r1y = r1.top;
  const r1xMax = r1x + r1.width;
  const r1yMax = r1y + r1.height;

  const r2x = r2.left;
  const r2y = r2.top;
  const r2xMax = r2x + r2.width;
  const r2yMax = r2y + r2.height;

  const xOverlap = Math.max(0, Math.min(r1xMax, r2xMax) - Math.max(r1x, r2x));
  const yOverlap = Math.max(0, Math.min(r1yMax, r2yMax) - Math.max(r1y, r2y));

  return xOverlap * yOverlap;
}

export {
  handleDropDownClicks,
  getMonitor,
  layoutDropDownVisibleObs,
  topMenuVisibleObs,
};
