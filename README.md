## /dev/messages

> _Work in progress._

Dead Simple API to send and receive messages.

A Sunday morning project after watching [Patrick Collison talk about Stripe's origins](https://www.youtube.com/watch?v=qrDZhAxpKrQ).

The idea is to provide an abstraction like any other \*nix file-descriptor and you would send / receive messages over a transportation protocol (in this case HTTP, but could be extended to anything else).

### Things to note:

- There is _zero_ authentication or user-action checking (currently).
- Messages are stored in plain-text.
- Requires Asnyc/Await, but could be Babel'd to work for lower versions of Node.
- Uses a locally running instance of Postgres, but could be completely containerized in the future.
- There are probably quite a few hidden bugs in here.
- I've spent perhaps 2 hours on this, but plan to work on this as a side-project. Help is always welcome.

### Design Goals:

- Super fast way to poll and send messages.
- Ability to send messages on a schedule (message this person "Hello!" at 8AM Tomorrow)
- Like IRC in that anyone can setup an instance of the project and run their own messaging server.
- Only provide an API to authenticate users, handle messages (and message scheduling), and manage users.
- All other client abstractions (CLIs, UIs, etc.) should be deferred to a different project.
- Provide some form of end-user programmability, so users could submit their own rules, message scheduling logic, etc.

### Immediate TODOs:

- Timezones for messages. All schedule checking / message storage is done in UTC, but we should handle users sending messages in a different timezeon.
- Authentication / User Management (I would prefer not to use a third-party because that moves away from people being truly able to run their own messaging server).
- Containerization / Application Deployment
- Opt-in/out to message encryption at rest.
- Code clean up.
