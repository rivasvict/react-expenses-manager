import React, { useMemo, useState } from "react";
import dayjs from "dayjs";
import { Button, Form } from "react-bootstrap";
import {
  InputDate,
  InputNumber,
  InputText,
} from "../common/Forms";
import CategorySelector from "../common/ExpensesManager/CategorySelector";
import { getEntryCategoryOption } from "../../helpers/entriesHelper/entriesHelper";
import { IncomingItem } from "../../helpers/syncMergeHelper/syncMergeHelper";
import { getItemFacts } from "./itemFacts";

interface ReviewItemCardProps {
  item: IncomingItem;
  // How many history states this card's decision covers (RFC §4.1): 1 for
  // an entry or an edit, N for a brand-new fixed entry / bucket.
  stateCount?: number;
  buckets: any;
  unbudgetedCategories: string[];
  onAccept: (item: IncomingItem, modified: boolean) => void;
  onReject: () => void;
  onCancelReview: () => void;
}

// Inline Modify form (DESIGN 4.3.2): the same field set EntryForm uses,
// plus the native date input. Saving records the item as accepted with
// the EDITED values — the modified value is what gets staged (EC-5).
const ModifyForm = ({
  item,
  buckets,
  unbudgetedCategories,
  onSave,
  onCancel,
}: {
  item: IncomingItem;
  buckets: any;
  unbudgetedCategories: string[];
  onSave: (edited: IncomingItem) => void;
  onCancel: () => void;
}) => {
  const source =
    item.kind === "entry"
      ? item.entry
      : item.kind === "fixed"
        ? item.fixed!.state
        : item.bucket!.state;
  const [amount, setAmount] = useState(
    String(item.kind === "bucket" ? source.limit : source.amount)
  );
  const [description, setDescription] = useState(source.description || "");
  const [categoriesPath, setCategoriesPath] = useState(
    source.categories_path || ""
  );
  const initialDate =
    item.kind === "entry" ? dayjs(source.date).format("YYYY-MM-DD") : "";
  const [date, setDate] = useState(initialDate);

  // Nothing upstream of this form validates what the user types, and what
  // it produces is written to localStorage AND uploaded to every member of
  // the party in one action — so it is validated here.
  const isAmountValid =
    amount.trim() !== "" && Number.isFinite(Number(amount));
  const isDateValid = item.kind !== "entry" || dayjs(date).isValid();
  const canSave = isAmountValid && isDateValid;

  // The field only carries a day, so rebuilding the timestamp from it would
  // move an 18:40 entry to local midnight and re-sync it to every member as
  // a change the user never made. The original time of day is kept.
  const nextTimestamp = (): number => {
    if (date === initialDate) return source.date;
    const original = dayjs(source.date);
    const picked = dayjs(date);
    if (!original.isValid()) return picked.valueOf();
    return picked
      .hour(original.hour())
      .minute(original.minute())
      .second(original.second())
      .millisecond(original.millisecond())
      .valueOf();
  };

  const entryType =
    item.kind === "entry" ? item.entry.type : item.fixed?.type || "expense";
  // The options are this device's categories, so an incoming item filed
  // under a category this device does not have would read as "Select a
  // category" while its real one sat untouched in the data. Its own
  // category is offered as an extra option, spelled exactly as stored, so
  // the reviewer sees what they are deciding on and saving without
  // touching the field keeps the value byte for byte.
  const ownCategory = useMemo(() => {
    const path = source.categories_path || "";
    const segments = path.split(",").filter((segment) => segment.trim() !== "");
    return segments.length ? { path, name: segments.join(", ") } : null;
  }, [source.categories_path]);

  const categoryOptions = useMemo(() => {
    const options =
      getEntryCategoryOption(entryType, buckets, unbudgetedCategories) || [];
    if (!ownCategory) return options;
    // CategorySelector wraps an option's value as `,{value},`, so the extra
    // option is only representable for the canonical `,category,` format.
    const ownValue = ownCategory.path.replace(/^,/, "").replace(/,$/, "");
    if (`,${ownValue},` !== ownCategory.path) return options;
    const isKnown = options.some(
      (option: any) => `,${option.value},` === ownCategory.path
    );
    return isKnown
      ? options
      : [...options, { name: ownCategory.name, value: ownValue }];
  }, [entryType, buckets, unbudgetedCategories, ownCategory]);

  const handleSave = (event: React.FormEvent) => {
    event.preventDefault();
    if (!canSave) return;
    if (item.kind === "entry") {
      onSave({
        ...item,
        entry: {
          ...item.entry,
          amount,
          description,
          categories_path: categoriesPath,
          date: nextTimestamp(),
        },
      });
    } else if (item.kind === "fixed") {
      onSave({
        ...item,
        fixed: {
          ...item.fixed!,
          state: {
            ...item.fixed!.state,
            amount,
            description,
            categories_path: categoriesPath,
          },
        },
      });
    } else {
      onSave({
        ...item,
        bucket: {
          ...item.bucket!,
          state: { ...item.bucket!.state, limit: Number(amount) },
        },
      });
    }
  };

  return (
    <Form className="review-card__modify" onSubmit={handleSave}>
      <Form.Group>
        <Form.Label htmlFor="modify-amount">
          {item.kind === "bucket" ? "Monthly allowance" : "Amount"}
        </Form.Label>
        <InputNumber
          id="modify-amount"
          name="amount"
          value={amount}
          onChange={(event: any) => setAmount(event.currentTarget.value)}
        />
        {!isAmountValid && (
          <Form.Text className="review-card__field-error" role="alert">
            Enter a number.
          </Form.Text>
        )}
      </Form.Group>
      {item.kind !== "bucket" && (
        <React.Fragment>
          <Form.Group>
            <Form.Label htmlFor="modify-description">Description</Form.Label>
            <InputText
              id="modify-description"
              name="description"
              value={description}
              onChange={(event: any) =>
                setDescription(event.currentTarget.value)
              }
            />
          </Form.Group>
          <Form.Group>
            {/* CategorySearchSelect names the combobox with
                aria-labelledby={`${id}-label`}, so the label needs the id
                as well as htmlFor — same as EntryForm's. */}
            <Form.Label id="modify-category-label" htmlFor="modify-category">
              Category
            </Form.Label>
            <CategorySelector
              id="modify-category"
              name="categories"
              value={categoriesPath}
              categoryOptions={categoryOptions}
              emptyOptionLabel="Select a category"
              handleChange={(event: any) =>
                setCategoriesPath(event.currentTarget.value)
              }
            />
          </Form.Group>
        </React.Fragment>
      )}
      {item.kind === "entry" && (
        <Form.Group>
          <Form.Label htmlFor="modify-date">Date</Form.Label>
          <InputDate
            id="modify-date"
            name="date"
            value={date}
            onChange={(event: any) => setDate(event.currentTarget.value)}
          />
          {!isDateValid && (
            <Form.Text className="review-card__field-error" role="alert">
              Enter a date.
            </Form.Text>
          )}
        </Form.Group>
      )}
      <Button
        variant="primary"
        type="submit"
        className="full-width"
        disabled={!canSave}
      >
        Save & accept
      </Button>
      <Button
        variant="secondary"
        className="full-width vertical-standard-space"
        onClick={onCancel}
      >
        Cancel
      </Button>
    </Form>
  );
};

