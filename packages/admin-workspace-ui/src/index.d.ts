export const COLLECTION_LAYOUTS: readonly ["table", "cards"];
export const SORT_DIRECTIONS: readonly ["asc", "desc"];

export type CollectionLayout = (typeof COLLECTION_LAYOUTS)[number];
export type CollectionDensity = "compact" | "comfortable";
export type CollectionSort = Readonly<{ field: string; direction: (typeof SORT_DIRECTIONS)[number] }>;
export type CollectionFilter = Readonly<{ field: string; operator: string; value: unknown }>;
export type CollectionView = Readonly<{
  id: string;
  title: string;
  layout: CollectionLayout;
  columns: readonly string[];
  visibleColumns: readonly string[];
  sort?: CollectionSort;
  filters: readonly CollectionFilter[];
  density: CollectionDensity;
  version: 1;
}>;

export type StorageAdapter = Readonly<{
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem?(key: string): void;
}>;

export type CommandDefinition = Readonly<{
  id: string;
  title: string;
  description?: string;
  keywords?: readonly string[];
  [key: string]: unknown;
}>;

export function normalizeText(value: unknown): string;
export function createCollectionView(input: Partial<CollectionView> & Pick<CollectionView, "id">): CollectionView;
export function collectionViewIsDirty(current: CollectionView, saved: CollectionView): boolean;
export function createViewPreferenceStore(input: { namespace: string; storage: StorageAdapter }): Readonly<{
  load(id: string): CollectionView | undefined;
  save(view: CollectionView): CollectionView;
  remove(id: string): void;
}>;
export function searchCommands<T extends CommandDefinition>(query: string, commands: readonly T[]): readonly T[];
