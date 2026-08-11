/**
 * Production-grade calculator functions.
 * All functions are pure, math-accurate, and handle edge cases such as empty input, NaNs, and negative bounds.
 */

/**
 * Calculates exact years, months, and days from birthDate to now.
 * Also calculates total durations (days, months, weeks, hours) and countdown to next birthday.
 * 
 * @param {string|Date} birthDate - The birth date (Date object or parseable string)
 * @returns {Object} Calculated age details
 */
export function calculateAge(birthDate) {
  if (!birthDate) {
    return { years: 0, months: 0, days: 0, totalDays: 0, totalMonths: 0, totalWeeks: 0, totalHours: 0, nextBirthdayDays: 0 };
  }
  
  let birth;
  if (birthDate instanceof Date) {
    birth = birthDate;
  } else if (typeof birthDate === 'string') {
    // If it's a simple YYYY-MM-DD string, parse it as local time to avoid timezone shifts
    const match = birthDate.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (match) {
      birth = new Date(parseInt(match[1], 10), parseInt(match[2], 10) - 1, parseInt(match[3], 10));
    } else {
      birth = new Date(birthDate);
    }
  } else {
    birth = new Date(birthDate);
  }

  if (isNaN(birth.getTime())) {
    return { years: 0, months: 0, days: 0, totalDays: 0, totalMonths: 0, totalWeeks: 0, totalHours: 0, nextBirthdayDays: 0 };
  }

  const now = new Date();
  
  // If birth date is in the future, return 0 for everything
  if (birth > now) {
    return { years: 0, months: 0, days: 0, totalDays: 0, totalMonths: 0, totalWeeks: 0, totalHours: 0, nextBirthdayDays: 0 };
  }

  // Exact years, months, days calculation
  let years = now.getFullYear() - birth.getFullYear();
  let months = now.getMonth() - birth.getMonth();
  let days = now.getDate() - birth.getDate();

  if (days < 0) {
    months--;
    // Get the last day of the previous month
    const prevMonth = new Date(now.getFullYear(), now.getMonth(), 0);
    days += prevMonth.getDate();
  }

  if (months < 0) {
    years--;
    months += 12;
  }

  // Total durations
  const diffMs = now.getTime() - birth.getTime();
  const totalHours = Math.floor(diffMs / (1000 * 60 * 60));
  const totalDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const totalWeeks = Math.floor(totalDays / 7);
  const totalMonths = (years * 12) + months;

  // Days until next birthday
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const bdayThisYear = new Date(now.getFullYear(), birth.getMonth(), birth.getDate());
  
  let nextBday = new Date(bdayThisYear);
  if (bdayThisYear < todayStart) {
    nextBday.setFullYear(now.getFullYear() + 1);
  }
  
  const diffNextMs = nextBday.getTime() - todayStart.getTime();
  const nextBirthdayDays = Math.round(diffNextMs / (1000 * 60 * 60 * 24));

  return {
    years,
    months,
    days,
    totalDays,
    totalMonths,
    totalWeeks,
    totalHours,
    nextBirthdayDays
  };
}

/**
 * Calculates Body Mass Index (BMI), returns BMI value, category, and standard category CSS color string.
 * 
 * @param {number|string} weightKg - Weight in kilograms
 * @param {number|string} heightCm - Height in centimeters
 * @returns {Object} BMI value, category, and theme color
 */
export function calculateBMI(weightKg, heightCm) {
  const w = parseFloat(weightKg);
  const h = parseFloat(heightCm);
  
  if (isNaN(w) || isNaN(h) || w <= 0 || h <= 0) {
    return { bmi: 0, category: 'Invalid Input', categoryColor: 'gray' };
  }

  const bmiVal = w / Math.pow(h / 100, 2);
  const bmi = Math.round(bmiVal * 10) / 10;

  let category = '';
  let categoryColor = '';

  if (bmi < 18.5) {
    category = 'Underweight';
    categoryColor = 'blue';
  } else if (bmi < 25.0) {
    category = 'Normal';
    categoryColor = 'green';
  } else if (bmi < 30.0) {
    category = 'Overweight';
    categoryColor = 'amber';
  } else {
    category = 'Obese';
    categoryColor = 'red';
  }

  return { bmi, category, categoryColor };
}

/**
 * Calculates percentage operations ('of', 'isWhat', 'increase', 'decrease').
 * 
 * @param {string} type - Operation type
 * @param {Object} values - Operation variables
 * @returns {Object} Calculation result and human-readable formula
 */
export function calculatePercentage(type, values) {
  const cleanType = (type || '').toLowerCase();
  
  if (!values) {
    return { result: 0, formula: 'No values provided' };
  }

  switch (cleanType) {
    case 'of': {
      const percent = parseFloat(values.percent);
      const total = parseFloat(values.total);
      if (isNaN(percent) || isNaN(total)) {
        return { result: 0, formula: 'Invalid values' };
      }
      const result = Math.round(((percent / 100) * total) * 100) / 100;
      return {
        result,
        formula: `${percent}% of ${total} = ${result}`
      };
    }
    case 'iswhat': {
      const part = parseFloat(values.part);
      const total = parseFloat(values.total);
      if (isNaN(part) || isNaN(total)) {
        return { result: 0, formula: 'Invalid values' };
      }
      if (total === 0) {
        return { result: 0, formula: 'Cannot divide by zero' };
      }
      const result = Math.round(((part / total) * 100) * 100) / 100;
      return {
        result,
        formula: `${part} is ${result}% of ${total}`
      };
    }
    case 'increase': {
      const from = parseFloat(values.from);
      const to = parseFloat(values.to);
      if (isNaN(from) || isNaN(to)) {
        return { result: 0, formula: 'Invalid values' };
      }
      if (from === 0) {
        return { result: 0, formula: 'Cannot calculate percentage increase from 0' };
      }
      const result = Math.round((((to - from) / from) * 100) * 100) / 100;
      return {
        result,
        formula: `Increase from ${from} to ${to} is ${result}%`
      };
    }
    case 'decrease': {
      const from = parseFloat(values.from);
      const to = parseFloat(values.to);
      if (isNaN(from) || isNaN(to)) {
        return { result: 0, formula: 'Invalid values' };
      }
      if (from === 0) {
        return { result: 0, formula: 'Cannot calculate percentage decrease from 0' };
      }
      const result = Math.round((((from - to) / from) * 100) * 100) / 100;
      return {
        result,
        formula: `Decrease from ${from} to ${to} is ${result}%`
      };
    }
    default:
      return { result: 0, formula: 'Unknown percentage calculation type' };
  }
}
