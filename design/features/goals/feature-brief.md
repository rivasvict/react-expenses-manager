# Goals: put part of each month's savings towards things you want

## Problem

The app tells you how much you saved each month (incomes minus expenses) and,
on Savings trend, how much a range of months added up to. It cannot tell you
**what that money is for**, or whether you are putting enough aside to reach
something by a date: an emergency fund by June, a trip by August, a laptop by
February.

## Goal

Let the user set **goals** (a target amount by a date) and fund them, month by
month, from the savings the app already calculates, so they can see for each
goal:

- how far along it is (**% progress**, saved so far / target);
- when it will be reached at the current pace (**projected completion**);
- whether that is in time (**On track** / **Behind**), and when it is done
  (**Completed**);
- what changed in its setup, and when.

No new kind of entry is recorded: a goal's money is a **share of the month's
savings** (the dashboard figure), never a separate transfer. The dashboard,
Summary, Buckets and Savings trend figures do not change.

## Definitions

- **Savings of a month** (S): the month's incomes minus its expenses, as on the
  dashboard. **Income of a month** (I): the month's raw incomes, before
  expenses.
- **Rule** of a goal: either a **fixed amount** per month ($400) or a
  **percentage of the month's income** (8% of I).
- **Need of a goal** in a month: its fixed amount, or its % × I. **Total need**:
  the sum of the needs of every open goal.
- **Funded** in a month: the part of S assigned to a goal when that month is
  evaluated. **Free savings**: S minus everything funded.
- **Saved so far** of a goal: its optional starting amount plus everything
  funded to it in every evaluated month since it was created.

## Rules (from the owner)

1. A goal's rule is a fixed amount or a % of the month's **total income**.
2. Goals are **evaluated at the end of each month**. The current month is shown
   as *in progress* (what it would fund if it ended today), never counted.
3. **Editing or deleting an entry of an earlier month changes that month's
   funding** and so every goal's figures: funding is always recalculated from
   the entries, never stored as a frozen number.
4. A goal is evaluated **from the month it is created in**; earlier months
   never fund it.
5. **Two modes**, chosen in **Settings → Goals mode**:
   - **Strict**: every goal has a **priority** (1 = most important). Rules may
     be fixed or %. If S ≥ total need, every goal gets its need ("funded").
     If S < total need, goals are funded **in priority order** until S runs
     out, so the shortfall falls on the lowest priorities first.
   - **Relaxed**: no priorities; **every rule is a %** of income. If
     S ≥ total need, every goal gets its % × I. If S < total need, S is shared
     between the goals **in proportion to their percentages** (a 10% goal and
     a 5% goal split it 2 : 1).
6. **Dates** (the target date) are set by the user.
7. When a goal reaches its target it shows as **Completed**; the user
   **closes** it once the money has been used. A closed goal stops taking
   money and moves to a *Closed* list.
8. Every open goal shows **On track** or **Behind**.
9. Completed goals have a clear completed indication.
10. Goals can be **edited** (name, target, date, rule, priority) or
    **removed**.
11. **Backwards compatible**: goals are a new, optional key in the stored data
    and the backup; data without it simply has no goals. Nothing existing is
    rewritten.
12. **One mode for all goals.** The first goal is created in the mode set in
    Settings; while any goal (open or closed) exists, the mode cannot be
    changed. To switch, the user removes every goal. Settings and the add-goal
    screen both explain this.

## Decisions taken for the design (owner to confirm)

These are not in the rules above; the designs assume them and
`ui/decision.md` lists them again.

- **D1. A month with S ≤ 0 funds nothing.** Funding is never negative, so a bad
  month never takes money back out of a goal; it just adds nothing.
- **D2. A goal stops at its target.** Once a goal is Completed it takes no more
  money; in Strict mode its share goes to the next priority, in Relaxed mode
  it is shared among the others.
- **D3. Relaxed shortfall is proportional** (rule 5 above). The literal
  alternative, "each goal gets its % of S", leaves most of S unassigned (two
  goals at 10% and 8% would get $62 and $49.60 of $620), so it was not used.
- **D4. A rule or priority edit applies from the month it is made in.** Earlier
  months keep the rule they were evaluated with; the change is listed in the
  goal's history. A target or date edit changes the projection at once.
- **D5. Projection pace** = average funding of the last 3 evaluated months (or
  fewer, if the goal is younger; none before its first evaluated month).
  **On track** when the projected completion is on or before the target date;
  **Behind** otherwise. Before the first month ends, the status is *Starts
  counting when November ends*.
- **D6. Shared, not per person.** Goals travel with the backup and sync like
  buckets (a household's goals). The data model keeps an owner-free goal so a
  later "mine / shared" choice can be added without migrating.
- **D7. Starting amount** is optional ("I already have $1,000 for this") and
  counts towards Saved so far, never towards any month.
- **D8. Free savings is not a goal**: it is what is left after funding and is
  shown, never assigned.

## Constraints

- Design system only (`design/system/`); reuse bucket cards, the bucket pace
  tick, bottom sheets, setting rows, underline tabs, callouts, the trend chart.
  No new tokens.
- Status is never colour alone: always a word (On track / Behind / Completed)
  and an icon.
- Every string in English, Spanish and French (Spanish runs ~30% longer);
  goal names are user data and never translated.
- Privacy mode hides figures on the dashboard only; a dashboard goal card
  follows it.
- The mobile tab bar is narrow: adding a tab has a cost.

## Out of scope

- Debt payoff goals, interest, linking real bank accounts.
- Moving money between goals by hand, or one-off extra contributions (a later
  feature could add them as an "extra this month" on top of the rule).
- Per-person goals (see D6).
- Notifications or reminders.
