package com.unibo.notes.controller;

import com.unibo.notes.dto.auth.LoginRequest;
import com.unibo.notes.dto.auth.RegisterRequest;
import com.unibo.notes.repository.UserRepository;
import io.quarkus.test.junit.QuarkusTest;
import io.restassured.http.ContentType;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.*;

@QuarkusTest
class AuthControllerTest {

    @Inject
    UserRepository userRepository;

    @BeforeEach
    @Transactional
    void setup() {
        // Pulisci database
        userRepository.deleteAll();
    }

    @Test
    void shouldRegisterNewUser() {
        RegisterRequest request = new RegisterRequest();
        request.username = "newuser";
        request.email = "newuser@example.com";
        request.password = "password123";

        given()
                .contentType(ContentType.JSON)
                .body(request)
                .when()
                .post("/api/auth/register")
                .then()
                .statusCode(201)
                .body("username", equalTo("newuser"))
                .body("user.email", equalTo("newuser@example.com"))
                .body("token", notNullValue())
                .body("refreshToken", notNullValue())
                .body("userId", notNullValue())
                .body("user.id", notNullValue());
    }
    @Test
    void shouldNotRegisterUserWithExistingUsername() {
        // Registra primo utente
        RegisterRequest request1 = new RegisterRequest();
        request1.username = "existinguser";
        request1.email = "user1@example.com";
        request1.password = "password123";

        given()
                .contentType(ContentType.JSON)
                .body(request1)
                .when()
                .post("/api/auth/register")
                .then()
                .statusCode(201);

        // Prova a registrare con lo stesso username
        RegisterRequest request2 = new RegisterRequest();
        request2.username = "existinguser";
        request2.email = "user2@example.com";
        request2.password = "password456";

        given()
                .contentType(ContentType.JSON)
                .body(request2)
                .when()
                .post("/api/auth/register")
                .then()
                .statusCode(409)
                .body("message", containsString("already exists"));
    }

    @Test
    void shouldNotRegisterUserWithExistingEmail() {
        // Registra primo utente
        RegisterRequest request1 = new RegisterRequest();
        request1.username = "user1";
        request1.email = "same@example.com";
        request1.password = "password123";

        given()
                .contentType(ContentType.JSON)
                .body(request1)
                .when()
                .post("/api/auth/register")
                .then()
                .statusCode(201);

        // Prova a registrare con la stessa email
        RegisterRequest request2 = new RegisterRequest();
        request2.username = "user2";
        request2.email = "same@example.com";
        request2.password = "password456";

        given()
                .contentType(ContentType.JSON)
                .body(request2)
                .when()
                .post("/api/auth/register")
                .then()
                .statusCode(409)
                .body("message", containsString("already exists"));
    }

    @Test
    void shouldNotRegisterUserWithShortPassword() {
        RegisterRequest request = new RegisterRequest();
        request.username = "testuser";
        request.email = "test@example.com";
        request.password = "12345"; // Solo 5 caratteri

        given()
                .contentType(ContentType.JSON)
                .body(request)
                .when()
                .post("/api/auth/register")
                .then()
                .statusCode(400)
                .body("message", containsString("6 characters"));
    }

    @Test
    void shouldLoginWithCorrectCredentials() {
        // Prima registra un utente
        RegisterRequest registerRequest = new RegisterRequest();
        registerRequest.username = "loginuser";
        registerRequest.email = "login@example.com";
        registerRequest.password = "password123";

        given()
                .contentType(ContentType.JSON)
                .body(registerRequest)
                .when()
                .post("/api/auth/register")
                .then()
                .statusCode(201);

        // Poi fai login
        LoginRequest loginRequest = new LoginRequest();
        loginRequest.username = "loginuser";
        loginRequest.password = "password123";

        given()
                .contentType(ContentType.JSON)
                .body(loginRequest)
                .when()
                .post("/api/auth/login")
                .then()
                .statusCode(200)
                .body("username", equalTo("loginuser"))
                .body("token", notNullValue())
                .body("refreshToken", notNullValue())
                .body("user", notNullValue());
    }

    @Test
    void shouldNotLoginWithWrongPassword() {
        // Registra utente
        RegisterRequest registerRequest = new RegisterRequest();
        registerRequest.username = "testuser";
        registerRequest.email = "test@example.com";
        registerRequest.password = "correctpassword";

        given()
                .contentType(ContentType.JSON)
                .body(registerRequest)
                .when()
                .post("/api/auth/register");

        // Prova login con password sbagliata
        LoginRequest loginRequest = new LoginRequest();
        loginRequest.username = "testuser";
        loginRequest.password = "wrongpassword";

        given()
                .contentType(ContentType.JSON)
                .body(loginRequest)
                .when()
                .post("/api/auth/login")
                .then()
                .statusCode(401)
                .body("message", containsString("Invalid"));
    }

    @Test
    void shouldNotLoginWithNonExistentUser() {
        LoginRequest loginRequest = new LoginRequest();
        loginRequest.username = "nonexistent";
        loginRequest.password = "password123";

        given()
                .contentType(ContentType.JSON)
                .body(loginRequest)
                .when()
                .post("/api/auth/login")
                .then()
                .statusCode(401)
                .body("message", containsString("Invalid"));
    }

    @Test
    void shouldNotRegisterWithEmptyUsername() {
        RegisterRequest request = new RegisterRequest();
        request.username = "";
        request.email = "test@example.com";
        request.password = "password123";

        given()
                .contentType(ContentType.JSON)
                .body(request)
                .when()
                .post("/api/auth/register")
                .then()
                .statusCode(400);
    }

    @Test
    void shouldNotLoginWithEmptyFields() {
        LoginRequest request = new LoginRequest();
        request.username = "";
        request.password = "";

        given()
                .contentType(ContentType.JSON)
                .body(request)
                .when()
                .post("/api/auth/login")
                .then()
                .statusCode(400);
    }
}