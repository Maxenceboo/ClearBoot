import request from "supertest";
import * as http from "http";
import { ClearBoot, Controller, Post, Body } from "../../src/lib/index";

// 1. On crée un contrôleur bidon pour recevoir les données
@Controller("/security-test")
class SecurityController {
  @Post("/")
  echo(@Body() body: any) {
    return { received: true, data: body };
  }
}

describe("INTEGRATION - Security & Body Parser", () => {
  let server: http.Server;

  beforeAll(async () => {
    // On démarre ClearBoot avec ce contrôleur
    server = await ClearBoot.create({ port: 0 });
  });

  afterAll((done) => {
    server.close(done);
  });

  // --- TEST 1 : JSON MAL FORMÉ ---
  test("Devrait rejeter un JSON mal formé avec 400 Bad Request", async () => {
    // On envoie une chaîne qui ressemble à du JSON mais qui est cassée
    const res = await request(server)
      .post("/security-test")
      .set("Content-Type", "application/json")
      .send('{ "name": "Hacke'); // Manque l'accolade et le guillemet

    expect(res.status).toBe(400);
    expect(res.body).toEqual({
      statusCode: 400,
      error: "Invalid JSON format",
      timestamp: expect.any(String),
    });
  });

  // --- TEST 2 : PAYLOAD TOO LARGE (> 1MB) ---
  test("Devrait couper la connexion (ECONNRESET) ou renvoyer 413 pour un Body > 1MB", async () => {
    const bigData = Buffer.alloc(1024 * 1024 + 100).toString("utf-8");

    try {
      const res = await request(server)
        .post("/security-test")
        .set("Content-Type", "application/json")
        .send({ data: bigData });

      // Si le serveur a le temps de répondre (rare sur les gros flux coupés), on veut 413
      expect(res.status).toBe(413);
    } catch (error: any) {
      // C'est le comportement attendu pour une protection DoS violente :
      // Le serveur coupe la socket (req.destroy())
      expect(error.code).toBe("ECONNRESET");
    }
  });

  // --- TEST 3 : JSON VALIDE ---
  test("Devrait accepter un JSON valide de taille normale", async () => {
    const res = await request(server)
      .post("/security-test")
      .send({ name: "Max" });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ received: true, data: { name: "Max" } });
  });
});
