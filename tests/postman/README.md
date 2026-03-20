# Postman Tests

This folder contains a Postman setup for the FitShoes backend.

Files:
- `FitShoes.postman_collection.json`: main API collection
- `FitShoes.local.postman_environment.json`: local environment template

How to run:
1. Start the backend at `http://localhost:8081`.
2. Import both JSON files into Postman.
3. Select the `FitShoes Local` environment.
4. Run the collection from top to bottom.

Notes:
- `Register User` creates a unique email automatically on each run.
- `Verify OTP` is semi-manual. Paste the OTP from email or MongoDB into the `otpCode` collection variable before running that request.
- Admin routes use `x-admin-key`. The local environment defaults to `dev-admin-key`, which matches the current development fallback in the server.
- `Create ZaloPay Order - Invalid Payload` is meant as a validation test and should return `400`.
- `Get Logs` expects a log file such as `server/logs/http.log` to already exist.

Recommended flow:
1. Run `Smoke`.
2. Run `Auth`.
3. Fill `otpCode` if you want to continue the authenticated user flow.
4. Run `Profile`.
5. Run `Admin`.
6. Run `Payments`.
