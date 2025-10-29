MongoDB Atlas integration (vercel-demo)

Quick start

1. Add the following environment variables to your Vercel project (or export them locally):

- `STORAGE_MONGODB_URI` — your MongoDB Atlas connection string (or `MONGODB_URI`).
- `JWT_SECRET` — secret used to sign JWTs for auth.

2. Install dependencies and seed sample data locally (optional):

```bash
npm install
STORAGE_MONGODB_URI="your-uri" JWT_SECRET="change-me" npm run seed
```

3. Endpoints

- `POST /api/auth/register` — body: `{ "email": "...", "password": "...", "name": "..." }`
- `POST /api/auth/login` — body: `{ "email": "...", "password": "..." }` -> returns `{ token }`
- `GET/POST/PUT/DELETE /api/todos` — standard REST operations for Todo entities. Use `id` query param for single-item GET/PUT/DELETE.

Notes

- This demo uses the official `mongodb` driver and a tiny helper at `lib/mongo.js`.
- For production, set a strong `JWT_SECRET` in Vercel. Avoid committing secrets to the repo.
