DROP DATABASE IF EXISTS employees_db;
CREATE DATABASE employees_db;

\c employees_db;

ALTER TABLE role DROP CONSTRAINT IF EXISTS role_department_fkey;
ALTER TABLE employee DROP CONSTRAINT IF EXISTS employee_role_id_fkey;

DROP TABLE IF EXISTS employee CASCADE;
DROP TABLE IF EXISTS role CASCADE;
DROP TABLE IF EXISTS department CASCADE;


CREATE TABLE department(
    id SERIAL PRIMARY KEY,
    name VARCHAR(30)
);
CREATE TABLE role(
    id SERIAL PRIMARY KEY,
    title VARCHAR(30),
    salary DECIMAL,
    department INTEGER,
    FOREIGN KEY (department)
    REFERENCES department(id)
    ON DELETE SET NULL
);
CREATE TABLE employee(
    id SERIAL PRIMARY KEY,
    first_name VARCHAR(30),
    last_name VARCHAR(30),
    role_id INTEGER,
    manager_id INTEGER,
    FOREIGN KEY (role_id)
    REFERENCES role(id)
    ON DELETE SET NULL
);
