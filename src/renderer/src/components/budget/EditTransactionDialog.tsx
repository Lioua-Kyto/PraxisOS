import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { TransactionForm, type TransactionFormValues } from "./TransactionForm";
import { useUpdateTransaction } from "../../queries/budget";
import type { BudgetTransaction } from "@shared/types";

export function EditTransactionDialog({
  transaction,
  onOpenChange
}: {
  transaction: BudgetTransaction | null;
  onOpenChange: (open: boolean) => void;
}) {
  const updateTransaction = useUpdateTransaction();

  return (
    <Dialog open={Boolean(transaction)} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit transaction</DialogTitle>
        </DialogHeader>
        {transaction && (
          <TransactionForm
            // Remount per transaction so the form picks up its values as
            // defaults instead of keeping the previous row's state.
            key={transaction.id}
            initialValues={{
              type: transaction.type,
              amount: transaction.amount,
              categoryId: transaction.categoryId ?? 0,
              description: transaction.description ?? "",
              date: transaction.date
            }}
            submitLabel="Save changes"
            isSubmitting={updateTransaction.isPending}
            onSubmit={(values: TransactionFormValues) => {
              updateTransaction.mutate({
                id: transaction.id,
                fields: {
                  type: values.type,
                  amount: values.amount,
                  categoryId: values.categoryId,
                  description: values.description,
                  date: values.date
                }
              });
              onOpenChange(false);
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
