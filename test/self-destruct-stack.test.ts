import { App, Duration } from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';

import { SelfDestructStack } from '../src';

describe('SelfDestructStack', () => {
  test('Disabled by Default', () => {
    const app = new App();
    const stack = new SelfDestructStack(app, 'MyTestStack');
    const template = Template.fromStack(stack);

    template.resourceCountIs('AWS::StepFunctions::StateMachine', 0);

    expect(template).toMatchSnapshot();
  });

  test('Disabled with no props', () => {
    const app = new App();
    const stack = new SelfDestructStack(app, 'MyTestStack', {
    });
    const template = Template.fromStack(stack);

    template.resourceCountIs('AWS::StepFunctions::StateMachine', 0);

    expect(template).toMatchSnapshot();
  });

  test('Enabled', () => {
    const app = new App();
    const stack = new SelfDestructStack(app, 'MyTestStack', {
      selfDestructionEnable: true,
    });
    const template = Template.fromStack(stack);

    template.resourceCountIs('AWS::StepFunctions::StateMachine', 1);

    expect(template).toMatchSnapshot();
  });

  test('Enabled w/Duration', () => {
    const app = new App();
    const stack = new SelfDestructStack(app, 'MyTestStack', {
      selfDestructionEnable: true,
      selfDestructionDuration: Duration.days(1),
    });
    const template = Template.fromStack(stack);

    template.resourceCountIs('AWS::StepFunctions::StateMachine', 1);

    expect(template).toMatchSnapshot();
  });
});
