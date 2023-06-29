import { StackProps, Duration, Stack } from 'aws-cdk-lib';
import { DestroyMeConstruct } from './destroy-me';
import { Construct } from 'constructs';

export interface DestroyMeStackProps extends StackProps {
  readonly destroyMeDuration?: Duration
  readonly destroyMeEnable?: boolean
}
export class DestroyMeStack extends Stack {
  constructor (
    scope: Construct,
    id: string,
    props: DestroyMeStackProps = {
    } as DestroyMeStackProps,
  ) {
    super(scope, id, props);
    const {
      destroyMeEnable: enable,
      destroyMeDuration: duration,
    } = props;

    if (enable) {
      new DestroyMeConstruct(this, 'DestroyMeConstruct', {
        duration: duration ?? Duration.days(7),
      });
    } else {
      console.log('DestroyMe: disabled');
    }
  }
}
