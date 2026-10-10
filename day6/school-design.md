# School Database — Design Notes

## Tables

**students** — one row per learner. Stores `name`, a **UNIQUE** `email`
(so no two accounts share a login), and `age`. `student_id` is the primary key.

**courses** — one row per course offered. Stores `title` and `credits`.
`course_id` is the primary key.

**enrolments** — the join table between students and courses. It holds
`student_id`, `course_id`, the `grade`, and the `enrolled_on` date.
Both `student_id` and `course_id` are foreign keys pointing at the two
parent tables, and a `UNIQUE(student_id, course_id)` constraint stops the
same student being enrolled on the same course twice.

## Relationships

- **One-to-many:** a student has many enrolments; a course has many enrolments.
  Each enrolment belongs to exactly **one** student and **one** course.
- **Many-to-many:** students ↔ courses. A student takes many courses, and a
  course is taken by many students.

A **join table (enrolments)** is needed because a many-to-many relationship
cannot be stored in either parent table without repeating data. The join
table also gives us a natural place to hang the extra data that belongs to
the _relationship itself_ — the **grade** and the **enrolment date** —
which are properties of "student X taking course Y", not of the student or
the course alone.

```sql
CREATE INDEX idx_enrolments_course_id ON enrolments(course_id);
```

Reason: the two most common lookups in this system are _"who is on this
course?"_ and _"how many students per course?"_. Both filter or group on
`enrolments.course_id`. The UNIQUE constraint already creates an implicit
index on `(student_id, course_id)`, so `student_id`-first lookups are
covered — but `course_id`-first lookups are not, which is exactly what this
index fixes.

## SQL or NoSQL?

I would choose **SQL** for this system. The data is highly structured and
the relationships are well-defined: students, courses and the enrolments
that link them form a classic relational model. The enrolment grade is a
property of the relationship between two entities, which fits naturally
into a join table. We also need hard guarantees — a UNIQUE email, a rule
against duplicate enrolments, and foreign keys that prevent orphan rows —
and these are exactly the constraints SQL databases enforce natively.
Finally, the assignment's five queries (courses per student, students per
course, counts per course, students with no enrolments) are all
join-and-aggregate operations, which SQL is designed to handle efficiently.
A NoSQL document store could model this, but it would either duplicate
course data inside every student document or require manual application-level
joins, and it would not give us the same integrity guarantees out of the box.
