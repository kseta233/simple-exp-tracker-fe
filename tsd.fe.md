# TSD — Frontend MVP

**Product:** Expense Tracker
**Platform:** Mobile-first web app / hybrid-ready FE
**Scope:** 4 screens only

## 1. Goal

Build a simple FE MVP for expense tracking with only these screens:

1. **Main Screen** — expense tracker timeline / transaction list
2. **Dashboard** — expense overview by category
3. **Chat Add Transaction** — add expense via chat input + image upload + confirmation cards
4. **Category CRUD** — manage local categories

Main transaction fields for MVP:

* `merchant`
* `dateTrx`
* `title`
* `amount`
* `category`

Optional but useful internally:

* `id`
* `createdAt`
* `attachmentUri`
* `source` (`manual_text` | `photo` | `text+photo`)

---

# 2. Product Boundaries

## In Scope

* Local-first FE flow
* Mobile-first layout
* Add transaction through chat flow
* Upload receipt/photo
* Parse and show draft transaction(s)
* Per-transaction confirmation card
* Save to timeline
* Dashboard by category
* Category CRUD stored locally

## Out of Scope

* Authentication
* Cloud sync
* Shared expenses / spaces
* Multi-user collaboration
* Budgeting
* OCR provider implementation detail on FE
* Advanced analytics
* Split bill / payer tracking
* Full receipt archive management

---

# 3. Screen List

## Screen A — Main / Expense Tracker

Purpose:

* User’s primary home
* Show expense timeline in descending date order
* Entry point to chat add flow
* Quick access to dashboard and categories

Core sections:

* Header
* Summary strip
* Timeline list
* Floating action / CTA to open chat add flow
* Bottom nav or top tabs

## Screen B — Dashboard

Purpose:

* Show spending grouped by category
* Simple analytical view

Core sections:

* Total spend
* Category chart/list
* Category breakdown cards
* Date filter for current month only in MVP

## Screen C — Chat Add Transaction

Purpose:

* Main input flow to add expenses
* Accept text, image, or both
* Produce one or more draft transactions
* Let user verify/edit each draft before submit

Core sections:

* Minimal chat composer
* Image upload
* Parse result section
* Confirmation cards
* Submit all valid drafts

## Screen D — Category CRUD

Purpose:

* Create, rename, delete local categories
* Maintain selectable category list used in transactions

Core sections:

* Category list
* Add category form
* Edit category modal/sheet
* Delete confirmation

---

# 4. FE Navigation Structure

Recommended navigation:

* **Tab 1:** Expenses
* **Tab 2:** Dashboard
* **Tab 3:** Categories

Chat screen opens as:

* modal full-screen sheet from Main screen
  or
* dedicated route `/chat-add`

Recommended routes:

* `/expenses`
* `/dashboard`
* `/chat-add`
* `/categories`

---

# 5. State Model

## 5.1 Transaction Model

```ts
type Transaction = {
  id: string;
  merchant: string;
  title: string;
  amount: number;
  dateTrx: string; // ISO date or yyyy-mm-dd
  categoryId: string | null;
  categoryLabel: string;
  attachmentUri?: string | null;
  source: "manual_text" | "photo" | "text+photo";
  createdAt: string;
};
```

## 5.2 Draft Transaction Model

Used only in chat verification flow.

```ts
type DraftTransaction = {
  id: string;
  merchant: string;
  title: string;
  amount: number | null;
  dateTrx: string;
  categoryId: string | null;
  categoryLabel: string | null;
  attachmentUri?: string | null;
  parseConfidence?: number | null;
  errors: {
    amount?: string;
    category?: string;
    merchant?: string;
    title?: string;
    dateTrx?: string;
  };
  isValid: boolean;
};
```

## 5.3 Category Model

```ts
type Category = {
  id: string;
  name: string;
  icon?: string | null;
  color?: string | null;
  createdAt: string;
  updatedAt: string;
  isDefault: boolean;
};
```

## 5.4 UI State

```ts
type AppState = {
  transactions: Transaction[];
  categories: Category[];
  draftTransactions: DraftTransaction[];
  filters: {
    categoryId?: string | null;
    month?: string; // yyyy-mm
  };
};
```

