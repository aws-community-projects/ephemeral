import { App, Duration, Stack } from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';

import { DestroyMeConstruct } from '../src';
import { Code, Function, Runtime } from 'aws-cdk-lib/aws-lambda';

describe('DestroyMeConstruct', () => {
  test('Stack Tagged + Aspect', () => {
    const app = new App();
    const stack = new Stack(app, 'TestStack');
    new Function(stack, 'MyTestFunction', {
      handler: 'index.handler',
      code: Code.fromInline('exports.handler = async () => { return { statusCode: 200, body: "Hello World" }; };'),
      runtime: Runtime.NODEJS_18_X,
    });
    new DestroyMeConstruct(stack, 'MyTestConstruct', {
      duration: Duration.days(1),
    });
    const template = Template.fromStack(stack);

    expect(template).toMatchSnapshot();
  });
});
