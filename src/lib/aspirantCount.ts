// Shared inflated "aspirants attempted" baseline used on Home + DPP page.
// Single source of truth so the number never mismatches across the site.
//
// Behavior for TODAY's DPP:
//   - Before 9 AM IST: 0 (DPP not launched yet)
//   - At 9 AM IST: ~100 aspirants
//   - Each subsequent hour: +120 to +150 (deterministic per day, so it's stable
//     for everyone on the same hour and only ticks up when the hour changes)
//   - From 9 PM IST onward: frozen (no more growth)
//
// For PAST/UPCOMING DPPs we keep stable historical/hype numbers.

function nowIST(): Date {
  // IST = UTC+5:30
  const utc = Date.now();
  return new Date(utc + 5.5 * 60 * 60 * 1000);
}

function todayISTDateString(): string {
  const d = nowIST();
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
}

function seedFrom(s: string): number {
  return s.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
}

/**
 * Inflated baseline aspirant count for a given DPP (date + title).
 * Add the real `dpp_attempts` count on top of this when displaying.
 */
export function aspirantBaseline(date: string, title: string): number {
  const seed = seedFrom(date + title);
  const today = todayISTDateString();
  const dppTime = new Date(date + "T00:00:00").getTime();
  const todayTime = new Date(today + "T00:00:00").getTime();
  const daysFromToday = Math.round((todayTime - dppTime) / 86400000);

  // Upcoming DPP (not yet launched) — keep at 0 so it's not misleading.
  // Once that date becomes "today", the hourly growth below kicks in.
  if (daysFromToday <= -1) return 0;

  // TODAY — grow from 9 AM to 9 PM IST
  if (daysFromToday === 0) {
    const ist = nowIST();
    const hourIST = ist.getUTCHours();    // 0-23 (already shifted to IST)
    const minIST = ist.getUTCMinutes();
    const minutesSince9 = (hourIST - 9) * 60 + minIST;

    if (minutesSince9 < 10) return 0;     // first 10 min after launch: still 0
    if (minutesSince9 < 60) return 100;   // 9:10 AM → ~100 aspirants

    const cappedHour = Math.min(hourIST, 21); // freeze at 9 PM
    const hoursSinceLaunch = cappedHour - 9;  // 1..12 here
    let total = 100;
    for (let h = 1; h <= hoursSinceLaunch; h++) {
      const inc = 120 + ((seed + h * 37) % 31); // deterministic 120..150
      total += inc;
    }
    return total;
  }

  // Past DPPs — historical totals (stable per date)
  if (daysFromToday === 1) return 1100 + (seed % 280);
  if (daysFromToday <= 4) return 750 + (seed % 250);
  if (daysFromToday <= 10) return 480 + (seed % 200);
  return 260 + (seed % 180);
}
