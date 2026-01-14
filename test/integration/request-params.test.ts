import "reflect-metadata";
import * as http from "http";
import request from "supertest";
import {
  ClearBoot,
  Controller,
  Get,
  Post,
  Body,
  Query,
  Param,
  Req,
  Res,
} from "../../src/lib";
import { ClearResponse } from "../../src/lib/http/response";

let server: http.Server;

@Controller("/params")
class ParamsController {
  @Get("/req-test")
  testReq(@Req() req: http.IncomingMessage) {
    return { method: req.method, hasUrl: !!req.url };
  }

  @Post("/res-test")
  testRes(@Res() res: ClearResponse, @Body() body: any) {
    res.statusCode = 201;
    res.json({ created: true, data: body });
  }

  @Post("/body-full")
  bodyFull(@Body() body: any) {
    return { received: body };
  }

  @Get("/query-all")
  queryAll(@Query() query: any) {
    return { query };
  }

  @Get("/users/:id")
  paramKey(@Param("id") id: string) {
    return { id };
  }

  @Post("/complex/:id")
  complex(
    @Param("id") id: string,
    @Query() query: any,
    @Body() body: any,
    @Req() req: http.IncomingMessage,
  ) {
    return { id, query, body, method: req.method };
  }
}

beforeAll(async () => {
  server = await ClearBoot.create({ port: 0 });
});

afterAll(async () => {
  server.close();
});

describe("INTEGRATION - Request Parameter Decorators", () => {
  test("@Req should inject the IncomingMessage", async () => {
    const res = await request(server).get("/params/req-test");
    expect(res.status).toBe(200);
    expect(res.body.method).toBe("GET");
    expect(res.body.hasUrl).toBe(true);
  });

  test("@Res should allow custom response handling", async () => {
    const res = await request(server)
      .post("/params/res-test")
      .send({ name: "Max" });
    expect(res.status).toBe(201);
    expect(res.body.created).toBe(true);
    expect(res.body.data.name).toBe("Max");
  });

  test("@Body should extract full body", async () => {
    const res = await request(server)
      .post("/params/body-full")
      .send({ name: "Alice", age: 25 });
    expect(res.body.received.name).toBe("Alice");
    expect(res.body.received.age).toBe(25);
  });

  test("@Query should extract all query params", async () => {
    const res = await request(server).get(
      "/params/query-all?filter=active&sort=desc",
    );
    expect(res.body.query.filter).toBe("active");
    expect(res.body.query.sort).toBe("desc");
  });

  test("@Param should extract path parameter", async () => {
    const res = await request(server).get("/params/users/42");
    expect(res.body.id).toBe("42");
  });

  test("Complex: @Param, @Query, @Body, @Req together", async () => {
    const res = await request(server)
      .post("/params/complex/123?type=test")
      .send({ data: "payload" });
    expect(res.body.id).toBe("123");
    expect(res.body.query.type).toBe("test");
    expect(res.body.body.data).toBe("payload");
    expect(res.body.method).toBe("POST");
  });
});
