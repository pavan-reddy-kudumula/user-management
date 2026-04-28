# Indexes

Expected `db.users.getIndexes()` output:

```js
[
  { v: 2, key: { _id: 1 }, name: '_id_' },
  { v: 2, key: { email: 1 }, name: 'email_1', unique: true },
  { v: 2, key: { phone: 1 }, name: 'phone_1', unique: true },
  { v: 2, key: { isBlocked: 1, createdAt: -1 }, name: 'isBlocked_1_createdAt_-1' }
]
```

Why this set:

- `email` and `phone` must be unique by requirement.
- `{ isBlocked: 1, createdAt: -1 }` supports common operator flows that filter by account status and sort by recent records.
- The compound index is more useful than a standalone `createdAt` index when admin queries usually include status filters.