import type { DynamoDBStreamEvent } from 'aws-lambda';
import { unmarshall } from '@aws-sdk/util-dynamodb';
import { AttributeValue } from '@aws-sdk/client-dynamodb';
import { CloudFormationClient, DeleteStackCommand } from '@aws-sdk/client-cloudformation';

export const handler = async (event: DynamoDBStreamEvent): Promise<void> => {
  const stacksToDestroy = event.Records.reduce<string[]>((p, record) => {
    if (record.eventName === 'REMOVE') {
      if (record.dynamodb?.OldImage) {
        const oldImage = record.dynamodb.OldImage as Record<
        string,
        AttributeValue
        >;
        const item = unmarshall(oldImage);
        const currentTimeInSeconds = new Date().getTime() / 1000;
        if (item.ttl > currentTimeInSeconds) {
          // item was manually removed and not expired
          console.log('item was manually removed and not expired', currentTimeInSeconds, item.ttl);
          return [...p];
        }
        return [...p, item.pk];
      }
    }
    return [...p];
  }, []);
  console.log(stacksToDestroy);
  if (stacksToDestroy.length > 0) {
    const client = new CloudFormationClient({
    });
    await Promise.all(
      stacksToDestroy.map(
        async (stackName) =>
          await client.send(
            new DeleteStackCommand({
              StackName: stackName,
            }),
          ),
      ),
    );
  }
};
