import pika
import json
import random
import time
import datetime

# time.sleep(20)
# connection = pika.BlockingConnection(pika.ConnectionParameters('rabbitmq'))
connection = pika.BlockingConnection(pika.ConnectionParameters('localhost'))
channel = connection.channel()

queueName = 'mndy-azdo-worker-MNDY_CMD_GATHER'
channel.queue_declare(queue=queueName, durable=True, auto_delete=True)
# proj_id = f"xo-tmp-{random.randint(0, 1000)}"
proj_id = f"xo-tmp-xyz"

evt = {
    "cmd_type": "GATHER_PROJECT_UNITS_OF_WORK",
    "cmd_data": {
        "ql": "SELECT [System.Id],[System.WorkItemType],[System.Title],[System.AssignedTo],[System.State],[System.Tags] FROM WorkItems WHERE [System.TeamProject] = 'Software' AND [System.Tags] CONTAINS 'project-xyz'"
    },
    "cmd_metadata": {
        "project_id": proj_id,
        "cmd_post_op": {
            "cmd_result_enrichment": {
                "prop_map": [
                    {
                        "key": "__metadata__",
                        "val": {
                            "project_id": proj_id
                        }
                    }
                ]
            }
        }
    }
}

channel.basic_publish(exchange='MNDY_CMD_GATHER', routing_key=queueName, body=json.dumps(evt))

time.sleep(100/1000)

connection.close()
