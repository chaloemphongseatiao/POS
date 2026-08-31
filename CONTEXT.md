# POS Domain

Point-of-sale system for a retail/convenience store. This file is the glossary for terms not already self-explanatory from the schema.

## Language

**LedgerEntry**:
A manually recorded cash inflow or outflow not tied to an `Order` or `StockMovement` — e.g. rent, utilities, salary, misc income. Belongs to the accounting/ledger feature, kept separate from sales revenue (`Order`) and stock cost (`StockMovement`/`Product.costPrice`) to avoid double-counting.
_Avoid_: Transaction (collides with Prisma `$transaction`), Record, Journal entry (implies double-entry bookkeeping, which this is not)

**LedgerCategory**:
A user-managed label for grouping `LedgerEntry` rows (e.g. ค่าเช่า, ค่าน้ำไฟ, เงินเดือน). Distinct from `Category`, which groups `Product`.
_Avoid_: Category (reserved for product categories)

**Income / Expense**:
The two `LedgerEntry` directions. Income is cash in, Expense is cash out. Till sales revenue is not Income in this sense: it is read straight off `Order`, never keyed as a `LedgerEntry`. The profit-and-loss figure adds the two sources together, so a sale entered as an Income row as well would be counted twice.
