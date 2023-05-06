import { ExpectedResult, IntegTest } from '@aws-cdk/integ-tests-alpha';
import { App, ArnFormat, Stack } from 'aws-cdk-lib';
import { RequireApproval } from 'aws-cdk-lib/cloud-assembly-schema';

import { SelfDestructStack } from '../src';

const app = new App();
const stack = new SelfDestructStack(app, 'SelfDestructStack');

const integ = new IntegTest(app, 'Integ', {
  cdkCommandOptions: {
    deploy: {
      args: {
        json: true, requireApproval: RequireApproval.NEVER,
      },
    },
    destroy: {
      args: {
        force: true,
      },
    },
  },
  diffAssets: true,
  stackUpdateWorkflow: true,
  testCases: [stack],
});

const start = integ.assertions.awsApiCall('StepFunctions', 'startExecution', {
  stateMachineArn: Stack.of(stack).formatArn({
    arnFormat: ArnFormat.COLON_RESOURCE_NAME,
    resource: 'stateMachine',
    resourceName: 'SelfDestructMachine',
    service: 'states',
  }),
});

integ.assertions.awsApiCall('StepFunctions', 'describeExecution', {
  executionArn: start.getAttString('executionArn'),
}).expect(ExpectedResult.objectLike({
  status: 'SUCCEEDED',
})).waitForAssertions();
