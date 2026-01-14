import "reflect-metadata";
import { Middleware } from "../../src/lib/decorators/middleware";
import { IMiddleware } from "../../src/lib/common/interfaces";

// Mock d'une classe Middleware valide
class MockMiddleware implements IMiddleware {
  use(req: any, res: any, next: () => void) {}
}

describe("UNIT - @Middleware Decorator", () => {
  test("should define metadata on a Controller (Class level)", () => {
    // On applique le décorateur manuellement
    @Middleware(MockMiddleware)
    class TestController {}

    // On lit les métadonnées
    const middlewares = Reflect.getMetadata("ctrl_middlewares", TestController);

    expect(middlewares).toBeDefined();
    expect(middlewares).toHaveLength(1);
    expect(middlewares[0]).toBe(MockMiddleware);
  });

  test("should define metadata on a Route (Method level)", () => {
    class TestController {
      @Middleware(MockMiddleware)
      testRoute() {}
    }

    const instance = new TestController();

    // On lit les métadonnées sur la méthode 'testRoute'
    const middlewares = Reflect.getMetadata(
      "route_middlewares",
      instance,
      "testRoute",
    );

    expect(middlewares).toBeDefined();
    expect(middlewares).toHaveLength(1);
    expect(middlewares[0]).toBe(MockMiddleware);
  });
});
