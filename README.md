## Glue42 Floating Toolbar

![Toolbar GIF](./toolbar.gif)

Simple vanilla.js implementation of a Glue42 Floating Toolbar.

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

## How to use a modified version 

If you want to modify this version and run Glue42 with it

* Modify the app and host it in your environment
* Create an app definition that points to the place you've hosted the app
* Open Glue42 *system.json* (``` %LocalAppData%\Tick42\GlueDesktop\config\```) and set "useEmbeddedShell" to false.
