// Base prices in KES. Edit to match the real rate card.
export const SERVICES = {
  detailing: { label: 'Premium Detailing', price: 6000 },
  waxing: { label: 'Hand Waxing', price: 3000 },
  carpet: { label: 'Carpet Wash', price: 2500 },
  vacuum: { label: 'Interior Vacuuming', price: 800 },
};
export const VEHICLE_TYPES = { sedan: 1, suv: 1.3, van: 1.5, luxury: 1.6 };
export const STATUSES = ['Pending', 'Assigned', 'In Progress', 'Quality Check', 'Completed'];
export const quote = (keys, type) =>
  Math.round(keys.reduce((s, k) => s + SERVICES[k].price, 0) * (VEHICLE_TYPES[type] ?? 1));
