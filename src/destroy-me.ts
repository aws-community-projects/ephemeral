import { Aspects, Duration, Stack, Tags } from 'aws-cdk-lib';
import { SelfDestructAspect } from './self-destruct-aspect';
import { Construct } from 'constructs';

export interface DestroyMeConstructProps {
  readonly duration: Duration
}

export class DestroyMeConstruct extends Construct {
  constructor (scope: Construct, id: string, props: DestroyMeConstructProps = {
  } as DestroyMeConstructProps) {
    super(scope, id);

    const { duration } = props;
    Tags.of(Stack.of(this)).add('STACK_LIFE', duration.toSeconds().toString());

    Aspects.of(Stack.of(this)).add(new SelfDestructAspect());
  }
}
