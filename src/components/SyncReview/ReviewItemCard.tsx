import React, { useState } from "react";
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
  const [date, setDate] = useState(
    item.kind === "entry" ? dayjs(source.date).format("YYYY-MM-DD") : ""
  );

  const entryType =
    item.kind === "entry" ? item.entry.type : item.fixed?.type || "expense";
  const categoryOptions = getEntryCategoryOption(
    entryType,
    buckets,
    unbudgetedCategories
  );

  const handleSave = (event: React.FormEvent) => {
    event.preventDefault();
    if (item.kind === "entry") {
      onSave({
        ...item,
        entry: {
          ...item.entry,
          amount,
          description,
          categories_path: categoriesPath,
          date: dayjs(date).valueOf(),
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
          state: { ...item.bucket!.state, limit: Number(amount) || 0 },
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
            <Form.Label htmlFor="modify-category">Category</Form.Label>
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
        </Form.Group>
      )}
      <Button variant="primary" type="submit" className="full-width">
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
