import { Duration, Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { SelfDestructConstruct } from './self-destruct-construct';

export interface SelfDestructStackProps extends StackProps {
  readonly selfDestructionDuration?: Duration
  readonly selfDestructionEnable?: boolean
}
export class SelfDestructStack extends Stack {
  constructor (
    scope: Construct,
    id: string,
    props: SelfDestructStackProps = {
    } as SelfDestructStackProps,
  ) {
    super(scope, id, props);
    const {
      selfDestructionEnable: enable,
      selfDestructionDuration: duration,
    } = props;

    if (enable) {
      new SelfDestructConstruct(this, 'SelfDestructConstruct', {
        duration: duration ?? Duration.days(7),
      });
    } else {
      console.log('SelfDestructStack: disabled');
    }
  }
}
