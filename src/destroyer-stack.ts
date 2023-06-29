import { Duration, RemovalPolicy, Stack, StackProps } from 'aws-cdk-lib';
import { AttributeType,
  BillingMode,
  StreamViewType,
  Table } from 'aws-cdk-lib/aws-dynamodb';
import { Construct } from 'constructs';
import { Runtime, StartingPosition } from 'aws-cdk-lib/aws-lambda';
import { DynamoEventSource } from 'aws-cdk-lib/aws-lambda-event-sources';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { PolicyStatement, Effect } from 'aws-cdk-lib/aws-iam';
import { Rule } from 'aws-cdk-lib/aws-events';
import { LambdaFunction, SnsTopic } from 'aws-cdk-lib/aws-events-targets';
import { Topic } from 'aws-cdk-lib/aws-sns';
import { existsSync } from 'fs';
import { join } from 'path';

export class DestroyerStack extends Stack {
  constructor (scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const tableName = 'destroyer';
    const table = new Table(this, tableName, {
      tableName,
      partitionKey: {
        name: 'pk',
        type: AttributeType.STRING,
      },
      billingMode: BillingMode.PAY_PER_REQUEST,
      removalPolicy: RemovalPolicy.DESTROY,
      timeToLiveAttribute: 'ttl',
      stream: StreamViewType.NEW_AND_OLD_IMAGES,
    });

    const local = existsSync(join(__dirname, 'destroyer-stack.fn-cloudformation.ts'));
    const cloudformationFn = new NodejsFunction(this, 'fn-cloudformation', {
      runtime: Runtime.NODEJS_18_X,
      memorySize: 1024,
      timeout: Duration.minutes(5),
      entry: join(__dirname, local ? 'destroyer-stack.fn-cloudformation.ts' : 'destroyer-stack.fn-cloudformation.js'),
      initialPolicy: [
        new PolicyStatement({
          effect: Effect.ALLOW,
          actions: [
            'cloudformation:Describe*',
            'cloudformation:Get*',
            'cloudformation:List*',
          ],
          resources: ['*'],
        }),
      ],
    });
    table.grantReadWriteData(cloudformationFn);
    cloudformationFn.addEnvironment('DESTROY_TABLE_NAME', table.tableName);
    new Rule(this, 'cloudformation-rule', {
      eventPattern: {
        source: ['aws.cloudformation'],
        detailType: ['CloudFormation Stack Status Change'],
      },
      targets: [new LambdaFunction(cloudformationFn)],
    });

    const destroyFn = new NodejsFunction(this, 'fn-destroyer', {
      runtime: Runtime.NODEJS_18_X,
      memorySize: 1024,
      timeout: Duration.minutes(5),
      entry: join(__dirname, local ? 'destroyer-stack.fn-destroyer.ts' : 'destroyer-stack.fn-destroyer.js'),
    });

    destroyFn.addEventSource(
      new DynamoEventSource(table, {
        startingPosition: StartingPosition.LATEST,
      }),
    );
    destroyFn.addToRolePolicy(
      new PolicyStatement({
        actions: ['cloudformation:DeleteStack'],
        resources: ['*'],
        effect: Effect.ALLOW,
      }),
    );

    const failTopic = new Topic(this, 'fail-topic');
    new Rule(this, 'delete-failed-rule', {
      eventPattern: {
        source: ['aws.cloudformation'],
        detailType: ['CloudFormation Stack Status Change'],
        detail: {
          resourceStatus: ['DELETE_FAILED'],
        },
      },
      targets: [new SnsTopic(failTopic)],
    });
  }
}
