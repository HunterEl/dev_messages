const express = require("express");
const bodyParser = require("body-parser");
const morgan = require("morgan");
const { Client } = require("pg");
const client = new Client({
  database: "dev",
  port: 5432
});

const app = express();
const port = 5005;

app.use(bodyParser.json());
app.use(morgan("tiny"));

const insertQuery =
  "INSERT INTO messages(sender, recipient, time, message) VALUES ($1, $2, $3, $4) RETURNING *";

// Add limit and page
const getReceivedQuery = "SELECT * from messages where recipient = $1";

// Add limit and page
const getSentQuery = "SELECT * from messages where sender = $1";

const getConversationQuery =
  "SELECT * from messages where (sender = $1 and recipient = $2) OR (sender = $2 and recipient = $1) ORDER BY time";

app.post("/send/:to", async (req, res) => {
  console.log(req.body);
  if (req.body == null || req.body.message == null) {
    return res.status(400).json({
      message: "Give me a goddamn message first "
    });
  }

  const recipient = req.params.to;
  const { message, from } = req.body;

  // TODO: timezones
  const timestamp = new Date().toISOString();

  console.log(`Sending message to ${recipient} from ${from} at ${timestamp}`);

  const queryValues = [from, recipient, timestamp, message];

  let dbResult;
  try {
    dbResult = await client.query(insertQuery, queryValues);
  } catch (e) {
    console.error(e);
    return res.status(500).json({
      message: "Failed to send message. Please retry. This was our bad"
    });
  }

  dbResult = dbResult.rows[0];

  res.json(dbResult);
});

app.get("/messages/received/:me", async (req, res) => {
  const { me } = req.params;

  const queryValues = [me];

  let dbResult;
  try {
    dbResult = await client.query(getReceivedQuery, queryValues);
  } catch (e) {
    console.error(e);
    return res.status(500).json({
      message: "Failed get received messages. Please retry. This was our bad"
    });
  }

  dbResult = dbResult.rows;

  res.json(dbResult);
});

app.get("/messages/sent/:me", async (req, res) => {
  const { me } = req.params;

  const queryValues = [me];

  let dbResult;
  try {
    dbResult = await client.query(getSentQuery, queryValues);
  } catch (e) {
    console.error(e);
    return res.status(500).json({
      message: "Failed get sent messages. Please retry. This was our bad"
    });
  }

  dbResult = dbResult.rows;

  res.json(dbResult);
});

app.get("/messages/conversation/:me/:other", async (req, res) => {
  const { me, other } = req.params;

  const queryValues = [me, other];

  let dbResult;
  try {
    dbResult = await client.query(getConversationQuery, queryValues);
  } catch (e) {
    console.error(e);
    return res.status(500).json({
      message: `Failed to get conversation between ${me} and ${other}. Please Retry. This was our bad.`
    });
  }

  dbResult = dbResult.rows;
  res.json(dbResult);
});

app.listen(port, async () => {
  await client.connect();
  console.log(`Listening on port ${port}`);
});

app.use((req, res, next) => {
  res.status(404).json({
    message: "Keep trying, bud"
  });
});