---

# 6. Storage Strategy

For MVP FE, use **local persistence**.

Recommended:

* `IndexedDB` or local DB abstraction if web/hybrid
* fallback to localStorage only for small prototype
* image attachment stored as:

  * local object URL for session preview
  * later can move to file storage/native storage

Local data buckets:

* `transactions`
* `categories`
* `draftTransactions` (ephemeral only, can be memory only)

---

# 7. Screen Specifications

---

## 7.1 Screen A — Main Expense Tracker

### Purpose

Show all saved transactions in a timeline list.

### Layout

1. Header

   * Title: `Expense Tracker`
   * Right actions:

     * Dashboard
     * Categories
2. Summary strip

   * This month total
   * Total transaction count
3. Filter row

   * Search by title/merchant
   * Category quick filter
4. Timeline list
5. Floating button: `Add Expense`

### Timeline Item

Each transaction row/card shows:

* amount
* title
* merchant
* category
* dateTrx
* image indicator if attached

Example:

```txt
Rp 45.000
Lunch
KFC · Food
24 Mar 2026
📎
```

### Sort Order

* newest `dateTrx` first
* tie-breaker: `createdAt` desc

### Empty State

* illustration/icon
* text: `No transactions yet`
* CTA: `Add your first expense`

### Interactions

* Tap row → optional detail bottom sheet
* Tap Add Expense → open Chat Add screen
* Tap filter chip → filter list
* Pull to refresh not needed for local MVP

### Validation / UX Rules

* render fast even with 500 items
* use list virtualization if framework supports it

---

## 7.2 Screen B — Dashboard

### Purpose

Simple category-based expense visibility.

### Layout

1. Header

   * Title: `Dashboard`
   * Back or tab nav
2. Total spend card

   * current month total
3. Category chart/list

   * donut chart or horizontal bars
4. Category breakdown list

   * category name
   * total amount
   * percentage of total
   * transaction count

### Data Rules

* based on saved transactions only
* default filter = current month
* uncategorized must appear if any data exists

### Recommended Visualization

For MVP, **horizontal bar list** is safer than heavy chart library.

Each row:

* category name
* total amount
* percent
* count

### Interaction

* tapping category filters the lower list or returns to Expenses with filter applied
* optional month selector later, not required in MVP

### Empty State

* `No expense data yet`
* CTA back to Add Expense

---

## 7.3 Screen C — Chat Add Transaction

### Purpose

Main input experience.

### Layout

1. Header

   * Title: `Add Expense`
   * Close button
2. Input area

   * multiline text field
   * upload image button
   * send/parse button
3. Draft result area

   * list of confirmation cards, one card per parsed transaction
4. Footer actions

   * `Submit All`
   * `Discard`

### Input Modes

Supported:

* text only
* image only
* text + image

Examples:

* `Lunch 45k KFC`
* `Coffee 32rb`
* upload receipt
* upload receipt + text `this has 2 items`

### Parse Result

System returns:

* single draft transaction
* or multiple draft transactions

Each draft must render as **1 editable card**.

### Confirmation Card Fields

Per card:

* Title
* Merchant
* Amount
* Date
* Category
* Attachment preview if exists

### Card Actions

* edit inline or open mini editor
* delete this draft
* duplicate not needed
* validation badge

### Submit Rules

* user can submit only valid draft cards
* invalid cards show inline errors
* `Submit All` saves all valid cards
* optionally block full submit if any invalid exists
* better MVP behavior:

  * show `X invalid cards need fixing`
  * disable submit until all valid

### Parsing FE Contract

FE should not depend on parsing internals.
It only expects payload like:

```ts
type ParseResponse = {
  drafts: DraftTransaction[];
};
```

### Validation Rules

Required:

* `amount > 0`
* `dateTrx` exists
* `category` selected or fallback `Uncategorized`
* at least one of `title` or `merchant` should exist

Recommended auto-fill behavior:

* if title empty and merchant exists → use merchant as title
* if merchant empty → allow blank
* default date = today
* default category = `Uncategorized`

