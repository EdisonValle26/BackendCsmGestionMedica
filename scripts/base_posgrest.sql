CREATE table roles (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50), -- ADMIN, MEDICO, RECEPCIONISTA
  description TEXT,

  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  deleted_at TIMESTAMP,
  created_by INTEGER,
  updated_by INTEGER
)


CREATE table profiles (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100),
  description TEXT,

  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  deleted_at TIMESTAMP,
  created_by INTEGER,
  updated_by INTEGER
)


CREATE table options (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100),
  route VARCHAR(150), -- /patients, /appointments
  icon VARCHAR(50),
  parent_id INTEGER, -- menú jerárquico

  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  deleted_at TIMESTAMP,
  created_by INTEGER,
  updated_by INTEGER
)


CREATE table permissions (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100), -- CREATE_USER, DELETE_PATIENT
  code VARCHAR(50),

  created_at TIMESTAMP,
  updated_at TIMESTAMP
)


CREATE table profile_options (
  id SERIAL PRIMARY KEY,
  profile_id INTEGER REFERENCES profiles(id),
  option_id INTEGER REFERENCES options(id)
)


CREATE table role_permissions (
  id SERIAL PRIMARY KEY,
  role_id INTEGER REFERENCES roles(id),
  permission_id INTEGER REFERENCES permissions(id)
)


CREATE table catalog_types (
  id SERIAL PRIMARY KEY,
  code VARCHAR(50), -- GENDER, DOCUMENT_TYPE, etc
  name VARCHAR(100),

  created_at TIMESTAMP,
  updated_at TIMESTAMP
)


CREATE table catalogs (
  id SERIAL PRIMARY KEY,
  type_id INTEGER REFERENCES catalog_types(id),

  code VARCHAR(50),
  value VARCHAR(100),
  description TEXT,

  is_active BOOLEAN DEFAULT true,
  order_number INTEGER,

  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  deleted_at TIMESTAMP,
  created_by INTEGER,
  updated_by INTEGER
)


CREATE table persons (
  id SERIAL PRIMARY KEY,

  identification VARCHAR(20),
  document_type_id INTEGER REFERENCES catalogs(id),
  
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  
  birth_date DATE,
  gender_id INTEGER REFERENCES catalogs(id),
  nationality_id INTEGER REFERENCES catalogs(id),

  phone VARCHAR(20),
  email VARCHAR(100),
  address TEXT,

  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  deleted_at TIMESTAMP,
  created_by INTEGER,
  updated_by INTEGER
)


CREATE table users (
  id SERIAL PRIMARY KEY,
  person_id INTEGER REFERENCES persons(id),

  username VARCHAR(50) UNIQUE,
  password VARCHAR(255),

  is_active BOOLEAN DEFAULT true,
  is_locked BOOLEAN DEFAULT false,

  failed_attempts INTEGER DEFAULT 0,
  last_login TIMESTAMP,

  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  deleted_at TIMESTAMP,
  created_by INTEGER,
  updated_by INTEGER
)


CREATE table user_profiles (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  profile_id INTEGER REFERENCES profiles(id)
)


CREATE table user_roles (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  role_id INTEGER REFERENCES roles(id)
)


CREATE table user_sessions (
  id SERIAL PRIMARY KEY,

  user_id INTEGER REFERENCES users(id),
  token TEXT,

  ip_address VARCHAR(50),
  user_agent TEXT,

  is_active BOOLEAN DEFAULT true,
  expires_at TIMESTAMP,

  created_at TIMESTAMP
)


CREATE table password_resets (
  id SERIAL PRIMARY KEY,

  user_id INTEGER REFERENCES users(id),
  token VARCHAR(255),

  expires_at TIMESTAMP,
  used BOOLEAN DEFAULT false,

  created_at TIMESTAMP
)


CREATE table login_attempts (
  id SERIAL PRIMARY KEY,

  username VARCHAR(50),
  ip_address VARCHAR(50),

  success BOOLEAN,
  attempt_time TIMESTAMP
)


CREATE table doctors (
  id SERIAL PRIMARY KEY,
  person_id INTEGER REFERENCES persons(id),

  license_number VARCHAR(50),

  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  deleted_at TIMESTAMP,
  created_by INTEGER,
  updated_by INTEGER
)


CREATE table specialties (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100),

  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  deleted_at TIMESTAMP,
  created_by INTEGER,
  updated_by INTEGER
)


CREATE table doctor_specialties (
  id SERIAL PRIMARY KEY,
  doctor_id INTEGER REFERENCES doctors(id),
  specialty_id INTEGER REFERENCES specialties(id)
)


