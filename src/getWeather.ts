import { GetCommand } from "@aws-sdk/lib-dynamodb";
import { docClient, json, tableName } from "./db";

// GET /weather/{id}
export const lambdaHandler = async (event: {
  pathParameters?: { id?: string } | null;
}) => {
  const id = event.pathParameters?.id;
  if (!id) {
    return json(400, { message: "id path parameter is required" });
  }

  try {
    const response = await docClient.send(
      new GetCommand({ TableName: tableName(), Key: { id } })
    );
    if (!response.Item) {
      return json(404, { message: "Weather item not found" });
    }
    return json(200, response.Item);
  } catch (error) {
    console.error(error);
    return json(500, { message: "Error getting weather" });
  }
};
