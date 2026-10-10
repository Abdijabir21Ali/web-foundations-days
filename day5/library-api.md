# Library API - Books Resource

Base URL: https://api.citylibrary.org/v1
All requests and responses use JSON.

## Endpoints

### List all books

- GET /books
- Returns an array of books.
- Success: 200 OK

### Get one book

- GET /books/{id}
- Example: GET /books/15
- Success: 200 OK

### Create a book

- POST /books
- Body: { "title": "Things Fall Apart", "author": "Chinua Achebe",
  "year": 1958, "copies": 3 }
- Success: 201 Created (returns the new book with its id)

### Update a book

- PATCH /books/{id}
- Body (only the fields to change): { "copies": 5 }
- Success: 200 OK

### Delete a book

- DELETE /books/{id}
- Success: 204 No Content

### List books by an author

- GET /books?author=Chinua%20Achebe
- Uses a query parameter to filter the list.
- Success: 200 OK

## Errors

- 400 Bad Request - the body is invalid, for example POST /books
  without a title, or "year" is text instead of a number.
- 404 Not Found - the book does not exist, for example GET /books/99999.
