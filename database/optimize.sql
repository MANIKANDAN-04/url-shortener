
CREATE INDEX IF NOT EXISTS idx_urls_is_active_created_at ON urls(is_active, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_urls_short_code_active ON urls(short_code, is_active);
CREATE INDEX IF NOT EXISTS idx_urls_original_url ON urls(original_url(255));

ALTER TABLE urls ENGINE=InnoDB;

ALTER TABLE urls CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
