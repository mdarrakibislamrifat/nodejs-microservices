const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");

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
    res.status(201).json(task);
  } catch (err) {
    res.status(500).json({ message: err });
  }
});

app.listen(port, () => {
  console.log(`Task service running on port ${port}`);
});
