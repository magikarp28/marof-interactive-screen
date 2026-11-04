# Tauri + React + Typescript

This template should help get you started developing with Tauri, React and Typescript in Vite.

## Interactive map locations

Each WordPress Lokacije entry has Croatian and English map-label fields. The
label is displayed on the clickable marker at the configured X/Y position.
If the English label is empty, the Croatian label is used; if no label is
available, the localized location title is used instead. Existing locations can
therefore remain visible until their labels are entered.

The three parking markers and the "you are here" marker currently use temporary
positions. Update `parkingPositions` and `youAreHerePosition` in
`src/sections/InteractiveMap.tsx` with the confirmed locations, expressed as
percentages from the left and top of the original map image.

On mobile, the map fills the screen below the navigation controls. Pan it by
dragging, and zoom using a pinch or the on-screen buttons. Selecting a location
opens its details over the map; close them to return to the same map view. Zoom
out fully to see the entire map at once.

Audio stories are managed separately and are not linked to map locations.

## Recommended IDE Setup

- [VS Code](https://code.visualstudio.com/) + [Tauri](https://marketplace.visualstudio.com/items?itemName=tauri-apps.tauri-vscode) + [rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer)
