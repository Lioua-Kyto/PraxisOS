import { useState } from "react";
import { PageHeader } from "../layout/PageHeader";
import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Progress } from "../ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { HydrationWidget } from "./HydrationWidget";
import { FoodAutocomplete } from "./FoodAutocomplete";
import { FoodLibraryDialog } from "./FoodLibraryDialog";
import { MacroTrendChart } from "../viz/MacroTrendChart";
import {
  useAddNutrition,
  useHydrationWeekly,
  useNutritionToday,
  useNutritionWeekly,
  useRemoveNutrition
} from "../../queries/nutrition";
import { useSettings } from "../../queries/settings";

const MEALS = ["Breakfast", "Lunch", "Dinner", "Snack"];

export function NutritionPanel() {
  const { data: entries = [] } = useNutritionToday();
  const { data: weekly = [] } = useNutritionWeekly();
  const { data: hydrationWeekly = [] } = useHydrationWeekly();
  const { data: settings } = useSettings();
  const addEntry = useAddNutrition();
  const removeEntry = useRemoveNutrition();

  const [form, setForm] = useState({ meal: "Breakfast", food: "", calories: "", proteinG: "", carbsG: "" });

  const goal = settings?.calorieGoal ?? 2400;
  const proteinGoal = settings?.proteinGoal ?? 150;
  const totalCalories = entries.reduce((a, e) => a + e.calories, 0);
  const totalProtein = entries.reduce((a, e) => a + (e.proteinG || 0), 0);
  const totalCarbs = entries.reduce((a, e) => a + (e.carbsG || 0), 0);
  const carbsGoal = settings?.carbsGoal ?? 250;
  const pct = Math.min(100, Math.round((totalCalories / goal) * 100));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.food.trim() || !form.calories) return;
    addEntry.mutate({ meal: form.meal, food: form.food, calories: Number(form.calories), proteinG: Number(form.proteinG || 0), carbsG: Number(form.carbsG || 0) });
    setForm((f) => ({ ...f, food: "", calories: "", proteinG: "", carbsG: "" }));
  };

  return (
    <div>
      <PageHeader kicker="Fuel & fluids" title="Nutrition" action={<FoodLibraryDialog />} />

      <div className="mb-5 grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="pt-5">
            <h3 className="font-mono text-[11px] uppercase tracking-wide text-muted-foreground">Calories today</h3>
            <div className="font-display mt-1.5 text-[28px]">
              {totalCalories} <span className="text-sm text-muted-foreground">/ {goal}</span>
            </div>
            <Progress value={pct} className="mt-2" />
            <div className="mt-3 grid grid-cols-2 gap-3">
              <div>
                <div className="text-xs text-muted-foreground">
                  Protein {totalProtein.toFixed(0)}g / {proteinGoal}g
                </div>
                <Progress
                  value={Math.min(100, Math.round((totalProtein / proteinGoal) * 100))}
                  className="mt-1.5"
                  indicatorClassName="bg-success"
                />
              </div>
              <div>
                <div className="text-xs text-muted-foreground">
                  Carbs {totalCarbs.toFixed(0)}g / {carbsGoal}g
                </div>
                <Progress
                  value={Math.min(100, Math.round((totalCarbs / carbsGoal) * 100))}
                  className="mt-1.5"
                  indicatorClassName="bg-warning"
                />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <HydrationWidget goalMl={settings?.waterGoalMl ?? 2500} />
          </CardContent>
        </Card>
      </div>

      <Card className="mb-5">
        <CardContent className="pt-5">
          <h3 className="mb-3 font-mono text-[11px] uppercase tracking-wide text-muted-foreground">Macros & hydration this week</h3>
          <MacroTrendChart data={weekly} hydration={hydrationWeekly} />
        </CardContent>
      </Card>

      <Card className="mb-5">
        <CardContent className="pt-5">
          <h3 className="mb-3 font-mono text-[11px] uppercase tracking-wide text-muted-foreground">Log food</h3>
          <form className="flex flex-wrap items-center gap-2" onSubmit={submit}>
            <Select value={form.meal} onValueChange={(v) => setForm({ ...form, meal: v })}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MEALS.map((m) => (
                  <SelectItem key={m} value={m}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FoodAutocomplete
              value={form.food}
              meal={form.meal}
              onChange={(food) => setForm({ ...form, food })}
              onPick={(food) =>
                setForm({ ...form, food: food.name, calories: String(food.calories), proteinG: String(food.proteinG), carbsG: String(food.carbsG ?? 0) })
              }
              className="min-w-40 flex-1"
            />
            <Input type="number" placeholder="Calories" value={form.calories} onChange={(e) => setForm({ ...form, calories: e.target.value })} className="w-28" />
            <Input type="number" placeholder="Protein g" value={form.proteinG} onChange={(e) => setForm({ ...form, proteinG: e.target.value })} className="w-24" />
            <Input type="number" placeholder="Carbs g" value={form.carbsG} onChange={(e) => setForm({ ...form, carbsG: e.target.value })} className="w-24" />
            <Button type="submit">Add</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-5">
          <h3 className="mb-3 font-mono text-[11px] uppercase tracking-wide text-muted-foreground">Today's log</h3>
          <table className="w-full border-collapse text-[12.5px]">
            <thead>
              <tr className="text-left text-[10px] uppercase tracking-wide text-muted-foreground">
                <th className="border-b border-border-soft pb-2">Time</th>
                <th className="border-b border-border-soft pb-2">Meal</th>
                <th className="border-b border-border-soft pb-2">Food</th>
                <th className="border-b border-border-soft pb-2">Cal</th>
                <th className="border-b border-border-soft pb-2">Protein</th>
                <th className="border-b border-border-soft pb-2">Carbs</th>
                <th className="border-b border-border-soft pb-2" />
              </tr>
            </thead>
            <tbody>
              {entries.map((e) => (
                <tr key={e.id} className="border-b border-border-soft last:border-none">
                  <td className="py-2">{e.time}</td>
                  <td className="py-2">{e.meal}</td>
                  <td className="py-2">{e.food}</td>
                  <td className="py-2">{e.calories}</td>
                  <td className="py-2">{e.proteinG || 0}g</td>
                  <td className="py-2">{e.carbsG || 0}g</td>
                  <td className="py-2">
                    <Button size="sm" variant="ghost" className="text-destructive" onClick={() => removeEntry.mutate(e.id)}>
                      ✕
                    </Button>
                  </td>
                </tr>
              ))}
              {entries.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-4 text-center text-muted-foreground">
                    Nothing logged yet today.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
