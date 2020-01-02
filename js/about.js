const q = document.querySelector.bind(document);
const qa = document.querySelectorAll.bind(document);
const gluePromise = Glue();

q('.gd-version').innerText = glue42gd.version;
q('.gw-url').innerText = glue42gd.gwURL;
q('.username').innerText = glue42gd.user;

q('.close').addEventListener('click', async () => {
  let glue = await gluePromise;
  glue.windows.my().close();
})

if (window.glue42gd && glue42gd.theme) {
  let allThemes = ['dark', 'light', 'colorful'];
  let html = document.querySelector('html');
  html.classList.remove(...allThemes);
  html.classList.add(glue42gd.theme);
}