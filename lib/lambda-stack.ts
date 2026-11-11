import { Stack, StackProps } from "aws-cdk-lib";
import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as path from "path";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as nodejs from "aws-cdk-lib/aws-lambda-nodejs";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as apigw from "aws-cdk-lib/aws-apigateway";

interface LambdaStackProps extends StackProps {
  stageName: string;
}

export class LambdaStack extends Stack {
  constructor(scope: Construct, id: string, props: LambdaStackProps) {
    super(scope, id, props);

    const table: dynamodb.Table = new dynamodb.Table(
      this,
      `${props.stageName}WeatherApiTable`,
      {
        tableName: `${props.stageName}weatherApiTable`,
        partitionKey: { name: "id", type: dynamodb.AttributeType.STRING },
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }
    );

    const weatherApi: apigw.RestApi = new apigw.RestApi(
      this,
      `weather_rest_api`,
      {
        restApiName: `${props.stageName} Weather Rest Api`,
        description: "This service saves weather data.",
      } as apigw.RestApiProps
    );

    // Helper: one bundled TypeScript lambda per endpoint (esbuild bundles
    // src/<entry>.ts together with src/db.ts).
    const weatherFunction = (
      id: string,
      suffix: string,
      entry: string
    ): nodejs.NodejsFunction =>
      new nodejs.NodejsFunction(this, id, {
        functionName: `${props.stageName}-cdk-typescript-${suffix}`,
        runtime: lambda.Runtime.NODEJS_24_X,
        entry: path.join(__dirname, "..", "src", `${entry}.ts`),
        handler: "lambdaHandler",
        environment: {
          TABLE_NAME: table.tableName,
          STAGE_NAME: props.stageName,
        },
      });

    const createWeatherLambda = weatherFunction(
      "CreateWeatherLambdaFunction",
      "create",
      "createWeather"
    );
    const updateWeatherLambda = weatherFunction(
      "UpdateWeatherLambdaFunction",
      "update",
      "updateWeather"
    );
    const getWeatherLambda = weatherFunction(
      "GetWeatherLambdaFunction",
      "get",
      "getWeather"
    );
    const deleteWeatherLambda = weatherFunction(
      "DeleteWeatherLambdaFunction",
      "delete",
      "deleteWeather"
    );
    const getWeathersLambda = weatherFunction(
      "GetWeathersLambdaFunction",
      "list",
      "getWeathers"
    );

    // Least-privilege table access (replaces the SAM "Connectors").
    table.grantWriteData(createWeatherLambda);
    table.grantWriteData(updateWeatherLambda); // UpdateItem
    table.grantReadData(getWeatherLambda);
    table.grantWriteData(deleteWeatherLambda); // DeleteItem
    table.grantReadData(getWeathersLambda);

    // Routes
    // POST   /create-weather
    // GET    /weathers
    // GET    /weather/{id}
    // PUT    /weather/{id}
    // DELETE /weather/{id}
    weatherApi.root
      .addResource("create-weather")
      .addMethod("POST", new apigw.LambdaIntegration(createWeatherLambda));

    weatherApi.root
      .addResource("weathers")
      .addMethod("GET", new apigw.LambdaIntegration(getWeathersLambda));

    const weatherById = weatherApi.root
      .addResource("weather")
      .addResource("{id}");
    weatherById.addMethod("GET", new apigw.LambdaIntegration(getWeatherLambda));
    weatherById.addMethod("PUT", new apigw.LambdaIntegration(updateWeatherLambda));
    weatherById.addMethod(
      "DELETE",
      new apigw.LambdaIntegration(deleteWeatherLambda)
    );
  }
}
