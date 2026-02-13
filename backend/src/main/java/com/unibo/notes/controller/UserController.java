package com.unibo.notes.controller;

import com.unibo.notes.entity.User;
import com.unibo.notes.repository.UserRepository;
import io.quarkus.security.Authenticated;
import io.smallrye.jwt.auth.principal.JWTCallerPrincipal;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.core.SecurityContext;

import java.util.List;
import java.util.stream.Collectors;

@Path("/users")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@Authenticated
public class UserController {

    @Inject
    UserRepository userRepository;

    private Long getUserId(SecurityContext securityContext) {
        if (securityContext.getUserPrincipal() == null) {
            throw new SecurityException("No authentication token");
        }
        JWTCallerPrincipal principal = (JWTCallerPrincipal) securityContext.getUserPrincipal();
        return Long.parseLong(principal.getSubject());
    }

    @GET
    @Path("/search")
    public Response searchUsers(@QueryParam("q") String query,
                                @Context SecurityContext securityContext) {
        if (query == null || query.trim().length() < 2) {
            return Response.ok(List.of()).build();
        }

        Long currentUserId = getUserId(securityContext);
        List<User> users = userRepository.searchByUsername(query.trim(), currentUserId);

        List<UserDTO> result = users.stream()
                .map(this::toDTO)
                .collect(Collectors.toList());

        return Response.ok(result).build();
    }

    private UserDTO toDTO(User user) {
        UserDTO dto = new UserDTO();
        dto.id = user.id;
        dto.username = user.username;
        return dto;
    }

    public static class UserDTO {
        public Long id;
        public String username;
    }
}
