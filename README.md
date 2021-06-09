## Vanilla JS implementation of a Glue42 Toolbar

![Toolbar GIF](./toolbar.gif)

Simple vanilla.js implementation of a Glue42 Toolbar.

Prerequisites: None. The code does not need any other modules, packages or installations.

Main functionalities
- Listing, searching and starting applications
- Adding and removing applications from favorites
- Listing, searching and opening layouts (including Global, Swimlane and Workspace layouts)
- Managing basic settings of toolbar
- Changing Glue42 color theme
- Searching for clients and instruments (if available via GSS), listing and starting application that can open the search entity(client or instrument)
- Switching between horizontal and vertical versions
- Open the Glue42 Feedback Form
- Open the Glue42 Notifications Panel

To replace the toolbar in your Glue Desktop - go to ``` %LocalAppData%\Tick42\GlueDesktop\assets\app-toolbar ``` and replace the files of the toolbar. Glue Desktop has an internal config for the built-in toolbar which in the code is in glue-destkop\app\apps\stores\embeddedApps.ts:37. If you want you can turn off the embedded config for the toolbar by using the config in ``` %LocalAppData%\Tick42\GlueDesktop\config\system.json ``` and set "useEmbeddedShell" to false. Then you'll need to add an additional config for your custom toolbar.