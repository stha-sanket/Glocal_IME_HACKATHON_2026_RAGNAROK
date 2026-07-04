GET
/api/v2/account/balance
GET

Fetches the real-time available balance for the authenticated user's primary account, returning the amount in NPR along with currency details.
response

HTTP/1.1 200 OK
Content-Type: application/json

{
  "balance": Number,
  "currency": String
}

GET
/api/v2/account/details
GET

Provides essential account profile information for the authenticated user, including their ID, registered name, email address, assigned account number, and current card status.
response

HTTP/1.1 200 OK
Content-Type: application/json

{
  "id": String,
  "accountNumber": String,
  "name": String,
  "email": String,
  "isCardBlocked": Boolean
}

GET
/api/v2/account/statement
GET

Retrieve recent account statements
response

HTTP/1.1 200 OK
Content-Type: application/json

{
  "statements": [
    {
      "id": String,
      "date": Date,
      "amount": Number,
      "description": String
    }
  ]
}

POST
/api/v2/auth/login
POST

Authenticates a user using their email address and password. On success, securely sets a session token and returns basic user profile information.
request

POST /api/v2/auth/login
Content-Type: application/json

{
  "email": String,
  "password": String
}

response

HTTP/1.1 200 OK
Content-Type: application/json

{
  "message": String,
  "user": {
    "id": String,
    "name": String,
    "email": String,
    "accountNumber": String
  }
}

POST
/api/v2/auth/logout
POST

Logs the current user out by clearing their session cookie. Always succeeds, even if the session was already expired.
response

HTTP/1.1 200 OK
Content-Type: application/json

{
  "message": String
}

POST
/api/v2/auth/register
POST

Registers a new user into the banking system by securely hashing their password and generating a new, unique account number with a starting promotional balance.
request

POST /api/v2/auth/register
Content-Type: application/json

{
  "name": String,
  "email": String,
  "password": String,
  "accountNumber": String
}

response

HTTP/1.1 200 OK
Content-Type: application/json

{
  "message": String
}

POST
/api/v2/card/block
POST

Instantly blocks the authenticated user's debit/credit card to prevent unauthorized transactions. This action takes effect immediately and marks the card as suspended.
response

HTTP/1.1 200 OK
Content-Type: application/json

{
  "message": String
}

POST
/api/v2/card/unblock
POST

Restores functionality to a previously blocked debit/credit card for the authenticated user. Once unblocked, the card can be used for regular transactions immediately.
response

HTTP/1.1 200 OK
Content-Type: application/json

{
  "message": String
}

POST
/api/v2/complaint/create
POST

Registers a new customer support complaint or grievance. Requires a subject line and a detailed description, and returns a unique support ticket ID for future tracking.
request

POST /api/v2/complaint/create
Content-Type: application/json

{
  "subject": String,
  "description": String
}

response

HTTP/1.1 200 OK
Content-Type: application/json

{
  "message": String,
  "ticketId": String
}

POST
/api/v2/favourites/create
POST

Registers a new favourite (beneficiary) account for the authenticated user, identified by a nickname (e.g. 'Sanket dai') and account number. Favourite accounts are required before initiating a transfer to that account.
request

POST /api/v2/favourites/create
Content-Type: application/json

{
  "clientId": String,
  "nickname": String,
  "accountNumber": String
}

response

HTTP/1.1 200 OK
Content-Type: application/json

{
  "message": String,
  "favourite": {
    "id": String,
    "nickname": String,
    "accountNumber": String
  }
}

GET
/api/v2/favourites/list
GET

Lists the authenticated user's saved favourite (beneficiary) accounts.
response

HTTP/1.1 200 OK
Content-Type: application/json

{
  "favourites": [
    {
      "id": String,
      "nickname": String,
      "accountNumber": String
    }
  ]
}

GET
/api/v2/health
GET

Health check — returns server status and current timestamp.
response

HTTP/1.1 200 OK
Content-Type: application/json

{
  "status": String,
  "timestamp": Date
}

GET
/api/v2/loan/eligibility
GET

Evaluates the authenticated user's financial profile and current balance to determine their eligibility for a loan, returning their qualification status and the maximum pre-approved amount.
response

HTTP/1.1 200 OK
Content-Type: application/json

{
  "eligible": Boolean,
  "maxAmount": Number
}

POST
/api/v2/otp/send
POST

Triggers the dispatch of a One-Time Password (OTP) to the user's registered email for identity verification during sensitive operations.
request

POST /api/v2/otp/send
Content-Type: application/json

{
  "clientId": String
}

response

HTTP/1.1 200 OK
Content-Type: application/json

{
  "message": String
}

POST
/api/v2/otp/verify
POST

Validates a previously dispatched One-Time Password (OTP). Used as a standalone verification step or in conjunction with multi-factor authentication flows.
request

POST /api/v2/otp/verify
Content-Type: application/json

{
  "clientId": String,
  "otp": String
}

response

HTTP/1.1 200 OK
Content-Type: application/json

{
  "message": String,
  "verified": Boolean
}

POST
/api/v2/transfer/confirm
POST

Finalizes a pending fund transfer by verifying the One-Time Password (OTP) associated with the transaction reference ID. The funds are deducted upon successful verification.
request

POST /api/v2/transfer/confirm
Content-Type: application/json

{
  "transactionId": String,
  "otp": String
}

response

HTTP/1.1 200 OK
Content-Type: application/json

{
  "message": String,
  "transactionId": String
}

POST
/api/v2/transfer/initiate
POST

Initiates a fund transfer to a destination accountNumber. If that accountNumber matches one of the authenticated user's saved favourite accounts, its nickname is included in the response; otherwise the transfer proceeds as a plain account-number transfer.
request

POST /api/v2/transfer/initiate
Content-Type: application/json

{
  "clientId": String,
  "amount": Number,
  "accountNumber": String
}

response

HTTP/1.1 200 OK
Content-Type: application/json

{
  "message": String,
  "transactionId": String,
  "toAccount": String,
  "nickname": String
}

POST
/api/v2/voice/converse
POST

Entry point for the voice assistant pipeline. Forwards the user's transcribed text to the Data Layer, which performs language/intent classification, calls back into this server's tool endpoints to complete the request, and synthesizes a spoken reply. Returns the final reply text plus a base64-encoded WAV. Falls back to a placeholder response if the Data Layer is unreachable.
request

POST /api/v2/voice/converse
Content-Type: application/json

{
  "text": String
}

response

HTTP/1.1 200 OK
Content-Type: application/json

{
  "text": String,
  "audio": String
}