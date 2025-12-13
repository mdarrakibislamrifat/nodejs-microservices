const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const amqp = require("amqplib");

const app = express();
const port = 3002;

app.use(bodyParser.json());

mongoose
  .connect("mongodb://mongo:27017/tasks")
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.log(err));

const taskSchema = new mongoose.Schema({
  title: String,
  description: String,
  userId: String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Task = mongoose.model("Task", taskSchema);

let channel, connection;
async function connectRabbitMQWithRetry(retries = 5, delay = 3000) {
  while (retries) {
    try {
      connection = await amqp.connect("amqp://rabbitmq_node");
      channel = await connection.createChannel();
      await channel.assertQueue("task_created");
      console.log("Connected to RabbitMQ");
    } catch (err) {
      console.log("RabbitMq Connection Error : ", err.message);
      retries--;
      console.log("Retrying Again : ", retries);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
}

app.get("/tasks", async (req, res) => {
  try {
    const tasks = await Task.find();
    res.status(200).json(tasks);
  } catch (err) {
    res.status(500).json({ message: err });
  }
});

app.post("/tasks", async (req, res) => {
  try {
    const task = new Task(req.body);
    await task.save();
    const message = {
      taskId: task._id,
      userId: task.userId,
      title: task.title,
    };
    if (!channel) {
      return res.status(500).json({ error: "RabbitMQ not connected" });
    }
    channel.sendToQueue("task_created", Buffer.from(JSON.stringify(message)));

    res.status(201).json(task);
  } catch (err) {
    res.status(500).json({ message: err });
  }
});

app.listen(port, () => {
  console.log(`Task service running on port ${port}`);
  connectRabbitMQWithRetry();
});
