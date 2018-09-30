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

const insertScheduledQuery =
  "INSERT INTO scheduled_messages(sender, recipient, delivery_time, message) VALUES ($1, $2, $3, $4) RETURNING *";

const findReadyMessagesQuery =
  "SELECT * FROM scheduled_messages where delivery_time < $1";

const findScheduledBySender =
  "SELECT * from scheduled_messages where sender = $1";

const findScheduledByRecipient =
  "SELECT * from scheduled_messages where recipient = $1";

const deleteScheduled =
  "DELETE FROM scheduled_messages where id = $1 RETURNING *";

const updateScheduledMessage =
  "UPDATE scheduled_messages set message = $2 where id = $1 RETURNING *";

app.post("/messages/:to", async (req, res) => {
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

app.post("/messages/scheduled/:to", async (req, res) => {
  console.log(req.body);
  if (req.body == null || req.body.message == null) {
    return res.status(400).json({
      message: "Give me a goddamn message first "
    });
  }

  const recipient = req.params.to;
  const { message, from, deliveryTime } = req.body;

  const queryValues = [from, recipient, deliveryTime, message];

  let dbResult;
  try {
    dbResult = await client.query(insertScheduledQuery, queryValues);
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

app.get("/messages/scheduled/from/:me", async (req, res) => {
  const { me } = req.params;

  const queryValues = [me];
  let dbResult;
  try {
    dbResult = await client.query(findScheduledBySender, queryValues);
  } catch (e) {
    console.error(e);
    return res.status(500).json({
      message:
        "Failed to retrieve scheduled messages. Please Retry. This was our bad."
    });
  }

  dbResult = dbResult.rows;
  res.json(dbResult);
});

app.get("/messages/scheduled/to/:other", async (req, res) => {
  const { other } = req.params;

  const queryValues = [other];
  let dbResult;
  try {
    dbResult = await client.query(findScheduledByRecipient, queryValues);
  } catch (e) {
    console.error(e);
    return res.status(500).json({
      message:
        "Failed to retrieve scheduled messages. Please Retry. This was our bad."
    });
  }

  dbResult = dbResult.rows;
  res.json(dbResult);
});

app.delete("/messages/scheduled/:id", async (req, res) => {
  const { id } = req.params;

  const queryValues = [id];

  let dbResult;
  try {
    dbResult = await client.query(deleteScheduled, queryValues);
  } catch (e) {
    console.error(e);
    res.status(500).json({
      message:
        "Failed to delete scheduled message. Please retry. This was our bad."
    });
  }

  dbResult = dbResult.rows;
  res.json(dbResult);
});

// TODO: Ability to Change Recipient and Sender as well
app.put("/messages/scheduled/:id", async (req, res) => {
  const { id } = req.params;
  const { newMessage } = req.body;
  if (!newMessage) {
    return res.status(400).json({
      message: "A new Message is required for an update"
    });
  }

  const queryValues = [id, newMessage];

  let dbResult;
  try {
    dbResult = await client.query(updateScheduledMessage, queryValues);
  } catch (e) {
    console.error(e);
    return res.status(500).json({
      message:
        "Failed to update scheduled message. Please try again. This was our bad."
    });
  }

  dbResult = dbResult.rows;
  res.json(dbResult);
});

app.listen(port, async () => {
  await client.connect();
  worker();
  console.log(`Listening on port ${port}`);
});

app.use((req, res, next) => {
  res.status(404).json({
    message: "Keep trying, bud"
  });
});

const artificialWait = (time = 1000) =>
  new Promise(resolve => setTimeout(() => resolve(), time));

const worker = async () => {
  console.log("Starting DB worker...");

  while (true) {
    await artificialWait(10000);
    const utcNow = new Date().toISOString();
    const queryValues = [utcNow];
    let dbResult;
    try {
      dbResult = await client.query(findReadyMessagesQuery, queryValues);
    } catch (e) {
      console.error(e);
      console.error(
        "Could not execute find ready messages. Waiting for next cycle..."
      );
      continue;
    }

    dbResult = dbResult.rows || [];
    for (let row of dbResult) {
      let newTimestamp = new Date().toISOString();
      const { id, sender, recipient, message } = row;
      const queryValues = [sender, recipient, newTimestamp, message];
      try {
        // TODO: May want a transaction so we can guarantee we deliver and remove scheduled
        await client.query(insertQuery, queryValues);
        await client.query(deleteScheduled, [id]);
      } catch (e) {
        cconsole.error(
          `Error Delivery Scheduled Message ${id}. Leaving in queue.`
        );
        continue;
      }

      console.log(`Delivered Scheduled Message ${id}`);
    }
  }
};
