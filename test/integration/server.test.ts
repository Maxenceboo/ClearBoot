import request from "supertest";
import * as http from "http";
import {
  ClearBoot,
  Controller,
  Get,
  Post,
  Body,
  Query,
  Param,
  HttpCode,
  Header,
  Validate,
  Injectable,
} from "../../src/lib";
import { IHeaderProvider } from "../../src/lib/common/interfaces";
import { z } from "zod";

// --- SETUP DU CONTROLEUR DE TEST ---
const UserSchema = z.object({ name: z.string() });

@Injectable()
class TestHeaderProvider implements IHeaderProvider {
  getHeaders() {
    return { "X-Test": "True" };
  }
}

@Controller("/test")
class TestController {
  @Get("/hello")
  hello() {
    return { msg: "world" };
  }

  @Get("/users/:id(\\d+)")
  getUser(@Param("id") id: string) {
    return { id: Number(id) };
  }

  @Post("/create")
  @HttpCode(201)
  @Validate(UserSchema)
  @Header(TestHeaderProvider)
  create(@Body() body: any) {
    return { created: body.name };
  }

  @Get("/search")
  search(@Query("q") query: string[]) {
    return { result: query };
  }
}

// --- SETUP DES TESTS ---
describe("INTEGRATION - ClearBoot Server", () => {
  let app: http.Server;

  beforeAll(async () => {
    // On crée l'app SANS écouter le port (mode test)
    app = await ClearBoot.create({});
  });

  afterAll((done) => {
    app.close(done);
  });

  test("GET /test/hello -> 200 OK", async () => {
    const res = await request(app).get("/test/hello");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ msg: "world" });
  });

  test("GET /test/users/123 -> Regex Match", async () => {
    const res = await request(app).get("/test/users/123");
    expect(res.body.id).toBe(123);
  });

  test("GET /test/users/abc -> Regex Mismatch (404)", async () => {
    const res = await request(app).get("/test/users/abc");
    expect(res.status).toBe(404);
  });

  test("POST /test/create -> Body + Code 201 + Header", async () => {
    const res = await request(app).post("/test/create").send({ name: "Max" });

    expect(res.status).toBe(201);
    expect(res.headers["x-test"]).toBe("True");
    expect(res.body).toEqual({ created: "Max" });
  });

  test("POST /test/create -> Validation Zod Error", async () => {
    const res = await request(app).post("/test/create").send({ wrong: 1 });
    expect(res.status).toBe(400); // Bad Request
  });

  test("GET /test/search -> Query Array", async () => {
    const res = await request(app).get("/test/search?q=a&q=b");
    expect(res.body.result).toEqual(["a", "b"]);
  });
});
