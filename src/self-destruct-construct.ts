import { CallAwsService } from 'aws-cdk-lib/aws-stepfunctions-tasks';
import { Choice,
  Condition,
  Map,
  Pass,
  StateMachine,
  Succeed,
  Wait,
  WaitTime } from 'aws-cdk-lib/aws-stepfunctions';
import { Construct } from 'constructs';
import { Duration, Stack } from 'aws-cdk-lib';
import { AwsCustomResource,
  AwsCustomResourcePolicy,
  PhysicalResourceId } from 'aws-cdk-lib/custom-resources';

export interface SelfDestructConstructProps {
  readonly duration: Duration
}

export class SelfDestructConstruct extends Construct {
  constructor (scope: Construct, id: string, props: SelfDestructConstructProps = {
  } as SelfDestructConstructProps) {
    super(scope, id);

    const { duration } = props;

    const listExecutions = new CallAwsService(this, 'ListExecutions', {
      action: 'listExecutions',
      iamAction: 'states:ListExecutions',
      iamResources: ['*'],
      parameters: {
        'StateMachineArn.$': '$$.StateMachine.Id',
        StatusFilter: 'RUNNING',
      },
      service: 'sfn',
    });

    const executionsMap = new Map(this, 'ExecutionsMap', {
      inputPath: '$.Executions',
    });

    const stopExecution = new CallAwsService(this, 'StopExecution', {
      action: 'stopExecution',
      iamAction: 'states:StopExecution',
      iamResources: ['*'],
      parameters: {
        Cause: 'Superceded',
        'ExecutionArn.$': '$.ExecutionArn',
      },
      service: 'sfn',
    });

    executionsMap.iterator(
      new Choice(this, 'NotSelf?')
        .when(
          Condition.not(
            Condition.stringEqualsJsonPath('$.ExecutionArn', '$$.Execution.Id'),
          ),
          stopExecution,
        )
        .otherwise(new Pass(this, 'self')),
    );

    const wait = new Wait(this, 'Wait', {
      time: WaitTime.duration(duration),
    });
    const wasDelete = new Choice(this, 'WasDelete?')
      .when(
        Condition.stringEquals('$$.Execution.Input.Action', 'Delete'),
        new Succeed(this, 'DeleteSuccess'),
      )
      .otherwise(wait);

    const deleteStack = new CallAwsService(this, 'DeleteStack', {
      action: 'deleteStack',
      iamAction: 'cloudformation:DeleteStack',
      iamResources: ['*'],
      parameters: {
        'StackName.$': '$$.Execution.Input.StackName',
      },
      service: 'cloudformation',
    });

    const finished = new Succeed(this, 'Finished');

    listExecutions.next(executionsMap);
    executionsMap.next(wasDelete);
    wait.next(deleteStack);
    deleteStack.next(finished);

    const sm = new StateMachine(this, 'SelfDestructMachine', {
      definition: listExecutions,
    });

    new AwsCustomResource(this, 'SelfDestructCR', {
      onCreate: {
        action: 'startExecution',
        parameters: {
          input: JSON.stringify({
            Action: 'Create',
            StackArn: Stack.of(this).stackId,
            StackName: Stack.of(this).stackName,
          }),
          stateMachineArn: sm.stateMachineArn,
        },
        physicalResourceId: PhysicalResourceId.of('SelfDestructCR'),
        service: 'StepFunctions',
      },
      onDelete: {
        action: 'startExecution',
        parameters: {
          input: JSON.stringify({
            Action: 'Delete',
            StackArn: Stack.of(this).stackId,
            StackName: Stack.of(this).stackName,
          }),
          stateMachineArn: sm.stateMachineArn,
        },
        physicalResourceId: PhysicalResourceId.of('SelfDestructCR'),
        service: 'StepFunctions',
      },
      onUpdate: {
        action: 'startExecution',
        parameters: {
          input: JSON.stringify({
            Action: 'Update',
            Version: new Date().getTime().toString(),
            StackArn: Stack.of(this).stackId,
            StackName: Stack.of(this).stackName,
          }),
          stateMachineArn: sm.stateMachineArn,
        },
        physicalResourceId: PhysicalResourceId.of('SelfDestructCR'),
        service: 'StepFunctions',
      },
      policy: AwsCustomResourcePolicy.fromSdkCalls({
        resources: [sm.stateMachineArn],
      }),
    });
  }
}
