import { ConditionalCheckFailedException } from "@aws-sdk/client-dynamodb";
import { docClient } from "../src/db";
import { lambdaHandler as createWeather } from "../src/createWeather";
import { lambdaHandler as updateWeather } from "../src/updateWeather";
import { lambdaHandler as getWeather } from "../src/getWeather";
import { lambdaHandler as deleteWeather } from "../src/deleteWeather";
import { lambdaHandler as getWeathers } from "../src/getWeathers";

jest.mock("../src/db", () => ({
  ...jest.requireActual("../src/db"),
  docClient: { send: jest.fn() },
}));

const send = docClient.send as unknown as jest.Mock;
const body = JSON.stringify({ weather: "hot", town: "Douala" });

beforeEach(() => {
  process.env.TABLE_NAME = "TestTable";
  send.mockReset();
  jest.spyOn(console, "error").mockImplementation(() => undefined);
});

describe("create weather", () => {
  test("stores the item and returns 200", async () => {
    send.mockResolvedValue({});
    const result = await createWeather({ body });
    expect(result.statusCode).toBe(200);
    const command = send.mock.calls[0][0];
    expect(command.input.TableName).toBe("TestTable");
    expect(command.input.Item).toMatchObject({ weather: "hot", town: "Douala" });
    expect(typeof command.input.Item.id).toBe("string");
  });

  test("returns 400 when weather or town is missing", async () => {
    const result = await createWeather({ body: JSON.stringify({ town: "x" }) });
    expect(result.statusCode).toBe(400);
    expect(send).not.toHaveBeenCalled();
  });

  test("returns 500 when DynamoDB fails", async () => {
    send.mockRejectedValue(new Error("boom"));
    expect((await createWeather({ body })).statusCode).toBe(500);
  });
});

describe("update weather", () => {
  test("returns updated attributes", async () => {
    send.mockResolvedValue({ Attributes: { weather: "hot", town: "Douala" } });
    const result = await updateWeather({ body, pathParameters: { id: "1" } });
    expect(result.statusCode).toBe(200);
    expect(JSON.parse(result.body)).toEqual({ weather: "hot", town: "Douala" });
  });

  test("returns 404 when the item does not exist", async () => {
    send.mockRejectedValue(
      new ConditionalCheckFailedException({ message: "x", $metadata: {} })
    );
    const result = await updateWeather({ body, pathParameters: { id: "1" } });
    expect(result.statusCode).toBe(404);
  });

  test("returns 400 without an id", async () => {
    expect((await updateWeather({ body })).statusCode).toBe(400);
  });
});

describe("get weather", () => {
  test("returns the item", async () => {
    send.mockResolvedValue({ Item: { id: "1", weather: "hot", town: "Douala" } });
    const result = await getWeather({ pathParameters: { id: "1" } });
    expect(result.statusCode).toBe(200);
    expect(JSON.parse(result.body).id).toBe("1");
  });

  test("returns 404 when missing", async () => {
    send.mockResolvedValue({});
    expect((await getWeather({ pathParameters: { id: "1" } })).statusCode).toBe(404);
  });
});

describe("delete weather", () => {
  test("deletes the item", async () => {
    send.mockResolvedValue({});
    const result = await deleteWeather({ pathParameters: { id: "1" } });
    expect(result.statusCode).toBe(200);
    expect(send.mock.calls[0][0].input.Key).toEqual({ id: "1" });
  });

  test("returns 500 on failure", async () => {
    send.mockRejectedValue(new Error("boom"));
    expect((await deleteWeather({ pathParameters: { id: "1" } })).statusCode).toBe(500);
  });
});

describe("list weathers", () => {
  test("returns all items", async () => {
    send.mockResolvedValue({ Items: [{ id: "1" }, { id: "2" }] });
    const result = await getWeathers();
    expect(result.statusCode).toBe(200);
    expect(JSON.parse(result.body)).toHaveLength(2);
  });
});
