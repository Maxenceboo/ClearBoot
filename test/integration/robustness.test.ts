import request from "supertest";
import * as http from "http";
import {
  ClearBoot,
  Controller,
  Get,
  Post,
  Body,
  Injectable,
  inject,
} from "../../src/lib";
import {
  CONTROLLERS_REGISTRY,
  PROVIDERS_REGISTRY,
} from "../../src/lib/common/types";

describe("Robustness Tests", () => {
  afterEach(() => {
    // Clean up registries after each test
    CONTROLLERS_REGISTRY.length = 0;
    PROVIDERS_REGISTRY.length = 0;
  });

  describe("No Controllers Error", () => {
    test("throws error when no controllers registered", async () => {
      // Ensure registry is empty
      CONTROLLERS_REGISTRY.length = 0;

      await expect(async () => {
        await ClearBoot.create({ port: 0 });
      }).rejects.toThrow("No controllers registered");
    });
  });

  describe("Route Order Priority", () => {
    test("static routes match before dynamic routes", async () => {
      @Controller("/priority")
      class OrderController {
        @Get("/special") // Static route
        specialRoute() {
          return { route: "special" };
        }

        @Get("/:id") // Dynamic route
        genericRoute() {
          return { route: "generic" };
        }
      }

      const app = await ClearBoot.create({ port: 0 });

      try {
        const res = await request(app).get("/priority/special");
        expect(res.body.route).toBe("special");
      } finally {
        await new Promise((resolve) => app.close(resolve));
      }
    });

    test("dynamic parameter routes work correctly", async () => {
      @Controller("/priority")
      class OrderController {
        @Get("/:id")
        paramRoute() {
          return { route: "param" };
        }
      }

      const app = await ClearBoot.create({ port: 0 });

      try {
        const res = await request(app).get("/priority/123");
        expect(res.body.route).toBe("param");
      } finally {
        await new Promise((resolve) => app.close(resolve));
      }
    });
  });

  describe("DI Error Handling", () => {
    test("throws clear error for missing @Injectable", () => {
      class MissingService {
        getData() {
          return "data";
        }
      }

      expect(() => {
        inject(MissingService);
      }).toThrow("Service 'MissingService' not found");
    });

    test("properly injects registered services", () => {
      @Injectable()
      class RegisteredService {
        getValue() {
          return 42;
        }
      }

      // Manually register (normally done by ClearBoot.create)
      const instance = new RegisteredService();
      const { globalContainer } = require("../../src/lib/di/container");
      globalContainer.register(RegisteredService, instance);

      const resolved = inject(RegisteredService);
      expect(resolved.getValue()).toBe(42);
    });
  });

  describe("Multipart Edge Cases", () => {
    test("handles empty multipart request", async () => {
      @Controller("/upload")
      class UploadController {
        @Post("/test")
        handleUpload(@Body() body: any) {
          return { fields: body };
        }
      }

      const app = await ClearBoot.create({ port: 0 });

      try {
        const res = await request(app)
          .post("/upload/test")
          .set(
            "Content-Type",
            "multipart/form-data; boundary=----WebKitFormBoundary",
          )
          .send("------WebKitFormBoundary--");

        expect(res.status).toBe(200);
      } finally {
        await new Promise((resolve) => app.close(resolve));
      }
    });

    test("handles malformed boundary", async () => {
      @Controller("/upload")
      class UploadController {
        @Post("/test")
        handleUpload(@Body() body: any) {
          return { fields: body };
        }
      }

      const app = await ClearBoot.create({ port: 0 });

      try {
        const res = await request(app)
          .post("/upload/test")
          .set("Content-Type", "multipart/form-data; boundary=invalid")
          .send("not a valid multipart body");

        // Should not crash server
        expect(res.status).toBeLessThan(600);
      } finally {
        await new Promise((resolve) => app.close(resolve));
      }
    });

    test("handles very long field names", async () => {
      @Controller("/upload")
      class UploadController {
        @Post("/test")
        handleUpload(@Body() body: any) {
          return { fields: body };
        }
      }

      const app = await ClearBoot.create({ port: 0 });

      try {
        const longFieldName = "a".repeat(1000);
        const res = await request(app)
          .post("/upload/test")
          .field(longFieldName, "value");

        expect(res.status).toBe(200);
        expect(res.body.fields[longFieldName]).toBe("value");
      } finally {
        await new Promise((resolve) => app.close(resolve));
      }
    });

    test("handles special characters in field names", async () => {
      @Controller("/upload")
      class UploadController {
        @Post("/test")
        handleUpload(@Body() body: any) {
          return { fields: body };
        }
      }

      const app = await ClearBoot.create({ port: 0 });

      try {
        const res = await request(app)
          .post("/upload/test")
          .field("field[nested]", "value")
          .field("field.dotted", "value2");

        expect(res.status).toBe(200);
      } finally {
        await new Promise((resolve) => app.close(resolve));
      }
    });
  });

  describe("Overlapping Routes", () => {
    test("routes with parameters work correctly", async () => {
      @Controller("/overlap")
      class OverlapController {
        @Get("/users/:id")
        getUserById() {
          return { type: "param" };
        }
      }

      const app = await ClearBoot.create({ port: 0 });

      try {
        const res = await request(app).get("/overlap/users/123");
        expect(res.body.type).toBe("param");
      } finally {
        await new Promise((resolve) => app.close(resolve));
      }
    });

    test("routes with different paths work independently", async () => {
      @Controller("/overlap")
      class OverlapController {
        @Get("/users/:id")
        getUserById() {
          return { type: "user" };
        }

        @Get("/posts/:id")
        getPostById() {
          return { type: "post" };
        }
      }

      const app = await ClearBoot.create({ port: 0 });

      try {
        const res1 = await request(app).get("/overlap/users/123");
        expect(res1.body.type).toBe("user");

        const res2 = await request(app).get("/overlap/posts/456");
        expect(res2.body.type).toBe("post");
      } finally {
        await new Promise((resolve) => app.close(resolve));
      }
    });
  });
});
