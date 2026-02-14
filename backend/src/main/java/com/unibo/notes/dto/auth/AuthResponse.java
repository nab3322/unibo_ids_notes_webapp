package com.unibo.notes.dto.auth;

public class AuthResponse {
    public String token;
    public String refreshToken;
    public String username;
    public String userId;
    public UserDto user;

    public AuthResponse(String token, String username, String email, Long userId) {
        this.token = token;
        this.refreshToken = token; // Per ora usa lo stesso token
        this.username = username;
        this.userId = userId != null ? userId.toString() : null;
        this.user = new UserDto(userId, username, email);
    }

    /**
     * DTO interno per l'oggetto user nested
     */
    public static class UserDto {
        public String id;
        public String username;
        public String email;
        public String createdAt;

        public UserDto(Long id, String username, String email) {
            this.id = id != null ? id.toString() : null;
            this.username = username;
            this.email = email;
            this.createdAt = java.time.Instant.now().toString();
        }
    }
}
