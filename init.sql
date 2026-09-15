CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('user', 'admin') NOT NULL DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS services (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    description TEXT,
    auth_type ENUM('none', 'api_key', 'oauth2') NOT NULL DEFAULT 'none',
    icon VARCHAR(255) DEFAULT '',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_services (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    service_id INT NOT NULL,
    access_token TEXT DEFAULT NULL,
    refresh_token TEXT DEFAULT NULL,
    token_expires_at TIMESTAMP NULL DEFAULT NULL,
    credentials JSON DEFAULT NULL,
    is_connected BOOLEAN DEFAULT TRUE,
    connected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_service (user_id, service_id)
);

CREATE TABLE IF NOT EXISTS widget_definitions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    service_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    description TEXT,
    params_schema JSON NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE,
    UNIQUE KEY unique_service_widget (service_id, name)
);

CREATE TABLE IF NOT EXISTS user_widgets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    widget_id INT NOT NULL,
    title VARCHAR(100) DEFAULT NULL,
    params_values JSON NOT NULL,
    refresh_rate INT NOT NULL DEFAULT 60,
    position_x INT NOT NULL DEFAULT 0,
    position_y INT NOT NULL DEFAULT 0,
    width INT NOT NULL DEFAULT 1,
    height INT NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (widget_id) REFERENCES widget_definitions(id) ON DELETE CASCADE
);

INSERT INTO services (name, display_name, description, auth_type, is_active)
VALUES 
    ('weather', 'Météo', 'Service de prévisions météorologiques en direct', 'none', TRUE),
    ('rss', 'Flux RSS', 'Agrégateur de flux RSS d''actualités', 'none', TRUE),
    ('custom', 'API Personnalisée', 'Interrogation et affichage de métriques d''APIs JSON', 'none', TRUE),
    ('shortcuts', 'Raccourcis Web', 'Raccourcis et liens rapides vers des services externes', 'none', TRUE)
ON DUPLICATE KEY UPDATE display_name=VALUES(display_name);

INSERT INTO widget_definitions (service_id, name, display_name, description, params_schema)
SELECT s.id, 'city_temperature', 'Température de la ville', 'Affiche la température pour une ville donnée', 
       JSON_ARRAY(JSON_OBJECT('name', 'city', 'type', 'string'))
FROM services s WHERE s.name = 'weather'
ON DUPLICATE KEY UPDATE display_name=VALUES(display_name);

INSERT INTO widget_definitions (service_id, name, display_name, description, params_schema)
SELECT s.id, 'article_list', 'Liste d''articles', 'Affiche les derniers articles d''un flux RSS', 
       JSON_ARRAY(
           JSON_OBJECT('name', 'link', 'type', 'string'),
           JSON_OBJECT('name', 'number', 'type', 'integer')
       )
FROM services s WHERE s.name = 'rss'
ON DUPLICATE KEY UPDATE display_name=VALUES(display_name);

INSERT INTO widget_definitions (service_id, name, display_name, description, params_schema)
SELECT s.id, 'custom_api', 'API JSON Universelle', 'Affiche une métrique extraite depuis une API JSON', 
       JSON_ARRAY(
           JSON_OBJECT('name', 'apiUrl', 'type', 'string'),
           JSON_OBJECT('name', 'jsonPath', 'type', 'string')
       )
FROM services s WHERE s.name = 'custom'
ON DUPLICATE KEY UPDATE display_name=VALUES(display_name);

INSERT INTO widget_definitions (service_id, name, display_name, description, params_schema)
SELECT s.id, 'shortcut', 'Raccourci Web', 'Lien rapide vers un site ou service externe', 
       JSON_ARRAY(
           JSON_OBJECT('name', 'url', 'type', 'string')
       )
FROM services s WHERE s.name = 'shortcuts'
ON DUPLICATE KEY UPDATE display_name=VALUES(display_name);