/**
 * One incoming item, one screen (DESIGN 4.3.1, AC-3.4): kind badge,
 * attribution ("Added by Tom" / "Added anonymously"), the item's facts and
 * Accept / Modify / Reject with item-specific accessible names.
 */
const ReviewItemCard = ({
  item,
  stateCount = 1,
  buckets,
  unbudgetedCategories,
  onAccept,
  onReject,
  onCancelReview,
}: ReviewItemCardProps) => {
  const [isModifying, setIsModifying] = useState(false);
  const facts = getItemFacts(item);

  return (
    <div className="review-card">
      <div className="review-card__header">
        <span className={`review-card__kind review-card__kind--${facts.tone || "neutral"}`}>
          {facts.kindLabel}
        </span>
        <span className="review-card__attribution text-secondary">
          {facts.attribution}
        </span>
      </div>
      {isModifying ? (
        <ModifyForm
          item={item}
          buckets={buckets}
          unbudgetedCategories={unbudgetedCategories}
          onSave={(edited) => {
            setIsModifying(false);
            onAccept(edited, true);
          }}
          onCancel={() => setIsModifying(false)}
        />
      ) : (
        <React.Fragment>
          {facts.amountText && (
            <p className={`review-card__amount review-card__amount--${facts.tone || "neutral"}`}>
              {facts.amountText}
            </p>
          )}
          {facts.description && (
            <p className="review-card__description">{facts.description}</p>
          )}
          {facts.categories && (
            <p className="review-card__categories text-secondary">
              {facts.categories}
            </p>
          )}
          {facts.dateText && (
            <p className="review-card__date text-secondary">{facts.dateText}</p>
          )}
          {stateCount > 1 && (
            <p className="review-card__history text-secondary">
              New here — your decision covers its full history ({stateCount}{" "}
              changes).
            </p>
          )}
          <div className="review-card__actions">
            <Button
              variant="primary"
              aria-label={`Accept ${facts.shortLabel}`}
              onClick={() => onAccept(item, false)}
            >
              Accept
            </Button>
            {!facts.removed && (
              <Button
                variant="secondary"
                aria-label={`Modify ${facts.shortLabel}`}
                onClick={() => setIsModifying(true)}
              >
                Modify
              </Button>
            )}
            <Button
              variant="danger"
              aria-label={`Reject ${facts.shortLabel}`}
              onClick={onReject}
            >
              Reject
            </Button>
          </div>
          <button
            type="button"
            className="review-card__cancel-link"
            onClick={onCancelReview}
          >
            Cancel review
          </button>
        </React.Fragment>
      )}
    </div>
  );
};

export default ReviewItemCard;
