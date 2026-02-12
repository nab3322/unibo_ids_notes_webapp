package com.unibo.notes.controller;

import com.unibo.notes.dto.CreateNoteRequest;
import com.unibo.notes.dto.UpdateNoteRequest;
import com.unibo.notes.entity.User;
import com.unibo.notes.repository.NoteRepository;
import com.unibo.notes.repository.UserRepository;
import com.unibo.notes.util.JWTUtil;
import io.quarkus.test.junit.QuarkusTest;
import io.restassured.http.ContentType;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.*;

@QuarkusTest
class NoteControllerTest {

    @Inject
    NoteRepository noteRepository;

    @Inject
    UserRepository userRepository;

    @Inject
    JWTUtil jwtUtil;

    private String authToken;
    private User testUser;

    @BeforeEach
    @Transactional
    void setup() {
        // Pulisci database
        noteRepository.deleteAll();
        userRepository.deleteAll();

        // Crea utente di test
        testUser = new User();
        testUser.username = "testuser";
        testUser.email = "test@example.com";
        testUser.passwordHash = "hash";
        userRepository.persistAndFlush(testUser);

        // Genera token JWT
        authToken = jwtUtil.generateToken(testUser.id, testUser.username, 1);
    }

    @Test
    void shouldCreateNote() {
        CreateNoteRequest request = new CreateNoteRequest();
        request.title = "Test Note";
        request.content = "Test Content";

        String response = given()
                .header("Authorization", "Bearer " + authToken)  // ⬅️ CORRETTO
                .contentType(ContentType.JSON)
                .body(request)
                .when()
                .post("/api/notes")
                .then()
                .extract().body().asString();

        System.out.println("========== RESPONSE ==========");
        System.out.println(response);
        System.out.println("==============================");
    }

    @Test
    void shouldGetAllNotes() {
        given()
                .header("Authorization", "Bearer " + authToken)
                .when()
                .get("/api/notes")
                .then()
                .statusCode(200)
                .body("notes", instanceOf(java.util.List.class))
                .body("total", notNullValue());
    }

    @Test
    void shouldGetNoteById() {
        // Prima crea una nota
        CreateNoteRequest createRequest = new CreateNoteRequest();
        createRequest.title = "Note to Get";
        createRequest.content = "Content";

        Integer noteId = given()
                .header("Authorization", "Bearer " + authToken)
                .contentType(ContentType.JSON)
                .body(createRequest)
                .when()
                .post("/api/notes")
                .then()
                .statusCode(201)
                .extract().path("id");

        // Poi recuperala
        given()
                .header("Authorization", "Bearer " + authToken)
                .when()
                .get("/api/notes/" + noteId)
                .then()
                .statusCode(200)
                .body("title", equalTo("Note to Get"));
    }

    @Test
    void shouldUpdateNote() {
        // Crea nota
        CreateNoteRequest createRequest = new CreateNoteRequest();
        createRequest.title = "Original";
        createRequest.content = "Original content";

        Integer noteId = given()
                .header("Authorization", "Bearer " + authToken)
                .contentType(ContentType.JSON)
                .body(createRequest)
                .when()
                .post("/api/notes")
                .then()
                .statusCode(201)
                .extract().path("id");

        // Aggiorna nota
        UpdateNoteRequest updateRequest = new UpdateNoteRequest();
        updateRequest.title = "Updated";
        updateRequest.content = "Updated content";

        given()
                .header("Authorization", "Bearer " + authToken)
                .contentType(ContentType.JSON)
                .body(updateRequest)
                .when()
                .put("/api/notes/" + noteId)
                .then()
                .statusCode(200)
                .body("title", equalTo("Updated"))
                .body("content", equalTo("Updated content"));
    }

    @Test
    void shouldDeleteNote() {
        // Crea nota
        CreateNoteRequest createRequest = new CreateNoteRequest();
        createRequest.title = "To Delete";
        createRequest.content = "Content";

        Integer noteId = given()
                .header("Authorization", "Bearer " + authToken)
                .contentType(ContentType.JSON)
                .body(createRequest)
                .when()
                .post("/api/notes")
                .then()
                .statusCode(201)
                .extract().path("id");

        // Elimina nota
        given()
                .header("Authorization", "Bearer " + authToken)
                .when()
                .delete("/api/notes/" + noteId)
                .then()
                .statusCode(204);

        // Verifica che non esista più
        given()
                .header("Authorization", "Bearer " + authToken)
                .when()
                .get("/api/notes/" + noteId)
                .then()
                .statusCode(404);
    }

    @Test
    void shouldCopyNote() {
        // Crea nota originale
        CreateNoteRequest createRequest = new CreateNoteRequest();
        createRequest.title = "Original";
        createRequest.content = "Original content";

        Integer noteId = given()
                .header("Authorization", "Bearer " + authToken)
                .contentType(ContentType.JSON)
                .body(createRequest)
                .when()
                .post("/api/notes")
                .then()
                .statusCode(201)
                .extract().path("id");

        // Copia nota e verifica risposta
        String response = given()
                .header("Authorization", "Bearer " + authToken)
                .contentType(ContentType.JSON)  // importante per evitare 500
                .when()
                .post("/api/notes/" + noteId + "/copy")
                .then()
                .statusCode(201)
                .body("title", containsString("Copy"))
                .body("content", equalTo("Original content"))
                .extract().body().asString();

        // Log della risposta (opzionale)
        System.out.println("========== COPY RESPONSE ==========");
        System.out.println(response);
        System.out.println("==================================");
    }



    @Test
    void shouldSearchNotes() {
        // Crea alcune note
        CreateNoteRequest request1 = new CreateNoteRequest();
        request1.title = "Java Tutorial";
        request1.content = "Learning Java";

        CreateNoteRequest request2 = new CreateNoteRequest();
        request2.title = "Python Guide";
        request2.content = "Learning Python";

        given()
                .header("Authorization", "Bearer " + authToken)
                .contentType(ContentType.JSON)
                .body(request1)
                .when()
                .post("/api/notes");

        given()
                .header("Authorization", "Bearer " + authToken)
                .contentType(ContentType.JSON)
                .body(request2)
                .when()
                .post("/api/notes");

        // Cerca
        given()
                .header("Authorization", "Bearer " + authToken)
                .queryParam("q", "Java")
                .when()
                .get("/api/notes/search")
                .then()
                .statusCode(200)
                .body("notes.size()", greaterThan(0))
                .body("total", greaterThan(0));
    }

    @Test
    void shouldReturn401WhenNoAuthToken() {
        given()
                .when()
                .get("/api/notes")
                .then()
                .statusCode(401);
    }
}
