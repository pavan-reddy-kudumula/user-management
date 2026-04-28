# Bulk User Management System

Node.js + Express + MongoDB backend for high-volume user creation and updates.

## Features

- Bulk create users with `insertMany()`
- Bulk update users with `bulkWrite()`
- Schema validation and unique constraints for `email` and `phone`
- Automatic `createdAt` and `updatedAt` timestamps
- Indexing for common read paths
- JSON and BSON export artifacts
- Postman collection for API verification

## Setup

```bash
npm install
cp .env.example .env
npm run start
```

## API

- `POST /api/users/bulk-create`
- `PUT /api/users/bulk-update`

Both endpoints accept JSON arrays.

## Bulk Create Payload

```json
[
  {
    "fullName": "Jane Doe",
    "email": "jane@example.com",
    "phone": "9876543210",
    "walletBalance": 100,
    "isBlocked": false,
    "kycStatus": "Pending",
    "deviceInfo": {
      "ipAddress": "192.168.1.10",
      "deviceType": "Mobile",
      "os": "Android"
    }
  }
]
```

## Bulk Update Payload

```json
[
  {
    "email": "jane@example.com",
    "walletBalance": 250,
    "isBlocked": true
  }
]
```

At least one identifier is required: `_id`, `email`, or `phone`.

## Database Indexes

- Unique index on `email`
- Unique index on `phone`
- Compound index on `isBlocked` and `createdAt` for filtered admin queries

See [docs/indexes.md](docs/indexes.md) for the expected `db.users.getIndexes()` output and the index rationale.

## Export Artifacts

Run the export script after your MongoDB instance is populated:

```bash
npm run export
```

This project includes a `db_backup/` folder and a `users.json` export file in the repository root.

## Postman

Import [postman/Bulk-User-Management.postman_collection.json](postman/Bulk-User-Management.postman_collection.json) into Postman.