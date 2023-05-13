import { IAspect, CfnResource, RemovalPolicy } from 'aws-cdk-lib';
import { Bucket, CfnBucket } from 'aws-cdk-lib/aws-s3';
import type { IConstruct } from 'constructs';

export class SelfDestructAspect implements IAspect {
  public visit (node: IConstruct): void {
    if (CfnResource.isCfnResource(node)) {
      node.applyRemovalPolicy(RemovalPolicy.DESTROY);
    }
    if (node instanceof Bucket) {
      if (!node.node.tryFindChild('AutoDeleteObjectsCustomResource')) {
        throw new Error('You are attempting to create a bucket with the Level 2 Bucket construct in an ephemeral stack without autoDeleteObjects enabled.');
      }
    } else if (node instanceof CfnBucket) {
      if (!node.node.scope?.node.tryFindChild('AutoDeleteObjectsCustomResource')) {
        throw new Error('You are attempting to create a bucket with the Level 1 CfnBucket construct in an ephemeral stack.');
      }
    }
  }
}
