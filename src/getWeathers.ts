import { ScanCommand } from "@aws-sdk/lib-dynamodb";
import { docClient, json, tableName } from "./db";

// GET /weathers
// Scan reads the whole table and is capped at 1 MB per call, so this is only
// suitable for small tables (same trade-off the course makes).
export const lambdaHandler = async () => {
  try {
    const response = await docClient.send(new ScanCommand({ TableName: tableName() }));
    return json(200, response.Items ?? []);
  } catch (error) {
    console.error(error);
    return json(500, { message: "Unable to get weather" });
  }
};
