# Self-Destruct

## :warning: This construct is designed to delete your CDK Stack after a specified amount of time! **Use at your own risk!** :warning:

Blog Post: [Say Goodbye to Your CDK Stacks: A Guide to Self-Destruction](https://matt.martz.codes/say-goodbye-to-your-cdk-stacks-a-guide-to-self-destruction)

This project publishes an npm library that contains a CDK Stack and CDK Construct that will self-destruct the Stack at a defined interval since the last deployment.

![Example Step Function Flow](./self-destruct-step-function.avif)

The Step Function:
1. Lists the current running executions of itself
2. Stops old iterations
3. Waits for the specified duration
4. Deletes the stack after the "wait"

In the event that the CloudFormation stack was already being deleted, it will gracefully exit.

You can use this in your projects in two ways:

- Extending the Stack
- Using the Construct

## Extending the Stack

To build this into your stacks... you can simply extend the stack:

```typescript
export interface MyStackProps extends SelfDestructStackProps {};
export class MyStack extends SelfDestructStack {
  constructor(scope: Construct, id: string, props: MyProps) {
    super(scope, id, props);
  }
}
```

By default the self destruct construct is DISABLED.  You have to explicitly enable it by passing in the `selfDestructEnabled: true`.  You can also override the duration with the `selfDestructDuration` property.

## Installing the construct

If instead you want to install this into an existing stack, you can!

```typescript
export class MyStack {
  constructor(scope: Construct, id: string) {
    super(scope, id);
    new SelfDestructConstruct(this, 'SelfDestruct', {
      duration: Duration.days(7), // a duration is required
    });
  }
}
```
