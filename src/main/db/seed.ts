import { eq } from "drizzle-orm";
import type { AppDb } from "./client";
import { budgetCategories, courses, foods, habits, settings, workoutExercises } from "./schema";

export const WORKOUT_HABIT_NAME = "Workout";

const COURSE_SEED = [
  ["AWS Cloud Technical Essentials", "AWS / Coursera", "Cloud & DevOps", 1, "https://www.coursera.org/learn/aws-cloud-technical-essentials", "planned", "Start here before the specialization below — core AWS services, IAM, VPC, compute, storage."],
  ["AWS Cloud Engineering, Architecture & DevOps Specialization", "AWS / Coursera", "Cloud & DevOps", 1, "https://www.coursera.org/specializations/aws-cloud-engineering-architecture-devops-specialization", "planned", "~20 weeks. Direct answer to 'no cloud cert' gap on your resume — architecture, IaC, CI/CD automation on AWS."],
  ["IBM DevOps and Software Engineering Professional Certificate", "IBM / Coursera", "Cloud & DevOps", 1, "https://www.coursera.org/professional-certificates/devops-and-software-engineering", "planned", "Containers, Kubernetes, CI/CD, Agile/Scrum — pairs with your existing Docker/Nginx experience."],
  ["Foundations of Data Structures and Algorithms Specialization", "CU Boulder / Coursera", "System Design & DSA", 2, "https://www.coursera.org/specializations/boulder-data-structures-algorithms", "planned", "MasterTrack: counts as credit toward CU Boulder's MS-DS if you ever want to ladder into a real Master's."],
  ["Algorithms Specialization", "Stanford / Coursera", "System Design & DSA", 2, "https://www.coursera.org/specializations/algorithms", "planned", "Gold-standard interview prep for US/EU technical interviews — Sedgewick/Roughgarden-style rigor."],
  ["Software Design and Architecture Specialization", "University of Alberta / Coursera", "System Design & DSA", 2, "https://www.coursera.org/specializations/software-design-architecture", "planned", "Design patterns, SOLID, architecture trade-offs — directly strengthens system design interviews."],
  ["Meta Front-End Developer Professional Certificate", "Meta / Coursera", "Frontend Depth (TS/Next.js)", 3, "https://www.coursera.org/professional-certificates/meta-front-end-developer", "planned", "Advanced React patterns + adjacent modules; use to fill in Next.js/testing gaps not in your current stack."],
  ["Software Testing and Automation Specialization", "Coursera", "Frontend Depth (TS/Next.js)", 3, "https://www.coursera.org/specializations/software-testing-automation", "planned", "You list PyTest/Jest — this formalizes it into a certification a foreign recruiter can filter on."],
  ["IBM Full Stack Software Developer Professional Certificate", "IBM / Coursera", "Full Software Engineering", 4, "https://www.coursera.org/professional-certificates/ibm-full-stack-cloud-developer", "planned", "Broad end-to-end validation: cloud-native, containers, microservices, Kubernetes deployment of full apps."],
  ["Software Development Lifecycle MasterTrack Certificate", "CU Boulder / Coursera", "Full Software Engineering", 4, "https://www.coursera.org/mastertrack/software-development-lifecycle-boulder", "planned", "Credit-bearing toward an actual CU Boulder Master's — highest-leverage 'weighs more than my diploma' credential."],
  ["IBM AI Engineering Professional Certificate", "IBM / Coursera", "AI Engineering (future)", 5, "https://www.coursera.org/professional-certificates/ai-engineer", "planned", "13-course series: ML, deep learning, transformers, RAG, agentic workflows with Keras/PyTorch/TensorFlow."],
  ["Generative AI for Software Development Specialization", "DeepLearning.AI / Coursera", "AI Engineering (future)", 5, "https://www.coursera.org/specializations/generative-ai-for-software-developers", "planned", "Applies GenAI directly to your dev workflow — complements the AI Engineering cert with practical tooling."]
] as const;

