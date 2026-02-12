# KLYR Setup Instructions

## Step 1: Create Environment File

Create a file named `.env` in the root directory with the following content:

```env
DATABASE_URL="file:./dev.db"
JWT_SECRET="klyr-dev-secret-change-in-production"
```

## Step 2: Generate Prisma Client

Run the following command:

```bash
node_modules/.bin/prisma generate
```

Or if npx works:

```bash
npx prisma generate
```

## Step 3: Initialize Database

Push the schema to create the database:

```bash
node_modules/.bin/prisma db push
```

Or:

```bash
npx prisma db push
```

## Step 4: Start Development Server

```bash
npm run dev
```

The app should now be running at [http://localhost:3000](http://localhost:3000)

## Troubleshooting

### If npm install fails with "napi-postinstall: command not found"

Run:

```bash
npm install --ignore-scripts
```

Then manually generate Prisma client as shown in Step 2.

### If Prisma commands don't work

Use the full path:

```bash
node_modules/.bin/prisma [command]
```
