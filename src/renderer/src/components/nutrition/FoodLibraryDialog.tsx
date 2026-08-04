import { useState } from "react";
import { Apple, Plus, Search, Trash2 } from "lucide-react";
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Badge } from "../ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { useAddFood, useFoods, useRemoveFood } from "../../queries/foods";

const CATEGORIES = ["Any", "Breakfast", "Lunch", "Dinner", "Snack"];

const emptyDraft = { name: "", category: "Any", calories: "", proteinG: "", servingLabel: "" };

export function FoodLibraryDialog() {
  const { data: foods = [] } = useFoods();
  const addFood = useAddFood();
  const removeFood = useRemoveFood();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(emptyDraft);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.name.trim()) {
      setError("Name is required.");
      return;
    }
    setError("");
    addFood.mutate({
      name: draft.name.trim(),
      category: draft.category,
      calories: Number(draft.calories || 0),
      proteinG: Number(draft.proteinG || 0),
      servingLabel: draft.servingLabel.trim() || "1 serving"
    });
    setDraft({ ...emptyDraft, category: draft.category });
  };

  const query = search.trim().toLowerCase();
  const filtered = query ? foods.filter((f) => f.name.toLowerCase().includes(query)) : foods;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Apple className="h-3.5 w-3.5" /> Food library
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Food library</DialogTitle>
        </DialogHeader>

        <form className="grid grid-cols-2 gap-3 rounded-md border border-border-soft bg-sunken p-3 md:grid-cols-6" onSubmit={submit}>
          <div className="col-span-2 flex flex-col gap-1.5">
            <Label>Name</Label>
            <Input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder="Greek yogurt" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Meal</Label>
            <Select value={draft.category} onValueChange={(v) => setDraft({ ...draft, category: v })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Calories</Label>
            <Input type="number" value={draft.calories} onChange={(e) => setDraft({ ...draft, calories: e.target.value })} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Protein g</Label>
            <Input type="number" value={draft.proteinG} onChange={(e) => setDraft({ ...draft, proteinG: e.target.value })} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Serving</Label>
            <Input value={draft.servingLabel} onChange={(e) => setDraft({ ...draft, servingLabel: e.target.value })} placeholder="170g" />
          </div>
          {error && <span className="col-span-2 text-[11px] text-destructive md:col-span-6">{error}</span>}
          <Button type="submit" className="col-span-2 md:col-span-6" disabled={addFood.isPending}>
            <Plus className="h-3.5 w-3.5" /> Add to library
          </Button>
        </form>

        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search foods…" className="pl-8" />
        </div>

        <div className="scrollbar-thin max-h-72 overflow-y-auto">
          <table className="w-full border-collapse text-[12.5px]">
            <thead>
              <tr className="text-left text-[10px] uppercase tracking-wide text-muted-foreground">
                <th className="sticky top-0 border-b border-border-soft bg-card pb-2">Food</th>
                <th className="sticky top-0 border-b border-border-soft bg-card pb-2">Meal</th>
                <th className="sticky top-0 border-b border-border-soft bg-card pb-2">Cal</th>
                <th className="sticky top-0 border-b border-border-soft bg-card pb-2">Protein</th>
                <th className="sticky top-0 border-b border-border-soft bg-card pb-2" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((f) => (
                <tr key={f.id} className="border-b border-border-soft last:border-none">
                  <td className="py-2">
                    {f.name}
                    <span className="ml-1.5 text-[10.5px] text-muted-foreground">{f.servingLabel}</span>
                  </td>
                  <td className="py-2">
                    <Badge variant="secondary">{f.category}</Badge>
                  </td>
                  <td className="tabular py-2">{f.calories}</td>
                  <td className="tabular py-2">{f.proteinG}g</td>
                  <td className="py-2 text-right">
                    <Button size="icon" variant="ghost" className="text-destructive" onClick={() => removeFood.mutate(f.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-4 text-center text-muted-foreground">
                    {foods.length === 0 ? "No foods yet." : "No foods match your search."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </DialogContent>
    </Dialog>
  );
}
