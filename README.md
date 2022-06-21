# brate-server

## HOW TO RUN
- **Create config.yaml, config.dev.yaml and config.test.yaml files in the root directory**.You can find an example of how the config yaml files should look like [here](.github\brate-config-example.png) 

- **Run `yarn install` or `npm install` if you are using npm** to install dependencies

- **Run app**
  For development: `yarn dev` or `npm run dev`
  For testing: `yarn test` or `npm run test`
  For production: `yarn start` or `npm start`
You can check out [package.json](package.json) and [nodemon.json](nodemon.json)

## SOFTWARE ARCHITECTURE
See [database-structure.sql](.ideas\database-structure.sql) for how to create the database tables. PLPGSQL functions and triggers are created by DB service files in the [_crons folder](src\_crons). This will change in the future (all functions will be written in a SQL file and programmatically run in a shell or something better).

The folders [currency](src\currency), [market](src\market), [user](src\user), and [wallet](src\wallet) contain the main features of the app.

- [Currency](src\currency): Features include listing and managing world currencies, currency rate alert management for both parallel and black markets, and keeping favorite currency pairs for easy rate monitoring.

- [Market](src\market): Features include providing current and historical currency rate data for both parallel and black market, and black-market currency exchange/trading.

- [User](src\user): Features include user authentication, a ticketing system for web socket authorization, and managing user data.

- [Wallet](src\wallet): Features include funding, withdrawing, and viewing currencies in the user’s wallet.

Other folders include:
- [_ws](src\_ws): Features include: notifying users of a new notification message for them through a web socket. This feature depends on a PLPGSQL trigger and SQL commands LISTEN and NOTIFY.
- [_crons](src\_crons): Features include deleting user expired notifications (soft-deleting), updating parallel rates
- [utils](src\utils):
- [config-service](src\utils\config-service.ts): ConfigService class which loads config depending on the NODE_ENV and creates a config object from it for other classes to obtain values for different config keys.
 
- [diminishing-retry](src\utils\diminishing-retry.ts): DiminshingRetry class for re-run a function a given number of times and interval until it returns a value or reaches the retry limit
 
- [auth-manager](src\utils\auth-manager.service.ts): For authenticating and authorization users using [JWT](https://jwt.io/introduction).


I also created some PLPGSQL functions to perform complex database tasks such as Safe deleting (setting deleted_at field) expired notifications, a function for a trigger to find alerts that reached the target rate both parallel and the black market, and automatic notification generation after parallel and black alert trigger, wallet transactions (currency exchange, currency funding, currency withdrawal)

LOL…I know my design is bad but I was trying out and brainstorming on different folder structures and architecture. After much thinking, and reading about clean architecture, and hexagonal architecture, I think separating into: controller, service, and repository (or another better name).

- **Controllers**: Taking in and sending out a request. It can be divided into Rest Controller, Graph QL Controller, WS Controller, SOAP Controller (and more that I don’t know). They will depend on the services. Data are passed to Service through a DTO where data is put in a way acceptable by the service. The result from the service is then converted to a suitable way for the controller and sent to the client.
 
- **Services**: This is where business logic will be. This is the main/most important part of the application (in my opinion though).  They depend on the repository (database and other external services like payment gateway API, rabbit MQ, and another server). Data is passed to the repository through DTO. I also thought of going further to divide services into kind of inner and outer services (I think it will be ok for big applications). Outer services are what controllers will depend on and outer services depend on other both inner and outer services. Cron jobs are done here.
 
- **Repositories**: Just as explained in the services
 
- Postgres table creation if not exist, PLPGSQL functions and triggers
 
- Other needed folders
 
Also, the database needs to be redesigned.