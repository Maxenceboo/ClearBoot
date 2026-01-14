import "reflect-metadata";
import * as http from "http";
import request from "supertest";
import { ClearBoot, Controller, Get, Post } from "../../src/lib";

let server: http.Server;

@Controller("/test")
class TestController {
  @Get("/hello")
  hello() {
    return { msg: "hello" };
  }

  @Post("/echo")
  echo() {
    return { echo: true };
  }
}

beforeAll(async () => {
  server = await ClearBoot.create({
    port: 0,
    globalMiddlewares: [],
  });
});

afterAll(async () => {
  server.close();
});

describe("INTEGRATION - Global & Controller Middlewares", () => {
  test("Route should return 200 OK", async () => {
    const res = await request(server).get("/test/hello");
    expect(res.status).toBe(200);
    expect(res.body.msg).toBe("hello");
  });

  test("POST route should work", async () => {
    const res = await request(server).post("/test/echo");
    expect(res.status).toBe(200);
    expect(res.body.echo).toBe(true);
  });
});
