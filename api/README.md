[![Moleculer](https://badgen.net/badge/Powered%20by/Moleculer/0e83cd)](https://moleculer.services)

# Henry-Bank
This is a [Moleculer](https://moleculer.services/)-based microservices project developed by "Soy Henry" students as a sample project of our capabilities.

## Configuration
You will need to set up a couple environment variables (.env) before trying to run the project:

```
MONGO_URI = "mongodb://ip:port/schema"

JWT_SECRET = "a_very_secret_token"

GMAIL_USER = "example@gmail.com"
GMAIL_PASSWORD = "examplepassword"
```

## Usage
Start the project with `npm run dev` command.

Remember that you have to activate insecure applications in your Gmail account in order to be able to send e-mails.

## Services
- **api**: API Gateway services
- **users**: Users service. Register, login, manage contacts, etc.
- **accounts**: Accounts service. Manages account money, allowing to send or receive money.
- **transactions**: Transactions service. Creates and lists transactions of an account.
- **contacts**: Contacts service. Add users as contacts, list them, etc.
- **tokens**: Tokens service. Generate tokens for password recovery, email verification, etc.
- **assets**: Assets service. File upload management.

## Mixins
- **db.mixin**: Database access mixin for services. Uses MongoDB adapter.

## Routes
```
POST    /api/users/register
POST    /api/users/login
POST    /api/users/complete
PUT     /api/users/update
POST    /api/users/verify/:token
POST    /api/users/forgot
POST    /api/users/reset/:token
GET     /api/users/me
GET     /api/users/contacts
POST    /api/users/contacts
PUT     /api/users/contacts
DELETE  /api/users/contacts
```
```
GET     /api/accounts/current
POST    /api/accounts/recharge
POST    /api/accounts/transfer
GET     /api/accounts/transactions
GET     /api/accounts/statistics
POST    /api/accounts/cvu
```

## Libraries
```
moleculer                       - Microservices framework
moleculer-web                   - Exposing the API
moleculer-db                    - Implementing a common set of DB actions & methods
moleculer-db-adapter-mongo      - Accesing a MongoDB database
bcrypt                          - Encrypting user passwords
dotenv                          - Easy project configuration
jsonwebtoken                    - Authorizing user requests
lodash                          - Easy solutions to certain tasks
nats                            - Remove service transporter
nodemailer                      - Email sender (GMAIL)
```

## Useful links

* Soy Henry: https://www.soyhenry.com/
* Moleculer: https://moleculer.services/