### Image UX

* preview thumbnail before parse
* allow remove image before parse
* max 1 image for MVP
* if OCR/parser returns multiple transactions, same attachment can be linked to all drafts

### Edge Cases

#### Case 1 — parse fails completely

Show manual draft card with:

* empty title
* empty merchant
* amount null
* date today
* category uncategorized

#### Case 2 — multiple extracted transactions

Show stacked cards:

* `Transaction 1`
* `Transaction 2`
* etc.

#### Case 3 — duplicate send tap

Disable send while parsing

#### Case 4 — partial extracted values

Still show card and let user edit

---

## 7.4 Screen D — Category CRUD

### Purpose

Manage local categories used in transaction tagging.

### Layout

1. Header

   * Title: `Categories`
2. Add category input

   * text input
   * add button
3. Category list

   * each row: name, edit, delete
4. Fixed default category:

   * `Uncategorized`

### CRUD Rules

#### Create

* name required
* trimmed
* unique case-insensitive

#### Edit

* rename category
* updates future transaction references by `categoryId`
* current transaction display updates automatically from latest category name

#### Delete

Allowed if category is not protected.
Options:

* if category used by transactions:

  * remap affected transactions to `Uncategorized`
* then delete

#### Protected categories

At minimum:

* `Uncategorized` cannot be deleted

### Empty State

Not likely, since `Uncategorized` always exists.

---

# 8. Component Breakdown

## Shared Components

* `AppHeader`
* `PrimaryButton`
* `TextField`
* `CurrencyInput`
* `DateInput`
* `CategorySelect`
* `EmptyState`
* `BottomSheet`
* `ConfirmDialog`
* `AttachmentPreview`

## Expense Components

* `TransactionList`
* `TransactionCard`
* `TransactionFilterBar`
* `SummaryStrip`

## Dashboard Components

* `DashboardSummaryCard`
* `CategoryBarList`
* `CategoryBreakdownRow`

## Chat Components

* `ChatComposer`
* `UploadButton`
* `DraftTransactionCard`
* `DraftTransactionEditor`
* `ParseStatusBanner`

## Category Components

* `CategoryList`
* `CategoryRow`
* `CategoryForm`

---

# 9. State Management

For MVP, recommended:

* lightweight global store
* examples: Zustand / Redux Toolkit / Context + reducer

Suggested split:

* `transactionStore`
* `categoryStore`
* `chatDraftStore`

Why:

* chat drafts are transient
* categories are shared across screens
* dashboard and timeline depend on same transaction source

---

# 10. Derived Selectors

Useful FE selectors:

```ts
getTransactionsByMonth(month)
getTransactionsByCategory(categoryId)
getCurrentMonthTotal()
getCategoryBreakdown(month)
getRecentTransactions(limit)
getCategoryUsageCount(categoryId)
```

Dashboard should consume selectors, not raw list transforms inside components.

---

# 11. Data Flow

## 11.1 Add Transaction Flow

1. User opens Chat Add screen
2. User enters text and/or uploads image
3. FE calls parse function/service
4. FE receives `draftTransactions`
5. User edits each draft card
6. User taps `Submit All`
7. FE validates all cards
8. FE converts drafts → saved transactions
9. Store persists transactions locally
10. Navigate back to Main screen
11. Timeline and dashboard auto-refresh from store

## 11.2 Category Change Flow

1. User edits category name
2. Category store updates
3. Transactions still point to same `categoryId`
4. Timeline/dashboard labels refresh automatically

## 11.3 Delete Category Flow

1. User taps delete
2. FE checks usage count
3. If used:

   * remap linked transactions to `Uncategorized`
4. Delete category
5. Refresh dashboard/timeline selectors

---

# 12. Validation Rules Summary

## Transaction

* amount: required, numeric, `> 0`
* dateTrx: required, valid date
* title: optional but recommended
* merchant: optional
* category: fallback to `Uncategorized`

## Category

* name required
* unique case-insensitive
* max length suggested: 30 chars
* cannot delete `Uncategorized`

## Chat Parse Submission

* cannot submit while parsing
* cannot submit if any draft invalid

