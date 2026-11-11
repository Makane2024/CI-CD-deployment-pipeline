import * as cdk from "aws-cdk-lib";
import { Template } from "aws-cdk-lib/assertions";
import * as LambdaStack from "../lib/lambda-stack";

test("DynamoDB Table Created", () => {
  const app = new cdk.App();
  // WHEN
  const stack = new LambdaStack.LambdaStack(app, "MyTestStack", {
    stageName: "Dev",
  });
  // THEN
  const template = Template.fromStack(stack);
  template.hasResource("AWS::DynamoDB::Table", {
    Properties: {
      TableName: "DevweatherApiTable",
    },
  });
});

test("ApiGatway RestApi Created", () => {
  const app = new cdk.App();
  // WHEN
  const stack = new LambdaStack.LambdaStack(app, "MyTestStack", {
    stageName: "Dev",
  });
  // THEN
  const template = Template.fromStack(stack);
  template.hasResource("AWS::ApiGateway::RestApi", {
    Properties: {
      Name: "Dev Weather Rest Api",
    },
  });
});

test("All five weather lambda functions exist", () => {
  const app = new cdk.App();
  const stack = new LambdaStack.LambdaStack(app, "MyTestStack", {
    stageName: "Dev",
  });
  const template = Template.fromStack(stack);
  for (const suffix of ["create", "update", "get", "delete", "list"]) {
    template.hasResourceProperties("AWS::Lambda::Function", {
      FunctionName: `Dev-cdk-typescript-${suffix}`,
    });
  }
});

test("API routes and methods are wired", () => {
  const app = new cdk.App();
  const stack = new LambdaStack.LambdaStack(app, "MyTestStack", {
    stageName: "Dev",
  });
  const template = Template.fromStack(stack);
  for (const httpMethod of ["POST", "GET", "PUT", "DELETE"]) {
    template.hasResourceProperties("AWS::ApiGateway::Method", {
      HttpMethod: httpMethod,
    });
  }
  template.hasResourceProperties("AWS::ApiGateway::Resource", {
    PathPart: "{id}",
  });
  template.hasResourceProperties("AWS::ApiGateway::Resource", {
    PathPart: "weathers",
  });
});

test("Create Lambda Function typescript Exist", () => {
  const app = new cdk.App();
  const stack = new LambdaStack.LambdaStack(app, "MyTestStack", {
    stageName: "Dev",
  });
  const template = Template.fromStack(stack);
  template.hasResource("AWS::Lambda::Function", {
    Properties: {
      FunctionName: "Dev-cdk-typescript-create",
    },
  });
});
