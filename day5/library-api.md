# Library API — Books Resource

Base URL: `/api/books`

## Endpoints

### List all books

- **Method:** `GET`
- **Path:** `/api/books`
- **Description:** Returns a list of all books in the library.
- **Request body:** None
- **Success status:** `200 OK`

### Get one book

- **Method:** `GET`
- **Path:** `/api/books/{id}`
- **Description:** Returns a single book by its ID.
- **Request body:** None
- **Success status:** `200 OK`

### Create a book

- **Method:** `POST`
- **Path:** `/api/books`
- **Description:** Creates a new book record.
- **Request body:**
  ```json
  {
    "title": "The Hobbit",
    "author": "J.R.R. Tolkien",
    "isbn": "9780261102217",
    "year": 1937
  }
  ```
