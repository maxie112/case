// iam.ts
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

export function createApiGatewayLoggingRole(scope: Construct, id: string): iam.Role {
  const role = new iam.Role(scope, id, {
    assumedBy: new iam.ServicePrincipal('apigateway.amazonaws.com'),
  });

  return role;
}
// comment