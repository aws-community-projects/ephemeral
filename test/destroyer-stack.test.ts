import { App } from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';

import { DestroyerStack } from '../src';

describe('DestroyerStack', () => {
  test('default', () => {
    const app = new App();
    const stack = new DestroyerStack(app, 'MyTestStack');
    const template = Template.fromStack(stack);

    template.resourceCountIs('AWS::Lambda::Function', 2);
    template.resourceCountIs('AWS::DynamoDB::Table', 1);

    expect(template).toMatchSnapshot();
  });
});
