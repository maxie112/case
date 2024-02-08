import json
import boto3
import os

# Initialize DynamoDB client
dynamodb = boto3.resource('dynamodb')

def handler(event, context):
    table = dynamodb.Table(os.environ['TABLE_NAME'])
    response_messages = []

    # Process each message from the SQS batch
    for record in event['Records']:
        # Parse the message body (note: SQS message body is a string of the original message sent to SQS)
        body = json.loads(record['body'])

        # Insert a new item into the DynamoDB table
        table.put_item(Item=body)

        # Prepare a response message
        response_messages.append({
            'messageId': record['messageId'],
            'response': 'News item added'
        })

    # Return a batch response for logging or further processing
    return {
        'statusCode': 200,
        'body': json.dumps({'messages': response_messages}),
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'  # CORS header
        }
    }
