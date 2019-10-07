To preview this toolbar in Glue Desktop:

1. run Glue Desktop
2. run live-server in this folder
3. open devtools of the old appmanager
4. run
```javascript
  glue.windows.open('App Manager Vanilla', 'http://127.0.0.1:8080/', {isSticky: false, mode:'html', allowClose: false, allowMinimize: false, allowMaximize: false, allowCollapse: false, hasSizeAreas: true, width: 500})
```