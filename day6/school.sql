-- =========================================================
-- Day 6 Assignment - School Database (SQLite)
-- Run in sqliteonline.com or any SQLite playground
-- =========================================================

PRAGMA foreign_keys = ON;

-- ---------------------------------------------------------
-- 1. STUDENTS
-- ---------------------------------------------------------
CREATE TABLE students (
    student_id  INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT    NOT NULL,
    email       TEXT    NOT NULL UNIQUE,
    age         INTEGER
);

-- ---------------------------------------------------------
-- 2. COURSES
-- ---------------------------------------------------------
CREATE TABLE courses (
    course_id   INTEGER PRIMARY KEY AUTOINCREMENT,
    title       TEXT    NOT NULL,
    credits     INTEGER NOT NULL
);

-- ---------------------------------------------------------
-- 3. ENROLMENTS  (join table: student <-> course, holds grade)
--    UNIQUE(student_id, course_id) prevents duplicate enrolment
-- ---------------------------------------------------------
CREATE TABLE enrolments (
    enrolment_id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id   INTEGER NOT NULL,
    course_id    INTEGER NOT NULL,
    grade        TEXT,
    enrolled_on  DATE    NOT NULL DEFAULT (DATE('now')),
    FOREIGN KEY (student_id) REFERENCES students(student_id),
    FOREIGN KEY (course_id)  REFERENCES courses(course_id),
    UNIQUE (student_id, course_id)
);

-- =========================================================
-- SAMPLE DATA
-- =========================================================

INSERT INTO students (name, email, age) VALUES
    ('Alice Johnson', 'alice@example.com', 20),
    ('Brian Smith',   'brian@example.com', 22),
    ('Chloe Davis',   'chloe@example.com', 19);

INSERT INTO courses (title, credits) VALUES
    ('Web Development',   10),
    ('Database Design',   15),
    ('Data Structures',   20);

INSERT INTO enrolments (student_id, course_id, grade) VALUES
    (1, 1, 'A'),    -- Alice  -> Web Development
    (1, 2, 'B'),    -- Alice  -> Database Design
    (2, 1, 'C'),    -- Brian  -> Web Development
    (2, 3, NULL),   -- Brian  -> Data Structures (not graded yet)
    (3, 2, 'A');    -- Chloe  -> Database Design

-- =========================================================
-- QUERIES
-- =========================================================

-- Q1. All courses for one student (by name)
SELECT s.name AS student, c.title AS course, c.credits
FROM students   AS s
JOIN enrolments AS e ON e.student_id = s.student_id
JOIN courses    AS c ON c.course_id  = e.course_id
WHERE s.name = 'Alice Johnson';

-- Q2. All students on one course
SELECT c.title AS course, s.name AS student, s.email
FROM courses    AS c
JOIN enrolments AS e ON e.course_id  = c.course_id
JOIN students   AS s ON s.student_id = e.student_id
WHERE c.title = 'Web Development';

-- Q3. Number of students per course
SELECT c.title AS course, COUNT(e.student_id) AS student_count
FROM courses AS c
LEFT JOIN enrolments AS e ON e.course_id = c.course_id
GROUP BY c.course_id, c.title;

-- Q4. Students who have no enrolments
SELECT s.student_id, s.name, s.email
FROM students AS s
LEFT JOIN enrolments AS e ON e.student_id = s.student_id
WHERE e.enrolment_id IS NULL;

-- Q5. Update one enrolment's grade
UPDATE enrolments
SET grade = 'B'
WHERE enrolment_id = 4;

-- Verify the update
SELECT * FROM enrolments WHERE enrolment_id = 4;