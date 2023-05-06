import { App, Duration, Stack } from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';

import { SelfDestructConstruct } from '../src';

describe('SelfDestructConstruct', () => {
  test('State Machine Created', () => {
    const app = new App();
    const stack = new Stack(app, 'TestStack');
    new SelfDestructConstruct(stack, 'MyTestConstruct', {
      duration: Duration.days(1),
    });
    const template = Template.fromStack(stack);

    template.resourceCountIs('AWS::StepFunctions::StateMachine', 1);

    expect(template).toMatchSnapshot();
  });
});
