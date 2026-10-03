import test from "node:test";
import assert from "node:assert/strict";
import {
  collectionViewIsDirty,
  createCollectionView,
  createViewPreferenceStore,
  searchCommands,
} from "../src/index.js";

test("normalizes reusable collection preferences without application data", () => {
  const view = createCollectionView({
    id: "records",
    layout: "table",
    columns: ["name", "state", "name"],
    visibleColumns: ["state", "name"],
    sort: { field: "name", direction: "asc" },
    filters: [{ field: "state", operator: "equals", value: "open" }],
  });
  assert.deepEqual(view.columns, ["name", "state"]);
  assert.equal(view.density, "comfortable");
  assert.equal(collectionViewIsDirty(view, { ...view, density: "compact" }), true);
});

test("persists a versioned collection preference behind a host storage adapter", () => {
  const values = new Map();
  const store = createViewPreferenceStore({
    namespace: "another-project",
    storage: { getItem: (key) => values.get(key) || null, setItem: (key, value) => values.set(key, value), removeItem: (key) => values.delete(key) },
  });
  store.save({ id: "orders", columns: ["id"], visibleColumns: ["id"] });
  assert.equal(store.load("orders")?.id, "orders");
  store.remove("orders");
  assert.equal(store.load("orders"), undefined);
});

test("searches generic commands without relying on application routes or permissions", () => {
  const results = searchCommands("گزارش جدید", [
    { id: "report", title: "گزارش جدید", keywords: ["create report"] },
    { id: "student", title: "دانش‌آموز جدید" },
  ]);
  assert.deepEqual(results.map((item) => item.id), ["report"]);
});
