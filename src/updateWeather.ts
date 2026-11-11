import { ConditionalCheckFailedException } from "@aws-sdk/client-dynamodb";
import { UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { docClient, json, parseWeatherBody, tableName } from "./db";

interface UpdateEvent {
  body?: string | null;
  pathParameters?: { id?: string } | null;
}

// PUT /weather/{id}  body: { weather, town }
export const lambdaHandler = async (event: UpdateEvent) => {
  const id = event.pathParameters?.id;
  const input = parseWeatherBody(event.body);
  if (!id || !input) {
    return json(400, { message: "id path parameter, weather and town are required" });
  }

  try {
    const response = await docClient.send(
      new UpdateCommand({
        TableName: tableName(),
        Key: { id },
        UpdateExpression: "set #weather = :weather, #town = :town",
        // Unlike the course version, do not silently create a new item.
        ConditionExpression: "attribute_exists(id)",
        ExpressionAttributeNames: { "#weather": "weather", "#town": "town" },
        ExpressionAttributeValues: { ":weather": input.weather, ":town": input.town },
        ReturnValues: "UPDATED_NEW",
      })
    );
    return json(200, response.Attributes);
  } catch (error) {
    if (error instanceof ConditionalCheckFailedException) {
      return json(404, { message: "Weather item not found" });
    }
    console.error(error);
    return json(500, { message: "Something went wrong" });
  }
};
