import { IAspect, CfnResource, RemovalPolicy } from 'aws-cdk-lib';
import { Bucket, CfnBucket } from 'aws-cdk-lib/aws-s3';
import type { IConstruct } from 'constructs';

const BucketCR = 'AutoDeleteObjectsCustomResource';
const ERR = 'in an ephemeral stack without autoDeleteObjects';
export class SelfDestructAspect implements IAspect {
  public visit (node: IConstruct): void {
    if (CfnResource.isCfnResource(node)) {
      node.applyRemovalPolicy(RemovalPolicy.DESTROY);
    }
    if (node instanceof Bucket) {
      if (!node.node.tryFindChild(BucketCR)) {
        throw new Error(`Level 2 Bucket ${ERR}`);
      }
    } else if (node instanceof CfnBucket) {
      if (!node.node.scope?.node.tryFindChild(BucketCR)) {
        throw new Error(`Level 1 CfnBucket ${ERR}`);
      }
    }
  }
}
