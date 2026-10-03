export const COLLECTION_LAYOUTS = Object.freeze(["table", "cards"]);
export const SORT_DIRECTIONS = Object.freeze(["asc", "desc"]);

function uniqueStrings(values) {
  return [...new Set(Array.from(values || [], (value) => String(value || "").trim()).filter(Boolean))];
}

export function normalizeText(value) {
  return String(value || "")
    .normalize("NFKC")
    .replace(/[\u064A\u0649]/g, "ی")
    .replace(/\u0643/g, "ک")
    .toLocaleLowerCase("fa");
}

function normalizeSort(sort) {
  if (!sort) return undefined;
  const field = String(sort.field || "").trim();
  const direction = String(sort.direction || "asc");
  if (!field) throw new TypeError("Collection sort field is required.");
  if (!SORT_DIRECTIONS.includes(direction)) throw new TypeError("Collection sort direction must be asc or desc.");
  return Object.freeze({ field, direction });
}

function normalizeFilter(filter) {
  const field = String(filter?.field || "").trim();
  const operator = String(filter?.operator || "").trim();
  if (!field || !operator) throw new TypeError("Collection filters require field and operator.");
  return Object.freeze({ field, operator, value: filter.value });
}

export function createCollectionView(input) {
  if (!input || typeof input !== "object") throw new TypeError("Collection view must be an object.");
  const id = String(input.id || "").trim();
  const layout = String(input.layout || "table");
  const columns = uniqueStrings(input.columns);
  const visibleColumns = uniqueStrings(input.visibleColumns || columns);
  if (!id) throw new TypeError("Collection view id is required.");
  if (!COLLECTION_LAYOUTS.includes(layout)) throw new TypeError("Collection layout must be table or cards.");
  if (visibleColumns.some((column) => !columns.includes(column))) {
    throw new TypeError("Visible columns must be present in the collection columns.");
  }
  return Object.freeze({
    id,
    title: String(input.title || "").trim(),
    layout,
    columns: Object.freeze(columns),
    visibleColumns: Object.freeze(visibleColumns),
    sort: normalizeSort(input.sort),
    filters: Object.freeze(Array.from(input.filters || [], normalizeFilter)),
    density: input.density === "compact" ? "compact" : "comfortable",
    version: 1,
  });
}

export function collectionViewIsDirty(current, saved) {
  return JSON.stringify(createCollectionView(current)) !== JSON.stringify(createCollectionView(saved));
}

export function createViewPreferenceStore({ namespace, storage }) {
  const normalizedNamespace = String(namespace || "").trim();
  if (!normalizedNamespace) throw new TypeError("A preference namespace is required.");
  if (!storage || typeof storage.getItem !== "function" || typeof storage.setItem !== "function") {
    throw new TypeError("A Storage-compatible adapter is required.");
  }
  const keyFor = (id) => `${normalizedNamespace}:collection-view:${String(id || "").trim()}`;
  return Object.freeze({
    load(id) {
      const raw = storage.getItem(keyFor(id));
      if (!raw) return undefined;
      try {
        return createCollectionView(JSON.parse(raw));
      } catch {
        return undefined;
      }
    },
    save(view) {
      const normalized = createCollectionView(view);
      storage.setItem(keyFor(normalized.id), JSON.stringify(normalized));
      return normalized;
    },
    remove(id) {
      if (typeof storage.removeItem === "function") storage.removeItem(keyFor(id));
    },
  });
}

export function searchCommands(query, commands) {
  const terms = normalizeText(query).split(/\s+/).filter(Boolean);
  return Array.from(commands || [])
    .filter((command) => command && command.id && command.title)
    .map((command) => ({ ...command, searchable: normalizeText([command.title, command.description, ...(command.keywords || [])].join(" ")) }))
    .filter((command) => terms.every((term) => command.searchable.includes(term)))
    .sort((left, right) => {
      const leftStart = terms.filter((term) => normalizeText(left.title).startsWith(term)).length;
      const rightStart = terms.filter((term) => normalizeText(right.title).startsWith(term)).length;
      return rightStart - leftStart || normalizeText(left.title).localeCompare(normalizeText(right.title), "fa");
    })
    .map(({ searchable, ...command }) => Object.freeze(command));
}
