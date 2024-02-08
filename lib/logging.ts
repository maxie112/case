// logging.ts
import * as logs from 'aws-cdk-lib/aws-logs';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

export function createApiAccessLogGroup(scope: Construct, id: string): logs.LogGroup {
  return new logs.LogGroup(scope, id);
}

export function setupApiGatewayLogging(api: apigateway.RestApi, logGroup: logs.LogGroup, loggingRole: iam.Role) {
  logGroup.grantWrite(loggingRole);

  api.addGatewayResponse('Default4XX', {
    type: apigateway.ResponseType.DEFAULT_4XX,
    responseHeaders: {
      'Access-Control-Allow-Origin': "'*'",
      'Access-Control-Allow-Headers': "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,X-Amz-User-Agent'",
    },
    templates: {
      'application/json': '{"message":$context.error.messageString}'
    }
  });

  api.addGatewayResponse('Default5XX', {
    type: apigateway.ResponseType.DEFAULT_5XX,
    responseHeaders: {
      'Access-Control-Allow-Origin': "'*'",
      'Access-Control-Allow-Headers': "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,X-Amz-User-Agent'",
    },
    templates: {
      'application/json': '{"message":$context.error.messageString}'
    }
  });

  api.deploymentStage.accessLogSetting = {
    accessLogFormat: apigateway.AccessLogFormat.clf(),
    destinationArn: logGroup.logGroupArn
  };
  api.deploymentStage.accessLogDestination = new apigateway.LogGroupLogDestination(logGroup);
}
