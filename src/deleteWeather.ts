import { DeleteCommand } from "@aws-sdk/lib-dynamodb";
import { docClient, json, tableName } from "./db";

// DELETE /weather/{id}
export const lambdaHandler = async (event: {
  pathParameters?: { id?: string } | null;
}) => {
  const id = event.pathParameters?.id;
  if (!id) {
    return json(400, { message: "id path parameter is required" });
  }

  try {
    await docClient.send(new DeleteCommand({ TableName: tableName(), Key: { id } }));
    return json(200, { message: "Weather item deleted successfully" });
  } catch (error) {
    console.error(error);
    return json(500, { message: "Weather item not deleted successfully" });
  }
};
