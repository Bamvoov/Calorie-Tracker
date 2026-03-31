export function calculateBMR(
  weight: number,
  height: number,
  age: number,
  gender: 'male' | 'female'
): number {
  if (gender === 'male') {
    return 10 * weight + 6.25 * height - 5 * age + 5;
  } else {
    return 10 * weight + 6.25 * height - 5 * age - 161;
  }
}

export function calculateTDEE(bmr: number, activityLevel: string): number {
  const activityFactors: Record<string, number> = {
    sedentary: 1.2, // Little or no exercise
    light: 1.375, // Light exercise/sports 1-3 days/week
    moderate: 1.55, // Moderate exercise/sports 3-5 days/week
    active: 1.725, // Hard exercise/sports 6-7 days a week
    very_active: 1.9, // Very hard exercise/sports & physical job or 2x training
  };

  const factor = activityFactors[activityLevel] || 1.2;
  return Math.round(bmr * factor);
}

export function calculateDietMetrics(
  currentWeight: number,
  targetWeight: number,
  tdee: number,
  targetDeficitOrSurplus: number = 500
) {
  const weightDifference = targetWeight - currentWeight;
  
  if (weightDifference < 0) {
    // Weight Loss Goal
    const weightToLose = Math.abs(weightDifference);
    const targetCalories = tdee - targetDeficitOrSurplus;
    const totalCaloriesNeeded = weightToLose * 7700;
    const daysRequired = Math.ceil(totalCaloriesNeeded / targetDeficitOrSurplus);
    
    return { targetCalories, totalCaloriesNeeded, daysRequired, mode: 'loss' };
  } 
  
  if (weightDifference > 0) {
    // Muscle Gain / Weight Gain Goal
    const targetCalories = tdee + targetDeficitOrSurplus;
    const totalCaloriesNeeded = weightDifference * 7700;
    const daysRequired = Math.ceil(totalCaloriesNeeded / targetDeficitOrSurplus);
    
    return { targetCalories, totalCaloriesNeeded, daysRequired, mode: 'gain' };
  }

  // Maintenance
  return { targetCalories: tdee, totalCaloriesNeeded: 0, daysRequired: 0, mode: 'maintain' };
}
