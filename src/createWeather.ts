import { randomUUID } from "node:crypto";
import { PutCommand } from "@aws-sdk/lib-dynamodb";
import { docClient, json, parseWeatherBody, tableName } from "./db";

// POST /create-weather  body: { weather, town }
export const lambdaHandler = async (event: { body?: string | null }) => {
  const input = parseWeatherBody(event.body);
  if (!input) {
    return json(400, { message: "weather and town are required" });
  }

  try {
    const item = { id: randomUUID(), ...input };
    await docClient.send(new PutCommand({ TableName: tableName(), Item: item }));
    return json(200, { message: "Weather successfully created!", id: item.id });
  } catch (error) {
    console.error(error);
    return json(500, { message: "Failed to create weather item" });
  }
};