const WORKOUT_SEED = [
  ["Push", "Dips (Wall-Mount Machine)", 4, "8–12", "Add weight via loaded backpack. Once you hit 12 reps, add more books/bottles.", "Lean your torso forward to target the chest. Keep your shoulders pushed down and away from your ears.", 1],
  ["Push", "30kg Bag Floor Press", 4, "10–15", "Increase reps. Once hitting 15, add a 3-second pause at the bottom of every rep.", "Lie flat, rest the bag across your chest, grab the sides and press up. Squeeze your chest hard at the top.", 2],
  ["Push", "Pike Push-ups", 3, "8–12", "Elevate feet on a chair to put more bodyweight onto your shoulders.", 'Keep your legs straight and hips high in an inverted "V" shape. Lower the top of your head toward the floor.', 3],
  ["Push", "Push-ups", 3, "10–20", "Elevate feet (decline) or add the loaded backpack.", "Keep your core braced. Do not let your lower back sag.", 4],
  ["Push", "Bodyweight Triceps Extensions", 3, "10–15", "Walk your feet further back to decrease your leverage, making it heavier.", "Use the dip handles. Keep your elbows tucked in tightly; don't let them flare out.", 5],
  ["Pull", "Wide Grip Pull-ups (Machine)", 4, "6–10", "Add loaded backpack when 10 reps are easy.", 'STRUGGLING? Do "Negatives": Jump up so your chin is over the bar, then fight gravity to lower yourself as slowly as possible (5–8 seconds).', 1],
  ["Pull", "30kg Bag Bent-Over Rows", 4, "8–15", "Increase reps. Once hitting 15, slow the lowering phase down to 3 seconds per rep.", "Hinge forward at the hips, keeping your back perfectly flat. Pull the bag directly into your belly button.", 2],
  ["Pull", "Chin-ups (Underhand Grip)", 3, "6–10", "Add loaded backpack.", 'STRUGGLING? Try "Isometric Holds": Jump to the top and hold your chin over the bar as long as possible.', 3],
  ["Pull", "Towel Inverted Rows", 3, "10–15", "Walk your feet further forward so your body is closer to parallel with the floor.", "Drape a towel over the high bar. Squeeze your shoulder blades together at the top of the pull.", 4],
  ["Pull", "30kg Bag Zercher Carries", 3, "45–60s", "Walk further distances or purposefully walk slower to increase time under tension.", "Bear hug the bag or cradle it in your elbows. Walk with perfect, upright posture.", 5],
  ["Legs", "30kg Bear Hug Squats", 4, "10–20", "Once hitting 20 reps, add a deep 3-second pause at the very bottom of the squat.", "Squeeze the vertical bag tightly against your chest. Keep your chest up and drive through your heels.", 1],
  ["Legs", "30kg Bag Romanian Deadlifts", 4, "10–15", "Slow the descent down to 4 seconds, feeling a deep stretch in the hamstrings.", "Hold the bag horizontally. Keep legs mostly straight. Push your hips as far backward as they can go.", 2],
  ["Legs", "30kg Bag Bulgarian Split Squats", 3, "8–15", "Add a 2-second pause at the bottom of the movement.", "Hold the bag across your shoulders or in a bear hug. Rest your back foot on a chair.", 3],
  ["Legs", "Captain's Chair Leg Raises", 3, "10–20", "Keep legs perfectly straight. Add a 1-second hold at the top.", "Use the backrest and arm pads on your machine. Do not use momentum; use your core to lift your legs.", 4]
] as const;

