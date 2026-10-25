import { addCalendar } from "../domain/calendar"

export function createStudyEvents(now = Date.now()) {
      const subjectColors = {
        Product: "#ee5975",
        Engineering: "#4bbcd1",
        Marketing: "#dc647c",
        Research: "#54c4b1",
        Ops: "#B7A0EA"
      }

      const events = [
        { subject: "Product", title: "Roadmap workshop", offsetDays: -8, offsetHours: 0, unit: "day", amount: 2 },
        { subject: "Product", title: "Quarter planning", offsetDays: -20, offsetHours: 0, unit: "quarter", amount: 1 },
        { subject: "Product", title: "Feature prioritization", offsetDays: -5, offsetHours: 0, unit: "day", amount: 1 },
        { subject: "Product", title: "Launch checklist", offsetDays: 1, offsetHours: 0, unit: "day", amount: 2 },
        { subject: "Product", title: "Backlog grooming", offsetDays: 2, offsetHours: 2, unit: "hour", amount: 2 },

        { subject: "Engineering", title: "Core refactor", offsetDays: -7, offsetHours: 0, unit: "day", amount: 4 },
        { subject: "Engineering", title: "API integration", offsetDays: -2, offsetHours: 0, unit: "day", amount: 3 },
        { subject: "Engineering", title: "Hotfix review", offsetDays: 0, offsetHours: 6, unit: "fourHour", amount: 1 },
        { subject: "Engineering", title: "Deploy window", offsetDays: 4, offsetHours: 4, unit: "fifteenMinute", amount: 8 },
        { subject: "Engineering", title: "Pair debugging", offsetDays: 3, offsetHours: 1, unit: "hour", amount: 1 },

        { subject: "Marketing", title: "Campaign planning", offsetDays: -10, offsetHours: 0, unit: "fortnight", amount: 1 },
        { subject: "Marketing", title: "Ad creative sprint", offsetDays: -1, offsetHours: 0, unit: "day", amount: 2 },
        { subject: "Marketing", title: "Launch announcement", offsetDays: 4, offsetHours: 0, unit: "day", amount: 1 },

        { subject: "Research", title: "Interview block", offsetDays: -3, offsetHours: 0, unit: "day", amount: 1 },
        { subject: "Research", title: "Usability session", offsetDays: 1, offsetHours: 3, unit: "hour", amount: 1 },
        { subject: "Research", title: "Insights synthesis", offsetDays: 6, offsetHours: 0, unit: "day", amount: 2 },

        { subject: "Ops", title: "Security patching", offsetDays: -4, offsetHours: 0, unit: "day", amount: 1 },
        { subject: "Ops", title: "Infra maintenance", offsetDays: 0, offsetHours: 1, unit: "hour", amount: 4 },
        { subject: "Ops", title: "Cost review", offsetDays: 5, offsetHours: 0, unit: "day", amount: 1 },
        { subject: "Ops", title: "Incident drill", offsetDays: 7, offsetHours: 2, unit: "hour", amount: 2 }
      ]

  return events.map((e, i) => ({
    id: String(i), title: e.title, subject: e.subject, color: subjectColors[e.subject],
    term: { anchor: addCalendar(addCalendar(now, "day", e.offsetDays), "hour", e.offsetHours), definedUnit: e.unit, amount: e.amount }
  }))
}
