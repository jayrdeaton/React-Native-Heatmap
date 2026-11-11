import type { TimeZone } from '../types'

/**
 * A Date's calendar and clock fields, read and set on one time zone's clock: the device's (Date's own getters and setters)
 * or UTC's (their getUTC and setUTC twins). Every helper that reads days or hours takes a zone and goes through one of
 * these, so 'local' makes exactly the calls it always has and 'utc' the same calls in UTC, with no second copy of the
 * date math. The setters mutate the Date and pass on only the arguments they're given, since Date's setters read an
 * explicit undefined as NaN.
 */
export interface Clock {
  year(date: Date): number
  /** 0 for January */
  month(date: Date): number
  /** The day of the month, from 1 */
  date(date: Date): number
  /** The weekday, 0 for Sunday */
  day(date: Date): number
  hours(date: Date): number
  minutes(date: Date): number
  setFullYear(date: Date, ...args: Parameters<Date['setFullYear']>): void
  setDate(date: Date, ...args: Parameters<Date['setDate']>): void
  setHours(date: Date, ...args: Parameters<Date['setHours']>): void
  setMinutes(date: Date, ...args: Parameters<Date['setMinutes']>): void
  setSeconds(date: Date, ...args: Parameters<Date['setSeconds']>): void
  /** The midnight starting a calendar day (month from 0), overflowing as Date's constructor does */
  midnight(year: number, month: number, day: number): Date
}

const LOCAL: Clock = {
  year: (date) => date.getFullYear(),
  month: (date) => date.getMonth(),
  date: (date) => date.getDate(),
  day: (date) => date.getDay(),
  hours: (date) => date.getHours(),
  minutes: (date) => date.getMinutes(),
  setFullYear: (date, ...args) => date.setFullYear(...args),
  setDate: (date, ...args) => date.setDate(...args),
  setHours: (date, ...args) => date.setHours(...args),
  setMinutes: (date, ...args) => date.setMinutes(...args),
  setSeconds: (date, ...args) => date.setSeconds(...args),
  midnight: (year, month, day) => new Date(year, month, day)
}

// UTC has no daylight saving: every hour is 3,600,000 ms and every day starts at its midnight
const UTC: Clock = {
  year: (date) => date.getUTCFullYear(),
  month: (date) => date.getUTCMonth(),
  date: (date) => date.getUTCDate(),
  day: (date) => date.getUTCDay(),
  hours: (date) => date.getUTCHours(),
  minutes: (date) => date.getUTCMinutes(),
  setFullYear: (date, ...args) => date.setUTCFullYear(...args),
  setDate: (date, ...args) => date.setUTCDate(...args),
  setHours: (date, ...args) => date.setUTCHours(...args),
  setMinutes: (date, ...args) => date.setUTCMinutes(...args),
  setSeconds: (date, ...args) => date.setUTCSeconds(...args),
  midnight: (year, month, day) => new Date(Date.UTC(year, month, day))
}

/** The clock a zone's days and hours are read on: the device's for 'local', UTC's for 'utc'. The helpers taking a zone
 * default it to 'local' themselves. */
export const clockFor = (timeZone: TimeZone): Clock => (timeZone === 'utc' ? UTC : LOCAL)
