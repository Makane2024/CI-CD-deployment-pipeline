import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

// Created outside the handlers so the client is reused across warm invocations.
export const docClient = DynamoDBDocumentClient.from(new DynamoDBClient({}));

export const tableName = (): string => {
  const name = process.env.TABLE_NAME;
  if (!name) {
    throw new Error("TABLE_NAME environment variable is not set");
  }
  return name;
};

export interface HttpResponse {
  statusCode: number;
  body: string;
}

export const json = (statusCode: number, payload: unknown): HttpResponse => ({
  statusCode,
  body: JSON.stringify(payload),
});

export const parseWeatherBody = (
  body?: string | null
): { weather: string; town: string } | null => {
  try {
    const { weather, town } = JSON.parse(body ?? "{}");
    return weather && town ? { weather, town } : null;
  } catch {
    return null;
  }
};
