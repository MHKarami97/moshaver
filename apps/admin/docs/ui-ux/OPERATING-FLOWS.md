# Admin Operating Flows

This is the product-flow contract for the Moshaver Admin application. It complements the capability matrix: a capability is not considered usable until the named actor can discover the entry point, understand the current state, complete the action, and recover from errors.

## Shared rules

- Every route must have a capability-safe entry in navigation or a contextual deep link, a clear primary action, and a useful empty state.
- Every mutation must expose pending, success, error, and refresh behavior. Destructive actions require the shared confirmation modal.
- Every modal must state its outcome, scope, close/cancel path, validation state, and what changes after success.
- Collections use the shared toolbar for search, filters, result context, clear state, and actions. A segmented control is reserved for mutually exclusive views or states.

## Page-composition contract

The shared workspace components define the layout boundary for conventional Admin pages. Feature code should compose its content inside these bounds instead of recreating competing headers, card grids, and scroll containers.

| Page shape                | Header and primary action                                                                                                                | Columns and rows                                                                                                                                                | Scroll owner and persistent controls                                                                                                                                                                             |
| ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Standard management route | `ManagementPageHeader`; one outcome-oriented primary action sits in its action lane and becomes a full-width row on narrow screens       | One content column by default. Use a two or three-column card grid only when each item is independently actionable; use `md:2` and `xl:3` as the normal maximum | The document scrolls. Do not create a fixed-height inner list unless scanning a long operational queue materially benefits from it.                                                                              |
| Collection / inbox        | `AdminList` supplies the collection heading; page-level actions stay in the page header and collection-local actions remain in `actions` | Keep toolbar above rows. Compact tables own dense data; cards are reserved for items with an action and 2–5 facts                                               | If bounded, `AdminList scrollable` is the sole vertical scroll owner, with `stickyHeader` and an optional `stickyFooter` for pagination/bulk actions. Feature rows must not introduce another vertical scroller. |
| Master-detail workspace   | Directory controls and create action belong to the directory; contextual mutations belong to the selected detail                         | Single column below `xl`; at `xl`, directory is the flexible first column and detail is a 420px+ stable reading column                                          | Use `ManagementMasterDetail`. Either it owns the detail scroll (`detailScroll`) or the detail surface does—never both.                                                                                           |
| Focused editor / form     | Name the outcome in the header/modal and keep the saving action close to the final required fields                                       | One readable form column; use two fields per row only from `sm` upward and only for short related values                                                        | The form body scrolls; save/cancel controls remain visible in a sticky footer when the form can exceed the viewport.                                                                                             |

For each route, test loading, empty, error, permission, and narrow-screen states. Every sticky control needs a non-sticky mobile flow and visible keyboard focus.

## Route flows

| Workspace              | Actor and entry                                            | Primary flow                                                                                                                   | Recovery and exit                                                                                                                    |
| ---------------------- | ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------ |
| Dashboard              | Any authorized staff member via the home route             | Read role-specific metrics, then choose a capability-filtered “next step” that states its outcome before leaving the workspace | Refresh summary; attention items link to the student or notification action; unavailable capabilities are never offered as shortcuts |
| Students               | Staff with `students.read` via navigation/search/deep link | Find a student, open detail, review context, then use a capability-gated tab/action                                            | Back returns to the preserved directory filter; missing results explain how to clear filters                                         |
| Planner                | Staff with `plans.read` from student context               | Pick student/date/view, inspect tasks, create or edit in a focused modal, then publish when allowed                            | Keyboard shortcuts are supplementary; close returns focus to the canvas and errors preserve the draft                                |
| Exams and questions    | Assessment staff via Education                             | Select an organization-scoped exam, manage questions/assignment/readiness, then publish                                        | Tables/cards communicate readiness; destructive question actions require confirmation                                                |
| Learning               | Staff with `learning.read` from a student context          | Find a learning item, review/history or create/edit it in a modal                                                              | No selected student gives an explicit next step; mutations refresh the active student collection                                     |
| Reports and follow-up  | Staff with report/recovery capability                      | Choose student/date range, scan results, then decide a pending recovery request                                                | URL-backed filters make shared links safe; decision feedback states the result                                                       |
| Access                 | Organization/platform administrators                       | Open organizations or users, select the scoped workspace, manage memberships/features through guided modals                    | Cross-organization requests are rejected by the server; modal lists only active valid members                                        |
| Notifications and live | Authorized staff via Communication                         | Filter incoming signals, select a student/event, then navigate to the relevant operational workspace                           | Empty state differentiates no activity from a failed refresh; mobile has an explicit panel switch                                    |
| System and settings    | Account owner or authorized platform admin                 | Review status, update account settings, or use a privileged release/database tool                                              | Dangerous operations describe impact and require confirmation; returning preserves the current admin context                         |

## Modal checklist

Before adding or changing a modal, verify:

1. Title names the user outcome, not only the entity.
2. Description states scope and irreversible effects where relevant.
3. Fields have labels, inline validation, and a disabled/pending primary action.
4. Cancel and Escape leave data unchanged; success closes, announces feedback, and invalidates the affected collection.
5. The trigger receives focus after close and is discoverable on narrow RTL layouts.

## Evidence

Use feature tests for data/mutation behavior, shared UI tests for accessibility contracts, and role-login browser smoke against a disposable seeded backend for end-to-end proof.