const BUDGET_CATEGORY_SEED: Array<{ name: string; type: "expense" | "income" | "transfer" | "debt" }> = [
  { name: "Groceries", type: "expense" },
  { name: "Rent", type: "expense" },
  { name: "Utilities", type: "expense" },
  { name: "Transport", type: "expense" },
  { name: "Fuel", type: "expense" },
  { name: "Dining Out", type: "expense" },
  { name: "Coffee", type: "expense" },
  { name: "Subscriptions", type: "expense" },
  { name: "Health", type: "expense" },
  { name: "Pharmacy", type: "expense" },
  { name: "Fitness", type: "expense" },
  { name: "Shopping", type: "expense" },
  { name: "Clothing", type: "expense" },
  { name: "Electronics", type: "expense" },
  { name: "Education", type: "expense" },
  { name: "Entertainment", type: "expense" },
  { name: "Travel", type: "expense" },
  { name: "Gifts & Donations", type: "expense" },
  { name: "Household", type: "expense" },
  { name: "Insurance", type: "expense" },
  { name: "Taxes & Fees", type: "expense" },
  { name: "Pets", type: "expense" },
  { name: "Other Expense", type: "expense" },
  { name: "Salary", type: "income" },
  { name: "Bonus", type: "income" },
  { name: "Freelance", type: "income" },
  { name: "Side Project", type: "income" },
  { name: "Investment", type: "income" },
  { name: "Dividends", type: "income" },
  { name: "Refund", type: "income" },
  { name: "Reimbursement", type: "income" },
  { name: "Gift", type: "income" },
  { name: "Other Income", type: "income" },
  { name: "Savings Transfer", type: "transfer" },
  { name: "Investment Transfer", type: "transfer" },
  { name: "Emergency Fund", type: "transfer" },
  { name: "Account Transfer", type: "transfer" },
  { name: "Loan Taken", type: "debt" },
  { name: "Credit Card", type: "debt" },
  { name: "Borrowed From Friend", type: "debt" },
  { name: "Installment Plan", type: "debt" },
  { name: "Student Loan", type: "debt" },
  { name: "Other Debt", type: "debt" }
];

// Rough per-serving values — a practical starting list the user can edit or
// extend from the Nutrition panel's food-library modal.
const FOOD_SEED: Array<[string, string, number, number, string]> = [
  ["Oatmeal", "Breakfast", 150, 5, "1 cup cooked"],
  ["Scrambled Eggs", "Breakfast", 180, 13, "2 eggs"],
  ["Greek Yogurt", "Breakfast", 130, 17, "170g"],
  ["Banana", "Breakfast", 105, 1, "1 medium"],
  ["Whole Wheat Toast", "Breakfast", 80, 4, "1 slice"],
  ["Peanut Butter", "Breakfast", 190, 8, "2 tbsp"],
  ["Protein Shake", "Breakfast", 160, 30, "1 scoop + water"],
  ["Orange Juice", "Breakfast", 110, 2, "1 cup"],
  ["Grilled Chicken Breast", "Lunch", 165, 31, "100g"],
  ["Brown Rice", "Lunch", 215, 5, "1 cup cooked"],
  ["Tuna Salad", "Lunch", 190, 20, "1 bowl"],
  ["Turkey Sandwich", "Lunch", 320, 22, "1 sandwich"],
  ["Lentil Soup", "Lunch", 180, 12, "1 bowl"],
  ["Caesar Salad", "Lunch", 250, 10, "1 bowl"],
  ["Couscous", "Lunch", 175, 6, "1 cup cooked"],
  ["Salmon Fillet", "Dinner", 230, 25, "120g"],
  ["Beef Steak", "Dinner", 270, 26, "120g"],
  ["Pasta Bolognese", "Dinner", 400, 20, "1 plate"],
  ["Roast Vegetables", "Dinner", 120, 3, "1 cup"],
  ["Baked Potato", "Dinner", 160, 4, "1 medium"],
  ["Chicken Tagine", "Dinner", 350, 28, "1 plate"],
  ["Quinoa Bowl", "Dinner", 280, 11, "1 bowl"],
  ["Almonds", "Snack", 160, 6, "28g"],
  ["Apple", "Snack", 95, 0, "1 medium"],
  ["Protein Bar", "Snack", 200, 20, "1 bar"],
  ["Cottage Cheese", "Snack", 110, 12, "100g"],
  ["Dark Chocolate", "Snack", 170, 2, "30g"],
  ["Hummus & Carrots", "Snack", 150, 5, "1 serving"],
  ["Mixed Nuts", "Snack", 175, 5, "30g"],
  ["Boiled Egg", "Any", 78, 6, "1 egg"],
  ["Olive Oil", "Any", 120, 0, "1 tbsp"],
  ["Avocado", "Any", 240, 3, "1 medium"],
  ["Milk", "Any", 105, 8, "1 cup"],
  ["Honey", "Any", 64, 0, "1 tbsp"]
];

