import * as cdk from 'aws-cdk-lib/core';
import { Construct } from 'constructs';
import {
  CodePipeline,
  ShellStep,
  CodePipelineSource,
} from 'aws-cdk-lib/pipelines';
import { PipelineStage } from './pipeline-stage';

export class CiCdDeploymentPipelineStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const pipeline = new CodePipeline(this, 'Pipeline', {
      synth: new ShellStep('synth', {
        input: CodePipelineSource.gitHub(
          'Makane2024/CI-CD-deployment-pipeline',
          'main'
        ),
        commands: ['npm ci', 'npm run build', 'npx cdk synth'],
      }),
    });

    /*********************************
     * Add test stage
     *********************************/
    const devStage = pipeline.addStage(
      new PipelineStage(this, 'PipelineDevStage', {
        stageName: 'dev',
      })
    );

    const prodStage = pipeline.addStage(
      new PipelineStage(this, 'PipelineProdStage', {
        stageName: 'prod',
      })
    );
  }
}
