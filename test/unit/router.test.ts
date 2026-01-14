import { matchPath } from "../../src/lib/router/path-matcher";

describe("UNIT - Path Matcher", () => {
  test("Doit matcher une route statique simple", () => {
    const result = matchPath("/users", "/users");
    expect(result).toEqual({}); // Match vide mais succès
  });

  test("Doit extraire un paramètre dynamique", () => {
    const result = matchPath("/users/:id", "/users/42");
    expect(result).toEqual({ id: "42" });
  });

  test("Doit échouer si le path est différent", () => {
    const result = matchPath("/users", "/items");
    expect(result).toBeNull();
  });

  test("Doit respecter la REGEX numérique (:id(\\d+))", () => {
    // Cas valide
    expect(matchPath("/items/:id(\\d+)", "/items/123")).toEqual({ id: "123" });

    // Cas invalide (lettres)
    expect(matchPath("/items/:id(\\d+)", "/items/abc")).toBeNull();
  });

  test("Doit respecter la REGEX alphabétique", () => {
    expect(matchPath("/files/:type([a-z]+)", "/files/img")).toEqual({
      type: "img",
    });
    expect(matchPath("/files/:type([a-z]+)", "/files/123")).toBeNull();
  });
});