---

# 13. Error Handling

## Parse Error

Message:

* `We couldn’t fully read this. Please review before saving.`

Behavior:

* still create manual/editable draft card if possible

## Image Error

Message:

* `Image upload failed. Please try another photo.`

## Save Error

For local-first MVP, save errors should be rare.
If persistence fails:

* toast
* keep drafts in memory
* do not dismiss screen

## Category Conflict Error

* `Category already exists`

---

# 14. UI/UX Guidelines

## General

* mobile-first
* large tap targets
* low cognitive load
* clear primary action per screen

## Main Screen

* timeline must feel like “source of truth”
* amount visually dominant
* title/merchant secondary
* category as chip/badge

## Dashboard

* prioritize readability over fancy charts
* use bar list if chart adds complexity

## Chat Screen

* do not mimic full messaging app
* treat chat as an input workflow, not conversation history
* confirmations are the real focus

## Category Screen

* inline CRUD, minimal friction

---

# 15. Performance Requirements

* app load under 2 seconds on typical mobile device
* timeline render smooth for 500 transactions
* dashboard recomputation should use memoized selectors
* image preview compressed client-side if possible
* parse request must show loading state immediately

---

# 16. Accessibility

* proper labels on inputs
* buttons must have clear text
* amount/date/category fields keyboard accessible
* color should not be sole validation signal
* include text error messages

---

# 17. Suggested FE Folder Structure

```txt
src/
  app/
    routes/
  screens/
    expenses/
    dashboard/
    chat-add/
    categories/
  components/
    common/
    transaction/
    dashboard/
    chat/
    category/
  stores/
    transactionStore.ts
    categoryStore.ts
    chatDraftStore.ts
  services/
    parseService.ts
    localDb.ts
  utils/
    currency.ts
    date.ts
    validators.ts
    category.ts
  types/
    transaction.ts
    category.ts
    draft.ts
```

---

# 18. API / Service Contracts for FE

Even if backend/parsing changes later, FE should depend on stable contract.

## Parse Input

```ts
type ParseRequest = {
  text?: string;
  attachmentUri?: string | null;
};
```

## Parse Output

```ts
type ParseResponse = {
  drafts: DraftTransaction[];
};
```

## Local Persistence Interface

```ts
saveTransactions(transactions: Transaction[]): Promise<void>
getTransactions(): Promise<Transaction[]>
saveCategory(category: Category): Promise<void>
getCategories(): Promise<Category[]>
updateCategory(categoryId: string, patch: Partial<Category>): Promise<void>
deleteCategory(categoryId: string): Promise<void>
```

---

# 19. Default Data Setup

On first app launch:

* create default category:

  * `Uncategorized`
* optionally seed:

  * Food
  * Transport
  * Shopping
  * Bills
  * Entertainment

Recommended for smoother UX:

* seed 5 default categories
* still allow full CRUD except `Uncategorized`

---

# 20. Acceptance Criteria

## Main Screen

* user can view saved transactions in a timeline
* list sorted by newest date
* new saved transaction appears immediately
* filter by category works

## Dashboard

* current month total is correct
* category grouping is correct
* zero-data state works
* tapping category can filter related transactions

## Chat Add Transaction

* user can input text
* user can upload one image
* system can show one or more draft cards
* each draft is editable
* submit saves valid drafts to timeline
* parse failure still allows manual completion

## Category CRUD

* user can create category
* user can rename category
* user can delete non-protected category
* deleting used category remaps old transactions to `Uncategorized`

---

# 21. Recommended MVP Build Order

## Phase 1

* local models
* category store
* transaction store
* main timeline screen

## Phase 2

* category CRUD screen

## Phase 3

* chat add screen with manual draft cards first

## Phase 4

* parser integration for text/photo

## Phase 5

* dashboard aggregation screen

---

# 22. Final FE Recommendation

For this MVP, the best FE principle is:

**“Local-first, draft-first, confirmation-first.”**

That means:

* transactions are simple
* parsing can be imperfect
* confirmation cards are the real safety layer
* timeline is the source of truth
* dashboard is derived only from saved transactions
