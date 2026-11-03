import { jsonb, pgTable, text, timestamp } from 'drizzle-orm/pg-core'

export const generatedWebsites = pgTable('generated_websites', {
  id: text('id').primaryKey(),
  business: jsonb('business').notNull(),
  uploadedImages: jsonb('uploaded_images'),
  aiDesign: jsonb('ai_design'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
})
