import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { useBudgetCategoriesByType } from "../../queries/budget";
import type { BudgetTransactionType } from "@shared/types";

const TYPES: BudgetTransactionType[] = ["expense", "income", "transfer", "debt"];

const transactionSchema = z.object({
  type: z.enum(["expense", "income", "transfer", "debt"]),
  amount: z.coerce.number({ invalid_type_error: "Enter an amount" }).positive("Amount must be greater than 0"),
  categoryId: z.coerce.number({ invalid_type_error: "Pick a category" }).int().positive("Pick a category"),
  description: z.string().optional(),
  date: z.string().min(1, "Pick a date")
});

export type TransactionFormValues = z.infer<typeof transactionSchema>;

export function TransactionForm({
  onSubmit,
  isSubmitting
}: {
  onSubmit: (values: TransactionFormValues) => void;
  isSubmitting?: boolean;
}) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    resetField,
    formState: { errors }
  } = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionSchema),
    defaultValues: { type: "expense", date: new Date().toISOString().slice(0, 10) }
  });

  const selectedType = watch("type");
  const { data: categories = [] } = useBudgetCategoriesByType(selectedType ?? null);

  // The bug this form exists to fix: switching transaction type used to leave
  // a stale/empty category value behind. Resetting on every type change keeps
  // the dropdown's options and its selected value in sync.
  useEffect(() => {
    resetField("categoryId", { defaultValue: undefined });
  }, [selectedType, resetField]);

  const submit = handleSubmit((values) => {
    onSubmit(values);
  });

  return (
    <form className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-6" onSubmit={submit}>
      <div className="flex flex-col gap-1.5">
        <Label>Type</Label>
        <Select value={selectedType} onValueChange={(v) => setValue("type", v as BudgetTransactionType)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TYPES.map((t) => (
              <SelectItem key={t} value={t}>
                {t}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>Amount</Label>
        <Input type="number" step="0.01" placeholder="0.00" {...register("amount")} />
        {errors.amount && <span className="text-[11px] text-destructive">{errors.amount.message}</span>}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>Category</Label>
        <Select value={String(watch("categoryId") ?? "")} onValueChange={(v) => setValue("categoryId", Number(v), { shouldValidate: true })}>
          <SelectTrigger>
            <SelectValue placeholder={categories.length ? "Choose…" : "No categories"} />
          </SelectTrigger>
          <SelectContent>
            {categories.map((c) => (
              <SelectItem key={c.id} value={String(c.id)}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.categoryId && <span className="text-[11px] text-destructive">{errors.categoryId.message}</span>}
      </div>

      <div className="flex flex-col gap-1.5 md:col-span-2">
        <Label>Description</Label>
        <Input placeholder="Optional note" {...register("description")} />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>Date</Label>
        <Input type="date" {...register("date")} />
      </div>

      <Button type="submit" className="col-span-2 sm:col-span-1 md:col-span-6" disabled={isSubmitting}>
        Add transaction
      </Button>
    </form>
  );
}
