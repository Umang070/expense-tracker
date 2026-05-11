import { sequelize } from "./database";

/**
 * Applies tiny additive schema tweaks when SQL migration files weren't run manually.
 * MySQL rejects ADD COLUMN if it already exists (ER_DUP_FIELDNAME).
 */
export async function ensureExpenseReceiptMimeColumn(): Promise<void> {
  try {
    await sequelize.query(`
      ALTER TABLE expenses
      ADD COLUMN receiptMimeType VARCHAR(127) NULL AFTER receiptName
    `);
    // eslint-disable-next-line no-console
    console.info("Schema: added column expenses.receiptMimeType.");
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    if (/Duplicate column name/i.test(msg) || /\b1060\b/.test(msg)) {
      return;
    }
    throw error;
  }
}
