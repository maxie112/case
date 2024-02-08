import json
import boto3
import os

dynamodb = boto3.resource('dynamodb')

def handler(event, context):
    table = dynamodb.Table(os.environ['TABLE_NAME'])
    body = json.loads(event['body'])

    # Insert a new item
    table.put_item(Item=body)

    return {
        'statusCode': 200,
        'body': json.dumps({'message': 'News item added'}),
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'  
        }
    }