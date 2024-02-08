import json
import boto3
import os

dynamodb = boto3.resource('dynamodb')

def handler(event, context):
    table = dynamodb.Table(os.environ['TABLE_NAME'])

    # Scan the table (you might want to implement pagination for production)
    response = table.scan()

    # Return the list of news items
    return {
        'statusCode': 200,
        'body': json.dumps(response.get('Items', [])),
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'  # CORS header
        }
    }
