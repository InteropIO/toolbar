# io.Connect Floating Toolbar

Pure JavaScript implementation of the io.Connect Floating Toolbar for [**io.Connect Desktop**](https://interop.io/products/io-connect/).

![Toolbar GIF](./toolbar.gif)

For more details, see also the [io.Connect Floating Toolbar documentation](https://docs.glue42.com/glue42-concepts/glue42-toolbar/index.html).

## Prerequisites

None. The code doesn't require any other modules, packages or installations.

## Main Functionalities

- Listing, searching and starting applications.
- Adding and removing applications from favorites.
- Listing, searching and opening [Layouts](https://docs.glue42.com/glue42-concepts/windows/layouts/overview/index.html) (including Global, Swimlane and Workspace layouts).
- Managing basic settings for the Toolbar.
- Changing the io.Connect themes.
- Searching for Clients and Instruments (if available via GSS), listing and starting application that can open the search entity (Client or Instrument).
- Switching between horizontal and vertical views.
- Opening the io.Connect Feedback Form.
- Opening the io.Connect Notifications Panel

## Customizing the Toolbar

You can use the Floating Toolbar source code to create your own modified version of the io.Connect Floating Toolbar. Once you have implemented a toolbar, you must host it, create an [application configuration](https://docs.glue42.com/developers/configuration/application/index.html#application_configuration) file for it and add it to your application store. Make sure to set the `"shell"` top-level key to `true`:

```json
{
    ...
    "shell": true,
    ...
}
```

Also, modify the [system configuration](https://docs.glue42.com/developers/configuration/system/index.html) of **io.Connect Desktop** from the `system.json` file - set the `"useEmbeddedShell"` property to `false`:

```json
{
    ...
    "useEmbeddedShell": false,
    ...
}
```

Restart **io.Connect Desktop** for the changes to take effect.