const DEFAULT_SETTINGS: Record<string, string> = {
  theme: "dark",
  font: "sans",
  waterGoalMl: "2500",
  calorieGoal: "2400",
  proteinGoal: "150",
  dailyBudgetLimit: "60",
  weekStartsOn: "1",
  defaultRestSeconds: "60",
  defaultFocusCategory: "deep_work",
  currencySymbol: "",
  confirmBeforeEndingWorkout: "true",
  habitRemindersEnabled: "false",
  habitReminderTime: "20:00"
};

export function seedCourses(dbi: AppDb) {
  for (const [title, provider, category, phase, url, status, notes] of COURSE_SEED) {
    dbi.insert(courses).values({ title, provider, category, phase, url, status, notes }).run();
  }
}

export function seedWorkoutExercises(dbi: AppDb) {
  for (const [day, name, sets, repsRange, progression, tips, orderIndex] of WORKOUT_SEED) {
    dbi
      .insert(workoutExercises)
      .values({ day, name, sets, repsRange, progression, tips, orderIndex })
      .run();
  }
}

export function seedBudgetCategories(dbi: AppDb) {
  for (const c of BUDGET_CATEGORY_SEED) {
    dbi.insert(budgetCategories).values(c).run();
  }
}

/**
 * Adds any seed category the database doesn't have yet, keyed on name+type.
 * A plain "seed only when empty" check would leave existing installs without
 * the newly-added types (debt) and extra categories, so their dropdowns would
 * come up empty. User-created categories are never touched.
 */
export function topUpBudgetCategories(dbi: AppDb) {
  const existing = new Set(
    dbi
      .select({ name: budgetCategories.name, type: budgetCategories.type })
      .from(budgetCategories)
      .all()
      .map((c) => `${c.type}:${c.name}`)
  );
  for (const c of BUDGET_CATEGORY_SEED) {
    if (!existing.has(`${c.type}:${c.name}`)) dbi.insert(budgetCategories).values(c).run();
  }
}

export function seedFoods(dbi: AppDb) {
  for (const [name, category, calories, proteinG, servingLabel] of FOOD_SEED) {
    dbi.insert(foods).values({ name, category, calories, proteinG, servingLabel }).run();
  }
}

export function seedIfEmpty(dbi: AppDb): void {
  if (dbi.select().from(courses).all().length === 0) seedCourses(dbi);
  if (dbi.select().from(workoutExercises).all().length === 0) seedWorkoutExercises(dbi);
  topUpBudgetCategories(dbi);
  if (dbi.select().from(foods).all().length === 0) seedFoods(dbi);
  if (dbi.select().from(habits).all().length === 0) {
    dbi
      .insert(habits)
      .values({ name: WORKOUT_HABIT_NAME, cadence: "daily", weekdays: "[]", color: "primary", orderIndex: 0 })
      .run();
  }

  const existingSettings = new Set(dbi.select({ key: settings.key }).from(settings).all().map((s) => s.key));
  for (const [key, value] of Object.entries(DEFAULT_SETTINGS)) {
    if (!existingSettings.has(key)) {
      dbi.insert(settings).values({ key, value }).run();
    }
  }
}

export function reseedCourses(dbi: AppDb) {
  dbi.delete(courses).run();
  seedCourses(dbi);
  return dbi.select().from(courses).all();
}

export function reseedWorkout(dbi: AppDb) {
  dbi.delete(workoutExercises).run();
  seedWorkoutExercises(dbi);
  return dbi.select().from(workoutExercises).all();
}

export function reseedBudgetCategories(dbi: AppDb) {
  dbi.delete(budgetCategories).run();
  seedBudgetCategories(dbi);
  return dbi.select().from(budgetCategories).all();
}

export { eq };
