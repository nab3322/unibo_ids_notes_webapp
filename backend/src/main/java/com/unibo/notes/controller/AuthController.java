package com.unibo.notes.controller;

import com.unibo.notes.dto.auth.AuthResponse;
import com.unibo.notes.dto.auth.LoginRequest;
import com.unibo.notes.dto.auth.RegisterRequest;
import com.unibo.notes.entity.User;
import com.unibo.notes.service.AuthService;
import com.unibo.notes.service.UserService;
import io.quarkus.security.Authenticated;
import io.smallrye.jwt.auth.principal.JWTCallerPrincipal;
import jakarta.inject.Inject;
import jakarta.validation.Valid;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.core.SecurityContext;

@Path("/auth")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class AuthController {

    @Inject
    AuthService authService;

    @Inject
    UserService userService;

    @POST
    @Path("/register")
    public Response register(@Valid RegisterRequest request) {
        AuthResponse response = authService.register(request);
        return Response.status(Response.Status.CREATED).entity(response).build();
    }

    @POST
    @Path("/login")
    public Response login(@Valid LoginRequest request) {
        AuthResponse response = authService.login(request);
        return Response.ok(response).build();
    }

    @POST
    @Path("/logout")
    public Response logout() {
        // Con JWT stateless, il logout è gestito lato client
        // Il server risponde OK e il client elimina il token
        return Response.ok().build();
    }

    @POST
    @Path("/refresh")
    @Authenticated
    public Response refreshToken(@Context SecurityContext securityContext) {
        try {
            Long userId = getUserId(securityContext);
            User user = userService.findById(userId);
            if (user == null) {
                return Response.status(Response.Status.UNAUTHORIZED)
                        .entity("{\"error\": \"User not found\"}")
                        .build();
            }
            // Genera nuovo token usando il metodo esistente in AuthService
            AuthResponse response = authService.refreshToken(user);
            return Response.ok(response).build();
        } catch (Exception e) {
            return Response.status(Response.Status.UNAUTHORIZED)
                    .entity("{\"error\": \"Invalid or expired token\"}")
                    .build();
        }
    }

    @GET
    @Path("/profile")
    @Authenticated
    public Response getProfile(@Context SecurityContext securityContext) {
        Long userId = getUserId(securityContext);
        User user = userService.findById(userId);
        return Response.ok(toUserDTO(user)).build();
    }

    @PUT
    @Path("/profile")
    @Authenticated
    public Response updateProfile(UpdateProfileRequest request,
                                  @Context SecurityContext securityContext) {
        if (request == null) {
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity("{\"error\": \"Request body is required\"}")
                    .build();
        }
        Long userId = getUserId(securityContext);
        User user = userService.findById(userId);

        // Aggiorna solo i campi modificabili
        if (request.name != null) {
            user.name = request.name.trim();
        }
        if (request.email != null && !request.email.trim().isEmpty()) {
            user.email = request.email.trim();
        }

        userService.update(user);
        return Response.ok(toUserDTO(user)).build();
    }

    @POST
    @Path("/change-password")
    @Authenticated
    public Response changePassword(ChangePasswordRequest request,
                                   @Context SecurityContext securityContext) {
        if (request == null || request.currentPassword == null || request.newPassword == null) {
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity("{\"error\": \"Current password and new password are required\"}")
                    .build();
        }
        Long userId = getUserId(securityContext);
        authService.changePassword(userId, request.currentPassword, request.newPassword);
        return Response.ok("{\"message\": \"Password changed successfully\"}").build();
    }

    private Long getUserId(SecurityContext securityContext) {
        if (securityContext.getUserPrincipal() == null) {
            throw new SecurityException("No authentication token");
        }
        JWTCallerPrincipal principal = (JWTCallerPrincipal) securityContext.getUserPrincipal();
        return Long.parseLong(principal.getSubject());
    }

    private UserDTO toUserDTO(User user) {
        UserDTO dto = new UserDTO();
        dto.id = user.id;
        dto.username = user.username;
        dto.email = user.email;
        dto.name = user.name;
        dto.createdAt = user.createdAt;
        return dto;
    }

    public static class UpdateProfileRequest {
        public String name;
        public String email;
        public Object preferences; // Accept any preferences object
    }

    public static class ChangePasswordRequest {
        public String currentPassword;
        public String newPassword;
    }

    public static class UserDTO {
        public Long id;
        public String username;
        public String email;
        public String name;
        public java.time.LocalDateTime createdAt;
    }
}