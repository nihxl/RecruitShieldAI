import { pgTable, text, timestamp, json, index } from 'drizzle-orm/pg-core';

export const checks = pgTable('checks', {
  id: text('id').primaryKey(),
  deviceId: text('device_id').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  status: text('status').notNull(),
  mode: text('mode').notNull(),
  jobTitle: text('job_title'),
  companyName: text('company_name'),
  jobText: text('job_text').notNull(),
  result: json('result'),
  errorCode: text('error_code'),
}, (table) => [
  index('device_created_idx').on(table.deviceId, table.createdAt)
]);
