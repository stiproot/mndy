import pika

# Define the connection parameters (adjust the parameters as needed)
rabbitmq_host = 'localhost'
rabbitmq_port = 5672
rabbitmq_user = 'guest'
rabbitmq_password = 'guest'
queue_name = 'mndy-azdo-worker-MNDY_CMD_GATHER'

# Create a connection to RabbitMQ
credentials = pika.PlainCredentials(rabbitmq_user, rabbitmq_password)
parameters = pika.ConnectionParameters(host=rabbitmq_host, port=rabbitmq_port, credentials=credentials)
connection = pika.BlockingConnection(parameters)

# Create a channel
channel = connection.channel()

# Declare the queue (ensure the queue exists, otherwise you can create it)
channel.queue_declare(queue=queue_name, durable=True, auto_delete=True)

# Define a callback function to process messages
def callback(ch, method, properties, body):
    print(f"Received message: {body}")

    # Acknowledge the message
    ch.basic_ack(delivery_tag=method.delivery_tag)

# Set up a consumer on the channel
channel.basic_consume(queue=queue_name, on_message_callback=callback)

print(f"Waiting for messages in queue '{queue_name}'. To exit, press CTRL+C")

# Start consuming
try:
    channel.start_consuming()
except KeyboardInterrupt:
    print("Exiting...")
    channel.stop_consuming()

# Close the connection
connection.close()
