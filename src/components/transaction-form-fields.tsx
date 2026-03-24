import { formatIdrDigitsInput } from "@/lib/utils/currency";

type CategoryOption = {
  id: string;
  name: string;
};

type TransactionFormValues = {
  title: string;
  merchant: string;
  amount: string;
  dateTrx: string;
  categoryId: string;
};

type TransactionFormErrors = {
  title?: string;
  merchant?: string;
  amount?: string;
  dateTrx?: string;
  category?: string;
};

type TransactionFormField = keyof TransactionFormValues;

export function TransactionFormFields({
  values,
  categories,
  errors,
  disabled,
  onChange
}: {
  values: TransactionFormValues;
  categories: CategoryOption[];
  errors?: TransactionFormErrors;
  disabled?: boolean;
  onChange: (field: TransactionFormField, value: string) => void;
}) {
  const formattedAmount = formatIdrDigitsInput(values.amount);

  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="space-y-1">
          <span className="text-xs font-medium text-[var(--ink-muted)]">Title</span>
          <input
            className="field"
            value={values.title}
            placeholder="Title"
            disabled={disabled}
            onChange={(event) => onChange("title", event.target.value)}
          />
          {errors?.title ? <p className="text-xs text-[var(--danger)]">{errors.title}</p> : null}
        </label>

        <label className="space-y-1">
          <span className="text-xs font-medium text-[var(--ink-muted)]">Merchant</span>
          <input
            className="field"
            value={values.merchant}
            placeholder="Merchant"
            disabled={disabled}
            onChange={(event) => onChange("merchant", event.target.value)}
          />
          {errors?.merchant ? <p className="text-xs text-[var(--danger)]">{errors.merchant}</p> : null}
        </label>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="space-y-1">
          <span className="text-xs font-medium text-[var(--ink-muted)]">Amount</span>
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[var(--ink-muted)]">
              Rp
            </span>
            <input
              className="field pl-10"
              inputMode="numeric"
              value={formattedAmount}
              placeholder="0"
              disabled={disabled}
              onChange={(event) => onChange("amount", event.target.value.replace(/[^\d]/g, ""))}
            />
          </div>
          {errors?.amount ? <p className="text-xs text-[var(--danger)]">{errors.amount}</p> : null}
        </label>

        <label className="space-y-1">
          <span className="text-xs font-medium text-[var(--ink-muted)]">Date</span>
          <input
            className="field"
            type="date"
            value={values.dateTrx}
            disabled={disabled}
            onChange={(event) => onChange("dateTrx", event.target.value)}
          />
          {errors?.dateTrx ? <p className="text-xs text-[var(--danger)]">{errors.dateTrx}</p> : null}
        </label>
      </div>

      <label className="space-y-1">
        <span className="text-xs font-medium text-[var(--ink-muted)]">Category</span>
        <select
          className="select"
          value={values.categoryId}
          disabled={disabled}
          onChange={(event) => onChange("categoryId", event.target.value)}
        >
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
        {errors?.category ? <p className="text-xs text-[var(--danger)]">{errors.category}</p> : null}
      </label>
    </div>
  );
}

export type { TransactionFormErrors, TransactionFormValues, TransactionFormField };
