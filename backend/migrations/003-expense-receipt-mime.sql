-- Stores MIME type when a receipt file exists on disk; null for filename-only imports.
ALTER TABLE expenses
ADD COLUMN receiptMimeType VARCHAR(127) NULL AFTER receiptName;