CREATE table patients (
  id SERIAL PRIMARY KEY,
  person_id INTEGER REFERENCES persons(id),

  medical_history TEXT, -- opcional resumen

  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  deleted_at TIMESTAMP,
  created_by INTEGER,
  updated_by INTEGER
)


CREATE table doctor_schedule (
  id SERIAL PRIMARY KEY,
  doctor_id INTEGER REFERENCES doctors(id),

  day_of_week INTEGER,
  start_time TIME,
  end_time TIME,

  slot_duration INTEGER,
  is_active BOOLEAN DEFAULT true,

  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  deleted_at TIMESTAMP,
  created_by INTEGER,
  updated_by INTEGER
)


CREATE table appointments (
  id SERIAL PRIMARY KEY,

  patient_id INTEGER REFERENCES patients(id),
  doctor_id INTEGER REFERENCES doctors(id),
  specialty_id INTEGER REFERENCES specialties(id),

  appointment_date DATE,
  appointment_time TIME,
  duration_minutes INTEGER,

  status_id INTEGER REFERENCES catalogs(id),
  appointment_type_id INTEGER REFERENCES catalogs(id),
  reason TEXT,
  notes TEXT,

  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  deleted_at TIMESTAMP,
  created_by INTEGER,
  updated_by INTEGER
)


CREATE table medical_records (
  id SERIAL PRIMARY KEY,

  appointment_id INTEGER REFERENCES appointments(id),

  disease_id INTEGER REFERENCES catalogs(id),	
  diagnosis TEXT,
  treatment TEXT,
  observations TEXT,

  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  deleted_at TIMESTAMP,
  created_by INTEGER,
  updated_by INTEGER
)


CREATE table chatbot_intents (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100), -- AGENDAR_CITA
  description TEXT
)


CREATE table chatbot_flows (
  id SERIAL PRIMARY KEY,
  intent_id INTEGER REFERENCES chatbot_intents(id),

  step_order INTEGER,
  question TEXT,
  field_name VARCHAR(50) -- specialty, date, etc
)


CREATE table chatbot_logs (
  id SERIAL PRIMARY KEY,

  user_phone VARCHAR(20),
  intent_id INTEGER,
  
  message TEXT,
  response TEXT,

  created_at TIMESTAMP
)


CREATE table audit_log (
  id SERIAL PRIMARY KEY,

  table_name VARCHAR(100),
  record_id INTEGER,

  action VARCHAR(20), -- INSERT, UPDATE, DELETE

  old_data JSONB,
  new_data JSONB,

  user_id INTEGER,
  action_date TIMESTAMP
)

CREATE TABLE chatbot_sessions (
  id SERIAL PRIMARY KEY,

  session_id VARCHAR(100), -- phone o web session
  intent VARCHAR(50),
  step VARCHAR(50),

  data JSONB,

  patient_id INTEGER,

  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

INSERT INTO roles (name, description, created_at)
VALUES 
('ADMIN', 'Administrador del sistema', NOW()),
('MEDICO', 'Médico', NOW()),
('RECEPCIONISTA', 'Recepción', NOW());


INSERT INTO catalog_types (code, name, created_at)
VALUES 
('DOCUMENT_TYPE', 'Tipo de documento', NOW()),
('GENDER', 'Género', NOW());


-- DOCUMENTOS
INSERT INTO catalogs (type_id, code, value, created_at)
VALUES
(1, 'CEDULA', 'Cédula', NOW()),
(1, 'PASSPORT', 'Pasaporte', NOW());

-- GENERO
INSERT INTO catalogs (type_id, code, value, created_at)
VALUES
(2, 'M', 'Masculino', NOW()),
(2, 'F', 'Femenino', NOW());


INSERT INTO persons (
  identification,
  document_type_id,
  first_name,
  last_name,
  email,
  created_at
)
VALUES (
  '0000000000',
  1,
  'Admin',
  'Sistema',
  'admin@clinica.com',
  NOW()
);


-- USUARIO= admin
-- CONSTRASEÑA= Admin123*
INSERT INTO users (
  person_id,
  username,
  password,
  is_active,
  created_at
)
VALUES (
  1,
  'admin',
  '$2b$10$RILgwQIxyhqIcc3xi.FJquORnhIdeAAMvcTYVQIEXrcQ1h/5F5Xdi',
  true,
  NOW()
);


INSERT INTO user_roles (user_id, role_id)
VALUES (1, 1);


