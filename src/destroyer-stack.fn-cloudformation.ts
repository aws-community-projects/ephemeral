import type { EventBridgeEvent } from 'aws-lambda';
import { CloudFormationClient,
  DescribeStacksCommand } from '@aws-sdk/client-cloudformation';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'; // ES6 import
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';

const marshallOptions = {
  // Whether to automatically convert empty strings, blobs, and sets to `null`.
  convertEmptyValues: false, // false, by default.
  // Whether to remove undefined values while marshalling.
  removeUndefinedValues: true, // false, by default.
  // Whether to convert typeof object to map attribute.
  convertClassInstanceToMap: true, // false, by default.
};

const unmarshallOptions = {
  // Whether to return numbers as a string instead of converting them to native JavaScript numbers.
  wrapNumbers: false, // false, by default.
};

const translateConfig = {
  marshallOptions,
  unmarshallOptions,
};

const client = new DynamoDBClient({
});
const ddbDocClient = DynamoDBDocumentClient.from(client, translateConfig);
const cf = new CloudFormationClient({
});

export const handler = async (
  event: EventBridgeEvent<string, any>,
): Promise<void> => {
  if (!process.env.DESTROY_TABLE_NAME) {
    return;
  }
  const StackName = event.detail['stack-id'];
  const describeCommand = new DescribeStacksCommand({
    StackName,
  });
  const stacks = await cf.send(describeCommand);

  const stack = stacks.Stacks?.[0];

  const stackLife = stack?.Tags?.find((tag) => tag.Key === 'STACK_LIFE')?.Value;
  if (stackLife) {
    try {
      await ddbDocClient.send(
        new PutCommand({
          TableName: process.env.DESTROY_TABLE_NAME,
          Item: {
            pk: stack.StackName,
            ttl: Math.ceil(new Date().getTime() / 1000 + Number(stackLife)),
          },
        }),
      );
    } catch (e) {
      console.log(e);
    }
  }
};
