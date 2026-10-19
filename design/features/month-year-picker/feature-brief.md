# Month and year picker

**Problem.** Every month-based screen steps one month at a time with Prev/Next. Reaching a month a year back takes a dozen taps.

**Goal.** Let the user jump straight to any month and year that has data, from every screen that shows the month header: Dashboard, Buckets, Fixed entries and Savings trend. They all render the one shared `NavigableMonthHeader`, so one control covers all four.

**Constraints.**
- Prev/Next stay as they are.
- Only months inside the range of the user's data can be chosen (the app fills empty months between the first and last entry). Months outside it are shown dimmed and cannot be tapped.
- Every string needs English, Spanish and French. Month names are formatted by `getMonthNameDisplay`.
- Design system components only.

**Out of scope.** Day-level dates, free date ranges (Savings trend already has a custom range sheet), and any change to how entries are stored.
