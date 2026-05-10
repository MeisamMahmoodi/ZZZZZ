export type Plan = 'Starter' | 'Business' | 'Premium';

export const PLAN_LIMITS: Record<Plan, number> = {
  Starter: 25,
  Business: 49,
  Premium: 99,
};

export const PLAN_UPGRADE: Record<Plan, Plan | null> = {
  Starter: 'Business',
  Business: 'Premium',
  Premium: null,
};

export const PLAN_LINKS: Record<Plan, string> = {
  Starter: 'https://checkout.revolut.com/pay/ca664746-9487-43fd-92d9-fd40e5b85441',
  Business: 'https://checkout.revolut.com/pay/9c765fba-ac0a-49f5-9657-1f8a35556bec',
  Premium: 'https://checkout.revolut.com/pay/48dfba15-279a-4535-95c4-b68808e34dbb',
};

export const PLAN_PRICES: Record<Plan, string> = {
  Starter: '249',
  Business: '399',
  Premium: '499',
};

export const PLAN_CAPACITY: Record<Plan, string> = {
  Starter: 'bis 25 Mitarbeiter',
  Business: '26 – 49 Mitarbeiter',
  Premium: '50 – 99 Mitarbeiter',
};

export function getPlan(contract: string): Plan {
  if (contract === 'Business' || contract === 'Premium' || contract === 'Starter') return contract;
  return 'Starter';
}

export function canAccessPayroll(plan: Plan): boolean {
  return plan === 'Business' || plan === 'Premium';
}

export function canAccessTimestamps(plan: Plan): boolean {
  return plan === 'Business' || plan === 'Premium';
}

export function canAccessReplacement(plan: Plan): boolean {
  return plan === 'Business' || plan === 'Premium';
}

export function canAccessHourlyWage(plan: Plan): boolean {
  return plan === 'Premium';
}

export function canAccessEmployeeLogin(plan: Plan): boolean {
  return plan === 'Premium';
}

export function isAtEmployeeLimit(plan: Plan, count: number): boolean {
  return count >= PLAN_LIMITS[plan];
}
