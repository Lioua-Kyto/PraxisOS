import { Card, CardContent } from "../ui/card";
import { RadialProgress } from "../viz/RadialProgress";
import type { NutritionLog } from "@shared/types";

export function NutritionHydrationWidget({
  nutritionToday,
  hydrationTotal,
  calorieGoal,
  waterGoalMl,
  onNavigate
}: {
  nutritionToday: NutritionLog[];
  hydrationTotal: number;
  calorieGoal: number;
  waterGoalMl: number;
  onNavigate: () => void;
}) {
  const totalCalories = nutritionToday.reduce((a, e) => a + e.calories, 0);

  return (
    <Card className="cursor-pointer transition-colors hover:border-primary/50" onClick={onNavigate}>
      <CardContent className="flex items-center justify-around gap-4 pt-5">
        <div className="text-center">
          <div className="mb-2 font-mono text-[10.5px] uppercase tracking-wide text-muted-foreground">Hydration</div>
          <RadialProgress value={hydrationTotal} max={waterGoalMl} size={84} color="hsl(var(--primary))" label={`${(hydrationTotal / 1000).toFixed(1)}L`} />
        </div>
        <div className="text-center">
          <div className="mb-2 font-mono text-[10.5px] uppercase tracking-wide text-muted-foreground">Calories</div>
          <RadialProgress value={totalCalories} max={calorieGoal} size={84} color="hsl(var(--warning))" label={`${totalCalories}`} />
        </div>
      </CardContent>
    </Card>
  );
}
