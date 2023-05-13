import { App, Duration, RemovalPolicy } from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';

import { SelfDestructStack } from '../src';
import { Bucket, CfnBucket } from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';

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

  test('Bucket in a construct with no autoDeleteObjects', () => {
    expect.assertions(1);
    class TestConstruct extends Construct {
      constructor (scope: Construct, id: string) {
        super(scope, id);

        new Bucket(this, 'Bucket', {
          removalPolicy: RemovalPolicy.DESTROY,
        });
      }
    }
    class TestSelfDestructStack extends SelfDestructStack {
      constructor (scope: App, id: string) {
        super(scope, id, {
          selfDestructionEnable: true,
        });

        new Bucket(this, 'Bucket', {
          autoDeleteObjects: true,
          removalPolicy: RemovalPolicy.DESTROY,
        });
        new TestConstruct(this, 'TestConstruct');
      }
    }
    try {
      const app = new App();
      const stack = new TestSelfDestructStack(app, 'MyTestStack');
      Template.fromStack(stack);
    } catch (e) {
      expect(e).toMatchSnapshot();
    }
  });

  test('CfnBucket', () => {
    expect.assertions(1);
    class TestSelfDestructStack extends SelfDestructStack {
      constructor (scope: App, id: string) {
        super(scope, id, {
          selfDestructionEnable: true,
        });

        new CfnBucket(this, 'Bucket');
      }
    }
    try {
      const app = new App();
      const stack = new TestSelfDestructStack(app, 'MyTestStack');
      Template.fromStack(stack);
    } catch (e) {
      expect(e).toMatchSnapshot();
    }
  });
});
