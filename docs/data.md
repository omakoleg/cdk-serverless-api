## Application Data

### auth-users

Auth user structure:

```txt
  accessId: string;
  password: string;
```

Basic Header: `Authorization: Basic dGVzdDp0ZXN0` for `test:test`

### events

Each event contains:

- `eventId` unique PK
- `createdAt` ISO date-time for sorting chain of events
- `userId` user ID

User "information":

```txt
[eventId, createdAt, userId]
name: string;
email: string;
```

User "balance updates" (plus and minus):

```txt
[eventId, createdAt, userId]
amount: number;
```

User "purchases":

```txt
[eventId, createdAt, userId]
transaction: number;
```

### users

Contains combined information for a given user:

```txt
userId: string;
name: string;
email: string;
balance: number; // can be negative
```
