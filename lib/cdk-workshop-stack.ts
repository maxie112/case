import { Stack, StackProps } from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as s3 from 'aws-cdk-lib/aws-s3'
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';

// creds added
   // IAM
   function createLambdaRole(scope: Construct): iam.Role {
    const lambdaRole = new iam.Role(scope, 'LambdaExecutionRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
    });
  
    lambdaRole.addToPolicy(new iam.PolicyStatement({
      resources: ['*'],
      actions: ['dynamodb:*', 'logs:*', 'cloudwatch:*'],
    }));
  
    return lambdaRole;
  }

  // Creating Lambdas 
  function createLambdas(scope: Construct, table: dynamodb.Table) {
    const lambdaRole = createLambdaRole(scope);
    const layerArn = 'arn:aws:lambda:eu-west-1:323951801204:layer:SkyworkzLayer:1';
    const myLayer = lambda.LayerVersion.fromLayerVersionArn(scope, 'MyLayer', layerArn);
  
    // Lambda for GET /news
    const getNewsLambda = new lambda.Function(scope, 'GetNewsLambda', {
      runtime: lambda.Runtime.PYTHON_3_8,
      handler: 'get_news.handler',
      code: lambda.Code.fromAsset('./lambda'),
      role: lambdaRole,
      environment: {
        TABLE_NAME: table.tableName
      }
    });
  
    // Lambda for POST /newsitem
    const postNewsItemLambda = new lambda.Function(scope, 'PostNewsItemLambda', {
      runtime: lambda.Runtime.PYTHON_3_8,
      handler: 'post_newsitem.handler',
      code: lambda.Code.fromAsset('./lambda'), 
      role: lambdaRole,
      environment: {
        TABLE_NAME: table.tableName
      }
    });


  
    table.grantReadData(getNewsLambda);
    table.grantReadWriteData(postNewsItemLambda);
  
    return { getNewsLambda, postNewsItemLambda };
  }

  
  function createApiGateway(scope: Construct, lambdas: { getNewsLambda: lambda.Function, postNewsItemLambda: lambda.Function }) {
    const api = new apigateway.RestApi(scope, 'NewsApi', {
      restApiName: 'News Service',
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS, // Adjust as necessary for security
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: ['Content-Type', 'X-Amz-Date', 'Authorization', 'X-Api-Key'],
      },
      deployOptions: {
        stageName: 'prod',
      },
    });
  
    const news = api.root.addResource('news');
    const newsItem = api.root.addResource('newsitem');
  
    news.addMethod('GET', new apigateway.LambdaIntegration(lambdas.getNewsLambda));
    newsItem.addMethod('POST', new apigateway.LambdaIntegration(lambdas.postNewsItemLambda));
  }
  
      
      function createWebsiteHostingBucket(scope: Construct, bucketId: string): s3.Bucket {
        const siteBucket = new s3.Bucket(scope, bucketId, {
          websiteIndexDocument: 'index.html',
          websiteErrorDocument: 'error.html',
          publicReadAccess: true,
          blockPublicAccess: new s3.BlockPublicAccess({
            blockPublicAcls: false,
            blockPublicPolicy: false,
            ignorePublicAcls: false,
            restrictPublicBuckets: false,
          }),
          objectOwnership: s3.ObjectOwnership.OBJECT_WRITER,
          enforceSSL: true,
        });      
        return siteBucket;
      }
      

export class CdkWorkshopStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);
      // creating DynamoDB Table
      const table = new dynamodb.Table(this, 'NewsTable', {
        partitionKey: { name: 'title', type: dynamodb.AttributeType.STRING },
        sortKey: { name: 'date', type: dynamodb.AttributeType.STRING },
        billingMode: dynamodb.BillingMode.PAY_PER_REQUEST
      });
      // creating Lambdas and API Gateway
    const lambdas = createLambdas(this, table);
    const apiGateway = createApiGateway(this, lambdas);
    const siteBucket = createWebsiteHostingBucket(this, 'MyWebsiteBucket')
    new s3deploy.BucketDeployment(this, 'DeployWebsite', {
      sources: [s3deploy.Source.asset('./frontend_content')], 
      destinationBucket: siteBucket,
    });
  }
}