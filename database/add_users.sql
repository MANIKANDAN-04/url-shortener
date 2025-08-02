CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    INDEX idx_email (email)
);

ALTER TABLE urls ADD COLUMN user_id INT NOT NULL DEFAULT 1;

ALTER TABLE urls ADD CONSTRAINT fk_urls_user_id 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

INSERT INTO users (email, password_hash, name) 
VALUES ('admin@example.com', SHA2('admin123', 256), 'Admin User')
ON DUPLICATE KEY UPDATE id=id;

UPDATE urls SET user_id = 1 WHERE user_id = 0 OR user_id IS NULL;
