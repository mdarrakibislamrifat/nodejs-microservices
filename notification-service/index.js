const amqp = require("amqplib");

let channel, connection;

async function start() {
  try {
    connection = await amqp.connect("amqp://rabbitmq_node");

    channel = await connection.createChannel();
    await channel.assertQueue("task_created");
    console.log("Notification Service is listening to messages");
    channel.consume("task_created", (msg) => {
      const taskData = JSON.parse(msg.content.toString());
      console.log("Notification Service : Task Created", taskData.title);
      console.log("Notification Service : Task Created", taskData);
      channel.ack(msg);
    });
  } catch (err) {
    console.log("RabbitMq Connection Error : ", err.message);
  }
}

start();
