# Scout api sourcecode

- REST Api of scout-app hosting whatsapp bot.
- Made with Nodejs, Express, Typescript, PrismaORM, MYSQL & Whatsapp-web.js.

## Requirements

1. Must have npm or yarn installed in computer. I will follow the installation using npm as an example.
2. Must have chromium installed in your computer (for whatsapp-web.js to work).
3. Must have docker installed in your computer (If you want to use it to run a container for a development database).

## 🛠 Installation & Set Up for Development

1. Install project dependencies

   ```sh
   npm install
   ```

2. Configure environment variables creating .env.development file with the next variables:

   ```dosini
    # VARIABLES NEEDED
    MYSQL_ROOT_PASSWORD  # Password for dev database.
    MYSQL_DATABASE  # Name of dev database.
    PORT  # Nodejs server default port.
    DATABASE_URL  # Database url for connection with prisma.
    # Example of uri you have to create with the variables defined previously:
    # DATABASE_URL=mysql://root:<MYSQL_ROOT_PASSWORD>@127.0.0.1/<MYSQL_DATABASE>
    GOOGLE_SERVICE_ACCOUNT_EMAIL  # Google drive SpreadSheets account email
    GOOGLE_PRIVATE_KEY  # Google drive SpreadSheets private ssh key
    GOOGLE_SPREADSHEET_DATA_KEY  # Google drive Spreadsheet key (sheet with data to load for development purposes).
    MONGODB_URI  # MongoDB uri to save whatsappweb remote session data
   ```

3. Run container for development database with phpmyadmin included. Also runs a container with redis-server to save application cache.

   ```sh
   docker compose -f docker-compose.yml up -d
   ```

4. Run this script to create Tables in database.

   ```sh
   npm run push:dev
   ```

5. Run script to generate data for development purposes in database.

   ```sh
   sh src/bin/dumpData.sh
   ```

6. Run this script to create an admin user (login in app using your the credentials you insert).

   ```sh
   npm run create-admin:dev
   ```

7. Run the development server

   ```sh
   npm run dev
   ```

## 🚀 Building and Running for Production

1. Generate dist for production build

   ```sh
   npm run build
   ```

2. Run the build generated in production mode

   ```sh
   npm start
   ```

### Notes

Whataspp-web.js Remote Auth (using mongodb-uri) only works with nodejs version 18.14.2 with npm version 9.5.0.
In case you can't use this version, you have to configure LocalAuth.
