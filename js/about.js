const q = document.querySelector.bind(document);
const qa = document.querySelectorAll.bind(document);

q('.gd-version').innerText = glue42gd.version;
q('.gw-url').innerText = glue42gd.gwURL;
q('.username').innerText = glue42gd.user;