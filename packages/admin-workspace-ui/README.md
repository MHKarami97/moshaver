# @moshaver/admin-workspace-ui

Framework- and domain-neutral operational-workspace logic extracted from the Moshaver Admin UI. It deliberately contains no routes, API clients, roles, permissions, translations, React components, or education entities.

## What it provides

- normalized table/card collection view preferences;
- ordered/visible column preferences;
- a versioned storage adapter for local or host-provided persistence;
- filter/sort-aware dirty/reset semantics for a view bar;
- generic command indexing and search ranking.

## What stays in the host application

The host owns authorization, data fetching, routing, translations, icons, and rendering. Never treat view visibility or a command result as authorization.

```js
const {
  createCollectionView,
  createViewPreferenceStore,
  searchCommands,
} = require("@moshaver/admin-workspace-ui");

const view = createCollectionView({
  id: "students",
  layout: "table",
  columns: ["name", "status", "lastSeen"],
  visibleColumns: ["name", "status"],
  sort: { field: "name", direction: "asc" },
});

const store = createViewPreferenceStore({
  namespace: "my-product",
  storage: window.localStorage,
});
store.save(view);

const results = searchCommands("new report", commandDefinitions);
```

Use the package through its root entry point only.
